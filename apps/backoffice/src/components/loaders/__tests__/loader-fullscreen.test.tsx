import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { LoaderFullscreen } from "../loader-fullscreen";

const BO_IO_FULLSCREEN_LOADER = "bo-io-fullscreen-loader";

let title: string = "testTitle";
let content: string = "testContent";
let loading: boolean = true;

const getLoaderFullscreenComponent = () => (
  <LoaderFullscreen loading={loading} title={title} content={content} />
);

const resetProps = () => {
  title = "testTitle";
  content = "testContent";
  loading = true;
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[FullscreenLoader] Component", () => {
  it("should be rendered", () => {
    render(getLoaderFullscreenComponent());

    const loader = screen.getByTestId(BO_IO_FULLSCREEN_LOADER);

    expect(loader).toBeDefined();
  });

  it("should show the correct title and content", () => {
    render(getLoaderFullscreenComponent());

    const title = screen.getByText("testTitle");
    const content = screen.getByText("testContent");

    expect(title).toBeDefined();
    expect(content).toBeDefined();
  });

  it("should be rendered", () => {
    loading = false;
    render(getLoaderFullscreenComponent());

    const loader = screen.queryByTestId(BO_IO_FULLSCREEN_LOADER);

    expect(loader).not.toBeNull();
  });
});
