import {
  BuilderStep,
  CreateUpdateProcess,
} from "@/components/create-update-process";
import { useDialog } from "@/components/dialog-provider";
import { BulkPatchServicePayload } from "@/generated/api/BulkPatchServicePayload";
import { GroupFilterTypeEnum } from "@/generated/api/GroupFilterType";
import { Groups } from "@/generated/api/Groups";
import { UnboundedGroupServices } from "@/generated/api/UnboundedGroupServices";
import useFetch from "@/hooks/use-fetch";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";

import {
  AssociateGroupsBuilderStep,
  getValidationSchema as getVs1,
} from "./associate-groups-builder-step";

export interface AssociateGroupToServices {
  groupId: string;
  services: string[];
}

const associateGroupsDefaultData: AssociateGroupToServices = {
  groupId: "",
  services: [],
};

export interface AssociateGroupsCreateUpdateProps {
  onConfirm: (value: BulkPatchServicePayload) => void;
}

/** Associate Groups create/update process main component.\
 * Here are defined process steps (`BuilderStep[]`), default data, and process mode. */
export const AssociateGroupsCreateUpdate = ({
  onConfirm,
}: AssociateGroupsCreateUpdateProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const showDialog = useDialog();

  const { data: groupsData, fetchData: groupsFetchData } = useFetch<Groups>();
  const {
    data: groupUnboundedServicesData,
    fetchData: groupUnboundedServicesFetchData,
  } = useFetch<UnboundedGroupServices>();

  const handleCancel = async () => {
    const confirmed = await showDialog({
      message: t("forms.cancel.description"),
      title: t("forms.cancel.title"),
    });
    if (confirmed) {
      console.log("operation cancelled");
      router.back();
    } else {
      console.log("modal cancelled");
    }
  };

  const associateGroupsBuilderSteps: BuilderStep[] = [
    {
      content: (
        <AssociateGroupsBuilderStep
          groupUnboundedServices={
            groupUnboundedServicesData?.unboundedServices
              ? [...groupUnboundedServicesData.unboundedServices]
              : []
          }
          groups={groupsData ? [...groupsData.groups] : []}
        />
      ),
      description: "forms.groups.associate.step.description",
      label: "forms.groups.associate.step.title",
      validationSchema: getVs1(t),
    },
  ];

  const handleOnConfirm = (value: AssociateGroupToServices) =>
    onConfirm({
      services: value.services.map((serviceId) => ({
        id: serviceId,
        metadata: { group_id: value.groupId as NonEmptyString },
      })),
    });

  useEffect(() => {
    groupsFetchData(
      "getInstitutionGroups",
      {
        filter: GroupFilterTypeEnum.ALL,
        institutionId: session?.user?.institution.id as string,
      },
      Groups,
    );
    groupUnboundedServicesFetchData(
      "getGroupUnboundedServices",
      {},
      UnboundedGroupServices,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CreateUpdateProcess
      confirmButtonLabels={{
        create: "forms.groups.associate.buttons.associate",
        update: "", // update unavailable
      }}
      itemToCreateUpdate={associateGroupsDefaultData}
      mode="create"
      onCancel={() => handleCancel()}
      onConfirm={handleOnConfirm}
      steps={associateGroupsBuilderSteps}
    />
  );
};
