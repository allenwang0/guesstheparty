import { motion } from "framer-motion";

export const Glass = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);
export const Pill = ({ children, className = "" }) => (
  <span
    className={[
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.20em]",
      className,
    ].join(" ")}
  >
    {children}
  </span>
);
export const IconButton = ({ onClick, ariaLabel, ariaPressed, children, className = "" }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    className={[
      "h-10 w-10 rounded-2xl",
      "bg-white/60 border border-black/5 backdrop-blur shadow-sm hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);
export const ProgressBar = ({ label, value, color, total }) => (
  <div className="w-full">
    <div className="flex justify-between mb-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-[9px] font-black text-gray-600">{Math.round((value / (total || 1)) * 100)}%</span>
    </div>
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / (total || 1)) * 100}%` }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);
export const Toast = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.9 }}
    className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] bg-black/80 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-none whitespace-nowrap"
  >
    <span className="text-xs font-bold tracking-widest uppercase">{message}</span>
  </motion.div>
);
