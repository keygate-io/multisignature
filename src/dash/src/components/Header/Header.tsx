import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Chip,
  capitalize,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useInternetIdentity } from "../../hooks/use-internet-identity";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { clear, identity } = useInternetIdentity();

  const handleLogout = () => {
    clear();
    navigate("/");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box
          sx={{
            width: "100%",
            maxHeight: "20vh",
            py: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h5" component="h1">
              Keygate
            </Typography>
            <Chip
              label={`${capitalize(process.env.NODE_ENV ?? "unknown")} version`}
              color="secondary"
              size="small"
              sx={{ fontWeight: "bold" }}
            />
          </Box>
          {identity && (
            <IconButton
              color="inherit"
              onClick={handleLogout}
              aria-label="logout"
            >
              <LogoutIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
