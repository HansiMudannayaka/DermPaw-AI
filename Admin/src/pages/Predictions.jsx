import React from "react";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";

export default function Predictions() {
  const predictions = [
    {
      id: 1,
      pet: "Buddy",
      disease: "Mange",
      confidence: 92,
      status: "High Risk",
      time: "2 min ago",
    },
    {
      id: 2,
      pet: "Max",
      disease: "Healthy",
      confidence: 98,
      status: "Safe",
      time: "10 min ago",
    },
    {
      id: 3,
      pet: "Bella",
      disease: "Skin Allergy",
      confidence: 75,
      status: "Medium Risk",
      time: "1 hour ago",
    },
    {
      id: 4,
      pet: "Charlie",
      disease: "Ticks Infection",
      confidence: 88,
      status: "High Risk",
      time: "3 hours ago",
    },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case "High Risk":
        return "text-red-400 bg-red-500/10";
      case "Medium Risk":
        return "text-yellow-400 bg-yellow-500/10";
      case "Safe":
        return "text-green-400 bg-green-500/10";
      default:
        return "text-white bg-white/10";
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity /> Predictions
          </h1>
          <p className="text-gray-500 mt-1">
            AI-powered dog disease detection results
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-4">

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500 text-sm">Total Predictions</p>
          <h2 className="text-2xl font-bold mt-1">124</h2>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500 text-sm">High Risk Cases</p>
          <h2 className="text-2xl font-bold mt-1 text-red-500">18</h2>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500 text-sm">Accuracy Rate</p>
          <h2 className="text-2xl font-bold mt-1 text-green-500">93%</h2>
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">

        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Predictions</h2>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-3">Pet</th>
              <th className="p-3">Prediction</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Status</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>

          <tbody>
            {predictions.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">

                <td className="p-3 font-medium">
                  {item.pet}
                </td>

                <td className="p-3">
                  {item.disease}
                </td>

                <td className="p-3">
                  {item.confidence}%
                </td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                      item.status
                    )}`}
                  >
                    {item.status === "High Risk" && <AlertTriangle size={14} className="inline mr-1" />}
                    {item.status === "Safe" && <CheckCircle size={14} className="inline mr-1" />}
                    {item.status}
                  </span>
                </td>

                <td className="p-3 text-gray-500 text-sm">
                  {item.time}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}