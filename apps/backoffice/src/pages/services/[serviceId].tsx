import { ApiKeys, AuthorizedCidrs } from "@/components/api-keys";
import { PageHeader } from "@/components/headers";
import {
  ServiceAlerts,
  ServiceContextMenu,
  ServiceInfo,
  ServiceLogo,
  fromServiceLifecycleToService,
  fromServicePublicationToService
} from "@/components/services";
import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import { ServicePublication } from "@/generated/api/ServicePublication";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { Service } from "@/types/service";
import { Grid } from "@mui/material";
import * as tt from "io-ts";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slData, spData, release]);

  return (
    <>
      <Grid container spacing={2} alignItems="center" marginBottom={2}>
        <Grid item xs={12} sm={12} md={7} lg={7} xl={7}>
          <PageHeader title={slData?.name} />
        </Grid>
        <Grid item xs={12} sm={12} md={5} lg={5} xl={5}>
          <ServiceContextMenu
            releaseMode={release}
            lifecycleStatus={slData?.status}
            publicationStatus={spData?.status}
            onPublishClick={handlePublish}
            onUnpublishClick={handleUnpublish}
            onSubmitReviewClick={() => handleSubmitReview(true)} // TODO capire lato UX/UI come gestire l'auto_publish
            onHistoryClick={() => console.log("TODO onHistoryClick")} // TODO da implementare
            onEditClick={() =>
              router.push(`/services/${serviceId}/edit-service`)
            }
            onDeleteClick={handleDelete}
          />
        </Grid>
      </Grid>
      <ServiceAlerts
        releaseMode={release}
        serviceLifecycleStatus={slData?.status}
        servicePublicationStatus={spData?.status}
        onServiceLifecycleClick={navigateToServicePublication}
        onServicePublicationClick={navigateToServiceLifecycle}
      />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={8} lg={8} xl={8}>
          <ServiceInfo data={currentService} />
        </Grid>
        <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
          <ServiceLogo serviceId={serviceId} />
        </Grid>
        <Grid item xs={12}>
          <ApiKeys
            title={t("routes.service.keys.title")}
            description={t("routes.service.keys.description")}
            keys={skData}
            onRotateKey={handleRotateKey}
          />
        </Grid>
        <Grid item xs={12}>
          <AuthorizedCidrs
            cidrs={(slData?.authorized_cidrs as unknown) as string[]}
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
