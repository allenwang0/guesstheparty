import requests
import json


def generate_database():
    # 1. Fetch official Congress data
    print("Fetching Congress data...")
    res = requests.get("https://unitedstates.github.io/congress-legislators/legislators-current.json")
    data = res.json()

    pool = []

    # 2. Process House and Senate
    for person in data:
        term = person['terms'][-1]
        if term['party'] not in ['Democrat', 'Republican']:
            continue

        pool.append({
            "name": f"{person['name']['first']} {person['name']['last']}",
            "party": term['party'],
            "state": term['state'],  # You can map these to full names if desired
            "category": "senate" if term['type'] == 'sen' else "house",
            "img": f"https://unitedstates.github.io/images/congress/450x550/{person['id']['bioguide']}.jpg"
        })

    # 3. Add Governors (Example - add more as needed)
    govs = [
        {"name": "Gavin Newsom", "party": "Democrat", "state": "California", "category": "gov",
         "img": "https://www.nga.org/wp-content/uploads/2020/01/Gavin-Newsom-300x400.jpg"},
        {"name": "Ron DeSantis", "party": "Republican", "state": "Florida", "category": "gov",
         "img": "https://www.nga.org/wp-content/uploads/2020/01/Ron-DeSantis-300x400.jpg"}
    ]
    pool.extend(govs)

    with open('politicians.json', 'w') as f:
        json.dump(pool, f, indent=2)
    print(f"Success! Created politicians.json with {len(pool)} entries.")


if __name__ == "__main__":
    generate_database()