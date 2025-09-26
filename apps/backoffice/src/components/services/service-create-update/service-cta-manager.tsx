import { Banner } from "@/components/banner";
import { FormStepSectionWrapper } from "@/components/forms";
import {
  SelectController,
  TextFieldController,
  UrlFieldController,
} from "@/components/forms/controllers";
import { Link, ReportProblemRounded } from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import { useTranslation } from "next-i18next";
// service-cta-manager.tsx
import React from "react";
import { useFormContext } from "react-hook-form";

import CtaControlsButtons from "./cta-controls-buttons";

export const ServiceCtaManager: React.FC = () => {
  const { t } = useTranslation();
  const { clearErrors, setValue, watch } = useFormContext();

  const hasCta2Field = watch("metadata.cta.cta_2.preUrl");
  const initialStateBtn = hasCta2Field !== "" ? true : false;
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

  const linkCtype = ["iohandledlink://", "iosso://", "ioit://"];

  const renderCtaSection = (slot: "cta_1" | "cta_2") => {
    const kind = watch(`metadata.cta.${slot}.preUrl`);

    const helperCtaInternal =
      kind === linkCtype[2] ? (
        <span
          dangerouslySetInnerHTML={{
            __html: t("forms.service.metadata.cta.text.helperText"),
          }}
        />
      ) : undefined;

    const labelCtaInternal =
      kind === linkCtype[2]
        ? t("forms.service.metadata.cta.url.labelInternal")
        : t("forms.service.metadata.cta.url.label");

    return (
      <FormStepSectionWrapper
        description={t("forms.service.extraConfig.cta.description")}
        icon={<Link />}
        title={t("forms.service.extraConfig.cta.label")}
      >
        <Grid columnSpacing={2} container rowSpacing={1}>
          <Grid item md={6} xs={12}>
            <SelectController
              displayEmpty
              helperText={helperCtaInternal}
              items={selectItems}
              label={t("forms.service.extraConfig.cta.form.selectLabel")}
              name={`metadata.cta.${slot}.preUrl`}
            />
          </Grid>

          <Grid item md={6} xs={12} />

          {kind === linkCtype[1] && (
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
              hideCheckUrl={kind === linkCtype[0] ? false : true}
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
              show={slot === "cta_1" && hasCta2Field !== "" ? false : true}
            />
          }
        </Grid>
      </FormStepSectionWrapper>
    );
  };

  const addSecondary = () => {
    setValue(
      "metadata.cta.cta_2",
      {
        preUrl: "iohandledlink://",
        text: "",
        url: "",
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const removeSecondary = () => {
    setValue("metadata.cta.cta_2.preUrl", "");
    setValue("metadata.cta.cta_2.text", "");
    setValue("metadata.cta.cta_2.url", "");
    clearErrors(["metadata.cta.cta_2"]);
  };
  return (
    <Box>
      {" "}
      {renderCtaSection("cta_1")}
      {hasCta2Field !== "" ? (
        <Box mt={2}>{renderCtaSection("cta_2")}</Box>
      ) : null}
    </Box>
  );
};

export default ServiceCtaManager;
