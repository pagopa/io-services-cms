import { DefaultAzureCredential } from "@azure/identity";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeysExportsAdapter } from "../api-keys-exports-adapter";
import { ManagedInternalError } from "../errors";
import { FileStateEnum } from "../subscriptions/api-keys-exports-port";

const mocks = vi.hoisted(() => {
  const upload = vi.fn();
  const uploadStream = vi.fn();
  const setTags = vi.fn();
  const getBlockBlobClient = vi.fn(() => ({
    upload,
    uploadStream,
    setTags,
  }));
  const findBlobsByTags = vi.fn();
  const getProperties = vi.fn();
  const getBlobClient = vi.fn(() => ({
    getProperties,
  }));
  const getContainerClient = vi.fn(() => ({
    findBlobsByTags,
    getBlockBlobClient,
    getBlobClient,
  }));
  const blobServiceClientConstructor = vi.fn(() => ({
    getContainerClient,
  }));
  const defaultAzureCredentialConstructor = vi.fn();

  return {
    upload,
    uploadStream,
    setTags,
    getBlockBlobClient,
    getProperties,
    findBlobsByTags,
    getContainerClient,
    blobServiceClientConstructor,
    defaultAzureCredentialConstructor,
  };
});

vi.mock("@azure/identity", () => ({
  DefaultAzureCredential: mocks.defaultAzureCredentialConstructor,
}));

vi.mock("@azure/storage-blob", () => ({
  BlobServiceClient: mocks.blobServiceClientConstructor,
  ContainerClient: vi.fn(),
}));

const resetAdapterSingleton = () => {
  (
    ApiKeysExportsAdapter as unknown as { instance?: ApiKeysExportsAdapter }
  ).instance = undefined;
};

const createAsyncIterable = <T>(items: readonly T[]) => ({
  async *[Symbol.asyncIterator]() {
    for (const item of items) {
      yield item;
    }
  },
});

beforeEach(() => {
  resetAdapterSingleton();
});

afterEach(() => {
  vi.clearAllMocks();
  resetAdapterSingleton();
});

const mockDate = new Date(2026, 0, 1);

describe("getInstance", () => {
  it("should throw an error when env config is invalid", () => {
    expect(() => ApiKeysExportsAdapter.getInstance({})).toThrowError(
      "error parsing blob storage config",
    );
    expect(mocks.blobServiceClientConstructor).not.toHaveBeenCalled();
  });

  it("should return the same instance when called twice", () => {
    // given
    const environment = {
      SA_EXT_BLOB_ENDPOINT: "https://account.blob.core.windows.net",
      EXPORTS_API_KEYS_CONTAINER_NAME: "api-keys-exports",
      EXPORTS_API_KEYS_DURATION_IN_HOURS: 24,
    };

    // when
    const firstInstance = ApiKeysExportsAdapter.getInstance(environment);
    const secondInstance = ApiKeysExportsAdapter.getInstance(environment);

    // then
    expect(firstInstance).toBe(secondInstance);
    expect(mocks.blobServiceClientConstructor).toHaveBeenCalledOnce();
    expect(mocks.blobServiceClientConstructor).toHaveBeenCalledWith(
      environment.SA_EXT_BLOB_ENDPOINT,
      expect.any(DefaultAzureCredential),
    );
    expect(mocks.getContainerClient).toHaveBeenCalledOnce();
    expect(mocks.getContainerClient).toHaveBeenCalledWith(
      environment.EXPORTS_API_KEYS_CONTAINER_NAME,
    );
  });
});

describe("findExportsFiles", () => {
  const environment = {
    SA_EXT_BLOB_ENDPOINT: "https://account.blob.core.windows.net",
    EXPORTS_API_KEYS_CONTAINER_NAME: "api-keys-exports",
    EXPORTS_API_KEYS_DURATION_IN_HOURS: 24,
  };

  it("should throw ManagedInternalError when blob tags query fails", async () => {
    // given
    const adapter = ApiKeysExportsAdapter.getInstance(environment);
    mocks.findBlobsByTags.mockImplementationOnce(() => {
      throw new Error("query failed");
    });

    // when and then
    await expect(
      adapter.findExportsFiles("institutionId", "userId"),
    ).rejects.toThrowError(ManagedInternalError);
    expect(mocks.findBlobsByTags).toHaveBeenCalledOnce();
    expect(mocks.findBlobsByTags).toHaveBeenCalledWith(
      "\"institutionId\" = 'institutionId' AND \"userId\" = 'userId'",
    );
  });

  it("should throw ManagedInternalError when a blob has an invalid state tag", async () => {
    // given
    const adapter = ApiKeysExportsAdapter.getInstance(environment);
    mocks.findBlobsByTags.mockReturnValueOnce(
      createAsyncIterable([
        {
          name: "invalid.zip",
          tags: { state: "UNKNOWN" },
        },
      ]),
    );

    // when and then
    await expect(
      adapter.findExportsFiles("institutionId", "userId"),
    ).rejects.toThrowError(ManagedInternalError);
    expect(mocks.findBlobsByTags).toHaveBeenCalledOnce();
    expect(mocks.findBlobsByTags).toHaveBeenCalledWith(
      "\"institutionId\" = 'institutionId' AND \"userId\" = 'userId'",
    );
  });

  it.each([
    {
      state: undefined,
      expectedQuery:
        "\"institutionId\" = 'institutionId' AND \"userId\" = 'userId'",
      blobs: [
        {
          name: "file-1.zip",
          tags: { state: FileStateEnum.IN_PROGRESS },
        },
        {
          name: "file-2.zip",
          tags: { state: FileStateEnum.DONE },
        },
      ],
      expectedResult: [
        {
          fileName: "file-1.zip",
          state: FileStateEnum.IN_PROGRESS,
          lastModifiedDate: mockDate,
          creationDate: mockDate,
        },
        {
          fileName: "file-2.zip",
          state: FileStateEnum.DONE,
          lastModifiedDate: mockDate,
          creationDate: mockDate,
        },
      ],
    },
    {
      state: FileStateEnum.IN_PROGRESS,
      expectedQuery:
        "\"institutionId\" = 'institutionId' AND \"userId\" = 'userId' AND \"state\" = 'IN_PROGRESS'",
      blobs: [
        {
          name: "file-1.zip",
          tags: { state: FileStateEnum.IN_PROGRESS },
        },
      ],
      expectedResult: [
        {
          fileName: "file-1.zip",
          state: FileStateEnum.IN_PROGRESS,
          lastModifiedDate: mockDate,
          creationDate: mockDate,
        },
      ],
    },
  ])(
    "should return matching blobs when $state is queried",
    async ({ state, expectedQuery, blobs, expectedResult }) => {
      // given
      const adapter = ApiKeysExportsAdapter.getInstance(environment);
      mocks.findBlobsByTags.mockReturnValueOnce(createAsyncIterable(blobs));
      blobs.forEach((_) => {
        mocks.getProperties.mockResolvedValueOnce({
          createdOn: mockDate,
          lastModified: mockDate,
        });
      });

      // when
      const result = await adapter.findExportsFiles(
        "institutionId",
        "userId",
        state,
      );

      // then
      expect(mocks.findBlobsByTags).toHaveBeenCalledOnce();
      expect(mocks.findBlobsByTags).toHaveBeenCalledWith(expectedQuery);
      expect(mocks.getProperties).toHaveBeenCalledTimes(blobs.length);
      expect(result).toStrictEqual(expectedResult);
    },
  );
});

describe("initializeFile", () => {
  const environment = {
    SA_EXT_BLOB_ENDPOINT: "https://account.blob.core.windows.net",
    EXPORTS_API_KEYS_CONTAINER_NAME: "api-keys-exports",
    EXPORTS_API_KEYS_DURATION_IN_HOURS: 24,
  };

  it("should throw ManagedInternalError when upload fails", async () => {
    // given
    const adapter = ApiKeysExportsAdapter.getInstance(environment);
    mocks.upload.mockRejectedValueOnce(new Error("upload failed"));

    // when and then
    await expect(
      adapter.initializeFile("file.zip", "institutionId", "userId"),
    ).rejects.toThrowError("Errore durante l'inizializzazione del file");
    expect(mocks.getBlockBlobClient).toHaveBeenCalledOnce();
    expect(mocks.getBlockBlobClient).toHaveBeenCalledWith("file.zip");
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect(mocks.upload).toHaveBeenCalledWith("", 0, {
      tags: {
        institutionId: "institutionId",
        userId: "userId",
        state: FileStateEnum.IN_PROGRESS,
      },
    });
  });

  it("should upload an empty blob with the expected tags", async () => {
    // given
    const adapter = ApiKeysExportsAdapter.getInstance(environment);
    mocks.upload.mockResolvedValueOnce(undefined);

    // when
    await expect(
      adapter.initializeFile("file.zip", "institutionId", "userId"),
    ).resolves.toBeUndefined();

    // then
    expect(mocks.getBlockBlobClient).toHaveBeenCalledOnce();
    expect(mocks.getBlockBlobClient).toHaveBeenCalledWith("file.zip");
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect(mocks.upload).toHaveBeenCalledWith("", 0, {
      tags: {
        institutionId: "institutionId",
        userId: "userId",
        state: FileStateEnum.IN_PROGRESS,
      },
    });
  });
});

describe("finalizeFile", () => {
  const environment = {
    SA_EXT_BLOB_ENDPOINT: "https://account.blob.core.windows.net",
    EXPORTS_API_KEYS_CONTAINER_NAME: "api-keys-exports",
    EXPORTS_API_KEYS_DURATION_IN_HOURS: 24,
  };

  it("should throw ManagedInternalError when uploadStream fails", async () => {
    // given
    const adapter = ApiKeysExportsAdapter.getInstance(environment);
    mocks.uploadStream.mockRejectedValueOnce(new Error("upload stream failed"));

    // when and then
    await expect(
      adapter.finalizeFile(
        "aggregatorId",
        "userId",
        "file.zip",
        { pipe: vi.fn() } as any,
        "application/zip",
      ),
    ).rejects.toThrowError("Error uploading file `file.zip`");
    expect(mocks.getBlockBlobClient).toHaveBeenCalledOnce();
    expect(mocks.getBlockBlobClient).toHaveBeenCalledWith("file.zip");
    expect(mocks.uploadStream).toHaveBeenCalledOnce();
    expect(mocks.uploadStream).toHaveBeenCalledWith(
      expect.any(Object),
      undefined,
      undefined,
      {
        tags: {
          institutionId: "aggregatorId",
          userId: "userId",
          state: FileStateEnum.DONE,
        },
        blobHTTPHeaders: {
          blobContentType: "application/zip",
        },
      },
    );
  });

  it("should upload the stream with the expected tags and content type", async () => {
    // given
    const adapter = ApiKeysExportsAdapter.getInstance(environment);
    const payload = {
      pipe: vi.fn(),
    } as any;
    mocks.uploadStream.mockResolvedValueOnce(undefined);

    // when
    await expect(
      adapter.finalizeFile(
        "aggregatorId",
        "userId",
        "file.zip",
        payload,
        "application/zip",
      ),
    ).resolves.toBeUndefined();

    // then
    expect(mocks.getBlockBlobClient).toHaveBeenCalledOnce();
    expect(mocks.getBlockBlobClient).toHaveBeenCalledWith("file.zip");
    expect(mocks.uploadStream).toHaveBeenCalledOnce();
    expect(mocks.uploadStream).toHaveBeenCalledWith(
      payload,
      undefined,
      undefined,
      {
        tags: {
          institutionId: "aggregatorId",
          userId: "userId",
          state: FileStateEnum.DONE,
        },
        blobHTTPHeaders: {
          blobContentType: "application/zip",
        },
      },
    );
  });
});

describe("markFileAsFailed", () => {
  const environment = {
    SA_EXT_BLOB_ENDPOINT: "https://account.blob.core.windows.net",
    EXPORTS_API_KEYS_CONTAINER_NAME: "api-keys-exports",
    EXPORTS_API_KEYS_DURATION_IN_HOURS: 24,
  };

  it("should throw ManagedInternalError when setTags fails", async () => {
    // given
    const adapter = ApiKeysExportsAdapter.getInstance(environment);
    mocks.setTags.mockRejectedValueOnce(new Error("set tags failed"));

    // when and then
    await expect(
      adapter.markFileAsFailed("file.zip", "aggregatorId", "userId"),
    ).rejects.toThrowError("Error marking file `file.zip` as failed");
    expect(mocks.getBlockBlobClient).toHaveBeenCalledOnce();
    expect(mocks.getBlockBlobClient).toHaveBeenCalledWith("file.zip");
    expect(mocks.setTags).toHaveBeenCalledOnce();
    expect(mocks.setTags).toHaveBeenCalledWith({
      state: FileStateEnum.FAILED,
      institutionId: "aggregatorId",
      userId: "userId",
    });
  });

  it("should set the state tag to FAILED", async () => {
    // given
    const adapter = ApiKeysExportsAdapter.getInstance(environment);
    mocks.setTags.mockResolvedValueOnce(undefined);

    // when
    await expect(
      adapter.markFileAsFailed("file.zip", "aggregatorId", "userId"),
    ).resolves.toBeUndefined();

    // then
    expect(mocks.getBlockBlobClient).toHaveBeenCalledOnce();
    expect(mocks.getBlockBlobClient).toHaveBeenCalledWith("file.zip");
    expect(mocks.setTags).toHaveBeenCalledOnce();
    expect(mocks.setTags).toHaveBeenCalledWith({
      state: FileStateEnum.FAILED,
      institutionId: "aggregatorId",
      userId: "userId",
    });
  });
});
