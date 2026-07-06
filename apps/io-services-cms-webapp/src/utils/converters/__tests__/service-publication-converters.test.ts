import { DateUtils, ServicePublication } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, test, vi } from "vitest";

import { IConfig } from "../../../config";
import { ScopeEnum } from "../../../generated/api/ServiceBaseMetadata";
import { ServicePublicationStatusTypeEnum } from "../../../generated/api/ServicePublicationStatusType";
import {
  itemToResponse,
  toServiceStatusType,
} from "../service-publication-converters";

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
  fsm: { state: "published" },
  id: "aServiceId",
} as unknown as ServicePublication.ItemType;

const buildItemWithAge = (age?: { max?: number; min?: number }) =>
  ({
    ...aBaseItem,
    data: { ...aBaseItem.data, age },
  }) as unknown as ServicePublication.ItemType;

// The suitable_for_minors mapping logic is unit-tested in
// service-common-converters.test.ts; here we only assert the converter wires it
// up correctly (field exposed/omitted, internal age never leaked).
describe("itemToResponse suitable_for_minors integration", () => {
  const enabledConfig = {
    FF_SUITABLE_FOR_MINORS_ENABLED: true,
  } as unknown as IConfig;

  test("should expose suitable_for_minors when the feature flag is enabled", async () => {
    const result = await itemToResponse(enabledConfig)(
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
    const result = await itemToResponse(enabledConfig)(
      buildItemWithAge({ min: 14 }),
    )();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect((result.right as Record<string, unknown>).age).toBeUndefined();
    }
  });
});

describe("toServiceStatusType", () => {
  test("should map published state", () => {
    expect(toServiceStatusType("published")).toBe(
      ServicePublicationStatusTypeEnum.published,
    );
  });

  test("should map unpublished state", () => {
    expect(toServiceStatusType("unpublished")).toBe(
      ServicePublicationStatusTypeEnum.unpublished,
    );
  });
});

describe("itemToResponse mapping", () => {
  test("should map id, status and mapped scope", async () => {
    const result = await itemToResponse(mockConfig)(aBaseItem)();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.id).toBe("aServiceId");
      expect(result.right.status).toBe(
        ServicePublicationStatusTypeEnum.published,
      );
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
    } as unknown as ServicePublication.ItemType;
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

  test("should derive last_update from modified_at when present", async () => {
    const modified_at = 1_700_000_000_000;
    const itemWithModifiedAt = {
      ...aBaseItem,
      modified_at,
    } as unknown as ServicePublication.ItemType;
    const result = await itemToResponse(mockConfig)(itemWithModifiedAt)();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.last_update).toBe(
        DateUtils.isoStringfromUnixMillis(modified_at),
      );
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
    } as unknown as ServicePublication.ItemType;
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
