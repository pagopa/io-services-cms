import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { describe, expect, it } from "vitest";
import { ServicePayload as ApiServicePayload } from "../../../generated/api/ServicePayload";
import { ServiceCreateUpdatePayload } from "../../../types/service";
import {
  fromApiServicePayloadToServiceCreateUpdatePayload,
  fromServiceCreateUpdatePayloadToApiServicePayload
} from "../adapters";

const mockedSessionUser = {
  institution: { name: "anInstitutionName" }
} as any;

const aValidServiceCreateUpdatePayload: ServiceCreateUpdatePayload = {
  name: "aServiceName",
  description: "aServiceDescription",
  organization: { name: "", fiscal_code: "", department_name: "" },
  metadata: {
    web_url: "aWebUrl",
    app_ios: "anAppIosUrl",
    app_android: "anAppAndroidUrl",
    tos_url: "aTosUrl",
    privacy_url: "aPrivacyUrl",
    address: "anAddress",
    cta: { text: "aCtaText", url: "aCtaUrl" },
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

const aCtaResult =
  '"---\nit:\n  cta_1: \n    text: "aCtaText"\n    action: "iohandledlink://aCtaUrl"\nen:\n  cta_1: \n    text: "aCtaText"\n    action: "iohandledlink://aCtaUrl"\n---"';

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
  it("should return a valid Api ServicePayload if a valid frontend service payload and session user are provided", () => {
    const result = fromServiceCreateUpdatePayloadToApiServicePayload(
      aValidServiceCreateUpdatePayload,
      mockedSessionUser
    ) as t.Validation<ServiceCreateUpdatePayload>;

    expect(E.isRight(result));

    if (E.isRight(result)) {
      const servicePayload = {
        ...anApiServicePayloadResult,
        organization: {
          name: mockedSessionUser.institution.name,
          fiscal_code: "00000000000"
        }
      };
      expect(result.right).toStrictEqual(servicePayload);
    }
  });

  it("should return a Validation error if an invalid frontend service payload is provided", () => {
    const anInvalidServiceCreateUpdatePayload = {
      ...aValidServiceCreateUpdatePayload,
      name: ""
    };

    const result = fromServiceCreateUpdatePayloadToApiServicePayload(
      anInvalidServiceCreateUpdatePayload,
      mockedSessionUser
    ) as t.Validation<ServiceCreateUpdatePayload>;

    expect(E.isLeft(result));
  });

  it("should return a valid frontend service payload if a valid Api ServicePayload is provided", () => {
    const result = fromApiServicePayloadToServiceCreateUpdatePayload(
      anApiServicePayloadResult
    );
    const aServiceCreateUpdatePayload = {
      ...aValidServiceCreateUpdatePayload,
      metadata: {
        ...aValidServiceCreateUpdatePayload.metadata,
        category: "",
        custom_special_flow: "",
        token_name: ""
      }
    };
    expect(result).toStrictEqual(aServiceCreateUpdatePayload);
  });
});
