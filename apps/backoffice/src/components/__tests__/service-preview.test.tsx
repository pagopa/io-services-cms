import { afterEach, describe, expect, it } from "vitest";
import { ServicePreview } from "../services";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

let isOpen = false;
let seviceTitle = "service.preview.title";
let serviceInfo = "service.preview.info";

const getServicePreviewComponent = () => (
  <ServicePreview
    isOpen={isOpen}
    name="service"
    institutionName="institution"
    description="description"
    onChange={isOpen => console.log("isOpen")}
  />
);

// needed to clean document (react dom)
afterEach(cleanup);

describe("[ServicePreview] Component", () => {
  it("shoud not render Dialog with service title and info if preview is closed", () => {
    isOpen = false;
    render(getServicePreviewComponent());

    expect(document.getElementById("s-preview-title")).not.toBeInTheDocument();
    expect(document.getElementById("s-preview-info")).not.toBeInTheDocument();
    expect(document.getElementById("s-preview-close-button")).not.toBeInTheDocument();
  });

  it("shoud render Dialog with service title , info and close button if preview is open", () => {
    isOpen = true;
    render(getServicePreviewComponent());

    const aButton = screen.getByRole("button", {
      name: "buttons.close"
    });

    expect(document.getElementById("s-preview-title")).toBeVisible();
    expect(document.getElementById("s-preview-title")).toHaveTextContent(seviceTitle);

    expect(document.getElementById("s-preview-info")).toBeVisible();
    expect(document.getElementById("s-preview-info")).toHaveTextContent(serviceInfo);

    expect(aButton).toBeVisible();
  });

  it("close button shoud close title and info preview", () => {
    isOpen = true;
    render(getServicePreviewComponent());

    const aButton = screen.getByRole("button", {
      name: "buttons.close"
    });

    fireEvent.click(aButton);

    expect(document.getElementById("s-preview-title")).not.toBeVisible();
    expect(document.getElementById("s-preview-info")).not.toBeVisible();
    expect(aButton).not.toBeVisible();
  });
});
