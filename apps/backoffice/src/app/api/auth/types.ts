import * as t from "io-ts";

export type SessionTokenOrganization = t.TypeOf<
  typeof SessionTokenOrganization
>;
export const SessionTokenOrganization = t.type({
  id: t.string,
  name: t.string,
  role: t.string
});

export type SessionTokenParameters = t.TypeOf<typeof SessionTokenParameters>;
export const SessionTokenParameters = t.type({
  user_id: t.string,
  user_email: t.string,
  user_groups: t.array(t.string),
  subscription_id: t.string
});

/** BackOffice JWT Session Token payload (io-ts type) */
export type SessionTokenPayload = t.TypeOf<typeof SessionTokenPayload>;
export const SessionTokenPayload = t.type({
  // Registered Claims
  /** (Expiration Time) Claim */
  exp: t.number,
  /** (Issued At) Claim */
  iat: t.number,
  /** (Issuer) Claim */
  iss: t.string,
  /** (JWT ID) Claim */
  jti: t.string,
  /** (Surname or last name) Claim */
  family_name: t.string,
  /** (Given name or first name) Claim */
  given_name: t.string,
  /** (Preferred e-mail address) Claim */
  email: t.string,
  // Custom Claims
  /** (Fiscal code) Custom Claim */
  fiscal_code: t.string,
  /** (Selfcare Organization) Custom Claim */
  organization: SessionTokenOrganization,
  /** (io-services-cms API header parameters) Custom claims */
  parameters: SessionTokenParameters
});
