import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { ioTsResolver } from "@hookform/resolvers/io-ts";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { TextFieldArrayController } from "../forms/controllers";
import { LoaderSkeleton } from "../loaders";

export type AuthorizedCidrsProps = {
  /** List of IPs in CIDR format */
  cidrs?: string[];
  /** Event triggered when user click on **Save** button */
  onSaveClick?: (cidrs: string[]) => void;
};

/** Show and Edit an IP List in CIDR format */
export const AuthorizedCidrs = ({
  cidrs,
  onSaveClick
}: AuthorizedCidrsProps) => {
  const { t } = useTranslation();

  const formMethods = useForm({
    defaultValues: { cidrs },
    resolver: ioTsResolver(ManageKeyCIDRs),
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
      <Typography variant="body2" marginTop={1} marginBottom={3}>
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
              variant="filled"
              inputProps={{
                style: {
                  textAlign: "center"
                }
              }}
              sx={{ maxWidth: "185px" }}
              editable
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
