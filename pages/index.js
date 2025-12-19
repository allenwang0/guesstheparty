// ... (Keep existing imports and icon components)

export default function Home() {
  // ... (Keep existing state and logic)

  return (
    // Added overscroll-none and touch-none to prevent any mobile dragging/scrolling
    <div className="fixed inset-0 h-[100dvh] w-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans select-none overscroll-none touch-none">
      <Head>
        <title>Guess The Party | Allen Wang</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>
      <Analytics />

      {/* Header */}
      <header className="px-6 pt-6 shrink-0 z-20 flex justify-center">
        <div className="w-full max-w-xl flex justify-between items-center bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-white shadow-sm relative">
          <div className="flex flex-col items-start">
            <h1 className="text-xl font-black tracking-tighter uppercase leading-[0.8] w-full text-justify flex items-center gap-2">
              <span className="text-lg">🇺🇸</span> GUESS THE PARTY <span className="text-lg">🇺🇸</span>
            </h1>
            <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-[0.38em] w-full mt-1">
              Created by Allen Wang
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInstructions(true)} className="p-2 bg-gray-50 rounded-full"><Info size={20} className="text-gray-400" /></button>
            <button onClick={() => setShowStats(true)} className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Stats</button>
          </div>
        </div>
      </header>

      {/* Main Game Card - min-h-0 is crucial for flex-grow with no overflow */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-12 py-2 relative min-h-0">
        <AnimatePresence mode="wait">
          {/* ... (Keep existing motion.div for the card) */}
        </AnimatePresence>
      </main>

      {/* Footer HUD */}
      <footer className="px-6 pb-10 pt-4 shrink-0 flex justify-center">
        {/* ... (Keep existing footer) */}
      </footer>

      <AnimatePresence>
        {/* ... (Keep showInstructions and showStats) */}

        {/* Wrapped Screen */}
        {showWrapped && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6" onClick={() => setShowWrapped(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-b from-[#1c1c1e] to-black rounded-[3rem] p-10 flex flex-col border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Added X Button */}
              <button
                onClick={() => setShowWrapped(false)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors z-[110]"
              >
                <XIcon size={20} className="text-white/80" />
              </button>

              {/* Flair Stars */}
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  className="absolute text-white/10 text-xl"
                  style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                >
                  ★
                </motion.span>
              ))}

              <div className="flex-grow pt-10 text-white z-10">
                <h3 className="text-5xl font-black leading-[0.85] tracking-tighter mb-12">POLITICAL<br/><span className="text-blue-500 italic font-serif text-4xl">wrapped</span></h3>
                <div className="space-y-10">
                    <div><p className="text-[10px] font-black text-white/40 uppercase mb-2">Your Identity</p><p className="text-3xl font-black uppercase leading-tight">{rank.title}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-[10px] font-black text-white/40 uppercase mb-1">Accuracy</p><p className="text-3xl font-black">{accuracy}%</p></div>
                        <div><p className="text-[10px] font-black text-white/40 uppercase mb-1">Max Streak</p><p className="text-3xl font-black text-blue-500">{stats.bestStreak}</p></div>
                    </div>

                    {/* Official Logos Footer - High Contrast */}
                    <div className="pt-10 border-t border-white/10 flex justify-between items-center px-4">
                        <DonkeyIcon className="w-14 h-14 object-contain brightness-125 contrast-125" />
                        <div className="h-8 w-[1px] bg-white/20" />
                        <ElephantIcon className="w-14 h-14 object-contain brightness-125 contrast-125" />
                    </div>
                </div>
              </div>
              <div className="text-center pt-8 z-10">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">🇺🇸 Guess the Party • Allen Wang 🇺🇸</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}