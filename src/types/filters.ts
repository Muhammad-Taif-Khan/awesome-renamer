
/** Includes files whose extension matches one of the listed extensions. */
export interface FileTypesFilter {
  type: 'extension';
  extensions: `.${string}`[];
}

/** Matches a filename against optional case-insensitive text criteria. */
export interface FileNameFilter {
  type: 'filename';
  contains?: string[];
  startsWith?: string[];
  endsWith?: string[];
}

/** Includes files whose byte size falls within the inclusive range. */
export interface FileSizeFilter {
  type: 'size';
  min?: number;
  max?: number;
}

export type DatePrecision = 'millisecond' | 'second' | 'minute' | 'hour' | 'day';
/** Matches a creation or modification timestamp within an inclusive range. */
export interface FileTimestampFilter<T extends 'dateCreated' | 'dateModified'> {
  type: T;
  from?: Date | string | number;
  to?: Date | string | number;
  /**
   * How precise you want the datetime comparison to be, by default the comparison precision will be upto millisecond
   * @default millisecond
   */
  precision?: DatePrecision;
}

export type FileCreatedAtFilter = FileTimestampFilter<'dateCreated'>;
export type FileModifiedAtFilter = FileTimestampFilter<'dateModified'>;

/** A filter used by {@link awesomeRenameBatch}; every supplied filter must match. */
export type Filter =
  FileTypesFilter | FileNameFilter | FileSizeFilter | FileCreatedAtFilter | FileModifiedAtFilter;
