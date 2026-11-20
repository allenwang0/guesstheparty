import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { AnimatePresence, useAnimation, useMotionValue } from "framer-motion";
import { ArrowLeft, ArrowRight, BarChart2, Info, Waves } from "lucide-react";
import { BLUE_WAVE, BLUE_WAVE_FAVICON, BlueWaveCrest, BlueWaveMark } from "../components/BlueWave";
import Card from "../components/Card";
import IntroModal from "../components/IntroModal";
import { ErrorScreen, LoadingScreen } from "../components/Screens";
import StatsModal from "../components/StatsModal";
import TrophyCase from "../components/TrophyCase";
import { Glass, IconButton, Toast } from "../components/ui";
import WrappedModal from "../components/WrappedModal";
import { useDistribution } from "../hooks/useDistribution";
import { useGame } from "../hooks/useGame";
import { DECKS, deckFromSearch, findDeck } from "../lib/decks";
import { readStorage, writeStorage } from "../hooks/usePersistentState";
import { computeRank } from "../lib/rank";
import { TROPHIES } from "../lib/trophies";

const INTRO_KEY = "partyHasSeenIntro_v3";
const THEME_KEY = "gtpTheme";
const TOAST_MS = 2500;

export default function Home() {
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const shakeControls = useAnimation();
  const [toast, setToast] = useState(null);
  const [showInfo, setShowInfo] = useState(() => readStorage(INTRO_KEY) === null);
  const [showStats, setShowStats] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showTrophyCase, setShowTrophyCase] = useState(false);

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "classic";
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    if (fromUrl === BLUE_WAVE || fromUrl === "classic") return fromUrl;
    return readStorage(THEME_KEY) === BLUE_WAVE ? BLUE_WAVE : "classic";
  });
  const blueWave = theme === BLUE_WAVE;
  const toggleTheme = () => {
    const nextTheme = blueWave ? "classic" : BLUE_WAVE;
    setTheme(nextTheme);
    writeStorage(THEME_KEY, nextTheme);
  };
  const [deck] = useState(() =>
    typeof window === "undefined" ? findDeck() : deckFromSearch(window.location.search),
  );
  const game = useGame({
    deck,
    onWrongGuess: () => shakeControls.start({ x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } }),
    onAdvance: () => x.set(0),
    onTrophyUnlocked: () => {
      setToast("Trophy Unlocked!");
      setTimeout(() => setToast(null), TOAST_MS);
    },
  });
  const { stats, accuracy, revealed, lastResult, current, guess } = game;
  const distribution = useDistribution(showStats || showWrapped);
  const rank = computeRank({ accuracy, bestStreak: stats.bestStreak, total: stats.total });

  let bgColor = blueWave ? "bg-[#F7F5EF]" : "bg-[#F5F5F7]";
  if (revealed && lastResult?.correctParty === "Democrat") bgColor = "bg-blue-50/40";
  if (revealed && lastResult?.correctParty === "Republican") bgColor = "bg-red-50/40";

  const closeInfoModal = useCallback(() => {
    setShowInfo(false);
    writeStorage(INTRO_KEY, "1");
  }, []);

  const handleReset = () => {
    if (confirm("Reset run stats? (Trophies will persist)")) game.reset();
  };

  useEffect(() => {
    containerRef.current?.focus();
  }, [current]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (showInfo || showStats || showTrophyCase || showWrapped || revealed) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        guess("Democrat");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        guess("Republican");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [revealed, showInfo, showStats, showTrophyCase, showWrapped, guess]);

  if (game.status === "error") return <ErrorScreen />;
  if (game.status === "loading" || !current) return <LoadingScreen message="Loading..." />;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      data-theme={theme}
      className={`fixed inset-0 w-full h-[100dvh] ${bgColor} text-[#1D1D1F] font-sans overflow-hidden transition-colors duration-500 overscroll-none touch-none focus:outline-none`}
    >
      <Head>
        <title>{blueWave ? "Guess The Party · Blue Wave Edition" : "Guess The Party | Allen Wang"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link
          rel="icon"
          href={
            blueWave
              ? BLUE_WAVE_FAVICON
              : "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇺🇸</text></svg>"
          }
        />
      </Head>
      <Analytics />
      <div
        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      {blueWave && <BlueWaveCrest />}
      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
      <div className="mx-auto max-w-2xl px-4 md:px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] h-full flex flex-col relative z-20">
        <header className="mb-4 mt-4 shrink-0 flex justify-center relative z-50">
          <Glass className="bw-header px-3 sm:px-5 py-3 rounded-full flex items-center justify-between w-full max-w-lg">
            {blueWave ? (
              <div className="flex items-center gap-2.5 pr-4 min-w-0">
                <BlueWaveMark size={30} />
                <div className="flex flex-col leading-none min-w-0">
                  <h1 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-tighter whitespace-nowrap">
                    Guess the Party
                  </h1>
                  <span className="text-[8px] font-black tracking-[0.18em] text-[#7fa6ff] mt-1 whitespace-nowrap">
                    BLUE WAVE EDITION
                  </span>
                  <span className="text-[9px] text-white/60 mt-0.5 whitespace-nowrap">
                    120th Congress · 2027–29
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start pr-2 sm:pr-4">
                <h1 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-tighter leading-none whitespace-nowrap">
                  🇺🇸 Guess the Party
                </h1>
                <div className="w-full flex justify-between px-[1px] mt-0.5 opacity-40">
                  {"ALLEN WANG".split("").map((char, i) => (
                    <span key={i} className="text-[8px] font-black">
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <IconButton onClick={toggleTheme} ariaLabel="Blue Wave theme" ariaPressed={blueWave}>
                <Waves size={18} />
              </IconButton>
              <IconButton onClick={() => setShowInfo(true)} ariaLabel="Info">
                <Info size={18} />
              </IconButton>
              <button
                onClick={() => setShowStats(true)}
                className="bw-stats h-10 px-3 sm:px-5 bg-black text-white rounded-2xl shadow-sm hover:bg-black/80 active:scale-95 transition-transform flex items-center justify-center min-w-[64px] sm:min-w-[80px]"
              >
                {stats.total > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <BarChart2 size={12} className="text-white/60" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] tabular-nums">
                      {accuracy}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Stats</span>
                )}
              </button>
            </div>
          </Glass>
        </header>
        <div className="mb-2 shrink-0 flex justify-center relative z-50">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-black/60">
            Deck
            <select
              value={deck.id}
              onChange={(e) => {
                window.location.search = `?deck=${e.target.value}`;
              }}
              className="rounded-full bg-white/70 border border-black/10 px-3 py-1.5 text-[11px] font-bold normal-case tracking-normal text-black"
            >
              {DECKS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <main className="flex-grow flex flex-col items-center justify-center relative touch-none select-none py-2">
          {stats.total === 0 && !revealed && (
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none max-w-[420px] mx-auto z-0 opacity-40">
              <div className="flex flex-col items-center gap-2">
                <ArrowLeft size={24} />
                <span className="text-[9px] font-black uppercase tracking-widest">Dem</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ArrowRight size={24} />
                <span className="text-[9px] font-black uppercase tracking-widest">Rep</span>
              </div>
            </div>
          )}
          <Card
            current={current}
            next={game.next}
            revealed={revealed}
            lastResult={lastResult}
            imgLoading={game.imgLoading}
            onImageLoad={game.handleImageLoad}
            onGuess={guess}
            onReset={handleReset}
            onOpenTrophies={() => setShowTrophyCase(true)}
            trophyCount={game.trophies.unlocked.length}
            trophyTotal={TROPHIES.length}
            x={x}
            shakeControls={shakeControls}
          />
        </main>
      </div>
      <AnimatePresence>
        {showInfo && <IntroModal onClose={closeInfoModal} />}
        {showStats && (
          <StatsModal
            stats={stats}
            accuracy={accuracy}
            rank={rank}
            distribution={distribution}
            onClose={() => setShowStats(false)}
            onOpenWrapped={() => {
              setShowStats(false);
              setShowWrapped(true);
            }}
          />
        )}
        {showTrophyCase && (
          <TrophyCase unlocked={game.trophies.unlocked} onClose={() => setShowTrophyCase(false)} />
        )}
        {showWrapped && (
          <WrappedModal
            stats={stats}
            accuracy={accuracy}
            rank={rank}
            distribution={distribution}
            onClose={() => setShowWrapped(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
