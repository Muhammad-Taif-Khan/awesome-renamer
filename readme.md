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
import { renameFileSameAsWindowsOS } from "awesome-renamer";

const renamedTo = await renameFileSameAsWindowsOS(
  "C:/documents/draft.txt",
  "report.txt",
);

console.log(renamedTo); // "report.txt"
```

The file is renamed in its current directory. The returned value is the final filename, not its full path.

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