import * as t from "io-ts";
import {
  EmailString,
  NonEmptyString,
  OrganizationFiscalCode,
  FiscalCode
} from "@pagopa/ts-commons/lib/strings";

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
  /** (User ID) Claim */
  uid: t.string,
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

export type IdentityTokenOrganizationRole = t.TypeOf<
  typeof IdentityTokenOrganizationRole
>;
export const IdentityTokenOrganizationRole = t.type({
  partyRole: NonEmptyString,
  role: NonEmptyString
});
export type IdentityTokenOrganization = t.TypeOf<
  typeof IdentityTokenOrganization
>;
export const IdentityTokenOrganization = t.intersection([
  t.type({
    id: NonEmptyString,
    fiscal_code: OrganizationFiscalCode,
    name: NonEmptyString,
    roles: t.array(IdentityTokenOrganizationRole)
  }),
  t.partial({
    groups: t.array(NonEmptyString)
  })
]);

/** BackOffice JWT Identity Token payload (io-ts type) */
export type IdentityTokenPayload = t.TypeOf<typeof IdentityTokenPayload>;
export const IdentityTokenPayload = t.type({
  // Registered Claims
  /** (Expiration Time) Claim */
  exp: t.number,
  /** (Issued At) Claim */
  iat: t.number,
  /** (Audience) Claim */
  aud: t.string,
  /** (Issuer) Claim */
  iss: t.string,
  /** (JWT ID) Claim */
  jti: t.string,
  /** (Surname or last name) Claim */
  family_name: NonEmptyString,
  /** (Given name or first name) Claim */
  name: NonEmptyString,
  /** (Preferred e-mail address) Claim */
  email: EmailString,
  // Custom Claims
  /** (User ID) Claim */
  uid: NonEmptyString,
  /** (Fiscal code) Custom Claim */
  fiscal_number: FiscalCode,
  /** (Desired Expired Time) Claim */
  desired_exp: t.number,
  /** (Selfcare Institution) Custom Claim */
  organization: IdentityTokenOrganization
});

export type ApimUser = t.TypeOf<typeof ApimUser>;
export const ApimUser = t.type({
  id: NonEmptyString,
  name: NonEmptyString, // FIXME: define and use a custom coder SimpleIdFromFullyQualifiedId
  email: EmailString,
  groups: t.readonlyArray(
    t.type({
      type: t.union([
        t.literal("custom"),
        t.literal("system"),
        t.literal("external")
      ]),
      name: NonEmptyString // FIXME: define and use a custom coder SimpleIdFromFullyQualifiedId
    })
  )
});

export type Subscription = t.TypeOf<typeof Subscription>;
export const Subscription = t.type({
  name: NonEmptyString
});
