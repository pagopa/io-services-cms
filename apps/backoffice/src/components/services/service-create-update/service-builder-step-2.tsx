import { FormStepSectionWrapper } from "@/components/forms";
import {
  SwitchController,
  UrlFieldController
} from "@/components/forms/controllers";
import { getOptionalUrlSchema, getUrlSchema } from "@/components/forms/schemas";
import { AssistanceChannelType } from "@/types/service";
import { SupportAgent } from "@mui/icons-material";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import * as z from "zod";
import { ServiceAssistanceChannels } from "./service-assistance-channels";

const regexPhone = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-/]?[\s]?[0-9])+$/
);

const getSingleAssistanceChannelSchema = (
  t: TFunction<"translation", undefined>
) =>
  z.union([
    z.object({
      type: z.literal("email"),
      value: z.string().email(t("forms.errors.field.email"))
    }),
    z.object({
      type: z.literal("pec"),
      value: z.string().email(t("forms.errors.field.email"))
    }),
    z.object({
      type: z.literal("phone"),
      value: z.string().regex(regexPhone, t("forms.errors.field.phone"))
    }),
    z.object({
      type: z.literal("support_url"),
      value: getUrlSchema(t)
    })
  ]);

const getAssistanceChannelsSchema = (t: TFunction<"translation", undefined>) =>
  z
    .array(getSingleAssistanceChannelSchema(t))
    .min(1)
    .refine(
      values => {
        const types = new Set<AssistanceChannelType>();
        for (const item of values) {
          if (types.has(item.type)) {
            return false;
          }
          types.add(item.type);
        }
        return true;
      },
      {
        message: t("forms.errors.field.assistanceChannels")
      }
    );

export const getValidationSchema = (t: TFunction<"translation", undefined>) =>
  z
    .object({
      require_secure_channel: z.boolean(),
      metadata: z.object({
        privacy_url: getUrlSchema(t),
        tos_url: getOptionalUrlSchema(t),
        assistanceChannels: getAssistanceChannelsSchema(t),
        web_url: getOptionalUrlSchema(t),
        app_android: getOptionalUrlSchema(t),
        app_ios: getOptionalUrlSchema(t)
      })
    })
    .refine(
      schema =>
        schema.require_secure_channel === false ||
        (schema.require_secure_channel === true &&
          schema.metadata.tos_url !== ""),
      {
        message: t("forms.errors.field.privacyCritical"),
        path: ["metadata.tos_url"]
      }
    );

/** Second step of Service create/update process */
export const ServiceBuilderStep2 = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext();
  const requiredTosUrl = watch("require_secure_channel");

  return (
    <>
      <FormStepSectionWrapper
        key={0}
        title={t("forms.service.legalInfo")}
        icon={<PrivacyTipIcon />}
      >
        <UrlFieldController
          required
          name="metadata.privacy_url"
          label={t("forms.service.metadata.privacyUrl.label")}
          placeholder={t("forms.service.metadata.privacyUrl.placeholder")}
        />
        <SwitchController
          name="require_secure_channel"
          label={t("forms.service.requireSecureChannel.label")}
          helperText={t("forms.service.requireSecureChannel.helperText")}
        />
        {requiredTosUrl ? (
          <UrlFieldController
            required={requiredTosUrl}
            name="metadata.tos_url"
            label={t("forms.service.metadata.tosUrl.label")}
            placeholder={t("forms.service.metadata.tosUrl.placeholder")}
          />
        ) : null}
      </FormStepSectionWrapper>
      <FormStepSectionWrapper
        key={1}
        title={t("forms.service.assistanceChannels.label")}
        icon={<SupportAgent />}
      >
        <ServiceAssistanceChannels />
      </FormStepSectionWrapper>
      <FormStepSectionWrapper key={2} title={t("forms.service.otherChannels")}>
        <UrlFieldController
          name="metadata.web_url"
          label={t("forms.service.metadata.webUrl.label")}
          placeholder={t("forms.service.metadata.webUrl.placeholder")}
        />
        <UrlFieldController
          name="metadata.app_android"
          label={t("forms.service.metadata.appAndroid.label")}
          placeholder={t("forms.service.metadata.appAndroid.placeholder")}
        />
        <UrlFieldController
          name="metadata.app_ios"
          label={t("forms.service.metadata.appIos.label")}
          placeholder={t("forms.service.metadata.appIos.placeholder")}
        />
      </FormStepSectionWrapper>
    </>
  );
};
