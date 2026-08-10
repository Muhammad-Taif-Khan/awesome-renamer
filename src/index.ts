/** Validates or sanitizes a filename using Windows filename restrictions. */
export { validateFileName } from "./validator";
/** Renames one item, or a collection of items, using optional rules and filters. */
export { awesomeRename, awesomeRenameBatch } from "./rename";
/** @deprecated Use `awesomeRename` with the `windowsStyle` rule. */
export { renameFileSameAsWindowsOS } from "./renameWindowsStyle";
/** Registry containing the built-in rename rules and any registered custom rules. */
export { registry } from "./rules/ruleRegistry";

export type {
  AwesomeRename,
  AwesomeRenameBatch,
  AwesomeRenameBatchReturnType,
  AwesomeRenameFailedRename,
  AwesomeRenameReturnValue,
  FileMetadata,
  Filter,
  RenameOptions,
  ValidateFileNameType,
  RenameFileSameAsWindowsOSType,
  RenameRule,
  ShouldRename,
  WindowsStyleRenameOptions,
} from "./types";
