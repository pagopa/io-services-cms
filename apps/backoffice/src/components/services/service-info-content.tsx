import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { Service } from "@/types/service";
import { Category, PrivacyTip } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ServiceStatus } from ".";
import { CardRowType, CardRows } from "../cards";
import { DrawerBaseContent } from "../drawer-provider";
import { MarkdownView } from "../markdown-view";

export type ServiceInfoContentProps = {
  data?: Service;
};

/** Render service details information */
export const ServiceInfoContent = ({ data }: ServiceInfoContentProps) => {
  const { t } = useTranslation();

  /** row list for minified/basic information card */
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
          : undefined,
        renderValueOnNewLine: true
      });
    }
    rowsMin.push(
      {
        label: "routes.service.serviceId",
        value: data?.id,
        renderValueOnNewLine: true
      },
      {
        label: "routes.service.lastUpdate",
        value: data?.lastUpdate,
        kind: "datetime",
        renderValueOnNewLine: true
      }
    );
    return rowsMin;
  };

  /** row list for full drawer details */
  const rowsExt: CardRowType[] = [
    ...buildRowsMin(),
    {
      label: "forms.service.metadata.scope.label",
      value: t(
        `forms.service.metadata.scope.${data?.metadata.scope.toLowerCase()}`
      ),
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.name",
      value: data?.name,
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.topic",
      value: data?.metadata.topic?.name ?? t("undefined"),
      renderValueOnNewLine: true
    }
  ];

  /** row list for full drawer details */
  const rowsLinksContacts: CardRowType[] = [
    {
      label: "routes.service.privacyUrl",
      value: data?.metadata.privacy_url ?? "",
      kind: "link",
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.tosUrl",
      value: data?.metadata.tos_url ?? "",
      kind: "link",
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.phone",
      value: data?.metadata.phone ?? "",
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.supportUrl",
      value: data?.metadata.support_url ?? "",
      kind: "link",
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.webUrl",
      value: data?.metadata.web_url ?? "",
      kind: "link",
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.address",
      value: data?.metadata.address ?? "",
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.email",
      value: data?.metadata.email ?? "",
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.pec",
      value: data?.metadata.pec ?? "",
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.appIos",
      value: data?.metadata.app_ios ?? "",
      kind: "link",
      renderValueOnNewLine: true
    },
    {
      label: "routes.service.appAndroid",
      value: data?.metadata.app_android ?? "",
      kind: "link",
      renderValueOnNewLine: true
    }
  ];

  const renderSectionTitle = (text: string) => (
    <Box marginTop={4} marginBottom={2}>
      <Typography id="section-title" variant="overline">
        {t(text)}
      </Typography>
    </Box>
  );

  const renderSensitiveService = () => {
    if (data?.require_secure_channel)
      return (
        <Stack direction="row" alignContent="center" spacing={1} marginTop={3}>
          <PrivacyTip sx={{ fontSize: "24px" }} />
          <Typography variant="body2">
            {t("routes.service.sensitive")}
          </Typography>
        </Stack>
      );
  };

  return (
    <DrawerBaseContent
      width="25vw"
      minWidth="305px"
      maxWidth="400px"
      header={{
        startIcon: <Category color="inherit" />,
        title: "service.details"
      }}
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
