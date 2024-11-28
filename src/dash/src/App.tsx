import React from "react";
import { BrowserRouter, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { createTheme, ThemeProvider } from "@mui/material";
import PageLayout from "./components/PageLayout.js";
import Home from "./pages/Home/Home.js";
import CreateProfile from "./pages/NewProfile/Create/index.js";
import Dashboard from "./pages/Dashboard/Dashboard.js";
import CreateAccount from "./pages/NewAccount/Create/index.js";
import Assets from "./pages/Dashboard/Assets/Assets.js";
import SendToken from "./pages/Dashboard/Assets/SendToken/SendToken.js";
import Transactions from "./pages/Dashboard/Transactions/Transactions.js";
import Vaults from "./pages/Vaults/index.js";
import { VaultDetailProvider } from "./contexts/VaultDetailContext.js";
import Settings from "./pages/Dashboard/Settings/Settings.js";
import "@nfid/identitykit/react/styles.css"
import { IdentityKitProvider, IdentityKitTheme } from "@nfid/identitykit/react";
import { IdentityKitAuthType, InternetIdentity, NFIDW } from "@nfid/identitykit";
import { ConnectionProvider, useConnection } from "./contexts/ConnectionContext.js";


const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {

  return (
    <BrowserRouter>
      <ConnectionProvider>
        <ThemeProvider theme={darkTheme}>
          <IdentityKitProvider
            authType={IdentityKitAuthType.DELEGATION}
            signerClientOptions={{ targets: ['a3shf - 5eaaa - aaaaa - qaafa - cai'] }}
            signers={[NFIDW, InternetIdentity]}

            onConnectSuccess={() => {
              const { setIsConnected } = useConnection();
              setIsConnected(true);
            }}
          >
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
                  <Route
                    path="vaults/:vaultId"
                    element={
                      <VaultDetailProvider>
                        <Outlet />
                      </VaultDetailProvider>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="assets" element={<Assets />} />
                    <Route path="assets/send-token" element={<SendToken />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="new-profile/create" element={<CreateProfile />} />
                  <Route path="new-account/create" element={<CreateAccount />} />
                </Route>
              </Routes>
            </ConfigProvider>
          </IdentityKitProvider>
        </ThemeProvider>
      </ConnectionProvider>
    </BrowserRouter>
  );
}

export default App;
