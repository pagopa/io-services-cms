import {
  BuilderStep,
  CreateUpdateMode,
  CreateUpdateProcess
} from "@/components/create-update-process";
import { useDialog } from "@/components/dialog-provider";
import { ScopeEnum } from "@/generated/api/ServiceMetadata";
import { ServiceCreateUpdatePayload } from "@/types/service";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import {
  ServiceBuilderStep1,
  getValidationSchema as getVs1
} from "./service-builder-step-1";
import {
  ServiceBuilderStep2,
  getValidationSchema as getVs2
} from "./service-builder-step-2";
import {
  ServiceBuilderStep3,
  getValidationSchema as getVs3
} from "./service-builder-step-3";

const serviceDefaultData: ServiceCreateUpdatePayload = {
  name: "",
  description: "",
  require_secure_channel: false,
  authorized_cidrs: [],
  authorized_recipients: [],
  max_allowed_payment_amount: 0,
  metadata: {
    web_url: "",
    app_ios: "",
    app_android: "",
    tos_url: "",
    privacy_url: "",
    address: "",
    assistanceChannels: [{ type: "email", value: "" }],
    cta: {
      text: "",
      url: ""
    },
    token_name: "",
    category: "",
    custom_special_flow: "",
    scope: ScopeEnum.LOCAL
  }
};

export type ServiceCreateUpdateProps = {
  mode: CreateUpdateMode;
  service?: ServiceCreateUpdatePayload;
  onConfirm: (value: ServiceCreateUpdatePayload) => void;
};

/** Service create/update process main component.\
 * Here are defined process steps (`BuilderStep[]`), service default data, and process mode. */
export const ServiceCreateUpdate = ({
  mode,
  service,
  onConfirm
}: ServiceCreateUpdateProps) => {
  const { t } = useTranslation();
  const router = useRouter();

  const showDialog = useDialog();
  const handleCancel = async () => {
    const confirmed = await showDialog({
      title: t("forms.cancel.title"),
      message: t("forms.cancel.description")
    });
    if (confirmed) {
      console.log("operation cancelled");
      router.back();
    } else {
      console.log("modal cancelled");
    }
  };

  const serviceBuilderSteps: BuilderStep[] = [
    {
      label: "forms.service.steps.step1.label",
      description: "forms.service.steps.step1.description",
      moreInfoUrl: "https://docs.pagopa.it/manuale-servizi",
      validationSchema: getVs1(t),
      content: <ServiceBuilderStep1 />
    },
    {
      label: "forms.service.steps.step2.label",
      description: "forms.service.steps.step2.description",
      validationSchema: getVs2(t),
      content: <ServiceBuilderStep2 />
    },
    {
      label: "forms.service.steps.step3.label",
      description: "forms.service.steps.step3.description",
      validationSchema: getVs3(t),
      content: <ServiceBuilderStep3 />
    }
  ];

  return (
    <CreateUpdateProcess
      itemToCreateUpdate={service ?? serviceDefaultData}
      mode={mode}
      steps={serviceBuilderSteps}
      onCancel={() => handleCancel()}
      onConfirm={value => onConfirm(value)}
    />
  );
};
