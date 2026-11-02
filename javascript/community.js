/* ==========================================================================
   AcquireLocal — community.js
   Community photo strip: duplicates the photos so the row can drift
   left to right without a gap (the drift itself is a CSS animation).

   Accessibility (WCAG 2.2.2 Pause, Stop, Hide):
   - Visible pause/play button; once paused it stays paused.
   - Visitors with "reduce motion" turned on get a still, scrollable row.
   - The copy is hidden from screen readers and keyboard focus.
   - Only moves while on screen; hover also pauses it.
   ========================================================================== */
(function () {
  "use strict";

  var strip = document.querySelector("[data-community]");
  if (!strip) return;

  var track = strip.querySelector("[data-community-track]");
  var pauseBtn = strip.querySelector("[data-community-pause]");
  var pauseLabel = pauseBtn && pauseBtn.querySelector(".community__pause-label");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!track || !pauseBtn || reduceMotion.matches) return;

  var userPaused = false;
  var started = false;

  // Second set of photos, purely decorative
  Array.prototype.slice.call(track.children).forEach(function (item) {
    var copy = item.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    copy.querySelectorAll("img").forEach(function (img) { img.alt = ""; });
    track.appendChild(copy);
  });

  function setPaused(paused) {
    strip.classList.toggle("is-paused", paused);
  }

  function begin() {
    // Photos off to the side would never lazy-load inside the clipped row
    track.querySelectorAll("img").forEach(function (img) { img.loading = "eager"; });
    strip.classList.add("is-moving");
    pauseBtn.hidden = false;
    started = true;
  }

  pauseBtn.addEventListener("click", function () {
    userPaused = !userPaused;
    pauseBtn.setAttribute("aria-pressed", String(userPaused));
    if (pauseLabel) pauseLabel.textContent = userPaused ? "Play photos" : "Pause photos";
    setPaused(userPaused);
  });

  if (!("IntersectionObserver" in window)) {
    begin();
    return;
  }

  // Start (and load the photos) just before the strip scrolls into view;
  // stop drifting while it is off screen
  new IntersectionObserver(function (entries) {
    var visible = entries[0].isIntersecting;
    if (visible && !started) begin();
    setPaused(userPaused || !visible);
  }, { rootMargin: "400px 0px" }).observe(strip);
})();
