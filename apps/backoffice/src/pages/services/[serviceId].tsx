import { ApiKeys, AuthorizedCidrs } from "@/components/api-keys";
import { CardDetails } from "@/components/cards";
import { PageHeader } from "@/components/headers";
import { ServiceContextMenu, ServiceStatus } from "@/components/services";
import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import { ServicePublication } from "@/generated/api/ServicePublication";
import { SubscriptionKeyTypeEnum } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { ReadMore } from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import * as tt from "io-ts";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { ReactElement, useEffect } from "react";

export default function ServiceDetails() {
  const { t } = useTranslation();
  const router = useRouter();
  const serviceId = router.query.serviceId as string;

  const { data: slData, fetchData: slFetchData } = useFetch<ServiceLifecycle>();
  const { data: spData, fetchData: spFetchData } = useFetch<
    ServicePublication
  >();
  const { data: skData, fetchData: skFetchData } = useFetch<SubscriptionKeys>();
  const { fetchData: noContentFetchData } = useFetch<unknown>();

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

  const handlePublish = () =>
    noContentFetchData("releaseService", { serviceId }, tt.unknown, {
      notify: "all"
    });

  const handleUnpublish = () =>
    noContentFetchData("unpublishService", { serviceId }, tt.unknown, {
      notify: "all"
    });

  const handleDelete = () => {
    noContentFetchData("deleteService", { serviceId }, tt.unknown, {
      notify: "all"
    });
    router.push("/services");
  };

  const handleSubmitReview = (auto_publish: boolean) =>
    noContentFetchData(
      "reviewService",
      { body: { auto_publish }, serviceId },
      tt.unknown,
      {
        notify: "all"
      }
    );

  useEffect(() => {
    slFetchData("getService", { serviceId }, ServiceLifecycle, {
      notify: "errors"
    });
    spFetchData("getPublishedService", { serviceId }, ServicePublication, {
      notify: "errors"
    });
    skFetchData("getServiceKeys", { serviceId }, SubscriptionKeys, {
      notify: "errors"
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderInformation = () => (
    <CardDetails
      title="routes.service.information"
      cta={{
        icon: <ReadMore style={{ fontSize: "24px" }} />,
        label: "routes.service.viewDetails",
        fn: () => console.log("click") // TODO
      }}
      rows={[
        {
          label: "routes.service.status",
          value: <ServiceStatus status={slData?.status} />
        },
        {
          label: "routes.service.visibility",
          value: spData?.status
            ? t(`service.visibility.${spData?.status}`)
            : undefined
        },
        {
          label: "routes.service.serviceId",
          value: slData?.id
        },
        {
          label: "routes.service.lastUpdate",
          value: slData?.last_update,
          kind: "datetime"
        }
      ]}
    />
  );

  const renderServiceLogo = () => (
    <CardDetails
      title="Service Logo"
      rows={[]}
      customContent={<Box>Placeholder todo</Box>}
    />
  );

  return (
    <>
      <Grid container spacing={2} alignItems="center" marginBottom={2}>
        <Grid item xs={12} sm={12} md={7} lg={7} xl={7}>
          <PageHeader title={slData?.name} />
        </Grid>
        <Grid item xs={12} sm={12} md={5} lg={5} xl={5}>
          <ServiceContextMenu
            lifecycleStatus={slData?.status}
            publicationStatus={spData?.status}
            onPublishClick={handlePublish}
            onUnpublishClick={handleUnpublish}
            onSubmitReviewClick={() => handleSubmitReview(true)} // TODO capire lato UX/UI come gestire l'auto_publish
            onHistoryClick={() => console.log("onHistoryClick")}
            onEditClick={() =>
              router.push(`/services/${serviceId}/edit-service`)
            }
            onDeleteClick={handleDelete}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8} md={8} lg={6} xl={6}>
          {renderInformation()}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>
          {renderServiceLogo()}
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
