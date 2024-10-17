import { DateUtils, ServiceLifecycle } from "@io-services-cms/models";
import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { serviceLifecycle as avroServiceLifecycle } from "../../../../generated/avro/dto/serviceLifecycle";
import { avroServiceLifecycleFormatter } from "../service-lifecycle-avro-formatter";

const avroType = avro.Type.forSchema(
  avroServiceLifecycle.schema as avro.Schema,
);

//mocks
const aServiceLifecycleCosmosResource: ServiceLifecycle.CosmosResource = {
  id: "aServiceId",
  data: {
    name: "aServiceName",
    description: "aServiceDescription",
    authorized_recipients: [],
    authorized_cidrs: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
      category: "STANDARD",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
  },
  fsm: {
    state: "draft",
  },
  modified_at: DateUtils.unixTimestamp(),
  //_ts: DateUtils.unixTimestampInSeconds(),
  _etag: "aServiceEtag",
} as unknown as ServiceLifecycle.CosmosResource;

describe("Service Lifecycle Avro Formatter", () => {
  it("should format a Service Lifecycle Cosmos Resource to an EventData containing ad body the Avro encode resource", () => {
    const res = avroServiceLifecycleFormatter(aServiceLifecycleCosmosResource);

    expect(E.isRight(res)).toBeTruthy();

    if (E.isRight(res)) {
      const rightVal = res.right;
      expect(rightVal).toHaveProperty("body");
    }
  });

  it("should fail when the service does not meet the Avro criteria", () => {
    const aBadServiceLifecycleCosmosResource: ServiceLifecycle.CosmosResource =
      {
        ...aServiceLifecycleCosmosResource,
        id: undefined, // this will make the formatter fail
      } as unknown as ServiceLifecycle.CosmosResource;

    const res = avroServiceLifecycleFormatter(
      aBadServiceLifecycleCosmosResource,
    );

    expect(E.isLeft(res)).toBeTruthy();

    if (E.isLeft(res)) {
      console.log(res.left);
    }
  });
});
