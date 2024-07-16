import { LangCode } from "@pagopa/mui-italia";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppFooter } from "../";

let loggedUser = true;
let currentLanguage: LangCode = "it";

vi.mock("next/router", () => ({
  useRouter: () => {}
}));

const getFooterComponent = () => (
  <AppFooter loggedUser={loggedUser} currentLanguage={currentLanguage} />
);

const resetProps = () => {
  currentLanguage = "it";
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[AppFooter] Component", () => {
  it("should be rendered", () => {
    render(getFooterComponent());
    console.log(getFooterComponent());
    const appFooter = screen.getByRole("contentinfo");
    expect(appFooter).toBeDefined();
  });

  it("should be rendered", () => {
    loggedUser = false;
    render(getFooterComponent());
    console.log(getFooterComponent());
    const appFooter = screen.getByRole("contentinfo");
    expect(appFooter).toBeDefined();
  });

  it("should use the it launguage", () => {
    render(getFooterComponent());
    const lang = screen.getByText("Italiano");
    expect(lang).toBeDefined();
  });

  it("should use the en launguage", () => {
    currentLanguage = "en";
    render(getFooterComponent());
    const lang = screen.getByText("English");
    expect(lang).toBeDefined();
  });

  it("should change the launguage using browser preferences", () => {
    render(getFooterComponent());
    const prevLang = screen.getByText("Italiano");
    expect(prevLang).toBeDefined();

    Object.defineProperty(navigator, "language", {
      value: "en",
      configurable: true,
      writable: true
    });

    render(getFooterComponent());
    const changedLang = screen.getByText("English");
    expect(changedLang).toBeDefined();
  });
});
