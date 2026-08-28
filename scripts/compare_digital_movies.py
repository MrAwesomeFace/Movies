#!/usr/bin/env python3

import csv
import json
import re
from pathlib import Path
from difflib import SequenceMatcher

REPO_ROOT = Path(**file**).resolve().parent.parent
MOVIES_JS = REPO_ROOT / "movies.js"
DIGITAL_CSV = REPO_ROOT / "digital_movies_import_queue.csv"
OUTPUT_CSV = REPO_ROOT / "digital_movie_comparison.csv"
REVIEW_CSV = REPO_ROOT / "digital_movie_review.csv"

def safe_string(value):
if value is None:
return ""
if isinstance(value, list):
return " | ".join(str(x).strip() for x in value if x is not None)
if isinstance(value, dict):
return " | ".join(f"{k}: {v}" for k, v in value.items())
return str(value).strip()

def safe_list(value):
if value is None:
return []
if isinstance(value, list):
return [str(x).strip() for x in value if x is not None and str(x).strip()]
if isinstance(value, str):
value = value.strip()
return [value] if value else []
return [str(value).strip()]

def normalize_title(title):
title = safe_string(title).lower().strip()

```
if not title:
    return ""

title = title.replace("&", "and")
title = title.replace("’", "'")
title = title.replace("–", "-")
title = title.replace("—", "-")

title = re.sub(r"^the\s+", "", title)
title = re.sub(r"[^a-z0-9]+", " ", title)

return re.sub(r"\s+", " ", title).strip()
```

def normalize_year(value):
value = safe_string(value)

```
if not value:
    return None

match = re.search(r"\b(19\d{2}|20\d{2})\b", value)

if match:
    return int(match.group(1))

return None
```

def similarity(a, b):
return SequenceMatcher(None, a, b).ratio()

def load_movies_js():
if not MOVIES_JS.exists():
raise FileNotFoundError(f"Could not find {MOVIES_JS}")

```
text = MOVIES_JS.read_text(encoding="utf-8")

start = text.find("[")
end = text.rfind("]")

if start == -1 or end == -1:
    raise ValueError("Could not find movies array in movies.js")

try:
    data = json.loads(text[start:end + 1])
except json.JSONDecodeError as exc:
    raise ValueError(f"movies.js could not be parsed as JSON: {exc}")

if not isinstance(data, list):
    raise ValueError("movies.js array is not a list")

return data
```

def load_digital_movies():
if not DIGITAL_CSV.exists():
raise FileNotFoundError(f"Could not find {DIGITAL_CSV}")

```
rows = []

with DIGITAL_CSV.open(
    "r",
    encoding="utf-8-sig",
    newline=""
) as f:

    reader = csv.DictReader(f)

    if not reader.fieldnames:
        raise ValueError("Digital CSV has no header row")

    print("Digital CSV columns:")
    print(", ".join(reader.fieldnames))

    for row in reader:
        cleaned = {}

        for key, value in row.items():
            if key is not None:
                cleaned[str(key).strip()] = safe_string(value)

        if cleaned.get("title"):
            rows.append(cleaned)

return rows
```

def normalize_sources(row):
raw = (
row.get("sources")
or row.get("source")
or row.get("digital_source")
or ""
)

```
raw = safe_string(raw)

parts = re.split(r"[,;/|]+", raw)

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

if "Fandango" in sources or "Movies Anywhere" in sources:
    sources = [x for x in sources if x != "Prime"]

return sources
```

def deduplicate_digital_movies(rows):
combined = {}

```
for row in rows:
    title = safe_string(row.get("title"))

    if not title:
        continue

    year = normalize_year(
        row.get("year") or row.get("release_year")
    )

    key = (
        normalize_title(title),
        year
    )

    if key not in combined:
        combined[key] = {
            "title": title,
            "year": year,
            "sources": set()
        }

    combined[key]["sources"].update(
        normalize_sources(row)
    )

result = []

for item in combined.values():
    result.append({
        "title": item["title"],
        "year": item["year"],
        "sources": sorted(item["sources"])
    })

return sorted(
    result,
    key=lambda x: normalize_title(x["title"])
)
```

def find_match(digital, catalog):
digital_title = normalize_title(digital["title"])
digital_year = digital["year"]

```
candidates = []

for movie in catalog:
    catalog_title = safe_string(
        movie.get("tmdbTitle")
        or movie.get("title")
        or ""
    )

    if not catalog_title:
        continue

    normalized_catalog_title = normalize_title(catalog_title)

    score = similarity(
        digital_title,
        normalized_catalog_title
    )

    if digital_title == normalized_catalog_title:
        score = 1.0

    catalog_year = normalize_year(movie.get("year"))

    year_difference = None

    if digital_year and catalog_year:
        year_difference = abs(
            digital_year - catalog_year
        )

    candidates.append({
        "movie": movie,
        "score": score,
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

if score >= 0.999:
    if year_difference is None or year_difference == 0:
        return movie, "CONFIDENT MATCH", candidates[:3]

    return movie, "REVIEW", candidates[:3]

if score >= 0.92:
    if year_difference is None or year_difference <= 1:
        return movie, "CONFIDENT MATCH", candidates[:3]

    return movie, "REVIEW", candidates[:3]

if score >= 0.80:
    if year_difference is None or year_difference <= 1:
        return movie, "CLOSE MATCH", candidates[:3]

    return movie, "REVIEW", candidates[:3]

return None, "NEW", candidates[:3]
```

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

```
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
        if result["status"] in {"CLOSE MATCH", "REVIEW"}:
            writer.writerow({
                key: result.get(key, "")
                for key in review_fields
            })
```

def main():
print("Loading movies.js...")

```
catalog = load_movies_js()

print(f"Catalog movies loaded: {len(catalog)}")

print("Loading digital movie list...")

digital_rows = load_digital_movies()

print(f"Digital source rows loaded: {len(digital_rows)}")

digital_movies = deduplicate_digital_movies(
    digital_rows
)

print(
    f"Unique digital movies after deduplication: "
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
        year_difference = candidates[0]["year_difference"]

        if status == "CONFIDENT MATCH":
            notes = "Existing catalog movie matched."

        elif status == "CLOSE MATCH":
            notes = "Likely match; manual confirmation recommended."

        else:
            notes = "Potential title/year conflict; manual review required."

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
            "No sufficiently strong existing catalog match. "
            "Candidate for new item."
        )

    results.append({
        "digital_title": digital["title"],
        "digital_year": (
            digital["year"]
            if digital["year"] is not None
            else ""
        ),
        "sources": " | ".join(
            digital["sources"]
        ),
        "status": status,
        "catalog_title": catalog_title,
        "catalog_tmdb_title": catalog_tmdb_title,
        "catalog_tmdb_id": catalog_tmdb_id,
        "catalog_year": catalog_year,
        "catalog_physical": " | ".join(
            physical
        ),
        "existing_digital": " | ".join(
            existing_digital
        ),
        "match_score": (
            f"{score:.3f}"
            if isinstance(score, float)
            else score
        ),
        "year_difference": year_difference,
        "notes": notes
    })

write_outputs(results)

counts = {}

for result in results:
    status = result["status"]
    counts[status] = counts.get(status, 0) + 1

print()
print("DIGITAL MOVIE COMPARISON COMPLETE")
print("----------------------------------")
print(f"Unique digital movies: {len(results)}")
print(f"CONFIDENT MATCH: {counts.get('CONFIDENT MATCH', 0)}")
print(f"CLOSE MATCH: {counts.get('CLOSE MATCH', 0)}")
print(f"REVIEW: {counts.get('REVIEW', 0)}")
print(f"NEW: {counts.get('NEW', 0)}")
print()
print(f"Full report: {OUTPUT_CSV}")
print(f"Review report: {REVIEW_CSV}")
```

if **name** == "**main**":
main()
