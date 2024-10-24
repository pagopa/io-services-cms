import { EventData } from "@azure/event-hubs";
import { DateUtils, ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as avro from "avsc";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { LifecycleCategoryEnum } from "../../../generated/avro/dto/LifecycleCategoryEnumEnum";
import { LifecycleScopeEnum } from "../../../generated/avro/dto/LifecycleScopeEnumEnum";
import { LifecycleStateEnum } from "../../../generated/avro/dto/LifecycleStateEnumEnum";
import { serviceLifecycle as avroServiceLifecycle } from "../../../generated/avro/dto/serviceLifecycle";

//LifecycleStateEnum

export const buildAvroServiceLifecycleObject = (
  serviceLifecycleCosmosRecord: ServiceLifecycle.CosmosResource,
): Omit<avroServiceLifecycle, "schema" | "subject"> =>
  // eslint-disable-next-line no-console, no-underscore-dangle
  ({
    data: {
      authorized_cidrs: serviceLifecycleCosmosRecord.data.authorized_cidrs,

      authorized_recipients:
        serviceLifecycleCosmosRecord.data.authorized_recipients,

      description: serviceLifecycleCosmosRecord.data.description,

      max_allowed_payment_amount:
        serviceLifecycleCosmosRecord.data.max_allowed_payment_amount,
      metadata: {
        address: serviceLifecycleCosmosRecord.data.metadata.address,
        app_android: serviceLifecycleCosmosRecord.data.metadata.app_android,
        app_ios: serviceLifecycleCosmosRecord.data.metadata.app_ios,
        category: toAvroCategory(
          serviceLifecycleCosmosRecord.data.metadata.category,
        ),
        cta: serviceLifecycleCosmosRecord.data.metadata.cta,
        custom_special_flow:
          serviceLifecycleCosmosRecord.data.metadata.custom_special_flow,
        email: serviceLifecycleCosmosRecord.data.metadata.email,
        pec: serviceLifecycleCosmosRecord.data.metadata.pec,
        phone: serviceLifecycleCosmosRecord.data.metadata.phone,
        privacy_url: serviceLifecycleCosmosRecord.data.metadata.privacy_url,
        scope: toAvroScope(serviceLifecycleCosmosRecord.data.metadata.scope),
        support_url: serviceLifecycleCosmosRecord.data.metadata.support_url,
        token_name: serviceLifecycleCosmosRecord.data.metadata.token_name,
        topic_id: serviceLifecycleCosmosRecord.data.metadata.topic_id,
        tos_url: serviceLifecycleCosmosRecord.data.metadata.tos_url,
        web_url: serviceLifecycleCosmosRecord.data.metadata.web_url,
      },

      name: serviceLifecycleCosmosRecord.data.name,

      organization: {
        department_name:
          serviceLifecycleCosmosRecord.data.organization.department_name,
        fiscal_code: serviceLifecycleCosmosRecord.data.organization.fiscal_code,
        name: serviceLifecycleCosmosRecord.data.organization.name,
      },

      require_secure_channel:
        serviceLifecycleCosmosRecord.data.require_secure_channel,
    },
    fsm: {
      state: toAvroFsmState(serviceLifecycleCosmosRecord.fsm),
    },
    id: serviceLifecycleCosmosRecord.id,
    modified_at:
      serviceLifecycleCosmosRecord.modified_at ??
      DateUtils.unixSecondsToMillis(serviceLifecycleCosmosRecord._ts),
    version: cleanEtag(serviceLifecycleCosmosRecord._etag),
  });

const cleanEtag = (etag: NonEmptyString): string => etag.replace(/"/g, "");

export const toAvroFsmState = (
  fsm: ServiceLifecycle.CosmosResource["fsm"],
): LifecycleStateEnum => {
  switch (fsm.state) {
    case "approved":
      return LifecycleStateEnum.approved;
    case "deleted":
      return LifecycleStateEnum.deleted;
    case "draft":
      return LifecycleStateEnum.draft;
    case "rejected":
      return LifecycleStateEnum.rejected;
    case "submitted":
      return LifecycleStateEnum.submitted;
  }
};

export const toAvroScope = (
  s: ServiceLifecycle.CosmosResource["data"]["metadata"]["scope"],
): LifecycleScopeEnum => {
  if (s === "NATIONAL") {
    return LifecycleScopeEnum.NATIONAL;
  }
  return LifecycleScopeEnum.LOCAL;
};

export const toAvroCategory = (
  s: ServiceLifecycle.CosmosResource["data"]["metadata"]["category"],
): LifecycleCategoryEnum => {
  if (s === "SPECIAL") {
    return LifecycleCategoryEnum.SPECIAL;
  }
  return LifecycleCategoryEnum.STANDARD;
};

export const avroServiceLifecycleFormatter = (
  item: ServiceLifecycle.CosmosResource,
): E.Either<Error, EventData> =>
  pipe(
    Object.assign(
      new avroServiceLifecycle(),
      buildAvroServiceLifecycleObject(item),
    ),
    E.right,
    E.chain((avroObj) =>
      E.tryCatch(
        () =>
          avro.Type.forSchema(
            avroServiceLifecycle.schema as avro.Schema, // cast due to tsc can not proper recognize object as avro.Schema (eg. if you use const schemaServices: avro.Type = JSON.parse(JSON.stringify(services.schema())); it will loose the object type and it will work fine)
          ).toBuffer(avroObj),
        E.toError,
      ),
    ),
    E.map((avroBuffer) => ({ body: avroBuffer })),
  );
