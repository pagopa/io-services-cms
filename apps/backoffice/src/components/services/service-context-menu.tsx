import { getConfiguration } from "@/config";
import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import {
  ServicePublicationStatusType,
  ServicePublicationStatusTypeEnum,
} from "@/generated/api/ServicePublicationStatusType";
import {
  Check,
  Close,
  Delete,
  Edit,
  History,
  MoreVert,
  PhoneAndroid,
} from "@mui/icons-material";
import {
  Button,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { ButtonWithTooltip } from "../buttons";
import { useDialog } from "../dialog-provider";

export enum ServiceContextMenuActions {
  delete = "delete",
  edit = "edit",
  history = "history",
  publish = "publish",
  submitReview = "submitReview",
  unpublish = "unpublish",
}

export interface ServiceContextMenuProps {
  lifecycleStatus?: ServiceLifecycleStatus;
  onDeleteClick: () => void;
  onEditClick: () => void;
  onHistoryClick: () => void;
  onPreviewClick: () => void;
  onPublishClick: () => void;
  onSubmitReviewClick: () => void;
  onUnpublishClick: () => void;
  publicationStatus?: ServicePublicationStatusType;
  /** If `true` shows ServicePublication actions only */
  releaseMode: boolean;
}

/** Service context menu */
export const ServiceContextMenu = ({
  lifecycleStatus,
  onDeleteClick,
  onEditClick,
  onHistoryClick,
  onPreviewClick,
  onPublishClick,
  onSubmitReviewClick,
  onUnpublishClick,
  publicationStatus,
  releaseMode,
}: ServiceContextMenuProps) => {
  const { t } = useTranslation();
  const showDialog = useDialog();

  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const isEditMenuOpen = Boolean(editMenuAnchorEl);

  /** handle edit menu opening */
  const handleEditMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEditMenuAnchorEl(event.currentTarget);
  };
  /** handle edit menu closing */
  const handleEditMenuClose = () => {
    setEditMenuAnchorEl(null);
  };

  /** handle actions click: open confirmation modal and on confirm click, raise event */
  const handleConfirmationModal = async (action: ServiceContextMenuActions) => {
    handleEditMenuClose();
    const raiseClickEvent = await showDialog({
      confirmButtonLabel: t(`service.${action}.modal.button`),
      message: t(`service.${action}.modal.description`),
      title: t(`service.${action}.modal.title`),
    });
    if (raiseClickEvent) {
      switch (action) {
        case ServiceContextMenuActions.delete:
          onDeleteClick();
          break;
        case ServiceContextMenuActions.edit:
          onEditClick();
          break;
        case ServiceContextMenuActions.history:
          onHistoryClick();
          break;
        case ServiceContextMenuActions.publish:
          onPublishClick();
          break;
        case ServiceContextMenuActions.submitReview:
          onSubmitReviewClick();
          break;
        case ServiceContextMenuActions.unpublish:
          onUnpublishClick();
          break;
        default:
          console.warn("unhandled action " + action);
          break;
      }
    }
  };

  /** handle edit action menu click */
  const handleEditClick = () => {
    handleEditMenuClose();
    onEditClick();
  };

  /** Define when the service is publishable _(publish action can be performed)_ */
  const isPublishable = () =>
    publicationStatus === undefined ||
    publicationStatus === ServicePublicationStatusTypeEnum.unpublished;

  /** Define when the service is editable _(edit/cancel actions can be performed)_ */
  const isEditable = () =>
    lifecycleStatus?.value === ServiceLifecycleStatusTypeEnum.approved ||
    lifecycleStatus?.value === ServiceLifecycleStatusTypeEnum.draft ||
    lifecycleStatus?.value === ServiceLifecycleStatusTypeEnum.rejected ||
    releaseMode;

  /** Define when the service has Send to review action button */
  const hasSubmitReviewAction = () =>
    lifecycleStatus?.value === ServiceLifecycleStatusTypeEnum.draft ||
    lifecycleStatus?.value === ServiceLifecycleStatusTypeEnum.rejected;

  /** Define when the service has publis/unpubulish action button */
  const hasPublicationAction = () =>
    lifecycleStatus?.value === ServiceLifecycleStatusTypeEnum.approved ||
    releaseMode;

  /** Show publish/unpublish action button */
  const renderPublicationAction = () => {
    if (hasPublicationAction())
      return isPublishable() ? renderPublishAction() : renderUnpublishAction();
  };

  /** Shows "Publish in App IO" action button */
  const renderPublishAction = () => (
    <Button
      onClick={(_) =>
        handleConfirmationModal(ServiceContextMenuActions.publish)
      }
      size="medium"
      startIcon={<Check />}
      variant="contained"
    >
      <Typography color="inherit" fontWeight={600} noWrap variant="body2">
        {t("service.actions.publish")}
      </Typography>
    </Button>
  );

  /** Shows "Hide from App IO" action button */
  const renderUnpublishAction = () => (
    <Button
      onClick={(_) =>
        handleConfirmationModal(ServiceContextMenuActions.unpublish)
      }
      size="medium"
      startIcon={<Close />}
      sx={{ bgcolor: "background.paper" }}
      variant="outlined"
    >
      <Typography color="inherit" fontWeight={600} noWrap variant="body2">
        {t("service.actions.unpublish")}
      </Typography>
    </Button>
  );

  /** Show Send to review action button */
  const renderSubmitReviewAction = () => {
    if (hasSubmitReviewAction()) {
      return (
        <Button
          disabled={
            lifecycleStatus?.value !== ServiceLifecycleStatusTypeEnum.draft
          }
          onClick={(_) =>
            handleConfirmationModal(ServiceContextMenuActions.submitReview)
          }
          size="medium"
          variant="contained"
        >
          {t("service.actions.submitReview")}
        </Button>
      );
    }
  };

  /** Show Edit Menu _(edit/delete actions)_ */
  const renderEditActions = () => {
    if (isEditable()) {
      return (
        <>
          <Button
            aria-controls={isEditMenuOpen ? "edit-menu" : undefined}
            aria-expanded={isEditMenuOpen ? "true" : undefined}
            aria-haspopup="true"
            aria-label="edit-menu-button"
            id="edit-menu-button"
            onClick={handleEditMenuClick}
            size="medium"
            sx={{ bgcolor: "background.paper", padding: 0 }}
            variant="text"
          >
            <MoreVert />
          </Button>
          <Menu
            MenuListProps={{
              "aria-labelledby": "edit-menu-button",
            }}
            anchorEl={editMenuAnchorEl}
            disableScrollLock
            id="edit-menu"
            onClose={handleEditMenuClose}
            open={isEditMenuOpen}
          >
            <MenuItem disabled={releaseMode} onClick={handleEditClick}>
              <ListItemIcon>
                <Edit color="primary" fontSize="inherit" />
              </ListItemIcon>
              <Typography color="primary" marginLeft={1} variant="inherit">
                {t("service.actions.edit")}
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={(_) =>
                handleConfirmationModal(ServiceContextMenuActions.delete)
              }
            >
              <ListItemIcon>
                <Delete color="error" fontSize="inherit" />
              </ListItemIcon>
              <Typography color="error" marginLeft={1} variant="inherit">
                {t("service.actions.delete")}
              </Typography>
            </MenuItem>
          </Menu>
        </>
      );
    }
  };

  return (
    <Stack direction="row-reverse" spacing={2}>
      {renderEditActions()}
      <ButtonWithTooltip
        icon={<History />}
        isVisible={true}
        onClick={onHistoryClick}
        size="medium"
        tooltipTitle="service.actions.history"
        variant="text"
      />
      <ButtonWithTooltip
        icon={<PhoneAndroid />}
        isVisible={getConfiguration().BACK_OFFICE_IN_APP_PREVIEW_ENABLED}
        onClick={onPreviewClick}
        size="medium"
        tooltipTitle="service.actions.preview"
        variant="text"
      />
      {!releaseMode ? renderSubmitReviewAction() : null}
      {renderPublicationAction()}
    </Stack>
  );
};
