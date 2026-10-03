import React, { useState, useEffect } from "react";
import axios from "axios";
import { Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState({
    totalPredictions: 0,
    highRiskCases: 0,
    accuracyRate: "95.42%",
  });
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.ADMIN_PREDICTIONS);
      if (res.data && res.data.success) {
        setPredictions(res.data.predictions || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching live predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800";
      case "High Risk":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/40";
      case "Medium Risk":
        return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-900/40";
      case "Low Risk":
      case "Safe":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/40";
      default:
        return "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#8A2BE2]/10 dark:bg-[#8A2BE2]/20 text-[#8A2BE2] dark:text-[#C77DFF] flex items-center justify-center">
              <Activity size={17} />
            </div>
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8A2BE2] dark:text-[#C77DFF]">
              Diagnostics Center
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
            AI Predictions
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">
            Real-time disease detection assessments and veterinary review logs.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-gray-200/90 dark:border-purple-500/25 bg-[#FAF8FF] dark:bg-[#160D2B] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A0070] via-[#8A2BE2] to-[#C77DFF]" />
          <p className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
            Total Predictions
          </p>
          <h2 className="text-3xl font-bold mt-2 text-gray-950 dark:text-white">
            {stats.totalPredictions}
          </h2>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Live sync active
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200/90 dark:border-purple-500/25 bg-[#FAF8FF] dark:bg-[#160D2B] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-pink-500 to-amber-500" />
          <p className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
            High Risk Cases
          </p>
          <h2 className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">
            {stats.highRiskCases}
          </h2>
          <p className="text-[11px] text-red-500/80 dark:text-red-400/80 font-medium mt-2">
            Requires immediate clinical attention
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200/90 dark:border-purple-500/25 bg-[#FAF8FF] dark:bg-[#160D2B] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-[#8A2BE2]" />
          <p className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
            Accuracy Rate
          </p>
          <h2 className="text-3xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {stats.accuracyRate}
          </h2>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-2">
            DermPaw AI V2 benchmarked
          </p>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-2xl border border-gray-200/90 dark:border-purple-500/25 bg-[#FAF8FF] dark:bg-[#160D2B] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#3A0070] via-[#710b9d] to-[#8A2BE2]" />

        <div className="p-5 border-b border-[#E8DDF5] dark:border-[#2E1A4E] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base text-gray-950 dark:text-white">
              All Recorded Predictions
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-300 mt-0.5">
              Comprehensive audit logs of all pet skin disease detections
            </p>
          </div>
          <span className="text-xs font-semibold bg-[#F3E8FF] dark:bg-[#4B0082]/30 text-[#710b9d] dark:text-[#C77DFF] px-3 py-1 rounded-full border border-purple-200/60 dark:border-purple-700/40">
            {predictions.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto p-5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DDF5] dark:border-[#2E1A4E]">
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Pet
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Prediction
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Risk Status
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Doctor Review
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E8DDF5] dark:divide-[#2E1A4E]">
              {predictions.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F5F0FA]/60 dark:hover:bg-[#4B0082]/10 transition"
                >
                  <td className="py-3.5 font-semibold text-gray-900 dark:text-white text-sm">
                    {item.pet}
                  </td>

                  <td className="py-3.5 text-gray-700 dark:text-slate-200 font-medium text-sm">
                    {item.disease}
                  </td>

                  <td className="py-3.5 font-bold text-[#710b9d] dark:text-[#C77DFF] text-sm">
                    {item.confidence}%
                  </td>

                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center ${getStatusStyle(
                        item.status,
                      )}`}
                    >
                      {item.status === "Pending" && (
                        <Clock size={12} className="inline mr-1" />
                      )}
                      {item.status === "High Risk" && (
                        <AlertTriangle size={12} className="inline mr-1" />
                      )}
                      {(item.status === "Safe" ||
                        item.status === "Low Risk") && (
                        <CheckCircle size={12} className="inline mr-1" />
                      )}
                      {item.status}
                    </span>
                  </td>

                  <td className="py-3.5">
                    {item.reviewStatus === "Pending" ? (
                      <span className="inline-flex items-center text-xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
                        ⏳ Pending
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                          ✓ Reviewed
                        </span>
                        {item.doctor && (
                          <span className="text-[11px] text-gray-600 dark:text-slate-300 font-medium">
                            {item.doctor}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 text-gray-600 dark:text-slate-300 text-xs font-medium">
                    {item.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
