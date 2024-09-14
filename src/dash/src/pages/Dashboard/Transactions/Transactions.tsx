import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
} from "@mui/material";
import {
  Send as SendIcon,
  SwapHoriz as SwapIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { useAccount } from "../../../contexts/AccountContext";
import AccountPageLayout from "../../AccountPageLayout";

interface Intent {
  id: number;
  intent_type: "Swap" | "Transfer";
  amount: number;
  token: string;
  to: string;
  from: string;
  network: "ICP" | "ETH";
  status: "Pending" | "InProgress" | "Completed" | "Rejected" | "Failed";
}

const Transactions: React.FC = () => {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const { icpSubaccount } = useAccount();

  useEffect(() => {
    const fetchIntents = async () => {
      setIsLoading(true);
      // Replace this with actual API call when available
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIntents([
        {
          id: 1,
          intent_type: "Transfer",
          amount: 1000000, // Assuming amount is in smallest units
          token: "ICP",
          to: "0xA1da...102B",
          from: "0xB2eb...304C",
          network: "ICP",
          status: "Pending",
        },
        {
          id: 2,
          intent_type: "Swap",
          amount: 5000000,
          token: "ICP",
          to: "0xC3fc...506D",
          from: "0xD4gd...708E",
          network: "ICP",
          status: "Completed",
        },
        // Add more mock intents as needed
      ]);
      setIsLoading(false);
    };

    fetchIntents();
  }, [icpSubaccount]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderIntentIcon = (type: "Swap" | "Transfer") => {
    switch (type) {
      case "Transfer":
        return <SendIcon sx={{ color: "white" }} />;
      case "Swap":
        return <SwapIcon sx={{ color: "white" }} />;
      default:
        return <WalletIcon sx={{ color: "white" }} />;
    }
  };

  const formatAmount = (amount: number, token: string) => {
    // Adjust this based on your token's decimal places
    const formattedAmount = amount / 100000000; // Assuming 8 decimal places for ICP
    return `${formattedAmount.toFixed(8)} ${token}`;
  };

  return (
    <AccountPageLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ color: "white" }}>
          Transactions
        </Typography>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "rgba(255, 255, 255, 0.12)",
            mb: 2,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            textColor="inherit"
            sx={{
              "& .MuiTab-root": { color: "white" },
              "& .Mui-selected": { color: "primary.main" },
            }}
          >
            <Tab label="Queue" />
            <Tab label="History" />
          </Tabs>
        </Box>
        <List>
          {intents.map((intent, index) => (
            <React.Fragment key={intent.id}>
              {index > 0 && (
                <Divider
                  component="li"
                  sx={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
                />
              )}
              <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                <ListItemIcon>
                  {renderIntentIcon(intent.intent_type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body1" sx={{ color: "white" }}>
                        {intent.intent_type}
                      </Typography>
                      <Typography component="span" sx={{ color: "white" }}>
                        {formatAmount(intent.amount, intent.token)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        From: {intent.from}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        To: {intent.to}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 1,
                        }}
                      >
                        <Chip
                          label={intent.network}
                          size="small"
                          sx={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            color: "white",
                          }}
                        />
                        <Chip
                          label={intent.status}
                          size="small"
                          sx={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            color: "white",
                          }}
                        />
                      </Box>
                    </React.Fragment>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Box>
    </AccountPageLayout>
  );
};

export default Transactions;
