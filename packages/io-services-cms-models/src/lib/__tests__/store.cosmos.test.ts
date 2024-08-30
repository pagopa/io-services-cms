import { Container, ItemResponse } from "@azure/cosmos";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vi } from "vitest";
import { ServiceLifecycle, ServicePublication } from "../..";
import { createCosmosStore } from "../fsm/store.cosmos";
import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";

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

describe("store cosmos tests", () => {
  it("result should be some on fetch having status 200", async () => {
    const recordCosmosTs = 1687787624;
    const recordLastUpdateTs = 1787787624;
    const containerMock = {
      item: vi.fn((a: string, b: string) => ({
        read: vi.fn().mockResolvedValue({
          statusCode: 200,
          resource: { ...anItem, last_update_ts: recordLastUpdateTs, _ts: recordCosmosTs, _etag: "anEtag" },
        }),
      })),
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);
    const result = await store.fetch("anItemId")();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(O.isSome(result.right)).toBeTruthy();
      if(O.isSome(result.right)){
        expect(result.right.value).toHaveProperty("last_update_ts");
        expect(result.right.value.last_update_ts).toBe(recordLastUpdateTs);
        expect(result.right.value).toHaveProperty("version");
        expect(result.right.value.version).toBe("anEtag");
      }
    }
  });

  it("result should be some on fetch having status 200 and having last_update_ts valued with _ts in case is missing", async () => {
    const recordCosmosTs = 1687787624;

    const containerMock = {
      item: vi.fn((a: string, b: string) => ({
        read: vi.fn().mockResolvedValue({
          statusCode: 200,
          resource: { ...anItem, _ts: recordCosmosTs, _etag: "anEtag" },
        }),
      })),
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);
    const result = await store.fetch("anItemId")();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(O.isSome(result.right)).toBeTruthy();
      if(O.isSome(result.right)){
        expect(result.right.value).toHaveProperty("last_update_ts");
        expect(result.right.value.last_update_ts).toBe(recordCosmosTs);
        expect(result.right.value).toHaveProperty("version");
        expect(result.right.value.version).toBe("anEtag");
      }
    }
  });

  it("result should be none on fetch having status 404", async () => {
    const containerMock = {
      item: vi.fn((a: string, b: string) => ({
        read: vi.fn().mockResolvedValue({
          statusCode: 404,
          resource: { ...anItem, _ts: 1687787624, _etag: "anEtag" },
        }),
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
    const recordCosmosTs = 1687787624;
    const recordLastUpdateTs = 1787787624;
    const bulkFetchResult = [
      {
        resourceBody: {
          ...anItem,
          _ts: recordCosmosTs,
          _etag: "anEtag",
        },
        statusCode: 200,
      },
      {
        resourceBody: {
          ...anItem,
          id: "anItemId2" as NonEmptyString,
          last_update_ts: recordLastUpdateTs,
          _ts: recordCosmosTs,
          _etag: "anEtag2",
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
      expect(result.right).toHaveLength(2);

      // Case record lacking last_update_ts
      expect(O.isSome(result.right[0])).toBeTruthy();
      if (O.isSome(result.right[0])) {
        expect(result.right[0].value).toHaveProperty("last_update_ts");
        expect(result.right[0].value.last_update_ts).toBe(recordCosmosTs);
        expect(result.right[0].value).toHaveProperty("version");
        expect(result.right[0].value.version).toBe("anEtag");
      }

      // Case record with last_update_ts
      expect(O.isSome(result.right[1])).toBeTruthy();
      if (O.isSome(result.right[1])) {
        expect(result.right[1].value).toHaveProperty("last_update_ts");
        expect(result.right[1].value.last_update_ts).toBe(recordLastUpdateTs);
        expect(result.right[1].value).toHaveProperty("version");
        expect(result.right[1].value.version).toBe("anEtag");
      }
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

  it("result should contain a none ad a some on bulkFetch result containing mixed element statuses 404", async () => {
    const bulkFetchResult = [
      {
        statusCode: 404,
      },
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
    const result = await store.bulkFetch(["otherItemId", "anItemId"])();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toHaveLength(2);
      expect(O.isNone(result.right[0])).toBeTruthy();
      expect(O.isSome(result.right[1])).toBeTruthy();
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

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toHaveLength(1);
      expect(O.isNone(result.right[0])).toBeTruthy();
    }
  });

  it("result save the element", async () => {
    const anItemId = "anItemId";
    const anEtag = "anEtag";
    const aTs = 1687787624;
    const aLastUpdateTs = 1787787624;
    const anItemToBeSaved = {
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

    const containerMock = {
      items: {
        upsert: vi.fn().mockResolvedValue({
          statusCode: 200,
          resource: { last_update_ts: aLastUpdateTs, _ts: aTs, _etag: anEtag },
          etag: anEtag,
        }),
      },
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);

    const result = await store.save(anItemId, anItemToBeSaved)();

    console.log(result);

    expect(containerMock.items.upsert).toBeCalledTimes(1);
    expect(containerMock.items.upsert).toBeCalledWith({
      ...anItemToBeSaved,
      id: anItemId,
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toHaveProperty("last_update_ts");
      expect(result.right.last_update_ts).toBe(aLastUpdateTs);
      expect(result.right).toHaveProperty("version");
      expect(result.right.version).toBe(anEtag);
    }
  });

  it("should delete the element", async () => {
    const anItemId = "anItemId";
    const anEtag = "anEtag";

    const deleteMock = vi.fn((_) => ({
      delete: vi.fn().mockResolvedValue({
        statusCode: 204,
        etag: anEtag,
      }),
    }));
    const containerMock = {
      item: deleteMock,
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServicePublication.ItemType);

    const result = await store.delete(anItemId)();

    expect(containerMock.item).toBeCalledTimes(1);
    expect(containerMock.item).toBeCalledWith(anItemId, anItemId);

    expect(deleteMock).toBeCalledTimes(1);
    expect(E.isRight(result)).toBeTruthy();
  });

  it("deleteItem should not return an error when cosmos response is 404", async () => {
    const anItemId = "anItemId";
    const anEtag = "anEtag";

    const deleteMock = vi.fn((_) => ({
      delete: vi.fn().mockRejectedValue({
        etag: anEtag,
        code: 404,
        message: "already deleted",
      }),
    }));
    const containerMock = {
      item: deleteMock,
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServicePublication.ItemType);

    const result = await store.delete(anItemId)();

    expect(containerMock.item).toBeCalledTimes(1);
    expect(containerMock.item).toBeCalledWith(anItemId, anItemId);

    expect(deleteMock).toBeCalledTimes(1);
    expect(E.isRight(result)).toBeTruthy();
  });

  it("deleteItem should return an error in case of unknown statusCode delete response", async () => {
    const anItemId = "anItemId";
    const anEtag = "anEtag";

    const deleteMock = vi.fn((_) => ({
      delete: vi.fn().mockRejectedValue({
        etag: anEtag,
        code: 500,
        message: "unknown error",
      }),
    }));
    const containerMock = {
      item: deleteMock,
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServicePublication.ItemType);

    const result = await store.delete(anItemId)();

    expect(containerMock.item).toBeCalledTimes(1);
    expect(containerMock.item).toBeCalledWith(anItemId, anItemId);

    expect(deleteMock).toBeCalledTimes(1);
    expect(E.isLeft(result)).toBeTruthy();
  });
});
