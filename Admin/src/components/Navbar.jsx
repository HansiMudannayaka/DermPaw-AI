import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
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
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 flex items-center justify-between transition-all duration-300">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Welcome back, Admin 👋
        </p>
      </div>

      <div className="flex items-center gap-4">

        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="
              w-80
              pl-11
              pr-4
              py-3
              rounded-2xl
              border
              border-gray-200
              dark:border-slate-700
              bg-gray-50
              dark:bg-slate-800
              text-gray-800
              dark:text-white
              focus:outline-none
              focus:ring-2
              focus:ring-purple-500
              transition-all
            "
          />
        </div>

        {/* Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="
            h-12
            w-12
            rounded-2xl
            bg-gray-50
            dark:bg-slate-800
            border
            border-gray-200
            dark:border-slate-700
            flex
            items-center
            justify-center
            text-gray-700
            dark:text-yellow-400
            hover:scale-105
            transition-all
          "
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button className="
          relative
          h-12
          w-12
          rounded-2xl
          bg-gray-50
          dark:bg-slate-800
          border
          border-gray-200
          dark:border-slate-700
          flex
          items-center
          justify-center
          text-gray-700
          dark:text-white
        ">
          <Bell size={20} />

          <span className="
            absolute
            -top-1
            -right-1
            h-5
            w-5
            rounded-full
            bg-red-500
            text-white
            text-[10px]
            flex
            items-center
            justify-center
          ">
            8
          </span>
        </button>

        {/* Profile */}
        <button className="
          flex
          items-center
          gap-3
          px-3
          py-2
          rounded-2xl
          border
          border-gray-200
          dark:border-slate-700
          bg-white
          dark:bg-slate-800
        ">
          <div className="
            w-10
            h-10
            rounded-full
            bg-gradient-to-r
            from-purple-600
            to-indigo-600
            text-white
            flex
            items-center
            justify-center
            font-bold
          ">
            A
          </div>

          <div className="hidden lg:block text-left">
            <p className="font-semibold text-sm text-gray-800 dark:text-white">
              Admin User
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Administrator
            </p>
          </div>

          <ChevronDown
            size={16}
            className="text-gray-500 dark:text-gray-400"
          />
        </button>

      </div>
    </header>
  );
}