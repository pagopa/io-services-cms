/* eslint-disable prettier/prettier */
/* eslint-disable perfectionist/sort-objects */
import { DateUtils, ServicePublication } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as avro from "avsc";

import { PublicationCategoryEnum } from "../../../generated/avro/dto/PublicationCategoryEnumEnum";
import { PublicationScopeEnum } from "../../../generated/avro/dto/PublicationScopeEnumEnum";
import { PublicationStateEnum } from "../../../generated/avro/dto/PublicationStateEnumEnum";
import { servicePublication as avroServicePublication } from "../../../generated/avro/dto/servicePublication";

//PublicationStateEnum

export const buildAvroServicePublicationObject = (
  servicePublicationCosmosRecord: ServicePublication.CosmosResource,
): Omit<avroServicePublication, "schema" | "subject"> =>
  // eslint-disable-next-line no-console, no-underscore-dangle
  ({
    data: {
      authorized_cidrs: servicePublicationCosmosRecord.data.authorized_cidrs,

      authorized_recipients:
        servicePublicationCosmosRecord.data.authorized_recipients,

      description: servicePublicationCosmosRecord.data.description,

      max_allowed_payment_amount:
        servicePublicationCosmosRecord.data.max_allowed_payment_amount,
      name: servicePublicationCosmosRecord.data.name,

      require_secure_channel:
        servicePublicationCosmosRecord.data.require_secure_channel,

      organization: {
        name: servicePublicationCosmosRecord.data.organization.name,
        fiscal_code:
          servicePublicationCosmosRecord.data.organization.fiscal_code,
        department_name:
          servicePublicationCosmosRecord.data.organization.department_name,
      },

      metadata: {
        scope: toAvroScope(servicePublicationCosmosRecord.data.metadata.scope),
        address: servicePublicationCosmosRecord.data.metadata.address,
        category: toAvroCategory(
          servicePublicationCosmosRecord.data.metadata.category,
        ),
        email: servicePublicationCosmosRecord.data.metadata.email,
        pec: servicePublicationCosmosRecord.data.metadata.pec,
        phone: servicePublicationCosmosRecord.data.metadata.phone,
        token_name: servicePublicationCosmosRecord.data.metadata.token_name,
        privacy_url: servicePublicationCosmosRecord.data.metadata.privacy_url,
        app_android: servicePublicationCosmosRecord.data.metadata.app_android,
        app_ios: servicePublicationCosmosRecord.data.metadata.app_ios,
        cta: servicePublicationCosmosRecord.data.metadata.cta,
        custom_special_flow:
          servicePublicationCosmosRecord.data.metadata.custom_special_flow,
        support_url: servicePublicationCosmosRecord.data.metadata.support_url,
        tos_url: servicePublicationCosmosRecord.data.metadata.tos_url,
        web_url: servicePublicationCosmosRecord.data.metadata.web_url,
        topic_id: servicePublicationCosmosRecord.data.metadata.topic_id,
      },
    },
    id: servicePublicationCosmosRecord.id,
    fsm: {
      state: toAvroFsmState(servicePublicationCosmosRecord.fsm),
    },
    modified_at:
      servicePublicationCosmosRecord.modified_at ??
      DateUtils.unixSecondsToMillis(servicePublicationCosmosRecord._ts),
    version: cleanEtag(servicePublicationCosmosRecord._etag),
  });

const cleanEtag = (etag: NonEmptyString): string => etag.replace(/"/g, "");

export const toAvroFsmState = (
  fsm: ServicePublication.CosmosResource["fsm"],
): PublicationStateEnum => {
  if (fsm.state === "unpublished") {
    return PublicationStateEnum.unpublished;
  }
  return PublicationStateEnum.published;
};

export const toAvroScope = (
  s: ServicePublication.CosmosResource["data"]["metadata"]["scope"],
): PublicationScopeEnum => {
  if (s === "NATIONAL") {
    return PublicationScopeEnum.NATIONAL;
  }
  return PublicationScopeEnum.LOCAL;
};

export const toAvroCategory = (
  s: ServicePublication.CosmosResource["data"]["metadata"]["category"],
): PublicationCategoryEnum => {
  if (s === "SPECIAL") {
    return PublicationCategoryEnum.SPECIAL;
  }
  return PublicationCategoryEnum.STANDARD;
};

export const avroServicePublicationFormatter = (
  item: ServicePublication.CosmosResource,
) =>
  avro.Type.forSchema(
    avroServicePublication.schema as avro.Schema, // cast due to tsc can not proper recognize object as avro.Schema (eg. if you use const schemaServices: avro.Type = JSON.parse(JSON.stringify(services.schema())); it will loose the object type and it will work fine)
  ).toBuffer(
    Object.assign(
      new avroServicePublication(),
      buildAvroServicePublicationObject(item),
    ),
  );
