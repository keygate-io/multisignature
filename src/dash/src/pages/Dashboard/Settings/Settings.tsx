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
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import ThresholdModal from "./modal/ThresholdModal";
import AccountPageLayout from "../../VaultPageLayout";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { useVaultDetail } from "../../../contexts/VaultDetailContext";
import { Principal } from "@dfinity/principal";
import { getThreshold, getSigners, setThreshold, addSigner } from "../../../api/account";

const Settings: React.FC = () => {
  const { vaultCanisterId } = useVaultDetail();
  const { identity } = useInternetIdentity();
  const [threshold, setThresholdValue] = useState<bigint>(BigInt(0));
  const [signers, setSigners] = useState<Principal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newSigner, setNewSigner] = useState("");
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);

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

  const addNewSigner = async () => {
    if (!newSigner || !identity || !vaultCanisterId || newSigner.length < 1) return;

    addSigner(vaultCanisterId, identity, Principal.fromText(newSigner))
  }

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


      <ThresholdModal
        visible={thresholdModalOpen}
        onClose={() => setThresholdModalOpen(false)}
        onUpdate={async (value) => {
          if (!vaultCanisterId || !identity)
            await setThreshold(vaultCanisterId, value, identity!);
          setThresholdValue(value);
        }}
        currentThreshold={threshold}
      />


      {/* Threshold Management */}
      <Card sx={{ mb: 4, bgcolor: "background.paper" }}>
        <CardHeader
          title="Threshold"
          subheader="Set the number of signatures required for transaction approval"
        />
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography>
              Current threshold: {threshold.toString()} of {signers.length}{" "}
              signers
            </Typography>
            <span>
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                size="small"
                onClick={() => setThresholdModalOpen(true)}
              >
                Edit
              </Button>
            </span>
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
                fullWidth
                size="small"
                value={newSigner}
                onChange={(e) => setNewSigner(e.target.value)}
              />
              <span>
                <Button startIcon={<AddIcon />} variant="contained" onClick={addNewSigner}>
                  Add
                </Button>
              </span>
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
