export default function StatCard({
  title,
  value,
  icon,
  color = "bg-[#F3E8FF] text-[#710b9d] dark:bg-[#4B0082]/20 dark:text-[#C77DFF]",
  change,
}) {
  return (
    <div className="stat-card card-dark relative overflow-hidden rounded-2xl bg-[#FAF8FF] dark:bg-darkCard border border-gray-200/90 dark:border-purple-500/25 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] p-5 transition-colors duration-200 hover:border-purple-400 dark:hover:border-purple-500/60">
      {/* Top Accent Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A0070] via-[#8A2BE2] to-[#C77DFF]" />

      {/* TOP */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 tracking-wide uppercase truncate">
            {title}
          </p>

          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mt-1 tracking-tight">
            {value}
          </h2>
        </div>

        {/* ICON */}
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center border border-purple-200/40 dark:border-purple-600/30 ${color}`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* BOTTOM */}
      <div className="mt-3 flex items-center text-xs pt-2 border-t border-gray-100 dark:border-[#2E1A4E]/60">
        {change ? (
          <>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {change}
            </span>
            <span className="text-gray-500 dark:text-slate-400 ml-1.5 font-medium">
              this week
            </span>
          </>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            Live backend sync
          </span>
        )}
      </div>
    </div>
  );
}
