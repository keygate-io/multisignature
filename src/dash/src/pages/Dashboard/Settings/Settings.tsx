import React, { useState, useEffect } from "react";
import {
  Box,
  Divider,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Alert,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import AccountPageLayout from "../../VaultPageLayout";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { useVaultDetail } from "../../../contexts/VaultDetailContext";
import { Principal } from "@dfinity/principal";
import { getThreshold, getSigners, setThreshold } from "../../../api/account";

const Settings: React.FC = () => {
  const { vaultCanisterId } = useVaultDetail();
  const { identity } = useInternetIdentity();

  const [threshold, setThresholdValue] = useState<bigint>(BigInt(0));
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [newThreshold, setNewThreshold] = useState("");
  const [signers, setSigners] = useState<Principal[]>([]);
  const [newSigner, setNewSigner] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!vaultCanisterId || !identity) return;

      setIsLoading(true);
      try {
        const [thresholdValue, signersValue] = await Promise.all([
          getThreshold(vaultCanisterId, identity),
          getSigners(vaultCanisterId, identity),
        ]);

        setThresholdValue(thresholdValue);
        setSigners(signersValue);
      } catch (err) {
        setError("Failed to load settings");
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [vaultCanisterId, identity]);

  const handleThresholdSubmit = async () => {
    if (!vaultCanisterId || !identity) return;

    try {
      const newThresholdBigInt = BigInt(newThreshold);
      if (newThresholdBigInt <= BigInt(0)) {
        setError("Threshold must be greater than 0");
        return;
      }
      if (newThresholdBigInt > BigInt(signers.length)) {
        setError("Threshold cannot be greater than the number of signers");
        return;
      }

      await setThreshold(vaultCanisterId, newThresholdBigInt, identity);
      setThresholdValue(newThresholdBigInt);
      setIsEditingThreshold(false);
      setError(null);
    } catch (err) {
      setError("Failed to update threshold");
      console.error("Error updating threshold:", err);
    }
  };

  const handleAddSigner = async () => {
    if (!vaultCanisterId || !identity) return;

    try {
      // Validate principal
      const newSignerPrincipal = Principal.fromText(newSigner);

      // Check if signer already exists
      if (
        signers.some(
          (signer) => signer.toString() === newSignerPrincipal.toString()
        )
      ) {
        setError("Signer already exists");
        return;
      }

      //   await import("../../../api/account").then(({ addSigner }) =>
      //     addSigner(vaultCanisterId, newSignerPrincipal, identity)
      //   );

      setSigners([...signers, newSignerPrincipal]);
      setNewSigner("");
      setError(null);
    } catch (err) {
      setError("Invalid principal ID or failed to add signer");
      console.error("Error adding signer:", err);
    }
  };

  if (isLoading) {
    return (
      <AccountPageLayout>
        <Typography variant="h4" gutterBottom sx={{ color: "white" }}>
          Loading settings...
        </Typography>
      </AccountPageLayout>
    );
  }

  return (
    <AccountPageLayout>
      <Typography variant="h4" gutterBottom sx={{ color: "white" }}>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Threshold Management */}
      <Card sx={{ mb: 4, bgcolor: "background.paper" }}>
        <CardHeader
          title="Threshold"
          subheader="Set the number of signatures required for transaction approval"
        />
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isEditingThreshold ? (
              <>
                <TextField
                  label="New Threshold"
                  type="number"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  size="small"
                  sx={{ width: 150 }}
                />
                <Button
                  startIcon={<SaveIcon />}
                  onClick={handleThresholdSubmit}
                  variant="contained"
                  size="small"
                >
                  Save
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={() => setIsEditingThreshold(false)}
                  variant="outlined"
                  size="small"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Typography>
                  Current threshold: {threshold.toString()} of {signers.length}{" "}
                  signers
                </Typography>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setNewThreshold(threshold.toString());
                    setIsEditingThreshold(true);
                  }}
                  variant="outlined"
                  size="small"
                >
                  Edit
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Signers Management */}
      <Card sx={{ bgcolor: "background.paper" }}>
        <CardHeader
          title="Signers"
          subheader="Manage authorized signers for this account"
        />
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label="Add Signer (Principal ID)"
                value={newSigner}
                onChange={(e) => setNewSigner(e.target.value)}
                fullWidth
                size="small"
              />
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddSigner}
                variant="contained"
                disabled={!newSigner}
              >
                Add
              </Button>
            </Box>
          </Box>

          <List>
            {signers.map((signer, index) => (
              <React.Fragment key={signer.toString()}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={signer.toString()}
                    secondary={
                      signer.toString() === identity?.getPrincipal().toString()
                        ? "Current User"
                        : null
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </AccountPageLayout>
  );
};

export default Settings;
