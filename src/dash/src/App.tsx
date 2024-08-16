import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigProvider } from "antd";
import PageLayout from "./components/PageLayout";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import CreateProfile from "./pages/NewProfile/Create";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateAccount from "./pages/NewAccount/Create";

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
        <Routes>
          <Route path="/" element={<PageLayout main={<Home />} />} />
          <Route path="/login" element={<PageLayout main={<Login />} />} />
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
        </Routes>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
