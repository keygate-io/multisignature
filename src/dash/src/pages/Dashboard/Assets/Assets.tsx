import React, { useState, useEffect } from "react";
import AccountPageLayout from "../../VaultPageLayout";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { VisibilityOff, ContentCopy } from "@mui/icons-material";
import { getBalance, getIcrcAccount, pubkeyBytesToAddress } from "../../../api/account";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { Principal } from "@dfinity/principal";
import {
  getTokenBalance,
  getTokenDecimals,
  getTokenSymbol,
} from "../../../api/icrc";
import { formatIcp, formatIcrc } from "../../../util/units";
import {
  CKETH_CANISTER_ID,
  CKUSDC_CANISTER_ID,
  ICP_DECIMALS,
  CKBTC_CANISTER_ID,
  MOCK_ICRC1_CANISTER,
} from "../../../util/constants";
import { useVaultDetail } from "../../../contexts/VaultDetailContext";
import { ICRC1_LEDGER_CANISTER_ID } from "../../../util/config";

interface Asset {
  name: string;
  icon: string;
  balance: string;
  value: string;
  isIcrc: boolean;
  address: string;
  subaccount?: string;
  decimals: number;
}

const Assets: React.FC = () => {
  const [showTokens, setShowTokens] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const { identity } = useInternetIdentity();
  const { vaultCanisterId, nativeAccountId, nativeBalance } = useVaultDetail();



  const fetchNativeEthInfo = async (): Promise<Asset> => {
    let balance = "Unknown";

    const rawBalance = await getBalance(vaultCanisterId, "eth", identity!);
    if (rawBalance === undefined) {
      throw new Error(`Error fetching balance for ETH`);
    }

    const address = await pubkeyBytesToAddress(vaultCanisterId, identity!);

    balance = (Number(rawBalance) / Math.pow(10, 18)).toString();
    return {
      name: "ETH",
      icon: "🔸",
      balance: balance,
      value: "N/A",
      isIcrc: false,
      address,
      decimals: 18,
    };
  }

  const fetchIcrcTokenInfo = async (canisterId: string): Promise<Asset> => {
    let balance = "Unknown";

    const subaccountResult = await getIcrcAccount(
      vaultCanisterId!,
      Principal.fromText(canisterId),
      identity!
    );

    console.log("subaccountResult", subaccountResult);

    const rawBalance = await getTokenBalance(
      Principal.fromText(canisterId),
      vaultCanisterId!
    );

    if (rawBalance === undefined) {
      throw new Error(`Error fetching balance for ${canisterId}`);
    }

    balance = rawBalance.toString();

    const symbol = await getTokenSymbol(Principal.fromText(canisterId));

    const decimals = await getTokenDecimals(Principal.fromText(canisterId));

    if (decimals === undefined) {
      throw new Error(`Error fetching decimals for ${canisterId}`);
    }

    return {
      name: `${symbol}`,
      icon: "🔸",
      balance: formatIcrc(BigInt(balance), decimals),
      value: "N/A",
      isIcrc: true,
      address: 'N/A',
      decimals,
    };
  };

  const fetchNativeIcpInfo = async (): Promise<Asset> => {
    const balance = nativeBalance?.toString() || "0";

    return {
      name: "ICP",
      icon: "🔹",
      balance: formatIcp(nativeBalance || 0n),
      value: "N/A",
      isIcrc: false,
      address: "N/A",
      decimals: ICP_DECIMALS,
    };
  };

  const fetchAssets = async () => {
    if (vaultCanisterId && identity) {
      try {
        const nativeIcp = await fetchNativeIcpInfo();

        if (process.env.DFX_NETWORK === "ic") {
          const ckBTC = await fetchIcrcTokenInfo(CKBTC_CANISTER_ID);
          const ckETH = await fetchIcrcTokenInfo(CKETH_CANISTER_ID);
          const ckusdc = await fetchIcrcTokenInfo(CKUSDC_CANISTER_ID);

          setAssets([nativeIcp, ckBTC, ckETH, ckusdc]);
        } else {
          //const mockIcrc1 = await fetchIcrcTokenInfo(MOCK_ICRC1_CANISTER);
          // const nativeEth = await fetchNativeEthInfo();
          setAssets([nativeIcp]); //add mockIcrc1 when uncommented
        }
      } catch (error) {
        console.error("Error fetching assets:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [vaultCanisterId, identity, nativeAccountId]);

  const handleTokenVisibility = () => {
    setShowTokens(!showTokens);
  };

  const handleCopySubaccount = (subaccount: string) => {
    navigator.clipboard.writeText(subaccount);
    // Optionally, add a toast notification here
  };

  if (loading) {
    return (
      <AccountPageLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </Box>
      </AccountPageLayout>
    );
  }

  return (
    <AccountPageLayout>
      <Box sx={{ width: "100%", color: "text.primary" }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Assets
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<VisibilityOff />}
            onClick={handleTokenVisibility}
          >
            {showTokens ? "Hide" : "Show"} token amounts
          </Button>
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 0,
            "& .MuiPaper-root": { borderRadius: 0 },
            marginTop: 4,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell align="center">Balance</TableCell>
                <TableCell align="center">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map((asset) => (
                <TableRow
                  key={asset.name}
                  sx={{
                    "&:last-child td, &:last-child th": {
                      border: 0,
                    },
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={asset.isIcrc ? "ICRC" : "Native"}
                        size="small"
                        color={asset.isIcrc ? "primary" : "secondary"}
                      />
                      {asset.name}
                      {asset.address !== "N/A" && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            ({asset.address})
                          </Typography>
                          <Tooltip title="Copy address">
                            <IconButton
                              size="small"
                              onClick={() => navigator.clipboard.writeText(asset.address)}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {showTokens ? asset.balance : "****"}
                  </TableCell>
                  <TableCell align="center">
                    {showTokens ? asset.value : "****"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </AccountPageLayout>
  );
};

export default Assets;
