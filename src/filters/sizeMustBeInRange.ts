import { FileSizeFilter } from "../types";
import { isNumber } from "../utils/extra";

export function sizeMustBeInRange(fileSize: number, filter: FileSizeFilter): boolean  {
    const minSize = filter.min;
    const maxSize = filter.max;

    if (!isNumber(minSize) && !isNumber(maxSize)) {
      return true;
    }
    if (isNumber(minSize) && !isNumber(maxSize)) {
      return fileSize >= minSize!;
    }
    if (isNumber(maxSize) && !isNumber(minSize)) {
      return fileSize <= maxSize!;
    }
    if (minSize === maxSize) {
      return fileSize === maxSize;
    }
    return fileSize >= minSize! && fileSize <= maxSize!;
  }