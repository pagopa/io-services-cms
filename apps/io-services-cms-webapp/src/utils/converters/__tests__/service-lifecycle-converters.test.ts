import { ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, test, vi } from "vitest";
import { TopicPostgreSqlConfig } from "../../../config";
import { FiscalCode } from "../../../generated/api/FiscalCode";
import { ServicePayload } from "../../../generated/api/ServicePayload";
import {
  itemToResponse,
  payloadToItem,
  toServiceStatus,
} from "../service-lifecycle-converters";

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

const fsm: ServiceLifecycle.ItemType["fsm"] = {
  state: "rejected",
};

const anAutorizedFiscalCode = "BBBBBB99C88D555I";
const aSandboxFiscalCode = "AAAAAA00A00A000A";

const mockDbConfig = {} as unknown as TopicPostgreSqlConfig;

describe("test service-lifecycle-converters", () => {
  test("test service-lifecycle-converters", () => {
    const result = toServiceStatus(fsm);
    expect(result.reason).not.toBeDefined();
  });

  test("Authorized Recipients should contains the default fiscal code and the one on request", () => {
    const aNewService = {
      name: "a service",
      description: "a description",
      organization: {
        name: "org",
        fiscal_code: "00000000000",
      },
      metadata: {
        scope: "LOCAL",
        topic_id: 1,
      },
      authorized_recipients: [anAutorizedFiscalCode],
    } as unknown as ServicePayload;

    const result = payloadToItem(
      "ffefefe" as NonEmptyString,
      aNewService,
      aSandboxFiscalCode as FiscalCode,
    );
    expect(result.data.authorized_recipients).toBeDefined();
    expect(result.data.authorized_recipients).toContain(aSandboxFiscalCode);
    expect(result.data.authorized_recipients).toContain(anAutorizedFiscalCode);
    expect(result.data.authorized_recipients).toHaveLength(2);
  });

  test("Should not add the default sandbox recipient when already present", () => {
    const aNewService = {
      name: "a service",
      description: "a description",
      organization: {
        name: "org",
        fiscal_code: "00000000000",
      },
      metadata: {
        scope: "LOCAL",
        topic_id: 1,
      },
      authorized_recipients: [aSandboxFiscalCode],
    } as unknown as ServicePayload;

    const result = payloadToItem(
      "ffefefe" as NonEmptyString,
      aNewService,
      aSandboxFiscalCode as FiscalCode,
    );
    expect(result.data.authorized_recipients).toBeDefined();
    expect(result.data.authorized_recipients).toContain(aSandboxFiscalCode);
    expect(result.data.authorized_recipients).toHaveLength(1);
  });

  test("Converting a Payload which lack of metadata.category the Item should contain the default one", () => {
    const aNewService = {
      name: "a service",
      description: "a description",
      organization: {
        name: "org",
        fiscal_code: "00000000000",
      },
      metadata: {
        scope: "LOCAL",
        topic_id: 1,
      },
      authorized_recipients: [anAutorizedFiscalCode],
    } as unknown as ServicePayload;

    const result = payloadToItem(
      "ffefefe" as NonEmptyString,
      aNewService,
      aSandboxFiscalCode as FiscalCode,
    );
    expect(result.data.metadata).toBeDefined();
  });

  test("Converting a Payload have metadata.custom_special_flow the Item should mantain it", () => {
    const aCustomSpecialFlow = "aCustomSpecialFlow";
    const aNewService = {
      name: "a service",
      description: "a description",
      organization: {
        name: "org",
        fiscal_code: "00000000000",
      },
      metadata: {
        scope: "LOCAL",
        custom_special_flow: aCustomSpecialFlow,
        topic_id: 1,
      },
      authorized_recipients: [anAutorizedFiscalCode],
    } as unknown as ServicePayload;

    const result = payloadToItem(
      "ffefefe" as NonEmptyString,
      aNewService,
      aSandboxFiscalCode as FiscalCode,
    );
    expect(result.data.metadata).toBeDefined();
    expect(result.data.metadata.custom_special_flow).toBeDefined();
    expect(result.data.metadata.custom_special_flow).toBe(aCustomSpecialFlow);
  });

  test("suitable_for_minors true should map to age.min = 14", () => {
    const aNewService = {
      name: "a service",
      description: "a description",
      organization: {
        name: "org",
        fiscal_code: "00000000000",
      },
      metadata: {
        scope: "LOCAL",
        topic_id: 1,
      },
      suitable_for_minors: true,
    } as unknown as ServicePayload;

    const result = payloadToItem(
      "ffefefe" as NonEmptyString,
      aNewService,
      aSandboxFiscalCode as FiscalCode,
    );
    expect(result.data.age).toEqual({ min: 14 });
  });

  test("suitable_for_minors false should leave age undefined (as-is, not available to minors)", () => {
    const aNewService = {
      name: "a service",
      description: "a description",
      organization: {
        name: "org",
        fiscal_code: "00000000000",
      },
      metadata: {
        scope: "LOCAL",
        topic_id: 1,
      },
      suitable_for_minors: false,
    } as unknown as ServicePayload;

    const result = payloadToItem(
      "ffefefe" as NonEmptyString,
      aNewService,
      aSandboxFiscalCode as FiscalCode,
    );
    expect(result.data.age).toBeUndefined();
  });

  test("missing suitable_for_minors should leave age undefined (no regression, behaviour as-is)", () => {
    const aNewService = {
      name: "a service",
      description: "a description",
      organization: {
        name: "org",
        fiscal_code: "00000000000",
      },
      metadata: {
        scope: "LOCAL",
        topic_id: 1,
      },
    } as unknown as ServicePayload;

    const result = payloadToItem(
      "ffefefe" as NonEmptyString,
      aNewService,
      aSandboxFiscalCode as FiscalCode,
    );
    expect(result.data.age).toBeUndefined();
    expect("age" in result.data).toBe(true);
  });
});

describe("itemToResponse suitable_for_minors mapping", () => {
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
    fsm: { state: "draft" },
    id: "aServiceId",
  } as unknown as ServiceLifecycle.ItemType;

  const buildItemWithAge = (age?: { max?: number; min?: number }) =>
    ({
      ...aBaseItem,
      data: { ...aBaseItem.data, age },
    }) as unknown as ServiceLifecycle.ItemType;

  test("age.min below 18 should map to suitable_for_minors true", async () => {
    const result = await itemToResponse(mockDbConfig)(buildItemWithAge({ min: 14 }))();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.suitable_for_minors).toBe(true);
    }
  });

  test("missing age should map to suitable_for_minors false", async () => {
    const result = await itemToResponse(mockDbConfig)(aBaseItem)();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.suitable_for_minors).toBe(false);
    }
  });

  test("age.min greater or equal to 18 should map to suitable_for_minors false", async () => {
    const result = await itemToResponse(mockDbConfig)(buildItemWithAge({ min: 18 }))();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.suitable_for_minors).toBe(false);
    }
  });

  test("response should not expose the internal age field", async () => {
    const result = await itemToResponse(mockDbConfig)(buildItemWithAge({ min: 14 }))();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect((result.right as Record<string, unknown>).age).toBeUndefined();
    }
  });
});
