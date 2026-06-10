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

export default function TrendChart() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E6E8F0] h-[350px]">

      <h2 className="text-lg font-bold text-[#1F2937] mb-4">
        Weekly Disease Trends
      </h2>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          
          <XAxis dataKey="day" />
          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="cases"
            stroke="#6C5CE7"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}