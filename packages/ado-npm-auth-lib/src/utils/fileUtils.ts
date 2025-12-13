import fs from "node:fs/promises";

export async function writeFileLazy(
  path: string,
  content: string,
): Promise<void> {
  try {
    const existingContent = await fs.readFile(path, { encoding: "utf-8" });
    if (existingContent === content) {
      // File already up to date, no need to write out content
      return;
    }
  } catch {
    // no-op, proceed to write file as file doesn't exist
  }

  await fs.writeFile(path, content, { encoding: "utf-8" });
  return;
}
