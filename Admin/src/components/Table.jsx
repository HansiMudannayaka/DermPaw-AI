const data = [
  {
    id: 1,
    dog: "Buddy",
    disease: "Mange",
    confidence: "96%",
    status: "Detected",
    date: "2026-06-01",
  },
  {
    id: 2,
    dog: "Rocky",
    disease: "Ringworm",
    confidence: "91%",
    status: "Detected",
    date: "2026-06-02",
  },
  {
    id: 3,
    dog: "Bella",
    disease: "Healthy",
    confidence: "99%",
    status: "Normal",
    date: "2026-06-02",
  },
  {
    id: 4,
    dog: "Max",
    disease: "Dermatitis",
    confidence: "88%",
    status: "Detected",
    date: "2026-06-03",
  },
];

import { useNavigate } from "react-router-dom";

export default function Table({ data: customData, hideHeader = true }) {
  const navigate = useNavigate();
  const displayData = customData !== undefined ? customData : [];

  return (
    <div className="bg-transparent overflow-x-auto">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-heading dark:text-darkHeading">
              Recent Predictions
            </h2>
            <p className="text-sm text-text dark:text-darkText">
              Latest AI disease detection results
            </p>
          </div>

          <button
            onClick={() => navigate("/predictions")}
            className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-xl text-sm transition font-medium"
          >
            View All
          </button>
        </div>
      )}

      {/* TABLE */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left border-b border-[#E8DDF5] dark:border-[#2E1A4E]">
            <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
              Dog Name
            </th>

            <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
              Disease
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
              Date
            </th>
          </tr>
        </thead>

        <tbody>
          {displayData.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="py-8 text-center text-gray-400 dark:text-slate-300"
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl">🔍</span>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                    No predictions found
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Try adjusting your search query or risk filter
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            displayData.map((item, idx) => {
              const petName = item.dog || item.pet || "Unknown";
              const confidenceStr =
                typeof item.confidence === "number"
                  ? `${item.confidence}%`
                  : item.confidence || "N/A";
              const rawStatus = item.status || "Pending";
              const isPending =
                rawStatus === "Pending" || rawStatus === "pending";
              const isHigh =
                rawStatus === "High Risk" || rawStatus === "danger";
              const isMedium =
                rawStatus === "Medium Risk" || rawStatus === "warning";
              const isSafe =
                rawStatus === "Safe" ||
                rawStatus === "Normal" ||
                rawStatus === "healthy" ||
                rawStatus === "Low Risk";

              let badgeClass =
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300";
              let displayStatus = "Pending";

              if (isPending) {
                badgeClass =
                  "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-700";
                displayStatus = "Pending";
              } else if (isHigh) {
                badgeClass =
                  "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300 font-semibold border border-red-200 dark:border-red-800";
                displayStatus = "High Risk";
              } else if (isMedium) {
                badgeClass =
                  "bg-orange-100 text-orange-800 dark:bg-orange-500/25 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800";
                displayStatus = "Medium Risk";
              } else if (isSafe) {
                badgeClass =
                  "bg-green-100 text-green-800 dark:bg-emerald-500/25 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800";
                displayStatus = rawStatus === "Low Risk" ? "Low Risk" : "Safe";
              }

              const doctorName = item.doctor;
              const dateStr = item.date || item.time || "Recent";

              return (
                <tr
                  key={item.id || idx}
                  className="border-b border-[#E8DDF5] dark:border-[#2E1A4E] hover:bg-[#F5F0FA]/60 dark:hover:bg-[#4B0082]/10 transition"
                >
                  <td className="py-3.5 font-semibold text-gray-900 dark:text-white text-sm">
                    {petName}
                  </td>

                  <td className="py-3.5 text-gray-700 dark:text-slate-200 font-medium text-sm">
                    {item.disease}
                  </td>

                  <td className="py-3.5 text-[#710b9d] dark:text-[#C77DFF] font-bold text-sm">
                    {confidenceStr}
                  </td>

                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs ${badgeClass}`}
                    >
                      {displayStatus}
                    </span>
                  </td>

                  <td className="py-3.5">
                    {isPending ? (
                      <span className="inline-flex items-center text-xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
                        ⏳ Pending
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                          ✓ Reviewed
                        </span>
                        {doctorName && (
                          <span className="text-[11px] text-gray-600 dark:text-slate-300 font-medium">
                            {doctorName}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 text-gray-600 dark:text-slate-300 text-xs font-medium">
                    {dateStr}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
