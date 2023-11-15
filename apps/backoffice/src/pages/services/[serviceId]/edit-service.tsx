import { PageHeader } from "@/components/headers";
import { buildSnackbarItem } from "@/components/notification";
import {
  fromApiServicePayloadToServiceCreateUpdatePayload,
  fromServiceCreateUpdatePayloadToApiServicePayload
} from "@/components/services";
import { ServiceCreateUpdate } from "@/components/services/service-create-update";
import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { ServiceCreateUpdatePayload } from "@/types/service";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { ReactElement, useEffect, useState } from "react";

const pageTitleLocaleKey = "routes.edit-service.title";
const pageDescriptionLocaleKey = "routes.edit-service.description";

export default function EditService() {
  const { t } = useTranslation();
  const router = useRouter();
  const serviceId = router.query.serviceId as string;
  const { data: session } = useSession();
  const { enqueueSnackbar } = useSnackbar();
  const { data: serviceData, fetchData: serviceFetchData } = useFetch<
    ServiceLifecycle
  >();
  const [serviceCreateUpdatePayload, setServiceCreateUpdatePayload] = useState<
    ServiceCreateUpdatePayload
  >();

  const handleConfirm = async (service: ServiceCreateUpdatePayload) => {
    const maybeApiServicePayload = fromServiceCreateUpdatePayloadToApiServicePayload(
      service
    );
    if (E.isRight(maybeApiServicePayload)) {
      await serviceFetchData(
        "updateService",
        {
          serviceId,
          body: maybeApiServicePayload.right
        },
        ServiceLifecycle,
        { notify: "all" }
      );
    } else {
      enqueueSnackbar(
        buildSnackbarItem({
          severity: "error",
          title: t("notifications.validationError"),
          message: readableReport(maybeApiServicePayload.left)
        })
      );
    }
    // redirect to service details in both cases
    router.push(`/services/${serviceId}`);
  };

  useEffect(() => {
    serviceFetchData("getService", { serviceId }, ServiceLifecycle, {
      notify: "errors",
      redirect: { on: "errors", href: "/services" }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (serviceData)
      setServiceCreateUpdatePayload(
        fromApiServicePayloadToServiceCreateUpdatePayload(serviceData)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceData]);

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
      />
      <ServiceCreateUpdate
        mode="update"
        service={serviceCreateUpdatePayload}
        onConfirm={handleConfirm}
      />
    </>
  );
}

export async function getServerSideProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale))
    }
  };
}

EditService.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};
