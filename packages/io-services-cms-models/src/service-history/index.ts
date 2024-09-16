import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import { ItemType as LifecycleItemType } from "../service-lifecycle";
import { Service } from "../service-lifecycle/definitions";
import { ItemType as PublicationItemType } from "../service-publication";

export type ServiceHistory = t.TypeOf<typeof ServiceHistory>;
export const ServiceHistory = t.union([
  t.intersection([
    LifecycleItemType,
    t.type({
      last_update: NonEmptyString,
      serviceId: Service.types[0].props.id,
    }),
  ]),
  t.intersection([
    PublicationItemType,
    t.type({
      last_update: NonEmptyString,
      serviceId: Service.types[0].props.id,
    }),
  ]),
]);
