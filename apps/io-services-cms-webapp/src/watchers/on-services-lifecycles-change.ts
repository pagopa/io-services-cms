import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { ServiceLifecycle } from "@io-services-cms/models";

export declare const handler: RTE.ReaderTaskEither<
  { item: ServiceLifecycle.ItemType },
  Error,
  { foo: "bar" }
>;
