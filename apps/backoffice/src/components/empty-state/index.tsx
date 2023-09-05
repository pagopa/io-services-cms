import { Box, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useTranslation } from "next-i18next";
import NextLink from "next/link";

export type EmptyStateProps = {
  /** Descriptive label for empty state */
  emptyStateLabel: string;
  /** Call to action label for optional action button */
  ctaLabel: string;
  /** The path or URL to navigate to */
  ctaRoute: string;
};

export const EmptyState = ({ ...props }: EmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <Box padding={3} bgcolor={"#EEEEEE"}>
      <Box padding={3} bgcolor={"#FFFFFF"}>
        <Typography variant="body2" textAlign={"center"}>
          {t(props.emptyStateLabel)}{" "}
          <NextLink href={props.ctaRoute}>
            <ButtonNaked
              color="primary"
              size="medium"
              sx={{ verticalAlign: "unset" }}
            >
              {t(props.ctaLabel)}
            </ButtonNaked>
          </NextLink>
        </Typography>
      </Box>
    </Box>
  );
};
