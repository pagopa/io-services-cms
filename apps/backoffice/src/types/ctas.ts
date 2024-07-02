/**
 * This type models 2 cta that could be nested inside the markdown content of a message
 * or as a service "metadata.cta" property.
 */
import * as t from "io-ts";

const CTA = t.type({
  text: t.string,
  action: t.string
});
export type CTA = t.TypeOf<typeof CTA>;
const CTASR = t.type({
  cta_1: CTA
});

const CTASO = t.partial({
  cta_2: CTA
});

export const CTAS = t.intersection([CTASR, CTASO], "CTAS");

const props = {
  it: CTAS,
  en: CTAS
};
const ServiceMessageCTA = t.partial(props);
export const CTALocales = t.keyof(props);
export type CTALocales = t.TypeOf<typeof CTALocales>;
export type CTAS = t.TypeOf<typeof CTAS>;

export type ServiceMessageCTA = t.TypeOf<typeof ServiceMessageCTA>;
