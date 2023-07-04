import { Context } from "@azure/functions";
import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import * as TE from "fp-ts/lib/TaskEither";
import { Json } from "io-ts-types";
import { afterEach, describe, expect, it, vi } from "vitest";
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
} as unknown as ServiceLifecycle.FsmClient;

const mockFsmPublicationClient = {
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
        mockFsmPublicationClient
      )()
    ).rejects.toThrowError("Error while parsing incoming message");
  });

  it("should override a Service Lifecycle Item with Legacy tag", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      aRequestServiceLifecycleSync as unknown as Json,
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
          lastTransition: "from Legacy",
        },
      }
    );
  });

  it("should override a Service Publication Item with Legacy tag", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      aRequestServicePublicationSync as unknown as Json,
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
          lastTransition: "from Legacy",
        },
      }
    );
  });
});
