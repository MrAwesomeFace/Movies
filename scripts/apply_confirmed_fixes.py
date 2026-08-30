#!/usr/bin/env python3
"""
apply_confirmed_fixes.py

Applies confirmed_fixes.json (produced by reviewing review.html) to
movies.js. Does NOT call TMDB — every field value in confirmed_fixes.json
was already pulled and approved during the review step, so this is a
pure, deterministic merge. Run this only after you've reviewed and
downloaded confirmed_fixes.json from review.html.
"""

import json
import os
import re
import sys

MOVIES_JS_PATH = "movies.js"
CONFIRMED_JSON_PATH = "confirmed_fixes.json"


def load_movies(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    start = text.index("[")
    end = text.rindex("]") + 1
    array_text = text[start:end]
    array_text = re.sub(r",(\s*[\}\]])", r"\1", array_text)
    movies = json.loads(array_text)
    prefix = text[:start]
    suffix = text[end:]
    return movies, prefix, suffix


def save_movies(path, movies, prefix, suffix):
    body = json.dumps(movies, indent=2, ensure_ascii=False)
    with open(path, "w", encoding="utf-8") as f:
        f.write(prefix + body + suffix)


def find_match(movies, entry):
    for m in movies:
        if m.get("title") != entry["match_title"]:
            continue
        if m.get("tmdbId") != entry["match_tmdb_id"]:
            continue
        if entry.get("match_season") is not None and m.get("season") != entry["match_season"]:
            continue
        return m
    return None


def main():
    if not os.path.exists(CONFIRMED_JSON_PATH):
        print(f"ERROR: {CONFIRMED_JSON_PATH} not found in repo root.", file=sys.stderr)
        print("Download it from review.html after checking off approved entries, "
              "then add it to the repo before running this workflow.", file=sys.stderr)
        sys.exit(1)

    with open(CONFIRMED_JSON_PATH, encoding="utf-8") as f:
        confirmed = json.load(f)

    movies, prefix, suffix = load_movies(MOVIES_JS_PATH)

    applied, missing = 0, []

    for entry in confirmed:
        movie = find_match(movies, entry)
        if not movie:
            missing.append(entry)
            print(f"SKIP (no match, movies.js may have changed): {entry['match_title']!r}")
            continue
        final = entry["final"]
        for k, v in final.items():
            if v is None:
                continue  # don't inject fields (e.g. "categories") that were never set
            movie[k] = v
        applied += 1
        print(f"OK: {entry['match_title']!r}")

    save_movies(MOVIES_JS_PATH, movies, prefix, suffix)

    print("\n--- Summary ---")
    print(f"Applied: {applied}")
    print(f"No match found: {len(missing)}")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as f:
            f.write("## Confirmed Movie Fixes Applied\n\n")
            f.write(f"- Applied: {applied}\n")
            f.write(f"- No match found: {len(missing)}\n")
            if missing:
                f.write("\n### Unmatched (movies.js may have changed since review)\n")
                for x in missing:
                    f.write(f"- {x['match_title']}\n")


if __name__ == "__main__":
    main()
