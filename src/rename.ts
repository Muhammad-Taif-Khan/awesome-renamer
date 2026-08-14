import path from "node:path";
import { validateFileName } from ".";
import {
  AwesomeRename,
  AwesomeRenameBatch,
  AwesomeRenameFailedRename,
} from "./types";
import { renameWindowsStyle } from "./renameWindowsStyle";
import { applyRules } from "./rules/ruleRegistry";
import { rename } from "fs/promises";
import { runbatched } from "./utils/runBatched";
import { applyFilters } from "./filters";
import { fileMetadataFromPath } from "./utils/file-metadata";

/**
 * Renames an item without applying validation, rules, or collision handling.
 *
 * This low-level helper is used internally. Prefer {@link awesomeRename} for
 * application code.
 */
export async function renameFile(
  oldFilePath: string,
  newName: string,
  preserveExtension: boolean = true,
  dryRun: boolean = false,
) {
  const originalExt = path.extname(oldFilePath);

  if (preserveExtension) newName += originalExt;

  const newAbsPath = path.join(path.dirname(oldFilePath), newName);
  if (dryRun) {
    return {
      newName,
      newPath: newAbsPath,
    };
  }
  await rename(oldFilePath, newAbsPath);
  return {
    newName,
    newPath: newAbsPath,
  };
}

/**
 * Renames a single file or directory.
 *
 * Rules run in their supplied order, then the requested name is validated. By
 * default the source extension is appended to the processed name. Add the
 * `windowsStyle` rule to resolve an occupied destination with ` (2)`, ` (3)`,
 * and subsequent suffixes.
 *
 * @param oldFilePath - Path to the existing file or directory.
 * @param newFileName - Requested destination filename before rules are applied.
 * @param options - Rename, validation, rule, and dry-run options.
 * @returns Source and destination metadata. With `dryRun`, the filesystem is
 * not modified.
 * @throws {Error} If the filename is invalid or the filesystem operation fails.
 */
export const awesomeRename: AwesomeRename = async (
  oldFilePath,
  newFileName,
  options = { onInvalidChar: "escape", preserveExtension: true, rules: [] },
) => {
  const fileContext = {
    originalPath: oldFilePath,
    originalName: path.basename(oldFilePath),
    originalExtension: path.extname(oldFilePath),
  };
  //apply rules
  newFileName = applyRules(newFileName, options.rules);

  newFileName = validateFileName(newFileName, options?.onInvalidChar);

  if (path.basename(oldFilePath) === newFileName) {
    return {
      ...fileContext,
      newName: newFileName,
      newPath: oldFilePath,
      newExtension: path.extname(newFileName),
    };
  }

  if ((options?.rules || []).find((rule) => rule.type === "windowsStyle")) {
    return renameWindowsStyle(oldFilePath, newFileName, options);
  }
  const fileNewContext = await renameFile(
    oldFilePath,
    newFileName,
    options.preserveExtension,
    options.dryRun,
  );

  return {
    ...fileContext,
    ...fileNewContext,
    newExtension: path.extname(fileNewContext.newName),
  };
};

/**
 * Renames eligible items from a collection with bounded concurrency.
 *
 * All configured filters must match. When `shouldRename` is supplied, it runs
 * only for items that passed the filters. Items excluded by either mechanism
 * are omitted from the result. Processed items remain in input order; failures
 * are returned as `{ error, renamed: false }` and do not stop later items.
 *
 * @param files - Source paths and requested names to process.
 * @param options - Shared rename options plus batch `limit`, `filters`, and
 * `shouldRename` settings.
 */
export const awesomeRenameBatch: AwesomeRenameBatch = async (
  files,
  options,
) => {
  const filteredByPaths = options?.filters?.length
    ? new Set(
        await applyFilters({
          files: files.map((file) => file.oldPath),
          filters: options.filters,
        }),
      )
    : undefined;

  const shouldRenamePaths = options?.shouldRename
    ? new Set(
        (
          await runbatched(
            files.map((file) => async () => {
              if (filteredByPaths && !filteredByPaths.has(file.oldPath)) {
                return null;
              }
              const metadata = await fileMetadataFromPath(file.oldPath);
              const shouldRename = await options.shouldRename!(metadata);
              return shouldRename ? file.oldPath : null;
            }),
            30,
          )
        ).filter((filePath): filePath is string => filePath !== null),
      )
    : filteredByPaths;

  const filesToProcess = shouldRenamePaths
    ? files.filter((file) => shouldRenamePaths.has(file.oldPath))
    : files;

  return await runbatched<
    | (Awaited<ReturnType<AwesomeRename>> & { renamed: true })
    | AwesomeRenameFailedRename
  >(
    filesToProcess.map((file) => async () => {
      try {
        return {
          ...(await awesomeRename(file.oldPath, file.newName, options)),
          renamed: true,
        };
      } catch (err) {
        return {
          error: (err as Error).message,
          originalName: path.basename(file.oldPath),
          originalExtension: path.extname(file.oldPath),
          originalPath: file.oldPath,
          renamed: false,
        };
      }
    }),
    options?.limit,
  );
};
