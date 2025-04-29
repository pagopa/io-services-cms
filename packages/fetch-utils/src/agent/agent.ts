import http from "node:http";
import https from "node:https";
import nodeFetch from "node-fetch-commonjs";

import { HttpAgentConfig } from "../config/agent-config";

export const getAgentOptions = (config: HttpAgentConfig) => ({
  freeSocketTimeout:
    config.FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT === undefined
      ? undefined
      : config.FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT,
  keepAlive: true,
  keepAliveMsecs:
    config.FETCH_KEEPALIVE_KEEPALIVE_MSECS === undefined
      ? undefined
      : config.FETCH_KEEPALIVE_KEEPALIVE_MSECS,
  maxFreeSockets:
    config.FETCH_KEEPALIVE_MAX_FREE_SOCKETS === undefined
      ? undefined
      : config.FETCH_KEEPALIVE_MAX_FREE_SOCKETS,
  maxSockets:
    config.FETCH_KEEPALIVE_MAX_SOCKETS === undefined
      ? undefined
      : config.FETCH_KEEPALIVE_MAX_SOCKETS,
  socketActiveTTL:
    config.FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL === undefined
      ? undefined
      : config.FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL,
  timeout:
    config.FETCH_KEEPALIVE_TIMEOUT === undefined
      ? undefined
      : config.FETCH_KEEPALIVE_TIMEOUT,
});

export const getHttpAgent = (config: HttpAgentConfig) =>
  new http.Agent(getAgentOptions(config));
export const getHttpsAgent = (config: HttpAgentConfig) =>
  new https.Agent(getAgentOptions(config));

export const fetchWithAgents =
  (config: HttpAgentConfig): typeof fetch =>
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      input instanceof URL
        ? input.toString()
        : input instanceof Request
          ? input.url
          : input;

    // Select the appropriate agent based on the protocol
    const agent = url.toString().startsWith("https://")
      ? getHttpsAgent(config)
      : getHttpAgent(config);
    const initWithKeepalive = {
      ...(init === undefined ? {} : init),
      agent: agent,
    };
    // Note: This agent property is specific to Node.js environments (like node-fetch)
    // and not part of the standard browser Fetch API.
    // need to cast to any since node-fetch has a slightly different type
    // signature that DOM's fetch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return nodeFetch(input as any, initWithKeepalive as any) as any;
  };
