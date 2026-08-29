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
const modalGenre = document.getElementById("modal-genre");
const modalSynopsis = document.getElementById("modal-synopsis");
const modalCast = document.getElementById("modal-cast");
const modalDirector = document.getElementById("modal-director");
const modalFormats = document.getElementById("modal-formats");

const flipContainer = document.getElementById("movie-flip-container");
const flipButton = document.getElementById("flip-button");

const randomButton = document.getElementById("random-button");
const showAllButton = document.getElementById("show-all-button");


// =========================================================
// CURRENT STATE
// =========================================================

let currentSearch = "";
let currentMovie = null;

let randomMode = false;
let randomMovies = [];

let selectedCard = null;
let openingClone = null;
let savedScrollY = 0;
let isOpeningMovie = false;

let activeFilters = {
  type: "all",
  media: "all",
  genre: null,
  category: null,
  animated: "mixed"
};


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
// INITIALIZE
// =========================================================

renderMovies();


// =========================================================
// RENDER MOVIES
// =========================================================

function renderMovies() {

  movieGrid.innerHTML = "";

  let filteredMovies = movies.filter(movie => {

    // TYPE FILTER

    if (
      activeFilters.type !== "all" &&
      movie.type !== activeFilters.type
    ) {
      return false;
    }


    // PHYSICAL / DIGITAL FILTER

    if (
      activeFilters.media === "physical" &&
      (!movie.physical || movie.physical.length === 0)
    ) {
      return false;
    }

    if (
      activeFilters.media === "digital" &&
      (!movie.digital || movie.digital.length === 0)
    ) {
      return false;
    }


    // GENRE FILTER

    if (activeFilters.genre) {

      const movieGenre =
        (movie.genre || "").toLowerCase();

      if (
        !movieGenre.includes(
          activeFilters.genre.toLowerCase()
        )
      ) {
        return false;
      }

    }


    // CATEGORY FILTER

    if (activeFilters.category) {

      const categories =
        movie.categories || [];

      if (
        !categories.includes(
          activeFilters.category
        )
      ) {
        return false;
      }

    }


    // ANIMATED FILTER

    const isAnimated =
      (movie.categories || []).includes("animated");

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


    // SEARCH

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

  });


  // =========================================================
  // RANDOM 50
  // =========================================================

  if (randomMode) {

    filteredMovies =
      randomMovies.filter(
        movie => filteredMovies.includes(movie)
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
            sensitivity: "base"
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
    activeFilters.animated !== "mixed";


  if (randomMode) {

    movieCount.textContent =
      `${filteredMovies.length} random titles`;

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

  } else {

    noResults.classList.add(
      "hidden"
    );

  }


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

}


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
  // TITLE
  // =========================================================

  const title =
    document.createElement(
      "div"
    );

  title.className =
    "movie-card-title";

  title.textContent =
    movie.title;

  card.appendChild(
    title
  );


  // =========================================================
  // COVER
  // =========================================================

  const colors =
    coverColors[
      index % coverColors.length
    ];

  const cover =
    document.createElement(
      "div"
    );

  cover.className =
    "movie-cover";

  const coverInner =
    document.createElement(
      "div"
    );

  coverInner.className =
    "movie-cover-inner";


  // TMDB POSTER

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

  }


  cover.appendChild(
    coverInner
  );

  card.appendChild(
    cover
  );


  // =========================================================
  // OPEN MOVIE
  // =========================================================

  card.addEventListener(
    "click",
    () => {

      openMovie(
        movie,
        card
      );

    }
  );


  // KEYBOARD ACCESSIBILITY

  card.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openMovie(
          movie,
          card
        );

      }

    }
  );


  return card;

}


// =========================================================
// ANIMATE MOVIE FROM SHELF
// =========================================================

function animateMovieFromShelf(
  card,
  callback
) {

  if (!card) {

    callback();

    return;

  }


  const poster =
    card.querySelector(
      ".movie-cover-inner"
    );

  if (!poster) {

    callback();

    return;

  }


  // ---------------------------------------------------------
  // SAVE CURRENT SCROLL POSITION
  // ---------------------------------------------------------

  savedScrollY =
    window.scrollY;


  // ---------------------------------------------------------
  // PREVENT THE PAGE FROM MOVING
  // ---------------------------------------------------------

  document.documentElement.style.scrollBehavior =
    "auto";

  document.body.style.overflow =
    "hidden";

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


  // ---------------------------------------------------------
  // MARK CARD AS SELECTED
  // ---------------------------------------------------------

  selectedCard =
    card;

  card.classList.add(
    "selected"
  );


  // ---------------------------------------------------------
  // GET EXACT POSTER POSITION
  // ---------------------------------------------------------

  const rect =
    poster.getBoundingClientRect();


  // ---------------------------------------------------------
  // CREATE FLOATING COPY
  // ---------------------------------------------------------

  openingClone =
    poster.cloneNode(
      true
    );

  openingClone.classList.add(
    "movie-opening-clone"
  );


  // ---------------------------------------------------------
  // INITIAL POSITION
  // EXACTLY OVER ORIGINAL POSTER
  // ---------------------------------------------------------

  openingClone.style.position =
    "fixed";

  openingClone.style.left =
    `${rect.left}px`;

  openingClone.style.top =
    `${rect.top}px`;

  openingClone.style.width =
    `${rect.width}px`;

  openingClone.style.height =
    `${rect.height}px`;

  openingClone.style.margin =
    "0";

  openingClone.style.zIndex =
    "1000";

  openingClone.style.pointerEvents =
    "none";

  openingClone.style.borderRadius =
    "9px";

  openingClone.style.backgroundSize =
    "cover";

  openingClone.style.backgroundPosition =
    "center";

  openingClone.style.backgroundRepeat =
    "no-repeat";

  openingClone.style.boxShadow =
    "0 8px 18px rgba(0,0,0,.45)";


  // ---------------------------------------------------------
  // NO TRANSITION YET
  // ---------------------------------------------------------

  openingClone.style.transition =
    "none";


  document.body.appendChild(
    openingClone
  );


  // ---------------------------------------------------------
  // HIDE ORIGINAL POSTER
  // ---------------------------------------------------------

  poster.style.visibility =
    "hidden";


  // ---------------------------------------------------------
  // ACTIVATE COLLECTION FOCUS
  // ---------------------------------------------------------

  document.body.classList.add(
    "movie-opening"
  );


  // ---------------------------------------------------------
  // FORCE BROWSER TO REGISTER START POSITION
  // ---------------------------------------------------------

  openingClone.getBoundingClientRect();


  // ---------------------------------------------------------
  // CALCULATE TARGET SIZE
  // ---------------------------------------------------------

  const targetWidth =
    Math.min(
      window.innerWidth * 0.72,
      360
    );

  const targetHeight =
    targetWidth * 1.5;


  const targetLeft =
    (window.innerWidth -
      targetWidth) /
    2;

  const targetTop =
    Math.max(
      (window.innerHeight -
        targetHeight) /
      2 - 25,
      20
    );


  // ---------------------------------------------------------
  // ANIMATE
  // ---------------------------------------------------------

  requestAnimationFrame(
    () => {

      openingClone.style.transition =
        "left .7s cubic-bezier(.16,1,.3,1), " +
        "top .7s cubic-bezier(.16,1,.3,1), " +
        "width .7s cubic-bezier(.16,1,.3,1), " +
        "height .7s cubic-bezier(.16,1,.3,1), " +
        "border-radius .7s ease, " +
        "box-shadow .7s ease";


      openingClone.style.left =
        `${targetLeft}px`;

      openingClone.style.top =
        `${targetTop}px`;

      openingClone.style.width =
        `${targetWidth}px`;

      openingClone.style.height =
        `${targetHeight}px`;

      openingClone.style.borderRadius =
        "10px";

      openingClone.style.boxShadow =
        "0 25px 60px rgba(0,0,0,.65), " +
        "0 8px 20px rgba(0,0,0,.5)";


      // -----------------------------------------------------
      // FINISH ANIMATION
      // -----------------------------------------------------

      setTimeout(
        () => {

          if (openingClone) {

            openingClone.remove();

            openingClone =
              null;

          }


          // Reveal the actual viewer

          callback();

        },
        720
      );

    }
  );

}


// =========================================================
// OPEN MOVIE
// =========================================================

function openMovie(
  movie,
  card
) {

  if (
    isOpeningMovie
  ) {
    return;
  }


  if (
    !modal ||
    !flipContainer
  ) {
    return;
  }


  isOpeningMovie =
    true;

  currentMovie =
    movie;


  // ---------------------------------------------------------
  // RESET FLIP
  // ---------------------------------------------------------

  flipContainer.classList.remove(
    "flipped"
  );

  flipButton.textContent =
    "Flip case";


  // ---------------------------------------------------------
  // BASIC INFORMATION
  // ---------------------------------------------------------

  modalTitle.textContent =
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


  // ---------------------------------------------------------
  // LARGE COVER
  // ---------------------------------------------------------

  const colorIndex =
    movies.indexOf(movie) %
    coverColors.length;

  const colors =
    coverColors[colorIndex];

  modalCover.innerHTML =
    "";

  modalCover.style.backgroundImage =
    "";

  modalCover.style.background =
    "";


  // TMDB POSTER

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

    // FALLBACK COVER

    modalCover.style.backgroundImage =
      "";

    modalCover.style.background =
      `linear-gradient(
        145deg,
        ${colors[0]},
        ${colors[1]}
      )`;


    const coverText =
      document.createElement(
        "div"
      );

    coverText.style.position =
      "absolute";

    coverText.style.inset =
      "0";

    coverText.style.display =
      "flex";

    coverText.style.flexDirection =
      "column";

    coverText.style.justifyContent =
      "flex-end";

    coverText.style.padding =
      "20px";

    coverText.style.background =
      "radial-gradient(circle at 20% 15%, rgba(255,255,255,.22), transparent 32%)";


    modalCover.appendChild(
      coverText
    );

  }


  // =========================================================
  // FORMATS
  // =========================================================

  modalFormats.innerHTML =
    "";

  const physical =
    movie.physical || [];

  const digital =
    movie.digital || [];


  // Physical

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


  // Digital

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


  // No format information

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
  // START SHELF ANIMATION
  // =========================================================

  animateMovieFromShelf(
    card,
    () => {

      // -------------------------------------------------------
      // SHOW MODAL AFTER POSTER HAS ARRIVED
      // -------------------------------------------------------

      modal.classList.remove(
        "hidden"
      );


      // Force the browser to register the initial state

      modal.getBoundingClientRect();


      // Activate viewer

      modal.classList.add(
        "movie-open"
      );


      // -------------------------------------------------------
      // FINISH
      // -------------------------------------------------------

      setTimeout(
        () => {

          isOpeningMovie =
            false;

        },
        500
      );

    }
  );

}


// =========================================================
// CLOSE MOVIE
// =========================================================

function closeMovie() {

  if (
    isOpeningMovie
  ) {
    return;
  }


  // ---------------------------------------------------------
  // CLOSE MODAL
  // ---------------------------------------------------------

  modal.classList.remove(
    "movie-open"
  );


  // ---------------------------------------------------------
  // REMOVE COLLECTION FOCUS
  // ---------------------------------------------------------

  document.body.classList.remove(
    "movie-opening"
  );


  // ---------------------------------------------------------
  // RESTORE BODY
  // ---------------------------------------------------------

  document.body.style.overflow =
    "";

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


  // ---------------------------------------------------------
  // RESTORE SCROLL POSITION
  // ---------------------------------------------------------

  window.scrollTo(
    0,
    savedScrollY
  );


  // ---------------------------------------------------------
  // RESTORE SELECTED POSTER
  // ---------------------------------------------------------

  if (selectedCard) {

    const poster =
      selectedCard.querySelector(
        ".movie-cover-inner"
      );

    if (poster) {

      poster.style.visibility =
        "";

    }

    selectedCard.classList.remove(
      "selected"
    );

  }


  selectedCard =
    null;

  currentMovie =
    null;


  // ---------------------------------------------------------
  // ACTUALLY HIDE MODAL AFTER FADE
  // ---------------------------------------------------------

  setTimeout(
    () => {

      if (
        !modal.classList.contains(
          "movie-open"
        )
      ) {

        modal.classList.add(
          "hidden"
        );

      }

    },
    500
  );

}


modalClose.addEventListener(
  "click",
  closeMovie
);


// =========================================================
// CLICK OUTSIDE MOVIE
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
      !modal.classList.contains(
        "hidden"
      )
    ) {

      closeMovie();

    }

  }
);


// =========================================================
// FLIP CASE
// =========================================================

function flipMovie() {

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
  flipMovie
);


flipContainer.addEventListener(
  "click",
  event => {

    if (
      event.target === flipButton
    ) {
      return;
    }

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
  {
    passive: true
  }
);


flipContainer.addEventListener(
  "touchend",
  event => {

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


        // TYPE

        if (
          group === "type"
        ) {

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
                  b.dataset.filterValue === value
                )
            );

        }


        // MEDIA

        if (
          group === "media"
        ) {

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
                  b.dataset.filterValue === value
                )
            );

        }


        // GENRE

        if (
          group === "genre"
        ) {

          if (
            activeFilters.genre === value
          ) {

            activeFilters.genre =
              null;

            button.classList.remove(
              "active"
            );

          } else {

            activeFilters.genre =
              value;

            document
              .querySelectorAll(
                '[data-filter-group="genre"]'
              )
              .forEach(
                b =>
                  b.classList.toggle(
                    "active",
                    b.dataset.filterValue === value
                  )
              );

          }

        }


        // CATEGORY

        if (
          group === "category"
        ) {

          if (
            activeFilters.category === value
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
                    b.dataset.filterValue === value
                  )
              );

          }

        }


        // ANIMATED

        if (
          group === "animated"
        ) {

          if (
            activeFilters.animated === "mixed"
          ) {

            activeFilters.animated =
              "hide";

          } else if (
            activeFilters.animated === "hide"
          ) {

            activeFilters.animated =
              "only";

          } else {

            activeFilters.animated =
              "mixed";

          }

          updateAnimatedButton();

        }


        // Changing filters invalidates the old random list.

        if (randomMode) {

          generateRandomMovies();

        }


        renderMovies();

      }
    );

  }
);


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
    activeFilters.animated === "mixed"
  ) {

    animatedButton.textContent =
      "Animated: Mixed";

    animatedButton.classList.add(
      "active"
    );

  }


  if (
    activeFilters.animated === "hide"
  ) {

    animatedButton.textContent =
      "Animated: Hide";

    animatedButton.classList.remove(
      "active"
    );

  }


  if (
    activeFilters.animated === "only"
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

  return movies.filter(movie => {

    // Type

    if (
      activeFilters.type !== "all" &&
      movie.type !== activeFilters.type
    ) {
      return false;
    }


    // Media

    if (
      activeFilters.media === "physical" &&
      (!movie.physical || movie.physical.length === 0)
    ) {
      return false;
    }

    if (
      activeFilters.media === "digital" &&
      (!movie.digital || movie.digital.length === 0)
    ) {
      return false;
    }


    // Genre

    if (activeFilters.genre) {

      const movieGenre =
        (movie.genre || "").toLowerCase();

      if (
        !movieGenre.includes(
          activeFilters.genre.toLowerCase()
        )
      ) {
        return false;
      }

    }


    // Category

    if (activeFilters.category) {

      const categories =
        movie.categories || [];

      if (
        !categories.includes(
          activeFilters.category
        )
      ) {
        return false;
      }

    }


    // Animated

    const isAnimated =
      (movie.categories || []).includes(
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


    // Search

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

  });

}


// =========================================================
// GENERATE RANDOM 50
// =========================================================

function generateRandomMovies() {

  const availableMovies =
    getFilteredMovies();


  const shuffled =
    [...availableMovies];


  // Fisher-Yates shuffle

  for (
    let i = shuffled.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
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
      50
    );

}


// =========================================================
// RANDOM 50 BUTTON
// =========================================================

if (randomButton) {

  randomButton.addEventListener(
    "click",
    () => {

      randomMode =
        true;

      generateRandomMovies();

      renderMovies();


      if (showAllButton) {

        showAllButton.classList.add(
          "active"
        );

      }

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


      showAllButton.classList.remove(
        "active"
      );

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
// WHILE MODAL IS OPEN
// =========================================================

if (modal) {

  modal.addEventListener(
    "touchmove",
    event => {

      if (
        event.target === modal
      ) {

        event.preventDefault();

      }

    },
    {
      passive: false
    }
  );

}
