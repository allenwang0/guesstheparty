import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import ChartCard from "../components/insights/ChartCard";
import {
  ConfusionMatrix,
  DistributionChart,
  MemberDotPlot,
  SpeedChart,
  StateTileMap,
} from "../components/insights/Views";
import { readStorage, parseJson } from "../hooks/usePersistentState";
import { accuracyPercent, bucketIndex } from "../lib/buckets";
import {
  confusionTakeaway,
  confusionTotals,
  distributionTakeaway,
  formatCount,
  memberTakeaway,
  pct,
  rankMembers,
  speedTakeaway,
  stateTakeaway,
} from "../lib/insights";
import { STATS_KEY } from "../lib/player-stats";
import { MIN_RUN_GUESSES } from "../lib/submission";

function playerBucket() {
  const stats = parseJson(readStorage(STATS_KEY));
  if (!stats || !(stats.total >= MIN_RUN_GUESSES)) return null;
  return bucketIndex(accuracyPercent(stats.correct, stats.total));
}

async function fetchInsights() {
  try {
    const res = await fetch("/api/insights");
    if (!res.ok) throw new Error(`insights returned ${res.status}`);
    return { status: "ready", insights: await res.json() };
  } catch (error) {
    console.error("Failed to load insights", error);
    return { status: "error" };
  }
}

export default function Insights() {
  const [data, setData] = useState({ status: "loading" });
  const [filters, setFilters] = useState({ chamber: "all", party: "all", state: null });
  const [userBucket] = useState(playerBucket);

  const retry = useCallback(() => {
    setData({ status: "loading" });
    fetchInsights().then(setData);
  }, []);

  useEffect(() => {
    fetchInsights().then(setData);
  }, []);

  const insights = data.insights;
  const min = insights?.minSample ?? 30;
  const card = (n) => (data.status === "ready" ? { status: "ready", n } : { status: data.status });
  const ranked = insights ? rankMembers(insights.members, filters) : null;
  const confusionN = insights ? confusionTotals(insights.confusion).total : 0;
  const statesN = insights ? Math.max(0, ...insights.states.map((s) => s.n)) : 0;
  const speedN = insights ? insights.speed.reduce((sum, b) => sum + b.n, 0) : 0;

  return (
    <div className="insights min-h-screen">
      <Head>
        <title>Insights | Guess The Party</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <header className="mb-6">
          <Link href="/" className="text-xs font-semibold text-[var(--ink-muted)] underline">
            Back to the game
          </Link>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2">Which faces fool people?</h1>
          {insights && (
            <p className="text-sm text-[var(--ink-muted)] mt-1" data-testid="overall">
              {insights.guesses.n > 0
                ? `Overall accuracy ${pct(insights.guesses.accuracy, 1)} (95% interval ${pct(insights.guesses.low, 1)} to ${pct(insights.guesses.high, 1)}, n = ${formatCount(insights.guesses.n)} guesses).`
                : "No guesses recorded yet."}
            </p>
          )}
        </header>
        {insights?.synthetic && (
          <div
            role="status"
            className="mb-6 rounded-xl border-2 border-dashed border-[var(--ink-muted)] px-4 py-3 text-sm font-semibold"
          >
            Synthetic sample data. These numbers are generated for local development, not from real players.
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            id="distribution"
            title="How do I compare?"
            question="Share of runs (20+ guesses) by accuracy."
            state={card(insights?.runs.total ?? 0)}
            minSample={min}
            onRetry={retry}
            takeaway={insights && insights.runs.total >= min ? distributionTakeaway(insights.runs) : null}
          >
            {insights && <DistributionChart runs={insights.runs} userBucket={userBucket} />}
          </ChartCard>
          <ChartCard
            id="confusion"
            title="Do people lean toward one party?"
            question="Actual party by guessed party, all guesses."
            state={card(confusionN)}
            minSample={min}
            onRetry={retry}
            takeaway={
              insights && confusionN >= min ? confusionTakeaway(insights.confusion, insights.roster) : null
            }
          >
            {insights && <ConfusionMatrix confusion={insights.confusion} />}
          </ChartCard>
          <ChartCard
            id="members"
            title="Which members do people misread?"
            question={`Members with ${min} or more guesses, 15 hardest and 15 easiest.`}
            state={card(insights?.maxMemberGuesses ?? 0)}
            minSample={min}
            onRetry={retry}
            takeaway={ranked ? memberTakeaway(ranked.hardest) : null}
          >
            {ranked && <MemberDotPlot ranked={ranked} filters={filters} setFilters={setFilters} />}
          </ChartCard>
          <ChartCard
            id="states"
            title="Accuracy by state"
            question="Share of guesses that were correct, by the member's state."
            state={card(statesN)}
            minSample={min}
            onRetry={retry}
            takeaway={insights ? stateTakeaway(insights.states, min) : null}
          >
            {insights && (
              <StateTileMap
                states={insights.states}
                minSample={min}
                selected={filters.state}
                onSelect={(state) => setFilters({ ...filters, state })}
              />
            )}
          </ChartCard>
          <ChartCard
            id="speed"
            title="Does speed change accuracy?"
            question="Accuracy by response time, 100 ms bins."
            state={card(speedN)}
            minSample={min}
            onRetry={retry}
            takeaway={insights ? speedTakeaway(insights.speed) : null}
          >
            {insights && <SpeedChart speed={insights.speed} minSample={min} />}
          </ChartCard>
        </div>
      </main>
    </div>
  );
}
