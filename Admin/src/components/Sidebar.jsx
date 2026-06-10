import {
  LayoutDashboard,
  Users,
  PawPrint,
  Activity,
  FileText,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Doctors", icon: Users, path: "/Doctors" },
    { name: "Articles", icon: PawPrint, path: "/Articles" },
    { name: "Predictions", icon: Activity, path: "/predictions" },
    { name: "Reports", icon: FileText, path: "/reports" },
    
  ];

  return (
    <aside className="w-72 min-h-screen bg-gradient-to-b from-[#071B5B] via-[#04184A] to-[#020F3A] text-white flex flex-col">

      {/* LOGO */}
      <div className="h-24 flex items-center px-8 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">
            DermPaw AI
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Admin Dashboard
          </p>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 px-4 py-6">
        <p className="text-xs uppercase tracking-wider text-white/40 mb-4 px-4">
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
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg"
                      : "hover:bg-white/10"
                  }`
                }
              >
                <Icon size={20} />

                <span className="font-medium">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* QUICK STATS CARD */}
      <div className="px-4">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <p className="text-sm text-white/70">
            Today's Predictions
          </p>

          <h2 className="text-3xl font-bold mt-2">
            86
          </h2>

          <p className="text-green-400 text-sm mt-1">
            +12% from yesterday
          </p>
        </div>
      </div>

      {/* USER PROFILE */}
      <div className="p-4 mt-6 border-t border-white/10">

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center font-bold">
            A
          </div>

          <div className="flex-1">
            <h4 className="font-semibold">
              Admin User
            </h4>
            <p className="text-xs text-white/60">
              System Administrator
            </p>
          </div>
        </div>

        <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25 transition">
          <LogOut size={18} />
          Logout
        </button>
      </div>

    </aside>
  );
}