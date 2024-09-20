import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { Principal } from "@dfinity/principal";
import {
  getTokenName,
  getTokenSymbol,
  getTokenDecimals,
  getTokenTotalSupply,
  getTokenMetadata,
  getTokenFee,
} from "../../../api/icrc";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

interface AddTokenModalProps {
  open: boolean;
  handleClose: () => void;
  handleAddToken: (tokenData: any) => void;
}

const AddTokenModal: React.FC<AddTokenModalProps> = ({
  open,
  handleClose,
  handleAddToken,
}) => {
  const [principalId, setPrincipalId] = useState("");
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePrincipalSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const principal = Principal.fromText(principalId);
      const [name, symbol, decimals, totalSupply, metadata, fee] =
        await Promise.all([
          getTokenName(principal),
          getTokenSymbol(principal),
          getTokenDecimals(principal),
          getTokenTotalSupply(principal),
          getTokenMetadata(principal),
          getTokenFee(principal),
        ]);

      setTokenData({
        name,
        symbol,
        decimals,
        totalSupply,
        metadata,
        fee,
        address: principalId,
      });
    } catch (err) {
      console.log(err);
      setError(
        "Failed to fetch token data. Please check the Principal ID and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    handleAddToken(tokenData);
    handleClose();
  };

  const resetForm = () => {
    setPrincipalId("");
    setTokenData(null);
    setError("");
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        resetForm();
      }}
    >
      <Box sx={style}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Token
        </Typography>
        {!tokenData ? (
          <form onSubmit={handlePrincipalSubmit}>
            <TextField
              fullWidth
              label="Token Address (Principal ID)"
              value={principalId}
              onChange={(e) => setPrincipalId(e.target.value)}
              sx={{ mb: 2 }}
            />
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Fetch Token Data"}
            </Button>
          </form>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Name: {tokenData.name}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Symbol: {tokenData.symbol}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Decimals: {tokenData.decimals}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Total Supply: {tokenData.totalSupply.toString()}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Fee: {tokenData.fee.toString()}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirm}
                sx={{ mr: 1 }}
              >
                Confirm
              </Button>
              <Button variant="outlined" onClick={resetForm}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default AddTokenModal;
