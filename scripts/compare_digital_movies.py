#!/usr/bin/env python3

import csv
import json
import re
from pathlib import Path
from difflib import SequenceMatcher

REPO_ROOT = Path(file).resolve().parent.parent

MOVIES_JS = REPO_ROOT / "movies.js"
DIGITAL_CSV = REPO_ROOT / "digital_movies_import_queue.csv"

OUTPUT_CSV = REPO_ROOT / "digital_movie_comparison.csv"
REVIEW_CSV = REPO_ROOT / "digital_movie_review.csv"

------------------------------------------------------------
BASIC NORMALIZATION
------------------------------------------------------------

def normalize_title(title):
if title is None:
return ""

title = str(title).lower().strip()

# Normalize common punctuation
title = title.replace("&", "and")
title = title.replace("’", "'")
title = title.replace("–", "-")
title = title.replace("—", "-")

# Remove leading "the" for comparison purposes only.
title = re.sub(r"^the\s+", "", title)

# Remove punctuation
title = re.sub(r"[^a-z0-9]+", " ", title)

# Collapse whitespace
return re.sub(r"\s+", " ", title).strip()

def normalize_year(value):
if value is None:
return None

# Handle lists or other unexpected values safely.
if isinstance(value, list):
    value = " ".join(str(x) for x in value)

value = str(value).strip()

if not value:
    return None

match = re.search(r"\b(19\d{2}|20\d{2})\b", value)

if match:
    return int(match.group(1))

return None

def similarity(a, b):
return SequenceMatcher(None, a, b).ratio()

def safe_string(value):
"""
Convert any CSV value into a usable string.

This prevents errors if a value unexpectedly arrives
as a list, number, None, etc.
"""

if value is None:
    return ""

if isinstance(value, list):
    return " | ".join(str(x).strip() for x in value if x is not None)

if isinstance(value, dict):
    return " | ".join(
        f"{k}: {v}"
        for k, v in value.items()
    )

return str(value).strip()

def safe_list(value):
"""
Convert a movies.js field into a list of strings.
"""

if value is None:
    return []

if isinstance(value, list):
    return [
        str(x).strip()
        for x in value
        if x is not None and str(x).strip()
    ]

if isinstance(value, str):
    value = value.strip()

    if not value:
        return []

    return [value]

return [str(value).strip()]
------------------------------------------------------------
READ MOVIES.JS
------------------------------------------------------------

def load_movies_js():

if not MOVIES_JS.exists():
    raise FileNotFoundError(
        f"Could not find {MOVIES_JS}"
    )

text = MOVIES_JS.read_text(
    encoding="utf-8"
)

# movies.js contains a JavaScript array:
#
# const movies = [
#   {...},
#   {...}
# ];
#
# Extract the array and parse it as JSON.

start = text.find("[")

if start == -1:
    raise ValueError(
        "Could not find the movies array in movies.js"
    )

end = text.rfind("]")

if end == -1:
    raise ValueError(
        "Could not find the end of the movies array"
    )

json_text = text[start:end + 1]

try:
    data = json.loads(json_text)

except json.JSONDecodeError as exc:
    raise ValueError(
        f"movies.js could not be parsed as JSON: {exc}"
    )

if not isinstance(data, list):
    raise ValueError(
        "The movies array in movies.js is not a list."
    )

return data
------------------------------------------------------------
READ NORMALIZED DIGITAL LIST
------------------------------------------------------------

def load_digital_movies():

if not DIGITAL_CSV.exists():
    raise FileNotFoundError(
        f"Could not find {DIGITAL_CSV}"
    )

rows = []

with DIGITAL_CSV.open(
    "r",
    encoding="utf-8-sig",
    newline=""
) as f:

    reader = csv.DictReader(f)

    if not reader.fieldnames:
        raise ValueError(
            "Digital CSV has no header row."
        )

    print(
        "Digital CSV columns:",
        ", ".join(reader.fieldnames)
    )

    for row_number, row in enumerate(
        reader,
        start=2
    ):

        cleaned = {}

        for key, value in row.items():

            if key is None:
                continue

            clean_key = str(key).strip()

            cleaned[clean_key] = safe_string(value)

        title = cleaned.get("title", "").strip()

        if not title:
            continue

        rows.append(cleaned)

return rows
------------------------------------------------------------
DIGITAL SOURCE HANDLING
------------------------------------------------------------

def normalize_sources(row):
"""
Apply source rules.

Fandango and/or Movies Anywhere:
    Keep those sources.
    Prime is unnecessary if either exists.

Prime only:
    Keep Prime.

Everything else:
    Preserve it for manual review.
"""

raw = (
    row.get("sources")
    or row.get("source")
    or row.get("digital_source")
    or ""
)

raw = safe_string(raw)

parts = re.split(
    r"[,;/|]+",
    raw
)

sources = []

for part in parts:

    value = part.strip()

    if not value:
        continue

    lower = value.lower()

    if "fandango" in lower:
        canonical = "Fandango"

    elif "movies anywhere" in lower:
        canonical = "Movies Anywhere"

    elif "prime" in lower or "amazon" in lower:
        canonical = "Prime"

    else:
        canonical = value

    if canonical not in sources:
        sources.append(canonical)

# If Fandango or Movies Anywhere exists,
# Prime does not need to be retained.

preferred = {
    "Fandango",
    "Movies Anywhere"
}

if any(
    source in preferred
    for source in sources
):

    sources = [
        source
        for source in sources
        if source != "Prime"
    ]

return sources
------------------------------------------------------------
DEDUPLICATE DIGITAL ENTRIES
------------------------------------------------------------

def deduplicate_digital_movies(rows):
"""
Combine duplicate digital records.

Multiple records for the same movie/year are merged,
with their digital sources combined.
"""

combined = {}

for row in rows:

    title = safe_string(
        row.get("title")
    ).strip()

    if not title:
        continue

    year = normalize_year(
        row.get("year")
        or row.get("release_year")
    )

    key = (
        normalize_title(title),
        year
    )

    sources = normalize_sources(row)

    if key not in combined:

        combined[key] = {
            "title": title,
            "year": year,
            "sources": set()
        }

    combined[key]["sources"].update(
        sources
    )

result = []

for item in combined.values():

    result.append({
        "title": item["title"],
        "year": item["year"],
        "sources": sorted(
            item["sources"]
        )
    })

return sorted(
    result,
    key=lambda x: normalize_title(
        x["title"]
    )
)
------------------------------------------------------------
FIND BEST MATCH
------------------------------------------------------------

def find_match(digital, catalog):

digital_title = normalize_title(
    digital["title"]
)

digital_year = digital["year"]

candidates = []

for movie in catalog:

    catalog_title = (
        movie.get("tmdbTitle")
        or movie.get("title")
        or ""
    )

    catalog_title = safe_string(
        catalog_title
    )

    normalized_catalog_title = normalize_title(
        catalog_title
    )

    if not normalized_catalog_title:
        continue

    score = similarity(
        digital_title,
        normalized_catalog_title
    )

    catalog_year = normalize_year(
        movie.get("year")
    )

    year_difference = None

    if digital_year and catalog_year:

        year_difference = abs(
            digital_year - catalog_year
        )

    # Exact normalized title is extremely strong.

    if (
        digital_title
        == normalized_catalog_title
    ):
        title_score = 1.0

    else:
        title_score = score

    candidates.append({
        "movie": movie,
        "score": title_score,
        "year_difference": year_difference
    })

candidates.sort(
    key=lambda x: (
        x["score"],
        -(
            x["year_difference"]
            if x["year_difference"] is not None
            else 999
        )
    ),
    reverse=True
)

if not candidates:
    return None, "NEW", []

best = candidates[0]

movie = best["movie"]
score = best["score"]
year_difference = best["year_difference"]

# --------------------------------------------------------
# EXACT TITLE
# --------------------------------------------------------

if score >= 0.999:

    if (
        year_difference is None
        or year_difference == 0
    ):

        return (
            movie,
            "CONFIDENT MATCH",
            candidates[:3]
        )

    # Same title but different year.

    return (
        movie,
        "REVIEW",
        candidates[:3]
    )

# --------------------------------------------------------
# VERY STRONG TITLE MATCH
# --------------------------------------------------------

if score >= 0.92:

    if (
        year_difference is None
        or year_difference <= 1
    ):

        return (
            movie,
            "CONFIDENT MATCH",
            candidates[:3]
        )

    return (
        movie,
        "REVIEW",
        candidates[:3]
    )

# --------------------------------------------------------
# REASONABLY CLOSE TITLE
# --------------------------------------------------------

if score >= 0.80:

    if (
        year_difference is None
        or year_difference <= 1
    ):

        return (
            movie,
            "CLOSE MATCH",
            candidates[:3]
        )

    return (
        movie,
        "REVIEW",
        candidates[:3]
    )

# Nothing sufficiently strong.

return (
    None,
    "NEW",
    candidates[:3]
)
------------------------------------------------------------
WRITE OUTPUT FILES
------------------------------------------------------------

def write_outputs(results):

fields = [
    "digital_title",
    "digital_year",
    "sources",
    "status",
    "catalog_title",
    "catalog_tmdb_title",
    "catalog_tmdb_id",
    "catalog_year",
    "catalog_physical",
    "existing_digital",
    "match_score",
    "year_difference",
    "notes"
]

with OUTPUT_CSV.open(
    "w",
    encoding="utf-8",
    newline=""
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=fields
    )

    writer.writeheader()

    for result in results:
        writer.writerow(result)

review_fields = [
    "digital_title",
    "digital_year",
    "sources",
    "status",
    "catalog_title",
    "catalog_tmdb_id",
    "catalog_year",
    "match_score",
    "year_difference",
    "notes"
]

with REVIEW_CSV.open(
    "w",
    encoding="utf-8",
    newline=""
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=review_fields
    )

    writer.writeheader()

    for result in results:

        if result["status"] in {
            "CLOSE MATCH",
            "REVIEW"
        }:

            writer.writerow({
                key: result.get(
                    key,
                    ""
                )
                for key in review_fields
            })
------------------------------------------------------------
MAIN
------------------------------------------------------------

def main():

print(
    "Loading movies.js..."
)

catalog = load_movies_js()

print(
    f"Catalog movies loaded: "
    f"{len(catalog)}"
)

print(
    "Loading digital movie list..."
)

digital_rows = load_digital_movies()

print(
    f"Digital source rows loaded: "
    f"{len(digital_rows)}"
)

digital_movies = deduplicate_digital_movies(
    digital_rows
)

print(
    f"Unique digital movies after "
    f"deduplication: "
    f"{len(digital_movies)}"
)

results = []

for digital in digital_movies:

    match, status, candidates = find_match(
        digital,
        catalog
    )

    if match:

        catalog_title = safe_string(
            match.get("title")
        )

        catalog_tmdb_title = safe_string(
            match.get("tmdbTitle")
        )

        catalog_tmdb_id = safe_string(
            match.get("tmdbId")
        )

        catalog_year = safe_string(
            match.get("year")
        )

        physical = safe_list(
            match.get("physical")
        )

        existing_digital = safe_list(
            match.get("digital")
        )

        score = candidates[0]["score"]

        year_difference = candidates[0][
            "year_difference"
        ]

        notes = ""

        if status == "CONFIDENT MATCH":

            notes = (
                "Existing catalog movie matched."
            )

        elif status == "CLOSE MATCH":

            notes = (
                "Likely match; manual "
                "confirmation recommended."
            )

        elif status == "REVIEW":

            notes = (
                "Potential title/year conflict; "
                "manual review required."
            )

    else:

        catalog_title = ""
        catalog_tmdb_title = ""
        catalog_tmdb_id = ""
        catalog_year = ""

        physical = []
        existing_digital = []

        score = ""
        year_difference = ""

        notes = (
            "No sufficiently strong existing "
            "catalog match. Candidate for "
            "new item."
        )

    results.append({

        "digital_title":
            digital["title"],

        "digital_year":
            (
                digital["year"]
                if digital["year"] is not None
                else ""
            ),

        "sources":
            " | ".join(
                digital["sources"]
            ),

        "status":
            status,

        "catalog_title":
            catalog_title,

        "catalog_tmdb_title":
            catalog_tmdb_title,

        "catalog_tmdb_id":
            catalog_tmdb_id,

        "catalog_year":
            catalog_year,

        "catalog_physical":
            " | ".join(
                physical
            ),

        "existing_digital":
            " | ".join(
                existing_digital
            ),

        "match_score":
            (
                f"{score:.3f}"
                if isinstance(
                    score,
                    float
                )
                else score
            ),

        "year_difference":
            year_difference,

        "notes":
            notes
    })

write_outputs(results)

counts = {}

for result in results:

    status = result["status"]

    counts[status] = (
        counts.get(status, 0) + 1
    )

print()

print(
    "========================================"
)

print(
    "DIGITAL MOVIE COMPARISON COMPLETE"
)

print(
    "========================================"
)

print(
    f"Unique digital movies: "
    f"{len(results)}"
)

for status in [
    "CONFIDENT MATCH",
    "CLOSE MATCH",
    "REVIEW",
    "NEW"
]:

    print(
        f"{status}: "
        f"{counts.get(status, 0)}"
    )

print()

print(
    f"Full report:   {OUTPUT_CSV}"
)

print(
    f"Review report: {REVIEW_CSV}"
)

if name == "main":
main()
