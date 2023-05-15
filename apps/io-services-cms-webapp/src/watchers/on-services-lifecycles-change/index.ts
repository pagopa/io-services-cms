import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { ServiceLifecycle } from "@io-services-cms/models";

export declare const handler: RTE.ReaderTaskEither<
  { document: ServiceLifecycle.ItemType },
  Error,
  { foo: "bar" }
>;
