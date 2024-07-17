import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageHtmlHeadTitle } from "../page-html-head-title";

let section = "";

vi.mock("next/head", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: Array<React.ReactElement> }) => {
      return <>{children}</>;
    }
  };
});

const getHeadTitle = () => {
  return <PageHtmlHeadTitle section={section} />;
};

const resetProps = () => {};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[HeadTitle] Component", () => {
  it("should render the component", async () => {
    render(getHeadTitle());

    const title = screen.getByText("app.title |");

    expect(title).toBeDefined();
  });

  it("should show the defined section", async () => {
    section = "testSection";
    render(getHeadTitle());
    const title = screen.getByText(`app.title | ${section}`);

    expect(title).toBeDefined();
  });
});
