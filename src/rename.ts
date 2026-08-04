import path from "path";
import { getduplicatedNameWithCounter } from "./conflict";
import { RenameFileSameAsWindowsOSType } from "./types";
import { validateFileName } from "./validator";
import { rename, stat } from "fs/promises";

/**\
 * This function rename the file name and insert a counter value calculated based off
 * of already existing files with same names and counter value.
 * @param  oldFilePath The file path to be renamed
 * @param  fileNewName The file path to be used as new name
 */
export const renameFileSameAsWindowsOS: RenameFileSameAsWindowsOSType = async (
  oldFilePath,
  newName,
  renameOptions = { onInvalidChar: "escape", returnValue: "name" },
) => {
  newName = validateFileName(newName, renameOptions.onInvalidChar);
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
