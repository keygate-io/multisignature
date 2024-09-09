import React from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import { ArrowBack, ContentCopy, OpenInNew } from "@mui/icons-material";

interface ConfirmationViewProps {
  amount: string;
  recipient: string;
  handleBack: () => void;
  handleExecute: () => void;
}

const ConfirmationView: React.FC<ConfirmationViewProps> = ({
  amount,
  recipient,
  handleBack,
  handleExecute,
}) => (
  <>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Send tokens
    </Typography>

    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="gray">
        Send:
      </Typography>
      <Typography variant="body1">ICP {amount}</Typography>
    </Box>

    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="gray">
        To:
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="body1" sx={{ flex: 1, overflow: "hidden" }}>
          {recipient}
        </Typography>
        <IconButton size="small" sx={{ color: "gray" }}>
          <ContentCopy />
        </IconButton>
        <IconButton size="small" sx={{ color: "gray" }}>
          <OpenInNew />
        </IconButton>
      </Box>
    </Box>

    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack}>
        Back
      </Button>
      <Button variant="contained" onClick={handleExecute}>
        Execute
      </Button>
    </Box>
  </>
);

export default ConfirmationView;
