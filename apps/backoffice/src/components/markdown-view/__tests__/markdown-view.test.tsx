import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { MarkdownView } from "../index";

const BO_IO_MARKDOWN_VIEW = "bo-io-markdown-view";

let markdownContent: string = "";

const getMarkdownViewComponent = () => (
  <MarkdownView>{markdownContent}</MarkdownView>
);

const resetProps = () => {};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[MarkdownView] Component", () => {
  it("should be rendered", () => {
    markdownContent = "test";
    render(getMarkdownViewComponent());

    const view = screen.getByTestId(BO_IO_MARKDOWN_VIEW);
    const content = screen.getByText(markdownContent);

    expect(view).toBeDefined();
    expect(content).toBeDefined();
  });
});
