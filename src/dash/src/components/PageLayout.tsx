import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Home from "../pages/Home/Home";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";

interface PageLayoutProps {
  main: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ main }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="w-full bg-gray-800 flex-1 flex">{main}</div>
      <Footer />
    </div>
  );
};

export default PageLayout;
