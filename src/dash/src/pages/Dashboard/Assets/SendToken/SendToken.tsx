// SendToken.tsx
import React, { useState, useCallback, useEffect } from "react";
import AccountPageLayout from "../../../AccountPageLayout";
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
  Tooltip,
} from "@mui/material";
import { useAccount } from "../../../../contexts/AccountContext";
import { Buffer } from "buffer";
import {
  addIntent,
  createIntent,
  executeIntent,
  getAdapters,
  getTokens,
} from "../../../../api/account";
import { useInternetIdentity } from "../../../../hooks/use-internet-identity";
import { getTokenSymbol, getTokenDecimals } from "../../../../api/icrc";
import { Principal } from "@dfinity/principal";
import { extractTokenData } from "../../../../util/token";
import {
  formatCommaSeparated,
  formatIcp,
  formatIcrc,
} from "../../../../util/units";
import { ICP_DECIMALS } from "../../../../util/constants";
import ConfirmationView from "./ConfirmationView";

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

// SendForm component
interface SendFormProps {
  recipient: string;
  amount: string;
  token: string;
  tokens: string[];
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
          <MenuItem key={option} value={option}>
            {option}
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
  const {
    vaultCanisterId: account,
    icpSubaccount: icpAccount,
    isLoading: contextLoading,
    error: contextError,
  } = useAccount();
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [token, setToken] = useState<string>("icp:native");
  const [tokens, setTokens] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { identity } = useInternetIdentity();
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [tokenNetwork, setTokenNetwork] = useState<string>("");
  const [tokenCanisterId, setTokenCanisterId] = useState<string>("");
  const [tokenDecimals, setTokenDecimals] = useState<number>(ICP_DECIMALS);
  const [formattedAmount, setFormattedAmount] = useState<string>("");

  const handleRecipientChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRecipient(event.target.value);
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const handleTokenChange = (event: SelectChangeEvent<string>) => {
    setToken(event.target.value);
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
    if (!account || !icpAccount) {
      setError("Account information is missing");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const intent = createIntent(BigInt(amount), token, recipient, icpAccount);
      const intentId = await addIntent(account, intent, identity!);

      if (!intentId) {
        console.log("intent_id", intentId);
        setError("Could not create intent.");
        return;
      }

      setCurrentStep(2);

      const result = await executeIntent(account, intentId, identity!);

      if ("Completed" in result) {
        setCurrentStep(3);
      } else if ("Failed" in result) {
        setError(`Transaction failed: ${JSON.stringify(result)}`);
      } else {
        setError(`Unknown error: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error(err);
      setError(`An error occurred: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [account, icpAccount, amount, token, recipient, identity]);

  useEffect(() => {
    async function fetchTokens() {
      if (account && identity) {
        const fetchedTokens = await getTokens(account, identity);
        setTokens(fetchedTokens);
      }
    }
    fetchTokens();
  }, [account, identity]);

  useEffect(() => {
    async function fetchTokenInfo() {
      if (account && identity && token) {
        const tokenInfo = extractTokenData(token);
        setTokenNetwork(tokenInfo.network);

        if (token.toLowerCase().includes("icp:native")) {
          setTokenSymbol("ICP");
          setTokenCanisterId("");
          setTokenDecimals(ICP_DECIMALS);
        } else {
          const symbol = await getTokenSymbol(
            Principal.fromText(tokenInfo.principalId)
          );
          const decimals = await getTokenDecimals(
            Principal.fromText(tokenInfo.principalId)
          );

          if (!symbol) {
            setError("Could not fetch token symbol");
            return;
          }

          if (!decimals) {
            setError("Could not fetch token decimals");
            return;
          }

          setTokenSymbol(symbol);
          setTokenCanisterId(tokenInfo.principalId);
          setTokenDecimals(decimals !== undefined ? decimals : ICP_DECIMALS);
        }
      }
    }
    fetchTokenInfo();
  }, [account, identity, token]);

  useEffect(() => {
    setFormattedAmount(formatCommaSeparated(BigInt(amount)));
  }, [amount, tokenDecimals, token]);

  if (contextLoading) {
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

  if (contextError) {
    return (
      <AccountPageLayout>
        <Typography color="error">{contextError}</Typography>
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
