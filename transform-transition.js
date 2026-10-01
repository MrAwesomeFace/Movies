/*
=========================================================
TRANSFORMERS TRANSITION
=========================================================
Old-cartoon bumper between the shelf and the stats page:
the insignia zooms in on black, catches a chrome glint,
then flips over to the other faction before the next page
loads.

Any link with data-transform gets it:
  data-transform="autobot"     Autobot first, flips to Decepticon
  data-transform="decepticon"  Decepticon first, flips to Autobot

Click or press any key during the animation to skip it.
Ctrl/Cmd/middle-click and reduced-motion settings skip it
entirely and just follow the link.
*/

(function () {

  const IMAGES = {
    autobot: "images/autobot.webp",
    decepticon: "images/decepticon.webp",
  };

  const ARRIVAL_KEY = "mrMoviesTransformArrival";

  const STYLE = `
    .tf-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at 50% 50%, #0b1230 0%, #000 62%);
      perspective: 1400px;
      cursor: pointer;
    }
    .tf-overlay.tf-arrive {
      background: #000;
      pointer-events: none;
    }
    /* Scale and fade live on the stage, rotation on the card:
       animating opacity on the card itself would flatten the 3D
       flip and hide the back face. */
    .tf-stage {
      width: min(62vmin, 440px);
      aspect-ratio: 1;
      transform-style: preserve-3d;
    }
    .tf-card {
      position: relative;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
    }
    .tf-face {
      position: absolute;
      inset: 0;
      background: var(--tf-logo) center / contain no-repeat;
      -webkit-mask: var(--tf-logo) center / contain no-repeat;
      mask: var(--tf-logo) center / contain no-repeat;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      overflow: hidden;
      filter: drop-shadow(0 0 18px rgba(80, 140, 255, 0.35));
    }
    .tf-face.tf-back {
      transform: rotateY(180deg);
    }
    .tf-glint {
      position: absolute;
      inset: -20%;
      background: linear-gradient(
        115deg,
        transparent 40%,
        rgba(255, 255, 255, 0.85) 50%,
        transparent 60%
      );
      mix-blend-mode: screen;
      transform: translateX(-120%);
      pointer-events: none;
    }
  `;

  function injectStyle() {
    if (document.getElementById("tf-style")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "tf-style";
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  function reducedMotion() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function preload() {
    Object.values(IMAGES).forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  function prefetch(href) {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.appendChild(link);
  }

  function buildOverlay(first, second) {
    const overlay = document.createElement("div");
    overlay.className = "tf-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      `<div class="tf-stage"><div class="tf-card">` +
        `<div class="tf-face tf-front" style="--tf-logo:url('${IMAGES[first]}')"><div class="tf-glint"></div></div>` +
        `<div class="tf-face tf-back" style="--tf-logo:url('${IMAGES[second]}')"><div class="tf-glint"></div></div>` +
      `</div></div>`;
    return overlay;
  }

  function glint(face, delay) {
    return face.querySelector(".tf-glint").animate(
      [
        { transform: "translateX(-120%)" },
        { transform: "translateX(120%)" }
      ],
      { duration: 380, delay, easing: "ease-in-out", fill: "both" }
    );
  }

  function play(link) {
    const first = link.dataset.transform === "decepticon" ? "decepticon" : "autobot";
    const second = first === "autobot" ? "decepticon" : "autobot";
    const href = link.href;

    injectStyle();
    prefetch(href);

    const overlay = buildOverlay(first, second);
    document.body.appendChild(overlay);

    const stage = overlay.querySelector(".tf-stage");
    const card = overlay.querySelector(".tf-card");
    const front = overlay.querySelector(".tf-front");
    const back = overlay.querySelector(".tf-back");

    let done = false;

    function go() {
      if (done) {
        return;
      }
      done = true;
      try {
        sessionStorage.setItem(ARRIVAL_KEY, "1");
      } catch (error) {}
      window.location.href = href;
    }

    // Zoom in face-on, no spin - the only flip is the one below.
    stage.animate(
      [
        { transform: "scale(0.12)", opacity: 0 },
        { transform: "scale(0.6)", opacity: 1, offset: 0.35 },
        { transform: "scale(1)", opacity: 1 }
      ],
      { duration: 750, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }
    );

    glint(front, 760);

    // The flip to the other faction, with a little punch.
    card.animate(
      [
        { transform: "rotateY(0deg)" },
        { transform: "rotateY(180deg)" }
      ],
      { duration: 480, delay: 1250, easing: "cubic-bezier(.6,0,.4,1)", fill: "forwards" }
    );
    stage.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.1)", offset: 0.5 },
        { transform: "scale(1)" }
      ],
      { duration: 480, delay: 1250, easing: "ease-in-out", composite: "replace" }
    );

    glint(back, 1750);

    // Fade out, then load the next page.
    stage.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 220, delay: 2250, fill: "forwards" }
    ).onfinish = go;

    // Click or press a key to skip.
    overlay.addEventListener("click", go);
    window.addEventListener("keydown", go, { once: true });
  }

  // Coming in from a transition: fade up from black so there is no flash.
  function arrive() {
    let arriving = false;
    try {
      arriving = sessionStorage.getItem(ARRIVAL_KEY) === "1";
      sessionStorage.removeItem(ARRIVAL_KEY);
    } catch (error) {}
    if (!arriving || reducedMotion()) {
      return;
    }
    injectStyle();
    const cover = document.createElement("div");
    cover.className = "tf-overlay tf-arrive";
    document.body.appendChild(cover);
    cover.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 450, easing: "ease-out", fill: "forwards" }
    ).onfinish = () => cover.remove();
  }

  document.addEventListener(
    "click",
    event => {
      const link = event.target.closest && event.target.closest("a[data-transform]");
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        reducedMotion() ||
        !document.body.animate
      ) {
        return;
      }
      event.preventDefault();
      play(link);
    },
    true
  );

  // Back button returns from the browser cache with the overlay
  // still on screen - clear it.
  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      document.querySelectorAll(".tf-overlay").forEach(el => el.remove());
    }
  });

  // Loaded at the top of <body>, so the cover goes up before anything paints.
  if (document.body) {
    arrive();
  } else {
    document.addEventListener("DOMContentLoaded", arrive);
  }

  window.addEventListener("load", () => setTimeout(preload, 1500));

})();
