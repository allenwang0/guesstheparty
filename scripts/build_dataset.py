"""Build public/politicians.json and public/meta.json from the congress-legislators project.

Portraits are downloaded as JPEG into public/images/politicians/; run
`node scripts/optimize-images.mjs` afterwards to convert them to WebP.
"""

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "images" / "politicians"
JSON_PATH = ROOT / "public" / "politicians.json"
META_PATH = ROOT / "public" / "meta.json"

LEGISLATORS_URL = "https://unitedstates.github.io/congress-legislators/legislators-current.json"
PORTRAIT_URL = "https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg"
PARTIES = ("Democrat", "Republican")
MAX_MISSING_SHARE = 0.05
TIMEOUT_SECONDS = 20


def slugify(name):
    return name.lower().replace(" ", "-").replace(".", "").replace("'", "")


def portrait_stem(name, bioguide):
    return f"{slugify(name)}-{bioguide}"


def has_portrait(stem):
    return (IMG_DIR / f"{stem}.webp").exists() or (IMG_DIR / f"{stem}.jpg").exists()


def download_portrait(session, bioguide, stem):
    response = session.get(PORTRAIT_URL.format(bioguide=bioguide), timeout=TIMEOUT_SECONDS)
    if response.status_code != 200:
        return f"portrait download returned HTTP {response.status_code}"
    (IMG_DIR / f"{stem}.jpg").write_bytes(response.content)
    return None


def build(dry_run):
    session = requests.Session()
    print(f"Fetching {LEGISLATORS_URL}")
    legislators = session.get(LEGISLATORS_URL, timeout=TIMEOUT_SECONDS)
    legislators.raise_for_status()

    pool = []
    skipped = []
    eligible = 0
    to_download = 0
    for person in legislators.json():
        term = person["terms"][-1]
        name = f"{person['name']['first']} {person['name']['last']}"
        bioguide = person["id"]["bioguide"]
        if term["party"] not in PARTIES:
            print(f"skip {bioguide} {name}: party is {term['party']}, only D and R are in the game")
            continue
        eligible += 1
        stem = portrait_stem(name, bioguide)
        if not has_portrait(stem):
            to_download += 1
            if not dry_run:
                try:
                    problem = download_portrait(session, bioguide, stem)
                except requests.RequestException as error:
                    problem = f"portrait download failed: {error}"
                if problem:
                    skipped.append((bioguide, name, problem))
                    print(f"skip {bioguide} {name}: {problem}")
                    continue
        pool.append(
            {
                "id": bioguide,
                "name": name,
                "party": term["party"],
                "state": term["state"],
                "category": "senate" if term["type"] == "sen" else "house",
                "img": f"/images/politicians/{stem}.webp",
            }
        )

    counts = Counter((p["party"], p["category"]) for p in pool)
    meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sources": {"legislators": LEGISLATORS_URL, "portraits": PORTRAIT_URL},
        "total": len(pool),
        "counts": {
            party: {chamber: counts[(party, chamber)] for chamber in ("house", "senate")} for party in PARTIES
        },
        "skipped": len(skipped),
    }

    missing_share = len(skipped) / eligible if eligible else 1.0
    print(f"D and R members: {eligible}, kept: {len(pool)}, skipped: {len(skipped)} ({missing_share:.1%})")
    print(f"Counts: {json.dumps(meta['counts'])}")

    if missing_share > MAX_MISSING_SHARE:
        print(f"error: more than {MAX_MISSING_SHARE:.0%} of D and R members are missing", file=sys.stderr)
        return 1
    if dry_run:
        print(f"Dry run: {to_download} portraits would be downloaded; nothing written.")
        return 0

    JSON_PATH.write_text(json.dumps(pool, indent=2, ensure_ascii=False) + "\n")
    META_PATH.write_text(json.dumps(meta, indent=2) + "\n")
    print(f"Wrote {JSON_PATH.relative_to(ROOT)} and {META_PATH.relative_to(ROOT)}")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="fetch the roster and report, but write nothing")
    args = parser.parse_args()
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    return build(args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
