# Site notes

How Mr. Movies Rewind fits together, and where to look when something breaks.
Read this before editing, and update it when you add a file or a feature.

## The two halves

1. **The website** — this GitHub repo, served by GitHub Pages from the `arcade` branch.
   Upload a file here and it's live a minute or two later.
2. **The server** — a Cloudflare Worker at `https://movie-reservations.iconedge.workers.dev`,
   with a D1 database behind it. It stores everything that changes: reservations, watched
   status, wishlist, streaming info and tournaments. `worker/worker.js` in this repo is a
   **backup copy**. Editing it here does nothing until you paste it into Cloudflare
   (Workers & Pages → movie-reservations → Edit code → Deploy).

Secrets (`TMDB_API_KEY`, `INTERNAL_SYNC_SECRET`) live in Cloudflare's and GitHub's settings,
never in the code.

## Files

| File | What it is | Loaded by |
|---|---|---|
| `index.html` | The shelf (main page) | — |
| `app.js` | Almost everything on the shelf: cards, filters, reservations, wishlist, easter eggs, the tournament | `index.html` |
| `style.css` | All styling for the shelf and tournament | `index.html` |
| `movies.js` | The collection data. Written by the GitHub Actions — avoid hand edits | `index.html`, `stats.html` |
| `tournament-bracket.js` | Tournament extras: the smarter draw, seeding, Bracket view, Face-off mode, and the Owned | Seen toggle | `index.html` (after `app.js`) |
| `seen.js` | Movies watched on Letterboxd that aren't on the shelf. Generated daily by `update-seen.yml` — never edit by hand | Loaded only when the tournament opens, and by `stats.html` for names |
| `stats.html` | The stats page (Shelf and Tournament tabs). Self-contained: its own styles and code | Reached by clicking the logo |
| `transform-transition.js` | The Autobot/Decepticon animation between the shelf and stats | `index.html`, `stats.html` |
| `images/autobot.webp`, `images/decepticon.webp` | The insignias for that animation | `transform-transition.js` |
| `classics.html` | Classics watchlist page (self-contained) | — |
| `worker/worker.js` | Backup of the Cloudflare Worker code | Nothing — copy only |
| `.github/workflows/add-movie.yml` | Adds or updates a movie in `movies.js` from a TMDB id | Run from the Actions tab |
| `.github/workflows/resync-metadata.yml` | Fills in missing movie details from TMDB | Run from the Actions tab |
| `.github/workflows/update-seen.yml` | Daily (10:15 UTC): adds newly watched movies to `seen.js`. Also runs a Letterboxd export import when `data/letterboxd-import.csv` exists | Scheduled, or run from the Actions tab |
| `data/letterboxd-unmatched.md` | Letterboxd films the last import couldn't match to TMDB (only exists when there were some) | Nothing — for you to review |

## Where to change what

| To change... | Edit |
|---|---|
| The shelf: cards, filters, reservations, wishlist, the basic tournament | `index.html`, `app.js`, `style.css` |
| Tournament extras: the draw, seeding, Bracket view, Face-off, seen-list toggle | `tournament-bracket.js` (styles are in `style.css`) |
| Which watched movies count as "seen" | Nothing to edit — log films on Letterboxd; `update-seen.yml` picks them up daily |
| The stats page | `stats.html` |
| The logo animation | `transform-transition.js` |
| Anything stored or fetched from the server | `worker/worker.js`, then paste it into Cloudflare and Deploy |

Reservations live entirely in `app.js` (and the Worker). An old separate `reservations.js`
was never loaded by any page and was deleted on 2026-10-01.

## What depends on what

- **`tournament-bracket.js` uses functions from `app.js`** by name: `getMovieId`,
  `shuffleArray`, `posterForMovieId`, `roundLabel`, `pickRoundListWinner`,
  `renderRoundList`, `trackTournamentMatchupTiming`, `wireTournamentBackLink`,
  `categoryDisplayName`, `findTournamentMovie`, `renderTournamentHub`, plus the `movies`, `RESERVATIONS_API`, `tournamentChampions` and
  `tournamentOverlayOpen` values. Renaming any of those in `app.js` breaks the Bracket and
  Face-off views (and the smarter draw).
- **`app.js` uses `tournament-bracket.js` only through safety checks**
  (`drawTournamentField`, `showTournamentRound`, and `typeof` checks before
  `extraTournamentMovies`, `loadSeenMovies`, `findSeenMovie` and the toggle/switch helpers). If
  `tournament-bracket.js` is missing or throws an error, brackets still start from the shelf with a
  plain random draw and play in the plain list.
- **The Seen pool** comes from `seen.js`, which `update-seen.yml` builds from the
  Worker's watched list (kept current by the Worker's daily 9:00 UTC Letterboxd RSS sync). The RSS
  feed only includes films you *log*; films only marked seen with the eye icon need an export
  import (below). If `seen.js` is missing or empty, the toggle says so and brackets use the shelf.
- **Seen brackets never move a belt.** They're stored as `seen:<category>` (for example
  `seen:comedy`), so they never touch the Owned belts; the site shows plain names everywhere. The
  Worker skips belts and lifetime belt counts for them, `app.js` leaves their winners out of the
  shelf/hub crowns, and the stats page has an Owned | Seen switch on its Tournament tab.
- **Seen movies carry the same details as owned ones** (from TMDB), except hand-picked tags: a
  seen movie counts as Rom-Com when TMDB lists both Romance and Comedy, and there's no Seen
  Christmas bracket because TMDB has no Christmas/holiday genre to match the hand-picked tag.
- **Server endpoints the newer features need** (all read-only):
  - `/tournament-log` — stats page Tournament tab, and the smarter draw.
  - `/tournaments/:id/matchups` — the Bracket view, and the stats page's bracket viewer
    (tap a Belt holders poster to see the latest finished bracket in that category as a read-only
    tree). That tree is a copy of the shelf's Bracket view drawing, kept inside `stats.html`, so a
    restyle of the shelf's bracket won't carry over by itself.
  - `/watched`, `/tournaments/current` — stats page.
- **The logo link** in `index.html` is a plain link to `stats.html`; the animation is
  added on top. If the animation script fails, the link still works.

## If something breaks, check first

| Symptom | Most likely cause | Fix |
|---|---|---|
| Whole shelf blank or stuck on "Loading collection..." | A broken edit to `app.js` or `movies.js` | Open the file's History on GitHub and restore the last good version |
| Logo click skips the animation | Old files cached, or `transform-transition.js` / the images not uploaded | Hard refresh (Ctrl+Shift+R); check the files exist |
| Tournament has no List / Bracket / Face-off switch | `tournament-bracket.js` missing or failing | Re-upload it; tournaments still work without it |
| Bracket view says it can't load | Worker missing `/tournaments/:id/matchups` | Paste `worker/worker.js` into Cloudflare and Deploy |
| Stats Tournament tab says it's waiting on the server | Worker missing `/tournament-log` | Same as above |
| Tournament toggle says the seen list hasn't loaded | `seen.js` missing or empty | Actions tab → **Update Seen Movies** → Run workflow |
| A film you watched isn't in the Seen pool | It was only eye-marked on Letterboxd, or was logged today | Wait for tomorrow's run, or do a Letterboxd re-import (above) |
| Stats page shows an "Offline" banner | Worker down or unreachable | Check Cloudflare; the collection numbers still show |
| Reservations / watched / wishlist not loading | Worker down, or a bad Worker deploy | Cloudflare → movie-reservations → Deployments → roll back to the previous version |

## Re-importing from Letterboxd

To catch films you only marked seen (eye icon) since the last import:

1. On Letterboxd: Settings → Import & Export → Export your data, and unzip it.
2. Keep only the `Date`, `Name` and `Year` columns of `watched.csv` and save it as
   `data/letterboxd-import.csv` in this repo (the raw export has ratings and tags that don't
   need to be public).
3. Actions tab → **Update Seen Movies** → Run workflow. It marks everything watched, updates
   `seen.js`, lists anything it couldn't match in `data/letterboxd-unmatched.md`, and deletes the
   import file.

Note: GitHub pauses scheduled workflows in a repo with no activity for 60 days. Regular movie
adds keep it active; if the daily update ever stops, re-enable it from the Actions tab.

## Habits that prevent most problems

- Upload **every** file a change touches. A change often spans an HTML file plus a `.js` or
  `.css` file, and sometimes the Worker too.
- When the Worker changes, update **both** Cloudflare and `worker/worker.js` here, so the
  backup stays current.
- After a change goes live, hard refresh before deciding something is broken.
- GitHub keeps every version of every file (open a file → History), and Cloudflare keeps
  every Worker deployment. Nothing is ever really lost.
