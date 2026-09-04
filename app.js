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

const showAllButton =
document.getElementById("show-all-button");

const reservationFilter =
document.getElementById("reservation-filter");

const genreFilter =
document.getElementById("genre-filter");

const themeToggle =
document.getElementById("theme-toggle");

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

const backContent =
document.querySelector(
".back-content"
);

if (backContent) {

backContent.appendChild(
panel
);

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
`✓ ${person} — Reserved`;

} else {

button.textContent =
`Reserve for ${person}`;

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
`<svg width="60" height="60" viewBox="0 0 32 32">` +
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

// VHS tape — cassette body with two spool windows

color =>
`<svg width="92" height="60" viewBox="0 0 46 30">` +
`<rect x="2" y="2" width="42" height="26" rx="3" fill="none" ` +
`stroke="${color}" stroke-width="2"/>` +
`<circle cx="14" cy="15" r="6" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<circle cx="32" cy="15" r="6" fill="none" stroke="${color}" ` +
`stroke-width="2"/></svg>`,

// DVD disc — outer rim, center hole. No middle data ring —
// that read as visual noise rather than a disc.

color =>
`<svg width="68" height="68" viewBox="0 0 34 34">` +
`<circle cx="17" cy="17" r="15" fill="none" stroke="${color}" ` +
`stroke-width="2"/>` +
`<circle cx="17" cy="17" r="2.5" fill="none" stroke="${color}" ` +
`stroke-width="2"/></svg>`

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

const rotate =
isVhsTape
? (85 + Math.random() * 10).toFixed(1)
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

renderArcadeSideLighting();

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

let filteredMovies =
getFilteredMovies();

// =========================================================
// RANDOM 16
// =========================================================

if (randomMode) {

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

return card;

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

const finalWidth =
Math.min(
window.innerWidth *
0.78,
420
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

const colorIndex =
movies.indexOf(movie) %
coverColors.length;

const colors =
coverColors[
colorIndex
];

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

fallbackTitle.textContent =
movie.title;

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

physical.forEach(
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

digital.forEach(
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

createReservationPanel();

updateReservationPanel(
movie
);

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

// =========================================================
// NOW REBUILD THE SHELF
// =========================================================

renderMovies();

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

button.classList.remove(
"active"
);

} else {

activeFilters.media =
value;

document
.querySelectorAll(
'[data-filter-group="media"]'
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

activeFilters.genre =
event.target.value ||
null;

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
// RANDOM 16 BUTTON
// =========================================================

if (randomButton) {

randomButton.addEventListener(
"click",
() => {

randomMode =
true;

generateRandomMovies();

renderMovies();

randomButton.classList.add(
"active"
);

}
);

}

// =========================================================
// SHOW ALL BUTTON
// =========================================================

if (showAllButton) {

showAllButton.addEventListener(
"click",
() => {

randomMode =
false;

randomMovies =
[];

renderMovies();

if (randomButton) {

randomButton.classList.remove(
"active"
);

}

}
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
