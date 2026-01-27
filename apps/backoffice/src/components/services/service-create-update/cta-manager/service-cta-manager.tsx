import { Banner } from "@/components/banner";
import ButtonAddRemove from "@/components/buttons/button-add-remove";
import { FormStepSectionWrapper } from "@/components/forms";
import {
  SelectController,
  TextFieldController,
  UrlFieldController,
} from "@/components/forms/controllers";
import { Link } from "@mui/icons-material";
import { Box, Divider, Grid } from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { CTA_KIND_SELECT_ITEMS, CTA_PREFIX_URL_SCHEMES } from "./constants";

export const ServiceCtaManager: React.FC = () => {
  const { t } = useTranslation();
  const { setValue, trigger, watch } = useFormContext();

  const isCta2Visible = watch("metadata.cta.cta_2.enabled");
  const selectItems = CTA_KIND_SELECT_ITEMS(t);

  const renderCtaSection = (slot: "cta_1" | "cta_2") => {
    // watch the value of the select stored referring to the current slot
    const kind = watch(`metadata.cta.${slot}.urlPrefix`);
    console.log("kind", kind);

    return (
      <>
        <Grid columnSpacing={2} container rowSpacing={1}>
          <Grid item md={6} xs={12}>
            <SelectController
              items={selectItems}
              label={t("forms.service.extraConfig.cta.form.selectLabel")}
              name={`metadata.cta.${slot}.urlPrefix`}
            />
          </Grid>

          <Grid item md={6} xs={12} />

          {kind === CTA_PREFIX_URL_SCHEMES.SSO && (
            <Grid item xs={12}>
              <Banner
                description={t(
                  "forms.service.extraConfig.cta.form.btnWithLink.alertSingleSignOn",
                )}
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
              hideCheckUrl={kind !== CTA_PREFIX_URL_SCHEMES.EXTERNAL}
              label={
                kind === CTA_PREFIX_URL_SCHEMES.INTERNAL
                  ? t("forms.service.metadata.cta.url.labelInternal")
                  : t("forms.service.metadata.cta.url.label")
              }
              name={`metadata.cta.${slot}.url`}
              placeholder={t("forms.service.metadata.cta.url.placeholder")}
            />
          </Grid>
        </Grid>
      </>
    );
  };

  const addSecondaryCta = () => setValue("metadata.cta.cta_2.enabled", true);
  const removeSecondaryCta = () => {
    setValue("metadata.cta.cta_2", {
      enabled: false,
      text: "",
      url: "",
      urlPrefix: CTA_PREFIX_URL_SCHEMES.EXTERNAL,
    });
    trigger("metadata.cta");
  };

  useEffect(() => {
    // Ensure at least cta_1 is enabled on mount
    setValue("metadata.cta.cta_1.enabled", true);
    trigger("metadata.cta.cta_1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue]);

  return (
    <Box>
      <FormStepSectionWrapper
        description={t("forms.service.extraConfig.cta.description")}
        icon={<Link />}
        title={t("forms.service.extraConfig.cta.label")}
      >
        {renderCtaSection("cta_1")}
        {isCta2Visible ? (
          <Box mt={2}>
            <Divider />
            <Box mt={1}>{renderCtaSection("cta_2")}</Box>
          </Box>
        ) : null}
        <ButtonAddRemove
          addLabel={t("forms.service.extraConfig.cta.addSecondaryButton")}
          kind={isCta2Visible ? "remove" : "add"}
          onAdd={addSecondaryCta}
          onRemove={removeSecondaryCta}
          removeLabel={t("forms.service.extraConfig.cta.removeSecondaryButton")}
        />
      </FormStepSectionWrapper>
    </Box>
  );
};

export default ServiceCtaManager;
