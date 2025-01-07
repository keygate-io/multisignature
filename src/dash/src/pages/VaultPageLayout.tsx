import React, { ReactNode, useState } from "react";
import {
  Box,
  Button,
  CssBaseline,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Snackbar,
  IconButton,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined,
  HomeOutlined,
  ReceiptOutlined,
  ArrowUpward,
  ArrowBack,
  SettingsOutlined,
} from "@mui/icons-material";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import MultipleRouteModal from "../modals/MultipleRouteModal";
import { useVaultDetail } from "../contexts/VaultDetailContext";

interface MenuItemType {
  text: string;
  icon: JSX.Element;
  path: string;
  badge?: string;
}

interface PageLayoutProps {
  children: ReactNode;
}

const AccountPageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [multipleRouteModalOpen, setMultipleRouteModalOpen] = useState(false);
  const { vaultName, vaultCanisterId, nativeAccountId } = useVaultDetail();
  const { vaultId } = useParams();

  const menuItems: MenuItemType[] = [
    { text: "Home", icon: <HomeOutlined />, path: `/vaults/${vaultId}` },
    {
      text: "Assets",
      icon: <AccountBalanceWalletOutlined />,
      path: `/vaults/${vaultId}/assets`,
    },
    {
      text: "Transactions",
      icon: <ReceiptOutlined />,
      path: `/vaults/${vaultId}/transactions`,
    },
    {
      text: "Settings",
      icon: <SettingsOutlined />,
      path: `/vaults/${vaultId}/settings`,
    },
  ];

  const handleCloseSnackbar = () => {
    setCopySnackbarOpen(false);
  };

  const handleMultipleRouteModalOpen = () => setMultipleRouteModalOpen(true);
  const handleMultipleRouteModalClose = () => setMultipleRouteModalOpen(false);

  const handleMultipleRouteOptionSelect = (option: string) => {
    if (option === "send-token") {
      navigate(`/vaults/${vaultId}/assets/send-token`);
    }
    handleMultipleRouteModalClose();
  };

  const handleBackToVaults = () => {
    navigate("/vaults");
  };

  const renderMenuItem = (item: MenuItemType) => (
    <ListItem
      button
      key={item.text}
      data-testid={`${item.text.toLowerCase().replace(/\s+/g, "-")}-navigator`}
      sx={{
        borderRadius: 1,
        backgroundColor:
          location.pathname === item.path
            ? "rgba(255, 255, 255, 0.08)"
            : "transparent",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.12)",
        },
      }}
      onClick={() => navigate(item.path)}
    >
      <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
        {item.icon}
      </ListItemIcon>
      <ListItemText primary={item.text} />
      {item.badge && (
        <Typography
          variant="caption"
          sx={{
            ml: 1,
            px: 1,
            bgcolor: "primary.main",
            borderRadius: 1,
          }}
        >
          {item.badge}
        </Typography>
      )}
    </ListItem>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "70vh", width: "100%" }}>
      <CssBaseline />
      <Box
        component="nav"
        sx={{
          width: 240,
          backgroundColor: "#1E1E1E",
          color: "#fff",
          p: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <IconButton
              onClick={handleBackToVaults}
              sx={{ color: "white", mr: 1 }}
            >
              <ArrowBack />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2, px: 2 }}>
            <Typography variant="h6" data-testid="vault-name">
              {vaultName || "Vault"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2, px: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                flexGrow: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "left",
              }}
            >
              <span data-testid="vault-principal">
                {vaultCanisterId?.toString() ?? "Fetching account"}
              </span>
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2, mx: 2 }}
            onClick={handleMultipleRouteModalOpen}
            data-testid="new-transaction-button"
          >
            New transaction
          </Button>
          <List>{menuItems.map(renderMenuItem)}</List>
        </Box>
        <Box sx={{ mt: "auto", pt: 2 }}>
          <Button variant="outlined" startIcon={<ArrowUpward />} fullWidth>
            Upgrade Account
          </Button>
        </Box>
      </Box>
      <Box
        component="main"
        sx={{
          backgroundColor: "#2c2c2c",
          p: 4,
          color: "#fff",
          flexGrow: 1,
          overflow: "auto",
        }}
      >
        {children}
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={copySnackbarOpen}
        onClose={handleCloseSnackbar}
        message="Address copied to clipboard"
        autoHideDuration={2000}
      />
      <MultipleRouteModal
        open={multipleRouteModalOpen}
        onClose={handleMultipleRouteModalClose}
        onOptionSelect={handleMultipleRouteOptionSelect}
      />
    </Box>
  );
};

export default AccountPageLayout;
