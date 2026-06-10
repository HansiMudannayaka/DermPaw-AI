import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Mon", predictions: 20 },
  { name: "Tue", predictions: 35 },
  { name: "Wed", predictions: 40 },
  { name: "Thu", predictions: 28 },
  { name: "Fri", predictions: 60 },
  { name: "Sat", predictions: 75 },
  { name: "Sun", predictions: 90 },
];

export default function ChartBox() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-[350px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            AI Prediction Trends
          </h2>
          <p className="text-sm text-gray-500">
            Weekly disease detections
          </p>
        </div>

        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
          +18%
        </div>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />

          <XAxis
            dataKey="name"
            tick={{ fill: "#666", fontSize: 12 }}
          />

          <YAxis
            tick={{ fill: "#666", fontSize: 12 }}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="predictions"
            stroke="#aa3bff"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}