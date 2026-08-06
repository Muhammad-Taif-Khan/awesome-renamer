import { getFileNameContext } from "../utils/filenameContext"

export function replace(filename:string, search: string, replace: string): string{
    const ctx = getFileNameContext(filename);
    return ctx.name.replaceAll(search, replace) + ctx.ext;
}