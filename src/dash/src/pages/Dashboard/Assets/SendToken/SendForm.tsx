import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { useInternetIdentity } from "../../../../hooks/use-internet-identity";
import { useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { TOKEN_URN_TO_SYMBOL } from "../../../../util/constants";

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
}) => {
  const [tokenOptions, setTokenOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { identity } = useInternetIdentity();
  const { vaultId } = useParams();

  useEffect(() => {
    const fetchTokens = async () => {
      if (vaultId && identity) {
        try {
          const tokens = ["icp:native", "icp:test"];
          setTokenOptions(tokens);
        } catch (error) {
          console.error("Error fetching tokens:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTokens();
  }, [vaultId, identity]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      component="form"
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        label="Recipient"
        value={recipient}
        onChange={handleRecipientChange}
        fullWidth
      />
      <TextField
        label="Amount"
        type="number"
        value={amount}
        onChange={handleAmountChange}
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel id="token-select-label">Token</InputLabel>
        <Select
          labelId="token-select-label"
          value={token}
          label="Token"
          onChange={handleTokenChange}
        >
          {tokenOptions.map((tokenOption) => (
            <MenuItem key={tokenOption} value={tokenOption}>
              {TOKEN_URN_TO_SYMBOL[tokenOption]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="contained"
        onClick={handleNext}
        disabled={!recipient || !amount || !token}
      >
        Next
      </Button>
    </Box>
  );
};

export default SendForm;
