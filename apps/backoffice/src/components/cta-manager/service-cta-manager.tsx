import { Banner } from "@/components/banner";
import { FormStepSectionWrapper } from "@/components/forms";
import {
  SelectController,
  TextFieldController,
  UrlFieldController,
} from "@/components/forms/controllers";
import { Link, ReportProblemRounded } from "@mui/icons-material";
import { Box, Divider, Grid } from "@mui/material";
import { useTranslation } from "next-i18next";
import React from "react";
import { useFormContext } from "react-hook-form";

import CtaControlsButtons from "./cta-controls-buttons";

export const ServiceCtaManager: React.FC = () => {
  const { t } = useTranslation();
  const { clearErrors, setValue, watch } = useFormContext();

  const hasCta2UrlPrefix = watch("metadata.cta.cta_2.urlPrefix");
  const initialStateBtn = hasCta2UrlPrefix !== "" ? true : false;
  const selectItems = [
    {
      label: t("forms.service.extraConfig.cta.form.externalLink"),
      value: "iohandledlink://",
    },
    {
      label: t("forms.service.extraConfig.cta.form.singleSignOn"),
      value: "iosso://",
    },
    {
      label: t("forms.service.extraConfig.cta.form.internalLink"),
      value: "ioit://",
    },
  ];

  const linkCtaType = ["iohandledlink://", "iosso://", "ioit://"];

  const renderCtaSection = (slot: "cta_1" | "cta_2") => {
    //let us observe the value of the select stored referring to the current slot
    const kind = watch(`metadata.cta.${slot}.urlPrefix`);

    const helperCtaInternal =
      kind === linkCtaType[2] ? (
        <span
          dangerouslySetInnerHTML={{
            __html: t("forms.service.metadata.cta.text.helperText"),
          }}
        />
      ) : undefined;

    const labelCtaInternal =
      kind === linkCtaType[2]
        ? t("forms.service.metadata.cta.url.labelInternal")
        : t("forms.service.metadata.cta.url.label");

    return (
      <>
        <Grid columnSpacing={2} container rowSpacing={1}>
          <Grid item md={6} xs={12}>
            <SelectController
              displayEmpty
              helperText={helperCtaInternal}
              items={selectItems}
              label={t("forms.service.extraConfig.cta.form.selectLabel")}
              name={`metadata.cta.${slot}.urlPrefix`}
            />
          </Grid>

          <Grid item md={6} xs={12} />

          {kind === linkCtaType[1] && (
            <Grid item xs={12}>
              <Banner
                description={t(
                  "forms.service.extraConfig.cta.form.btnWithLink.alertSingleSignOn",
                )}
                icon={<ReportProblemRounded />}
                severity="warning"
              />
            </Grid>
          )}

          <Grid item md={6} xs={12}>
            <TextFieldController
              label={t("forms.service.metadata.cta.text.label")}
              name={`metadata.cta.${slot}.text`}
              placeholder={t("forms.service.metadata.cta.text.placeholder")}
            />
          </Grid>

          <Grid item md={6} xs={12}>
            <UrlFieldController
              hideCheckUrl={kind === linkCtaType[0] ? false : true}
              label={labelCtaInternal}
              name={`metadata.cta.${slot}.url`}
              placeholder={t("forms.service.metadata.cta.url.placeholder")}
            />
          </Grid>
          {
            <CtaControlsButtons
              addLabel={t("forms.service.extraConfig.cta.addSecondaryButton")}
              initialStateRemove={initialStateBtn}
              onAdd={addSecondary}
              onRemove={removeSecondary}
              removeLabel={t(
                "forms.service.extraConfig.cta.removeSecondaryButton",
              )}
              show={slot === "cta_1" && hasCta2UrlPrefix !== "" ? false : true}
            />
          }
        </Grid>
      </>
    );
  };

  const addSecondary = () => {
    setValue(
      "metadata.cta.cta_2",
      {
        text: "",
        url: "",
        urlPrefix: "iohandledlink://",
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const removeSecondary = () => {
    setValue("metadata.cta.cta_2.urlPrefix", "");
    setValue("metadata.cta.cta_2.text", "");
    setValue("metadata.cta.cta_2.url", "");
    clearErrors(["metadata.cta.cta_2"]);
  };
  return (
    <Box>
      <FormStepSectionWrapper
        description={t("forms.service.extraConfig.cta.description")}
        icon={<Link />}
        markDownDescription={true}
        title={t("forms.service.extraConfig.cta.label")}
      >
        {renderCtaSection("cta_1")}
        {hasCta2UrlPrefix !== "" ? (
          <Box mt={2}>
            <Divider />
            {renderCtaSection("cta_2")}
          </Box>
        ) : null}
      </FormStepSectionWrapper>
    </Box>
  );
};

export default ServiceCtaManager;
