import { ArrowBack, QuestionMark } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
type Props = {};

const ServicePreviewTopbar = ({}: Props) => {
  return (
    <Box
      height={56}
      flexDirection="row"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      marginBottom="10px"
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
