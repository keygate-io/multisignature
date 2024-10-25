import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInternetIdentity } from "../../hooks/use-internet-identity";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#1e1e1e",
      paper: "#2c2c2c",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
  },
});

const Home = () => {
  const { login, identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate("/vaults");
    }
  }, [identity, navigate]);

  const features = [
    {
      title: "Cross-Chain Asset Management",
      content:
        "Manage assets across ICP, Solana, and EVM chains through a single, secure interface. No more juggling multiple wallets for different blockchains.",
    },
    {
      title: "Intent-Based Transactions",
      content:
        "Execute complex cross-chain transactions with our simplified intent system. Focus on what you want to do, not how to do it across different protocols.",
    },
    {
      title: "Enterprise-Grade Security",
      content:
        "Leverage Internet Computer's native cryptography for threshold ECDSA signatures, ensuring your assets remain secure with customizable approval requirements.",
    },
    {
      title: "Unified Dashboard",
      content:
        "Track balances, approve transactions, and manage vault access across all supported chains from one intuitive interface. Perfect for DAOs and investment teams.",
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            One Vault, All Chains
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Keygate unifies multi-signature management across blockchains. Built
            on Internet Computer Protocol, our platform enables secure
            cross-chain asset management for teams and organizations.
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper elevation={1} sx={{ height: "100%", p: 3 }}>
                  <Typography
                    variant="h6"
                    component="h2"
                    fontWeight="bold"
                    gutterBottom
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body2">{feature.content}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={login}
              size="small"
              color="primary"
              sx={{ py: 1.5, px: 3 }}
            >
              Connect with Internet Identity
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Home;
