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
  IconButton,
  TextField,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { CheckCircleFilled } from "@ant-design/icons";
import AccountPageLayout from "../AccountPageLayout";
import MultipleRouteModal from "../../modals/MultipleRouteModal";

const BALANCE_REFRESH_DELAY = 2000;

const Dashboard = () => {
  const { identity } = useInternetIdentity();
  const [account, setAccount] = useState<Principal | null>(null);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [multipleRouteModalOpen, setMultipleRouteModalOpen] = useState(false);
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

  const handleMultipleRouteModalOpen = () => setMultipleRouteModalOpen(true);
  const handleMultipleRouteModalClose = () => setMultipleRouteModalOpen(false);

  const handleMultipleRouteOptionSelect = (option: string) => {
    console.log(`Selected option: ${option}`);
    // Handle the selected option here
    handleMultipleRouteModalClose();
  };

  async function requestBalance() {
    if (!icpAccount) {
      console.log("No ICP account");
      return;
    }

    console.log("Checking balance for", icpAccount);
    const balance = await balanceOf(icpAccount as string);
    console.log(
      "ICP subaccount balance is ",
      JSON.stringify(balance.e8s.toString())
    );
    setBalance(balance.e8s);
  }

  useEffect(() => {
    const refresh = setInterval(() => requestBalance(), BALANCE_REFRESH_DELAY);

    return () => {
      clearInterval(refresh);
    };
  }, [icpAccount, requestBalance]);

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
    <AccountPageLayout>
      <Typography variant="h5">Total asset value</Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="h3" fontWeight="bold">
          {balance.toLocaleString()} ICP
        </Typography>
      </Box>
      <Box sx={{ display: "flex", mt: 8, alignItems: "center" }}>
        <CircularProgress variant="determinate" value={50} size={60} />
        <Box sx={{ ml: 4 }}>
          <Typography variant="h6">Activate your Smart Account</Typography>
          <Typography>
            1 of 2 steps completed. Finish the next steps to start using all
            Smart Account features:
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", mt: 12, gap: 3 }}>
        <Card sx={{ width: "33%" }}>
          <CardContent>
            {balance != BigInt(0) && <CheckCircleFilled />}
            <Typography variant="h6">Add native assets</Typography>
            <Typography>
              Receive ICP to start interacting with your account.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleOpen}
              disabled={balance != BigInt(0)}
            >
              Receive ICP
            </Button>
          </CardContent>
        </Card>
        <Card sx={{ width: "33%" }}>
          <CardContent>
            <Typography variant="h6">Create your first transaction</Typography>
            <Typography>
              Simply send funds or add a new signer to the account.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleMultipleRouteModalOpen}
            >
              Create transaction
            </Button>
          </CardContent>
        </Card>
        <Card sx={{ width: "33%" }}>
          <CardContent>
            <Typography variant="h6">Smart Account is ready!</Typography>
            <Typography>
              Continue to improve your account security and unlock more
              features.
            </Typography>
          </CardContent>
        </Card>
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
      <MultipleRouteModal
        open={multipleRouteModalOpen}
        onClose={handleMultipleRouteModalClose}
        onOptionSelect={handleMultipleRouteOptionSelect}
      />
    </AccountPageLayout>
  );
};

export default Dashboard;
