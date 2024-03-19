/* eslint-disable no-console */
import { Context } from "@azure/functions";
import { ServicePublication } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { Json } from "io-ts-types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleQueueItem } from "../request-deletion-handler";

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  } as unknown as Context);

const deleteMock = vi.fn((id: NonEmptyString) => {
  return TE.of(void 0);
});
const mockFsmPublicationClient = {
  getStore: vi.fn(() => ({
    delete: deleteMock,
  })),
} as unknown as ServicePublication.FsmClient;

const aServiceId = "aServiceId" as NonEmptyString;
const aValidQueueItem = { id: aServiceId } as unknown as Json;
const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;

describe("Service Deletion Handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  // Avoid retry on permanent error
  it("handleQueueItem should not throw when permanent error occours", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      anInvalidQueueItem,
      mockFsmPublicationClient
    )();

    expect(mockFsmPublicationClient.getStore).toBeCalledTimes(0);
  });

  it("should delete the item when a valid item is received on queue", async () => {
    const context = createContext();

    await handleQueueItem(context, aValidQueueItem, mockFsmPublicationClient)();
    expect(mockFsmPublicationClient.getStore).toBeCalledTimes(1);
    expect(deleteMock).toBeCalledWith(aServiceId);
  });

  it("should throw on non permanent error(transient error)", async () => {
    const context = createContext();

    const mockFsmPublicationClientFailure = {
      getStore: vi.fn(() => ({
        delete: vi.fn((id: NonEmptyString) => {
          return TE.left(new Error("A transient error"));
        }),
      })),
    } as unknown as ServicePublication.FsmClient;

    await expect(() =>
      handleQueueItem(
        context,
        aValidQueueItem,
        mockFsmPublicationClientFailure
      )()
    ).rejects.toThrowError("A transient error");
  });
});
