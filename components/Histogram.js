import { motion } from "framer-motion";
import { bucketCounts, bucketIndex, MIN_RUNS_TO_SHOW } from "../lib/buckets";
import { betterThanPercent } from "../lib/percentile";

export default function Histogram({ distribution, userAccuracy, isDark = false, compact = false }) {
  const containerHeight = compact ? "h-20" : "h-32";
  const mutedText = isDark ? "text-white/60" : "text-gray-500";
  const counts = bucketCounts(distribution.buckets?.map((b) => b.count));
  const maxCount = Math.max(...counts);
  const userBucket = bucketIndex(userAccuracy);
  const betterThan = betterThanPercent(userAccuracy, counts);
  let body;
  if (distribution.status === "loading") {
    body = (
      <div className={`${containerHeight} flex items-center justify-center text-xs ${mutedText}`}>
        Loading...
      </div>
    );
  } else if (distribution.status === "error") {
    body = (
      <div className={`${containerHeight} flex items-center justify-center text-xs ${mutedText}`}>
        Stats are unavailable right now.
      </div>
    );
  } else if (distribution.total < MIN_RUNS_TO_SHOW) {
    body = (
      <div className={`${containerHeight} flex items-center justify-center text-xs ${mutedText}`}>
        Not enough games yet ({distribution.total} of {MIN_RUNS_TO_SHOW})
      </div>
    );
  } else {
    body = (
      <>
        <div className={`flex items-end justify-between ${containerHeight} gap-1 mb-2`}>
          {counts.map((count, i) => {
            const isActive = i === userBucket;
            const barHeight = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={i} className="h-full flex flex-col justify-end items-center gap-1 flex-1 relative">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeight}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`w-full rounded-t-sm relative ${
                    isActive ? "bg-blue-500" : isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                />
                <span
                  className={`text-[7px] font-bold ${
                    isActive ? "text-blue-500" : isDark ? "text-white/20" : "text-gray-300"
                  }`}
                >
                  {i === 0 ? "0" : i === counts.length - 1 ? "100" : ""}
                </span>
              </div>
            );
          })}
        </div>
        {!compact && (
          <div className={`mt-3 text-center text-xs ${mutedText}`}>
            You performed better than{" "}
            <span className={`font-bold ${isDark ? "text-white" : "text-black"}`}>{betterThan}%</span> of{" "}
            {distribution.total} players.
          </div>
        )}
      </>
    );
  }
  return (
    <div className={`w-full mt-4 pt-4 border-t ${isDark ? "border-white/10" : "border-gray-100"}`}>
      <h3
        className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? "text-white/40" : "text-gray-400"}`}
      >
        Global Player Distribution
      </h3>
      {body}
    </div>
  );
}
