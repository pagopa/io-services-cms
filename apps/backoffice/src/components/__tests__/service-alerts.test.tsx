import { cleanup, render } from "@testing-library/react";
import React from "react";
import { Mock, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ServiceLifecycleStatus } from "../../generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "../../generated/api/ServiceLifecycleStatusType";
import {
  ServicePublicationStatusType,
  ServicePublicationStatusTypeEnum
} from "../../generated/api/ServicePublicationStatusType";
import { useDrawer } from "../drawer-provider";
import { ServiceAlerts } from "../services";

vi.mock("../drawer-provider");
const mockUseDrawer = useDrawer as Mock;

let isRelease = false;
let aServiceLifecycleStatus: ServiceLifecycleStatus | undefined;
let aServicePublicationStatus: ServicePublicationStatusType | undefined;

const getServiceAlertsComponent = () => (
  <ServiceAlerts
    releaseMode={isRelease}
    serviceLifecycleStatus={aServiceLifecycleStatus}
    servicePublicationStatus={aServicePublicationStatus}
    onServiceLifecycleClick={() => console.log("onServiceLifecycleClick")}
    onServicePublicationClick={() => console.log("onServicePublicationClick")}
  />
);

beforeAll(() => {
  mockUseDrawer.mockReturnValue({
    openDrawer: vi.fn()
  });
});

// needed to clean document (react dom)
afterEach(cleanup);

describe("[ServiceAlerts] Component", () => {
  it("Should NOT render any alert for an undefined service", () => {
    isRelease = false;
    aServiceLifecycleStatus = undefined;
    aServicePublicationStatus = undefined;

    const { queryByRole } = render(getServiceAlertsComponent());

    expect(queryByRole("alert")).toBeNull();
  });

  describe("[ServiceAlerts - Lifecycle Mode] Rendering ServiceLifecycle data", () => {
    it("Should NOT render any alert for a DRAFT and never approved service", () => {
      isRelease = false;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = undefined;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(queryByRole("alert")).toBeNull();
    });

    it("Should render a ServicePublication alert (sp-alert) for a DRAFT service that has a previous APPROVED/UNPUBLISHED version", () => {
      isRelease = false;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should render a ServicePublication alert (sp-alert) for a DRAFT service that has a previous APPROVED/PUBLISHED version", () => {
      isRelease = false;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should render a ServiceLifecycle alert (sl-alert-submitted) for a SUBMITTED and never approved service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.submitted
      };
      aServicePublicationStatus = undefined;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-submitted"
        })
      ).toBeVisible();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeNull();
    });

    it("Should render a ServiceLifecycle alert (sl-alert-submitted) and ServicePublication alert (sp-alert) for a SUBMITTED service that has a previous APPROVED/UNPUBLISHED version", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.submitted
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-submitted"
        })
      ).toBeVisible();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should render a ServiceLifecycle alert (sl-alert-submitted) and ServicePublication alert (sp-alert) for a SUBMITTED service that has a previous APPROVED/PUBLISHED version", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.submitted
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-submitted"
        })
      ).toBeVisible();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should NOT render any alert for an APPROVED/UNPUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.approved
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(queryByRole("alert")).toBeNull();
    });

    it("Should NOT render any alert for an APPROVED/PUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.approved
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(queryByRole("alert")).toBeNull();
    });

    it("Should render a ServiceLifecycle alert (sl-alert-rejected) for a REJECTED and never approved service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.rejected
      };
      aServicePublicationStatus = undefined;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-rejected"
        })
      ).toBeVisible();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeNull();
    });

    it("Should render a ServiceLifecycle alert (sl-alert-rejected) and ServicePublication alert (sp-alert) for a REJECTED service that has a previous APPROVED/UNPUBLISHED version", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.rejected
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-rejected"
        })
      ).toBeVisible();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should render a ServiceLifecycle alert (sl-alert-rejected) and ServicePublication alert (sp-alert) for a REJECTED service that has a previous APPROVED/PUBLISHED version", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.rejected
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-rejected"
        })
      ).toBeVisible();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should NOT render any alert for a DELETED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.deleted
      };
      aServicePublicationStatus = undefined;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(queryByRole("alert")).toBeNull();
    });
  });

  describe("[ServiceAlerts - Publication Mode] Rendering ServicePublication data", () => {
    it("Should render a ServicePublication alert (sp-alert) for a DRAFT service that has an UNPUBLISHED version", () => {
      isRelease = true;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should render a ServicePublication alert (sp-alert) for a DRAFT service that has a PUBLISHED version", () => {
      isRelease = true;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should render a ServicePublication alert (sp-alert) for a SUBMITTED service that has an UNPUBLISHED version", () => {
      isRelease = true;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.submitted
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-submitted"
        })
      ).toBeNull();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should render a ServicePublication alert (sp-alert) for a SUBMITTED service that has a PUBLISHED version", () => {
      isRelease = true;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.submitted
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-submitted"
        })
      ).toBeNull();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should NOT render any alert for an APPROVED/UNPUBLISHED service", () => {
      isRelease = true;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.approved
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(queryByRole("alert")).toBeNull();
    });

    it("Should NOT render any alert for an APPROVED/PUBLISHED service", () => {
      isRelease = true;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.approved
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(queryByRole("alert")).toBeNull();
    });

    it("Should render a ServicePublication alert (sp-alert) for a REJECTED service that has an UNPUBLISHED version", () => {
      isRelease = true;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.rejected
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-rejected"
        })
      ).toBeNull();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });

    it("Should render a ServicePublication alert (sp-alert) for a REJECTED service that has a PUBLISHED version", () => {
      isRelease = true;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.rejected
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByRole } = render(getServiceAlertsComponent());

      expect(
        queryByRole("alert", {
          name: "sl-alert-rejected"
        })
      ).toBeNull();

      expect(
        queryByRole("alert", {
          name: "sp-alert"
        })
      ).toBeVisible();
    });
  });
});
