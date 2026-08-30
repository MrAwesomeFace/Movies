#!/usr/bin/env python3
"""
build_review.py

READ-ONLY. Pulls proposed metadata from TMDB for every entry in
movie_fixes.json and produces:
  - review_data.json  (raw before/after data, for reference)
  - review.html        (self-contained page to open locally, check off
                         entries, and download confirmed_fixes.json)

Does NOT modify movies.js and does NOT commit anything back to the repo.
Requires TMDB_API_KEY (a TMDB v4 Read Access Token) in the environment.
"""

import difflib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

MOVIES_JS_PATH = "movies.js"
FIXES_JSON_PATH = "movie_fixes.json"
OUT_DATA_PATH = "review_data.json"
OUT_HTML_PATH = "review.html"
TMDB_BASE = "https://api.themoviedb.org/3"

TOKEN = os.environ.get("TMDB_API_KEY")
if not TOKEN:
    print("ERROR: TMDB_API_KEY environment variable is not set.", file=sys.stderr)
    sys.exit(1)


def tmdb_get(path, params=None):
    url = f"{TMDB_BASE}{path}"
    if params:
        qs = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items())
        url = f"{url}?{qs}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("accept", "application/json")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                time.sleep(2)
                continue
            print(f"  TMDB error {e.code} for {url}", file=sys.stderr)
            return None
        except Exception as e:
            if attempt < 2:
                time.sleep(1)
                continue
            print(f"  TMDB request failed for {url}: {e}", file=sys.stderr)
            return None
    return None


def poster_url(path):
    return f"https://image.tmdb.org/t/p/w500{path}" if path else ""


def pull_movie_metadata(tmdb_id):
    data = tmdb_get(f"/movie/{tmdb_id}", {"append_to_response": "credits"})
    if not data:
        return None
    genres = [g["name"] for g in data.get("genres", [])][:3]
    credits = data.get("credits", {}) or {}
    director = next(
        (c["name"] for c in credits.get("crew", []) if c.get("job") == "Director"), ""
    )
    cast = ", ".join(c["name"] for c in credits.get("cast", [])[:6])
    runtime = data.get("runtime")
    return {
        "tmdbTitle": data.get("title", ""),
        "poster": poster_url(data.get("poster_path")),
        "year": (data.get("release_date") or "")[:4],
        "runtime": f"{runtime}m" if runtime else "",
        "genre": " / ".join(genres),
        "director": director,
        "cast": cast,
        "synopsis": data.get("overview", ""),
    }


def pull_tv_metadata(tmdb_id, season=None):
    show = tmdb_get(f"/tv/{tmdb_id}", {"append_to_response": "credits"})
    if not show:
        return None
    genres = [g["name"] for g in show.get("genres", [])][:3]
    credits = show.get("credits", {}) or {}
    created_by = show.get("created_by") or []
    director = created_by[0]["name"] if created_by else ""
    if not director:
        director = next(
            (c["name"] for c in credits.get("crew", []) if c.get("job") == "Director"), ""
        )
    cast = ", ".join(c["name"] for c in credits.get("cast", [])[:6])

    tmdb_title = show.get("name", "")
    poster = poster_url(show.get("poster_path"))
    year = (show.get("first_air_date") or "")[:4]
    synopsis = show.get("overview", "")
    episode_run_times = show.get("episode_run_time") or []
    runtime = f"{episode_run_times[0]}m" if episode_run_times else ""

    if season is not None:
        season_data = tmdb_get(f"/tv/{tmdb_id}/season/{season}")
        if season_data:
            if season_data.get("poster_path"):
                poster = poster_url(season_data["poster_path"])
            if season_data.get("air_date"):
                year = season_data["air_date"][:4]
            if season_data.get("overview"):
                synopsis = season_data["overview"]

    return {
        "tmdbTitle": tmdb_title,
        "poster": poster,
        "year": year,
        "runtime": runtime,
        "genre": " / ".join(genres),
        "director": director,
        "cast": cast,
        "synopsis": synopsis,
    }


def load_movies(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    start = text.index("[")
    end = text.rindex("]") + 1
    array_text = text[start:end]
    array_text = re.sub(r",(\s*[\}\]])", r"\1", array_text)
    return json.loads(array_text)


def find_match(movies, fix):
    for m in movies:
        if m.get("title") != fix["match_title"]:
            continue
        if m.get("tmdbId") != fix["match_tmdb_id"]:
            continue
        if "match_season" in fix and m.get("season") != fix["match_season"]:
            continue
        return m
    return None


def norm(s):
    s = (s or "").lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def title_mismatch(a, b):
    """True if two titles look unrelated (possible bad TMDB ID)."""
    ratio = difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()
    return ratio < 0.4


CATALOG_FIELDS = [
    "title", "tmdbId", "tmdbTitle", "poster", "year",
    "runtime", "genre", "director", "cast", "synopsis", "categories",
]


def main():
    with open(FIXES_JSON_PATH, encoding="utf-8") as f:
        fixes = json.load(f)
    movies = load_movies(MOVIES_JS_PATH)

    review_entries = []

    for fix in fixes:
        movie = find_match(movies, fix)
        entry = {
            "excel_title": fix["excel_title"],
            "match_title": fix["match_title"],
            "match_tmdb_id": fix["match_tmdb_id"],
            "match_season": fix.get("match_season"),
        }

        if not movie:
            entry["error"] = "No matching entry found in movies.js (it may have changed since movie_fixes.json was generated)."
            review_entries.append(entry)
            continue

        current = {k: movie.get(k) for k in CATALOG_FIELDS}
        proposed = dict(current)

        target_tmdb_id = movie["tmdbId"]
        if fix.get("fix_tmdb_id"):
            target_tmdb_id = fix["new_tmdb_id"]
            proposed["tmdbId"] = target_tmdb_id

        warnings = []

        if fix.get("repull_metadata"):
            if movie.get("type") == "tv":
                meta = pull_tv_metadata(target_tmdb_id, movie.get("season"))
            else:
                meta = pull_movie_metadata(target_tmdb_id)
            if meta:
                for k, v in meta.items():
                    proposed[k] = v
                # sanity check: does the pulled title look related to what we expect?
                reference_title = fix["excel_title"]
                if title_mismatch(reference_title, meta.get("tmdbTitle", "")):
                    warnings.append(
                        f"Pulled TMDB title \"{meta.get('tmdbTitle','')}\" looks unrelated "
                        f"to \"{reference_title}\" — double-check tmdbId {target_tmdb_id} before approving."
                    )
            else:
                entry["error"] = f"TMDB pull failed for id {target_tmdb_id}."
            time.sleep(0.2)

        if fix.get("fix_title_the") and fix.get("new_title"):
            proposed["title"] = fix["new_title"]

        if fix.get("add_baseball_tag"):
            cats = list(proposed.get("categories") or [])
            if "baseball" not in cats:
                cats.append("baseball")
            proposed["categories"] = cats

        changes = [
            k for k in CATALOG_FIELDS
            if current.get(k) != proposed.get(k) and proposed.get(k) is not None
        ]

        entry["current"] = current
        entry["proposed"] = proposed
        entry["changes"] = changes
        entry["warnings"] = warnings
        entry["default_checked"] = len(warnings) == 0 and "error" not in entry
        review_entries.append(entry)

    with open(OUT_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(review_entries, f, indent=2, ensure_ascii=False)

    html = render_html(review_entries)
    with open(OUT_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html)

    n_warn = sum(1 for e in review_entries if e.get("warnings"))
    n_err = sum(1 for e in review_entries if e.get("error"))
    print(f"Wrote {OUT_HTML_PATH} and {OUT_DATA_PATH}")
    print(f"{len(review_entries)} entries, {n_warn} flagged with warnings, {n_err} errors")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as f:
            f.write("## Movie Fixes Review\n\n")
            f.write(f"- Total entries: {len(review_entries)}\n")
            f.write(f"- Flagged for extra review: {n_warn}\n")
            f.write(f"- Errors (no TMDB data / no match): {n_err}\n")
            f.write("\nDownload `review.html` from this run's artifacts, open it locally, "
                    "check off what looks right, and download `confirmed_fixes.json`.\n")


def render_html(entries):
    data_json = json.dumps(entries, ensure_ascii=False)
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Movie Fixes Review</title>
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; margin: 0; background: #14161a; color: #e8e8e8; }
  header { position: sticky; top: 0; background: #1c1f24; padding: 14px 20px; border-bottom: 1px solid #333; z-index: 10; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  header h1 { font-size: 16px; margin: 0; flex: 1; }
  button { background: #3b82f6; color: white; border: none; padding: 9px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  button.secondary { background: #333; }
  button:hover { opacity: 0.9; }
  .stat { font-size: 12px; color: #aaa; }
  main { max-width: 980px; margin: 0 auto; padding: 20px; }
  .card { background: #1c1f24; border: 1px solid #2b2f36; border-radius: 10px; margin-bottom: 14px; padding: 14px 16px; }
  .card.warn { border-color: #a16207; background: #24201a; }
  .card.err { border-color: #7f1d1d; background: #241a1a; }
  .card-top { display: flex; align-items: flex-start; gap: 10px; }
  .card-top input[type=checkbox] { width: 18px; height: 18px; margin-top: 3px; }
  .card-title { font-weight: 600; font-size: 15px; }
  .excel-title { color: #888; font-size: 12px; }
  .warn-box { background: #3a2f10; border: 1px solid #a16207; color: #ffd580; padding: 8px 10px; border-radius: 6px; font-size: 12.5px; margin: 8px 0; }
  .err-box { background: #3a1515; border: 1px solid #7f1d1d; color: #ffb3b3; padding: 8px 10px; border-radius: 6px; font-size: 12.5px; margin: 8px 0; }
  table.diff { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12.5px; }
  table.diff td, table.diff th { border-top: 1px solid #2b2f36; padding: 5px 8px; text-align: left; vertical-align: top; }
  table.diff th { color: #888; font-weight: 500; width: 90px; }
  .old { color: #f88; }
  .new { color: #8f8; }
  .nochange { color: #888; }
  .no-changes { color: #666; font-size: 12.5px; font-style: italic; margin-top: 6px; }
  .badge { font-size: 10.5px; padding: 2px 6px; border-radius: 10px; background: #333; color: #ccc; margin-left: 6px; }
  .toolbar { display:flex; gap: 8px; }
  footer { text-align:center; color:#666; font-size:12px; padding: 30px; }
</style>
</head>
<body>
<header>
  <h1>Movie Fixes Review</h1>
  <span class="stat" id="stat"></span>
  <div class="toolbar">
    <button class="secondary" onclick="setAll(true)">Check all</button>
    <button class="secondary" onclick="setAll(false)">Uncheck all</button>
    <button onclick="download()">Download confirmed_fixes.json</button>
  </div>
</header>
<main id="main"></main>
<footer>Generated from movie_fixes.json. Nothing here has been written to movies.js.</footer>
<script>
const DATA = __DATA_JSON__;

const FIELD_LABELS = {
  title: "Title", tmdbId: "TMDB ID", tmdbTitle: "TMDB Title", poster: "Poster",
  year: "Year", runtime: "Runtime", genre: "Genre", director: "Director",
  cast: "Cast", synopsis: "Synopsis", categories: "Categories"
};

function esc(s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function renderCard(entry, idx) {
  const hasErr = !!entry.error;
  const hasWarn = entry.warnings && entry.warnings.length > 0;
  const cls = hasErr ? "card err" : (hasWarn ? "card warn" : "card");
  const checked = entry.default_checked ? "checked" : "";
  const disabled = hasErr ? "disabled" : "";

  let boxes = "";
  if (hasErr) {
    boxes += `<div class="err-box">⚠ ${esc(entry.error)}</div>`;
  }
  if (hasWarn) {
    entry.warnings.forEach(w => boxes += `<div class="warn-box">⚠ ${esc(w)}</div>`);
  }

  let rows = "";
  if (entry.changes && entry.changes.length) {
    entry.changes.forEach(field => {
      const oldVal = entry.current[field];
      const newVal = entry.proposed[field];
      const label = FIELD_LABELS[field] || field;
      if (field === "poster") {
        rows += `<tr><th>${label}</th><td>
          ${oldVal ? `<img src="${esc(oldVal)}" style="height:60px;border-radius:4px;margin-right:8px">` : '<span class="old">(none)</span>'}
          →
          ${newVal ? `<img src="${esc(newVal)}" style="height:60px;border-radius:4px;margin-left:8px">` : '<span class="new">(none)</span>'}
        </td></tr>`;
      } else {
        const oldDisp = Array.isArray(oldVal) ? oldVal.join(", ") : oldVal;
        const newDisp = Array.isArray(newVal) ? newVal.join(", ") : newVal;
        rows += `<tr><th>${label}</th><td><span class="old">${esc(oldDisp) || "(blank)"}</span> → <span class="new">${esc(newDisp) || "(blank)"}</span></td></tr>`;
      }
    });
  }

  const diffTable = rows ? `<table class="diff">${rows}</table>` : `<div class="no-changes">No field changes detected.</div>`;

  return `<div class="${cls}" data-idx="${idx}">
    <div class="card-top">
      <input type="checkbox" ${checked} ${disabled} onchange="onToggle(${idx}, this.checked)">
      <div>
        <div class="card-title">${esc(entry.match_title)}${entry.match_season ? `<span class="badge">Season ${entry.match_season}</span>` : ""}</div>
        <div class="excel-title">from spreadsheet: "${esc(entry.excel_title)}"</div>
      </div>
    </div>
    ${boxes}
    ${diffTable}
  </div>`;
}

const state = DATA.map(e => !!e.default_checked);

function renderAll() {
  document.getElementById("main").innerHTML = DATA.map(renderCard).join("");
  updateStat();
}

function onToggle(idx, val) {
  state[idx] = val;
  updateStat();
}

function setAll(val) {
  DATA.forEach((e, i) => { if (!e.error) state[i] = val; });
  renderAll();
  document.querySelectorAll('input[type=checkbox]').forEach((cb, i) => { if (!DATA[i].error) cb.checked = state[i]; });
}

function updateStat() {
  const n = state.filter(Boolean).length;
  document.getElementById("stat").textContent = `${n} of ${DATA.length} approved`;
}

function download() {
  const confirmed = DATA.filter((e, i) => state[i] && !e.error).map(e => ({
    match_title: e.match_title,
    match_tmdb_id: e.match_tmdb_id,
    match_season: e.match_season,
    final: e.proposed
  }));
  const blob = new Blob([JSON.stringify(confirmed, null, 2)], {type: "application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "confirmed_fixes.json";
  a.click();
}

renderAll();
</script>
</body>
</html>
""".replace("__DATA_JSON__", data_json)


if __name__ == "__main__":
    main()
