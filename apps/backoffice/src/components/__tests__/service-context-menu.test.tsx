import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ServiceLifecycleStatus } from "../../generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "../../generated/api/ServiceLifecycleStatusType";
import {
  ServicePublicationStatusType,
  ServicePublicationStatusTypeEnum
} from "../../generated/api/ServicePublicationStatusType";
import { ServiceContextMenu } from "../services";

let isRelease = false;
let aServiceLifecycleStatus: ServiceLifecycleStatus | undefined;
let aServicePublicationStatus: ServicePublicationStatusType | undefined;

const getServiceContextMenuComponent = () => (
  <ServiceContextMenu
    releaseMode={isRelease}
    lifecycleStatus={aServiceLifecycleStatus}
    publicationStatus={aServicePublicationStatus}
    onPublishClick={() => console.log("onPublishClick")}
    onUnpublishClick={() => console.log("onUnpublishClick")}
    onSubmitReviewClick={() => console.log("onSubmitReviewClick")}
    onHistoryClick={() => console.log("onHistoryClick")}
    onEditClick={() => console.log("onEditClick")}
    onDeleteClick={() => console.log("onDeleteClick")}
  />
);

// needed to clean document (react dom)
afterEach(cleanup);

describe("[ServiceContextMenu] Component", () => {
  describe("[ServiceContextMenu - Lifecycle Mode]", () => {
    it("Should render context menu for a DRAFT and never approved service", () => {
      isRelease = false;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = undefined;

      const { queryByText, queryByLabelText, queryByRole } = render(
        getServiceContextMenuComponent()
      );

      const sendReviewButton = queryByRole("button", {
        name: "service.actions.submitReview"
      });

      // sendReview button
      expect(sendReviewButton).toBeVisible();
      expect(sendReviewButton).toHaveProperty("disabled", false);
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
    });

    it("Should render context menu for a DRAFT/UNPUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByText, queryByLabelText, queryByRole } = render(
        getServiceContextMenuComponent()
      );

      const sendReviewButton = queryByRole("button", {
        name: "service.actions.submitReview"
      });

      // sendReview button
      expect(sendReviewButton).toBeVisible();
      expect(sendReviewButton).toHaveProperty("disabled", false);
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
    });

    it("Should render context menu for a DRAFT/PUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByText, queryByLabelText, queryByRole } = render(
        getServiceContextMenuComponent()
      );

      const sendReviewButton = queryByRole("button", {
        name: "service.actions.submitReview"
      });

      // sendReview button
      expect(sendReviewButton).toBeVisible();
      expect(sendReviewButton).toHaveProperty("disabled", false);
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
    });

    it("Should render context menu for a SUBMITTED and never approved service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.submitted
      };
      aServicePublicationStatus = undefined;

      const { queryByText, queryByLabelText } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(queryByText(/service\.actions\.submitReview/)).toBeNull();
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeNull();
    });

    it("Should render context menu for a SUBMITTED/UNPUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.submitted
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByText, queryByLabelText } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(queryByText(/service\.actions\.submitReview/)).toBeNull();
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeNull();
    });

    it("Should render context menu for a SUBMITTED/PUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.submitted
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByText, queryByLabelText } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(queryByText(/service\.actions\.submitReview/)).toBeNull();
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeNull();
    });

    it("Should render context menu for a APPROVED/UNPUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.approved
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByText, queryByLabelText } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(queryByText(/service\.actions\.submitReview/)).toBeNull();
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.publish/)).toBeInTheDocument();
      expect(queryByText(/service\.actions\.unpublish/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
    });

    it("Should render context menu for a APPROVED/PUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.approved
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByText, queryByLabelText } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(queryByText(/service\.actions\.submitReview/)).toBeNull();
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.publish/)).toBeNull();
      expect(queryByText(/service\.actions\.unpublish/)).toBeInTheDocument();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
    });

    it("Should render context menu for a REJECTED and never approved service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.rejected
      };
      aServicePublicationStatus = undefined;

      const { queryByText, queryByLabelText } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(queryByText(/service\.actions\.submitReview/)).toBeInTheDocument();
      expect(queryByText(/service\.actions\.submitReview/)).toHaveProperty(
        "disabled",
        true
      );
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
    });

    it("Should render context menu for a REJECTED/UNPUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.rejected
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByText, queryByLabelText } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(queryByText(/service\.actions\.submitReview/)).toBeInTheDocument();
      expect(queryByText(/service\.actions\.submitReview/)).toHaveProperty(
        "disabled",
        true
      );
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
    });

    it("Should render context menu for a REJECTED/PUBLISHED service", () => {
      isRelease = false;
      aServiceLifecycleStatus = {
        value: ServiceLifecycleStatusTypeEnum.rejected
      };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByText, queryByLabelText } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(queryByText(/service\.actions\.submitReview/)).toBeInTheDocument();
      expect(queryByText(/service\.actions\.submitReview/)).toHaveProperty(
        "disabled",
        true
      );
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
    });
  });

  describe("[ServiceContextMenu - Publication Mode]", () => {
    it("Should render context menu for an UNPUBLISHED service", () => {
      isRelease = true;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

      const { queryByText, queryByLabelText, queryByRole } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(
        queryByRole("button", {
          name: "service.actions.submitReview"
        })
      ).toBeNull();
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.publish/)).toBeInTheDocument();
      expect(queryByText(/service\.actions\.unpublish/)).toBeNull();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
      // TODO only delete button is enabled, try to verify this
    });

    it("Should render context menu for a PUBLISHED service", () => {
      isRelease = true;
      aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
      aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

      const { queryByText, queryByLabelText, queryByRole } = render(
        getServiceContextMenuComponent()
      );

      // sendReview button
      expect(
        queryByRole("button", {
          name: "service.actions.submitReview"
        })
      ).toBeNull();
      // publish/unpublish buttons
      expect(queryByText(/service\.actions\.publish/)).toBeNull();
      expect(queryByText(/service\.actions\.unpublish/)).toBeInTheDocument();
      // edit/delete menu buttons
      expect(queryByLabelText(/edit-menu-button/)).toBeInTheDocument();
      // TODO only delete button is enabled, try to verify this
    });
  });

  it("Should render context menu for a DELETED service", () => {
    isRelease = false;
    aServiceLifecycleStatus = {
      value: ServiceLifecycleStatusTypeEnum.deleted
    };

    const { queryByText, queryByLabelText } = render(
      getServiceContextMenuComponent()
    );

    // sendReview button
    expect(queryByText(/service\.actions\.submitReview/)).toBeNull();
    // publish/unpublish buttons
    expect(queryByText(/service\.actions\.(publish|unpublish)/)).toBeNull();
    // edit/delete menu buttons
    expect(queryByLabelText(/edit-menu-button/)).toBeNull();
  });
});
