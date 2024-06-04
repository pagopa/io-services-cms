import { describe, expect, it, vi } from "vitest";
import { BlobServiceClient, RestError } from "@azure/storage-blob";
import * as t from "io-ts";
import { getBlobAsObject } from "../blob-storage/helper";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

// mock BlobServiceClient using vitest

const AnExampleType = t.type({
  aField: t.string,
});

const mockDownloadToBuffer = vi.fn().mockResolvedValue({
  toString: vi.fn().mockReturnValue('{"aField":"aString"}'),
});

const mockGetBlockBlobClient = vi.fn().mockReturnValue({
  downloadToBuffer: mockDownloadToBuffer,
});
const mockBlobServiceClient = {
  getContainerClient: vi.fn().mockReturnValue({
    getBlockBlobClient: mockGetBlockBlobClient,
  } as unknown as BlobServiceClient),
} as unknown as BlobServiceClient;

describe("Azure Blob Storage Client Helper Tests", () => {
  it("Should return the blob as object", async () => {
    const result = await getBlobAsObject(
      AnExampleType,
      mockBlobServiceClient,
      "aContainer",
      "aBlob"
    )();

    expect(mockBlobServiceClient.getContainerClient).toBeCalledWith(
      "aContainer"
    );
    expect(mockGetBlockBlobClient).toBeCalledWith("aBlob");
    expect(mockDownloadToBuffer).toBeCalled();

    expect(result).toEqual(
      E.right(expect.objectContaining(O.some({ aField: "aString" })))
    );
  });

  it("Should return none when blob is not found", async () => {
    mockDownloadToBuffer.mockRejectedValueOnce(
      new RestError("Not found", {
        statusCode: 404,
      })
    );
    const result = await getBlobAsObject(
      AnExampleType,
      mockBlobServiceClient,
      "aContainer",
      "aBlob"
    )();

    expect(mockBlobServiceClient.getContainerClient).toBeCalledWith(
      "aContainer"
    );
    expect(mockGetBlockBlobClient).toBeCalledWith("aBlob");
    expect(mockDownloadToBuffer).toBeCalled();

    expect(result).toEqual(E.right(expect.objectContaining(O.none)));
  });

  it("Should return error when status Code is not 404", async () => {
    mockDownloadToBuffer.mockRejectedValueOnce(
      new RestError("Error on Blob", {
        statusCode: 429,
      })
    );
    const result = await getBlobAsObject(
      AnExampleType,
      mockBlobServiceClient,
      "aContainer",
      "aBlob"
    )();

    expect(mockBlobServiceClient.getContainerClient).toBeCalledWith(
      "aContainer"
    );
    expect(mockGetBlockBlobClient).toBeCalledWith("aBlob");
    expect(mockDownloadToBuffer).toBeCalled();

    expect(result).toEqual(E.left(new Error("Error on Blob")));
  });
});
