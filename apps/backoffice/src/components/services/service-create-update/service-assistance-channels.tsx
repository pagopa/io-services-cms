import {
  SelectController,
  TextFieldController
} from "@/components/forms/controllers";
import { AssistanceChannel, AssistanceChannelType } from "@/types/service";
import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import { Box, Button, Grid, IconButton, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

/** Configure up to 4 assistance channels for an IO Service */
export const ServiceAssistanceChannels = () => {
  const { t } = useTranslation();
  const {
    control,
    formState: { isValid, errors },
    getFieldState,
    watch
  } = useFormContext<{
    metadata: { assistanceChannels: AssistanceChannel[] };
  }>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "metadata.assistanceChannels"
  });
  const [errorText, setErrorText] = useState<string>();

  const selectableAssistanceChannels = [
    {
      label: t("forms.service.assistanceChannels.email"),
      value: "email"
    },
    {
      label: t("forms.service.assistanceChannels.pec"),
      value: "pec"
    },
    {
      label: t("forms.service.assistanceChannels.phone"),
      value: "phone"
    },
    {
      label: t("forms.service.assistanceChannels.supportUrl"),
      value: "supportUrl"
    }
  ];

  const getAvailableAssistanceChannels = () => {
    const presentChannels = fields.map(field => field.type);
    return selectableAssistanceChannels.filter(
      item => presentChannels.indexOf(item.value as AssistanceChannelType) < 0
    );
  };

  const handleAddChannel = () => {
    append({
      type: getAvailableAssistanceChannels()[0].value as AssistanceChannelType,
      value: ""
    });
  };

  useEffect(() => {
    isValid
      ? setErrorText(undefined)
      : setErrorText(errors.metadata?.assistanceChannels?.message ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, fields]);

  return (
    <Box>
      {fields.map((field, index) => (
        <Grid
          key={field.id}
          container
          spacing={2}
          direction="row"
          alignItems="flex-start"
        >
          {index > 0 && (
            <Grid item width="50px">
              <IconButton
                aria-label="delete"
                onClick={() => remove(index)}
                sx={{ marginTop: 3 }}
              >
                <RemoveCircleOutline color="error" fontSize="inherit" />
              </IconButton>
            </Grid>
          )}
          <Grid item xs={3}>
            <SelectController
              name={`metadata.assistanceChannels[${index}].type`}
              label=""
              placeholder={t("forms.service.assistanceChannels.channelType")}
              defaultValue={`metadata.assistanceChannels[${index}].type`}
              items={selectableAssistanceChannels}
            />
          </Grid>
          <Grid item xs>
            <TextFieldController
              name={`metadata.assistanceChannels[${index}].value`}
              label=""
              placeholder={t("forms.service.assistanceChannels.placeholder")}
              helperText={
                index === 0 && (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t("forms.service.assistanceChannels.notice")
                    }}
                  />
                )
              }
            />
          </Grid>
        </Grid>
      ))}
      <Typography fontSize="14px" color="error" fontWeight={600}>
        {errors.metadata?.assistanceChannels?.message}
      </Typography>
      {fields.length < 4 && (
        <Button
          variant="text"
          startIcon={<AddCircleOutline />}
          onClick={handleAddChannel}
          sx={{ marginTop: 1 }}
        >
          {t("forms.service.assistanceChannels.add")}
        </Button>
      )}
    </Box>
  );
};
