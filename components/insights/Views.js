import { useState } from "react";
import { bucketLabel } from "../../lib/buckets";
import { binLabel, formatCount, pct } from "../../lib/insights";
import { STATE_TILES } from "../../lib/state-tiles";

const PARTY_COLOR = { Democrat: "var(--party-d)", Republican: "var(--party-r)" };
const PARTY_LETTER = { Democrat: "D", Republican: "R" };
const SEQUENTIAL = ["var(--seq-0)", "var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)"];

function Readout({ text, fallback }) {
  return (
    <p className="mt-2 min-h-[1.25rem] text-xs text-[var(--ink-muted)]" aria-live="polite">
      {text ?? fallback}
    </p>
  );
}

export function DistributionChart({ runs, userBucket }) {
  const [hover, setHover] = useState(null);
  const width = 320;
  const height = 180;
  const pad = { left: 34, right: 6, top: 18, bottom: 30 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const shares = runs.counts.map((c) => c / runs.total);
  const maxShare = Math.max(0.1, Math.ceil(Math.max(...shares) * 10) / 10);
  const slot = plotW / shares.length;
  const ticks = [0, maxShare / 2, maxShare];
  return (
    <>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Share of runs by accuracy bucket"
      >
        {ticks.map((t) => {
          const y = pad.top + plotH - (t / maxShare) * plotH;
          return (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--rule)" strokeWidth="1" />
              <text x={pad.left - 4} y={y + 3} textAnchor="end" fontSize="9" fill="var(--ink-muted)">
                {pct(t)}
              </text>
            </g>
          );
        })}
        {shares.map((share, i) => {
          const h = (share / maxShare) * plotH;
          const x = pad.left + i * slot + 1;
          const y = pad.top + plotH - h;
          const isUser = i === userBucket;
          const detail = `${bucketLabel(i)}%: ${formatCount(runs.counts[i])} runs (${pct(share, 1)})`;
          return (
            <g
              key={i}
              tabIndex={0}
              onMouseEnter={() => setHover(detail)}
              onFocus={() => setHover(detail)}
              onMouseLeave={() => setHover(null)}
              onBlur={() => setHover(null)}
            >
              <title>{detail}</title>
              <rect x={pad.left + i * slot} y={pad.top} width={slot} height={plotH} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={slot - 2}
                height={Math.max(h, 0.5)}
                rx="2"
                fill="var(--neutral-mark)"
              />
              {isUser && (
                <>
                  <rect
                    x={x}
                    y={y}
                    width={slot - 2}
                    height={Math.max(h, 0.5)}
                    rx="2"
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="2"
                  />
                  <text
                    x={x + (slot - 2) / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="var(--ink)"
                  >
                    You
                  </text>
                </>
              )}
              <text
                x={x + (slot - 2) / 2}
                y={height - pad.bottom + 12}
                textAnchor="middle"
                fontSize="8"
                fill="var(--ink-muted)"
              >
                {i * 10}
              </text>
            </g>
          );
        })}
        <text
          x={pad.left + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize="9"
          fill="var(--ink-muted)"
        >
          Accuracy bucket (% correct)
        </text>
        <text
          x="8"
          y={pad.top + plotH / 2}
          fontSize="9"
          fill="var(--ink-muted)"
          transform={`rotate(-90 8 ${pad.top + plotH / 2})`}
          textAnchor="middle"
        >
          Share of runs (%)
        </text>
      </svg>
      <Readout text={hover} fallback="Hover or focus a bar for its count and share." />
    </>
  );
}

function DotRows({ rows, label, onHover }) {
  const rowH = 22;
  const labelW = 150;
  const width = 340;
  const plotW = width - labelW - 10;
  const height = rows.length * rowH + 24;
  const x = (v) => labelW + v * plotW;
  return (
    <div>
      <h3 className="text-xs font-semibold text-[var(--ink-muted)] mt-2 mb-1">{label}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={label}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={0}
              y2={rows.length * rowH}
              stroke={t === 0.5 ? "var(--ink-muted)" : "var(--rule)"}
              strokeDasharray={t === 0.5 ? "4 3" : undefined}
            />
            <text
              x={x(t)}
              y={rows.length * rowH + 12}
              textAnchor="middle"
              fontSize="9"
              fill="var(--ink-muted)"
            >
              {t * 100}%
            </text>
          </g>
        ))}
        <text x={x(0.5)} y={rows.length * rowH + 22} textAnchor="middle" fontSize="8" fill="var(--ink-muted)">
          Accuracy (%), dashed line = chance
        </text>
        {rows.map((m, i) => {
          const cy = i * rowH + rowH / 2;
          const detail = `${m.name} (${PARTY_LETTER[m.party]}-${m.state}): ${pct(m.accuracy)} of ${formatCount(m.n)} guesses, 95% interval ${pct(m.low)} to ${pct(m.high)}`;
          return (
            <g
              key={m.id}
              tabIndex={0}
              onMouseEnter={() => onHover(detail)}
              onFocus={() => onHover(detail)}
              onMouseLeave={() => onHover(null)}
              onBlur={() => onHover(null)}
            >
              <title>{detail}</title>
              <rect x="0" y={i * rowH} width={width} height={rowH} fill="transparent" />
              <text x="0" y={cy + 3} fontSize="9" fill="var(--ink)">
                {m.name.length > 20 ? `${m.name.slice(0, 19)}…` : m.name}{" "}
                <tspan fill="var(--ink-muted)">
                  {PARTY_LETTER[m.party]} · {m.chamber === "senate" ? "Sen" : "Rep"} · {m.state}
                </tspan>
              </text>
              <line
                x1={x(m.low)}
                x2={x(m.high)}
                y1={cy}
                y2={cy}
                stroke={PARTY_COLOR[m.party]}
                strokeWidth="2"
              />
              <circle
                cx={x(m.accuracy)}
                cy={cy}
                r="4.5"
                fill={PARTY_COLOR[m.party]}
                stroke="var(--card)"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function MemberDotPlot({ ranked, filters, setFilters }) {
  const [hover, setHover] = useState(null);
  const select = "rounded-lg border border-[var(--rule)] bg-[var(--card)] px-2 py-1 text-xs";
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
        <label>
          Chamber{" "}
          <select
            className={select}
            value={filters.chamber}
            onChange={(e) => setFilters({ ...filters, chamber: e.target.value })}
          >
            <option value="all">All</option>
            <option value="house">House</option>
            <option value="senate">Senate</option>
          </select>
        </label>
        <label>
          Party{" "}
          <select
            className={select}
            value={filters.party}
            onChange={(e) => setFilters({ ...filters, party: e.target.value })}
          >
            <option value="all">All</option>
            <option value="Democrat">D (Democrat)</option>
            <option value="Republican">R (Republican)</option>
          </select>
        </label>
        {filters.state && (
          <button className={select} onClick={() => setFilters({ ...filters, state: null })}>
            State: {filters.state} ✕
          </button>
        )}
      </div>
      {ranked.count === 0 ? (
        <p className="text-sm text-[var(--ink-muted)]">
          No members with 30 or more guesses match these filters.
        </p>
      ) : (
        <>
          <DotRows rows={ranked.hardest} label="Hardest (lowest accuracy first)" onHover={setHover} />
          <DotRows rows={ranked.easiest} label="Easiest (highest accuracy first)" onHover={setHover} />
        </>
      )}
      <Readout
        text={hover}
        fallback="Dots are accuracy; whiskers are the Wilson 95% interval. Hover a row for n."
      />
    </>
  );
}

export function ConfusionMatrix({ confusion }) {
  const rows = ["Democrat", "Republican"];
  const max = Math.max(...rows.flatMap((r) => [confusion[r].D, confusion[r].R]));
  return (
    <table className="w-full text-sm border-separate border-spacing-1">
      <caption className="sr-only">Actual party by guessed party</caption>
      <thead>
        <tr>
          <th className="text-left text-xs font-medium text-[var(--ink-muted)]">Actual \ Guessed</th>
          <th className="text-xs font-semibold">D (Democrat)</th>
          <th className="text-xs font-semibold">R (Republican)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((actual) => {
          const rowTotal = confusion[actual].D + confusion[actual].R;
          return (
            <tr key={actual}>
              <th className="text-left text-xs font-semibold">
                {PARTY_LETTER[actual]} ({actual})
              </th>
              {["D", "R"].map((guess) => {
                const count = confusion[actual][guess];
                const level = Math.min(SEQUENTIAL.length - 1, Math.floor((count / max) * SEQUENTIAL.length));
                const dark = level >= 3;
                return (
                  <td
                    key={guess}
                    className="rounded-lg p-3 text-center"
                    style={{ background: SEQUENTIAL[level], color: dark ? "#ffffff" : "var(--ink)" }}
                    title={`${formatCount(count)} guesses`}
                  >
                    <div className="font-bold">{formatCount(count)}</div>
                    <div className="text-xs">{rowTotal ? pct(count / rowTotal) : "n/a"} of row</div>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function StateTileMap({ states, minSample, selected, onSelect }) {
  const byState = new Map(states.map((s) => [s.state, s]));
  const enough = states.filter((s) => s.n >= minSample).map((s) => s.accuracy);
  const lo = enough.length ? Math.min(...enough) : 0;
  const hi = enough.length ? Math.max(...enough) : 1;
  const level = (a) => (hi === lo ? 2 : Math.min(4, Math.floor(((a - lo) / (hi - lo)) * 5)));
  const cols = 12;
  const rowsCount = Math.max(...STATE_TILES.map((t) => t.row)) + 1;
  return (
    <>
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rowsCount}, auto)`,
        }}
      >
        {STATE_TILES.map(({ state, row, col }) => {
          const s = byState.get(state);
          const tooFew = !s || s.n < minSample;
          const lv = tooFew ? null : level(s.accuracy);
          const label = tooFew
            ? `${state}: too few guesses (${s ? s.n : 0})`
            : `${state}: ${pct(s.accuracy)} of ${formatCount(s.n)} guesses`;
          return (
            <button
              key={state}
              title={label}
              aria-label={label}
              aria-pressed={selected === state}
              disabled={tooFew}
              onClick={() => onSelect(selected === state ? null : state)}
              className={`aspect-square rounded-[3px] flex flex-col items-center justify-center leading-none ${
                selected === state ? "ring-2 ring-[var(--ink)]" : ""
              }`}
              style={{
                gridRow: row + 1,
                gridColumn: col + 1,
                background: tooFew
                  ? "repeating-linear-gradient(45deg, var(--rule) 0 3px, transparent 3px 6px)"
                  : SEQUENTIAL[lv],
                color: !tooFew && lv >= 3 ? "#ffffff" : "var(--ink)",
              }}
            >
              <span className="text-[8px] md:text-[10px] font-bold">{state}</span>
              <span className="text-[7px] md:text-[9px]">
                {tooFew ? "too few" : Math.round(s.accuracy * 100)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[var(--ink-muted)]">
        Values are % correct; darker is higher ({pct(lo)} to {pct(hi)}). Hatched tiles have under {minSample}{" "}
        guesses. Tap a state to filter the member chart.
      </p>
    </>
  );
}

export function SpeedChart({ speed, minSample }) {
  const [hover, setHover] = useState(null);
  const width = 320;
  const height = 180;
  const pad = { left: 34, right: 10, top: 10, bottom: 30 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const last = speed.length - 1;
  const x = (bin) => pad.left + (bin / last) * plotW;
  const y = (a) => pad.top + plotH - a * plotH;
  const points = speed.filter((b) => b.n > 0);
  const path = points.map((b, i) => `${i === 0 ? "M" : "L"}${x(b.bin)},${y(b.accuracy)}`).join(" ");
  return (
    <>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Accuracy by response time"
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--rule)"
              strokeDasharray={t === 0.5 ? "4 3" : undefined}
            />
            <text x={pad.left - 4} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--ink-muted)">
              {t * 100}%
            </text>
          </g>
        ))}
        {[0, 5, 10, 15, last].map((bin) => (
          <text
            key={bin}
            x={x(bin)}
            y={height - pad.bottom + 12}
            textAnchor="middle"
            fontSize="8"
            fill="var(--ink-muted)"
          >
            {bin === last ? `${bin * 100}+` : bin * 100}
          </text>
        ))}
        <text
          x={pad.left + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize="9"
          fill="var(--ink-muted)"
        >
          Response time (ms)
        </text>
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth="2" />
        {points.map((b) => {
          const detail = `${binLabel(b.bin, last)}: ${pct(b.accuracy)} correct (n = ${formatCount(b.n)})`;
          const hollow = b.n < minSample;
          return (
            <g
              key={b.bin}
              tabIndex={0}
              onMouseEnter={() => setHover(detail)}
              onFocus={() => setHover(detail)}
              onMouseLeave={() => setHover(null)}
              onBlur={() => setHover(null)}
            >
              <title>{detail}</title>
              <circle cx={x(b.bin)} cy={y(b.accuracy)} r="9" fill="transparent" />
              <circle
                cx={x(b.bin)}
                cy={y(b.accuracy)}
                r="4"
                fill={hollow ? "var(--card)" : "var(--ink)"}
                stroke="var(--ink)"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>
      <Readout
        text={hover}
        fallback={`Hollow points have under ${minSample} guesses. Hover a point for n.`}
      />
    </>
  );
}
