import { getFileNameContext } from "../utils/filenameContext";

export function addSuffix(filename: string, suffix: string): string{
    if(suffix === undefined || suffix === null) return filename;
    const ctx = getFileNameContext(filename);
    return  ctx.name + suffix + ctx.ext;
}