import { cleanup, render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import React from "react";
import { Mock, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { EmptyState } from "../empty-state";

vi.mock("next-auth/react");

const mockUseSession = useSession as Mock;

let emptyStateLabel = "emptyStateLabel";
let ctaLabel = "ctaLabel";
let ctaRoute = "/ctaRoute";
let requiredPermissions = [""];

const getEmptyStateComponent = () => (
  <EmptyState
    emptyStateLabel={emptyStateLabel}
    ctaLabel={ctaLabel}
    ctaRoute={ctaRoute}
    requiredPermissions={requiredPermissions}
  ></EmptyState>
);

beforeAll(() => {
  mockUseSession.mockReturnValue({
    status: "authenticated",
    data: {
      user: {
        permissions: { apimGroups: ["permission1", "permission2"] },
        institution: { role: "aRole" }
      }
    }
  });
});

// needed to clean document (react dom)
afterEach(cleanup);

describe("[EmptyState] Component", () => {
  it("Should render the empty state component", () => {
    requiredPermissions = ["permission1"];
    render(getEmptyStateComponent());
    const aButton = screen.getByRole("button", {
      name: ctaLabel
    });

    expect(aButton).toBeVisible();
    expect(document.getElementById("empty-state")).toBeInTheDocument();
    expect(document.getElementById("empty-state-label")).toHaveTextContent(
      emptyStateLabel
    );
    expect(document.getElementById("empty-state-cta")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: ctaLabel })).toHaveAttribute(
      "href",
      ctaRoute
    );
  });

  it("Should render the empty state component WITHOUT cta button if requiredPermissions doesn't match", () => {
    requiredPermissions = ["aDifferentPermission"];
    const { queryByRole } = render(getEmptyStateComponent());

    const aButton = queryByRole("button", {
      name: ctaLabel
    });

    expect(aButton).toBeNull();
    expect(document.getElementById("empty-state")).toBeInTheDocument();
    expect(document.getElementById("empty-state-label")).toHaveTextContent(
      emptyStateLabel
    );
    expect(document.getElementById("empty-state-cta")).not.toBeInTheDocument();
  });

  it("Should render the button with empty label if ctaLabel is an empty string", () => {
    requiredPermissions = ["permission1"];
    ctaLabel = "";
    ctaRoute = "";
    render(getEmptyStateComponent());

    expect(document.getElementById("empty-state")).toBeInTheDocument();
    expect(document.getElementById("empty-state-label")).toHaveTextContent(
      emptyStateLabel
    );
    expect(document.getElementById("empty-state-cta")).toBeInTheDocument();
    expect(document.getElementById("empty-state-cta")).toHaveTextContent(
      ctaLabel
    );

    expect(screen.getByRole("link", { name: ctaLabel })).toHaveAttribute(
      "href",
      ctaRoute
    );
  });

  it("Should render the component with empty text if component label is empty string", () => {
    requiredPermissions = ["permission1"];
    emptyStateLabel = "";
    render(getEmptyStateComponent());

    expect(document.getElementById("empty-state")).toBeInTheDocument();
    expect(document.getElementById("empty-state-label")).toHaveTextContent(
      emptyStateLabel
    );
  });
});
