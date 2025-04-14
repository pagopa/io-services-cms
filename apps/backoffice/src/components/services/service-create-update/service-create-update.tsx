import {
  BuilderStep,
  CreateUpdateMode,
  CreateUpdateProcess,
} from "@/components/create-update-process";
import { useDialog } from "@/components/dialog-provider";
import { getConfiguration } from "@/config";
import { GroupFilterTypeEnum } from "@/generated/api/GroupFilterType";
import { Groups } from "@/generated/api/Groups";
import { ScopeEnum } from "@/generated/api/ServiceBaseMetadata";
import { ServiceTopicList } from "@/generated/api/ServiceTopicList";
import useFetch from "@/hooks/use-fetch";
import { ServiceCreateUpdatePayload } from "@/types/service";
import {
  hasApiKeyGroupsFeatures,
  hasManageKeyGroup,
  isOperator,
} from "@/utils/auth-util";
import {
  trackServiceCreateAbortEvent,
  trackServiceEditAbortEvent,
} from "@/utils/mix-panel";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo } from "react";

import {
  ServiceBuilderStep1,
  getValidationSchema as getVs1,
} from "./service-builder-step-1";
import {
  ServiceBuilderStep2,
  getValidationSchema as getVs2,
} from "./service-builder-step-2";
import {
  ServiceBuilderStep3,
  getValidationSchema as getVs3,
} from "./service-builder-step-3";

const { GROUP_APIKEY_ENABLED } = getConfiguration();

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
  service,
}: ServiceCreateUpdateProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const showDialog = useDialog();

  const { data: topicsData, fetchData: topicsFetchData } =
    useFetch<ServiceTopicList>();
  const { data: groupsData, fetchData: groupsFetchData } = useFetch<Groups>();

  const handleOperatorWithSingleGroup = () =>
    hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED)(session) &&
    isOperator(session) &&
    session?.user?.permissions.selcGroups !== undefined &&
    session.user.permissions.selcGroups.length === 1
      ? session.user.permissions.selcGroups[0]
      : "";

  const serviceDefaultData: ServiceCreateUpdatePayload = useMemo(
    () => ({
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
          url: "",
        },
        custom_special_flow: "",
        group_id: handleOperatorWithSingleGroup(),
        privacy_url: "",
        scope: ScopeEnum.LOCAL,
        token_name: "",
        topic_id: "",
        tos_url: "",
        web_url: "",
      },
      name: "",
      require_secure_channel: false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleCancel = async () => {
    const confirmed = await showDialog({
      message: t("forms.cancel.description"),
      title: t("forms.cancel.title"),
    });
    if (confirmed) {
      console.log("operation cancelled");
      if (mode === "create") {
        trackServiceCreateAbortEvent();
      } else if (mode === "update") {
        trackServiceEditAbortEvent();
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
      validationSchema: getVs1(t),
    },
    {
      content: <ServiceBuilderStep2 />,
      description: "forms.service.steps.step2.description",
      label: "forms.service.steps.step2.label",
      validationSchema: getVs2(t),
    },
    {
      content: <ServiceBuilderStep3 groups={groupsData?.groups} mode={mode} />,
      description: "forms.service.steps.step3.description",
      label: "forms.service.steps.step3.label",
      validationSchema: getVs3(t, session),
    },
  ];

  useEffect(() => {
    topicsFetchData("getServiceTopics", {}, ServiceTopicList);
    if (hasManageKeyGroup(GROUP_APIKEY_ENABLED)(session))
      groupsFetchData(
        "getInstitutionGroups",
        {
          filter: GroupFilterTypeEnum.ALL,
          institutionId: session?.user?.institution.id as string,
        },
        Groups,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CreateUpdateProcess
      confirmButtonLabels={{
        create: "forms.service.buttons.create",
        update: "forms.service.buttons.update",
      }}
      itemToCreateUpdate={service ?? serviceDefaultData}
      mode={mode}
      onCancel={() => handleCancel()}
      onConfirm={(value) => onConfirm(value)}
      steps={serviceBuilderSteps}
    />
  );
};
