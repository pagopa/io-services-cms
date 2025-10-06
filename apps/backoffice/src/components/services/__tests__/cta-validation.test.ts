import { describe, it, expect, vi } from "vitest";
vi.mock("@pagopa/mui-italia/dist/theme/theme", () => ({ default: {} }));
vi.mock("@pagopa/mui-italia", () => ({ default: {} }));
import { getValidationSchema } from "../service-create-update/service-builder-step-3";
import { URL_SCHEMES } from "../../cta-manager/constants";

const validation = (s: string) => s;

describe("CTA validation", () => {
  const schema = getValidationSchema(validation as any, null);

  it("should succeed if a valid frontend service payload with a single CTA is provided", () => {
    const data = {
      authorized_cidrs: [],
      metadata: {
        cta: {
          cta_1: {
            urlPrefix: URL_SCHEMES.HANDLED_LINK,
            text: "Primary button",
            url: "https://example.com/page",
          },
        },
      },
    };

    expect(() => schema.parse(data)).not.toThrow();
  });

  it("should succeed if a valid frontend service payload with a double CTA is provided", () => {
    const data = {
      authorized_cidrs: [],
      metadata: {
        cta: {
          cta_1: {
            urlPrefix: URL_SCHEMES.HANDLED_LINK,
            text: "Primary button",
            url: "https://example.com/page",
          },
          cta_2: {
            urlPrefix: URL_SCHEMES.HANDLED_LINK,
            text: "Secondary button",
            url: "https://example.com/other",
          },
        },
      },
    };

    expect(() => schema.parse(data)).not.toThrow();
  });

  it("should fail if a frontend service payload has cta_2 filled while cta_1 is empty", () => {
    const data = {
      authorized_cidrs: [],
      metadata: {
        cta: {
          cta_1: {
            urlPrefix: "",
            text: "",
            url: "",
          },
          cta_2: {
            urlPrefix: URL_SCHEMES.HANDLED_LINK,
            text: "Secondary button",
            url: "https://example.com/other",
          },
        },
      },
    };

    expect(() => schema.parse(data)).toThrow();
  });

  it("should fail if a frontend service payload contains a CTA with an invalid URL", () => {
    const data = {
      authorized_cidrs: [],
      metadata: {
        cta: {
          cta_1: {
            urlPrefix: URL_SCHEMES.HANDLED_LINK,
            text: "Primary button",
            url: "notaurl",
          },
        },
      },
    };

    expect(() => schema.parse(data)).toThrow();
  });

  it("should succeed if a valid frontend service payload without CTAs is provided", () => {
    const data = {
      authorized_cidrs: [],
      metadata: {
        cta: {
          cta_1: { urlPrefix: "", text: "", url: "" },
          cta_2: { urlPrefix: "", text: "", url: "" },
        },
      },
    };

    expect(() => schema.parse(data)).not.toThrow();
  });
});
