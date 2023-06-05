import { test, expect } from "vitest";
import { ServiceLifecycle } from "@io-services-cms/models";
import { toServiceStatus } from "../service-lifecycle-converters";

const fsm: ServiceLifecycle.ItemType["fsm"] = {
  state: "rejected",
};

test("test service-lifecycle-converters", () => {
  const result = toServiceStatus(fsm);
  expect(result.reason).not.toBeDefined();
});
