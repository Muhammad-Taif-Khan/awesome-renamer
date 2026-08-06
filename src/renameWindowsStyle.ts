import path from "path";
import { getduplicatedNameWithCounter } from "./conflict";
import { AwesomeRename, RenameFileSameAsWindowsOSType } from "./types/types";
import { rename, stat } from "fs/promises";
import { validateFileName } from "./validator";
import { renameFile } from "./rename";

/**\
 * This function rename the file name and insert a counter value calculated based off
 * of already existing files with same names and counter value.
 * @param  oldFilePath The file path to be renamed
 * @param  fileNewName The file path to be used as new name
 */
export const renameWindowsStyle: AwesomeRename = async (
  oldFilePath,
  newName,
  options
) => {
  const fileDir = path.dirname(oldFilePath);
  const preserveExtension = options?.preserveExtension !== false;
  const requestedName = preserveExtension
    ? `${newName}${path.extname(oldFilePath)}`
    : newName;
  const requestedPath = path.join(fileDir, requestedName);
  let newNameInfo;
  try {
    await stat(requestedPath);
    newNameInfo = await getduplicatedNameWithCounter(oldFilePath, requestedName);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        if((error as NodeJS.ErrnoException).code === "EPERM"){
            throw new Error(`Permission denied while renaming: ${path.basename(oldFilePath)}`)
        }
        if((error as NodeJS.ErrnoException).code === "EACCES"){
            throw new Error(`File ${path.basename(oldFilePath)} is being used by another program or you don't have the required permission.`)
        }
      throw error;
    }
  }

  const _newName = newNameInfo
    ? preserveExtension
      ? newNameInfo.basename
      : `${newNameInfo.basename}${newNameInfo.ext}`
    : newName;

  return renameFile(oldFilePath, _newName, options?.preserveExtension, options?.dryRun);
};

/**
 * Renames a file using Windows Explorer-style numbering.
 *
 * @deprecated This function will be removed in the next major release.
 * Use {@link awesomeRename} with the `windowsStyle` rule instead:
 *
 * ```ts
 * awesomeRename(oldFilePath, newName, {
 *   rules: [{ type: "windowsStyle" }]
 * });
 * ```
 *
 * This function automatically appends a Windows Explorer-style numeric suffix
 * (e.g. `(1)`, `(2)`, ...) when a file with the target name already exists.
 * The suffix is determined by scanning existing files with the same base name.
 *
 * @param oldFilePath - Absolute path of the file to rename.
 * @param fileNewName - The desired new file name (without the original path).
 */
export const renameFileSameAsWindowsOS: RenameFileSameAsWindowsOSType = async (
  oldFilePath,
  newName,
  renameOptions = { onInvalidChar: "escape", returnValue: "name"},
) => {
    // remove the windows style renaming rule cause it is already being applied here
  newName = validateFileName(newName, renameOptions?.onInvalidChar);

  if (path.basename(oldFilePath) === newName) {
    return newName;
  }

  const fileDir = path.dirname(oldFilePath);
  const requestedPath = path.join(fileDir, newName);

  let newNameInfo;
  try {
    await stat(requestedPath);
    newNameInfo = await getduplicatedNameWithCounter(oldFilePath, newName);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const _newName = newNameInfo
    ? `${newNameInfo.basename}${newNameInfo.ext}`
    : newName;

  const newNameAbsPath = path.join(path.dirname(oldFilePath), _newName);

  await rename(oldFilePath, newNameAbsPath);

  return renameOptions.returnValue === "absolutePath"
    ? newNameAbsPath
    : _newName;
};
