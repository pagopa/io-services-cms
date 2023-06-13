import { test, expect, describe } from "vitest";
import { ServiceLifecycle } from "@io-services-cms/models";
import {
  itemToResponse,
  payloadToItem,
  toServiceStatus,
} from "../service-lifecycle-converters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ServicePayload } from "../../../generated/api/ServicePayload";
import { FiscalCode } from "../../../generated/api/FiscalCode";

const fsm: ServiceLifecycle.ItemType["fsm"] = {
  state: "rejected",
};

describe("test service-lifecycle-converters", () => {
  test("test service-lifecycle-converters", () => {
    const result = toServiceStatus(fsm);
    expect(result.reason).not.toBeDefined();
  });

  test("Authorized User should contains the default fiscal code and the one on request", () => {
    const aNewService = {
      name: "a service",
      description: "a description",
      organization: {
        name: "org",
        fiscal_code: "00000000000",
      },
      metadata: {
        scope: "LOCAL",
      },
      authorized_recipients: ["BBBBBB99C88D555I"],
    } as unknown as ServicePayload;

    const result = payloadToItem(
      "ffefefe" as NonEmptyString,
      aNewService,
      "AAAAAA00A00A000A" as FiscalCode
    );
    expect(result.data.authorized_recipients).toBeDefined();
    expect(result.data.authorized_recipients).toContain("AAAAAA00A00A000A");
    expect(result.data.authorized_recipients).toContain("BBBBBB99C88D555I");
    expect(result.data.authorized_recipients).toHaveLength(2);
  });
});
