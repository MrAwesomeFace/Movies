```python
#!/usr/bin/env python3

import csv
import json
import re
from pathlib import Path
from difflib import SequenceMatcher


REPO_ROOT = Path(__file__).resolve().parent.parent
MOVIES_JS = REPO_ROOT / "movies.js"
DIGITAL_CSV = REPO_ROOT / "digital_movies_import_queue.csv"
OUTPUT_CSV = REPO_ROOT / "digital_movie_comparison.csv"
REVIEW_CSV = REPO_ROOT / "digital_movie_review.csv"


# ------------------------------------------------------------
# Basic normalization
# ------------------------------------------------------------

def normalize_title(title):
    if not title:
        return ""

    title = title.lower().strip()

    # Normalize common punctuation
    title = title.replace("&", "and")
    title = title.replace("’", "'")
    title = title.replace("–", "-")
    title = title.replace("—", "-")

    # Remove leading "the" only for comparison purposes
    # while retaining the original title everywhere else.
    title = re.sub(r"^the\s+", "", title)

    # Remove punctuation
    title = re.sub(r"[^a-z0-9]+", " ", title)

    return re.sub(r"\s+", " ", title).strip()


def normalize_year(value):
    if not value:
        return None

    match = re.search(r"\b(19\d{2}|20\d{2})\b", str(value))

    if match:
        return int(match.group(1))

    return None


def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()


# ------------------------------------------------------------
# Read movies.js
# ------------------------------------------------------------

def load_movies_js():
    if not MOVIES_JS.exists():
        raise FileNotFoundError(f"Could not find {MOVIES_JS}")

    text = MOVIES_JS.read_text(encoding="utf-8")

    # movies.js is a JS file containing:
    #
    # const movies = [
    #   {...},
    #   {...}
    # ];
    #
    # Convert the JavaScript wrapper into JSON.
    start = text.find("[")

    if start == -1:
        raise ValueError("Could not find the movies array in movies.js")

    end = text.rfind("]")

    if end == -1:
        raise ValueError("Could not find the end of the movies array")

    json_text = text[start:end + 1]

    try:
        return json.loads(json_text)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"movies.js could not be parsed as JSON: {exc}"
        )


# ------------------------------------------------------------
# Read normalized digital list
# ------------------------------------------------------------

def load_digital_movies():
    if not DIGITAL_CSV.exists():
        raise FileNotFoundError(
            f"Could not find {DIGITAL_CSV}"
        )

    with DIGITAL_CSV.open(
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as f:
        reader = csv.DictReader(f)

        if not reader.fieldnames:
            raise ValueError("Digital CSV has no header row.")

        rows = []

        for row in reader:
            cleaned = {
                str(k).strip(): (v or "").strip()
                for k, v in row.items()
            }

            if not cleaned.get("title"):
                continue

            rows.append(cleaned)

        return rows


# ------------------------------------------------------------
# Digital source handling
# ------------------------------------------------------------

def normalize_sources(row):
    """
    Apply the source rules:

    Fandango +/or Movies Anywhere:
        Keep those sources.
        Prime is unnecessary if either exists.

    Prime only:
        Keep Prime.

    Everything else:
        Preserve it so it can be manually reviewed.
    """

    raw = (
        row.get("sources")
        or row.get("source")
        or row.get("digital_source")
        or ""
    )

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

    # If Fandango or Movies Anywhere exists, Prime isn't needed.
    preferred = {
        "Fandango",
        "Movies Anywhere"
    }

    if any(source in preferred for source in sources):
        sources = [
            source
            for source in sources
            if source != "Prime"
        ]

    return sources


# ------------------------------------------------------------
# Deduplicate digital entries
# ------------------------------------------------------------

def deduplicate_digital_movies(rows):
    """
    Combine duplicate digital records.

    Movies that appear multiple times because they come from
    different digital sources become one record with combined
    sources.
    """

    combined = {}

    for row in rows:
        title = row.get("title", "").strip()

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

        combined[key]["sources"].update(sources)

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


# ------------------------------------------------------------
# Match digital movies to existing catalog
# ------------------------------------------------------------

def find_match(digital, catalog):
    digital_title = normalize_title(digital["title"])
    digital_year = digital["year"]

    candidates = []

    for movie in catalog:
        catalog_title = (
            movie.get("tmdbTitle")
            or movie.get("title")
            or ""
        )

        normalized_catalog_title = normalize_title(
            catalog_title
        )

        score = similarity(
            digital_title,
            normalized_catalog_title
        )

        catalog_year = normalize_year(movie.get("year"))

        year_difference = None

        if digital_year and catalog_year:
            year_difference = abs(
                digital_year - catalog_year
            )

        # Exact normalized title is extremely strong.
        if digital_title == normalized_catalog_title:
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

    # Exact title.
    if score >= 0.999:
        if (
            year_difference is None
            or year_difference == 0
        ):
            return movie, "CONFIDENT MATCH", candidates[:3]

        # Same title but different year.
        return movie, "REVIEW", candidates[:3]

    # Very strong title match.
    if score >= 0.92:
        if (
            year_difference is None
            or year_difference <= 1
        ):
            return movie, "CONFIDENT MATCH", candidates[:3]

        return movie, "REVIEW", candidates[:3]

    # Reasonably close title.
    if score >= 0.80:
        if (
            year_difference is None
            or year_difference <= 1
        ):
            return movie, "CLOSE MATCH", candidates[:3]

        return movie, "REVIEW", candidates[:3]

    return None, "NEW", candidates[:3]


# ------------------------------------------------------------
# Write output
# ------------------------------------------------------------

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
                    key: result.get(key, "")
                    for key in review_fields
                })


# ------------------------------------------------------------
# Main
# ------------------------------------------------------------

def main():
    print("Loading movies.js...")
    catalog = load_movies_js()

    print(f"Catalog movies loaded: {len(catalog)}")

    print("Loading digital movie list...")
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
        f"deduplication: {len(digital_movies)}"
    )

    results = []

    for digital in digital_movies:
        match, status, candidates = find_match(
            digital,
            catalog
        )

        if match:
            catalog_title = (
                match.get("title")
                or ""
            )

            catalog_tmdb_title = (
                match.get("tmdbTitle")
                or ""
            )

            catalog_tmdb_id = (
                match.get("tmdbId")
                or ""
            )

            catalog_year = (
                match.get("year")
                or ""
            )

            physical = match.get("physical") or []

            existing_digital = (
                match.get("digital") or []
            )

            score = candidates[0]["score"]

            year_difference = (
                candidates[0]["year_difference"]
            )

            notes = ""

            if status == "CONFIDENT MATCH":
                notes = (
                    "Existing catalog movie matched."
                )

            elif status == "CLOSE MATCH":
                notes = (
                    "Likely match; manual confirmation "
                    "recommended."
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
                "catalog match. Candidate for new item."
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
    print("========================================")
    print("DIGITAL MOVIE COMPARISON COMPLETE")
    print("========================================")
    print(f"Unique digital movies: {len(results)}")

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
    print(f"Full report:   {OUTPUT_CSV}")
    print(f"Review report: {REVIEW_CSV}")


if __name__ == "__main__":
    main()
```
