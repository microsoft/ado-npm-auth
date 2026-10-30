import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import decompress from "decompress";
import { afterEach, beforeEach, expect, test } from "vitest";

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "azureauth-decompress-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

test("extracts a regular file into the output directory", async () => {
  const output = path.join(directory, "output");
  await decompress(Buffer.alloc(0), output, {
    plugins: [
      () => [
        {
          type: "file",
          path: "nested/azureauth",
          mode: 0o755,
          mtime: new Date(),
          data: Buffer.from("azureauth"),
        },
      ],
    ],
  });

  expect(await readFile(path.join(output, "nested/azureauth"), "utf8")).toBe(
    "azureauth",
  );
});

test.skipIf(process.platform === "win32")(
  "rejects a symlink chain that resolves outside the output directory",
  async () => {
    const output = path.join(directory, "output");
    const outside = path.join(directory, "outside.txt");
    await writeFile(outside, "unchanged");

    await expect(
      decompress(Buffer.alloc(0), output, {
        plugins: [
          () =>
            [
              { path: "a", linkname: "." },
              { path: "b", linkname: "a/../outside.txt" },
            ].map((entry) => ({
              ...entry,
              type: "symlink",
              mode: 0o777,
              mtime: new Date(),
              data: Buffer.alloc(0),
            })),
        ],
      }),
    ).rejects.toThrow(/Refusing/);

    expect(await readFile(outside, "utf8")).toBe("unchanged");
  },
);
