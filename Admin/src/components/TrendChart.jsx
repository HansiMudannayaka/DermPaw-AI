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
  { day: "Mon", cases: 12 },
  { day: "Tue", cases: 18 },
  { day: "Wed", cases: 10 },
  { day: "Thu", cases: 25 },
  { day: "Fri", cases: 30 },
  { day: "Sat", cases: 22 },
  { day: "Sun", cases: 40 },
];

export default function TrendChart({ data: customData, period = "Daily" }) {
  // Format dates for display on X-Axis
  const formatLabel = (val) => {
    if (!val) return "";
    if (period.toLowerCase() === "daily") {
      // e.g. "2026-09-06" -> "Sep 06"
      try {
        const parts = val.split("-");
        if (parts.length === 3) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }
        }
      } catch (e) {}
    } else if (period.toLowerCase() === "weekly") {
      // e.g. "2026-W36" -> "W36"
      if (val.includes("-W")) {
        return "Week " + val.split("-W")[1];
      }
    } else if (period.toLowerCase() === "monthly") {
      // e.g. "2026-09" -> "Sep 2026"
      try {
        const parts = val.split("-");
        if (parts.length === 2) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString("en-US", { month: "short" });
          }
        }
      } catch (e) {}
    }
    return val;
  };

  const chartData =
    customData && customData.length > 0
      ? customData.map((item) => ({
          day: formatLabel(item.day || item._id || item.date || "Date"),
          cases: item.cases !== undefined ? item.cases : item.count || 0,
        }))
      : data;

  return (
    <div className="h-[280px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#8A2BE2"
            strokeOpacity={0.12}
          />

          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#B39DCC" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#B39DCC" }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#160D2B",
              borderRadius: "12px",
              color: "#F0E8FF",
              border: "1px solid #2E1A4E",
              boxShadow: "0 4px 12px rgba(74,0,128,0.25)",
            }}
            itemStyle={{ color: "#C77DFF" }}
            labelStyle={{
              color: "#B39DCC",
              fontWeight: 600,
              marginBottom: "4px",
            }}
          />

          <Line
            type="monotone"
            dataKey="cases"
            stroke="#8A2BE2"
            strokeWidth={3}
            dot={{ r: 4, fill: "#8A2BE2" }}
            activeDot={{ r: 6, fill: "#710b9d" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
