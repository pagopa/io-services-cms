import { CreateUpdateMode } from "@/components/create-update-process";
import { FormStepSectionWrapper } from "@/components/forms";
import { TextFieldArrayController } from "@/components/forms/controllers";
import {
  arrayOfIPv4CidrSchema,
  getUrlSchema,
} from "@/components/forms/schemas";
import { getConfiguration } from "@/config";
import { Group } from "@/generated/api/Group";
import { isGroupRequired } from "@/utils/auth-util";
import { PinDrop } from "@mui/icons-material";
import { TFunction } from "i18next";
import { Session } from "next-auth";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import * as z from "zod";

import { ServiceExtraConfigurator } from "./service-extra-configurator";
import { ServiceGroupSelector } from "./service-group-selector";

const { GROUP_APIKEY_ENABLED } = getConfiguration();

const makeCtaBlock = (t: TFunction<"translation", undefined>) => {
  const isUrl = (s: string) => getUrlSchema(t).safeParse(s).success;

  return z
    .object({
      enabled: z.boolean().default(false),
      text: z.string().trim().default(""),
      url: z.string().trim().default(""),
      urlPrefix: z.string().trim(),
    })
    .superRefine((data, ctx) => {
      // If the user has enabled the CTA
      if (data.enabled) {
        // The text must have at least 2 characters
        if (data.text.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("forms.errors.field.required"),
            path: ["text"],
          });
        }
        // The URL must be valid (and not empty)
        if (!data.url || !isUrl(data.url)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("forms.errors.field.url"),
            path: ["url"],
          });
        }
      }
    });
};

export const getValidationSchema = (
  t: TFunction<"translation", undefined>,
  session: Session | null,
) => {
  const ctaSchema = z
    .object({
      cta_1: makeCtaBlock(t),
      cta_2: makeCtaBlock(t),
    })
    .superRefine((data, ctx) => {
      // 1. If cta_2 is enabled, cta_1 must also be enabled
      if (data.cta_2.enabled && !data.cta_1.enabled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("forms.errors.field.required"),
          path: ["cta_1", "text"],
        });
      }
    });

  return z.object({
    authorized_cidrs: arrayOfIPv4CidrSchema,
    metadata: z.object({
      cta: ctaSchema.optional(),
      group_id: isGroupRequired(session, GROUP_APIKEY_ENABLED)
        ? z.string().min(1, { message: t("forms.errors.field.required") })
        : z.string().optional(),
    }),
  });
};

export interface ServiceBuilderStep3Props {
  groups?: readonly Group[];
  mode: CreateUpdateMode;
  session: Session | null;
}

/** Third step of Service create/update process */
export const ServiceBuilderStep3 = ({
  groups,
  mode,
  session,
}: ServiceBuilderStep3Props) => {
  const { t } = useTranslation();
  const { getFieldState, resetField, watch } = useFormContext();
  const watchedAuthorizedCidrs = watch("authorized_cidrs");
  const [areAuthorizedCidrsDirty, setAreAuthorizedCidrsDirty] = useState(false);
  const showGroupSelector = isGroupRequired(session, GROUP_APIKEY_ENABLED);

  const handleCancel = () => {
    resetField("authorized_cidrs");
  };

  const isGroupSelectorVisible = () =>
    mode === "create" && groups && groups?.length > 0;

  useEffect(() => {
    setAreAuthorizedCidrsDirty(getFieldState("authorized_cidrs").isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAuthorizedCidrs]);

  return (
    <>
      <FormStepSectionWrapper
        icon={<PinDrop />}
        key={0}
        title={t("forms.service.authorizedCidrs")}
      >
        <TextFieldArrayController
          addButtonLabel={t("authorizedCidrs.add")}
          addCancelButton={areAuthorizedCidrsDirty}
          addDefaultValue=""
          addSaveButton={false}
          editable={true}
          inputProps={{
            style: {
              textAlign: "center",
            },
          }}
          name="authorized_cidrs"
          onCancelClick={handleCancel}
          readOnly={false}
          showGenericErrorMessage
          size="small"
          sx={{ maxWidth: "185px" }}
        />
      </FormStepSectionWrapper>
      {isGroupSelectorVisible() && (
        <ServiceGroupSelector groups={groups} required={showGroupSelector} />
      )}
      <ServiceExtraConfigurator />
    </>
  );
};
