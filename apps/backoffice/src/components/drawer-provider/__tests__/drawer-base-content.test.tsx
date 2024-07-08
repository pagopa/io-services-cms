import { cleanup, render, screen } from "@testing-library/react";
import React, { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DrawerBaseContent, DrawerBaseContentHeader } from "../index";

const BO_IO_DRAWER_BASE_CONTENT = "bo-io-drawer-base-content";

let header: DrawerBaseContentHeader = {
  title: "title"
};
let children: ReactNode;

const getDrawerContent = () => (
  <DrawerBaseContent header={header}>{children}</DrawerBaseContent>
);

const resetProps = () => {};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[DrawerBaseContent] Component", () => {
  it("should be rendered", () => {
    render(getDrawerContent());

    const drawerContent = screen.getByTestId(BO_IO_DRAWER_BASE_CONTENT);

    expect(drawerContent).toBeDefined();
  });
});
