import { INVALID_WINDOWS_FILENAME_CHARS, WINDOWS_RESERVED_NAMES } from "./constants";
import { ValidateFileNameType } from "./types";

function isEmpty (str: string): boolean {
    return str.trim().length === 0;
}

function invalidCharsHandler(
  str: string,
  onInvalidChar: "escape" | "error" = "escape",
) {
  if (!onInvalidChar ||  onInvalidChar === "escape") {
    str = str.replace(INVALID_WINDOWS_FILENAME_CHARS, "");
    if (isEmpty(str)) {
      throw Error("File name cannot be empty");
    }
  } else if (onInvalidChar === "error") {
    throw Error(
      `Filename contains invalid chars: ${str.match(INVALID_WINDOWS_FILENAME_CHARS)}`,
    );
  }
  return str;
}


/**
 * Validates a filename against Windows reserved names and invalid characters.
 *
 * In `"escape"` mode (the default), invalid characters are removed. In
 * `"error"` mode, any invalid character causes an error. Empty names and
 * reserved device names always cause an error.
 *
 * @param filename - Filename only; not a path.
 * @param onInvalidChar - Whether to remove invalid characters or reject them.
 * @returns The original or sanitized filename.
 */
export const validateFileName: ValidateFileNameType = (filename, onInvalidChar = "escape")=>{
    if(!filename || typeof filename !== "string"){
        throw TypeError("filename must be a string, received: "+ typeof filename);
    }
    if(isEmpty(filename)){
        throw Error("File name cannot be empty")
    }

    if(WINDOWS_RESERVED_NAMES.has(filename.toUpperCase())){
        throw Error(`${filename} is a windows reserved name, you cannot use it`)
    }
    if(INVALID_WINDOWS_FILENAME_CHARS.test(filename)){
        filename = invalidCharsHandler(filename, onInvalidChar);
    }
    return filename;
}
