import { EventData } from "@azure/event-hubs";
import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { activation as avroActivation } from "../../../generated/avro/dto/activation";
import { EnrichedLegacyActivationCosmosResource } from "../enriched-types/activation-pdv-enriched";

export const buildAvroActivationObject = (
  activationCosmosRecord: EnrichedLegacyActivationCosmosResource,
): Omit<avroActivation, "schema" | "subject"> => ({
  id:
    activationCosmosRecord.userPDVId +
    activationCosmosRecord.serviceId +
    activationCosmosRecord._ts,
  modifiedAt: activationCosmosRecord._ts,
  serviceId: activationCosmosRecord.serviceId,
  status: activationCosmosRecord.status,
  userPDVId: activationCosmosRecord.userPDVId,
});

export const avroActivationFormatter = (
  item: EnrichedLegacyActivationCosmosResource,
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
