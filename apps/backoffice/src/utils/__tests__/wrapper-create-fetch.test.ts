import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFetchWithUpperCaseHttpMethod } from "../wrapper-create-fetch";

describe("createFetchWithUpperCaseHttpMethod", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let customFetch: ReturnType<typeof createFetchWithUpperCaseHttpMethod>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = mockFetch;
    customFetch = createFetchWithUpperCaseHttpMethod();
  });

  it("should convert lowercase HTTP method to uppercase", async () => {
    await customFetch("http://localhost:3000", { method: "patch" });

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000", {
      method: "PATCH",
    });
  });

  it("should not modify already uppercase HTTP method", async () => {
    await customFetch("http://localhost:3000", { method: "PATCH" });

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000", {
      method: "PATCH",
    });
  });

  it("should not mutate the original init object", async () => {
    const init = { method: "patch" };

    await customFetch("http://localhost:3000", init);

    expect(init.method).toBe("patch");
  });

  it("should handle init without method property", async () => {
    await customFetch("http://localhost:3000", {
      headers: { "Content-Type": "application/json" },
    });

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000", {
      headers: { "Content-Type": "application/json" },
    });
  });

  it("should preserve other init properties when convert method to uppercase", async () => {
    const init = {
      body: JSON.stringify({ data: "test" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "post",
    };

    await customFetch("http://localhost:3000", init);

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000", {
      body: JSON.stringify({ data: "test" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("should use custom fetch function when provided", async () => {
    const customMockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    const customFetchWithCustomFn =
      createFetchWithUpperCaseHttpMethod(customMockFetch);

    await customFetchWithCustomFn("http://localhost:3000", { method: "patch" });

    expect(customMockFetch).toHaveBeenCalledWith("http://localhost:3000", {
      method: "PATCH",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should use global fetch when no custom fetch is provided", async () => {
    const defaultCustomFetch = createFetchWithUpperCaseHttpMethod();

    await defaultCustomFetch("http://localhost:3000", { method: "post" });

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000", {
      method: "POST",
    });
  });

  it("should handle the fetch response", async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({ result: "success" }),
      ok: true,
      status: 200,
    };
    mockFetch.mockResolvedValue(mockResponse);

    const response = await customFetch("http://localhost:3000", {
      method: "patch",
    });

    expect(response).toBe(mockResponse);
  });
});
