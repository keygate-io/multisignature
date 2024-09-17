import React from "react";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ width: "100%", maxHeight: "20vh", py: 1 }}>
          <Typography variant="h5" component="h1">
            Keygate
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
