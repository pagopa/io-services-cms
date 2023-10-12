import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { Service } from "@/types/service";
import { Category, ReadMore } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ServiceStatus } from ".";
import { CardDetails, CardRowType, CardRows } from "../cards";
import { useDrawer } from "../drawer-provider";

export type ServiceInfoProps = {
  data?: Service;
};

/** Render service basic information card and service details drawer */
export const ServiceInfo = ({ data }: ServiceInfoProps) => {
  const { t } = useTranslation();
  const { openDrawer } = useDrawer();

  /** row list for minified information card */
  const buildRowsMin = () => {
    const rowsMin: CardRowType[] = [];
    rowsMin.push({
      label: "routes.service.status",
      value: <ServiceStatus status={data?.status} />
    });
    if (data?.status.value === ServiceLifecycleStatusTypeEnum.approved) {
      rowsMin.push({
        label: "routes.service.visibility",
        value: data?.visibility
          ? t(`service.visibility.${data?.visibility}`)
          : undefined
      });
    }
    rowsMin.push(
      {
        label: "routes.service.serviceId",
        value: data?.id
      },
      {
        label: "routes.service.lastUpdate",
        value: data?.lastUpdate,
        kind: "datetime"
      }
    );
    return rowsMin;
  };

  /** row list for full drawer details */
  const rowsExt: CardRowType[] = [
    ...buildRowsMin(),
    { label: "routes.service.name", value: data?.name }
  ];

  /** row list for full drawer details */
  const rowsLinksContacts: CardRowType[] = [
    {
      label: "routes.service.privacyUrl",
      value: data?.metadata.privacyUrl,
      kind: "link"
    },
    {
      label: "routes.service.tosUrl",
      value: data?.metadata.tosUrl,
      kind: "link"
    },
    { label: "routes.service.phone", value: data?.metadata.phone },
    {
      label: "routes.service.supportUrl",
      value: data?.metadata.supportUrl,
      kind: "link"
    },
    {
      label: "routes.service.webUrl",
      value: data?.metadata.webUrl,
      kind: "link"
    },
    { label: "routes.service.address", value: data?.metadata.address },
    { label: "routes.service.email", value: data?.metadata.email },
    { label: "routes.service.pec", value: data?.metadata.pec },
    {
      label: "routes.service.appIos",
      value: data?.metadata.appIos,
      kind: "link"
    },
    {
      label: "routes.service.appAndroid",
      value: data?.metadata.appAndroid,
      kind: "link"
    }
  ];

  const renderSectionTitle = (text: string) => (
    <Box marginTop={4} marginBottom={2}>
      <Typography id="section-title" variant="overline">
        {t(text)}
      </Typography>
    </Box>
  );

  const openDetails = () => {
    const content = (
      <Box width="25vw">
        <Stack direction="row" spacing={1} marginBottom={4}>
          <Category color="inherit" />
          <Typography variant="h6">{t("service.details")}</Typography>
        </Stack>
        {renderSectionTitle("routes.service.information")}
        <CardRows rows={rowsExt} />
        {renderSectionTitle("routes.service.description")}
        <Typography variant="body2">{data?.description}</Typography>
        {renderSectionTitle("routes.service.linksContacts")}
        <CardRows rows={rowsLinksContacts} />
      </Box>
    );
    openDrawer(content);
  };

  return (
    <CardDetails
      title="routes.service.information"
      cta={{
        icon: <ReadMore style={{ fontSize: "24px" }} />,
        label: "routes.service.viewDetails",
        fn: openDetails
      }}
      rows={buildRowsMin()}
    />
  );
};
