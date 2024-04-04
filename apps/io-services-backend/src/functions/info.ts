import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

import packageJson from "../../package.json";

export async function info(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  return {
    jsonBody: {
      name: packageJson.name,
      version: packageJson.version,
    },
  };
}

app.http("info", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: info,
});
