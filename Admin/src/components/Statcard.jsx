export default function StatCard({
  title,
  value,
  icon,
  color,
  change,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
      
      {/* TOP */}
      <div className="flex items-center justify-between">
        
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-gray-800 mt-1">
            {value}
          </h2>
        </div>

        {/* ICON */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>

      {/* BOTTOM */}
      <div className="mt-4">
        <span className="text-green-600 text-sm font-semibold">
          {change}
        </span>

        <span className="text-gray-400 text-sm ml-2">
          this week
        </span>
      </div>
    </div>
  );
}