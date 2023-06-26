import { afterEach, describe, expect, it, vi } from "vitest";
import { Container, ItemResponse } from "@azure/cosmos";
import { ServiceLifecycle } from "../..";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { createCosmosStore } from "../fsm/store.cosmos";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

const anItem = {
  id: "anItemId" as NonEmptyString,
  data: {
    name: "a service",
    description: "a description",
    organization: {
      name: "org",
      fiscal_code: "00000000000",
    },
    metadata: {
      scope: "LOCAL",
    },
    authorized_recipients: ["AAAAAA00A00A000A"],
    authorized_cidrs: [],
  },
  fsm: { state: "approved" },
} as unknown as ServiceLifecycle.ItemType;

const aFetchElement = {
  statusCode: 200,
  resource: { ...anItem, _ts: 1687787624, _etag: "anEtag" },
} as unknown as ItemResponse<ServiceLifecycle.ItemType>;

describe("store cosmos tests", () => {
  it("result should be some on fetch having status 200", async () => {
    const containerMock = {
      item: vi.fn((a: string, b: string) => ({
        read: vi.fn().mockResolvedValue(aFetchElement),
      })),
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);

    const result = await store.fetch("anItemId")();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(O.isSome(result.right)).toBeTruthy();
    }
  });

  it("result should be none on fetch having status 404", async () => {
    const containerMock = {
      item: vi.fn((a: string, b: string) => ({
        read: vi.fn().mockResolvedValue({ ...aFetchElement, statusCode: 404 }),
      })),
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);

    const result = await store.fetch("anItemId")();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(O.isNone(result.right)).toBeTruthy();
    }
  });

  it("result should be Either left when an error occurs while fetching", async () => {
    const containerMock = {
      item: vi.fn((a: string, b: string) => ({
        read: vi.fn().mockResolvedValue({
          resource: { bad_prop_one: "bad_prop_one", _ts: 1687787624 },
          statusCode: 200,
        }),
      })),
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);

    const result = await store.fetch("anItemId")();

    expect(E.isLeft(result)).toBeTruthy();
  });

  it("result should contain some on bulkFetch elements have status 200", async () => {
    const bulkFetchResult = [
      {
        resourceBody: {
          ...anItem,
          _ts: 1687787624,
          _etag: "anEtag",
        },
        statusCode: 200,
      },
    ];
    const containerMock = {
      items: {
        bulk: vi.fn().mockResolvedValue(bulkFetchResult),
      },
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);

    const result = await store.bulkFetch(["anItemId"])();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toHaveLength(1);
      expect(O.isSome(result.right[0])).toBeTruthy();
    }
  });

  it("result should contain none on bulkFetch elements have status 404", async () => {
    const bulkFetchResult = [
      {
        statusCode: 404,
      },
    ];
    const containerMock = {
      items: {
        bulk: vi.fn().mockResolvedValue(bulkFetchResult),
      },
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);

    const result = await store.bulkFetch(["anItemId"])();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toHaveLength(1);
      expect(O.isNone(result.right[0])).toBeTruthy();
    }
  });

  it("result should be none on bulkFetch bad items", async () => {
    const bulkFetchResult = [
      {
        resourceBody: {
          bad_prop: "bad prop",
          _ts: 1687787624,
          _etag: "anEtag",
        },
        statusCode: 200,
      },
    ];
    const containerMock = {
      items: {
        bulk: vi.fn().mockResolvedValue(bulkFetchResult),
      },
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);

    const result = await store.bulkFetch(["anItemId"])();
    console.log(`result vvvv: ${JSON.stringify(result)}`);

    if (E.isRight(result)) {
      expect(result.right).toHaveLength(1);
      expect(O.isNone(result.right[0])).toBeTruthy();
    }
  });
});
