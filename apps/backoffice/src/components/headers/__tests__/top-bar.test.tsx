import { JwtUser } from "@pagopa/mui-italia";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TopBar } from "../";

vi.mock("next/router", () => ({
  useRouter: () => {
    return { push: vi.fn() };
  }
}));

let user: false | JwtUser | undefined = false;
let hideAssistance: boolean = true;
window.open = vi.fn();
console.log = vi.fn();

const getTopBar = () => {
  return <TopBar user={user} hideAssistance={hideAssistance} />;
};

const resetProps = () => {
  user = false;
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[TopBar] Component", () => {
  it("should show the component", () => {
    render(getTopBar());
    const topBar = screen.getByRole("link", { name: "PagoPa S.p.A." });
    expect(topBar).toBeDefined();
  });

  it("should open the assistance", () => {
    user = {
      name: "Marie",
      surname: "Curie",
      email: "m.curie@test.email.it",
      id: "2b10852f-a4fd-4ae8-9dfc-ac3578fc5b21"
    };

    render(getTopBar());
    const docsButton = screen.getByText("Assistenza");
    fireEvent.click(docsButton);
    expect(window.open).toHaveBeenCalled();
  });

  it("should open the docs", () => {
    render(getTopBar());
    const docsButton = screen.getByText("Manuale operativo");
    fireEvent.click(docsButton);
    expect(window.open).toHaveBeenCalled();
  });

  it("should log in", () => {
    render(getTopBar());
    const docsButton = screen.getByText("Accedi");
    fireEvent.click(docsButton);
    expect(console.log).toHaveBeenCalled();
  });
});
