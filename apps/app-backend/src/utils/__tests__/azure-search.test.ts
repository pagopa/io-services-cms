import * as E from "fp-ts/Either";
import { describe, expect, it, vi } from "vitest";
import {
  ATestType,
  aValidMockedElement,
  anInvalidMockedElement,
} from "../../utils/__mocks__/azure-search-mocks";
import * as AzureIdentity from "@azure/identity";
import { makeAzureSearchClient } from "../../utils/azure-search/client";

import * as searchSDK from "@azure/search-documents";
import { AzureKeyCredential } from "@azure/search-documents";
import { DefaultAzureCredential } from "@azure/identity";

const mockSearchMethod = vi.fn().mockResolvedValue({
  results: [Promise.resolve(aValidMockedElement)],
  count: 1,
});

const mockAzureIdentity = vi
  .spyOn(AzureIdentity, "DefaultAzureCredential")
  .mockReturnValue({
    a: "s",
  } as unknown as AzureIdentity.DefaultAzureCredential);

const mockAzureSearchClientContructor = vi
  .spyOn(searchSDK, "SearchClient")
  .mockReturnValue({
    search: mockSearchMethod,
  } as unknown as searchSDK.SearchClient<object>);

describe("Azure Search Client Tests", () => {
  describe("Build Client Tests", () => {
    it("Should build a client using ApiKey", () => {
      const client = makeAzureSearchClient<ATestType>(
        ATestType,
        "anEndpoint",
        "aServiceVersion",
        "anIndexName",
        "anApiKey"
      );

      expect(mockAzureSearchClientContructor).toBeCalledWith(
        "anEndpoint",
        "anIndexName",
        new searchSDK.AzureKeyCredential("anApiKey"),
        {
          serviceVersion: "aServiceVersion",
        }
      );

      expect(client).toBeDefined();
    });

    it("Should build a client using ManagedIdentities", () => {
      const client = makeAzureSearchClient<ATestType>(
        ATestType,
        "anEndpoint",
        "aServiceVersion",
        "anIndexName"
      );

      expect(mockAzureSearchClientContructor).toBeCalledWith(
        "anEndpoint",
        "anIndexName",
        new DefaultAzureCredential(),
        {
          serviceVersion: "aServiceVersion",
        }
      );

      expect(client).toBeDefined();
    });
  });
  describe("Search call Tests", () => {
    const client = makeAzureSearchClient<ATestType>(
      ATestType,
      "anEndpoint",
      "anIndexName",
      "anApiKey"
    );
    it("Should Success and return the results", async () => {
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
        })
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
          })
        )
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
        })
      );

      expect(E.isLeft(result)).toBeTruthy();
    });
  });
});
