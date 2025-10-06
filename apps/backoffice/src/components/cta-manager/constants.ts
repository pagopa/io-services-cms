import type { TFunction } from "i18next";

export const URL_SCHEMES = {
  HANDLED_LINK: "iohandledlink://",
  INTERNAL: "ioit://",
  SSO: "iosso://",
} as const;

export type UrlScheme = (typeof URL_SCHEMES)[keyof typeof URL_SCHEMES];

export const URL_PREFIX_REGEX = /^(iosso:\/\/|ioit:\/\/|iohandledlink:\/\/)/;

// CTA di default
export const DEFAULT_CTA = {
  text: "",
  url: "",
  urlPrefix: "",
} as const;

export const SELECT_ITEMS = (t: TFunction) => [
  {
    label: t("forms.service.extraConfig.cta.form.externalLink"),
    value: URL_SCHEMES.HANDLED_LINK,
  },
  {
    label: t("forms.service.extraConfig.cta.form.singleSignOn"),
    value: URL_SCHEMES.SSO,
  },
  {
    label: t("forms.service.extraConfig.cta.form.internalLink"),
    value: URL_SCHEMES.INTERNAL,
  },
];
