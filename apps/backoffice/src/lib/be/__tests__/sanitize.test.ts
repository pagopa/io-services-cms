import { describe, expect, it } from "vitest";
import { sanitizeObject } from "../sanitize";

const aService = {
  id: "aServiceId",
  status: {
    value: "submitted",
  },
  last_update: "2024-01-31T14:44:57.000Z",
  metadata: {
    privacy_url: "https://testprivacy.it",
    address: "via dell'ente, 32",
    cta: '"---\nit:\n  cta_1: \n    text: "Etichetta CTA"\n    action: "iohandledlink://https://cta"\nen:\n  cta_1: \n    text: "Etichetta CTA"\n    action: "iohandledlink://https://cta"\n---"',
    email: "servizio@email.it",
    scope: "LOCAL",
    topic: {
      id: 6,
      name: "Educazione e formazione",
    },
  },
  name: "aServiceName",
  description: "test description \n\n**bold text**",
  organization: {
    name: "anOrganizationName",
    fiscal_code: "00000000001",
  },
  require_secure_channel: false,
  max_allowed_payment_amount: 0,
  authorized_recipients: ["AAAAAA00A00A000A"],
  authorized_cidrs: [],
};

describe("sanitizeObject", () => {
  it("should return the same input object when no sanification needed ", () => {
    const result = sanitizeObject(aService);
    expect(result).toStrictEqual(aService);
  });

  it("should sanitize the name", () => {
    const anUnsafeService = {
      ...aService,
      name: "<img src/onerror=alert(document.cookie)>",
    };

    const result = sanitizeObject(anUnsafeService);

    expect(result).not.toEqual(anUnsafeService);
    expect(result).toStrictEqual({
      ...anUnsafeService,
      name: "<img>",
    });
  });

  it("should sanitize the nested property metadata.address", () => {
    const anUnsafeService = {
      ...aService,
      metadata: {
        ...aService.metadata,
        address: "<img src/onerror=alert(document.cookie)>",
      },
    };

    const result = sanitizeObject(anUnsafeService);

    expect(result).not.toEqual(anUnsafeService);
    expect(result).toStrictEqual({
      ...anUnsafeService,
      metadata: {
        ...anUnsafeService.metadata,
        address: "<img>",
      },
    });
  });

  it("should sanitize the array property authorized_recipients", () => {
    const anUnsafeService = {
      ...aService,
      authorized_recipients: [
        "<img src/onerror=alert(document.cookie)>",
        "AAAAAA00A00A000A",
        "<img src/onerror=alert(document.cookie)>",
        "<script>alert('You Have been Pwned!')</script>",
        '<img height="300" src/onerror=alert(document.cookie) width="400">',
      ],
    };

    const result = sanitizeObject(anUnsafeService);

    expect(result).not.toEqual(anUnsafeService);
    expect(result).toStrictEqual({
      ...anUnsafeService,
      authorized_recipients: [
        "<img>",
        "AAAAAA00A00A000A",
        "<img>",
        "&lt;script&gt;alert('You Have been Pwned!')&lt;/script&gt;",
        '<img height="300" width="400">',
      ],
    });
  });
});
