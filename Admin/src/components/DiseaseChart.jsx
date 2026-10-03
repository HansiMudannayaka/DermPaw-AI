import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const fallbackData = [
  { name: "Mange", value: 35, color: "#E74C3C" },
   { name: "Ringworm", value: 25, color: "#F39C12" },
  { name: "Dermatitis", value: 20, color: "#8A2BE2" },
  { name: "Healthy", value: 40, color: "#2ECC71" },
];

const COLOR_PALETTE = [
  "#8A2BE2",
  "#E74C3C",
  "#F39C12",
  "#2ECC71",
  "#9B59B6",
  "#C77DFF",
  "#1ABC9C",
];

// Custom legend — always readable in both light and dark mode
const CustomLegend = ({ data }) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3 px-2">
    {data.map((entry, idx) => (
      <div key={idx} className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-200">
          {entry.name}
        </span>
      </div>
    ))}
  </div>
);

export default function DiseaseChart({ data: customData }) {
  let chartData = fallbackData;
  if (customData) {
    if (Array.isArray(customData) && customData.length > 0) {
      chartData = customData.map((item, idx) => ({
        name: item.name || item._id || "Disease",
        value: item.value || item.count || 0,
        color: item.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
      }));
    } else if (
      typeof customData === "object" &&
      Object.keys(customData).length > 0
    ) {
      chartData = Object.entries(customData).map(([name, value], idx) => ({
        name,
        value,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      }));
    }
  }

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              innerRadius={48}
              paddingAngle={4}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: "#160D2B",
                borderRadius: "12px",
                border: "1px solid #2E1A4E",
                color: "#F0E8FF",
                fontSize: "12px",
                boxShadow: "0 10px 25px rgba(74,0,128,0.3)",
              }}
              itemStyle={{ color: "#F0E8FF" }}
              labelStyle={{ color: "#C77DFF", fontWeight: 700 }}
              formatter={(value, name) => [value, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend — always visible in light & dark mode */}
      <CustomLegend data={chartData} />
    </div>
  );
}
