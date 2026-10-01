export default {
  async fetch(request, env, ctx) {

    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://mrawesomeface.github.io",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };


    // =========================================================
    // CORS PREFLIGHT
    // =========================================================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }


    try {

      // =======================================================
      // GET /reservations
      //
      // Return every current reservation.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/reservations"
      ) {

        const { results } = await env.DB
          .prepare(`
            SELECT
              id,
              movie_id,
              movie_title,
              reserved_for,
              updated_at
            FROM reservations
            ORDER BY movie_title, reserved_for
          `)
          .all();

        return new Response(
          JSON.stringify(results),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }


      // =======================================================
      // POST /reservations
      //
      // Create a reservation for one person.
      //
      // A person can only reserve the same movie once.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/reservations"
      ) {

        const data = await request.json();


        if (
          !data.movie_id ||
          !data.movie_title ||
          !data.reserved_for
        ) {

          return new Response(
            JSON.stringify({
              error:
                "movie_id, movie_title, and reserved_for are required"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }


        const allowedPeople = [
          "Bryon",
          "Angie",
          "Joey"
        ];


        const reservedFor =
          String(data.reserved_for).trim();


        if (
          !allowedPeople.includes(
            reservedFor
          )
        ) {

          return new Response(
            JSON.stringify({
              error:
                "reserved_for must be Bryon, Angie, or Joey"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }


        const movieId =
          String(data.movie_id);

        const movieTitle =
          String(data.movie_title);

        const updatedAt =
          new Date().toISOString();


        // Check whether this person already
        // has this movie reserved.

        const existing =
          await env.DB
            .prepare(`
              SELECT id
              FROM reservations
              WHERE movie_id = ?
              AND reserved_for = ?
            `)
            .bind(
              movieId,
              reservedFor
            )
            .first();


        if (existing) {

          return new Response(
            JSON.stringify({
              success: true,
              already_reserved: true,
              id: existing.id,
              movie_id: movieId,
              movie_title: movieTitle,
              reserved_for: reservedFor
            }),
            {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }


        // Create the reservation.

        const result =
          await env.DB
            .prepare(`
              INSERT INTO reservations
                (
                  movie_id,
                  movie_title,
                  reserved_for,
                  updated_at
                )
              VALUES (?, ?, ?, ?)
            `)
            .bind(
              movieId,
              movieTitle,
              reservedFor,
              updatedAt
            )
            .run();


        return new Response(
          JSON.stringify({
            success: true,
            already_reserved: false,
            id: result.meta.last_row_id,
            movie_id: movieId,
            movie_title: movieTitle,
            reserved_for: reservedFor,
            updated_at: updatedAt
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );

      }


      // =======================================================
      // DELETE /reservations/:id
      //
      // Remove one specific reservation.
      // =======================================================

      if (
        request.method === "DELETE" &&
        url.pathname.startsWith(
          "/reservations/"
        )
      ) {

        const reservationId =
          url.pathname.substring(
            "/reservations/".length
          );


        if (!reservationId) {

          return new Response(
            JSON.stringify({
              error:
                "Reservation ID is required"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }


        await env.DB
          .prepare(`
            DELETE FROM reservations
            WHERE id = ?
          `)
          .bind(
            reservationId
          )
          .run();


        return new Response(
          JSON.stringify({
            success: true,
            id: reservationId
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );

      }


      // =======================================================
      // TMDB HELPER
      //
      // Same v4 Read Access Token pattern the GitHub Action's
      // Python script uses - kept here too so the client never
      // needs to see the key. Throws a plain Error with a
      // useful message on failure, caught by the route handlers
      // below so each one can decide its own status code.
      // =======================================================

      async function tmdbGet(path) {

        const response =
          await fetch(
            `https://api.themoviedb.org/3/${path}`,
            {
              headers: {
                "Authorization": `Bearer ${env.TMDB_API_KEY}`,
                "accept": "application/json",
              },
            }
          );

        if (!response.ok) {

          if (response.status === 401) {
            throw new Error(
              "TMDB returned 401 Unauthorized - check that " +
              "TMDB_API_KEY is set on this Worker as a valid " +
              "v4 Read Access Token."
            );
          }

          if (response.status === 404) {
            throw new Error(
              `TMDB returned 404 for ${path}`
            );
          }

          throw new Error(
            `TMDB request failed with HTTP ${response.status}`
          );

        }

        return response.json();

      }


      // =======================================================
      // GET /tmdb-search?query=...&media_type=movie|tv
      //
      // Proxies a TMDB title search - powers the in-page
      // "search to add" picker. Returns only what the picker
      // needs to show a result list (id, title/name, year,
      // poster), not full details - POST /wishlist fetches the
      // rest once a specific result is picked.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/tmdb-search"
      ) {

        const query =
          (url.searchParams.get("query") || "").trim();

        const mediaType =
          (url.searchParams.get("media_type") || "movie")
            .trim()
            .toLowerCase();

        if (!query) {

          return new Response(
            JSON.stringify({
              error: "query is required"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }

        if (!["movie", "tv"].includes(mediaType)) {

          return new Response(
            JSON.stringify({
              error: "media_type must be movie or tv"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }

        const searchData =
          await tmdbGet(
            `search/${mediaType}` +
            `?query=${encodeURIComponent(query)}`
          );

        const results =
          (searchData.results || [])
            .slice(0, 8)
            .map(result => ({
              tmdb_id: result.id,
              media_type: mediaType,
              title:
                mediaType === "movie"
                  ? result.title
                  : result.name,
              year: (
                (
                  mediaType === "movie"
                    ? result.release_date
                    : result.first_air_date
                ) || ""
              ).slice(0, 4),
              poster:
                result.poster_path
                  ? "https://image.tmdb.org/t/p/w200" +
                    result.poster_path
                  : null,
            }));

        /*

        * Live streaming preview for the picker - only the top
        * few results get checked (SEARCH_STREAMING_PREVIEW_COUNT
        * below), same whitelist/priority order as everywhere
        * else (see fetchWhitelistedServices/STREAMING_PRIORITY),
        * so the front-end can show a badge before the title is
        * even added. Checking all 8 results on every keystroke
        * would be 8x the TMDB calls for results nobody's about
        * to pick - capping it to the handful actually visible up
        * top keeps this cheap. Best effort per-title: one
        * result's lookup failing (rejects) just leaves that one
        * result with no services rather than failing the whole
        * search.
          */

        const SEARCH_STREAMING_PREVIEW_COUNT = 3;

        await Promise.all(
          results
            .slice(0, SEARCH_STREAMING_PREVIEW_COUNT)
            .map(
              async result => {

                try {

                  const streamingResult =
                    await fetchWhitelistedServices(
                      env,
                      result.tmdb_id,
                      mediaType
                    );

                  result.services =
                    streamingResult.services;

                } catch (streamingError) {

                  console.error(
                    `Search-time streaming check failed for tmdb ${result.tmdb_id}:`,
                    streamingError
                  );

                  result.services = [];

                }

              }
            )
        );

        return new Response(
          JSON.stringify(results),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );

      }


      // =======================================================
      // GET /wishlist
      //
      // Return every current wishlist entry.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/wishlist"
      ) {

        const { results } = await env.DB
          .prepare(`
            SELECT *
            FROM wishlist
            ORDER BY title
          `)
          .all();

        return new Response(
          JSON.stringify(results),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );

      }


      // =======================================================
      // GET /wishlist-streaming
      //
      // Which whitelisted service (if any) each wishlist title
      // is currently available on, refreshed weekly by the
      // scheduled() handler's chained sync (see
      // advanceStreamingSyncChain) - see that function and
      // fetchWhitelistedServices for the whitelist, priority
      // order, and the TMDB watch/providers integration itself.
      // services/extended_services are stored as JSON strings,
      // parsed back into arrays here so the client gets real
      // JSON, not a JSON-in-JSON string.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/wishlist-streaming"
      ) {

        const { results } = await env.DB
          .prepare(`
            SELECT tmdb_id, media_type, services, extended_services, checked_at
            FROM wishlist_streaming
          `)
          .all();

        const parsed =
          results.map(row => ({
            tmdb_id: row.tmdb_id,
            media_type: row.media_type,
            services: JSON.parse(row.services || "[]"),
            extended_services: JSON.parse(row.extended_services || "[]"),
            checked_at: row.checked_at,
          }));

        return new Response(
          JSON.stringify(parsed),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );

      }


      // =======================================================
      // POST /wishlist
      //
      // Add a title to the wishlist by TMDB id - fetches the
      // same fields the GitHub Action pulls for a real
      // movies.js entry (title, credits, US rating, genres,
      // runtime), so a wishlist card looks and reads exactly
      // like an owned one once flipped. Idempotent: adding an
      // id that's already on the wishlist just returns the
      // existing row rather than erroring or duplicating.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/wishlist"
      ) {

        const data = await request.json();

        const tmdbId =
          parseInt(data.tmdb_id, 10);

        const mediaType =
          (data.media_type || "movie")
            .trim()
            .toLowerCase();

        if (!tmdbId || Number.isNaN(tmdbId)) {

          return new Response(
            JSON.stringify({
              error: "a numeric tmdb_id is required"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }

        if (!["movie", "tv"].includes(mediaType)) {

          return new Response(
            JSON.stringify({
              error: "media_type must be movie or tv"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }

        const existingRow =
          await env.DB
            .prepare(`
              SELECT *
              FROM wishlist
              WHERE tmdb_id = ?
            `)
            .bind(
              tmdbId
            )
            .first();

        if (existingRow) {

          return new Response(
            JSON.stringify({
              success: true,
              already_on_wishlist: true,
              entry: existingRow,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }


        // -----------------------------------------------------
        // FETCH FROM TMDB
        //
        // Mirrors add_movie.py's own logic, minus the season
        // handling - wishlist entries are always a single
        // show-level (or movie-level) row, never per-season.
        //
        // info/credits/the US rating lookup/the streaming check
        // are four TMDB calls that don't depend on each other at
        // all (the streaming check in particular only ever
        // needed tmdbId/mediaType, which were already known
        // before ANY of this ran) - they used to fire one after
        // another, so the streaming check (last in line) was the
        // slowest thing to land and the first thing a stray
        // network hiccup could quietly wipe out. Running them
        // together cuts the wait to whichever single call is
        // slowest instead of the sum of all four, and means the
        // streaming result is normally sitting right there by
        // the time the wishlist row itself gets written below -
        // see loadWishlistStreaming/POST wishlist client-side for
        // why that timing matters. The streaming call still
        // can't fail the add - a rejection here is caught and
        // turned into null, same "best effort" behavior as
        // before, so a bad streaming lookup never blocks or
        // errors the wishlist add itself.

        const [info, credits, ratingData, streamingSettled] =
          await Promise.all([

            tmdbGet(
              `${mediaType}/${tmdbId}`
            ),

            tmdbGet(
              `${mediaType}/${tmdbId}/credits`
            ),

            tmdbGet(
              mediaType === "movie"
                ? `movie/${tmdbId}/release_dates`
                : `tv/${tmdbId}/content_ratings`
            ),

            fetchWhitelistedServices(
              env,
              tmdbId,
              mediaType
            ).catch(
              streamingError => {

                console.error(
                  `Initial streaming check failed for tmdb ${tmdbId}:`,
                  streamingError
                );

                return null;

              }
            )

          ]);

        const tmdbTitle =
          mediaType === "movie"
            ? (info.title || "")
            : (info.name || "");

        if (!tmdbTitle) {

          return new Response(
            JSON.stringify({
              error: "TMDB returned no title for that id"
            }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }

        const year =
          (
            (
              mediaType === "movie"
                ? info.release_date
                : info.first_air_date
            ) || ""
          ).slice(0, 4);

        let runtime = "";

        if (mediaType === "movie" && info.runtime) {

          runtime =
            `${info.runtime}m`;

        } else if (
          mediaType === "tv" &&
          Array.isArray(info.episode_run_time) &&
          info.episode_run_time.length > 0
        ) {

          runtime =
            `${info.episode_run_time[0]}m`;

        }

        const cast =
          (credits.cast || [])
            .slice(0, 6)
            .map(person => person.name)
            .filter(Boolean);

        const directors =
          (credits.crew || [])
            .filter(person => person.job === "Director")
            .map(person => person.name)
            .filter(Boolean);

        const genres =
          (info.genres || [])
            .map(genre => genre.name)
            .filter(Boolean);


        // US MPA / content rating - same "no US cert on file
        // becomes NR" behavior as add_movie.py. ratingData was
        // already fetched above (release_dates for a movie,
        // content_ratings for tv) as part of the parallel batch.

        let mpaRating = "NR";

        if (mediaType === "movie") {

          for (
            const entry of ratingData.results || []
          ) {

            if (entry.iso_3166_1 !== "US") {
              continue;
            }

            for (
              const release of entry.release_dates || []
            ) {

              const cert =
                (release.certification || "").trim();

              if (cert) {
                mpaRating = cert;
                break;
              }

            }

            break;

          }

        } else {

          for (
            const entry of ratingData.results || []
          ) {

            if (entry.iso_3166_1 !== "US") {
              continue;
            }

            const cert =
              (entry.rating || "").trim();

            if (cert) {
              mpaRating = cert;
            }

            break;

          }

        }

        const poster =
          info.poster_path
            ? "https://image.tmdb.org/t/p/w500" +
              info.poster_path
            : "";

        const addedAt =
          new Date().toISOString();

        const result =
          await env.DB
            .prepare(`
              INSERT INTO wishlist
                (
                  tmdb_id,
                  media_type,
                  title,
                  tmdb_title,
                  poster,
                  year,
                  runtime,
                  genre,
                  rated,
                  director,
                  cast,
                  synopsis,
                  added_at
                )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              tmdbId,
              mediaType,
              tmdbTitle,
              tmdbTitle,
              poster,
              year,
              runtime,
              genres.join(" / "),
              mpaRating,
              directors.join(", "),
              cast.join(", "),
              info.overview || "",
              addedAt
            )
            .run();

        // Streaming availability was already checked above,
        // concurrently with info/credits/rating rather than
        // waiting for Sunday's sync OR waiting on those other
        // calls to finish first - streamingSettled is null only
        // when that check itself failed (see the .catch() in the
        // Promise.all above), which still shouldn't block the
        // wishlist add itself; Sunday's sync will pick a null
        // result back up either way.

        let initialServices = [];
        let initialExtendedServices = [];

        if (streamingSettled) {

          initialServices =
            streamingSettled.services;

          initialExtendedServices =
            streamingSettled.extendedServices;

          try {

            await env.DB
              .prepare(`
                INSERT INTO wishlist_streaming (tmdb_id, media_type, services, extended_services, checked_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(tmdb_id, media_type) DO UPDATE SET
                  services = excluded.services,
                  extended_services = excluded.extended_services,
                  checked_at = excluded.checked_at
              `)
              .bind(
                tmdbId,
                mediaType,
                JSON.stringify(initialServices),
                JSON.stringify(initialExtendedServices),
                addedAt
              )
              .run();

          } catch (streamingDbError) {

            console.error(
              `Failed to store initial streaming result for "${tmdbTitle}" (tmdb ${tmdbId}):`,
              streamingDbError
            );

          }

        }

        return new Response(
          JSON.stringify({
            success: true,
            already_on_wishlist: false,
            entry: {
              id: result.meta.last_row_id,
              tmdb_id: tmdbId,
              media_type: mediaType,
              title: tmdbTitle,
              tmdb_title: tmdbTitle,
              poster,
              year,
              runtime,
              genre: genres.join(" / "),
              rated: mpaRating,
              director: directors.join(", "),
              cast: cast.join(", "),
              synopsis: info.overview || "",
              added_at: addedAt,
            },
            streaming_services: initialServices,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );

      }


      // =======================================================
      // DELETE /wishlist/:tmdbId
      //
      // Remove one wishlist entry by TMDB id - used both for a
      // manual "never mind" removal and by add-movie.yml's
      // cleanup step once a title has actually been added to
      // movies.js for real.
      // =======================================================

      if (
        request.method === "DELETE" &&
        url.pathname.startsWith(
          "/wishlist/"
        )
      ) {

        const tmdbId =
          url.pathname.substring(
            "/wishlist/".length
          );

        if (!tmdbId) {

          return new Response(
            JSON.stringify({
              error: "TMDB ID is required"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );

        }

        await env.DB
          .prepare(`
            DELETE FROM wishlist
            WHERE tmdb_id = ?
          `)
          .bind(
            tmdbId
          )
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            tmdb_id: tmdbId
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );

      }


      // =======================================================
      // TOURNAMENT HELPERS
      //
      // The Worker never decides WHICH movies are in a
      // tournament or WHY (genre pools, play-in trimming,
      // random draws - all of that lives in app.js, which has
      // the real catalog loaded). It only ever stores a
      // generic single-elimination bracket and progresses
      // winners - see POST /tournaments for the shape it
      // expects.
      // =======================================================

      const jsonResponse = (data, status) => new Response(
        JSON.stringify(data),
        {
          status: status || 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );

      async function isRoundComplete(tournamentId, round) {

        const row =
          await env.DB
            .prepare(`
              SELECT COUNT(*) AS remaining
              FROM tournament_matchups
              WHERE tournament_id = ?
              AND round = ?
              AND is_third_place_match = 0
              AND winner_movie_id IS NULL
            `)
            .bind(
              tournamentId,
              round
            )
            .first();

        return row.remaining === 0;

      }

      async function insertMatchup(
        tournamentId,
        round,
        slot,
        a,
        b,
        isThirdPlace
      ) {

        /*
         * Only ONE side of a matchup can be pending on a
         * play-in result - a round-1 slot can be "concrete
         * movie vs. play-in winner", but never "play-in
         * winner vs. play-in winner". When building the
         * round1 payload client-side, always pair each
         * pendingFromPlayIn placeholder with a real movie,
         * never with another placeholder.
         */

        const result =
          await env.DB
            .prepare(`
              INSERT INTO tournament_matchups
                (
                  tournament_id,
                  round,
                  slot,
                  is_third_place_match,
                  movie_id_a,
                  movie_title_a,
                  movie_id_b,
                  movie_title_b,
                  pending_source_matchup_id,
                  pending_source_side
                )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              tournamentId,
              round,
              slot,
              isThirdPlace ? 1 : 0,
              a && a.movie_id ? a.movie_id : null,
              a && a.title ? a.title : null,
              b && b.movie_id ? b.movie_id : null,
              b && b.title ? b.title : null,
              a && a.pendingFromMatchupId ? a.pendingFromMatchupId :
                (b && b.pendingFromMatchupId ? b.pendingFromMatchupId : null),
              a && a.pendingFromMatchupId ? "a" :
                (b && b.pendingFromMatchupId ? "b" : null)
            )
            .run();

        return result.meta.last_row_id;

      }

      async function insertHistory(
        movieId,
        movieTitle,
        tournamentId,
        category,
        result,
        round,
        beatenByMovieId,
        beatenByTitle,
        deliberationMs
      ) {

        await env.DB
          .prepare(`
            INSERT INTO movie_tournament_history
              (
                movie_id,
                movie_title,
                tournament_id,
                category,
                result,
                round,
                beaten_by_movie_id,
                beaten_by_title,
                deliberation_ms,
                recorded_at
              )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            movieId,
            movieTitle,
            tournamentId,
            category,
            result,
            round,
            beatenByMovieId || null,
            beatenByTitle || null,
            deliberationMs || null,
            new Date().toISOString()
          )
          .run();

      }

      /*
       * Works out which matchup was decided fastest, which took
       * longest, and how long the tournament took overall - from
       * server-recorded decided_at timestamps, minus whatever
       * hidden/paused time (tab backgrounded, or the tournament
       * overlay closed while browsing the rest of the site) the
       * client reported for that specific gap via hidden_gap_ms.
       * That value is safe to trust here because it's disjoint by
       * construction (reset to 0 after every pick, see the pick
       * handler above) - it can only ever shrink a gap toward its
       * true wall-clock span, never distort it the way per-
       * matchup deliberation timing did below.
       *
       * This replaced an earlier version that trusted a
       * client-computed deliberation_ms per matchup (time since
       * that matchup's round first rendered). That looked
       * reasonable per-matchup, but every matchup in a round is
       * visible in one list at once - so "time since the round
       * appeared" for the 30th matchup decided in a round of 30
       * necessarily includes the time spent deciding the other
       * 29, not just its own. Summing those cumulative,
       * overlapping numbers for "Overall Time" massively
       * overcounted (a real ~10-minute tournament was coming out
       * as 130-190 minutes), and "longest battle" was really just
       * always "whichever matchup got decided last in the
       * biggest round."
       *
       * Using the gap between one decided_at and the previous
       * one instead gives disjoint, non-overlapping durations -
       * summing them can never exceed the tournament's real
       * wall-clock span, and the biggest gap is a genuine outlier
       * rather than an artifact of round size.
       */

      async function computeDeliberationGaps(
        tournamentId,
        tournamentRow
      ) {

        const { results: decidedMatchups } =
          await env.DB
            .prepare(`
              SELECT *
              FROM tournament_matchups
              WHERE tournament_id = ? AND winner_movie_id IS NOT NULL
              ORDER BY decided_at ASC
            `)
            .bind(
              tournamentId
            )
            .all();

        if (decidedMatchups.length === 0) {

          return {
            fastestMatchup: null,
            toughestMatchup: null,
            overallTimeMs: null
          };

        }

        let previousTimeMs =
          new Date(tournamentRow.started_at).getTime();

        let fastestMatchup =
          null;

        let toughestMatchup =
          null;

        decidedMatchups.forEach(
          matchup => {

            const decidedAtMs =
              new Date(matchup.decided_at).getTime();

            /*
             * Subtract any client-reported hidden/paused time
             * (tab backgrounded or the tournament overlay closed)
             * that fell inside this specific gap - see
             * hidden_gap_ms in the pick handler above for why
             * this is safe to subtract without reintroducing the
             * overlapping-round overcounting bug this function
             * was written to avoid.
             */

            const gapMs =
              Math.max(
                0,
                (decidedAtMs - previousTimeMs) -
                (matchup.hidden_gap_ms || 0)
              );

            previousTimeMs =
              decidedAtMs;

            matchup.gap_deliberation_ms =
              gapMs;

            if (
              !fastestMatchup ||
              gapMs < fastestMatchup.gap_deliberation_ms
            ) {

              fastestMatchup =
                matchup;

            }

            if (
              !toughestMatchup ||
              gapMs > toughestMatchup.gap_deliberation_ms
            ) {

              toughestMatchup =
                matchup;

            }

          }
        );

        const lastDecidedAtMs =
          new Date(
            decidedMatchups[decidedMatchups.length - 1].decided_at
          ).getTime();

        const startedAtMs =
          new Date(tournamentRow.started_at).getTime();

        const overallTimeMs =
          Math.max(0, lastDecidedAtMs - startedAtMs);

        return {
          fastestMatchup,
          toughestMatchup,
          overallTimeMs
        };

      }

      /*
       * Marks the tournament complete, crowns the champion, and
       * updates their lifetime stats + history. Called from
       * whichever of {final, 3rd-place match} is decided SECOND
       * - see the pick handler, since either can come first.
       */

      async function completeTournament(
        tournamentId,
        tournamentRow,
        championMovieId,
        championTitle
      ) {

        const now =
          new Date().toISOString();

        /*
         * Captured BEFORE the upsert below overwrites it - this
         * is the only chance to know who's being dethroned, if
         * anyone.
         */

        const previousChampion =
          await env.DB
            .prepare(`
              SELECT * FROM current_champions WHERE category = ?
            `)
            .bind(
              tournamentRow.category
            )
            .first();

        await env.DB
          .prepare(`
            UPDATE tournaments
            SET status = 'complete', completed_at = ?
            WHERE id = ?
          `)
          .bind(
            now,
            tournamentId
          )
          .run();

        await env.DB
          .prepare(`
            INSERT OR REPLACE INTO current_champions
              (category, movie_id, movie_title, tournament_id, crowned_at)
            VALUES (?, ?, ?, ?, ?)
          `)
          .bind(
            tournamentRow.category,
            championMovieId,
            championTitle,
            tournamentId,
            now
          )
          .run();

        await env.DB
          .prepare(`
            INSERT INTO movie_tournament_stats
              (movie_id, total_championships, has_ever_won)
            VALUES (?, 1, 1)
            ON CONFLICT(movie_id) DO UPDATE SET
              total_championships = total_championships + 1,
              has_ever_won = 1
          `)
          .bind(
            championMovieId
          )
          .run();

        await insertHistory(
          championMovieId,
          championTitle,
          tournamentId,
          tournamentRow.category,
          "champion",
          tournamentRow.total_rounds
        );

        /*
         * Bracket buster - the single longest-deliberation
         * matchup across the WHOLE tournament, credited to
         * whichever movie won it (the one still alive to have a
         * history entry made about it). Skipped entirely if
         * nothing was actually decided (shouldn't happen once
         * we're crowning a champion, but guards the empty case).
         *
         * fastestMatchup/overallTimeMs come along for free here
         * so they can be handed straight to buildResultsSummary
         * without it having to re-derive them.
         */

        const { fastestMatchup, toughestMatchup, overallTimeMs } =
          await computeDeliberationGaps(
            tournamentId,
            tournamentRow
          );

        if (toughestMatchup) {

          const toughestWinnerTitle =
            String(toughestMatchup.winner_movie_id) ===
            String(toughestMatchup.movie_id_a)
              ? toughestMatchup.movie_title_a
              : toughestMatchup.movie_title_b;

          const toughestOpponentId =
            String(toughestMatchup.winner_movie_id) ===
            String(toughestMatchup.movie_id_a)
              ? toughestMatchup.movie_id_b
              : toughestMatchup.movie_id_a;

          const toughestOpponentTitle =
            String(toughestMatchup.winner_movie_id) ===
            String(toughestMatchup.movie_id_a)
              ? toughestMatchup.movie_title_b
              : toughestMatchup.movie_title_a;

          await insertHistory(
            toughestMatchup.winner_movie_id,
            toughestWinnerTitle,
            tournamentId,
            tournamentRow.category,
            "bracket_buster",
            toughestMatchup.round,
            toughestOpponentId,
            toughestOpponentTitle,
            toughestMatchup.gap_deliberation_ms
          );

        }

        /*
         * Everything above this point (status, champion, stats,
         * history, bracket buster) has already been written
         * successfully - the tournament IS genuinely complete
         * regardless of what happens next. The scoreboard is a
         * bonus feature built from that data, not part of
         * completing the tournament itself, so a bug in it must
         * never take the whole completion down with it - caught
         * here and simply omitted (null) rather than thrown,
         * so the client still gets its success response and can
         * refresh normally; it just falls back to the plain hub
         * instead of showing the scoreboard for this one run.
         */

        try {

          return await buildResultsSummary(
            tournamentId,
            tournamentRow,
            previousChampion,
            toughestMatchup,
            fastestMatchup,
            overallTimeMs
          );

        } catch (error) {

          console.error(
            "Results summary failed (tournament still completed fine):",
            error
          );

          return null;

        }

      }

      /*
       * Builds the whole end-of-tournament scoresheet: podium,
       * the three "regular" stats, a full participant list (for
       * the client's own franchise-detection pass), and every
       * fun fact that turns out to actually apply - the client
       * randomly picks 3 of whichever come back, plus whatever
       * Franchise Showdown it computes on its own.
       */

      async function buildResultsSummary(
        tournamentId,
        tournamentRow,
        previousChampion,
        toughestMatchup,
        fastestMatchup,
        overallTimeMs
      ) {

        const category =
          tournamentRow.category;

        /*
         * Tier-only, deliberately NOT multiplied by round. round
         * scales with however many movies were in that
         * particular bracket, so a champion of a 16-movie bracket
         * (round 4) would always outscore a champion of an
         * 8-movie bracket (round 3) under a round-weighted score,
         * even though both achieved the identical best-possible
         * result - which showed up as a false "Comeback" for a
         * movie that had already won this tournament before.
         * Tier alone is comparable across differently-sized runs
         * of the same category.
         */

        const rankScoreSql =
          `CASE result ` +
          `WHEN 'champion' THEN 4 ` +
          `WHEN 'runner_up' THEN 3 ` +
          `WHEN 'third_place' THEN 2 ` +
          `ELSE 1 END`;

        // -----------------------------------------------------
        // PODIUM
        // -----------------------------------------------------

        const champion =
          await env.DB
            .prepare(`
              SELECT * FROM movie_tournament_history
              WHERE tournament_id = ? AND result = 'champion'
              LIMIT 1
            `)
            .bind(tournamentId)
            .first();

        const runnerUp =
          await env.DB
            .prepare(`
              SELECT * FROM movie_tournament_history
              WHERE tournament_id = ? AND result = 'runner_up'
              LIMIT 1
            `)
            .bind(tournamentId)
            .first();

        const thirdPlace =
          await env.DB
            .prepare(`
              SELECT * FROM movie_tournament_history
              WHERE tournament_id = ? AND result = 'third_place'
              LIMIT 1
            `)
            .bind(tournamentId)
            .first();

        // -----------------------------------------------------
        // THE THREE REGULARS
        //
        // fastestMatchup, toughestMatchup and overallTimeMs are
        // all passed in from completeTournament's
        // computeDeliberationGaps() call, which derives them from
        // consecutive decided_at gaps rather than trusting a
        // client-reported per-matchup time - see the comment on
        // computeDeliberationGaps for why that used to badly
        // overcount.
        // -----------------------------------------------------

        function sideInfo(matchup, wantWinner) {

          if (!matchup) {

            return null;

          }

          const isA =
            String(matchup.winner_movie_id) ===
            String(matchup.movie_id_a);

          if (wantWinner) {

            return {
              movie_id: matchup.winner_movie_id,
              title: isA ? matchup.movie_title_a : matchup.movie_title_b
            };

          }

          return {
            movie_id: isA ? matchup.movie_id_b : matchup.movie_id_a,
            title: isA ? matchup.movie_title_b : matchup.movie_title_a
          };

        }

        const fastestDefeat =
          fastestMatchup
            ? {
              winner: sideInfo(fastestMatchup, true),
              loser: sideInfo(fastestMatchup, false),
              deliberation_ms: fastestMatchup.gap_deliberation_ms,
              round: fastestMatchup.round
            }
            : null;

        const longestBattle =
          toughestMatchup
            ? {
              winner: sideInfo(toughestMatchup, true),
              loser: sideInfo(toughestMatchup, false),
              deliberation_ms: toughestMatchup.gap_deliberation_ms,
              round: toughestMatchup.round
            }
            : null;

        // -----------------------------------------------------
        // ALL PARTICIPANTS (for Iron Movie, Legend, and the
        // client's own Franchise Showdown pass)
        // -----------------------------------------------------

        const { results: participantRowsA } =
          await env.DB
            .prepare(`
              SELECT DISTINCT movie_id_a AS movie_id, movie_title_a AS movie_title
              FROM tournament_matchups
              WHERE tournament_id = ? AND movie_id_a IS NOT NULL
            `)
            .bind(tournamentId)
            .all();

        const { results: participantRowsB } =
          await env.DB
            .prepare(`
              SELECT DISTINCT movie_id_b AS movie_id, movie_title_b AS movie_title
              FROM tournament_matchups
              WHERE tournament_id = ? AND movie_id_b IS NOT NULL
            `)
            .bind(tournamentId)
            .all();

        const participantMap =
          new Map();

        [...participantRowsA, ...participantRowsB].forEach(
          row => {

            participantMap.set(
              String(row.movie_id),
              row.movie_title
            );

          }
        );

        const participantIds =
          Array.from(
            participantMap.keys()
          );

        /*
         * Each participant's actual outcome IN THIS tournament -
         * needed client-side to work out "who went furthest" for
         * Franchise Showdown. bracket_buster is excluded here
         * since it's an extra bonus fact, not a final placement -
         * a movie can have both a real result AND a bracket_
         * buster row for the same run.
         */

        const { results: resultRows } =
          await env.DB
            .prepare(`
              SELECT movie_id, result, round
              FROM movie_tournament_history
              WHERE tournament_id = ? AND result != 'bracket_buster'
            `)
            .bind(tournamentId)
            .all();

        const resultMap =
          new Map();

        resultRows.forEach(
          row => {

            resultMap.set(
              String(row.movie_id),
              { result: row.result, round: row.round }
            );

          }
        );

        const participants =
          Array.from(
            participantMap.entries()
          ).map(
            ([movie_id, movie_title]) => {

              const outcome =
                resultMap.get(movie_id);

              return {
                movie_id,
                movie_title,
                result: outcome ? outcome.result : null,
                round: outcome ? outcome.round : null
              };

            }
          );

        // -----------------------------------------------------
        // FUN FACT CANDIDATES - only the ones that actually
        // apply end up in this list; the client randomly picks
        // from whatever's here (plus its own Franchise Showdown
        // check) rather than always showing the same ones.
        // -----------------------------------------------------

        const funFacts =
          [];

        // Dethroned

        if (
          previousChampion &&
          champion &&
          String(previousChampion.movie_id) !== String(champion.movie_id)
        ) {

          funFacts.push({
            type: "dethroned",
            text: `👑 Dethroned: ${champion.movie_title} takes the belt from ${previousChampion.movie_title}`
          });

        }

        // Tournament debut (check champion, then runner-up, then third)

        for (
          const finisher of [champion, runnerUp, thirdPlace]
        ) {

          if (!finisher) {

            continue;

          }

          const priorCount =
            await env.DB
              .prepare(`
                SELECT COUNT(*) AS cnt FROM movie_tournament_history
                WHERE movie_id = ? AND tournament_id != ?
              `)
              .bind(finisher.movie_id, tournamentId)
              .first();

          if (priorCount.cnt === 0) {

            funFacts.push({
              type: "debut",
              text: `🎬 Tournament debut: first-ever bracket appearance for ${finisher.movie_title}, and they finished as ${finisher.result === "champion" ? "champion" : finisher.result === "runner_up" ? "runner-up" : "3rd place"}!`
            });

            break;

          }

        }

        // Repeat elimination (whoever, among THIS run's

        const repeatElim =
          await env.DB
            .prepare(`
              SELECT movie_id, movie_title, COUNT(*) AS elim_count
              FROM movie_tournament_history
              WHERE category = ? AND result = 'eliminated'
              AND movie_id IN (
                SELECT movie_id FROM movie_tournament_history
                WHERE tournament_id = ? AND result = 'eliminated'
              )
              GROUP BY movie_id
              ORDER BY elim_count DESC
              LIMIT 1
            `)
            .bind(category, tournamentId)
            .first();

        if (repeatElim && repeatElim.elim_count >= 2) {

          const thisEliminationRow =
            await env.DB
              .prepare(`
                SELECT beaten_by_title FROM movie_tournament_history
                WHERE tournament_id = ? AND movie_id = ? AND result = 'eliminated'
                LIMIT 1
              `)
              .bind(tournamentId, repeatElim.movie_id)
              .first();

          const beatenByText =
            thisEliminationRow && thisEliminationRow.beaten_by_title
              ? ` (this time by ${thisEliminationRow.beaten_by_title})`
              : "";

          funFacts.push({
            type: "repeat_elimination",
            text: `😅 ${repeatElim.movie_title} has now been knocked out of the ${category === "full" ? "Full Collection" : category} tournament ${repeatElim.elim_count} times${beatenByText}`
          });

        }

        // Career-best / slipped / comeback, checked for the champion

        if (champion) {

          const bestPrior =
            await env.DB
              .prepare(`
                SELECT MAX(${rankScoreSql}) AS best_score
                FROM movie_tournament_history
                WHERE movie_id = ? AND category = ? AND tournament_id != ?
              `)
              .bind(champion.movie_id, category, tournamentId)
              .first();

          const mostRecentPrior =
            await env.DB
              .prepare(`
                SELECT ${rankScoreSql} AS score, result
                FROM movie_tournament_history
                WHERE movie_id = ? AND category = ? AND tournament_id != ?
                ORDER BY recorded_at DESC
                LIMIT 1
              `)
              .bind(champion.movie_id, category, tournamentId)
              .first();

          // Champion tier, fixed - see the rankScoreSql comment
          // above for why this can't be round-weighted.

          const thisScore =
            4;

          if (
            bestPrior &&
            bestPrior.best_score !== null &&
            thisScore > bestPrior.best_score
          ) {

            funFacts.push({
              type: "career_best",
              text: `📈 Career-best: this is ${champion.movie_title}'s best-ever finish in the ${category === "full" ? "Full Collection" : category} tournament`
            });

          }

          if (
            mostRecentPrior &&
            thisScore > mostRecentPrior.score
          ) {

            funFacts.push({
              type: "comeback",
              text: `💪 Comeback: ${champion.movie_title} did better this time than its last run in this tournament`
            });

          }

        }

        // Rivalry rematch - the decided matchup (any round) with

        const rivalry =
          await env.DB
            .prepare(`
              SELECT
                m.movie_id_a, m.movie_title_a, m.movie_id_b, m.movie_title_b,
                (
                  SELECT COUNT(*) FROM movie_tournament_history h
                  WHERE h.movie_id = m.movie_id_b AND h.beaten_by_movie_id = m.movie_id_a
                ) AS a_wins,
                (
                  SELECT COUNT(*) FROM movie_tournament_history h
                  WHERE h.movie_id = m.movie_id_a AND h.beaten_by_movie_id = m.movie_id_b
                ) AS b_wins
              FROM tournament_matchups m
              WHERE m.tournament_id = ? AND m.winner_movie_id IS NOT NULL
              ORDER BY (a_wins + b_wins) DESC
              LIMIT 1
            `)
            .bind(tournamentId)
            .first();

        if (rivalry && (rivalry.a_wins + rivalry.b_wins) >= 2) {

          const totalMeetings =
            rivalry.a_wins + rivalry.b_wins;

          const rivalryText =
            rivalry.a_wins === rivalry.b_wins
              ? `${rivalry.movie_title_a} and ${rivalry.movie_title_b} are tied ${rivalry.a_wins}-${rivalry.b_wins} after ${totalMeetings} meetings`
              : rivalry.a_wins > rivalry.b_wins
                ? `${rivalry.movie_title_a} leads ${rivalry.movie_title_b} ${rivalry.a_wins}-${rivalry.b_wins}`
                : `${rivalry.movie_title_b} leads ${rivalry.movie_title_a} ${rivalry.b_wins}-${rivalry.a_wins}`;

          funFacts.push({
            type: "rivalry",
            text: `🔁 Rivalry rematch: ${rivalryText}`
          });

        }

        // Iron movie - most tournaments appeared in, of anyone
        //
        // NOTE: this used to filter with a dynamic
        // `WHERE movie_id IN (?, ?, ?, ...)` bound with one
        // parameter per tournament participant. D1 caps bound
        // parameters per statement at 100, and a big genre pool
        // or the full-collection cap (256) blows past that,
        // crashing with a D1 _sendOrThrow error. Instead, pull
        // the aggregates unfiltered (already tiny - one row per
        // movie ever entered) and filter against participantMap
        // in JS.

        if (participantIds.length > 0) {

          const { results: allAppearanceCounts } =
            await env.DB
              .prepare(`
                SELECT movie_id, movie_title, COUNT(DISTINCT tournament_id) AS appearances
                FROM movie_tournament_history
                GROUP BY movie_id
                ORDER BY appearances DESC
              `)
              .all();

          const ironMovie =
            allAppearanceCounts.find(
              row => participantMap.has(String(row.movie_id))
            );

          if (ironMovie && ironMovie.appearances >= 2) {

            funFacts.push({
              type: "iron_movie",
              text: `🏋️ Iron Movie: ${ironMovie.movie_title} has now competed in ${ironMovie.appearances} tournaments`
            });

          }

          // Legend - highest lifetime championship total, of anyone in this field

          const { results: allChampionshipCounts } =
            await env.DB
              .prepare(`
                SELECT movie_id, total_championships
                FROM movie_tournament_stats
                WHERE total_championships > 0
                ORDER BY total_championships DESC
              `)
              .all();

          const legend =
            allChampionshipCounts.find(
              row => participantMap.has(String(row.movie_id))
            );

          if (legend) {

            const legendTitle =
              participantMap.get(String(legend.movie_id)) || "A field legend";

            funFacts.push({
              type: "legend",
              text: `🏛️ Field legend: ${legendTitle} has won ${legend.total_championships} tournament${legend.total_championships === 1 ? "" : "s"} over its lifetime`
            });

          }

        }

        /*
         * Every decided matchup in this tournament, for the
         * client's own actor/director showdown scan - cast and
         * director info only lives in movies.js on the client,
         * so the Worker just hands back who-played-who and lets
         * the client cross-reference.
         */

        const { results: allMatchups } =
          await env.DB
            .prepare(`
              SELECT movie_id_a, movie_title_a, movie_id_b, movie_title_b, winner_movie_id, round
              FROM tournament_matchups
              WHERE tournament_id = ? AND winner_movie_id IS NOT NULL
            `)
            .bind(tournamentId)
            .all();

        return {
          podium: {
            champion,
            runner_up: runnerUp,
            third_place: thirdPlace
          },
          fastest_defeat: fastestDefeat,
          longest_battle: longestBattle,
          overall_time_ms: overallTimeMs,
          participants,
          all_matchups: allMatchups,
          fun_facts: funFacts
        };

      }



      // =======================================================
      // POST /tournaments
      //
      // Creates a new bracket. Body:
      // {
      //   category: "Action" | "full",
      //   playIn: [ { a: {movie_id,title}, b: {movie_id,title} }, ... ],
      //   round1: [
      //     { a: {movie_id,title} | {pendingFromPlayIn: <index>},
      //       b: {movie_id,title} | {pendingFromPlayIn: <index>} },
      //     ...
      //   ]
      // }
      //
      // playIn is omitted/empty for anything that doesn't need
      // trimming to a power of 2 (every genre bracket). round1
      // must already be a power-of-2 length - the client is
      // responsible for the math, the Worker just stores it.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/tournaments"
      ) {

        const body =
          await request.json();

        const category =
          (body.category || "").trim();

        const round1 =
          Array.isArray(body.round1)
            ? body.round1
            : [];

        const playIn =
          Array.isArray(body.playIn)
            ? body.playIn
            : [];

        if (!category) {

          return jsonResponse(
            { error: "category is required" },
            400
          );

        }

        const isPowerOfTwo =
          round1.length > 0 &&
          (round1.length & (round1.length - 1)) === 0;

        if (!isPowerOfTwo) {

          return jsonResponse(
            { error: "round1 must be a non-empty power-of-2 length" },
            400
          );

        }

        const totalRounds =
          Math.log2(round1.length) + 1;

        const tournamentResult =
          await env.DB
            .prepare(`
              INSERT INTO tournaments
                (category, status, total_rounds, started_at)
              VALUES (?, 'in_progress', ?, ?)
            `)
            .bind(
              category,
              totalRounds,
              new Date().toISOString()
            )
            .run();

        const tournamentId =
          tournamentResult.meta.last_row_id;

        const playInMatchupIds =
          [];

        for (
          let i = 0;
          i < playIn.length;
          i++
        ) {

          const matchupId =
            await insertMatchup(
              tournamentId,
              0,
              i,
              playIn[i].a,
              playIn[i].b,
              false
            );

          playInMatchupIds.push(
            matchupId
          );

        }

        for (
          let i = 0;
          i < round1.length;
          i++
        ) {

          const resolveSide =
            side => {

              if (
                side &&
                side.pendingFromPlayIn !== undefined
              ) {

                return {
                  pendingFromMatchupId:
                    playInMatchupIds[side.pendingFromPlayIn]
                };

              }

              return side;

            };

          await insertMatchup(
            tournamentId,
            1,
            i,
            resolveSide(round1[i].a),
            resolveSide(round1[i].b),
            false
          );

        }

        return jsonResponse({
          success: true,
          tournament_id: tournamentId,
          category,
          total_rounds: totalRounds
        });

      }


      // =======================================================
      // GET /tournaments/current?category=Action
      //
      // Returns the active in-progress tournament for a
      // category, plus whichever matchups are actually ready
      // to be played right now (both sides filled in, no
      // winner yet) - always the lowest round with anything
      // ready, so a play-in round naturally surfaces before
      // round 1 does, with nothing special-cased on this end.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/tournaments/current"
      ) {

        const category =
          (url.searchParams.get("category") || "").trim();

        if (!category) {

          return jsonResponse(
            { error: "category is required" },
            400
          );

        }

        const tournament =
          await env.DB
            .prepare(`
              SELECT *
              FROM tournaments
              WHERE category = ?
              AND status = 'in_progress'
              ORDER BY id DESC
              LIMIT 1
            `)
            .bind(
              category
            )
            .first();

        if (!tournament) {

          return jsonResponse({
            tournament: null
          });

        }

        const { results: readyMatchups } =
          await env.DB
            .prepare(`
              SELECT *
              FROM tournament_matchups
              WHERE tournament_id = ?
              AND winner_movie_id IS NULL
              AND movie_id_a IS NOT NULL
              AND movie_id_b IS NOT NULL
              ORDER BY round ASC, slot ASC
            `)
            .bind(
              tournament.id
            )
            .all();

        if (readyMatchups.length === 0) {

          return jsonResponse({
            tournament,
            round: null,
            matchups: []
          });

        }

        const currentRound =
          readyMatchups[0].round;

        const matchups =
          readyMatchups.filter(
            matchup =>
              matchup.round === currentRound
          );

        return jsonResponse({
          tournament,
          round: currentRound,
          matchups
        });

      }


      // =======================================================
      // GET /tournaments/:id/matchups
      //
      // Every matchup row of one tournament, decided or not -
      // the bracket view draws all rounds from this (future
      // rounds that don't exist yet show as TBD client-side).
      // Read-only.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname.startsWith("/tournaments/") &&
        url.pathname.endsWith("/matchups")
      ) {

        const tournamentId =
          url.pathname.split("/")[2];

        const tournament =
          await env.DB
            .prepare(`
              SELECT * FROM tournaments WHERE id = ?
            `)
            .bind(
              tournamentId
            )
            .first();

        if (!tournament) {

          return jsonResponse(
            { error: "Tournament not found" },
            404
          );

        }

        const { results: matchups } =
          await env.DB
            .prepare(`
              SELECT
                id,
                round,
                slot,
                is_third_place_match,
                movie_id_a,
                movie_title_a,
                movie_id_b,
                movie_title_b,
                winner_movie_id
              FROM tournament_matchups
              WHERE tournament_id = ?
              ORDER BY round ASC, is_third_place_match ASC, slot ASC
            `)
            .bind(
              tournamentId
            )
            .all();

        return jsonResponse({
          tournament,
          matchups
        });

      }


      // =======================================================
      // POST /tournaments/:id/pick
      //
      // Records a winner for one matchup, then progresses the
      // bracket: fills a pending play-in slot, auto-generates
      // the next round once the current one's fully decided,
      // spins up the 3rd-place match alongside the final once
      // the semifinals are done, and - once the final itself
      // is picked - closes out the tournament and updates the
      // champion/stats/history tables.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname.startsWith("/tournaments/") &&
        url.pathname.endsWith("/pick")
      ) {

        const tournamentId =
          url.pathname.split("/")[2];

        const body =
          await request.json();

        const matchupId =
          body.matchup_id;

        const winnerMovieId =
          String(body.winner_movie_id || "");

        /*
         * Optional - how long (ms) this matchup took to decide,
         * timed client-side from when it first appeared on
         * screen. Sanity-clamped to a generous 24-hour ceiling
         * so a wildly stale/bad client value can't pollute the
         * "longest deliberation" query later.
         */

        const deliberationMs =
          Number.isFinite(body.deliberation_ms) &&
          body.deliberation_ms >= 0 &&
          body.deliberation_ms < 86400000
            ? Math.round(body.deliberation_ms)
            : null;

        /*
         * Optional - how much of the gap since the PREVIOUS
         * matchup's decision was spent with the tab hidden or
         * the tournament overlay closed (client-tracked, reset
         * to 0 right after every successful pick). Unlike
         * deliberation_ms above (timed per-matchup from when it
         * first appeared, which overlaps across matchups shown
         * in the same round and can't safely be summed), this is
         * a disjoint quantity - it only covers ground between one
         * decision and the next - so computeDeliberationGaps can
         * subtract it straight from the raw decided_at gap without
         * double-counting anything.
         */

        const hiddenGapMs =
          Number.isFinite(body.hidden_gap_ms) &&
          body.hidden_gap_ms >= 0 &&
          body.hidden_gap_ms < 86400000
            ? Math.round(body.hidden_gap_ms)
            : 0;

        const matchup =
          await env.DB
            .prepare(`
              SELECT *
              FROM tournament_matchups
              WHERE id = ?
              AND tournament_id = ?
            `)
            .bind(
              matchupId,
              tournamentId
            )
            .first();

        if (!matchup) {

          return jsonResponse(
            { error: "Matchup not found" },
            404
          );

        }

        if (matchup.winner_movie_id) {

          return jsonResponse(
            { error: "This matchup was already decided" },
            400
          );

        }

        const isSideA =
          String(matchup.movie_id_a) === winnerMovieId;

        const isSideB =
          String(matchup.movie_id_b) === winnerMovieId;

        if (!isSideA && !isSideB) {

          return jsonResponse(
            { error: "winner_movie_id doesn't match either side" },
            400
          );

        }

        const winnerTitle =
          isSideA
            ? matchup.movie_title_a
            : matchup.movie_title_b;

        const loserMovieId =
          isSideA
            ? matchup.movie_id_b
            : matchup.movie_id_a;

        const loserTitle =
          isSideA
            ? matchup.movie_title_b
            : matchup.movie_title_a;

        await env.DB
          .prepare(`
            UPDATE tournament_matchups
            SET winner_movie_id = ?, decided_at = ?, deliberation_ms = ?, hidden_gap_ms = ?
            WHERE id = ?
          `)
          .bind(
            winnerMovieId,
            new Date().toISOString(),
            deliberationMs,
            hiddenGapMs,
            matchupId
          )
          .run();

        const tournament =
          await env.DB
            .prepare(`
              SELECT * FROM tournaments WHERE id = ?
            `)
            .bind(
              tournamentId
            )
            .first();

        const isFinal =
          matchup.round === tournament.total_rounds &&
          !matchup.is_third_place_match;

        const isThirdPlaceMatch =
          matchup.is_third_place_match === 1;

        let tournamentJustCompleted =
          false;

        let resultsSummary =
          null;

        // ---------------------------------------------------
        // RECORD THE LOSER'S RESULT
        //
        // Skipped for the 3rd-place match - that loser already
        // has an 'eliminated' entry from the semifinal they
        // lost to get here, and doesn't need a second one.
        // ---------------------------------------------------

        if (!isThirdPlaceMatch) {

          await insertHistory(
            loserMovieId,
            loserTitle,
            tournamentId,
            tournament.category,
            isFinal ? "runner_up" : "eliminated",
            matchup.round,
            winnerMovieId,
            winnerTitle
          );

        }

        // ---------------------------------------------------
        // PLAY-IN WINNER -> FILL ITS ROUND-1 SLOT
        // ---------------------------------------------------

        if (matchup.round === 0) {

          await env.DB
            .prepare(`
              UPDATE tournament_matchups
              SET movie_id_a = CASE WHEN pending_source_side = 'a' THEN ? ELSE movie_id_a END,
                  movie_title_a = CASE WHEN pending_source_side = 'a' THEN ? ELSE movie_title_a END,
                  movie_id_b = CASE WHEN pending_source_side = 'b' THEN ? ELSE movie_id_b END,
                  movie_title_b = CASE WHEN pending_source_side = 'b' THEN ? ELSE movie_title_b END,
                  pending_source_matchup_id = NULL,
                  pending_source_side = NULL
              WHERE pending_source_matchup_id = ?
            `)
            .bind(
              winnerMovieId,
              winnerTitle,
              winnerMovieId,
              winnerTitle,
              matchupId
            )
            .run();

        // ---------------------------------------------------
        // THIRD-PLACE MATCH DECIDED
        //
        // Once the semifinals finish, the final AND the
        // 3rd-place match are created together and can be
        // picked in EITHER order. This only crowns/completes
        // the tournament if the final has ALREADY been
        // decided by the time this 3rd-place pick lands -
        // otherwise it just records 3rd place and waits.
        // ---------------------------------------------------

        } else if (isThirdPlaceMatch) {

          await insertHistory(
            winnerMovieId,
            winnerTitle,
            tournamentId,
            tournament.category,
            "third_place",
            matchup.round
          );

          const finalMatchup =
            await env.DB
              .prepare(`
                SELECT *
                FROM tournament_matchups
                WHERE tournament_id = ?
                AND round = ?
                AND is_third_place_match = 0
              `)
              .bind(
                tournamentId,
                matchup.round
              )
              .first();

          if (finalMatchup && finalMatchup.winner_movie_id) {

            const finalWinnerTitle =
              String(finalMatchup.winner_movie_id) ===
              String(finalMatchup.movie_id_a)
                ? finalMatchup.movie_title_a
                : finalMatchup.movie_title_b;

            resultsSummary =
              await completeTournament(
                tournamentId,
                tournament,
                finalMatchup.winner_movie_id,
                finalWinnerTitle
              );

            tournamentJustCompleted =
              true;

          }

        // ---------------------------------------------------
        // THE FINAL WAS JUST DECIDED
        //
        // Only actually completes the tournament here if there
        // is NO 3rd-place match for this round, or it's already
        // been decided - otherwise this defers, and the
        // 3rd-place branch above will complete it once that
        // pick comes in.
        // ---------------------------------------------------

        } else if (isFinal) {

          const thirdPlaceMatchup =
            await env.DB
              .prepare(`
                SELECT *
                FROM tournament_matchups
                WHERE tournament_id = ?
                AND round = ?
                AND is_third_place_match = 1
              `)
              .bind(
                tournamentId,
                matchup.round
              )
              .first();

          const thirdPlacePending =
            thirdPlaceMatchup &&
            !thirdPlaceMatchup.winner_movie_id;

          if (!thirdPlacePending) {

            resultsSummary =
              await completeTournament(
                tournamentId,
                tournament,
                winnerMovieId,
                winnerTitle
              );

            tournamentJustCompleted =
              true;

          }

        // ---------------------------------------------------
        // A NORMAL ROUND - GENERATE THE NEXT ONE ONCE COMPLETE
        // ---------------------------------------------------

        } else {

          const roundComplete =
            await isRoundComplete(
              tournamentId,
              matchup.round
            );

          if (roundComplete) {

            const { results: roundMatchups } =
              await env.DB
                .prepare(`
                  SELECT *
                  FROM tournament_matchups
                  WHERE tournament_id = ?
                  AND round = ?
                  AND is_third_place_match = 0
                  ORDER BY slot ASC
                `)
                .bind(
                  tournamentId,
                  matchup.round
                )
                .all();

            const nextRound =
              matchup.round + 1;

            for (
              let i = 0;
              i < roundMatchups.length;
              i += 2
            ) {

              const first =
                roundMatchups[i];

              const second =
                roundMatchups[i + 1];

              await insertMatchup(
                tournamentId,
                nextRound,
                i / 2,
                {
                  movie_id: first.winner_movie_id,
                  title:
                    String(first.winner_movie_id) ===
                    String(first.movie_id_a)
                      ? first.movie_title_a
                      : first.movie_title_b
                },
                {
                  movie_id: second.winner_movie_id,
                  title:
                    String(second.winner_movie_id) ===
                    String(second.movie_id_a)
                      ? second.movie_title_a
                      : second.movie_title_b
                },
                false
              );

              if (
                nextRound === tournament.total_rounds &&
                roundMatchups.length >= 2
              ) {

                const firstLoser =
                  String(first.winner_movie_id) ===
                  String(first.movie_id_a)
                    ? { movie_id: first.movie_id_b, title: first.movie_title_b }
                    : { movie_id: first.movie_id_a, title: first.movie_title_a };

                const secondLoser =
                  String(second.winner_movie_id) ===
                  String(second.movie_id_a)
                    ? { movie_id: second.movie_id_b, title: second.movie_title_b }
                    : { movie_id: second.movie_id_a, title: second.movie_title_a };

                await insertMatchup(
                  tournamentId,
                  nextRound,
                  0,
                  firstLoser,
                  secondLoser,
                  true
                );

              }

            }

          }

        }

        return jsonResponse({
          success: true,
          winner_movie_id: winnerMovieId,
          tournament_complete: tournamentJustCompleted,
          results_summary: resultsSummary
        });

      }


      // =======================================================
      // GET /current-champions
      //
      // Every category's current belt-holder, plus the list of
      // every movie that has EVER won at least once (even if
      // dethroned since) - one call, so the shelf can annotate
      // every card during a normal render without a query per
      // movie.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/current-champions"
      ) {

        const { results: champions } =
          await env.DB
            .prepare(`SELECT * FROM current_champions`)
            .all();

        const { results: everWon } =
          await env.DB
            .prepare(`
              SELECT movie_id
              FROM movie_tournament_stats
              WHERE has_ever_won = 1
            `)
            .all();

        return jsonResponse({
          champions,
          everWonMovieIds:
            everWon.map(row => row.movie_id)
        });

      }


      // =======================================================
      // GET /tournament-log
      //
      // Every tournament and every decided pick, for stats.html
      // (power rankings, rivalries, upsets, reigns and so on).
      // Read-only. Deliberation time uses the same rule as
      // computeDeliberationGaps: the gap since the previous pick
      // in that tournament, minus time the tab was hidden. A gap
      // over an hour is almost certainly a break rather than one
      // decision, so it comes back as null.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/tournament-log"
      ) {

        const { results: tournamentRows } =
          await env.DB
            .prepare(`
              SELECT
                t.id,
                t.category,
                t.status,
                t.total_rounds,
                t.started_at,
                t.completed_at,
                (
                  SELECT h.movie_id
                  FROM movie_tournament_history h
                  WHERE h.tournament_id = t.id
                  AND h.result = 'champion'
                  LIMIT 1
                ) AS champion_id
              FROM tournaments t
              ORDER BY t.id
            `)
            .all();

        const { results: matchupRows } =
          await env.DB
            .prepare(`
              SELECT
                tournament_id,
                round,
                is_third_place_match,
                movie_id_a,
                movie_id_b,
                winner_movie_id,
                decided_at,
                hidden_gap_ms
              FROM tournament_matchups
              WHERE winner_movie_id IS NOT NULL
              ORDER BY tournament_id, decided_at
            `)
            .all();

        const startedAtById =
          new Map(
            tournamentRows.map(
              t => [t.id, new Date(t.started_at).getTime()]
            )
          );

        const MAX_PICK_MS =
          60 * 60 * 1000;

        let previousTournamentId =
          null;

        let previousTimeMs =
          0;

        const picks =
          matchupRows.map(
            m => {

              const decidedAtMs =
                new Date(m.decided_at).getTime();

              if (m.tournament_id !== previousTournamentId) {

                previousTournamentId =
                  m.tournament_id;

                previousTimeMs =
                  startedAtById.get(m.tournament_id) || decidedAtMs;

              }

              const gapMs =
                Math.max(
                  0,
                  (decidedAtMs - previousTimeMs) -
                  (m.hidden_gap_ms || 0)
                );

              previousTimeMs =
                decidedAtMs;

              return {
                tournament_id: m.tournament_id,
                round: m.round,
                third_place: m.is_third_place_match === 1,
                a: String(m.movie_id_a),
                b: String(m.movie_id_b),
                winner: String(m.winner_movie_id),
                deliberation_ms:
                  gapMs <= MAX_PICK_MS ? gapMs : null,
                decided_at: m.decided_at
              };

            }
          );

        const tournaments =
          tournamentRows.map(
            t => ({
              id: t.id,
              category: t.category,
              total_rounds: t.total_rounds,
              finished_at:
                t.status === "complete" ? t.completed_at : null,
              champion_id:
                t.champion_id ? String(t.champion_id) : null
            })
          );

        return jsonResponse({
          tournaments,
          picks
        });

      }


      // =======================================================
      // GET /movies/:movieId/tournament-history
      //
      // A single movie's full tournament record - every
      // history entry it's ever earned, plus its lifetime
      // stats - for the case-back History tab.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname.startsWith("/movies/") &&
        url.pathname.endsWith("/tournament-history")
      ) {

        const movieId =
          url.pathname.split("/")[2];

        const { results: history } =
          await env.DB
            .prepare(`
              SELECT h.*, t.total_rounds
              FROM movie_tournament_history h
              JOIN tournaments t ON h.tournament_id = t.id
              WHERE h.movie_id = ?
              ORDER BY h.recorded_at DESC
            `)
            .bind(
              movieId
            )
            .all();

        const stats =
          await env.DB
            .prepare(`
              SELECT *
              FROM movie_tournament_stats
              WHERE movie_id = ?
            `)
            .bind(
              movieId
            )
            .first();

        return jsonResponse({
          history,
          stats: stats || {
            movie_id: movieId,
            total_championships: 0,
            has_ever_won: 0
          }
        });

      }


      // =======================================================
      // GET /watched
      //
      // Every tmdb_id (+ type) currently flagged watched. One
      // shared flag for the whole household, not per-person -
      // the client just needs the set of ids to check against.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/watched"
      ) {

        const { results } =
          await env.DB
            .prepare(`
              SELECT tmdb_id, type, watched_at
              FROM watched
            `)
            .all();

        return jsonResponse(results);

      }


      // =======================================================
      // POST /watched
      //
      // Flag a tmdb_id (+ type) as watched. Idempotent - marking
      // an already-watched id again just leaves it as-is, no
      // duplicate row and no error. Used both by the one-time
      // Letterboxd backfill and the ongoing RSS sync.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/watched"
      ) {

        const data = await request.json();

        const tmdbId =
          parseInt(data.tmdb_id, 10);

        const mediaType =
          (data.type || "movie")
            .trim()
            .toLowerCase();

        if (!tmdbId || Number.isNaN(tmdbId)) {

          return jsonResponse(
            { error: "a numeric tmdb_id is required" },
            400
          );

        }

        await env.DB
          .prepare(`
            INSERT INTO watched (tmdb_id, type, source, watched_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(tmdb_id, type) DO UPDATE SET
              watched_at = excluded.watched_at
          `)
          .bind(
            tmdbId,
            mediaType,
            data.source || "letterboxd",
            data.watched_at || null
          )
          .run();

        return jsonResponse({ success: true });

      }


      // =======================================================
      // DELETE /watched
      //
      // Unmark a tmdb_id (+ type) as watched - for correcting a
      // bad match, never called automatically by the RSS sync.
      // =======================================================

      if (
        request.method === "DELETE" &&
        url.pathname === "/watched"
      ) {

        const data = await request.json();

        const tmdbId =
          parseInt(data.tmdb_id, 10);

        const mediaType =
          (data.type || "movie")
            .trim()
            .toLowerCase();

        if (!tmdbId || Number.isNaN(tmdbId)) {

          return jsonResponse(
            { error: "a numeric tmdb_id is required" },
            400
          );

        }

        await env.DB
          .prepare(`
            DELETE FROM watched
            WHERE tmdb_id = ? AND type = ?
          `)
          .bind(
            tmdbId,
            mediaType
          )
          .run();

        return jsonResponse({ success: true });

      }


      // =======================================================
      // GET /classics-watched
      //
      // Every (year, title) pair currently checked off on the
      // standalone classics list. That list's actual 1,455 titles
      // live only in classics.html itself (no metadata, no
      // posters, by design) - this table only ever tracks which
      // of those a person has checked off, keyed by the exact
      // (year, title) pair the page already knows about.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/classics-watched"
      ) {

        const { results } =
          await env.DB
            .prepare(`
              SELECT year, title, watched_at
              FROM classics_watched
            `)
            .all();

        return jsonResponse(results);

      }


      // =======================================================
      // POST /classics-watched
      //
      // Check a single (year, title) off. Idempotent - checking
      // an already-checked title again just leaves it as-is.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/classics-watched"
      ) {

        const data = await request.json();

        const year =
          parseInt(data.year, 10);

        const title =
          (data.title || "").trim();

        if (!year || Number.isNaN(year) || !title) {

          return jsonResponse(
            { error: "a numeric year and a title are required" },
            400
          );

        }

        await env.DB
          .prepare(`
            INSERT INTO classics_watched (year, title, watched_at)
            VALUES (?, ?, ?)
            ON CONFLICT(year, title) DO UPDATE SET
              watched_at = excluded.watched_at
          `)
          .bind(
            year,
            title,
            data.watched_at || new Date().toISOString()
          )
          .run();

        return jsonResponse({ success: true });

      }


      // =======================================================
      // DELETE /classics-watched
      //
      // Uncheck a single (year, title).
      // =======================================================

      if (
        request.method === "DELETE" &&
        url.pathname === "/classics-watched"
      ) {

        const data = await request.json();

        const year =
          parseInt(data.year, 10);

        const title =
          (data.title || "").trim();

        if (!year || Number.isNaN(year) || !title) {

          return jsonResponse(
            { error: "a numeric year and a title are required" },
            400
          );

        }

        await env.DB
          .prepare(`
            DELETE FROM classics_watched
            WHERE year = ? AND title = ?
          `)
          .bind(
            year,
            title
          )
          .run();

        return jsonResponse({ success: true });

      }


      // =======================================================
      // POST /classics-watched-bulk
      //
      // One-time direct import: takes (year, title, watched_at)
      // rows already matched client-side against a full Letterboxd
      // export (title+year text matching, done once in a
      // throwaway script - see the one-off import used for this),
      // and just upserts them straight into classics_watched. No
      // TMDB lookups here at all - unlike POST
      // /classics-backfill-batch below, which only ever had the
      // Letterboxd RSS feed's last ~50 entries to work with and
      // had to resolve each title through TMDB search to cross-
      // reference against tmdb_ids. A full data export has no
      // such recency cap, so once a title's already been matched
      // to a (year, title) pair by whoever calls this, there's
      // nothing left to look up - just store it.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/classics-watched-bulk"
      ) {

        const data = await request.json();

        const items =
          Array.isArray(data.items) ? data.items : [];

        if (items.length === 0) {

          return jsonResponse(
            { error: "items (array of {year, title, watched_at?}) is required" },
            400
          );

        }

        if (items.length > 500) {

          return jsonResponse(
            { error: "send 500 items or fewer per batch" },
            400
          );

        }

        const validItems =
          items
            .map(item => ({
              year: parseInt(item.year, 10),
              title: (item.title || "").trim(),
              watched_at: item.watched_at || null
            }))
            .filter(item => item.year && !Number.isNaN(item.year) && item.title);

        if (validItems.length > 0) {

          await env.DB.batch(
            validItems.map(item =>
              env.DB
                .prepare(`
                  INSERT INTO classics_watched (year, title, watched_at)
                  VALUES (?, ?, ?)
                  ON CONFLICT(year, title) DO UPDATE SET
                    watched_at = excluded.watched_at
                `)
                .bind(
                  item.year,
                  item.title,
                  item.watched_at
                )
            )
          );

        }

        return jsonResponse({
          success: true,
          count: validItems.length
        });

      }


      // =======================================================
      // POST /classics-backfill-batch
      //
      // One-time helper for seeding the classics list from the
      // Letterboxd-synced `watched` table, which only ever stores
      // tmdb_id + type - never a title or year - so there's no
      // direct key to join against classics.html's plain
      // (year, title) rows. This resolves that gap the only way
      // available: for each title in the batch, ask TMDB's search
      // endpoint for that title restricted to that year, take its
      // top hit's tmdb_id, and check that id against the set of
      // movie tmdb_ids already in `watched`. A hit gets written
      // into classics_watched (carrying over the real Letterboxd
      // watched_at date where TMDB search succeeded and the
      // Letterboxd sync had recorded one).
      //
      // Deliberately conservative: if the year-scoped TMDB search
      // comes back empty, that title is just skipped rather than
      // retried without the year filter - a wrong match here
      // silently checks off a movie that was never actually
      // watched, which is worse than an occasional miss the
      // person can check off by hand.
      //
      // Called by classics.html itself, in small batches (it owns
      // the full title list - this endpoint never needs to), so
      // that one backfill run never risks tripping a Worker
      // subrequest-count limit in a single request. One-time use -
      // safe to call again later (it only ever adds matches, and
      // re-matching the same title is a harmless duplicate
      // upsert), but nothing else in the app calls this route.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/classics-backfill-batch"
      ) {

        const data = await request.json();

        const items =
          Array.isArray(data.items) ? data.items : [];

        if (items.length === 0) {

          return jsonResponse(
            { error: "items (array of {year, title}) is required" },
            400
          );

        }

        if (items.length > 40) {

          return jsonResponse(
            { error: "send 40 items or fewer per batch" },
            400
          );

        }

        const { results: watchedRows } =
          await env.DB
            .prepare(`
              SELECT tmdb_id, watched_at
              FROM watched
              WHERE type = 'movie'
            `)
            .all();

        const watchedAtByTmdbId =
          new Map(
            watchedRows.map(
              row => [row.tmdb_id, row.watched_at]
            )
          );

        const matched = [];

        await Promise.all(
          items.map(async item => {

            const year =
              parseInt(item.year, 10);

            const title =
              (item.title || "").trim();

            if (!year || Number.isNaN(year) || !title) {
              return;
            }

            let searchResult;

            try {

              searchResult =
                await tmdbGet(
                  `search/movie?query=${encodeURIComponent(title)}&year=${year}`
                );

            } catch (searchError) {

              console.error(
                `Classics backfill search failed for "${title}" (${year}):`,
                searchError
              );

              return;

            }

            const topHit =
              searchResult &&
              searchResult.results &&
              searchResult.results[0];

            if (!topHit) {
              return;
            }

            if (!watchedAtByTmdbId.has(topHit.id)) {
              return;
            }

            matched.push({
              year,
              title,
              watched_at: watchedAtByTmdbId.get(topHit.id)
            });

          })
        );

        if (matched.length > 0) {

          await env.DB.batch(
            matched.map(m =>
              env.DB
                .prepare(`
                  INSERT INTO classics_watched (year, title, watched_at)
                  VALUES (?, ?, ?)
                  ON CONFLICT(year, title) DO UPDATE SET
                    watched_at = excluded.watched_at
                `)
                .bind(
                  m.year,
                  m.title,
                  m.watched_at || new Date().toISOString()
                )
            )
          );

        }

        return jsonResponse({
          checked: items.length,
          matched: matched.map(m => ({ year: m.year, title: m.title }))
        });

      }


      // =======================================================
      // POST /recommendations
      //
      // "More Like This" - asks TMDB for a title's
      // recommendations, splits them into owned (already in the
      // client's catalog - sent along as owned, with each
      // title's own rating, since the Worker has no idea what
      // movies.js contains) vs unowned, drops anything tonally
      // incompatible with the original's rating on either side
      // (see isRatingCompatible()/RATING_COMPATIBILITY), and
      // checks streaming availability - live, right here, using
      // the exact same fetchWhitelistedServices() the weekly
      // wishlist sync uses - for just enough of the most popular
      // remaining unowned ones to bring the shelf's total (the
      // original title, its owned matches, and these backfills
      // together) up to 10. These are ephemeral suggestions -
      // nothing here gets written to
      // wishlist_streaming (or anywhere else) unless someone
      // actually adds one for real through the normal POST
      // /wishlist flow.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/recommendations"
      ) {

        const data = await request.json();

        const tmdbId =
          parseInt(data.tmdb_id, 10);

        const mediaType =
          (data.media_type || "movie")
            .trim()
            .toLowerCase() === "tv"
            ? "tv"
            : "movie";

        // The original title's own site-curated rating (G/PG/
        // PG-13/R/NC-17/NR - the same vocabulary the Rated
        // filter uses), sent by the client since the Worker has
        // no idea what movies.js or the wishlist row said. Used
        // below as the tonal anchor for isRatingCompatible() -
        // see that function for the actual G/PG/PG-13/R/NC-17
        // compatibility table.

        const originalRated =
          (data.rated || "").trim();

        // Owned titles of the same type, WITH each one's own
        // rating attached (not just bare ids) - needed so an
        // owned match that's tonally way off (a kids' movie
        // showing up under an R-rated original, say) can be
        // excluded the same as an unowned one, not just filtered
        // by id.

        const ownedList =
          Array.isArray(data.owned)
            ? data.owned
            : [];

        const ownedRatedById =
          new Map();

        for (const entry of ownedList) {

          if (entry && entry.id !== undefined) {

            ownedRatedById.set(
              String(entry.id),
              (entry.rated || "").trim()
            );

          }

        }

        if (!tmdbId || Number.isNaN(tmdbId)) {

          return jsonResponse(
            { error: "a numeric tmdb_id is required" },
            400
          );

        }

        const recPath =
          mediaType === "tv"
            ? `tv/${tmdbId}/recommendations`
            : `movie/${tmdbId}/recommendations`;

        const recData =
          await tmdbGet(recPath);

        const results =
          Array.isArray(recData.results)
            ? recData.results
            : [];

        const ownedMatches =
          [];

        const unownedCandidates =
          [];

        for (const rec of results) {

          const recId =
            String(rec.id);

          if (ownedRatedById.has(recId)) {

            // Owned but tonally incompatible with the original -
            // dropped entirely rather than shown, same as an
            // unowned title would be below. It's not pushed into
            // unownedCandidates either, since it IS actually
            // owned - there's nothing useful to backfill it with.

            if (
              isRatingCompatible(
                originalRated,
                ownedRatedById.get(recId)
              )
            ) {

              ownedMatches.push(
                recId
              );

            }

          } else {

            unownedCandidates.push(
              rec
            );

          }

        }

        // Rating-filter the unowned pool BEFORE ranking by
        // popularity - has to happen for the whole pool, not
        // just the final handful that end up on the shelf, since
        // which titles are "the top N by popularity" changes
        // once tonally-incompatible ones are removed from
        // contention. TMDB's recommendations list is usually
        // short (rarely more than ~20), so this is at most ~20
        // small certification lookups (release_dates for movies,
        // content_ratings for TV) - more calls than before, but
        // each one is cheap, and TMDB's API isn't the limited
        // resource on this site the way D1's daily row caps are.

        const ratedUnownedCandidates =
          [];

        for (const rec of unownedCandidates) {

          let candidateDetails =
            null;

          try {

            // fetchCandidateDetails replaces the old
            // fetchCertification-only call - same one subrequest
            // per candidate, but it also picks up genre/runtime/
            // cast/director along the way (see that function's
            // comment), stashed on the rec itself so the final
            // ~10-title cut below doesn't need a second round of
            // calls to get them.

            candidateDetails =
              await fetchCandidateDetails(
                env,
                rec.id,
                mediaType
              );

            rec.candidateDetails =
              candidateDetails;

          } catch (certError) {

            // Same fail-open pattern as the streaming lookup
            // below - a lookup failure shouldn't wrongly nuke an
            // otherwise good match, so it's treated as unrated
            // (the most permissive bucket) rather than dropped.
            // candidateDetails stays null - the final push below
            // just leaves starring/directed by/runtime/genre
            // blank for this one, same as before this existed.

            console.error(
              `Detail/certification check failed for ${rec.id}:`,
              certError
            );

          }

          const candidateRated =
            (candidateDetails && candidateDetails.rated) || "NR";

          if (
            isRatingCompatible(
              originalRated,
              candidateRated
            )
          ) {

            ratedUnownedCandidates.push(
              rec
            );

          }

        }

        // Sort by TMDB's own popularity score (most popular
        // first) - this also happens to push obscure/low-signal
        // titles (which tend to have thin cast/crew data and odd
        // runtimes too) toward the bottom of the pool, without a
        // separate filter or extra TMDB calls.

        ratedUnownedCandidates.sort(
          (a, b) =>
            (b.popularity || 0) - (a.popularity || 0)
        );

        // Bring in only as many unowned backfills as needed to
        // reach 10 titles total ON THE SHELF - which is the
        // original title itself, plus its owned matches, plus
        // these backfills (the "-1" is the original - the client
        // always shows it first, ahead of everything computed
        // here). E.g. 6 owned matches only need 3 backfills (1 +
        // 6 + 3 = 10), 9 owned only need 0.

        const neededUnowned =
          Math.max(0, 10 - 1 - ownedMatches.length);

        const unownedToCheck =
          ratedUnownedCandidates.slice(0, neededUnowned);

        const unowned =
          [];

        for (const rec of unownedToCheck) {

          let services =
            [];

          // The full expanded list (all 19 tracked services), not
          // just the original 8-service whitelist "services" is -
          // needed so the case-back Stream tab has something real
          // to show for a "More Like This" suggestion instead of
          // always bouncing to "add this to your wishlist first."

          let extendedServices =
            [];

          try {

            const streamingResult =
              await fetchWhitelistedServices(
                env,
                rec.id,
                mediaType
              );

            services =
              streamingResult.services;

            extendedServices =
              streamingResult.extendedServices;

          } catch (streamingError) {

            // One suggestion's streaming lookup failing
            // shouldn't drop it from the list entirely - it
            // just shows with no badge, same as any wishlist
            // title with no matches.

            console.error(
              `Streaming check failed for recommendation ${rec.id}:`,
              streamingError
            );

          }

          const title =
            rec.title || rec.name || "";

          const releaseDate =
            rec.release_date ||
            rec.first_air_date ||
            "";

          // Picked up back in the rating-filter pass above (see
          // fetchCandidateDetails) - null here only if that
          // lookup failed for this specific title, in which case
          // these just come through blank on the client, same as
          // a wishlist row would show before its own details load.

          const details =
            rec.candidateDetails || {};

          unowned.push({
            tmdb_id: rec.id,
            media_type: mediaType,
            title,
            year:
              releaseDate
                ? releaseDate.slice(0, 4)
                : "",
            poster:
              rec.poster_path
                ? `https://image.tmdb.org/t/p/w500${rec.poster_path}`
                : "",
            synopsis: rec.overview || "",
            runtime: details.runtime || "",
            genre: details.genre || "",
            rated: details.rated || "",
            director: details.director || "",
            cast: details.cast || "",
            services,
            extended_services: extendedServices
          });

        }

        return jsonResponse({
          owned_tmdb_ids: ownedMatches,
          unowned
        });

      }


      // =======================================================
      // GET /trailer
      //
      // Live, on-demand only - called the first time someone
      // clicks the case-back "Trailer" tab for a given movie
      // (see renderTrailerPanel in app.js). Nothing here gets
      // cached server-side; it's cheap enough (one TMDB call)
      // that the client's own per-modal-session cache is enough.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/trailer"
      ) {

        const tmdbId =
          parseInt(url.searchParams.get("tmdb_id"), 10);

        const mediaType =
          url.searchParams.get("media_type") === "tv"
            ? "tv"
            : "movie";

        if (!tmdbId || Number.isNaN(tmdbId)) {

          return jsonResponse(
            { error: "a numeric tmdb_id is required" },
            400
          );

        }

        try {

          const key =
            await fetchTrailerKey(
              env,
              tmdbId,
              mediaType
            );

          return jsonResponse({ key: key || null });

        } catch (error) {

          console.error(
            `Trailer lookup failed for tmdb ${tmdbId}:`,
            error
          );

          return jsonResponse({ key: null });

        }

      }


      // =======================================================
      // POST /catalog-sync
      //
      // The client's full current list of owned titles that
      // AREN'T also owned digitally (movie.digital empty) - the
      // one piece of the owned catalog this Worker has no other
      // way to see, since movies.js is generated by a separate
      // GitHub Action and never touches D1. Always a full
      // replace (delete everything, reinsert what was sent)
      // rather than a diff - simpler, and cheap at this table's
      // size; app.js only actually calls this when the list has
      // changed since the last sync (see
      // syncCatalogStreamingTargets), so in practice it fires
      // rarely, not on every page load.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/catalog-sync"
      ) {

        const data = await request.json();

        const rawItems =
          Array.isArray(data.items)
            ? data.items
            : [];

        const validItems =
          rawItems
            .filter(
              item =>
                item &&
                Number.isFinite(
                  parseInt(item.tmdb_id, 10)
                )
            )
            .map(
              item => ({
                tmdb_id: parseInt(item.tmdb_id, 10),
                media_type: item.media_type === "tv" ? "tv" : "movie",
                title: (item.title || "").toString().slice(0, 300),
              })
            );

        await env.DB
          .prepare(`DELETE FROM catalog_streaming_targets`)
          .run();

        if (validItems.length > 0) {

          const statements =
            validItems.map(
              item =>
                env.DB
                  .prepare(`
                    INSERT INTO catalog_streaming_targets (tmdb_id, media_type, title)
                    VALUES (?, ?, ?)
                    ON CONFLICT(tmdb_id, media_type) DO UPDATE SET
                      title = excluded.title
                  `)
                  .bind(
                    item.tmdb_id,
                    item.media_type,
                    item.title
                  )
            );

          await env.DB.batch(statements);

        }

        return jsonResponse({
          success: true,
          count: validItems.length
        });

      }


      // =======================================================
      // GET /catalog-streaming
      //
      // Mirrors GET /wishlist-streaming, but for the
      // catalog_streaming table - see loadCatalogStreaming in
      // app.js. Only ever stores the extended (Stream-tab) list;
      // there's no front-badge/main-back-note use for owned
      // titles, so there's nothing narrower to also return here.
      // =======================================================

      if (
        request.method === "GET" &&
        url.pathname === "/catalog-streaming"
      ) {

        const { results } = await env.DB
          .prepare(`
            SELECT tmdb_id, media_type, services, checked_at
            FROM catalog_streaming
          `)
          .all();

        const parsed =
          results.map(row => ({
            tmdb_id: row.tmdb_id,
            media_type: row.media_type,
            services: JSON.parse(row.services || "[]"),
            checked_at: row.checked_at,
          }));

        return jsonResponse(parsed);

      }


      // =======================================================
      // POST /internal/sync-streaming-batch
      //
      // Not called by the client at all - this is the Worker
      // calling itself (see advanceStreamingSyncChain) to hand
      // off the next batch of a chained sync to a fresh
      // invocation, which gets its own fresh subrequest budget
      // (Cloudflare's free tier caps external subrequests at 50
      // PER INVOCATION, not per day - a self-fetch is how a
      // sync covering hundreds of titles finishes in one weekly
      // run instead of trickling out over weeks). Guarded by a
      // shared secret ONLY if one's been configured (see
      // INTERNAL_SYNC_SECRET below) - harmless either way since
      // this endpoint doesn't expose or mutate anything
      // sensitive, but cheap to lock down once a secret exists.
      // =======================================================

      if (
        request.method === "POST" &&
        url.pathname === "/internal/sync-streaming-batch"
      ) {

        if (
          env.INTERNAL_SYNC_SECRET &&
          request.headers.get("X-Internal-Sync-Secret") !== env.INTERNAL_SYNC_SECRET
        ) {

          return new Response("Forbidden", { status: 403 });

        }

        const data = await request.json();

        const source =
          data.source === "catalog" ? "catalog" : "wishlist";

        const offset =
          Number.isFinite(parseInt(data.offset, 10))
            ? parseInt(data.offset, 10)
            : 0;

        ctx.waitUntil(
          advanceStreamingSyncChain(
            env,
            ctx,
            source,
            offset
          )
        );

        return jsonResponse({ accepted: true });

      }


      // =======================================================
      // UNKNOWN ROUTE
      // =======================================================

      return new Response(
        JSON.stringify({
          error: "Not found"
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );


    } catch (error) {

      return new Response(
        JSON.stringify({
          error: "Server error",
          details: error.message
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );

    }

  },


  // =========================================================
  // SCHEDULED: LETTERBOXD SYNC + WISHLIST STREAMING SYNC
  //
  // Both fire on Cloudflare's own Cron Triggers (set in the
  // dashboard under this Worker's Settings -> Cron Triggers,
  // or in wrangler.toml under [triggers] crons - no external
  // scheduler involved). One Worker can carry more than one
  // Cron Trigger, all landing here - event.cron carries the
  // exact schedule string that fired, so this just branches on
  // it rather than needing two separate Workers.
  //
  // Daily (0 9 * * *): Letterboxd watched sync.
  // Weekly (0 9 * * 1): wishlist streaming-availability sync -
  // weekly is plenty since a title landing on a new streaming
  // service isn't time-sensitive the way a diary entry is, and
  // it keeps the sync to one TMDB call per wishlist title
  // instead of running on every visit.
  // =========================================================

  async scheduled(event, env, ctx) {

    if (event.cron === "0 9 * * 1") {

      ctx.waitUntil(
        advanceStreamingSyncChain(
          env,
          ctx,
          "wishlist",
          0
        )
      );

    } else {

      ctx.waitUntil(
        syncLetterboxdWatched(env)
      );

    }

  },
};


// =========================================================
// LETTERBOXD RSS -> WATCHED TABLE
// =========================================================

const LETTERBOXD_RSS_URL =
  "https://letterboxd.com/awesomeface/rss/";

async function syncLetterboxdWatched(env) {

  try {

    const response =
      await fetch(
        LETTERBOXD_RSS_URL,
        {
          headers: {
            "User-Agent": "Mr-Movies-Rewind-Sync/1.0",
          },
        }
      );

    if (!response.ok) {

      console.error(
        `Letterboxd RSS returned ${response.status}`
      );

      return;

    }

    const xml =
      await response.text();

    // Split on <item> blocks - simple and reliable for this
    // one fixed, well-known feed shape, without needing an
    // XML/DOM parser (not available in the Workers runtime).

    const itemBlocks =
      xml.split("<item>").slice(1);

    const entries = [];

    for (const block of itemBlocks) {

      const tmdbMatch =
        block.match(
          /<tmdb:movieId>(\d+)<\/tmdb:movieId>/
        );

      if (!tmdbMatch) {
        continue;
      }

      const dateMatch =
        block.match(
          /<letterboxd:watchedDate>([\d-]+)<\/letterboxd:watchedDate>/
        );

      entries.push({
        tmdbId: parseInt(tmdbMatch[1], 10),
        watchedAt: dateMatch ? dateMatch[1] : null,
      });

    }

    if (entries.length === 0) {
      return;
    }

    const { results: existingRows } =
      await env.DB
        .prepare(`
          SELECT tmdb_id
          FROM watched
          WHERE type = 'movie'
        `)
        .all();

    const existingIds =
      new Set(
        existingRows.map(row => row.tmdb_id)
      );

    const newEntries =
      entries.filter(
        entry => !existingIds.has(entry.tmdbId)
      );

    if (newEntries.length === 0) {
      return;
    }

    const statements =
      newEntries.map(entry =>
        env.DB
          .prepare(`
            INSERT INTO watched (tmdb_id, type, source, watched_at)
            VALUES (?, 'movie', 'letterboxd', ?)
            ON CONFLICT(tmdb_id, type) DO UPDATE SET
              watched_at = excluded.watched_at
          `)
          .bind(
            entry.tmdbId,
            entry.watchedAt
          )
      );

    await env.DB.batch(statements);

    console.log(
      `Letterboxd sync: marked ${newEntries.length} newly-watched title(s)`
    );

  } catch (error) {

    console.error(
      "Letterboxd sync failed:",
      error
    );

  }

}


// =========================================================
// WISHLIST -> STREAMING AVAILABILITY (TMDB watch/providers)
//
// Weekly job: for every wishlist title, ask TMDB's own
// watch/providers endpoint (powered by JustWatch, the same
// key this Worker already uses for everything else - no new
// account or secret needed) which of a hand-picked whitelist
// of services it's currently available on in the US.
//
// Response shape (stable, well-documented TMDB endpoint):
//   { id, results: { US: { link, flatrate: [...], rent: [...],
//     buy: [...], ads: [...], free: [...] }, GB: {...}, ... } }
// Each entry in those arrays looks like
//   { provider_id, provider_name, logo_path, display_priority }
//
// Only flatrate/ads/free are checked - rent and buy are
// deliberately never counted, which is exactly the "included
// with the subscription, not a standalone rental or purchase"
// rule the site owner asked for (this is what keeps a title
// available to RENT on Amazon from counting as "Now on Amazon
// Prime Video" - only its flatrate listing does that). Kanopy
// specifically isn't a paid subscription, so JustWatch/TMDB
// lists it under "free" rather than "flatrate" (confirmed via
// JustWatch's own Kanopy provider page), which is why free is
// included in the check alongside flatrate/ads.
// =========================================================

async function tmdbGetStandalone(env, path) {

  const response =
    await fetch(
      `https://api.themoviedb.org/3/${path}`,
      {
        headers: {
          "Authorization": `Bearer ${env.TMDB_API_KEY}`,
          "accept": "application/json",
        },
      }
    );

  if (!response.ok) {

    throw new Error(
      `TMDB request failed with HTTP ${response.status} for ${path}`
    );

  }

  return response.json();

}

// Priority order the site owner asked for - services[0] in
// the stored JSON is always the one shown on the front-of-card
// badge, the rest (if any) are for the case back.

// "Amazon Rental" sits at the very end on purpose - it's the
// one entry in this list that ISN'T "included with something
// you already subscribe to", it's a standalone charge, so it
// should only ever surface as the front-of-card badge when
// nothing else matched (see the front-end's "New to Rent!"
// wording, distinct from the "Now on X" wording every other
// entry gets).

const STREAMING_PRIORITY = [
  "Kanopy",
  "Hulu",
  "Disney+",
  "Amazon Prime Video",
  "Netflix",
  "HBO Max",
  "Peacock",
  "Amazon Rental",
];

// Matches a raw TMDB/JustWatch provider_name to one of the
// canonical labels above, or null if it's not one of the
// whitelisted services at all. Case-insensitive substring
// matching to absorb small naming variations (e.g. "Disney
// Plus" vs "Disney+", "Max" vs "HBO Max", "Amazon Prime Video"
// vs "Prime Video").

function matchStreamingService(providerName) {

  const name =
    (providerName || "")
      .toLowerCase();

  if (name.includes("kanopy")) {
    return "Kanopy";
  }

  if (name.includes("hulu")) {
    return "Hulu";
  }

  if (name.includes("disney")) {
    return "Disney+";
  }

  /*

  * "prime video" only - deliberately NOT a bare
  * name.includes("amazon") fallback. JustWatch/TMDB's name
  * for the standalone rental service is "Amazon Video" (no
  * "Prime"), which contains "amazon" as a substring too - a
  * loose "amazon" match here previously miscounted a
  * rental-only listing (in flatrate/ads/free, if it ever
  * shows up there) as a genuine Prime subscription match.
   */

  if (name.includes("prime video")) {
    return "Amazon Prime Video";
  }

  if (name.includes("netflix")) {
    return "Netflix";
  }

  if (
    name.includes("hbo") ||
    name === "max" ||
    name.includes(" max")
  ) {
    return "HBO Max";
  }

  if (name.includes("peacock")) {
    return "Peacock";
  }

  // Everything below here is only ever relevant to
  // EXTENDED_STREAMING_PRIORITY (the Stream tab's fuller list) -
  // STREAMING_PRIORITY.filter() elsewhere still only lets the
  // original eight through, so recognizing more names here can't
  // change the existing front-badge/main-back-note behavior.

  if (name.includes("apple tv")) {
    return "Apple TV+";
  }

  if (name.includes("paramount")) {
    return "Paramount+";
  }

  if (name.includes("starz")) {
    return "Starz";
  }

  if (name.includes("showtime")) {
    return "Showtime";
  }

  if (name.includes("tubi")) {
    return "Tubi";
  }

  if (name.includes("pluto")) {
    return "Pluto TV";
  }

  if (name.includes("roku")) {
    return "The Roku Channel";
  }

  if (name.includes("crackle")) {
    return "Crackle";
  }

  if (name.includes("amc")) {
    return "AMC+";
  }

  if (name.includes("mgm") || name.includes("epix")) {
    return "MGM+";
  }

  if (name.includes("youtube")) {
    return "YouTube";
  }

  return null;

}

// The complete list the case-back "Stream" tab shows, versus
// STREAMING_PRIORITY above which stays exactly as it was (still
// the only list the front-of-card badge and the existing
// wishlist back note draw from). Deliberately leaves out
// Crunchyroll and ESPN+ - asked to keep those off.

const EXTENDED_STREAMING_PRIORITY = [
  ...STREAMING_PRIORITY,
  "Apple TV+",
  "Paramount+",
  "Starz",
  "Showtime",
  "Tubi",
  "Pluto TV",
  "The Roku Channel",
  "Crackle",
  "AMC+",
  "MGM+",
  "YouTube",
];

// Separate from matchStreamingService above on purpose - this
// one is only ever run against the rent/buy arrays, so an
// Amazon match there means "Amazon Video" (a standalone
// rental), never "Amazon Prime Video" (the subscription one),
// even though TMDB/JustWatch names for the two are similar.

function matchAmazonRental(providerName) {

  const name =
    (providerName || "")
      .toLowerCase();

  // Excludes "prime video" too, just in case a JustWatch/TMDB
  // data quirk ever puts the subscription provider in the
  // rent array for some title - that should never count as a
  // standalone rental.

  return (
    name.includes("amazon") &&
    !name.includes("prime video")
  )
    ? "Amazon Rental"
    : null;

}

// "More Like This" rating-compatibility table - decides which
// of the site's own G/PG/PG-13/R/NC-17 ratings a suggestion is
// allowed to have given the original title's rating, so a kids'
// movie doesn't turn up under an R-rated original or vice versa.
// This is a deliberately hand-picked table (the site owner's own
// tonal judgment), not a symmetric +/-1 window - PG is the one
// tier that reaches both up and down, everything else leans one
// direction. NC-17 is included mainly for completeness since it
// almost never comes up in practice. "NR" (unrated) is accepted
// everywhere except under a G original, since unrated so often
// signals more mature content (festival cuts, director's cuts,
// unclassified imports) that a G pairing would defeat the point.

const RATING_COMPATIBILITY = {
  "G": ["G", "PG"],
  "PG": ["G", "PG", "PG-13", "NR"],
  "PG-13": ["PG-13", "R", "NR"],
  "R": ["PG-13", "R", "NC-17", "NR"],
  "NC-17": ["R", "NC-17", "NR"],
};

// Whether a candidate's rating is an acceptable "More Like This"
// suggestion for a title rated originalRated - see
// RATING_COMPATIBILITY above for the actual table. An original
// with no rating on file (blank, or "NR" itself) has no tonal
// anchor to filter by, so nothing is excluded in that case -
// safer to show an unfiltered list than to guess.

function isRatingCompatible(originalRated, candidateRated) {

  const original =
    (originalRated || "")
      .trim()
      .toUpperCase();

  const candidate =
    (candidateRated || "NR")
      .trim()
      .toUpperCase() || "NR";

  const acceptable =
    RATING_COMPATIBILITY[original];

  if (!acceptable) {

    return true;

  }

  return acceptable.includes(
    candidate
  );

}

// TMDB's US TV content ratings use the TV Parental Guidelines
// scale (TV-Y/TV-Y7/TV-G/TV-PG/TV-14/TV-MA), not the MPAA scale
// the site's own Rated filter and RATING_COMPATIBILITY use - this
// maps a TV rating onto the nearest MPAA-style bucket so TV
// recommendations can go through the same compatibility check as
// movies. There's no real TV equivalent of NC-17.

const TV_RATING_TO_SITE_SCALE = {
  "TV-Y": "G",
  "TV-Y7": "G",
  "TV-G": "G",
  "TV-PG": "PG",
  "TV-14": "PG-13",
  "TV-MA": "R",
};

// Looks up one title's US certification and maps it onto the
// site's G/PG/PG-13/R/NC-17/NR scale - movies via release_dates
// (which lists a certification per release, so the first
// non-blank one found is used), TV via content_ratings (mapped
// through TV_RATING_TO_SITE_SCALE above). Falls back to "NR"
// whenever nothing usable comes back, same as a real title with
// no rating on file.

async function fetchCertification(env, tmdbId, mediaType) {

  if (mediaType === "tv") {

    const data =
      await tmdbGetStandalone(
        env,
        `tv/${tmdbId}/content_ratings`
      );

    const results =
      Array.isArray(data.results)
        ? data.results
        : [];

    const us =
      results.find(
        entry => entry.iso_3166_1 === "US"
      );

    if (!us || !us.rating) {

      return "NR";

    }

    return TV_RATING_TO_SITE_SCALE[us.rating] || "NR";

  }

  const data =
    await tmdbGetStandalone(
      env,
      `movie/${tmdbId}/release_dates`
    );

  const results =
    Array.isArray(data.results)
      ? data.results
      : [];

  const us =
    results.find(
      entry => entry.iso_3166_1 === "US"
    );

  if (!us || !Array.isArray(us.release_dates)) {

    return "NR";

  }

  const withCertification =
    us.release_dates.find(
      release =>
        release.certification &&
        release.certification.trim() !== ""
    );

  return withCertification
    ? withCertification.certification.trim()
    : "NR";

}

// Used by POST /recommendations in place of a bare
// fetchCertification() call - TMDB's append_to_response lets one
// HTTP call return the detail endpoint (genres, runtime) PLUS
// credits PLUS the certification endpoint (release_dates for
// movies, content_ratings for TV) all together, so this still
// costs exactly one subrequest per candidate - the same one
// fetchCertification was already spending - while also getting
// back everything POST /wishlist normally has to make two
// separate calls for (info + credits). Same field shapes/joins
// as POST /wishlist below, so a "More Like This" suggestion's
// starring/directed by/runtime/genre read identically to a real
// wishlist or owned card once one of these is added for real.

async function fetchCandidateDetails(env, tmdbId, mediaType) {

  const appendParam =
    mediaType === "tv"
      ? "credits,content_ratings"
      : "credits,release_dates";

  const info =
    await tmdbGetStandalone(
      env,
      `${mediaType}/${tmdbId}?append_to_response=${appendParam}`
    );

  let rated =
    "NR";

  if (mediaType === "tv") {

    const results =
      (info.content_ratings && info.content_ratings.results) || [];

    const us =
      results.find(
        entry => entry.iso_3166_1 === "US"
      );

    if (us && us.rating) {

      rated =
        TV_RATING_TO_SITE_SCALE[us.rating] || "NR";

    }

  } else {

    const results =
      (info.release_dates && info.release_dates.results) || [];

    const us =
      results.find(
        entry => entry.iso_3166_1 === "US"
      );

    if (us && Array.isArray(us.release_dates)) {

      const withCertification =
        us.release_dates.find(
          release =>
            release.certification &&
            release.certification.trim() !== ""
        );

      if (withCertification) {

        rated =
          withCertification.certification.trim();

      }

    }

  }

  const credits =
    info.credits || {};

  const cast =
    (credits.cast || [])
      .slice(0, 6)
      .map(person => person.name)
      .filter(Boolean);

  const directors =
    (credits.crew || [])
      .filter(person => person.job === "Director")
      .map(person => person.name)
      .filter(Boolean);

  const genres =
    (info.genres || [])
      .map(genre => genre.name)
      .filter(Boolean);

  let runtime =
    "";

  if (mediaType === "movie" && info.runtime) {

    runtime =
      `${info.runtime}m`;

  } else if (
    mediaType === "tv" &&
    Array.isArray(info.episode_run_time) &&
    info.episode_run_time.length > 0
  ) {

    runtime =
      `${info.episode_run_time[0]}m`;

  }

  return {
    rated,
    cast: cast.join(", "),
    director: directors.join(", "),
    genre: genres.join(" / "),
    runtime
  };

}

// Fetches one title's TMDB watch/providers and returns the
// subset of the whitelist it's genuinely available on in the
// US, already sorted into priority order. Everything except
// "Amazon Rental" has to be included with something already
// subscribed to (flatrate/ads/free) - "Amazon Rental" is the
// one deliberate exception, checked separately against the
// rent array, and only added when Amazon Prime Video isn't
// already matched (no point flagging a paid rental for a title
// that's already free with the subscription).

async function fetchWhitelistedServices(env, tmdbId, mediaType) {

  const path =
    mediaType === "tv"
      ? `tv/${tmdbId}/watch/providers`
      : `movie/${tmdbId}/watch/providers`;

  const data =
    await tmdbGetStandalone(env, path);

  const us =
    data &&
    data.results &&
    data.results.US;

  if (!us) {
    return [];
  }

  // flatrate = paid subscription, ads = ad-supported but
  // still "included" (not a per-title charge), free = no-cost
  // access (this is where Kanopy's library-card model lands).

  const includedProviders = [
    ...(us.flatrate || []),
    ...(us.ads || []),
    ...(us.free || []),
  ];

  const matched =
    new Set();

  for (const provider of includedProviders) {

    const label =
      matchStreamingService(provider.provider_name);

    if (label) {
      matched.add(label);
    }

  }

  if (!matched.has("Amazon Prime Video")) {

    for (const provider of (us.rent || [])) {

      const rentalLabel =
        matchAmazonRental(provider.provider_name);

      if (rentalLabel) {

        matched.add(rentalLabel);
        break;

      }

    }

  }

  return {
    services: STREAMING_PRIORITY.filter(
      service => matched.has(service)
    ),
    extendedServices: EXTENDED_STREAMING_PRIORITY.filter(
      service => matched.has(service)
    ),
  };

}

// This Worker's own public URL - needed so the chained sync
// below can call itself (see advanceStreamingSyncChain). Same
// value app.js's RESERVATIONS_API constant points at.

const SELF_URL =
  "https://movie-reservations.iconedge.workers.dev";

// One hop's worth of TMDB lookups - 40 titles + the 1 self-fetch
// that hands off to the next hop stays comfortably under
// Cloudflare's free-tier cap of 50 external subrequests PER
// INVOCATION (not per day - a fresh invocation gets a fresh
// budget, which is exactly what makes the chaining below work).

const STREAMING_SYNC_BATCH_SIZE = 40;

// Processed in this order every run: the (usually short)
// wishlist first, then the owned-not-digital catalog list.
// Neither list needs a persistent cursor across weeks - the
// chain runs start-to-finish through both every time it fires,
// typically finishing in well under a minute even for a few
// hundred titles.

const STREAMING_SYNC_SOURCES = ["wishlist", "catalog"];

// One batch of a chained streaming sync - looks up
// STREAMING_SYNC_BATCH_SIZE titles from wherever the chain left
// off, writes the results, and reports back whether this source
// has more left. Fetches one extra row past the batch size
// purely to answer that "any more?" question without a separate
// COUNT(*) round-trip.

async function runStreamingSyncBatch(env, source, offset) {

  const targetTable =
    source === "catalog"
      ? "catalog_streaming_targets"
      : "wishlist";

  const { results: rows } =
    await env.DB
      .prepare(`
        SELECT tmdb_id, media_type, title
        FROM ${targetTable}
        ORDER BY tmdb_id, media_type
        LIMIT ? OFFSET ?
      `)
      .bind(
        STREAMING_SYNC_BATCH_SIZE + 1,
        offset
      )
      .all();

  const batch =
    rows.slice(0, STREAMING_SYNC_BATCH_SIZE);

  const hasMore =
    rows.length > STREAMING_SYNC_BATCH_SIZE;

  const now =
    new Date().toISOString();

  let checkedCount = 0;

  for (const item of batch) {

    try {

      const { services, extendedServices } =
        await fetchWhitelistedServices(
          env,
          item.tmdb_id,
          item.media_type
        );

      if (source === "catalog") {

        await env.DB
          .prepare(`
            INSERT INTO catalog_streaming (tmdb_id, media_type, services, checked_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(tmdb_id, media_type) DO UPDATE SET
              services = excluded.services,
              checked_at = excluded.checked_at
          `)
          .bind(
            item.tmdb_id,
            item.media_type,
            JSON.stringify(extendedServices),
            now
          )
          .run();

      } else {

        await env.DB
          .prepare(`
            INSERT INTO wishlist_streaming (tmdb_id, media_type, services, extended_services, checked_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(tmdb_id, media_type) DO UPDATE SET
              services = excluded.services,
              extended_services = excluded.extended_services,
              checked_at = excluded.checked_at
          `)
          .bind(
            item.tmdb_id,
            item.media_type,
            JSON.stringify(services),
            JSON.stringify(extendedServices),
            now
          )
          .run();

      }

      checkedCount++;

    } catch (itemError) {

      // One title's TMDB lookup failing shouldn't stop the rest
      // of the batch (or the chain) from getting checked.

      console.error(
        `Watch-providers lookup failed for "${item.title}" (${source}, tmdb ${item.tmdb_id}):`,
        itemError
      );

    }

  }

  console.log(
    `Streaming sync (${source}): checked ${checkedCount}/${batch.length} at offset ${offset}${hasMore ? ", more to go" : ", source exhausted"}`
  );

  return { hasMore };

}

// Drives the chain forward: runs one batch, then either hands
// off to the next batch of the SAME source (more rows left),
// moves on to the NEXT source in STREAMING_SYNC_SOURCES (this
// source just finished), or stops entirely (every source
// finished - the weekly pass is complete). The hand-off is a
// plain fetch() to this Worker's own URL - per Cloudflare's own
// docs, a Worker calling itself via fetch() gets a brand new
// subrequest budget for that new invocation, which is the whole
// trick that lets this get through a multi-hundred-title catalog
// in one run instead of one capped batch a week.

async function advanceStreamingSyncChain(env, ctx, source, offset) {

  const { hasMore } =
    await runStreamingSyncBatch(
      env,
      source,
      offset
    );

  let nextSource =
    source;

  let nextOffset =
    offset + STREAMING_SYNC_BATCH_SIZE;

  if (!hasMore) {

    const currentIndex =
      STREAMING_SYNC_SOURCES.indexOf(source);

    if (
      currentIndex === -1 ||
      currentIndex === STREAMING_SYNC_SOURCES.length - 1
    ) {

      // Every source is done - nothing left to hand off to.

      return;

    }

    nextSource =
      STREAMING_SYNC_SOURCES[currentIndex + 1];

    nextOffset =
      0;

  }

  /*

  * A plain awaited fetch, not another ctx.waitUntil() -
  * advanceStreamingSyncChain is already running inside the
  * caller's own ctx.waitUntil() (see the /internal endpoint and
  * the scheduled() handler), so wrapping this call in a SECOND,
  * nested waitUntil was redundant at best - and in practice,
  * this hand-off wasn't reliably continuing the chain past the
  * first hop, which a plain await plus explicit error logging
  * should actually surface (a nested waitUntil() swallows this
  * kind of failure silently, since nothing was ever checking
  * whether that fetch actually succeeded).
    */

  try {

    const response =
      await fetch(
        `${SELF_URL}/internal/sync-streaming-batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(
              env.INTERNAL_SYNC_SECRET
                ? { "X-Internal-Sync-Secret": env.INTERNAL_SYNC_SECRET }
                : {}
            ),
          },
          body: JSON.stringify({
            source: nextSource,
            offset: nextOffset
          }),
        }
      );

    if (!response.ok) {

      console.error(
        `Streaming sync chain hand-off failed: self-fetch to offset ${nextOffset} (${nextSource}) returned HTTP ${response.status}`
      );

    }

  } catch (chainError) {

    console.error(
      `Streaming sync chain hand-off failed: self-fetch to offset ${nextOffset} (${nextSource}) threw:`,
      chainError
    );

  }

}

// TMDB's /videos endpoint returns everything from teasers to
// behind-the-scenes clips, not just trailers, and not
// necessarily in a useful order - this picks the best real
// trailer available: an official YouTube trailer first, falling
// back to any YouTube trailer, then any YouTube teaser, rather
// than just grabbing whatever TMDB lists first. Returns null
// when nothing usable comes back (a real, common case for
// obscure/older titles), same "just don't show the button"
// fail-open every other TMDB lookup on this site already uses.

async function fetchTrailerKey(env, tmdbId, mediaType) {

  const path =
    mediaType === "tv"
      ? `tv/${tmdbId}/videos`
      : `movie/${tmdbId}/videos`;

  const data =
    await tmdbGetStandalone(env, path);

  const results =
    Array.isArray(data.results)
      ? data.results
      : [];

  const youtubeVideos =
    results.filter(
      video => video.site === "YouTube"
    );

  const officialTrailer =
    youtubeVideos.find(
      video => video.type === "Trailer" && video.official
    );

  if (officialTrailer) {
    return officialTrailer.key;
  }

  const anyTrailer =
    youtubeVideos.find(
      video => video.type === "Trailer"
    );

  if (anyTrailer) {
    return anyTrailer.key;
  }

  const anyTeaser =
    youtubeVideos.find(
      video => video.type === "Teaser"
    );

  if (anyTeaser) {
    return anyTeaser.key;
  }

  return null;

}
