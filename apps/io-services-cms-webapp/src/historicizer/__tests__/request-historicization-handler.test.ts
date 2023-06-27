import { describe, it, expect } from "vitest";
import { Context } from "@azure/functions";
import { Json } from "io-ts-types";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  buildDocument,
  handleQueueItem,
} from "../request-historicization-handler";
import { ServiceLifecycle, Queue } from "@io-services-cms/models";

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  } as unknown as Context);

const atimestamp = 1685529694747;
const aGenericItemType = {
  id: "aServiceId",
  data: {
    name: "aServiceName" as NonEmptyString,
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
    authorized_cidrs: [],
  },
  fsm: {
    state: "published",
  },
  last_update: new Date(atimestamp).toISOString(),
} as unknown as Queue.RequestHistoricizationItem;

const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;

describe("Service Historicization Handler", () => {
  it("[handleQueueItem] should return an Error if queueItem is invalid", async () => {
    const context = createContext();

    try {
      await handleQueueItem(context, anInvalidQueueItem)();
    } catch (error) {
      expect(error.message).toBeDefined();
    }
  });

  it.each`
    scenario         | item                                                    | expected
    ${"lifecycle"}   | ${{ ...aGenericItemType, fms: { state: "approved" } }}  | ${{ ...aGenericItemType, fms: { state: "approved" } }}
    ${"publication"} | ${{ ...aGenericItemType, fms: { state: "published" } }} | ${{ ...aGenericItemType, fms: { state: "published" } }}
  `(
    "[handleQueueItem] should handle $scenario queue item correctly",
    async ({ item, expected }) => {
      const context = createContext();

      await handleQueueItem(context, item)();

      expect(context.bindings.serviceHistoryDocument).toBe(
        buildDocument(expected)
      );
    }
  );

  it("[buildDocument] should build document starting from a service", async () => {
    const result = buildDocument(aGenericItemType);
    const resultObj = JSON.parse(result);

    expect(resultObj.id).toBe(atimestamp.toString());
    expect(resultObj.serviceId).toBe(aGenericItemType.id);
  });
});
