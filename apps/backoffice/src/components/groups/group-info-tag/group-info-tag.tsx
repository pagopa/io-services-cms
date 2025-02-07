import { ApiKeysGroupTag } from "@/components/api-keys/api-keys-groups/api-keys-group-tag";
import { Edit } from "@mui/icons-material";
import { IconButton, Stack, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

export interface GroupInfoTagProps {
  /** Group name */
  name?: string;
  onAssociateClick?: () => void;
}

export const GroupInfoTag = ({ name, onAssociateClick }: GroupInfoTagProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();

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
        <IconButton
          aria-label="edit"
          color="primary"
          onClick={onAssociateClick}
          size="small"
        >
          <Edit fontSize="inherit" />
        </IconButton>
      )}
    </Stack>
  );
};
