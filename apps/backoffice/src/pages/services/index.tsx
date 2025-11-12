import { AccessControl } from "@/components/access-control";
import { CheckboxToggleWithLabel } from "@/components/checkbox";
import { useDialog } from "@/components/dialog-provider";
import { EmptyStateLayer } from "@/components/empty-state";
import { ButtonAssociateGroup } from "@/components/groups";
import { PageHeader } from "@/components/headers";
import {
  ServiceContextMenuActions,
  ServiceGroupTag,
  ServiceSearchById,
  ServiceStatus,
  ServiceVersionSwitcher,
  ServiceVersionSwitcherType,
} from "@/components/services";
import {
  TableRowMenuAction,
  TableView,
  TableViewColumn,
} from "@/components/table-view";
import { getConfiguration } from "@/config";
import { GroupFilterTypeEnum } from "@/generated/api/GroupFilterType";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServiceList } from "@/generated/api/ServiceList";
import {
  ServiceListItem,
  VisibilityEnum,
} from "@/generated/api/ServiceListItem";
import useFetch, { client } from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { ROUTES } from "@/lib/routes";
import {
  hasApiKeyGroupsFeatures,
  isAtLeastInOneGroup,
  isOperator,
  isOperatorAndServiceBoundedToInactiveGroup,
} from "@/utils/auth-util";
import {
  trackServiceCreateStartEvent,
  trackServiceEditStartEvent,
  trackServicesPageEvent,
} from "@/utils/mix-panel";
import {
  Add,
  Block,
  CallSplit,
  Check,
  Close,
  Delete,
  Edit,
  FactCheck,
} from "@mui/icons-material";
import { Button, Grid, Stack, Typography } from "@mui/material";
import * as E from "fp-ts/lib/Either";
import * as tt from "io-ts";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, ReactNode, useEffect, useRef, useState } from "react";

const pageTitleLocaleKey = "routes.services.title";
const pageDescriptionLocaleKey = "routes.services.description";

const DEFAULT_PAGE_LIMIT = 10;
const TEXT_SECONDARY_COLOR_STYLE = { color: "text.secondary" };
const { GROUP_APIKEY_ENABLED } = getConfiguration();

// used to fill TableView rows and simulate a complete pagination
const servicePlaceholder = {
  id: "id",
  last_update: "last_update",
  name: "name",
  status: {
    value: "value",
  },
};

/** Check if a service has a previous approved version _(visibility !== undefined)_ \
 * and a different current 'lifecycle' version _(draft, submitted or rejected)_ */
const hasTwoDifferentVersions = (service: ServiceListItem) =>
  service.visibility !== undefined &&
  service.status.value !== ServiceLifecycleStatusTypeEnum.deleted &&
  service.status.value !== ServiceLifecycleStatusTypeEnum.approved;

/** Simply check if service status value is `deleted` */
const isServiceStatusValueDeleted = (
  serviceStatusValue: ServiceLifecycleStatusTypeEnum,
) => serviceStatusValue === ServiceLifecycleStatusTypeEnum.deleted;

/**
 * Returns base color for MUI `Typography` component.
 * @param serviceStatusValue
 * @returns `inherit` as default color, `text.disabled` if service status value is `deleted` */
const getTypographyDefaultColor = (
  serviceStatusValue: ServiceLifecycleStatusTypeEnum,
) =>
  isServiceStatusValueDeleted(serviceStatusValue) ? "text.disabled" : "inherit";

const checkAtLeastOneActiveGroupExists = async (institutionId: string) => {
  try {
    const maybeResponse = await client.checkInstitutionGroupsExistence({
      filter: GroupFilterTypeEnum.ALL,
      institutionId,
    });

    if (E.isRight(maybeResponse)) {
      return maybeResponse.right.status === 200;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// eslint-disable-next-line max-lines-per-function
export default function Services() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const showDialog = useDialog();

  const [autoPublish, setAutoPublish] = useState<boolean>(true);
  const autoPublishRef = useRef(autoPublish);

  const getTableViewColumnGroup = (): TableViewColumn<ServiceListItem>[] =>
    hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED)(session)
      ? [
          {
            alignment: "left",
            cellTemplate: (service) =>
              service.metadata?.group ? (
                <ServiceGroupTag noWrap value={service.metadata.group} />
              ) : (
                <></>
              ),
            label: "routes.services.tableHeader.group",
            name: "metadata",
          },
        ]
      : [];

  /** MUI `Table` columns definition */
  const tableViewColumns: TableViewColumn<ServiceListItem>[] = [
    {
      alignment: "left",
      cellTemplate: (service) => (
        <Button
          disabled={
            isServiceStatusValueDeleted(service.status.value) ||
            (hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED)(session) &&
              isOperatorAndServiceBoundedToInactiveGroup(session)(service))
          }
          onClick={() =>
            hasTwoDifferentVersions(service)
              ? openServiceVersionSwitcher(service)
              : router.push(ROUTES.SERVICES.DETAILS(service.id))
          }
          size="large"
          startIcon={
            hasTwoDifferentVersions(service) ? (
              <CallSplit
                color={
                  hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED)(session) &&
                  isOperatorAndServiceBoundedToInactiveGroup(session)(service)
                    ? "disabled"
                    : "primary"
                }
                fontSize="small"
              />
            ) : null
          }
          sx={{ fontWeight: 700, textAlign: "left" }}
          variant="naked"
        >
          {service.name}
        </Button>
      ),
      label: "routes.services.tableHeader.name",
      name: "name",
    },
    {
      alignment: "left",
      cellTemplate: (service) => (
        <Typography
          color={getTypographyDefaultColor(service.status.value)}
          variant="body2"
        >
          {new Date(service.last_update).toLocaleString()}
        </Typography>
      ),
      label: "routes.services.tableHeader.lastUpdate",
      name: "last_update",
    },
    {
      alignment: "left",
      cellTemplate: (service) => (
        <Typography
          color={getTypographyDefaultColor(service.status.value)}
          variant="monospaced"
        >
          {service.id}
        </Typography>
      ),
      label: "routes.services.tableHeader.id",
      name: "id",
    },
    {
      alignment: "left",
      cellTemplate: (service) => <ServiceStatus status={service.status} />,
      label: "routes.services.tableHeader.status",
      name: "status",
    },
    {
      alignment: "center",
      cellTemplate: (service) => (
        <Stack alignItems="center" direction="row" justifyContent="center">
          {service.visibility === VisibilityEnum.published ? (
            <Check fontSize="small" sx={TEXT_SECONDARY_COLOR_STYLE} />
          ) : service.visibility === VisibilityEnum.unpublished ? (
            <Close fontSize="small" sx={TEXT_SECONDARY_COLOR_STYLE} />
          ) : (
            <Block color="disabled" fontSize="small" />
          )}
        </Stack>
      ),
      label: "routes.services.tableHeader.visibility",
      name: "visibility",
    },
    ...getTableViewColumnGroup(),
  ];

  const {
    data: servicesData,
    fetchData: servicesFetchData,
    loading: servicesLoading,
  } = useFetch<ServiceList>();
  const { fetchData: noContentFetchData } = useFetch<unknown>();

  const [services, setServices] = useState<ServiceListItem[]>();
  const [pagination, setPagination] = useState({
    count: 0,
    limit: DEFAULT_PAGE_LIMIT,
    offset: 0,
  });
  const [noService, setNoService] = useState(false);
  const [currentSearchByServiceId, setCurrentSearchByServiceId] =
    useState<string>();

  const [isVersionSwitcherOpen, setIsVersionSwitcherOpen] = useState(false);
  const [serviceForVersionSwitcher, setServiceForVersionSwitcher] =
    useState<ServiceListItem>();

  const openServiceVersionSwitcher = (service: ServiceListItem) => {
    setServiceForVersionSwitcher(service);
    setIsVersionSwitcherOpen(true);
  };

  const handleSelectedServiceVersion = (
    serviceId: string,
    version: ServiceVersionSwitcherType,
  ) => {
    router.push(
      version === "publication"
        ? ROUTES.SERVICES.DETAILS(serviceId, true)
        : ROUTES.SERVICES.DETAILS(serviceId),
    );
  };

  const handlePageChange = (pageIndex: number) =>
    setPagination({
      count: pagination.count,
      limit: pagination.limit,
      offset: pagination.limit * pageIndex,
    });

  const handleRowsPerPageChange = (pageSize: number) =>
    setPagination({
      count: pagination.count,
      limit: pageSize,
      offset: 0,
    });

  const handleEdit = (service: ServiceListItem) => {
    trackServiceEditStartEvent("services", service.id);

    router.push(ROUTES.SERVICES.EDIT(service.id));
  };

  const handleCreateService = async () => {
    if (
      hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED) &&
      isOperator(session) &&
      isAtLeastInOneGroup(session)
    ) {
      const atLeastOneActiveGroupExists =
        await checkAtLeastOneActiveGroupExists(
          session?.user?.institution.id as string,
        );

      if (!atLeastOneActiveGroupExists) {
        await showDialog({
          cancelButtonLabel: t("buttons.close"),
          hideConfirmButton: true,
          message: t("routes.new-service.noActiveGroupsModal.description"),
          title: t("routes.new-service.noActiveGroupsModal.title"),
        });
        return;
      }
    }
    trackServiceCreateStartEvent();
    router.push(ROUTES.SERVICES.CREATE);
  };

  /**
   * Returns a single `TableRowMenuAction`
   * @param options configuration options
   * @returns
   */
  const addRowMenuItem = (options: {
    action: ServiceContextMenuActions;
    body?: ReactNode;
    danger?: boolean;
    icon: ReactNode;
    onClickFn?: () => void;
    serviceId: string;
  }): TableRowMenuAction => ({
    danger: options.danger,
    icon: options.icon,
    label: `service.actions.${options.action}`,
    onClick: options.onClickFn ?? (() => handleConfirmationModal(options)),
  });

  /** Returns an `edit` `TableRowMenuAction` */
  const editRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.edit,
      icon: <Edit color="primary" fontSize="inherit" />,
      onClickFn: () => handleEdit(service),
      serviceId: service.id,
    });
  /** Returns a `submitReview` `TableRowMenuAction` */
  const submitReviewRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.submitReview,
      body: (
        <CheckboxToggleWithLabel
          initial={autoPublish}
          label={"service.submitReview.modal.checkBoxLabel"}
          onChange={(next) => {
            autoPublishRef.current = next;
            setAutoPublish(next);
          }}
        />
      ),
      icon: <FactCheck color="primary" fontSize="inherit" />,
      serviceId: service.id,
    });
  /** Returns a `delete` `TableRowMenuAction` */
  const deleteRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.delete,
      danger: true,
      icon: <Delete color="error" fontSize="inherit" />,
      serviceId: service.id,
    });
  /** Returns a `publish` `TableRowMenuAction` */
  const publishRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.publish,
      icon: <Check color="primary" fontSize="inherit" />,
      serviceId: service.id,
    });
  /** Returns an `unpublish` `TableRowMenuAction` */
  const unpublishRowMenuItem = (service: ServiceListItem) =>
    addRowMenuItem({
      action: ServiceContextMenuActions.unpublish,
      icon: <Close color="primary" fontSize="inherit" />,
      serviceId: service.id,
    });

  /** Returns a list of `TableRowMenuAction` depending on service status and visibility */
  const getServiceMenu = (service: ServiceListItem): TableRowMenuAction[] => {
    const result: TableRowMenuAction[] = [];

    // Group Check: no menu actions for operator and services with not active selfcare bounded group
    if (
      hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED)(session) &&
      isOperatorAndServiceBoundedToInactiveGroup(session)(service)
    )
      return result;

    // Lifecycle actions
    switch (service.status.value) {
      case ServiceLifecycleStatusTypeEnum.draft:
        result.push(submitReviewRowMenuItem(service), editRowMenuItem(service));
        break;
      case ServiceLifecycleStatusTypeEnum.approved:
      case ServiceLifecycleStatusTypeEnum.rejected:
        result.push(editRowMenuItem(service));
        break;
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

    // Delete action
    switch (service.status.value) {
      case ServiceLifecycleStatusTypeEnum.draft:
      case ServiceLifecycleStatusTypeEnum.approved:
      case ServiceLifecycleStatusTypeEnum.rejected:
        result.push(deleteRowMenuItem(service));
        break;
      default:
        break;
    }

    return result;
  };

  /** handle actions click: open confirmation modal and on confirm click, perform b4f call action */
  const handleConfirmationModal = async (options: {
    action: ServiceContextMenuActions;
    body?: ReactNode;
    danger?: boolean;
    serviceId: string;
  }) => {
    const raiseClickEvent = await showDialog({
      body: options.body ?? null,
      confirmButtonLabel: t(`service.${options.action}.modal.button`),
      message: t(`service.${options.action}.modal.description`),
      title: t(`service.${options.action}.modal.title`),
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
          await handleSubmitReview(options.serviceId);
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
      notify: "all",
    });
  };

  const handleUnpublish = async (serviceId: string) => {
    await noContentFetchData("unpublishService", { serviceId }, tt.unknown, {
      notify: "all",
    });
  };

  const handleDelete = async (serviceId: string) => {
    await noContentFetchData("deleteService", { serviceId }, tt.unknown, {
      notify: "all",
    });
  };
  const handleSubmitReview = async (serviceId: string) => {
    const value = autoPublishRef.current;
    await noContentFetchData(
      "reviewService",
      { body: { auto_publish: value }, serviceId },
      tt.unknown,
      {
        notify: "all",
      },
    );
  };

  const getServices = () => {
    servicesFetchData(
      "getServiceList",
      {
        id: currentSearchByServiceId,
        limit: pagination.limit,
        offset: pagination.offset,
      },
      ServiceList,
      {
        notify: "errors",
      },
    );
  };

  const handleSearchByServiceIdClick = (id?: string) => {
    setPagination({
      ...pagination,
      offset: 0,
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
          maybeServiceData.right.pagination.count,
        ).fill(servicePlaceholder);
        servicesPlaceholders.splice(
          maybeServiceData.right.pagination.offset,
          maybeServiceData.right.value.length,
          ...maybeServiceData.right.value,
        );
        setServices(servicesPlaceholders);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicesData]);

  useEffect(() => {
    trackServicesPageEvent();
  }, []);

  return (
    <>
      <Grid container paddingRight={3} spacing={0}>
        <Grid item xs>
          <PageHeader
            description={pageDescriptionLocaleKey}
            title={pageTitleLocaleKey}
          />
        </Grid>
        <Grid item xs="auto">
          <Stack direction="row" spacing={2}>
            <AccessControl requiredPermissions={["ApiServiceWrite"]}>
              <Button
                onClick={handleCreateService}
                size="medium"
                startIcon={<Add />}
                variant="contained"
              >
                {t("service.actions.create")}
              </Button>
            </AccessControl>
            <ButtonAssociateGroup />
          </Stack>
        </Grid>
      </Grid>
      {noService ? (
        <EmptyStateLayer
          ctaLabel="service.actions.create"
          ctaRoute={ROUTES.SERVICES.CREATE}
          emptyStateLabel="routes.services.empty"
          requiredPermissions={["ApiServiceWrite"]}
        />
      ) : (
        <>
          <ServiceSearchById
            onEmptySearch={resetSearchByServiceId}
            onSearchClick={handleSearchByServiceIdClick}
          />
          <TableView
            columns={tableViewColumns}
            loading={servicesLoading}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            pagination={pagination}
            rowMenu={getServiceMenu}
            rows={services}
          />
        </>
      )}
      <ServiceVersionSwitcher
        isOpen={isVersionSwitcherOpen}
        onChange={setIsVersionSwitcherOpen}
        onVersionSelected={handleSelectedServiceVersion}
        service={serviceForVersionSwitcher}
      />
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale)),
    },
  };
}

Services.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
