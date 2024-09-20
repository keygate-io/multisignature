import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { getUser } from "../../../api/users";
import { deployAccount, createSubaccount } from "../../../api/account";
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
      1. Select a name for the vault
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

interface Step2Props {
  signers: Signer[];
  setSigners: (signers: Signer[]) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
}

const Step2: React.FC<Step2Props> = ({
  signers,
  setSigners,
  threshold,
  setThreshold,
}) => {
  const addSigner = () => {
    setSigners([...signers, { name: "", principalId: "" }]);
  };

  const updateSigner = (index: number, field: keyof Signer, value: string) => {
    const newSigners = [...signers];
    newSigners[index][field] = value;
    setSigners(newSigners);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        2. Signers and confirmations
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Set the signer wallets of your vault and how many need to confirm to
        execute a valid transaction.
      </Typography>
      {signers.map((signer, index) => (
        <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Signer name"
              value={signer.name}
              onChange={(e) => updateSigner(index, "name", e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Principal ID"
              value={signer.principalId}
              onChange={(e) =>
                updateSigner(index, "principalId", e.target.value)
              }
            />
          </Grid>
        </Grid>
      ))}
      <Button variant="contained" onClick={addSigner} sx={{ mb: 2 }}>
        + Add new signer
      </Button>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Threshold
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Any transaction requires the confirmation of:
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FormControl sx={{ minWidth: 120, mr: 2 }}>
            <Select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            >
              {signers.map((_, index) => (
                <MenuItem key={index} value={index + 1}>
                  {index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography>out of {signers.length} signer(s)</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

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
      3. Review
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      You're about to create a new vault and will have to confirm the
      transaction with your connected wallet.
    </Typography>
    <Box sx={{ mt: 2 }}>
      <Typography>
        <strong>Network:</strong> {selectedNetwork}
      </Typography>
      <Typography>
        <strong>Name:</strong> {accountName}
      </Typography>
      <Typography>
        <strong>Signers:</strong>
      </Typography>
      {signers.map((signer, index) => (
        <Typography key={index}>
          {signer.name} - {signer.principalId}
        </Typography>
      ))}
      <Typography>
        <strong>Threshold:</strong> {threshold} out of {signers.length}{" "}
        signer(s)
      </Typography>
    </Box>
  </Paper>
);

const CreateAccount: React.FC = () => {
  const [step, setStep] = useState(1);
  const [accountName, setAccountName] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("ICP");
  const [signers, setSigners] = useState<Signer[]>([
    { name: "Signer 1", principalId: "" },
  ]);
  const [threshold, setThreshold] = useState(1);
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setSnackbar({
        open: true,
        message: "Creating a secure vault...",
        severity: "info",
      });

      deployAccount(identity!).then(async (id) => {
        const subaccount_id = await createSubaccount(id, "ICP", identity!);

        setSnackbar({ open: false, message: "", severity: "info" });
        navigate("/dashboard");
      });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
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

      const profile = await getUser(identity.getPrincipal());
      const defaultName = "Signer 1";

      setSigners([
        {
          name: profile
            ? `${profile.first_name} ${profile.last_name}`
            : defaultName || defaultName,
          principalId: identity.getPrincipal().toText(),
        },
      ]);
    }

    loadUser();
  }, [identity]);

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
          <Typography variant="h4" gutterBottom>
            Vault creation
          </Typography>
          <LinearProgress
            variant="determinate"
            color="primary"
            value={step * 33}
            sx={{ mb: 4 }}
          />
          {step === 1 ? (
            <Step1
              accountName={accountName}
              setAccountName={setAccountName}
              selectedNetwork={selectedNetwork}
              setSelectedNetwork={setSelectedNetwork}
            />
          ) : step === 2 ? (
            <Step2
              signers={signers}
              setSigners={setSigners}
              threshold={threshold}
              setThreshold={setThreshold}
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
            <Button variant="contained" onClick={nextStep} sx={{ ml: "auto" }}>
              {step < 3 ? "Next" : "Create"}
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
