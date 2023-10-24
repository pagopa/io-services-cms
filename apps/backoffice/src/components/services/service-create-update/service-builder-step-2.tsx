import { FormStepSectionWrapper } from "@/components/forms";
import {
  SwitchController,
  UrlFieldController
} from "@/components/forms/controllers";
import { AssistanceChannelType } from "@/types/service";
import LinkIcon from "@mui/icons-material/Link";
import MobileScreenShareIcon from "@mui/icons-material/MobileScreenShare";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import * as z from "zod";
import { ServiceAssistanceChannels } from "./service-assistance-channels";

const regexPhone: RegExp = /^(?:(?:\+|00)39?)?[ ]?(?:\d{2})?[ ]?(?:3[\d]|[89]\d{1})[ ]?\/?[ ]?\d{6,8}$/;

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
      value: z.string().url(t("forms.errors.field.url"))
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
        privacy_url: z.string().url(t("forms.errors.field.url")),
        tos_url: z.union([
          z.literal(""),
          z
            .string()
            .trim()
            .url(t("forms.errors.field.url"))
        ]),
        assistanceChannels: getAssistanceChannelsSchema(t),
        web_url: z.union([
          z.literal(""),
          z
            .string()
            .trim()
            .url(t("forms.errors.field.url"))
        ]),
        app_android: z.union([
          z.literal(""),
          z
            .string()
            .trim()
            .url(t("forms.errors.field.url"))
        ]),
        app_ios: z.union([
          z.literal(""),
          z
            .string()
            .trim()
            .url(t("forms.errors.field.url"))
        ])
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
        icon={<LinkIcon />}
      >
        <ServiceAssistanceChannels />
      </FormStepSectionWrapper>
      <FormStepSectionWrapper
        key={2}
        title={t("forms.service.otherChannels")}
        icon={<MobileScreenShareIcon />}
      >
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
