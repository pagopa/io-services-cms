import * as blobStorageClientHelper from "../../utils/blob-storage/helper";
import { BlobServiceClient } from "@azure/storage-blob";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { mockFeaturedInstitutions } from "../__mocks__/featured-institutions";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { makeFeaturedInstitutionsNewHandler } from "../featured-institutions-new";
import { Institutions } from "../../generated/definitions/internal/Institutions";

// blobService Base Mock
const mockBlobServiceClient = {} as unknown as BlobServiceClient;
const mockUpsertBlobFromObject = vi
  .spyOn(blobStorageClientHelper, "getBlobAsObject")
  .mockReturnValue(TE.right(O.some(mockFeaturedInstitutions)));

const mockedConfiguration = {
  FEATURED_ITEMS_CONTAINER_NAME: "container",
  FEATURED_INSTITUTIONS_FILE_NAME: "file",
} as unknown as IConfig;

describe("Get Featured Institutions", () => {
  it("should return featured institutions", async () => {
    const result = await makeFeaturedInstitutionsNewHandler(
      mockedConfiguration
    )({
      ...httpHandlerInputMocks,
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      Institutions,
      mockBlobServiceClient,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_INSTITUTIONS_FILE_NAME
    );
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: mockFeaturedInstitutions,
          statusCode: 200,
        })
      )
    );
  });

  it("should return internal error", async () => {
    const errorMessage = "Error blobService";
    mockUpsertBlobFromObject.mockReturnValueOnce(
      TE.left(new Error(errorMessage))
    );

    const result = await makeFeaturedInstitutionsNewHandler(
      mockedConfiguration
    )({
      ...httpHandlerInputMocks,
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      Institutions,
      mockBlobServiceClient,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_INSTITUTIONS_FILE_NAME
    );
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 500,
            title: `An error occurred retrieving featuredInstitutions file from blobService: [${errorMessage}]`,
          },
          statusCode: 500,
        })
      )
    );
  });

  it("should return an empty list when file is not found", async () => {
    mockUpsertBlobFromObject.mockReturnValueOnce(TE.right(O.none));

    const result = await makeFeaturedInstitutionsNewHandler(
      mockedConfiguration
    )({
      ...httpHandlerInputMocks,
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      Institutions,
      mockBlobServiceClient,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_INSTITUTIONS_FILE_NAME
    );
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            institutions: [],
          },
          statusCode: 200,
        })
      )
    );
  });
});
