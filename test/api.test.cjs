const assert = require("node:assert/strict");
const { mkdtemp, mkdir, readFile, writeFile } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  renameFileSameAsWindowsOS,
  validateFileName,
} = require("../.test-dist/index.js");

async function createTestDirectory() {
  return mkdtemp(path.join(os.tmpdir(), "windows-like-renamer-"));
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
