import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigProvider } from "antd";
import PageLayout from "./components/PageLayout";
import Home from "./pages/Home/Home";
import CreateProfile from "./pages/NewProfile/Create";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateAccount from "./pages/NewAccount/Create";
import Assets from "./pages/Dashboard/Assets/Assets";
import SendToken from "./pages/Dashboard/Assets/SendToken/SendToken";
import { AccountProvider } from "./contexts/AccountContext";

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            fontFamily: "Inter, sans-serif",
          },
        }}
      >
        <AccountProvider>
          <Routes>
            <Route path="/" element={<PageLayout main={<Home />} />} />
            <Route
              path="/dashboard"
              element={<PageLayout main={<Dashboard />} />}
            />
            <Route
              path="/new-profile/create"
              element={<PageLayout main={<CreateProfile />} />}
            />
            <Route
              path="/new-account/create"
              element={<PageLayout main={<CreateAccount />} />}
            />
            <Route path="/assets" element={<PageLayout main={<Assets />} />} />
            <Route
              path="/assets/send-token"
              element={<PageLayout main={<SendToken />} />}
            />
          </Routes>
        </AccountProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
