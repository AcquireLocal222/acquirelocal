/* ==========================================================================
   AcquireLocal — speakers.js
   Speakers row: every 5 seconds the row slides one speaker to the right,
   and the speaker that leaves on the right comes back in on the left.
   Previous / Next buttons move it by hand.

   How the endless loop works: the list items are reordered instead of
   copied. Moving right = take the last speaker, put it first, then
   slide the row from one card to the left back to its normal spot.

   Accessibility (WCAG 2.2.2 Pause, Stop, Hide):
   - Visible pause/play button; once paused it stays paused.
   - Hovering the row or tabbing into its buttons pauses it too.
   - Visitors with "reduce motion" turned on get no automatic movement.
   - Only moves while on screen.
   - Without JavaScript the row simply scrolls sideways.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-speakers]");
  if (!root) return;

  var viewport = root.querySelector("[data-speakers-viewport]");
  var track = root.querySelector("[data-speakers-track]");
  var controls = root.querySelector("[data-speakers-controls]");
  var prevBtn = root.querySelector("[data-speakers-prev]");
  var nextBtn = root.querySelector("[data-speakers-next]");
  var pauseBtn = root.querySelector("[data-speakers-pause]");
  if (!viewport || !track || !controls || track.children.length < 2) return;

  var INTERVAL = 5000;   // ms between moves
  var SLIDE = 650;       // ms, keep in sync with .speakers__track transition in styles.css

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var userPaused = reduceMotion;   // reduced motion: start (and stay) still until Play
  var hovering = false;
  var focused = false;
  var onScreen = true;
  var busy = false;
  var timer = null;

  // Turn the scrolling row into the sliding row
  root.classList.add("is-enhanced");
  controls.hidden = false;
  // Cards that start off to the side would never lazy-load inside the clipped row
  track.querySelectorAll("img").forEach(function (img) { img.loading = "eager"; });

  // Distance of one move: a card's width plus the gap between cards
  function step() {
    var first = track.children[0];
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return first.getBoundingClientRect().width + gap;
  }

  function setTransform(x, animate) {
    track.style.transition = animate ? "" : "none";
    track.style.transform = x ? "translateX(" + x + "px)" : "";
  }

  // Speakers move to the right; the last one re-enters on the left
  function moveRight() {
    if (busy) return;
    busy = true;
    track.insertBefore(track.lastElementChild, track.firstElementChild);
    setTransform(-step(), false);
    track.getBoundingClientRect();          // apply the jump before animating
    setTransform(0, true);
    setTimeout(function () { busy = false; }, SLIDE);
  }

  // Speakers move to the left; the first one re-enters on the right
  function moveLeft() {
    if (busy) return;
    busy = true;
    setTransform(-step(), true);
    setTimeout(function () {
      track.appendChild(track.firstElementChild);
      setTransform(0, false);
      busy = false;
    }, SLIDE);
  }

  function running() {
    return !userPaused && !hovering && !focused && onScreen && !document.hidden;
  }

  function schedule() {
    clearInterval(timer);
    timer = running() ? setInterval(moveRight, INTERVAL) : null;
  }

  function updatePauseButton() {
    pauseBtn.setAttribute("aria-pressed", String(userPaused));
    pauseBtn.querySelector(".visually-hidden").textContent = userPaused ? "Play speakers" : "Pause speakers";
    root.classList.toggle("is-paused", userPaused);
  }

  // "Previous" brings back the speaker that was before, so the row moves right
  prevBtn.addEventListener("click", function () { moveRight(); schedule(); });
  nextBtn.addEventListener("click", function () { moveLeft(); schedule(); });

  pauseBtn.addEventListener("click", function () {
    userPaused = !userPaused;
    updatePauseButton();
    schedule();
  });

  viewport.addEventListener("mouseenter", function () { hovering = true; schedule(); });
  viewport.addEventListener("mouseleave", function () { hovering = false; schedule(); });
  // Keyboard focus pauses; a mouse click on Play shouldn't keep it paused
  root.addEventListener("focusin", function (event) {
    focused = event.target.matches(":focus-visible");
    schedule();
  });
  root.addEventListener("focusout", function (event) {
    if (!root.contains(event.relatedTarget)) { focused = false; schedule(); }
  });
  document.addEventListener("visibilitychange", schedule);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      schedule();
    }).observe(root);
  }

  updatePauseButton();
  schedule();
})();
