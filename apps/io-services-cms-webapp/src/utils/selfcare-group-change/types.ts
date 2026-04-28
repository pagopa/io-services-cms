import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

export type GroupChangeEvent = t.TypeOf<typeof GroupChangeEvent>;
export const GroupChangeEvent = t.intersection([
  t.type({
    id: NonEmptyString,
    institutionId: NonEmptyString,
    name: NonEmptyString,
    productId: NonEmptyString,
    status: t.union([
      t.literal("ACTIVE"),
      t.literal("SUSPENDED"),
      t.literal("DELETED"),
    ]),
  }),
  t.partial({
    modifiedAt: t.union([t.string, t.null]),
    parentInstitutionId: t.union([NonEmptyString, t.null]),
  }),
]);

export type GroupCreateEvent = t.TypeOf<typeof GroupCreateEvent>;
export const GroupCreateEvent = t.intersection([
  GroupChangeEvent,
  t.type({
    parentInstitutionId: NonEmptyString,
  }),
  t.partial({
    modifiedAt: t.null,
  }),
]);

export type GroupDeleteEvent = t.TypeOf<typeof GroupDeleteEvent>;
export const GroupDeleteEvent = t.intersection([
  GroupChangeEvent,
  t.type({
    status: t.literal("DELETED"),
  }),
]);
