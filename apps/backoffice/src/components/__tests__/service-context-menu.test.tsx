import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ServiceLifecycleStatus } from "../../generated/api/ServiceLifecycleStatus";
import {
  ServicePublicationStatusType,
  ServicePublicationStatusTypeEnum
} from "../../generated/api/ServicePublicationStatusType";
import { ServiceLifecycleStatusTypeEnum } from "../../generated/api/ServiceLifecycleStatusType";
import { ServiceContextMenu } from "../services";

let aServiceLifecycleStatus: ServiceLifecycleStatus | undefined;
let aServicePublicationStatus: ServicePublicationStatusType | undefined;

const getServiceContextMenuComponent = () => (
  <ServiceContextMenu
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
  it("Should render context menu for a DRAFT and never approved service", () => {
    aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
    aServicePublicationStatus = undefined;

    const { queryByText, queryByLabelText } = render(
      getServiceContextMenuComponent()
    );

    const sendReviewButton = screen.getByRole("button", {
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
    aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
    aServicePublicationStatus = ServicePublicationStatusTypeEnum.unpublished;

    const { queryByText, queryByLabelText } = render(
      getServiceContextMenuComponent()
    );

    const sendReviewButton = screen.getByRole("button", {
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
    aServiceLifecycleStatus = { value: ServiceLifecycleStatusTypeEnum.draft };
    aServicePublicationStatus = ServicePublicationStatusTypeEnum.published;

    const { queryByText, queryByLabelText } = render(
      getServiceContextMenuComponent()
    );

    const sendReviewButton = screen.getByRole("button", {
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

  it("Should render context menu for a SUBMITTED service", () => {
    aServiceLifecycleStatus = {
      value: ServiceLifecycleStatusTypeEnum.submitted
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

  it("Should render context menu for a APPROVED/UNPUBLISHED service", () => {
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

  it("Should render context menu for a REJECTED service", () => {
    aServiceLifecycleStatus = {
      value: ServiceLifecycleStatusTypeEnum.rejected
    };

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

  it("Should render context menu for a DELETED service", () => {
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
