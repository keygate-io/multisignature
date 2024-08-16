import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigProvider } from "antd";
import PageLayout from "./components/PageLayout";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import CreateProfile from "./pages/NewProfile/Create";

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
            path="/new-profile/create"
            element={<PageLayout main={<CreateProfile />} />}
          />
        </Routes>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
