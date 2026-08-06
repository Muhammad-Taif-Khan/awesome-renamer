import path from "path"
import { readdir } from "fs/promises";


/**
 * This function returns the number between the parentheses , The index of the search at which the result was found.
 *  and the the counter pattern match.
 * @example from a string "xyz (2)" it will return {index:4, value:"2", matched: "(2)"}
 * @param {String} inputString
 * @returns {{index: number| undefined, value: string|undefined, matched:string|undefined}}
 */
function getCounterBetweenParentheses(inputString: string): {
    index: number | undefined;
    value: string | undefined;
    matched: string | undefined;
} {
  const match = inputString.match(/\((\d+)\)/);
  const value = match ? match[1] : undefined;
  const matched = match ? match[0] : undefined;
  return {
    index: match?.index,
    value,
    matched
  };
}

const putCounterInString = (str: string, defaultCounterValue: number = 2): string => {
  const extractedCounter = getCounterBetweenParentheses(str);
  const newCounter = extractedCounter.value
    ? Number(extractedCounter.value) + 1
    : defaultCounterValue;
  let newStrWithCounter = (extractedCounter.value && extractedCounter.matched)
    ? str.replace(extractedCounter.matched, `(${newCounter})`)
    : `${str} (${newCounter})`;
  return newStrWithCounter;
};

/**
 * This function is used to calculate the counter value for a given filename based off of already
 * existing same name counter values in the file system.
 * @example `if "xyz.ext" file already exists in the same directory and the user want to rename another file to the same name
 * then the counter value for the new name will be "xyz (2).ext" (2). But if there is already a
 * same name in the same directory with counter value = 2 then the counter value will be xyz (3).ext which is 3.
 * and so on.`
 *
 * @param  filePath The absolute path to the file to be renamed.
 * @param  fileNewName The new name of the file to be used as new name.
 */
export const getduplicatedNameWithCounter = async (
  filePath: string,
  fileNewName: string,
): Promise<{ ext: string; basename: string }> => {
  const fileAbsPath = path.dirname(filePath);
  const directroryItems = await readdir(fileAbsPath);
  const ext = path.extname(fileNewName) || path.extname(filePath);

  //get the basename of the file new name
  const fileNewBasename = path.basename(fileNewName, ext);
  let newBaseNameWithCounter = putCounterInString(fileNewBasename);

  //now check if the there is already any other file with same name and counter
  //then increase the counter until there is no more files with the same name and counter
  while (directroryItems?.includes(newBaseNameWithCounter + ext)) {
    newBaseNameWithCounter = putCounterInString(newBaseNameWithCounter);
  }
  return {
    ext,
    basename: newBaseNameWithCounter,
  };
};
