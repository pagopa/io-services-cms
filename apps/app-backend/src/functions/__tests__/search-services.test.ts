import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { AzureSearchClient } from "../../utils/azure-search/client";
import { computeAgeFromDateOfBirth } from "../../utils/age";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { mockSearchServicesResult } from "../__mocks__/search-services-mock";
import {
  DEFAULT_ORDER_BY,
  makeSearchServicesHandler,
} from "../search-services";
import { ServiceMinified } from "../../generated/definitions/internal/ServiceMinified";

const mockedConfiguration = {
  FF_SUITABLE_FOR_MINORS_ENABLED: true,
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 101,
  PAGINATION_MAX_OFFSET_AI_SEARCH: 101,
} as unknown as IConfig;
const mockedConfigurationAgeFilterDisabled = {
  ...mockedConfiguration,
  FF_SUITABLE_FOR_MINORS_ENABLED: false,
} as unknown as IConfig;
const mockSearchServices = {
  fullTextSearch: vi
    .fn()
    .mockImplementation(() => TE.right(mockSearchServicesResult)),
  getDocumentCount: vi.fn(),
} as AzureSearchClient<ServiceMinified>;

const aValidUserIdentity = {
  date_of_birth: "2000-01-10",
  family_name: "Rossi",
  fiscal_code: "TMMEXQ60A10Y526X",
  name: "Mario",
  spid_level: "https://www.spid.gov.it/SpidL2",
};
const aValidXUserToken = Buffer.from(
  JSON.stringify(aValidUserIdentity),
).toString("base64");
// computed with the same util the handler uses, so the expected filter stays
// deterministic regardless of the day the test runs
const anExpectedUserAge = computeAgeFromDateOfBirth(
  new Date(aValidUserIdentity.date_of_birth),
);
const anAgeFilter = `ageMin le ${anExpectedUserAge} and ageMax ge ${anExpectedUserAge}`;

const aValidXUserHeaders = { "x-user": aValidXUserToken };

describe("Search Services Tests", () => {
  it("Should Return found services using default parameter for non specified ones", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      headers: aValidXUserHeaders,
      path: {
        institutionId: "01234567891",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
    })();

    expect(mockSearchServices.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        top: 20,
        orderBy: [DEFAULT_ORDER_BY],
      }),
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            services: mockSearchServicesResult.resources,
            count: mockSearchServicesResult.count,
            limit: mockedConfiguration.PAGINATION_DEFAULT_LIMIT,
            offset: 0,
          },
          statusCode: 200,
        }),
      ),
    );
  });

  it("Should Return found services for the provided params", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      headers: aValidXUserHeaders,
      query: {
        limit: "10",
        offset: "0",
      },
      path: {
        institutionId: "01234567891",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
    })();

    expect(mockSearchServices.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        filter: `orgFiscalCode eq '01234567891' and ${anAgeFilter}`,
        orderBy: [DEFAULT_ORDER_BY],
        top: 10,
        skip: 0,
      }),
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            services: mockSearchServicesResult.resources,
            count: mockSearchServicesResult.count,
            limit: 10,
            offset: 0,
          },
          statusCode: 200,
        }),
      ),
    );
  });

  it("Should Return Internal Server Error", async () => {
    const errorMessage = "An Error occured while searching";

    const mockSearchServicesFail = {
      fullTextSearch: vi
        .fn()
        .mockImplementation(() => TE.left(new Error(errorMessage))),
      getDocumentCount: vi.fn(),
    } as AzureSearchClient<ServiceMinified>;

    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      headers: aValidXUserHeaders,
      query: {
        limit: "10",
        offset: "0",
      },
      path: {
        institutionId: "01234567891",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServicesFail,
    })();

    expect(mockSearchServicesFail.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        filter: `orgFiscalCode eq '01234567891' and ${anAgeFilter}`,
        top: 10,
        skip: 0,
        orderBy: [DEFAULT_ORDER_BY],
      }),
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 500,
            title: `${errorMessage}`,
          },
          statusCode: 500,
        }),
      ),
    );
  });

  it("Should Return Bad Request on bad query parameters", async () => {
    const errorMessage = "An Error occured while searching";

    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      headers: aValidXUserHeaders,
      query: {
        limit: "notValid",
      },
      path: {
        institutionId: "01234567891",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
    })();

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 400,
            title: "Invalid 'limit' supplied in request query",
          },
          statusCode: 400,
        }),
      ),
    );
  });

  it("Should Return Bad Request when offset is greater than max allowed", async () => {
    const errorMessage = "An Error occured while searching";

    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      headers: aValidXUserHeaders,
      query: {
        offset: `${mockedConfiguration.PAGINATION_MAX_OFFSET_AI_SEARCH + 1}`,
      },
      path: {
        institutionId: "01234567891",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
    })();

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 400,
            title: "Invalid 'offset' supplied in request query",
          },
          statusCode: 400,
        }),
      ),
    );
  });

  it("Should pass sessionId parameter when provided", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      headers: aValidXUserHeaders,
      query: {
        limit: "10",
        offset: "0",
        sessionId: "session-123",
      },
      path: {
        institutionId: "01234567891",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
    })();

    expect(mockSearchServices.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        filter: `orgFiscalCode eq '01234567891' and ${anAgeFilter}`,
        top: 10,
        skip: 0,
        orderBy: [DEFAULT_ORDER_BY],
        sessionId: "session-123",
      }),
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            services: mockSearchServicesResult.resources,
            count: mockSearchServicesResult.count,
            limit: 10,
            offset: 0,
          },
          statusCode: 200,
        }),
      ),
    );
  });

  it("Should search without the age filter when FF_SUITABLE_FOR_MINORS_ENABLED is disabled", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      headers: aValidXUserHeaders,
      query: {
        limit: "10",
        offset: "0",
      },
      path: {
        institutionId: "01234567891",
      },
    };

    const result = await makeSearchServicesHandler(
      mockedConfigurationAgeFilterDisabled,
    )({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
    })();

    expect(mockSearchServices.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        filter: "orgFiscalCode eq '01234567891'",
        orderBy: [DEFAULT_ORDER_BY],
        top: 10,
        skip: 0,
      }),
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          statusCode: 200,
        }),
      ),
    );
  });

  it("Should Return Unauthorized when the x-user header is missing", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      path: {
        institutionId: "01234567891",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
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

  it("Should Return Unauthorized when the x-user header is not a valid token", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      headers: { "x-user": Buffer.from("not-a-json").toString("base64") },
      path: {
        institutionId: "01234567891",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
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
});
