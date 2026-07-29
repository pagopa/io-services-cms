import { BlobServiceClient } from "@azure/storage-blob";
import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  FF_SUITABLE_FOR_MINORS_ENABLED: true,
} as unknown as IConfig;
const mockedConfigurationAgeFilterDisabled = {
  ...mockedConfiguration,
  FF_SUITABLE_FOR_MINORS_ENABLED: false,
} as unknown as IConfig;

const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64");
const buildXUserHeaders = (dateOfBirth: string) => ({
  "x-user": encode({
    date_of_birth: dateOfBirth,
    family_name: "Rossi",
    fiscal_code: "TMMEXQ60A10Y526X",
    name: "Mario",
    spid_level: "https://www.spid.gov.it/SpidL2",
  }),
});
const buildRequest = (headers: Record<string, string>): H.HttpRequest => ({
  ...H.request("mockurl"),
  headers,
});
// on the frozen clock below (2026-07-29): a minor (16) and an adult (20)
const A_MINOR_DOB = "2010-03-01";
const AN_ADULT_DOB = "2006-03-01";

describe("Get Featured Services", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return only the age-suitable services for a minor when the FF is enabled", async () => {
    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: buildRequest(buildXUserHeaders(A_MINOR_DOB)),
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.statusCode).toBe(200);
      const { services } = result.right.body as FeaturedServices;
      expect(services.map((service) => service.id)).toEqual(["s1ServiceId"]);
      services.forEach((service) =>
        expect(service).not.toHaveProperty("age"),
      );
    }
  });

  it("should return the adults-only services for an adult user when the FF is enabled", async () => {
    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: buildRequest(buildXUserHeaders(AN_ADULT_DOB)),
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.statusCode).toBe(200);
      const { services } = result.right.body as FeaturedServices;
      expect(services.map((service) => service.id)).toEqual([
        "s2ServiceId",
        "s3ServiceId",
      ]);
      services.forEach((service) =>
        expect(service).not.toHaveProperty("age"),
      );
    }
  });

  it("should return the full list unfiltered (without age) when the FF is disabled", async () => {
    const result = await makeFeaturedServicesHandler(
      mockedConfigurationAgeFilterDisabled,
    )({
      ...httpHandlerInputMocks,
      input: buildRequest(buildXUserHeaders(A_MINOR_DOB)),
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.statusCode).toBe(200);
      const { services } = result.right.body as FeaturedServices;
      expect(services.map((service) => service.id)).toEqual([
        "s1ServiceId",
        "s2ServiceId",
        "s3ServiceId",
      ]);
      services.forEach((service) =>
        expect(service).not.toHaveProperty("age"),
      );
    }
  });

  it("should return 401 when the x-user header is missing", async () => {
    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: buildRequest({}),
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: expect.objectContaining({ status: 401 }),
          statusCode: 401,
        }),
      ),
    );
  });

  it("should return 401 when the x-user header is not a valid token", async () => {
    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: buildRequest({
        "x-user": Buffer.from("not-a-json").toString("base64"),
      }),
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: expect.objectContaining({ status: 401 }),
          statusCode: 401,
        }),
      ),
    );
  });

  it("should return internal error", async () => {
    const errorMessage = "Error blobService";
    mockUpsertBlobFromObject.mockReturnValueOnce(
      TE.left(new Error(errorMessage)),
    );

    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: buildRequest(buildXUserHeaders(A_MINOR_DOB)),
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 500,
            title: `An error occurred retrieving featuredServices file from blobService: [${errorMessage}]`,
          },
          statusCode: 500,
        }),
      ),
    );
  });

  it("should return an empty list when file is not found", async () => {
    mockUpsertBlobFromObject.mockReturnValueOnce(TE.right(O.none));

    const result = await makeFeaturedServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: buildRequest(buildXUserHeaders(A_MINOR_DOB)),
      blobServiceClient: mockBlobServiceClient,
    })();

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            services: [],
          },
          statusCode: 200,
        }),
      ),
    );
  });
});
