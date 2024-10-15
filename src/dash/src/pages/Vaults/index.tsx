import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInternetIdentity } from "../../hooks/use-internet-identity";
import { getVaults } from "../../api/account";
import { Vault } from "../../../../declarations/central/central.did";

const Vaults = () => {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVaults = async () => {
      if (!identity) {
        console.log("no identity");
        return;
      }

      try {
        setIsLoading(true);
        const fetchedVaults = await getVaults(identity);

        setVaults(fetchedVaults);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to fetch vaults");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaults();
  }, [identity, navigate]);

  const handleCreateAccount = () => {
    navigate("/new-account/create");
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, color: "error.main" }}>
        <Typography>Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          color: "white",
        }}
      >
        <Typography variant="h4" component="h1">
          Wallets
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Plus />}
          onClick={handleCreateAccount}
        >
          Create account
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          My accounts
        </Typography>
        <List>
          {vaults.map((vault, index) => (
            <ListItem
              key={index}
              className="min-w-[500px] hover:cursor-pointer"
              divider
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  {`${vault.name.charAt(0)}${index + 1}`}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${vault.name}`}
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {vault.id.toString()}
                    </Typography>
                    <br />
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Vaults;
