import { FormStepSectionWrapper } from "@/components/forms";
import {
  AutocompleteController,
  SelectController,
  TextFieldController,
} from "@/components/forms/controllers";
import { ScopeEnum } from "@/generated/api/ServiceBaseMetadata";
import { ServiceTopic } from "@/generated/api/ServiceTopic";
import { Preview } from "@mui/icons-material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PaletteIcon from "@mui/icons-material/Palette";
import { Grid } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
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
    description: z
      .string()
      .min(1, { message: t("forms.errors.field.required") })
      .max(1000, { message: t("forms.errors.field.max", { max: 1000 }) }),
    metadata: z.object({
      address: z
        .string()
        .max(100, { message: t("forms.errors.field.max", { max: 100 }) })
        .optional(),
      scope: z.string(),
      topic_id: z.union([
        z.string().min(1, { message: t("forms.errors.field.required") }),
        z.number().min(0, { message: t("forms.errors.field.required") }),
      ]),
    }),
    name: z
      .string()
      .min(1, { message: t("forms.errors.field.required") })
      .max(100, { message: t("forms.errors.field.max", { max: 100 }) }),
  });

export interface ServiceBuilderStep1Props {
  topics?: ServiceTopic[];
}

/** First step of Service create/update process */
export const ServiceBuilderStep1 = ({ topics }: ServiceBuilderStep1Props) => {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const { watch } = useFormContext();
  const watchedName = watch("name");
  const watchedDescription = watch("description");

  const [isPreviewEnabled, setIsPreviewEnabled] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [topicList, setTopicList] = useState<{ id: number; label: string }[]>(
    [],
  );

  useEffect(() => {
    if (
      NonEmptyString.is(watchedName) &&
      NonEmptyString.is(watchedDescription)
    ) {
      setIsPreviewEnabled(true);
    } else {
      setIsPreviewEnabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedName, watchedDescription]);

  useEffect(() => {
    if (topics) {
      setTopicList(topics.map((item) => ({ id: item.id, label: item.name })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics]);

  return (
    <>
      <FormStepSectionWrapper
        icon={<MenuBookIcon />}
        key={0}
        title={t("forms.service.description.label")}
      >
        <TextFieldController
          helperText={
            <span
              dangerouslySetInnerHTML={{
                __html: t("forms.service.name.helperText"),
              }}
            />
          }
          label={t("forms.service.name.label")}
          name="name"
          placeholder={t("forms.service.name.placeholder")}
          required
        />
        <Grid
          alignItems="flex-start"
          container
          justifyContent="center"
          spacing={2}
        >
          <Grid item xs>
            <TextFieldController
              helperText={
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("forms.service.description.helperText"),
                  }}
                />
              }
              label={t("forms.service.description.label")}
              multiline
              name="description"
              placeholder={t("forms.service.description.placeholder")}
              required
              rows={7}
            />
          </Grid>
          <Grid item xs="auto">
            <ButtonNaked
              color="primary"
              disabled={!isPreviewEnabled}
              onClick={() => setIsPreviewOpen(true)}
              size="medium"
              startIcon={<Preview />}
              sx={{ fontWeight: 700, marginTop: 3 }}
            >
              {t("service.preview.button")}
            </ButtonNaked>
          </Grid>
        </Grid>
      </FormStepSectionWrapper>
      <FormStepSectionWrapper
        icon={<PaletteIcon />}
        key={2}
        title={t("forms.service.attributes")}
      >
        <Grid columnSpacing={2} container>
          <Grid item xs={6}>
            <SelectController
              helperText={
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("forms.service.metadata.scope.helperText"),
                  }}
                />
              }
              items={[
                {
                  label: t("forms.service.metadata.scope.national"),
                  value: ScopeEnum.NATIONAL,
                },
                {
                  label: t("forms.service.metadata.scope.local"),
                  value: ScopeEnum.LOCAL,
                },
              ]}
              label={t("forms.service.metadata.scope.label")}
              name="metadata.scope"
              placeholder={t("forms.service.metadata.scope.placeholder")}
            />
          </Grid>
          <Grid item xs={6}>
            {/*
             // TODO should be developed in the next MVPs
             <TextFieldController
              name="metadata.localScope"
              label="Aree locali di competenza"
              placeholder="Inserisci aree locali"
              disabled
            /> */}
          </Grid>
          <Grid item xs={6}>
            <AutocompleteController
              helperText={
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("forms.service.metadata.topic.helperText"),
                  }}
                />
              }
              items={topicList}
              label={t("forms.service.metadata.topic.label")}
              name="metadata.topic_id"
              placeholder={t("forms.service.metadata.topic.placeholder")}
            />
          </Grid>
        </Grid>
        <TextFieldController
          helperText={
            <span
              dangerouslySetInnerHTML={{
                __html: t("forms.service.metadata.address.helperText"),
              }}
            />
          }
          label={t("forms.service.metadata.address.label")}
          name="metadata.address"
          placeholder={t("forms.service.metadata.address.placeholder")}
        />
        {/* 
        // TODO should be developed in the next MVPs
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
        /> */}
      </FormStepSectionWrapper>
      <ServicePreview
        description={watchedDescription}
        institutionName={session?.user?.institution.name}
        isOpen={isPreviewOpen}
        name={watchedName}
        onChange={setIsPreviewOpen}
      />
    </>
  );
};
