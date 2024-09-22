import React from "react";
import { Box, Typography, Button, Tooltip } from "@mui/material";

interface ConfirmationViewProps {
  amount: string;
  recipient: string;
  handleBack: () => void;
  handleExecute: () => void;
  tokenSymbol: string;
  tokenNetwork: string;
  tokenCanisterId: string;
  formattedAmount: string;
}

const ConfirmationView: React.FC<ConfirmationViewProps> = ({
  amount,
  recipient,
  handleBack,
  handleExecute,
  tokenSymbol,
  tokenNetwork,
  tokenCanisterId,
  formattedAmount,
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Transaction
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          Amount:{" "}
          <Tooltip
            title={tokenCanisterId ? `Canister ID: ${tokenCanisterId}` : ""}
          >
            <span>
              {formattedAmount} {tokenSymbol}
            </span>
          </Tooltip>
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          Network: {tokenNetwork.toUpperCase()}
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">Recipient: {recipient}</Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button onClick={handleBack} variant="outlined">
          Back
        </Button>
        <Button onClick={handleExecute} variant="contained" color="primary">
          Confirm
        </Button>
      </Box>
    </Box>
  );
};

export default ConfirmationView;
