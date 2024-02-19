import { Context } from "@azure/functions";
import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Json } from "io-ts-types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SYNC_FROM_LEGACY } from "../../utils/synchronizer";
import { handleQueueItem } from "../request-sync-cms-handler";

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  } as unknown as Context);

const aRequestServiceLifecycleSync = {
  id: "aServiceLifecycleId",
  data: {
    name: "aServiceLifecycleName",
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
    authorized_cidrs: [],
  },
  fsm: { state: "approved" },
  kind: "LifecycleItemType",
} as unknown as Queue.RequestSyncCmsItem;

const { kind: _serviceLifecycleItemType, ...aServiceLifecycleItem } =
  aRequestServiceLifecycleSync;

const aRequestServicePublicationSync = {
  id: "aServicePublicationId",
  data: {
    name: "aServicePublicationName",
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
    authorized_cidrs: [],
  },
  fsm: { state: "published" },
  kind: "PublicationItemType",
} as unknown as Queue.RequestSyncCmsItem;

const { kind: _servicePublicationItemType, ...aServicePublicationItem } =
  aRequestServicePublicationSync;

const mockFsmLifecycleClient = {
  override: vi.fn(() =>
    TE.right({
      id: aRequestServiceLifecycleSync.id,
      data: aRequestServiceLifecycleSync.data,
      fsm: aRequestServiceLifecycleSync.fsm,
    } as ServiceLifecycle.ItemType)
  ),
  fetch: vi.fn(() => TE.right(O.some(aServiceLifecycleItem))),
} as unknown as ServiceLifecycle.FsmClient;

const mockFsmPublicationClient = {
  override: vi.fn(() => TE.right(aServiceLifecycleItem)),
  getStore: vi.fn(() => ({
    fetch: vi.fn(() => TE.right(O.some(aServicePublicationItem))),
  })),
} as unknown as ServicePublication.FsmClient;

describe("Sync CMS Handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return an Error if queueItem is invalid", async () => {
    const context = createContext();
    const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;

    await expect(() =>
      handleQueueItem(
        context,
        anInvalidQueueItem,
        mockFsmLifecycleClient,
        mockFsmPublicationClient
      )()
    ).rejects.toThrowError("Error while parsing incoming message");
  });

  it("should return an Error if queueItem is not an Array of Items", async () => {
    const context = createContext();
    const anInvalidQueueItem = aRequestServiceLifecycleSync as unknown as Json;

    await expect(() =>
      handleQueueItem(
        context,
        anInvalidQueueItem,
        mockFsmLifecycleClient,
        mockFsmPublicationClient
      )()
    ).rejects.toThrowError("Error while parsing incoming message");
  });

  it("should override a Service Lifecycle Item with Legacy tag", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      [aRequestServiceLifecycleSync] as unknown as Json,
      mockFsmLifecycleClient,
      mockFsmPublicationClient
    )();

    expect(mockFsmPublicationClient.override).not.toBeCalled();
    expect(mockFsmLifecycleClient.override).toBeCalledTimes(1);
    expect(mockFsmLifecycleClient.override).toBeCalledWith(
      aServiceLifecycleItem.id,
      {
        ...aServiceLifecycleItem,
        fsm: {
          ...aServiceLifecycleItem.fsm,
          lastTransition: SYNC_FROM_LEGACY,
        },
      }
    );
  });

  it("should override a Service Publication Item with Legacy tag", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      [aRequestServicePublicationSync] as unknown as Json,
      mockFsmLifecycleClient,
      mockFsmPublicationClient
    )();

    expect(mockFsmLifecycleClient.override).not.toBeCalled();
    expect(mockFsmPublicationClient.override).toBeCalledTimes(1);
    expect(mockFsmPublicationClient.override).toBeCalledWith(
      aServicePublicationItem.id,
      {
        ...aServicePublicationItem,
        fsm: {
          ...aServicePublicationItem.fsm,
          lastTransition: SYNC_FROM_LEGACY,
        },
      }
    );
  });

  it("should override a both Service Lifecycle and Service Publication Item with Legacy tag", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      [
        aRequestServiceLifecycleSync,
        aRequestServicePublicationSync,
      ] as unknown as Json,
      mockFsmLifecycleClient,
      mockFsmPublicationClient
    )();

    expect(mockFsmPublicationClient.override).toBeCalledTimes(1);
    expect(mockFsmPublicationClient.override).toBeCalledWith(
      aServicePublicationItem.id,
      {
        ...aServicePublicationItem,
        fsm: {
          ...aServicePublicationItem.fsm,
          lastTransition: SYNC_FROM_LEGACY,
        },
      }
    );

    expect(mockFsmLifecycleClient.override).toBeCalledTimes(1);
    expect(mockFsmLifecycleClient.override).toBeCalledWith(
      aServiceLifecycleItem.id,
      {
        ...aServiceLifecycleItem,
        fsm: {
          ...aServiceLifecycleItem.fsm,
          lastTransition: SYNC_FROM_LEGACY,
        },
      }
    );
  });

  it("should result in error when at least an error occurs processing the items", async () => {
    const context = createContext();

    const mockFsmPublicationClientError = {
      override: vi.fn(() => TE.left(new Error("Bad Error occurs"))),
      getStore: vi.fn(() => ({
        fetch: vi.fn(() => TE.right(O.some(aServicePublicationItem))),
      })),
    } as unknown as ServicePublication.FsmClient;

    await expect(() =>
      handleQueueItem(
        context,
        [
          aRequestServiceLifecycleSync,
          aRequestServicePublicationSync,
        ] as unknown as Json,
        mockFsmLifecycleClient,
        mockFsmPublicationClientError
      )()
    ).rejects.toThrowError("Bad Error occurs");
  });

  it("should not execute the second item in case the first fails", async () => {
    const context = createContext();

    const mockFsmLifecycleClientError = {
      override: vi.fn(() => TE.left(new Error("Bad Error occurs"))),
      fetch: vi.fn(() => TE.right(O.some(aServiceLifecycleItem))),
    } as unknown as ServiceLifecycle.FsmClient;

    await expect(() =>
      handleQueueItem(
        context,
        [
          aRequestServiceLifecycleSync,
          aRequestServicePublicationSync,
        ] as unknown as Json,
        mockFsmLifecycleClientError,
        mockFsmPublicationClient
      )()
    ).rejects.toThrowError("Bad Error occurs");

    expect(mockFsmPublicationClient.override).not.toBeCalled();
  });
});
