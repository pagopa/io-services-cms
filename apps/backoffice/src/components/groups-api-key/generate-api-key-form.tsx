import { InstitutionGroup } from "@/types/group";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { SelectController } from "../forms/controllers";

interface GenerateApiKeyFormProp {
  groups: InstitutionGroup[];
  onFormValidation: (isFormInvalid: boolean, formSelectedId: string) => void;
}

export default function GenerateApiKeyForm({
  groups,
  onFormValidation,
}: GenerateApiKeyFormProp) {
  const { t } = useTranslation();
  const { watch } = useFormContext();

  const watchedGroup = watch("group");

  const convertGroupsToSelectItems = (groups: InstitutionGroup[]) =>
    groups.map((group) => ({
      label: group.name,
      value: group.id,
    }));

  const items = convertGroupsToSelectItems(groups);

  useEffect(() => {
    onFormValidation(!NonEmptyString.is(watchedGroup), watchedGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedGroup]);

  return (
    <SelectController
      helperText={t("routes.keys.new-group-api-key.card.form.description")}
      items={items}
      label={t("routes.keys.new-group-api-key.card.form.placeholder")}
      name="group"
      placeholder={t("routes.keys.new-group-api-key.card.form.placeholder")}
    />
  );
}
