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
  modified_at: DateUtils.unixTimestamp(),
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

      // convert buffer
      const body = avroType.fromBuffer(rightVal.body);

      expect(body).toEqual({
        id: "aServiceId",
        data: {
          authorized_cidrs: [],
          authorized_recipients: [],
          name: "aServiceName",
          description: "aServiceDescription",
          require_secure_channel: false,
          max_allowed_payment_amount: 123,
          institution_id: null,
          organization: {
            name: "anOrganizationName",
            fiscal_code: "12345678901",
            department_name: null,
          },
          metadata: {
            scope: "LOCAL",
            address: "via tal dei tali 123",
            category: "STANDARD",
            email: "service@email.it",
            pec: "service@pec.it",
            phone: null,
            token_name: null,
            privacy_url: null,
            app_android: null,
            app_ios: null,
            cta: null,
            custom_special_flow: null,
            support_url: null,
            tos_url: null,
            web_url: null,
            topic_id: null,
          },
        },
        fsm: {
          state: "published",
        },

        modified_at: aServicePublicationCosmosResource.modified_at,
        version: "aServiceEtag",
      });

      //console.log(body);
    }
  });

  it("should fail when the service does not meet the Avro criteria", () => {
    const aBadServicePublicationCosmosResource: ServicePublication.CosmosResource =
      {
        ...aServicePublicationCosmosResource,
        id: undefined, // this will make the formatter fail
      } as unknown as ServicePublication.CosmosResource;

    const res = avroServicePublicationFormatter(
      aBadServicePublicationCosmosResource,
    );

    expect(E.isLeft(res)).toBeTruthy();
  });
});
