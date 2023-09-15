import axios from "axios";
import { expect, test } from "vitest";
import { getConfiguration } from "../../../../config";
import { rest } from "msw";
import { setupServer } from "msw/node";
import {
  getInfo200Response,
  getInfo500Response
} from "../../../../../mocks/handlers/services-cms-handlers";
test("test backend api info()", async () => {
  const configuration = getConfiguration();
  const baseURL =
    configuration.API_BACKEND_BASE_URL + configuration.API_BACKEND_BASE_PATH;

  const handler = [
    rest.get(`${baseURL}/info`, (req, res, ctx) => {
      req.headers;

      const resultArray = [
        [ctx.status(200), ctx.json(getInfo200Response())],
        [ctx.status(500), ctx.json(getInfo500Response())]
      ];

      return res(...resultArray[1]);
    })
  ];

  const mswserver = setupServer(...handler);
  mswserver.listen();

  const { data, status } = await axios.get<any>(`${baseURL}/info`);

  expect(data).toHaveProperty("version");
  expect(data).toHaveProperty("name");
  expect(status).toBe(200);

  mswserver.close();
});
