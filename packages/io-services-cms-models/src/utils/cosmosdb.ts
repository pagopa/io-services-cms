import * as t from "io-ts";

const CosmosResource = t.type({
  _ts: t.Integer,
});
export type CosmosResource = t.TypeOf<typeof CosmosResource>;

export const withCosmosDbColumns = <T>(model: t.Type<T>) =>
  t.intersection([model, CosmosResource]);
