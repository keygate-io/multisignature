import React, { useState } from "react";
import AccountPageLayout from "../../AccountPageLayout";
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
} from "@mui/material";
import { VisibilityOff, Add } from "@mui/icons-material";
import AddTokenModal from "./AddTokenModal";
import { createIcrcAccount, createSubaccount } from "../../../api/account";
import { useAccount } from "../../../contexts/AccountContext";

interface Asset {
  name: string;
  icon: string;
  balance: string;
  value: string;
}

const Assets: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showTokens, setShowTokens] = useState(true);
  const [tokenList, setTokenList] = useState("Default tokens");
  const [currency, setCurrency] = useState("USD");
  const [assets, setAssets] = useState<Asset[]>([
    { name: "ICP", icon: "🔹", balance: "0,5 ICP", value: "$ 0" },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const { vaultCanisterId } = useAccount();

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

  const handleAddToken = async (tokenData: any) => {
    const newAsset: Asset = {
      name: tokenData.name,
      icon: "🔸", // You might want to use a different icon for custom tokens
      balance: "0 " + tokenData.symbol,
      value: "$ 0",
    };

    setAssets([...assets, newAsset]);

    const icrcAccount = await createIcrcAccount(
      vaultCanisterId!,
      tokenData.name
    );
    console.log(icrcAccount);
  };

  return (
    <AccountPageLayout>
      <Box sx={{ width: "100%" }}>
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

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="right">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.name}>
                  <TableCell component="th" scope="row">
                    {asset.icon} {asset.name}
                  </TableCell>
                  <TableCell align="right">
                    {showTokens ? asset.balance : "****"}
                  </TableCell>
                  <TableCell align="right">
                    {showTokens ? asset.value : "****"}
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
