import { getConfiguration } from "@/config";
import { GroupFilterTypeEnum } from "@/generated/api/GroupFilterType";
import { client } from "@/hooks/use-fetch";
import { SelfcareRoles } from "@/types/auth";
import { hasApiKeyGroupsFeatures } from "@/utils/auth-util";
import { trackBulkGroupAssignmentStartEvent } from "@/utils/mix-panel";
import { SupervisedUserCircle } from "@mui/icons-material";
import { Button } from "@mui/material";
import * as E from "fp-ts/lib/Either";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

import { AccessControl } from "../access-control";
import { useDialog } from "../dialog-provider";

const ASSOCIATE_GROUP_ROUTE = "/groups/associate";
const { GROUP_APIKEY_ENABLED } = getConfiguration();

const checkAtLeastOneGroupUnboundedServiceExists = async () => {
  try {
    const maybeResponse = await client.checkGroupUnboundedServiceExistence({});

    if (E.isRight(maybeResponse)) {
      return maybeResponse.right.status === 200;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const checkAtLeastOneActiveGroupExists = async (institutionId: string) => {
  try {
    const maybeResponse = await client.checkInstitutionGroupsExistence({
      filter: GroupFilterTypeEnum.ALL,
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

export const ButtonAssociateGroup = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const showDialog = useDialog();

  const handleClick = async () => {
    const atLeastOneActiveGroupExists = await checkAtLeastOneActiveGroupExists(
      session?.user?.institution.id as string,
    );

    if (!atLeastOneActiveGroupExists) {
      const noActiveGroupsAvailable = await showDialog({
        cancelButtonLabel: t("buttons.close"),
        confirmButtonLabel: t("routes.services.noActiveGroupsModal.confirm"),
        message: t("routes.services.noActiveGroupsModal.description"),
        title: t("routes.services.noActiveGroupsModal.title"),
      });
      if (noActiveGroupsAvailable) {
        window.open(
          `${getConfiguration().SELFCARE_URL}/dashboard/${
            session?.user?.institution.id
          }/groups`,
          "_blank",
        );
      }
      return;
    }

    const atLeastOneGroupUnboundedServiceExists =
      await checkAtLeastOneGroupUnboundedServiceExists();

    if (atLeastOneGroupUnboundedServiceExists) {
      trackBulkGroupAssignmentStartEvent();
      router.push(ASSOCIATE_GROUP_ROUTE);
    } else {
      await showDialog({
        confirmButtonLabel: t("buttons.close"),
        hideCancelButton: true,
        message: t("routes.services.noGroupUnboundedServicesModal.description"),
        title: t("routes.services.noGroupUnboundedServicesModal.title"),
      });
    }
  };

  if (!hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED)(session)) return null;

  return (
    <AccessControl
      requiredPermissions={["ApiServiceWrite"]}
      requiredRole={SelfcareRoles.admin}
    >
      <Button
        onClick={handleClick}
        size="medium"
        startIcon={<SupervisedUserCircle />}
        variant="outlined"
      >
        {t("service.actions.associateGroups")}
      </Button>
    </AccessControl>
  );
};
