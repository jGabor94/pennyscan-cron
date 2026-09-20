import { randomUUID } from "node:crypto";
import { rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pendingWrites = new Map<string, Promise<void>>();

async function writeJsonFile(outputPath: string, data: unknown): Promise<void> {
  const temporaryPath = join(
    dirname(outputPath),
    `.${basename(outputPath)}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export function writeJsonAtomically(
  outputFile: string | URL,
  data: unknown,
): Promise<void> {
  const outputPath =
    outputFile instanceof URL ? fileURLToPath(outputFile) : resolve(outputFile);
  const previousWrite = pendingWrites.get(outputPath) ?? Promise.resolve();
  const currentWrite = previousWrite
    .catch(() => undefined)
    .then(() => writeJsonFile(outputPath, data));

  pendingWrites.set(outputPath, currentWrite);

  return currentWrite.finally(() => {
    if (pendingWrites.get(outputPath) === currentWrite) {
      pendingWrites.delete(outputPath);
    }
  });
}
