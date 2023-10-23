import {
  BuilderStep,
  CreateUpdateMode,
  CreateUpdateProcess
} from "@/components/create-update-process";
import { useDialog } from "@/components/dialog-provider";
import { ScopeEnum } from "@/generated/api/ServiceMetadata";
import { ServicePayload } from "@/types/service";
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

const serviceDefaultData: ServicePayload = {
  name: "",
  description: "",
  organization: {
    name: "",
    fiscalCode: "",
    departmentName: ""
  },
  requireSecureChannel: false,
  authorizedCidrs: [],
  authorizedRecipients: [],
  maxAllowedPaymentAmount: 0,
  metadata: {
    webUrl: "",
    appIos: "",
    appAndroid: "",
    tosUrl: "",
    privacyUrl: "",
    address: "",
    assistanceChannels: [{ type: "email", value: "" }],
    cta: {
      text: "",
      url: ""
    },
    tokenName: "",
    category: "",
    customSpecialFlow: "",
    scope: ScopeEnum.LOCAL
  }
};

export type ServiceCreateUpdateProps = {
  mode: CreateUpdateMode;
  service?: ServicePayload;
  onConfirm: (value: ServicePayload) => void;
};

/** Service create/update process main component.\
 * Here are defined process steps (`BuilderStep[]`), service default data, and process mode. */
export const ServiceCreateUpdate = ({
  mode,
  service: serviceData,
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
      itemToCreateUpdate={serviceData ? serviceData : serviceDefaultData}
      mode={mode}
      steps={serviceBuilderSteps}
      onCancel={() => handleCancel()}
      onConfirm={value => onConfirm(value as ServicePayload)}
    />
  );
};
