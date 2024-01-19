import * as t from "io-ts";
import { InstitutionResource } from "./InstitutionResource";

export const InstitutionResources = t.readonlyArray(
  InstitutionResource,
  "InstitutionResources"
);

export type InstitutionResources = t.TypeOf<typeof InstitutionResources>;
