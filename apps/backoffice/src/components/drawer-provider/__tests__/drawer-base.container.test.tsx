import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React, { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DrawerBaseContainer } from "../";

const BO_IO_DRAWER_BASE_CONTAINER = "bo-io-drawer-base-container";
const BO_IO_ICON_BUTTON_CLOSE = "bo-io-icon-button-close";

let open: boolean = true;
let onClose = vi.fn();
let children: ReactNode;

const getDrawerContentainer = () => (
  <DrawerBaseContainer open={open} onClose={onClose}>
    {children}
  </DrawerBaseContainer>
);

const resetProps = () => {
  open = true;
  onClose = vi.fn();
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[DrawerBaseContentainer] Component", () => {
  it("should be rendered", () => {
    render(getDrawerContentainer());

    const drawerContent = screen.getByTestId(BO_IO_DRAWER_BASE_CONTAINER);

    expect(drawerContent).toBeDefined();
  });

  it("should not be rendered", () => {
    open = false;
    render(getDrawerContentainer());

    const drawerContent = screen.queryByTestId(BO_IO_DRAWER_BASE_CONTAINER);

    expect(drawerContent).toBeNull();
  });

  it("should be clicked", () => {
    render(getDrawerContentainer());

    const button = screen.getByTestId(BO_IO_ICON_BUTTON_CLOSE);
    fireEvent.click(button);

    expect(onClose).toHaveBeenCalled();
  });
});
