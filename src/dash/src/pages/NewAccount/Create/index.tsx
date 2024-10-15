import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { deployAccount } from "../../../api/account";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  LinearProgress,
  Paper,
  Grid,
  Snackbar,
  createTheme,
  CssBaseline,
  Alert,
} from "@mui/material";
import MuiAlert, { AlertColor } from "@mui/material/Alert";

interface Signer {
  name: string;
  principalId: string;
}

interface Step1Props {
  accountName: string;
  setAccountName: (name: string) => void;
  selectedNetwork: string;
  setSelectedNetwork: (network: string) => void;
}

const Step1: React.FC<Step1Props> = ({
  accountName,
  setAccountName,
  selectedNetwork,
  setSelectedNetwork,
}) => (
  <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
    <Typography variant="h6" gutterBottom>
      1. Select a name for the wallet
    </Typography>
    <TextField
      fullWidth
      label="Name"
      value={accountName}
      onChange={(e) => setAccountName(e.target.value)}
      margin="normal"
    />
  </Paper>
);

interface ReviewProps {
  accountName: string;
  selectedNetwork: string;
  signers: Signer[];
  threshold: number;
}

const Review: React.FC<ReviewProps> = ({
  accountName,
  selectedNetwork,
  signers,
  threshold,
}) => (
  <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
    <Typography variant="h6" gutterBottom>
      2. Review
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      You're about to create a new wallet and will have to confirm the
      transaction with your connected identity.
    </Typography>
    <Box sx={{ mt: 2 }}>
      <Typography>
        <strong>Network:</strong> {selectedNetwork}
      </Typography>
      <Typography>
        <strong>Name:</strong> {accountName}
      </Typography>
    </Box>
  </Paper>
);

const CreateAccount: React.FC = () => {
  const [step, setStep] = useState(1);
  const [accountName, setAccountName] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("Internet Computer");
  const [signers, setSigners] = useState<Signer[]>([
    { name: "Signer 1", principalId: "" },
  ]);
  const [threshold, setThreshold] = useState(1);
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const location = useLocation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setSnackbar({
        open: true,
        message: "Creating a secure vault...",
        severity: "info",
      });

      console.log(identity);

      deployAccount(identity!, accountName).then(async (id) => {
        setSnackbar({ open: false, message: "", severity: "info" });
        navigate("/vaults");
      });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    async function loadUser() {
      if (!identity) {
        if (isInitializing) {
          return;
        }

        navigate("/");
        return;
      }

      const defaultName = "Signer 1";
    }

    loadUser();
  }, [identity]);

  // Check if the previous location was not "/"
  const showBackButton = true;

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          bgcolor: "background.default",
          width: "100%",
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          {showBackButton && (
            <Button onClick={handleBack} variant="outlined" sx={{ mb: 2 }}>
              ← Back
            </Button>
          )}
          <Typography variant="h4" gutterBottom>
            Wallet creation
          </Typography>
          <LinearProgress
            variant="determinate"
            color="primary"
            value={step * 50}
            sx={{ mb: 4 }}
          />
          {step === 1 ? (
            <Step1
              accountName={accountName}
              setAccountName={setAccountName}
              selectedNetwork={selectedNetwork}
              setSelectedNetwork={setSelectedNetwork}
            />
          ) : (
            <Review
              accountName={accountName}
              selectedNetwork={selectedNetwork}
              signers={signers}
              threshold={threshold}
            />
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            {step > 1 && (
              <Button onClick={prevStep} variant="outlined">
                ← Back
              </Button>
            )}
            <Button
              variant="contained"
              onClick={nextStep}
              sx={{ ml: "auto" }}
              disabled={accountName.trim().length === 0}
            >
              {step < 2 ? "Next" : "Create"}
            </Button>
          </Box>
        </Container>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000}>
        <Alert
          severity={snackbar.severity as AlertColor}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateAccount;
