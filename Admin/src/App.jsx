import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

import Reports from "./pages/Reports";

import Predictions from "./pages/Predictions";
import Doctors from "./pages/Doctors";
import Articles from "./pages/Articles";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("dermpaw-admin-auth") === "true",
  );

  const handleLogin = () => {
    sessionStorage.setItem("dermpaw-admin-auth", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("dermpaw-admin-auth");
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <DashboardLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="reports" element={<Reports />} />

          <Route path="predictions" element={<Predictions />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="articles" element={<Articles />} />

          {/* fallback */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
