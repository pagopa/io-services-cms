import { ArrowForward } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import NextLink from "next/link";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";

import { CardBaseContainer, CardRowType, CardRows } from ".";

export interface CardDetailsCtaType {
  /** call to action function performed on button click */
  // eslint-disable-next-line @typescript-eslint/ban-types
  fn?: Function;
  /** call to action href */
  href?: string;
  /** call to action end icon */
  icon?: ReactNode;
  /** call to action label */
  label: string;
  /** href target */
  target?: "_blank" | "_self";
}

export interface CardDetailsProps {
  /** Call to action link placed in card footer */
  cta?: CardDetailsCtaType;
  /** If defined, render a custom card body content */
  customContent?: ReactNode;
  /** Array of label/value rows displayed as a list */
  rows: CardRowType[];
  /** Card title */
  title: string;
}

/**
 * Card used to show detailed general-purpose information.
 */
export const CardDetails = ({
  cta,
  customContent,
  rows,
  title,
}: CardDetailsProps) => {
  const { t } = useTranslation();

  const renderCallToActionButton = (cta: CardDetailsCtaType) => (
    <ButtonNaked
      color="primary"
      endIcon={cta.icon ?? <ArrowForward />}
      onClick={() => (cta.fn ? cta.fn() : null)}
      size="medium"
      sx={{ fontWeight: 700 }}
    >
      {t(cta.label)}
    </ButtonNaked>
  );

  /** render cta on card footer */
  const renderCallToAction = () => {
    if (cta)
      return (
        <Box id="card-cta" marginTop={4}>
          {cta.href ? (
            <NextLink
              href={cta.href}
              rel="noreferrer"
              target={cta.target ?? "_self"}
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
      <Box id="body-rows" marginTop={rows.length > 0 ? 4 : 0}>
        <CardRows rows={rows} />
      </Box>
      {renderCallToAction()}
    </CardBaseContainer>
  );
};
