import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServiceMetadata } from "@/generated/api/ServiceMetadata";
import { ServicePayload as ApiServicePayload } from "@/generated/api/ServicePayload";
import { ServicePublication } from "@/generated/api/ServicePublication";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";
import {
  AssistanceChannel,
  Service,
  ServiceCreateUpdatePayload
} from "@/types/service";
import { pipe } from "fp-ts/lib/function";
import _ from "lodash";
import { User } from "next-auth";

const adaptServiceCommonData = (
  service: ServiceLifecycle | ServicePublication
) => ({
  lastUpdate: service.last_update,
  name: service.name,
  description: service.description,
  require_secure_channel: service.require_secure_channel ?? false,
  authorized_cidrs: service.authorized_cidrs
    ? ((service.authorized_cidrs as unknown) as string[])
    : [],
  authorized_recipients: service.authorized_recipients
    ? ((service.authorized_recipients as unknown) as string[])
    : [],
  max_allowed_payment_amount: service.max_allowed_payment_amount ?? 0
});

const adaptServiceMetadata = (metadata: ServiceMetadata) => ({
  web_url: metadata.web_url,
  app_ios: metadata.app_ios,
  app_android: metadata.app_android,
  tos_url: metadata.tos_url,
  privacy_url: metadata.privacy_url,
  address: metadata.address,
  phone: metadata.phone,
  email: metadata.email,
  pec: metadata.pec,
  cta: metadata.cta,
  token_name: metadata.token_name,
  support_url: metadata.support_url,
  category: metadata.category,
  custom_special_flow: metadata.custom_special_flow,
  scope: metadata.scope
});

export const fromServiceLifecycleToService = (
  service?: ServiceLifecycle,
  visibility?: ServicePublicationStatusType
): Service | undefined => {
  if (service) {
    return {
      id: service.id,
      status: service.status,
      visibility,
      ...adaptServiceCommonData(service),
      metadata: adaptServiceMetadata(service.metadata)
    };
  }
};

export const fromServicePublicationToService = (
  service?: ServicePublication
): Service | undefined => {
  if (service) {
    return {
      id: service.id,
      status: { value: ServiceLifecycleStatusTypeEnum.approved },
      visibility: service?.status,
      ...adaptServiceCommonData(service),
      metadata: adaptServiceMetadata(service.metadata)
    };
  }
};

/**
 * Convert _'frontend'_ service payload to `@/generated/api/ServicePayload`
 * @param feService service _(as result of frontend create/update process)_
 * @param sessionUser `next-auth` session user
 * @returns `Validation<ApiServicePayload>`
 */
export const fromServiceCreateUpdatePayloadToApiServicePayload = (
  feService: ServiceCreateUpdatePayload,
  sessionUser?: User
) =>
  pipe(
    convertAssistanceChannelsArrayToObj(feService.metadata.assistanceChannels),
    buildBaseServicePayload(feService, sessionUser),
    clearUndefinedEmptyProperties,
    removeAssistanceChannelsArray,
    ApiServicePayload.decode
  );

const buildBaseServicePayload = (
  s: ServiceCreateUpdatePayload,
  u?: User
) => (assistanceChannels: { [key: string]: string }) => ({
  ...s,
  require_secure_channel: s.require_secure_channel,
  authorized_cidrs: s.authorized_cidrs,
  authorized_recipients: s.authorized_recipients,
  max_allowed_payment_amount: s.max_allowed_payment_amount,
  organization: inferOrganizationFromUser(u),
  metadata: {
    ...s.metadata,
    cta: buildCtaString(s.metadata.cta),
    ...assistanceChannels
  }
});

const convertAssistanceChannelsArrayToObj = (arr: AssistanceChannel[]) => {
  const result: { [key: string]: string } = {};
  for (const channel of arr) {
    result[channel.type] = channel.value;
  }
  return result;
};

const inferOrganizationFromUser = (sessionUser?: User) => ({
  name: sessionUser?.institution.name,
  fiscal_code: "00000000000", // TODO Check how to get this
  department_name: "" // TODO Check if is useful
});

const buildCtaString = (ctaObj: { text: string; url: string }) => {
  if (ctaObj.text !== "" && ctaObj.url !== "") {
    return `"---\nit:\n  cta_1: \n    text: \"${ctaObj.text}\"\n    action: \"iohandledlink://${ctaObj.url}\"\nen:\n  cta_1: \n    text: \"${ctaObj.text}\"\n    action: \"iohandledlink://${ctaObj.url}\"\n---"`;
  }
  return "";
};

/**
 * Remove empty/undefined properties from object.\
 * Since the form using react-hook-form needs controlled inputs, all fields are initialized to an empty string.
 * Then there are also "temporary" fields that depend on the dynamic structure of the form (e.g.: form array fields)
 * or on future uses of such fields which may be undefined.
 * @param s service
 * @returns service without epmpty or undefined properties */
const clearUndefinedEmptyProperties = (s: any): any => {
  if (_.isObject(s) && !_.isArray(s)) {
    return _.mapValues(
      _.pickBy(s, val => !_.isUndefined(val) && val !== ""),
      clearUndefinedEmptyProperties
    );
  }
  return s;
};

/** Remove temporary assistanceChannels[] metadata used for react-hook-form dynamic array fields. */
const removeAssistanceChannelsArray = (s: any) =>
  _.omit(s, "metadata.assistanceChannels");
