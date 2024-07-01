import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonShowMore } from "../index";

const BO_IO_BUTTON_SHOW_MORE = "bo-io-button-show-more";

let isDisabled = false;
let onClick = vi.fn();

const getButtonShowMoreComponent = () => (
  <ButtonShowMore disabled={isDisabled} onClick={onClick}></ButtonShowMore>
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

describe("[ButtonShowMore] Component", () => {
  it("should be rendered", () => {
    render(getButtonShowMoreComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_SHOW_MORE);

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    render(getButtonShowMoreComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_SHOW_MORE);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it("should not be clicked", () => {
    isDisabled = true;
    render(getButtonShowMoreComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_SHOW_MORE);
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
