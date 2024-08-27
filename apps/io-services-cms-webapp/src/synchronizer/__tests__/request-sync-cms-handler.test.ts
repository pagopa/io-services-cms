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

import { IConfig } from "../../config";
import { SYNC_FROM_LEGACY } from "../../utils/synchronizer";
import { handleQueueItem } from "../request-sync-cms-handler";

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  }) as unknown as Context;

const aBaseServiceLifecycleItem = {
  data: {
    authorized_cidrs: [],
    authorized_recipients: [],
    description: "aServiceDescription",
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    name: "aServiceLifecycleName",
    organization: {
      fiscal_code: "12345678901",
      name: "anOrganizationName",
    },
    require_secure_channel: false,
  },
  fsm: { state: "approved" },
  id: "aServiceLifecycleId",
};

const aServiceLifecycleItem = {
  ...aBaseServiceLifecycleItem,
  data: {
    ...aBaseServiceLifecycleItem.data,
    metadata: { ...aBaseServiceLifecycleItem.data.metadata, topic_id: 123 },
  },
} as ServiceLifecycle.ItemType;

const aRequestServiceLifecycleSync = {
  ...aBaseServiceLifecycleItem,
  kind: "LifecycleItemType",
} as unknown as Queue.RequestSyncCmsItem;

const aBaseServicePublicationItem = {
  data: {
    authorized_cidrs: [],
    authorized_recipients: [],
    description: "aServiceDescription",
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    name: "aServicePublicationName",
    organization: {
      fiscal_code: "12345678901",
      name: "anOrganizationName",
    },
    require_secure_channel: false,
  },
  fsm: { state: "published" },
  id: "aServicePublicationId",
} as unknown as Queue.RequestSyncCmsItem;

const aServicePublicationItem = {
  ...aBaseServicePublicationItem,
  data: {
    ...aBaseServicePublicationItem.data,
    metadata: { ...aBaseServicePublicationItem.data.metadata, topic_id: 456 },
  },
} as ServicePublication.ItemType;

const aRequestServicePublicationSync = {
  ...aBaseServicePublicationItem,
  kind: "PublicationItemType",
} as unknown as Queue.RequestSyncCmsItem;

const aMokedConfig = {
  LEGACY_SYNC_DEFAULT_TOPIC_ID: 0,
} as unknown as IConfig;

const mockFsmLifecycleClient = {
  fetch: vi.fn(() => TE.right(O.some(aServiceLifecycleItem))),
  override: vi.fn(() =>
    TE.right({
      data: aRequestServiceLifecycleSync.data,
      fsm: aRequestServiceLifecycleSync.fsm,
      id: aRequestServiceLifecycleSync.id,
    } as ServiceLifecycle.ItemType),
  ),
} as unknown as ServiceLifecycle.FsmClient;

const mockFsmPublicationClient = {
  getStore: vi.fn(() => ({
    fetch: vi.fn(() => TE.right(O.some(aServicePublicationItem))),
  })),
  override: vi.fn(() => TE.right(aServiceLifecycleItem)),
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
        mockFsmPublicationClient,
        aMokedConfig,
      )(),
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
        mockFsmPublicationClient,
        aMokedConfig,
      )(),
    ).rejects.toThrowError("Error while parsing incoming message");
  });

  it("should override a Service Lifecycle Item with Legacy tag", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      [aRequestServiceLifecycleSync] as unknown as Json,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      aMokedConfig,
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
      },
    );
  });

  it("should override a Service Publication Item with Legacy tag", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      [aRequestServicePublicationSync] as unknown as Json,
      mockFsmLifecycleClient,
      mockFsmPublicationClient,
      aMokedConfig,
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
      },
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
      mockFsmPublicationClient,
      aMokedConfig,
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
      },
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
      },
    );
  });

  it("should result in error when at least an error occurs processing the items", async () => {
    const context = createContext();

    const mockFsmPublicationClientError = {
      getStore: vi.fn(() => ({
        fetch: vi.fn(() => TE.right(O.some(aServicePublicationItem))),
      })),
      override: vi.fn(() => TE.left(new Error("Bad Error occurs"))),
    } as unknown as ServicePublication.FsmClient;

    await expect(() =>
      handleQueueItem(
        context,
        [
          aRequestServiceLifecycleSync,
          aRequestServicePublicationSync,
        ] as unknown as Json,
        mockFsmLifecycleClient,
        mockFsmPublicationClientError,
        aMokedConfig,
      )(),
    ).rejects.toThrowError("Bad Error occurs");
  });

  it("should not execute the second item in case the first fails", async () => {
    const context = createContext();

    const mockFsmLifecycleClientError = {
      fetch: vi.fn(() => TE.right(O.some(aServiceLifecycleItem))),
      override: vi.fn(() => TE.left(new Error("Bad Error occurs"))),
    } as unknown as ServiceLifecycle.FsmClient;

    await expect(() =>
      handleQueueItem(
        context,
        [
          aRequestServiceLifecycleSync,
          aRequestServicePublicationSync,
        ] as unknown as Json,
        mockFsmLifecycleClientError,
        mockFsmPublicationClient,
        aMokedConfig,
      )(),
    ).rejects.toThrowError("Bad Error occurs");

    expect(mockFsmPublicationClient.override).not.toBeCalled();
  });

  it("should use the default topic while sync and no item is found on serviceLifecycle collection", async () => {
    const context = createContext();

    const mockFsmLifecycleNoItemClient = {
      fetch: vi.fn(() => TE.right(O.none)),
      override: vi.fn(() =>
        TE.right({
          data: aRequestServiceLifecycleSync.data,
          fsm: aRequestServiceLifecycleSync.fsm,
          id: aRequestServiceLifecycleSync.id,
        } as ServiceLifecycle.ItemType),
      ),
    } as unknown as ServiceLifecycle.FsmClient;

    await handleQueueItem(
      context,
      [aRequestServiceLifecycleSync] as unknown as Json,
      mockFsmLifecycleNoItemClient,
      mockFsmPublicationClient,
      aMokedConfig,
    )();

    expect(mockFsmLifecycleNoItemClient.override).toBeCalledTimes(1);
    expect(mockFsmLifecycleNoItemClient.override).toBeCalledWith(
      aServiceLifecycleItem.id,
      {
        ...aServiceLifecycleItem,
        data: {
          ...aServiceLifecycleItem.data,
          metadata: {
            ...aServiceLifecycleItem.data.metadata,
            topic_id: aMokedConfig.LEGACY_SYNC_DEFAULT_TOPIC_ID,
          },
        },
        fsm: {
          ...aServiceLifecycleItem.fsm,
          lastTransition: SYNC_FROM_LEGACY,
        },
      },
    );
  });

  it("should use the default topic while sync and no item is found on serviceLifecycle and servicePublication collection", async () => {
    const context = createContext();

    const mockFsmLifecycleNoItemClient = {
      fetch: vi.fn(() => TE.right(O.none)),
      override: vi.fn(() =>
        TE.right({
          data: aRequestServiceLifecycleSync.data,
          fsm: aRequestServiceLifecycleSync.fsm,
          id: aRequestServiceLifecycleSync.id,
        } as ServiceLifecycle.ItemType),
      ),
    } as unknown as ServiceLifecycle.FsmClient;

    const mockFsmPublicationNoItemClient = {
      getStore: vi.fn(() => ({
        fetch: vi.fn(() => TE.right(O.none)),
      })),
      override: vi.fn(() => TE.right(aServiceLifecycleItem)),
    } as unknown as ServicePublication.FsmClient;

    await handleQueueItem(
      context,
      [
        aRequestServiceLifecycleSync,
        aRequestServicePublicationSync,
      ] as unknown as Json,
      mockFsmLifecycleNoItemClient,
      mockFsmPublicationNoItemClient,
      aMokedConfig,
    )();

    expect(mockFsmPublicationNoItemClient.override).toBeCalledTimes(1);
    expect(mockFsmPublicationNoItemClient.override).toBeCalledWith(
      aServicePublicationItem.id,
      {
        ...aServicePublicationItem,
        data: {
          ...aServicePublicationItem.data,
          metadata: {
            ...aServicePublicationItem.data.metadata,
            topic_id: aMokedConfig.LEGACY_SYNC_DEFAULT_TOPIC_ID,
          },
        },
        fsm: {
          ...aServicePublicationItem.fsm,
          lastTransition: SYNC_FROM_LEGACY,
        },
      },
    );

    expect(mockFsmLifecycleNoItemClient.override).toBeCalledTimes(1);
    expect(mockFsmLifecycleNoItemClient.override).toBeCalledWith(
      aServiceLifecycleItem.id,
      {
        ...aServiceLifecycleItem,
        data: {
          ...aServiceLifecycleItem.data,
          metadata: {
            ...aServiceLifecycleItem.data.metadata,
            topic_id: aMokedConfig.LEGACY_SYNC_DEFAULT_TOPIC_ID,
          },
        },
        fsm: {
          ...aServiceLifecycleItem.fsm,
          lastTransition: SYNC_FROM_LEGACY,
        },
      },
    );
  });

  it("should use the Lifecycle Item topic_id while sync in Publication and no item is found on servicePublication collection", async () => {
    const context = createContext();

    const mockFsmPublicationNoItemClient = {
      getStore: vi.fn(() => ({
        fetch: vi.fn(() => TE.right(O.none)),
      })),
      override: vi.fn(() => TE.right(aServiceLifecycleItem)),
    } as unknown as ServicePublication.FsmClient;

    await handleQueueItem(
      context,
      [
        aRequestServiceLifecycleSync,
        aRequestServicePublicationSync,
      ] as unknown as Json,
      mockFsmLifecycleClient,
      mockFsmPublicationNoItemClient,
      aMokedConfig,
    )();

    expect(mockFsmPublicationNoItemClient.override).toBeCalledTimes(1);
    expect(mockFsmPublicationNoItemClient.override).toBeCalledWith(
      aServicePublicationItem.id,
      {
        ...aServicePublicationItem,
        data: {
          ...aServicePublicationItem.data,
          metadata: {
            ...aServicePublicationItem.data.metadata,
            topic_id: aServiceLifecycleItem.data.metadata.topic_id,
          },
        },
        fsm: {
          ...aServicePublicationItem.fsm,
          lastTransition: SYNC_FROM_LEGACY,
        },
      },
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
      },
    );
  });
});
