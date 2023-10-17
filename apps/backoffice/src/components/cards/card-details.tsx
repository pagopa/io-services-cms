import { ArrowForward } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import NextLink from "next/link";
import { ReactNode } from "react";
import { CardBaseContainer, CardRowType, CardRows } from ".";

export type CardDetailsCtaType = {
  /** call to action end icon */
  icon?: ReactNode;
  /** call to action label */
  label: string;
  /** call to action href */
  href?: string;
  /** href target */
  target?: "_blank" | "_self";
  /** call to action function performed on button click */
  fn?: Function;
};

export type CardDetailsProps = {
  /** Card title */
  title: string;
  /** Array of label/value rows displayed as a list */
  rows: CardRowType[];
  /** If defined, render a custom card body content */
  customContent?: ReactNode;
  /** Call to action link placed in card footer */
  cta?: CardDetailsCtaType;
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

  const renderCallToActionButton = (cta: CardDetailsCtaType) => (
    <Button
      variant="text"
      color="primary"
      endIcon={cta.icon ?? <ArrowForward />}
      size="small"
      sx={{ fontWeight: 700 }}
      onClick={() => (cta.fn ? cta.fn() : null)}
    >
      {t(cta.label)}
    </Button>
  );

  /** render cta on card footer */
  const renderCallToAction = () => {
    if (cta)
      return (
        <Box id="card-cta" marginTop={4}>
          {cta.href ? (
            <NextLink
              href={cta.href}
              target={cta.target ?? "_self"}
              rel="noreferrer"
            >
              {renderCallToActionButton(cta)}
            </NextLink>
          ) : (
            renderCallToActionButton(cta)
          )}
        </Box>
      );
  };

  return (
    <CardBaseContainer>
      <Typography id="card-title" variant="overline">
        {t(title)}
      </Typography>
      {customContent ?? null}
      <Box marginTop={rows.length > 0 ? 4 : 0} id="body-rows">
        <CardRows rows={rows} />
      </Box>
      {renderCallToAction()}
    </CardBaseContainer>
  );
};
