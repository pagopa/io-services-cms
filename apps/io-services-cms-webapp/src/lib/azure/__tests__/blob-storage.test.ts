import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vi } from "vitest";

import { upsertBlobFromImageBuffer } from "../blob-storage";

describe("upsertBlobFromImageBuffer", () => {
  const mockBlobService = {
    createBlockBlobFromText: vi.fn((_, __, ___, cb) => cb(null, "any")),
  } as any;
  const containerName = "test-container";
  const blobName = "test-blob";
  const content = Buffer.from("test-content");

  it("should create a new blob if it doesn't exist", async () => {
    const result = await upsertBlobFromImageBuffer(
      mockBlobService,
      containerName,
      blobName,
      content,
    )();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(O.isSome(result.right)).toBe(true);
    }
  });
});
