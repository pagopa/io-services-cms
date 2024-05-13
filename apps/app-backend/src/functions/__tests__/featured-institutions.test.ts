import * as azureStorage from "@pagopa/io-functions-commons/dist/src/utils/azure_storage";
import { BlobService } from "azure-storage";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { mockFeaturedInstitutions } from "../__mocks__/featured-institutions";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { makeFeaturedInstitutionsHandler } from "../featured-institutions";
import { Institutions } from "../../generated/definitions/internal/Institutions";

// blobService Base Mock
const mockBlobService = {} as unknown as BlobService;
const mockUpsertBlobFromObject = vi
  .spyOn(azureStorage, "getBlobAsObject")
  .mockResolvedValue(E.right(O.some(mockFeaturedInstitutions)));

const mockedConfiguration = {
  FEATURED_ITEMS_CONTAINER_NAME: "container",
  FEATURED_INSTITUTIONS_FILE_NAME: "file",
} as unknown as IConfig;

describe("Get Featured Institutions", () => {
  it("should return featured institutions", async () => {
    const result = await makeFeaturedInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobService: mockBlobService,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      Institutions,
      mockBlobService,
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
    mockUpsertBlobFromObject.mockResolvedValueOnce(
      E.left(new Error(errorMessage))
    );

    const result = await makeFeaturedInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobService: mockBlobService,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      Institutions,
      mockBlobService,
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
    mockUpsertBlobFromObject.mockResolvedValueOnce(E.right(O.none));

    const result = await makeFeaturedInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      blobService: mockBlobService,
    })();

    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalledWith(
      Institutions,
      mockBlobService,
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
