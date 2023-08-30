import axios from "axios";
import { expect, test } from "vitest";
import { mockApiServicesCmsUrl } from "../../../../../mocks/handlers/services-cms-handlers";

test("test backend api info()", async () => {
  const { data, status } = await axios.get<any>(
    `${mockApiServicesCmsUrl}/info`
  );

  expect(data).toHaveProperty("version");
  expect(data).toHaveProperty("name");
  expect(status).toBe(200);
});
