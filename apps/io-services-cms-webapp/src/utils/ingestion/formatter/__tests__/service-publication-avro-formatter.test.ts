import { DateUtils, ServicePublication } from "@io-services-cms/models";
import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { servicePublication as avroServicePublication } from "../../../../generated/avro/dto/servicePublication";
import { avroServicePublicationFormatter } from "../service-publication-avro-formatter";

const avroType = avro.Type.forSchema(
  avroServicePublication.schema as avro.Schema,
);

//mocks
const aServicePublicationCosmosResource: ServicePublication.CosmosResource = {
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
      topic_id: null, // Why undefined(omit this) doesn't work? and produce Error: invalid ["null","int"]: undefined
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
  },
  fsm: {
    state: "published",
  },
  _ts: DateUtils.unixTimestampInSeconds(),
  _etag: "aServiceEtag",
} as unknown as ServicePublication.CosmosResource;

describe("Service Publication Avro Formatter", () => {
  it("should format a Service Publication Cosmos Resource to an EventData containing ad body the Avro encode resource", () => {
    const res = avroServicePublicationFormatter(
      aServicePublicationCosmosResource,
    );

    expect(E.isRight(res)).toBeTruthy();

    if (E.isRight(res)) {
      const rightVal = res.right;
      expect(rightVal).toHaveProperty("body");
    }
  });

  it("should fail when the service does not meet the Avro criteria", () => {
    const aBadServicePublicationCosmosResource: ServicePublication.CosmosResource =
      {
        ...aServicePublicationCosmosResource,
        id: undefined // this will make the formatter fail
      } as unknown as ServicePublication.CosmosResource;

    const res = avroServicePublicationFormatter(
      aBadServicePublicationCosmosResource,
    );

    expect(E.isLeft(res)).toBeTruthy();

    if (E.isLeft(res)) {
      console.log(res.left);
    }
  });
});
