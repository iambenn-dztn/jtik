import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import AdminPage from "./components/AdminPage";
import LoginPage from "./components/LoginPage";
import * as authService from "./services/authService";

function AppRoot() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated()
  );

  const handleLoginSuccess = (
    accessToken: string,
    refreshToken: string,
    username: string
  ) => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/admin/login"
          element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
