import requests
import json
import os
import time
from pathlib import Path

# --- Configuration ---
IMG_DIR = Path("public/images/politicians")
JSON_PATH = Path("public/politicians.json")
# Ensure the directory exists
IMG_DIR.mkdir(parents=True, exist_ok=True)


def slugify(name):
    """Convert 'Gavin Newsom' to 'gavin-newsom'"""
    return name.lower().replace(" ", "-").replace(".", "").replace("'", "")


def download_image(url, filename):
    """Downloads image if it doesn't already exist."""
    filepath = IMG_DIR / filename
    if filepath.exists():
        return True  # Skip if already exists

    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
    return False


def generate_database():
    # 1. Fetch official Congress data
    print("Fetching Congress data...")
    res = requests.get("https://unitedstates.github.io/congress-legislators/legislators-current.json")
    data = res.json()

    pool = []

    # 2. Add Governors (Static list)
    # Using specific official URLs that are more reliable
    govs = [
        {"name": "Gavin Newsom", "party": "Democrat", "state": "California", "category": "gov",
         "remote_img": "https://www.nga.org/wp-content/uploads/2020/01/Gavin-Newsom-300x400.jpg"},
        {"name": "Ron DeSantis", "party": "Republican", "state": "Florida", "category": "gov",
         "remote_img": "https://www.nga.org/wp-content/uploads/2020/01/Ron-DeSantis-300x400.jpg"}
    ]

    # 3. Process House and Senate
    print("Processing legislators and downloading images...")

    # Process Congress
    for person in data:
        term = person['terms'][-1]
        if term['party'] not in ['Democrat', 'Republican']:
            continue

        full_name = f"{person['name']['first']} {person['name']['last']}"
        bioguide_id = person['id']['bioguide']

        # Next.js local path needs to be relative to 'public'
        filename = f"{slugify(full_name)}-{bioguide_id}.jpg"
        remote_url = f"https://unitedstates.github.io/images/congress/450x550/{bioguide_id}.jpg"

        success = download_image(remote_url, filename)

        if success:
            pool.append({
                "name": full_name,
                "party": term['party'],
                "state": term['state'],
                "category": "senate" if term['type'] == 'sen' else "house",
                "img": f"/images/politicians/{filename}"  # Path for Next.js
            })

    # Process Governors
    for gov in govs:
        filename = f"{slugify(gov['name'])}.jpg"
        success = download_image(gov['remote_img'], filename)
        if success:
            pool.append({
                "name": gov['name'],
                "party": gov['party'],
                "state": gov['state'],
                "category": gov['category'],
                "img": f"/images/politicians/{filename}"
            })

    # 4. Save to JSON
    with open(JSON_PATH, 'w') as f:
        json.dump(pool, f, indent=2)

    print(f"\n✨ Success!")
    print(f"Total entries: {len(pool)}")
    print(f"Images stored in: {IMG_DIR}")
    print(f"JSON updated at: {JSON_PATH}")


if __name__ == "__main__":
    generate_database()