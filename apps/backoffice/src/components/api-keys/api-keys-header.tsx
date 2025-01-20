import { Typography } from "@mui/material";
import { useTranslation } from "next-i18next";

export interface ApiKeysHeaderProps {
  /** Main component card description */
  description?: string;
  /** Main component card title */
  title?: string;
}

/** API Keys header component */
export const ApiKeysHeader = ({ description, title }: ApiKeysHeaderProps) => {
  const { t } = useTranslation();

  return (
    <>
      {title && <Typography variant="h6">{t(title)}</Typography>}
      {description && (
        <Typography
          color="text.secondary"
          marginBottom={3}
          marginTop={1}
          variant="body2"
        >
          {t(description)}
        </Typography>
      )}
    </>
  );
};
