import { ServiceHistory } from "@io-services-cms/models";
import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { serviceHistory as avroServiceHistory } from "../../../../generated/avro/dto/serviceHistory";
import { avroServiceHistoryFormatter } from "../service-history-avro-formatter";

const avroType = avro.Type.forSchema(avroServiceHistory.schema as avro.Schema);

//mocks
const aServicePublicationCosmosResource: ServiceHistory = {
  id: "1687533853589",
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
  serviceId: "aServiceId",
  last_update: "2023-06-23T15:24:13.589Z",
  version: "aServiceEtag",
} as unknown as ServiceHistory;

describe("Service History Avro Formatter", () => {
  it("should format a Service History to an EventData containing ad body the Avro encode resource", () => {
    const res = avroServiceHistoryFormatter(aServicePublicationCosmosResource);

    expect(E.isRight(res)).toBeTruthy();

    if (E.isRight(res)) {
      const rightVal = res.right;
      expect(rightVal).toHaveProperty("body");

      // convert buffer
      const body = avroType.fromBuffer(rightVal.body);

      expect(body).toEqual({
        id: "1687533853589",
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
        serviceId: "aServiceId",
        last_update: "2023-06-23T15:24:13.589Z",
        version: "aServiceEtag",
      });
    }
  });

  it("should fail when the service does not meet the Avro criteria", () => {
    const aBadServicePublicationCosmosResource: ServiceHistory =
      {
        ...aServicePublicationCosmosResource,
        id: undefined, // this will make the formatter fail
      } as unknown as ServiceHistory;

    const res = avroServiceHistoryFormatter(
      aBadServicePublicationCosmosResource,
    );

    expect(E.isLeft(res)).toBeTruthy();
  });
});
