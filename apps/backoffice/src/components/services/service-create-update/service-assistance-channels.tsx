import {
  SelectController,
  TextFieldController,
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
    formState: { errors, isValid },
  } = useFormContext<{
    metadata: { assistanceChannels: AssistanceChannel[] };
  }>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: "metadata.assistanceChannels",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [errorText, setErrorText] = useState<string>();

  const selectableAssistanceChannels = [
    {
      label: t("forms.service.assistanceChannels.email"),
      value: "email",
    },
    {
      label: t("forms.service.assistanceChannels.pec"),
      value: "pec",
    },
    {
      label: t("forms.service.assistanceChannels.phone"),
      value: "phone",
    },
    {
      label: t("forms.service.assistanceChannels.supportUrl"),
      value: "support_url",
    },
  ];

  const getAvailableAssistanceChannels = () => {
    const presentChannels = fields.map((field) => field.type);
    return selectableAssistanceChannels.filter(
      (item) =>
        presentChannels.indexOf(item.value as AssistanceChannelType) < 0,
    );
  };

  const handleAddChannel = () => {
    append({
      type: getAvailableAssistanceChannels()[0].value as AssistanceChannelType,
      value: "",
    });
  };

  useEffect(() => {
    if (isValid) {
      setErrorText(undefined);
    } else {
      setErrorText(errors.metadata?.assistanceChannels?.message ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, fields]);

  return (
    <Box>
      {fields.map((field, index) => (
        <Grid
          alignItems="flex-start"
          container
          direction="row"
          key={field.id}
          spacing={2}
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
              defaultValue={`metadata.assistanceChannels[${index}].type`}
              items={selectableAssistanceChannels}
              label=""
              name={`metadata.assistanceChannels[${index}].type`}
              placeholder={t("forms.service.assistanceChannels.channelType")}
            />
          </Grid>
          <Grid item xs>
            <TextFieldController
              helperText={
                index === 0 && (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t("forms.service.assistanceChannels.notice"),
                    }}
                  />
                )
              }
              label=""
              name={`metadata.assistanceChannels[${index}].value`}
              placeholder={t("forms.service.assistanceChannels.placeholder")}
            />
          </Grid>
        </Grid>
      ))}
      <Typography color="error" fontSize="14px" fontWeight={600}>
        {errors.metadata?.assistanceChannels?.message}
      </Typography>
      {fields.length < 4 && (
        <Button
          onClick={handleAddChannel}
          startIcon={<AddCircleOutline />}
          sx={{ marginTop: 1 }}
          variant="text"
        >
          {t("forms.service.assistanceChannels.add")}
        </Button>
      )}
    </Box>
  );
};
