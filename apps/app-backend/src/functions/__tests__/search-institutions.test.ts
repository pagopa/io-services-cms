import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { Institution } from "../../generated/definitions/internal/Institution";
import { AzureSearchClient } from "../../utils/azure-search/client";
import { httpHandlerInputMocks } from "../__mocks__/handler-mocks";
import { mockSearchInstitutionsResult } from "../__mocks__/search-institutions-mock";
import {
  DEFAULT_ORDER_BY,
  makeSearchInstitutionsHandler,
} from "../search-institutions";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

const mockedConfiguration = {
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
  PAGINATION_MAX_OFFSET: 100,
  PAGINATION_MAX_OFFSET_AI_SEARCH: 100000,
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
    };

    const result = await makeSearchInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchInstitutions,
    })();

    expect(mockSearchInstitutions.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        orderBy: [DEFAULT_ORDER_BY],
        top: 20,
      }),
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
        }),
      ),
    );
  });

  it("Should Return PAGINATION_MAX_OFFSET as count when exceed PAGINATION_MAX_OFFSET with a full text query", async () => {
    const mockSearchInstitutionsExceedCount = {
      fullTextSearch: vi.fn().mockImplementation(() =>
        TE.right({
          ...mockSearchInstitutionsResult,
          count:
            mockedConfiguration.PAGINATION_MAX_OFFSET +
            mockedConfiguration.PAGINATION_DEFAULT_LIMIT +
            20,
        }),
      ),
    } as AzureSearchClient<Institution>;

    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        search: "Mila",
      },
    };

    const result = await makeSearchInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchInstitutionsExceedCount,
    })();

    expect(mockSearchInstitutions.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        orderBy: [DEFAULT_ORDER_BY],
        top: 20,
      }),
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            institutions: mockSearchInstitutionsResult.resources,
            count: mockedConfiguration.PAGINATION_MAX_OFFSET,
            limit: mockedConfiguration.PAGINATION_DEFAULT_LIMIT,
            offset: 0,
          },
          statusCode: 200,
        }),
      ),
    );
  });

  it("Should Return PAGINATION_MAX_OFFSET_AI_SEARCH as count when exceed PAGINATION_MAX_OFFSET_AI_SEARCH without a full text query", async () => {
    const mockSearchInstitutionsExceedCount = {
      fullTextSearch: vi.fn().mockImplementation(() =>
        TE.right({
          ...mockSearchInstitutionsResult,
          count:
            mockedConfiguration.PAGINATION_MAX_OFFSET_AI_SEARCH +
            mockedConfiguration.PAGINATION_DEFAULT_LIMIT +
            20,
        }),
      ),
    } as AzureSearchClient<Institution>;

    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
    };

    const result = await makeSearchInstitutionsHandler(mockedConfiguration)({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchInstitutionsExceedCount,
    })();

    expect(mockSearchInstitutions.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        orderBy: [DEFAULT_ORDER_BY],
        top: 20,
      }),
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            institutions: mockSearchInstitutionsResult.resources,
            count: mockedConfiguration.PAGINATION_MAX_OFFSET_AI_SEARCH,
            limit: mockedConfiguration.PAGINATION_DEFAULT_LIMIT,
            offset: 0,
          },
          statusCode: 200,
        }),
      ),
    );
  });

  it("Should Return found institutions for the provided params", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        search: "Mila",
        scope: "LOCAL",
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
        filter: "scope eq 'LOCAL'",
        top: 10,
        skip: 0,
        orderBy: undefined,
      }),
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
        }),
      ),
    );
  });

  it("Should Use the default orderBy When request params not contains search", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
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
        filter: "scope eq 'NATIONAL'",
        top: 10,
        skip: 0,
        orderBy: [DEFAULT_ORDER_BY],
      }),
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
        }),
      ),
    );
  });

  it("Should Use ScoringProfile when configured", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        search: "Age",
      },
    };

    const result = await makeSearchInstitutionsHandler({
      ...mockedConfiguration,
      AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PROFILE:
        "aScoringProfile" as NonEmptyString,
      AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PARAMETER:
        "aTag-aValue" as NonEmptyString,
    })({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchInstitutions,
    })();

    expect(mockSearchInstitutions.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        searchText: "Age",
        scoringProfile: "aScoringProfile",
        scoringParameters: ["aTag-aValue"],
        orderBy: undefined,
      }),
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            institutions: mockSearchInstitutionsResult.resources,
            count: mockSearchInstitutionsResult.count,
            limit: 20,
            offset: 0,
          },
          statusCode: 200,
        }),
      ),
    );
  });

  it("Should Not Use ScoringProfile when not properly configured", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        search: "Age",
      },
    };
    // BTW Only AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PROFILE is configured
    // Lack of parameter AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PARAMETER
    const result = await makeSearchInstitutionsHandler({
      ...mockedConfiguration,
      AZURE_SEARCH_INSTITUTIONS_SCOPE_SCORING_PROFILE:
        "aScoringProfile" as NonEmptyString,
    })({
      ...httpHandlerInputMocks,
      input: req,
      searchClient: mockSearchInstitutions,
    })();

    expect(mockSearchInstitutions.fullTextSearch).toBeCalledWith(
      expect.objectContaining({
        searchText: "Age",
        orderBy: undefined,
      }),
    );

    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: {
            institutions: mockSearchInstitutionsResult.resources,
            count: mockSearchInstitutionsResult.count,
            limit: 20,
            offset: 0,
          },
          statusCode: 200,
        }),
      ),
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
        orderBy: undefined,
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
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        scope: "NATIONAL",
        limit: "notValid",
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
            title: "Invalid 'limit' supplied in request query",
          },
          statusCode: 400,
        }),
      ),
    );
  });

  it("Should Return Bad Request when offset is greater than max allowed with a full text query", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        search: "Mila",
        limit: "10",
        offset: `${mockedConfiguration.PAGINATION_MAX_OFFSET + 1}`,
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
            title: "Invalid 'offset' supplied in request query",
          },
          statusCode: 400,
        }),
      ),
    );
  });

  it("Should Return Bad Request when offset is greater than max allowed without a full text query", async () => {
    const req: H.HttpRequest = {
      ...H.request("127.0.0.1"),
      query: {
        scope: "NATIONAL",
        limit: "10",
        offset: `${mockedConfiguration.PAGINATION_MAX_OFFSET_AI_SEARCH + 1}`,
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
            title: "Invalid 'offset' supplied in request query",
          },
          statusCode: 400,
        }),
      ),
    );
  });
});
