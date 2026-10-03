import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout({ onLogout }) {
  return (
    <div className="flex h-screen bg-[#FAF8FF] dark:bg-darkBg text-heading dark:text-darkHeading overflow-hidden transition-colors duration-300">
      {/* SIDEBAR */}
      <Sidebar onLogout={onLogout} />

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 min-w-0 bg-[#FAF8FF] dark:bg-darkBg transition-colors duration-300 relative">
        {/* NAVBAR */}
        <Navbar />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-scroll p-6 bg-[#FAF8FF] dark:bg-darkBg transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
