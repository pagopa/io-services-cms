import { useDialog } from "@/components/dialog-provider";
import { LoaderSkeleton } from "@/components/loaders";
import { ServiceGroupTag } from "@/components/services";
import { Group } from "@/generated/api/Group";
import { isAdmin } from "@/utils/auth-util";
import { Delete, Edit } from "@mui/icons-material";
import { IconButton, Stack, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

export interface GroupInfoTagProps {
  loading?: boolean;
  onAssociateClick?: () => void;
  onUnboundClick?: () => void;
  value?: Group;
}

export const GroupInfoTag = ({
  loading,
  onAssociateClick,
  onUnboundClick,
  value,
}: GroupInfoTagProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const showDialog = useDialog();

  const handleUnbound = async () => {
    const confirmUnbound = await showDialog({
      confirmButtonLabel: t("buttons.delete"),
      message: t("routes.service.group.unbound.modal.message"),
      title: t("routes.service.group.unbound.modal.title"),
    });
    if (confirmUnbound && onUnboundClick) {
      onUnboundClick();
    } else {
      console.warn("Operation canceled");
    }
  };

  if (loading)
    return (
      <LoaderSkeleton
        loading={loading}
        style={{ height: "100%", width: "100%" }}
      >
        <></>
      </LoaderSkeleton>
    );

  // Unbounded service: only admin can bound it to a group
  if (!value) {
    if (isAdmin(session))
      return (
        <ButtonNaked
          color="primary"
          endIcon={<Edit />}
          onClick={onAssociateClick}
          size="medium"
          sx={{ fontWeight: 700 }}
        >
          {t("routes.service.group.associate")}
        </ButtonNaked>
      );
    else
      return (
        <Typography fontWeight={600} variant="body2">
          {t("routes.service.group.unbounded")}
        </Typography>
      );
  }

  // Service already associated
  return (
    <Stack direction="row" spacing={1}>
      <ServiceGroupTag value={value} />
      {isAdmin(session) && (
        <>
          <IconButton
            aria-label="edit"
            color="primary"
            onClick={onAssociateClick}
            size="small"
          >
            <Edit fontSize="inherit" />
          </IconButton>
          <IconButton
            aria-label="unbound"
            color="inherit"
            onClick={handleUnbound}
            size="small"
          >
            <Delete color="error" fontSize="inherit" />
          </IconButton>
        </>
      )}
    </Stack>
  );
};
