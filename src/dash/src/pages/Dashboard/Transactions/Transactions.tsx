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
import { getIntents } from "../../../api/account";
import { Principal } from "@dfinity/principal";
import {
  Intent,
  IntentStatus,
} from "../../../../../declarations/account/account.did";

const Transactions: React.FC = () => {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const { icpSubaccount, vaultCanisterId } = useAccount();

  useEffect(() => {
    const fetchIntents = async () => {
      if (icpSubaccount) {
        setIsLoading(true);
        try {
          console.log({ icpSubaccount });
          const fetchedIntents = await getIntents(vaultCanisterId!);
          console.log({ fetchedIntents });
          setIntents(fetchedIntents);
        } catch (error) {
          console.error("Error fetching intents:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchIntents();
  }, [icpSubaccount]);

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
    // Adjust this based on your token's decimal places
    const formattedAmount = Number(amount) / 100000000; // Assuming 8 decimal places for ICP
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
        {isLoading ? (
          <Typography sx={{ color: "white" }}>Loading...</Typography>
        ) : (
          <List>
            {intents.map((intent, index) => (
              <React.Fragment key={intent.id.toString()}>
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
                          {Object.keys(intent.intent_type)[0]}
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
                            label={Object.keys(intent.network)[0]}
                            size="small"
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              color: "white",
                            }}
                          />
                          <Chip
                            label={getIntentStatus(intent.status)}
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
        )}
      </Box>
    </AccountPageLayout>
  );
};

export default Transactions;
