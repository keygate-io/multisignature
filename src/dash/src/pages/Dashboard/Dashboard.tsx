import { Principal } from "@dfinity/principal";
import { useInternetIdentity } from "../../hooks/use-internet-identity";
import { useEffect, useState } from "react";
import { getUser } from "../../api/users";
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
} from "@mui/material";

const Dashboard = () => {
  const { identity } = useInternetIdentity();
  const [account, setAccount] = useState<Principal | null>(null);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    function fetchUser() {
      if (identity) {
        getUser(identity.getPrincipal()).then((user) => {
          if (user) {
            setAccount(user.accounts[0]);
          } else {
            navigate("/new-account");
          }
        });
      }
    }

    fetchUser();
  }, [identity]);

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
        <Typography variant="h3" fontWeight="bold">
          0 ICP
        </Typography>
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
              <Button variant="contained" color="primary" sx={{ mt: 2 }}>
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
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6">Text in a modal</Typography>
          <Typography sx={{ mt: 2 }}>
            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
          </Typography>
        </Box>
      </Modal>
    </Box>
  );
};

export default Dashboard;
