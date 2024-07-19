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
  loading?: boolean;
};

/**
 * This loader render a fullscreen backdrop with a centered card, with text and loader icon
 */
export const LoaderFullscreen = ({
  title,
  content,
  loading = true
}: LoaderFullscreenProps) => {
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
          {loading ? (
            <Box
              data-testid="bo-io-fullscreen-loader"
              textAlign="center"
              marginTop={2}
            >
              <CircularProgress />
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Backdrop>
  );
};
