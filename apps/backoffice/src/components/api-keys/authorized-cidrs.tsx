import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";

import { TextFieldArrayController } from "../forms/controllers";
import { arrayOfIPv4CidrSchema } from "../forms/schemas";
import { LoaderSkeleton } from "../loaders";

export interface AuthorizedCidrsProps {
  /** List of IPs in CIDR format */
  cidrs?: string[];
  /** Description text */
  description: string;
  /** Indentify if fields are editable */
  editable?: boolean;
  /** Event triggered when user click on **Save** button */
  onSaveClick?: (cidrs: string[]) => void;
}

// Zod schema validation type for ipV4/cidr
const schema = z.object({
  cidrs: arrayOfIPv4CidrSchema,
});

/** Show and Edit an IP List in CIDR format */
export const AuthorizedCidrs = ({
  cidrs,
  description,
  editable,
  onSaveClick,
}: AuthorizedCidrsProps) => {
  const { t } = useTranslation();

  const formMethods = useForm({
    defaultValues: { cidrs },
    mode: "onChange",
    resolver: zodResolver(schema),
  });
  const { formState, getValues, reset } = formMethods;

  const handleSave = () => {
    if (onSaveClick) {
      onSaveClick(getValues().cidrs ?? []);
      reset({ cidrs: getValues().cidrs });
    }
  };

  const handleCancel = () => {
    reset({ cidrs });
  };

  useEffect(() => {
    reset({ cidrs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cidrs]);

  return (
    <Box
      bgcolor="background.paper"
      borderRadius={0.5}
      id="card-details"
      padding={3}
    >
      <Typography variant="h6">{t("authorizedCidrs.title")}</Typography>
      <Typography
        color="text.secondary"
        marginBottom={3}
        marginTop={1}
        variant="body2"
      >
        {t(description)}
      </Typography>
      <LoaderSkeleton loading={cidrs === undefined} style={{ width: "50%" }}>
        <FormProvider {...formMethods}>
          <Box autoComplete="off" component="form" marginTop={3}>
            <TextFieldArrayController
              addButtonLabel={t("authorizedCidrs.add")}
              addCancelButton={formState.isDirty}
              addDefaultValue=""
              addSaveButton={formState.isDirty && formState.isValid}
              editable={editable}
              inputProps={{
                style: {
                  textAlign: "center",
                },
              }}
              name="cidrs"
              onCancelClick={handleCancel}
              onSaveClick={handleSave}
              readOnly
              showGenericErrorMessage
              size="small"
              sx={{ maxWidth: "185px" }}
            />
          </Box>
        </FormProvider>
      </LoaderSkeleton>
    </Box>
  );
};
