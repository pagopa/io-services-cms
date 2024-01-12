import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ServiceLifecycleStatus } from "../../generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "../../generated/api/ServiceLifecycleStatusType";
import { ServiceStatus } from "../services";

let aServiceStatus: ServiceLifecycleStatus | undefined = {
  value: ServiceLifecycleStatusTypeEnum.approved
};

const getServiceStatusComponent = () => (
  <ServiceStatus status={aServiceStatus}></ServiceStatus>
);

// needed to clean document (react dom)
afterEach(cleanup);

describe("[ServiceStatus] Component", () => {
  it("Should render an APPROVED service status", () => {
    const { container } = render(getServiceStatusComponent());
    const elements = container.getElementsByClassName("MuiChip-colorSuccess");
    const disabledElements = container.getElementsByClassName("Mui-disabled");

    expect(elements.length).toBe(1);
    expect(elements[0]).toHaveAttribute(
      "aria-label",
      ServiceLifecycleStatusTypeEnum.approved
    );
    expect(disabledElements.length).toBe(0);
    expect(document.getElementById("service-status")).toBeInTheDocument();

    const parent = container.parentElement?.getElementsByClassName(
      "MuiSkeleton-root"
    );
    expect(parent?.length).toBe(0);
  });

  it("Should render an DELETED service status", () => {
    aServiceStatus = { value: ServiceLifecycleStatusTypeEnum.deleted };
    const { container } = render(getServiceStatusComponent());
    const elements = container.getElementsByClassName("MuiChip-colorDefault");
    const disabledElements = container.getElementsByClassName("Mui-disabled");

    expect(elements.length).toBe(1);
    expect(elements[0]).toHaveAttribute(
      "aria-label",
      ServiceLifecycleStatusTypeEnum.deleted
    );
    expect(disabledElements.length).toBe(1);
    expect(document.getElementById("service-status")).toBeInTheDocument();

    const parent = container.parentElement?.getElementsByClassName(
      "MuiSkeleton-root"
    );
    expect(parent?.length).toBe(0);
  });

  it("Should render an DRAFT service status", () => {
    aServiceStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
    const { container } = render(getServiceStatusComponent());
    const elements = container.getElementsByClassName("MuiChip-colorDefault");
    const disabledElements = container.getElementsByClassName("Mui-disabled");

    expect(elements.length).toBe(1);
    expect(elements[0]).toHaveAttribute(
      "aria-label",
      ServiceLifecycleStatusTypeEnum.draft
    );
    expect(disabledElements.length).toBe(0);
    expect(document.getElementById("service-status")).toBeInTheDocument();

    const parent = container.parentElement?.getElementsByClassName(
      "MuiSkeleton-root"
    );
    expect(parent?.length).toBe(0);
  });

  it("Should render an REJECTED service status", () => {
    aServiceStatus = { value: ServiceLifecycleStatusTypeEnum.rejected };
    const { container } = render(getServiceStatusComponent());
    const elements = container.getElementsByClassName("MuiChip-colorError");
    const disabledElements = container.getElementsByClassName("Mui-disabled");

    expect(elements.length).toBe(1);
    expect(elements[0]).toHaveAttribute(
      "aria-label",
      ServiceLifecycleStatusTypeEnum.rejected
    );
    expect(disabledElements.length).toBe(0);
    expect(document.getElementById("service-status")).toBeInTheDocument();

    const parent = container.parentElement?.getElementsByClassName(
      "MuiSkeleton-root"
    );
    expect(parent?.length).toBe(0);
  });

  it("Should render an SUBMITTED service status", () => {
    aServiceStatus = { value: ServiceLifecycleStatusTypeEnum.submitted };
    const { container } = render(getServiceStatusComponent());
    const elements = container.getElementsByClassName("MuiChip-colorWarning");
    const disabledElements = container.getElementsByClassName("Mui-disabled");

    expect(elements.length).toBe(1);
    expect(elements[0]).toHaveAttribute(
      "aria-label",
      ServiceLifecycleStatusTypeEnum.submitted
    );
    expect(disabledElements.length).toBe(0);
    expect(document.getElementById("service-status")).toBeInTheDocument();

    const parent = container.parentElement?.getElementsByClassName(
      "MuiSkeleton-root"
    );
    expect(parent?.length).toBe(0);
  });

  it("Should NOT render service status", () => {
    aServiceStatus = undefined;
    const { container } = render(getServiceStatusComponent());
    const elements = container.getElementsByClassName("MuiChip-colorDefault");
    const disabledElements = container.getElementsByClassName("Mui-disabled");

    expect(elements.length).toBe(1);
    expect(elements[0]).not.toHaveAttribute("aria-label");
    expect(disabledElements.length).toBe(0);
    expect(document.getElementById("service-status")).toBeInTheDocument();

    const parent = container.parentElement?.getElementsByClassName(
      "MuiSkeleton-root"
    );
    expect(parent?.length).toBe(1);
  });
});
