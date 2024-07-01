import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonNext } from "../index";

const BO_IO_BUTTON_NEXT = "bo-io-button-next";

let isDisabled = false;
let onClick = vi.fn();
const getButtonNextComponent = () => (
  <ButtonNext disabled={isDisabled} onClick={onClick}></ButtonNext>
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

describe("[ButtonNext] Component", () => {
  it("should be rendered", () => {
    render(getButtonNextComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_NEXT);

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    render(getButtonNextComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_NEXT);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it("should not be clicked", () => {
    isDisabled = true;
    render(getButtonNextComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_NEXT);
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
