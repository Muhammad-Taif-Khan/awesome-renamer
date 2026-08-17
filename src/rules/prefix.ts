export function addPrefix(filename: string, prefix: string): string{
    if(prefix === undefined || prefix === null) return filename;
    return prefix + filename;
}