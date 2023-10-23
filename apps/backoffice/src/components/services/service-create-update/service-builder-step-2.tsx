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
      type: z.literal("supportUrl"),
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
      requireSecureChannel: z.boolean(),
      metadata: z.object({
        privacyUrl: z.string().url(t("forms.errors.field.url")),
        tosUrl: z.union([
          z.literal(""),
          z
            .string()
            .trim()
            .url(t("forms.errors.field.url"))
        ]),
        assistanceChannels: getAssistanceChannelsSchema(t),
        webUrl: z.union([
          z.literal(""),
          z
            .string()
            .trim()
            .url(t("forms.errors.field.url"))
        ]),
        appAndroid: z.union([
          z.literal(""),
          z
            .string()
            .trim()
            .url(t("forms.errors.field.url"))
        ]),
        appIos: z.union([
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
        schema.requireSecureChannel === false ||
        (schema.requireSecureChannel === true && schema.metadata.tosUrl !== ""),
      {
        message: t("forms.errors.field.privacyCritical"),
        path: ["metadata.tosUrl"]
      }
    );

/** Second step of Service create/update process */
export const ServiceBuilderStep2 = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext();
  const requiredTosUrl = watch("requireSecureChannel");

  return (
    <>
      <FormStepSectionWrapper
        key={0}
        title={t("forms.service.legalInfo")}
        icon={<PrivacyTipIcon />}
      >
        <UrlFieldController
          required
          name="metadata.privacyUrl"
          label={t("forms.service.metadata.privacyUrl.label")}
          placeholder={t("forms.service.metadata.privacyUrl.placeholder")}
        />
        <SwitchController
          name="requireSecureChannel"
          label={t("forms.service.requireSecureChannel.label")}
          helperText={t("forms.service.requireSecureChannel.helperText")}
        />
        {requiredTosUrl ? (
          <UrlFieldController
            required={requiredTosUrl}
            name="metadata.tosUrl"
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
          name="metadata.webUrl"
          label={t("forms.service.metadata.webUrl.label")}
          placeholder={t("forms.service.metadata.webUrl.placeholder")}
        />
        <UrlFieldController
          name="metadata.appAndroid"
          label={t("forms.service.metadata.appAndroid.label")}
          placeholder={t("forms.service.metadata.appAndroid.placeholder")}
        />
        <UrlFieldController
          name="metadata.appIos"
          label={t("forms.service.metadata.appIos.label")}
          placeholder={t("forms.service.metadata.appIos.placeholder")}
        />
      </FormStepSectionWrapper>
    </>
  );
};
