import React from "react";
import { Box, Typography } from "@mui/material";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        width: "100%",
        maxHeight: "10vh",
        display: "flex",
        alignItems: "center",
        px: 3,
        py: 2,
      }}
    >
      <Typography variant="body2">
        &copy; {new Date().getFullYear()} Keygate Vault
      </Typography>
    </Box>
  );
};

export default Footer;
