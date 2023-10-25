import { FormStepSectionWrapper } from "@/components/forms";
import {
  SelectController,
  TextFieldController
} from "@/components/forms/controllers";
import { ScopeEnum } from "@/generated/api/ServiceMetadata";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PaletteIcon from "@mui/icons-material/Palette";
import { Button, Grid } from "@mui/material";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { TFunction } from "i18next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import * as z from "zod";
import { ServicePreview } from "..";

export const getValidationSchema = (t: TFunction<"translation", undefined>) =>
  z.object({
    name: z
      .string()
      .min(1, { message: t("forms.errors.field.required") })
      .max(100, { message: t("forms.errors.field.max", { max: 100 }) }),
    description: z
      .string()
      .min(1, { message: t("forms.errors.field.required") })
      .max(1000, { message: t("forms.errors.field.max", { max: 1000 }) }),
    metadata: z.object({
      scope: z.string(),
      address: z
        .string()
        .max(100, { message: t("forms.errors.field.max", { max: 100 }) })
        .optional()
    })
  });

/** First step of Service create/update process */
export const ServiceBuilderStep1 = () => {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const { watch } = useFormContext();
  const watchedName = watch("name");
  const watchedDescription = watch("description");

  const [isPreviewEnabled, setIsPreviewEnabled] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    NonEmptyString.is(watchedName) && NonEmptyString.is(watchedDescription)
      ? setIsPreviewEnabled(true)
      : setIsPreviewEnabled(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedName, watchedDescription]);

  return (
    <>
      <FormStepSectionWrapper
        key={0}
        title={t("forms.service.description.label")}
        icon={<MenuBookIcon />}
      >
        <TextFieldController
          required
          name="name"
          label={t("forms.service.name.label")}
          placeholder={t("forms.service.name.placeholder")}
          helperText={
            <span
              dangerouslySetInnerHTML={{
                __html: t("forms.service.name.helperText")
              }}
            />
          }
        />
        <Grid container spacing={2} justifyContent="center" alignItems="center">
          <Grid item xs>
            <TextFieldController
              required
              name="description"
              label={t("forms.service.description.label")}
              placeholder={t("forms.service.description.placeholder")}
              helperText={
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("forms.service.description.helperText")
                  }}
                />
              }
              multiline
              rows={7}
            />
          </Grid>
          <Grid item xs="auto">
            <Button
              size="small"
              variant="text"
              disabled={!isPreviewEnabled}
              onClick={() => setIsPreviewOpen(true)}
            >
              {t("service.preview.button")}
            </Button>
          </Grid>
        </Grid>
      </FormStepSectionWrapper>
      <FormStepSectionWrapper
        key={2}
        title={t("forms.service.attributes")}
        icon={<PaletteIcon />}
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <SelectController
              name="metadata.scope"
              label={t("forms.service.metadata.scope.label")}
              placeholder={t("forms.service.metadata.scope.placeholder")}
              items={[
                {
                  label: t("forms.service.metadata.scope.national"),
                  value: ScopeEnum.NATIONAL
                },
                {
                  label: t("forms.service.metadata.scope.local"),
                  value: ScopeEnum.LOCAL
                }
              ]}
              helperText={
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("forms.service.metadata.scope.helperText")
                  }}
                />
              }
            />
          </Grid>
          <Grid item xs={6}>
            <TextFieldController
              name="metadata.localScope"
              label="Aree locali di competenza"
              placeholder="Inserisci aree locali"
              disabled
            />
          </Grid>
        </Grid>
        <TextFieldController
          name="metadata.address"
          label={t("forms.service.metadata.address.label")}
          placeholder={t("forms.service.metadata.address.placeholder")}
          helperText={
            <span
              dangerouslySetInnerHTML={{
                __html: t("forms.service.metadata.address.helperText")
              }}
            />
          }
        />
        <TextFieldController
          name="topic"
          label="Argomento del servizio"
          placeholder=""
          helperText={
            <span
              dangerouslySetInnerHTML={{
                __html: "Qual è l'argomento del servizio?"
              }}
            />
          }
          disabled
        />
        <TextFieldController
          name="functionalities"
          label="Funzionalità del servizio"
          placeholder=""
          helperText={
            <span
              dangerouslySetInnerHTML={{
                __html: "Cosa può fare questo servizio?"
              }}
            />
          }
          disabled
        />
      </FormStepSectionWrapper>
      <ServicePreview
        isOpen={isPreviewOpen}
        name={watchedName}
        institutionName={session?.user?.institution.name}
        description={watchedDescription}
        onChange={setIsPreviewOpen}
      />
    </>
  );
};
