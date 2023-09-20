import { cleanup, render } from "@testing-library/react";
import { useSession } from "next-auth/react";
import React from "react";
import { Mock, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AccessControl } from "../access-control";

vi.mock("next-auth/react");

const mockUseSession = useSession as Mock;

let requiredPermissions = [""];
let renderNoAccess: any;

/** a test `AccessControl` component */
const getAccessControlComponent = () => (
  <AccessControl
    requiredPermissions={requiredPermissions}
    renderNoAccess={renderNoAccess}
  >
    <div id="ac-test">test</div>
  </AccessControl>
);

beforeAll(() => {
  mockUseSession.mockReturnValue({
    status: "authenticated",
    data: { user: { permissions: ["permission1", "permission2"] } }
  });
});

// needed to clean document (react dom)
afterEach(cleanup);

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

  it("should NOT render wrapped children if requiredPermissions don't match session.user permissions", () => {
    requiredPermissions = ["anunmatchedpermission"];
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
});
