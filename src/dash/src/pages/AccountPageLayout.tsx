import React, { ReactNode, useEffect, useState } from "react";
import {
  Box,
  Button,
  CssBaseline,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined,
  ContactsOutlined,
  HomeOutlined,
  ReceiptOutlined,
  SettingsOutlined,
  SwapHorizOutlined,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { useInternetIdentity } from "../hooks/use-internet-identity";
import { getUser } from "../api/users";

interface PageLayoutProps {
  children: ReactNode;
}

const AccountPageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState<Principal | null>(null);

  const menuItems = [
    { text: "Home", icon: <HomeOutlined />, path: "/dashboard" },
    { text: "Assets", icon: <AccountBalanceWalletOutlined />, path: "/assets" },
    { text: "Swap", icon: <SwapHorizOutlined />, path: "/swap" },
    { text: "Transactions", icon: <ReceiptOutlined />, path: "/transactions" },
    { text: "Address book", icon: <ContactsOutlined />, path: "/address-book" },
    { text: "Settings", icon: <SettingsOutlined />, path: "/settings" },
  ];

  useEffect(() => {
    function fetchUser() {
      if (identity) {
        return getUser(identity.getPrincipal()).then((user) => {
          if (user) {
            console.log("User found:", user);
            setAccount(user.accounts[0]);
          } else {
            navigate("/new-account");
          }
        });
      }

      return Promise.resolve();
    }

    fetchUser();
  }, [identity, navigate]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <CssBaseline />
      <Box
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
          <Typography variant="subtitle2">
            {account
              ? account.toText().slice(0, 8) +
                "..." +
                account.toText().slice(-8)
              : "Fetching account"}
          </Typography>
        </Box>
        <Button variant="contained" color="primary" sx={{ mb: 2, mx: 2 }}>
          New transaction
        </Button>
        <List>
          {menuItems.map((item) => (
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
          ))}
        </List>
      </Box>
      <Box
        component="main"
        sx={{
          backgroundColor: "#2c2c2c",
          p: 4,
          color: "#fff",
          width: "100%",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AccountPageLayout;
