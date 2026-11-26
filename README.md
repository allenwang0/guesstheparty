# Guess the Party

A swipe game that shows the official portrait of a member of Congress and asks whether they are a Democrat or a Republican. Play it at https://guesstheparty.vercel.app.

![Two guesses and their reveals in the game](docs/demo.gif)

## Highlights

- 450 members in the current snapshot: 221 Democrats and 229 Republicans (`public/meta.json`).
- `/daily`: the same ten faces for every player each UTC day, with a copyable result grid.
- `/insights`: which members players misread (Wilson 95% intervals), party lean, and accuracy by answer speed. Each chart waits for 30 observations.

![The /insights page with synthetic sample data, not real players](docs/insights.png)

## Run it

Requires Node 20 or later.

```bash
npm ci
npm run dev        # http://localhost:3000
npm run dev:sample # /insights with 600 synthetic players
npm test
npm run build
```

Without `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL` and `KV_REST_API_TOKEN`), stats live in server memory and reset on restart.

## How it works

`scripts/build_dataset.py` reads the [congress-legislators](https://github.com/unitedstates/congress-legislators) roster, downloads portraits from [unitedstates/images](https://github.com/unitedstates/images), and writes `public/politicians.json`, a list of members with bioguide ids. It fails when more than 5% of members are missing. `scripts/optimize-images.mjs` converts portraits to 360×440 WebP; the 450 committed files total 5,060,414 bytes. A weekly GitHub Action reruns both and opens a pull request when the roster changes.

`lib/game-queue.js` shuffles with Fisher-Yates and keeps the last 50 members out of the next deal. Scores and guesses go to Upstash Redis through API routes that check party server-side and rate-limit each hashed IP to 30 requests per 10 minutes. `/api/insights` returns aggregates only.

## Limitations

- Independents are excluded.
- The roster is a snapshot and ages until the weekly refresh pull request is merged.
- Portraits carry cues besides the face: background, lighting, clothing, photo era.
- Players self-select, so aggregates describe this game's players, not the public.
- The rate limit slows abuse but cannot stop made-up guesses.

## License

Code: [MIT](LICENSE). Portraits: public-domain photographs collected by [unitedstates/images](https://github.com/unitedstates/images).
