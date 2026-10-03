import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, AlertTriangle, Activity, TrendingUp } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

export default function Reports() {
  const [reportStats, setReportStats] = useState([
    {
      title: "Total Reports",
      value: "0",
      iconType: "fileText",
      color: "bg-[#EDE0FF] text-[#710b9d] dark:text-[#C77DFF]",
    },
    {
      title: "Detected Cases",
      value: "0",
      iconType: "alertTriangle",
      color: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    },
    {
      title: "System Health",
      value: "Stable",
      iconType: "activity",
      color:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    },
    {
      title: "Growth Rate",
      value: "+18%",
      iconType: "trendingUp",
      color: "bg-[#F3E8FF] text-[#8A2BE2] dark:text-[#C77DFF]",
    },
  ]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.ADMIN_REPORTS);
        if (res.data && res.data.success) {
          if (res.data.reports) setReportStats(res.data.reports);
          if (res.data.recentActivities)
            setRecentActivities(res.data.recentActivities);
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (iconType) => {
    switch (iconType) {
      case "fileText":
        return <FileText size={22} />;
      case "alertTriangle":
        return <AlertTriangle size={22} />;
      case "activity":
        return <Activity size={22} />;
      case "trendingUp":
        return <TrendingUp size={22} />;
      default:
        return <FileText size={22} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#8A2BE2]/10 dark:bg-[#8A2BE2]/20 text-[#8A2BE2] dark:text-[#C77DFF] flex items-center justify-center">
              <FileText size={17} />
            </div>
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8A2BE2] dark:text-[#C77DFF]">
              Analytics Hub
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">
            AI performance audits, clinical reports, and disease prevalence
            statistics.
          </p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {reportStats.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200/90 dark:border-purple-500/25 bg-[#FAF8FF] dark:bg-[#160D2B] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A0070] via-[#8A2BE2] to-[#C77DFF]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                  {item.title}
                </p>

                <h2 className="text-3xl font-bold text-gray-950 dark:text-white mt-2">
                  {item.value}
                </h2>
              </div>

              <div
                className={`w-12 h-12 flex items-center justify-center rounded-xl ${item.color}`}
              >
                {getIcon(item.iconType)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT REPORTS */}
      <div className="rounded-2xl border border-gray-200/90 dark:border-purple-500/25 bg-[#FAF8FF] dark:bg-[#160D2B] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#3A0070] via-[#710b9d] to-[#8A2BE2]" />

        <div className="p-5 border-b border-[#E8DDF5] dark:border-[#2E1A4E] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base text-gray-950 dark:text-white">
              Recent Clinical & System Events
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-300 mt-0.5">
              Chronological log of diagnostic operations and system audits
            </p>
          </div>
          <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Audit Sync Active
          </span>
        </div>

        <div className="p-6">
          {recentActivities.length > 0 ? (
            <ul className="space-y-3 divide-y divide-[#E8DDF5] dark:divide-[#2E1A4E]">
              {recentActivities.map((act, i) => (
                <li
                  key={i}
                  className="pt-3 first:pt-0 text-xs flex items-center gap-2.5 text-gray-800 dark:text-slate-200 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-[#8A2BE2] shrink-0" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 dark:text-slate-400 text-center py-6">
              No report activity recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
