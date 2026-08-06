import { RenameRule } from "./rules";

type RenameReturnValue = "name" | "absolutePath";

export interface RenameOptions {
  /**
   * @default 'escape'
   */
  onInvalidChar?: "escape" | "error";
  /**
   * @default true
   */
  preserveExtension?: boolean;
  /**
   * @default false
   */
  dryRun?: boolean;
  /**
   * @default []
   */
  rules?: RenameRule[];
}
export interface WindowsStyleRenameOptions {
  onInvalidChar?: "escape" | "error";
  returnValue?: RenameReturnValue;
}

export type RenameFileSameAsWindowsOSType = (
  oldFilePath: string,
  FileNewname: string,
  optoins?: WindowsStyleRenameOptions,
) => Promise<string>;

export type AwesomeRename = (
  oldFilePath: string,
  FileNewname: string,
  options?: RenameOptions,
) => Promise<{newName: string; newPath: string}>;

export type AwesomeRenameFailedRename = {
  error: string;
  renamed: boolean;
}

 type AwesomeRenameBatchReturnType = {
  newName: string;
  newPath: string;
  renamed: boolean;
} | AwesomeRenameFailedRename;

export type AwesomeRenameBatch = (
  filesToRename: {oldPath:string; newName:string}[],
  options?: RenameOptions & {limit?:number},
) => Promise<AwesomeRenameBatchReturnType[]>;

export type ValidateFileNameType = (
  filename: string,
  onInvalidChar?: "error" | "escape",
) => string;
