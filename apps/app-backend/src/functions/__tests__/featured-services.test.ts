import { BlobServiceClient } from "@azure/storage-blob";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { FeaturedServices } from "../../generated/definitions/internal/FeaturedServices";
import * as blobStorageClientHelper from "../../utils/blob-storage/helper";
import { mockFeaturedServices } from "../__mocks__/featured-services";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { makeFeaturedServicesHandler } from "../featured-services";

// blobService Base Mock
const mockBlobServiceClient = {} as unknown as BlobServiceClient;
const mockUpsertBlobFromObject = vi
  .spyOn(blobStorageClientHelper, "getBlobAsObject")
  .mockReturnValue(TE.right(O.some(mockFeaturedServices)));

const mockedConfiguration = {
  FEATURED_ITEMS_CONTAINER_NAME: "container",
  FEATURED_SERVICES_FILE_NAME: "file",
} as unknown as IConfig;

describe("Get Featured Services", () => {
  it("should return featured services", async () => {
    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      FeaturedServices,
      mockBlobServiceClient,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_SERVICES_FILE_NAME
    );
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: mockFeaturedServices,
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

    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      FeaturedServices,
      mockBlobServiceClient,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_SERVICES_FILE_NAME
    );
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 500,
            title: `An error occurred retrieving featuredServices file from blobService: [${errorMessage}]`,
          },
          statusCode: 500,
        })
      )
    );
  });

  it("should return an empty list when file is not found", async () => {
    mockUpsertBlobFromObject.mockReturnValueOnce(TE.right(O.none));

    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      FeaturedServices,
      mockBlobServiceClient,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_SERVICES_FILE_NAME
    );
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            services: [],
          },
          statusCode: 200,
        })
      )
    );
  });
});
