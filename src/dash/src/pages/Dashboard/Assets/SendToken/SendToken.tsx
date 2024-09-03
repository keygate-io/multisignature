import React, { useState } from "react";
import AccountPageLayout from "../../../AccountPageLayout";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputAdornment,
  Paper,
  Stepper,
  Step,
  StepLabel,
  SelectChangeEvent,
  IconButton,
} from "@mui/material";
import {
  Send as SendIcon,
  ArrowBack,
  ContentCopy,
  OpenInNew,
  ExpandMore,
  InfoOutlined,
} from "@mui/icons-material";

const SendToken: React.FC = () => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("ICP");
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const SendForm = () => (
    <>
      <Typography
        variant="h6"
        sx={{ display: "flex", alignItems: "center", mb: 2 }}
      >
        <SendIcon sx={{ mr: 1 }} /> Send tokens
      </Typography>

      <TextField
        fullWidth
        label="Account ID"
        variant="outlined"
        value={recipient}
        onChange={handleRecipientChange}
        sx={{
          mb: 2,
          "& .MuiInputAdornment-root": {
            mr: 1,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography>ICP</Typography>
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: "flex", mb: 2 }}>
        <TextField
          fullWidth
          label="Amount"
          variant="outlined"
          value={amount}
          onChange={handleAmountChange}
          sx={{
            mr: 2,
            input: { color: "white" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "grey.500" },
            },
          }}
        />
        <Select
          value={token}
          onChange={handleTokenChange}
          sx={{
            minWidth: 150,
            color: "white",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "grey.500",
            },
          }}
        >
          <MenuItem value="ICP">ICP</MenuItem>
        </Select>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" color="primary" onClick={handleNext}>
          Next
        </Button>
      </Box>
    </>
  );

  const ConfirmationView = () => (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Send tokens
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="gray">
          Send:
        </Typography>
        <Typography variant="body1">ICP {amount}</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="gray">
          To:
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body1" sx={{ flex: 1, overflow: "hidden" }}>
            {recipient}
          </Typography>
          <IconButton size="small" sx={{ color: "gray" }}>
            <ContentCopy />
          </IconButton>
          <IconButton size="small" sx={{ color: "gray" }}>
            <OpenInNew />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", mb: 2 }}
        >
          <InfoOutlined sx={{ mr: 1, color: "primary.main" }} />
          Execute
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          You're about to create and execute this transaction.
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
            Executing this transaction will activate your account.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Base fee: ≈ 0,00151 ICP
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • One-time activation fee: ≈ 0,00575 ICP
          </Typography>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="subtitle1">Estimated fee</Typography>
        <Typography
          variant="subtitle1"
          sx={{ display: "flex", alignItems: "center" }}
        >
          0,00726 ETH <ExpandMore />
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button variant="contained" onClick={handleExecute}>
          Execute
        </Button>
      </Box>
    </>
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
            {showConfirmation ? <ConfirmationView /> : <SendForm />}
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
