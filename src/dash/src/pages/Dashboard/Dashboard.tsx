import { Principal } from "@dfinity/principal";
import { useInternetIdentity } from "../../hooks/use-internet-identity";
import { useEffect, useState } from "react";
import { getUser } from "../../api/users";
import { balanceOf } from "../../api/ledger";
import { getSubaccount } from "../../api/account";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Modal,
  Typography,
  CircularProgress,
  CssBaseline,
  IconButton,
  TextField,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";

const BALANCE_REFRESH_DELAY = 2000;

const Dashboard = () => {
  const { identity } = useInternetIdentity();
  const [account, setAccount] = useState<Principal | null>(null);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [icpAccount, setIcpAccount] = useState<String | null>(null);
  const [balance, setBalance] = useState<bigint>(BigInt(0));

  const handleCopy = () => {
    if (icpAccount) {
      navigator.clipboard.writeText(String(icpAccount)).then(() => {
        setCopySuccess(true);
      });
    }
  };


  useEffect(() => {
    async function requestBalance() {
      if (!icpAccount) {
        return;
      }

      const balance = await balanceOf(icpAccount as string);
      setBalance(balance.e8s)
    }

    const refresh = setTimeout(() => requestBalance(), BALANCE_REFRESH_DELAY)
      
    return () => {
      clearTimeout(refresh);
    };
  }, []);

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
  }, [identity]);

  useEffect(() => {
    async function fetchIcpAccount() {
      if (!account) {
        return;
      }

      const icpAccountQuery = await getSubaccount(account!, "ICP");
      console.log("ICP subaccount query:", icpAccountQuery);
      if ("Ok" in icpAccountQuery) {
        const icpAccountString = icpAccountQuery.Ok;
        console.log("ICP subaccount:", icpAccountString);
        setIcpAccount(icpAccountString);
      } else {
        console.error(
          "Failed to get ICP subaccount:",
          icpAccountQuery.Err.message
        );
      }
    }

    fetchIcpAccount();
  }, [account]);

  return (
    <Box sx={{ display: "flex", minHeight: "80vh" }}>
      <CssBaseline />
      <Box
        sx={{
          width: 326,
          backgroundColor: "#333",
          color: "#fff",
          p: 4,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography>{account?.toText() ?? "Fetching account"}</Typography>
        <Button variant="contained" color="primary" sx={{ mt: 2 }}>
          New transaction
        </Button>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: "#2c2c2c",
          p: 4,
          color: "#fff",
        }}
      >
        <Typography variant="h5">Total asset value</Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h3" fontWeight="bold">
            0 ICP
          </Typography>
        </Box>
        <Box sx={{ display: "flex", mt: 8, alignItems: "center" }}>
          <CircularProgress variant="determinate" value={50} size={60} />
          <Box sx={{ ml: 4 }}>
            <Typography variant="h6">Activate your Smart Account</Typography>
            <Typography>
              1 of 2 steps completed. Finish the next steps to start using all
              Safe Account features:
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", mt: 12, gap: 3 }}>
          <Card sx={{ width: "33%" }}>
            <CardContent>
              <Typography variant="h6">Add native assets</Typography>
              <Typography>
                Receive ICP to start interacting with your account.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={handleOpen}
              >
                Receive ICP
              </Button>
            </CardContent>
          </Card>
          <Card sx={{ width: "33%" }}>
            <CardContent>
              <Typography variant="h6">
                Create your first transaction
              </Typography>
              <Typography>
                Simply send funds or add a new signer to the account.
              </Typography>
              <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                Create transaction
              </Button>
            </CardContent>
          </Card>
          <Card sx={{ width: "33%" }}>
            <CardContent>
              <Typography variant="h6">Safe Account is ready!</Typography>
              <Typography>
                Continue to improve your account security and unlock more
                features.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6">Top up the smart account</Typography>
          <Typography sx={{ mt: 2 }}>
            Send ICP to the following address to top up your account.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <TextField
              value={icpAccount || ""}
              InputProps={{
                readOnly: true,
                style: {
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  backgroundColor: "#f0f0f0",
                },
              }}
              fullWidth
              variant="outlined"
              size="small"
            />
            <IconButton onClick={handleCopy} size="small" sx={{ ml: 1 }}>
              <ContentCopy />
            </IconButton>
          </Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleClose}
          >
            Done
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Dashboard;
