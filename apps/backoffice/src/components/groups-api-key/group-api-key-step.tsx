import { Group } from "@/generated/api/Group";
import SupervisedUserCircleIcon from "@mui/icons-material/SupervisedUserCircle";
import { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import { z } from "zod";

import { FormStepSectionWrapper } from "../forms";
import { SelectController } from "../forms/controllers";

interface GenerateApiKeyFormProp {
  groups: Group[];
}

export const getValidationSchema = (t: TFunction<"translation", undefined>) =>
  z.object({
    select: z.string().min(1, { message: t("forms.errors.field.required") }),
  });

export function GroupApiKeyStep({ groups }: GenerateApiKeyFormProp) {
  const { t } = useTranslation();

  const convertGroupsToSelectItems = () => {
    if (groups) {
      return groups.map((group) => ({
        label: group.name,
        value: group.id,
      }));
    } else return [];
  };

  const items = convertGroupsToSelectItems();

  return (
    <FormStepSectionWrapper
      border={false}
      icon={<SupervisedUserCircleIcon />}
      title={t("routes.keys.new-group-api-key.form.title")}
    >
      <SelectController
        helperText={t("routes.keys.new-group-api-key.form.description")}
        items={items}
        label={t("routes.keys.new-group-api-key.form.placeholder")}
        name="select"
        placeholder={t("routes.keys.new-group-api-key.form.placeholder")}
      />
    </FormStepSectionWrapper>
  );
}
