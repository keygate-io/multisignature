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
  Paper,
} from "@mui/material";
import {
  Send as SendIcon,
  SwapHoriz as SwapIcon,
  AccountBalanceWallet as WalletIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { useAccount } from "../../../contexts/AccountContext";
import AccountPageLayout from "../../VaultPageLayout";
import { getIntents } from "../../../api/account";
import { Principal } from "@dfinity/principal";
import {
  Intent,
  IntentStatus,
} from "../../../../../declarations/account/account.did";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";

const Transactions: React.FC = () => {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const { icpSubaccount, vaultCanisterId } = useAccount();
  const { identity } = useInternetIdentity();

  useEffect(() => {
    const fetchIntents = async () => {
      if (icpSubaccount) {
        setIsLoading(true);
        try {
          const fetchedIntents = await getIntents(vaultCanisterId!, identity!);
          setIntents(fetchedIntents || []);
        } catch (error) {
          console.error("Error fetching intents:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchIntents();
  }, [icpSubaccount, vaultCanisterId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderIntentIcon = (type: { [key: string]: null }) => {
    if ("Transfer" in type) {
      return <SendIcon sx={{ color: "white" }} />;
    } else if ("Swap" in type) {
      return <SwapIcon sx={{ color: "white" }} />;
    } else {
      return <WalletIcon sx={{ color: "white" }} />;
    }
  };

  const formatAmount = (amount: bigint, token: string) => {
    const formattedAmount = Number(amount) / 100000000;
    return `${formattedAmount.toFixed(8)} ${token}`;
  };

  const getIntentStatus = (status: IntentStatus): string => {
    if ("Pending" in status) return "Pending";
    if ("InProgress" in status) return "InProgress";
    if ("Completed" in status) return "Completed";
    if ("Rejected" in status) return "Rejected";
    if ("Failed" in status) return "Failed";
    return "Unknown";
  };

  const renderContent = () => {
    if (isLoading) {
      return <Typography>Loading...</Typography>;
    }

    if (intents.length === 0) {
      return (
        <Paper
          sx={{
            p: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <InfoIcon sx={{ fontSize: 48 }} />
            <Typography variant="h6">No transactions found</Typography>
          </Box>
        </Paper>
      );
    }

    return (
      <List>
        {intents.map((intent, index) => (
          <React.Fragment key={index.toString()}>
            {index > 0 && <Divider component="li" />}
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
                      {Object.keys(intent.intent_type)[0]}
                    </Typography>
                    <Typography component="span" sx={{ color: "white" }}>
                      {formatAmount(intent.amount, intent.token)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography variant="body2">From: {intent.from}</Typography>
                    <Typography variant="body2">To: {intent.to}</Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Chip
                        label={Object.keys(intent.network)[0]}
                        size="small"
                      />
                      <Chip
                        label={getIntentStatus(intent.status)}
                        size="small"
                      />
                    </Box>
                  </React.Fragment>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
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
        {renderContent()}
      </Box>
    </AccountPageLayout>
  );
};

export default Transactions;
