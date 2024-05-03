import { Context } from "@azure/functions";
import { Queue, ServiceDetail } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { Json } from "io-ts-types";
import { assert, describe, expect, it, vi } from "vitest";
import { handleQueueItem, toServiceDetail } from "../request-detail-handler";
import { CosmosHelper } from "../../utils/cosmos-helper";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  } as unknown as Context);

const serviceDetailCosmosHelperMock: CosmosHelper = {
  fetchSingleItem: vi.fn(() => TE.right(O.none)),
  fetchItems: vi.fn(() => TE.right(O.none)),
};

const aGenericPublicationItemType = {
  id: "aServiceId",
  data: {
    name: "aServiceName" as NonEmptyString,
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
  fsm: {
    state: "published",
  },
  kind: "publication",
  cms_last_update_ts: 1234567890,
} as unknown as Queue.RequestDetailItem;

const aGenericLifecycleItemType = {
  id: "aServiceId",
  data: {
    name: "aServiceName" as NonEmptyString,
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
  fsm: {
    state: "draft",
  },
  kind: "lifecycle",
  cms_last_update_ts: 1234567890,
} as unknown as Queue.RequestDetailItem;

const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;

describe("Service Detail Handler", () => {
  it("[handleQueueItem] should return an Error if queueItem is invalid", async () => {
    const context = createContext();

    try {
      await handleQueueItem(
        context,
        serviceDetailCosmosHelperMock,
        anInvalidQueueItem
      )();
    } catch (error) {
      expect(error.message).toBeDefined();
    }
  });

  it("[handleQueueItem] should handle publication queue item correctly", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      serviceDetailCosmosHelperMock,
      aGenericPublicationItemType
    )();

    expect(
      serviceDetailCosmosHelperMock.fetchSingleItem
    ).not.toHaveBeenCalled();

    expect(context.bindings.serviceDetailDocument).toBe(
      JSON.stringify(toServiceDetail(aGenericPublicationItemType))
    );
  });

  it("[handleQueueItem] should handle lifecycle queue item correctly", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      serviceDetailCosmosHelperMock,
      aGenericLifecycleItemType
    )();

    expect(serviceDetailCosmosHelperMock.fetchSingleItem).toHaveBeenCalled();

    expect(context.bindings.serviceDetailDocument).toBe(
      JSON.stringify(toServiceDetail(aGenericLifecycleItemType))
    );
  });

  it("[handleQueueItem] should not upsert the service on service lifecycle queue item and publication entry on db", async () => {
    const context = createContext();

    const serviceDetailCosmosHelperMockPubFound = {
      fetchSingleItem: vi.fn(() => TE.right(O.some("aServiceId"))),
      fetchItems: vi.fn(() => TE.right(O.none)),
    } as unknown as CosmosHelper;

    await handleQueueItem(
      context,
      serviceDetailCosmosHelperMockPubFound,
      aGenericLifecycleItemType
    )();

    expect(serviceDetailCosmosHelperMock.fetchSingleItem).toHaveBeenCalled();

    expect(context.bindings.serviceDetailDocument).toBeUndefined();
  });

  it("[buildDocument] should build document starting from a service", async () => {
    const result = toServiceDetail(aGenericPublicationItemType);
    const res = ServiceDetail.decode(result);
    if (E.isRight(res)) {
      expect(res.right.id).toBe(aGenericPublicationItemType.id);
      expect(res.right.name).toBe(aGenericPublicationItemType.data.name);
      expect(res.right.description).toBe(
        aGenericPublicationItemType.data.description
      );
      expect(res.right.require_secure_channel).toBe(
        aGenericPublicationItemType.data.require_secure_channel
      );
      expect(res.right.organization).toBe(
        aGenericPublicationItemType.data.organization
      );
      expect(res.right.metadata).toBe(
        aGenericPublicationItemType.data.metadata
      );
      expect(res.right.kind).toBe(aGenericPublicationItemType.kind);
      expect(res.right.cms_last_update_ts).toBe(
        aGenericPublicationItemType.cms_last_update_ts
      );
    } else {
      assert.fail("Expected right");
    }
  });
});
