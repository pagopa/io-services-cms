import { PageHeader } from "@/components/headers";
import { buildSnackbarItem } from "@/components/notification";
import { fromServiceCreateUpdatePayloadToApiServicePayload } from "@/components/services";
import { ServiceCreateUpdate } from "@/components/services/service-create-update";
import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { ServiceCreateUpdatePayload } from "@/types/service";
import { trackServiceCreateEndEvent } from "@/utils/mix-panel";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSnackbar } from "notistack";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.new-service.title";
const pageDescriptionLocaleKey = "routes.new-service.description";

const SERVICES_ROUTE_PATH = "/services";

export default function NewService() {
  const { t } = useTranslation();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { fetchData: serviceFetchData } = useFetch<ServiceLifecycle>();

  const handleConfirm = async (service: ServiceCreateUpdatePayload) => {
    const maybeServicePayload =
      fromServiceCreateUpdatePayloadToApiServicePayload(service);
    if (E.isRight(maybeServicePayload)) {
      await serviceFetchData(
        "createService",
        {
          body: maybeServicePayload.right,
        },
        ServiceLifecycle,
        { notify: "all" },
      );
      trackServiceCreateEndEvent("success", "");
    } else {
      enqueueSnackbar(
        buildSnackbarItem({
          message: readableReport(maybeServicePayload.left),
          severity: "error",
          title: t("notifications.validationError"),
        }),
      );
      trackServiceCreateEndEvent(
        readableReport(maybeServicePayload.left),
        "error",
      );
    }
    // redirect to services list in both cases
    router.push(SERVICES_ROUTE_PATH);
  };

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        hideBreadcrumbs
        onExitClick={() => router.push(SERVICES_ROUTE_PATH)}
        showExit
        title={pageTitleLocaleKey}
      />
      <ServiceCreateUpdate mode="create" onConfirm={handleConfirm} />
    </>
  );
}
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale)),
    },
  };
}

NewService.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};
