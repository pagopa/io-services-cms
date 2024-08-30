import * as t from "io-ts";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ItemType as LifecycleItemType } from "../service-lifecycle";
import { Service } from "../service-lifecycle/definitions";
import { ItemType as PublicationItemType } from "../service-publication";

export type ServiceHistory = t.TypeOf<typeof ServiceHistory>;
export const ServiceHistory = t.union([
  t.intersection([
    LifecycleItemType,
    t.type({
      serviceId: Service.types[0].props.id,
      last_update: NonEmptyString,
    }),
  ]),
  t.intersection([
    PublicationItemType,
    t.type({
      serviceId: Service.types[0].props.id,
      last_update: NonEmptyString,
    }),
  ]),
]);
