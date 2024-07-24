import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { LoaderSkeleton } from "../loader-skeleton";

const BO_IO_LOADER_SKELETON = "bo-io-loader-skeleton";

let loading: boolean = true;

const getLoaderSkeletonComponent = () => (
  <LoaderSkeleton loading={loading}>
    <div>Hello</div>
  </LoaderSkeleton>
);

const resetProps = () => {
  loading = true;
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[SkeletonLoader] Component", () => {
  it("should be rendered", () => {
    render(getLoaderSkeletonComponent());

    const loader = screen.getByTestId(BO_IO_LOADER_SKELETON);

    expect(loader).toBeDefined();
  });

  it("should not be rendered", () => {
    loading = false;
    render(getLoaderSkeletonComponent());

    const loader = screen.queryByTestId(BO_IO_LOADER_SKELETON);

    expect(loader).toBeNull();
  });

  it("should render the children", () => {
    render(getLoaderSkeletonComponent());

    const child = screen.getByText("Hello");

    expect(child).toBeDefined();
  });
});
