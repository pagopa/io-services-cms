import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { describe, expect, it } from "vitest";
import { ServicePayload as ApiServicePayload } from "../../../generated/api/ServicePayload";
import { ServiceCreateUpdatePayload } from "../../../types/service";
import {
  fromServiceCreateUpdatePayloadToApiServicePayload,
  fromServiceLifecycleToServiceCreateUpdatePayload,
} from "../adapters";

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
      cta_1: { preUrl: "iohandledlink://", text: "aCtaText1", url: "aCtaUrl1" },
      cta_2: { preUrl: "", text: "", url: "" },
    },
    scope: "LOCAL",
    assistanceChannels: [
      { type: "email", value: "aValidEmail" },
      { type: "pec", value: "aValidPec" },
      { type: "phone", value: "aValidPhoneNumber" },
      { type: "support_url", value: "aValidUrl" },
    ],
  },
  require_secure_channel: false,
  authorized_cidrs: ["0.0.0.0/0"],
  authorized_recipients: [],
  max_allowed_payment_amount: 0,
};

const aCtaResult =
  '---\nit:\n  cta_1: \n    text: "aCtaText1"\n    action: "iohandledlink://aCtaUrl1"\nen:\n  cta_1: \n    text: "aCtaText1"\n    action: "iohandledlink://aCtaUrl1"\n---';

const anApiServicePayloadResult = {
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
    scope: aValidServiceCreateUpdatePayload.metadata.scope,
  },
  require_secure_channel: false,
  authorized_cidrs: ["0.0.0.0/0"],
  authorized_recipients: [],
  max_allowed_payment_amount: 0,
} as unknown as ApiServicePayload;

describe("[Services] Adapters", () => {
  it("should return a valid Api ServicePayload if a valid frontend service payload is provided", () => {
    const result = fromServiceCreateUpdatePayloadToApiServicePayload(
      aValidServiceCreateUpdatePayload,
    ) as t.Validation<ServiceCreateUpdatePayload>;

    expect(E.isRight(result));
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual(anApiServicePayloadResult);
    }

    // expect(right).toStrictEqual(anApiServicePayloadResult);
  });

  it("should return a Validation error if an invalid frontend service payload is provided", () => {
    const anInvalidServiceCreateUpdatePayload = {
      ...aValidServiceCreateUpdatePayload,
      name: "",
    };

    const res = fromServiceCreateUpdatePayloadToApiServicePayload(
      anInvalidServiceCreateUpdatePayload,
    ) as t.Validation<ApiServicePayload>;

    expect(E.isLeft(res)).toBe(true);
  });

  it("should return a valid frontend service payload if a valid Api ServiceLifecycle is provided", () => {
    const result = fromServiceLifecycleToServiceCreateUpdatePayload(
      anApiServicePayloadResult,
    );
    const aServiceCreateUpdatePayload = {
      ...aValidServiceCreateUpdatePayload,
      metadata: {
        ...aValidServiceCreateUpdatePayload.metadata,
        group_id: undefined,
        token_name: "",
        topic_id: undefined,
      },
    };
    expect(result).toStrictEqual(aServiceCreateUpdatePayload);
  });

  it("should return a valid frontend service payload with topic, if a valid Api ServiceLifecycle is provided", () => {
    const result = fromServiceLifecycleToServiceCreateUpdatePayload({
      ...anApiServicePayloadResult,
      metadata: {
        ...anApiServicePayloadResult.metadata,
        topic: { id: 0, name: "Altro" },
      },
    });
    const aServiceCreateUpdatePayload = {
      ...aValidServiceCreateUpdatePayload,
      metadata: {
        ...aValidServiceCreateUpdatePayload.metadata,
        group_id: undefined,
        token_name: "",
        topic_id: 0,
      },
    };
    expect(result).toStrictEqual(aServiceCreateUpdatePayload);
  });

  // it("FE → API con UNA CTA (validation Right + CTAS(it) corretto)", () => {
  //   const res = fromServiceCreateUpdatePayloadToApiServicePayload(
  //     aValidServiceCreateUpdatePayload,
  //   ) as t.Validation<ApiServicePayload>;
  //   const right = decodeOrPrint(res).right;

  //   // 1) è una stringa di front-matter
  //   expect(typeof right.metadata.cta).toBe("string");

  //   // 2) controlla il contenuto semantico del ramo 'it'
  //   expectItCtasEqual(right.metadata.cta as string, {
  //     cta_1: { text: "aCtaText", action: "iohandledlink://aCtaUrl" },
  //     // niente cta_2 attesa
  //   });
  // });

  // it("FE → API con DUE CTA (validation Right + CTAS(it) corretto)", () => {
  //   const feDouble: ServiceCreateUpdatePayload = {
  //     ...aValidServiceCreateUpdatePayload,
  //     metadata: {
  //       ...aValidServiceCreateUpdatePayload.metadata,
  //       cta: {
  //         cta_1: { text: "aCtaText1", url: "iohandledlink://aCtaUrl1" },
  //         cta_2: { text: "aCtaText2", url: "iohandledlink://aCtaUrl2" },
  //       },
  //     },
  //   };

  //   const res = fromServiceCreateUpdatePayloadToApiServicePayload(
  //     feDouble,
  //   ) as t.Validation<ApiServicePayload>;
  //   const right = decodeOrPrint(res).right;

  //   expect(typeof right.metadata.cta).toBe("string");
  //   expectItCtasEqual(right.metadata.cta as string, {
  //     cta_1: { text: "aCtaText1", action: "iohandledlink://aCtaUrl1" },
  //     cta_2: { text: "aCtaText2", action: "iohandledlink://aCtaUrl2" },
  //   });
  // });

  // it("API → FE round-trip (senza topic)", () => {
  //   const res = fromServiceCreateUpdatePayloadToApiServicePayload(
  //     aValidServiceCreateUpdatePayload,
  //   ) as t.Validation<ApiServicePayload>;
  //   const api = decodeOrPrint(res).right;

  //   const fe = fromServiceLifecycleToServiceCreateUpdatePayload(api);
  //   // allinea eventuali campi opzionali che il mapper setta/azzera
  //   const expected = {
  //     ...aValidServiceCreateUpdatePayload,
  //     metadata: {
  //       ...aValidServiceCreateUpdatePayload.metadata,
  //       group_id: undefined,
  //       token_name: "",
  //       topic_id: undefined,
  //     },
  //   };
  //   expect(fe).toStrictEqual(expected);
  // });

  // it("should return a valid Api ServicePayload if a valid frontend service payload is provided with two cta", () => {
  //   const feDouble: ServiceCreateUpdatePayload = {
  //     ...aValidServiceCreateUpdatePayload,
  //     metadata: {
  //       ...aValidServiceCreateUpdatePayload.metadata,
  //       topic_id: 1,
  //       cta: {
  //         cta_1: { text: "aCtaText1", url: "iohandledlink://aCtaUrl1" },
  //         cta_2: { text: "aCtaText2", url: "iohandledlink://aCtaUrl2" },
  //       },
  //     },
  //   };

  //   const res = fromServiceCreateUpdatePayloadToApiServicePayload(
  //     feDouble,
  //   ) as t.Validation<ApiServicePayload>;

  //   // dentro adapters.test.ts, subito dopo che calcoli `res`
  //   if (E.isLeft(res)) {
  //     // stampa leggibile dell'errore
  //     // (importa `import * as t from "io-ts"` in testa al file se non c'è)
  //     // eslint-disable-next-line no-console
  //     console.error(
  //       "\nDECODE ERROR\n" + PathReporter.report(res).join("\n") + "\n",
  //     );
  //   }

  //   expect(E.isRight(res)).toBe(true);
  //   const right = (res as E.Right<ApiServicePayload>).right;
  //   if (E.isLeft(res)) {
  //     // @ts-ignore
  //     console.log(t.draw(res.left));
  //   }

  //   expect(right.metadata.cta).toBe(aCtaDoubleResult);
  // });
});
