import { FileNameFilter } from "../types";

export function filenameFilter (filename: string, filter: FileNameFilter): boolean {
    const name = filename.toLowerCase();
    // Narrow to FileNameFilter which contains the name-based criteria
    const fnFilter = (filter || {}) as FileNameFilter;
    const contains = fnFilter.contains ?? [];
    const startsWith = fnFilter.startsWith ?? [];
    const endsWith = fnFilter.endsWith ?? [];

    const matchContains =
      contains.length === 0 || contains.some((criteria) => name.includes(criteria.toLowerCase()));
    const matchStartsWith =
      startsWith.length === 0 ||
      startsWith.some((criteria) => name.startsWith(criteria.toLowerCase()));
    const matchEndsWith =
      endsWith.length === 0 || endsWith.some((criteria) => name.endsWith(criteria.toLowerCase()));

    return matchContains && matchStartsWith && matchEndsWith;
  }