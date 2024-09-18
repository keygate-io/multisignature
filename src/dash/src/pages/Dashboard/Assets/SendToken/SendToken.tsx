import React, { useState, useCallback } from "react";
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
} from "@mui/material";
import SendForm from "./SendForm";
import ConfirmationView from "./ConfirmationView";
import { useAccount } from "../../../../contexts/AccountContext";
import { Buffer } from "buffer";
import {
  addIntent,
  createIntent,
  executeIntent,
  getAdapters,
} from "../../../../api/account";
import { useInternetIdentity } from "../../../../hooks/use-internet-identity";

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

const SendToken: React.FC = () => {
  const {
    vaultCanisterId: account,
    icpSubaccount: icpAccount,
    isLoading: contextLoading,
    error: contextError,
  } = useAccount();
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [token, setToken] = useState<string>("ICP");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { identity } = useInternetIdentity();

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
      console.log("Intent:", intent);
      const intentId = await addIntent(account, intent, identity!);
      console.log("Intent ID:", intentId);
      setCurrentStep(2);

      const adapters = await getAdapters(account, identity!);
      console.log("Adapters:", adapters);

      if (!intentId) {
        setError("Could not create intent");
        return;
      }

      const result = await executeIntent(account, intentId, identity!);

      if ("Completed" in result) {
        setCurrentStep(3);
      } else if ("Failed" in result) {
        setError(`Transaction failed: ${JSON.stringify(result)}`);
      } else {
        setError(`Unknown error: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      setError(`An error occurred: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [account, icpAccount, amount, token, recipient]);

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
              />
            ) : (
              <SendForm
                recipient={recipient}
                amount={amount}
                token={token}
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
