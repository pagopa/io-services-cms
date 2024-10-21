import { EventData } from "@azure/event-hubs";
import { ServiceHistory } from "@io-services-cms/models";
import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { HistoryCategoryEnum } from "../../../generated/avro/dto/HistoryCategoryEnumEnum";
import { HistoryScopeEnum } from "../../../generated/avro/dto/HistoryScopeEnumEnum";
import { HistoryStateEnum } from "../../../generated/avro/dto/HistoryStateEnumEnum";
import { serviceHistory as avroServiceHistory } from "../../../generated/avro/dto/serviceHistory";

//HistoryStateEnum

export const buildAvroServiceHistoryObject = (
  serviceHistoryCosmosRecord: ServiceHistory,
): Omit<avroServiceHistory, "schema" | "subject"> =>
  // eslint-disable-next-line no-console, no-underscore-dangle
  ({
    data: {
      authorized_cidrs: serviceHistoryCosmosRecord.data.authorized_cidrs,

      authorized_recipients:
        serviceHistoryCosmosRecord.data.authorized_recipients,

      description: serviceHistoryCosmosRecord.data.description,

      max_allowed_payment_amount:
        serviceHistoryCosmosRecord.data.max_allowed_payment_amount,
      metadata: {
        address: serviceHistoryCosmosRecord.data.metadata.address,
        app_android: serviceHistoryCosmosRecord.data.metadata.app_android,
        app_ios: serviceHistoryCosmosRecord.data.metadata.app_ios,
        category: toAvroCategory(
          serviceHistoryCosmosRecord.data.metadata.category,
        ),
        cta: serviceHistoryCosmosRecord.data.metadata.cta,
        custom_special_flow:
          serviceHistoryCosmosRecord.data.metadata.custom_special_flow,
        email: serviceHistoryCosmosRecord.data.metadata.email,
        pec: serviceHistoryCosmosRecord.data.metadata.pec,
        phone: serviceHistoryCosmosRecord.data.metadata.phone,
        privacy_url: serviceHistoryCosmosRecord.data.metadata.privacy_url,
        scope: toAvroScope(serviceHistoryCosmosRecord.data.metadata.scope),
        support_url: serviceHistoryCosmosRecord.data.metadata.support_url,
        token_name: serviceHistoryCosmosRecord.data.metadata.token_name,
        topic_id: serviceHistoryCosmosRecord.data.metadata.topic_id,
        tos_url: serviceHistoryCosmosRecord.data.metadata.tos_url,
        web_url: serviceHistoryCosmosRecord.data.metadata.web_url,
      },

      name: serviceHistoryCosmosRecord.data.name,

      organization: {
        department_name:
          serviceHistoryCosmosRecord.data.organization.department_name,
        fiscal_code: serviceHistoryCosmosRecord.data.organization.fiscal_code,
        name: serviceHistoryCosmosRecord.data.organization.name,
      },

      require_secure_channel:
        serviceHistoryCosmosRecord.data.require_secure_channel,
    },
    fsm: {
      state: toAvroFsmState(serviceHistoryCosmosRecord.fsm),
    },
    id: serviceHistoryCosmosRecord.id,
    last_update: serviceHistoryCosmosRecord.last_update,
    serviceId: serviceHistoryCosmosRecord.serviceId,
    version: cleanEtag(serviceHistoryCosmosRecord.version ?? ""), //FIX ME this will work at the start because we do not send all history but only records from the moment the ingestion start and right now version is set for every new record that is written so il will never be empty, but we need to fix this before ingesting all of history because there are some old records where version is not present
  });

//const cleanEtag = (etag: NonEmptyString): string => etag.replace(/"/g, "");

const cleanEtag = (etag: string): string => {
  if (etag !== "") {
    return etag.replace(/"/g, "");
  }
  return etag;
};

export const toAvroFsmState = (
  fsm: ServiceHistory["fsm"],
): HistoryStateEnum => {
  switch (fsm.state) {
    case "approved":
      return HistoryStateEnum.approved;
    case "deleted":
      return HistoryStateEnum.deleted;
    case "draft":
      return HistoryStateEnum.draft;
    case "rejected":
      return HistoryStateEnum.rejected;
    case "submitted":
      return HistoryStateEnum.submitted;
    case "published":
      return HistoryStateEnum.published;
    case "unpublished":
      return HistoryStateEnum.unpublished;
  }
};

export const toAvroScope = (
  s: ServiceHistory["data"]["metadata"]["scope"],
): HistoryScopeEnum => {
  if (s === "NATIONAL") {
    return HistoryScopeEnum.NATIONAL;
  }
  return HistoryScopeEnum.LOCAL;
};

export const toAvroCategory = (
  s: ServiceHistory["data"]["metadata"]["category"],
): HistoryCategoryEnum => {
  if (s === "SPECIAL") {
    return HistoryCategoryEnum.SPECIAL;
  }
  return HistoryCategoryEnum.STANDARD;
};

export const avroServiceHistoryFormatter = (
  item: ServiceHistory,
): E.Either<Error, EventData> =>
  pipe(
    Object.assign(
      new avroServiceHistory(),
      buildAvroServiceHistoryObject(item),
    ),
    E.right,
    E.chain((avroObj) =>
      E.tryCatch(
        () =>
          avro.Type.forSchema(
            avroServiceHistory.schema as avro.Schema, // cast due to tsc can not proper recognize object as avro.Schema (eg. if you use const schemaServices: avro.Type = JSON.parse(JSON.stringify(services.schema())); it will loose the object type and it will work fine)
          ).toBuffer(avroObj),
        E.toError,
      ),
    ),
    E.map((avroBuffer) => ({ body: avroBuffer })),
  );
