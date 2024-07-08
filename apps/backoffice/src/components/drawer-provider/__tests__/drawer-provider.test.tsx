import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DrawerProvider, useDrawer } from "../";

const BO_IO_DRAWER_BASE_CONTAINER = "bo-io-drawer-base-container";
const BO_IO_OPEN_DRAWER_BUTTON = "bo-io-open-drawer-button";
const BO_IO_CLOSE_DRAWER_BUTTON = "bo-io-close-drawer-button";

const ButtonTestComponent = () => {
  const { openDrawer, closeDrawer } = useDrawer();

  return (
    <>
      <button
        data-testid={BO_IO_OPEN_DRAWER_BUTTON}
        onClick={() => openDrawer("test")}
      ></button>
      <button
        data-testid={BO_IO_CLOSE_DRAWER_BUTTON}
        onClick={() => closeDrawer()}
      ></button>
    </>
  );
};

const getDrawerProvider = () => {
  return (
    <DrawerProvider>
      <ButtonTestComponent />
    </DrawerProvider>
  );
};

const resetProps = () => {};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[DrawerProvider] Component", () => {
  it("should open the drawer", () => {
    render(getDrawerProvider());
    const openButton = screen.getByTestId(BO_IO_OPEN_DRAWER_BUTTON);
    fireEvent.click(openButton);
    const drawerContent = screen.getByTestId(BO_IO_DRAWER_BASE_CONTAINER);

    expect(drawerContent).toBeDefined();
  });
});
