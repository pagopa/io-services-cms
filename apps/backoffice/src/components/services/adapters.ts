/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
import { CreateServicePayload as ApiServicePayload } from "@/generated/api/CreateServicePayload";
import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import { ServiceLifecycleMetadata } from "@/generated/api/ServiceLifecycleMetadata";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServicePublication } from "@/generated/api/ServicePublication";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";
import {
  AssistanceChannel,
  AssistanceChannelType,
  AssistanceChannelsMetadata,
  Ctas,
  Service,
  ServiceCreateUpdatePayload,
} from "@/types/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import _ from "lodash";

const adaptServiceCommonData = (
  service: ServiceLifecycle | ServicePublication,
) => ({
  authorized_cidrs: service.authorized_cidrs
    ? (service.authorized_cidrs as unknown as string[])
    : [],
  authorized_recipients: service.authorized_recipients
    ? (service.authorized_recipients as unknown as string[])
    : [],
  description: service.description,
  lastUpdate: service.last_update,
  max_allowed_payment_amount: service.max_allowed_payment_amount ?? 0,
  name: service.name,
  require_secure_channel: service.require_secure_channel ?? false,
  topic: service.metadata.topic,
});

const adaptServiceMetadata = (metadata: ServiceLifecycleMetadata) => ({
  address: metadata.address,
  app_android: metadata.app_android,
  app_ios: metadata.app_ios,
  cta: metadata.cta,
  email: metadata.email,
  group: metadata.group,
  pec: metadata.pec,
  phone: metadata.phone,
  privacy_url: metadata.privacy_url,
  scope: metadata.scope,
  support_url: metadata.support_url,
  token_name: metadata.token_name,
  topic: metadata.topic,
  tos_url: metadata.tos_url,
  web_url: metadata.web_url,
});

export const fromServiceLifecycleToService = (
  service?: ServiceLifecycle,
  visibility?: ServicePublicationStatusType,
): Service | undefined => {
  if (service) {
    return {
      id: service.id,
      status: service.status,
      visibility,
      ...adaptServiceCommonData(service),
      metadata: adaptServiceMetadata(service.metadata),
    };
  }
};

export const fromServicePublicationToService = (
  service?: ServicePublication,
): Service | undefined => {
  if (service) {
    return {
      id: service.id,
      status: { value: ServiceLifecycleStatusTypeEnum.approved },
      visibility: service?.status,
      ...adaptServiceCommonData(service),
      metadata: adaptServiceMetadata(service.metadata),
    };
  }
};

/**
 * Convert _'frontend'_ service payload to `@/generated/api/ServicePayload`
 * @param feService service _(as result of frontend create/update process)_
 * @returns `Validation<ApiServicePayload>`
 */
export const fromServiceCreateUpdatePayloadToApiServicePayload = (
  feService: ServiceCreateUpdatePayload,
) =>
  pipe(
    convertAssistanceChannelsArrayToObj(feService.metadata.assistanceChannels),
    buildBaseServicePayload(feService),
    clearUndefinedNullEmptyProperties,
    removeAssistanceChannelsArray,
    ApiServicePayload.decode,
  );

/**
 * Convert `@/generated/api/ServiceLifecycle` to _'frontend'_ service payload
 * @param sl `ServiceLifecycle` _(as result of api getService fetch)_
 * @returns `ServiceCreateUpdatePayload`
 */
export const fromServiceLifecycleToServiceCreateUpdatePayload = (
  sl: ServiceLifecycle,
): ServiceCreateUpdatePayload => ({
  authorized_cidrs: sl.authorized_cidrs
    ? Array.from(sl.authorized_cidrs.values())
    : [],
  authorized_recipients: sl.authorized_recipients
    ? Array.from(sl.authorized_recipients.values())
    : [],
  description: sl.description,
  max_allowed_payment_amount: sl.max_allowed_payment_amount ?? 0,
  metadata: {
    address: sl.metadata.address ?? "",
    app_android: sl.metadata.app_android ?? "",
    app_ios: sl.metadata.app_ios ?? "",
    assistanceChannels: convertAssistanceChannelsObjToArray(sl.metadata),
    cta: buildCtaObj(sl.metadata.cta ?? ""),
    group_id: sl.metadata.group?.id,
    privacy_url: sl.metadata.privacy_url ?? "",
    scope: sl.metadata.scope,
    token_name: sl.metadata.token_name ?? "",
    topic_id: sl.metadata.topic?.id,
    tos_url: sl.metadata.tos_url ?? "",
    web_url: sl.metadata.web_url ?? "",
  },
  name: sl.name,
  require_secure_channel: sl.require_secure_channel ?? false,
});

const buildBaseServicePayload =
  (s: ServiceCreateUpdatePayload) =>
  (assistanceChannels: Record<string, string>) => ({
    ...s,
    authorized_cidrs: s.authorized_cidrs,
    authorized_recipients: s.authorized_recipients,
    max_allowed_payment_amount: s.max_allowed_payment_amount,
    metadata: {
      ...s.metadata,
      cta: buildCtaStringForPayload(s.metadata.cta),
      ...assistanceChannels,
    },
    require_secure_channel: s.require_secure_channel,
  });

const convertAssistanceChannelsArrayToObj = (arr: AssistanceChannel[]) => {
  const result: Record<string, string> = {};
  for (const channel of arr) {
    result[channel.type] = channel.value;
  }
  return result;
};

const convertAssistanceChannelsObjToArray = (
  obj: AssistanceChannelsMetadata,
) => {
  const channels: AssistanceChannel[] = [];
  const allowedTypes: AssistanceChannelType[] = [
    "email",
    "pec",
    "phone",
    "support_url",
  ];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const type = key as AssistanceChannelType;
      if (allowedTypes.includes(type)) {
        const value = obj[key as keyof AssistanceChannelsMetadata];
        channels.push({ type, value: value ?? "" });
      }
    }
  }
  return channels;
};
const buildCtaStringForPayload = (ctaObj: Ctas): string | undefined => {
  const text1 = ctaObj?.cta_1?.text?.trim() ?? "";
  if (text1 === "") return undefined;

  const hasCta2 = (ctaObj?.cta_2?.text?.trim() ?? "") !== "";

  return hasCta2
    ? buildCtaString(ctaObj.cta_1, ctaObj.cta_2)
    : buildCtaString(ctaObj.cta_1);
};

const buildCtaString = (
  ctaObj: { text: string; url: string; urlPrefix: string },
  ctaObj2?: { text: string; url: string; urlPrefix: string },
) => {
  const cta_2 = ctaObj2?.text
    ? `  cta_2: \n    text: \"${ctaObj2.text}\"\n    action: \"${ctaObj2.urlPrefix}${ctaObj2.url}\"\n`
    : ``;
  return `---\nit:\n  cta_1: \n    text: \"${ctaObj.text}\"\n    action: \"${ctaObj.urlPrefix}${ctaObj.url}\"\n${cta_2}en:\n  cta_1: \n    text: \"${ctaObj.text}\"\n    action: \"${ctaObj.urlPrefix}${ctaObj.url}\"\n${cta_2}---`;
};

const buildCtaObj = (ctaString?: string): Ctas => {
  // Read the CTA value from the service payload and build the object used to populate the form.
  // We use the `urlPrefix` field to store the select value and determine the link type
  if (NonEmptyString.is(ctaString)) {
    const itBlock = ctaString.split("en:")[0]; // we take only italian block
    const hasCta_2 = itBlock.includes("cta_2:"); // check the word cta_2: if found return true ( so we know that we have cta_2 )
    const cta_2 = itBlock.split("cta_2:")[1]; // take the source string on the right of cta_2 string from payload

    const URL_PREFIX_REGEX = /(iosso:\/\/|ioit:\/\/|iohandledlink:\/\/)/; // our value to match for parsing from url to setup the select

    const splitUrlPrefix = (urlValue: string) => {
      const matchedObject = urlValue.match(URL_PREFIX_REGEX);
      return matchedObject // if no match return null, otherwise an array in 0 position original source and in  position from [1] to n the matched group value from URL_PREFIX_REGEX, in our case we match only one group, so only in matchedObject[1]
        ? {
            url: urlValue.replace(URL_PREFIX_REGEX, ""),
            urlPrefix: matchedObject[1],
          }
        : { url: urlValue, urlPrefix: "" };
    };

    const text1 = getCtaValueFromCtaString(ctaString, "text"); // we get value only from cta_1
    const act1 = getCtaValueFromCtaString(ctaString, "action");

    const { url: url1, urlPrefix: pre1 } = splitUrlPrefix(act1);
    //parsing url, we get the urlprefix value and put in urlprefix and we get url value without urlprefix

    let text2 = "",
      pre2 = "",
      url2 = "";
    if (hasCta_2) {
      text2 = getCtaValueFromCtaString(cta_2, "text"); // we get value only from cta_2
      const act2 = getCtaValueFromCtaString(cta_2, "action");

      ({ url: url2, urlPrefix: pre2 } = splitUrlPrefix(act2));
      //parsing url, we get the urlprefix value and put in urlprefix and we get url value without urlprefix
    }

    return {
      cta_1: { text: text1, url: url1, urlPrefix: pre1 },
      cta_2: { text: text2, url: url2, urlPrefix: pre2 },
    };
  }

  return {
    cta_1: { text: "", url: "", urlPrefix: "" }, //default value for form are cta complete and all value ""
    cta_2: { text: "", url: "", urlPrefix: "" },
  };
};

const getCtaValueFromCtaString = (
  cta: string,
  valueType: "action" | "text",
) => {
  // Splits the string into lines
  const lines = cta.split("\n");
  // Find the line containing <valueType>: "<value>"
  const valueLine = lines.find((line) => line.includes(`${valueType}:`));
  // Extract the value between the quotes
  const match = /\"(.+?)\"/.exec(valueLine ?? "");
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
const clearUndefinedNullEmptyProperties = (s: any): any => {
  if (_.isObject(s) && !_.isArray(s)) {
    return _.mapValues(
      _.pickBy(s, (val) => !_.isUndefined(val) && !_.isNull(val) && val !== ""),
      clearUndefinedNullEmptyProperties,
    );
  }
  return s;
};

/** Remove temporary assistanceChannels[] metadata used for react-hook-form dynamic array fields. */
const removeAssistanceChannelsArray = (s: any) =>
  _.omit(s, "metadata.assistanceChannels");
