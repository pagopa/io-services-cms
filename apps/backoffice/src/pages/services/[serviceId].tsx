import { ApiKeys, AuthorizedCidrs } from "@/components/api-keys";
import { AppPreview } from "@/components/app-preview";
import { PageHeader } from "@/components/headers";
import {
  ServiceAlerts,
  ServiceContextMenu,
  ServiceHistoryComponent,
  ServiceInfo,
  ServiceLogo,
  fromServiceLifecycleToService,
  fromServicePublicationToService
} from "@/components/services";
import { ServiceHistory } from "@/generated/api/ServiceHistory";
import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import { ServicePublication } from "@/generated/api/ServicePublication";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { Service } from "@/types/service";
import { logToMixpanel } from "@/utils/mix-panel";
import { Grid } from "@mui/material";
import * as tt from "io-ts";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect, useState } from "react";

const RELEASE_QUERY_PARAM = "?release=true";

export default function ServiceDetails() {
  const { t } = useTranslation();
  const router = useRouter();
  const serviceId = router.query.serviceId as string;

  /** Page release view query param
   * - `undefined` | `false` shows normal ServiceLifecycle details
   * - `true` shows ServicePublication details */
  const release = router.query.release === "true";
  const [currentService, setCurrentService] = useState<Service>();
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const { data: shData, fetchData: shFetchData, loading: shLoading } = useFetch<
    ServiceHistory
  >();
  const { data: slData, fetchData: slFetchData } = useFetch<ServiceLifecycle>();
  const { data: spData, fetchData: spFetchData } = useFetch<
    ServicePublication
  >();
  const { data: skData, fetchData: skFetchData } = useFetch<SubscriptionKeys>();
  const { fetchData: noContentFetchData } = useFetch<unknown>();

  /** set current service to display _(`Lifecycle` or `Publication` version)_ */
  const manageCurrentService = () =>
    release
      ? setCurrentService(fromServicePublicationToService(spData))
      : setCurrentService(
          fromServiceLifecycleToService(slData, spData?.status)
        );

  const handleRotateKey = (keyType: SubscriptionKeyTypeEnum) => {
    skFetchData(
      "regenerateServiceKey",
      { keyType, serviceId },
      SubscriptionKeys,
      {
        notify: "all"
      }
    );
  };

  const handlePublish = async () => {
    await noContentFetchData("releaseService", { serviceId }, tt.unknown, {
      notify: "all"
    });
    fetchServicePublication(); // reload ServicePublication
  };

  const handleUnpublish = async () => {
    await noContentFetchData("unpublishService", { serviceId }, tt.unknown, {
      notify: "all"
    });
    fetchServicePublication(); // reload ServicePublication
  };

  const handleDelete = async () => {
    await noContentFetchData("deleteService", { serviceId }, tt.unknown, {
      notify: "all"
    });
    router.push("/services"); // redirect to parent services page
  };

  const handleSubmitReview = async (auto_publish: boolean) => {
    await noContentFetchData(
      "reviewService",
      { body: { auto_publish }, serviceId },
      tt.unknown,
      {
        notify: "all"
      }
    );
    fetchServiceLifecycle(); // reload ServiceLifecycle
  };

  const handleHistory = (continuationToken?: string) => {
    setShowHistory(true);
    logToMixpanel("IO_BO_SERVICE_HISTORY", {
      serviceId: serviceId
    });
    shFetchData(
      "getServiceHistory",
      { continuationToken, serviceId },
      ServiceHistory,
      {
        notify: "errors"
      }
    );
  };

  const handlePreview = () => {
    setShowPreview(true);
    logToMixpanel("IO_BO_SERVICE_PREVIEW", {
      serviceId: serviceId
    });
  };

  const handleEdit = () => {
    logToMixpanel("IO_BO_SERVICE_EDIT_START", {
      serviceId: serviceId,
      entryPoint: "Service Detail"
    });
    router.push(`/services/${serviceId}/edit-service`);
  };

  const navigateToServiceLifecycle = () =>
    router.replace(router.asPath.replace(RELEASE_QUERY_PARAM, ""));

  const navigateToServicePublication = () =>
    router.push(router.asPath + RELEASE_QUERY_PARAM);

  const fetchServiceLifecycle = () =>
    slFetchData("getService", { serviceId }, ServiceLifecycle, {
      notify: "errors"
    });

  const fetchServicePublication = () =>
    spFetchData("getPublishedService", { serviceId }, ServicePublication);

  useEffect(() => {
    fetchServiceLifecycle();
    fetchServicePublication();
    skFetchData("getServiceKeys", { serviceId }, SubscriptionKeys, {
      notify: "errors"
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    manageCurrentService();
    logToMixpanel("IO_BO_SERVICE_DETAILS_PAGE", {
      serviceId: serviceId,
      serviceName: slData?.name as string
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slData, spData, release]);

  return (
    <>
      <Grid alignItems="center" container marginBottom={2} spacing={2}>
        <Grid item lg={7} md={7} sm={12} xl={7} xs={12}>
          <PageHeader title={slData?.name} />
        </Grid>
        <Grid item lg={5} md={5} sm={12} xl={5} xs={12}>
          <ServiceContextMenu
            lifecycleStatus={slData?.status}
            publicationStatus={spData?.status}
            onPublishClick={handlePublish}
            onUnpublishClick={handleUnpublish}
            onSubmitReviewClick={() => handleSubmitReview(true)} // TODO capire lato UX/UI come gestire l'auto_publish
            onHistoryClick={() => handleHistory()}
            onPreviewClick={handlePreview}
            onEditClick={handleEdit}
            onDeleteClick={handleDelete}
            releaseMode={release}
          />
        </Grid>
      </Grid>
      <ServiceAlerts
        onServiceLifecycleClick={navigateToServicePublication}
        onServicePublicationClick={navigateToServiceLifecycle}
        releaseMode={release}
        serviceLifecycleStatus={slData?.status}
        servicePublicationStatus={spData?.status}
      />
      <ServiceHistoryComponent
        historyData={shData}
        loading={shLoading}
        onClose={() => setShowHistory(false)}
        onLoadMoreClick={handleHistory}
        showHistory={showHistory}
      />
      <AppPreview
        // hide edit shortcut in release mode
        editUrl={release ? undefined : `/services/${serviceId}/edit-service`}
        itemToPreview={currentService}
        onClose={() => setShowPreview(false)}
        showPreview={showPreview}
      />
      <Grid container spacing={2}>
        <Grid item lg={8} md={8} sm={12} xl={8} xs={12}>
          <ServiceInfo data={currentService} />
        </Grid>
        <Grid item lg={4} md={4} sm={12} xl={4} xs={12}>
          <ServiceLogo serviceId={serviceId} />
        </Grid>
        <Grid item xs={12}>
          <ApiKeys
            description={t("routes.service.keys.description")}
            keys={skData}
            onRotateKey={handleRotateKey}
            page="service"
            title={t("routes.service.keys.title")}
          />
        </Grid>
        <Grid item xs={12}>
          <AuthorizedCidrs
            cidrs={(slData?.authorized_cidrs as unknown) as string[]}
            description="routes.service.authorizedCidrs.description"
            editable={false}
            onSaveClick={e => console.log(e)}
          />
        </Grid>
      </Grid>
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

ServiceDetails.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
