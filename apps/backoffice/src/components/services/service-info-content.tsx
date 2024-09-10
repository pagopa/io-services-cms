import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { Service } from "@/types/service";
import { Category, PrivacyTip } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";

import { ServiceStatus } from ".";
import { CardRowType, CardRows } from "../cards";
import { DrawerBaseContent } from "../drawer-provider";
import { MarkdownView } from "../markdown-view";

export interface ServiceInfoContentProps {
  data?: Service;
}

/** Render service details information */
export const ServiceInfoContent = ({ data }: ServiceInfoContentProps) => {
  const { t } = useTranslation();

  /** row list for minified/basic information card */
  const buildRowsMin = () => {
    const rowsMin: CardRowType[] = [];
    rowsMin.push({
      label: "routes.service.status",
      value: <ServiceStatus status={data?.status} />,
    });
    if (data?.status.value === ServiceLifecycleStatusTypeEnum.approved) {
      rowsMin.push({
        label: "routes.service.visibility",
        renderValueOnNewLine: true,
        value: data?.visibility
          ? t(`service.visibility.${data?.visibility}`)
          : undefined,
      });
    }
    rowsMin.push(
      {
        label: "routes.service.serviceId",
        renderValueOnNewLine: true,
        value: data?.id,
      },
      {
        kind: "datetime",
        label: "routes.service.lastUpdate",
        renderValueOnNewLine: true,
        value: data?.lastUpdate,
      },
    );
    return rowsMin;
  };

  /** row list for full drawer details */
  const rowsExt: CardRowType[] = [
    ...buildRowsMin(),
    {
      label: "forms.service.metadata.scope.label",
      renderValueOnNewLine: true,
      value: t(
        `forms.service.metadata.scope.${data?.metadata.scope.toLowerCase()}`,
      ),
    },
    {
      label: "routes.service.name",
      renderValueOnNewLine: true,
      value: data?.name,
    },
    {
      label: "routes.service.topic",
      renderValueOnNewLine: true,
      value: data?.metadata.topic?.name ?? t("undefined"),
    },
  ];

  /** row list for full drawer details */
  const rowsLinksContacts: CardRowType[] = [
    {
      kind: "link",
      label: "routes.service.privacyUrl",
      renderValueOnNewLine: true,
      value: data?.metadata.privacy_url ?? "",
    },
    {
      kind: "link",
      label: "routes.service.tosUrl",
      renderValueOnNewLine: true,
      value: data?.metadata.tos_url ?? "",
    },
    {
      label: "routes.service.phone",
      renderValueOnNewLine: true,
      value: data?.metadata.phone ?? "",
    },
    {
      kind: "link",
      label: "routes.service.supportUrl",
      renderValueOnNewLine: true,
      value: data?.metadata.support_url ?? "",
    },
    {
      kind: "link",
      label: "routes.service.webUrl",
      renderValueOnNewLine: true,
      value: data?.metadata.web_url ?? "",
    },
    {
      label: "routes.service.address",
      renderValueOnNewLine: true,
      value: data?.metadata.address ?? "",
    },
    {
      label: "routes.service.email",
      renderValueOnNewLine: true,
      value: data?.metadata.email ?? "",
    },
    {
      label: "routes.service.pec",
      renderValueOnNewLine: true,
      value: data?.metadata.pec ?? "",
    },
    {
      kind: "link",
      label: "routes.service.appIos",
      renderValueOnNewLine: true,
      value: data?.metadata.app_ios ?? "",
    },
    {
      kind: "link",
      label: "routes.service.appAndroid",
      renderValueOnNewLine: true,
      value: data?.metadata.app_android ?? "",
    },
  ];

  const renderSectionTitle = (text: string) => (
    <Box marginBottom={2} marginTop={4}>
      <Typography id="section-title" variant="overline">
        {t(text)}
      </Typography>
    </Box>
  );

  const renderSensitiveService = () => {
    if (data?.require_secure_channel)
      return (
        <Stack alignContent="center" direction="row" marginTop={3} spacing={1}>
          <PrivacyTip sx={{ fontSize: "24px" }} />
          <Typography variant="body2">
            {t("routes.service.sensitive")}
          </Typography>
        </Stack>
      );
  };

  return (
    <DrawerBaseContent
      header={{
        startIcon: <Category color="inherit" />,
        title: "service.details",
      }}
      maxWidth="400px"
      minWidth="305px"
      width="25vw"
    >
      <CardRows rows={rowsExt} />
      {renderSectionTitle("routes.service.description")}
      <MarkdownView>{data?.description}</MarkdownView>
      {renderSensitiveService()}
      {renderSectionTitle("routes.service.linksContacts")}
      <CardRows rows={rowsLinksContacts} />
    </DrawerBaseContent>
  );
};
