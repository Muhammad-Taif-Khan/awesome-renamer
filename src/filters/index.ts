import {
  FileCreatedAtFilter,
  FileMetadata,
  FileModifiedAtFilter,
  FileTypesFilter,
  Filter,
} from "../types";
import { runbatched } from "../utils/runBatched";

import { dateMustBeInRange } from "./dateMustBeInRange";
import { filenameFilter } from "./filename";
import { sizeMustBeInRange } from "./sizeMustBeInRange";
import { fileMetadataFromPath } from "../utils/file-metadata";

const renameFilters = {
  filename: filenameFilter,
  extension: (filename: string, filter: FileTypesFilter) => {
    const extensions = filter.extensions || [];
    return (
      extensions.length === 0 ||
      extensions.some((criteria) =>
        filename.toLowerCase().endsWith(criteria.toLowerCase()),
      )
    );
  },
  size: sizeMustBeInRange,
  dateCreated: (
    createdAt: Date | string | number,
    filter: FileCreatedAtFilter,
  ): boolean => {
    return dateMustBeInRange(createdAt, filter);
  },
  dateModified: (
    lastModified: Date | string | number,
    filter: FileModifiedAtFilter,
  ): boolean => {
    return dateMustBeInRange(lastModified, filter);
  },
};

function matchFilter(file: FileMetadata, filter: Filter): boolean {
  switch (filter.type) {
    case "dateCreated":
      return renameFilters.dateCreated(file.createdAt, filter);
    case "dateModified":
      return renameFilters.dateModified(file.lastModified, filter);
    case "extension":
      return renameFilters.extension(file.name, filter);
    case "filename":
      return renameFilters.filename(file.name, filter);
    case "size":
      return renameFilters.size(file.size, filter);
  }
}



export async function applyFilters({
  files,
  filters = [],
}: {
  files:  (string | FileMetadata)[];
  filters?: Filter[];
}): Promise<(string | FileMetadata)[]> {
 
  if (filters.length === 0) return files;

  const results = await runbatched(
    files.map((file) => async () => {
      let fileMetadata = file;
      if (typeof file === "string") {
        fileMetadata = await fileMetadataFromPath(file);
      }
      const eligible = filters.every((filter) => matchFilter(fileMetadata as FileMetadata, filter));
      return eligible ? file : null;
    }),
    30,
  );
  return results.filter((file): file is string | FileMetadata => file !== null);
}
