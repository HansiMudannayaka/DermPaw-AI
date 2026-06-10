import StatCard from "../components/StatCard";
import ChartBox from "../components/ChartBox";
import Table from "../components/Table";
import DiseaseChart from "../components/DiseaseChart";
import TrendChart from "../components/TrendChart";

export default function Dashboard() {
  const recentActivities = [
    {
      pet: "Buddy",
      action: "Mange Detected",
      time: "2 min ago",
      color: "text-red-500",
    },
    {
      pet: "Rocky",
      action: "Ringworm Detected",
      time: "5 min ago",
      color: "text-orange-500",
    },
    {
      pet: "Bella",
      action: "Healthy",
      time: "12 min ago",
      color: "text-green-500",
    },
    {
      pet: "Max",
      action: "Dermatitis",
      time: "25 min ago",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-bg dark:bg-darkBg p-6 space-y-6 transition-colors duration-300">

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-5">
        <StatCard title="Total Users" value="12,489" />
        <StatCard title="Total Pets" value="15,742" />
        <StatCard title="Total Scans" value="33,851" />
        <StatCard title="AI Detections" value="1,243" />
        <StatCard title="Doctors" value="156" />
        <StatCard title="Reviews" value="48" />
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* SCAN OVERVIEW */}
        <div className="col-span-12 xl:col-span-6 bg-card dark:bg-darkCard border border-border dark:border-darkBorder rounded-3xl shadow-card hover:shadow-cardHover transition-all duration-300 p-5">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg text-heading dark:text-darkHeading">
                Scans Overview
              </h2>

              <p className="text-sm text-text dark:text-darkText">
                Prediction trend analytics
              </p>
            </div>

            <select className="border border-border dark:border-darkBorder bg-white dark:bg-darkCard text-heading dark:text-darkHeading rounded-xl px-3 py-2 text-sm">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>

          <TrendChart />
        </div>

        {/* DISEASE CHART */}
        <div className="col-span-12 xl:col-span-4 bg-card dark:bg-darkCard border border-border dark:border-darkBorder rounded-3xl shadow-card hover:shadow-cardHover transition-all duration-300 p-5">

          <h2 className="font-semibold text-lg mb-4 text-heading dark:text-darkHeading">
            Disease Distribution
          </h2>

          <DiseaseChart />
        </div>

        {/* ACTIVITY */}
        <div className="col-span-12 xl:col-span-2 bg-card dark:bg-darkCard border border-border dark:border-darkBorder rounded-3xl shadow-card p-5">

          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-heading dark:text-darkHeading">
              Activity
            </h2>

            <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
              Live
            </span>
          </div>

          <div className="space-y-4">
            {recentActivities.map((item, index) => (
              <div
                key={index}
                className="pb-3 border-b border-border dark:border-darkBorder last:border-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    🐶
                  </div>

                  <div>
                    <p className="font-medium text-sm text-heading dark:text-darkHeading">
                      {item.pet}
                    </p>

                    <p className={`text-xs ${item.color}`}>
                      {item.action}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-text dark:text-darkText mt-2">
                  {item.time}
                </p>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary hover:text-white transition">
            View All
          </button>
        </div>

        {/* TABLE */}
        <div className="col-span-12 xl:col-span-7 bg-card dark:bg-darkCard border border-border dark:border-darkBorder rounded-3xl shadow-card hover:shadow-cardHover transition-all duration-300 p-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

            <div>
              <h2 className="font-semibold text-lg text-heading dark:text-darkHeading">
                Recent Predictions
              </h2>

              <p className="text-sm text-text dark:text-darkText">
                Latest AI prediction results
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search predictions..."
                className="px-4 py-2 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkCard text-heading dark:text-darkHeading focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <button className="px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl transition">
                Filter
              </button>
            </div>
          </div>

          <Table />
        </div>

        {/* AI PERFORMANCE */}
        <div className="col-span-12 xl:col-span-3 bg-card dark:bg-darkCard border border-border dark:border-darkBorder rounded-3xl shadow-card hover:shadow-cardHover transition-all duration-300 p-5">

          <h2 className="font-semibold text-lg mb-4 text-heading dark:text-darkHeading">
            AI Performance
          </h2>

          <ChartBox />

          <div className="text-center mt-5">
            <h3 className="text-4xl font-bold text-primary">
              92.4%
            </h3>

            <p className="text-text dark:text-darkText text-sm">
              Model Accuracy
            </p>

            <div className="mt-4 bg-border dark:bg-darkBorder rounded-full h-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full w-[92%]" />
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="col-span-12 xl:col-span-2 bg-card dark:bg-darkCard border border-border dark:border-darkBorder rounded-3xl shadow-card hover:shadow-cardHover transition-all duration-300 p-5">

          <h2 className="font-semibold text-lg mb-4 text-heading dark:text-darkHeading">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-3">

            <button className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl p-4 transition">
              <div className="text-xl">👨‍⚕️</div>
              <div className="text-xs mt-2 text-heading dark:text-darkHeading">
                Doctor
              </div>
            </button>

            <button className="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-xl p-4 transition">
              <div className="text-xl">🦠</div>
              <div className="text-xs mt-2 text-heading dark:text-darkHeading">
                Disease
              </div>
            </button>

            <button className="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-xl p-4 transition">
              <div className="text-xl">📢</div>
              <div className="text-xs mt-2 text-heading dark:text-darkHeading">
                Notify
              </div>
            </button>

            <button className="bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-xl p-4 transition">
              <div className="text-xl">📄</div>
              <div className="text-xs mt-2 text-heading dark:text-darkHeading">
                Report
              </div>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}