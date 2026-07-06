import { ServiceHistory as ServiceHistoryCosmosItem } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, test, vi } from "vitest";

import { IConfig } from "../../../config";
import { ScopeEnum } from "../../../generated/api/ServiceBaseMetadata";
import { ServiceHistoryStatusKindEnum } from "../../../generated/api/ServiceHistoryStatusKind";
import { ServiceHistoryStatusTypeEnum } from "../../../generated/api/ServiceHistoryStatusType";
import {
  buildStatus,
  itemToResponse,
  itemsToResponse,
} from "../service-history-converters";

const { getServiceTopicDao } = vi.hoisted(() => ({
  getServiceTopicDao: vi.fn(() => ({
    findById: vi.fn((id: number) =>
      TE.right(O.some({ id, name: "topic name" })),
    ),
  })),
}));

vi.mock("../../../utils/service-topic-dao", () => ({
  getDao: getServiceTopicDao,
}));

const mockConfig = {
  FF_SUITABLE_FOR_MINORS_ENABLED: true,
} as unknown as IConfig;

const aBaseItem = {
  data: {
    authorized_cidrs: [],
    authorized_recipients: [],
    description: "a description",
    max_allowed_payment_amount: 0,
    metadata: {
      scope: "LOCAL",
      topic_id: 1,
    },
    name: "a service",
    organization: {
      fiscal_code: "00000000000",
      name: "org",
    },
    require_secure_channel: false,
  },
  fsm: { state: "approved" },
  last_update: "2023-01-01T00:00:00.000Z",
  serviceId: "aServiceId",
} as unknown as ServiceHistoryCosmosItem;

const buildItemWithAge = (age?: { max?: number; min?: number }) =>
  ({
    ...aBaseItem,
    data: { ...aBaseItem.data, age },
  }) as unknown as ServiceHistoryCosmosItem;

// The suitable_for_minors mapping logic is unit-tested in
// service-common-converters.test.ts; here we only assert the converter wires it
// up correctly (field exposed/omitted, internal age never leaked, applied per item).
describe("itemToResponse suitable_for_minors integration", () => {
  test("should expose suitable_for_minors when the feature flag is enabled", async () => {
    const result = await itemToResponse(mockConfig)(
      buildItemWithAge({ min: 14 }),
    )();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.suitable_for_minors).toBe(true);
    }
  });

  test("should omit suitable_for_minors when the feature flag is disabled", async () => {
    const disabledConfig = {
      FF_SUITABLE_FOR_MINORS_ENABLED: false,
    } as unknown as IConfig;
    const result = await itemToResponse(disabledConfig)(
      buildItemWithAge({ min: 14 }),
    )();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect("suitable_for_minors" in result.right).toBe(false);
    }
  });

  test("response should not expose the internal age field", async () => {
    const result = await itemToResponse(mockConfig)(
      buildItemWithAge({ min: 14 }),
    )();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect((result.right as Record<string, unknown>).age).toBeUndefined();
    }
  });
});

describe("itemsToResponse suitable_for_minors mapping", () => {
  test("should map suitable_for_minors on every item", async () => {
    const result = await itemsToResponse(mockConfig)([
      buildItemWithAge({ min: 14 }),
      buildItemWithAge({ min: 18 }),
    ])();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toHaveLength(2);
      expect(result.right[0].suitable_for_minors).toBe(true);
      expect(result.right[1].suitable_for_minors).toBe(false);
    }
  });
});

describe("buildStatus", () => {
  test.each(["approved", "deleted", "draft", "submitted"] as const)(
    "should map lifecycle state %s",
    (state) => {
      expect(buildStatus({ state })).toEqual({
        kind: ServiceHistoryStatusKindEnum.lifecycle,
        value: ServiceHistoryStatusTypeEnum[state],
      });
    },
  );

  test("should map rejected state keeping the reason", () => {
    expect(
      buildStatus({
        reason: "a reason",
        state: "rejected",
      }),
    ).toEqual({
      kind: ServiceHistoryStatusKindEnum.lifecycle,
      reason: "a reason",
      value: ServiceHistoryStatusTypeEnum.rejected,
    });
  });

  test.each(["published", "unpublished"] as const)(
    "should map publication state %s",
    (state) => {
      expect(buildStatus({ state })).toEqual({
        kind: ServiceHistoryStatusKindEnum.publication,
        value: ServiceHistoryStatusTypeEnum[state],
      });
    },
  );
});

describe("itemToResponse mapping", () => {
  test("should map id, status and mapped scope", async () => {
    const result = await itemToResponse(mockConfig)(aBaseItem)();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.id).toBe("aServiceId");
      expect(result.right.status).toEqual({
        kind: ServiceHistoryStatusKindEnum.lifecycle,
        value: ServiceHistoryStatusTypeEnum.approved,
      });
      expect(result.right.metadata.scope).toBe(ScopeEnum.LOCAL);
    }
  });

  test("should resolve the topic when topic_id is set", async () => {
    const result = await itemToResponse(mockConfig)(aBaseItem)();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.metadata.topic).toEqual({
        id: 1,
        name: "topic name",
      });
    }
  });

  test("should leave the topic undefined when topic_id is not set", async () => {
    const itemWithoutTopic = {
      ...aBaseItem,
      data: {
        ...aBaseItem.data,
        metadata: { scope: "LOCAL" },
      },
    } as unknown as ServiceHistoryCosmosItem;
    const result = await itemToResponse(mockConfig)(itemWithoutTopic)();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.metadata.topic).toBeUndefined();
    }
  });

  test("should fail when the topic_id cannot be resolved", async () => {
    getServiceTopicDao.mockReturnValueOnce({
      findById: vi.fn(() => TE.right(O.none)),
    });
    const result = await itemToResponse(mockConfig)(aBaseItem)();
    expect(E.isLeft(result)).toBe(true);
  });

  test("should keep the existing last_update", async () => {
    const result = await itemToResponse(mockConfig)(aBaseItem)();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.last_update).toBe("2023-01-01T00:00:00.000Z");
    }
  });

  test("should not expose internal metadata fields", async () => {
    const itemWithInternalMetadata = {
      ...aBaseItem,
      data: {
        ...aBaseItem.data,
        metadata: {
          category: "STANDARD",
          custom_special_flow: "aFlow",
          scope: "LOCAL",
          topic_id: 1,
        },
      },
    } as unknown as ServiceHistoryCosmosItem;
    const result = await itemToResponse(mockConfig)(itemWithInternalMetadata)();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      const metadata = result.right.metadata as Record<string, unknown>;
      expect(metadata.category).toBeUndefined();
      expect(metadata.custom_special_flow).toBeUndefined();
      expect(metadata.topic_id).toBeUndefined();
    }
  });
});
