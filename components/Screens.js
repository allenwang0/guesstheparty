import { AlertCircle, Loader2 } from "lucide-react";

export function LoadingScreen({ message }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F7] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}
export function ErrorScreen() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F7] px-6 text-center gap-3">
      <div className="h-14 w-14 rounded-2xl bg-white border border-black/5 flex items-center justify-center shadow-sm">
        <AlertCircle />
      </div>
      <div className="text-lg font-black tracking-tight">
        Couldn&apos;t load the game. Refresh to try again.
      </div>
    </div>
  );
}
