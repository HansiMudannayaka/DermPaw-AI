import {
  FileText,
  AlertTriangle,
  Activity,
  TrendingUp,
} from "lucide-react";

const reports = [
  {
    title: "Total Reports",
    value: "1,245",
    icon: <FileText size={22} />,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Detected Cases",
    value: "89",
    icon: <AlertTriangle size={22} />,
    color: "bg-red-100 text-red-600",
  },
  {
    title: "System Health",
    value: "Stable",
    icon: <Activity size={22} />,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Growth Rate",
    value: "+18%",
    icon: <TrendingUp size={22} />,
    color: "bg-purple-100 text-purple-600",
  },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Reports & Analytics
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          AI performance and disease detection insights
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {reports.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
          >
            
            <div className="flex items-center justify-between">
              
              <div>
                <p className="text-sm text-gray-500">
                  {item.title}
                </p>

                <h2 className="text-2xl font-bold text-gray-800 mt-1">
                  {item.value}
                </h2>
              </div>

              <div
                className={`w-12 h-12 flex items-center justify-center rounded-xl ${item.color}`}
              >
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CHART PLACEHOLDER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-72 flex items-center justify-center">
        <p className="text-gray-500">
          📊 Reports analytics chart will go here (Recharts / API data)
        </p>
      </div>

      {/* RECENT REPORTS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">
          Recent Report Activity
        </h2>

        <ul className="space-y-3 text-sm text-gray-600">
          <li>🐶 Buddy scan completed — Mange detected</li>
          <li>🐶 Bella scan completed — Healthy result</li>
          <li>🐶 Rocky scan completed — Ringworm detected</li>
          <li>System auto-report generated at 10:00 AM</li>
        </ul>
      </div>
    </div>
  );
}