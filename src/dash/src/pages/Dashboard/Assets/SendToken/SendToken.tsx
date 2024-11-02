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
import { ICP_DECIMALS, TOKEN_URN_TO_SYMBOL } from "../../../../util/constants";
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
            {TOKEN_URN_TO_SYMBOL[option]}
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
        network: token.toLowerCase().includes("eth") ? { ETH: null } : { ICP: null },
        transaction_type: { Transfer: null },
        from: nativeAccountId,
      };

      setCurrentStep(2);

      const proposedTx = await proposeTransaction(
        vaultCanisterId,
        intent,
        identity!
      );

      // If threshold is 0 or 1, immediately execute the transaction
      const threshold = await getThreshold(vaultCanisterId, identity!);
      if (threshold <= BigInt(1)) {
        console.log(proposedTx);
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
      if (vaultCanisterId && identity) {
        const fetchedTokens = [
          "icp:native",
          `icp:icrc1:${process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER}`,
          "eth:native",
          "icp:test2",
          "icp:test3",
        ];
        setTokens(fetchedTokens);
      }
    }
    fetchTokens();
  }, [vaultCanisterId, identity]);

  useEffect(() => {
    async function fetchTokenInfo() {
      if (vaultCanisterId && identity && token) {
        const tokenInfo = extractTokenData(token);
        setTokenNetwork(tokenInfo.network);

        if (token.toLowerCase().includes("icp:native")) {
          setTokenSymbol("ICP");
          setTokenCanisterId("");
          setTokenDecimals(ICP_DECIMALS);
        } else if (token.toLowerCase().includes("eth:native")) {
          setTokenSymbol("ETH");
          setTokenCanisterId("");
          setTokenDecimals(18);
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
  }, [vaultCanisterId, nativeAccountId, identity, token]);

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
