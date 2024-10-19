import React from "react";
import {
  Box,
  Typography,
  Modal,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  RotateRight as RotateRightIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  SwapHoriz as SwapHorizIcon,
  Code as CodeIcon,
  Send as SendIcon,
} from "@mui/icons-material";

interface MultipleRouteModalProps {
  open: boolean;
  onClose: () => void;
  onOptionSelect: (option: string) => void;
}

const modalOptions = [
  // {
  //   title: "Add another signer",
  //   description: "Improve the security of your Smart Account",
  //   icon: <PersonAddIcon />,
  //   key: "add-signer",
  // },
  // {
  //   title: "Swap tokens",
  //   description: "Trade any token",
  //   icon: <SwapHorizIcon />,
  //   key: "swap-tokens",
  // },
  // {
  //   title: "Custom transaction",
  //   description: "Compose custom contract interactions",
  //   icon: <CodeIcon />,
  //   key: "custom-transaction",
  // },
  {
    title: "Send token",
    description: "Send tokens to another address",
    icon: <SendIcon />,
    key: "send-token",
  },
];

const MultipleRouteModal: React.FC<MultipleRouteModalProps> = ({
  open,
  onClose,
  onOptionSelect,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="multiple-route-modal-title"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            id="multiple-route-modal-title"
            variant="h6"
            component="h2"
          >
            Create new transaction
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {modalOptions.map((option) => (
            <ListItem
              key={option.key}
              button
              onClick={() => onOptionSelect(option.key)}
              sx={{
                borderRadius: 1,
                mb: 1,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{option.icon}</ListItemIcon>
              <ListItemText
                primary={option.title}
                secondary={option.description}
                primaryTypographyProps={{ fontWeight: "medium" }}
                secondaryTypographyProps={{ variant: "body2" }}
              />
              <ChevronRightIcon />
            </ListItem>
          ))}
        </List>
      </Box>
    </Modal>
  );
};

export default MultipleRouteModal;
