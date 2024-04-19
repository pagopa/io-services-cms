import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { Institution } from "../../generated/definitions/internal/Institution";
import { AzureSearchClient } from "../../utils/azure-search/client";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { mockSearchInstitutionsResult } from "../__mocks__/search-institutions-mock";
import { makeSearchInstitutionsHandler } from "../search-institutions";

const mockedConfiguration = {
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
} as unknown as IConfig;
const mockSearchInstitutions = {
  fullTextSearch: vi
    .fn()
    .mockImplementation(() => TE.right(mockSearchInstitutionsResult)),
} as AzureSearchClient<Institution>;

describe("Search Institutions Tests", () => {
  it("Should Return found institutions using default parameter for non specified ones", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: { search: "Mila" },
    };

    const result = await makeSearchInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchInstitutions,
    })();

    expect(mockSearchInstitutions.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        searchText: "Mila",
        top: 20,
      })
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            institutions: mockSearchInstitutionsResult.resources,
            count: mockSearchInstitutionsResult.count,
            limit: mockedConfiguration.PAGINATION_DEFAULT_LIMIT,
            offset: 0,
          },
          statusCode: 200,
        })
      )
    );
  });

  it("Should Return found institutions the provided params", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        search: "Mila",
        scope: "NATIONAL",
        limit: "10",
        offset: "0",
      },
    };

    const result = await makeSearchInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchInstitutions,
    })();

    expect(mockSearchInstitutions.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        searchText: "Mila",
        filter: "scope eq 'NATIONAL'",
        top: 10,
        skip: 0,
      })
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            institutions: mockSearchInstitutionsResult.resources,
            count: mockSearchInstitutionsResult.count,
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

    const mockSearchInstitutionsFail = {
      fullTextSearch: vi
        .fn()
        .mockImplementation(() => TE.left(new Error(errorMessage))),
    } as AzureSearchClient<Institution>;

    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        search: "Mila",
        scope: "NATIONAL",
        limit: "10",
        offset: "0",
      },
    };

    const result = await makeSearchInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchInstitutionsFail,
    })();

    expect(mockSearchInstitutionsFail.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        searchText: "Mila",
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

  it("Should Return Bad Request on bad/lacking query parameters", async () => {
    const errorMessage = "An Error occured while searching";

    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        scope: "NATIONAL",
        limit: "notValid",
        offset: "0",
      },
    };

    const result = await makeSearchInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchInstitutions,
    })();

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            status: 400,
            title: 'Missing "search" in request query',
          },
          statusCode: 400,
        })
      )
    );
  });
});
