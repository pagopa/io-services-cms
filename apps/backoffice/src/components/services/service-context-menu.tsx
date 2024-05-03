import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import {
  ServicePublicationStatusType,
  ServicePublicationStatusTypeEnum
} from "@/generated/api/ServicePublicationStatusType";
import {
  Check,
  Close,
  Delete,
  Edit,
  History,
  MoreVert,
  PhoneAndroid
} from "@mui/icons-material";
import {
  Button,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { useDialog } from "../dialog-provider";
import ButtonWithTooltip from "../buttons/button-with-tooltip";
import { getConfiguration } from "@/config";

export enum ServiceContextMenuActions {
  publish = "publish",
  unpublish = "unpublish",
  submitReview = "submitReview",
  history = "history",
  edit = "edit",
  delete = "delete"
}

export type ServiceContextMenuProps = {
  /** If `true` shows ServicePublication actions only */
  releaseMode: boolean;
  lifecycleStatus?: ServiceLifecycleStatus;
  publicationStatus?: ServicePublicationStatusType;
  onPublishClick: () => void;
  onUnpublishClick: () => void;
  onSubmitReviewClick: () => void;
  onHistoryClick: () => void;
  onPreviewClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
};

/** Service context menu */
export const ServiceContextMenu = ({
  releaseMode,
  lifecycleStatus,
  publicationStatus,
  onPublishClick,
  onUnpublishClick,
  onSubmitReviewClick,
  onHistoryClick,
  onPreviewClick,
  onEditClick,
  onDeleteClick
}: ServiceContextMenuProps) => {
  const { t } = useTranslation();
  const showDialog = useDialog();

  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<null | HTMLElement>(
    null
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
      title: t(`service.${action}.modal.title`),
      message: t(`service.${action}.modal.description`),
      confirmButtonLabel: t(`service.${action}.modal.button`)
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
      size="medium"
      variant="contained"
      startIcon={<Check />}
      onClick={_ => handleConfirmationModal(ServiceContextMenuActions.publish)}
    >
      <Typography variant="body2" fontWeight={600} color="inherit" noWrap>
        {t("service.actions.publish")}
      </Typography>
    </Button>
  );

  /** Shows "Hide from App IO" action button */
  const renderUnpublishAction = () => (
    <Button
      size="medium"
      variant="outlined"
      sx={{ bgcolor: "background.paper" }}
      startIcon={<Close />}
      onClick={_ =>
        handleConfirmationModal(ServiceContextMenuActions.unpublish)
      }
    >
      <Typography variant="body2" fontWeight={600} color="inherit" noWrap>
        {t("service.actions.unpublish")}
      </Typography>
    </Button>
  );

  /** Show Send to review action button */
  const renderSubmitReviewAction = () => {
    if (hasSubmitReviewAction()) {
      return (
        <Button
          size="medium"
          variant="contained"
          onClick={_ =>
            handleConfirmationModal(ServiceContextMenuActions.submitReview)
          }
          disabled={
            lifecycleStatus?.value !== ServiceLifecycleStatusTypeEnum.draft
          }
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
            id="edit-menu-button"
            aria-label="edit-menu-button"
            aria-controls={isEditMenuOpen ? "edit-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={isEditMenuOpen ? "true" : undefined}
            onClick={handleEditMenuClick}
            size="medium"
            variant="text"
            sx={{ bgcolor: "background.paper", padding: 0 }}
          >
            <MoreVert />
          </Button>
          <Menu
            id="edit-menu"
            anchorEl={editMenuAnchorEl}
            open={isEditMenuOpen}
            onClose={handleEditMenuClose}
            MenuListProps={{
              "aria-labelledby": "edit-menu-button"
            }}
            disableScrollLock
          >
            <MenuItem onClick={handleEditClick} disabled={releaseMode}>
              <ListItemIcon>
                <Edit fontSize="inherit" color="primary" />
              </ListItemIcon>
              <Typography variant="inherit" color="primary" marginLeft={1}>
                {t("service.actions.edit")}
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={_ =>
                handleConfirmationModal(ServiceContextMenuActions.delete)
              }
            >
              <ListItemIcon>
                <Delete fontSize="inherit" color="error" />
              </ListItemIcon>
              <Typography variant="inherit" color="error" marginLeft={1}>
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
        isVisible={true}
        tooltipTitle="service.actions.history"
        onClick={onHistoryClick}
        icon={<History />}
        size="medium"
        variant="text"
      />
      <ButtonWithTooltip
        isVisible={
          getConfiguration().BACK_OFFICE_IN_APP_PREVIEW_ENABLED
        }
        tooltipTitle="service.actions.preview"
        onClick={onPreviewClick}
        icon={<PhoneAndroid />}
        size="medium"
        variant="text"
      />
      {!releaseMode ? renderSubmitReviewAction() : null}
      {renderPublicationAction()}
    </Stack>
  );
};
