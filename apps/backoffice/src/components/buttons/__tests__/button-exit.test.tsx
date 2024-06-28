import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DialogProvider from "../../dialog-provider";
import { ButtonExit } from "../index";

let onClick = vi.fn();
const getButtonExitComponent = () => (
  <DialogProvider>
    <ButtonExit onClick={onClick}></ButtonExit>
  </DialogProvider>
);

const resetProps = () => {
  onClick = vi.fn();
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[ButtonExit] Component", () => {
  it("should be rendered", () => {
    render(getButtonExitComponent());

    const button = screen.getByTestId("bo-io-button-exit");

    expect(button).toBeDefined();
  });

  it("should be clicked with confirm", async () => {
    render(getButtonExitComponent());

    const button = screen.getByTestId("bo-io-button-exit");
    fireEvent.click(button);
    await fireEvent.click(
      screen.getByTestId("bo-io-dialog-provider-confirm-button")
    );

    expect(onClick).toHaveBeenCalled();
  });

  it("should be clicked with cancel", async () => {
    render(getButtonExitComponent());

    const button = screen.getByTestId("bo-io-button-exit");
    fireEvent.click(button);
    await fireEvent.click(
      screen.getByTestId("bo-io-dialog-provider-cancel-button")
    );

    expect(onClick).not.toHaveBeenCalled();
  });
});
