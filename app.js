/*
  =========================================================
  BW'S MOVIE COLLECTION
  App functionality
  =========================================================
*/


// =========================================================
// ELEMENTS
// =========================================================

const movieGrid = document.getElementById("movie-grid");
const movieCount = document.getElementById("movie-count");

const searchToggle = document.getElementById("search-toggle");
const searchArea = document.getElementById("search-area");
const searchInput = document.getElementById("search-input");

const filters = document.querySelectorAll(".filter");

const noResults = document.getElementById("no-results");

const modal = document.getElementById("movie-modal");
const modalClose = document.getElementById("modal-close");

const modalCover = document.getElementById("modal-cover");
const modalTitle = document.getElementById("modal-title");
const modalYear = document.getElementById("modal-year");
const modalRuntime = document.getElementById("modal-runtime");
const modalSynopsis = document.getElementById("modal-synopsis");
const modalCast = document.getElementById("modal-cast");
const modalDirector = document.getElementById("modal-director");
const modalFormats = document.getElementById("modal-formats");

const flipContainer = document.getElementById("movie-flip-container");
const flipButton = document.getElementById("flip-button");


// =========================================================
// CURRENT STATE
// =========================================================

let currentFilter = "all";
let currentSearch = "";
let currentMovie = null;


// =========================================================
// SIMPLE COVER COLORS
//
// These give the POC attractive placeholder covers.
// Later we can replace these with actual movie artwork.
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
// INITIALIZE
// =========================================================

renderMovies();


// =========================================================
// RENDER MOVIES
// =========================================================

function renderMovies() {

  movieGrid.innerHTML = "";

  const filteredMovies = movies.filter(movie => {

    // Physical / digital filter

    if (currentFilter === "physical") {
      if (!movie.physical || movie.physical.length === 0) {
        return false;
      }
    }

    if (currentFilter === "digital") {
      if (!movie.digital || movie.digital.length === 0) {
        return false;
      }
    }


    // Search

    if (currentSearch) {

      const searchText = currentSearch.toLowerCase();

      const searchableText = [
        movie.title,
        movie.year,
        movie.genre,
        movie.director,
        movie.cast
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(searchText)) {
        return false;
      }
    }

    return true;

  });


  // Sort alphabetically

  filteredMovies.sort((a, b) =>
    a.title.localeCompare(b.title)
  );


  // Update count

  if (currentSearch || currentFilter !== "all") {

    movieCount.textContent =
      `${filteredMovies.length} of ${movies.length} movies`;

  } else {

    movieCount.textContent =
      `${movies.length} movies`;

  }


  // No results

  if (filteredMovies.length === 0) {

    noResults.classList.remove("hidden");

    return;

  } else {

    noResults.classList.add("hidden");

  }


  // Create cards

  filteredMovies.forEach((movie, index) => {

    const card = createMovieCard(movie, index);

    movieGrid.appendChild(card);

  });

}


// =========================================================
// CREATE MOVIE CARD
// =========================================================

function createMovieCard(movie, index) {

  const card = document.createElement("article");

  card.className = "movie-card";

  card.setAttribute("tabindex", "0");

  const colors =
    coverColors[index % coverColors.length];


  const cover = document.createElement("div");

  cover.className = "movie-cover";


  const coverInner = document.createElement("div");

  coverInner.className = "movie-cover-inner";

  coverInner.style.background =
    `linear-gradient(145deg, ${colors[0]}, ${colors[1]})`;


  const title = document.createElement("div");

  title.className = "movie-cover-title";

  title.textContent = movie.title;


  const year = document.createElement("div");

  year.className = "movie-cover-year";

  year.textContent = movie.year;


  const badges = document.createElement("div");

  badges.className = "movie-badges";


  // Physical badges

  if (movie.physical && movie.physical.length) {

    movie.physical.forEach(format => {

      const badge = document.createElement("span");

      badge.className = "movie-badge";

      badge.textContent =
        `💿 ${format}`;

      badges.appendChild(badge);

    });

  }


  // Digital badges

  if (movie.digital && movie.digital.length) {

    movie.digital.forEach(service => {

      const badge = document.createElement("span");

      badge.className = "movie-badge";

      badge.textContent =
        `📱 ${service}`;

      badges.appendChild(badge);

    });

  }


  coverInner.appendChild(title);
  coverInner.appendChild(year);
  coverInner.appendChild(badges);

  cover.appendChild(coverInner);

  card.appendChild(cover);


  // Open movie

  card.addEventListener("click", () => {

    openMovie(movie);

  });


  // Keyboard accessibility

  card.addEventListener("keydown", event => {

    if (event.key === "Enter" || event.key === " ") {

      event.preventDefault();

      openMovie(movie);

    }

  });


  return card;

}


// =========================================================
// OPEN MOVIE
// =========================================================

function openMovie(movie) {

  currentMovie = movie;


  // Reset flip

  flipContainer.classList.remove("flipped");

  flipButton.textContent = "Flip case";


  // Basic information

  modalTitle.textContent = movie.title;

  modalYear.textContent = movie.year;

  modalRuntime.textContent =
    movie.runtime || "Runtime unknown";

  modalSynopsis.textContent =
    movie.synopsis || "No synopsis added yet.";

  modalCast.textContent =
    movie.cast || "Cast information not added.";

  modalDirector.textContent =
    movie.director || "Director information not added.";


  // Create the large cover

  const colorIndex =
    movies.indexOf(movie) % coverColors.length;

  const colors =
    coverColors[colorIndex];


  modalCover.style.background =
    `linear-gradient(145deg, ${colors[0]}, ${colors[1]})`;


  modalCover.innerHTML = "";


  const coverText = document.createElement("div");

  coverText.style.position = "absolute";
  coverText.style.inset = "0";
  coverText.style.display = "flex";
  coverText.style.flexDirection = "column";
  coverText.style.justifyContent = "flex-end";
  coverText.style.padding = "20px";

  coverText.style.background =
    "radial-gradient(circle at 20% 15%, rgba(255,255,255,.22), transparent 32%)";


  const bigTitle = document.createElement("div");

  bigTitle.textContent = movie.title;

  bigTitle.style.position = "relative";

  bigTitle.style.color = "white";

  bigTitle.style.fontSize = "clamp(25px, 7vw, 48px)";

  bigTitle.style.fontWeight = "800";

  bigTitle.style.lineHeight = "0.95";

  bigTitle.style.textShadow =
    "0 3px 8px rgba(0,0,0,.8)";


  const bigYear = document.createElement("div");

  bigYear.textContent = movie.year;

  bigYear.style.marginTop = "10px";

  bigYear.style.color =
    "rgba(255,255,255,.8)";


  coverText.appendChild(bigTitle);

  coverText.appendChild(bigYear);

  modalCover.appendChild(coverText);


  // Formats

  modalFormats.innerHTML = "";


  const physical =
    movie.physical || [];

  const digital =
    movie.digital || [];


  physical.forEach(format => {

    const item =
      document.createElement("div");

    item.className = "format-item";

    item.textContent =
      `💿 Physical — ${format}`;

    modalFormats.appendChild(item);

  });


  digital.forEach(service => {

    const item =
      document.createElement("div");

    item.className = "format-item";

    item.textContent =
      `📱 Digital — ${service}`;

    modalFormats.appendChild(item);

  });


  if (
    physical.length === 0 &&
    digital.length === 0
  ) {

    const item =
      document.createElement("div");

    item.className = "format-item";

    item.textContent =
      "No format information added yet.";

    modalFormats.appendChild(item);

  }


  // Show modal

  modal.classList.remove("hidden");

  document.body.style.overflow = "hidden";

}


// =========================================================
// CLOSE MOVIE
// =========================================================

function closeMovie() {

  modal.classList.add("hidden");

  document.body.style.overflow = "";

  currentMovie = null;

}


modalClose.addEventListener(
  "click",
  closeMovie
);


// Clicking outside the movie closes it

document.querySelector(
  ".modal-backdrop"
).addEventListener(
  "click",
  closeMovie
);


// Escape key

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      !modal.classList.contains("hidden")
    ) {

      closeMovie();

    }

  }
);


// =========================================================
// FLIP CASE
// =========================================================

function flipMovie() {

  flipContainer.classList.toggle("flipped");


  if (
    flipContainer.classList.contains("flipped")
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
  flipMovie
);


flipContainer.addEventListener(
  "click",
  event => {

    /*
      Don't trigger a second flip when the
      user clicks interactive content on the
      back of the case.
    */

    flipMovie();

  }
);


// =========================================================
// SWIPE TO FLIP
// =========================================================

let touchStartX = 0;
let touchStartY = 0;


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
  { passive: true }
);


flipContainer.addEventListener(
  "touchend",
  event => {

    const touch =
      event.changedTouches[0];

    const differenceX =
      touch.screenX - touchStartX;

    const differenceY =
      touch.screenY - touchStartY;


    /*
      Only treat it as a swipe if the
      horizontal movement is greater
      than the vertical movement.
    */

    if (
      Math.abs(differenceX) > 50 &&
      Math.abs(differenceX) > Math.abs(differenceY)
    ) {

      flipMovie();

    }

  },
  { passive: true }
);


// =========================================================
// FILTER BUTTONS
// =========================================================

filters.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      filters.forEach(
        b => b.classList.remove("active")
      );

      button.classList.add("active");


      currentFilter =
        button.dataset.filter;


      renderMovies();

    }
  );

});


// =========================================================
// SEARCH
// =========================================================

searchToggle.addEventListener(
  "click",
  () => {

    searchArea.classList.toggle("hidden");

    if (
      !searchArea.classList.contains("hidden")
    ) {

      searchInput.focus();

    }

  }
);


searchInput.addEventListener(
  "input",
  event => {

    currentSearch =
      event.target.value.trim();

    renderMovies();

  }
);


// =========================================================
// PREVENT BACKGROUND SCROLL WHILE MODAL IS OPEN
// =========================================================

modal.addEventListener(
  "touchmove",
  event => {

    /*
      The modal itself can still scroll,
      but this prevents accidental page
      movement behind it.
    */

    if (
      event.target === modal
    ) {

      event.preventDefault();

    }

  },
  { passive: false }
);
