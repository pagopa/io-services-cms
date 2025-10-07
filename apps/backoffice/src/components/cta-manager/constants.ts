import type { TFunction } from "i18next";

export const CTA_PREFIX_URL_SCHEMES = {
  EXTERNAL: "iohandledlink://",
  INTERNAL: "ioit://",
  SSO: "iosso://",
} as const;

export const URL_PREFIX_REGEX = /^(iosso:\/\/|ioit:\/\/|iohandledlink:\/\/)/;

// default cta
export const DEFAULT_CTA = {
  text: "",
  url: "",
  urlPrefix: "",
} as const;

export const SELECT_ITEMS = (t: TFunction) => [
  {
    label: t("forms.service.extraConfig.cta.form.externalLink"),
    value: CTA_PREFIX_URL_SCHEMES.EXTERNAL,
  },
  {
    label: t("forms.service.extraConfig.cta.form.singleSignOn"),
    value: CTA_PREFIX_URL_SCHEMES.SSO,
  },
  {
    label: t("forms.service.extraConfig.cta.form.internalLink"),
    value: CTA_PREFIX_URL_SCHEMES.INTERNAL,
  },
];
