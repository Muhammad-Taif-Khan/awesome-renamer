import { stat } from "fs/promises";
import path from "path";
import { FileMetadata } from "../types";

export async function fileMetadataFromPath(oldPath: string): Promise<FileMetadata> {
  const fileStats = await stat(oldPath);
  return {
    name: path.basename(oldPath),
    path: oldPath,
    size: fileStats.size,
    lastModified: fileStats.mtime,
    createdAt: fileStats.birthtime,
  };
}