import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { describe, expect, it } from "vitest";
import { ServicePayload as ApiServicePayload } from "../../../generated/api/ServicePayload";
import { ServiceCreateUpdatePayload } from "../../../types/service";
import {
  fromServiceCreateUpdatePayloadToApiServicePayload,
  fromServiceLifecycleToServiceCreateUpdatePayload
} from "../adapters";
import { CTA_PREFIX_URL_SCHEMES } from "../service-create-update/cta-manager/constants";

const aValidServiceCreateUpdatePayload: ServiceCreateUpdatePayload = {
  name: "aServiceName",
  description: "aServiceDescription",
  metadata: {
    web_url: "aWebUrl",
    app_ios: "anAppIosUrl",
    app_android: "anAppAndroidUrl",
    tos_url: "aTosUrl",
    privacy_url: "aPrivacyUrl",
    address: "anAddress",
    cta: {
      cta_1: {
        enabled: true,
        urlPrefix: CTA_PREFIX_URL_SCHEMES.EXTERNAL,
        text: "aCtaText1",
        url: "aCtaUrl1"
      },
      cta_2: {
        enabled: false,
        urlPrefix: CTA_PREFIX_URL_SCHEMES.EXTERNAL,
        text: "",
        url: ""
      }
    },
    scope: "LOCAL",
    assistanceChannels: [
      { type: "email", value: "aValidEmail" },
      { type: "pec", value: "aValidPec" },
      { type: "phone", value: "aValidPhoneNumber" },
      { type: "support_url", value: "aValidUrl" }
    ]
  },
  require_secure_channel: false,
  authorized_cidrs: ["0.0.0.0/0"],
  authorized_recipients: [],
  max_allowed_payment_amount: 0
};

const aCtaResult = `---
it:
  cta_1: 
    text: "aCtaText1"
    action: "${CTA_PREFIX_URL_SCHEMES.EXTERNAL}aCtaUrl1"
en:
  cta_1: 
    text: "aCtaText1"
    action: "${CTA_PREFIX_URL_SCHEMES.EXTERNAL}aCtaUrl1"
---`;

const anApiServicePayloadResult = ({
  name: aValidServiceCreateUpdatePayload.name,
  description: aValidServiceCreateUpdatePayload.description,
  metadata: {
    email:
      aValidServiceCreateUpdatePayload.metadata.assistanceChannels[0].value,
    pec: aValidServiceCreateUpdatePayload.metadata.assistanceChannels[1].value,
    phone:
      aValidServiceCreateUpdatePayload.metadata.assistanceChannels[2].value,
    support_url:
      aValidServiceCreateUpdatePayload.metadata.assistanceChannels[3].value,
    web_url: aValidServiceCreateUpdatePayload.metadata.web_url,
    app_ios: aValidServiceCreateUpdatePayload.metadata.app_ios,
    app_android: aValidServiceCreateUpdatePayload.metadata.app_android,
    tos_url: aValidServiceCreateUpdatePayload.metadata.tos_url,
    privacy_url: aValidServiceCreateUpdatePayload.metadata.privacy_url,
    address: aValidServiceCreateUpdatePayload.metadata.address,
    cta: aCtaResult,
    scope: aValidServiceCreateUpdatePayload.metadata.scope
  },
  require_secure_channel: false,
  authorized_cidrs: ["0.0.0.0/0"],
  authorized_recipients: [],
  max_allowed_payment_amount: 0
} as unknown) as ApiServicePayload;

describe("[Services] Adapters", () => {
  it("should return a valid Api ServicePayload if a valid frontend service payload is provided", () => {
    const result = fromServiceCreateUpdatePayloadToApiServicePayload(
      aValidServiceCreateUpdatePayload
    ) as t.Validation<ServiceCreateUpdatePayload>;

    expect(E.isRight(result));

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual(anApiServicePayloadResult);
    }
  });

  it("should return a Validation error if an invalid frontend service payload is provided", () => {
    const anInvalidServiceCreateUpdatePayload = {
      ...aValidServiceCreateUpdatePayload,
      name: ""
    };

    const result = fromServiceCreateUpdatePayloadToApiServicePayload(
      anInvalidServiceCreateUpdatePayload
    ) as t.Validation<ServiceCreateUpdatePayload>;

    expect(E.isLeft(result));
  });

  it("should return a valid frontend service payload if a valid Api ServiceLifecycle is provided", () => {
    const result = fromServiceLifecycleToServiceCreateUpdatePayload(
      anApiServicePayloadResult
    );
    const aServiceCreateUpdatePayload = {
      ...aValidServiceCreateUpdatePayload,
      metadata: {
        ...aValidServiceCreateUpdatePayload.metadata,
        group_id: undefined,
        token_name: "",
        topic_id: undefined
      }
    };
    expect(result).toStrictEqual(aServiceCreateUpdatePayload);
  });

  it("should return a valid frontend service payload with topic, if a valid Api ServiceLifecycle is provided", () => {
    const result = fromServiceLifecycleToServiceCreateUpdatePayload({
      ...anApiServicePayloadResult,
      metadata: {
        ...anApiServicePayloadResult.metadata,
        topic: { id: 0, name: "Altro" }
      }
    });
    const aServiceCreateUpdatePayload = {
      ...aValidServiceCreateUpdatePayload,
      metadata: {
        ...aValidServiceCreateUpdatePayload.metadata,
        group_id: undefined,
        token_name: "",
        topic_id: 0
      }
    };
    expect(result).toStrictEqual(aServiceCreateUpdatePayload);
  });
});
