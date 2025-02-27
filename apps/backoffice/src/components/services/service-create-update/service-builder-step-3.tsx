import { CreateUpdateMode } from "@/components/create-update-process";
import { FormStepSectionWrapper } from "@/components/forms";
import { TextFieldArrayController } from "@/components/forms/controllers";
import {
  arrayOfIPv4CidrSchema,
  getOptionalUrlSchema,
} from "@/components/forms/schemas";
import { getConfiguration } from "@/config";
import { Group } from "@/generated/api/Group";
import {
  hasApiKeyGroupsFeatures,
  isAtLeastInOneGroup,
  isOperator,
} from "@/utils/auth-util";
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

export const getValidationSchema = (
  t: TFunction<"translation", undefined>,
  session: Session | null,
) =>
  z.object({
    authorized_cidrs: arrayOfIPv4CidrSchema,
    metadata: z.object({
      cta: z.object({
        text: z.string(),
        url: getOptionalUrlSchema(t),
      }),
      group_id:
        hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED)(session) &&
        isOperator(session) &&
        isAtLeastInOneGroup(session)
          ? z.string().min(1, { message: t("forms.errors.field.required") })
          : z.string().optional(),
    }),
  });

export interface ServiceBuilderStep3Props {
  groups?: readonly Group[];
  mode: CreateUpdateMode;
}

/** Third step of Service create/update process */
export const ServiceBuilderStep3 = ({
  groups,
  mode,
}: ServiceBuilderStep3Props) => {
  const { t } = useTranslation();
  const { getFieldState, resetField, watch } = useFormContext();
  const watchedAuthorizedCidrs = watch("authorized_cidrs");
  const [areAuthorizedCidrsDirty, setAreAuthorizedCidrsDirty] = useState(false);

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
      {isGroupSelectorVisible() && <ServiceGroupSelector groups={groups} />}
      <ServiceExtraConfigurator />
    </>
  );
};
