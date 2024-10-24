import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { serviceTopics as avroServiceTopics } from "../../../../generated/avro/dto/serviceTopics";
import {
  AllServiceTopics,
  avroServiceTopicFormatter,
} from "../service-topic-avro-formatter";

const avroType = avro.Type.forSchema(avroServiceTopics.schema as avro.Schema);

const aServiceTopicArray = [
  {
    id: 1,
    name: "topic1",
    deleted: false,
  },
  {
    id: 2,
    name: "topic2",
    deleted: true,
  },
];

const aServiceTopicItem = {
  id: 1,
  name: "topic1",
  deleted: false,
} as AllServiceTopics;

describe("Service Publication Avro Formatter", () => {
  it("should format a Service Publication Cosmos Resource to an EventData containing ad body the Avro encode resource", () => {
    const res = avroServiceTopicFormatter(aServiceTopicItem);

    expect(E.isRight(res)).toBeTruthy();

    if (E.isRight(res)) {
      const rightVal = res.right;
      expect(rightVal).toHaveProperty("body");

      // convert buffer
      const body = avroType.fromBuffer(rightVal.body);

      expect(body).toEqual({
        id: 1,
        name: "topic1",
        deleted: false,
      });

      //console.log(body);
    }
  });

  it("should fail when the service does not meet the Avro criteria", () => {
    const aBsdServiceTopicItem: AllServiceTopics = {
      ...aServiceTopicItem,
      id: undefined, // this will make the formatter fail
    } as unknown as AllServiceTopics;

    const res = avroServiceTopicFormatter(aBsdServiceTopicItem);

    expect(E.isLeft(res)).toBeTruthy();
  });
});
