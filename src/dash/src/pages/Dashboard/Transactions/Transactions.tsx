import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
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
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
} from "@mui/icons-material";
import AccountPageLayout from "../../VaultPageLayout";
import {
  IntentStatus,
  Transaction,
  ProposedTransaction,
} from "../../../../../declarations/account/account.did";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { useVaultDetail } from "../../../contexts/VaultDetailContext";
import { TOKEN_URN_TO_SYMBOL } from "../../../util/constants";
import {
  getTransactions,
  getProposedTransactions,
  getThreshold,
} from "../../../api/account";
import { Principal } from "@dfinity/principal";

type TransactionKey = string;
type UnifiedTransaction = (Transaction | ProposedTransaction) & {
  type: "proposed" | "executed";
};

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [threshold, setThreshold] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const { vaultCanisterId, nativeAccountId } = useVaultDetail();
  const { identity } = useInternetIdentity();

  const getTransactionKey = (
    tx: Transaction | ProposedTransaction
  ): TransactionKey => {
    return `${tx.amount}_${tx.token}_${tx.to}_${
      Object.keys(tx.transaction_type)[0]
    }`;
  };

  const deduplicateTransactions = (
    executed: Transaction[],
    proposed: ProposedTransaction[]
  ): UnifiedTransaction[] => {
    const transactionMap = new Map<TransactionKey, UnifiedTransaction>();

    executed.forEach((tx) => {
      const key = getTransactionKey(tx);
      if (!transactionMap.has(key) || (tx.status && "Failed" in tx.status)) {
        transactionMap.set(key, { ...tx, type: "executed" });
      }
    });

    proposed.forEach((tx) => {
      const key = getTransactionKey(tx);
      if (!transactionMap.has(key)) {
        transactionMap.set(key, { ...tx, type: "proposed" });
      }
    });

    return Array.from(transactionMap.values()).sort((a, b) => {
      const aTime = "timestamp" in a ? Number(a.timestamp) : Date.now();
      const bTime = "timestamp" in b ? Number(b.timestamp) : Date.now();
      return bTime - aTime;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (vaultCanisterId && nativeAccountId) {
        setIsLoading(true);
        try {
          const [executed, proposed, thresholdValue] = await Promise.all([
            getTransactions(vaultCanisterId, identity!),
            getProposedTransactions(vaultCanisterId, identity!),
            getThreshold(vaultCanisterId, identity!),
          ]);
          const dedupedTransactions = deduplicateTransactions(
            executed.reverse(),
            proposed
          );
          setTransactions(dedupedTransactions);
          setThreshold(thresholdValue);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [vaultCanisterId, nativeAccountId, identity]);

  const renderIntentIcon = (type: { [key: string]: null }) => {
    if ("Transfer" in type) return <SendIcon sx={{ color: "white" }} />;
    if ("Swap" in type) return <SwapIcon sx={{ color: "white" }} />;
    return <WalletIcon sx={{ color: "white" }} />;
  };

  const formatAmount = (amount: number, token: string) => {
    return `${amount.toFixed(4).toLocaleString()} ${
      TOKEN_URN_TO_SYMBOL[token]
    }`;
  };

  const getIntentStatus = (status: IntentStatus): string => {
    if ("Pending" in status) return "Pending";
    if ("InProgress" in status) return "InProgress";
    if ("Completed" in status) return "Completed";
    if ("Rejected" in status) return "Rejected";
    if ("Failed" in status) return "Failed";
    return "Unknown";
  };

  const renderSignersInfo = (signers: Principal[], rejections: Principal[]) => {
    return (
      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
          {signers.map((signer, index) => (
            <Chip
              key={`signer-${index}`}
              icon={<ApprovedIcon sx={{ fontSize: 16 }} />}
              label={signer.toString().slice(0, 8) + "..."}
              size="small"
              sx={{
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                borderColor: "success.main",
                color: "success.main",
              }}
              variant="outlined"
            />
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {rejections.map((rejector, index) => (
            <Chip
              key={`rejector-${index}`}
              icon={<RejectedIcon sx={{ fontSize: 16 }} />}
              label={rejector.toString().slice(0, 8) + "..."}
              size="small"
              sx={{
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                borderColor: "error.main",
                color: "error.main",
              }}
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
    );
  };

  const renderTransactionsList = () => {
    if (transactions.length === 0) {
      return (
        <Paper sx={{ p: 3 }}>
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
        {transactions.map((transaction, index) => (
          <React.Fragment key={getTransactionKey(transaction) + index}>
            {index > 0 && <Divider component="li" />}
            <ListItem alignItems="flex-start" sx={{ py: 2 }}>
              <ListItemIcon>
                {renderIntentIcon(transaction.transaction_type)}
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1" sx={{ color: "white" }}>
                        {Object.keys(transaction.transaction_type)[0]}
                      </Typography>
                      <Chip
                        label={
                          transaction.type === "proposed"
                            ? "Proposed"
                            : "Executed"
                        }
                        size="small"
                        color={
                          transaction.type === "proposed"
                            ? "primary"
                            : "default"
                        }
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Typography component="span" sx={{ color: "white" }}>
                      {formatAmount(transaction.amount, transaction.token)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography variant="body2">
                      To: {transaction.to}
                    </Typography>
                    {transaction.type === "proposed" &&
                      "signers" in transaction && (
                        <>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Proposal ID: {transaction.id.toString()}
                          </Typography>
                          {renderSignersInfo(
                            transaction.signers,
                            transaction.rejections
                          )}
                        </>
                      )}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Chip
                        label={Object.keys(transaction.network)[0]}
                        size="small"
                      />
                      {transaction.type === "proposed" &&
                      "signers" in transaction ? (
                        <Chip
                          label={`${
                            transaction.signers.length
                          }/${threshold.toString()} signatures`}
                          size="small"
                          color={
                            transaction.signers.length >= Number(threshold)
                              ? "success"
                              : "default"
                          }
                        />
                      ) : (
                        transaction.type === "executed" &&
                        "status" in transaction && (
                          <Chip
                            label={getIntentStatus(transaction.status)}
                            size="small"
                            color={
                              "Failed" in transaction.status
                                ? "error"
                                : "default"
                            }
                          />
                        )
                      )}
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
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : (
          renderTransactionsList()
        )}
      </Box>
    </AccountPageLayout>
  );
};

export default Transactions;
