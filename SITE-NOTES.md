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
| `tournament-bracket.js` | Tournament extras: the smarter draw, seeding, Bracket view, Face-off mode | `index.html` (after `app.js`) |
| `stats.html` | The stats page (Shelf and Tournament tabs). Self-contained: its own styles and code | Reached by clicking the logo |
| `transform-transition.js` | The Autobot/Decepticon animation between the shelf and stats | `index.html`, `stats.html` |
| `images/autobot.webp`, `images/decepticon.webp` | The insignias for that animation | `transform-transition.js` |
| `classics.html` | Classics watchlist page (self-contained) | — |
| `worker/worker.js` | Backup of the Cloudflare Worker code | Nothing — copy only |
| `reservations.js` | Older reservations code. No page loads it any more | Nothing |
| `.github/workflows/add-movie.yml` | Adds or updates a movie in `movies.js` from a TMDB id | Run from the Actions tab |
| `.github/workflows/resync-metadata.yml` | Fills in missing movie details from TMDB | Run from the Actions tab |

## What depends on what

- **`tournament-bracket.js` uses functions from `app.js`** by name: `getMovieId`,
  `shuffleArray`, `posterForMovieId`, `roundLabel`, `pickRoundListWinner`,
  `renderRoundList`, `trackTournamentMatchupTiming`, `wireTournamentBackLink`,
  `categoryDisplayName`, plus the `movies`, `RESERVATIONS_API`, `tournamentChampions` and
  `tournamentOverlayOpen` values. Renaming any of those in `app.js` breaks the Bracket and
  Face-off views (and the smarter draw).
- **`app.js` uses `tournament-bracket.js` only through safety checks**
  (`drawTournamentField`, `showTournamentRound`). If `tournament-bracket.js` is missing or
  throws an error, brackets still start with a plain random draw and play in the plain list.
- **Server endpoints the newer features need** (all read-only):
  - `/tournament-log` — stats page Tournament tab, and the smarter draw.
  - `/tournaments/:id/matchups` — the Bracket view.
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
| Stats page shows an "Offline" banner | Worker down or unreachable | Check Cloudflare; the collection numbers still show |
| Reservations / watched / wishlist not loading | Worker down, or a bad Worker deploy | Cloudflare → movie-reservations → Deployments → roll back to the previous version |

## Habits that prevent most problems

- Upload **every** file a change touches. A change often spans an HTML file plus a `.js` or
  `.css` file, and sometimes the Worker too.
- When the Worker changes, update **both** Cloudflare and `worker/worker.js` here, so the
  backup stays current.
- After a change goes live, hard refresh before deciding something is broken.
- GitHub keeps every version of every file (open a file → History), and Cloudflare keeps
  every Worker deployment. Nothing is ever really lost.
