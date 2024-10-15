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
import { Principal } from "@dfinity/principal";
import { useInternetIdentity } from "../../hooks/use-internet-identity";
import { useAccount } from "../../contexts/AccountContext";
import { getVaults } from "../../api/account";

const Vaults = () => {
  const { identity } = useInternetIdentity();
  const { icpBalance } = useAccount();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState<Principal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVaults = async () => {
      if (!identity) {
        navigate("/");
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
                  {`V${index + 1}`}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`Vault ${index + 1}`}
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {vault.toString()}
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
