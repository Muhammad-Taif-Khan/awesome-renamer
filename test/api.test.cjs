const assert = require("node:assert/strict");
const { mkdtemp, mkdir, readFile, utimes, writeFile } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  awesomeRename,
  awesomeRenameBatch,
  renameFileSameAsWindowsOS,
  registry,
  validateFileName,
} = require("../dist/index.cjs");

async function createTestDirectory() {
  return mkdtemp(path.join(os.tmpdir(), "awesome-renamer"));
}

test("validateFileName removes invalid Windows characters by default", () => {
  assert.equal(validateFileName("report:final?.txt"), "reportfinal.txt");
});

test("validateFileName can reject invalid characters", () => {
  assert.throws(
    () => validateFileName("report?.txt", "error"),
    /Filename contains invalid chars/,
  );
});

test("validateFileName rejects blank and reserved names", () => {
  assert.throws(() => validateFileName("   "), /cannot be empty/);
  assert.throws(() => validateFileName("CON"), /windows reserved name/);
});

test("validateFileName rejects non-strings and names that sanitize to blank", () => {
  assert.throws(() => validateFileName(null), /filename must be a string/);
  assert.throws(() => validateFileName("<>:*"), /cannot be empty/);
  assert.throws(() => validateFileName("lpt9"), /windows reserved name/);
});

test("renames a file to an available name and returns the name", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await writeFile(source, "draft contents");

  const result = await renameFileSameAsWindowsOS(source, "report.txt");

  assert.equal(result, "report.txt");
  assert.equal(
    await readFile(path.join(directory, "report.txt"), "utf8"),
    "draft contents",
  );
});

test("adds and increments a counter when the requested name exists", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await Promise.all([
    writeFile(source, "draft contents"),
    writeFile(path.join(directory, "report.txt"), "first report"),
    writeFile(path.join(directory, "report (2).txt"), "second report"),
  ]);

  const result = await renameFileSameAsWindowsOS(source, "report.txt");

  assert.equal(result, "report (3).txt");
  assert.equal(
    await readFile(path.join(directory, "report (3).txt"), "utf8"),
    "draft contents",
  );
  assert.equal(
    await readFile(path.join(directory, "report.txt"), "utf8"),
    "first report",
  );
});

test("can return the absolute destination path", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await writeFile(source, "draft contents");

  const result = await renameFileSameAsWindowsOS(source, "report.txt", {
    returnValue: "absolutePath",
  });

  assert.equal(result, path.join(directory, "report.txt"));
});

test("renames directories", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "untitled-folder");
  await mkdir(source);

  const result = await renameFileSameAsWindowsOS(source, "archive");

  assert.equal(result, "archive");
});

test("does not rename when the requested name is already the source name", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await writeFile(source, "draft contents");

  const result = await renameFileSameAsWindowsOS(source, "draft.txt");

  assert.equal(result, "draft.txt");
  assert.equal(await readFile(source, "utf8"), "draft contents");
});

test("continues a requested Windows-style counter", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await Promise.all([
    writeFile(source, "draft contents"),
    writeFile(path.join(directory, "report (5).txt"), "existing report"),
  ]);

  const result = await renameFileSameAsWindowsOS(source, "report (5).txt");

  assert.equal(result, "report (6).txt");
  assert.equal(await readFile(path.join(directory, "report (6).txt"), "utf8"), "draft contents");
});

test("awesomeRename applies casing and replacement rules while preserving extensions", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.TXT");
  await writeFile(source, "draft contents");

  const result = await awesomeRename(source, "quarter one", {
    rules: [
      { type: "replace", search: " ", replace: "-" },
      { type: "uppercase" },
    ],
    preserveExtension: true,
  });

  assert.deepEqual(result, {
    originalPath: source,
    originalName: "draft.TXT",
    originalExtension: ".TXT",
    newName: "QUARTER-ONE.TXT",
    newPath: path.join(directory, "QUARTER-ONE.TXT"),
    newExtension: ".TXT",
  });
  assert.equal(await readFile(result.newPath, "utf8"), "draft contents");
});

test("awesomeRename supports title case and dry runs without modifying the filesystem", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await writeFile(source, "draft contents");

  const result = await awesomeRename(source, "monthly report", {
    dryRun: true,
    rules: [{ type: "titlecase" }],
  });

  assert.deepEqual(result, {
    newName: "Monthly Report.txt",
    newPath: path.join(directory, "Monthly Report.txt"),
    originalPath: source,
    originalName: "draft.txt",
    originalExtension: ".txt",
    newExtension: ".txt",
  });
  assert.equal(await readFile(source, "utf8"), "draft contents");
  await assert.rejects(readFile(result.newPath), /ENOENT/);
});

test("awesomeRename returns full metadata when source and destination names match", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await writeFile(source, "draft contents");

  const result = await awesomeRename(source, "draft.txt", {
    preserveExtension: true,
  });

  assert.deepEqual(result, {
    originalPath: source,
    originalName: "draft.txt",
    originalExtension: ".txt",
    newName: "draft.txt",
    newPath: source,
    newExtension: ".txt",
  });
});

test("awesomeRenameBatch returns original metadata for successful renames", async () => {
  const directory = await createTestDirectory();
  const first = path.join(directory, "first.txt");
  const second = path.join(directory, "second.txt");
  await Promise.all([writeFile(first, "first"), writeFile(second, "second")]);

  const results = await awesomeRenameBatch([
    { oldPath: first, newName: "renamed-first" },
    { oldPath: second, newName: "renamed-second" },
  ]);

  assert.equal(results.length, 2);
  assert.deepEqual(results[0], {
    originalPath: first,
    originalName: "first.txt",
    originalExtension: ".txt",
    newName: "renamed-first.txt",
    newPath: path.join(directory, "renamed-first.txt"),
    newExtension: ".txt",
    renamed: true,
  });
  assert.deepEqual(results[1], {
    originalPath: second,
    originalName: "second.txt",
    originalExtension: ".txt",
    newName: "renamed-second.txt",
    newPath: path.join(directory, "renamed-second.txt"),
    newExtension: ".txt",
    renamed: true,
  });
});

test("awesomeRenameBatch combines filters and shouldRename", async () => {
  const directory = await createTestDirectory();
  const included = path.join(directory, "included.txt");
  const declined = path.join(directory, "declined.txt");
  const filteredOut = path.join(directory, "filtered-out.jpg");
  await Promise.all([
    writeFile(included, "included"),
    writeFile(declined, "declined"),
    writeFile(filteredOut, "filtered out"),
  ]);

  const evaluatedNames = [];
  const results = await awesomeRenameBatch(
    [
      { oldPath: included, newName: "included-renamed" },
      { oldPath: declined, newName: "declined-renamed" },
      { oldPath: filteredOut, newName: "filtered-out-renamed" },
    ],
    {
      filters: [{ type: "extension", extensions: [".txt"] }],
      shouldRename: (file) => {
        evaluatedNames.push(file.name);
        return file.name === "included.txt";
      },
    },
  );

  assert.deepEqual(
    evaluatedNames.sort(),
    ["included.txt", "declined.txt"].sort(),
  );
  assert.equal(results.length, 1);
  assert.equal(results[0].renamed, true);
  assert.equal(results[0].newName, "included-renamed.txt");
  assert.equal(await readFile(path.join(directory, "included-renamed.txt"), "utf8"), "included");
  assert.equal(await readFile(declined, "utf8"), "declined");
  assert.equal(await readFile(filteredOut, "utf8"), "filtered out");
});

test("awesomeRenameBatch filters by filename", async () => {
  const directory = await createTestDirectory();
  const matching = path.join(directory, "invoice-2026.txt");
  const nonMatching = path.join(directory, "notes.txt");
  await Promise.all([writeFile(matching, "invoice"), writeFile(nonMatching, "notes")]);

  const results = await awesomeRenameBatch(
    [
      { oldPath: matching, newName: "processed-invoice" },
      { oldPath: nonMatching, newName: "processed-notes" },
    ],
    { filters: [{ type: "filename", startsWith: ["invoice-"] }] },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].newName, "processed-invoice.txt");
  assert.equal(await readFile(path.join(directory, "processed-invoice.txt"), "utf8"), "invoice");
  assert.equal(await readFile(nonMatching, "utf8"), "notes");
});

test("awesomeRenameBatch filters by file size", async () => {
  const directory = await createTestDirectory();
  const matching = path.join(directory, "large.txt");
  const nonMatching = path.join(directory, "small.txt");
  await Promise.all([writeFile(matching, "12345"), writeFile(nonMatching, "1")]);

  const results = await awesomeRenameBatch(
    [
      { oldPath: matching, newName: "processed-large" },
      { oldPath: nonMatching, newName: "processed-small" },
    ],
    { filters: [{ type: "size", min: 5 }] },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].newName, "processed-large.txt");
  assert.equal(await readFile(path.join(directory, "processed-large.txt"), "utf8"), "12345");
  assert.equal(await readFile(nonMatching, "utf8"), "1");
});

test("awesomeRenameBatch filters by creation date", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "created-now.txt");
  await writeFile(source, "created now");

  const results = await awesomeRenameBatch(
    [{ oldPath: source, newName: "created-now-renamed" }],
    {
      filters: [
        {
          type: "dateCreated",
          from: new Date(Date.now() - 60_000),
          precision: "second",
        },
      ],
    },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].newName, "created-now-renamed.txt");
  assert.equal(await readFile(path.join(directory, "created-now-renamed.txt"), "utf8"), "created now");
});

test("awesomeRenameBatch filters by modification date", async () => {
  const directory = await createTestDirectory();
  const matching = path.join(directory, "recent.txt");
  const nonMatching = path.join(directory, "old.txt");
  await Promise.all([writeFile(matching, "recent"), writeFile(nonMatching, "old")]);
  const oldDate = new Date(Date.now() - 86_400_000);
  await utimes(nonMatching, oldDate, oldDate);

  const results = await awesomeRenameBatch(
    [
      { oldPath: matching, newName: "recent-renamed" },
      { oldPath: nonMatching, newName: "old-renamed" },
    ],
    {
      filters: [
        {
          type: "dateModified",
          from: new Date(Date.now() - 60_000),
          precision: "second",
        },
      ],
    },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].newName, "recent-renamed.txt");
  assert.equal(await readFile(path.join(directory, "recent-renamed.txt"), "utf8"), "recent");
  assert.equal(await readFile(nonMatching, "utf8"), "old");
});

test("awesomeRename can replace the extension when extension preservation is disabled", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await writeFile(source, "draft contents");

  const result = await awesomeRename(source, "report.json", {
    preserveExtension: false,
  });

  assert.equal(result.newName, "report.json");
  assert.equal(await readFile(result.newPath, "utf8"), "draft contents");
});

test("awesomeRename applies lowercase and capitalize rules", async () => {
  const directory = await createTestDirectory();
  const first = path.join(directory, "first.txt");
  const second = path.join(directory, "second.txt");
  await Promise.all([writeFile(first, "first"), writeFile(second, "second")]);

  const lowerCaseResult = await awesomeRename(first, "mIxEd", {
    rules: [{ type: "lowercase" }],
  });
  const capitalizeResult = await awesomeRename(second, "mIXED NAME", {
    rules: [{ type: "capitalize" }],
  });

  assert.equal(lowerCaseResult.newName, "mixed.txt");
  assert.equal(capitalizeResult.newName, "Mixed name.txt");
});

test("awesomeRename applies Windows-style collision resolution", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");

  await Promise.all([
    writeFile(source, "draft contents"),
    writeFile(path.join(directory, "report.txt"), "existing report"),
    writeFile(path.join(directory, "report (2).txt"), "second report"),
  ]);

  const result = await awesomeRename(source, "report", {
    rules: [{ type: "windowsStyle" }],
  });

  assert.deepEqual(result, {
    originalPath: source,
    originalName: "draft.txt",
    originalExtension: ".txt",
    newName: "report (3).txt",
    newPath: path.join(directory, "report (3).txt"),
    newExtension: ".txt",
  });
  assert.equal(await readFile(result.newPath, "utf8"), "draft contents");
});

test("Windows-style renaming handles collisions after changing the extension", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await Promise.all([
    writeFile(source, "draft contents"),
    writeFile(path.join(directory, "report.json"), "existing report"),
  ]);

  const result = await awesomeRename(source, "report.json", {
    preserveExtension: false,
    rules: [{ type: "windowsStyle" }],
  });

  assert.equal(result.newName, "report (2).json");
  assert.equal(await readFile(result.newPath, "utf8"), "draft contents");
});
test("Windows-style renaming handles only filename text case changes ", async () => {
  const directory = await createTestDirectory();
  const source = path.join(directory, "draft.txt");
  await Promise.all([writeFile(source, "draft contents")]);

  const result = await awesomeRename(source, "draft.txt", {
    preserveExtension: false,
    rules: [{ type: "uppercase" }],
  });

  assert.equal(result.newName, "DRAFT.txt");
  assert.equal(await readFile(result.newPath, "utf8"), "draft contents");
});

test("awesomeRenameBatch reports successful and failed requests in input order", async () => {
  const directory = await createTestDirectory();
  const first = path.join(directory, "first.txt");
  const second = path.join(directory, "second.txt");
  await Promise.all([writeFile(first, "first"), writeFile(second, "second")]);

  const results = await awesomeRenameBatch(
    [
      { oldPath: first, newName: "renamed-first" },
      { oldPath: second, newName: "CON" },
    ],
    { limit: 1 },
  );

  assert.deepEqual(results[0], {
    originalPath: first,
    originalName: "first.txt",
    originalExtension: ".txt",
    newName: "renamed-first.txt",
    newPath: path.join(directory, "renamed-first.txt"),
    newExtension: ".txt",
    renamed: true,
  });
  assert.deepEqual(results[1], {
    error: "CON is a windows reserved name, you cannot use it",
    originalPath: path.join(directory, "second.txt"),
    originalName: "second.txt",
    originalExtension: ".txt",
    renamed: false,
  });
  assert.equal(await readFile(second, "utf8"), "second");
});

test("registry exposes built-in rules and prevents duplicate registrations", () => {
  assert.equal(registry.has("capitalize"), true);
  assert.equal(registry.get("missing"), undefined);
  assert.ok(registry.getAll().some((rule) => rule.type === "windowsStyle"));
  assert.throws(
    () => registry.register({ type: "uppercase", apply: (filename) => filename }),
    /already registered/,
  );
});
