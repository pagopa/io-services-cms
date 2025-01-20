import { SelectController } from "@/components/forms/controllers";
import { Group } from "@/generated/api/Group";
import { SupervisedUserCircle } from "@mui/icons-material";
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
  });

export interface ApiKeyBuilderStepProps {
  groups?: Group[];
}

/** Group ApiKey create process */
export const ApiKeyBuilderStep = ({ groups }: ApiKeyBuilderStepProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Stack alignItems="center" direction="row" gap={1}>
        <SupervisedUserCircle />
        <Typography variant="sidenav">
          {t("forms.apiKey.group.select.label")}
        </Typography>
      </Stack>
      <SelectController
        helperText={
          <span
            dangerouslySetInnerHTML={{
              __html: t("forms.apiKey.group.select.helperText"),
            }}
          />
        }
        items={
          groups
            ? groups?.map((group) => ({ label: group.name, value: group.id }))
            : []
        }
        label={t("forms.apiKey.group.select.placeholder")}
        name="groupId"
        placeholder={t("forms.apiKey.group.select.placeholder")}
        required
      />
    </>
  );
};
