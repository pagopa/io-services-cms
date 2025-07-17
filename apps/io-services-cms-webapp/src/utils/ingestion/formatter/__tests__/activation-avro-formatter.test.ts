import { EnrichedActivation } from "../../enriched-types/activation-pdv-enriched";
import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { ServiceActivations as avroServiceActivation } from "../../../../generated/avro/dto/ServiceActivations";
import { avroActivationFormatter } from "../activation-avro-formatter";
import { a } from "vitest/dist/chunks/suite.d.FvehnV49.js";

const avroType = avro.Type.forSchema(
  avroServiceActivation.schema as avro.Schema,
);

//mocks
const aEnrichedActivationMock: EnrichedActivation = {
  status: "ACTIVE",
  modifiedAt: 1751901650032,
  userPDVId: "dummy-user-pdv",
  serviceId: "dummyserviceid",
} as unknown as EnrichedActivation;

const aEnrichedActivationEventData = {
  id: "dummy-user-pdv-dummyserviceid-1751901650032",
  modifiedAt: 1751901650032,
  userPDVId: "dummy-user-pdv",
  serviceId: "dummyserviceid",
  status: "ACTIVE",
};

describe("Activation Avro Formatter", () => {
  it("should format an Activation to an EventData containing ad body the Avro encode resource", () => {
    //when
    const res = avroActivationFormatter(aEnrichedActivationMock);

    //then
    expect(E.isRight(res)).toBeTruthy();

    if (E.isRight(res)) {
      const rightVal = res.right;
      expect(rightVal).toHaveProperty("body");

      // convert buffer
      const body = avroType.fromBuffer(rightVal.body);

      expect(body).toEqual(aEnrichedActivationEventData);
    }
  });

  it("should fail when the service does not meet the Avro criteria", () => {
    //given
    const aBadServicePublicationCosmosResource: EnrichedActivation = {
      ...aEnrichedActivationMock,
      userPDVId: undefined, // this will make the formatter fail
    } as unknown as EnrichedActivation;

    //when
    const res = avroActivationFormatter(aBadServicePublicationCosmosResource);

    //then
    expect(E.isLeft(res)).toBeTruthy();
  });
});
