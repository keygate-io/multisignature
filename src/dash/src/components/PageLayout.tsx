import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header/Header.js";
import Footer from "./Footer/Footer.js";
import { Box } from "@mui/material";

const PageLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Box
        className="w-full flex-1 flex"
        sx={{
          backgroundColor: "#2c2c2c",
        }}
      >
        <Outlet />
      </Box>
      <Footer />
    </div>
  );
};

export default PageLayout;
