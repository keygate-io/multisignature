import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  TextField,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import AccountPageLayout from "../AccountPageLayout";
import { useAccount } from "../../contexts/AccountContext";
import { ICP_DECIMALS } from "../../util/constants";
import { formatIcp } from "../../util/units";

const Dashboard = () => {
  const {
    icpSubaccount: icpAccount,
    icpBalance: balance,
    isLoading,
    error,
  } = useAccount();

  const handleCopy = () => {
    if (icpAccount) {
      navigator.clipboard.writeText(icpAccount);
    }
  };

  return (
    <AccountPageLayout>
      <Typography variant="h5">Total asset value</Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {isLoading ? (
          <CircularProgress size={24} sx={{ mr: 2 }} />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Typography variant="h3" fontWeight="bold">
            {formatIcp(balance)} ICP
          </Typography>
        )}
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">ICP Address</Typography>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <TextField
            value={icpAccount || ""}
            InputProps={{
              readOnly: true,
              style: {
                fontFamily: "monospace",
                fontSize: "0.8rem",
                backgroundColor: "#f0f0f0",
              },
            }}
            fullWidth
            variant="outlined"
            size="small"
          />
          <IconButton onClick={handleCopy} size="small" sx={{ ml: 1 }}>
            <ContentCopy />
          </IconButton>
        </Box>
      </Box>
    </AccountPageLayout>
  );
};

export default Dashboard;
