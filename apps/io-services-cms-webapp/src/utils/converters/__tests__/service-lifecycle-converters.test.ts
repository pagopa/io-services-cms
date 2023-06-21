import { ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { describe, expect, test } from "vitest";
import { FiscalCode } from "../../../generated/api/FiscalCode";
import { ServicePayload } from "../../../generated/api/ServicePayload";
import {
  payloadToItem,
  toServiceStatus,
} from "../service-lifecycle-converters";

const fsm: ServiceLifecycle.ItemType["fsm"] = {
  state: "rejected",
};

const anAutorizedFiscalCode = "BBBBBB99C88D555I";
const aSandboxFiscalCode = "AAAAAA00A00A000A";

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
      authorized_recipients: [anAutorizedFiscalCode],
    } as unknown as ServicePayload;

    const result = payloadToItem(
      "ffefefe" as NonEmptyString,
      aNewService,
      aSandboxFiscalCode as FiscalCode
    );
    expect(result.data.authorized_recipients).toBeDefined();
    expect(result.data.authorized_recipients).toContain(aSandboxFiscalCode);
    expect(result.data.authorized_recipients).toContain(anAutorizedFiscalCode);
    expect(result.data.authorized_recipients).toHaveLength(2);
  });
});
