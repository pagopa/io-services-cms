import { Container } from "@azure/cosmos";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it, vi } from "vitest";
import { ServiceLifecycle, ServicePublication } from "../..";
import {
  unixSecondsToMillis,
  unixTimestamp,
  unixTimestampInSeconds,
} from "../../utils/date-utils";
import { createCosmosStore } from "../fsm/store.cosmos";

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
    const recordCosmosTs = unixTimestampInSeconds();
    const recordModifiedAt = unixTimestamp();
    const containerMock = {
      item: vi.fn((a: string, b: string) => ({
        read: vi.fn().mockResolvedValue({
          statusCode: 200,
          resource: {
            ...anItem,
            modified_at: recordModifiedAt,
            _ts: recordCosmosTs,
            _etag: "anEtag",
          },
          etag: "anEtag",
        }),
      })),
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);
    const result = await store.fetch("anItemId")();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(O.isSome(result.right)).toBeTruthy();
      if (O.isSome(result.right)) {
        expect(result.right.value).toHaveProperty("modified_at");
        expect(result.right.value.modified_at).toBe(recordModifiedAt);
        expect(result.right.value).toHaveProperty("version");
        expect(result.right.value.version).toBe("anEtag");
      }
    }
  });

  it("result should be some on fetch having status 200 and having modified_at valued with _ts in case is missing", async () => {
    const recordCosmosTs = unixTimestampInSeconds();

    const containerMock = {
      item: vi.fn((a: string, b: string) => ({
        read: vi.fn().mockResolvedValue({
          statusCode: 200,
          resource: { ...anItem, _ts: recordCosmosTs, _etag: "anEtag" },
          etag: "anEtag",
        }),
      })),
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);
    const result = await store.fetch("anItemId")();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(O.isSome(result.right)).toBeTruthy();
      if (O.isSome(result.right)) {
        expect(result.right.value).toHaveProperty("modified_at");
        expect(result.right.value.modified_at).toBe(
          unixSecondsToMillis(recordCosmosTs),
        );
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
          resource: {
            ...anItem,
            _ts: unixTimestampInSeconds(),
            _etag: "anEtag",
          },
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
          resource: {
            bad_prop_one: "bad_prop_one",
            _ts: unixTimestampInSeconds(),
          },
          statusCode: 200,
        }),
      })),
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);
    const result = await store.fetch("anItemId")();

    expect(E.isLeft(result)).toBeTruthy();
  });

  it("result should contain some on bulkFetch elements have status 200", async () => {
    const recordCosmosTs = unixTimestampInSeconds();
    const recordModifiedAt = unixTimestamp();
    const bulkFetchResult = [
      {
        resourceBody: {
          ...anItem,
          _ts: recordCosmosTs,
          _etag: "anEtag",
        },
        eTag: "anEtag",
        statusCode: 200,
      },
      {
        resourceBody: {
          ...anItem,
          id: "anItemId2" as NonEmptyString,
          modified_at: recordModifiedAt,
          _ts: recordCosmosTs,
          _etag: "anEtag2",
        },
        eTag: "anEtag2",
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

      // Case record lacking modified_at
      expect(O.isSome(result.right[0])).toBeTruthy();
      if (O.isSome(result.right[0])) {
        expect(result.right[0].value).toHaveProperty("modified_at");
        expect(result.right[0].value.modified_at).toBe(
          unixSecondsToMillis(recordCosmosTs),
        );
        expect(result.right[0].value).toHaveProperty("version");
        expect(result.right[0].value.version).toBe("anEtag");
      }

      // Case record with modified_at
      expect(O.isSome(result.right[1])).toBeTruthy();
      if (O.isSome(result.right[1])) {
        expect(result.right[1].value).toHaveProperty("modified_at");
        expect(result.right[1].value.modified_at).toBe(recordModifiedAt);
        expect(result.right[1].value).toHaveProperty("version");
        expect(result.right[1].value.version).toBe("anEtag2");
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
          _ts: unixTimestampInSeconds(),
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
          _ts: unixTimestampInSeconds(),
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
    const aTs = unixTimestampInSeconds();
    const previousModifiedAt = unixTimestamp() - 20000;
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
      modified_at: previousModifiedAt,
    } as unknown as ServiceLifecycle.ItemType;

    const containerMock = {
      items: {
        upsert: vi.fn().mockImplementation((input) => {
          return Promise.resolve({
            statusCode: 200,
            resource: {
              _ts: aTs,
              _etag: anEtag,
              modified_at: input.modified_at,
            },
            etag: anEtag,
          });
        }),
      },
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);

    const result = await store.save(anItemId, anItemToBeSaved)();

    expect(containerMock.items.upsert).toBeCalledTimes(1);
    expect(containerMock.items.upsert).toBeCalledWith({
      ...anItemToBeSaved,
      modified_at: expect.any(Number),
      id: anItemId,
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toHaveProperty("modified_at");
      // save method will replace the previous modified_at with the current timestamp, so should be greater than the previous
      expect(result.right.modified_at).toBeGreaterThan(previousModifiedAt);
      expect(result.right).toHaveProperty("version");
      expect(result.right.version).toBe(anEtag);
    }
  });

  it("result save the element preserving modifiedAt", async () => {
    const anItemId = "anItemId";
    const anEtag = "anEtag";
    const aTs = unixTimestampInSeconds();
    const previousModifiedAt = unixTimestamp() - 20000;
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
      modified_at: previousModifiedAt,
    } as unknown as ServiceLifecycle.ItemType;

    const containerMock = {
      items: {
        upsert: vi.fn().mockImplementation((input) => {
          return Promise.resolve({
            statusCode: 200,
            resource: {
              _ts: aTs,
              _etag: anEtag,
              modified_at: input.modified_at,
            },
            etag: anEtag,
          });
        }),
      },
    } as unknown as Container;

    const store = createCosmosStore(containerMock, ServiceLifecycle.ItemType);

    const result = await store.save(anItemId, anItemToBeSaved, true)();

    expect(containerMock.items.upsert).toBeCalledTimes(1);
    expect(containerMock.items.upsert).toBeCalledWith({
      ...anItemToBeSaved,
      modified_at: expect.any(Number),
      id: anItemId,
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toHaveProperty("modified_at");
      // save method should not replace the modified_at field with the current timestamp, so should be equal
      expect(result.right.modified_at).toEqual(previousModifiedAt);
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

  describe("getServiceIdsByGroupIds", () => {
    it("should return an error when query fail", async () => {
      const error = {
        code: 500,
        message: "unknown error",
      };
      const fetchAll = vi.fn().mockRejectedValueOnce(error);
      const query = vi.fn().mockReturnValueOnce({ fetchAll });
      const containerMock = {
        items: { query },
      } as unknown as Container;
      const store = createCosmosStore(
        containerMock,
        ServicePublication.ItemType,
      );
      const aGroupIds = [];

      const result = await store.getServiceIdsByGroupIds(aGroupIds)();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).toStrictEqual(
          `Error fetching services from database with groupIds=${aGroupIds}, ${
            E.toError(error).message
          }`,
        );
      }
      expect(query).toHaveBeenCalledOnce();
      expect(fetchAll).toHaveBeenCalledOnce();
    });

    it("should return the services id when query do not fail", async () => {
      const expectedResult = { resources: ["sid_1", "sid_2"] };
      const fetchAll = vi.fn().mockResolvedValueOnce(expectedResult);
      const query = vi.fn().mockReturnValueOnce({ fetchAll });
      const containerMock = {
        items: { query },
      } as unknown as Container;
      const store = createCosmosStore(
        containerMock,
        ServicePublication.ItemType,
      );
      const aGroupIds = ["gid_1", "gid_2", "gid_3"];

      const result = await store.getServiceIdsByGroupIds(aGroupIds)();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toStrictEqual(expectedResult.resources);
      }
      expect(query).toHaveBeenCalledOnce();
      expect(query).toHaveBeenCalledWith({
        parameters: [{ name: "@groupIds", value: aGroupIds }],
        query:
          "SELECT VALUE c.id FROM c WHERE ARRAY_CONTAINS(@groupIds, c.data.metadata.group_id)",
      });
      expect(fetchAll).toHaveBeenCalledOnce();
    });
  });
});
