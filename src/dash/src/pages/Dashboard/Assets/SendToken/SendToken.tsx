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
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

const SendToken: React.FC = () => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("Sepolia Ether");

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

  return (
    <AccountPageLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 3,
          bgcolor: "#1e1e1e",
          color: "white",
        }}
      >
        <Typography variant="h4" sx={{ mb: 3 }}>
          New transaction
        </Typography>

        <Box sx={{ display: "flex", gap: 3 }}>
          <Paper sx={{ flex: 2, p: 3, bgcolor: "#2c2c2c", color: "white" }}>
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
                input: { color: "white" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "grey.500" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ color: "grey.500" }}>ICP:</Typography>
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
                <MenuItem value="Sepolia Ether">ICP</MenuItem>
              </Select>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" color="primary">
                Next
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ flex: 1, p: 3, bgcolor: "#2c2c2c", color: "white" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Transaction status
            </Typography>
            <Stepper
              orientation="vertical"
              sx={{ "& .MuiStepLabel-label": { color: "white" } }}
            >
              <Step active>
                <StepLabel>Create</StepLabel>
              </Step>
              <Step>
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
