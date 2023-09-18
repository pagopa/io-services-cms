import {
  Backdrop,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";

export type LoaderFullscreenProps = {
  title: string;
  content: string;
};

/**
 * This loader render a fullscreen backdrop with a centered card, with text and loader icon
 */
export const LoaderFullscreen = ({ title, content }: LoaderFullscreenProps) => {
  const { t } = useTranslation();

  return (
    <Backdrop open>
      <Card sx={{ width: 300 }}>
        <CardContent>
          <Typography variant="h6" align="center" gutterBottom>
            {t(title)}
          </Typography>
          <Typography variant="body2" align="center">
            {t(content)}
          </Typography>
          <Box textAlign="center" marginTop={2}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    </Backdrop>
  );
};
