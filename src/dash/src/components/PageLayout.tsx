import React, { ReactNode } from "react";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import { Box } from "@mui/material";

interface PageLayoutProps {
  main: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ main }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Box
        className="w-full flex-1 flex"
        sx={{
          backgroundColor: "#2c2c2c",
        }}
      >
        {main}
      </Box>
      <Footer />
    </div>
  );
};

export default PageLayout;
