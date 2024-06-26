import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonBack } from "../index";

const BO_IO_BUTTON_BACK = "bo-io-button-back";

let isDisabled = false;
let onClick = vi.fn();

const getButtonBackComponent = () => (
  <ButtonBack disabled={isDisabled} onClick={onClick}></ButtonBack>
);

const resetProps = () => {
  isDisabled = false;
  onClick = vi.fn();
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[ButtonBack] Component", () => {
  it("should be rendered", () => {
    render(getButtonBackComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_BACK);

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    render(getButtonBackComponent());
    const button = screen.getByTestId(BO_IO_BUTTON_BACK);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should not be clicked", () => {
    isDisabled = true;
    render(getButtonBackComponent());
    const button = screen.getByTestId(BO_IO_BUTTON_BACK);
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
