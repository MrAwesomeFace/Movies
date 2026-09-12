/*

BW'S MOVIE COLLECTION App functionality

*/

// =========================================================
// RESERVATIONS API
// =========================================================

const RESERVATIONS_API =
"https://movie-reservations.iconedge.workers.dev";

const RESERVATION_PEOPLE = [
"Bryon",
"Angie",
"Joey"
];

/*

* Two heart shapes, shared by the card badge, the ripple
* echoes, and the filter flood — smooth for the default
* theme, a blocky pixel-grid version for arcade. Built as
* SVG rects on a 7x6 grid rather than a curved path, so it
* actually reads as 8-bit rather than just a smaller heart.
* Declared here, early, since createMovieCard needs it from
* the very first renderMovies() call at page load — declared
* any later would hit it before this line had run.
  */

const SMOOTH_HEART_SVG =
`<svg viewBox="0 0 32 29" aria-hidden="true"><path d="M16 28.5C9 23.5 1 17.8 1 9.8 1 4.9 4.9 1 9.7 1c2.8 0 5.4 1.4 6.9 3.6C18.1 2.4 20.7 1 23.5 1 28.3 1 32.2 4.9 32.2 9.8 32.2 17.8 24.2 23.5 17.2 28.5z"/></svg>`;

const PIXEL_HEART_SVG =
`<svg viewBox="0 0 7 6" aria-hidden="true" shape-rendering="crispEdges"><rect x="1" y="0" width="1" height="1"/><rect x="2" y="0" width="1" height="1"/><rect x="4" y="0" width="1" height="1"/><rect x="5" y="0" width="1" height="1"/><rect x="0" y="1" width="1" height="1"/><rect x="1" y="1" width="1" height="1"/><rect x="2" y="1" width="1" height="1"/><rect x="3" y="1" width="1" height="1"/><rect x="4" y="1" width="1" height="1"/><rect x="5" y="1" width="1" height="1"/><rect x="6" y="1" width="1" height="1"/><rect x="0" y="2" width="1" height="1"/><rect x="1" y="2" width="1" height="1"/><rect x="2" y="2" width="1" height="1"/><rect x="3" y="2" width="1" height="1"/><rect x="4" y="2" width="1" height="1"/><rect x="5" y="2" width="1" height="1"/><rect x="6" y="2" width="1" height="1"/><rect x="1" y="3" width="1" height="1"/><rect x="2" y="3" width="1" height="1"/><rect x="3" y="3" width="1" height="1"/><rect x="4" y="3" width="1" height="1"/><rect x="5" y="3" width="1" height="1"/><rect x="2" y="4" width="1" height="1"/><rect x="3" y="4" width="1" height="1"/><rect x="4" y="4" width="1" height="1"/><rect x="3" y="5" width="1" height="1"/></svg>`;


const BAT_SIGNAL_POLYGON_POINTS =
"1,217 17,167 52,119 101,78 168,41 234,17 208,82 207,105 214,125 230,143 255,157 311,162 351,150 374,124 386,0 415,45 477,45 506,0 517,120 526,137 540,149 574,161 616,162 645,154 671,135 685,109 685,85 659,17 755,56 827,106 856,137 878,172 889,203 893,240 882,290 852,339 813,377 752,416 764,374 760,346 740,320 706,305 660,312 619,343 608,324 589,311 567,309 538,317 510,333 483,357 459,390 446,419 433,389 414,362 388,337 353,316 326,309 301,312 283,326 274,343 235,313 214,306 187,305 155,318 133,345 129,378 140,416 76,374 32,328 6,277";

/*

* 15-word comic-pop list for the Batman easter egg — all
* caps, all with exclamation points, each its own color so
* consecutive pops (or two on screen at once) stay visually
* distinct from each other.
  */

const BATMAN_WORD_LIST =
[
{ text: "KAPOW!", color: "#4dd9ff" },
{ text: "POW!", color: "#ff4d6d" },
{ text: "BAM!", color: "#fff200" },
{ text: "BANG!", color: "#ff9d2f" },
{ text: "BIFF!", color: "#7cff4d" },
{ text: "BOFF!", color: "#ff2fd1" },
{ text: "BONK!", color: "#fff200" },
{ text: "OOOFF!", color: "#4dd9ff" },
{ text: "THWACK!", color: "#ff4d6d" },
{ text: "ZAP!", color: "#7cff4d" },
{ text: "ZAM!", color: "#ff9d2f" },
{ text: "KLONK!", color: "#ff2fd1" },
{ text: "WHACK!", color: "#fff200" },
{ text: "CRASH!", color: "#4dd9ff" },
{ text: "CLANK!", color: "#ff4d6d" }
];

/*

* Birthday celebration dates — month is 1-12 (not 0-11) to
* match how a person would actually write a date, same
* convention as specialDateFlavorText further down. To add
* someone, just add another entry here; nothing else needs
* to change.
  */

const BIRTHDAY_LIST =
[
{ month: 10, day: 24, name: "Joey" },
{ month: 11, day: 2, name: "Angie" },
{ month: 7, day: 19, name: "Bryon" }
];

const BIRTHDAY_CONFETTI_COLORS =
[
"#fff200",
"#ff4d6d",
"#4dd9ff",
"#7cff4d",
"#ff9d2f",
"#ff2fd1"
];

let reservations = [];

// =========================================================
// ELEMENTS
// =========================================================

const movieGrid =
document.getElementById("movie-grid");

const movieCount =
document.getElementById("movie-count");

const searchToggle =
document.getElementById("search-toggle");

const searchArea =
document.getElementById("search-area");

const searchInput =
document.getElementById("search-input");

const searchClearButton =
document.getElementById("search-clear-button");

const filters =
document.querySelectorAll(".filter");

const noResults =
document.getElementById("no-results");

const modal =
document.getElementById("movie-modal");

const modalClose =
document.getElementById("modal-close");

const modalCover =
document.getElementById("modal-cover");

const modalTitle =
document.getElementById("modal-title");

const modalYear =
document.getElementById("modal-year");

const modalRuntime =
document.getElementById("modal-runtime");

const modalGenre =
document.getElementById("modal-genre");

const modalSynopsis =
document.getElementById("modal-synopsis");

const modalCast =
document.getElementById("modal-cast");

const modalDirector =
document.getElementById("modal-director");

const modalFormats =
document.getElementById("modal-formats");

const flipContainer =
document.getElementById("movie-flip-container");

const flipButton =
document.getElementById("flip-button");

const randomButton =
document.getElementById("random-button");

const reservationFilter =
document.getElementById("reservation-filter");

const genreFilter =
document.getElementById("genre-filter");

const themeToggle =
document.getElementById("theme-toggle");

const coinSlotButton =
document.getElementById("coin-slot-button");

const coinFlickerOverlay =
document.getElementById("coin-flicker-overlay");

const mobileFiltersToggle =
document.getElementById("mobile-filters-toggle");

const coinSlotButtonMobile =
document.getElementById("coin-slot-button-mobile");

const marqueeResetButtonMobile =
document.getElementById("marquee-reset-button-mobile");

const mediaFilterMobile =
document.getElementById("media-filter-mobile");

// =========================================================
// CURRENT STATE
// =========================================================

let currentSearch = "";

let currentMovie = null;

let randomMode = false;

let randomMovies = [];

let activeFilters = {
type: "movie",
media: "all",
genre: null,
category: null,
animated: "hide",
reservation: "all",
rated: []
};

/*

* Glass shatter easter egg — tracks which movies have been
* "punched" this session (keyed by getMovieId, the same
* canonical ID reservations use), so the crack reappears on
* that card any time it's redrawn — after a filter change,
* a search, a re-sort — for the rest of the session, without
* needing to persist anything to storage.
  */

const crackedMovieIds =
new Set();

/*

* Rom-Com hearts — hidden by default now, same "reveal once,
* persist for the session" pattern as crackedMovieIds above.
* Starts empty; populated the first time the Rom-Com genre
* filter is selected (see the genre filter handler), at
* which point every rom-com movie's heart becomes visible
* and stays that way for the rest of the session, even after
* switching to a different filter.
  */

const heartsRevealedMovieIds =
new Set();

/*

* When true, getFilteredMovies() returns ONLY Sandra Bullock
* movies regardless of activeFilters — without this, the
* view reverted the instant you opened and closed any other
* movie, since the original version bypassed activeFilters
* with a one-time direct grid rewrite that nothing
* downstream knew about.
  */

let sandraBullockModeActive =
false;

/*

* Declared here (well before the initial page-load render
* call further down) rather than right after renderMovies()
* — that was the actual bug: renderMovies() references
* stickyNoteMessages internally, and the very first render
* on page load happens before a later const declaration
* would have executed, throwing a ReferenceError that
* silently killed the function mid-way through — after
* cards were added, but before scheduleShelfUpdate() ever
* ran. That's why shelves specifically went missing while
* movies still showed.
  */

function attachStickyNote(
card,
text
) {

const note =
document.createElement(
"div"
);

note.className =
"sticky-note";

note.textContent =
text;

card.appendChild(
note
);

}

// =========================================================
// OPENING / CLOSING STATE
// =========================================================

let selectedCard = null;

let savedScrollY = 0;

let isOpening = false;

let isClosing = false;

let savedCardRect = null;

// =========================================================
// SIMPLE COVER COLORS
// =========================================================

const coverColors = [
["#182848", "#4b6cb7"],
["#3a1c71", "#d76d77"],
["#232526", "#414345"],
["#42275a", "#734b6d"],
["#134e5e", "#71b280"],
["#642b73", "#c6426e"],
["#0f2027", "#2c5364"],
["#200122", "#6f0000"],
["#141e30", "#243b55"],
["#283c86", "#45a247"],
["#4b1248", "#f0c27b"],
["#16222a", "#3a6073"]
];

// =========================================================
// HEX TO RGBA
// =========================================================

/*

* Used for the arcade theme's per-case glow tint — converts
* one of a card's own palette colors into an rgba() string
* at a given alpha, so the glow is set as a real color value
* rather than needing a second parallel palette maintained
* just for glow tints.
  */

function hexToRgba(
hex,
alpha
) {

const parsed =
hex.replace(
"#",
""
);

const r =
parseInt(
parsed.substring(0, 2),
16
);

const g =
parseInt(
parsed.substring(2, 4),
16
);

const b =
parseInt(
parsed.substring(4, 6),
16
);

return (
`rgba(${r}, ${g}, ${b}, ${alpha})`
);

}

// =========================================================
// SPINE COLOR (MUTED VERSION OF THE PALETTE)
// =========================================================

/*

* Takes a palette hex color and blends it toward grey
* (desaturate) and then toward black (darken), so the
* spine still relates to that movie's palette without
* being a bright, mismatched color next to a photo.
  */

function muteColor(
hex,
desaturateAmount,
darkenAmount
) {

const parsed =
hex.replace(
"#",
""
);

const r =
parseInt(
parsed.substring(0, 2),
16
);

const g =
parseInt(
parsed.substring(2, 4),
16
);

const b =
parseInt(
parsed.substring(4, 6),
16
);

const gray =
0.299 * r +
0.587 * g +
0.114 * b;

let mutedR =
r + (gray - r) * desaturateAmount;

let mutedG =
g + (gray - g) * desaturateAmount;

let mutedB =
b + (gray - b) * desaturateAmount;

mutedR =
mutedR * (1 - darkenAmount);

mutedG =
mutedG * (1 - darkenAmount);

mutedB =
mutedB * (1 - darkenAmount);

return (
`rgb(${Math.round(mutedR)}, ` +
`${Math.round(mutedG)}, ` +
`${Math.round(mutedB)})`
);

}

// =========================================================
// RESERVATION HELPERS
// =========================================================

function getMovieId(movie) {

if (
movie.tmdbId !== undefined &&
movie.tmdbId !== null &&
String(movie.tmdbId).trim() !== ""
) {

return String(movie.tmdbId);

}

if (
movie.id !== undefined &&
movie.id !== null &&
String(movie.id).trim() !== ""
) {

return String(movie.id);

}

if (
movie.movie_id !== undefined &&
movie.movie_id !== null &&
String(movie.movie_id).trim() !== ""
) {

return String(movie.movie_id);

}

return String(
movie.title +
"|" +
(movie.year || "")
);

}

// =========================================================
// GET RESERVATIONS FOR MOVIE
// =========================================================

function getMovieReservations(movie) {

const movieId =
getMovieId(movie);

return reservations.filter(
reservation =>
String(reservation.movie_id) ===
String(movieId)
);

}

// =========================================================
// UPDATE RESERVATION COUNTS IN THE DROPDOWN
// =========================================================

/*

* Rewrites each person's <option> label to include how
* many movies they currently have reserved, e.g.
* "Bryon (3)". Called any time the local `reservations`
* array changes — after the initial load, and after any
* add/remove.
  */

function updateReservationCounts() {

if (!reservationFilter) {

return;

}

RESERVATION_PEOPLE.forEach(
person => {

const count =
reservations.filter(
reservation =>
reservation.reserved_for ===
person
).length;

const option =
reservationFilter.querySelector(
`option[value="${person}"]`
);

if (option) {

option.textContent =
`${person} (${count})`;

}

}
);

}

// =========================================================
// LOAD RESERVATIONS
// =========================================================

async function loadReservations() {

try {

const response =
await fetch(
`${RESERVATIONS_API}/reservations`,
{
method: "GET",
cache: "no-store"
}
);

if (!response.ok) {

throw new Error(
`Reservation server returned ${response.status}`
);

}

const data =
await response.json();

reservations =
Array.isArray(data)
? data
: [];

updateReservationCounts();

/*

* Do not rebuild the shelf while a movie is open.
  */

if (!currentMovie) {

renderMovies();

}

if (currentMovie) {

updateReservationPanel(
currentMovie
);

}

} catch (error) {

console.error(
"Could not load reservations:",
error
);

reservations = [];

updateReservationCounts();

}

}

// =========================================================
// SAVE RESERVATION
// =========================================================

async function addReservation(
movie,
person
) {

const movieId =
getMovieId(movie);

try {

const response =
await fetch(
`${RESERVATIONS_API}/reservations`,
{
method: "POST",

headers: {
"Content-Type": "application/json"
},

body: JSON.stringify({

movie_id:
movieId,

movie_title:
movie.title,

reserved_for:
person

})

}
);

const data =
await response.json();

if (!response.ok) {

throw new Error(
data.details ||
data.error ||
`Server returned ${response.status}`
);

}

if (!data.already_reserved) {

reservations.push({

id:
data.id,

movie_id:
data.movie_id,

movie_title:
data.movie_title,

reserved_for:
data.reserved_for,

updated_at:
data.updated_at

});

}

updateReservationCounts();

updateReservationPanel(
movie
);

} catch (error) {

console.error(
"Could not add reservation:",
error
);

alert(
"The reservation could not be saved. Please try again."
);

}

}

// =========================================================
// REMOVE RESERVATION
// =========================================================

async function removeReservation(
movie,
reservation
) {

if (!reservation) {
return;
}

const confirmed =
confirm(
`Remove ${reservation.reserved_for}'s reservation for "${movie.title}"?`
);

if (!confirmed) {
return;
}

try {

const response =
await fetch(
`${RESERVATIONS_API}/reservations/${encodeURIComponent(
reservation.id
)}`,
{
method: "DELETE"
}
);

const data =
await response.json();

if (!response.ok) {

throw new Error(
data.details ||
data.error ||
`Server returned ${response.status}`
);

}

reservations =
reservations.filter(
item =>
String(item.id) !==
String(reservation.id)
);

updateReservationCounts();

updateReservationPanel(
movie
);

} catch (error) {

console.error(
"Could not remove reservation:",
error
);

alert(
"The reservation could not be removed. Please try again."
);

}

}

// =========================================================
// CREATE RESERVATION PANEL
// =========================================================

function createReservationPanel() {

const existing =
document.getElementById(
"reservation-panel"
);

if (existing) {
return existing;
}

const panel =
document.createElement(
"div"
);

panel.id =
"reservation-panel";

panel.className =
"movie-info-section reservation-section";

const heading =
document.createElement(
"h3"
);

heading.textContent =
"Reservations";

panel.appendChild(
heading
);

const description =
document.createElement(
"p"
);

description.className =
"reservation-description";

description.textContent =
"Who is waiting to watch it?";

panel.appendChild(
description
);

const people =
document.createElement(
"div"
);

people.id =
"reservation-people";

people.className =
"reservation-people";

panel.appendChild(
people
);

const backBand3 =
document.querySelector(
".back-band-3"
);

const barcodeArea =
document.querySelector(
".back-barcode-area"
);

if (backBand3) {

if (barcodeArea) {

backBand3.insertBefore(
panel,
barcodeArea
);

} else {

backBand3.appendChild(
panel
);

}

}

return panel;

}

// =========================================================
// UPDATE RESERVATION PANEL
// =========================================================

function updateReservationPanel(
movie
) {

if (!movie) {
return;
}

const panel =
createReservationPanel();

const people =
panel.querySelector(
"#reservation-people"
);

if (!people) {
return;
}

people.innerHTML =
"";

const movieReservations =
getMovieReservations(
movie
);

RESERVATION_PEOPLE.forEach(
person => {

const reservation =
movieReservations.find(
item =>
item.reserved_for === person
);

const button =
document.createElement(
"button"
);

button.type =
"button";

button.className =
"reservation-person";

if (reservation) {

button.classList.add(
"reserved"
);

button.textContent =
`✓ ${person}`;

} else {

button.textContent =
person;

}

button.addEventListener(
"click",
event => {

event.stopPropagation();

if (reservation) {

removeReservation(
movie,
reservation
);

} else {

addReservation(
movie,
person
);

}

}
);

people.appendChild(
button
);

}
);

const existingSummary =
panel.querySelector(
".reservation-summary"
);

if (existingSummary) {

existingSummary.remove();

}

if (
movieReservations.length > 0
) {

const summary =
document.createElement(
"p"
);

summary.className =
"reservation-summary";

const names =
movieReservations
.map(
reservation =>
reservation.reserved_for
)
.join(", ");

summary.textContent =
`Reserved for: ${names}`;

panel.appendChild(
summary
);

}

}

// =========================================================
// ARCADE THEME — SIDE LIGHTING
// =========================================================

/*

* Three shape templates: two different zigzag/bolt variants
* and the rewind-logo's own double-arrow, drawn as neon-tube
* outlines (stroke, not fill) so they read as light rather
* than flat icons. Each placed instance gets its own random
* shape choice, color, horizontal flip, slight rotation, and
* vertical spacing — a single repeating CSS tile can't do
* any of that, since every repeat of it is identical.
*
* Movie reel, VHS tape, and DVD disc added for more variety
* in what CAN show up — density stays the same, only the
* pool of possible shapes got bigger.
  */

const ARCADE_SIDE_SHAPE_TEMPLATES = [

color =>
`<svg width="60" height="180" viewBox="0 0 30 90">` +
`<polyline points="20,5 8,35 18,38 4,85" fill="none" ` +
`stroke="${color}" stroke-width="2.5" stroke-linecap="round" ` +
`stroke-linejoin="round"/></svg>`,

color =>
`<svg width="60" height="180" viewBox="0 0 30 90">` +
`<polyline points="6,5 22,30 10,34 26,85" fill="none" ` +
`stroke="${color}" stroke-width="2.5" stroke-linecap="round" ` +
`stroke-linejoin="round"/></svg>`,

color =>
`<svg width="78" height="78" viewBox="0 0 32 32">` +
`<path d="M16 16 L28 6 L28 26 Z" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<path d="M4 16 L16 6 L16 26 Z" fill="none" stroke="${color}" ` +
`stroke-width="2"/></svg>`,

// Movie reel — rim, three spool holes, center hub

color =>
`<svg width="68" height="68" viewBox="0 0 34 34">` +
`<circle cx="17" cy="17" r="15" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<circle cx="17" cy="8" r="3.2" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<circle cx="25" cy="20" r="3.2" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<circle cx="9" cy="20" r="3.2" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<circle cx="17" cy="17" r="2" fill="none" stroke="${color}" ` +
`stroke-width="2"/></svg>`,

// VHS tape — cassette body, spool windows, and the
// rectangular tape window between them that a real VHS
// has — without it, two bare circles just read as a
// speaker, not a tape.

color =>
`<svg width="112" height="60" viewBox="0 0 56 30">` +
`<rect x="2" y="2" width="52" height="26" rx="3" fill="none" ` +
`stroke="${color}" stroke-width="2"/>` +
`<circle cx="14" cy="16" r="6" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<circle cx="42" cy="16" r="6" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<rect x="23" y="11" width="10" height="9" fill="none" ` +
`stroke="${color}" stroke-width="2"/></svg>`,

// DVD disc — outer rim, center hole. No middle data ring —
// that read as visual noise rather than a disc.

color =>
`<svg width="68" height="68" viewBox="0 0 34 34">` +
`<circle cx="17" cy="17" r="15" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<circle cx="17" cy="17" r="2.5" fill="none" stroke="${color}" ` +
`stroke-width="2"/></svg>`,

// Open clapboard — hinge, board with three label lines, and
// the top stick genuinely rotated open (via an SVG <g>
// transform around the hinge point) rather than just tilted,
// with diagonal stripes across it.

color =>
`<svg width="90" height="104" viewBox="0 -8 50 58">` +
`<rect x="6" y="20" width="38" height="28" rx="2" fill="none" ` +
`stroke="${color}" stroke-width="2"/>` +
`<line x1="10" y1="28" x2="40" y2="28" stroke="${color}" ` +
`stroke-width="1"/>` +
`<line x1="10" y1="34" x2="40" y2="34" stroke="${color}" ` +
`stroke-width="1"/>` +
`<line x1="10" y1="40" x2="40" y2="40" stroke="${color}" ` +
`stroke-width="1"/>` +
`<rect x="4" y="16" width="6" height="8" rx="1" fill="none" ` +
`stroke="${color}" stroke-width="1.5"/>` +
`<g transform="rotate(-25 8 20)">` +
`<rect x="6" y="10" width="38" height="8" rx="2" fill="none" ` +
`stroke="${color}" stroke-width="2"/>` +
`<line x1="12" y1="10" x2="16" y2="18" stroke="${color}" ` +
`stroke-width="1.5"/>` +
`<line x1="20" y1="10" x2="24" y2="18" stroke="${color}" ` +
`stroke-width="1.5"/>` +
`<line x1="28" y1="10" x2="32" y2="18" stroke="${color}" ` +
`stroke-width="1.5"/>` +
`<line x1="36" y1="10" x2="40" y2="18" stroke="${color}" ` +
`stroke-width="1.5"/>` +
`</g></svg>`,

// Film strip — square sprocket holes along the top and
// bottom edges, two square frame windows in between. Wide
// like the VHS, so it gets the same near-vertical rotation
// treatment (see isFilmStrip below), just with more allowed
// variance since it's a bigger, sturdier-looking shape.

color =>
`<svg width="120" height="78" viewBox="0 0 68 44">` +
`<rect x="2" y="2" width="64" height="40" rx="2" fill="none" ` +
`stroke="${color}" stroke-width="2"/>` +
`<rect x="4" y="4" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="12" y="4" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="20" y="4" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="28" y="4" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="36" y="4" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="44" y="4" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="52" y="4" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="60" y="4" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="4" y="36" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="12" y="36" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="20" y="36" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="28" y="36" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="36" y="36" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="44" y="36" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="52" y="36" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="60" y="36" width="4" height="4" fill="none" ` +
`stroke="${color}" stroke-width="1"/>` +
`<rect x="4" y="10" width="24" height="24" rx="2" fill="none" ` +
`stroke="${color}" stroke-width="1.5"/>` +
`<rect x="36" y="10" width="24" height="24" rx="2" fill="none" ` +
`stroke="${color}" stroke-width="1.5"/></svg>`

];

const ARCADE_SIDE_COLORS = [
"#00fff2",
"#ff2fd1"
];

function renderArcadeSideLighting() {

const leftContainer =
document.getElementById(
"arcade-side-lighting-left"
);

const rightContainer =
document.getElementById(
"arcade-side-lighting-right"
);

if (!leftContainer || !rightContainer) {

return;

}

leftContainer.innerHTML =
"";

rightContainer.innerHTML =
"";

if (
!document.body.classList.contains(
"theme-arcade"
)
) {

return;

}

if (window.innerWidth < 1300) {

return;

}

const totalHeight =
document.body.scrollHeight;

[leftContainer, rightContainer].forEach(
container => {

let position =
150;

while (position < totalHeight - 100) {

const shapeIndex =
Math.floor(
Math.random() *
ARCADE_SIDE_SHAPE_TEMPLATES.length
);

const template =
ARCADE_SIDE_SHAPE_TEMPLATES[
shapeIndex
];

const color =
ARCADE_SIDE_COLORS[
Math.floor(
Math.random() *
ARCADE_SIDE_COLORS.length
)
];

const flip =
Math.random() < 0.5
? -1
: 1;

/*

* The VHS tape (index 4) is a solid wide rectangle, so
* its full width is what has to fit in the narrow side
* margin. Rotating it near-vertical instead of the usual
* subtle wobble swaps its effective horizontal footprint
* down to roughly its height instead of its width — so it
* can stay full-size instead of needing to be shrunk.
  */

const isVhsTape =
shapeIndex === 4;

/*

* Film strip (index 7) is also wide, same reasoning as the
* VHS — but bigger and sturdier-looking, so it gets more
* allowed tilt variance (80-100 instead of VHS's tight
* 85-95) without looking as rigidly locked to dead vertical.
  */

const isFilmStrip =
shapeIndex === 7;

const rotate =
isVhsTape
? (85 + Math.random() * 10).toFixed(1)
: isFilmStrip
? (80 + Math.random() * 20).toFixed(1)
: (Math.random() * 20 - 10).toFixed(1);

const wrapper =
document.createElement(
"div"
);

wrapper.className =
"arcade-side-icon";

wrapper.style.top =
`${position}px`;

wrapper.style.transform =
`scaleX(${flip}) rotate(${rotate}deg)`;

wrapper.style.filter =
`drop-shadow(0 0 4px ${color}) ` +
`drop-shadow(0 0 9px ${color})`;

wrapper.innerHTML =
template(color);

container.appendChild(
wrapper
);

position +=
380 + Math.random() * 240;

}

}
);

}

// =========================================================
// THEME TOGGLE (ARCADE MODE)
// =========================================================

/*

* The class itself gets applied on load by the inline
* script in index.html (before body renders, to avoid a
* flash of the wrong theme) — this just handles the click
* to flip it afterward, applied to both <html> and <body>
* so both of their backgrounds switch (a CSS custom
* property redefined on body doesn't cascade upward to an
* ancestor like html, so html needs the class too).
  */

if (themeToggle) {

themeToggle.addEventListener(
"click",
() => {

const isArcade =
document.body.classList.toggle(
"theme-arcade"
);

document.documentElement.classList.toggle(
"theme-arcade",
isArcade
);

localStorage.setItem(
"mrMoviesTheme",
isArcade ? "arcade" : "default"
);

/*

* Cards (and specifically the Rom-Com heart's shape —
* smooth path in classic, blocky pixel grid in arcade) are
* built once at render time based on whichever theme was
* active then, and don't update on their own just because
* the theme class changed. Without this, switching themes
* left every already-rendered heart frozen as whichever
* shape it was born with — a re-render rebuilds them
* correctly for the theme actually showing now.
  */

renderMovies();

/*

* Whichever theme we just switched INTO gets its timer
* started fresh here — that's the whole point of this
* change: the coin slot's reveal and the marquee's chase
* used to just run in the background from page load
* regardless of which theme was showing, so switching into
* arcade could reveal an already-lit coin slot instead of a
* fresh countdown. Each entry now starts clean.
  */

if (isArcade) {

scheduleCoinReveal();

} else {

resetMarqueeForThemeEntry();

}

renderArcadeSideLighting();

}
);

}

// =========================================================
// GENRE RELOCATION (MOBILE ONLY)
// =========================================================

/*

* Genre can't just be shown/hidden with CSS to land in the
* kept row on mobile — it lives in a genuinely different
* parent container than Staff Picks in the HTML, and CSS
* can only reorder siblings that already share one parent.
* This physically moves the SAME element back and forth
* (never duplicates it) as the screen crosses the mobile
* breakpoint, so there's exactly one genre-filter-group in
* the DOM at all times, just relocated.
  */

function relocateGenreForMobile() {

const genreGroup =
document.getElementById(
"genre-filter-group"
);

const actionsTop =
document.querySelector(
".filter-group-actions-top"
);

const genreCategoryLeft =
document.querySelector(
".genre-category-left"
);

if (
!genreGroup ||
!actionsTop ||
!genreCategoryLeft
) {

return;

}

const isMobile =
window.innerWidth <= 599;

if (
isMobile &&
genreGroup.parentElement !==
actionsTop
) {

actionsTop.insertBefore(
genreGroup,
actionsTop.firstChild
);

document.body.classList.add(
"genre-relocated"
);

} else if (
!isMobile &&
genreGroup.parentElement ===
actionsTop
) {

genreCategoryLeft.insertBefore(
genreGroup,
genreCategoryLeft.firstChild
);

document.body.classList.remove(
"genre-relocated"
);

}

}

relocateGenreForMobile();

let genreRelocateResizeTimeout =
null;

window.addEventListener(
"resize",
() => {

clearTimeout(
genreRelocateResizeTimeout
);

genreRelocateResizeTimeout =
setTimeout(
relocateGenreForMobile,
150
);

}
);

// =========================================================
// MOBILE FILTERS TOGGLE
// =========================================================

/*

* Mobile-only — reveals Type, Category, and Reservations,
* which are hidden by default on phones (see the PHONES
* media query in style.css) to keep the header from being
* three full scrolling rows before you've even seen a
* movie. Genre, the Media dropdown, and Staff Picks stay
* visible regardless, since those were the ones worth
* keeping immediately reachable.
  */

if (mobileFiltersToggle) {

mobileFiltersToggle.addEventListener(
"click",
() => {

const isOpen =
document.body.classList.toggle(
"mobile-filters-open"
);

mobileFiltersToggle.classList.toggle(
"active",
isOpen
);

mobileFiltersToggle.setAttribute(
"aria-expanded",
isOpen ? "true" : "false"
);

}
);

}

// =========================================================
// INITIALIZE
// =========================================================

renderMovies();

loadReservations();

renderArcadeSideLighting();

/*

* Birthday celebration — checked once here at page load
* against today's real date. sessionStorage (not a plain
* variable) so it stays "already shown" across a page
* refresh within the same browser session, but shows again
* in a fresh session if it's still that date — matches
* "each time the site is opened that day, but just the one
* time" rather than only ever once forever.
  */

(function checkBirthdayOnLoad() {

const now =
new Date();

const todayMonth =
now.getMonth() + 1;

const todayDay =
now.getDate();

const match =
BIRTHDAY_LIST.find(
entry =>
entry.month === todayMonth &&
entry.day === todayDay
);

if (!match) {

return;

}

const alreadyShown =
sessionStorage.getItem(
"birthdayShown"
);

if (alreadyShown === String(todayMonth) + "-" + String(todayDay)) {

return;

}

sessionStorage.setItem(
"birthdayShown",
`${todayMonth}-${todayDay}`
);

triggerBirthdayCelebration(
match.name
);

})();

// =========================================================
// RENDER MOVIES
// =========================================================

function renderMovies() {

movieGrid.innerHTML =
"";

movieGrid.classList.remove(
"single-card-centered"
);

let filteredMovies =
getFilteredMovies();

// =========================================================
// RANDOM 16
// =========================================================

/*

* Skipped entirely when a special view is active — randomMovies
* was computed from the whole catalog before this mode
* existed, so intersecting against it would silently corrupt
* or empty out the Sandra Bullock result.
  */

if (
randomMode &&
!sandraBullockModeActive
) {

filteredMovies =
randomMovies.filter(
movie =>
filteredMovies.includes(
movie
)
);

}

// =========================================================
// SORT ALPHABETICALLY
// =========================================================

if (!randomMode) {

filteredMovies.sort(
(a, b) =>
a.title.localeCompare(
b.title,
undefined,
{
sensitivity:
"base"
}
)
);

}

// =========================================================
// UPDATE COUNT
// =========================================================

const filtersAreActive =
activeFilters.type !== "all" ||
activeFilters.media !== "all" ||
activeFilters.genre !== null ||
activeFilters.category !== null ||
activeFilters.animated !== "mixed" ||
activeFilters.reservation !== "all" ||
activeFilters.rated.length > 0;

if (randomMode) {

movieCount.textContent =
`${filteredMovies.length} Staff Picks`;

} else if (
currentSearch ||
filtersAreActive
) {

movieCount.textContent =
`${filteredMovies.length} of ${movies.length} titles`;

} else {

movieCount.textContent =
`${movies.length} titles`;

}

// =========================================================
// NO RESULTS
// =========================================================

if (
filteredMovies.length === 0
) {

if (
activeFilters.reservation !== "all"
) {

noResults.classList.add(
"hidden"
);

movieGrid.classList.add(
"single-card-centered"
);

renderEmptyReservationShelf();

scheduleShelfUpdate();

return;

}

noResults.classList.remove(
"hidden"
);

return;

}

noResults.classList.add(
"hidden"
);

// =========================================================
// CREATE CARDS
// =========================================================

filteredMovies.forEach(
(movie, index) => {

const card =
createMovieCard(
movie,
index
);

movieGrid.appendChild(
card
);

}
);

// =========================================================
// SHELVES
// =========================================================

scheduleShelfUpdate();

}

// =========================================================
// CONTINUOUS SHELF BOARDS
// =========================================================

let shelfResizeTimeout =
null;

function updateShelves() {

document
.querySelectorAll(
".shelf-board, .shelf-lip"
)
.forEach(
board =>
board.remove()
);

const cards =
Array.from(
movieGrid.querySelectorAll(
".movie-card"
)
);

if (cards.length === 0) {

return;

}

// =========================================================
// GROUP CARDS INTO ROWS
// =========================================================

/*

* Grouped by offsetTop (layout position, unaffected by
* the case's 3D tilt transform) rather than the
* rendered/rotated bounding box — that keeps every card
* in a visual row bucketed together even though the
* tilt makes their rendered edges uneven.
  */

const rows =
new Map();

cards.forEach(
card => {

const rowKey =
Math.round(
card.offsetTop
);

const rowBottom =
card.offsetTop +
card.offsetHeight;

if (!rows.has(rowKey)) {

rows.set(
rowKey,
[]
);

}

rows.get(rowKey).push(
rowBottom
);

}
);

// =========================================================
// BUILD ONE BOARD PER ROW
// =========================================================

rows.forEach(
bottoms => {

const rowBottom =
Math.max(
...bottoms
);

const board =
document.createElement(
"div"
);

board.className =
"shelf-board";

board.style.top =
`${rowBottom}px`;

/*

* Random negative delay so each row's flicker is out of
* phase with the others — without this, every board runs
* the exact same 4.5s cycle in perfect lockstep, which
* reads as artificial. A negative delay (rather than a
* positive one) desyncs immediately on the first frame
* instead of only after the first cycle completes. Only
* matters in the arcade theme (default theme has no
* flicker animation on .shelf-board to begin with), so
* this is harmless either way.
  */

board.style.animationDelay =
`-${(Math.random() * 4.5).toFixed(2)}s`;

const lip =
document.createElement(
"div"
);

lip.className =
"shelf-lip";

lip.style.top =
`${rowBottom - 6}px`;

lip.style.left =
"-16px";

lip.style.right =
"-16px";

/*

* Inserted first so movie cards, which come later
* in the DOM, paint on top of the board — but the lip
* keeps its higher z-index (set in CSS) so it still
* renders in front of the case bottoms despite being
* early in the DOM.
  */

movieGrid.insertBefore(
lip,
movieGrid.firstChild
);

movieGrid.insertBefore(
board,
movieGrid.firstChild
);

}
);

}

function scheduleShelfUpdate() {

requestAnimationFrame(
() => {

updateShelves();

renderArcadeSideLighting();

}
);

}

window.addEventListener(
"resize",
() => {

clearTimeout(
shelfResizeTimeout
);

shelfResizeTimeout =
setTimeout(
scheduleShelfUpdate,
150
);

}
);

// =========================================================
// CREATE MOVIE CARD
// =========================================================

// =========================================================
// EMPTY RESERVATION SHELF
// =========================================================

/*

* Shown when a reservation filter matches zero movies — one
* real, fully clickable card (not a special new visual
* system) built from a fake movie object. Since it goes
* through the exact same createMovieCard/openMovieFromCard/
* populateMovie path as any real movie, it gets the flight
* animation, the flip, the shelf integration — everything —
* for free, with zero new interaction code to get right.
  */

function createEmptyReservationMovie() {

return {

title: "?",

isEmptyReservationPlaceholder: true,

type: "movie",

genre: "",

year: "",

runtime: "",

synopsis:
"You don't have anything on hold right now. " +
"Explore the collection below to find something " +
"worth reserving!",

cast: "",

director: "",

physical: [],

digital: []

};

}

function renderEmptyReservationShelf() {

const placeholderMovie =
createEmptyReservationMovie();

const card =
createMovieCard(
placeholderMovie,
0
);

card.classList.add(
"empty-reservation-card"
);

const coverInner =
card.querySelector(
".movie-cover-inner"
);

const spine =
card.querySelector(
".case-spine-face"
);

const fallbackTitle =
card.querySelector(
".poster-fallback-title"
);

/*

* Overrides the normal per-index palette color with a
* neutral grey, and the normal small fallback-title
* styling with a large centered "?" — both applied after
* creation rather than needing createMovieCard itself to
* know about this special case.
  */

if (coverInner) {

coverInner.style.background =
"linear-gradient(145deg, #5a5a5a, #2a2a2a)";

}

if (spine) {

spine.style.background =
"linear-gradient(to bottom, #4a4a4a, #1a1a1a)";

}

if (fallbackTitle) {

fallbackTitle.textContent =
"";

fallbackTitle.classList.add(
"empty-reservation-mark"
);

fallbackTitle.innerHTML =
`<svg viewBox="0 0 100 150" class="empty-reservation-svg" aria-label="Question mark with a sad face">
<path d="M22 40 Q18 10 50 10 Q82 10 82 40 Q82 62 58 68 Q50 70 50 86" fill="none" stroke="#b8b8b8" stroke-width="12" stroke-linecap="round"/>
<circle cx="50" cy="120" r="19" fill="none" stroke="#b8b8b8" stroke-width="6"/>
<circle cx="42" cy="114" r="2.5" fill="#b8b8b8"/>
<circle cx="58" cy="114" r="2.5" fill="#b8b8b8"/>
<path d="M40 130 Q50 119 60 130" fill="none" stroke="#b8b8b8" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

}

attachStickyNote(
card,
"Nothing here yet - Maybe check out staff picks?"
);

movieGrid.appendChild(
card
);

}

// =========================================================
// NOW SHOWING SLOT
// =========================================================

/*

* Places bulbs evenly around a container's outer perimeter
* at a fixed spacing, computed from its real rendered size —
* called after the element is in the DOM, not before, since
* clientWidth/clientHeight are only meaningful once it's
* actually laid out. Keeps density consistent across the
* site's different responsive column counts, rather than a
* fixed bulb count that would bunch up or thin out.
  */

function placePerimeterBulbs(
container,
spacing,
inset
) {

const w =
container.clientWidth;

const h =
container.clientHeight;

const points =
[];

for (
let x = inset;
x <= w - inset;
x += spacing
) {

points.push([x, inset]);
points.push([x, h - inset]);

}

for (
let y = inset + spacing;
y < h - inset;
y += spacing
) {

points.push([inset, y]);
points.push([w - inset, y]);

}

for (const [x, y] of points) {

const bulb =
document.createElement(
"div"
);

bulb.className =
"now-showing-bulb perimeter";

bulb.style.left =
`${x - 4.5}px`;

bulb.style.top =
`${y - 4.5}px`;

container.appendChild(
bulb
);

}

}

function placeLineBulbs(
container,
spacing,
inset
) {

const w =
container.clientWidth;

for (
let x = inset;
x <= w - inset;
x += spacing
) {

const bulb =
document.createElement(
"div"
);

bulb.className =
"now-showing-bulb perimeter";

bulb.style.left =
`${x - 4.5}px`;

bulb.style.top =
"6px";

container.appendChild(
bulb
);

}

}

/*

* 5x7 dot-matrix bitmap font — covers only the letters
* "NOW SHOWING" actually needs, not a full alphabet. Each
* entry is 7 rows of a 5-bit row pattern, 1 = lit bulb.
* Sized at 3px/1px gap specifically because that's the
* largest size that was measured to actually fit the real
* frame width without the final letter clipping into the
* border bulbs — see the fit-testing this was built from.
  */

const NOW_SHOWING_FONT =
{
N: [0b10001, 0b11001, 0b11001, 0b10101, 0b10011, 0b10011, 0b10001],
O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
I: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
" ": [0, 0, 0, 0, 0, 0, 0]
};

function buildDotMatrix(
container,
text,
dotSize,
gap,
verticalOffset
) {

let x =
0;

const yOffset =
verticalOffset ||
0;

const letterWidth =
5 * (dotSize + gap);

const spaceWidth =
letterWidth * 0.6;

for (const ch of text) {

const glyph =
NOW_SHOWING_FONT[ch];

if (!glyph) {

x += spaceWidth;

continue;

}

for (
let row = 0;
row < 7;
row++
) {

for (
let col = 0;
col < 5;
col++
) {

if ((glyph[row] >> (4 - col)) & 1) {

const dot =
document.createElement(
"div"
);

dot.className =
"now-showing-bulb letter";

dot.style.width =
`${dotSize}px`;

dot.style.height =
`${dotSize}px`;

dot.style.left =
`${x + col * (dotSize + gap)}px`;

dot.style.top =
`${yOffset + row * (dotSize + gap)}px`;

container.appendChild(
dot
);

}

}

}

x +=
letterWidth +
spaceWidth * 0.5;

}

container.style.width =
`${x}px`;

container.style.margin =
"0 auto";

}

/*

* Confirmed to look right across a range of real movies —
* dropped down from the 100% testing rate to the real
* target.
  */

/*

* Set to 0 for now — reported as showing up far more than
* the 35% rate would suggest. Investigated this (checked for
* leftover test values, reviewed the show/hide reset logic,
* ran statistical tests opening dozens of movies including
* specifically Batman/Harry Potter titles) and never found a
* bug or a rate above the expected ~35%, but turning it off
* rather than leave something that feels broken. Safe to
* raise this back up whenever it's worth revisiting.
  */

let nowShowingChance =
0;

let nowShowingFrameActive =
false;

/*

* Positions the frame around modal-content's REAL rendered
* rect — only meaningful after the open animation has
* settled, which is why this is called from the setTimeout
* at the end of the open sequence rather than at click time.
* A separate, independently positioned element behind
* modal-content — never touches modal-content itself, so it
* can't interfere with the flip, the resize logic, or the
* close animation.
  */

function showNowShowingFrame() {

const content =
modal.querySelector(
".modal-content"
);

const frame =
document.getElementById(
"now-showing-frame"
);

const header =
document.getElementById(
"ns-frame-header"
);

const divider =
document.getElementById(
"ns-frame-divider"
);

if (
!content ||
!frame ||
!header ||
!divider
) {

return;

}

const rect =
content.getBoundingClientRect();

const topExtra =
86;

const sideExtra =
14;

const bottomExtra =
14;

frame.style.left =
`${rect.left - sideExtra}px`;

frame.style.top =
`${rect.top - topExtra}px`;

frame.style.width =
`${rect.width + sideExtra * 2}px`;

frame.style.height =
`${rect.height + topExtra + bottomExtra}px`;

header.innerHTML =
"";

divider.innerHTML =
"";

Array.from(
frame.querySelectorAll(
".now-showing-bulb.perimeter"
)
).forEach(
bulb => {

if (
bulb.parentElement === frame
) {

bulb.remove();

}

}
);

frame.classList.remove(
"now-showing-frame-hidden"
);

nowShowingFrameActive =
true;

requestAnimationFrame(
() => {

buildDotMatrix(
header,
"NOW SHOWING",
3,
1,
20
);

placeLineBulbs(
divider,
16,
6
);

placePerimeterBulbs(
frame,
16,
6
);

frame.classList.add(
"visible"
);

}
);

}

function hideNowShowingFrame() {

if (!nowShowingFrameActive) {

return;

}

nowShowingFrameActive =
false;

const frame =
document.getElementById(
"now-showing-frame"
);

if (!frame) {

return;

}

frame.classList.remove(
"visible"
);

setTimeout(
() => {

if (!nowShowingFrameActive) {

frame.classList.add(
"now-showing-frame-hidden"
);

}

},
350
);

}

function createMovieCard(
movie,
index
) {

const card =
document.createElement(
"article"
);

card.className =
"movie-card";

card.setAttribute(
"tabindex",
"0"
);

card.dataset.movieTitle =
movie.title ||
"";

// =========================================================
// COVER (SPINE + POSTER, FLAT 2D)
// =========================================================

const colors =
coverColors[
index %
coverColors.length
];

const cover =
document.createElement(
"div"
);

cover.className =
"movie-cover";

/*

* Arcade theme's per-case glow — set unconditionally (a
* no-op in the default theme, since nothing there reads
* this property) rather than only inside an arcade check,
* keeping this in one place instead of two code paths.
  */

cover.style.setProperty(
"--glow-color",
hexToRgba(colors[1], 0.55)
);

const coverInner =
document.createElement(
"div"
);

coverInner.className =
"movie-cover-inner";

if (movie.poster) {

coverInner.style.backgroundImage =
`url("${movie.poster}")`;

coverInner.style.backgroundSize =
"cover";

coverInner.style.backgroundPosition =
"center";

coverInner.style.backgroundRepeat =
"no-repeat";

} else {

coverInner.style.background =
`linear-gradient(
145deg,
${colors[0]},
${colors[1]}
)`;

/*

* No poster (no TMDB match, etc.) — show the title as
* text on the gradient instead of a blank colored
* rectangle, so the case is still identifiable. Fully
* automatic: nothing to upload or map per movie.
  */

const fallbackTitle =
document.createElement(
"div"
);

fallbackTitle.className =
"poster-fallback-title";

fallbackTitle.textContent =
movie.title;

coverInner.appendChild(
fallbackTitle
);

}

const spine =
document.createElement(
"div"
);

spine.className =
"case-spine-face";

/*

* Darkened version of the palette color, with only a
* light touch of desaturation — enough to read as the
* case's edge sitting in shadow, without crushing out the
* movie's actual color the way heavier desaturation did.
  */

spine.style.background =
`linear-gradient(
to bottom,
${muteColor(colors[0], 0.12, 0.15)},
${muteColor(colors[0], 0.12, 0.55)}
)`;

cover.appendChild(
spine
);

cover.appendChild(
coverInner
);

card.appendChild(
cover
);

// =========================================================
// RESERVATION RIBBON
// =========================================================

const movieReservations =
getMovieReservations(
movie
);

if (
movieReservations.length > 0
) {

const ribbon =
document.createElement(
"div"
);

ribbon.className =
"reservation-ribbon";

ribbon.textContent =
movieReservations.length;

/*

* Attached to the front face (not the outer cover) so
* the ribbon tilts along with the case instead of
* floating flat over it.
  */

coverInner.appendChild(
ribbon
);

}

// =========================================================
// OPEN MOVIE
// =========================================================

card.addEventListener(
"click",
() => {

openMovieFromCard(
movie,
card
);

}
);

// =========================================================
// KEYBOARD ACCESSIBILITY
// =========================================================

card.addEventListener(
"keydown",
event => {

if (
event.key === "Enter" ||
event.key === " "
) {

event.preventDefault();

openMovieFromCard(
movie,
card
);

}

}
);

if (
crackedMovieIds.has(
getMovieId(
movie
)
)
) {

renderPersistentCrack(
card
);

}

/*

* Rom-Com heart badge — matches by the same text-tag
* pattern as the genre filter itself, so a movie shows
* the heart exactly when it would also show up under the
* Rom-Com filter, with nothing to keep in sync separately.
  */

const movieGenreText =
(movie.genre || "")
.toLowerCase();

if (
movieGenreText.includes(
"rom-com"
) &&
heartsRevealedMovieIds.has(
getMovieId(
movie
)
)
) {

const isArcadeTheme =
document.body.classList.contains(
"theme-arcade"
);

const heartSVG =
isArcadeTheme ?
PIXEL_HEART_SVG :
SMOOTH_HEART_SVG;

const wrapper =
document.createElement(
"div"
);

wrapper.className =
"rom-com-heart-wrapper";

const heartBadge =
document.createElement(
"div"
);

heartBadge.className =
"rom-com-heart";

heartBadge.innerHTML =
heartSVG;

wrapper.appendChild(
heartBadge
);

/*

* Appended to coverInner, NOT cover — coverInner is the
* element the hover-lift transform actually targets, so
* the heart needs to live inside it to lift together with
* the poster rather than staying behind while the poster
* rises above it.
  */

coverInner.appendChild(
wrapper
);

}

return card;

}

// =========================================================
// GLASS SHATTER EASTER EGG (Rocky / Creed / Stallone)
// =========================================================

/*

* Builds a randomized "punched glass" crack pattern as an
* SVG string — a handful of jagged lines radiating outward
* from an impact point (with occasional branch cracks off
* the main lines), plus a few small translucent shard
* triangles near the impact point itself. viewBox matches
* the 2:3 poster aspect ratio. Random each time, so it
* doesn't look identical on repeat triggers.
  */

function generateCrackSVG() {

const width = 200;
const height = 300;

const centerX =
width / 2 +
(Math.random() * 30 - 15);

const centerY =
height / 2 +
(Math.random() * 40 - 20);

const numCracks =
7 +
Math.floor(
Math.random() * 3
);

let paths =
"";

for (
let i = 0;
i < numCracks;
i++
) {

const baseAngle =
(i / numCracks) *
Math.PI * 2 +
(Math.random() * 0.3 - 0.15);

const maxDist =
90 +
Math.random() * 70;

const segments =
3 +
Math.floor(
Math.random() * 2
);

let angle =
baseAngle;

let d =
`M ${centerX.toFixed(1)} ${centerY.toFixed(1)} `;

for (
let s = 1;
s <= segments;
s++
) {

const dist =
(maxDist / segments) * s;

angle +=
(Math.random() * 0.5 - 0.25);

const jitterPerp =
(Math.random() * 10 - 5);

const nx =
centerX +
Math.cos(angle) * dist +
Math.cos(angle + Math.PI / 2) * jitterPerp;

const ny =
centerY +
Math.sin(angle) * dist +
Math.sin(angle + Math.PI / 2) * jitterPerp;

d +=
`L ${nx.toFixed(1)} ${ny.toFixed(1)} `;

}

paths +=
`<path d="${d}" stroke="rgba(255,255,255,0.85)" stroke-width="1.4" fill="none" stroke-linecap="round" />`;

if (Math.random() < 0.6) {

const branchStart =
0.5 +
Math.random() * 0.3;

const bx =
centerX +
Math.cos(baseAngle) * maxDist * branchStart;

const by =
centerY +
Math.sin(baseAngle) * maxDist * branchStart;

const branchAngle =
baseAngle +
(Math.random() < 0.5 ? 1 : -1) *
(0.4 + Math.random() * 0.5);

const branchDist =
15 +
Math.random() * 20;

const bx2 =
bx +
Math.cos(branchAngle) * branchDist;

const by2 =
by +
Math.sin(branchAngle) * branchDist;

paths +=
`<path d="M ${bx.toFixed(1)} ${by.toFixed(1)} L ${bx2.toFixed(1)} ${by2.toFixed(1)}" stroke="rgba(255,255,255,0.6)" stroke-width="1" fill="none" stroke-linecap="round" />`;

}

}

let shards =
"";

for (
let i = 0;
i < 5;
i++
) {

const a1 =
Math.random() * Math.PI * 2;

const a2 =
a1 +
0.3 +
Math.random() * 0.4;

const r1 =
4 +
Math.random() * 6;

const r2 =
10 +
Math.random() * 14;

const x1 =
centerX + Math.cos(a1) * r1;

const y1 =
centerY + Math.sin(a1) * r1;

const x3 =
centerX + Math.cos((a1 + a2) / 2) * r2 * 1.3;

const y3 =
centerY + Math.sin((a1 + a2) / 2) * r2 * 1.3;

shards +=
`<polygon points="${centerX.toFixed(1)},${centerY.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" />`;

}

const svg =
`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">${shards}${paths}</svg>`;

return {
svg,
centerX,
centerY,
width,
height
};

}

/*

* Punched-glass impact on a card — a quick shake, a white
* flash bursting from the impact point, and cracks spidering
* outward, all wrapping up in well under half a second so
* they read as the moment of impact rather than lingering
* into the fly-to-modal transition. Self-removing: nothing
* is left behind in the DOM after it finishes.
  */

function triggerGlassShatter(
card,
movie
) {

const cover =
card.querySelector(
".movie-cover"
) ||
card.querySelector(
".now-showing-poster-full"
);

if (!cover) {

return;

}

if (movie) {

crackedMovieIds.add(
getMovieId(
movie
)
);

}

const {
svg,
centerX,
centerY,
width,
height
} =
generateCrackSVG();

const impactXPercent =
(centerX / width) * 100;

const impactYPercent =
(centerY / height) * 100;

const overlay =
document.createElement(
"div"
);

overlay.className =
"glass-shatter-overlay";

overlay.innerHTML =
svg;

const flash =
document.createElement(
"div"
);

flash.className =
"glass-shatter-flash";

flash.style.setProperty(
"--impact-x",
`${impactXPercent}%`
);

flash.style.setProperty(
"--impact-y",
`${impactYPercent}%`
);

overlay.appendChild(
flash
);

cover.appendChild(
overlay
);

cover.classList.add(
"punched"
);

setTimeout(
() => {

cover.classList.remove(
"punched"
);

flash.remove();

/*

* Leave the crack SVG itself in place — settling it
* into the same static, no-animation state that
* renderPersistentCrack uses for a freshly-redrawn
* card, so a live "just punched" card and a
* just-rebuilt "already cracked" card end up looking
* identical.
    */

overlay.classList.add(
"settled"
);

},
500
);

}

/*

* Applies a static (no flash, no shake) crack overlay to a
* card that was already punched earlier this session — used
* right after a card is built, before it's ever shown, so a
* re-render never has a flash of "unbroken" glass.
  */

function renderPersistentCrack(
card
) {

const cover =
card.querySelector(
".movie-cover"
) ||
card.querySelector(
".now-showing-poster-full"
);

if (!cover) {

return;

}

const {
svg
} =
generateCrackSVG();

const overlay =
document.createElement(
"div"
);

overlay.className =
"glass-shatter-overlay settled";

overlay.innerHTML =
svg;

cover.appendChild(
overlay
);

}

// =========================================================
// OPEN MOVIE FROM SHELF
// =========================================================

function openMovieFromCard(
movie,
card
) {

if (
isOpening ||
isClosing ||
currentMovie
) {

return;

}

isOpening =
true;

currentMovie =
movie;

/*

* Glass shatter easter egg — fires on Rocky or Creed
* titles, or any movie featuring Sylvester Stallone in the
* cast, whichever franchise it's from (Rambo, Expendables,
* etc). Case-insensitive substring match against the cast
* field. Fires immediately on click, on the card itself,
* before it flies into the modal.
  */

const rockyTitleTriggers =
["rocky", "creed"];

const isRockyOrCreedTitle =
movie.title &&
rockyTitleTriggers.some(
word =>
movie.title
.toLowerCase()
.includes(word)
);

const hasStallone =
movie.cast &&
movie.cast
.toLowerCase()
.includes("stallone");

if (
isRockyOrCreedTitle ||
hasStallone
) {

triggerGlassShatter(
card,
movie
);

}

/*

* Franchise easter egg triggers — Fast & Furious gets a
* spin on open/close plus a family-burst, Batman gets the
* signal sweep plus comic word pops. Both are simple title
* substring checks, computed once here and reused at every
* point in the open/close flow that needs to know which
* (if either) applies to this movie.
  */

const isFastFurious =
movie.title &&
movie.title
.toLowerCase()
.includes("fast & furious");

/*

* Covers the wider Batman/DC universe, not just titles with
* "batman" literally in them — The Dark Knight movies,
* Justice League, Suicide Squad, and The Flash don't contain
* the word "batman" at all, so each needed its own explicit
* check. "dark knight" as a substring catches both The Dark
* Knight and The Dark Knight Rises with one check.
  */

const isBatman =
movie.title &&
(
movie.title
.toLowerCase()
.includes("batman") ||
movie.title
.toLowerCase()
.includes("dark knight") ||
movie.title
.toLowerCase()
.includes("justice league") ||
movie.title
.toLowerCase()
.includes("suicide squad") ||
movie.title
.toLowerCase()
.includes("the flash")
);

/*

* Covers the whole Wizarding World, not just the mainline
* Harry Potter titles — Fantastic Beasts gets the same
* envelope treatment. Variable name stays isHarryPotter
* rather than renaming everywhere it's referenced, but the
* check itself is broader now.
  */

const isHarryPotter =
movie.title &&
(
movie.title
.toLowerCase()
.includes("harry potter") ||
movie.title
.toLowerCase()
.includes("fantastic beasts")
);

/*

* Catalog uses "Mission: Impossible" with a colon - matching
* on "mission" and "impossible" both present, rather than
* the exact punctuation, so this stays correct even if a
* future entry is titled slightly differently.
  */

const isMissionImpossible =
movie.title &&
movie.title
.toLowerCase()
.includes("mission") &&
movie.title
.toLowerCase()
.includes("impossible");

/*

* James Bond movies in the catalog are titled starting with
* "007" (e.g. "007 Skyfall") - checking startsWith rather
* than includes, since "007" appearing anywhere in a title
* is a much more specific signal at the start than it would
* be as a general substring.
  */

const isBond =
movie.title &&
movie.title
.trim()
.toLowerCase()
.startsWith("007");

selectedCard =
card;

// =========================================================
// CAPTURE EXACT CASE POSITION
// =========================================================

/*

* Captured from .movie-cover (the outer wrapper spanning
* both the spine and the poster), not just the poster —
* otherwise the flight animation would only carry the
* poster's ~94% width, visually leaving the spine behind
* for the trip instead of the whole case moving as one
* piece.
  */

const cover =
card.querySelector(
".movie-cover"
) ||
card.querySelector(
".now-showing-poster-full"
);

const coverRect =
cover.getBoundingClientRect();

savedCardRect = {

left:
coverRect.left,

top:
coverRect.top,

width:
coverRect.width,

height:
coverRect.height

};

// =========================================================
// SAVE PAGE POSITION
// =========================================================

savedScrollY =
window.scrollY;

// =========================================================
// LOCK PAGE IN PLACE
// =========================================================

document.body.style.position =
"fixed";

document.body.style.top =
`-${savedScrollY}px`;

document.body.style.left =
"0";

document.body.style.right =
"0";

document.body.style.width =
"100%";

card.blur();

card.classList.add(
"selected"
);

// =========================================================
// PREPARE MOVIE
// =========================================================

populateMovie(
movie
);

// =========================================================
// SHOW MODAL
// =========================================================

modal.classList.remove(
"hidden"
);

modal.style.position =
"fixed";

modal.style.inset =
"0";

modal.style.width =
"100%";

modal.style.height =
"100%";

modal.style.maxWidth =
"none";

modal.style.maxHeight =
"none";

modal.style.padding =
"0";

modal.style.pointerEvents =
"none";

modal.style.opacity =
"1";

// =========================================================
// PREPARE CONTENT
// =========================================================

const content =
modal.querySelector(
".modal-content"
);

const viewer =
modal.querySelector(
".movie-viewer"
);

const controls =
modal.querySelector(
".movie-viewer-controls"
);

if (controls) {

controls.style.opacity =
"0";

controls.style.pointerEvents =
"none";

}

// =========================================================
// MODAL STARTS AT POSTER
// =========================================================

content.style.position =
"fixed";

content.style.margin =
"0";

content.style.padding =
"0";

content.style.maxWidth =
"none";

content.style.maxHeight =
"none";

content.style.width =
`${savedCardRect.width}px`;

content.style.height =
`${savedCardRect.height}px`;

content.style.left =
`${savedCardRect.left}px`;

content.style.top =
`${savedCardRect.top}px`;

content.style.overflow =
"visible";

content.style.border =
"0";

content.style.borderRadius =
"9px";

content.style.background =
"transparent";

content.style.boxShadow =
"none";

content.style.opacity =
"1";

content.style.transform =
"none";

content.style.transition =
"none";

// =========================================================
// VIEWER
// =========================================================

if (viewer) {

viewer.style.width =
"100%";

viewer.style.height =
"100%";

viewer.style.padding =
"0";

viewer.style.gap =
"0";

}

if (flipContainer) {

flipContainer.style.width =
"100%";

flipContainer.style.height =
"100%";

flipContainer.style.maxWidth =
"none";

flipContainer.style.transition =
"none";

}

content.getBoundingClientRect();

// =========================================================
// ANIMATE OPEN
// =========================================================

requestAnimationFrame(
() => {

document.body.classList.add(
"movie-opening"
);

const main =
document.querySelector(
"main"
);

if (main) {

main.style.transform =
"none";

}

/*

* finalWidth was previously only ever capped against
* window.innerWidth, with finalHeight simply following at
* a fixed 1.5x ratio — fine in portrait, where height is
* plentiful, but in landscape on a phone the viewport can
* be barely 375-430px tall while still allowing a width up
* to 420px, producing a case up to 630px tall that badly
* overflows the screen. Computing a width limit from BOTH
* dimensions and taking whichever is smaller keeps the case
* within the actual viewport either way, always preserving
* the 2:3 aspect ratio.
  */

const maxWidthFromViewportWidth =
Math.min(
window.innerWidth *
0.78,
420
);

const maxWidthFromViewportHeight =
(window.innerHeight * 0.78) /
1.5;

const finalWidth =
Math.min(
maxWidthFromViewportWidth,
maxWidthFromViewportHeight
);

const finalHeight =
finalWidth *
1.5;

const finalLeft =
(
window.innerWidth -
finalWidth
) / 2;

const finalTop =
Math.max(
55,
(
window.innerHeight -
finalHeight
) / 2
);

/*

* Harry Potter envelope — triggered right here rather than
* in the post-open setTimeout like the other franchise
* effects, since it needs both the flight's start rect
* (savedCardRect, already captured earlier) and its end
* rect (finalLeft/Top/Width/Height, just computed above) to
* grow in sync with the real case underneath.
  */

if (isHarryPotter) {

triggerHarryPotterEnvelope(
movie,
savedCardRect,
{
left: finalLeft,
top: finalTop,
width: finalWidth,
height: finalHeight
}
);

}

/*

* Mission Impossible self-destruct — same reasoning as the
* Harry Potter envelope above, needs both the start and end
* rects to grow in sync with the real case.
  */

if (isMissionImpossible) {

triggerSelfDestruct(
movie,
savedCardRect,
{
left: finalLeft,
top: finalTop,
width: finalWidth,
height: finalHeight
}
);

}

/*

* James Bond gun-barrel — unlike Harry Potter/Mission
* Impossible, this is a full-screen takeover rather than a
* wrapper that grows with the case, so it doesn't need the
* start/end rects those two use.
  */

if (isBond) {

triggerBondGunBarrel();

}

content.style.transition =
"left 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"top 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"width 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"height 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"box-shadow 0.65s ease, " +
"transform 0.7s cubic-bezier(0.12, 0.75, 0.3, 1)";

content.style.left =
`${finalLeft}px`;

content.style.top =
`${finalTop}px`;

content.style.width =
`${finalWidth}px`;

content.style.height =
`${finalHeight}px`;

content.style.boxShadow =
"0 25px 45px rgba(0,0,0,.65)";

/*

* Fast & Furious spin — 3 full rotations, layered onto the
* same flight transition above via its own 0.7s duration
* (see the transform line just above) rather than slowing
* down the whole flight to match. Was pushed as fast as
* 0.3s earlier and walked back — too fast to actually read
* as a spin at that speed. Settles back at a visually-
* identical 0deg (1080 is a multiple of 360) before the
* longer 0.9s position/size flight finishes.
  */

if (isFastFurious) {

content.style.transform =
"rotate(1080deg)";

}

/*

* Controls/interactivity normally become available once the
* 0.9s flight settles (930ms). For Harry Potter, Mission
* Impossible, and Bond movies, this waits for that
* franchise's full sequence instead — otherwise someone
* could tap the flip button or close the movie while the
* envelope/package/gun-barrel is still visually covering the
* case underneath.
  */

const openSettleDelay =
isHarryPotter
? HP_ENVELOPE_SEQUENCE_DURATION
: isMissionImpossible
? MI_SELF_DESTRUCT_SEQUENCE_DURATION
: isBond
? BOND_SEQUENCE_DURATION
: 930;

setTimeout(
() => {

if (controls) {

controls.style.transition =
"opacity 0.25s ease";

controls.style.opacity =
"1";

controls.style.pointerEvents =
"auto";

}

modal.style.pointerEvents =
"auto";

isOpening =
false;

if (
Math.random() <
nowShowingChance
) {

showNowShowingFrame();

}

/*

* 80s laser sweep — arcade theme only, parallel to the
* Now Showing frame being classic-theme-only, so each
* theme gets its own distinct movie-open flourish rather
* than sharing one. Year is stored as a string, so this
* parses it rather than assuming a number.
  */

const movieYear =
parseInt(
movie.year,
10
);

if (
document.body.classList.contains(
"theme-arcade"
) &&
!Number.isNaN(movieYear) &&
movieYear >= 1980 &&
movieYear <= 1989
) {

triggerLaserSweep();

}

/*

* Fast & Furious family burst — fires alongside the spin
* already applied earlier in this same open sequence (see
* the transform on content.style.transition above). isFastFurious
* was computed once near the top of openMovieFromCard.
  */

if (isFastFurious) {

triggerFamilyBurst();

}

/*

* Batman signal — beam + oval + word pops. isBatman was
* computed once near the top of openMovieFromCard.
  */

if (isBatman) {

triggerBatSignal();

}

},
openSettleDelay
);

}

);

}

// =========================================================
// POPULATE MOVIE INFORMATION
// =========================================================

function populateMovie(
movie
) {

flipContainer.classList.remove(
"flipped"
);

flipButton.textContent =
"Flip case";

modalTitle.textContent =
movie.title;

document.getElementById(
"modal-spine-title"
).textContent =
movie.title;

modalYear.textContent =
movie.year || "";

modalRuntime.textContent =
movie.runtime ||
"Runtime unknown";

modalGenre.textContent =
movie.genre ||
"Genre unknown";

modalSynopsis.textContent =
movie.synopsis ||
"No synopsis added yet.";

modalCast.textContent =
movie.cast ||
"Cast information not added.";

modalDirector.textContent =
movie.director ||
"Director information not added.";

// =========================================================
// LARGE COVER
// =========================================================

const rawIndex =
movies.indexOf(movie);

/*

* movies.indexOf returns -1 for a movie that isn't in the
* real array (like the empty-reservation placeholder) —
* -1 % coverColors.length stays -1 in JavaScript (unlike
* some other languages), and coverColors[-1] is undefined,
* which crashes everything below that reads colors[0]/[1].
* Falling back to a safe index here is what actually fixes
* the "case disappears, nothing opens" bug.
  */

const colorIndex =
rawIndex >= 0
? rawIndex % coverColors.length
: 0;

const colors =
coverColors[
colorIndex
];

/*

* Ties the back's accent bar to the SAME palette this
* card's front cover already uses, so the back reads as
* belonging to that specific movie rather than being
* identical cream regardless of which one you're viewing.
  */

const movieBack =
document.querySelector(
".movie-back"
);

if (movieBack) {

movieBack.style.setProperty(
"--case-accent-start",
colors[0]
);

movieBack.style.setProperty(
"--case-accent-end",
colors[1]
);

}

/*

* Back thumbnail — reuses the exact same poster URL the
* front cover uses, so the back stays recognizable as this
* specific movie. Hidden entirely for movies without a
* poster rather than showing a broken image.
  */

const backThumb =
document.getElementById(
"modal-back-thumb"
);

const backThumbFloat =
document.getElementById(
"back-thumb-float"
);

const backRatedBadge =
document.getElementById(
"modal-rated"
);

if (backThumb && backThumbFloat) {

if (movie.poster) {

backThumb.style.backgroundImage =
`url("${movie.poster}")`;

backThumbFloat.style.display =
"";

} else {

backThumbFloat.style.display =
"none";

}

}

/*

* Rated badge — sits right under the thumbnail, only shown
* when the movie actually has an MPA rating on file. Left
* empty (not "NR") for movies that haven't been through the
* resync yet, since an empty badge disappears entirely (see
* the :empty rule in CSS) rather than showing a value that
* was never actually confirmed.
  */

if (backRatedBadge) {

backRatedBadge.textContent =
movie.rated ||
"";

}

/*

* Barcode number — 0, the real release year, the real TMDB
* id, 0. Falls back to a placeholder digit only if a movie
* is genuinely missing that data, rather than showing
* "undefined".
  */

const barcodeNumberEl =
document.getElementById(
"modal-barcode-number"
);

if (barcodeNumberEl) {

const yearPart =
movie.year || "0000";

const idPart =
movie.tmdbId || "0";

barcodeNumberEl.textContent =
`0 ${yearPart} ${idPart} 0`;

}

modalCover.innerHTML =
"";

if (movie.poster) {

modalCover.style.backgroundImage =
`url("${movie.poster}")`;

modalCover.style.backgroundSize =
"cover";

modalCover.style.backgroundPosition =
"center";

modalCover.style.backgroundRepeat =
"no-repeat";

const overlay =
document.createElement(
"div"
);

overlay.style.position =
"absolute";

overlay.style.inset =
"0";

overlay.style.display =
"flex";

overlay.style.flexDirection =
"column";

overlay.style.justifyContent =
"flex-end";

overlay.style.padding =
"20px";

overlay.style.background =
"linear-gradient(to top, rgba(0,0,0,.8), rgba(0,0,0,0) 60%)";

modalCover.appendChild(
overlay
);

} else {

modalCover.style.backgroundImage =
"";

modalCover.style.background =
`linear-gradient(
145deg,
${colors[0]},
${colors[1]}
)`;

const fallbackTitle =
document.createElement(
"div"
);

fallbackTitle.className =
"poster-fallback-title poster-fallback-title-large";

if (movie.isEmptyReservationPlaceholder) {

fallbackTitle.classList.add(
"empty-reservation-mark-large"
);

fallbackTitle.innerHTML =
`<svg viewBox="0 0 100 150" class="empty-reservation-svg" aria-label="Question mark with a sad face">
<path d="M22 40 Q18 10 50 10 Q82 10 82 40 Q82 62 58 68 Q50 70 50 86" fill="none" stroke="#b8b8b8" stroke-width="12" stroke-linecap="round"/>
<circle cx="50" cy="120" r="19" fill="none" stroke="#b8b8b8" stroke-width="6"/>
<circle cx="42" cy="114" r="2.5" fill="#b8b8b8"/>
<circle cx="58" cy="114" r="2.5" fill="#b8b8b8"/>
<path d="M40 130 Q50 119 60 130" fill="none" stroke="#b8b8b8" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

} else {

fallbackTitle.textContent =
movie.title;

}

modalCover.appendChild(
fallbackTitle
);

}

// =========================================================
// FORMATS
// =========================================================

modalFormats.innerHTML =
"";

const physical =
Array.isArray(movie.physical)
? movie.physical
: [];

const digital =
Array.isArray(movie.digital)
? movie.digital
: [];

/*

* Movies Anywhere and Fandango are prioritized when
* present, rather than just showing whichever 2 happen to
* be listed first in the data. Case-insensitive match since
* the actual data's capitalization isn't guaranteed.
  */

const digitalPriorityOrder =
[
"movies anywhere",
"fandango"
];

const sortedDigital =
[...digital].sort(
(a, b) => {

const aRank =
digitalPriorityOrder.indexOf(
(a || "").toLowerCase()
);

const bRank =
digitalPriorityOrder.indexOf(
(b || "").toLowerCase()
);

const aScore =
aRank === -1
? digitalPriorityOrder.length
: aRank;

const bScore =
bRank === -1
? digitalPriorityOrder.length
: bRank;

return aScore - bScore;

}
);

/*

* Physical shows only the single best version available,
* prioritized 4K, then Blu-ray, then DVD — not every format
* the movie happens to have. Case-insensitive, and matches
* on a substring so "4K Ultra HD" or "Blu-ray Disc" style
* labels still rank correctly.
  */

const physicalPriorityOrder =
[
"4k",
"blu-ray",
"bluray",
"dvd"
];

function physicalRank(
format
) {

const lower =
(format || "")
.toLowerCase();

for (
let i = 0;
i < physicalPriorityOrder.length;
i++
) {

if (
lower.includes(
physicalPriorityOrder[i]
)
) {

return i;

}

}

return physicalPriorityOrder.length;

}

const sortedPhysical =
[...physical].sort(
(a, b) =>
physicalRank(a) -
physicalRank(b)
);

const bestPhysical =
sortedPhysical.length > 0
? [sortedPhysical[0]]
: [];

bestPhysical.forEach(
format => {

const item =
document.createElement(
"div"
);

item.className =
"format-item";

item.textContent =
`💿 Physical — ${format}`;

modalFormats.appendChild(
item
);

}
);

sortedDigital
.slice(0, 2)
.forEach(
service => {

const item =
document.createElement(
"div"
);

item.className =
"format-item";

item.textContent =
`📱 Digital — ${service}`;

modalFormats.appendChild(
item
);

}
);

if (
physical.length === 0 &&
digital.length === 0
) {

const item =
document.createElement(
"div"
);

item.className =
"format-item";

item.textContent =
"No format information added yet.";

modalFormats.appendChild(
item
);

}

// =========================================================
// RESERVATIONS
// =========================================================

/*

* The placeholder "movie" isn't a real reservable title —
* Cast/Director/Formats/Reservations don't apply to it, so
* they're hidden here. Just as important: the ELSE branch
* explicitly restores them for real movies, since the modal
* reuses these same DOM elements across every view rather
* than recreating them — without this, viewing the
* placeholder and then a real movie would leave a real
* movie missing its cast/director/formats/reservations.
  */

const castSection =
modalCast.closest(
".movie-info-section"
);

const directorSection =
modalDirector.closest(
".movie-info-section"
);

const formatsSection =
modalFormats.closest(
".movie-info-section"
);

if (movie.isEmptyReservationPlaceholder) {

if (castSection) {

castSection.style.display =
"none";

}

if (directorSection) {

directorSection.style.display =
"none";

}

if (formatsSection) {

formatsSection.style.display =
"none";

}

const existingPanel =
document.getElementById(
"reservation-panel"
);

if (existingPanel) {

existingPanel.style.display =
"none";

}

/*

* Random preview posters — 4 real movies, so "explore the
* collection below" actually has something below it to
* point at.
  */

const collectionPreview =
document.getElementById(
"collection-preview"
);

if (collectionPreview) {

collectionPreview.innerHTML =
"";

collectionPreview.style.display =
"flex";

const eligibleForPreview =
movies.filter(
m =>
!m.isEmptyReservationPlaceholder
);

const shuffled =
[...eligibleForPreview].sort(
() =>
Math.random() - 0.5
);

const previewMovies =
shuffled.slice(0, 4);

previewMovies.forEach(
previewMovie => {

const thumb =
document.createElement(
"div"
);

thumb.className =
"preview-poster";

if (previewMovie.poster) {

thumb.style.backgroundImage =
`url("${previewMovie.poster}")`;

} else {

const previewColors =
coverColors[
movies.indexOf(previewMovie) %
coverColors.length
];

thumb.style.background =
`linear-gradient(145deg, ${previewColors[0]}, ${previewColors[1]})`;

}

collectionPreview.appendChild(
thumb
);

}
);

}

} else {

if (castSection) {

castSection.style.display =
"";

}

if (directorSection) {

directorSection.style.display =
"";

}

if (formatsSection) {

formatsSection.style.display =
"";

}

const existingPanel =
document.getElementById(
"reservation-panel"
);

if (existingPanel) {

existingPanel.style.display =
"";

}

createReservationPanel();

updateReservationPanel(
movie
);

const collectionPreview =
document.getElementById(
"collection-preview"
);

if (collectionPreview) {

collectionPreview.innerHTML =
"";

collectionPreview.style.display =
"none";

}

}

}

// =========================================================
// CLOSE MOVIE
// =========================================================

function closeMovie() {

if (
!currentMovie ||
isClosing ||
isOpening
) {

return;

}

isClosing =
true;

hideNowShowingFrame();

const content =
modal.querySelector(
".modal-content"
);

/*

* "That's all, Folks!" only plays while Animated: Only is
* the active filter - otherwise the movie just closes
* normally, same as it always did before this effect
* existed.
  */

const irisActive =
activeFilters.animated === "only";

if (irisActive) {

const caseRectForIris =
content.getBoundingClientRect();

triggerIrisClose(
caseRectForIris
);

}

const targetRect =
savedCardRect;

if (!targetRect) {

finishCloseMovie();

return;

}

const controls =
modal.querySelector(
".movie-viewer-controls"
);

if (controls) {

controls.style.opacity =
"0";

controls.style.pointerEvents =
"none";

}

/*

* When the iris is active, the actual fly-back is delayed
* until it has fully closed (1000ms - see triggerIrisClose/
* animateIrisRadius), and the case itself is made invisible
* for the duration of that hidden transit (opacity:0, reset
* by finishCloseMovie below) rather than trying to size the
* iris overlay to cover the whole travel path — that made
* the overlay bigger than just the case, which wasn't the
* ask. Since the case is genuinely invisible during the
* move, it doesn't matter where on screen it travels;
* nothing can peek out. The iris re-opens on the case's
* original (small) rect once the case has already quietly
* settled onto the shelf underneath.
*
* When the iris isn't active, none of this applies - the
* fly-back starts immediately with no delay and the case
* stays visible the whole time, exactly as before.
  */

const flyBackDelay =
irisActive
? 1000
: 0;

setTimeout(
() => {

if (irisActive) {

content.style.opacity =
"0";

}

// =========================================================
// ANIMATE BACK TO ORIGINAL POSTER POSITION
// =========================================================

content.style.transition =
"left 0.55s cubic-bezier(0.4, 0, 0.8, 0.2), " +
"top 0.55s cubic-bezier(0.4, 0, 0.8, 0.2), " +
"width 0.55s cubic-bezier(0.4, 0, 0.8, 0.2), " +
"height 0.55s cubic-bezier(0.4, 0, 0.8, 0.2), " +
"box-shadow 0.45s ease, " +
"transform 0.5s cubic-bezier(0.4, 0, 0.6, 1)";

content.style.left =
`${targetRect.left}px`;

content.style.top =
`${targetRect.top}px`;

content.style.width =
`${targetRect.width}px`;

content.style.height =
`${targetRect.height}px`;

content.style.boxShadow =
"0 6px 12px rgba(0,0,0,.35)";

/*

* Fast & Furious burnout — spins the opposite direction
* while shrinking back to the shelf. Title is checked
* against currentMovie here since that's still set at this
* point in the close flow — it isn't cleared until
* finishCloseMovie further down.
  */

const closingIsFastFurious =
currentMovie &&
currentMovie.title &&
currentMovie.title
.toLowerCase()
.includes("fast & furious");

if (closingIsFastFurious) {

content.style.transform =
"rotate(-720deg)";

}

setTimeout(
() => {

finishCloseMovie();

},
580
);

},
flyBackDelay
);

}

// =========================================================
// FINISH CLOSE
// =========================================================

function finishCloseMovie() {

const content =
modal.querySelector(
".modal-content"
);

document.body.classList.remove(
"movie-opening"
);

const main =
document.querySelector(
"main"
);

if (main) {

main.style.transform =
"";

}

modal.classList.add(
"hidden"
);

// =========================================================
// RESET MODAL
// =========================================================

content.style.position =
"";

content.style.margin =
"";

content.style.padding =
"";

content.style.maxWidth =
"";

content.style.maxHeight =
"";

content.style.width =
"";

content.style.height =
"";

content.style.left =
"";

content.style.top =
"";

content.style.overflow =
"";

content.style.border =
"";

content.style.borderRadius =
"";

content.style.background =
"";

content.style.boxShadow =
"";

content.style.opacity =
"";

content.style.transform =
"";

content.style.transition =
"";

// =========================================================
// RESET VIEWER
// =========================================================

const viewer =
modal.querySelector(
".movie-viewer"
);

if (viewer) {

viewer.style.width =
"";

viewer.style.height =
"";

viewer.style.padding =
"";

viewer.style.gap =
"";

}

if (flipContainer) {

flipContainer.style.width =
"";

flipContainer.style.height =
"";

flipContainer.style.maxWidth =
"";

flipContainer.style.transition =
"";

}

// =========================================================
// RESET CONTROLS
// =========================================================

const controls =
modal.querySelector(
".movie-viewer-controls"
);

if (controls) {

controls.style.opacity =
"";

controls.style.pointerEvents =
"";

controls.style.transition =
"";

}

// =========================================================
// UNLOCK PAGE
// =========================================================

document.body.style.position =
"";

document.body.style.top =
"";

document.body.style.left =
"";

document.body.style.right =
"";

document.body.style.width =
"";

window.scrollTo(
0,
savedScrollY
);

// =========================================================
// CLEAR OLD CARD
// =========================================================

const closedCard =
selectedCard;

const closedMovie =
currentMovie;

if (selectedCard) {

selectedCard.classList.remove(
"selected"
);

}

// =========================================================
// CLEAR STATE
// =========================================================

selectedCard =
null;

currentMovie =
null;

savedCardRect =
null;

isClosing =
false;

/*

* The shelf used to do a full renderMovies() here on every
* single close — rebuilding all ~900+ cards from scratch,
* including every poster's background-image, even though
* nothing about the shelf actually changed. Measured at
* 50-60ms of pure JS on a fast desktop browser before even
* counting the paint/decode work the browser does
* afterward, which is almost certainly the real source of
* the "delay then blink" on slower hardware like tablets.

* The one thing that DOES sometimes need to show up
* immediately is the glass-shatter crack, if this viewing
* happened to trigger it (a Rocky/Stallone movie). That only
* ever affects the ONE card just closed, so it's updated
* directly instead of rebuilding everything else around it.
  */

if (
closedCard &&
closedMovie &&
crackedMovieIds.has(
getMovieId(
closedMovie
)
) &&
!closedCard.querySelector(
".glass-shatter-overlay"
)
) {

renderPersistentCrack(
closedCard
);

}

}

// =========================================================
// FLIP CASE
// =========================================================

function flipMovie() {

if (
isOpening ||
isClosing ||
!currentMovie
) {

return;

}

flipContainer.classList.toggle(
"flipped"
);

if (
flipContainer.classList.contains(
"flipped"
)
) {

flipButton.textContent =
"Flip back";

} else {

flipButton.textContent =
"Flip case";

}

}

flipButton.addEventListener(
"click",
event => {

event.stopPropagation();

flipMovie();

}
);

// =========================================================
// CLOSE BUTTON
// =========================================================

modalClose.addEventListener(
"click",
closeMovie
);

// =========================================================
// CLICK BACKDROP
// =========================================================

document.querySelector(
".modal-backdrop"
).addEventListener(
"click",
closeMovie
);

// =========================================================
// ESCAPE KEY
// =========================================================

document.addEventListener(
"keydown",
event => {

if (
event.key === "Escape" &&
currentMovie &&
!isOpening &&
!isClosing
) {

closeMovie();

}

}
);

// =========================================================
// PI EASTER EGG
// =========================================================

/*

* Pi -> Matrix-style falling code -> Sandra Bullock movies
* (a nod to The Net). Deliberately bypasses the normal
* activeFilters system rather than adding a permanent
* "actor filter" dimension to it — this is a one-off fun
* surprise, not a real filter state, so the next normal
* filter interaction correctly restores the real view.
  */

// =========================================================
// REWIND EFFECT
// =========================================================

/*

* Fires when a filter resets back to "all" — Type toggling
* off, or Genre going back to All Genres. Guarded against
* overlapping itself if triggered again mid-animation.
  */

let rewindEffectBusy =
false;

function triggerRewindEffect() {

const rewindOverlay =
document.getElementById(
"rewind-overlay"
);

if (!rewindOverlay || rewindEffectBusy) {

return;

}

rewindEffectBusy =
true;

rewindOverlay.classList.remove(
"active"
);

void rewindOverlay.offsetWidth;

rewindOverlay.classList.add(
"active"
);

setTimeout(
() => {

rewindOverlay.classList.remove(
"active"
);

rewindEffectBusy =
false;

},
1600
);

}

/*

* TV color bars — classic SMPTE-style vertical bars, fired
* when switching to the TV type filter. Colors match the
* real broadcast test pattern order (white, yellow, cyan,
* green, magenta, red, blue). Guarded the same way as the
* rewind effect, against overlapping itself if triggered
* again mid-animation.
  */

const TV_COLOR_BARS =
[
"#c0c0c0",
"#c0c000",
"#00c0c0",
"#00c000",
"#c000c0",
"#c00000",
"#0000c0"
];

let colorBarsBusy =
false;

function triggerColorBars() {

if (colorBarsBusy) {

return;

}

colorBarsBusy =
true;

const overlay =
document.createElement(
"div"
);

overlay.className =
"tv-color-bars-overlay";

TV_COLOR_BARS.forEach(
color => {

const bar =
document.createElement(
"div"
);

bar.className =
"tv-color-bar";

bar.style.background =
color;

overlay.appendChild(
bar
);

}
);

const staticOverlay =
document.createElement(
"div"
);

staticOverlay.className =
"tv-color-bars-static";

overlay.appendChild(
staticOverlay
);

document.body.appendChild(
overlay
);

setTimeout(
() => {

overlay.remove();

colorBarsBusy =
false;

},
1800
);

}

/*

* Christmas lights — fires when the Christmas category
* filter is selected. 8 strands spread across the full
* screen height, each following a natural sag curve rather
* than a straight line, C9 bulbs in the classic 4-color
* rotation twinkling independently.
  */

const CHRISTMAS_BULB_COLORS =
[
{ fill: "#ff3b30", glow: "rgba(255,59,48,0.7)" },
{ fill: "#34c759", glow: "rgba(52,199,89,0.7)" },
{ fill: "#3399ff", glow: "rgba(51,153,255,0.7)" },
{ fill: "#ffcc00", glow: "rgba(255,204,0,0.7)" }
];

function christmasSpiralPoint(
cx,
cy,
angleDeg,
radius
) {

const rad =
angleDeg * Math.PI / 180;

return {
x: cx + radius * Math.cos(rad),
y: cy + radius * Math.sin(rad)
};

}

function buildChristmasStrand(
svg,
overlay,
vw,
y0,
y1,
sagAmount,
bulbCount,
colorOffset
) {

const x0 = -20;
const x1 = vw + 20;
const cx = vw / 2;
const cy = Math.min(y0, y1) + sagAmount;

const path =
document.createElementNS(
"http://www.w3.org/2000/svg",
"path"
);

const d =
`M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;

path.setAttribute("d", d);
path.setAttribute("stroke", "#2a2a2a");
path.setAttribute("stroke-width", "2");
path.setAttribute("fill", "none");

svg.appendChild(
path
);

function quadPoint(t) {

const mt = 1 - t;

return {
x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1
};

}

for (
let i = 0;
i < bulbCount;
i++
) {

const t = (i + 0.5) / bulbCount;
const pt = quadPoint(t);
const color = CHRISTMAS_BULB_COLORS[(i + colorOffset) % CHRISTMAS_BULB_COLORS.length];

const bulb =
document.createElement(
"div"
);

bulb.className =
"christmas-bulb";

const size =
16 + Math.random() * 4;

bulb.style.width =
`${size}px`;

bulb.style.height =
`${size * 1.3}px`;

bulb.style.left =
`${pt.x}px`;

bulb.style.top =
`${pt.y + 6}px`;

bulb.style.background =
`radial-gradient(circle at 35% 30%, #fff, ${color.fill} 60%, ${color.fill} 100%)`;

bulb.style.boxShadow =
`0 0 8px 2px ${color.glow}`;

bulb.style.zIndex =
"2";

bulb.style.animation =
`christmas-bulb-twinkle ${1.4 + Math.random() * 1.6}s ease-in-out infinite`;

bulb.style.animationDelay =
`${Math.random() * 2}s`;

const glow =
document.createElement(
"div"
);

glow.className =
"christmas-bulb-glow";

glow.style.background =
`radial-gradient(circle, ${color.glow}, transparent 70%)`;

bulb.appendChild(
glow
);

overlay.appendChild(
bulb
);

}

}

let christmasLightsBusy =
false;

function triggerChristmasLights() {

if (christmasLightsBusy) {

return;

}

christmasLightsBusy =
true;

const overlay =
document.createElement(
"div"
);

overlay.className =
"christmas-lights-overlay";

const vw =
window.innerWidth;

const vh =
window.innerHeight;

const svg =
document.createElementNS(
"http://www.w3.org/2000/svg",
"svg"
);

svg.setAttribute(
"width",
"100%"
);

svg.setAttribute(
"height",
"100%"
);

svg.style.position =
"absolute";

svg.style.inset =
"0";

svg.style.zIndex =
"1";

overlay.appendChild(
svg
);

/*

* 8 strands spread proportionally across the full viewport
* height, each with varied sag/bulb count for a naturally
* messy look rather than identical repeated rows.
  */

const rows =
[
[0.02, 0.05, 0.05, 13, 0],
[0.07, 0.04, 0.06, 12, 2],
[0.12, 0.16, 0.06, 13, 1],
[0.20, 0.16, 0.06, 12, 3],
[0.23, 0.28, 0.065, 14, 0],
[0.32, 0.27, 0.06, 12, 2],
[0.35, 0.41, 0.065, 13, 1],
[0.46, 0.41, 0.06, 12, 3]
];

rows.forEach(
row => {

buildChristmasStrand(
svg,
overlay,
vw,
row[0] * vh,
row[1] * vh,
row[2] * vh,
row[3],
row[4]
);

}
);

document.body.appendChild(
overlay
);

requestAnimationFrame(
() => {

overlay.classList.add(
"visible"
);

}
);

setTimeout(
() => {

overlay.classList.remove(
"visible"
);

setTimeout(
() => {

overlay.remove();

christmasLightsBusy =
false;

},
600
);

},
4000
);

}

/*

* Baseball scoreboard — fires when the Baseball category
* filter is selected. Wrigley-style manual scoreboard,
* Cubs blowing out the Brewers, same pop-in/pop-out
* mechanic as the Batman word pops.
  */

const BASEBALL_MIL_INNINGS =
[0, 0, 0, 0, 1, 0, 0, 0, 0];

const BASEBALL_MIL_RHE =
[1, 4, 2];

const BASEBALL_CHC_INNINGS =
[2, 0, 3, 0, 4, 0, 1, 2, "X"];

const BASEBALL_CHC_RHE =
[12, 15, 0];

let baseballScoreboardBusy =
false;

function buildScoreboardRow(
row,
innings,
rhe
) {

innings.forEach(
val => {

const cell =
document.createElement(
"div"
);

cell.className =
"sb-cell";

cell.innerHTML =
`<div class="sb-cell-value">${val}</div>`;

row.appendChild(
cell
);

}
);

const spacer =
document.createElement(
"div"
);

row.appendChild(
spacer
);

rhe.forEach(
val => {

const cell =
document.createElement(
"div"
);

cell.className =
"sb-cell rhe";

cell.innerHTML =
`<div class="sb-cell-value">${val}</div>`;

row.appendChild(
cell
);

}
);

}

/*

* One firework burst at a specific screen position - a
* radial spray of small colored particles that expand
* outward, droop slightly (gravity), and fade. Shared helper
* so the baseball scoreboard can fire a few of these at
* staggered times/positions.
  */

const FIREWORK_COLORS =
[
"#ffd23f",
"#ff4d6d",
"#4dd9ff",
"#7cff4d",
"#ff9d2f",
"#ff2fd1",
"#ffffff"
];

function triggerFireworkBurst(
x,
y
) {

const burst =
document.createElement(
"div"
);

burst.className =
"firework-burst";

burst.style.left =
`${x}px`;

burst.style.top =
`${y}px`;

const color =
FIREWORK_COLORS[
Math.floor(
Math.random() *
FIREWORK_COLORS.length
)
];

const particleCount =
26;

for (
let i = 0;
i < particleCount;
i++
) {

const particle =
document.createElement(
"div"
);

particle.className =
"firework-particle";

const size =
4 + Math.random() * 3;

particle.style.width =
`${size}px`;

particle.style.height =
`${size}px`;

particle.style.background =
color;

particle.style.boxShadow =
`0 0 6px 1px ${color}`;

const angle =
(i / particleCount) *
Math.PI * 2 +
(Math.random() * 0.2 - 0.1);

const dist =
60 + Math.random() * 70;

particle.style.setProperty(
"--fx",
`${Math.cos(angle) * dist}px`
);

particle.style.setProperty(
"--fy",
`${Math.sin(angle) * dist}px`
);

particle.style.animationDuration =
`${0.9 + Math.random() * 0.4}s`;

burst.appendChild(
particle
);

}

document.body.appendChild(
burst
);

setTimeout(
() => {

burst.remove();

},
1400
);

}

function triggerBaseballScoreboard() {

if (baseballScoreboardBusy) {

return;

}

baseballScoreboardBusy =
true;

const wrap =
document.createElement(
"div"
);

wrap.className =
"baseball-scoreboard-wrap";

const board =
document.createElement(
"div"
);

board.className =
"baseball-scoreboard";

const headerRow =
document.createElement(
"div"
);

headerRow.className =
"sb-header-row";

headerRow.innerHTML =
`<div class="sb-header-cell"></div>
<div class="sb-header-cell">1</div>
<div class="sb-header-cell">2</div>
<div class="sb-header-cell">3</div>
<div class="sb-header-cell">4</div>
<div class="sb-header-cell">5</div>
<div class="sb-header-cell">6</div>
<div class="sb-header-cell">7</div>
<div class="sb-header-cell">8</div>
<div class="sb-header-cell">9</div>
<div class="sb-header-cell"></div>
<div class="sb-header-cell">R</div>
<div class="sb-header-cell">H</div>
<div class="sb-header-cell">E</div>`;

board.appendChild(
headerRow
);

const milRow =
document.createElement(
"div"
);

milRow.className =
"sb-row";

milRow.innerHTML =
`<div class="sb-team-label">MIL</div>`;

buildScoreboardRow(
milRow,
BASEBALL_MIL_INNINGS,
BASEBALL_MIL_RHE
);

board.appendChild(
milRow
);

const divider =
document.createElement(
"div"
);

divider.style.height =
"8px";

board.appendChild(
divider
);

const chcRow =
document.createElement(
"div"
);

chcRow.className =
"sb-row";

chcRow.innerHTML =
`<div class="sb-team-label">CHC</div>`;

buildScoreboardRow(
chcRow,
BASEBALL_CHC_INNINGS,
BASEBALL_CHC_RHE
);

board.appendChild(
chcRow
);

wrap.appendChild(
board
);

document.body.appendChild(
wrap
);

requestAnimationFrame(
() => {

wrap.classList.add(
"visible"
);

}
);

/*

* A few fireworks bursts at random positions around the
* screen, staggered so they don't all pop at once - kept out
* of the center third both horizontally and vertically so
* they don't land on top of the scoreboard itself.
  */

const vw =
window.innerWidth;

const vh =
window.innerHeight;

const fireworkCount =
4;

for (
let i = 0;
i < fireworkCount;
i++
) {

let fx;
let fy;

do {

fx = vw * 0.1 + Math.random() * vw * 0.8;
fy = vh * 0.1 + Math.random() * vh * 0.75;

} while (
fx > vw * 0.32 &&
fx < vw * 0.68 &&
fy > vh * 0.3 &&
fy < vh * 0.7
);

setTimeout(
() => {

triggerFireworkBurst(
fx,
fy
);

},
200 + i * 450 + Math.random() * 250
);

}

setTimeout(
() => {

wrap.classList.remove(
"visible"
);

setTimeout(
() => {

wrap.remove();

baseballScoreboardBusy =
false;

},
500
);

},
3000
);

}

/*

* Action — bullet holes with radiating cracks, reusing the
* same "sudden impact mark" concept as the glass-shatter
* effect. No flash/glow, just the hole itself.
  */

function makeBulletHoleSVG() {

return `<svg viewBox="0 0 100 100" width="100%" height="100%">
<circle cx="50" cy="50" r="16" fill="#1a1512"/>
<circle cx="50" cy="50" r="16" fill="none" stroke="#3a2f28" stroke-width="3"/>
<path d="M50,34 L30,5 M50,34 L14,18 M66,38 L95,8 M68,50 L98,46 M62,64 L84,94 M42,66 L22,96 M34,50 L4,58" stroke="#2a221d" stroke-width="2.5" fill="none" opacity="0.8"/>
</svg>`;

}

let actionBulletsBusy =
false;

function triggerActionBullets() {

if (actionBulletsBusy) {

return;

}

actionBulletsBusy =
true;

const vw =
window.innerWidth;

const vh =
window.innerHeight;

const holes =
[];

/*

* Phase 1 - scatter: random positions across the screen,
* same as before, staggered at a moderate pace.
  */

const scatterCount =
18;

for (
let i = 0;
i < scatterCount;
i++
) {

const hole =
document.createElement(
"div"
);

hole.className =
"bullet-hole";

hole.style.left =
`${20 + Math.random() * (vw - 60)}px`;

hole.style.top =
`${20 + Math.random() * (vh - 60)}px`;

hole.innerHTML =
makeBulletHoleSVG();

document.body.appendChild(
hole
);

holes.push(
hole
);

setTimeout(
() => {

hole.classList.add(
"visible"
);

},
150 + i * 120
);

}

/*

* Phase 2 - chain: a fast diagonal strafing line of holes,
* starting once the scatter phase finishes, each with a
* little perpendicular jitter so it doesn't look like a
* perfectly straight ruled line.
  */

const chainCount =
14;

const chainStartDelay =
150 + scatterCount * 120 + 300;

const chainStartX =
vw * (0.05 + Math.random() * 0.15);

const chainStartY =
vh * (0.15 + Math.random() * 0.15);

const chainEndX =
vw * (0.8 + Math.random() * 0.15);

const chainEndY =
vh * (0.75 + Math.random() * 0.15);

for (
let i = 0;
i < chainCount;
i++
) {

const t =
i / (chainCount - 1);

const baseX =
chainStartX + (chainEndX - chainStartX) * t;

const baseY =
chainStartY + (chainEndY - chainStartY) * t;

const jitterX =
(Math.random() - 0.5) * vw * 0.05;

const jitterY =
(Math.random() - 0.5) * vh * 0.05;

const hole =
document.createElement(
"div"
);

hole.className =
"bullet-hole";

hole.style.left =
`${baseX + jitterX}px`;

hole.style.top =
`${baseY + jitterY}px`;

hole.innerHTML =
makeBulletHoleSVG();

document.body.appendChild(
hole
);

holes.push(
hole
);

setTimeout(
() => {

hole.classList.add(
"visible"
);

},
chainStartDelay + i * 70
);

}

setTimeout(
() => {

holes.forEach(
h => h.remove()
);

actionBulletsBusy =
false;

},
chainStartDelay + chainCount * 70 + 800
);

}

/*

* Comedy — "Ha!" texts that genuinely bounce around the
* screen (DVD-logo style), reusing the Batman comic-word
* styling.
  */

const COMEDY_WORDS =
["Ha!", "Ha ha!", "Ha!", "Haha!", "Ha!", "Ha ha ha!", "Ha!", "Haha!", "Ha ha!", "Ha!", "Hahaha!"];

let comedyHahaBusy =
false;

function triggerComedyHaha() {

if (comedyHahaBusy) {

return;

}

comedyHahaBusy =
true;

const vw =
window.innerWidth;

const vh =
window.innerHeight;

const activeEls =
[];

const timers =
[];

COMEDY_WORDS.forEach(
word => {

const el =
document.createElement(
"div"
);

el.className =
"haha-pop";

el.style.fontSize =
`${Math.min(30, vw * 0.04)}px`;

el.textContent =
word;

let x =
40 + Math.random() * (vw - 160);

let y =
40 + Math.random() * (vh - 140);

let vx =
(2.5 + Math.random() * 1.5) *
(Math.random() < 0.5 ? 1 : -1);

let vy =
(2 + Math.random() * 1.5) *
(Math.random() < 0.5 ? 1 : -1);

el.style.left =
`${x}px`;

el.style.top =
`${y}px`;

el.style.opacity =
"1";

document.body.appendChild(
el
);

activeEls.push(
el
);

let frame =
0;

const maxFrames =
160;

const interval =
setInterval(
() => {

frame++;

x += vx;
y += vy;

const w =
el.offsetWidth;

const h =
el.offsetHeight;

if (x <= 0 || x + w >= vw) {

vx *= -1;

x = Math.max(
0,
Math.min(x, vw - w)
);

}

if (y <= 0 || y + h >= vh) {

vy *= -1;

y = Math.max(
0,
Math.min(y, vh - h)
);

}

el.style.left =
`${x}px`;

el.style.top =
`${y}px`;

if (frame > maxFrames - 30) {

el.style.opacity =
`${Math.max(0, (maxFrames - frame) / 30)}`;

}

if (frame >= maxFrames) {

clearInterval(
interval
);

el.remove();

}

},
16
);

timers.push(
interval
);

}
);

setTimeout(
() => {

timers.forEach(
t => clearInterval(t)
);

activeEls.forEach(
e => e.remove()
);

comedyHahaBusy =
false;

},
3000
);

}

/*

* Drama — many small teardrop particles falling like rain,
* point-up/bulb-down orientation (confirmed correct via
* isolated testing after an earlier version had it backwards).
  */

let dramaTearsBusy =
false;

function triggerDramaTears() {

if (dramaTearsBusy) {

return;

}

dramaTearsBusy =
true;

const vh =
window.innerHeight;

const count =
22;

const drops =
[];

for (
let i = 0;
i < count;
i++
) {

const drop =
document.createElement(
"div"
);

drop.className =
"teardrop-particle";

const size =
7 + Math.random() * 6;

drop.style.width =
`${size}px`;

drop.style.height =
`${size * 1.3}px`;

/*

* Was a flat random spread across the full width (read as
* generic rain, not tears). Now concentrated around two
* "eye" zones at 35% and 65% width, each with a modest
* spread of its own, so it reads as falling from two eyes
* rather than scattered evenly across the screen.
  */

const eyeZones =
[35, 65];

const zoneCenter =
eyeZones[
Math.floor(
Math.random() * eyeZones.length
)
];

const zoneOffset =
(Math.random() - 0.5) * 12;

drop.style.left =
`${zoneCenter + zoneOffset}%`;

drop.style.setProperty(
"--fall-distance",
`${vh + 60}px`
);

drop.style.animationDuration =
`${3.2 + Math.random() * 1.6}s`;

drop.style.animationDelay =
`${Math.random() * 1.8}s`;

document.body.appendChild(
drop
);

drops.push(
drop
);

}

setTimeout(
() => {

drops.forEach(
d => d.remove()
);

dramaTearsBusy =
false;

},
6800
);

}

/*

* Horror — a slash draws itself across the screen fast, then
* blood drips fall from points measured directly off the
* actual slash path (getPointAtLength), not hardcoded
* guesses - confirmed accurate to sub-pixel precision across
* multiple viewport sizes.
  */

let horrorSlashBusy =
false;

function triggerHorrorSlash() {

if (horrorSlashBusy) {

return;

}

horrorSlashBusy =
true;

const vw =
window.innerWidth;

const vh =
window.innerHeight;

const overlay =
document.createElement(
"div"
);

overlay.className =
"slash-svg-overlay";

const x0 =
vw * 0.08;

const y0 =
vh * 0.12;

const x1 =
vw * 0.92;

const y1 =
vh * 0.82;

const midX =
vw * 0.5;

const midY =
(y0 + y1) / 2 + vh * 0.08;

const d =
`M ${x0},${y0} Q ${midX},${midY} ${x1},${y1}`;

overlay.innerHTML =
`<svg width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}">
<path id="horror-slash-path" class="slash-path-line" d="${d}"
style="stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: horror-slash-draw 0.35s cubic-bezier(0.6,0,0.4,1) forwards;"/>
</svg>`;

const styleTag =
document.createElement(
"style"
);

styleTag.textContent =
`@keyframes horror-slash-draw { to { stroke-dashoffset: 0; } }`;

document.head.appendChild(
styleTag
);

document.body.appendChild(
overlay
);

const drips =
[];

setTimeout(
() => {

const path =
document.getElementById(
"horror-slash-path"
);

const pathLength =
path.getTotalLength();

const svgEl =
overlay.querySelector(
"svg"
);

const svgRect =
svgEl.getBoundingClientRect();

const scaleX =
svgRect.width / vw;

const scaleY =
svgRect.height / vh;

const fractions =
[0.08, 0.24, 0.31, 0.5, 0.66, 0.84];

fractions.forEach(
(frac, i) => {

const pt =
path.getPointAtLength(
pathLength * frac
);

const drip =
document.createElement(
"div"
);

drip.className =
"slash-drip-particle";

drip.style.left =
`${svgRect.left + pt.x * scaleX}px`;

drip.style.top =
`${svgRect.top + pt.y * scaleY}px`;

document.body.appendChild(
drip
);

drips.push(
drip
);

setTimeout(
() => {

drip.classList.add(
"visible"
);

drip.style.height =
`${50 + Math.random() * 70}px`;

},
i * 150
);

}
);

},
350
);

setTimeout(
() => {

overlay.remove();

styleTag.remove();

drips.forEach(
d => d.remove()
);

horrorSlashBusy =
false;

},
2600
);

}

/*

* Thriller — screen darkens, a flashlight-style beam sweeps
* across once, with a faint red heartbeat pulse underneath.
  */

let thrillerFlashlightBusy =
false;

function triggerThrillerFlashlight() {

if (thrillerFlashlightBusy) {

return;

}

thrillerFlashlightBusy =
true;

const vw =
window.innerWidth;

const darken =
document.createElement(
"div"
);

darken.className =
"thriller-darken-overlay";

document.body.appendChild(
darken
);

const pulse =
document.createElement(
"div"
);

pulse.className =
"thriller-pulse-overlay";

document.body.appendChild(
pulse
);

const beam =
document.createElement(
"div"
);

beam.className =
"thriller-beam-overlay";

const beamWidth =
Math.max(
120,
vw * 0.18
);

beam.style.width =
`${beamWidth}px`;

beam.style.left =
`${-beamWidth - 40}px`;

beam.style.transition =
"none";

document.body.appendChild(
beam
);

requestAnimationFrame(
() => {

darken.classList.add(
"visible"
);

}
);

setTimeout(
() => {

beam.style.transition =
"left 2.4s linear";

beam.style.left =
`${vw + beamWidth}px`;

},
300
);

setTimeout(
() => {

darken.classList.remove(
"visible"
);

},
3400
);

setTimeout(
() => {

darken.remove();

pulse.remove();

beam.remove();

thrillerFlashlightBusy =
false;

},
4000
);

}

/*

* Birthday celebration — fires once per session on specific
* dates (see BIRTHDAY_LIST and BIRTHDAY_CONFETTI_COLORS
* above), checked and triggered from the page-load
* INITIALIZE block further down. Dismissable by clicking
* anywhere, or auto-fades on its own after several seconds
* either way.
  */

function triggerBirthdayCelebration(
name
) {

const overlay =
document.createElement(
"div"
);

overlay.className =
"birthday-overlay";

const bannerStrip =
document.createElement(
"div"
);

bannerStrip.className =
"birthday-banner-strip";

const banner =
document.createElement(
"div"
);

banner.className =
"birthday-banner";

const bannerText =
`Happy Birthday ${name}!`;

/*

* Font-size computed from the actual text length now, not a
* fixed viewport ratio — the banner is a single no-wrap line
* stretching the full screen width now, so a longer name
* needs a smaller size to still fit, and a short one can run
* bigger. 0.62 is an estimated average character width ratio
* for Bangers, a fairly condensed display font.
  */

const bannerFontSize =
Math.min(
90,
(window.innerWidth * 0.86) /
(bannerText.length * 0.62)
);

banner.style.fontSize =
`${bannerFontSize}px`;

banner.textContent =
bannerText;

/*

* The strip had left/right/top set but no height at all,
* which collapsed it to 0px tall — completely invisible
* despite otherwise-correct positioning, opacity, and
* background. Sized here off the text's own font-size so it
* always reads as a proper ribbon behind the banner, not a
* fixed guess that might run too short or too tall.
  */

bannerStrip.style.height =
`${bannerFontSize * 1.5}px`;

overlay.appendChild(
bannerStrip
);

overlay.appendChild(
banner
);

const balloonCount =
18;

for (
let i = 0;
i < balloonCount;
i++
) {

const balloon =
document.createElement(
"div"
);

balloon.className =
"birthday-balloon";

const color =
BIRTHDAY_CONFETTI_COLORS[
i % BIRTHDAY_CONFETTI_COLORS.length
];

const size =
58 +
Math.random() * 40;

balloon.style.width =
`${size}px`;

balloon.style.height =
`${size * 1.2}px`;

balloon.style.left =
`${5 + (i / balloonCount) * 90 + (Math.random() * 6 - 3)}%`;

balloon.style.background =
`radial-gradient(circle at 35% 30%, ${color}, ${color}dd 70%)`;

balloon.style.setProperty(
"--rise",
`${-(115 + Math.random() * 15)}vh`
);

balloon.style.setProperty(
"--drift",
`${Math.random() * 80 - 40}px`
);

balloon.style.setProperty(
"--wobble",
`${Math.random() * 16 - 8}deg`
);

balloon.style.animationDuration =
`${5 + Math.random() * 2.5}s`;

balloon.style.animationDelay =
`${Math.random() * 1.2}s`;

overlay.appendChild(
balloon
);

}

const confettiCount =
110;

for (
let i = 0;
i < confettiCount;
i++
) {

const piece =
document.createElement(
"div"
);

piece.className =
"birthday-confetti";

const color =
BIRTHDAY_CONFETTI_COLORS[
Math.floor(
Math.random() *
BIRTHDAY_CONFETTI_COLORS.length
)
];

const width =
8 +
Math.random() * 8;

piece.style.width =
`${width}px`;

piece.style.height =
`${width * 0.4}px`;

piece.style.background =
color;

piece.style.left =
`${Math.random() * 100}%`;

piece.style.setProperty(
"--spin",
`${360 * (2 + Math.random() * 2)}deg`
);

piece.style.animationDuration =
`${2.6 + Math.random() * 1.8}s`;

piece.style.animationDelay =
`${Math.random() * 1.5}s`;

overlay.appendChild(
piece
);

}

const streamerCount =
16;

for (
let i = 0;
i < streamerCount;
i++
) {

const streamer =
document.createElement(
"div"
);

streamer.className =
"birthday-streamer";

const color =
BIRTHDAY_CONFETTI_COLORS[
i % BIRTHDAY_CONFETTI_COLORS.length
];

const width =
7 +
Math.random() * 5;

const height =
60 +
Math.random() * 50;

streamer.style.width =
`${width}px`;

streamer.style.height =
`${height}px`;

streamer.style.background =
color;

streamer.style.left =
`${Math.random() * 100}%`;

streamer.style.setProperty(
"--sway",
`${30 + Math.random() * 40}px`
);

streamer.style.animationDuration =
`${3.4 + Math.random() * 2}s`;

streamer.style.animationDelay =
`${Math.random() * 1.6}s`;

overlay.appendChild(
streamer
);

}

document.body.appendChild(
overlay
);

requestAnimationFrame(
() => {

overlay.classList.add(
"visible"
);

}
);

let dismissed =
false;

function dismiss() {

if (dismissed) {

return;

}

dismissed =
true;

overlay.classList.remove(
"visible"
);

setTimeout(
() => {

overlay.remove();

},
600
);

}

overlay.addEventListener(
"click",
dismiss
);

setTimeout(
dismiss,
8000
);

}

/*

* 80s laser sweep — fires once when a movie from the 1980s
* is opened while in arcade theme. Builds its own overlay
* and beams entirely in JS, same self-cleaning pattern as
* every other easter egg here, and sits at a high enough
* z-index (300, see CSS) to render on top of the already-
* open movie modal, not just the shelf underneath it.
  */

const LASER_COLORS =
[
"#00fff2",
"#ff2fd1"
];

let laserSweepBusy =
false;

function triggerLaserSweep() {

if (laserSweepBusy) {

return;

}

laserSweepBusy =
true;

const overlay =
document.createElement(
"div"
);

overlay.className =
"laser-sweep-overlay";

const beamCount =
7;

let maxFinish =
0;

for (
let i = 0;
i < beamCount;
i++
) {

const beam =
document.createElement(
"div"
);

beam.className =
"laser-beam";

const color =
LASER_COLORS[
i % LASER_COLORS.length
];

const topPercent =
8 +
(i * (84 / (beamCount - 1)));

const angle =
(Math.random() * 16 - 8);

const duration =
0.5 +
Math.random() * 0.35;

const delay =
i * 0.05 +
Math.random() * 0.08;

beam.style.top =
`${topPercent}%`;

beam.style.setProperty(
"--laser-angle",
`${angle}deg`
);

beam.style.background =
`linear-gradient(
90deg,
transparent,
${color} 15%,
#ffffff 50%,
${color} 85%,
transparent
)`;

beam.style.boxShadow =
`0 0 8px 2px ${color}, ` +
`0 0 16px 4px ${color}`;

beam.style.animationDuration =
`${duration}s`;

beam.style.animationDelay =
`${delay}s`;

maxFinish =
Math.max(
maxFinish,
duration + delay
);

overlay.appendChild(
beam
);

}

document.body.appendChild(
overlay
);

setTimeout(
() => {

overlay.remove();

laserSweepBusy =
false;

},
(maxFinish + 0.3) * 1000
);

}

/*

* Family burst — radial burst of "FAMILY" tags shooting
* outward from behind the case, when a Fast & Furious movie
* finishes opening. Positioned at modal-content's actual
* center (measured after the flight settles) rather than a
* fixed screen point, so it's correctly centered whatever
* size the case ended up at on this particular viewport.
  */

function triggerFamilyBurst() {

const overlay =
document.getElementById(
"family-burst-overlay"
);

const content =
modal.querySelector(
".modal-content"
);

if (!overlay || !content) {

return;

}

overlay.innerHTML =
"";

const rect =
content.getBoundingClientRect();

const centerX =
rect.left +
rect.width / 2;

const centerY =
rect.top +
rect.height / 2;

const count =
12;

for (
let i = 0;
i < count;
i++
) {

const tag =
document.createElement(
"div"
);

tag.className =
"family-tag";

tag.textContent =
"FAMILY";

const angle =
(i / count) *
Math.PI * 2 +
(Math.random() * 0.3 - 0.15);

/*

* The case itself can be up to ~420x630px at full modal
* size, so tags were previously staying almost entirely
* behind it (max travel was only 210px, well inside the
* case's own half-height of ~315px). Pushed out much
* further so they clearly emerge past the case's edges
* in every direction, not just get hidden behind it.
  */

const dist =
320 +
Math.random() * 180;

const bx =
Math.cos(angle) * dist;

const by =
Math.sin(angle) * dist;

tag.style.left =
`${centerX}px`;

tag.style.top =
`${centerY}px`;

tag.style.setProperty(
"--bx",
`${bx}px`
);

tag.style.setProperty(
"--by",
`${by}px`
);

tag.style.setProperty(
"--bspin",
`${Math.random() * 360 - 180}deg`
);

tag.style.animationDuration =
`${1.6 + Math.random() * 0.6}s`;

tag.style.animationDelay =
`${Math.random() * 0.25}s`;

tag.style.fontSize =
`${26 + Math.random() * 14}px`;

overlay.appendChild(
tag
);

}

setTimeout(
() => {

overlay.innerHTML =
"";

},
2600
);

}

/*

* One comic word pop at a specific screen position — shared
* by the Batman sequence, which places 2-3 of these at
* random scattered points rather than always dead center.
  */

function triggerComicWordPop(
x,
y
) {

const word =
BATMAN_WORD_LIST[
Math.floor(
Math.random() *
BATMAN_WORD_LIST.length
)
];

const wrap =
document.createElement(
"div"
);

wrap.className =
"comic-pop-wrap";

wrap.style.left =
`${x}px`;

wrap.style.top =
`${y}px`;

wrap.style.setProperty(
"--word-rot",
`${Math.random() * 40 - 20}deg`
);

/*

* Responsive sizing — the CSS defaults (440x290 burst,
* 64px text) were fixed pixel values that never shrank,
* guaranteed to overflow a narrow phone screen regardless
* of where the pop was positioned. Scales down against the
* actual viewport width instead, capped at the original
* size so it never looks oversized on a wide screen either.
  */

const burstWidth =
Math.min(
440,
window.innerWidth * 0.85
);

const burstHeight =
burstWidth *
(290 / 440);

const fontSize =
burstWidth *
(64 / 440);

const burstSvg =
`<svg class="comic-burst-svg" viewBox="0 0 260 170" style="width:${burstWidth}px; height:${burstHeight}px;">
<polygon points="130,5 145,35 175,15 172,50 210,40 190,68 230,75 192,90 218,115 178,105 170,140 145,115 130,165 115,115 90,140 82,105 42,115 68,90 30,75 70,68 50,40 88,50 85,15 115,35"
fill="#000"/>
<polygon points="130,15 142,40 168,23 165,52 198,44 181,66 214,72 183,85 205,106 172,97 165,127 143,106 130,150 117,106 95,127 88,97 55,106 77,85 46,72 79,66 62,44 95,52 92,23 118,40"
fill="${word.color}"/>
</svg>`;

wrap.innerHTML =
burstSvg +
`<div class="comic-word-text" style="--word-color:${word.color}; font-size:${fontSize}px;">${word.text}</div>`;

document.body.appendChild(
wrap
);

setTimeout(
() => {

wrap.remove();

},
1800
);

}

let batSignalBusy =
false;

/*

* Bat-signal — fires when a Batman movie finishes opening.
* A beam sweeps in from the bottom-left corner of the screen
* to the oval in the upper-right (positioned to roughly
* align with where the case ends up), then 2-3 random comic
* words pop at scattered points around the screen. Beam and
* oval render behind the case (see bat-signal-overlay's
* z-index); the word pops sit above everything (z-index 6,
* see CSS) since they're meant to be seen clearly regardless
* of what's under them.
  */

function triggerBatSignal() {

if (batSignalBusy) {

return;

}

batSignalBusy =
true;

const overlay =
document.getElementById(
"bat-signal-overlay"
);

if (!overlay) {

batSignalBusy =
false;

return;

}

overlay.innerHTML =
"";

const vw =
window.innerWidth;

const vh =
window.innerHeight;

/*

* Oval sits in the upper-right, roughly where the case
* itself ends up horizontally — not hardcoded, so it stays
* sensible across different viewport sizes rather than
* just assuming desktop dimensions.
  */

const ovalWidth =
Math.min(
190,
vw * 0.24
);

const ovalHeight =
ovalWidth *
(98 / 150);

const ovalRight =
Math.max(
24,
vw * 0.08
);

const ovalTop =
Math.max(
20,
vh * 0.05
);

const ovalCenterX =
vw - ovalRight - ovalWidth / 2;

const ovalCenterY =
ovalTop + ovalHeight / 2;

/*

* Beam source sits at the bottom-left corner of the
* viewport — a narrow point there, widening as it travels
* up to the oval, same visual logic as a real spotlight
* rather than the short corner-only cone from the first
* pass at this.
  */

const sourceX =
vw * 0.02;

const sourceY =
vh * 0.98;

const dx =
ovalCenterX - sourceX;

const dy =
ovalCenterY - sourceY;

const length =
Math.sqrt(
dx * dx +
dy * dy
);

const perpX =
-dy / length;

const perpY =
dx / length;

const sourceHalfWidth =
6;

const targetHalfWidth =
ovalWidth * 0.4;

const p1x =
sourceX +
perpX * sourceHalfWidth;

const p1y =
sourceY +
perpY * sourceHalfWidth;

const p2x =
sourceX -
perpX * sourceHalfWidth;

const p2y =
sourceY -
perpY * sourceHalfWidth;

const p3x =
ovalCenterX -
perpX * targetHalfWidth;

const p3y =
ovalCenterY -
perpY * targetHalfWidth;

const p4x =
ovalCenterX +
perpX * targetHalfWidth;

const p4y =
ovalCenterY +
perpY * targetHalfWidth;

const beamSvg =
document.createElement(
"div"
);

beamSvg.className =
"bat-beam-svg";

beamSvg.innerHTML =
`<svg width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}">
<polygon points="${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}"
fill="rgba(255,219,122,0.18)"/>
</svg>`;

overlay.appendChild(
beamSvg
);

const oval =
document.createElement(
"div"
);

oval.className =
"bat-oval";

oval.style.width =
`${ovalWidth}px`;

oval.style.height =
`${ovalHeight}px`;

oval.style.left =
`${ovalCenterX - ovalWidth / 2}px`;

oval.style.top =
`${ovalCenterY - ovalHeight / 2}px`;

oval.style.transform =
"rotate(20deg)";

oval.innerHTML =
`<svg viewBox="0 0 894 420"><polygon points="${BAT_SIGNAL_POLYGON_POINTS}"/></svg>`;

overlay.appendChild(
oval
);

/*

* 2-3 random word pops, positioned on top of the case
* itself rather than hunting for clear margin space beside
* it. The previous version tried to find empty margin to the
* left/right of the case, but on mobile the case can take up
* nearly the full screen width, leaving no usable margin at
* all — every pop silently got skipped. Positioning on the
* case works at any viewport size, and each pop's own size
* is now computed responsively (see triggerComicWordPop)
* instead of relying on a scale parameter that was being
* passed in but never actually used.
  */

const popCount =
2 +
Math.floor(
Math.random() * 2
);

const caseContent =
modal.querySelector(
".modal-content"
);

const caseRect =
caseContent
? caseContent.getBoundingClientRect()
: {
left: vw * 0.25,
top: vh * 0.15,
width: vw * 0.5,
height: vh * 0.7
};

for (
let i = 0;
i < popCount;
i++
) {

/*

* Clamped against the same responsive size formula
* triggerComicWordPop uses, so a word placed near the case's
* own edge can't have its own half-width/height push it past
* the viewport edge — the actual cause of the rare 1px
* overflow seen in testing, since the random position was
* only ever checked against the case's bounds, never the
* word's own size on top of that.
  */

const popBurstWidth =
Math.min(
440,
vw * 0.85
);

const popBurstHeight =
popBurstWidth *
(290 / 440);

const popHalfWidth =
popBurstWidth / 2;

const popHalfHeight =
popBurstHeight / 2;

/*

* Was 0.2-0.8 (both axes) - kept every pop tightly centered
* within the case, never near an edge and never bleeding
* off it at all. Widened to -0.33 to 1.33, so the pop's
* center can land anywhere across the full case and bleed
* up to roughly a third of the case's own size past any
* edge — the viewport clamp above still guarantees it never
* runs off the actual screen regardless.
  */

const popX =
Math.min(
Math.max(
caseRect.left +
caseRect.width * (-0.33 + Math.random() * 1.66),
popHalfWidth + 8
),
vw - popHalfWidth - 8
);

const popY =
Math.min(
Math.max(
caseRect.top +
caseRect.height * (-0.33 + Math.random() * 1.66),
popHalfHeight + 8
),
vh - popHalfHeight - 8
);

setTimeout(
() => {

triggerComicWordPop(
popX,
popY
);

},
1000 +
i * 700 +
Math.random() * 400

);

}

setTimeout(
() => {

overlay.innerHTML =
"";

batSignalBusy =
false;

},
5600
);

}

/*

* James Bond gun-barrel — full-screen takeover (unlike the
* Harry Potter envelope or Mission Impossible package, this
* doesn't grow from the card, it's a cinematic full-screen
* sequence that plays while the real modal grows normally
* underneath, then fades away to reveal it). Sizing is
* computed from viewport dimensions rather than the fixed
* pixel values the mockup used, so this scales correctly on
* any screen instead of assuming one size.
  */

const BOND_SEQUENCE_DURATION =
5300;

function spiralPoint(
cx,
cy,
angleDeg,
radius
) {

const rad =
angleDeg * Math.PI / 180;

return {
x: cx + radius * Math.cos(rad),
y: cy + radius * Math.sin(rad)
};

}

function buildRiflingBandPoints(
cx,
cy,
startAngle,
sweepDeg,
outerR,
innerR,
steps,
bandWidthDeg
) {

const outerEdge = [];
const innerEdge = [];

for (
let i = 0;
i <= steps;
i++
) {

const t = i / steps;
const angle = startAngle + sweepDeg * t;
const radius = outerR + (innerR - outerR) * t;
outerEdge.push(spiralPoint(cx, cy, angle, radius));

}

for (
let i = steps;
i >= 0;
i--
) {

const t = i / steps;
const angle = startAngle + sweepDeg * t + bandWidthDeg;
const radius = outerR + (innerR - outerR) * t;
innerEdge.push(spiralPoint(cx, cy, angle, radius));

}

const points = outerEdge.concat(innerEdge);

return points.map(
p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`
).join(' ');

}

function buildBondRiflingSVG(
scopeSize
) {

const cx = scopeSize / 2;
const cy = scopeSize / 2;
const bandCount = 4;
const sweep = 300;
const outerR = cx + 25;
const innerR = scopeSize * 0.223;
const centerHoleR = scopeSize * 0.246;

let svg =
`<svg width="${scopeSize}" height="${scopeSize}" viewBox="0 0 ${scopeSize} ${scopeSize}" style="position:absolute; inset:0;">`;

svg += `<defs>`;
svg += `<radialGradient id="bond-band-grad" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${cx}">
          <stop offset="0%" stop-color="#3a3a3a"/>
          <stop offset="55%" stop-color="#b8b8b8"/>
          <stop offset="100%" stop-color="#e8e8e8"/>
        </radialGradient>`;
svg += `<radialGradient id="bond-groove-grad" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${cx}">
          <stop offset="0%" stop-color="#000"/>
          <stop offset="100%" stop-color="#151515"/>
        </radialGradient>`;
svg += `</defs>`;

svg += `<clipPath id="bond-rifling-clip"><circle cx="${cx}" cy="${cy}" r="${cx}"/></clipPath>`;

svg += `<mask id="bond-center-hole-mask">
          <rect x="0" y="0" width="${scopeSize}" height="${scopeSize}" fill="#fff"/>
          <circle cx="${cx}" cy="${cy}" r="${centerHoleR}" fill="#000"/>
        </mask>`;

svg += `<g clip-path="url(#bond-rifling-clip)" mask="url(#bond-center-hole-mask)">`;

for (
let i = 0;
i < bandCount;
i++
) {

const startAngle = (360 / bandCount) * i;

const bandPoints =
buildRiflingBandPoints(
cx, cy, startAngle, sweep, outerR, innerR, 30, 65
);

svg += `<polygon points="${bandPoints}" fill="url(#bond-band-grad)"/>`;

const highlightPoints = [];

for (
let s = 0;
s <= 30;
s++
) {

const t = s / 30;
const angle = startAngle + sweep * t;
const radius = outerR + (innerR - outerR) * t;
highlightPoints.push(spiralPoint(cx, cy, angle, radius));

}

const highlightPath =
highlightPoints.map(
p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`
).join(' ');

svg += `<polyline points="${highlightPath}" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="2"/>`;

const groovePoints =
buildRiflingBandPoints(
cx, cy, startAngle + 65, sweep, outerR, innerR, 30, 25
);

svg += `<polygon points="${groovePoints}" fill="url(#bond-groove-grad)"/>`;

}

svg += `</g></svg>`;

return svg;

}

function triggerBondGunBarrel() {

const overlay =
document.createElement(
"div"
);

overlay.className =
"bond-overlay";

const blackMask =
document.createElement(
"div"
);

blackMask.className =
"bond-black-mask";

overlay.appendChild(
blackMask
);

const vw =
window.innerWidth;

const vh =
window.innerHeight;

const scopeSize =
Math.min(
340,
vw * 0.42,
vh * 0.55
);

const scope =
document.createElement(
"div"
);

scope.className =
"bond-scope";

scope.style.width =
`${scopeSize}px`;

scope.style.height =
`${scopeSize}px`;

const startLeft =
vw * 0.15;

const startTop =
vh * 0.5;

scope.style.left =
`${startLeft}px`;

scope.style.top =
`${startTop}px`;

scope.style.transform =
"translate(-50%, -50%) scale(1)";

const rifling =
document.createElement(
"div"
);

rifling.className =
"bond-rifling";

rifling.innerHTML =
buildBondRiflingSVG(
scopeSize
);

scope.appendChild(
rifling
);

const reelSize =
scopeSize * 0.385;

const reel =
document.createElement(
"div"
);

reel.className =
"bond-reel";

reel.style.width =
`${reelSize}px`;

reel.style.height =
`${reelSize}px`;

reel.style.bottom =
`${scopeSize * 0.346}px`;

reel.style.left =
`${-reelSize * 0.3}px`;

reel.style.animationDuration =
"2.3s";

const reelMaskId =
`bond-reel-mask-${Date.now()}`;

reel.innerHTML =
`<svg viewBox="0 0 100 100" width="100%" height="100%">
<defs>
<mask id="${reelMaskId}">
<circle cx="50" cy="50" r="46" fill="#fff"/>
<circle cx="50" cy="18" r="10" fill="#000"/>
<circle cx="76" cy="34" r="10" fill="#000"/>
<circle cx="76" cy="66" r="10" fill="#000"/>
<circle cx="50" cy="82" r="10" fill="#000"/>
<circle cx="24" cy="66" r="10" fill="#000"/>
<circle cx="24" cy="34" r="10" fill="#000"/>
<circle cx="50" cy="50" r="9" fill="#000"/>
</mask>
</defs>
<circle cx="50" cy="50" r="46" fill="#4a4a4a" stroke="#1a1a1a" stroke-width="2" mask="url(#${reelMaskId})"/>
<circle cx="50" cy="50" r="46" fill="none" stroke="#1a1a1a" stroke-width="2"/>
</svg>`;

scope.appendChild(
reel
);

overlay.appendChild(
scope
);

const ring =
document.createElement(
"div"
);

ring.className =
"bond-ring";

ring.style.width =
`${scopeSize + 20}px`;

ring.style.height =
`${scopeSize + 20}px`;

ring.style.left =
`${startLeft}px`;

ring.style.top =
`${startTop}px`;

ring.style.transform =
"translate(-50%, -50%)";

ring.style.transition =
"left 1.8s linear, top 1.8s linear, opacity 0.8s ease";

overlay.appendChild(
ring
);

const flash =
document.createElement(
"div"
);

flash.className =
"bond-flash";

overlay.appendChild(
flash
);

const dripCount =
4;

const drips = [];

for (
let i = 0;
i < dripCount;
i++
) {

const drip =
document.createElement(
"div"
);

drip.className =
"bond-drip";

const dripWidth =
Math.max(
6,
vw * 0.012
);

drip.style.width =
`${dripWidth}px`;

drip.style.left =
`${44 + i * 4}%`;

overlay.appendChild(
drip
);

drips.push(
drip
);

}

document.body.appendChild(
overlay
);

requestAnimationFrame(
() => {

scope.style.left =
"50%";

scope.style.top =
"50%";

ring.style.left =
"50%";

ring.style.top =
"50%";

}
);

/*

* Reel winding down - freezes current spin angle (read off
* the live computed transform, so there's no jump), coasts
* forward a bit further, then rolls back and settles,
* recentering horizontally within the scope at the same
* time.
  */

setTimeout(
() => {

const computedStyle =
window.getComputedStyle(
reel
);

const matrix =
computedStyle.transform;

let currentAngle = 0;

if (matrix && matrix !== "none") {

const values =
matrix.split("(")[1].split(")")[0].split(",");

const a = parseFloat(values[0]);
const b = parseFloat(values[1]);

currentAngle =
Math.atan2(b, a) * (180 / Math.PI);

}

reel.style.animation =
"none";

reel.style.transform =
`rotate(${currentAngle}deg)`;

reel.style.transition =
"left 0.6s cubic-bezier(0.3,0.1,0.2,1)";

reel.style.left =
`${(scopeSize - reelSize) / 2}px`;

void reel.offsetWidth;

const keyframeName =
`bond-reel-wind-down-${Date.now()}`;

const styleTag =
document.createElement(
"style"
);

styleTag.textContent =
`@keyframes ${keyframeName} {
0% { transform: rotate(${currentAngle}deg); }
42% { transform: rotate(${currentAngle + 35}deg); }
68% { transform: rotate(${currentAngle + 35 - 6}deg); }
100% { transform: rotate(${currentAngle + 35 - 14}deg); }
}`;

document.head.appendChild(
styleTag
);

reel.style.animation =
`${keyframeName} 1.15s cubic-bezier(0.33,0.1,0.3,1) forwards`;

},
1900
);

setTimeout(
() => {

flash.classList.add(
"visible"
);

},
3080
);

setTimeout(
() => {

flash.classList.remove(
"visible"
);

flash.classList.add(
"fading-out"
);

const dripHeights =
[
scopeSize * 0.55,
scopeSize * 0.4,
scopeSize * 0.5,
scopeSize * 0.34
];

drips.forEach(
(drip, i) => {

drip.classList.add(
"visible"
);

drip.style.height =
`${dripHeights[i]}px`;

}
);

},
3280
);

setTimeout(
() => {

scope.classList.add(
"fading"
);

blackMask.classList.add(
"fading"
);

ring.classList.add(
"fading"
);

},
5000
);

setTimeout(
() => {

overlay.remove();

},
BOND_SEQUENCE_DURATION
);

}

/*

* Mission Impossible self-destruct — covers the case with a
* brown-paper-and-twine package while the real case flies/
* grows into the modal normally underneath (same pattern as
* the Harry Potter envelope). Paper and twine grow with it
* immediately; the stamp label and message text stay hidden
* until growth settles, since fixed-pixel text visibly
* reflowing inside a still-growing container is exactly the
* bug already found and fixed on the Harry Potter title.
  */

const MI_SELF_DESTRUCT_SEQUENCE_DURATION =
4000;

function triggerSelfDestruct(
movie,
startRect,
endRect
) {

const scene =
document.createElement(
"div"
);

scene.className =
"sd-scene";

scene.style.left =
`${startRect.left}px`;

scene.style.top =
`${startRect.top}px`;

scene.style.width =
`${startRect.width}px`;

scene.style.height =
`${startRect.height}px`;

scene.style.transition =
"left 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"top 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"width 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"height 0.9s cubic-bezier(0.16, 1, 0.3, 1)";

const wrap =
document.createElement(
"div"
);

wrap.className =
"sd-wrap";

const twineV =
document.createElement(
"div"
);

twineV.className =
"sd-twine sd-twine-vertical";

const twineWidth =
Math.max(
6,
endRect.width * 0.042
);

twineV.style.width =
`${twineWidth}px`;

twineV.style.marginLeft =
`${-twineWidth / 2}px`;

const twineH =
document.createElement(
"div"
);

twineH.className =
"sd-twine sd-twine-horizontal";

twineH.style.height =
`${twineWidth}px`;

twineH.style.marginTop =
`${-twineWidth / 2}px`;

const knot =
document.createElement(
"div"
);

knot.className =
"sd-twine-knot";

const knotSize =
endRect.width * 0.108;

knot.style.width =
`${knotSize}px`;

knot.style.height =
`${knotSize * 0.85}px`;

knot.style.marginLeft =
`${-knotSize / 2}px`;

knot.style.marginTop =
`${-knotSize * 0.425}px`;

const label =
document.createElement(
"div"
);

label.className =
"sd-label";

label.style.fontSize =
`${endRect.width * 0.054}px`;

label.style.padding =
`${endRect.width * 0.02}px ${endRect.width * 0.03}px`;

label.style.maxWidth =
"36%";

label.innerHTML =
"CLASSIFIED<br>IMF EYES ONLY";

wrap.appendChild(
twineV
);

wrap.appendChild(
twineH
);

wrap.appendChild(
knot
);

wrap.appendChild(
label
);

const message =
document.createElement(
"div"
);

message.className =
"sd-message";

const messageText =
document.createElement(
"div"
);

messageText.className =
"sd-message-text";

messageText.style.fontSize =
`${Math.min(
32,
endRect.width * 0.065
)}px`;

messageText.innerHTML =
"THIS MESSAGE<br>WILL SELF-DESTRUCT<br>IN 3 SECONDS";

message.appendChild(
messageText
);

const flash =
document.createElement(
"div"
);

flash.className =
"sd-explosion-flash";

const shardsContainer =
document.createElement(
"div"
);

const shardSize =
Math.max(
6,
endRect.width * 0.03
);

const shardCount =
20;

for (
let i = 0;
i < shardCount;
i++
) {

const shard =
document.createElement(
"div"
);

shard.className =
"sd-explosion-shard";

shard.style.width =
`${shardSize}px`;

shard.style.height =
`${shardSize}px`;

const angle =
(i / shardCount) *
Math.PI * 2 +
(Math.random() * 0.3 - 0.15);

const dist =
endRect.width * 0.7 +
Math.random() *
endRect.width * 0.5;

shard.style.setProperty(
"--ex",
`${Math.cos(angle) * dist}px`
);

shard.style.setProperty(
"--ey",
`${Math.sin(angle) * dist}px`
);

shard.style.setProperty(
"--erot",
`${Math.random() * 360 - 180}deg`
);

shard.style.animationDelay =
`${Math.random() * 0.1}s`;

shardsContainer.appendChild(
shard
);

}

scene.appendChild(
wrap
);

scene.appendChild(
flash
);

scene.appendChild(
shardsContainer
);

scene.appendChild(
message
);

document.body.appendChild(
scene
);

requestAnimationFrame(
() => {

scene.style.left =
`${endRect.left}px`;

scene.style.top =
`${endRect.top}px`;

scene.style.width =
`${endRect.width}px`;

scene.style.height =
`${endRect.height}px`;

}
);

setTimeout(
() => {

label.classList.add(
"visible"
);

},
900
);

setTimeout(
() => {

messageText.classList.add(
"visible"
);

},
1100
);

setTimeout(
() => {

messageText.classList.add(
"pulsing"
);

},
1900
);

setTimeout(
() => {

scene.classList.add(
"exploding"
);

messageText.classList.remove(
"visible"
);

},
2900
);

setTimeout(
() => {

wrap.classList.add(
"destroyed"
);

},
3300
);

setTimeout(
() => {

scene.remove();

},
MI_SELF_DESTRUCT_SEQUENCE_DURATION
);

}

/*

* Harry Potter envelope — covers the case with an envelope
* overlay while the real case flies/grows into the modal
* normally underneath (untouched, same as it always does),
* then plays through front (title) -> flip -> back (wax
* seal) -> open (flap lifts, seal breaks) -> fades away,
* revealing the real case that's already sitting there.
* Unlike the mockup version, this never fakes its own case —
* the real one is right underneath the whole time, so fading
* the envelope away is all that's needed to "reveal" it.
  */

const HP_ENVELOPE_SEQUENCE_DURATION =
5400;

function triggerHarryPotterEnvelope(
movie,
startRect,
endRect
) {

const scene =
document.createElement(
"div"
);

scene.className =
"hp-envelope-scene";

scene.style.left =
`${startRect.left}px`;

scene.style.top =
`${startRect.top}px`;

scene.style.width =
`${startRect.width}px`;

scene.style.height =
`${startRect.height}px`;

scene.style.transition =
"left 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"top 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"width 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"height 0.9s cubic-bezier(0.16, 1, 0.3, 1)";

const visual =
document.createElement(
"div"
);

visual.className =
"hp-envelope-visual";

const flipper =
document.createElement(
"div"
);

flipper.className =
"hp-envelope-flipper";

const front =
document.createElement(
"div"
);

front.className =
"hp-envelope-face front";

const frontTitle =
document.createElement(
"div"
);

frontTitle.className =
"hp-envelope-front-title";

/*

* Font-size was set as "14%" originally, which is wrong —
* CSS font-size percentages scale relative to the PARENT's
* font-size (inherited from body, ~16px), not the element's
* own dimensions, so this rendered as a barely-visible ~2px.
* Calculated as actual pixels from the envelope's real final
* width instead, matching the proportion that read well in
* the standalone mockup (roughly 9% of width there).
  */

frontTitle.style.fontSize =
`${endRect.width * 0.09}px`;

frontTitle.textContent =
movie.title;

front.appendChild(
frontTitle
);

const back =
document.createElement(
"div"
);

back.className =
"hp-envelope-face back";

const foldLines =
document.createElement(
"div"
);

foldLines.className =
"hp-envelope-fold-lines";

const waxSeal =
document.createElement(
"div"
);

waxSeal.className =
"hp-envelope-wax-seal";

waxSeal.innerHTML =
`<span class="hp-envelope-wax-seal-emblem" style="font-size: ${endRect.width * 0.055}px;">H</span>`;

const flap =
document.createElement(
"div"
);

flap.className =
"hp-envelope-flap";

back.appendChild(
foldLines
);

back.appendChild(
waxSeal
);

back.appendChild(
flap
);

flipper.appendChild(
front
);

flipper.appendChild(
back
);

visual.appendChild(
flipper
);

scene.appendChild(
visual
);

document.body.appendChild(
scene
);

/*

* Grow from the card's starting rect to the same final
* rect the real modal-content is growing to, on the same
* 0.9s timeline — reused rather than recalculated, so this
* can never drift out of sync with where the real case
* actually ends up.
  */

requestAnimationFrame(
() => {

scene.style.left =
`${endRect.left}px`;

scene.style.top =
`${endRect.top}px`;

scene.style.width =
`${endRect.width}px`;

scene.style.height =
`${endRect.height}px`;

}
);

/*

* Title only fades in once growth has actually settled
* (900ms, matching the growth transition above) — showing
* it from the start meant a fixed-pixel font size (correct
* for the final size) visibly reflowed inside the still-
* growing container the whole time, which read as glitchy
* rather than intentional.
  */

setTimeout(
() => {

frontTitle.classList.add(
"visible"
);

},
900
);

setTimeout(
() => {

flipper.classList.add(
"flipped"
);

},
1900
);

setTimeout(
() => {

flipper.classList.add(
"opened"
);

},
3400
);

setTimeout(
() => {

visual.classList.add(
"fading"
);

},
4800
);

setTimeout(
() => {

scene.remove();

},
HP_ENVELOPE_SEQUENCE_DURATION
);

}

/*

* Sparkle arc — fires when the Animated filter switches to
* "Only". A bright point traces a semicircular arc across
* the screen, continuously dropping small sparkle particles
* behind it that flare then fade.
  */

let sparkleArcBusy =
false;

function sparkleArcPoint(
t,
stageW,
stageH
) {

const startX =
stageW * 0.05;

const endX =
stageW * 0.95;

const peakY =
stageH * 0.12;

const baseY =
stageH * 0.55;

const x =
startX + (endX - startX) * t;

const y =
baseY - (baseY - peakY) * Math.sin(t * Math.PI);

return {
x: x,
y: y
};

}

function triggerSparkleArc() {

if (sparkleArcBusy) {

return;

}

sparkleArcBusy =
true;

const stageW =
window.innerWidth;

const stageH =
window.innerHeight;

const head =
document.createElement(
"div"
);

head.className =
"sparkle-head";

document.body.appendChild(
head
);

const duration =
2800;

const startTime =
performance.now();

let lastDustTime =
0;

const activeDust =
[];

function frame(
now
) {

const elapsed =
now - startTime;

const t =
Math.min(
1,
elapsed / duration
);

const pos =
sparkleArcPoint(
t,
stageW,
stageH
);

head.style.left =
`${pos.x - 7}px`;

head.style.top =
`${pos.y - 7}px`;

if (
elapsed - lastDustTime > 35 &&
t < 1
) {

lastDustTime =
elapsed;

const dust =
document.createElement(
"div"
);

dust.className =
"sparkle-dust";

const size =
3 + Math.random() * 4;

dust.style.width =
`${size}px`;

dust.style.height =
`${size}px`;

dust.style.left =
`${pos.x + (Math.random() * 10 - 5) - size / 2}px`;

dust.style.top =
`${pos.y + (Math.random() * 10 - 5) - size / 2}px`;

dust.style.animationDuration =
`${0.6 + Math.random() * 0.5}s`;

document.body.appendChild(
dust
);

activeDust.push(
dust
);

setTimeout(
() => {

dust.remove();

},
1200
);

}

if (t < 1) {

requestAnimationFrame(
frame
);

} else {

setTimeout(
() => {

head.remove();

},
300
);

setTimeout(
() => {

activeDust.forEach(
d => d.remove()
);

sparkleArcBusy =
false;

},
1300
);

}

}

requestAnimationFrame(
frame
);

}

/*

* Iris close — fires when a movie is closed, playing
* alongside the existing fly-back-to-shelf animation. A
* circular window shrinks around the case (revealing a
* concentric ring pattern, matching the classic iris-wipe
* technique — built fresh here, not any specific reference
* image), closes to a point around "That's all, Folks!",
* then re-opens using the exact same animation mirrored
* (same easing function, start/end swapped) rather than
* snapping instantly back open.
  */

function animateIrisRadius(
circleEl,
fromR,
toR,
duration,
onDone
) {

const startTime =
performance.now();

function frame(
now
) {

const elapsed =
now - startTime;

const t =
Math.min(
1,
elapsed / duration
);

const eased =
t < 1
? 1 - Math.pow(1 - t, 3)
: 1;

const radius =
fromR + (toR - fromR) * eased;

circleEl.setAttribute(
"r",
radius
);

if (t < 1) {

requestAnimationFrame(
frame
);

} else if (onDone) {

onDone();

}

}

requestAnimationFrame(
frame
);

}

let irisCloseBusy =
false;

function triggerIrisClose(
caseRect
) {

if (irisCloseBusy) {

return;

}

irisCloseBusy =
true;

/*

* Scoped to the case's own rect, not the full viewport -
* the SVG only covers the area the case currently occupies,
* and the starting radius only needs to reach the case's
* own corners, not the whole screen's.
  */

const areaLeft =
caseRect.left;

const areaTop =
caseRect.top;

const areaWidth =
caseRect.width;

const areaHeight =
caseRect.height;

const fullRadius =
Math.sqrt(
areaWidth * areaWidth +
areaHeight * areaHeight
) / 2 + 10;

const maskId =
`iris-window-mask-${Date.now()}`;

const gradId =
`iris-ring-grad-${Date.now()}`;

const circleId =
`iris-window-hole-${Date.now()}`;

const svg =
document.createElement(
"div"
);

svg.className =
"iris-close-svg";

svg.style.left =
`${areaLeft}px`;

svg.style.top =
`${areaTop}px`;

svg.style.width =
`${areaWidth}px`;

svg.style.height =
`${areaHeight}px`;

svg.innerHTML =
`<svg width="${areaWidth}" height="${areaHeight}" viewBox="0 0 ${areaWidth} ${areaHeight}" preserveAspectRatio="xMidYMid slice">
<defs>
<radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">
<stop offset="0%" stop-color="#8a0000"/>
<stop offset="15%" stop-color="#c81e1e"/>
<stop offset="30%" stop-color="#5a0000"/>
<stop offset="45%" stop-color="#c81e1e"/>
<stop offset="60%" stop-color="#5a0000"/>
<stop offset="75%" stop-color="#c81e1e"/>
<stop offset="90%" stop-color="#3a0000"/>
<stop offset="100%" stop-color="#000"/>
</radialGradient>
<mask id="${maskId}">
<rect x="0" y="0" width="${areaWidth}" height="${areaHeight}" fill="#fff"/>
<circle id="${circleId}" cx="${areaWidth / 2}" cy="${areaHeight / 2}" r="${fullRadius}" fill="#000"/>
</mask>
</defs>
<rect x="0" y="0" width="${areaWidth}" height="${areaHeight}" fill="url(#${gradId})" mask="url(#${maskId})"/>
</svg>`;

document.body.appendChild(
svg
);

const text =
document.createElement(
"div"
);

text.className =
"iris-close-text";

text.textContent =
"That's all, Folks!";

/*

* Positioned and sized relative to the case's own center
* and width, not the viewport's — this is what actually
* fixes the text never appearing where expected: it's no
* longer assuming the case sits at the screen's center.
  */

text.style.left =
`${areaLeft + areaWidth / 2}px`;

text.style.top =
`${areaTop + areaHeight / 2}px`;

text.style.fontSize =
`${Math.min(48, Math.max(14, areaWidth * 0.11))}px`;

document.body.appendChild(
text
);

const circleEl =
document.getElementById(
circleId
);

circleEl.setAttribute(
"r",
fullRadius
);

animateIrisRadius(
circleEl,
fullRadius,
0,
1000
);

setTimeout(
() => {

text.classList.add(
"visible"
);

},
750
);

setTimeout(
() => {

text.classList.remove(
"visible"
);

},
2200
);

/*

* Re-open mirrors the close exactly — same function, same
* duration, same easing, only the start/end radii are
* swapped. Not an instant snap back to fully open.
  */

setTimeout(
() => {

animateIrisRadius(
circleEl,
0,
fullRadius,
1000,
() => {

svg.remove();

text.remove();

irisCloseBusy =
false;

}
);

},
2800
);

}

/*

* Heart flood — fires once when the genre filter switches
* to Rom-Com. Builds its own overlay and particles entirely
* in JS (nothing pre-built in the HTML, same as the glass
* shatter effect), and removes the whole overlay afterward —
* nothing lingers in the DOM once it's done playing.
  */

let heartFloodBusy =
false;

function triggerHeartFlood() {

if (heartFloodBusy) {

return;

}

heartFloodBusy =
true;

const overlay =
document.createElement(
"div"
);

overlay.className =
"heart-flood-overlay";

const heartSVG =
document.body.classList.contains(
"theme-arcade"
) ?
PIXEL_HEART_SVG :
SMOOTH_HEART_SVG;

const particleCount =
36;

let maxFinish =
0;

for (
let i = 0;
i < particleCount;
i++
) {

const particle =
document.createElement(
"div"
);

particle.className =
"heart-flood-particle";

particle.innerHTML =
heartSVG;

const size =
14 +
Math.random() * 20;

const leftPercent =
Math.random() * 100;

const duration =
2.6 +
Math.random() * 2.2;

const delay =
Math.random() * 0.9;

const drift =
(Math.random() * 140 - 70);

const spin =
(Math.random() * 60 - 30);

particle.style.width =
`${size}px`;

particle.style.height =
`${size}px`;

particle.style.left =
`${leftPercent}%`;

particle.style.setProperty(
"--drift",
`${drift}px`
);

particle.style.setProperty(
"--spin",
`${spin}deg`
);

particle.style.animationDuration =
`${duration}s`;

particle.style.animationDelay =
`${delay}s`;

maxFinish =
Math.max(
maxFinish,
duration + delay
);

overlay.appendChild(
particle
);

}

document.body.appendChild(
overlay
);

setTimeout(
() => {

overlay.remove();

heartFloodBusy =
false;

},
(maxFinish + 0.3) * 1000
);

}

function triggerPiEasterEgg() {

const matrixOverlay =
document.getElementById(
"matrix-overlay"
);

if (!matrixOverlay) {

return;

}

matrixOverlay.innerHTML =
"";

const columnWidth =
22;

const columnCount =
Math.ceil(
window.innerWidth /
columnWidth
);

const chars =
"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

for (
let i = 0;
i < columnCount;
i++
) {

const column =
document.createElement(
"div"
);

column.className =
"matrix-column";

column.style.left =
`${i * columnWidth}px`;

let text =
"";

const charCount =
20 +
Math.floor(
Math.random() * 15
);

for (
let j = 0;
j < charCount;
j++
) {

text +=
chars[
Math.floor(
Math.random() *
chars.length
)
] + "\n";

}

column.textContent =
text;

const duration =
1.2 +
Math.random() * 1.5;

const delay =
Math.random() * 0.5;

column.style.animationDuration =
`${duration}s`;

column.style.animationDelay =
`${delay}s`;

matrixOverlay.appendChild(
column
);

}

matrixOverlay.classList.add(
"active"
);

setTimeout(
() => {

matrixOverlay.classList.remove(
"active"
);

setTimeout(
() => {

matrixOverlay.innerHTML =
"";

},
600
);

sandraBullockModeActive =
true;

renderMovies();

},
2800
);

}

const piButton =
document.getElementById(
"pi-easter-egg"
);

if (piButton) {

piButton.addEventListener(
"click",
triggerPiEasterEgg
);

}

// =========================================================
// BARCODE EASTER EGG
// =========================================================

/*

* Attached once here, not inside populateMovie — the button
* element itself is static in the HTML and never gets
* recreated between movie views, so attaching this per-movie
* would stack duplicate listeners and fire the effect
* multiple times after viewing a few movies.
  */

const barcodeButton =
document.getElementById(
"modal-barcode-button"
);

const scanLine =
document.getElementById(
"modal-scan-line"
);

const creditMessage =
document.getElementById(
"modal-credit-message"
);

let barcodeBusy =
false;

if (barcodeButton) {

barcodeButton.addEventListener(
"click",
event => {

event.stopPropagation();

if (barcodeBusy) {

return;

}

barcodeBusy =
true;

if (scanLine) {

scanLine.classList.remove(
"scanning"
);

void scanLine.offsetWidth;

scanLine.classList.add(
"scanning"
);

}

setTimeout(
() => {

if (creditMessage) {

creditMessage.classList.add(
"showing"
);

}

},
450
);

setTimeout(
() => {

if (creditMessage) {

creditMessage.classList.remove(
"showing"
);

}

barcodeBusy =
false;

},
1300
);

}
);

}

// =========================================================
// CLICK CASE TO FLIP
// =========================================================

flipContainer.addEventListener(
"click",
event => {

if (
event.target === flipButton ||
event.target.closest(
".primary-button"
) ||
event.target.closest(
".reservation-person"
) ||
event.target.closest(
"#modal-barcode-button"
)
) {

return;

}

flipMovie();

}
);

// =========================================================
// SWIPE TO FLIP
// =========================================================

let touchStartX =
0;

let touchStartY =
0;

flipContainer.addEventListener(
"touchstart",
event => {

const touch =
event.changedTouches[0];

touchStartX =
touch.screenX;

touchStartY =
touch.screenY;

},
{
passive: true
}
);

flipContainer.addEventListener(
"touchend",
event => {

if (
isOpening ||
isClosing
) {

return;

}

const touch =
event.changedTouches[0];

const differenceX =
touch.screenX -
touchStartX;

const differenceY =
touch.screenY -
touchStartY;

if (
Math.abs(differenceX) > 50 &&
Math.abs(differenceX) >
Math.abs(differenceY)
) {

flipMovie();

}

},
{
passive: true
}
);

// =========================================================
// FILTER BUTTONS
// =========================================================

filters.forEach(
button => {

button.addEventListener(
"click",
() => {

sandraBullockModeActive =
false;

const group =
button.dataset.filterGroup;

const value =
button.dataset.filterValue;

// =====================================================
// TYPE
// =====================================================

/*

* No "All" button — clicking the already-active pill
* turns it back off (activeFilters.type = "all"),
* same toggle pattern Genre/Category already use.
  */

if (group === "type") {

if (
activeFilters.type ===
value
) {

activeFilters.type =
"all";

triggerRewindEffect();

button.classList.remove(
"active"
);

} else {

activeFilters.type =
value;

/*

* Only fires switching TO tv, not away from it or on a
* toggle-off (that's the branch above, which goes to
* "all" and triggers the rewind effect instead).
  */

if (value === "tv") {

triggerColorBars();

}

document
.querySelectorAll(
'[data-filter-group="type"]'
)
.forEach(
b =>
b.classList.toggle(
"active",
b.dataset.filterValue ===
value
)
);

}

}

// =====================================================
// MEDIA
// =====================================================

/*

* Same toggle-off pattern as Type — no "All" button.
  */

if (group === "media") {

if (
activeFilters.media ===
value
) {

activeFilters.media =
"all";

} else {

activeFilters.media =
value;

}

syncMediaFilterUI();

}

// =====================================================
// CATEGORY
// =====================================================

if (group === "category") {

if (
activeFilters.category ===
value
) {

activeFilters.category =
null;

button.classList.remove(
"active"
);

} else {

activeFilters.category =
value;

/*

* Fires only when switching TO these specific categories,
* not on toggle-off (that's the branch above) or when
* switching between other category filters.
  */

if (value === "christmas") {

triggerChristmasLights();

}

if (value === "baseball") {

triggerBaseballScoreboard();

}

document
.querySelectorAll(
'[data-filter-group="category"]'
)
.forEach(
b =>
b.classList.toggle(
"active",
b.dataset.filterValue ===
value
)
);

}

}

// =====================================================
// ANIMATED
// =====================================================

if (group === "animated") {

if (
activeFilters.animated ===
"mixed"
) {

activeFilters.animated =
"hide";

} else if (
activeFilters.animated ===
"hide"
) {

activeFilters.animated =
"only";

} else {

activeFilters.animated =
"mixed";

}

updateAnimatedButton();

/*

* Sparkle arc fires only when switching TO "only" — not on
* "hide" or "mixed".
  */

if (activeFilters.animated === "only") {

triggerSparkleArc();

}

}

// =====================================================
// RANDOM MODE
// =====================================================

if (randomMode) {

generateRandomMovies();

}

renderMovies();

}
);

}
);

// =========================================================
// MEDIA FILTER SYNC (PILLS + MOBILE DROPDOWN)
// =========================================================

/*

* Media has two different controls now — desktop pills and
* a mobile dropdown — that both drive the same
* activeFilters.media value. Whichever one changes, this
* keeps the OTHER one visually consistent too, so a mid-
* session resize (going from mobile width to desktop width
* or back) never leaves the now-visible control looking
* stale relative to what's actually filtered.
  */

function syncMediaFilterUI() {

document
.querySelectorAll(
'[data-filter-group="media"]'
)
.forEach(
b =>
b.classList.toggle(
"active",
b.dataset.filterValue ===
activeFilters.media
)
);

if (mediaFilterMobile) {

mediaFilterMobile.value =
activeFilters.media;

}

}

if (mediaFilterMobile) {

mediaFilterMobile.addEventListener(
"change",
event => {

sandraBullockModeActive =
false;

activeFilters.media =
event.target.value;

syncMediaFilterUI();

if (randomMode) {

generateRandomMovies();

}

renderMovies();

}
);

}

// =========================================================
// GENRE DROPDOWN
// =========================================================

/*

* Genre lives as a <select>, not pills — includes
* "Classic", which getFilteredMovies() treats as a
* computed year rule, not a text tag (see below).
  */

if (genreFilter) {

genreFilter.addEventListener(
"change",
event => {

sandraBullockModeActive =
false;

activeFilters.genre =
event.target.value ||
null;

if (event.target.value === "") {

triggerRewindEffect();

}

/*

* Classic is a toggle, not a one-shot effect - grayscale
* applies whenever "classic" is the selected value and is
* removed for anything else, including switching back to
* "All Genres" (which also fires the rewind effect above,
* so the two play together - color visibly rewinding back
* into the shelf).
  */

document.body.classList.toggle(
"classic-mode",
event.target.value === "classic"
);

if (event.target.value === "action") {

triggerActionBullets();

}

if (event.target.value === "comedy") {

triggerComedyHaha();

}

if (event.target.value === "drama") {

triggerDramaTears();

}

if (event.target.value === "horror") {

triggerHorrorSlash();

}

if (event.target.value === "thriller") {

triggerThrillerFlashlight();

}

if (event.target.value === "rom-com") {

triggerHeartFlood();

/*

* Reveals every rom-com movie's heart at once, not just
* the ones currently visible under other active filters —
* visiting the Rom-Com filter should permanently unlock
* the badge for the whole category, not just whatever
* happened to be on screen at that moment.
  */

movies.forEach(
candidateMovie => {

const candidateGenre =
(candidateMovie.genre || "")
.toLowerCase();

if (
candidateGenre.includes(
"rom-com"
)
) {

heartsRevealedMovieIds.add(
getMovieId(
candidateMovie
)
);

}

}
);

}

genreFilter.classList.toggle(
"active",
event.target.value !== ""
);

if (randomMode) {

generateRandomMovies();

}

renderMovies();

}
);

}

// =========================================================
// RESERVATION DROPDOWN
// =========================================================

if (reservationFilter) {

reservationFilter.addEventListener(
"change",
event => {

activeFilters.reservation =
event.target.value;

reservationFilter.classList.toggle(
"active",
event.target.value !== "all"
);

if (randomMode) {

generateRandomMovies();

}

renderMovies();

}
);

}

// =========================================================
// UPDATE ANIMATED BUTTON
// =========================================================

function updateAnimatedButton() {

const animatedButton =
document.querySelector(
'[data-filter-group="animated"]'
);

if (!animatedButton) {
return;
}

if (
activeFilters.animated ===
"mixed"
) {

animatedButton.textContent =
"Animated: Mixed";

animatedButton.classList.add(
"active"
);

}

if (
activeFilters.animated ===
"hide"
) {

animatedButton.textContent =
"Animated: Hide";

animatedButton.classList.remove(
"active"
);

}

if (
activeFilters.animated ===
"only"
) {

animatedButton.textContent =
"Animated: Only";

animatedButton.classList.add(
"active"
);

}

}

// =========================================================
// GET CURRENT FILTERED MOVIES
// =========================================================

function getFilteredMovies() {

if (sandraBullockModeActive) {

return movies.filter(
m =>
m.cast &&
m.cast.includes(
"Sandra Bullock"
)
);

}

return movies.filter(
movie => {

// =====================================================
// TYPE
// =====================================================

if (
activeFilters.type !== "all" &&
movie.type !== activeFilters.type
) {

return false;

}

// =====================================================
// MEDIA
// =====================================================

if (
activeFilters.media === "physical" &&
(
!Array.isArray(movie.physical) ||
movie.physical.length === 0
)
) {

return false;

}

if (
activeFilters.media === "digital" &&
(
!Array.isArray(movie.digital) ||
movie.digital.length === 0
)
) {

return false;

}

// =====================================================
// GENRE
// =====================================================

/*

* "Classic" is a computed rule (year < 1980), not a
* text tag on the movie — so it stays correct on its
* own as movies are added, with nothing to manually
* tag in movies.js. Every other genre still matches
* by text as before.
  */

if (activeFilters.genre) {

if (activeFilters.genre === "classic") {

const movieYear =
parseInt(
movie.year,
10
);

if (
Number.isNaN(movieYear) ||
movieYear >= 1980
) {

return false;

}

} else {

const movieGenre =
(movie.genre || "")
.toLowerCase();

if (
!movieGenre.includes(
activeFilters.genre.toLowerCase()
)
) {

return false;

}

}

}

// =====================================================
// CATEGORY
// =====================================================

if (activeFilters.category) {

const categories =
Array.isArray(movie.categories)
? movie.categories
: [];

if (
!categories.includes(
activeFilters.category
)
) {

return false;

}

}

// =====================================================
// RATED
// =====================================================

/*

* Multi-select — a movie passes if its rated value is
* ANY of the checked ratings, not all of them. Works
* whether or not any search text has been typed, and
* combines with every other active filter, same as
* Genre or Category — this never looks at currentSearch
* at all.
  */

if (activeFilters.rated.length > 0) {

if (
!activeFilters.rated.includes(
movie.rated
)
) {

return false;

}

}

// =====================================================
// ANIMATED
// =====================================================

const isAnimated =
Array.isArray(movie.categories) &&
movie.categories.includes(
"animated"
);

if (
activeFilters.animated === "hide" &&
isAnimated
) {

return false;

}

if (
activeFilters.animated === "only" &&
!isAnimated
) {

return false;

}

// =====================================================
// RESERVATION FILTER
// =====================================================

if (
activeFilters.reservation !== "all"
) {

const movieReservations =
getMovieReservations(
movie
);

const reservedForPerson =
movieReservations.some(
reservation =>
reservation.reserved_for ===
activeFilters.reservation
);

if (!reservedForPerson) {

return false;

}

}

// =====================================================
// SEARCH
// =====================================================

if (currentSearch) {

const searchText =
currentSearch.toLowerCase();

const searchableText = [

movie.title,
movie.tmdbTitle,
movie.year,
movie.genre,
movie.director,
movie.cast,
movie.synopsis,
movie.type

]
.filter(
value =>
value !== null &&
value !== undefined
)
.join(" ")
.toLowerCase();

if (
!searchableText.includes(
searchText
)
) {

return false;

}

}

return true;

}
);

}

// =========================================================
// GENERATE RANDOM 16
// =========================================================

function generateRandomMovies() {

const availableMovies =
getFilteredMovies();

const shuffled =
[...availableMovies];

// Fisher-Yates shuffle

for (
let i =
shuffled.length - 1;

i > 0;

i--

) {

const j =
Math.floor(
Math.random() *
(i + 1)
);

[
shuffled[i],
shuffled[j]
] =
[
shuffled[j],
shuffled[i]
];

}

randomMovies =
shuffled.slice(
0,
16
);

}

// =========================================================
// STAFF PICKS / SHOW ALL (MERGED TOGGLE)
// =========================================================

/*

* One button doing what used to be two — "Show All" only
* ever had one job (undo Staff Picks), which made it a
* toggle already, just built as two separate buttons. The
* label describes what clicking it does NEXT, not the
* current state (like a play/pause button showing "Pause"
* while playing) — Staff Picks -> tap -> Show All -> tap ->
* back to Staff Picks.
  */

if (randomButton) {

randomButton.addEventListener(
"click",
() => {

sandraBullockModeActive =
false;

randomMode =
!randomMode;

if (randomMode) {

generateRandomMovies();

randomButton.textContent =
"Show All";

randomButton.classList.add(
"active"
);

} else {

randomMovies =
[];

randomButton.textContent =
"Staff Picks";

randomButton.classList.remove(
"active"
);

}

renderMovies();

}
);

}

// =========================================================
// MARQUEE LIGHTS (DEFAULT THEME ONLY)
// =========================================================

/*

* Opposite of every arcade feature — these are hidden BY
* CSS when body.theme-arcade is present, so building/timing
* them regardless of theme is harmless; they simply won't be
* visible while arcade mode is active.
*
* Bulb placement: computes ONE set of x-positions and ONE
* set of y-positions, then uses each set for BOTH opposite
* edges (reversed for the second one). That guarantees the
* top and bottom edges always have identically-placed bulbs,
* and same for left/right — the earlier version computed
* each of the four edges independently with separate
* start/stop math, which could quietly drift out of sync
* with each other and leave gaps.
  */

let marqueeBulbs =
[];

let marqueeChaseInterval =
null;

let marqueePoppedOnce =
false;

function buildMarqueeBulbs() {

const container =
document.querySelector(
".marquee-frame"
);

if (!container) {

return;

}

container
.querySelectorAll(
".marquee-bulb"
)
.forEach(
bulb =>
bulb.remove()
);

const fw =
container.offsetWidth;

const fh =
container.offsetHeight;

const spacing =
20;

const inset =
-8;

const bulbSize =
7;

const half =
bulbSize / 2;

/*

* Every position below is a bulb CENTER — converted to a
* top-left CSS position uniformly at the very end, for every
* bulb with no exceptions. The previous version compensated
* for bulb size only at the bottom-edge corners (a "-7"
* adjustment) but never on the interior points used for the
* left/right edges — that mismatch between two different
* conventions is exactly what made vertical edges look off
* while horizontal ones (which never mixed conventions)
* looked fine.
  */

const leftEdge =
inset + half;

const rightEdge =
fw - inset - half;

const topEdge =
inset + half;

const bottomEdge =
fh - inset - half;

const nx =
Math.max(
2,
Math.round(
(rightEdge - leftEdge) / spacing
)
);

const ny =
Math.max(
2,
Math.round(
(bottomEdge - topEdge) / spacing
)
);

const xCenters =
[];

for (
let i = 0;
i <= nx;
i++
) {

xCenters.push(
leftEdge +
(i * (rightEdge - leftEdge)) / nx
);

}

const yCenters =
[];

for (
let i = 1;
i < ny;
i++
) {

yCenters.push(
topEdge +
(i * (bottomEdge - topEdge)) / ny
);

}

const centers =
[];

xCenters.forEach(
x =>
centers.push(
{ x: x, y: topEdge }
)
);

yCenters.forEach(
y =>
centers.push(
{ x: rightEdge, y: y }
)
);

[...xCenters]
.reverse()
.forEach(
x =>
centers.push(
{ x: x, y: bottomEdge }
)
);

[...yCenters]
.reverse()
.forEach(
y =>
centers.push(
{ x: leftEdge, y: y }
)
);

marqueeBulbs =
centers.map(
c => {

const bulb =
document.createElement(
"div"
);

bulb.className =
"marquee-bulb lit";

bulb.style.left =
`${c.x - half}px`;

bulb.style.top =
`${c.y - half}px`;

container.appendChild(
bulb
);

return bulb;

}
);

}

function startMarqueeChase() {

if (
marqueePoppedOnce ||
marqueeBulbs.length === 0
) {

return;

}

const windowSize =
3;

let position =
0;

let steps =
0;

const totalSteps =
marqueeBulbs.length * 3;

marqueeChaseInterval =
setInterval(
() => {

marqueeBulbs.forEach(
bulb =>
bulb.classList.remove(
"lit"
)
);

for (
let i = 0;
i < windowSize;
i++
) {

marqueeBulbs[
(position + i) %
marqueeBulbs.length
].classList.add(
"lit"
);

}

position =
(position + 1) %
marqueeBulbs.length;

steps++;

if (steps >= totalSteps) {

clearInterval(
marqueeChaseInterval
);

popMarqueeBulb();

}

},
180
);

}

function popMarqueeBulb() {

marqueePoppedOnce =
true;

marqueeBulbs.forEach(
bulb =>
bulb.classList.remove(
"lit"
)
);

/*

* The strobing "active" flash used to fire right here, on
* burn-out. Moved to triggerMarqueeReset() instead, timed
* to land just before the random movie opens - see the
* comment there for why.
  */

/*

* Reset button lights up 7 seconds after the bulbs
* actually pop — tied to this real event rather than a
* separately-estimated "23s plus however long the chase
* ran" number, so it's always correct regardless of chase
* timing.
  */

setTimeout(
() => {

if (marqueeResetButton) {

marqueeResetButton.classList.add(
"lit"
);

}

if (marqueeResetButtonMobile) {

marqueeResetButtonMobile.classList.add(
"lit"
);

}

},
7000
);

/*

* Independent random per bulb naturally produces the
* irregular clumpy look asked for (a couple on, one off,
* a few off) — no special clustering logic needed, that's
* just what a random sequence looks like.
  */

setTimeout(
() => {

marqueeBulbs.forEach(
bulb => {

bulb.classList.remove(
"dead"
);

if (Math.random() < 0.65) {

bulb.classList.add(
"lit"
);

} else {

bulb.classList.add(
"dead"
);

}

}
);

},
300
);

}

buildMarqueeBulbs();

/*

* Rebuilds once the custom fonts are actually applied —
* the very first build above happens synchronously as this
* script runs, which can be before VT323/Iceland have
* finished loading, so that initial measurement may reflect
* a fallback font's (different) width rather than the final
* one. document.fonts.ready resolves once real fonts are in
* place, giving an accurate second measurement.
  */

if (
document.fonts &&
document.fonts.ready
) {

document.fonts.ready.then(
() => {

if (!marqueePoppedOnce) {

buildMarqueeBulbs();

}

}
);

}

let marqueeChaseTimeout =
null;

function scheduleMarqueeChase() {

clearTimeout(
marqueeChaseTimeout
);

marqueeChaseTimeout =
setTimeout(
startMarqueeChase,
18000
);

}

/*

* Called both on initial page load (if classic is the active
* theme) and every time you switch INTO classic theme — a
* fresh entry always starts from "all lit" with a full
* countdown, rather than picking up wherever a background
* timer happened to be. Deliberately silent (no flash, no
* random movie) unlike the manual reset button, since
* switching themes isn't a click on that button.
  */

function resetMarqueeForThemeEntry() {

clearInterval(
marqueeChaseInterval
);

marqueePoppedOnce =
false;

buildMarqueeBulbs();

scheduleMarqueeChase();

}

if (
!document.body.classList.contains(
"theme-arcade"
)
) {

resetMarqueeForThemeEntry();

}

let marqueeResizeTimeout =
null;

window.addEventListener(
"resize",
() => {

clearTimeout(
marqueeResizeTimeout
);

marqueeResizeTimeout =
setTimeout(
() => {

/*

* Only rebuilds pre-pop — once it's settled into its
* random pattern, a resize shouldn't wipe that out and
* reset everything back to a fresh dim string.
  */

if (!marqueePoppedOnce) {

buildMarqueeBulbs();

}

},
150
);

}
);

// =========================================================
// ORIENTATION CHANGE (LONGER SETTLE DELAY)
// =========================================================

/*

* Separate from the regular resize handling above — mobile
* Safari is known to fire "resize" mid-rotation, before the
* viewport has actually finished settling into its new
* dimensions, so code that measures element sizes right
* then can grab transient, incorrect numbers (this is the
* most likely explanation for the marquee/shelf occasionally
* rendering wrong after a rotation). A longer delay here
* gives the browser time to actually finish before anything
* gets re-measured.
  */

let orientationSettleTimeout =
null;

window.addEventListener(
"orientationchange",
() => {

clearTimeout(
orientationSettleTimeout
);

orientationSettleTimeout =
setTimeout(
() => {

scheduleShelfUpdate();

if (!marqueePoppedOnce) {

buildMarqueeBulbs();

}

},
400
);

}
);

// =========================================================
// MARQUEE RESET BUTTON
// =========================================================

const marqueeResetButton =
document.getElementById(
"marquee-reset-button"
);

function triggerMarqueeReset() {

clearInterval(
marqueeChaseInterval
);

marqueePoppedOnce =
false;

buildMarqueeBulbs();

scheduleMarqueeChase();

/*

* "Light turning on" — a single bright fade-in-then-out,
* deliberately a different animation from the mid-sequence
* pop's strobing flicker, so the two moments feel distinct
* rather than reusing the exact same effect for two
* different meanings.
  */

const flashOverlay =
document.getElementById(
"marquee-pop-flash"
);

if (flashOverlay) {

flashOverlay.classList.remove(
"light-on"
);

void flashOverlay.offsetWidth;

flashOverlay.classList.add(
"light-on"
);

}

/*

* Same random-card-click mechanic the coin slot already
* uses — picks from whatever's actually on screen right
* now, opened through the real flight animation rather
* than a separate open path.
  */

setTimeout(
() => {

if (
isOpening ||
isClosing ||
currentMovie
) {

return;

}

const cards =
movieGrid.querySelectorAll(
".movie-card"
);

if (cards.length > 0) {

const randomCard =
cards[
Math.floor(
Math.random() *
cards.length
)
];

randomCard.click();

}

},
500
);

}

if (marqueeResetButton) {

marqueeResetButton.addEventListener(
"click",
triggerMarqueeReset
);

}

if (marqueeResetButtonMobile) {

marqueeResetButtonMobile.addEventListener(
"click",
triggerMarqueeReset
);

}

// =========================================================
// COIN SLOT
// =========================================================

/*

* Faint until 18 seconds into being in arcade theme —
* called both on initial load (if arcade is the active
* theme) and every time you switch INTO arcade, always
* starting a fresh countdown rather than a timer that's
* been silently running since page load regardless of
* which theme was showing.
  */

let coinRevealTimeout =
null;

function scheduleCoinReveal() {

clearTimeout(
coinRevealTimeout
);

if (coinSlotButton) {

coinSlotButton.classList.remove(
"lit"
);

}

if (coinSlotButtonMobile) {

coinSlotButtonMobile.classList.remove(
"lit"
);

}

coinRevealTimeout =
setTimeout(
() => {

if (coinSlotButton) {

coinSlotButton.classList.add(
"lit"
);

}

if (coinSlotButtonMobile) {

coinSlotButtonMobile.classList.add(
"lit"
);

}

},
18000
);

}

if (
document.body.classList.contains(
"theme-arcade"
)
) {

scheduleCoinReveal();

}

// =========================================================
// FLAVOR TEXT
// =========================================================

/*

* Special-date entries take priority over the generic
* fallback — checked against today's real date every time
* the site loads. To add more, just add another object to
* this array; nothing else needs to change. month is 1-12
* (not 0-11) to match how a person would actually write a
* date.
  */

const specialDateFlavorText =
[
{ month: 1, day: 1, text: "Somewhere, Rocky's stepping into the ring against Apollo today." },
{ month: 1, day: 1, text: "Rocky vs. Apollo, Superfight II, bell rings today." },
{ month: 1, day: 6, text: "Happy birthday to Sherlock Holmes." },
{ month: 1, day: 12, text: "HAL 9000 goes online today. I'm sorry, Dave." },
{ month: 1, day: 29, text: "The Truman Show just premiered." },
{ month: 2, day: 2, text: "Phil Connors is not going to Pittsburgh today." },
{ month: 2, day: 14, text: "Ghostbusters II predicted the world would end today but I ain't afraid." },
{ month: 3, day: 2, text: "First contact with extraterrestrials, according to Men in Black." },
{ month: 3, day: 24, text: "A brain, an athlete, a basket case, a princess, and a criminal walk into Saturday detention today." },
{ month: 4, day: 8, text: "Rex Manning Day! Say no more." },
{ month: 4, day: 14, text: "T.S. and Brodie are having a rough day at the mall right about now." },
{ month: 4, day: 14, text: "Jack's sketching Rose aboard the Titanic right now." },
{ month: 4, day: 15, text: "Dante and Randal are opening the Quick Stop. They shouldn't even be working today." },
{ month: 4, day: 25, text: "Not too hot, not too cold. All you need is a light jacket." },
{ month: 5, day: 12, text: "Kyle Reese just arrived in 1984 to protect Sarah Connor." },
{ month: 7, day: 2, text: "The aliens may arrive today, this time without the oops." },
{ month: 7, day: 31, text: "The guys just landed in Vegas for Doug's bachelor party. This won't end well." },
{ month: 7, day: 31, text: "Happee Birthdae Harry Potter — Hagrid's on his way with a letter and a cake." },
{ month: 8, day: 4, text: "Skynet goes online today..." },
{ month: 8, day: 23, text: "A massive earthquake just turned LA into an island. Can Snake escape?" },
{ month: 8, day: 29, text: "Judgment Day. Skynet just became self-aware." },
{ month: 9, day: 2, text: "Marty just landed in the Old West." },
{ month: 9, day: 25, text: "LA just recorded its last murder, the 3 sea shells are coming soon." },
{ month: 10, day: 3, text: "It's October 3rd, my new favorite day!" },
{ month: 10, day: 10, text: "The Cubs just beat Miami to win the World Series today." },
{ month: 10, day: 18, text: "The Joker's robbing a bank today." },
{ month: 10, day: 21, text: "Back to the Future Day — Marty, Doc, and Jennifer just landed in 2015." },
{ month: 10, day: 27, text: "Marty's finally heading back to the future from the old west." },
{ month: 10, day: 28, text: "Zuckerberg just launched Facemash." },
{ month: 10, day: 31, text: "Cobra Kai's crashing the Halloween dance about now." },
{ month: 11, day: 2, text: "E.T. is phoning home today." },
{ month: 11, day: 2, text: "The Cubs actually just won the World Series in 2016!" },
{ month: 11, day: 5, text: "Marty just arrived in 1955." },
{ month: 11, day: 5, text: "Remember, remember — V's blowing up the Old Bailey today." },
{ month: 11, day: 12, text: "Lightning strike incoming — Marty's about to head back to 1985." },
{ month: 12, day: 24, text: "Yippee-ki-yay — the Nakatomi Plaza Christmas party is tonight." },
{ month: 12, day: 25, text: "Rocky's fighting Ivan Drago in Moscow today. Merry Christmas." }
];

const genericFlavorText =
[
{ startHour: 5, endHour: 11, text: "Morning movie? No judgment here." },
{ startHour: 5, endHour: 11, text: "Morning movie? Feels like time for a comedy." },
{ startHour: 5, endHour: 11, text: "Morning movie? Maybe choose Fight Club." },
{ startHour: 11, endHour: 17, text: "Afternoon browsing — take your time." },
{ startHour: 11, endHour: 17, text: "Afternoon browsing — hurry it up!" },
{ startHour: 11, endHour: 17, text: "Afternoon browsing — Feels like Fight Club o' clock." },
{ startHour: 17, endHour: 22, text: "Prime time. What's the pick tonight?" },
{ startHour: 17, endHour: 22, text: "Prime time for an Action movie!" },
{ startHour: 17, endHour: 22, text: "Prime time. I have a suggestion but the first rule is I can't talk about it" },
{ startHour: 22, endHour: 24, text: "Late one tonight — maybe a baseball movie?" },
{ startHour: 22, endHour: 24, text: "Late one tonight — anything good playing?" },
{ startHour: 22, endHour: 24, text: "Late one tonight — Fight Club feels right." },
{ startHour: 0, endHour: 5, text: "Up late browsing? We won't tell." },
{ startHour: 0, endHour: 5, text: "Up late browsing? Just choose a Rom-Com already!" },
{ startHour: 0, endHour: 5, text: "Insomnia leads to Tyler Durden which leads to Fight Club." }
];


function renderFlavorText() {

const flavorTextEl =
document.getElementById(
"flavor-text"
);

if (!flavorTextEl) {

return;

}

const now =
new Date();

const currentMonth =
now.getMonth() + 1;

const currentDay =
now.getDate();

/*

* filter (not find) — several dates now have more than one
* matching movie, so this collects all of today's matches
* and picks randomly among them rather than always favoring
* whichever happens to be listed first in the array.
  */

const specialMatches =
specialDateFlavorText.filter(
entry =>
entry.month === currentMonth &&
entry.day === currentDay
);

if (specialMatches.length > 0) {

const randomMatch =
specialMatches[
Math.floor(
Math.random() *
specialMatches.length
)
];

flavorTextEl.textContent =
randomMatch.text;

return;

}

const currentHour =
now.getHours();

/*

* filter (not find) — same reasoning as the special-date
* lookup above. find() was the actual bug: it always
* returns the FIRST entry matching the current hour range,
* so adding more options per time-of-day had no visible
* effect at all, no matter how many entries existed for
* that bracket.
  */

const genericMatches =
genericFlavorText.filter(
entry =>
currentHour >= entry.startHour &&
currentHour < entry.endHour
);

const genericMatch =
genericMatches.length > 0
? genericMatches[
Math.floor(
Math.random() *
genericMatches.length
)
]
: null;

flavorTextEl.textContent =
genericMatch
? genericMatch.text
: "";

}

renderFlavorText();

let coinSlotBusy =
false;

function triggerCoinSlot() {

/*

* Same guards used everywhere else a movie could open —
* refuses to fire while something's already opening,
* closing, or open, plus its own busy flag for the brief
* window between the flash starting and the random card
* actually getting clicked.
  */

if (
coinSlotBusy ||
isOpening ||
isClosing ||
currentMovie
) {

return;

}

const cards =
movieGrid.querySelectorAll(
".movie-card"
);

if (cards.length === 0) {

return;

}

coinSlotBusy =
true;

if (coinFlickerOverlay) {

coinFlickerOverlay.classList.remove(
"active"
);

/*

* Forces a reflow so the animation restarts cleanly
* if this ever fires again shortly after finishing.
  */

void coinFlickerOverlay.offsetWidth;

coinFlickerOverlay.classList.add(
"active"
);

}

setTimeout(
() => {

/*

* Re-queried here rather than reusing the NodeList
* captured above, in case a render happened during
* the flash (reservations loading, etc.) — picks
* from whatever's actually on screen right now.
  */

const currentCards =
movieGrid.querySelectorAll(
".movie-card"
);

if (currentCards.length > 0) {

const randomCard =
currentCards[
Math.floor(
Math.random() *
currentCards.length
)
];

randomCard.click();

}

coinSlotBusy =
false;

},
700
);

}

if (coinSlotButton) {

coinSlotButton.addEventListener(
"click",
triggerCoinSlot
);

}

if (coinSlotButtonMobile) {

coinSlotButtonMobile.addEventListener(
"click",
triggerCoinSlot
);

}

// =========================================================
// SEARCH
// =========================================================

if (searchToggle) {

searchToggle.addEventListener(
"click",
() => {

searchArea.classList.toggle(
"hidden"
);

if (
!searchArea.classList.contains(
"hidden"
)
) {

searchInput.focus();

}

}
);

}

if (searchInput) {

searchInput.addEventListener(
"input",
event => {

sandraBullockModeActive =
false;

currentSearch =
event.target.value.trim();

if (searchClearButton) {

searchClearButton.classList.toggle(
"hidden",
currentSearch === ""
);

}

if (randomMode) {

generateRandomMovies();

}

renderMovies();

}
);

}

if (searchClearButton) {

searchClearButton.addEventListener(
"click",
() => {

searchInput.value =
"";

sandraBullockModeActive =
false;

currentSearch =
"";

searchClearButton.classList.add(
"hidden"
);

if (randomMode) {

generateRandomMovies();

}

renderMovies();

searchInput.focus();

}
);

}

// =========================================================
// RATED FILTER (popover in the search bar)
// =========================================================

/*

* Entirely independent of search text — this only ever
* touches activeFilters.rated, the same way Genre and
* Category touch their own fields, so a rating filters the
* shelf whether or not anything is typed in the search box.
  */

const ratedFilterButton =
document.getElementById(
"rated-filter-button"
);

const ratedFilterPopover =
document.getElementById(
"rated-filter-popover"
);

const ratedFilterCount =
document.getElementById(
"rated-filter-count"
);

const ratedFilterClear =
document.getElementById(
"rated-filter-clear"
);

const ratedFilterCheckboxes =
document.querySelectorAll(
".rated-filter-checkbox"
);

function updateRatedFilterUI() {

const count =
activeFilters.rated.length;

if (ratedFilterCount) {

ratedFilterCount.textContent =
String(count);

ratedFilterCount.classList.toggle(
"hidden",
count === 0
);

}

if (ratedFilterButton) {

ratedFilterButton.classList.toggle(
"active",
count > 0
);

}

}

function closeRatedFilterPopover() {

if (!ratedFilterPopover) {

return;

}

ratedFilterPopover.classList.add(
"hidden"
);

if (ratedFilterButton) {

ratedFilterButton.setAttribute(
"aria-expanded",
"false"
);

}

}

if (ratedFilterButton && ratedFilterPopover) {

ratedFilterButton.addEventListener(
"click",
event => {

event.stopPropagation();

const isHidden =
ratedFilterPopover.classList.contains(
"hidden"
);

ratedFilterPopover.classList.toggle(
"hidden",
!isHidden
);

ratedFilterButton.setAttribute(
"aria-expanded",
isHidden ? "true" : "false"
);

}
);

/*

* Closes on any click outside the button/popover pair —
* checked on every document click rather than a one-off
* listener per open, since the popover can open and close
* many times across a session.
  */

document.addEventListener(
"click",
event => {

if (
!ratedFilterPopover.contains(
event.target
) &&
!ratedFilterButton.contains(
event.target
)
) {

closeRatedFilterPopover();

}

}
);

}

ratedFilterCheckboxes.forEach(
checkbox => {

checkbox.addEventListener(
"change",
() => {

if (checkbox.checked) {

if (
!activeFilters.rated.includes(
checkbox.value
)
) {

activeFilters.rated.push(
checkbox.value
);

}

} else {

activeFilters.rated =
activeFilters.rated.filter(
value =>
value !== checkbox.value
);

}

updateRatedFilterUI();

if (randomMode) {

generateRandomMovies();

}

renderMovies();

}
);

}
);

if (ratedFilterClear) {

ratedFilterClear.addEventListener(
"click",
event => {

event.stopPropagation();

activeFilters.rated =
[];

ratedFilterCheckboxes.forEach(
checkbox => {

checkbox.checked =
false;

}
);

updateRatedFilterUI();

if (randomMode) {

generateRandomMovies();

}

renderMovies();

}
);

}

// =========================================================
// PREVENT BACKGROUND SCROLL
// WHILE MOVIE IS OPEN
// =========================================================

if (modal) {

  // -------------------------------------------------------
  // TOUCH SCROLLING
  //
  // Allow .back-content to scroll normally.
  // Prevent touch scrolling everywhere else in the modal
  // so the page behind the movie stays locked.
  // -------------------------------------------------------

  modal.addEventListener(
    "touchmove",
    event => {

      if (!currentMovie) {
        return;
      }

      const backContent =
        event.target.closest(
          ".back-content"
        );

      // Let the movie information area scroll.
      if (backContent) {
        return;
      }

      // Prevent the background/modal from scrolling.
      event.preventDefault();

    },
    {
      passive: false
    }
  );

  // -------------------------------------------------------
  // MOUSE / TRACKPAD WHEEL
  //
  // Allow .back-content to scroll with a mouse wheel or
  // trackpad, but prevent the background from scrolling.
  // -------------------------------------------------------

  modal.addEventListener(
    "wheel",
    event => {

      if (!currentMovie) {
        return;
      }

      const backContent =
        event.target.closest(
          ".back-content"
        );

      // Let the movie information area scroll.
      if (backContent) {
        return;
      }

      // Prevent the background/modal from scrolling.
      event.preventDefault();

    },
    {
      passive: false
    }
  );

}
