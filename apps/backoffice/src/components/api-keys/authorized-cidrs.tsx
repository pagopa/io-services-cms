import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";
import { TextFieldArrayController } from "../forms/controllers";
import { LoaderSkeleton } from "../loaders";
import { arrayOfIPv4CidrSchema } from "../forms/schemas";

export type AuthorizedCidrsProps = {
  /** List of IPs in CIDR format */
  cidrs?: string[];
  /** Indentify if fields are editable */
  editable?: boolean;
  /** Event triggered when user click on **Save** button */
  onSaveClick?: (cidrs: string[]) => void;
};

// Zod schema validation type for ipV4/cidr
const schema = z.object({
  cidrs: arrayOfIPv4CidrSchema
});

/** Show and Edit an IP List in CIDR format */
export const AuthorizedCidrs = ({
  cidrs,
  editable,
  onSaveClick
}: AuthorizedCidrsProps) => {
  const { t } = useTranslation();

  const formMethods = useForm({
    defaultValues: { cidrs },
    resolver: zodResolver(schema),
    mode: "onChange"
  });
  const { getValues, formState, reset } = formMethods;

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
      id="card-details"
      padding={3}
      borderRadius={0.5}
    >
      <Typography variant="h6">{t("authorizedCidrs.title")}</Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        marginTop={1}
        marginBottom={3}
      >
        {t("authorizedCidrs.description")}
      </Typography>
      <LoaderSkeleton loading={cidrs === undefined} style={{ width: "50%" }}>
        <FormProvider {...formMethods}>
          <Box marginTop={3} component="form" autoComplete="off">
            <TextFieldArrayController
              name="cidrs"
              addButtonLabel={t("authorizedCidrs.add")}
              addDefaultValue=""
              size="small"
              inputProps={{
                style: {
                  textAlign: "center"
                }
              }}
              sx={{ maxWidth: "185px" }}
              editable={editable}
              readOnly
              addSaveButton={formState.isDirty && formState.isValid}
              onSaveClick={handleSave}
              addCancelButton={formState.isDirty}
              onCancelClick={handleCancel}
              showGenericErrorMessage
            />
          </Box>
        </FormProvider>
      </LoaderSkeleton>
    </Box>
  );
};
