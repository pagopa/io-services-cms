import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpAgentConfig } from "../../config/agent-config";
import {
  fetchWithAgents,
  getAgentOptions,
  getHttpAgent,
  getHttpsAgent,
} from "../agent";

const mocks = vi.hoisted(() => ({
  HttpAgent: vi.fn(),
  HttpsAgent: vi.fn(),
  nodeFetch: vi.fn(),
}));

vi.mock("node:http", () => ({
  default: { Agent: mocks.HttpAgent },
}));

vi.mock("node:https", () => ({
  default: { Agent: mocks.HttpsAgent },
}));

vi.mock("node-fetch-commonjs", () => ({
  default: mocks.nodeFetch,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

const baseConfig: HttpAgentConfig = {
  FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT: 15000,
  FETCH_KEEPALIVE_KEEPALIVE_MSECS: 30000,
  FETCH_KEEPALIVE_MAX_FREE_SOCKETS: 10,
  FETCH_KEEPALIVE_MAX_SOCKETS: 20,
  FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL: 60000,
  FETCH_KEEPALIVE_TIMEOUT: 5000,
};

const expectedAgentOptions = {
  freeSocketTimeout: 15000,
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxFreeSockets: 10,
  maxSockets: 20,
  socketActiveTTL: 60000,
  timeout: 5000,
};

describe("agent", () => {
  describe("getAgentOptions", () => {
    it("should return agent options based on the provided config", () => {
      // given
      const config = { ...baseConfig };

      // when
      const options = getAgentOptions(config);

      // then
      expect(options).toEqual(expectedAgentOptions);
    });

    it("should handle undefined values in the config", () => {
      // given
      const config: Partial<HttpAgentConfig> = {
        FETCH_KEEPALIVE_MAX_SOCKETS: 50,
      };

      // when
      const options = getAgentOptions(config as HttpAgentConfig);

      // then
      expect(options).toEqual({
        freeSocketTimeout: undefined,
        keepAlive: true,
        keepAliveMsecs: undefined,
        maxFreeSockets: undefined,
        maxSockets: 50,
        socketActiveTTL: undefined,
        timeout: undefined,
      });
    });
  });

  describe("getHttpAgent", () => {
    it("should create an http.Agent with the correct options", () => {
      // given
      const config = { ...baseConfig };

      // when
      getHttpAgent(config);

      // then
      expect(mocks.HttpAgent).toHaveBeenCalledOnce();
      expect(mocks.HttpAgent).toHaveBeenCalledWith(expectedAgentOptions);
    });
  });

  describe("getHttpsAgent", () => {
    it("should create an https.Agent with the correct options", () => {
      // given
      const config = { ...baseConfig };

      // when
      getHttpsAgent(config);

      // then
      expect(mocks.HttpsAgent).toHaveBeenCalledOnce();
      expect(mocks.HttpsAgent).toHaveBeenCalledWith(expectedAgentOptions);
    });
  });

  describe("fetchWithAgents", () => {
    const mockHttpAgent = { type: "http-agent" };
    const mockHttpsAgent = { type: "https-agent" };

    beforeEach(() => {
      mocks.HttpAgent.mockReturnValue(mockHttpAgent);
      mocks.HttpsAgent.mockReturnValue(mockHttpsAgent);
      mocks.nodeFetch.mockResolvedValue({ ok: true, status: 200 } as Response);
    });

    it("should use http agent for http URLs", async () => {
      // given
      const config = { ...baseConfig };
      const url = "http://example.com";
      const init = { method: "POST" };
      const fetcher = fetchWithAgents(config);

      // when
      await fetcher(url, init);

      // then
      expect(mocks.HttpAgent).toHaveBeenCalledOnce();
      expect(mocks.HttpAgent).toHaveBeenCalledWith(expectedAgentOptions);
      expect(mocks.HttpsAgent).not.toHaveBeenCalled();
      expect(mocks.nodeFetch).toHaveBeenCalledOnce();
      expect(mocks.nodeFetch).toHaveBeenCalledWith(url, {
        ...init,
        agent: mockHttpAgent,
      });
    });

    it("should use https agent for https URLs", async () => {
      // given
      const config = { ...baseConfig };
      const url = "https://example.com";
      const init = { headers: { "X-Test": "true" } };
      const fetcher = fetchWithAgents(config);

      // when
      await fetcher(url, init);

      // then
      expect(mocks.HttpsAgent).toHaveBeenCalledOnce();
      expect(mocks.HttpsAgent).toHaveBeenCalledWith(expectedAgentOptions);
      expect(mocks.HttpAgent).not.toHaveBeenCalled();
      expect(mocks.nodeFetch).toHaveBeenCalledOnce();
      expect(mocks.nodeFetch).toHaveBeenCalledWith(url, {
        ...init,
        agent: mockHttpsAgent,
      });
    });

    it("should handle URL object as input", async () => {
      // given
      const config = { ...baseConfig };
      const url = new URL("https://secure.example.com/path");
      const fetcher = fetchWithAgents(config);

      // when
      await fetcher(url);

      // then
      expect(mocks.HttpsAgent).toHaveBeenCalledOnce();
      expect(mocks.HttpAgent).not.toHaveBeenCalled();
      expect(mocks.nodeFetch).toHaveBeenCalledOnce();
      expect(mocks.nodeFetch).toHaveBeenCalledWith(url, {
        agent: mockHttpsAgent,
      });
    });

    it("should handle Request object as input", async () => {
      // given
      const config = { ...baseConfig };
      const request = new Request("http://insecure.example.com/resource");
      const fetcher = fetchWithAgents(config);

      // when
      await fetcher(request);

      // then
      expect(mocks.HttpAgent).toHaveBeenCalledOnce();
      expect(mocks.HttpsAgent).not.toHaveBeenCalled();
      expect(mocks.nodeFetch).toHaveBeenCalledOnce();
      expect(mocks.nodeFetch).toHaveBeenCalledWith(request, {
        agent: mockHttpAgent,
      });
    });

    it("should handle undefined init parameter", async () => {
      // given
      const config = { ...baseConfig };
      const url = "http://example.com";
      const fetcher = fetchWithAgents(config);

      // when
      await fetcher(url);

      // then
      expect(mocks.HttpAgent).toHaveBeenCalledOnce();
      expect(mocks.nodeFetch).toHaveBeenCalledOnce();
      expect(mocks.nodeFetch).toHaveBeenCalledWith(url, {
        agent: mockHttpAgent,
      });
    });
  });
});
