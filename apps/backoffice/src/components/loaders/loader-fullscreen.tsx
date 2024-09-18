import {
  Backdrop,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";

export interface LoaderFullscreenProps {
  content: string;
  loading?: boolean;
  title: string;
}

/**
 * This loader render a fullscreen backdrop with a centered card, with text and loader icon
 */
export const LoaderFullscreen = ({
  content,
  loading = true,
  title,
}: LoaderFullscreenProps) => {
  const { t } = useTranslation();

  return (
    <Backdrop open>
      <Card sx={{ width: 300 }}>
        <CardContent>
          <Typography align="center" gutterBottom variant="h6">
            {t(title)}
          </Typography>
          <Typography align="center" variant="body2">
            {t(content)}
          </Typography>
          {loading ? (
            <Box
              data-testid="bo-io-loader-fullscreen"
              marginTop={2}
              textAlign="center"
            >
              <CircularProgress />
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Backdrop>
  );
};
