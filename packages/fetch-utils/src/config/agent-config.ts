import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import * as t from "io-ts";

// Http Agent configuration
export const HttpAgentConfig = t.partial({
  FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT: IntegerFromString,
  FETCH_KEEPALIVE_KEEPALIVE_MSECS: IntegerFromString,
  FETCH_KEEPALIVE_MAX_FREE_SOCKETS: IntegerFromString,
  FETCH_KEEPALIVE_MAX_SOCKETS: IntegerFromString,
  FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL: IntegerFromString,
  FETCH_KEEPALIVE_TIMEOUT: IntegerFromString,
});
export type HttpAgentConfig = t.TypeOf<typeof HttpAgentConfig>;
