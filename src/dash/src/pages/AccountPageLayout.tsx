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
  IconButton,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined,
  ContactsOutlined,
  HomeOutlined,
  ReceiptOutlined,
  SettingsOutlined,
  SwapHorizOutlined,
  ContentCopy,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "../contexts/AccountContext";

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
  const { account, icpAccount, balance, isLoading, error } = useAccount();
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);

  const menuItems: MenuItemType[] = [
    { text: "Home", icon: <HomeOutlined />, path: "/dashboard", badge: "New" },
    { text: "Assets", icon: <AccountBalanceWalletOutlined />, path: "/assets" },
    { text: "Swap", icon: <SwapHorizOutlined />, path: "/swap" },
    { text: "Transactions", icon: <ReceiptOutlined />, path: "/transactions" },
    { text: "Address book", icon: <ContactsOutlined />, path: "/address-book" },
    { text: "Settings", icon: <SettingsOutlined />, path: "/settings" },
  ];

  const handleCopyAddress = () => {
    if (icpAccount) {
      navigator.clipboard.writeText(icpAccount).then(() => {
        setCopySnackbarOpen(true);
      });
    }
  };

  const handleCloseSnackbar = () => {
    setCopySnackbarOpen(false);
  };

  const renderMenuItem = (item: MenuItemType) => (
    <ListItem
      button
      key={item.text}
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
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
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
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, px: 2 }}>
          Smart Account
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, px: 2 }}>
          <Tooltip title={icpAccount || "Fetching account"}>
            <Typography
              variant="subtitle2"
              sx={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {icpAccount
                ? `${icpAccount.slice(0, 8)}...${icpAccount.slice(-8)}`
                : "Fetching account"}
            </Typography>
          </Tooltip>
          <IconButton
            size="small"
            onClick={handleCopyAddress}
            sx={{ color: "inherit" }}
            disabled={!icpAccount}
          >
            <ContentCopy fontSize="small" />
          </IconButton>
        </Box>
        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 2, mx: 2 }}
          onClick={() => navigate("/new-transaction")}
        >
          New transaction
        </Button>
        <List>{menuItems.map(renderMenuItem)}</List>
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
    </Box>
  );
};

export default AccountPageLayout;
