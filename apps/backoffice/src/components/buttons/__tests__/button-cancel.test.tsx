import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonCancel } from "../index";

const BO_IO_BUTTON_CANCEL = "bo-io-button-cancel";

let isDisabled = false;
let onClick = vi.fn();
const getButtonCancelComponent = () => (
  <ButtonCancel disabled={isDisabled} onClick={onClick}></ButtonCancel>
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

describe("[ButtonCancel] Component", () => {
  it("should be rendered", () => {
    render(getButtonCancelComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_CANCEL);

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    render(getButtonCancelComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_CANCEL);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it("should not be clicked", () => {
    isDisabled = true;
    render(getButtonCancelComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_CANCEL);
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
