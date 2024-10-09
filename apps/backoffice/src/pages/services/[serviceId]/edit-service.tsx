import { PageHeader } from "@/components/headers";
import { buildSnackbarItem } from "@/components/notification";
import {
  fromServiceCreateUpdatePayloadToApiServicePayload,
  fromServiceLifecycleToServiceCreateUpdatePayload,
} from "@/components/services";
import { ServiceCreateUpdate } from "@/components/services/service-create-update";
import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { ServiceCreateUpdatePayload } from "@/types/service";
import { logToMixpanel } from "@/utils/mix-panel";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSnackbar } from "notistack";
import { ReactElement, useEffect, useState } from "react";
import React from "react";

const pageTitleLocaleKey = "routes.edit-service.title";
const pageDescriptionLocaleKey = "routes.edit-service.description";

export default function EditService() {
  const { t } = useTranslation();
  const router = useRouter();
  const serviceId = router.query.serviceId as string;
  const { enqueueSnackbar } = useSnackbar();
  const { data: serviceData, fetchData: serviceFetchData } =
    useFetch<ServiceLifecycle>();
  const [serviceCreateUpdatePayload, setServiceCreateUpdatePayload] =
    useState<ServiceCreateUpdatePayload>();

  const handleConfirm = async (service: ServiceCreateUpdatePayload) => {
    const maybeApiServicePayload =
      fromServiceCreateUpdatePayloadToApiServicePayload(service);
    if (E.isRight(maybeApiServicePayload)) {
      await serviceFetchData(
        "updateService",
        {
          body: maybeApiServicePayload.right,
          serviceId,
        },
        ServiceLifecycle,
        { notify: "all" },
      );
      logToMixpanel("IO_BO_SERVICE_EDIT_END", "TECH", {
        result: "success",
        serviceId: serviceId,
      });
    } else {
      enqueueSnackbar(
        buildSnackbarItem({
          message: readableReport(maybeApiServicePayload.left),
          severity: "error",
          title: t("notifications.validationError"),
        }),
      );
      logToMixpanel("IO_BO_SERVICE_EDIT_END", "TECH", {
        result: readableReport(maybeApiServicePayload.left),
        serviceId: serviceId,
      });
    }
    // redirect to service details in both cases
    router.push(`/services/${serviceId}`);
  };

  useEffect(() => {
    serviceFetchData("getService", { serviceId }, ServiceLifecycle, {
      notify: "errors",
      redirect: { href: "/services", on: "errors" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (serviceData)
      setServiceCreateUpdatePayload(
        fromServiceLifecycleToServiceCreateUpdatePayload(serviceData),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceData]);

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        hideBreadcrumbs
        onExitClick={() => router.push(`/services/${serviceId}`)}
        showExit
        title={pageTitleLocaleKey}
      />
      <ServiceCreateUpdate
        mode="update"
        onConfirm={handleConfirm}
        service={serviceCreateUpdatePayload}
      />
    </>
  );
}

export async function getServerSideProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
}

EditService.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};
