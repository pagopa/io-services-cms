import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonBack } from "../index";

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

    const button = screen.getByTestId("bo-test-id-button-back");

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    render(getButtonBackComponent());
    const button = screen.getByTestId("bo-test-id-button-back");
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should not be clicked", () => {
    isDisabled = true;
    render(getButtonBackComponent());
    const button = screen.getByTestId("bo-test-id-button-back");
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
