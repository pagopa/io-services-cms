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

import ButtonAddRemove from "../buttons/button-add-remove";
import { SELECT_ITEMS, URL_SCHEMES } from "./constants";

export const ServiceCtaManager: React.FC = () => {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext();

  const hasCta2UrlPrefix = watch("metadata.cta.cta_2.urlPrefix");
  const initialStateButtonRemove = hasCta2UrlPrefix !== "" ? true : false;
  const selectItems = SELECT_ITEMS(t);

  const renderCtaSection = (slot: "cta_1" | "cta_2") => {
    //let us observe the value of the select stored referring to the current slot
    const kind = watch(`metadata.cta.${slot}.urlPrefix`);
    const showAddRemove = !(initialStateButtonRemove && slot === "cta_1");

    const helperCtaInternal =
      kind === URL_SCHEMES.INTERNAL ? (
        <span
          dangerouslySetInnerHTML={{
            __html: t("forms.service.metadata.cta.text.helperText"),
          }}
        />
      ) : undefined;

    const labelCtaInternal =
      kind === URL_SCHEMES.INTERNAL
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

          {kind === URL_SCHEMES.SSO && (
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
              hideCheckUrl={kind === URL_SCHEMES.HANDLED_LINK ? false : true}
              label={labelCtaInternal}
              name={`metadata.cta.${slot}.url`}
              placeholder={t("forms.service.metadata.cta.url.placeholder")}
            />
          </Grid>
          {showAddRemove && (
            <ButtonAddRemove
              addLabel={t("forms.service.extraConfig.cta.addSecondaryButton")}
              isRemoveActionVisible={initialStateButtonRemove}
              onAdd={addSecondaryCta}
              onRemove={removeSecondaryCta}
              removeLabel={t(
                "forms.service.extraConfig.cta.removeSecondaryButton",
              )}
            />
          )}
        </Grid>
      </>
    );
  };

  const configureSecondaryCta = (enable: boolean) => {
    setValue(
      "metadata.cta.cta_2",
      { text: "", url: "", urlPrefix: enable ? URL_SCHEMES.HANDLED_LINK : "" },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const addSecondaryCta = () => configureSecondaryCta(true);
  const removeSecondaryCta = () => configureSecondaryCta(false);

  return (
    <Box>
      <FormStepSectionWrapper
        description={t("forms.service.extraConfig.cta.description")}
        icon={<Link />}
        title={t("forms.service.extraConfig.cta.label")}
      >
        {renderCtaSection("cta_1")}
        {hasCta2UrlPrefix !== "" ? (
          <Box mt={2}>
            <Divider />
            <Box mt={1}>{renderCtaSection("cta_2")}</Box>
          </Box>
        ) : null}
      </FormStepSectionWrapper>
    </Box>
  );
};

export default ServiceCtaManager;
