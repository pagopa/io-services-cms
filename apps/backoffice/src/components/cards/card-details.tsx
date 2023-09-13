import { ArrowForward } from "@mui/icons-material";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import NextLink from "next/link";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CopyToClipboard } from "../copy-to-clipboard";

export type CardDetailsRowType = {
  /** row label, shown on left */
  label: string;
  /** row value, shown on right */
  value: string;
  /** If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis.
   * _(This is the default behaviour)_ */
  noWrap?: boolean;
  /** If true, a *""copy to clipboard"* icon is shown on right side of *value* */
  copyableValue?: boolean;
  /** row value kind, useful for some specific render modes */
  kind?: CardDetailsRowValueType;
};

export type CardDetailsRowValueType = "link" | "markdown";

export type CardDetailsProps = {
  /** Card title */
  title: string;
  /** Array of label/value rows displayed as a list */
  rows: CardDetailsRowType[];
  /** If defined, render a custom card body content */
  body?: ReactNode;
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
export const CardDetails = ({ title, rows, body, cta }: CardDetailsProps) => {
  const { t } = useTranslation();

  const renderValue = (value: string, kind?: CardDetailsRowValueType) => {
    switch (kind) {
      case "link":
        return (
          <NextLink href={value} target="_blank" rel="noreferrer">
            {value}
          </NextLink>
        );
      case "markdown":
        // todo: to be implemented
        return <span>{value}</span>;
      default:
        return value;
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
        {title}
      </Typography>
      {body ?? null}
      <Box marginTop={rows.length > 0 ? 4 : 0} id="body-rows">
        {rows.map((row, index) => (
          <Grid
            container
            key={index}
            spacing={0}
            columnSpacing={2}
            marginTop={2}
          >
            <Grid item xs={4}>
              <Typography variant="body2" noWrap>
                {t(row.label)}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Stack direction="row" alignItems={"center"} spacing={0.5}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  noWrap={row.noWrap ?? true}
                  color={row.kind === "link" ? "primary" : "text"}
                >
                  {renderValue(row.value, row.kind)}
                </Typography>
                {row.copyableValue ? (
                  <CopyToClipboard text={row.value} />
                ) : null}
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
