import * as t from "io-ts";

export type SessionTokenInstitution = t.TypeOf<typeof SessionTokenInstitution>;
export const SessionTokenInstitution = t.intersection([
  t.type({
    id: t.string,
    name: t.string,
    role: t.string
  }),
  t.partial({ logo_url: t.string })
]);

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
  /** (Selfcare Institution) Custom Claim */
  institution: SessionTokenInstitution,
  /** (Selfcare Authorized Institutions) Custom Claim
   * Institutions for which the delegate is authorized to operate */
  authorized_institutions: t.array(SessionTokenInstitution),
  /** (io-services-cms API header parameters) Custom claims */
  parameters: SessionTokenParameters
});
