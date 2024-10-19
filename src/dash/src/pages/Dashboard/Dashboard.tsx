import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  TextField,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import AccountPageLayout from "../VaultPageLayout";
import { useVaultDetail } from "../../contexts/VaultDetailContext";
import { formatIcp } from "../../util/units";

const Dashboard = () => {
  const { isLoading, error, nativeBalance, nativeAccountId } = useVaultDetail();

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
            {formatIcp(nativeBalance ?? 0n)} ICP
          </Typography>
        )}
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">ICP Address</Typography>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <TextField
            value={nativeAccountId}
            InputProps={{
              readOnly: true,
            }}
            fullWidth
            variant="outlined"
            size="small"
          />
          <IconButton size="small" sx={{ ml: 1 }}>
            <ContentCopy />
          </IconButton>
        </Box>
      </Box>
    </AccountPageLayout>
  );
};

export default Dashboard;
