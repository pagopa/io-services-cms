import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonCancel } from "../index";

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

    const button = screen.getByTestId("bo-test-id-button-cancel");

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    render(getButtonCancelComponent());

    const button = screen.getByTestId("bo-test-id-button-cancel");
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it("should not be clicked", () => {
    isDisabled = true;
    render(getButtonCancelComponent());

    const button = screen.getByTestId("bo-test-id-button-cancel");
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
