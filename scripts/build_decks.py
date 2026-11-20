"""Build the extra decks in public/decks/ and download any portraits they need.

Congress decks list every Democrat and Republican who served in that Congress, with the
party they held then, using the congress-legislators current and historical rosters and
the same official portraits as the main game.

The Class of 2026 decks list the new members of the 120th Congress from Wikipedia's
"List of new members of the 120th United States Congress". Official portraits do not
exist until they are sworn in, so these use the freely licensed photo on that page and
keep its author and license for attribution. Members whose photo is missing or non-free
are skipped and logged.

Run `node scripts/optimize-images.mjs` afterwards to convert new portraits to WebP.
"""

import html
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

from build_dataset import IMG_DIR, PARTIES, PORTRAIT_URL, ROOT, TIMEOUT_SECONDS, has_portrait, portrait_stem, slugify

DECK_DIR = ROOT / "public" / "decks"
CURRENT_URL = "https://unitedstates.github.io/congress-legislators/legislators-current.json"
HISTORICAL_URL = "https://unitedstates.github.io/congress-legislators/legislators-historical.json"
WIKI_API = "https://en.wikipedia.org/w/api.php"
NEW_MEMBERS_PAGE = "List of new members of the 120th United States Congress"
USER_AGENT = "guesstheparty-deck-builder/1.0 (https://github.com/allenwang0/guesstheparty)"

CONGRESSES = {
    117: ("2021-01-03", "2023-01-03"),
    118: ("2023-01-03", "2025-01-03"),
    119: ("2025-01-03", "2027-01-03"),
}

STATES = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO",
    "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
    "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
    "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
    "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA",
    "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
    "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
    "Wisconsin": "WI", "Wyoming": "WY",
}
PARTY_LETTERS = {"D": "Democrat", "DFL": "Democrat", "R": "Republican"}  # DFL is Minnesota's Democratic party


def write_deck(deck_id, members):
    path = DECK_DIR / f"{deck_id}.json"
    path.write_text(json.dumps(members, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {path.relative_to(ROOT)}: {len(members)} members")


def congress_decks(session):
    people = []
    for url in (CURRENT_URL, HISTORICAL_URL):
        print(f"Fetching {url}")
        response = session.get(url, timeout=60)
        response.raise_for_status()
        people.extend(response.json())

    for number, (start, end) in CONGRESSES.items():
        members = []
        skipped = []
        for person in people:
            terms = [t for t in person["terms"] if t["start"] < end and t["end"] > start]
            if not terms or terms[-1].get("party") not in PARTIES:
                continue
            term = terms[-1]
            name = f"{person['name']['first']} {person['name']['last']}"
            bioguide = person["id"]["bioguide"]
            stem = portrait_stem(name, bioguide)
            if not has_portrait(stem):
                response = session.get(PORTRAIT_URL.format(bioguide=bioguide), timeout=TIMEOUT_SECONDS)
                if response.status_code != 200:
                    skipped.append(name)
                    print(f"skip {bioguide} {name}: portrait download returned HTTP {response.status_code}")
                    continue
                (IMG_DIR / f"{stem}.jpg").write_bytes(response.content)
            members.append(
                {
                    "id": bioguide,
                    "name": name,
                    "party": term["party"],
                    "state": term["state"],
                    "category": "senate" if term["type"] == "sen" else "house",
                    "img": f"/images/politicians/{stem}.webp",
                }
            )
        print(f"{number}th Congress: kept {len(members)}, skipped {len(skipped)}")
        write_deck(f"congress-{number}", members)


def parse_new_members(wikitext):
    """Yield (name, party, state, category, image file) for each voting new member."""
    wikitext = wikitext.split("====Non-voting delegates====")[0]
    senate, house = wikitext.split("== House of Representatives ==")
    for category, section in (("senate", senate), ("house", house)):
        for row in section.split("\n|-")[1:]:
            name = re.search(r"\{\{sortname\|([^|}]+)\|([^|}]+)", row)
            party = re.search(r"\}\}\s*\((D|DFL|R)\)", row)
            image = re.search(r"\[\[File:([^|\]]+)", row)
            if not name or not party:
                continue
            state = None
            if category == "senate":
                found = re.search(r"senators from ([A-Za-z ]+)\|", row)
                state = STATES.get(found.group(1)) if found else None
            else:
                found = re.search(r"\{\{ushr\|([A-Z]{2})\|", row) or re.search(r"\[\[([A-Za-z ]+?)'s (?:\w+ )?congressional district", row) or re.search(r"\[\[([A-Za-z ]+?)'s at-large", row)
                if found:
                    state = found.group(1) if len(found.group(1)) == 2 else STATES.get(found.group(1))
            yield (
                f"{name.group(1).strip()} {name.group(2).strip()}",
                PARTY_LETTERS[party.group(1)],
                state,
                category,
                image.group(1).strip() if image else None,
            )


def strip_html(text):
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def image_info(session, filename):
    params = {
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiurlwidth": 450,
        "format": "json",
        "formatversion": 2,
    }
    page = session.get(WIKI_API, params=params, timeout=TIMEOUT_SECONDS).json()["query"]["pages"][0]
    if page.get("imagerepository") != "shared" or not page.get("imageinfo"):
        return None, "photo is not on Wikimedia Commons, so it may be non-free"
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    license_name = strip_html(meta.get("LicenseShortName", {}).get("value"))
    if not license_name:
        return None, "photo has no license"
    return {
        "thumb": info["thumburl"],
        "credit": {
            "author": strip_html(meta.get("Artist", {}).get("value")) or "Unknown",
            "license": license_name,
            "source": info["descriptionurl"],
        },
    }, None


def class_of_2026_decks(session):
    params = {"action": "parse", "page": NEW_MEMBERS_PAGE, "prop": "wikitext", "format": "json", "formatversion": 2}
    print(f"Fetching Wikipedia: {NEW_MEMBERS_PAGE}")
    wikitext = session.get(WIKI_API, params=params, timeout=TIMEOUT_SECONDS).json()["parse"]["wikitext"]

    members = []
    skipped = []
    for name, party, state, category, filename in parse_new_members(wikitext):
        stem = f"{slugify(name)}-new2026"
        problem = None if filename else "no photo on the page"
        info = None
        if filename:
            info, problem = image_info(session, filename)
        if problem:
            skipped.append(name)
            print(f"skip {name} ({party[0]}-{state}): {problem}")
            continue
        if not has_portrait(stem):
            response = session.get(info["thumb"], timeout=TIMEOUT_SECONDS)
            if response.status_code != 200:
                skipped.append(name)
                print(f"skip {name}: photo download returned HTTP {response.status_code}")
                continue
            (IMG_DIR / f"{stem}.jpg").write_bytes(response.content)
        members.append(
            {
                "id": stem,
                "name": name,
                "party": party,
                "state": state,
                "category": category,
                "img": f"/images/politicians/{stem}.webp",
                "credit": info["credit"],
            }
        )

    print(f"Class of 2026: kept {len(members)}, skipped {len(skipped)}")
    write_deck("class-of-2026", members)
    write_deck("class-of-2026-democrats", [m for m in members if m["party"] == "Democrat"])
    return len(skipped)


def main():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    DECK_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    congress_decks(session)
    class_of_2026_decks(session)
    print(f"Done at {datetime.now(timezone.utc).isoformat(timespec='seconds')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
