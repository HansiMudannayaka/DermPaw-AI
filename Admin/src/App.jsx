import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "./layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";

import Reports from "./pages/Reports";

import Predictions from "./pages/Predictions";
import Doctors from "./pages/Doctors";
import Articles from "./pages/Articles";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* DASHBOARD LAYOUT */}
        <Route path="/" element={<DashboardLayout />}>
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