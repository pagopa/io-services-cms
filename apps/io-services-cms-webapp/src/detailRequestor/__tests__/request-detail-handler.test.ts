import { Context } from "@azure/functions";
import { Queue, ServiceDetail } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Json } from "io-ts-types";
import { assert, describe, expect, it, vi } from "vitest";

import { CosmosHelper } from "../../utils/cosmos-helper";
import { handleQueueItem, toServiceDetail } from "../request-detail-handler";

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  }) as unknown as Context;

const serviceDetailCosmosHelperMock: CosmosHelper = {
  fetchItems: vi.fn(() => TE.right(O.none)),
  fetchSingleItem: vi.fn(() => TE.right(O.none)),
};

const aGenericPublicationItemType = {
  cms_last_update_ts: 1234567890,
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
    name: "aServiceName" as NonEmptyString,
    organization: {
      fiscal_code: "12345678901",
      name: "anOrganizationName",
    },
    require_secure_channel: false,
  },
  fsm: {
    state: "published",
  },
  id: "aServiceId",
  kind: "publication",
} as unknown as Queue.RequestDetailItem;

const aGenericLifecycleItemType = {
  cms_last_update_ts: 1234567890,
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
    name: "aServiceName" as NonEmptyString,
    organization: {
      fiscal_code: "12345678901",
      name: "anOrganizationName",
    },
    require_secure_channel: false,
  },
  fsm: {
    state: "draft",
  },
  id: "aServiceId",
  kind: "lifecycle",
} as unknown as Queue.RequestDetailItem;

const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;

describe("Service Detail Handler", () => {
  it("[handleQueueItem] should not throw when permanent error occours", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      serviceDetailCosmosHelperMock,
      anInvalidQueueItem,
    )();

    expect(
      serviceDetailCosmosHelperMock.fetchSingleItem,
    ).not.toHaveBeenCalled();
  });

  it("[handleQueueItem] should handle publication queue item correctly", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      serviceDetailCosmosHelperMock,
      aGenericPublicationItemType,
    )();

    expect(
      serviceDetailCosmosHelperMock.fetchSingleItem,
    ).not.toHaveBeenCalled();

    expect(context.bindings.serviceDetailDocument).toBe(
      JSON.stringify(toServiceDetail(aGenericPublicationItemType)),
    );
  });

  it("[handleQueueItem] should handle lifecycle queue item correctly", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      serviceDetailCosmosHelperMock,
      aGenericLifecycleItemType,
    )();

    expect(
      serviceDetailCosmosHelperMock.fetchSingleItem,
    ).toHaveBeenCalledWith();

    expect(context.bindings.serviceDetailDocument).toBe(
      JSON.stringify(toServiceDetail(aGenericLifecycleItemType)),
    );
  });

  it("[handleQueueItem] should not upsert the service on service lifecycle queue item and publication entry on db", async () => {
    const context = createContext();

    const serviceDetailCosmosHelperMockPubFound = {
      fetchItems: vi.fn(() => TE.right(O.none)),
      fetchSingleItem: vi.fn(() => TE.right(O.some("aServiceId"))),
    } as unknown as CosmosHelper;

    await handleQueueItem(
      context,
      serviceDetailCosmosHelperMockPubFound,
      aGenericLifecycleItemType,
    )();

    expect(
      serviceDetailCosmosHelperMock.fetchSingleItem,
    ).toHaveBeenCalledWith();

    expect(context.bindings.serviceDetailDocument).toBeUndefined();
  });

  it("[buildDocument] should build document starting from a service", async () => {
    const result = toServiceDetail(aGenericPublicationItemType);
    const res = ServiceDetail.decode(result);
    if (E.isRight(res)) {
      expect(res.right.id).toBe(aGenericPublicationItemType.id);
      expect(res.right.name).toBe(aGenericPublicationItemType.data.name);
      expect(res.right.description).toBe(
        aGenericPublicationItemType.data.description,
      );
      expect(res.right.require_secure_channel).toBe(
        aGenericPublicationItemType.data.require_secure_channel,
      );
      expect(res.right.organization).toBe(
        aGenericPublicationItemType.data.organization,
      );
      expect(res.right.metadata).toBe(
        aGenericPublicationItemType.data.metadata,
      );
      expect(res.right.kind).toBe(aGenericPublicationItemType.kind);
      expect(res.right.cms_last_update_ts).toBe(
        aGenericPublicationItemType.cms_last_update_ts,
      );
    } else {
      assert.fail("Expected right");
    }
  });
});
