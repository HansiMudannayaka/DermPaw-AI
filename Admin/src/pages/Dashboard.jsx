import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Users,
  PawPrint,
  Activity,
  Sparkles,
  Stethoscope,
  CheckCircle2,
  Search,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  ScanLine,
  Clock3,
  AlertTriangle,
} from "lucide-react";

import StatCard from "../components/StatCard";
import ChartBox from "../components/ChartBox";
import Table from "../components/Table";
import DiseaseChart from "../components/DiseaseChart";
import TrendChart from "../components/TrendChart";
import { API_ENDPOINTS } from "../config/api";

// Shared focus-visible ring so keyboard navigation is clearly visible in
// both themes (was previously only indicated by hover states).
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2BE2]/40 dark:focus-visible:ring-[#C77DFF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0D0618]";

export default function Dashboard() {
  const navigate = useNavigate();

  // =========================================================
  // STATES
  // =========================================================

  const [stats, setStats] = useState({
    totalUsers: "0",
    totalPets: "0",
    totalScans: "0",
    aiDetections: "0",
    doctors: "0",
    reviews: "0",
  });

  const [predStats, setPredStats] = useState({
    totalPredictions: 0,
    highRiskCases: 0,
    pendingReviews: 0,
    accuracyRate: "95.42%",
  });

  const [activities, setActivities] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [diseaseDistribution, setDiseaseDistribution] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState("Daily");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  // =========================================================
  // HELPERS
  // =========================================================

  const formatTime = (dateStr) => {
    if (!dateStr) return "Just now";

    const date = new Date(dateStr);
    const now = new Date();

    const diffMin = Math.floor((now - date) / (1000 * 60));

    if (diffMin < 1) return "Just now";

    if (diffMin < 60) {
      return `${diffMin} min ago`;
    }

    const diffHours = Math.floor(diffMin / 60);

    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString();
  };

  const getActivityIcon = (action = "") => {
    const text = action.toLowerCase();

    if (text.includes("review")) {
      return <CheckCircle2 size={15} />;
    }

    if (text.includes("scan") || text.includes("prediction")) {
      return <ScanLine size={15} />;
    }

    if (text.includes("risk") || text.includes("danger")) {
      return <AlertTriangle size={15} />;
    }

    return <Activity size={15} />;
  };

  // =========================================================
  // FETCH DASHBOARD DATA
  // =========================================================

  const fetchDashboardData = async (manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      }

      const [dashRes, predRes] = await Promise.all([
        axios.get(
          `${API_ENDPOINTS.ADMIN_DASHBOARD}?period=${trendPeriod.toLowerCase()}`,
        ),
        axios.get(API_ENDPOINTS.ADMIN_PREDICTIONS),
      ]);

      if (dashRes.data?.success) {
        const data = dashRes.data;

        if (data.stats) {
          setStats({
            totalUsers: Number(data.stats.totalUsers || 0).toLocaleString(),
            totalPets: Number(data.stats.totalPets || 0).toLocaleString(),
            totalScans: Number(data.stats.totalScans || 0).toLocaleString(),
            aiDetections: Number(
              data.stats.totalDetections || 0,
            ).toLocaleString(),
            doctors: Number(data.stats.totalDoctors || 0).toLocaleString(),
            reviews: Number(data.stats.totalReviews || 0).toLocaleString(),
          });
        }

        if (data.diseaseDistribution) {
          setDiseaseDistribution(data.diseaseDistribution);
        }

        if (data.trendData) {
          setTrendData(data.trendData);
        }

        if (data.recentActivity) {
          setActivities(
            data.recentActivity.map((item) => ({
              ...item,
              time: formatTime(item.time),
            })),
          );
        }
      }

      if (predRes.data?.predictions) {
        setPredictions(
          predRes.data.predictions.map((item) => ({
            id: item.id,
            dog: item.pet,
            disease: item.disease,
            confidence:
              typeof item.confidence === "number"
                ? `${item.confidence}%`
                : item.confidence,
            status: item.status,
            reviewStatus: item.reviewStatus,
            doctor: item.doctor,
            doctorAdvice: item.doctorAdvice,
            date: item.time,
          })),
        );
      }

      if (predRes.data?.stats) {
        setPredStats(predRes.data.stats);
      }

      setError(null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);

      if (!stats.totalScans || stats.totalScans === "0") {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Unable to connect to DermPaw services.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // POLLING
  // =========================================================

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, [trendPeriod]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredPredictions = predictions.filter((item) => {
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !query ||
      item.dog?.toLowerCase().includes(query) ||
      item.disease?.toLowerCase().includes(query) ||
      item.doctor?.toLowerCase().includes(query);

    if (!matchesSearch) {
      return false;
    }

    if (riskFilter === "All") {
      return true;
    }

    if (riskFilter === "Pending") {
      return item.status === "Pending" || item.reviewStatus === "Pending";
    }

    if (riskFilter === "High Risk") {
      return item.status === "High Risk";
    }

    if (riskFilter === "Medium Risk") {
      return item.status === "Medium Risk";
    }

    if (riskFilter === "Safe") {
      return (
        item.status === "Safe" ||
        item.status === "Low Risk" ||
        item.status === "Normal"
      );
    }

    return true;
  });

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-purple-200 dark:border-purple-950" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#8A2BE2] dark:border-t-[#C77DFF] animate-spin" />
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-white">
            Loading dashboard
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
            Retrieving latest DermPaw system data
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="transition-colors duration-300">
      <div className="space-y-6">
        {/* =====================================================
            PAGE HEADER BANNER (Directly below Navbar)
        ====================================================== */}

        <div className="relative overflow-hidden rounded-2xl bg-[#FAF8FF] dark:bg-[#160D2B] border border-gray-200/90 dark:border-purple-500/25 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] p-5 md:p-6 transition-all duration-200">
          {/* Top Accent Gradient Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A0070] via-[#8A2BE2] to-[#C77DFF]" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-[#8A2BE2]/10 dark:bg-[#8A2BE2]/20 text-[#8A2BE2] dark:text-[#C77DFF] flex items-center justify-center border border-[#8A2BE2]/20 dark:border-[#C77DFF]/30">
                  <ShieldCheck size={17} />
                </div>

                <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8A2BE2] dark:text-[#C77DFF]">
                  DermPaw Administration
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
                Dashboard Overview
              </h1>

              <p className="text-xs md:text-sm text-gray-500 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Live monitoring of platform telemetry, real-time AI disease
                detections, and clinical veterinary review status.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
              <div
                className="
                  flex items-center gap-2
                  px-3.5 py-2
                  rounded-xl
                  border border-emerald-200/60
                  dark:border-emerald-500/30
                  bg-emerald-50/60
                  dark:bg-emerald-500/15
                  text-xs font-semibold
                  text-emerald-700
                  dark:text-emerald-300
                  shadow-sm
                "
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 dark:bg-emerald-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                </span>
                All Systems Online
              </div>

              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className={`
                  inline-flex items-center gap-2
                  px-4 py-2.5
                  rounded-xl
                  border border-[#E8DDF5]
                  dark:border-[#3D1A6E]
                  bg-white
                  dark:bg-[#1A0F32]
                  text-xs font-semibold
                  text-[#710b9d]
                  dark:text-[#C77DFF]
                  hover:bg-[#F3E8FF]
                  dark:hover:bg-[#8A2BE2]/20
                  hover:border-[#8A2BE2]/50
                  transition
                  shadow-sm
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  ${FOCUS_RING}
                `}
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin text-[#8A2BE2]" : ""}
                />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            className="
              flex items-start gap-3
              rounded-xl
              border border-red-200
              dark:border-red-500/30
              bg-red-50
              dark:bg-red-500/[0.1]
              px-4 py-3
            "
          >
            <AlertTriangle
              size={17}
              className="text-red-500 dark:text-red-400 mt-0.5 shrink-0"
            />

            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                Dashboard connection issue
              </p>

              <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-0.5">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            STAT CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users size={19} />}
            color="bg-[#F3E8FF] text-[#710b9d] dark:bg-[#4B0082]/20 dark:text-[#C77DFF]"
          />

          <StatCard
            title="Total Pets"
            value={stats.totalPets}
            icon={<PawPrint size={19} />}
            color="bg-[#EDE0FF] text-[#8A2BE2] dark:bg-[#8A2BE2]/15 dark:text-[#C77DFF]"
          />

          <StatCard
            title="Total Scans"
            value={stats.totalScans}
            icon={<Activity size={19} />}
            color="bg-[#F5F0FA] text-[#4B0082] dark:bg-[#710b9d]/20 dark:text-violet-300"
          />

          <StatCard
            title="AI Detections"
            value={stats.aiDetections}
            icon={<Sparkles size={19} />}
            color="bg-[#F3E8FF] text-[#3A0070] dark:bg-purple-500/15 dark:text-purple-300"
          />

          <StatCard
            title="Doctors"
            value={stats.doctors}
            icon={<Stethoscope size={19} />}
            color="bg-[#EDE0FF] text-[#710b9d] dark:bg-[#8A2BE2]/15 dark:text-[#C77DFF]"
          />

          <StatCard
            title="Doctor Reviews"
            value={stats.reviews}
            icon={<CheckCircle2 size={19} />}
            color="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          />
        </div>

        {/* =====================================================
            FIRST ROW
        ====================================================== */}

        <div className="grid grid-cols-12 gap-5">
          {/* SCAN TREND */}

          <section
            className="
              col-span-12
              xl:col-span-6
              rounded-2xl
              border border-gray-200/90
              dark:border-purple-500/25
              bg-white
              dark:bg-[#160D2B]
              shadow-[0_1px_2px_rgba(0,0,0,0.03)]
              dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)]
              p-5
            "
          >
            <div className="-mx-5 -mt-5 mb-5 h-1 rounded-t-2xl bg-gradient-to-r from-[#3A0070] via-[#8A2BE2] to-[#C77DFF]" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">
                  Scans Overview
                </h2>

                <p className="text-xs text-gray-500 dark:text-slate-300 mt-1">
                  AI prediction volume across the selected period
                </p>
              </div>

              <select
                value={trendPeriod}
                onChange={(e) => setTrendPeriod(e.target.value)}
                className={`
                  min-w-[125px]
                  rounded-lg
                  border border-gray-200
                  dark:border-[#3D1A6E]
                  bg-white
                  dark:bg-[#1A0F32]
                  dark:[color-scheme:dark]
                  px-3 py-2
                  text-xs font-semibold
                  text-gray-700
                  dark:text-slate-100
                  outline-none
                  focus:border-[#8A2BE2]
                  dark:focus:border-[#C77DFF]
                  focus:ring-2
                  focus:ring-[#8A2BE2]/15
                  dark:focus:ring-[#C77DFF]/20
                  transition
                  ${FOCUS_RING}
                `}
              >
                <option
                  value="Daily"
                  className="bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100"
                >
                  Daily
                </option>
                <option
                  value="Weekly"
                  className="bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100"
                >
                  Weekly
                </option>
                <option
                  value="Monthly"
                  className="bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100"
                >
                  Monthly
                </option>
              </select>
            </div>

            <TrendChart data={trendData} period={trendPeriod} />
          </section>

          {/* DISEASE DISTRIBUTION */}

          <section
            className="
              col-span-12
              md:col-span-7
              xl:col-span-4
              rounded-2xl
              border border-gray-200/90
              dark:border-purple-500/25
              bg-white
              dark:bg-[#160D2B]
              shadow-[0_1px_2px_rgba(0,0,0,0.03)]
              dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)]
              p-5
            "
          >
            <div className="-mx-5 -mt-5 mb-4 h-1 rounded-t-2xl bg-gradient-to-r from-[#710b9d] via-[#8A2BE2] to-[#C77DFF]" />

            <div className="mb-3">
              <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">
                Disease Distribution
              </h2>

              <p className="text-xs text-gray-500 dark:text-slate-300 mt-1">
                Distribution of classified skin conditions
              </p>
            </div>

            <DiseaseChart data={diseaseDistribution} />
          </section>

          {/* ACTIVITY */}

          <section
            className="
              col-span-12
              md:col-span-5
              xl:col-span-2
              rounded-2xl
              border border-gray-200/90
              dark:border-purple-500/25
              bg-white
              dark:bg-[#160D2B]
              shadow-[0_1px_2px_rgba(0,0,0,0.03)]
              dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)]
              p-5
              flex flex-col
            "
          >
            <div className="-mx-5 -mt-5 mb-4 h-1 rounded-t-2xl bg-gradient-to-r from-[#4B0082] via-[#710b9d] to-[#8A2BE2]" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">
                  Activity
                </h2>

                <p className="text-[11px] text-gray-500 dark:text-slate-300 mt-0.5">
                  Recent system events
                </p>
              </div>

              <span
                className="
                  inline-flex items-center gap-1.5
                  rounded-full
                  bg-emerald-50
                  dark:bg-emerald-500/15
                  px-2 py-1
                  text-[10px]
                  font-semibold
                  text-emerald-700
                  dark:text-emerald-300
                "
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Live
              </span>
            </div>

            <div className="space-y-1 flex-1">
              {activities.length === 0 ? (
                <div className="h-full min-h-[170px] flex items-center justify-center">
                  <div className="text-center">
                    <Clock3
                      size={20}
                      className="mx-auto text-gray-300 dark:text-slate-400"
                    />

                    <p className="text-xs text-gray-500 dark:text-slate-300 mt-2">
                      No recent activity
                    </p>
                  </div>
                </div>
              ) : (
                activities.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="
                      flex items-start gap-3
                      py-3
                      border-b border-gray-100
                      dark:border-[#1E1040]
                      last:border-0
                    "
                  >
                    <div
                      className="
                        w-8 h-8
                        rounded-lg
                        shrink-0
                        bg-purple-50
                        dark:bg-purple-500/15
                        text-[#8A2BE2]
                        dark:text-[#C77DFF]
                        flex items-center
                        justify-center
                      "
                    >
                      {getActivityIcon(item.action)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 truncate">
                        {item.pet || "System activity"}
                      </p>

                      <p className="text-[10px] text-gray-500 dark:text-slate-300 mt-0.5 line-clamp-2">
                        {item.action}
                      </p>

                      <p className="text-[9px] text-gray-400 dark:text-slate-400 mt-1">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate("/predictions")}
              className={`
                mt-4
                w-full
                inline-flex items-center justify-center gap-1.5
                rounded-lg
                border border-gray-200
                dark:border-[#3D1A6E]
                px-3 py-2
                text-[11px]
                font-semibold
                text-gray-700
                dark:text-slate-100
                hover:border-purple-300
                dark:hover:border-purple-600/70
                hover:text-[#8A2BE2]
                dark:hover:text-[#9F3FBF]
                transition
                ${FOCUS_RING}
              `}
            >
              View activity
              <ArrowUpRight size={12} />
            </button>
          </section>

          {/* =================================================
              RECENT PREDICTIONS
          ================================================== */}

          <section
            className="
              col-span-12
              xl:col-span-7
              rounded-2xl
              border border-gray-200/90
              dark:border-purple-500/25
              bg-white
              dark:bg-[#160D2B]
              shadow-[0_1px_2px_rgba(0,0,0,0.03)]
              dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)]
              overflow-hidden
            "
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#3A0070] via-[#710b9d] to-[#8A2BE2]" />

            <div className="p-5 border-b border-[#E8DDF5] dark:border-[#2E1A4E]">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">
                      Recent Predictions
                    </h2>

                    <span
                      className="
                        rounded-md
                        bg-purple-50
                        dark:bg-purple-500/15
                        px-2 py-0.5
                        text-[10px]
                        font-semibold
                        text-purple-700
                        dark:text-purple-300
                      "
                    >
                      {filteredPredictions.length}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-slate-300 mt-1">
                    Latest AI assessments and veterinary review status
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Search */}

                  <div className="relative min-w-[210px]">
                    <Search
                      size={14}
                      className="
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-gray-400
                        dark:text-slate-400
                      "
                    />

                    <input
                      type="text"
                      placeholder="Search pet, disease, doctor"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`
                        w-full
                        rounded-lg
                        border border-gray-200
                        dark:border-[#3D1A6E]
                        bg-[#FAF8FF]
                        dark:bg-[#1A0F32]
                        pl-9 pr-3 py-2
                        text-xs
                        text-gray-800
                        dark:text-slate-100
                        placeholder:text-gray-400
                        dark:placeholder:text-slate-400
                        outline-none
                        focus:bg-white
                        dark:focus:bg-[#1E1040]
                        focus:border-[#8A2BE2]
                        dark:focus:border-[#C77DFF]
                        focus:ring-2
                        focus:ring-[#8A2BE2]/15
                        dark:focus:ring-[#C77DFF]/20
                        transition
                        ${FOCUS_RING}
                      `}
                    />
                  </div>

                  {/* Filter */}

                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className={`
                      rounded-lg
                      border border-gray-200
                      dark:border-[#3D1A6E]
                      bg-[#FAF8FF]
                      dark:bg-[#1A0F32]
                      dark:[color-scheme:dark]
                      px-3 py-2
                      text-xs font-semibold
                      text-gray-700
                      dark:text-slate-100
                      outline-none
                      focus:border-[#8A2BE2]
                      dark:focus:border-[#C77DFF]
                      focus:ring-2
                      focus:ring-[#8A2BE2]/15
                      dark:focus:ring-[#C77DFF]/20
                      ${FOCUS_RING}
                    `}
                  >
                    <option
                      value="All"
                      className="bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100"
                    >
                      All risks
                    </option>
                    <option
                      value="Pending"
                      className="bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100"
                    >
                      Pending review
                    </option>
                    <option
                      value="High Risk"
                      className="bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100"
                    >
                      High risk
                    </option>
                    <option
                      value="Medium Risk"
                      className="bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100"
                    >
                      Medium risk
                    </option>
                    <option
                      value="Safe"
                      className="bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100"
                    >
                      Low / Safe
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={() => navigate("/predictions")}
                    className={`
                      inline-flex
                      items-center
                      justify-center
                      gap-1.5
                      rounded-lg
                      bg-gradient-to-r
                      from-[#3A0070] to-[#8A2BE2]
                      dark:from-[#4B0082] dark:to-[#8A2BE2]
                      hover:brightness-110
                      px-4 py-2
                      text-xs
                      font-semibold
                      text-white
                      shadow-sm
                      transition
                      ${FOCUS_RING}
                    `}
                  >
                    Full table
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5">
              <Table data={filteredPredictions} hideHeader={true} />
            </div>
          </section>

          {/* =================================================
              AI PERFORMANCE
          ================================================== */}

          <section
            className="
              col-span-12
              md:col-span-6
              xl:col-span-3
              rounded-2xl
              border border-gray-200/90
              dark:border-purple-500/25
              bg-white
              dark:bg-[#160D2B]
              shadow-[0_1px_2px_rgba(0,0,0,0.03)]
              dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)]
              p-5
            "
          >
            <div className="-mx-5 -mt-5 mb-4 h-1 rounded-t-2xl bg-gradient-to-r from-[#4B0082] via-[#8A2BE2] to-[#C77DFF]" />

            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">
                  AI Performance
                </h2>

                <p className="text-xs text-gray-500 dark:text-slate-300 mt-1">
                  Current model monitoring
                </p>
              </div>

              <span
                className="
                  inline-flex items-center gap-1.5
                  rounded-full
                  bg-emerald-50
                  dark:bg-emerald-500/15
                  px-2.5 py-1
                  text-[10px]
                  font-semibold
                  text-emerald-700
                  dark:text-emerald-300
                "
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Active
              </span>
            </div>

            <ChartBox data={trendData} />

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#1E1040]">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-slate-300">
                    Model Accuracy
                  </p>

                  <h3 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white mt-1">
                    {predStats.accuracyRate }
                  </h3>
                </div>

                <div
                  className="
                    w-10 h-10
                    rounded-xl
                    bg-purple-50
                    dark:bg-purple-500/15
                    text-[#8A2BE2]
                    dark:text-[#C77DFF]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Sparkles size={18} />
                </div>
              </div>

              <div className="mt-4 h-2 rounded-full bg-gray-100 dark:bg-[#1E1040] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3A0070] via-[#710b9d] to-[#C77DFF] dark:from-[#3A0070] dark:via-[#8A2BE2] dark:to-[#C77DFF] transition-all duration-700"
                  style={{
                    width: `${parseFloat(predStats.accuracyRate) || 95.42}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div
                  className="
                    rounded-xl
                    border border-red-100
                    dark:border-red-500/25
                    bg-red-50/70
                    dark:bg-red-500/[0.1]
                    p-3
                  "
                >
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle
                      size={13}
                      className="text-red-500 dark:text-red-400"
                    />

                    <span className="text-[10px] font-medium text-gray-500 dark:text-slate-300">
                      High risk
                    </span>
                  </div>

                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {predStats.highRiskCases || 0}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    border border-amber-100
                    dark:border-amber-500/25
                    bg-amber-50/70
                    dark:bg-amber-500/[0.1]
                    p-3
                  "
                >
                  <div className="flex items-center gap-1.5">
                    <Clock3
                      size={13}
                      className="text-amber-500 dark:text-amber-400"
                    />

                    <span className="text-[10px] font-medium text-gray-500 dark:text-slate-300">
                      Pending
                    </span>
                  </div>

                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {predStats.pendingReviews || 0}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              QUICK ACTIONS
          ================================================== */}

          <section
            className="
              col-span-12
              md:col-span-6
              xl:col-span-2
              rounded-2xl
              border border-gray-200/90
              dark:border-purple-500/25
              bg-white
              dark:bg-[#160D2B]
              shadow-[0_1px_2px_rgba(0,0,0,0.03)]
              dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)]
              p-5
              flex flex-col
            "
          >
            <div className="-mx-5 -mt-5 mb-4 h-1 rounded-t-2xl bg-gradient-to-r from-[#3A0070] via-[#710b9d] to-[#8A2BE2]" />

            <div>
              <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">
                Quick Actions
              </h2>

              <p className="text-[11px] text-gray-500 dark:text-slate-300 mt-1 mb-4">
                Administrative tools
              </p>
            </div>

            <div className="space-y-2 flex-1">
              {/* Doctors */}

              <button
                type="button"
                onClick={() => navigate("/Doctors")}
                className={`
                  w-full
                  flex items-center gap-3
                  rounded-xl
                  border border-gray-200
                  dark:border-[#3D1A6E]
                  bg-[#FAF8FF]/70
                  dark:bg-[#1A0F32]
                  p-3
                  text-left
                  hover:border-purple-300
                  dark:hover:border-purple-600/70
                  hover:bg-purple-50/60
                  dark:hover:bg-purple-500/[0.1]
                  transition
                  group
                  ${FOCUS_RING}
                `}
              >
                <div
                  className="
                    w-9 h-9
                    shrink-0
                    rounded-lg
                    bg-[#F3E8FF] dark:bg-[#4B0082]/30 text-[#710b9d] dark:text-[#C77DFF]
                    flex items-center justify-center
                  "
                >
                  <Stethoscope size={17} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-100">
                    Doctors
                  </p>

                  <p className="text-[9px] text-gray-500 dark:text-slate-300 mt-0.5">
                    Manage accounts
                  </p>
                </div>
              </button>

              {/* Predictions */}

              <button
                type="button"
                onClick={() => navigate("/predictions")}
                className={`
                  w-full
                  flex items-center gap-3
                  rounded-xl
                  border border-gray-200
                  dark:border-[#3D1A6E]
                  bg-[#FAF8FF]/70
                  dark:bg-[#1A0F32]
                  p-3
                  text-left
                  hover:border-purple-300
                  dark:hover:border-purple-600/70
                  hover:bg-purple-50/60
                  dark:hover:bg-purple-500/[0.1]
                  transition
                  ${FOCUS_RING}
                `}
              >
                <div
                  className="
                    w-9 h-9
                    shrink-0
                    rounded-lg
                    bg-[#EDE0FF] dark:bg-[#8A2BE2]/20 text-[#8A2BE2] dark:text-[#C77DFF]
                    flex items-center justify-center
                  "
                >
                  <ScanLine size={17} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-100">
                    Predictions
                  </p>

                  <p className="text-[9px] text-gray-500 dark:text-slate-300 mt-0.5">
                    Review AI scans
                  </p>
                </div>
              </button>

              {/* Reports */}

              <button
                type="button"
                onClick={() => navigate("/reports")}
                className={`
                  w-full
                  flex items-center gap-3
                  rounded-xl
                  border border-gray-200
                  dark:border-[#3D1A6E]
                  bg-[#FAF8FF]/70
                  dark:bg-[#1A0F32]
                  p-3
                  text-left
                  hover:border-purple-300
                  dark:hover:border-purple-600/70
                  hover:bg-purple-50/60
                  dark:hover:bg-purple-500/[0.1]
                  transition
                  ${FOCUS_RING}
                `}
              >
                <div
                  className="
                    w-9 h-9
                    shrink-0
                    rounded-lg
                    bg-[#F3E8FF] dark:bg-[#8A2BE2]/15 text-[#3A0070] dark:text-[#C77DFF]
                    flex items-center justify-center
                  "
                >
                  <FileText size={17} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-100">
                    Reports
                  </p>

                  <p className="text-[9px] text-gray-500 dark:text-slate-300 mt-0.5">
                    View analytics
                  </p>
                </div>
              </button>
            </div>

            {/* Health */}

            <div
              className="
                mt-4
                rounded-xl
                border border-gray-200
                dark:border-[#3D1A6E]
                bg-[#FAF8FF]
                dark:bg-[#1A0F32]
                px-3 py-3
              "
            >
              <div className="flex items-center gap-2">
                <div
                  className="
                    w-8 h-8
                    rounded-lg
                    bg-emerald-50
                    dark:bg-emerald-500/15
                    text-emerald-600
                    dark:text-emerald-400
                    flex items-center justify-center
                  "
                >
                  <ShieldCheck size={15} />
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wide font-semibold text-gray-400 dark:text-slate-400">
                    System Health
                  </p>

                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    All services online
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
