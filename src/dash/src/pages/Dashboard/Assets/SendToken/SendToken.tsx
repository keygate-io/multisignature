import React, { useState, useCallback, useEffect } from "react";
import AccountPageLayout from "../../../VaultPageLayout";
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  SelectChangeEvent,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import { Buffer } from "buffer";
import { useInternetIdentity } from "../../../../hooks/use-internet-identity";
import { getTokenSymbol, getTokenDecimals } from "../../../../api/icrc";
import { Principal } from "@dfinity/principal";
import { extractTokenData } from "../../../../util/token";
import { formatCommaSeparated, icpToE8s } from "../../../../util/units";
import {
  CKETH_CANISTER_ID,
  CKBTC_CANISTER_ID,
  CKUSDC_CANISTER_ID,
  ICP_DECIMALS,
  TOKEN_URN_TO_SYMBOL,
  MOCK_ICRC1_CANISTER,
} from "../../../../util/constants";
import { useVaultDetail } from "../../../../contexts/VaultDetailContext";
import { useNavigate } from "react-router-dom";
import { TransactionRequest } from "../../../../../../declarations/account/account.did";
import {
  executeTransaction,
  proposeTransaction,
  getThreshold,
} from "../../../../api/account";
import ConfirmationView from "./ConfirmationView";

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

// SendForm component
interface SendFormProps {
  recipient: string;
  amount: string;
  token: string;
  tokens: Array<{
    urn: string;
    symbol: string;
    decimals: number;
    network: string;
    canisterId?: string;
  }>;
  handleRecipientChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTokenChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleNext: () => void;
}

const SendForm: React.FC<SendFormProps> = ({
  recipient,
  amount,
  token,
  tokens,
  handleRecipientChange,
  handleAmountChange,
  handleTokenChange,
  handleNext,
}) => {
  return (
    <Box component="form" noValidate autoComplete="off">
      <TextField
        fullWidth
        label="Recipient"
        value={recipient}
        onChange={handleRecipientChange}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Amount"
        type="number"
        value={amount}
        onChange={handleAmountChange}
        margin="normal"
      />
      <TextField
        select
        fullWidth
        label="Token"
        value={token}
        onChange={handleTokenChange}
        margin="normal"
      >
        {tokens.map((option) => (
          <MenuItem key={option.urn} value={option.urn}>
            {option.symbol}
          </MenuItem>
        ))}
      </TextField>
      <Button
        variant="contained"
        color="primary"
        onClick={handleNext}
        fullWidth
        sx={{ mt: 2 }}
      >
        Next
      </Button>
    </Box>
  );
};

// Main SendToken component
const SendToken: React.FC = () => {
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [token, setToken] = useState<string>("icp:native");
  const [tokens, setTokens] = useState<
    Array<{
      urn: string;
      symbol: string;
      decimals: number;
      network: string;
      canisterId?: string;
    }>
  >([]);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { identity } = useInternetIdentity();
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [tokenNetwork, setTokenNetwork] = useState<string>("");
  const [tokenCanisterId, setTokenCanisterId] = useState<string>("");
  const [tokenDecimals, setTokenDecimals] = useState<number>(ICP_DECIMALS);
  const [formattedAmount, setFormattedAmount] = useState<string>("");
  const { vaultCanisterId, nativeAccountId } = useVaultDetail();
  const navigate = useNavigate();

  const handleRecipientChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRecipient(event.target.value);
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const handleTokenChange = (event: SelectChangeEvent<string>) => {
    const selectedToken = tokens.find((t) => t.urn === event.target.value);
    if (selectedToken) {
      setToken(selectedToken.urn);
      setTokenSymbol(selectedToken.symbol);
      setTokenNetwork(selectedToken.network);
      setTokenCanisterId(selectedToken.canisterId || "");
      setTokenDecimals(selectedToken.decimals);
    }
  };

  const handleNext = () => {
    setShowConfirmation(true);
    setCurrentStep(1);
  };

  const handleBack = () => {
    setShowConfirmation(false);
    setCurrentStep(0);
  };

  const handleExecute = useCallback(async () => {
    if (!vaultCanisterId || !nativeAccountId) {
      setError("Account information is missing");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const intent = {
        amount: Number(amount),
        token,
        to: recipient,
        network: token.toLowerCase().includes("eth")
          ? { ETH: null }
          : { ICP: null },
        transaction_type: { Transfer: null },
        from: nativeAccountId,
      };

      setCurrentStep(2);

      console.log("proposing transaction", intent);

      const proposedTx = await proposeTransaction(
        vaultCanisterId,
        intent,
        identity!
      );

      const threshold = await getThreshold(vaultCanisterId, identity!);
      if (threshold <= BigInt(1)) {
        await executeTransaction(vaultCanisterId, proposedTx.id, identity!);
      }

      navigate(`/vaults/${vaultCanisterId}/transactions`);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(`An error occurred: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [vaultCanisterId, nativeAccountId, amount, token, recipient, identity]);

  useEffect(() => {
    async function fetchTokens() {
      if (!vaultCanisterId || !identity) return;

      try {
        setIsLoading(true);
        const tokenList = [];

        // Add ICP native token
        tokenList.push({
          urn: "icp:native",
          symbol: "ICP",
          decimals: ICP_DECIMALS,
          network: "ICP",
        });

        if (process.env.DFX_NETWORK === "ic") {
          // Fetch ICRC token info
          const icrcTokens = [
            {
              urn: `icp:icrc1:${CKETH_CANISTER_ID}`,
              canisterId: CKETH_CANISTER_ID,
            },
            {
              urn: `icp:icrc1:${CKBTC_CANISTER_ID}`,
              canisterId: CKBTC_CANISTER_ID,
            },
            {
              urn: `icp:icrc1:${CKUSDC_CANISTER_ID}`,
              canisterId: CKUSDC_CANISTER_ID,
            },
          ];

          for (const token of icrcTokens) {
            try {
              const principal = Principal.fromText(token.canisterId);
              const [symbol, decimals] = await Promise.all([
                getTokenSymbol(principal),
                getTokenDecimals(principal),
              ]);

              if (symbol && decimals !== undefined) {
                tokenList.push({
                  urn: token.urn,
                  symbol,
                  decimals,
                  network: "ICP",
                  canisterId: token.canisterId,
                });
              }
            } catch (err) {
              console.error(`Failed to load token ${token.canisterId}:`, err);
              // Skip this token and continue with others
              continue;
            }
          }
        } else {
          // Local development tokens
          tokenList.push({
            urn: "eth:native",
            symbol: "ETH",
            decimals: 18,
            network: "ETH",
          });

          try {
            const mockPrincipal = Principal.fromText(MOCK_ICRC1_CANISTER);
            const [symbol, decimals] = await Promise.all([
              getTokenSymbol(mockPrincipal),
              getTokenDecimals(mockPrincipal),
            ]);

            if (symbol && decimals !== undefined) {
              tokenList.push({
                urn: `icp:icrc1:${MOCK_ICRC1_CANISTER}`,
                symbol,
                decimals,
                network: "ICP",
                canisterId: MOCK_ICRC1_CANISTER,
              });
            }
          } catch (err) {
            console.error(`Failed to load mock token:`, err);
            // Skip mock token if it fails to load
          }
        }

        setTokens(tokenList);

        // Set initial token info
        const initialToken = tokenList[0];
        setToken(initialToken.urn);
        setTokenSymbol(initialToken.symbol);
        setTokenNetwork(initialToken.network);
        setTokenDecimals(initialToken.decimals);
        setTokenCanisterId(initialToken.canisterId || "");
      } catch (err) {
        console.error("Error fetching tokens:", err);
        setError("Failed to load tokens");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokens();
  }, [vaultCanisterId, identity]);

  useEffect(() => {
    setFormattedAmount(amount);
  }, [amount, tokenDecimals, token]);

  if (isLoading) {
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

  if (error) {
    return (
      <AccountPageLayout>
        <Typography color="error">{error}</Typography>
      </AccountPageLayout>
    );
  }

  return (
    <AccountPageLayout>
      <Box
        sx={{ display: "flex", flexDirection: "column", height: "100%", p: 3 }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 3, display: "flex", alignItems: "center" }}
        >
          {showConfirmation ? "Confirm transaction" : "New transaction"}
        </Typography>

        <Box sx={{ display: "flex", gap: 3 }}>
          <Paper sx={{ flex: 2, p: 3 }}>
            {isLoading ? (
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
            ) : showConfirmation ? (
              <ConfirmationView
                amount={amount}
                recipient={recipient}
                handleBack={handleBack}
                handleExecute={handleExecute}
                tokenSymbol={tokenSymbol}
                tokenNetwork={tokenNetwork}
                tokenCanisterId={tokenCanisterId}
                formattedAmount={formattedAmount}
              />
            ) : (
              <SendForm
                recipient={recipient}
                amount={amount}
                token={token}
                tokens={tokens}
                handleRecipientChange={handleRecipientChange}
                handleAmountChange={handleAmountChange}
                handleTokenChange={handleTokenChange}
                handleNext={handleNext}
              />
            )}
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </Paper>

          <Paper sx={{ flex: 1, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Transaction status
            </Typography>
            <Stepper activeStep={currentStep} orientation="vertical">
              <Step>
                <StepLabel>Create</StepLabel>
              </Step>
              <Step>
                <StepLabel>Confirm</StepLabel>
              </Step>
              <Step>
                <StepLabel>Execute</StepLabel>
              </Step>
              <Step>
                <StepLabel>Complete</StepLabel>
              </Step>
            </Stepper>
          </Paper>
        </Box>
      </Box>
    </AccountPageLayout>
  );
};

export default SendToken;
