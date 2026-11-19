/* ==========================================================================
   AcquireLocal — eventbrite-checkout.js
   Opens Eventbrite's official Embedded Checkout (a pop-up on this page)
   from every [data-eventbrite] link, so visitors buy tickets without
   leaving the site. Docs: eventbrite.com/platform/docs/embedded-checkout

   Progressive enhancement: the links stay real Eventbrite links. If the
   widget can't load (ad blocker, offline, or not on https — Eventbrite
   requires a secure page), they simply open Eventbrite in a new tab.
   ========================================================================== */
(function () {
  "use strict";

  // Set to false to switch the pop-up off site-wide (links then open Eventbrite in a new tab).
  var ENABLED = false;
  var EVENT_ID = "2002596155008";
  var WIDGET_SRC = "https://www.eventbrite.com/static/widgets/eb_widgets.js";

  var links = document.querySelectorAll("[data-eventbrite]");
  if (!ENABLED || !links.length) return;
  if (window.location.protocol !== "https:") return;   // local preview: keep normal links

  var toast = document.querySelector("[data-toast]");

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(function () { toast.classList.remove("is-visible"); }, 7000);
  }

  // Hidden button the widget listens to; every Eventbrite link "presses" it.
  var trigger = document.createElement("button");
  trigger.type = "button";
  trigger.id = "eb-checkout-trigger";
  trigger.hidden = true;                      // never shown or focusable
  trigger.textContent = "Open ticket checkout";  // a named button, so checkers don't flag it as empty
  document.body.appendChild(trigger);

  var script = document.createElement("script");
  script.src = WIDGET_SRC;
  script.async = true;

  script.onload = function () {
    if (!window.EBWidgets) return;

    window.EBWidgets.createWidget({
      widgetType: "checkout",
      eventId: EVENT_ID,
      modal: true,
      modalTriggerElementId: "eb-checkout-trigger",
      onOrderComplete: function () {
        showToast("Your seat is reserved. We look forward to seeing you in Brooklyn!");
      }
    });

    Array.prototype.forEach.call(links, function (link) {
      // Screen-reader hint now describes the pop-up instead of a new tab
      var hint = link.querySelector(".visually-hidden");
      if (hint) hint.textContent = " (opens ticket checkout)";
      link.removeAttribute("target");

      link.addEventListener("click", function (e) {
        e.preventDefault();
        trigger.click();
      });
    });
  };

  document.head.appendChild(script);
})();
