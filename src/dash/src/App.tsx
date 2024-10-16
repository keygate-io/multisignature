import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigProvider } from "antd";
import { createTheme, ThemeProvider } from "@mui/material";
import { AccountProvider } from "./contexts/AccountContext";
import PageLayout from "./components/PageLayout";
import Home from "./pages/Home/Home";
import CreateProfile from "./pages/NewProfile/Create";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateAccount from "./pages/NewAccount/Create";
import Assets from "./pages/Dashboard/Assets/Assets";
import SendToken from "./pages/Dashboard/Assets/SendToken/SendToken";
import Transactions from "./pages/Dashboard/Transactions/Transactions";
import Vaults from "./pages/Vaults";
import { VaultDetailProvider } from "./contexts/VaultDetailContext";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={darkTheme}>
        <AccountProvider>
          <ConfigProvider
            theme={{
              token: {
                fontFamily: "Inter, sans-serif",
              },
            }}
          >
            <Routes>
              <Route path="/" element={<PageLayout />}>
                <Route index element={<Home />} />
                <Route path="vaults" element={<Vaults />} />
                <Route path="vaults/:vaultId" element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="new-profile/create" element={<CreateProfile />} />
                <Route path="new-account/create" element={<CreateAccount />} />
                <Route path="assets" element={<Assets />} />
                <Route path="assets/send-token" element={<SendToken />} />
                <Route path="transactions" element={<Transactions />} />
              </Route>
            </Routes>
          </ConfigProvider>
        </AccountProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
