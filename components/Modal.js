import { useEffect } from "react";
import { motion } from "framer-motion";

export default function Modal({ children, onClose, className = "" }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, []);

  // Default to max-w-md if no specific width class is passed
  const widthClass = className || "max-w-md";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className={`w-full ${widthClass} max-h-[85vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl p-6 md:p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
}
