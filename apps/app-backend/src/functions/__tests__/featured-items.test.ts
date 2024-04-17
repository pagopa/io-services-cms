import * as azureStorage from "@pagopa/io-functions-commons/dist/src/utils/azure_storage";
import { BlobService } from "azure-storage";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { FeaturedItems } from "../../generated/definitions/internal/FeaturedItems";
import { mockFeaturedItems } from "../__mocks__/featured-items";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { makeFeaturedItemsHandler } from "../featured-items";

// blobService Base Mock
const mockBlobService = {} as unknown as BlobService;
const mockUpsertBlobFromObject = vi
  .spyOn(azureStorage, "getBlobAsObject")
  .mockResolvedValue(E.right(O.some(mockFeaturedItems)));

const mockedConfiguration = {
  FEATURED_ITEMS_CONTAINER_NAME: "container",
  FEATURED_ITEMS_FILE_NAME: "file",
} as unknown as IConfig;

describe("Get Featured Services And Institutions", () => {
  it("should return featured items", async () => {
    const result = await makeFeaturedItemsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobService: mockBlobService,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      FeaturedItems,
      mockBlobService,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_ITEMS_FILE_NAME
    );
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: mockFeaturedItems,
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

    const result = await makeFeaturedItemsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobService: mockBlobService,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      FeaturedItems,
      mockBlobService,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_ITEMS_FILE_NAME
    );
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 500,
            title: `An error occurred retrieving featuredItems file from blobService: [${errorMessage}]`,
          },
          statusCode: 500,
        })
      )
    );
  });

  it("should return an empty list when file is not found", async () => {
    mockUpsertBlobFromObject.mockResolvedValueOnce(E.right(O.none));

    const result = await makeFeaturedItemsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobService: mockBlobService,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      FeaturedItems,
      mockBlobService,
      mockedConfiguration.FEATURED_ITEMS_CONTAINER_NAME,
      mockedConfiguration.FEATURED_ITEMS_FILE_NAME
    );
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            items: [],
          },
          statusCode: 200,
        })
      )
    );
  });
});
