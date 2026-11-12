import { ArrowLeft, ArrowRight } from "lucide-react";
import Modal from "./Modal";

export default function IntroModal({ onClose }) {
  return (
    <Modal onClose={onClose} className="max-w-md md:max-w-xl">
      <div className="text-center space-y-5 py-2">
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none text-balance md:whitespace-nowrap">
            Does appearance predict ideology?
          </h3>
          <p className="text-lg font-serif italic text-gray-500">Test your political intuition</p>
        </div>
        <p className="text-sm font-medium text-gray-600 max-w-[260px] mx-auto leading-relaxed">
          Swipe or use arrow keys to guess.
          <br />
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center gap-2">
            <div className="h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm">
              <ArrowLeft size={16} strokeWidth={3} />
            </div>
            <div className="leading-none">
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-300">Left</div>
              <div className="text-sm font-black uppercase text-blue-600">Democrat</div>
            </div>
          </div>
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex flex-col items-center gap-2">
            <div className="h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
              <ArrowRight size={16} strokeWidth={3} />
            </div>
            <div className="leading-none">
              <div className="text-[10px] font-black uppercase tracking-widest text-red-300">Right</div>
              <div className="text-sm font-black uppercase text-red-600">Republican</div>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-95 transition-transform shadow-xl"
        >
          Let&apos;s Play
        </button>
      </div>
    </Modal>
  );
}
