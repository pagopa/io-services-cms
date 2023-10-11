import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState } from "../empty-state";

let emptyStateLabel = "emptyStateLabel";
let ctaLabel = "ctaLabel";
let ctaRoute = "/ctaRoute";

const getEmptyStateComponent = () => (
  <EmptyState
    emptyStateLabel={emptyStateLabel}
    ctaLabel={ctaLabel}
    ctaRoute={ctaRoute}
  ></EmptyState>
);

// needed to clean document (react dom)
afterEach(cleanup);

describe("[EmptyState] Component", () => {
  it("Should render the empty state component", () => {
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

  it("Should render the button with empty label if ctaLabel is an empty string", () => {
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
    emptyStateLabel = "";
    render(getEmptyStateComponent());

    expect(document.getElementById("empty-state")).toBeInTheDocument();
    expect(document.getElementById("empty-state-label")).toHaveTextContent(
      emptyStateLabel
    );
  });
});
