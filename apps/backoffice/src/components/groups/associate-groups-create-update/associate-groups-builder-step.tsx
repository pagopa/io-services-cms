import { FormStepSectionWrapper } from "@/components/forms";
import {
  MultiSelectController,
  SelectController,
} from "@/components/forms/controllers";
import { Group } from "@/generated/api/Group";
import { MinifiedService } from "@/generated/api/MinifiedService";
import { Category, SupervisedUserCircle } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import * as z from "zod";

export const getValidationSchema = (t: TFunction<"translation", undefined>) =>
  z.object({
    groupId: z.union([
      z.string().min(1, { message: t("forms.errors.field.required") }),
      z.number().min(0, { message: t("forms.errors.field.required") }),
    ]),
    services: z
      .array(z.string())
      .min(1, { message: t("forms.errors.field.required") }),
  });

export interface AssociateGroupsBuilderStepProps {
  groupUnboundedServices?: MinifiedService[];
  groups?: Group[];
  loading: boolean;
}

/** Group ApiKey create process */
export const AssociateGroupsBuilderStep = ({
  groupUnboundedServices,
  groups,
  loading,
}: AssociateGroupsBuilderStepProps) => {
  const { t } = useTranslation();

  return (
    <>
      <FormStepSectionWrapper key={0}>
        <Stack alignItems="center" direction="row" gap={1}>
          <SupervisedUserCircle />
          <Typography variant="sidenav">
            {t("forms.groups.associate.group.select.label")}
          </Typography>
        </Stack>
        <SelectController
          items={
            groups
              ? groups.map((group) => ({ label: group.name, value: group.id }))
              : []
          }
          label={t("forms.groups.associate.group.select.placeholder")}
          name="groupId"
          placeholder={t("forms.groups.associate.group.select.placeholder")}
          required
        />
        <Stack alignItems="center" direction="row" gap={1} marginTop={3}>
          <Category />
          <Typography variant="sidenav">
            {t("forms.groups.associate.services.select.label")}
          </Typography>
        </Stack>
        <MultiSelectController
          items={
            groupUnboundedServices
              ? groupUnboundedServices.map((service) => ({
                  label: service.name,
                  value: service.id,
                }))
              : []
          }
          label={t("forms.groups.associate.services.select.placeholder")}
          loading={loading}
          name="services"
          placeholder={t("forms.groups.associate.services.select.placeholder")}
          required
        />
      </FormStepSectionWrapper>
    </>
  );
};
