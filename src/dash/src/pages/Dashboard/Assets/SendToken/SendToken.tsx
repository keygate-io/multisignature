import React, { useMemo, useState } from "react";
import AccountPageLayout from "../../../AccountPageLayout";
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  SelectChangeEvent,
} from "@mui/material";
import SendForm from "./SendForm";
import ConfirmationView from "./ConfirmationView";

const SendToken: React.FC = () => {
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [token, setToken] = useState<string>("ICP");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

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
  };

  const handleBack = () => {
    setShowConfirmation(false);
  };

  const handleExecute = () => {
    // Implement the execution logic here
  };

  const memoizedSendForm = useMemo(
    () => (
      <SendForm
        recipient={recipient}
        amount={amount}
        token={token}
        handleRecipientChange={handleRecipientChange}
        handleAmountChange={handleAmountChange}
        handleTokenChange={handleTokenChange}
        handleNext={handleNext}
      />
    ),
    [recipient, amount, token]
  );

  const memoizedConfirmationView = useMemo(
    () => (
      <ConfirmationView
        amount={amount}
        recipient={recipient}
        handleBack={handleBack}
        handleExecute={handleExecute}
      />
    ),
    [amount, recipient]
  );

  return (
    <AccountPageLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 3, display: "flex", alignItems: "center" }}
        >
          {showConfirmation ? "Confirm transaction" : "New transaction"}
        </Typography>

        <Box sx={{ display: "flex", gap: 3 }}>
          <Paper sx={{ flex: 2, p: 3 }}>
            {showConfirmation ? memoizedConfirmationView : memoizedSendForm}
          </Paper>

          <Paper sx={{ flex: 1, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Transaction status
            </Typography>
            <Stepper orientation="vertical">
              <Step active completed={showConfirmation}>
                <StepLabel>Create</StepLabel>
              </Step>
              <Step active={showConfirmation}>
                <StepLabel>Confirmed (0 of 1)</StepLabel>
              </Step>
              <Step>
                <StepLabel>Execute</StepLabel>
              </Step>
            </Stepper>
          </Paper>
        </Box>
      </Box>
    </AccountPageLayout>
  );
};

export default SendToken;
