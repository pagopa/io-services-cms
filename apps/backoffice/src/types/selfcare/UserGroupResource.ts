/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";
import { enumType } from "@pagopa/ts-commons/lib/types";

export enum StatusEnum {
  "ACTIVE" = "ACTIVE",

  "SUSPENDED" = "SUSPENDED"
}

// required attributes
const UserGroupResourceR = t.interface({});

// optional attributes
const UserGroupResourceO = t.partial({
  description: t.string,

  id: t.string,

  institutionId: t.string,

  name: t.string,

  productId: t.string,

  status: enumType<StatusEnum>(StatusEnum, "status")
});

export const UserGroupResource = t.exact(
  t.intersection([UserGroupResourceR, UserGroupResourceO], "UserGroupResource")
);

export type UserGroupResource = t.TypeOf<typeof UserGroupResource>;