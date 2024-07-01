import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonWithTooltip } from "../index";

const BO_IO_BUTTON_WITH_TOOLTIP = "bo-io-button-with-tooltip";

let onClick = vi.fn();

const resetProps = () => {
  onClick = vi.fn();
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[ButtonWithTooltip] Component", () => {
  it("should be rendered", () => {
    render(<ButtonWithTooltip isVisible onClick={onClick}></ButtonWithTooltip>);

    const button = screen.getByTestId(BO_IO_BUTTON_WITH_TOOLTIP);

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    render(<ButtonWithTooltip isVisible onClick={onClick}></ButtonWithTooltip>);

    const button = screen.getByTestId(BO_IO_BUTTON_WITH_TOOLTIP);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });
});
