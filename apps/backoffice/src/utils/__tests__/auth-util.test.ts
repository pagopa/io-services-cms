import { describe, expect, it } from "vitest";
import {
  hasRequiredAuthorizations,
  hasRequiredPermissions,
  hasRequiredRole
} from "../auth-util";

describe("[auth utils] hasRequiredPermissions", () => {
  it("should return true if userPermissions contains all requiredPermissions", () => {
    const result = hasRequiredPermissions(["p1", "p2", "p3"], ["p1", "p2"]);
    expect(result).toBe(true);
  });

  it("should return true if userPermissions are equal to requiredPermissions", () => {
    const result = hasRequiredPermissions(["p1", "p2"], ["p1", "p2"]);
    expect(result).toBe(true);
  });

  it("should return true if requiredPermissions are empty", () => {
    const result = hasRequiredPermissions(["p1", "p2"], []);
    expect(result).toBe(true);
  });

  it("should return true if requiredPermissions are undefined", () => {
    const result = hasRequiredPermissions(["p1", "p2"]);
    expect(result).toBe(true);
  });

  it("should return true if userPermissions and requiredPermissions are empty", () => {
    const result = hasRequiredPermissions([], []);
    expect(result).toBe(true);
  });

  it("should return true if userPermissions and requiredPermissions are undefined", () => {
    const result = hasRequiredPermissions();
    expect(result).toBe(true);
  });

  it("should return false if userPermissions are different from requiredPermissions", () => {
    const result = hasRequiredPermissions(["p1", "p2", "p3"], ["p4", "p5"]);
    expect(result).toBe(false);
  });

  it("should return false if userPermissions are empty", () => {
    const result = hasRequiredPermissions([], ["p4", "p5"]);
    expect(result).toBe(false);
  });

  it("should return false if userPermissions are undefined", () => {
    const result = hasRequiredPermissions(undefined, ["p4", "p5"]);
    expect(result).toBe(false);
  });
});

describe("[auth utils] hasRequiredRole", () => {
  it("should return true if userRole is equal to requiredRole", () => {
    const result = hasRequiredRole("aRole", "aRole");
    expect(result).toBe(true);
  });

  it("should return true if userRole and requiredRole are undefined", () => {
    const result = hasRequiredRole();
    expect(result).toBe(true);
  });

  it("should return false if userRole is different from requiredRole", () => {
    const result = hasRequiredRole("userRole", "requiredRole");
    expect(result).toBe(false);
  });
});

describe("[auth utils] hasRequiredAuthorizations", () => {
  const aSession: any = {
    user: {
      permissions: ["p1", "p2"],
      institution: { role: "aRole" }
    }
  };

  it("should return true if Session contains all requiredAuthorizations", () => {
    const result = hasRequiredAuthorizations(aSession, {
      requiredRole: "aRole",
      requiredPermissions: ["p1", "p2"]
    });
    expect(result).toBe(true);
  });

  it("should return true if Session contains the requiredRole", () => {
    const result = hasRequiredAuthorizations(aSession, {
      requiredRole: "aRole"
    });
    expect(result).toBe(true);
  });

  it("should return true if Session contains the requiredPermissions", () => {
    const result = hasRequiredAuthorizations(aSession, {
      requiredPermissions: ["p1", "p2"]
    });
    expect(result).toBe(true);
  });

  it("should return true if RequiredAuthorizations are undefined", () => {
    const result = hasRequiredAuthorizations(aSession, {});
    expect(result).toBe(true);
  });

  it("should return false if requiredRole is different from Session role", () => {
    const result = hasRequiredAuthorizations(aSession, {
      requiredRole: "aDifferentRole",
      requiredPermissions: ["p1", "p2"]
    });
    expect(result).toBe(false);
  });

  it("should return false if requiredPermissions are different from Session permissions", () => {
    const result = hasRequiredAuthorizations(aSession, {
      requiredRole: "aRole",
      requiredPermissions: ["p3", "p4"]
    });
    expect(result).toBe(false);
  });

  it("should return false if requiredAuthorizations are different from Session role and permissions", () => {
    const result = hasRequiredAuthorizations(aSession, {
      requiredRole: "aRole",
      requiredPermissions: ["p3", "p4"]
    });
    expect(result).toBe(false);
  });
});
