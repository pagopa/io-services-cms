import { Queue, ServiceDetail } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Json } from "io-ts-types";
import { assert, describe, expect, it, vi } from "vitest";
import { makeInvocationContext } from "../../__tests__/utils/invocation-context";
import { CosmosHelper } from "../../utils/cosmos-helper";
import { handleQueueItem, toServiceDetail } from "../request-detail-handler";

const createContext = () => makeInvocationContext("funcname").context;

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

    expect(context.extraOutputs.set).toHaveBeenCalledWith(
      "serviceDetailDocument",
      toServiceDetail(aGenericPublicationItemType),
    );
  });

  it("[handleQueueItem] should synchronize age", async () => {
    const context = createContext();
    const publicationItemWithAge = {
      ...aGenericPublicationItemType,
      data: {
        ...aGenericPublicationItemType.data,
        age: {
          max: 65,
          min: 14,
        },
      },
    } as unknown as Queue.RequestDetailItem;

    await handleQueueItem(
      context,
      serviceDetailCosmosHelperMock,
      publicationItemWithAge,
    )();

    expect(context.extraOutputs.set).toHaveBeenCalledWith(
      "serviceDetailDocument",
      expect.objectContaining({
        age: publicationItemWithAge.data.age,
      }),
    );
  });

  it("[handleQueueItem] should handle lifecycle queue item correctly", async () => {
    const context = createContext();

    await handleQueueItem(
      context,
      serviceDetailCosmosHelperMock,
      aGenericLifecycleItemType,
    )();

    expect(serviceDetailCosmosHelperMock.fetchSingleItem).toHaveBeenCalled();

    expect(context.extraOutputs.set).toHaveBeenCalledWith(
      "serviceDetailDocument",
      toServiceDetail(aGenericLifecycleItemType),
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
      aGenericLifecycleItemType,
    )();

    expect(serviceDetailCosmosHelperMock.fetchSingleItem).toHaveBeenCalled();

    expect(context.extraOutputs.set).not.toHaveBeenCalled();
  });

  it("[toServiceDetail] should build document starting from a service", async () => {
    const result = toServiceDetail(aGenericPublicationItemType);
    const res = ServiceDetail.decode(result);
    expect(res).toStrictEqual(
      E.right(
        expect.objectContaining({
          id: aGenericPublicationItemType.id,
          name: aGenericPublicationItemType.data.name,
          description: aGenericPublicationItemType.data.description,
          require_secure_channel:
            aGenericPublicationItemType.data.require_secure_channel,
          organization: aGenericPublicationItemType.data.organization,
          metadata: aGenericPublicationItemType.data.metadata,
          kind: aGenericPublicationItemType.kind,
          cms_last_update_ts: aGenericPublicationItemType.cms_last_update_ts,
        }),
      ),
    );
  });

  it("[toServiceDetail] should map age", () => {
    const publicationItemWithAge = {
      ...aGenericPublicationItemType,
      data: {
        ...aGenericPublicationItemType.data,
        age: {
          max: 65,
          min: 14,
        },
      },
    } as unknown as Queue.RequestDetailItem;

    const result = toServiceDetail(publicationItemWithAge);
    const res = ServiceDetail.decode(result);
    expect(res).toStrictEqual(
      E.right(
        expect.objectContaining({
          age: publicationItemWithAge.data.age,
          id: publicationItemWithAge.id,
          name: publicationItemWithAge.data.name,
          description: publicationItemWithAge.data.description,
          require_secure_channel:
            publicationItemWithAge.data.require_secure_channel,
          organization: publicationItemWithAge.data.organization,
          metadata: publicationItemWithAge.data.metadata,
          kind: publicationItemWithAge.kind,
          cms_last_update_ts: publicationItemWithAge.cms_last_update_ts,
        }),
      ),
    );
  });
});
