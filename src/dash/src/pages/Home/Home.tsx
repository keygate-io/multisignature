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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TelegramIcon from "@mui/icons-material/Telegram";
import { DiscordOutlined } from "@ant-design/icons";

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
      <Box sx={{ mt: 2, mx: "auto", maxHeight: "100vh" }}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Info Banner */}
          <Box
            sx={{
              width: "100%",
              bgcolor: "#1E1E1E",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              py: 2,
            }}
          >
            <Container maxWidth="lg">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <InfoOutlinedIcon sx={{ color: "#1976d2", fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    New to Keygate? Get some tokens (0.1 ICP) to try all
                    platform features!{" "}
                    <a
                      href="https://discord.gg/rJVDjJdq"
                      target="_blank"
                      style={{ color: "#1976d2", textDecoration: "none" }}
                    >
                      Join our community, get support, and contribute to the
                      project.
                    </a>
                  </Typography>
                </Box>
                <Button
                  href="https://discord.gg/rJVDjJdq"
                  target="_blank"
                  variant="text"
                  size="small"
                  startIcon={<DiscordOutlined />}
                  sx={{
                    color: "#1976d2",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "rgba(25, 118, 210, 0.08)",
                    },
                  }}
                >
                  Discord
                </Button>
              </Box>
            </Container>
          </Box>

          {/* Main Content */}
          <Container maxWidth="lg" sx={{ flex: 1 }}>
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
                Keygate unifies multi-signature management across blockchains.
                Built on Internet Computer Protocol, our platform enables secure
                cross-chain asset management for teams and organizations.
              </Typography>

              <Grid container spacing={3}>
                {features.map((feature, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      elevation={1}
                      sx={{
                        height: "100%",
                        p: 3,
                        transition: "transform 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
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

              <Box
                sx={{
                  mt: 6,
                  mb: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  onClick={login}
                  size="large"
                  color="primary"
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    textTransform: "none",
                    boxShadow: "0 4px 6px rgba(25, 118, 210, 0.25)",
                    "&:hover": {
                      boxShadow: "0 6px 8px rgba(25, 118, 210, 0.35)",
                    },
                  }}
                >
                  Connect with Internet Identity
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Home;
