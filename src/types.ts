type RenameReturnValue = "name" | "absolutePath";
interface RenameOptions {
  onInvalidChar?: "escape" | "error";
  returnValue?: RenameReturnValue;
}
export type RenameFileSameAsWindowsOSType = (
  oldFilePath: string,
  FileNewname: string,
  optoins?: RenameOptions,
) => Promise<string>;

export type ValidateFileNameType = (
  filename: string,
  onInvalidChar?: "error" | "escape",
) => string;
