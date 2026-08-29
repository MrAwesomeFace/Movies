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

let activeFilters = {
  type: "movie",
  media: "all",
  genre: null,
  category: null,
  animated: "hide"
};


// =========================================================
// OPENING / CLOSING STATE
// =========================================================

let selectedCard = null;

let savedScrollY = 0;

let originalModalStyles = null;

let isOpening = false;
let isClosing = false;


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
  // RANDOM 10
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
//
// The movie viewer starts at the exact location
// of the selected shelf poster and grows from there.
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


  isOpening = true;

  currentMovie =
    movie;

  selectedCard =
    card;


  // =========================================================
  // CAPTURE EXACT CARD POSITION
  // =========================================================

  const cardRect =
    card.getBoundingClientRect();

  const cover =
    card.querySelector(
      ".movie-cover-inner"
    );

  const coverRect =
    cover.getBoundingClientRect();


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


  // =========================================================
  // PREVENT THE CLICKED CARD FROM CAUSING
  // ANY FOCUS-BASED SCROLLING
  // =========================================================

  card.blur();


  // =========================================================
  // MARK SELECTED CARD
  // =========================================================

  card.classList.add(
    "selected"
  );


  // =========================================================
  // PREPARE MOVIE INFORMATION
  // =========================================================

  populateMovie(
    movie
  );


  // =========================================================
  // REMEMBER MODAL'S ORIGINAL INLINE STYLES
  // =========================================================

  originalModalStyles = {

    position:
      modal.style.position,

    inset:
      modal.style.inset,

    width:
      modal.style.width,

    height:
      modal.style.height,

    maxWidth:
      modal.style.maxWidth,

    maxHeight:
      modal.style.maxHeight,

    padding:
      modal.style.padding,

    opacity:
      modal.style.opacity,

    pointerEvents:
      modal.style.pointerEvents

  };


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
  // PREPARE MODAL CONTENT
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


  // Temporarily hide controls.

  if (controls) {

    controls.style.opacity =
      "0";

    controls.style.pointerEvents =
      "none";

  }


  // =========================================================
  // THE MODAL CONTENT BECOMES THE MOVING CASE
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
    `${coverRect.width}px`;

  content.style.height =
    `${coverRect.height}px`;

  content.style.left =
    `${coverRect.left}px`;

  content.style.top =
    `${coverRect.top}px`;

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
  // MAKE VIEWER FIT THE MOVING CASE
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

  }


  if (flipContainer) {

    flipContainer.style.transition =
      "none";

  }


  // =========================================================
  // FORCE INITIAL POSITION
  // =========================================================

  content.getBoundingClientRect();


  // =========================================================
  // CREATE FINAL POSITION
  // =========================================================

  requestAnimationFrame(
    () => {

      // =====================================================
      // COLLECTION FOCUS
      //
      // IMPORTANT:
      // The CSS currently applies scale(0.985) to <main>
      // during movie-opening. That scale is what creates
      // the apparent page movement/zoom depending on
      // where the selected movie is located.
      //
      // Keep the blur and brightness effects, but explicitly
      // cancel the scale here.
      // =====================================================

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


      // =====================================================
      // CALCULATE LARGE CASE SIZE
      // =====================================================

      const finalWidth =
        Math.min(
          window.innerWidth * 0.78,
          420
        );

      const finalHeight =
        finalWidth * 1.5;


      const finalLeft =
        (window.innerWidth -
          finalWidth) / 2;

      const finalTop =
        Math.max(
          55,
          (window.innerHeight -
            finalHeight) / 2
        );


      // =====================================================
      // ANIMATE CASE FROM SHELF
      //
      // NOTE: box-shadow is used here instead of
      // filter: drop-shadow(...). Applying `filter` to an
      // ancestor of an element using transform-style:
      // preserve-3d forces the browser to flatten that 3D
      // context into a single 2D layer, which is why the
      // case edges were invisible even after they were
      // added to the DOM with correct transforms. box-shadow
      // does not create a flattening context, so it's safe
      // to animate here.
      // =====================================================

      content.style.transition =
        "left 0.65s cubic-bezier(0.16, 1, 0.3, 1), " +
        "top 0.65s cubic-bezier(0.16, 1, 0.3, 1), " +
        "width 0.65s cubic-bezier(0.16, 1, 0.3, 1), " +
        "height 0.65s cubic-bezier(0.16, 1, 0.3, 1), " +
        "box-shadow 0.45s ease";

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


      // =====================================================
      // FINISH OPENING
      // =====================================================

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


          // Allow interaction with case.

          modal.style.pointerEvents =
            "auto";

          isOpening =
            false;

        },
        680
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

  // RESET FLIP

  flipContainer.classList.remove(
    "flipped"
  );

  flipButton.textContent =
    "Flip case";


  // BASIC INFORMATION

  modalTitle.textContent =
    movie.title;

  document.getElementById("modal-spine-title").textContent =
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
    coverColors[colorIndex];

  modalCover.innerHTML =
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


  // =========================================================
  // GET ORIGINAL SHELF POSITION
  // =========================================================

  let targetRect = null;

  if (selectedCard) {

    const cover =
      selectedCard.querySelector(
        ".movie-cover-inner"
      );

    if (cover) {

      targetRect =
        cover.getBoundingClientRect();

    }

  }


  // =========================================================
  // FALLBACK
  // =========================================================

  if (!targetRect) {

    finishCloseMovie();

    return;

  }


  // =========================================================
  // HIDE CONTROLS
  // =========================================================

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
  // ANIMATE CASE BACK TO SHELF
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


  // =========================================================
  // REMOVE OPENING STATE
  // =========================================================

  document.body.classList.remove(
    "movie-opening"
  );


  // =========================================================
  // RESTORE MAIN TRANSFORM
  // =========================================================

  const main =
    document.querySelector(
      "main"
    );

  if (main) {

    main.style.transform =
      "";

  }


  // =========================================================
  // HIDE MODAL
  // =========================================================

  modal.classList.add(
    "hidden"
  );


  // =========================================================
  // RESET MODAL CONTENT
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
  // REMOVE SELECTED STATE
  // =========================================================

  if (selectedCard) {

    selectedCard.classList.remove(
      "selected"
    );

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
  // CLEAR STATE
  // =========================================================

  selectedCard =
    null;

  currentMovie =
    null;

  isClosing =
    false;

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
      event.target.closest(".primary-button")
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


        // Changing filters invalidates old random list.

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

    // TYPE

    if (
      activeFilters.type !== "all" &&
      movie.type !== activeFilters.type
    ) {
      return false;
    }


    // MEDIA

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


    // GENRE

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


    // CATEGORY

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


    // ANIMATED

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

}


// =========================================================
// GENERATE RANDOM 10
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
      10
    );

}


// =========================================================
// RANDOM 10 BUTTON
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
// WHILE MOVIE IS OPEN
// =========================================================

if (modal) {

  modal.addEventListener(
    "touchmove",
    event => {

      if (
        currentMovie
      ) {

        event.preventDefault();

      }

    },
    {
      passive: false
    }
  );

}


// =========================================================
// PREVENT BACKGROUND WHEEL SCROLL
// WHILE MOVIE IS OPEN
// =========================================================

if (modal) {

  modal.addEventListener(
    "wheel",
    event => {

      if (
        currentMovie
      ) {

        const backContent =
          event.target.closest(
            ".back-content"
          );

        if (!backContent) {

          event.preventDefault();

        }

      }

    },
    {
      passive: false
    }
  );

}
