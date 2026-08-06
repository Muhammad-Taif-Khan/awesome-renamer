import path from "node:path";
import { validateFileName } from ".";
import {
  AwesomeRename,
  AwesomeRenameBatch,
  AwesomeRenameFailedRename,
} from "./types/types";
import { renameWindowsStyle } from "./renameWindowsStyle";
import { applyRules } from "./rules/ruleRegistry";
import { rename } from "fs/promises";
import { runbatched } from "./utils/runBatched";

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

export const awesomeRename: AwesomeRename = async (
  oldFilePath,
  newFileName,
  options = { onInvalidChar: "escape", preserveExtension: true, rules: [] },
) => {
  //apply rules
  newFileName = applyRules(newFileName, options.rules);

  newFileName = validateFileName(newFileName, options?.onInvalidChar);

  if (path.basename(oldFilePath) === newFileName) {
    return { newName: newFileName, newPath: oldFilePath };
  }
  if ((options?.rules || []).find((rule) => rule.type === "windowsStyle")) {
    return renameWindowsStyle(oldFilePath, newFileName, options);
  }

  return renameFile(
    oldFilePath,
    newFileName,
    options.preserveExtension,
    options.dryRun,
  );
};;

export const awesomeRenameBatch: AwesomeRenameBatch = async (
  files,
  options,
) => {
  return await runbatched<
    | { newName: string; newPath: string; renamed: true }
    | AwesomeRenameFailedRename
  >(
    files.map((file) => async () => {
      try {
        return {
          ...(await awesomeRename(file.oldPath, file.newName, options)),
          renamed: true,
        };
      } catch (err) {
        return {
          error: (err as Error).message,
          renamed: false,
        };
      }
    }),
    options?.limit,
  );
};
