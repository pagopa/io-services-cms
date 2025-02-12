import { ApiKeysGroupTag } from "@/components/api-keys/api-keys-groups/api-keys-group-tag";
import { useDialog } from "@/components/dialog-provider";
import { Delete, Edit } from "@mui/icons-material";
import { IconButton, Stack, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

export interface GroupInfoTagProps {
  /** Group name */
  name?: string;
  onAssociateClick?: () => void;
  onUnboundClick?: () => void;
}

export const GroupInfoTag = ({
  name,
  onAssociateClick,
  onUnboundClick,
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

  // Unbounded service: only admin can bound it to a group
  if (!name) {
    if (session?.user?.institution.role === "admin")
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
      <ApiKeysGroupTag label={name} />
      {session?.user?.institution.role === "admin" && (
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
