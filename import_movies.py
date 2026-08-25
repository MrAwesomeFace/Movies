import os
import re
import json
import time
import getpass
from pathlib import Path

import requests
from docx import Document


# ============================================================
# SETTINGS
# ============================================================

TMDB_API = "https://api.themoviedb.org/3"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

DOCX_NAME = "movie_tv_collection_inventory.docx"

OUTPUT_NAME = "movies.js"
REVIEW_NAME = "tmdb_review.json"


# ============================================================
# TMDB AUTHENTICATION
# ============================================================

print()
print("BW's Movie Catalog Importer")
print("===========================")
print()

token = getpass.getpass(
    "Paste your TMDB API Read Access Token, then press Enter:\n"
).strip()

if not token:
    raise SystemExit("No token entered.")


HEADERS = {
    "Authorization": f"Bearer {token}",
    "accept": "application/json"
}


# ============================================================
# FIND THE DOCX
# ============================================================

script_folder = Path(__file__).resolve().parent

docx_path = script_folder / DOCX_NAME

if not docx_path.exists():

    print()
    print("ERROR:")
    print(f"Could not find {DOCX_NAME}")
    print()
    print("Make sure the DOCX is in the same folder as this script:")
    print(script_folder)
    print()

    raise SystemExit(1)


# ============================================================
# READ THE INVENTORY
# ============================================================

print()
print("Reading inventory...")

document = Document(docx_path)

rows = []

for table in document.tables:

    for row in table.rows:

        values = [
            cell.text.strip()
            for cell in row.cells
        ]

        if len(values) < 2:
            continue

        title = values[0]
        fmt = values[1]

        if not title:
            continue

        if title.lower() == "title":
            continue

        rows.append({
            "title": title,
            "format": fmt
        })


print(f"Found {len(rows)} inventory entries.")


# ============================================================
# CLASSIFICATION
# ============================================================

TV_PATTERNS = [
    r"\bseason\b",
    r"\bcomplete series\b",
    r"\bcomplete collection\b",
    r"\bseries\b",
    r"\btv\b"
]


MISC_PATTERNS = [
    r"\bcollection\b",
    r"\btrilogy\b",
    r"\bquadrilogy\b",
    r"\bbox set\b",
    r"\bboxset\b",
    r"\bcomplete\b",
    r"\bwwe\b",
    r"\bwrestling\b",
    r"\bnfl\b",
    r"\bnba\b",
    r"\bmlb\b",
    r"\bcubs\b",
    r"\bsports\b"
]


def classify(title):

    lower = title.lower()

    # TV takes priority over everything else.
    for pattern in TV_PATTERNS:

        if re.search(pattern, lower):

            return "tv"


    for pattern in MISC_PATTERNS:

        if re.search(pattern, lower):

            return "misc"


    return "movie"


# ============================================================
# CLEAN SEARCH TITLES
# ============================================================

def clean_title(title):

    cleaned = title

    # Remove common collection/format language
    cleaned = re.sub(
        r"\s*[-–—]\s*(complete|collection|box set|trilogy).*?$",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    cleaned = re.sub(
        r"\s*\(\s*complete.*?\)",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    cleaned = re.sub(
        r"\s*-\s*Season\s+\d+.*?$",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    return cleaned.strip()


# ============================================================
# TMDB SEARCH
# ============================================================

session = requests.Session()
session.headers.update(HEADERS)


def search_movie(title):

    params = {
        "query": title,
        "include_adult": "false",
        "language": "en-US"
    }

    response = session.get(
        f"{TMDB_API}/search/movie",
        params=params,
        timeout=30
    )

    response.raise_for_status()

    return response.json().get("results", [])


def search_tv(title):

    params = {
        "query": title,
        "language": "en-US"
    }

    response = session.get(
        f"{TMDB_API}/search/tv",
        params=params,
        timeout=30
    )

    response.raise_for_status()

    return response.json().get("results", [])


# ============================================================
# DETAILS
# ============================================================

def get_movie_details(tmdb_id):

    response = session.get(
        f"{TMDB_API}/movie/{tmdb_id}",
        params={
            "language": "en-US"
        },
        timeout=30
    )

    response.raise_for_status()

    return response.json()


def get_tv_details(tmdb_id):

    response = session.get(
        f"{TMDB_API}/tv/{tmdb_id}",
        params={
            "language": "en-US"
        },
        timeout=30
    )

    response.raise_for_status()

    return response.json()


# ============================================================
# DIRECTOR / CAST
# ============================================================

def get_movie_credits(tmdb_id):

    response = session.get(
        f"{TMDB_API}/movie/{tmdb_id}/credits",
        params={
            "language": "en-US"
        },
        timeout=30
    )

    response.raise_for_status()

    return response.json()


def get_tv_credits(tmdb_id):

    response = session.get(
        f"{TMDB_API}/tv/{tmdb_id}/credits",
        params={
            "language": "en-US"
        },
        timeout=30
    )

    response.raise_for_status()

    return response.json()


# ============================================================
# FORMAT CONVERSION
# ============================================================

def physical_format(value):

    text = value.strip()

    lower = text.lower()

    if "4k" in lower or "uhd" in lower:

        return "4K UHD"

    if "blu-ray" in lower or "bluray" in lower:

        if "dvd" in lower:

            return "Blu-ray + DVD"

        return "Blu-ray"

    if "dvd" in lower:

        return "DVD"

    if "vhs" in lower:

        return "VHS"

    return text


# ============================================================
# CAST HELPERS
# ============================================================

def movie_cast(credits):

    cast = credits.get("cast", [])

    names = [
        person.get("name")
        for person in cast[:6]
        if person.get("name")
    ]

    return ", ".join(names)


def movie_director(credits):

    crew = credits.get("crew", [])

    directors = [
        person.get("name")
        for person in crew
        if person.get("job") == "Director"
    ]

    return ", ".join(directors[:2])


def tv_cast(credits):

    cast = credits.get("cast", [])

    names = [
        person.get("name")
        for person in cast[:6]
        if person.get("name")
    ]

    return ", ".join(names)


def tv_creator(details):

    creators = details.get("created_by", [])

    names = [
        person.get("name")
        for person in creators
        if person.get("name")
    ]

    return ", ".join(names[:2])


# ============================================================
# MATCH SCORING
# ============================================================

def normalize(text):

    text = text.lower()

    text = re.sub(
        r"[^a-z0-9]+",
        " ",
        text
    )

    return " ".join(text.split())


def score_match(original, result):

    original_normalized = normalize(
        clean_title(original)
    )

    result_title = (
        result.get("title")
        or result.get("name")
        or ""
    )

    result_normalized = normalize(
        result_title
    )

    if original_normalized == result_normalized:

        return 100


    if (
        original_normalized in result_normalized
        or result_normalized in original_normalized
    ):

        return 85


    original_words = set(
        original_normalized.split()
    )

    result_words = set(
        result_normalized.split()
    )

    if not original_words:
        return 0

    overlap = len(
        original_words & result_words
    ) / len(original_words)

    return int(overlap * 70)


# ============================================================
# CREATE ENTRY
# ============================================================

def create_movie_entry(row, result):

    title = row["title"]

    tmdb_id = result["id"]

    details = get_movie_details(tmdb_id)

    credits = get_movie_credits(tmdb_id)

    poster = details.get("poster_path")

    genres = [
        genre.get("name")
        for genre in details.get("genres", [])
        if genre.get("name")
    ]

    return {

        "title": title,

        "type": "movie",

        "tmdbId": tmdb_id,

        "poster": (
            IMAGE_BASE + poster
            if poster
            else ""
        ),

        "year": (
            details.get("release_date", "")[:4]
            if details.get("release_date")
            else ""
        ),

        "runtime": (
            f'{details.get("runtime")}m'
            if details.get("runtime")
            else ""
        ),

        "genre": " / ".join(genres),

        "director": movie_director(
            credits
        ),

        "cast": movie_cast(
            credits
        ),

        "synopsis": (
            details.get("overview")
            or ""
        ),

        "physical": [
            physical_format(
                row["format"]
            )
        ],

        "digital": []

    }


# ============================================================
# CREATE TV ENTRY
# ============================================================

def create_tv_entry(row, result):

    title = row["title"]

    tmdb_id = result["id"]

    details = get_tv_details(tmdb_id)

    credits = get_tv_credits(tmdb_id)

    poster = details.get("poster_path")

    genres = [
        genre.get("name")
        for genre in details.get("genres", [])
        if genre.get("name")
    ]

    return {

        "title": title,

        "type": "tv",

        "tmdbId": tmdb_id,

        "poster": (
            IMAGE_BASE + poster
            if poster
            else ""
        ),

        "year": (
            details.get("first_air_date", "")[:4]
            if details.get("first_air_date")
            else ""
        ),

        "runtime": (
            f'{details.get("episode_run_time", [""])[0]}m'
            if details.get("episode_run_time")
            else ""
        ),

        "genre": " / ".join(genres),

        "director": tv_creator(
            details
        ),

        "cast": tv_cast(
            credits
        ),

        "synopsis": (
            details.get("overview")
            or ""
        ),

        "physical": [
            physical_format(
                row["format"]
            )
        ],

        "digital": []

    }


# ============================================================
# PROCESS INVENTORY
# ============================================================

catalog = []
review = []

total = len(rows)

print()
print("Beginning TMDB matching...")
print()


for number, row in enumerate(rows, start=1):

    original_title = row["title"]

    category = classify(
        original_title
    )

    search_title = clean_title(
        original_title
    )

    print(
        f"[{number}/{total}] "
        f"{original_title}"
    )

    try:

        if category == "movie":

            results = search_movie(
                search_title
            )

        elif category == "tv":

            results = search_tv(
                search_title
            )

        else:

            # Misc items aren't automatically
            # forced into TMDB.
            catalog.append({

                "title": original_title,

                "type": "misc",

                "tmdbId": None,

                "poster": "",

                "year": "",

                "runtime": "",

                "genre": "",

                "director": "",

                "cast": "",

                "synopsis": "",

                "physical": [
                    physical_format(
                        row["format"]
                    )
                ],

                "digital": []

            })

            continue


        if not results:

            review.append({

                "title": original_title,

                "category": category,

                "reason": "No TMDB results",

                "results": []

            })

            continue


        scored = []

        for result in results[:10]:

            scored.append({

                "score": score_match(
                    original_title,
                    result
                ),

                "result": result

            })


        scored.sort(
            key=lambda x: x["score"],
            reverse=True
        )


        best = scored[0]

        second_score = (
            scored[1]["score"]
            if len(scored) > 1
            else 0
        )


        # Require a reasonably strong match.
        # Also flag ambiguous matches.

        if best["score"] < 70:

            review.append({

                "title": original_title,

                "category": category,

                "reason": "Weak match",

                "results": [
                    {
                        "score": item["score"],
                        "id": item["result"].get("id"),
                        "title": (
                            item["result"].get("title")
                            or item["result"].get("name")
                        ),
                        "year": (
                            item["result"].get("release_date", "")[:4]
                            or item["result"].get("first_air_date", "")[:4]
                        )
                    }
                    for item in scored[:5]
                ]

            })

            continue


        if (
            best["score"] < 100
            and best["score"] - second_score < 10
        ):

            review.append({

                "title": original_title,

                "category": category,

                "reason": "Potentially ambiguous match",

                "results": [
                    {
                        "score": item["score"],
                        "id": item["result"].get("id"),
                        "title": (
                            item["result"].get("title")
                            or item["result"].get("name")
                        ),
                        "year": (
                            item["result"].get("release_date", "")[:4]
                            or item["result"].get("first_air_date", "")[:4]
                        )
                    }
                    for item in scored[:5]
                ]

            })

            continue


        if category == "movie":

            entry = create_movie_entry(
                row,
                best["result"]
            )

        else:

            entry = create_tv_entry(
                row,
                best["result"]
            )


        catalog.append(entry)


        # Don't hammer the API.
        time.sleep(0.12)


    except Exception as error:

        review.append({

            "title": original_title,

            "category": category,

            "reason": f"Error: {error}",

            "results": []

        })


# ============================================================
# WRITE MOVIES.JS
# ============================================================

print()
print("Writing catalog...")


with open(
    script_folder / OUTPUT_NAME,
    "w",
    encoding="utf-8"
) as file:

    file.write(
        "// Generated by BW's Movie Catalog Importer\n"
    )

    file.write(
        "// Do not edit this file manually unless necessary.\n\n"
    )

    file.write(
        "const movies = "
    )

    json.dump(
        catalog,
        file,
        indent=2,
        ensure_ascii=False
    )

    file.write(";\n")


# ============================================================
# WRITE REVIEW FILE
# ============================================================

with open(
    script_folder / REVIEW_NAME,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        review,
        file,
        indent=2,
        ensure_ascii=False
    )


# ============================================================
# SUMMARY
# ============================================================

movies_count = sum(
    1
    for item in catalog
    if item["type"] == "movie"
)

tv_count = sum(
    1
    for item in catalog
    if item["type"] == "tv"
)

misc_count = sum(
    1
    for item in catalog
    if item["type"] == "misc"
)


print()
print("===========================")
print("IMPORT COMPLETE")
print("===========================")
print()

print(f"Catalog entries created: {len(catalog)}")
print(f"Movies:                  {movies_count}")
print(f"TV:                      {tv_count}")
print(f"Misc:                    {misc_count}")
print(f"Needs review:            {len(review)}")
print()

print("Created:")
print(f"  {OUTPUT_NAME}")
print(f"  {REVIEW_NAME}")
print()

if review:

    print(
        "Some titles were intentionally NOT "
        "automatically matched."
    )

    print(
        "Those are in tmdb_review.json "
        "for us to check."
    )

print()
print("Done.")
