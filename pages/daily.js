import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { dailyIds, shareText, utcDateKey } from "../lib/daily";
import { normalizePoliticians } from "../lib/politicians";

const PARTIES = ["Democrat", "Republican"];

function elapsedSince(start) {
  return start === null ? null : Date.now() - start;
}

function sendGuesses(guesses) {
  fetch("/api/guesses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guesses }),
  }).catch((error) => console.error("Failed to send guesses", error));
}

export default function Daily() {
  const [game, setGame] = useState({ status: "loading" });
  const [index, setIndex] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [shownAt, setShownAt] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/politicians.json");
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const pool = normalizePoliticians(await res.json());
        const date = utcDateKey();
        const byId = new Map(pool.map((p) => [p.id, p]));
        const faces = dailyIds(date, [...byId.keys()]).map((id) => byId.get(id));
        setGame({ status: "ready", date, faces });
      } catch (error) {
        console.error("Failed to load the daily challenge", error);
        setGame({ status: "error" });
      }
    })();
  }, []);

  if (game.status === "loading") return <p className="p-6 text-center text-sm">Loading...</p>;
  if (game.status === "error") {
    return <p className="p-6 text-center text-sm">Couldn&apos;t load the game. Refresh to try again.</p>;
  }

  const results = guesses.map((g, i) => g.guessedParty === game.faces[i].party);
  const done = guesses.length === game.faces.length;
  const face = game.faces[index];

  const guess = (guessedParty) => {
    const responseMs = elapsedSince(shownAt);
    const next = [...guesses, { bioguideId: face.id, guessedParty, responseMs }];
    setGuesses(next);
    setShownAt(null);
    if (next.length === game.faces.length) sendGuesses(next);
    else setIndex(index + 1);
  };

  const share = async () => {
    const text = shareText(game.date, results);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      console.error("Clipboard unavailable", error);
      window.prompt("Copy your result", text);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
      <Head>
        <title>Daily Challenge | Guess The Party</title>
      </Head>
      <main className="mx-auto max-w-md px-4 py-6">
        <Link href="/" className="text-xs font-semibold text-gray-500 underline">
          Back to the game
        </Link>
        <h1 className="text-2xl font-black tracking-tight mt-2">Daily challenge</h1>
        <p className="text-sm text-gray-500 mb-4">{game.date} (UTC): the same 10 faces for everyone today.</p>
        {done ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm text-center space-y-4">
            <p className="text-4xl font-black">
              {results.filter(Boolean).length}/{results.length}
            </p>
            <pre className="text-2xl tracking-widest" data-testid="daily-grid">
              {results.map((ok) => (ok ? "✓" : "✗")).join("")}
            </pre>
            <ol className="text-left text-sm space-y-1">
              {game.faces.map((f, i) => (
                <li key={f.id}>
                  {results[i] ? "✓" : "✗"} {f.name} ({f.party === "Democrat" ? "D" : "R"}-{f.state})
                </li>
              ))}
            </ol>
            <button onClick={share} className="w-full py-3 bg-black text-white rounded-xl font-bold">
              {copied ? "Copied" : "Copy result"}
            </button>
            <Link href="/insights" className="block text-sm underline">
              See which faces players misread
            </Link>
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Face {index + 1} of {game.faces.length}
            </p>
            <div className="relative aspect-[9/11] w-full overflow-hidden rounded-xl bg-gray-100">
              <Image
                key={face.id}
                src={face.imageUrl}
                alt="Member of Congress"
                fill
                sizes="400px"
                className="object-cover"
                onLoad={() => setShownAt(Date.now())}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {PARTIES.map((party) => (
                <button
                  key={party}
                  onClick={() => guess(party)}
                  className={`py-3 rounded-xl font-bold text-sm ${
                    party === "Democrat" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {party === "Democrat" ? "D: Democrat" : "R: Republican"}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
