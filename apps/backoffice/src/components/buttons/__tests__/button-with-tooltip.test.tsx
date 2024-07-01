import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React, { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonWithTooltip } from "../index";

const BO_IO_BUTTON_WITH_TOOLTIP = "bo-io-button-with-tooltip";
const aTestIcon = (<></>) as ReactNode;

let onClick = vi.fn();

const getButtonWithTooltipComponent = () => (
  <ButtonWithTooltip
    icon={aTestIcon}
    size="medium"
    tooltipTitle="test"
    variant="outlined"
    isVisible
    onClick={onClick}
  ></ButtonWithTooltip>
);

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
    render(getButtonWithTooltipComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_WITH_TOOLTIP);

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    render(getButtonWithTooltipComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_WITH_TOOLTIP);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });
});
