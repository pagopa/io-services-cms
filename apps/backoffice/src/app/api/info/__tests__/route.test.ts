import { expect, test } from "vitest";
import { mockApiServicesCmsUrl } from "../../../../../mocks/handlers/services-cms-handlers";

test("test backend api info()", async () => {
  const getInfo = async () => {
    const res = await fetch(`${mockApiServicesCmsUrl}/info`);
    return await res.json();
  };
  const result = await getInfo();

  expect(result).toHaveProperty("version");
  expect(result).toHaveProperty("name");
});
