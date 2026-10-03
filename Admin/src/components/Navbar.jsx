import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { Search, Moon, Sun, ChevronDown, Sparkles } from "lucide-react";

const PAGE_TITLES = {
  "/": {
    title: "Dashboard Overview",
    subtitle: "Platform monitoring & diagnostics summary",
  },
  "/Doctors": {
    title: "Veterinary Doctors",
    subtitle: "Manage verified clinical specialists",
  },
  "/predictions": {
    title: "AI Predictions",
    subtitle: "Real-time AI diagnostic detection records",
  },
  "/reports": {
    title: "Reports & Analytics",
    subtitle: "System telemetry and disease prevalence",
  },
  "/Articles": {
    title: "Care Articles",
    subtitle: "Educational guides for dog parents",
  },
};

export default function Navbar() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);

  const currentMeta = PAGE_TITLES[location.pathname] || {
    title: "DermPaw Administration",
    subtitle: "DermPaw AI Veterinary Management Panel",
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  return (
    /* ── Always dark purple header — no light-mode fallback ── */
    <header className="h-20 shrink-0 bg-[#160D2B] backdrop-blur-md border-b border-[#2E1A4E] px-6 flex items-center justify-between transition-colors duration-300 shadow-[0_2px_16px_rgba(138,43,226,0.12)] relative z-40">
      {/* Dynamic Page Indicator */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[#8A2BE2]/25 text-[#C77DFF] items-center justify-center shrink-0 border border-[#8A2BE2]/30">
          <Sparkles size={18} />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
            {currentMeta.title}
          </h1>
          <p className="text-xs text-[#C77DFF]/80 hidden md:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A2BE2]/70"
          />
          <input
            type="text"
            placeholder="Search records, pets, doctors..."
            className="
              w-64 lg:w-72
              pl-10
              pr-4
              py-2
              rounded-xl
              border border-[#3D1A6E]
              bg-[#1A0F32]
              text-slate-100
              placeholder:text-slate-500
              focus:outline-none
              focus:ring-2
              focus:ring-[#8A2BE2]/40
              focus:border-[#8A2BE2]/60
              transition-all
              text-xs
            "
          />
        </div>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="
            h-10
            w-10
            rounded-xl
            bg-[#1A0F32]
            border border-[#3D1A6E]
            flex
            items-center
            justify-center
            text-amber-400
            hover:border-[#8A2BE2]/60
            hover:bg-[#2E1A4E]
            transition-colors
            cursor-pointer
            shadow-sm
          "
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Profile Button — always dark purple */}
        <button
          type="button"
          className="
            flex
            items-center
            gap-2.5
            px-3
            py-1.5
            rounded-xl
            border border-[#3D1A6E]
            bg-[#1A0F32]
            hover:border-[#8A2BE2]/60
            hover:bg-[#2E1A4E]
            transition
            shadow-sm
          "
        >
          <div
            className="
            w-8
            h-8
            rounded-lg
            bg-gradient-to-r
            from-[#3A0070]
            to-[#8A2BE2]
            text-white
            flex
            items-center
            justify-center
            font-bold
            text-xs
            shadow-sm
          "
          >
            A
          </div>

          <div className="hidden lg:block text-left">
            <p className="font-semibold text-xs text-white">Admin User</p>
            <p className="text-[10px] text-[#C77DFF] font-medium">
              Super Admin
            </p>
          </div>

          <ChevronDown size={13} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
}
