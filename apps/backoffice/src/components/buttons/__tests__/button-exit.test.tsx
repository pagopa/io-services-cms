import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DialogProvider from "../../dialog-provider";
import { ButtonExit } from "../index";

const BO_IO_BUTTON_EXIT = "bo-io-button-exit";

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

    const button = screen.getByTestId(BO_IO_BUTTON_EXIT);

    expect(button).toBeDefined();
  });

  it("should be clicked with confirm", async () => {
    render(getButtonExitComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_EXIT);
    fireEvent.click(button);
    await screen.findByTestId("bo-io-dialog-provider");

    fireEvent.click(screen.getByTestId("bo-io-dialog-provider-confirm-button"));

    await waitFor(() => expect(onClick).toHaveBeenCalled());
  });

  it("should be clicked with cancel", async () => {
    render(getButtonExitComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_EXIT);
    fireEvent.click(button);

    await screen.findByTestId("bo-io-dialog-provider");

    fireEvent.click(screen.getByTestId("bo-io-dialog-provider-cancel-button"));

    await waitFor(() => expect(onClick).not.toHaveBeenCalled());
  });
});
