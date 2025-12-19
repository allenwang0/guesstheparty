// pages/index.js
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  RefreshCcw,
  Loader2,
  Check,
  X as XIcon,
  Share2,
  Flame,
  Info,
  Timer,
  Target,
  Award,
  Trophy,
  Keyboard,
  Zap,
  Star,
  ShieldCheck,
} from "lucide-react";

/* --------------------------------- Icons --------------------------------- */

const DonkeyIcon = ({ className }) => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/9/93/Democratic_Disc.svg"
    alt="Democratic Logo"
    className={className}
  />
);

const ElephantIcon = ({ className }) => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/e/ec/Republican_Disc.png"
    alt="Republican Logo"
    className={className}
  />
);

/* --------------------------------- UI ------------------------------------ */

const Glass = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-3xl border border-white/70 bg-white/70 backdrop-blur-xl",
      "shadow-[0_18px_60px_rgba(0,0,0,0.10)]",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const Pill = ({ children, className = "" }) => (
  <span
    className={[
      "inline-flex items-center gap-2 rounded-full px-3 py-1",
      "text-[10px] font-black uppercase tracking-[0.20em]",
      className,
    ].join(" ")}
  >
    {children}
  </span>
);

const SectionTitle = ({ children, right }) => (
  <div className="flex items-center justify-between">
    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">{children}</div>
    {right}
  </div>
);

const StatPill = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3">
    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">{label}</div>
    <div className="text-xl font-black tabular-nums">{value}</div>
  </div>
);

/* -------------------------------- Trophies ------------------------------- */

const TROPHY_KEY = "partyTrophies_v1";

const TROPHIES = [
  {
    id: "first_correct",
    title: "First Blood",
    desc: "Get your first correct guess.",
    icon: <Star size={18} />,
    tier: "bronze",
    check: ({ stats }) => (stats.correct || 0) >= 1,
  },
  {
    id: "streak_5",
    title: "Warm Streak",
    desc: "Reach a 5 streak.",
    icon: <Flame size={18} />,
    tier: "bronze",
    check: ({ stats }) => (stats.bestStreak || 0) >= 5,
  },
  {
    id: "streak_10",
    title: "Campaign Staff",
    desc: "Reach a 10 streak.",
    icon: <Award size={18} />,
    tier: "silver",
    check: ({ stats }) => (stats.bestStreak || 0) >= 10,
  },
  {
    id: "streak_25",
    title: "Party Operator",
    desc: "Reach a 25 streak.",
    icon: <ShieldCheck size={18} />,
    tier: "gold",
    check: ({ stats }) => (stats.bestStreak || 0) >= 25,
  },
  {
    id: "streak_50",
    title: "Floor Leader",
    desc: "Reach a 50 streak.",
    icon: <Trophy size={18} />,
    tier: "platinum",
    check: ({ stats }) => (stats.bestStreak || 0) >= 50,
  },
  {
    id: "seen_50",
    title: "Caucus Regular",
    desc: "See 50 politicians.",
    icon: <Target size={18} />,
    tier: "bronze",
    check: ({ stats }) => (stats.total || 0) >= 50,
  },
  {
    id: "seen_200",
    title: "Capitol Fixture",
    desc: "See 200 politicians.",
    icon: <Trophy size={18} />,
    tier: "gold",
    check: ({ stats }) => (stats.total || 0) >= 200,
  },
  {
    id: "accuracy_80_50",
    title: "Solid Read",
    desc: "80% accuracy with at least 50 seen.",
    icon: <Award size={18} />,
    tier: "silver",
    check: ({ stats }) => {
      const total = stats.total || 0;
      const acc = total ? (stats.correct || 0) / total : 0;
      return total >= 50 && acc >= 0.8;
    },
  },
  {
    id: "accuracy_90_100",
    title: "Polling Wizard",
    desc: "90% accuracy with at least 100 seen.",
    icon: <Trophy size={18} />,
    tier: "platinum",
    check: ({ stats }) => {
      const total = stats.total || 0;
      const acc = total ? (stats.correct || 0) / total : 0;
      return total >= 100 && acc >= 0.9;
    },
  },
  {
    id: "speed_2s_50",
    title: "Rapid Fire",
    desc: "Average under 2.0s with at least 50 seen.",
    icon: <Zap size={18} />,
    tier: "gold",
    check: ({ stats }) => {
      const total = stats.total || 0;
      const avg = total ? (stats.totalTime || 0) / total / 1000 : Infinity;
      return total >= 50 && avg < 2.0;
    },
  },
];

function
