import * as azureStorage from "@pagopa/io-functions-commons/dist/src/utils/azure_storage";
import { BlobService } from "azure-storage";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { mockFeaturedServices } from "../__mocks__/featured-services";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { makeFeaturedServicesHandler } from "../featured-services";
import { FeaturedServices } from "../../generated/definitions/internal/FeaturedServices";

// blobService Base Mock
const mockBlobService = {} as unknown as BlobService;
const mockUpsertBlobFromObject = vi
  .spyOn(azureStorage, "getBlobAsObject")
  .mockResolvedValue(E.right(O.some(mockFeaturedServices)));

const mockedConfiguration = {
  FEATURED_ITEMS_CONTAINER_NAME: "container",
  FEATURED_SERVICES_ITEMS_FILE_NAME: "file",
} as unknown as IConfig;

describe("Get Featured Services", () => {
  it("should return featured services", async () => {
    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobService: mockBlobService,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      FeaturedServices,
      mockBlobService,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_SERVICES_ITEMS_FILE_NAME
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
    mockUpsertBlobFromObject.mockResolvedValueOnce(
      E.left(new Error(errorMessage))
    );

    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobService: mockBlobService,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      FeaturedServices,
      mockBlobService,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_SERVICES_ITEMS_FILE_NAME
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
    mockUpsertBlobFromObject.mockResolvedValueOnce(E.right(O.none));

    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobService: mockBlobService,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      FeaturedServices,
      mockBlobService,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_SERVICES_ITEMS_FILE_NAME
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
