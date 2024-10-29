import { EventData } from "@azure/event-hubs";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { date } from "io-ts-types";

import { serviceTopics as avroServiceTopics } from "../../../generated/avro/dto/serviceTopics";

export type AllServiceTopics = t.TypeOf<typeof AllServiceTopics>;
export const AllServiceTopics = t.type({
  deleted: t.boolean,
  id: t.number,
  modified_at: date,
  name: NonEmptyString,
});

export const buildAvroServiceTopicObject = (
  serviceTopic: AllServiceTopics,
): Omit<avroServiceTopics, "schema" | "subject"> => ({
  deleted: serviceTopic.deleted,
  id: serviceTopic.id,
  modified_at: serviceTopic.modified_at.getTime(),
  name: serviceTopic.name,
});

export const avroServiceTopicFormatter = (
  item: AllServiceTopics,
): E.Either<Error, EventData> =>
  pipe(
    Object.assign(new avroServiceTopics(), buildAvroServiceTopicObject(item)),
    E.tryCatchK(
      (avroObj) =>
        avro.Type.forSchema(avroServiceTopics.schema as avro.Schema).toBuffer(
          avroObj,
        ),
      E.toError,
    ),
    E.map((avroBuffer) => ({ body: avroBuffer })),
  );
