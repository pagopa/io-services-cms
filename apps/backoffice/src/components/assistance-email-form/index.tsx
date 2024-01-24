import { zodResolver } from "@hookform/resolvers/zod";
import { Grid, Typography } from "@mui/material";
import { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";
import { ButtonBack, ButtonNext } from "../buttons";
import { CardBaseContainer } from "../cards/card-base-container";
import { TextFieldController } from "../forms/controllers";

export type AssistanceEmailFormProps = {
  onBack: () => void;
  onComplete: (email: string) => void;
};

const defaultFormValues = {
  email: "",
  confirmEmail: ""
};

const getValidationSchema = (t: TFunction<"translation", undefined>) =>
  z
    .object({
      email: z.string().email(t("forms.errors.field.email")),
      confirmEmail: z.string().email(t("forms.errors.field.email"))
    })
    .refine(
      schema =>
        schema.confirmEmail !== "" && schema.email === schema.confirmEmail,
      {
        message: t("forms.errors.field.confirmEmail"),
        path: ["confirmEmail"]
      }
    );

/**
 * Preparatory form for requesting assistance. \
 * Manages email insertion and confirmation on which to receive assistance. */
export const AssistanceEmailForm = ({
  onBack,
  onComplete
}: AssistanceEmailFormProps) => {
  const { t } = useTranslation();

  const methods = useForm({
    defaultValues: defaultFormValues,
    resolver: zodResolver(getValidationSchema(t)),
    mode: "onChange"
  });

  const {
    getValues,
    formState: { isValid }
  } = methods;

  return (
    <>
      <CardBaseContainer>
        <FormProvider {...methods}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <TextFieldController
                name="email"
                label={t("forms.assistance.email.label")}
                placeholder={t("forms.assistance.email.placeholder")}
                size="small"
                margin="none"
              />
            </Grid>
            <Grid item xs={12}>
              <TextFieldController
                name="confirmEmail"
                label={t("forms.assistance.confirmEmail.label")}
                placeholder={t("forms.assistance.confirmEmail.placeholder")}
                size="small"
                margin="none"
              />
            </Grid>
          </Grid>
        </FormProvider>
      </CardBaseContainer>
      <Typography
        variant="body2"
        color="text.secondary"
        marginTop={2}
        dangerouslySetInnerHTML={{
          __html: t("forms.assistance.disclaimer")
        }}
      ></Typography>
      <Grid container spacing={0} marginY={4}>
        <Grid item xs={6}>
          <ButtonBack onClick={onBack} />
        </Grid>
        <Grid item xs={6} textAlign="right">
          <ButtonNext
            label="buttons.forward"
            onClick={() => onComplete(getValues("email"))}
            disabled={!isValid}
          />
        </Grid>
      </Grid>
    </>
  );
};
