import { AccessControl } from "@/components/access-control";
import { useDialog } from "@/components/dialog-provider";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/headers";
import {
  ServiceContextMenuActions,
  ServiceSearchById,
  ServiceStatus,
  ServiceVersionSwitcher,
  ServiceVersionSwitcherType
} from "@/components/services";
import {
  TableRowMenuAction,
  TableView,
  TableViewColumn
} from "@/components/table-view";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServiceList } from "@/generated/api/ServiceList";
import {
  ServiceListItem,
  VisibilityEnum
} from "@/generated/api/ServiceListItem";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { Add, Block, CallSplit, Check, Close } from "@mui/icons-material";
import { Button, Grid, Typography } from "@mui/material";
import * as E from "fp-ts/lib/Either";
import * as tt from "io-ts";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { ReactElement, useEffect, useState } from "react";

const pageTitleLocaleKey = "routes.services.title";
const pageDescriptionLocaleKey = "routes.services.description";

const CREATE_SERVICE_ROUTE = "/services/new-service";
const DEFAULT_PAGE_LIMIT = 10;

// used to fill TableView rows and simulate a complete pagination
const servicePlaceholder = {
  id: "id",
  name: "name",
  last_update: "last_update",
  status: {
    value: "value"
  }
};

/** Check if a service has a previous approved version _(visibility !== undefined)_ \
 * and a different current 'lifecycle' version _(draft, submitted or rejected)_ */
const hasTwoDifferentVersions = (service: ServiceListItem) =>
  service.visibility !== undefined &&
  service.status.value !== ServiceLifecycleStatusTypeEnum.deleted &&
  service.status.value !== ServiceLifecycleStatusTypeEnum.approved;

export default function Services() {
  const { t } = useTranslation();
  const router = useRouter();
  const showDialog = useDialog();

  /** MUI `Table` columns definition */
  const tableViewColumns: TableViewColumn<ServiceListItem>[] = [
    {
      label: "routes.services.tableHeader.name",
      alignment: "left",
      name: "name",
      cellTemplate: service => (
        <Button
          variant="naked"
          size="large"
          startIcon={
            hasTwoDifferentVersions(service) ? (
              <CallSplit fontSize="small" color="primary" />
            ) : null
          }
          sx={{ fontWeight: 700 }}
          disabled={
            service.status.value === ServiceLifecycleStatusTypeEnum.deleted
          }
          onClick={() =>
            hasTwoDifferentVersions(service)
              ? openServiceVersionSwitcher(service)
              : router.push(`/services/${service.id}/edit-service`)
          }
        >
          {service.name}
        </Button>
      )
    },
    {
      label: "routes.services.tableHeader.lastUpdate",
      alignment: "left",
      name: "last_update",
      cellTemplate: service => (
        <Typography variant="body2">
          {new Date(service.last_update).toLocaleString()}
        </Typography>
      )
    },
    {
      label: "routes.services.tableHeader.id",
      alignment: "left",
      name: "id",
      cellTemplate: service => (
        <Typography variant="monospaced">{service.id}</Typography>
      )
    },
    {
      label: "routes.services.tableHeader.status",
      alignment: "left",
      name: "status",
      cellTemplate: service => <ServiceStatus status={service.status} />
    },
    {
      label: "routes.services.tableHeader.visibility",
      alignment: "center",
      name: "visibility",
      cellTemplate: service =>
        service.visibility === VisibilityEnum.published ? (
          <Check color="success" />
        ) : service.visibility === VisibilityEnum.unpublished ? (
          <Close color="error" />
        ) : (
          <Block color="disabled" />
        )
    }
  ];

  const {
    data: servicesData,
    loading: servicesLoading,
    fetchData: servicesFetchData
  } = useFetch<ServiceList>();
  const { fetchData: noContentFetchData } = useFetch<unknown>();

  const [services, setServices] = useState<Array<ServiceListItem>>();
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: DEFAULT_PAGE_LIMIT,
    count: 0
  });
  const [noService, setNoService] = useState(false);
  const [currentSearchByServiceId, setCurrentSearchByServiceId] = useState<
    string
  >();

  const [isVersionSwitcherOpen, setIsVersionSwitcherOpen] = useState(false);
  const [serviceForVersionSwitcher, setServiceForVersionSwitcher] = useState<
    ServiceListItem
  >();

  const openServiceVersionSwitcher = (service: ServiceListItem) => {
    setServiceForVersionSwitcher(service);
    setIsVersionSwitcherOpen(true);
  };

  const handleSelectedServiceVersion = (
    serviceId: string,
    version: ServiceVersionSwitcherType
  ) => {
    router.push(
      `/services/${serviceId}${
        version === "publication" ? "?release=true" : ""
      }`
    );
  };

  const handlePageChange = (pageIndex: number) =>
    setPagination({
      limit: pagination.limit,
      offset: pagination.limit * pageIndex,
      count: pagination.count
    });

  const handleRowsPerPageChange = (pageSize: number) =>
    setPagination({
      count: pagination.count,
      limit: pageSize,
      offset: 0
    });

  /**
   * Returns a single `TableRowMenuAction`
   * @param options configuration options
   * @returns
   */
  const addRowMenuItem = (options: {
    action: ServiceContextMenuActions;
    serviceId: string;
    danger?: boolean;
    onClickFn?: () => void;
  }) => ({
    label: `service.actions.${options.action}`,
    danger: options.danger,
    onClick: options.onClickFn ?? (() => handleConfirmationModal(options))
  });

  /** Returns an `edit` `TableRowMenuAction` */
  const editRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.edit,
      serviceId: service.id,
      onClickFn: () => router.push(`/services/${service.id}/edit-service`)
    });
  /** Returns a `submitReview` `TableRowMenuAction` */
  const submitReviewRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.submitReview,
      serviceId: service.id
    });
  /** Returns a `delete` `TableRowMenuAction` */
  const deleteRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.delete,
      serviceId: service.id,
      danger: true
    });
  /** Returns a `publish` `TableRowMenuAction` */
  const publishRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.publish,
      serviceId: service.id
    });
  /** Returns an `unpublish` `TableRowMenuAction` */
  const unpublishRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.unpublish,
      serviceId: service.id
    });

  /** Returns a list of `TableRowMenuAction` depending on service status and visibility */
  const getServiceMenu = (service: ServiceListItem): TableRowMenuAction[] => {
    let result: TableRowMenuAction[] = [];

    // Lifecycle actions
    switch (service.status.value) {
      case ServiceLifecycleStatusTypeEnum.draft:
        result.push(
          submitReviewRowMenuItem(service),
          editRowMenuItem(service),
          deleteRowMenuItem(service)
        );
        break;
      case ServiceLifecycleStatusTypeEnum.approved:
      case ServiceLifecycleStatusTypeEnum.rejected:
        result.push(editRowMenuItem(service), deleteRowMenuItem(service));
        break;
      case ServiceLifecycleStatusTypeEnum.submitted:
      case ServiceLifecycleStatusTypeEnum.deleted:
      default:
        break;
    }

    // Publication actions
    if (service.status.value !== ServiceLifecycleStatusTypeEnum.deleted) {
      if (service.visibility === VisibilityEnum.published)
        result.push(unpublishRowMenuItem(service));
      else if (service.visibility === VisibilityEnum.unpublished)
        result.push(publishRowMenuItem(service));
    }

    return result;
  };

  /** handle actions click: open confirmation modal and on confirm click, perform b4f call action */
  const handleConfirmationModal = async (options: {
    action: ServiceContextMenuActions;
    serviceId: string;
    danger?: boolean;
  }) => {
    const raiseClickEvent = await showDialog({
      title: t(`service.${options.action}.modal.title`),
      message: t(`service.${options.action}.modal.description`),
      confirmButtonLabel: t(`service.${options.action}.modal.button`)
    });
    if (raiseClickEvent) {
      switch (options.action) {
        case ServiceContextMenuActions.delete:
          await handleDelete(options.serviceId);
          break;
        case ServiceContextMenuActions.publish:
          await handlePublish(options.serviceId);
          break;
        case ServiceContextMenuActions.submitReview:
          await handleSubmitReview(options.serviceId, true); // TODO capire lato UX/UI come gestire l'auto_publish
          break;
        case ServiceContextMenuActions.unpublish:
          await handleUnpublish(options.serviceId);
          break;
        default:
          console.warn("unhandled action " + options.action);
          break;
      }
      getServices();
    }
  };

  const handlePublish = async (serviceId: string) => {
    await noContentFetchData("releaseService", { serviceId }, tt.unknown, {
      notify: "all"
    });
  };

  const handleUnpublish = async (serviceId: string) => {
    await noContentFetchData("unpublishService", { serviceId }, tt.unknown, {
      notify: "all"
    });
  };

  const handleDelete = async (serviceId: string) => {
    await noContentFetchData("deleteService", { serviceId }, tt.unknown, {
      notify: "all"
    });
  };

  const handleSubmitReview = async (
    serviceId: string,
    auto_publish: boolean
  ) => {
    await noContentFetchData(
      "reviewService",
      { body: { auto_publish }, serviceId },
      tt.unknown,
      {
        notify: "all"
      }
    );
  };

  const getServices = (id?: string) => {
    servicesFetchData(
      "getServiceList",
      {
        limit: pagination.limit,
        offset: pagination.offset,
        id: currentSearchByServiceId
      },
      ServiceList,
      {
        notify: "errors"
      }
    );
  };

  const handleSearchByServiceIdClick = (id?: string) => {
    setPagination({
      ...pagination,
      offset: 0
    });
    setCurrentSearchByServiceId(id);
  };

  const resetSearchByServiceId = () => {
    setCurrentSearchByServiceId(undefined);
  };

  // fetch services when table pagination or search by serviceId change
  useEffect(() => {
    getServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, currentSearchByServiceId]);

  // make some checks and adjustments on services fetch result
  useEffect(() => {
    const maybeServiceData = ServiceList.decode(servicesData);
    if (E.isRight(maybeServiceData)) {
      // check services result (if no services, an EmptyState component will be displayed)
      if (
        maybeServiceData.right.value.length === 0 &&
        !currentSearchByServiceId // no active search by serviceId in progress
      )
        setNoService(true);
      // check pagination data and build a full pagination.count array of services
      // filling empty items with some placeholders (in order to have a working paginated MUI Table)
      if (
        maybeServiceData.right.pagination.offset !== undefined &&
        maybeServiceData.right.pagination.limit
      ) {
        const servicesPlaceholders = Array(
          maybeServiceData.right.pagination.count
        ).fill(servicePlaceholder);
        servicesPlaceholders.splice(
          maybeServiceData.right.pagination.offset,
          maybeServiceData.right.value.length,
          ...maybeServiceData.right.value
        );
        setServices(servicesPlaceholders);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicesData]);

  return (
    <>
      <Grid container spacing={0} paddingRight={3}>
        <Grid item xs>
          <PageHeader
            title={pageTitleLocaleKey}
            description={pageDescriptionLocaleKey}
          />
        </Grid>
        <Grid item xs="auto">
          <AccessControl requiredPermissions={["ApiServiceWrite"]}>
            <NextLink
              href={CREATE_SERVICE_ROUTE}
              passHref
              style={{ textDecoration: "none" }}
            >
              <Button size="medium" variant="contained" startIcon={<Add />}>
                {t("service.actions.create")}
              </Button>
            </NextLink>
          </AccessControl>
        </Grid>
      </Grid>
      {noService ? (
        <EmptyState
          emptyStateLabel="routes.services.empty"
          ctaLabel="service.actions.create"
          ctaRoute={CREATE_SERVICE_ROUTE}
          requiredPermissions={["ApiServiceWrite"]}
        />
      ) : (
        <>
          <ServiceSearchById
            onSearchClick={handleSearchByServiceIdClick}
            onEmptySearch={resetSearchByServiceId}
          />
          <TableView
            columns={tableViewColumns}
            rows={services}
            rowMenu={getServiceMenu}
            pagination={pagination}
            loading={servicesLoading}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      )}
      <ServiceVersionSwitcher
        service={serviceForVersionSwitcher}
        isOpen={isVersionSwitcherOpen}
        onChange={setIsVersionSwitcherOpen}
        onVersionSelected={handleSelectedServiceVersion}
      />
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale))
    }
  };
}

Services.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
