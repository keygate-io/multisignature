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
import AccountPageLayout from "../../VaultPageLayout";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { useVaultDetail } from "../../../contexts/VaultDetailContext";
import { Principal } from "@dfinity/principal";
import { getThreshold, getSigners, setThreshold } from "../../../api/account";

const Settings: React.FC = () => {
  const { vaultCanisterId } = useVaultDetail();
  const { identity } = useInternetIdentity();

  const [threshold, setThresholdValue] = useState<bigint>(BigInt(0));
  const [signers, setSigners] = useState<Principal[]>([]);
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
            <Typography>
              Current threshold: {threshold.toString()} of {signers.length}{" "}
              signers
            </Typography>
            <Tooltip title="This feature will be available in a future release">
              <span>
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  size="small"
                  disabled
                >
                  Edit
                </Button>
              </span>
            </Tooltip>
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
                disabled
                fullWidth
                size="small"
              />
              <Tooltip title="This feature will be available in a future release">
                <span>
                  <Button startIcon={<AddIcon />} variant="contained" disabled>
                    Add
                  </Button>
                </span>
              </Tooltip>
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
