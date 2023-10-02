import { Add } from "@mui/icons-material";
import { cleanup, render } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React from "react";
import { Mock, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Sidenav, SidenavItem } from "../sidenav";

// mock useSession
vi.mock("next-auth/react");
const mockUseSession = useSession as Mock;

// mock useRouter
vi.mock("next/router", () => ({
  useRouter: vi.fn()
}));
const mockUseRouter = useRouter as Mock;
const pushMock = vi.fn();

const mockMenuItems: Array<SidenavItem> = [
  {
    href: "/authorizedRoute1",
    icon: <Add fontSize="inherit" />,
    text: "aLabel1",
    linkType: "internal",
    requiredPermissions: ["p1", "p2"],
    requiredRole: "aRole"
  },
  {
    href: "/authorizedRoute2",
    icon: <Add fontSize="inherit" />,
    text: "aLabel2",
    linkType: "internal",
    requiredPermissions: ["p2"]
  },
  {
    href: "/authorizedRoute3",
    icon: <Add fontSize="inherit" />,
    text: "aLabel3",
    linkType: "internal",
    hasBottomDivider: true,
    requiredRole: "aRole"
  },
  {
    href: "/unauthorizedRoute4",
    icon: <Add fontSize="inherit" />,
    text: "aLabel4",
    linkType: "internal",
    requiredPermissions: ["p3"],
    requiredRole: "aDifferentRole"
  },
  {
    href: "/unauthorizedRoute5",
    icon: <Add fontSize="inherit" />,
    text: "aLabel5",
    linkType: "internal",
    requiredPermissions: ["p3"]
  },
  {
    href: "/unauthorizedRoute6",
    icon: <Add fontSize="inherit" />,
    text: "aLabel6",
    linkType: "internal",
    requiredRole: "aDifferentRole"
  },
  {
    href: "/publicRoute7",
    icon: <Add fontSize="inherit" />,
    text: "aLabel7",
    linkType: "internal"
  },
  {
    href: "/publicRoute8",
    icon: <Add fontSize="inherit" />,
    text: "aLabel8",
    linkType: "external"
  }
];

beforeAll(() => {
  mockUseRouter.mockReturnValue({
    pathname: "/authorizedRoute2", // to check current selected item menu
    query: {},
    push: pushMock
  });
  mockUseSession.mockReturnValue({
    status: "authenticated",
    data: {
      user: {
        permissions: ["p1", "p2"],
        institution: { role: "aRole" }
      }
    }
  });
});

// needed to clean document (react dom)
afterEach(cleanup);

describe("[Sidenav] Component", () => {
  it("should render menu items correctly based on auth matches", () => {
    const { queryByLabelText } = render(
      <Sidenav items={mockMenuItems} onWidthChange={w => console.log(w)} />
    );

    // authorized menu items
    expect(queryByLabelText(mockMenuItems[0].text)).toBeInTheDocument();
    expect(queryByLabelText(mockMenuItems[1].text)).toBeInTheDocument();
    expect(queryByLabelText(mockMenuItems[2].text)).toBeInTheDocument();

    // unauthorized menu items
    expect(queryByLabelText(mockMenuItems[3].text)).toBeNull();
    expect(queryByLabelText(mockMenuItems[4].text)).toBeNull();
    expect(queryByLabelText(mockMenuItems[5].text)).toBeNull();

    // public menu items
    expect(queryByLabelText(mockMenuItems[6].text)).toBeInTheDocument();
    expect(queryByLabelText(mockMenuItems[7].text)).toBeInTheDocument();
  });

  it("should render 2nd menu item (aLabel2) correctly as current selected route", () => {
    const { container } = render(
      <Sidenav items={mockMenuItems} onWidthChange={w => console.log(w)} />
    );
    const elements = container.getElementsByClassName("Mui-selected");

    expect(elements.length).toBe(1);
    expect(elements[0]).toHaveProperty("aria-label", mockMenuItems[1].text);
  });
});
