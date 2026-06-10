import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { name: "Mange", value: 35, color: "#E74C3C" },
  { name: "Ringworm", value: 25, color: "#F39C12" },
  { name: "Dermatitis", value: 20, color: "#6C5CE7" },
  { name: "Healthy", value: 40, color: "#2ECC71" },
];

export default function DiseaseChart() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E6E8F0] h-[350px]">
      
      <h2 className="text-lg font-bold text-[#1F2937] mb-4">
        Disease Distribution
      </h2>

      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={110}
            label
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>

          <Tooltip />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}