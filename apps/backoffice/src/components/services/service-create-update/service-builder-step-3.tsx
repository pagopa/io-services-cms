import { FormStepSectionWrapper } from "@/components/forms";
import { TextFieldArrayController } from "@/components/forms/controllers";
import { arrayOfIPv4CidrSchema } from "@/components/forms/schemas";
import { AddLocationAlt } from "@mui/icons-material";
import { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import * as z from "zod";
import { ServiceExtraConfigurator } from "./service-extra-configurator";

export const getValidationSchema = (t: TFunction<"translation", undefined>) =>
  z.object({
    authorized_cidrs: arrayOfIPv4CidrSchema,
    metadata: z.object({
      cta: z.object({
        text: z.string(),
        url: z.union([
          z.literal(""),
          z
            .string()
            .trim()
            .url(t("forms.errors.field.url"))
        ])
      })
    })
  });

/** Third step of Service create/update process */
export const ServiceBuilderStep3 = () => {
  const { t } = useTranslation();
  const { resetField, getFieldState, watch } = useFormContext();
  const watchedAuthorizedCidrs = watch("authorized_cidrs");
  const [areAuthorizedCidrsDirty, setAreAuthorizedCidrsDirty] = useState(false);

  const handleCancel = () => {
    resetField("authorized_cidrs");
  };

  useEffect(() => {
    setAreAuthorizedCidrsDirty(getFieldState("authorized_cidrs").isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAuthorizedCidrs]);

  return (
    <>
      <FormStepSectionWrapper
        key={0}
        title={t("forms.service.authorizedCidrs")}
        icon={<AddLocationAlt />}
      >
        <TextFieldArrayController
          name="authorized_cidrs"
          addButtonLabel={t("authorizedCidrs.add")}
          addDefaultValue=""
          size="small"
          variant="filled"
          inputProps={{
            style: {
              textAlign: "center"
            }
          }}
          sx={{ maxWidth: "185px" }}
          editable={true}
          readOnly={false}
          addSaveButton={false}
          addCancelButton={areAuthorizedCidrsDirty}
          onCancelClick={handleCancel}
          showGenericErrorMessage
        />
      </FormStepSectionWrapper>
      <ServiceExtraConfigurator />
    </>
  );
};
