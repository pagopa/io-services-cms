import { DialogBaseView } from "@/components/dialog-provider";
import {
  SelectController,
  TextFieldController,
} from "@/components/forms/controllers";
import { GroupFilterTypeEnum } from "@/generated/api/GroupFilterType";
import { Groups } from "@/generated/api/Groups";
import useFetch from "@/hooks/use-fetch";
import {
  trackServiceGroupAssignmentEvent,
  trackServiceGroupAssignmentModifyEvent,
} from "@/utils/mix-panel";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box } from "@mui/material";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as tt from "io-ts";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

export interface AssociateGroupToServiceProps {
  groupId?: string;
  isAlreadyGroupBounded: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  service?: {
    id: string;
    name: string;
  };
}

const defaultFormValues = {
  groupId: "",
  name: "",
};

export const AssociateGroupToService = ({
  groupId,
  isAlreadyGroupBounded,
  onClose,
  onConfirm,
  open,
  service,
}: AssociateGroupToServiceProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { data: groupsData, fetchData: groupsFetchData } = useFetch<Groups>();
  const { fetchData: psFetchData } = useFetch<unknown>();

  const getValidationSchema = () =>
    z
      .object({
        groupId: z
          .string()
          .min(1, { message: t("forms.errors.field.required") }),
      })
      .refine((schema) => schema.groupId !== groupId, {
        message: t("forms.errors.field.sameSelectedValue"),
        path: ["groupId"],
      });

  const methods = useForm({
    defaultValues: defaultFormValues,
    mode: "onChange",
    resolver: zodResolver(getValidationSchema()),
  });

  const {
    formState: { isValid },
    getValues,
    reset,
    trigger,
  } = methods;

  const handleCancel = () => {
    reset();
    onClose();
  };

  const handleConfirmGroupAssociation = () => {
    if (isValid) {
      if (isAlreadyGroupBounded) trackServiceGroupAssignmentModifyEvent();
      else trackServiceGroupAssignmentEvent();
      psFetchData(
        "patchService",
        {
          body: {
            metadata: { group_id: getValues("groupId") as NonEmptyString },
          },
          serviceId: service?.id ?? "",
        },
        tt.unknown,
        { notify: "all" },
      );
      onConfirm();
    } else {
      trigger();
    }
  };

  useEffect(() => {
    if (service?.name) methods.setValue("name", service.name);
    if (groupId) methods.setValue("groupId", groupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, groupId]);

  useEffect(() => {
    if (open && !groupsData) {
      groupsFetchData(
        "getInstitutionGroups",
        {
          filter: GroupFilterTypeEnum.ALL,
          institutionId: session?.user?.institution.id as string,
        },
        Groups,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <DialogBaseView
      body={
        <FormProvider {...methods}>
          <Box autoComplete="off" component="form" margin={2}>
            <TextFieldController
              disabled
              label={t("forms.service.name.label")}
              name="name"
              placeholder={t("forms.service.name.placeholder")}
            />
            <SelectController
              items={
                groupsData
                  ? groupsData.groups.map((group) => ({
                      label: group.name,
                      value: group.id,
                    }))
                  : []
              }
              label={t("forms.groups.associate.group.select.placeholder")}
              name="groupId"
              placeholder={t("forms.groups.associate.group.select.placeholder")}
              required
            />
          </Box>
        </FormProvider>
      }
      isOpen={open}
      message={t("routes.service.group.bound.modal.message")}
      onClose={handleCancel}
      onConfirm={handleConfirmGroupAssociation}
      title={t("routes.service.group.bound.modal.title")}
    />
  );
};
