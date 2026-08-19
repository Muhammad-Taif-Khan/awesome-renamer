# awesome-renamer

Rule-based asynchronous renaming for Node.js files and directories. `awesome-renamer` can validate Windows-compatible filenames, preserve or replace extensions, transform names, avoid collisions with Windows Explorer-style suffixes, and process selected items in batches.

[![npm version](https://img.shields.io/npm/v/awesome-renamer)](https://www.npmjs.com/package/awesome-renamer)
[![npm downloads](https://img.shields.io/npm/dm/awesome-renamer)](https://www.npmjs.com/package/awesome-renamer)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Awesome Renamer Desktop

Looking for a graphical application instead of using the library directly?

**Awesome Renamer Desktop** is a free and open-source Windows desktop application built on top of the `awesome-renamer` package.

It provides a graphical interface for:

- Selecting files using drag & drop or a file picker
- Filtering files
- Applying rename rules
- Previewing changes
- Batch renaming files

[View Awesome Renamer Desktop →](https://github.com/Muhammad-Taif-Khan/awesome-renamer-desktop/)
## Installation

```bash
npm install awesome-renamer
```

The package ships ESM, CommonJS, and TypeScript declarations.

```ts
import { awesomeRename } from "awesome-renamer";
```

```js
const { awesomeRename } = require("awesome-renamer");
```

## Quick start

```ts
import { awesomeRename } from "awesome-renamer";

const result = await awesomeRename("C:/reports/draft.txt", "quarterly-report");

console.log(result.newName); // "quarterly-report.txt"
console.log(result.newPath); // destination path
```

`awesomeRename` preserves the source extension by default. Pass a basename such as `quarterly-report`, rather than `quarterly-report.txt`, unless you set `preserveExtension: false`.

## How renaming works

For `awesomeRename`, the package:

1. Applies configured rules in order.
2. Validates or sanitizes the resulting filename.
3. Preserves the source extension unless disabled.
4. Optionally resolves an occupied destination with the `windowsStyle` rule.
5. Renames the source, or returns the planned result when `dryRun` is enabled.

File-system errors, including missing sources and permission errors, are rejected to the caller. Filename checks follow Windows restrictions even when the code runs on a different operating system.

## API

### `awesomeRename(oldFilePath, newName, options?)`

Renames one file or directory and returns metadata for both names.

```ts
import { awesomeRename } from "awesome-renamer";

const result = await awesomeRename("C:/uploads/draft.TXT", "quarter one", {
  rules: [
    { type: "replace", search: " ", replace: "-" },
    { type: "uppercase" },
  ],
});

// result.newName is "QUARTER-ONE.TXT"
```

| Parameter | Type | Description |
| --- | --- | --- |
| `oldFilePath` | `string` | Path to the existing file or directory. |
| `newName` | `string` | Requested filename before rules and validation. |
| `options` | `RenameOptions` | Optional rename settings. |

The fulfilled result has this shape:

```ts
{
  originalPath: string;
  originalName: string;
  originalExtension: string;
  newName: string;
  newPath: string;
  newExtension: string;
}
```

### `RenameOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `onInvalidChar` | `"escape" \| "error"` | `"escape"` | Remove invalid characters, or throw when any are present. |
| `preserveExtension` | `boolean` | `true` | Append the extension from `oldFilePath` after rules run. Set `false` when `newName` includes the desired extension. |
| `dryRun` | `boolean` | `false` | Return the destination metadata without changing the filesystem. |
| `rules` | `RenameRule[]` | `[]` | Rules to apply in order before validation. |

Preview a rename safely:

```ts
const preview = await awesomeRename("C:/uploads/draft.txt", "monthly report", {
  dryRun: true,
  rules: [{ type: "titlecase" }],
});

console.log(preview.newName); // "Monthly Report.txt"
```

### Rules

Rules transform the requested name in order. The case and replacement rules operate on the filename portion and retain any extension already present in the requested name.

| Rule | Shape | Effect |
| --- | --- | --- |
| Uppercase | `{ type: "uppercase" }` | Makes the basename uppercase. |
| Lowercase | `{ type: "lowercase" }` | Makes the basename lowercase. |
| Capitalize | `{ type: "capitalize" }` | Uppercases the first character and lowercases the remainder. |
| Title case | `{ type: "titlecase" }` | Capitalizes each space-separated word. |
| Replace | `{ type: "replace", search, replace }` | Replaces every occurrence in the basename. |
| Prefix | `{ type: "prefix", value }` | Adds `value` to the start of the filename. |
| Suffix | `{ type: "suffix", value }` | Adds `value` to the filename immediately before its extension. |
| Windows style | `{ type: "windowsStyle" }` | If the destination exists, chooses `name (2).ext`, then higher suffixes as needed. |

To change a file extension and still resolve conflicts, disable extension preservation:

```ts
await awesomeRename("C:/uploads/draft.txt", "report.json", {
  preserveExtension: false,
  rules: [{ type: "windowsStyle" }],
});
```

### `awesomeRenameBatch(files, options?)`

Processes multiple rename requests concurrently. Successful items contain the same metadata as `awesomeRename` plus `renamed: true`. A rename failure includes the error and original source metadata, so it can be identified without referring back to the request:

```ts
{
  error: "CON is a windows reserved name, you cannot use it",
  originalPath: "C:/uploads/two.txt",
  originalName: "two.txt",
  originalExtension: ".txt",
  renamed: false,
}
```

Failures do not stop remaining items.

```ts
import { awesomeRenameBatch } from "awesome-renamer";

const results = await awesomeRenameBatch(
  [
    { oldPath: "C:/uploads/one.txt", newName: "report-one" },
    { oldPath: "C:/uploads/two.txt", newName: "report-two" },
  ],
  { limit: 2, rules: [{ type: "windowsStyle" }] },
);
```

Along with `RenameOptions`, batch options accept:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | `number` | `6` | Maximum concurrent renames, clamped to `1` through `30`. |
| `filters` | `Filter[]` | — | Every filter must match for an item to be processed. |
| `shouldRename` | `(file: FileMetadata) => boolean \| Promise<boolean>` | — | Final per-item predicate, evaluated only after filters pass. |

Items excluded by filters or `shouldRename` are not returned. Processed results preserve their input order.

#### Batch filters

Filters are case-insensitive where they compare filenames or extensions. Their ranges are inclusive.

```ts
const results = await awesomeRenameBatch(requests, {
  filters: [
    { type: "extension", extensions: [".jpg", ".png"] },
    { type: "filename", startsWith: ["camera-"], contains: ["2026"] },
    { type: "size", min: 1_000, max: 10_000_000 },
    { type: "dateModified", from: "2026-01-01", precision: "day" },
  ],
  shouldRename: ({ name }) => !name.includes("processed"),
});
```

| Filter | Shape | Matches |
| --- | --- | --- |
| Extension | `{ type: "extension", extensions: [".txt"] }` | Any listed extension. An empty list matches all. |
| Filename | `{ type: "filename", contains?, startsWith?, endsWith? }` | All supplied criterion groups; a value may match any string within its group. |
| Size | `{ type: "size", min?, max? }` | File byte size in the inclusive range. |
| Created | `{ type: "dateCreated", from?, to?, precision? }` | Creation time in the inclusive range. |
| Modified | `{ type: "dateModified", from?, to?, precision? }` | Modification time in the inclusive range. |

Date values can be `Date`, string, or number. `precision` is one of `millisecond`, `second`, `minute`, `hour`, or `day` and defaults to `millisecond`.

`FileMetadata`, provided to `shouldRename`, contains `name`, `path`, `size`, `createdAt`, and `lastModified`.

### `validateFileName(filename, onInvalidChar?)`

Checks a filename without reading or writing the filesystem.

```ts
import { validateFileName } from "awesome-renamer";

validateFileName("quarter:one?.pdf"); // "quarterone.pdf"
validateFileName("quarter:one?.pdf", "error"); // throws
```

It rejects non-strings, blank names, and these reserved device names (case-insensitive): `CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, and `LPT1`–`LPT9`.

The invalid characters are `<`, `>`, `:`, `"`, `/`, `\`, `|`, `?`, `*`, and ASCII control characters `U+0000`–`U+001F`. The default `"escape"` mode removes them, but still throws if the sanitized name is blank. Use `"error"` to reject the input unchanged.

Pass a filename—not a path—to this function.

### `registry`

`registry` holds the built-in rule implementations. It exposes `has(type)`, `get(type)`, `getAll()`, and `register(rule)`.

```ts
import { registry } from "awesome-renamer";

registry.register({
  type: "trim",
  apply: (filename) => filename.trim(),
});

await awesomeRename("C:/uploads/draft.txt", "  report  ", {
  rules: [{ type: "trim" } as never],
});
```

Rule types must be unique; attempting to re-register a type throws. Custom rule types require a type assertion today because the exported `RenameRule` union intentionally describes the built-in rules.

### `renameFileSameAsWindowsOS(oldFilePath, newName, options?)`

> Deprecated: use `awesomeRename(oldFilePath, newName, { rules: [{ type: "windowsStyle" }] })` for new code.

This compatibility function always resolves occupied names with a Windows-style counter and returns a string rather than metadata.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `onInvalidChar` | `"escape" \| "error"` | `"escape"` | Validation mode. |
| `returnValue` | `"name" \| "absolutePath"` | `"name"` | Return the final name or full destination path. |

Unlike `awesomeRename`, this helper treats `newName` as the complete target filename and does not automatically preserve the source extension.

## Error handling

Use `try`/`catch` around single renames. Batch operations instead capture errors per processed item.

```ts
try {
  await awesomeRename("C:/documents/draft.txt", "CON");
} catch (error) {
  console.error("Rename failed:", error);
}
```

## TypeScript exports

The package exports function signature and data types for API annotations: `RenameOptions`, `RenameRule`, `AwesomeRenameReturnValue`, `AwesomeRenameBatchReturnType`, `AwesomeRenameSuccessReturn`, `AwesomeRenameFailedRename`, `FileMetadata`, `Filter`, `ShouldRename`, `WindowsStyleRenameOptions`, and the corresponding callable type aliases.

## Development

```bash
npm test
```

This builds the package and runs the Node.js API test suite.

## License

[MIT](LICENSE)
