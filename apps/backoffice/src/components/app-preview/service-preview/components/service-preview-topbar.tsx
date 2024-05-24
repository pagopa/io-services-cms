import { ArrowBack, QuestionMark } from "@mui/icons-material";
import { Box, Button } from "@mui/material";

/** Display App IO top navigation bar */
const ServicePreviewTopbar = () => {
  return (
    <Box
      height={56}
      flexDirection="row"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      paddingY={2}
      paddingX={3}
    >
      <Button
        variant="text"
        style={{
          height: 32,
          minWidth: 32,
          padding: 0,
          backgroundColor: "transparent"
        }}
      >
        <ArrowBack sx={{ fontSize: 32 }} />
      </Button>
      <Button
        variant="text"
        style={{
          height: 32,
          minWidth: 32,
          padding: 0,
          backgroundColor: "transparent"
        }}
      >
        <QuestionMark sx={{ fontSize: 32 }} />
      </Button>
    </Box>
  );
};

export default ServicePreviewTopbar;
