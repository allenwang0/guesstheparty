import Image from "next/image";
import { AnimatePresence, motion, useTransform } from "framer-motion";
import { Check, Loader2, RefreshCw, Trophy, XCircle, Zap } from "lucide-react";
import { formatOffice } from "../lib/politicians";
import { Pill } from "./ui";

export const SWIPE_THRESHOLD_PX = 80;

export default function Card({
  current,
  next,
  revealed,
  lastResult,
  imgLoading,
  onImageLoad,
  onGuess,
  onReset,
  onOpenTrophies,
  trophyCount,
  trophyTotal,
  x,
  shakeControls,
}) {
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const swipeBg = useTransform(
    x,
    [-150, 0, 150],
    ["rgba(59, 130, 246, 0.15)", "rgba(255,255,255,0)", "rgba(239, 68, 68, 0.15)"],
  );
  const demStampOpacity = useTransform(x, [0, -60], [0, 1]);
  const demStampScale = useTransform(x, [0, -60], [2, 1]);
  const repStampOpacity = useTransform(x, [0, 60], [0, 1]);
  const repStampScale = useTransform(x, [0, 60], [2, 1]);
  return (
    <div className="relative w-full max-w-[400px] flex-grow flex flex-col max-h-[75vh]">
      <div className="relative flex-grow w-full">
        {next && (
          <div className="absolute inset-0 w-full h-full opacity-0 pointer-events-none">
            <Image src={next.imageUrl} fill alt="preload" sizes="400px" priority />
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            drag={!revealed ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x, rotate }}
            animate={revealed && !lastResult?.isCorrect ? shakeControls : {}}
            onDragEnd={(e, i) => {
              if (i.offset.x < -SWIPE_THRESHOLD_PX) onGuess("Democrat");
              else if (i.offset.x > SWIPE_THRESHOLD_PX) onGuess("Republican");
            }}
            className="absolute inset-0 rounded-[2.5rem] overflow-hidden border-[6px] border-white bg-white shadow-2xl cursor-grab active:cursor-grabbing flex flex-col"
          >
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ backgroundColor: swipeBg }}
            />
            {!revealed && (
              <>
                <motion.div
                  style={{ opacity: demStampOpacity, scale: demStampScale }}
                  className="absolute top-8 right-8 z-20 pointer-events-none border-4 border-blue-500 text-blue-500 px-4 py-1 rounded-xl font-black text-3xl -rotate-12 uppercase tracking-tighter"
                >
                  Dem
                </motion.div>
                <motion.div
                  style={{ opacity: repStampOpacity, scale: repStampScale }}
                  className="absolute top-8 left-8 z-20 pointer-events-none border-4 border-red-500 text-red-500 px-4 py-1 rounded-xl font-black text-3xl rotate-12 uppercase tracking-tighter"
                >
                  Rep
                </motion.div>
              </>
            )}
            <div className="relative flex-grow bg-gray-50 overflow-hidden w-full h-full">
              {imgLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/50 backdrop-blur-sm">
                  <Loader2 className="animate-spin text-black/20" size={32} />
                </div>
              )}
              <Image
                src={current.imageUrl}
                onLoad={onImageLoad}
                alt="Politician"
                fill
                priority
                className={`object-cover transition-all duration-500 ${revealed ? "scale-105" : "scale-100"}`}
              />
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-x-0 bottom-0 z-40 flex flex-col items-center justify-end text-center pb-8 pt-32 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
                      lastResult?.isCorrect ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    {lastResult?.isCorrect ? (
                      <Check size={32} strokeWidth={4} />
                    ) : (
                      <XCircle size={32} strokeWidth={3} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-white/70 text-[10px] font-black uppercase tracking-[0.25em]">
                      {formatOffice(current, true)}
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none px-4">
                      {current.name}
                    </h2>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Pill
                        className={`${current.party === "Democrat" ? "bg-blue-500" : "bg-red-500"} text-white border-none`}
                      >
                        {current.party}
                      </Pill>
                      {lastResult?.isFast && lastResult?.isCorrect && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <Zap size={10} className="fill-yellow-900" /> Fast
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div
              className="relative shrink-0 h-32 px-5 py-4 bg-white flex flex-col justify-between z-50 cursor-auto"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-2 gap-3 h-12">
                <button
                  onClick={() => onGuess("Democrat")}
                  disabled={revealed}
                  className="rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-black text-xs uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Image
                    src="/brand/democrat.svg"
                    alt="Dem"
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                  Democrat
                </button>
                <button
                  onClick={() => onGuess("Republican")}
                  disabled={revealed}
                  className="rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-widest hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Image
                    src="/brand/republican.svg"
                    alt="Rep"
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                  Republican
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={onOpenTrophies}
                  className="flex items-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100/50 px-4 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  <Trophy size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {trophyCount}/{trophyTotal}
                  </span>
                </button>
                <button
                  onClick={onReset}
                  aria-label="Reset run"
                  className="p-2.5 bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
