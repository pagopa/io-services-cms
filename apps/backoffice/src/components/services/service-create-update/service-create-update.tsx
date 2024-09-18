import {
  BuilderStep,
  CreateUpdateMode,
  CreateUpdateProcess
} from "@/components/create-update-process";
import { useDialog } from "@/components/dialog-provider";
import { ScopeEnum } from "@/generated/api/ServiceBaseMetadata";
import { ServiceTopicList } from "@/generated/api/ServiceTopicList";
import useFetch from "@/hooks/use-fetch";
import { ServiceCreateUpdatePayload } from "@/types/service";
import logToMixpanel from "@/utils/mix-panel";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useEffect } from "react";

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
  authorized_cidrs: [],
  authorized_recipients: [],
  description: "",
  max_allowed_payment_amount: 0,
  metadata: {
    address: "",
    app_android: "",
    app_ios: "",
    assistanceChannels: [{ type: "email", value: "" }],
    category: "",
    cta: {
      text: "",
      url: ""
    },
    custom_special_flow: "",
    privacy_url: "",
    scope: ScopeEnum.LOCAL,
    token_name: "",
    topic_id: "",
    tos_url: "",
    web_url: ""
  },
  name: "",
  require_secure_channel: false
};

export interface ServiceCreateUpdateProps {
  mode: CreateUpdateMode;
  onConfirm: (value: ServiceCreateUpdatePayload) => void;
  service?: ServiceCreateUpdatePayload;
}

/** Service create/update process main component.\
 * Here are defined process steps (`BuilderStep[]`), service default data, and process mode. */
export const ServiceCreateUpdate = ({
  mode,
  onConfirm,
  service
}: ServiceCreateUpdateProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: topicsData, fetchData: topicsFetchData } = useFetch<
    ServiceTopicList
  >();

  const showDialog = useDialog();
  const handleCancel = async () => {
    const confirmed = await showDialog({
      message: t("forms.cancel.description"),
      title: t("forms.cancel.title")
    });
    if (confirmed) {
      console.log("operation cancelled");
      if (mode === "create") {
        logToMixpanel("IO_BO_SERVICE_CREATE_ABORT", {});
      } else if (mode === "update") {
        logToMixpanel("IO_BO_SERVICE_EDIT_ABORT", {});
      }
      router.back();
    } else {
      console.log("modal cancelled");
    }
  };

  const serviceBuilderSteps: BuilderStep[] = [
    {
      content: <ServiceBuilderStep1 topics={topicsData?.topics as any} />,
      description: "forms.service.steps.step1.description",
      label: "forms.service.steps.step1.label",
      moreInfoUrl: "https://docs.pagopa.it/manuale-servizi",
      validationSchema: getVs1(t)
    },
    {
      content: <ServiceBuilderStep2 />,
      description: "forms.service.steps.step2.description",
      label: "forms.service.steps.step2.label",
      validationSchema: getVs2(t)
    },
    {
      content: <ServiceBuilderStep3 />,
      description: "forms.service.steps.step3.description",
      label: "forms.service.steps.step3.label",
      validationSchema: getVs3(t)
    }
  ];

  useEffect(() => {
    topicsFetchData("getServiceTopics", {}, ServiceTopicList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CreateUpdateProcess
      confirmButtonLabels={{
        create: "forms.service.buttons.create",
        update: "forms.service.buttons.update"
      }}
      itemToCreateUpdate={service ?? serviceDefaultData}
      mode={mode}
      onCancel={() => handleCancel()}
      onConfirm={value => onConfirm(value)}
      steps={serviceBuilderSteps}
    />
  );
};
