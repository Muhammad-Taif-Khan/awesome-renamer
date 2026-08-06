import { getFileNameContext } from "../utils/filenameContext";

export function toUpperCase(filename: string){
    const ctx = getFileNameContext(filename);
    return ctx.name.toUpperCase() + ctx.ext;
}
export function toLowerCase(filename:string){
    const ctx = getFileNameContext(filename);
    return ctx.name.toLowerCase() + ctx.ext;
}

export function capitalize(filename: string){
    const ctx = getFileNameContext(filename);
    return ctx.name.charAt(0).toUpperCase() + ctx.name.substring(1).toLowerCase() + ctx.ext;
}
/**
 * Thit function convert a file name to title case
 * @example 'hello world.txt' will be converted to 'Hello World.txt'  
 */
export function toTitleCase(filename: string): string{
    const ctx = getFileNameContext(filename);
    const name  = ctx.name;
    return name.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0)
    .toUpperCase() + 
    word.substring(1))
    .join(' ') + ctx.ext;
}
