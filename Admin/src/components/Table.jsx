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

export default function Table() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Recent Predictions
          </h2>

          <p className="text-sm text-gray-500">
            Latest AI disease detection results
          </p>
        </div>

        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm transition">
          View All
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left border-b border-gray-200">
            <th className="pb-3 text-sm font-semibold text-gray-500">
              Dog Name
            </th>

            <th className="pb-3 text-sm font-semibold text-gray-500">
              Disease
            </th>

            <th className="pb-3 text-sm font-semibold text-gray-500">
              Confidence
            </th>

            <th className="pb-3 text-sm font-semibold text-gray-500">
              Status
            </th>

            <th className="pb-3 text-sm font-semibold text-gray-500">
              Date
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition"
            >
              <td className="py-4 font-medium text-gray-700">
                {item.dog}
              </td>

              <td className="py-4 text-gray-600">
                {item.disease}
              </td>

              <td className="py-4 text-purple-600 font-semibold">
                {item.confidence}
              </td>

              <td className="py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === "Detected"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {item.status}
                </span>
              </td>

              <td className="py-4 text-gray-500">
                {item.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}