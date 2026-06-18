import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { stringify } from "yaml";

/** Serializes an OpenAPI document to a stable YAML string. */
export const openApiToYaml = (doc: unknown): string =>
  stringify(doc, { indent: 2, lineWidth: 0, sortMapEntries: false });

export interface WriteOptions {
  /**
   * If true, do not write. Compare the existing file with the freshly
   * serialized YAML and return `check-failed` on drift. Used in CI.
   */
  check?: boolean;
  doc: unknown;
  path: string;
}

export type WriteResult =
  | { diff: string; kind: "check-failed"; path: string }
  | { kind: "ok"; path: string }
  | { kind: "unchanged"; path: string };

export const writeOpenApiYaml = async (
  options: WriteOptions,
): Promise<WriteResult> => {
  const next = openApiToYaml(options.doc);

  let current: string | undefined;
  try {
    current = await readFile(options.path, "utf8");
  } catch {
    current = undefined;
  }

  if (current === next) return { kind: "unchanged", path: options.path };

  if (options.check) {
    return {
      diff: minimalDiff(current ?? "", next),
      kind: "check-failed",
      path: options.path,
    };
  }

  await mkdir(dirname(options.path), { recursive: true });
  await writeFile(options.path, next, "utf8");
  return { kind: "ok", path: options.path };
};

const minimalDiff = (a: string, b: string): string => {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const out: string[] = [];
  const max = Math.max(aLines.length, bLines.length);
  for (let i = 0; i < max; i++) {
    if (aLines[i] !== bLines[i]) {
      if (aLines[i] !== undefined) out.push("- " + aLines[i]);
      if (bLines[i] !== undefined) out.push("+ " + bLines[i]);
    }
  }
  return out.slice(0, 200).join("\n");
};
