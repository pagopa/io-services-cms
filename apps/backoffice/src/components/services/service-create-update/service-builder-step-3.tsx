import { FormStepSectionWrapper } from "@/components/forms";
import { TextFieldArrayController } from "@/components/forms/controllers";
import {
  arrayOfIPv4CidrSchema,
  getOptionalUrlSchema,
} from "@/components/forms/schemas";
import { PinDrop } from "@mui/icons-material";
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
        url: getOptionalUrlSchema(t),
      }),
    }),
  });

/** Third step of Service create/update process */
export const ServiceBuilderStep3 = () => {
  const { t } = useTranslation();
  const { getFieldState, resetField, watch } = useFormContext();
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
      <ServiceExtraConfigurator />
    </>
  );
};
