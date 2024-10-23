import {
  BuilderStep,
  CreateUpdateProcess,
} from "@/components/create-update-process";
import { useDialog } from "@/components/dialog-provider";
import { Group } from "@/generated/api/Group";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

import {
  GroupApiKeyStep,
  getValidationSchema as getVs,
} from "./group-api-key-step";

export interface GroupApiKeyCreateProps {
  groups: Group[];
  onConfirm: (value: string) => void;
}

/** Service create/update process main component.\
 * Here are defined process steps (`BuilderStep[]`), service default data, and process mode. */
export const GroupApiKeyCreate = ({
  groups,
  onConfirm,
}: GroupApiKeyCreateProps) => {
  const { t } = useTranslation();
  const router = useRouter();

  const showDialog = useDialog();
  const handleCancel = async () => {
    const confirmed = await showDialog({
      message: t("forms.cancel.description"),
      title: t("forms.cancel.title"),
    });
    if (confirmed) {
      console.log("operation cancelled");
      router.back();
    } else {
      console.log("modal cancelled");
    }
  };

  const serviceBuilderSteps: BuilderStep[] = [
    {
      content: <GroupApiKeyStep groups={groups} />,
      description: "routes.keys.new-group-api-key.cardDescription",
      label: "routes.keys.new-group-api-key.cardTitle",
      validationSchema: getVs(t),
    },
  ];

  const groupDefaultData = [
    {
      id: "value1",
      name: "label1",
    },
    {
      id: "value2",
      name: "label2",
    },
  ];

  return (
    <CreateUpdateProcess
      confirmButtonLabels={{
        create: "forms.service.buttons.create",
        groupApiKey: "routes.keys.new-group-api-key.buttonConfirm",
      }}
      itemToCreateUpdate={groups ?? groupDefaultData}
      mode={"groupApiKey"}
      onCancel={() => handleCancel()}
      onConfirm={(value) => onConfirm(value)}
      steps={serviceBuilderSteps}
    />
  );
};
