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
import { ROUTES } from "@/lib/routes";
import { ServiceCreateUpdatePayload } from "@/types/service";
import {
  trackServiceEditAbortEvent,
  trackServiceEditEndEvent,
} from "@/utils/mix-panel";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSnackbar } from "notistack";
import { ReactElement, useEffect, useState } from "react";

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
  const [stepIndex, setStepIndex] = useState(0);

  const handleConfirm = async (service: ServiceCreateUpdatePayload) => {
    const maybeApiServicePayload =
      fromServiceCreateUpdatePayloadToApiServicePayload(service);
    if (E.isRight(maybeApiServicePayload)) {
      const result = await serviceFetchData(
        "updateService",
        {
          body: maybeApiServicePayload.right,
          serviceId,
        },
        ServiceLifecycle,
        { notify: "all" },
      );
      if (result.success) {
        trackServiceEditEndEvent("success", serviceId);
      } else {
        trackServiceEditEndEvent("error", serviceId);
      }
    } else {
      enqueueSnackbar(
        buildSnackbarItem({
          message: readableReport(maybeApiServicePayload.left),
          severity: "error",
          title: t("notifications.validationError"),
        }),
      );
      trackServiceEditEndEvent("error", serviceId);
    }
    // redirect to service details in both cases
    router.push(ROUTES.SERVICES.DETAILS(serviceId));
  };

  const handleAbort = () => {
    trackServiceEditAbortEvent(stepIndex);
    router.push(ROUTES.SERVICES.DETAILS(serviceId));
  };

  useEffect(() => {
    serviceFetchData("getService", { serviceId }, ServiceLifecycle, {
      notify: "errors",
      redirect: { href: ROUTES.SERVICES.LIST, on: "errors" },
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
        onExitClick={handleAbort}
        showExit
        title={pageTitleLocaleKey}
      />
      <ServiceCreateUpdate
        mode="update"
        onCancel={handleAbort}
        onConfirm={handleConfirm}
        onStepChange={setStepIndex}
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
