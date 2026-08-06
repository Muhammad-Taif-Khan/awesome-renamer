import path from "path";

export function getFileNameContext(filename: string){
const ext = path.extname(filename);
    return {name: path.basename(filename, ext), ext}
}
