import { Filter } from "./filters";
import { RenameRule } from "./rules";
export * from "./filters";
export type { RenameRule } from "./rules";

/** Filesystem metadata passed to batch selection callbacks. */
export interface FileMetadata {
  lastModified: Date | string;
  createdAt: Date | string;
  size: number;
  name: string;
  path: string;
}

type RenameReturnValue = "name" | "absolutePath";

/** Options shared by single-item and batch renames. */
export interface RenameOptions {
  /** Remove invalid characters or throw instead. @defaultValue `'escape'` */
  onInvalidChar?: "escape" | "error";
  /** Append the source extension after rules run. @defaultValue `true` */
  preserveExtension?: boolean;
  /** Return the planned result without renaming the source. @defaultValue `false` */
  dryRun?: boolean;
  /** Transformations applied, in order, before validation. @defaultValue `[]` */
  rules?: RenameRule[];
}
/** Options accepted by the deprecated Windows-style compatibility helper. */
export interface WindowsStyleRenameOptions {
  onInvalidChar?: "escape" | "error";
  returnValue?: RenameReturnValue;
}

export type RenameFileSameAsWindowsOSType = (
  oldFilePath: string,
  FileNewname: string,
  optoins?: WindowsStyleRenameOptions,
) => Promise<string>;

/** Metadata returned by a successful {@link AwesomeRename} operation. */
export type AwesomeRenameReturnValue = {
      originalPath: string;
      originalName: string;
      originalExtension: string;
      newName: string;
      newPath: string
      newExtension: string;
}
/** Function signature for {@link awesomeRename}. */
export type AwesomeRename = (
  oldFilePath: string,
  FileNewname: string,
  options?: RenameOptions,
) => Promise<AwesomeRenameReturnValue>;

/** A batch item that could not be renamed. */
export type AwesomeRenameFailedRename = {
  error: string;
  renamed: boolean;
  originalPath: string;
  originalName: string;
  originalExtension: string;
};

/** Result for one item processed by {@link awesomeRenameBatch}. */
export interface AwesomeRenameSuccessReturn extends AwesomeRenameReturnValue {
  renamed: boolean;
}

export type AwesomeRenameBatchReturnType =
  | AwesomeRenameSuccessReturn
  | AwesomeRenameFailedRename;

/** Predicate used to decide whether an eligible batch item should be renamed. */
export type ShouldRename = (
  file: FileMetadata,
) => boolean | Promise<boolean>;

/** Function signature for {@link awesomeRenameBatch}. */
export type AwesomeRenameBatch = (
  filesToRename: {oldPath:string; newName:string}[],
  options?: RenameOptions & {limit?:number; filters?: Filter[]; shouldRename?: ShouldRename},
) => Promise<AwesomeRenameBatchReturnType[]>;

/** Function signature for {@link validateFileName}. */
export type ValidateFileNameType = (
  filename: string,
  onInvalidChar?: "error" | "escape",
) => string;
