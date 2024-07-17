import { cleanup, render } from "@testing-library/react";
import { useRouter } from "next/router";
import React from "react";
import { Mock, afterEach, describe, expect, it, vi } from "vitest";
import { PageBreadcrumbs } from "../page-breadcrumbs";

// mock useRouter
vi.mock("next/router", () => ({
  useRouter: vi.fn()
}));
const mockUseRouter = useRouter as Mock;

// needed to clean document (react dom)
afterEach(cleanup);

describe("[PageBreadcrumbs] Component", () => {
  it("should NOT render breadcrumbs for base App route", () => {
    mockUseRouter.mockReturnValueOnce({
      asPath: "/"
    });

    const { container } = render(<PageBreadcrumbs />);

    expect(
      document.getElementById("bo-io-breadcrumbs")
    ).not.toBeInTheDocument();
  });

  it("should NOT render breadcrumbs for base App route with particular queryparams", () => {
    mockUseRouter.mockReturnValueOnce({
      asPath: "/?test=:/abc"
    });

    const { container } = render(<PageBreadcrumbs />);

    expect(
      document.getElementById("bo-io-breadcrumbs")
    ).not.toBeInTheDocument();
  });

  it("should NOT render breadcrumbs for level 0 route section", () => {
    mockUseRouter.mockReturnValueOnce({
      asPath: "/root-section"
    });

    const { container } = render(<PageBreadcrumbs />);

    expect(
      document.getElementById("bo-io-breadcrumbs")
    ).not.toBeInTheDocument();
  });

  it("should render breadcrumbs for a nested route section", () => {
    mockUseRouter.mockReturnValueOnce({
      asPath: "/root-section/nested-section"
    });

    const { container } = render(<PageBreadcrumbs />);
    const elements = container.getElementsByClassName("MuiBreadcrumbs-li");

    expect(document.getElementById("bo-io-breadcrumbs")).toBeInTheDocument();
    expect(elements.length).toBe(2);
    expect(elements[0].textContent).toBe("root-section");
    expect(elements[1].textContent).toBe("nested-section");
  });

  it("should render breadcrumbs without queryparams for a nested route section with queryparams", () => {
    mockUseRouter.mockReturnValueOnce({
      asPath: "/root-section/nested-section?key1=val1&key2=val2"
    });

    const { container } = render(<PageBreadcrumbs />);
    const elements = container.getElementsByClassName("MuiBreadcrumbs-li");

    expect(document.getElementById("bo-io-breadcrumbs")).toBeInTheDocument();
    expect(elements.length).toBe(2);
    expect(elements[0].textContent).toBe("root-section");
    expect(elements[1].textContent).toBe("nested-section");
  });

  it("should render breadcrumbs without queryparams for a nested route section with particular queryparams", () => {
    mockUseRouter.mockReturnValueOnce({
      asPath: "/root-section/nested-section?test=:/abc"
    });

    const { container } = render(<PageBreadcrumbs />);
    const elements = container.getElementsByClassName("MuiBreadcrumbs-li");

    expect(document.getElementById("bo-io-breadcrumbs")).toBeInTheDocument();
    expect(elements.length).toBe(2);
    expect(elements[0].textContent).toBe("root-section");
    expect(elements[1].textContent).toBe("nested-section");
  });
});
