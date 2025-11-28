import * as E from "fp-ts/Either";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ATestType,
  aValidMockedElement,
  anInvalidMockedElement,
} from "../../utils/__mocks__/azure-search-mocks";
import { makeAzureSearchClient } from "../../utils/azure-search/client";

import { DefaultAzureCredential } from "@azure/identity";
import * as searchSDK from "@azure/search-documents";

const mockSearchMethod = vi.fn();
const getDocumentsCountMock = vi.fn();

const mockAzureSearchClientContructor = vi
  .spyOn(searchSDK, "SearchClient")
  .mockReturnValue({
    search: mockSearchMethod,
    getDocumentsCount: getDocumentsCountMock,
  } as unknown as searchSDK.SearchClient<object>);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Azure Search Client Tests", () => {
  describe("Build Client Tests", () => {
    it("Should build a client using ApiKey", () => {
      const client = makeAzureSearchClient<ATestType>(
        ATestType,
        "anEndpoint",
        "aServiceVersion",
        "anIndexName",
        "anApiKey",
      );

      expect(mockAzureSearchClientContructor).toBeCalledWith(
        "anEndpoint",
        "anIndexName",
        new searchSDK.AzureKeyCredential("anApiKey"),
        {
          serviceVersion: "aServiceVersion",
        },
      );

      expect(client).toBeDefined();
    });

    it("Should build a client using ManagedIdentities", () => {
      const client = makeAzureSearchClient<ATestType>(
        ATestType,
        "anEndpoint",
        "aServiceVersion",
        "anIndexName",
      );

      expect(mockAzureSearchClientContructor).toBeCalledWith(
        "anEndpoint",
        "anIndexName",
        expect.any(DefaultAzureCredential),
        {
          serviceVersion: "aServiceVersion",
        },
      );

      expect(client).toBeDefined();
    });
  });
  describe("Search call Tests", () => {
    const client = makeAzureSearchClient<ATestType>(
      ATestType,
      "anEndpoint",
      "anIndexName",
      "anApiKey",
    );
    it("Should Success and return the results", async () => {
      mockSearchMethod.mockResolvedValue({
        results: [Promise.resolve(aValidMockedElement)],
        count: 1,
      });

      const result = await client.fullTextSearch({
        searchText: "aSearchText",
        searchParams: ["a"],
        top: 10,
      })();

      expect(mockSearchMethod).toBeCalledWith(
        "aSearchText",
        expect.objectContaining({
          searchFields: ["a"],
          top: 10,
        }),
      );

      expect(result).toEqual(
        E.right(
          expect.objectContaining({
            resources: [
              {
                a: "a",
                b: 1,
              },
            ],
            count: 1,
          }),
        ),
      );
    });

    it("Should Fail when bad items are retrieved", async () => {
      mockSearchMethod.mockResolvedValueOnce({
        results: [Promise.resolve(anInvalidMockedElement)],
        count: 1,
      });

      const result = await client.fullTextSearch({
        searchText: "aSearchText",
        searchParams: ["a"],
        top: 10,
      })();

      expect(mockSearchMethod).toBeCalledWith(
        "aSearchText",
        expect.objectContaining({
          searchFields: ["a"],
          top: 10,
        }),
      );

      expect(E.isLeft(result)).toBeTruthy();
    });
  });

  describe("getDocumentCount", () => {
    const client = makeAzureSearchClient<ATestType>(
      ATestType,
      "anEndpoint",
      "anIndexName",
      "anApiKey",
    );

    it("Should Fail when downstram API call fail", async () => {
      getDocumentsCountMock.mockRejectedValueOnce(new Error());

      const result = await client.getDocumentCount()();

      expect(getDocumentsCountMock).toHaveBeenCalledOnce();
      expect(getDocumentsCountMock).toHaveBeenCalledWith();

      expect(E.isLeft(result)).toBeTruthy();
    });

    it("Should succeed and return the document counts", async () => {
      const documentCount = 1;
      getDocumentsCountMock.mockResolvedValueOnce(documentCount);

      const result = await client.getDocumentCount()();

      expect(getDocumentsCountMock).toHaveBeenCalledOnce();
      expect(getDocumentsCountMock).toHaveBeenCalledWith();

      expect(result).toEqual(E.right(documentCount));
    });
  });
});
