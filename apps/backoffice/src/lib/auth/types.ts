import {
  EmailString,
  FiscalCode,
  NonEmptyString,
  OrganizationFiscalCode,
} from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

export type SessionTokenInstitution = t.TypeOf<typeof SessionTokenInstitution>;
export const SessionTokenInstitution = t.intersection([
  t.type({
    id: t.string,
    name: t.string,
    role: t.string,
  }),
  t.partial({ logo_url: t.string }),
]);

export type SessionTokenParameters = t.TypeOf<typeof SessionTokenParameters>;
export const SessionTokenParameters = t.type({
  subscription_id: t.string,
  user_email: t.string,
  user_groups: t.array(t.string),
  user_id: t.string,
});

/** BackOffice JWT Session Token payload (io-ts type) */
export type SessionTokenPayload = t.TypeOf<typeof SessionTokenPayload>;
export const SessionTokenPayload = t.type({
  // Registered Claims
  /** (Selfcare Authorized Institutions) Custom Claim
   * Institutions for which the delegate is authorized to operate */
  authorized_institutions: t.array(SessionTokenInstitution),
  /** (Preferred e-mail address) Claim */
  email: t.string,
  /** (Expiration Time) Claim */
  exp: t.number,
  /** (Surname or last name) Claim */
  family_name: t.string,
  /** (Fiscal code) Custom Claim */
  fiscal_code: t.string,
  /** (Given name or first name) Claim */
  given_name: t.string,
  /** (Issued At) Claim */
  iat: t.number,
  // Custom Claims
  /** (Selfcare Institution) Custom Claim */
  institution: SessionTokenInstitution,
  /** (Issuer) Claim */
  iss: t.string,
  /** (JWT ID) Claim */
  jti: t.string,
  /** (io-services-cms API header parameters) Custom claims */
  parameters: SessionTokenParameters,
  /** (User ID) Claim */
  uid: t.string,
});

export type IdentityTokenOrganizationRole = t.TypeOf<
  typeof IdentityTokenOrganizationRole
>;
export const IdentityTokenOrganizationRole = t.type({
  partyRole: NonEmptyString,
  role: NonEmptyString,
});
export type IdentityTokenOrganization = t.TypeOf<
  typeof IdentityTokenOrganization
>;
export const IdentityTokenOrganization = t.intersection([
  t.type({
    fiscal_code: OrganizationFiscalCode,
    id: NonEmptyString,
    name: NonEmptyString,
    roles: t.array(IdentityTokenOrganizationRole),
  }),
  t.partial({
    groups: t.array(NonEmptyString),
  }),
]);

/** BackOffice JWT Identity Token payload (io-ts type) */
export type IdentityTokenPayload = t.TypeOf<typeof IdentityTokenPayload>;
export const IdentityTokenPayload = t.type({
  // Registered Claims
  /** (Audience) Claim */
  aud: t.string,
  /** (Desired Expired Time) Claim */
  desired_exp: t.number,
  /** (Preferred e-mail address) Claim */
  email: EmailString,
  /** (Expiration Time) Claim */
  exp: t.number,
  /** (Surname or last name) Claim */
  family_name: NonEmptyString,
  /** (Fiscal code) Custom Claim */
  fiscal_number: FiscalCode,
  /** (Issued At) Claim */
  iat: t.number,
  /** (Issuer) Claim */
  iss: t.string,
  // Custom Claims
  /** (JWT ID) Claim */
  jti: t.string,
  /** (Given name or first name) Claim */
  name: NonEmptyString,
  /** (Selfcare Institution) Custom Claim */
  organization: IdentityTokenOrganization,
  /** (User ID) Claim */
  uid: NonEmptyString,
});

export type ApimUser = t.TypeOf<typeof ApimUser>;
export const ApimUser = t.type({
  email: EmailString,
  groups: t.readonlyArray(
    t.type({
      name: NonEmptyString, // FIXME: define and use a custom coder SimpleIdFromFullyQualifiedId
      type: t.union([
        t.literal("custom"),
        t.literal("system"),
        t.literal("external"),
      ]),
    }),
  ),
  id: NonEmptyString,
  name: NonEmptyString, // FIXME: define and use a custom coder SimpleIdFromFullyQualifiedId
});

export type Subscription = t.TypeOf<typeof Subscription>;
export const Subscription = t.type({
  name: NonEmptyString,
});
