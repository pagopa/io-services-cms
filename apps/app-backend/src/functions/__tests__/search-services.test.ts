import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { AzureSearchClient } from "../../utils/azure-search/client";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { mockSearchServicesResult } from "../__mocks__/search-services-mock";
import { makeSearchServicesHandler } from "../search-services";
import { ServiceMinified } from "../../generated/definitions/internal/ServiceMinified";

const mockedConfiguration = {
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
} as unknown as IConfig;
const mockSearchServices = {
  fullTextSearch: vi
    .fn()
    .mockImplementation(() => TE.right(mockSearchServicesResult)),
} as AzureSearchClient<ServiceMinified>;

describe("Search Services Tests", () => {
  it("Should Return found services using default parameter for non specified ones", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
    })();

    expect(mockSearchServices.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        top: 20,
      })
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
        })
      )
    );
  });

  it("Should Return found services the provided params", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        search: "Pagam",
        scope: "NATIONAL",
        limit: "10",
        offset: "0",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServices,
    })();

    expect(mockSearchServices.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        searchText: "Pagam",
        filter: "scope eq 'NATIONAL'",
        top: 10,
        skip: 0,
      })
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
        })
      )
    );
  });

  it("Should Return Internal Server Error", async () => {
    const errorMessage = "An Error occured while searching";

    const mockSearchServicesFail = {
      fullTextSearch: vi
        .fn()
        .mockImplementation(() => TE.left(new Error(errorMessage))),
    } as AzureSearchClient<ServiceMinified>;

    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        search: "Pagam",
        scope: "NATIONAL",
        limit: "10",
        offset: "0",
      },
    };

    const result = await makeSearchServicesHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchServicesFail,
    })();

    expect(mockSearchServicesFail.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        searchText: "Pagam",
        filter: "scope eq 'NATIONAL'",
        top: 10,
        skip: 0,
      })
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 500,
            title: `${errorMessage}`,
          },
          statusCode: 500,
        })
      )
    );
  });

  it("Should Return Bad Request on bad query parameters", async () => {
    const errorMessage = "An Error occured while searching";

    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        scope: "NATIONAL",
        limit: "notValid",
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
            title: 'Invalid "limit" supplied in request query',
          },
          statusCode: 400,
        })
      )
    );
  });
});
