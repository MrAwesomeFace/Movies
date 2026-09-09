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
reservation: "all"
};

/*

* Fast & Furious rush Easter egg state — a Set (not a
* Fast & Furious rush Easter egg state — fires on the
* first movie closed that features one of the trigger
* actors (see openMovieFromCard). fastFuriousTriggerFired
* is set true the moment a qualifying movie opens;
* fastFuriousRushTriggered ensures the rush itself only
* plays once per session even if more qualifying movies
* get opened afterward.
  */

let fastFuriousTriggerFired =
false;

let fastFuriousRushTriggered =
false;

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

* When true, getFilteredMovies() returns ONLY the franchise
* regardless of activeFilters — this is what makes the rush
* result persist correctly through opening and closing
* other movies afterward, since finishCloseMovie() calls
* the normal renderMovies() -> getFilteredMovies() path.
* Reset to false by any real filter interaction (see the
* filter/genre/reservation/search/staff-picks handlers),
* since touching an actual filter is the natural signal
* that the person wants to leave this view.
  */

let fastFuriousRushActive =
false;

/*

* Same pattern as fastFuriousRushActive above — without
* this, the Sandra Bullock view reverted the instant you
* opened and closed any other movie, since the original
* version bypassed activeFilters with a one-time direct
* grid rewrite that nothing downstream knew about.
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
* was computed from the whole catalog before either mode
* existed, so intersecting against it would silently corrupt
* or empty out the F&F/Sandra Bullock result.
  */

if (
randomMode &&
!fastFuriousRushActive &&
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
activeFilters.reservation !== "all";

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

* Set to 1 (100%) for testing per request — drop back down
* to the real target rate (around 0.35) once it's confirmed
* to look right across a range of real movies.
  */

let nowShowingChance =
1;

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

* Fast & Furious rush trigger — fires on the first movie
* opened featuring any of these actors, not specifically
* on Fast & Furious titles. Case-insensitive substring
* match against the cast field.
  */

const fastFuriousTriggerActors =
[
"vin diesel",
"paul walker",
"jason statham",
"dwayne johnson"
];

if (
movie.cast &&
fastFuriousTriggerActors.some(
actor =>
movie.cast
.toLowerCase()
.includes(actor)
)
) {

fastFuriousTriggerFired =
true;

}

/*

* Glass shatter easter egg — fires on Rocky or Creed
* titles, or any movie featuring Sylvester Stallone in the
* cast, whichever franchise it's from (Rambo, Expendables,
* etc). Same case-insensitive substring pattern as the
* Fast & Furious trigger above. Fires immediately on click,
* on the card itself, before it flies into the modal.
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

content.style.transition =
"left 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"top 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"width 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"height 0.9s cubic-bezier(0.16, 1, 0.3, 1), " +
"box-shadow 0.65s ease";

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

},
930
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

// =========================================================
// ANIMATE BACK TO ORIGINAL POSTER POSITION
// =========================================================

content.style.transition =
"left 0.55s cubic-bezier(0.4, 0, 0.8, 0.2), " +
"top 0.55s cubic-bezier(0.4, 0, 0.8, 0.2), " +
"width 0.55s cubic-bezier(0.4, 0, 0.8, 0.2), " +
"height 0.55s cubic-bezier(0.4, 0, 0.8, 0.2), " +
"box-shadow 0.45s ease";

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

setTimeout(
() => {

finishCloseMovie();

},
580
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

if (
fastFuriousTriggerFired &&
!fastFuriousRushTriggered
) {

fastFuriousRushTriggered =
true;

triggerFastFuriousRush();

}

}

/*

* Fast & Furious rush — triggered once, after the second
* distinct entry in the franchise has been opened this
* session. Every other card exits fast, then the grid
* re-renders filtered to just the franchise, with those
* cards rushing back in. Bypasses the normal activeFilters
* system on purpose (same reasoning as the Sandra Bullock
* Easter egg) — this is a one-off surprise, not a real,
* persistent filter state.
  */

function triggerFastFuriousRush() {

const allCards =
movieGrid.querySelectorAll(
".movie-card"
);

allCards.forEach(
card => {

const title =
(
card.dataset.movieTitle ||
""
).toLowerCase();

if (
!title.startsWith(
"fast & furious"
)
) {

const distance =
450 +
Math.random() * 250;

card.style.setProperty(
"--rush-x",
`${distance}px`
);

card.classList.add(
"rush-exit"
);

}

}
);

setTimeout(
() => {

fastFuriousRushActive =
true;

sandraBullockModeActive =
false;

renderMovies();

const enteringCards =
movieGrid.querySelectorAll(
".movie-card"
);

/*

* Staggered via animation-delay per card (not by adding
* the class at different times) — this needs the cleanup
* below to wait for the LAST card's delayed animation to
* actually finish, since removing the class early cancels
* an animation that hasn't started yet, even if its delay
* just hasn't elapsed.
  */

enteringCards.forEach(
(card, index) => {

card.style.animationDelay =
`${index * 80}ms`;

card.classList.add(
"rush-enter"
);

}
);

const totalStaggerTime =
enteringCards.length * 80 +
450;

setTimeout(
() => {

enteringCards.forEach(
card => {

card.classList.remove(
"rush-enter"
);

card.style.animationDelay =
"";

}
);

/*

* Auto-revert — 3 seconds after the F&F cards finish
* rushing in, they rush back off and the previous view
* (whatever activeFilters already specifies — never
* touched during the rush) rushes back in. Delay per
* card is capped so a broad previous view (like "All
* Movies," potentially hundreds of cards) doesn't
* produce an absurdly long stagger.
    */

setTimeout(
() => {

const currentFFCards =
movieGrid.querySelectorAll(
".movie-card"
);

const exitDelayPerCard =
currentFFCards.length > 0
? Math.min(
80,
900 /
currentFFCards.length
)
: 0;

currentFFCards.forEach(
(card, index) => {

card.style.animationDelay =
`${index * exitDelayPerCard}ms`;

card.style.setProperty(
"--rush-x",
"-400px"
);

card.classList.add(
"rush-exit"
);

}
);

const ffExitTotal =
currentFFCards.length *
exitDelayPerCard +
450;

setTimeout(
() => {

fastFuriousRushActive =
false;

renderMovies();

const restoredCards =
movieGrid.querySelectorAll(
".movie-card"
);

const enterDelayPerCard =
restoredCards.length > 0
? Math.min(
80,
900 /
restoredCards.length
)
: 0;

restoredCards.forEach(
(card, index) => {

card.style.animationDelay =
`${index * enterDelayPerCard}ms`;

card.classList.add(
"rush-enter"
);

}
);

const restoreTotal =
restoredCards.length *
enterDelayPerCard +
450;

setTimeout(
() => {

restoredCards.forEach(
card => {

card.classList.remove(
"rush-enter"
);

card.style.animationDelay =
"";

}
);

},
restoreTotal
);

},
ffExitTotal
);

},
3000
);

},
totalStaggerTime
);

},
500
);

}

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

fastFuriousRushActive =
false;

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

fastFuriousRushActive =
false;

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

fastFuriousRushActive =
false;

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

fastFuriousRushActive =
false;

sandraBullockModeActive =
false;

activeFilters.genre =
event.target.value ||
null;

if (event.target.value === "") {

triggerRewindEffect();

}

if (event.target.value === "rom-com") {

triggerHeartFlood();

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

if (fastFuriousRushActive) {

return movies.filter(
m =>
m.title &&
m.title
.toLowerCase()
.startsWith(
"fast & furious"
)
);

}

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

fastFuriousRushActive =
false;

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

const flashOverlay =
document.getElementById(
"marquee-pop-flash"
);

if (flashOverlay) {

flashOverlay.classList.remove(
"active"
);

void flashOverlay.offsetWidth;

flashOverlay.classList.add(
"active"
);

}

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
{ month: 1, day: 1, text: "Somewhere, Rocky's stepping into the ring against Apollo Creed today." },
{ month: 1, day: 1, text: "And the rematch — Rocky vs. Apollo, round two, also today." },
{ month: 1, day: 6, text: "Happy birthday to Sherlock Holmes." },
{ month: 1, day: 12, text: "HAL 9000 goes online today. I'm sorry, Dave." },
{ month: 1, day: 29, text: "The Truman Show just premiered." },
{ month: 2, day: 2, text: "Phil Connors is about to relive this exact day. Again." },
{ month: 2, day: 14, text: "Ghostbusters II predicted the world would end today. We're still here." },
{ month: 3, day: 2, text: "First contact with extraterrestrials, according to Men in Black." },
{ month: 3, day: 22, text: "The annual Purge begins tonight. Lock your doors." },
{ month: 3, day: 24, text: "A brain, an athlete, a basket case, a princess, and a criminal walk into Saturday detention today." },
{ month: 4, day: 8, text: "Rex Manning Day. Go rent something." },
{ month: 4, day: 14, text: "T.S. and Brodie are having a rough day at the mall right about now." },
{ month: 4, day: 14, text: "Jack's sketching Rose aboard the Titanic right now." },
{ month: 4, day: 15, text: "Dante and Randal are opening the Quick Stop they shouldn't even be working today." },
{ month: 4, day: 25, text: "Not too hot, not too cold. All you need is a light jacket." },
{ month: 5, day: 12, text: "Kyle Reese just arrived in 1984 to protect Sarah Connor." },
{ month: 5, day: 23, text: "Something big just attacked New York." },
{ month: 6, day: 1, text: "The alien ship just appeared over Johannesburg." },
{ month: 7, day: 2, text: "The aliens are arriving today, if this were Independence Day." },
{ month: 7, day: 31, text: "The guys just landed in Vegas for Doug's bachelor party. This won't end well." },
{ month: 7, day: 31, text: "Also Harry Potter's birthday — Hagrid's on his way with a letter." },
{ month: 8, day: 4, text: "Skynet goes online today." },
{ month: 8, day: 9, text: "Eviction notices going out to the aliens today." },
{ month: 8, day: 23, text: "A massive earthquake just turned LA into an island." },
{ month: 8, day: 29, text: "Judgment Day. Skynet just became self-aware." },
{ month: 9, day: 2, text: "Marty just landed in the Old West." },
{ month: 9, day: 12, text: "A hard day for Robert Neville." },
{ month: 9, day: 25, text: "LA just recorded its last murder before the crime-free future, according to Demolition Man." },
{ month: 10, day: 3, text: "It's October 3rd." },
{ month: 10, day: 10, text: "In the movie's future, the Cubs just won the World Series today." },
{ month: 10, day: 16, text: "The Robinson family just got lost in space." },
{ month: 10, day: 18, text: "The Joker's robbing a bank today." },
{ month: 10, day: 21, text: "Back to the Future Day — Marty, Doc, and Jennifer just landed in 2015." },
{ month: 10, day: 27, text: "Marty's finally heading back to the present." },
{ month: 10, day: 28, text: "Zuckerberg just launched Facemash." },
{ month: 10, day: 31, text: "Cobra Kai's crashing the Halloween dance about now." },
{ month: 11, day: 2, text: "E.T. is phoning home today." },
{ month: 11, day: 5, text: "Marty just arrived in 1955." },
{ month: 11, day: 5, text: "Remember, remember — V's blowing up the Old Bailey today." },
{ month: 11, day: 12, text: "Lightning strike incoming — Marty's about to head back to 1985." },
{ month: 12, day: 16, text: "A tense day for Creasy and The Voice." },
{ month: 12, day: 24, text: "Yippee-ki-yay — the Nakatomi Plaza Christmas party is tonight." },
{ month: 12, day: 25, text: "Rocky's fighting Ivan Drago in Moscow today. Merry Christmas." }
];

const genericFlavorText =
[
{ startHour: 5, endHour: 11, text: "Morning movie? No judgment here." },
{ startHour: 11, endHour: 17, text: "Afternoon browsing — take your time." },
{ startHour: 17, endHour: 22, text: "Prime time. What's the pick tonight?" },
{ startHour: 22, endHour: 24, text: "Late one tonight — anything good playing?" },
{ startHour: 0, endHour: 5, text: "Up late browsing? We won't tell." }
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

const genericMatch =
genericFlavorText.find(
entry =>
currentHour >= entry.startHour &&
currentHour < entry.endHour
);

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

fastFuriousRushActive =
false;

sandraBullockModeActive =
false;

currentSearch =
event.target.value.trim();

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
