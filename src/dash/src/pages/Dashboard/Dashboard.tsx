import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  TextField,
  Slider, createStyles
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import AccountPageLayout from "../VaultPageLayout";
import { useVaultDetail } from "../../contexts/VaultDetailContext";
import { useInternetIdentity } from "../../hooks/use-internet-identity";
import { formatIcp } from "../../util/units";
import { getThreshold, getSigners } from "../../api/account";

const Dashboard = () => {
  const { isLoading, error, nativeBalance, nativeAccountId, vaultCanisterId } = useVaultDetail();
  const { identity } = useInternetIdentity();
  const [currentApprovals, setCurrentApproval] = useState(1);
  const [totalApprovals, setTotalApprovals] = useState(1);
  const [requiredApprovals, setRequiredApprovals] = useState(1);

  // Generate marks with labels for each number in totalApprovals
  const marks = useMemo(() => {
    return Array.from({ length: totalApprovals }, (_, index) => ({
      value: index + 1,
      label: (index + 1).toString(),
    }));
  }, [totalApprovals, requiredApprovals]);

  const [currentPercentage, setCurrentPercentage] = useState(((currentApprovals - 1) / (totalApprovals - 1)) * 100);
  const [requiredPercentage, setRequiredPercentage] = useState(((requiredApprovals - 1) / (totalApprovals - 1)) * 100);

  useEffect(() => {
    if (!vaultCanisterId || !identity) { return; }
    getThreshold(vaultCanisterId, identity!).then((threshold) => {
      setRequiredApprovals(Number(threshold));
      setCurrentApproval(Number(threshold));
    });
    getSigners(vaultCanisterId, identity!).then((signers) => {
      setTotalApprovals(signers.length);
    })
  }, [vaultCanisterId]);

  useEffect(() => {
    setRequiredPercentage(((requiredApprovals - 1) / (totalApprovals - 1)) * 100);
    setCurrentPercentage(((currentApprovals - 1) / (totalApprovals - 1)) * 100);
  }, [currentApprovals, totalApprovals, requiredApprovals]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            {formatIcp(nativeBalance ?? 0n)} ICP
          </Typography>
        )}
      </Box>
      <Box sx={{
        mt: 4, backgroundColor: '#121212',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.09))',
        padding: '16px',
        borderRadius: '8px',
        color: 'white',
        width: '50%'
      }}>
        <Typography variant="h6">ICP Address</Typography>
        <Box sx={{
          display: "flex", alignItems: "center", mt: 1,
        }}>
          <TextField
            value={nativeAccountId}
            InputProps={{
              readOnly: true,
            }}
            fullWidth
            variant="outlined"
            size="small"
          />
          <IconButton
            size="small"
            sx={{ ml: 1 }}
            onClick={() => copyToClipboard(nativeAccountId)}
          >
            <ContentCopy />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ backgroundColor: '#121212', width: '50%', backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.09))', padding: '16px', borderRadius: '8px', color: 'white', marginTop: '10px' }}>
        <Typography variant="h6" gutterBottom>Approval threshold</Typography>
        {currentApprovals === 1 && totalApprovals === 1 ? (
          <Typography gutterBottom sx={{ marginTop: "15px" }}>No other signers have been added to the vault.</Typography>
        ) : (
          <Box>
            <Typography gutterBottom><span style={{ fontWeight: 900 }}>{requiredApprovals}</span> of <span style={{ fontWeight: 900 }}>{totalApprovals}</span> approvals are required to initiate transactions and changes to Keygate Vault settings.</Typography>
            <Slider
              value={currentApprovals}
              min={1}
              max={totalApprovals}
              marks={marks}
              step={1}

              sx={{
                color: '#2c2c2c',
                '& .MuiSlider-thumb': { display: 'none' },
                '& .MuiSlider-rail': {
                  height: '10px', opacity: 0.6, background: `linear-gradient(to right, 
                            #90caf9 0%,
                            #90caf9 ${currentPercentage}%,
                            #ce93d8 ${currentPercentage}%, 
                            #ce93d8 ${requiredPercentage}%, 
                            #1E1E1E ${requiredPercentage}%)`,

                },
                '& .MuiSlider-track': {
                  display: 'none'
                },
                '& .MuiSlider-mark': { height: '10px', backgroundColor: '#121212', backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.09))' },

              }}
            />
          </Box>
        )}
      </Box>
    </AccountPageLayout >
  );
};

export default Dashboard;
