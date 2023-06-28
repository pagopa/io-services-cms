import * as t from "io-ts";
import { Service } from "../service-lifecycle/definitions";

export const LegacyService = t.intersection([
  Service,
  t.partial({
    cmsTag: t.boolean,
  }),
]);
export type LegacyService = t.TypeOf<typeof LegacyService>;
