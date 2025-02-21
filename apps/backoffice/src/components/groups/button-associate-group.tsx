import { getConfiguration } from "@/config";
import { client } from "@/hooks/use-fetch";
import { SelfcareRoles } from "@/types/auth";
import { SupervisedUserCircle } from "@mui/icons-material";
import { Button } from "@mui/material";
import * as E from "fp-ts/lib/Either";
import { useRouter } from "next/router";
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

export const ButtonAssociateGroup = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const showDialog = useDialog();

  const handleClick = async () => {
    const atLeastOneGroupUnboundedServiceExists =
      await checkAtLeastOneGroupUnboundedServiceExists();

    if (atLeastOneGroupUnboundedServiceExists) {
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

  if (!GROUP_APIKEY_ENABLED) return null;

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
