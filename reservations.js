
/*
=========================================================
BW'S MOVIE COLLECTION
Reservation System
========================================================= */

const RESERVATIONS_API =
  "https://movie-reservations.iconedge.workers.dev";

/*
=========================================================
LOCAL STATE
========================================================= */

let reservations = {};


/*
=========================================================
LOAD RESERVATIONS
========================================================= */

async function loadReservations() {
  try {
    const response = await fetch(
      `${RESERVATIONS_API}/reservations`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Reservation server returned ${response.status}`
      );
    }

    const data = await response.json();

    reservations = {};

    data.forEach((reservation) => {
      reservations[String(reservation.movie_id)] = reservation;
    });

    return reservations;

  } catch (error) {
    console.error(
      "Unable to load reservations:",
      error
    );

    reservations = {};

    return reservations;
  }
}


/*
=========================================================
GET RESERVATION FOR MOVIE
========================================================= */

function getReservation(movieId) {
  if (movieId === undefined || movieId === null) {
    return null;
  }

  return reservations[String(movieId)] || null;
}


/*
=========================================================
CHECK IF MOVIE IS RESERVED
========================================================= */

function isMovieReserved(movieId) {
  return !!getReservation(movieId);
}


/*
=========================================================
RESERVE MOVIE
========================================================= */

async function reserveMovie(
  movieId,
  movieTitle,
  reservedFor
) {
  if (!movieId || !movieTitle || !reservedFor) {
    throw new Error(
      "Movie ID, movie title, and reserved-for name are required."
    );
  }

  const response = await fetch(
    `${RESERVATIONS_API}/reservations`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },

      body: JSON.stringify({
        movie_id: String(movieId),
        movie_title: String(movieTitle),
        reserved_for: String(reservedFor),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Unable to save reservation."
    );
  }

  reservations[String(movieId)] = data;

  return data;
}


/*
=========================================================
REMOVE RESERVATION
========================================================= */

async function removeReservation(movieId) {
  if (!movieId) {
    throw new Error(
      "Movie ID is required."
    );
  }

  const response = await fetch(
    `${RESERVATIONS_API}/reservations/${encodeURIComponent(
      String(movieId)
    )}`,
    {
      method: "DELETE",

      headers: {
        "Accept": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Unable to remove reservation."
    );
  }

  delete reservations[String(movieId)];

  return data;
}


/*
=========================================================
RESERVATION DISPLAY TEXT
========================================================= */

function getReservationText(movieId) {
  const reservation = getReservation(movieId);

  if (!reservation) {
    return "";
  }

  return `Reserved for ${reservation.reserved_for}`;
}


/*
=========================================================
REFRESH RESERVATIONS
========================================================= */

async function refreshReservations() {
  await loadReservations();

  if (typeof window.updateReservationUI === "function") {
    window.updateReservationUI();
  }
}


/*
=========================================================
INITIAL LOAD
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadReservations();
  }
);
