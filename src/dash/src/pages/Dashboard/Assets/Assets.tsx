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
} from "@mui/material";
import { VisibilityOff } from "@mui/icons-material";

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

  const assets: Asset[] = [
    { name: "ICP", icon: "🔹", balance: "0,5 ICP", value: "$ 0" },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTokenVisibility = () => {
    setShowTokens(!showTokens);
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
                  <TableCell align="right">{asset.balance}</TableCell>
                  <TableCell align="right">{asset.value}</TableCell>
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
