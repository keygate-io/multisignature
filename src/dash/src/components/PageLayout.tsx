import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";

interface PageLayoutProps {
  main: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ main }) => {
  const location = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Header />
      <div className="w-full bg-gray-500 flex-1">
        {location.pathname === "/" ? (
          <Home />
        ) : location.pathname === "/login" ? (
          <Login />
        ) : (
          main
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PageLayout;
