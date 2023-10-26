import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServiceMetadata } from "@/generated/api/ServiceMetadata";
import { ServicePayload as ApiServicePayload } from "@/generated/api/ServicePayload";
import { ServicePublication } from "@/generated/api/ServicePublication";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";
import {
  AssistanceChannel,
  AssistanceChannelType,
  AssistanceChannelsMetadata,
  Service,
  ServiceCreateUpdatePayload
} from "@/types/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
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

/**
 * Convert `@/generated/api/ServicePayload` to _'frontend'_ service payload
 * @param apiService service _(as result api getService fetch)_
 * @param sessionUser `next-auth` session user
 * @returns `ServiceCreateUpdatePayload`
 */
export const fromApiServicePayloadToServiceCreateUpdatePayload = (
  apiService: ApiServicePayload
): ServiceCreateUpdatePayload => ({
  name: apiService.name,
  description: apiService.description,
  organization: {
    // TODO same check as `inferOrganizationFromUser`
    name: "",
    fiscal_code: "",
    department_name: ""
  },
  require_secure_channel: apiService.require_secure_channel ?? false,
  authorized_cidrs: apiService.authorized_cidrs
    ? Array.from(apiService.authorized_cidrs.values())
    : [],
  authorized_recipients: apiService.authorized_recipients
    ? Array.from(apiService.authorized_recipients.values())
    : [],
  max_allowed_payment_amount: apiService.max_allowed_payment_amount ?? 0,
  metadata: {
    web_url: apiService.metadata.web_url ?? "",
    app_ios: apiService.metadata.app_ios ?? "",
    app_android: apiService.metadata.app_android ?? "",
    tos_url: apiService.metadata.tos_url ?? "",
    privacy_url: apiService.metadata.privacy_url ?? "",
    address: apiService.metadata.address ?? "",
    assistanceChannels: convertAssistanceChannelsObjToArray(
      apiService.metadata
    ),
    cta: buildCtaObj(apiService.metadata.cta),
    token_name: apiService.metadata.token_name ?? "",
    category: apiService.metadata.category ?? "",
    custom_special_flow: apiService.metadata.custom_special_flow ?? "",
    scope: apiService.metadata.scope
  }
});

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

const convertAssistanceChannelsObjToArray = (
  obj: AssistanceChannelsMetadata
) => {
  const channels: AssistanceChannel[] = [];
  const allowedTypes: AssistanceChannelType[] = [
    "email",
    "pec",
    "phone",
    "support_url"
  ];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const type = key as AssistanceChannelType;
      if (allowedTypes.includes(type)) {
        const value = obj[key as keyof AssistanceChannelsMetadata];
        channels.push({ type, value: value ?? "" });
      }
    }
  }
  return channels;
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

const buildCtaObj = (ctaString?: string) => {
  if (NonEmptyString.is(ctaString)) {
    return {
      text: getCtaTextFromCtaString(ctaString),
      url: getCtaUrlFromCtaString(ctaString)
    };
  }
  return { text: "", url: "" };
};

const getCtaTextFromCtaString = (value: string) => {
  // Splits the string into lines
  const lines = value.split("\n");
  // Find the line containing 'text: "<text>"'
  const textLine = lines.find(line => line.includes("text:"));
  // Extract the text between the quotes
  const match = /\"(.+?)\"/.exec(textLine ?? "");
  if (match) {
    return match[1];
  }
  return "";
};

const getCtaUrlFromCtaString = (value: string) => {
  // Splits the string into lines
  const lines = value.split("\n");
  // Find the line containing 'text: "<text>"'
  const actionLine = lines.find(line => line.includes("action:"));
  // Extract the text between the quotes
  const match = /iohandledlink:\/\/(.+?)\"/.exec(actionLine ?? "");
  if (match) {
    return match[1];
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
