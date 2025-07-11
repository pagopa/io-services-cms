import { EventData } from "@azure/event-hubs";
import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { ServiceActivations as avroActivation } from "../../../generated/avro/dto/ServiceActivations";
import { StatusEnum } from "../../../generated/avro/dto/StatusEnumEnum";
import { EnrichedActivation } from "../enriched-types/activation-pdv-enriched";

export const buildAvroActivationObject = (
  activation: EnrichedActivation,
): Omit<avroActivation, "schema" | "subject"> => {
  const lastUpdate = convertToMilliseconds(activation.lastUpdate);
  return {
    id: [activation.userPDVId, activation.serviceId, lastUpdate].join("-"),
    //converting cosmos _ts from seconds to millis
    modifiedAt: lastUpdate,
    serviceId: activation.serviceId,
    status: toAvroStatus(activation.status),
    userPDVId: activation.userPDVId,
  };
};

const toAvroStatus = (status: EnrichedActivation["status"]): StatusEnum => {
  switch (status) {
    case "ACTIVE":
      return StatusEnum.ACTIVE;
    case "INACTIVE":
      return StatusEnum.INACTIVE;
    case "PENDING":
      return StatusEnum.PENDING;
  }
};

const convertToMilliseconds = (timestamp: number): number => {
  if (String(timestamp).length === 13) {
    return timestamp;
  }
  return timestamp * 1000;
};

export const avroActivationFormatter = (
  item: EnrichedActivation,
): E.Either<Error, EventData> =>
  pipe(
    Object.assign(new avroActivation(), buildAvroActivationObject(item)),
    E.right,
    E.chain((avroObj) =>
      E.tryCatch(
        () =>
          avro.Type.forSchema(
            avroActivation.schema as avro.Schema, // cast due to tsc can not proper recognize object as avro.Schema (eg. if you use const schemaServices: avro.Type = JSON.parse(JSON.stringify(services.schema())); it will loose the object type and it will work fine)
          ).toBuffer(avroObj),
        E.toError,
      ),
    ),
    E.map((avroBuffer) => ({ body: avroBuffer })),
  );
