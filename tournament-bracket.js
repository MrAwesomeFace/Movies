/*
=========================================================
BW'S MOVIE COLLECTION
Tournament draw, seeding, bracket view and face-off mode
=========================================================

Loaded after app.js and uses its globals (movies, RESERVATIONS_API,
getMovieId, shuffleArray, posterForMovieId, roundLabel,
pickRoundListWinner, renderRoundList, trackTournamentMatchupTiming,
wireTournamentBackLink, categoryDisplayName, tournamentChampions,
tournamentOverlayOpen) - see SITE-NOTES.md. app.js only calls into
this file through safety checks, so tournaments still work if this
file is missing or throws.

THE DRAW
Every new bracket is built from four groups, each drawn at random:
  - Contenders: random picks from the top-rated third of the pool
    (the reigning champion is always in).
  - Fresh faces: movies that have played the fewest brackets.
  - Bad luck: losing records whose losses came against strong
    opponents.
  - Open draw: anyone left, so nobody is ever locked out.
Ratings come from replaying every pick in /tournament-log. If that
can't be loaded, the draw falls back to plain random.

SEEDING
Only the top few entrants by rating get protected slots (2, 4 or 8
depending on bracket size) so the best can't meet early; everyone
else is placed at random. Seed positions are fixed by bracket size,
so any device can tell who the seeds are from the bracket itself.
*/


// Brackets started before the new draw went live were fully random,
// so they have no seeds to show.
const SEEDED_DRAW_SINCE =
  "2026-10-01T14:15:00Z";

// Section order for seeds: seed 1 and 2 land in opposite halves,
// 3 and 4 in the other quarters, 5-8 in the remaining eighths.
const SEED_SECTION_ORDER = {
  2: [1, 2],
  4: [1, 4, 3, 2],
  8: [1, 8, 4, 5, 3, 6, 2, 7],
};

const TOURNAMENT_VIEW_KEY =
  "mrMoviesTournamentView";


// =========================================================
// RATINGS AND RECORDS FROM THE PICK LOG
// =========================================================

let tournamentLogPromise =
  null;

function loadTournamentLog(force) {

  if (!tournamentLogPromise || force) {

    tournamentLogPromise =
      fetch(
        `${RESERVATIONS_API}/tournament-log`,
        { cache: "no-store" }
      )
        .then(
          response => {
            if (!response.ok) {
              throw new Error(`Server returned ${response.status}`);
            }
            return response.json();
          }
        )
        .then(summarizeTournamentLog)
        .catch(
          error => {
            console.error("Could not load tournament log:", error);
            tournamentLogPromise = null;
            return null;
          }
        );

  }

  return tournamentLogPromise;

}

/*
 * Replays every pick in order (Elo, K = 32, everyone starts at
 * 1500) - the same rating the stats page shows - and collects each
 * movie's record, how many brackets it has played, and the ratings
 * of the movies it lost to.
 */
function summarizeTournamentLog(log) {

  const picks =
    (log.picks || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.decided_at) - new Date(b.decided_at)
      );

  const rating = new Map();
  const record = new Map();

  const ratingOf =
    id => rating.has(id) ? rating.get(id) : 1500;

  const recordOf =
    id => {
      if (!record.has(id)) {
        record.set(id, { w: 0, l: 0, brackets: new Set(), lostTo: [] });
      }
      return record.get(id);
    };

  picks.forEach(
    pick => {

      const a = String(pick.a);
      const b = String(pick.b);
      const winner = String(pick.winner);
      const loser = winner === a ? b : a;

      const ra = ratingOf(a);
      const rb = ratingOf(b);
      const expectedA = 1 / (1 + Math.pow(10, (rb - ra) / 400));
      const aWon = winner === a;

      rating.set(a, ra + 32 * ((aWon ? 1 : 0) - expectedA));
      rating.set(b, rb + 32 * ((aWon ? 0 : 1) - (1 - expectedA)));

      const w = recordOf(winner);
      const l = recordOf(loser);

      w.w++;
      l.l++;
      w.brackets.add(pick.tournament_id);
      l.brackets.add(pick.tournament_id);
      l.lostTo.push(winner);

    }
  );

  return { rating, record, ratingOf };

}


// =========================================================
// THE DRAW
// =========================================================

function seedCountFor(size) {

  if (size >= 64) {
    return 8;
  }

  if (size >= 8) {
    return 4;
  }

  return size >= 4 ? 2 : 0;

}

/*
 * Returns `size` movies from `pool` in bracket order: round-1
 * matchups pair positions 0-1, 2-3, and so on.
 */
async function buildTournamentField(category, pool, size) {

  const summary =
    await loadTournamentLog(true);

  if (!summary) {
    return shuffleArray(pool).slice(0, size);
  }

  const idOf =
    movie => String(getMovieId(movie));

  const chosen =
    new Set();

  const field =
    [];

  const take =
    (movies, count) => {
      for (const movie of movies) {
        if (field.length >= size || count <= 0) {
          break;
        }
        if (!chosen.has(movie)) {
          chosen.add(movie);
          field.push(movie);
          count--;
        }
      }
    };

  const quota =
    Math.max(1, Math.floor(size / 4));

  // Reigning champion of this bracket is always in.
  const champEntry =
    tournamentChampions.find(
      entry => entry.category === category
    );

  if (champEntry) {
    take(
      pool.filter(movie => idOf(movie) === String(champEntry.movie_id)),
      1
    );
  }

  // Contenders: random picks from the top-rated third of the movies
  // that have played, so the best show up without it being the same
  // handful every time.
  const played =
    pool.filter(movie => summary.record.has(idOf(movie)));

  const byRating =
    played
      .slice()
      .sort(
        (a, b) =>
          summary.ratingOf(idOf(b)) - summary.ratingOf(idOf(a))
      );

  take(
    shuffleArray(
      byRating.slice(0, Math.max(quota * 2, Math.ceil(byRating.length / 3)))
    ),
    quota - field.length
  );

  // Fresh faces: fewest brackets played (never played first).
  const appearances =
    movie => {
      const rec = summary.record.get(idOf(movie));
      return rec ? rec.brackets.size : 0;
    };

  take(
    shuffleArray(pool)
      .sort((a, b) => appearances(a) - appearances(b)),
    quota
  );

  // Bad luck: losing records where the movies they lost to were,
  // on average, better than a typical movie.
  const unlucky =
    pool
      .map(
        movie => {
          const rec = summary.record.get(idOf(movie));
          if (!rec || rec.l === 0 || rec.l <= rec.w) {
            return null;
          }
          const toughness =
            rec.lostTo.reduce(
              (sum, id) => sum + summary.ratingOf(id),
              0
            ) / rec.lostTo.length;
          return toughness > 1510 ? { movie, toughness } : null;
        }
      )
      .filter(Boolean)
      .sort((a, b) => b.toughness - a.toughness)
      .slice(0, quota * 2)
      .map(entry => entry.movie);

  take(
    shuffleArray(unlucky),
    quota
  );

  // Open draw fills whatever is left - and covers any group that
  // ran short.
  take(
    shuffleArray(pool),
    size - field.length
  );

  return seedField(
    field,
    movie => summary.ratingOf(idOf(movie))
  );

}

/*
 * Top entrants by rating take the first position of their section;
 * everyone else fills the remaining positions at random.
 */
function seedField(field, ratingOf) {

  const size =
    field.length;

  const seedCount =
    seedCountFor(size);

  if (!seedCount) {
    return shuffleArray(field);
  }

  const ranked =
    field
      .map(movie => ({ movie, rating: ratingOf(movie) + Math.random() * 0.01 }))
      .sort((a, b) => b.rating - a.rating)
      .map(entry => entry.movie);

  const sectionSize =
    size / seedCount;

  const positions =
    new Array(size).fill(null);

  SEED_SECTION_ORDER[seedCount].forEach(
    (seed, section) => {
      positions[section * sectionSize] = ranked[seed - 1];
    }
  );

  const rest =
    shuffleArray(ranked.slice(seedCount));

  for (let i = 0; i < size; i++) {
    if (!positions[i]) {
      positions[i] = rest.pop();
    }
  }

  return positions;

}

/*
 * Seed number of the entrant at a round-1 position, or null. Only
 * meaningful for brackets built by the seeded draw.
 */
function seedAtPosition(position, size) {

  const seedCount =
    seedCountFor(size);

  if (!seedCount) {
    return null;
  }

  const sectionSize =
    size / seedCount;

  return position % sectionSize === 0
    ? SEED_SECTION_ORDER[seedCount][position / sectionSize]
    : null;

}


// =========================================================
// VIEW SWITCHER (LIST / BRACKET / FACE-OFF)
// =========================================================

function getTournamentView() {

  try {
    const saved = localStorage.getItem(TOURNAMENT_VIEW_KEY);
    if (["list", "bracket", "faceoff"].includes(saved)) {
      return saved;
    }
  } catch (error) {}

  return "list";

}

function setTournamentView(view) {

  try {
    localStorage.setItem(TOURNAMENT_VIEW_KEY, view);
  } catch (error) {}

}

function tournamentViewSwitcherHTML() {

  const current =
    getTournamentView();

  const button =
    (view, label) =>
      `<button type="button" class="tv-switch-button${current === view ? " active" : ""}" data-tv-view="${view}" aria-pressed="${current === view}">${label}</button>`;

  return `<div class="tv-switch" role="group" aria-label="Tournament view">` +
    button("list", "List") +
    button("bracket", "Bracket") +
    button("faceoff", "Face-off") +
    `</div>`;

}

function wireTournamentViewSwitcher(current) {

  document
    .querySelectorAll("#tournament-content [data-tv-view]")
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            setTournamentView(button.dataset.tvView);
            renderTournamentRound(current);
          }
        );
      }
    );

}

/*
 * Single entry point for showing an in-progress bracket - app.js
 * calls this wherever it used to call renderRoundList directly.
 */
function renderTournamentRound(current) {

  if (!current || !current.tournament) {
    renderRoundList(current);
    return;
  }

  const view =
    getTournamentView();

  if (view === "bracket") {
    renderTournamentBracket(current);
  } else if (view === "faceoff") {
    renderTournamentFaceoff(current);
  } else {
    renderRoundList(current);
  }

}

function tournamentHeaderHTML(current, extraClass) {

  const tournament =
    current.tournament;

  const matchups =
    current.matchups || [];

  const label =
    current.round !== null && current.round !== undefined
      ? roundLabel(current.round, tournament.total_rounds)
      : "";

  return `<div class="tv-head ${extraClass || ""}">` +
    `<button type="button" class="tournament-back-link" id="tournament-back-to-hub">&larr; Back</button>` +
    `<h2 class="tournament-heading">${categoryDisplayName(tournament.category)}</h2>` +
    (label
      ? `<div class="tournament-round-label">${label}</div>` +
        `<div class="tournament-round-progress">${matchups.length} matchup${matchups.length === 1 ? "" : "s"} to decide</div>`
      : "") +
    tournamentViewSwitcherHTML() +
    `</div>`;

}

function escapeTournamentText(text) {

  return String(text === null || text === undefined ? "" : text)
    .replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

}

function displayTitle(title) {

  return String(title || "").replace(/^(.*), (The|A|An)$/, "$2 $1");

}


// =========================================================
// BRACKET VIEW
// =========================================================

let bracketViewSection =
  null;

async function renderTournamentBracket(current) {

  const content =
    document.getElementById("tournament-content");

  if (!content) {
    return;
  }

  const tournament =
    current.tournament;

  trackTournamentMatchupTiming(current);

  content.innerHTML =
    tournamentHeaderHTML(current, "tv-wide") +
    `<p class="tournament-subtext">Loading bracket...</p>`;

  wireTournamentBackLink();
  wireTournamentViewSwitcher(current);

  let data =
    null;

  try {
    const response =
      await fetch(
        `${RESERVATIONS_API}/tournaments/${tournament.id}/matchups`,
        { cache: "no-store" }
      );
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    data = await response.json();
  } catch (error) {
    console.error("Could not load bracket:", error);
  }

  if (!data) {
    content.innerHTML =
      tournamentHeaderHTML(current, "tv-wide") +
      `<p class="tournament-subtext">The bracket couldn't be loaded. The List view still works.</p>`;
    wireTournamentBackLink();
    wireTournamentViewSwitcher(current);
    return;
  }

  const model =
    buildBracketModel(tournament, data.matchups || [], current);

  const sections =
    model.quarters
      ? ["q0", "q1", "q2", "q3", "ff"]
      : ["all"];

  if (!sections.includes(bracketViewSection)) {
    bracketViewSection =
      sections.find(section => model.sectionHasLive(section)) || sections[0];
  }

  let html =
    tournamentHeaderHTML(current, "tv-wide");

  if (model.quarters) {
    html += `<div class="tv-chips">`;
    sections.forEach(
      section => {
        const todo = model.sectionLiveCount(section);
        const small =
          section === "ff"
            ? "Last four"
            : `Quarter ${+section.slice(1) + 1} · top seed`;
        const name =
          section === "ff"
            ? "Final Four"
            : model.quarterName(+section.slice(1));
        html +=
          `<button type="button" class="tv-chip${bracketViewSection === section ? " active" : ""}" data-section="${section}" aria-pressed="${bracketViewSection === section}">` +
          `<small>${small}</small><span>${escapeTournamentText(name)}</span>` +
          (todo ? `<em>${todo} to pick</em>` : "") +
          `</button>`;
      }
    );
    html += `</div>`;
  }

  html +=
    (current.round === 0
      ? `<p class="tournament-subtext">Play-in round: pick these in the List or Face-off view, then the bracket fills in.</p>`
      : "") +
    `<div class="tv-tree-scroll" id="tv-tree-scroll"><div class="tv-tree">` +
    model.renderSection(bracketViewSection) +
    `</div></div>` +
    `<p class="tv-hint">Tap a movie in a gold-outlined matchup to pick it. On a phone, swipe sideways between rounds.</p>`;

  content.innerHTML =
    html;

  wireTournamentBackLink();
  wireTournamentViewSwitcher(current);

  content
    .querySelectorAll("[data-section]")
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            bracketViewSection = button.dataset.section;
            renderTournamentBracket(current);
          }
        );
      }
    );

  content
    .querySelectorAll(".tv-entrant.pick")
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            content
              .querySelectorAll(".tv-entrant.pick")
              .forEach(el => { el.disabled = true; });
            pickRoundListWinner(
              tournament,
              button.dataset.matchup,
              button.dataset.winner
            );
          }
        );
      }
    );

  // Open on the round being played.
  const scroller =
    document.getElementById("tv-tree-scroll");

  const now =
    content.querySelector(".tv-col h3.now");

  if (scroller && now) {
    scroller.scrollLeft =
      Math.max(0, now.parentElement.offsetLeft - 12);
  }

}

/*
 * Turns the server's matchup rows into a full bracket, filling
 * rounds that haven't been created yet from earlier winners.
 */
function buildBracketModel(tournament, rows, current) {

  const totalRounds =
    tournament.total_rounds;

  const size =
    Math.pow(2, totalRounds);

  const seeded =
    tournament.started_at &&
    new Date(tournament.started_at) >= new Date(SEEDED_DRAW_SINCE);

  const liveIds =
    new Set(
      (current.matchups || []).map(matchup => String(matchup.id))
    );

  const byRound =
    [];

  let thirdPlace =
    null;

  rows.forEach(
    row => {
      if (row.round === 0) {
        return;
      }
      if (row.is_third_place_match) {
        thirdPlace = row;
        return;
      }
      if (!byRound[row.round]) {
        byRound[row.round] = [];
      }
      byRound[row.round][row.slot] = row;
    }
  );

  const entrantOf =
    (id, title) =>
      id
        ? { id: String(id), title: title || "" }
        : null;

  // Seeds by movie id, from their round-1 position.
  const seedById =
    new Map();

  if (seeded && byRound[1]) {
    byRound[1].forEach(
      (row, slot) => {
        if (!row) {
          return;
        }
        [["a", 0], ["b", 1]].forEach(
          ([side, offset]) => {
            const seed = seedAtPosition(slot * 2 + offset, size);
            const id = row[`movie_id_${side}`];
            if (seed && id) {
              seedById.set(String(id), seed);
            }
          }
        );
      }
    );
  }

  function matchAt(round, slot) {

    const row =
      byRound[round] && byRound[round][slot];

    if (row) {
      return {
        id: row.id,
        a: entrantOf(row.movie_id_a, row.movie_title_a),
        b: entrantOf(row.movie_id_b, row.movie_title_b),
        winner: row.winner_movie_id ? String(row.winner_movie_id) : null,
        live: liveIds.has(String(row.id)),
      };
    }

    // Not created yet - fill from the two feeder matchups' winners.
    const feed =
      feederSlot => {
        if (round <= 1) {
          return null;
        }
        const feeder = matchAt(round - 1, feederSlot);
        if (!feeder.winner) {
          return null;
        }
        return feeder.a && feeder.a.id === feeder.winner ? feeder.a : feeder.b;
      };

    return {
      id: null,
      a: feed(slot * 2),
      b: feed(slot * 2 + 1),
      winner: null,
      live: false,
    };

  }

  function winnerOf(round, slot) {
    const match = matchAt(round, slot);
    if (!match.winner) {
      return null;
    }
    return match.a && match.a.id === match.winner ? match.a : match.b;
  }

  function entrantHTML(match, side) {

    const entrant =
      match[side];

    if (!entrant) {
      return `<span class="tv-entrant tbd"><span class="t">TBD</span></span>`;
    }

    const state =
      match.winner
        ? (match.winner === entrant.id ? "won" : "lost")
        : (match.live ? "pick" : "");

    const seed =
      seedById.get(entrant.id);

    const title =
      displayTitle(entrant.title);

    return `<button type="button" class="tv-entrant ${state}"` +
      (state === "pick" ? ` data-matchup="${match.id}" data-winner="${escapeTournamentText(entrant.id)}"` : " disabled") +
      ` title="${escapeTournamentText(title)}">` +
      (seed ? `<span class="seed">${seed}</span>` : "") +
      `<span class="t">${escapeTournamentText(title)}</span></button>`;

  }

  function matchHTML(match) {
    return `<div class="tv-match${match.live ? " live" : ""}">` +
      entrantHTML(match, "a") +
      entrantHTML(match, "b") +
      `</div>`;
  }

  // A matchup in tree column c spans 2^(c+1) grid rows, centered
  // between its two feeders; connectors are sized from that span.
  function columnHTML(round, firstSlot, count, column, isLast) {

    const span =
      2 << column;

    const isNow =
      current.round === round;

    let cells =
      "";

    for (let k = 0; k < count; k++) {
      cells +=
        `<div class="tv-cell${column > 0 ? " fed" : ""}${isLast ? "" : " has-next"}" style="grid-row: span ${span}; --span: calc(var(--tv-unit) * ${span})">` +
        matchHTML(matchAt(round, firstSlot + k)) +
        `</div>`;
    }

    return `<div class="tv-col"><h3${isNow ? ' class="now"' : ""}>${roundLabel(round, totalRounds)}</h3><div class="tv-slots">${cells}</div></div>`;

  }

  function endColumnHTML(label, entrant, span) {
    return `<div class="tv-col"><h3>${label}</h3><div class="tv-slots">` +
      `<div class="tv-cell" style="grid-row: span ${span}">` +
      `<div class="tv-end"><small>${label}</small><strong>${entrant ? escapeTournamentText(displayTitle(entrant.title)) : "TBD"}</strong></div>` +
      `</div></div></div>`;
  }

  const quarters =
    totalRounds >= 5;

  // Rounds shown inside a quarter: everything up to the Great Eight.
  const quarterRounds =
    totalRounds - 2;

  function renderSection(section) {

    let html =
      "";

    if (section === "ff") {
      html += columnHTML(totalRounds - 1, 0, 2, 0, false);
      html += columnHTML(totalRounds, 0, 1, 1, true);
      html += endColumnHTML("Champion", winnerOf(totalRounds, 0), 4);
      return html + thirdPlaceHTML();
    }

    if (section === "all") {
      for (let round = 1; round <= totalRounds; round++) {
        html += columnHTML(round, 0, size >> round, round - 1, round === totalRounds);
      }
      html += endColumnHTML("Champion", winnerOf(totalRounds, 0), 2 << (totalRounds - 1));
      return html + thirdPlaceHTML();
    }

    const quarter =
      +section.slice(1);

    for (let round = 1; round <= quarterRounds; round++) {
      const perQuarter = (size >> round) / 4;
      html += columnHTML(round, quarter * perQuarter, perQuarter, round - 1, round === quarterRounds);
    }

    html += endColumnHTML("To the Final Four", winnerOf(quarterRounds, quarter), 2 << (quarterRounds - 1));

    return html;

  }

  function thirdPlaceHTML() {
    if (!thirdPlace) {
      return "";
    }
    const match = {
      id: thirdPlace.id,
      a: entrantOf(thirdPlace.movie_id_a, thirdPlace.movie_title_a),
      b: entrantOf(thirdPlace.movie_id_b, thirdPlace.movie_title_b),
      winner: thirdPlace.winner_movie_id ? String(thirdPlace.winner_movie_id) : null,
      live: liveIds.has(String(thirdPlace.id)),
    };
    return `<div class="tv-col tv-third"><h3>3rd place</h3>${matchHTML(match)}</div>`;
  }

  function sectionLiveCount(section) {

    if (section === "all") {
      return liveIds.size;
    }

    let count =
      0;

    if (section === "ff") {
      [[totalRounds - 1, 0, 2], [totalRounds, 0, 1]].forEach(
        ([round, first, n]) => {
          for (let k = 0; k < n; k++) {
            if (matchAt(round, first + k).live) {
              count++;
            }
          }
        }
      );
      if (thirdPlace && liveIds.has(String(thirdPlace.id))) {
        count++;
      }
      return count;
    }

    const quarter =
      +section.slice(1);

    for (let round = 1; round <= quarterRounds; round++) {
      const perQuarter = (size >> round) / 4;
      for (let k = 0; k < perQuarter; k++) {
        if (matchAt(round, quarter * perQuarter + k).live) {
          count++;
        }
      }
    }

    return count;

  }

  function quarterName(quarter) {

    const sectionStart =
      quarter * (size / 4);

    const row =
      byRound[1] && byRound[1][sectionStart / 2];

    if (seeded && row && row.movie_title_a) {
      return displayTitle(row.movie_title_a);
    }

    return `Quarter ${quarter + 1}`;

  }

  return {
    quarters,
    renderSection,
    sectionHasLive: section => sectionLiveCount(section) > 0,
    sectionLiveCount,
    quarterName,
  };

}


// =========================================================
// FACE-OFF MODE
// =========================================================

let faceoffLastRound =
  null;

let faceoffBusy =
  false;

function renderTournamentFaceoff(current) {

  const content =
    document.getElementById("tournament-content");

  if (!content) {
    return;
  }

  const tournament =
    current.tournament;

  const matchups =
    current.matchups || [];

  trackTournamentMatchupTiming(current);

  // A round just finished: show a short break before the next one.
  if (
    faceoffLastRound !== null &&
    faceoffLastRound.id === tournament.id &&
    faceoffLastRound.round !== current.round &&
    matchups.length > 0
  ) {
    const finished =
      roundLabel(faceoffLastRound.round, tournament.total_rounds);
    const next =
      roundLabel(current.round, tournament.total_rounds);
    faceoffLastRound =
      { id: tournament.id, round: current.round };
    content.innerHTML =
      tournamentHeaderHTML(current) +
      `<div class="fo-break"><strong>${finished} done</strong>` +
      `<span>${matchups.length} matchup${matchups.length === 1 ? "" : "s"} in the ${next}.</span>` +
      `<button type="button" class="fo-start" id="fo-start">Start the ${next}</button></div>`;
    wireTournamentBackLink();
    wireTournamentViewSwitcher(current);
    document.getElementById("fo-start")
      .addEventListener("click", () => renderTournamentFaceoff(current));
    return;
  }

  faceoffLastRound =
    { id: tournament.id, round: current.round };

  if (matchups.length === 0) {
    renderRoundList(current);
    return;
  }

  const matchup =
    matchups[0];

  // Round size for the progress bar: matchups in this round overall.
  const roundSize =
    current.round === 0
      ? matchups.length
      : Math.max(matchups.length, Math.pow(2, tournament.total_rounds - current.round));

  const done =
    Math.max(0, roundSize - matchups.length);

  const card =
    side => {
      const id = matchup[`movie_id_${side}`];
      const title = displayTitle(matchup[`movie_title_${side}`]);
      const movie = movies.find(m => String(getMovieId(m)) === String(id));
      const meta =
        movie
          ? [movie.year, movie.runtime, (movie.genre || "").split(" / ")[0]].filter(Boolean).join(" · ")
          : "";
      return `<button type="button" class="fo-card" data-side="${side}" aria-label="Pick ${escapeTournamentText(title)}">` +
        `<span class="fo-poster" style="background-image:url('${posterForMovieId(id)}')"><span class="fo-title">${escapeTournamentText(title)}</span></span>` +
        `<span class="fo-meta">${escapeTournamentText(meta)}</span>` +
        `</button>`;
    };

  content.innerHTML =
    tournamentHeaderHTML(current) +
    (matchup.is_third_place_match ? `<div class="fo-note">3rd place match</div>` : "") +
    `<div class="fo-progress"><span>Matchup ${done + 1} of ${roundSize}</span>` +
    `<div class="fo-bar"><i style="width:${(done / roundSize) * 100}%"></i></div></div>` +
    `<div class="fo-stage">${card("a")}<span class="fo-vs">VS</span>${card("b")}</div>` +
    `<p class="tv-hint">Tap a poster, or press &larr; / &rarr;.</p>`;

  wireTournamentBackLink();
  wireTournamentViewSwitcher(current);

  faceoffBusy =
    false;

  const choose =
    side => {
      if (faceoffBusy) {
        return;
      }
      faceoffBusy = true;
      const cards = content.querySelectorAll(".fo-card");
      cards.forEach(
        card => card.classList.add(card.dataset.side === side ? "win" : "lose")
      );
      const reduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(
        () => {
          pickRoundListWinner(
            tournament,
            matchup.id,
            side === "a" ? matchup.movie_id_a : matchup.movie_id_b
          );
        },
        reduced ? 0 : 450
      );
    };

  content
    .querySelectorAll(".fo-card")
    .forEach(
      card => card.addEventListener("click", () => choose(card.dataset.side))
    );

  faceoffKeyHandler =
    event => {
      if (!tournamentOverlayOpen) {
        return;
      }
      const stage = content.querySelector(".fo-stage");
      if (!stage || !document.body.contains(stage)) {
        return;
      }
      if (event.key === "ArrowLeft") {
        choose("a");
      } else if (event.key === "ArrowRight") {
        choose("b");
      }
    };

}

let faceoffKeyHandler =
  null;

document.addEventListener(
  "keydown",
  event => {
    if (faceoffKeyHandler) {
      faceoffKeyHandler(event);
    }
  }
);
