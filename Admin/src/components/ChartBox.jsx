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

export default function ChartBox({ data: customData, growth = "+18%" }) {
  // Format live trend data if passed, otherwise provide formatted points
  const chartData =
    customData && customData.length > 0
      ? customData.map((item) => ({
          name: item._id
            ? item._id.includes("-")
              ? item._id.split("-").slice(1).join("/")
              : item._id
            : item.name || "Day",
          predictions:
            typeof item.count === "number" ? item.count : item.predictions || 0,
        }))
      : [
          { name: "Mon", predictions: 2 },
          { name: "Tue", predictions: 5 },
          { name: "Wed", predictions: 7 },
          { name: "Thu", predictions: 4 },
          { name: "Fri", predictions: 8 },
          { name: "Sat", predictions: 10 },
          { name: "Sun", predictions: 12 },
        ];

  return (
    <div className="bg-[#FAF8FF] dark:bg-[#160D2B] rounded-2xl p-4 h-[240px] border border-[#E8DDF5] dark:border-darkBorder">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-heading dark:text-darkHeading">
            AI Detections Trend
          </h3>
          <p className="text-xs text-text dark:text-darkText">
            Live model activity
          </p>
        </div>

        <div className="bg-[#F3E8FF] dark:bg-[#4B0082]/30 text-[#710b9d] dark:text-[#C77DFF] px-2.5 py-0.5 rounded-full text-xs font-semibold">
          {growth}
        </div>
      </div>

      <ResponsiveContainer width="100%" height="75%">
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#8A2BE2"
            opacity={0.12}
          />

          <XAxis
            dataKey="name"
            tick={{ fill: "#B39DCC", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: "#B39DCC", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={25}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#160D2B",
              borderRadius: "0.75rem",
              border: "1px solid #2E1A4E",
              color: "#F0E8FF",
              fontSize: "12px",
            }}
          />

          <Line
            type="monotone"
            dataKey="predictions"
            stroke="#8A2BE2"
            strokeWidth={3}
            dot={{ r: 4, fill: "#8A2BE2" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
