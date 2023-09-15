import axios from "axios";
import { expect, test } from "vitest";
import { getConfiguration } from "../../../../config";
test("test backend api info()", async () => {
  const configuration = getConfiguration();
  const baseURL =
    configuration.API_BACKEND_BASE_URL + configuration.API_BACKEND_BASE_PATH;

  const { data, status } = await axios.get<any>(`${baseURL}/info`);

  expect(data).toHaveProperty("version");
  expect(data).toHaveProperty("name");
  expect(status).toBe(200);
});
