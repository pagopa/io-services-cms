import {
  BuilderStep,
  CreateUpdateProcess,
} from "@/components/create-update-process";
import { useDialog } from "@/components/dialog-provider";
import { CreateManageGroupSubscription } from "@/generated/api/CreateManageGroupSubscription";
import { GroupFilterTypeEnum } from "@/generated/api/GroupFilterType";
import { Groups } from "@/generated/api/Groups";
import useFetch from "@/hooks/use-fetch";
import { trackGroupKeyGenerateAbortEvent } from "@/utils/mix-panel";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";

import {
  ApiKeyBuilderStep,
  getValidationSchema as getVs1,
} from "./api-key-builder-step";

const apiKeyDefaultData: CreateManageGroupSubscription = {
  groupId: "" as NonEmptyString,
};

export interface ApiKeyCreateUpdateProps {
  onConfirm: (value: CreateManageGroupSubscription) => void;
}

/** ApiKey create/update process main component.\
 * Here are defined process steps (`BuilderStep[]`), apiKey default data, and process mode. */
export const ApiKeyCreateUpdate = ({ onConfirm }: ApiKeyCreateUpdateProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const { data: groupsData, fetchData: groupsFetchData } = useFetch<Groups>();

  const showDialog = useDialog();

  const handleCancel = async () => {
    const confirmed = await showDialog({
      message: t("forms.cancel.description"),
      title: t("forms.cancel.title"),
    });
    if (confirmed) {
      console.log("operation cancelled");
      trackGroupKeyGenerateAbortEvent();
      router.back();
    } else {
      console.log("modal cancelled");
    }
  };

  const apiKeyBuilderSteps: BuilderStep[] = [
    {
      content: (
        <ApiKeyBuilderStep groups={groupsData ? [...groupsData.groups] : []} />
      ),
      description: "forms.apiKey.group.step.description",
      label: "forms.apiKey.group.step.title",
      validationSchema: getVs1(t),
    },
  ];

  useEffect(() => {
    groupsFetchData(
      "getInstitutionGroups",
      {
        filter: GroupFilterTypeEnum.UNBOUND,
        institutionId: session?.user?.institution.id as string,
      },
      Groups,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CreateUpdateProcess
      confirmButtonLabels={{
        create: "forms.apiKey.buttons.create",
        update: "", // update unavailable
      }}
      itemToCreateUpdate={apiKeyDefaultData}
      mode="create"
      onCancel={() => handleCancel()}
      onConfirm={(value) => onConfirm(value)}
      steps={apiKeyBuilderSteps}
    />
  );
};
