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
      title: "Multisignature Vault Management",
      content:
        "Create and manage multisignature vaults with customizable settings. Configure the required number of signatories and set user-defined spending limits for enhanced security.",
    },
    {
      title: "Role-Based Access Control",
      content:
        "Share vaults with multiple users and assign different roles such as viewer, initiator, or approver. Ensure proper access control and collaborative management of funds.",
    },
    {
      title: "Multi-Party Transactions",
      content:
        "Initiate, approve, and execute transactions with multiple signatories. Transactions require consensus from the predefined number of approvers before execution on the ICP blockchain.",
    },
    {
      title: "Token Support",
      content:
        "Manage $ICP and ICRC-1,2,3,4 tokens securely within your vaults. Keep track of balances and execute transactions across supported token types.",
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
            Transact on-chain with confidence
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Keygate provides practical applications of cryptography for secure
            management of on-chain assets. Our multisignature vaults offer
            enhanced security for both retail and enterprise users on the
            Internet Computer Protocol (ICP) blockchain.
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
              Try out the demo
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Home;
