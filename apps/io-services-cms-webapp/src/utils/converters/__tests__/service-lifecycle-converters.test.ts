import { test, expect } from "vitest";
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

test("test service-lifecycle-converters", () => {
  const result = toServiceStatus(fsm);
  expect(result.reason).not.toBeDefined();
});

test("payload to item", () => {
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
});
