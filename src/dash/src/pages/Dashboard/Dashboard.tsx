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
import { useNavigate, useParams } from "react-router-dom";
import { useInternetIdentity } from "../../hooks/use-internet-identity";
import { balanceOf } from "../../api/ledger";
import { AccountIdentifier, SubAccount } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { useVaultDetail } from "../../contexts/VaultDetailContext";

const Dashboard = () => {
  const { isLoading, error } = useVaultDetail();
  const { vaultId } = useParams();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [nativeBalance, setNativeBalance] = useState<bigint>();

  useEffect(() => {
    if (!identity) {
      return;
    }

    if (!vaultId) {
      navigate("/");
      return;
    }

    const zeroSubaccount = SubAccount.fromBytes(new Uint8Array(32));

    if (zeroSubaccount instanceof Error) {
      console.error("Could not create subaccount zero.");
      return;
    }

    const accountId = AccountIdentifier.fromPrincipal({
      principal: Principal.fromText(vaultId),
      subAccount: zeroSubaccount,
    });

    async function fetchNativeBalance() {
      const balance = await balanceOf(accountId.toUint8Array());
      setNativeBalance(balance.e8s);
    }

    fetchNativeBalance();
  }, [vaultId, identity]);

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
            XX ICP
          </Typography>
        )}
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">ICP Address</Typography>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <TextField
            value={""}
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
