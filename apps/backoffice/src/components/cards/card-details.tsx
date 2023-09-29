import { ArrowForward } from "@mui/icons-material";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useTranslation } from "next-i18next";
import NextLink from "next/link";
import { ReactNode } from "react";
import { ApiKeyValue } from "../api-keys";
import { CopyToClipboard } from "../copy-to-clipboard";
import { LoaderSkeleton } from "../loaders";

export type CardDetailsRowType = {
  /** row label, shown on left */
  label: string;
  /** row value, shown on right */
  value?: string;
  /** If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis.
   * _(This is the default behaviour)_ */
  noWrap?: boolean;
  /** If true, a *""copy to clipboard"* icon is shown on right side of *value* */
  copyableValue?: boolean;
  /** row value kind, useful for some specific render modes */
  kind?: CardDetailsRowValueType;
};

export type CardDetailsRowValueType = "apikey" | "link" | "markdown";

export type CardDetailsProps = {
  /** Card title */
  title: string;
  /** Array of label/value rows displayed as a list */
  rows: CardDetailsRowType[];
  /** If defined, render a custom card body content */
  customContent?: ReactNode;
  /** Call to action link placed in card footer */
  cta?: {
    label: string;
    href: string;
    target?: "_blank" | "_self";
  };
};

/**
 * Card used to show detailed general-purpose information.
 */
export const CardDetails = ({
  title,
  rows,
  customContent,
  cta
}: CardDetailsProps) => {
  const { t } = useTranslation();

  const renderValue = (value: string | undefined, children: ReactNode) => (
    <LoaderSkeleton loading={value === undefined} style={{ width: "100%" }}>
      {children}
    </LoaderSkeleton>
  );

  /** render row value based on `kind` first and other additional settings _(noWrap)_ */
  const renderRowKind = (row: CardDetailsRowType) => {
    switch (row.kind) {
      case "apikey":
        return <ApiKeyValue isVisible={false} keyValue={row.value} />;
      case "link":
        return renderValue(
          row.value,
          <NextLink href={row.value ?? "/"} target="_blank" rel="noreferrer">
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap={row.noWrap ?? true}
              color={"primary"}
            >
              {row.value ?? "-"}
            </Typography>
          </NextLink>
        );
      case "markdown":
        // todo: to be implemented
        return <span>{row.value}</span>;
      default:
        return renderValue(
          row.value,
          <>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap={row.noWrap ?? true}
              color={"text"}
            >
              {row.value}
            </Typography>
            {row.copyableValue ? (
              <CopyToClipboard text={row.value ?? ""} />
            ) : null}
          </>
        );
    }
  };

  return (
    <Box
      bgcolor="background.paper"
      id="card-details"
      padding={3}
      borderRadius={0.5}
    >
      <Typography id="card-title" variant="overline">
        {t(title)}
      </Typography>
      {customContent ?? null}
      <Box marginTop={rows.length > 0 ? 4 : 0} id="body-rows">
        {rows.map((row, index) => (
          <Grid
            container
            key={index}
            spacing={0}
            columnSpacing={2}
            marginTop={2}
            alignItems="center"
          >
            <Grid item xs={4}>
              <Typography variant="body2" noWrap>
                {t(row.label)}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {renderRowKind(row)}
              </Stack>
            </Grid>
          </Grid>
        ))}
      </Box>
      {cta ? (
        <Box id="card-cta" marginTop={4}>
          <NextLink
            href={cta.href}
            target={cta.target ?? "_self"}
            rel="noreferrer"
          >
            <ButtonNaked
              color="primary"
              endIcon={<ArrowForward />}
              size="small"
              sx={{ fontWeight: 700 }}
            >
              {t(cta.label)}
            </ButtonNaked>
          </NextLink>
        </Box>
      ) : null}
    </Box>
  );
};
