# awesome-renamer
> Rename files and folders exactly like Windows Explorer.

[![npm version](https://img.shields.io/npm/v/awesome-renamer)](https://www.npmjs.com/package/awesome-renamer)
[![npm downloads](https://img.shields.io/npm/dm/awesome-renamer)](https://www.npmjs.com/package/awesome-renamer)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

`awesome-renamer` provides the same filename conflict resolution used by Windows Explorer. It automatically generates names such as `file (2).txt`, `file (3).txt`, and so on, while validating filenames against Windows filename rules.

## Features

- Rename files and directories asynchronously.
- Uses Windows Explorer-style duplicate naming (`file (2).txt`, `file (3).txt`, ...).
- Avoids filename collisions within the same directory.
- Removes invalid Windows filename characters or reports them as errors.
- Rejects empty names and Windows reserved names such as `CON`, `AUX`, and `NUL`.
- Includes TypeScript declarations.
- Supports both ESM and CommonJS.

## Installation

```bash
npm install awesome-renamer
```

## Quick start

```ts
import { awesomeRename } from "awesome-renamer";

const { newName, newPath } = await awesomeRename(
  "C:/documents/draft.txt",
  "report",
);

console.log(newName); // "report.txt"
console.log(newPath); // "C:\\documents\\report.txt" on Windows
```

By default, `awesomeRename` preserves the source extension and returns the final filename and destination path.

## Usage

### Rename a file

```ts
import { renameFileSameAsWindowsOS } from "awesome-renamer";

const finalName = await renameFileSameAsWindowsOS(
  "C:/uploads/photo.jpg",
  "holiday.jpg",
);

console.log(finalName); // "holiday.jpg"
```

If `holiday.jpg` already exists, the package automatically uses `holiday (2).jpg`. If that also exists, it tries `holiday (3).jpg` and continues increasing the counter until an available name is found.

### Return the absolute path

Set `returnValue` to `"absolutePath"` when you need the full destination path instead of only its filename:

```ts
import { renameFileSameAsWindowsOS } from "awesome-renamer";

const finalPath = await renameFileSameAsWindowsOS(
  "C:/uploads/photo.jpg",
  "holiday.jpg",
  { returnValue: "absolutePath" },
);

console.log(finalPath); // "C:\\uploads\\holiday.jpg" on Windows
```

### Rename a directory

```ts
import { renameFileSameAsWindowsOS } from "awesome-renamer";

const finalName = await renameFileSameAsWindowsOS(
  "C:/projects/untitled-folder",
  "archive",
);

console.log(finalName); // "archive"
```

### Handle invalid characters

By default, invalid Windows filename characters are removed:

```ts
import { renameFileSameAsWindowsOS } from "awesome-renamer";

const finalName = await renameFileSameAsWindowsOS(
  "C:/documents/draft.txt",
  "report:final?.txt",
);

console.log(finalName); // "reportfinal.txt"
```

Pass `"error"` to reject the name instead:

```ts
await renameFileSameAsWindowsOS(
  "C:/documents/draft.txt",
  "report:final?.txt",
  { onInvalidChar: "error" },
);
// Throws: Filename contains invalid chars: ...
```

### Validate a name without renaming anything

```ts
import { validateFileName } from "awesome-renamer";

validateFileName("quarter:one?.pdf");
// => "quarterone.pdf"

validateFileName("quarter:one?.pdf", "error");
// Throws because the name contains invalid characters
```

This is useful for validating form input or previewing the sanitized name before performing a filesystem operation.

### CommonJS

```js
const {
  renameFileSameAsWindowsOS,
  validateFileName,
} = require("awesome-renamer");
```

## API

### `awesomeRename(oldFilePath, newName, options?)`

The primary API for renaming one file or directory. It applies any configured rules, validates the result, and then renames the item. It resolves with `{ newName, newPath }`.

```ts
import { awesomeRename } from "awesome-renamer";

const result = await awesomeRename(
  "C:/uploads/draft.TXT",
  "quarter one",
  {
    rules: [
      { type: "replace", search: " ", replace: "-" },
      { type: "uppercase"},
      { type: "windowsStyle" },
    ],
  },
);

console.log(result);
// { newName: "QUARTER-ONE.TXT", newPath: "C:\\uploads\\QUARTER-ONE.TXT" }
```

| Parameter | Type | Description |
| ---------- | ------------------------ | ------------------------------------------------------- |
| `oldFilePath` | `string` | Path of the existing file or directory. |
| `newName` | `string` | Requested name, before rules and validation are applied. |
| `options` | `RenameOptions` | Optional rename, validation, and rule settings. |

#### `RenameOptions`

| Property | Type | Default | Description |
| -------- | ------------------------------ | ------------ | ---------------------------------------------------------------------- |
| `onInvalidChar` | `"escape" \| "error"` | `"escape"` | Remove invalid characters or throw an error. |
| `preserveExtension` | `boolean` | `true` | Append the source item's extension to `newName`. Set to `false` to supply the complete target name, including any new extension. |
| `dryRun` | `boolean` | `false` | Return the planned `{ newName, newPath }` without changing the filesystem. |
| `rules` | `RenameRule[]` | `[]` | Rules applied in order before validation and renaming. |

#### Built-in rules

Rules transform the requested name in the order listed. Case and replacement rules leave the extension unchanged; extension preservation is configured separately with `preserveExtension`.

| Rule | Shape | Effect |
| ---- | ----- | ------ |
| Uppercase | `{ type: "uppercase" }` | Converts the basename to uppercase. |
| Lowercase | `{ type: "lowercase" }` | Converts the basename to lowercase. |
| Capitalize | `{ type: "capitalize" }` | Capitalizes the first basename character and lowercases the rest. |
| Title case | `{ type: "titlecase" }` | Capitalizes each space-separated basename word. |
| Replace | `{ type: "replace", search: string, replace: string }` | Replaces every occurrence of `search` in the basename. |
| Windows style | `{ type: "windowsStyle" }` | Resolves conflicts by adding or incrementing a suffix such as ` (2)`. |

Use `dryRun` to preview a rule chain safely:

```ts
const preview = await awesomeRename(
  "C:/uploads/draft.txt",
  "monthly report",
  {
    dryRun: true,
    rules: [{ type: "titlecase" }],
  },
);

console.log(preview.newName); // "Monthly Report.txt"
```

### `awesomeRenameBatch(filesToRename, options?)`

Renames several items using the same `RenameOptions`. It always resolves with results in input order: successful entries contain the rename result plus `renamed: true`; failed entries contain an error message and `renamed: false`. A failed item does not stop the remaining requests.

```ts
import { awesomeRenameBatch } from "awesome-renamer";

const results = await awesomeRenameBatch(
  [
    { oldPath: "C:/uploads/one.txt", newName: "report-one" },
    { oldPath: "C:/uploads/two.txt", newName: "report-two" },
  ],
  {
    limit: 2,
    rules: [{ type: "windowsStyle" }],
  },
);
```

| Parameter | Type | Description |
| ---------- | ------------------------ | ------------------------------------------------------- |
| `filesToRename` | `{ oldPath: string; newName: string }[]` | Rename requests to process. |
| `options` | `RenameOptions & { limit?: number }` | Shared options. `limit` controls concurrency (default: `6`, clamped to `1`–`30`). |

### `registry`

`registry` exposes the built-in rule registry. Use `get`, `has`, and `getAll` to inspect rules, or `register` to add a rule with a unique `type`.

```ts
import { registry } from "awesome-renamer";

registry.register({
  type: "trim",
  apply: (filename) => filename.trim(),
});
```

Registering a rule type that already exists throws an error. Custom rules can be inspected through the registry; the built-in `RenameRule` TypeScript type currently covers the rules listed above.

### Legacy Windows-style API

`renameFileSameAsWindowsOS` remains available for compatibility, but is deprecated and will be removed in the next major release. Use `awesomeRename` with `{ rules: [{ type: "windowsStyle" }] }` for new code.

### `renameFileSameAsWindowsOS(oldFilePath, newName, options?)`

Renames a file or directory and resolves with the final filename.

| Parameter | Type | Description |
| ---------- | ------------------------ | ------------------------------------------------------- |
| `oldFilePath` | `string` | Path of the existing file or directory. |
| `newName` | `string` | Requested name. It is validated before the rename. |
| `options` | `RenameOptions` | Optional validation and return-value settings. |

Returns a `Promise<string>` containing either the final filename or its absolute path, according to `options.returnValue`.

### Rename options

| Property | Type | Default | Description |
| -------- | ------------------------------ | ------------ | ---------------------------------------------------------------------- |
| `onInvalidChar` | `"escape" \| "error"` | `"escape"` | Remove invalid characters or throw an error. |
| `returnValue` | `"name" \| "absolutePath"` | `"name"` | Choose whether the resolved value is the final filename or destination path. |

Options can be combined:

```ts
const finalPath = await renameFileSameAsWindowsOS(
  "C:/documents/draft.txt",
  "report:final?.txt",
  {
    onInvalidChar: "escape",
    returnValue: "absolutePath",
  },
);
```

### Notes

- If `newName` exactly matches the current basename, no filesystem rename is performed and that name is returned.
- A counter beginning at ` (2)` is added when the requested name conflicts with an existing item.
- The original file extension is preserved. Pass a name compatible with that extension—for example, rename a `.txt` file with a name ending in `.txt`.
- Filesystem errors from Node.js (such as a missing source path or insufficient permissions) are passed through to the caller.

### `validateFileName(filename, onInvalidChar?)`

Validates and optionally sanitizes a filename without accessing the filesystem.

| Parameter | Type | Description |
| ---------- | ------------------------------ | ------------------------------------------------------ |
| `filename` | `string` | Filename to validate. |
| `onInvalidChar` | `"escape" \| "error"` | Optional. Defaults to `"escape"`. |

Returns the validated `string`.

The following characters and control-character range are treated as invalid:

```text
< > : " / \ | ? * and ASCII control characters 0x00-0x1F
```

The validator also rejects blank names and the reserved names:

- `CON`
- `PRN`
- `AUX`
- `NUL`
- `COM1`–`COM9`
- `LPT1`–`LPT9`

(case-insensitive)

## Use cases

- Reproducing Windows Explorer's rename behavior.
- Preventing duplicate filenames in upload or document workflows.
- Sanitizing user-provided filenames before saving them.
- Renaming exported reports, downloaded assets, or generated media.
- Sharing filename-validation behavior between a frontend and a Node.js backend.

## Error handling

Because renaming touches the filesystem, wrap calls in `try`/`catch` when an error should be shown to a user or logged.

```ts
import { renameFileSameAsWindowsOS } from "awesome-renamer";

try {
  const finalName = await renameFileSameAsWindowsOS(
    "C:/documents/draft.txt",
    "CON",
  );

  console.log(`Renamed to ${finalName}`);
} catch (error) {
  console.error("Could not rename the file:", error);
}
```

## Testing

Run the test suite with:

```bash
npm test
```

The tests cover:

- Filename validation
- Invalid-character handling
- File and directory renaming
- Collision numbering
- Return-value modes

## License

MIT
