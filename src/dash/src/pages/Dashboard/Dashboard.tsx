import React, { useState } from "react";
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
import { useAccount } from "../../contexts/AccountContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { icpAccount, balance, isLoading, error } = useAccount();

  const [open, setOpen] = useState(false);
  const [multipleRouteModalOpen, setMultipleRouteModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCopy = () => {
    if (icpAccount) {
      navigator.clipboard.writeText(icpAccount).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
      });
    }
  };

  const handleMultipleRouteModalOpen = () => setMultipleRouteModalOpen(true);
  const handleMultipleRouteModalClose = () => setMultipleRouteModalOpen(false);

  const handleMultipleRouteOptionSelect = (option: string) => {
    console.log(`Selected option: ${option}`);
    if (option === "send-token") {
      navigate("/assets/send-token");
    }
    handleMultipleRouteModalClose();
  };

  return (
    <AccountPageLayout>
      <Typography variant="h5">Total asset value</Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {isLoading ? (
          <CircularProgress size={24} sx={{ mr: 2 }} />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Typography variant="h3" fontWeight="bold">
            {balance.toLocaleString()} ICP
          </Typography>
        )}
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
          {copySuccess && (
            <Typography color="success" sx={{ mt: 1 }}>
              Address copied to clipboard!
            </Typography>
          )}
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
