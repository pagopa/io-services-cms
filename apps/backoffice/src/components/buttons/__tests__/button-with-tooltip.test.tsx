import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonWithTooltip } from "../index";

// needed to clean document (react dom)
afterEach(cleanup);

describe("[ButtonWithTooltip] Component", () => {
  it("should be rendered", () => {
    render(
      <ButtonWithTooltip isVisible onClick={() => vi.fn()}></ButtonWithTooltip>
    );

    const button = screen.getByTestId("bo-io-button-with-tooltip");

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    const onClick = vi.fn();
    render(<ButtonWithTooltip isVisible onClick={onClick}></ButtonWithTooltip>);

    const button = screen.getByTestId("bo-io-button-with-tooltip");
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });
});
