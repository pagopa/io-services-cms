import { HTTPMethod } from "@azure/cosmos";
import { HttpMethod, HttpRequest, HttpRequestBodyInit } from "@azure/functions";

export const mockHttpRequest = (data: {
  body?: HttpRequestBodyInit;
  headers?: Record<string, string>;
  method?: HttpMethod;
  params?: Record<string, string>;
  query?: Record<string, string>;
}): HttpRequest =>
  new HttpRequest({
    body: data.body,
    headers: data.headers,
    method: data.method ?? HTTPMethod.get,
    params: data.params,
    query: data.query,
    url: "http://localhost/mocked-url",
  });
