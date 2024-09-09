import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputAdornment,
  SelectChangeEvent,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

interface SendFormProps {
  recipient: string;
  amount: string;
  token: string;
  handleRecipientChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTokenChange: (event: SelectChangeEvent<string>) => void;
  handleNext: () => void;
}

const SendForm: React.FC<SendFormProps> = ({
  recipient,
  amount,
  token,
  handleRecipientChange,
  handleAmountChange,
  handleTokenChange,
  handleNext,
}) => (
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
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "grey.500",
          },
        }}
        defaultValue="ICP"
      >
        <MenuItem value="ICP" defaultChecked>
          ICP
        </MenuItem>
      </Select>
    </Box>

    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Button variant="contained" color="primary" onClick={handleNext}>
        Next
      </Button>
    </Box>
  </>
);

export default SendForm;
