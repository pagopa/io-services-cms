import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonWithLoader } from "../index";

const BO_IO_BUTTON_WITH_LOADER = "bo-io-button-with-loader";

let isDisabled = false;
let onClick = vi.fn();
let label = "test";
let isLoading = false;
let fullWidth = false;

const getButtonWithLoaderComponent = () => (
  <ButtonWithLoader
    label={label}
    disabled={isDisabled}
    onClick={onClick}
    fullWidth={fullWidth}
    loading={isLoading}
  ></ButtonWithLoader>
);

const resetProps = () => {
  isDisabled = false;
  onClick = vi.fn();
  label = "test";
  isLoading = false;
  fullWidth = false;
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[ButtonWithLoader] Component", () => {
  it("should be rendered", () => {
    render(getButtonWithLoaderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_WITH_LOADER);

    expect(button).toBeDefined();
  });

  it("should be clicked", () => {
    render(getButtonWithLoaderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_WITH_LOADER);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it("should not be clicked", () => {
    isDisabled = true;
    render(getButtonWithLoaderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_WITH_LOADER);
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("should not be clicked because loading", () => {
    isLoading = true;
    render(getButtonWithLoaderComponent());

    const button = screen.getByTestId(BO_IO_BUTTON_WITH_LOADER);
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("should show the loader ", () => {
    isLoading = true;
    render(getButtonWithLoaderComponent());
    const loader = screen.getByTestId(
      "bo-io-button-with-loader-circular-progress"
    );

    expect(loader).toBeDefined();
  });
});
