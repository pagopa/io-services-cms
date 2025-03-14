import { AccessControl } from "@/components/access-control";
import { useDialog } from "@/components/dialog-provider";
import { GroupFilterTypeEnum } from "@/generated/api/GroupFilterType";
import { client } from "@/hooks/use-fetch";
import { SelfcareRoles } from "@/types/auth";
import { Add } from "@mui/icons-material";
import { Button } from "@mui/material";
import * as E from "fp-ts/lib/Either";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

export interface ButtonGenerateApiKeysGroupProps {
  /** Event triggered when user click "Create group" on modal that warns of the non-existence of any SC group */
  onCreateGroupClick: () => void;
  /** Event triggered when user click "Generate API Key" */
  onGenerateClick: () => void;
}

const checkUnboundedGroupsExists = async (institutionId: string) => {
  try {
    const maybeResponse = await client.checkInstitutionGroupsExistence({
      filter: GroupFilterTypeEnum.UNBOUND,
      institutionId,
    });

    if (E.isRight(maybeResponse)) {
      return maybeResponse.right.status === 200;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const ButtonGenerateApiKeysGroup = ({
  onCreateGroupClick,
  onGenerateClick,
}: ButtonGenerateApiKeysGroupProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const showDialog = useDialog();

  const handleOnGenerateClick = async () => {
    const hasAtLeastOneUnboundedGroup = await checkUnboundedGroupsExists(
      session?.user?.institution.id as string,
    );

    if (hasAtLeastOneUnboundedGroup) {
      onGenerateClick();
    } else {
      const noGroupAvailableCreateOne = await showDialog({
        cancelButtonLabel: t("buttons.close"),
        confirmButtonLabel: t("routes.keys.manage.group.noGroupModal.confirm"),
        message: t("routes.keys.manage.group.noGroupModal.description"),
        title: t("routes.keys.manage.group.title"),
      });
      if (noGroupAvailableCreateOne) {
        onCreateGroupClick();
      }
    }
  };

  return (
    <AccessControl requiredRole={SelfcareRoles.admin}>
      <Button
        onClick={handleOnGenerateClick}
        size="medium"
        startIcon={<Add />}
        sx={{ marginBottom: 2 }}
        variant="contained"
      >
        {t("routes.keys.manage.group.generate")}
      </Button>
    </AccessControl>
  );
};
