import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Activity,
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const [totalScans, setTotalScans] = useState(12);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.ADMIN_DASHBOARD);
        if (
          res.data &&
          res.data.stats &&
          res.data.stats.totalScans !== undefined
        ) {
          setTotalScans(res.data.stats.totalScans);
        }
      } catch {
        // silent fallback
      }
    };
    fetchScans();
    const interval = setInterval(fetchScans, 15000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Doctors", icon: Users, path: "/Doctors" },
    { name: "Articles", icon: PawPrint, path: "/Articles" },
    { name: "Predictions", icon: Activity, path: "/predictions" },
    // { name: "Reports", icon: FileText, path: "/reports" },
  ];

  return (
    <aside className="w-72 shrink-0 h-screen bg-gradient-to-b from-[#0A0320] via-[#1E0B45] to-[#0A0320] text-white flex flex-col shadow-2xl shadow-purple-900/60">
      {/* LOGO */}
      <div className="h-24 flex items-center px-8 border-b border-white/15">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-white">
            DermPaw AI
          </h1>
          <p className="text-xs text-[#E8D9FF]/70 mt-1">Admin Dashboard</p>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 px-4 py-6">
        <p className="text-xs uppercase tracking-wider text-[#E8D9FF]/50 mb-4 px-4">
          Main Menu
        </p>

        <div className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300
                  
                  ${
                    isActive
                      ? "bg-white/20 shadow-lg border border-white/25 text-white"
                      : "hover:bg-white/10 text-[#E8D9FF]"
                  }`
                }
              >
                <Icon size={20} />

                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* QUICK STATS CARD */}
      <div className="px-4">
        <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
          <p className="text-sm text-[#E8D9FF]/80">Total Scans Logged</p>

          <h2 className="text-3xl font-bold mt-2 text-white">{totalScans}</h2>

          <p className="text-emerald-300 text-xs mt-1 flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live backend sync
          </p>
        </div>
      </div>

      {/* USER PROFILE */}
      <div className="p-4 mt-6 border-t border-white/15">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#F3E8FF] to-[#E8D9FF] text-[#4B0082] flex items-center justify-center font-bold text-lg">
            A
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-white">Admin User</h4>
            <p className="text-xs text-[#E8D9FF]/70">System Administrator</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onLogout();
            navigate("/login", { replace: true });
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/15 text-red-200 hover:bg-red-500/25 transition border border-red-400/20"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
