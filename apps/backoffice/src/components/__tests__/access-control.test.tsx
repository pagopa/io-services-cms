import { cleanup, render } from "@testing-library/react";
import { useSession } from "next-auth/react";
import React from "react";
import { Mock, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AccessControl } from "../access-control";

vi.mock("next-auth/react");

const mockUseSession = useSession as Mock;

let requiredPermissions = [""];
let requiredRole: any;
let checkFunction: any;
let renderNoAccess: any;

const resetVariables = () => {
  requiredPermissions = [];
  requiredRole = undefined;
  checkFunction = undefined;
  renderNoAccess = undefined;
};

const reset = () => {
  cleanup();
  resetVariables();
}

/** a test `AccessControl` component */
const getAccessControlComponent = () => (
  <AccessControl
    checkFn={checkFunction}
    requiredPermissions={requiredPermissions}
    requiredRole={requiredRole}
    renderNoAccess={renderNoAccess}
  >
    <div id="ac-test">test</div>
  </AccessControl>
);

beforeAll(() => {
  mockUseSession.mockReturnValue({
    status: "authenticated",
    data: {
      user: {
        permissions: { apimGroups: ["permission1", "permission2"] },
        institution: { role: "aRole" },
      },
    },
  });
});

// needed to clean document (react dom) and variables
afterEach(reset);

describe("[AccessControl] Component", () => {
  it("should render wrapped children if requiredPermissions is a subset of session.user permissions", () => {
    requiredPermissions = ["permission1"];
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).toBeInTheDocument();
  });

  it("should render wrapped children if requiredPermissions match all session user.permissions", () => {
    requiredPermissions = ["permission1", "permission2"];
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).toBeInTheDocument();
  });

  it("should render wrapped children if requiredPermissions is empty", () => {
    requiredPermissions = [];
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).toBeInTheDocument();
  });

  it("should render wrapped children if requiredRole match session role", () => {
    requiredRole = "aRole";
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).toBeInTheDocument();
  });

  it("should render wrapped children if requiredPermissions and requiredRole are both matched in session", () => {
    requiredPermissions = ["permission1"];
    requiredRole = "aRole";
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).toBeInTheDocument();
  });

  it("should NOT render wrapped children if requiredPermissions don't match session.user permissions", () => {
    requiredPermissions = ["anunmatchedpermission"];
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).not.toBeInTheDocument();
  });

  it("should NOT render wrapped children if requiredRole don't match session role", () => {
    requiredRole = ["anunmatchedrole"];
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).not.toBeInTheDocument();
  });

  it("should render defined 'renderNoAccess' element insted of null if requiredPermissions don't match session.user permissions", () => {
    requiredPermissions = ["anunmatchedpermission"];
    renderNoAccess = <div id="alternative-content">Test</div>;
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).not.toBeInTheDocument();
    expect(document.getElementById("alternative-content")).toBeVisible();
  });

  it("should render wrapped children if checkFn returns true", () => {
    checkFunction = () => true;
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).toBeInTheDocument();
  });

  it("should NOT render wrapped children if checkFn returns false", () => {
    checkFunction = () => false;
    render(getAccessControlComponent());

    expect(document.getElementById("ac-test")).not.toBeInTheDocument();
  });
});
