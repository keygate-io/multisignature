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
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { VisibilityOff, Add, ContentCopy } from "@mui/icons-material";
import AddTokenModal from "./AddTokenModal";
import {
  getTokens,
  createIcrcAccount,
  getIcrcAccount,
} from "../../../api/account";
import { useAccount } from "../../../contexts/AccountContext";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { TokenData } from "../../../types/assets";
import { Principal } from "@dfinity/principal";
import { extractTokenData } from "../../../util/token";
import {
  getTokenBalance,
  getTokenDecimals,
  getTokenSymbol,
} from "../../../api/icrc";
import {
  base32ToBlob,
  blobToBase32,
  hexToBytes,
} from "../../../util/conversion";
import { formatIcp, formatIcrc } from "../../../util/units";
import { ICP_DECIMALS } from "../../../util/constants";

interface Asset {
  name: string;
  icon: string;
  balance: string;
  value: string;
  isIcrc: boolean;
  subaccount?: string;
  decimals: number;
}

interface TokenInfo {
  path: string;
  network: string;
  standard: string;
  principalId: string;
}

const Assets: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showTokens, setShowTokens] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { vaultCanisterId, icpBalance, icpSubaccount } = useAccount();
  const { identity } = useInternetIdentity();

  const icrcTokenInfo = async (tokenInfo: TokenInfo): Promise<Asset> => {
    const { principalId } = tokenInfo;
    let balance = "Unknown";

    const subaccountResult = await getIcrcAccount(
      vaultCanisterId!,
      Principal.fromText(principalId),
      identity!
    );

    if (!("Ok" in subaccountResult)) {
      throw new Error(
        `Error fetching subaccount for string ${principalId} : ${JSON.stringify(
          subaccountResult.Err
        )}`
      );
    }

    const rawBalance = await getTokenBalance(
      Principal.fromText(principalId),
      vaultCanisterId!
    );

    if (rawBalance === undefined) {
      throw new Error(`Error fetching balance for ${tokenInfo.path}:`);
    }

    balance = rawBalance.toString();

    const symbol = await getTokenSymbol(Principal.fromText(principalId));

    const decimals = await getTokenDecimals(Principal.fromText(principalId));

    if (decimals === undefined) {
      throw new Error(`Error fetching decimals for ${tokenInfo.path}:`);
    }

    return {
      name: `${symbol}`,
      icon: "🔸",
      balance,
      value: "N/A",
      isIcrc: true,
      decimals,
    };
  };

  const icTokenInfo = async (): Promise<Asset> => {
    const balance = icpBalance?.toString() || "Unknown";

    return {
      name: "ICP",
      icon: "🔹",
      balance,
      value: "N/A",
      isIcrc: false,
      subaccount: icpSubaccount!,
      decimals: ICP_DECIMALS,
    };
  };

  const fetchAssetInfo = async (
    tokenInfo: TokenInfo
  ): Promise<Asset | undefined> => {
    const { network, standard } = tokenInfo;

    try {
      if (tokenInfo.path.toLowerCase().includes("icp:native")) {
        return await icTokenInfo();
      } else {
        return await icrcTokenInfo(tokenInfo);
      }
    } catch (error) {
      console.error(`Error fetching asset info for ${tokenInfo.path}:`, error);
    }
  };

  const fetchAssets = async () => {
    if (vaultCanisterId && identity) {
      try {
        setLoading(true);
        const tokens = await getTokens(vaultCanisterId, identity);
        console.log("Tokens", tokens);
        const formattedAssets = await Promise.all(
          tokens.map(async (token) => {
            const tokenInfo = extractTokenData(token);
            const asset = await fetchAssetInfo(tokenInfo);
            return asset;
          })
        );
        setAssets(
          formattedAssets.filter((asset) => asset !== undefined) as Asset[]
        );
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [vaultCanisterId, identity, icpBalance]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTokenVisibility = () => {
    setShowTokens(!showTokens);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleAddToken = async (tokenData: TokenData) => {
    if (vaultCanisterId && identity) {
      try {
        const icrcAccount = await createIcrcAccount(
          vaultCanisterId,
          Principal.fromText(tokenData.address),
          identity
        );
        await fetchAssets();
      } catch (error) {
        console.error("Error creating ICRC account:", error);
      }
    }
  };

  const handleCopySubaccount = (subaccount: string) => {
    navigator.clipboard.writeText(subaccount);
    // Optionally, you can add a toast notification here to inform the user that the subaccount has been copied
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

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} textColor="inherit">
            <Tab label="Tokens" />
            <Tab label="NFTs" />
          </Tabs>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<VisibilityOff />}
            onClick={handleTokenVisibility}
          >
            {showTokens ? "Hide" : "Show"} token amounts
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenModal}
          >
            Add Token
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
                <TableCell align="center">Subaccount</TableCell>
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
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {showTokens
                      ? asset.isIcrc
                        ? formatIcrc(BigInt(asset.balance), asset.decimals)
                        : formatIcp(BigInt(asset.balance))
                      : "****"}
                  </TableCell>
                  <TableCell align="center">
                    {showTokens ? asset.value : "****"}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {asset.subaccount
                          ? asset.subaccount.slice(0, 6) +
                            "..." +
                            asset.subaccount.slice(-6)
                          : "Default"}
                      </Typography>
                      <Tooltip title={"Copy subaccount"}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleCopySubaccount(
                              asset.subaccount ||
                                "0000000000000000000000000000000000000000000000000000000000000000"
                            )
                          }
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <AddTokenModal
        open={modalOpen}
        handleClose={handleCloseModal}
        handleAddToken={handleAddToken}
      />
    </AccountPageLayout>
  );
};

export default Assets;
