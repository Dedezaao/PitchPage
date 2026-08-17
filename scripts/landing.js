(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.querySelector("[data-site-header]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var frameRequested = false;

  root.classList.add("js");

  /* ------------------------------------------------------------------
   * Weather illustrations — a landing-only presentation layer.
   *
   * app.js keeps the real check-in state machine inside its own IIFE on
   * purpose (see README §19.5), so the landing can't reach its render
   * functions. This mirrors the same markup/decoration rules from
   * app.js's weatherMarkup() for the storytelling illustrations outside
   * the device (hero preview, five-states showcase), reusing the exact
   * assets and the exact motion classes already defined in
   * app.css. The real interactive demo below still renders itself.
   * ------------------------------------------------------------------ */
  /* app.js's decorated=true path adds halo/ghost/flash layers behind
     the art — validated at the device's own card size, but at the
     smaller sizes used across the landing (showcase tiles, the mobile
     stage) the cloudy ghost layers read as a second, displaced cloud
     rather than depth. The brief explicitly allows simplifying
     landing-only decoration rather than fighting it at every size, so
     the landing renders the plain illustration only — the authentic
     decorated motion stays untouched inside the real device. */
  var SPLIT = {
    partly: [["partly-sun"], ["partly-cloud", "weather__art--drift"]],
    storm: [["storm-cloud"], ["storm-bolt", "weather__bolt"]]
  };

  function art(src, extra) {
    return (
      '<img class="weather__art' +
      (extra ? " " + extra : "") +
      '" src="assets/weather/' +
      src +
      '.svg" alt="" />'
    );
  }

  function weatherMarkup(type) {
    var layers = "";

    if (SPLIT[type]) {
      SPLIT[type].forEach(function (layer) {
        layers += art(layer[0], layer[1]);
      });
    } else {
      layers = art(type === "rain" ? "rain-cloud" : type);
    }

    if (type !== "rain") return layers;

    return (
      layers +
      '<svg class="weather__drops" viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
      '<line x1="11.9" y1="20.4" x2="8.7" y2="27.6" />' +
      '<line x1="16.7" y1="20.4" x2="14.0" y2="25.6" />' +
      '<line x1="21.8" y1="20.4" x2="18.5" y2="27.6" />' +
      "</g></svg>"
    );
  }

  function paintWeatherArt(node) {
    var type = node.dataset.weatherArt;
    if (!type) return;

    /* Unlike app.js's own paintWeather() — whose target spans carry no
       other class — these spans double as landing layout components
       (weather-showcase__art and friends), so the base class has to
       survive the repaint instead of being overwritten by it. */
    var base = node.dataset.weatherBaseClass;
    if (base === undefined) {
      base = node.className;
      node.dataset.weatherBaseClass = base;
    }

    node.className =
      (base ? base + " " : "") +
      "weather weather-motion weather--" +
      type +
      ("weatherLg" in node.dataset ? " weather--lg" : "");
    node.innerHTML = weatherMarkup(type);
  }

  function paintAllWeatherArt() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-weather-art]"), paintWeatherArt);
  }

  var WEATHER_LABELS = {
    storm: "Tempestade",
    rain: "Chuva",
    cloudy: "Nublado",
    partly: "Sol entre nuvens",
    clear: "Céu limpo"
  };

  /* ------------------------------------------------------------------
   * Header
   * ------------------------------------------------------------------ */
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  /* ------------------------------------------------------------------
   * Hero entrance
   * ------------------------------------------------------------------ */
  function initHero() {
    window.requestAnimationFrame(function () {
      root.classList.add("is-ready");
    });
  }

  /* ------------------------------------------------------------------
   * Generic reveal-on-scroll groups. Any [data-reveal-group] fades in
   * its [data-reveal-item] children (staggered by CSS transition-delay)
   * the first time it enters the viewport.
   * ------------------------------------------------------------------ */
  function initGroupReveals() {
    var groups = document.querySelectorAll("[data-reveal-group]");
    if (!groups.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      Array.prototype.forEach.call(groups, function (group) {
        group.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.22 }
    );

    Array.prototype.forEach.call(groups, function (group) {
      observer.observe(group);
    });
  }

  /* ------------------------------------------------------------------
   * "Como funciona" rail — each step fades in on its own, and the
   * step whose center is closest to the viewport center becomes the
   * active one (numbered marker lights up). Native scroll only: no
   * pinning, no hijacking, just an observer plus a cheap distance check.
   * ------------------------------------------------------------------ */
  function initHowRail() {
    var steps = document.querySelectorAll(".how__step");
    if (!steps.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      Array.prototype.forEach.call(steps, function (step) {
        step.classList.add("is-visible", "is-active");
      });
      return;
    }

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    Array.prototype.forEach.call(steps, function (step) {
      revealObserver.observe(step);
    });

    function updateActiveStep() {
      var viewportCenter = window.innerHeight / 2;
      var closest = null;
      var closestDistance = Infinity;

      Array.prototype.forEach.call(steps, function (step) {
        var box = step.getBoundingClientRect();
        var center = box.top + box.height / 2;
        var distance = Math.abs(center - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = step;
        }
      });

      Array.prototype.forEach.call(steps, function (step) {
        step.classList.toggle("is-active", step === closest);
      });
    }

    window.addEventListener("scroll", requestScrollRender, { passive: true });
    window.addEventListener("resize", requestScrollRender, { passive: true });
    updateActiveStep();
    howRailUpdaters.push(updateActiveStep);
  }

  var howRailUpdaters = [];

  /* ------------------------------------------------------------------
   * Five weather states showcase — purely presentational selection.
   * The same five real buttons are used at every breakpoint (brief §2:
   * no dropdown); on mobile a large illustration above them mirrors
   * whichever one is currently selected.
   * ------------------------------------------------------------------ */
  function initWeatherShowcase() {
    var buttons = document.querySelectorAll("[data-weather-select]");
    var mobileArt = document.querySelector(".weather-showcase__stage-art");
    var mobileLabel = document.querySelector("[data-weather-mobile-label]");
    if (!buttons.length) return;

    function select(type) {
      Array.prototype.forEach.call(buttons, function (button) {
        var isMatch = button.dataset.weatherSelect === type;
        button.setAttribute("aria-pressed", isMatch ? "true" : "false");
        button.closest(".weather-showcase__item").classList.toggle("is-active", isMatch);
      });

      if (mobileArt && mobileArt.dataset.weatherArt !== type) {
        mobileArt.dataset.weatherArt = type;
        paintWeatherArt(mobileArt);
      }

      if (mobileLabel) mobileLabel.textContent = WEATHER_LABELS[type] || mobileLabel.textContent;
    }

    Array.prototype.forEach.call(buttons, function (button) {
      button.addEventListener("click", function () {
        select(button.dataset.weatherSelect);
      });
    });
  }

  /* ------------------------------------------------------------------
   * Handoff flow — registro → contexto → visão do profissional, playing
   * once as it scrolls in (see .handoff__flow rules in landing.css).
   * ------------------------------------------------------------------ */
  function initHandoffStory() {
    playOnceOnIntersect(document.querySelector("[data-handoff-story]"), 0.4);
  }

  /* ------------------------------------------------------------------
   * Dashboard micro-story — Maria's row plays its comment → request-to-
   * talk → emphasis sequence once, the first time the dashboard enters
   * the viewport. Pure CSS transition-delay drives the actual timing
   * (see .dash.is-playing rules); this just flips one class.
   * ------------------------------------------------------------------ */
  function initDashboardStory() {
    var dash = document.querySelector("[data-dash-story]");
    if (!dash) return;

    if (reduceMotion.matches) {
      dash.classList.add("is-playing");
      return;
    }

    if (!("IntersectionObserver" in window)) {
      dash.classList.add("is-playing");
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          dash.classList.add("is-playing");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    observer.observe(dash);
  }

  /* ------------------------------------------------------------------
   * Play-once-on-intersect — the same "reveal a story the first time
   * it scrolls into view" shape used by the dashboard, reused for the
   * ecosystem diagram and the Nexus lockup so both stay simple CSS
   * transition-delay cascades gated by one class.
   * ------------------------------------------------------------------ */
  function playOnceOnIntersect(el, threshold) {
    if (!el) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      el.classList.add("is-playing");
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          el.classList.add("is-playing");
          observer.unobserve(entry.target);
        });
      },
      { threshold: threshold || 0.4 }
    );

    observer.observe(el);
  }

  /* ------------------------------------------------------------------
   * Ecosystem — aluno/escola/família connect once, on scroll-in.
   * ------------------------------------------------------------------ */
  function initEcosystemStory() {
    playOnceOnIntersect(document.querySelector("[data-eco-story]"), 0.35);
  }

  /* ------------------------------------------------------------------
   * Nexus lockup — "Axon app" → "um serviço" → the official mark.
   * ------------------------------------------------------------------ */
  function initNexusStory() {
    playOnceOnIntersect(document.querySelector("[data-nexus-story]"), 0.6);
  }

  /* ------------------------------------------------------------------
   * "Como funciona" mobile accordion — one step open at a time
   * (brief §10), independent of the desktop rail's own scroll-driven
   * active step. Same real-<button>/aria-expanded/hidden shape as the
   * FAQ, deliberately: one accordion pattern for the whole page.
   * ------------------------------------------------------------------ */
  function initHowAccordion() {
    var triggers = document.querySelectorAll(".how__accordion-trigger");
    if (!triggers.length) return;

    Array.prototype.forEach.call(triggers, function (trigger) {
      trigger.addEventListener("click", function () {
        var alreadyOpen = trigger.getAttribute("aria-expanded") === "true";

        Array.prototype.forEach.call(triggers, function (other) {
          var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
          other.setAttribute("aria-expanded", "false");
          if (otherPanel) otherPanel.hidden = true;
        });

        if (alreadyOpen) return;

        var panel = document.getElementById(trigger.getAttribute("aria-controls"));
        trigger.setAttribute("aria-expanded", "true");
        if (panel) panel.hidden = false;
      });
    });
  }

  /* ------------------------------------------------------------------
   * FAQ accordion — real <button> controls, aria-expanded, and a panel
   * that's genuinely hidden (not just visually collapsed) when closed,
   * so it neither shows up in the accessibility tree nor the tab order.
   * ------------------------------------------------------------------ */
  function initFaq() {
    var questions = document.querySelectorAll(".faq__question");
    if (!questions.length) return;

    Array.prototype.forEach.call(questions, function (button) {
      var panel = document.getElementById(button.getAttribute("aria-controls"));
      if (!panel) return;

      button.addEventListener("click", function () {
        var expanded = button.getAttribute("aria-expanded") === "true";

        if (expanded) {
          button.setAttribute("aria-expanded", "false");
          panel.classList.remove("is-open");
          if (reduceMotion.matches) {
            panel.hidden = true;
          } else {
            window.setTimeout(function () {
              panel.hidden = true;
            }, 320);
          }
          return;
        }

        panel.hidden = false;
        /* Force a reflow so the browser registers the un-hidden state
           before the class change, or the max-height transition would
           have nothing to animate from. */
        void panel.offsetHeight;
        button.setAttribute("aria-expanded", "true");
        panel.classList.add("is-open");
      });
    });
  }

  /* ------------------------------------------------------------------
   * Active-chapter nav — subtle underline on whichever conceptual
   * chapter is currently on screen. IntersectionObserver only, no
   * scroll math. A link's [data-nav-targets] lists every section id
   * that belongs to it (e.g. "O Axon" covers the hero, the weather
   * question and "Por que existe" as one chapter — brief §6); it falls
   * back to the link's own href when the attribute isn't present.
   * ------------------------------------------------------------------ */
  function initActiveNav() {
    var links = document.querySelectorAll("[data-nav-links] a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    var targets = [];

    Array.prototype.forEach.call(links, function (link) {
      var ids = link.dataset.navTargets
        ? link.dataset.navTargets.split(",")
        : [link.getAttribute("href").slice(1)];

      ids.forEach(function (id) {
        var target = document.getElementById(id);
        if (!target) return;
        map[id] = link;
        targets.push(target);
      });
    });

    if (!targets.length) return;

    /* The hero chapter is on screen before anything has had a chance
       to intersect the center band — set it active immediately so the
       nav isn't blank on load. */
    links[0].classList.add("is-active");

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          Array.prototype.forEach.call(links, function (link) {
            link.classList.remove("is-active");
          });
          map[entry.target.id].classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );

    targets.forEach(function (target) {
      observer.observe(target);
    });
  }

  /* ------------------------------------------------------------------
   * Footer year.
   * ------------------------------------------------------------------ */
  function initFooterYear() {
    var el = document.getElementById("footer-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------
   * Axon device — uniform-scale presentation.
   *
   * The device has a fixed native geometry (360×812, matching app.css)
   * that its internal layout is built against with absolute rem/px
   * spacing, not percentages — it doesn't reflow if squeezed. The one
   * lever that resizes it without distorting anything inside is a
   * single scale factor applied to both axes via CSS transform, never
   * independent width/height constraints (that was the previous bug:
   * see the comment on .axon-demo-viewport in landing.css).
   *
   * Desktop: fit both the available width AND a comfortable share of
   * the viewport height (brief §4/§9) — the device shouldn't tower
   * over a short window.
   *
   * Mobile: fit width only (brief §5/§6) — height is deliberately
   * unconstrained, so the device can be taller than the viewport and
   * the landing's own scroll carries the visitor through it, rather
   * than the check-in view being crushed to fit a phone-sized fold.
   *
   * Recalculated on resize/orientation change only (rAF-debounced),
   * never on scroll — the device's size has nothing to do with scroll
   * position.
   * ------------------------------------------------------------------ */
  function initAxonScale() {
    var viewport = document.querySelector("[data-axon-viewport]");
    var stage = document.querySelector(".axon-demo-stage");
    if (!viewport || !stage) return;

    var DEVICE_WIDTH = 360;
    var DEVICE_HEIGHT = 812;
    var desktopQuery = window.matchMedia("(min-width: 761px)");
    var pending = false;

    function compute() {
      pending = false;

      var stageStyles = getComputedStyle(stage);
      var paddingX = parseFloat(stageStyles.paddingLeft) + parseFloat(stageStyles.paddingRight);
      var availableWidth = stage.clientWidth - paddingX;
      if (availableWidth <= 0) return;

      var widthScale = Math.min(availableWidth / DEVICE_WIDTH, 1);
      var scale = widthScale;

      if (desktopQuery.matches) {
        var availableHeight = window.innerHeight * 0.82;
        var heightScale = Math.min(availableHeight / DEVICE_HEIGHT, 1);
        scale = Math.min(widthScale, heightScale);
      }

      viewport.style.setProperty("--axon-scale", scale.toFixed(4));
    }

    function requestCompute() {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(compute);
    }

    compute();
    window.addEventListener("resize", requestCompute, { passive: true });
    window.addEventListener("orientationchange", requestCompute, { passive: true });

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", requestCompute);
    }
  }

  /* ------------------------------------------------------------------
   * Theme — system preference by default (already applied pre-paint by
   * the inline <head> script), a manual toggle, and localStorage
   * persistence. This function only handles what happens *after* first
   * paint: the toggle button, live system-preference updates while no
   * explicit choice has been made, and keeping <meta name=theme-color>
   * in step so mobile browser chrome matches (brief §24).
   * ------------------------------------------------------------------ */
  function initTheme() {
    var toggle = document.querySelector("[data-theme-toggle]");
    var metaThemeColor = document.getElementById("meta-theme-color");
    var THEME_COLORS = { light: "#fcfcfa", dark: "#10161a" };

    function applyMeta(theme) {
      if (metaThemeColor) metaThemeColor.setAttribute("content", THEME_COLORS[theme]);
      if (toggle) {
        toggle.setAttribute(
          "aria-label",
          theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"
        );
      }
    }

    applyMeta(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try {
          localStorage.setItem("axon-theme", next);
        } catch (e) {
          /* Private browsing or storage disabled — theme still applies
             for this page view, it just won't persist. */
        }
        applyMeta(next);
      });
    }

    var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof systemDark.addEventListener === "function") {
      systemDark.addEventListener("change", function (event) {
        var stored;
        try {
          stored = localStorage.getItem("axon-theme");
        } catch (e) {
          stored = null;
        }
        /* Only follow the system live if the visitor never made an
           explicit choice — an explicit choice should stick. */
        if (stored === "light" || stored === "dark") return;
        var theme = event.matches ? "dark" : "light";
        root.setAttribute("data-theme", theme);
        applyMeta(theme);
      });
    }
  }

  /* ------------------------------------------------------------------
   * Mobile nav disclosure — a real button, aria-expanded, closes on
   * outside click, Escape, link activation, or resize past the mobile
   * breakpoint (so it can never get stuck open behind a desktop nav).
   * ------------------------------------------------------------------ */
  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var panel = document.querySelector("[data-mobile-nav]");
    if (!toggle || !panel) return;

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      panel.hidden = true;
    }

    function open() {
      toggle.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    }

    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      if (expanded) close();
      else open();
    });

    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) close();
    });

    document.addEventListener("click", function (event) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (event.target === toggle || toggle.contains(event.target)) return;
      if (panel.contains(event.target)) return;
      close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });

    window.addEventListener(
      "resize",
      function () {
        if (window.innerWidth > 760) close();
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------
   * Scroll render loop — shared rAF batching for everything above that
   * reads scroll position.
   * ------------------------------------------------------------------ */
  function renderScrollState() {
    frameRequested = false;
    updateHeader();
    howRailUpdaters.forEach(function (fn) {
      fn();
    });
  }

  function requestScrollRender() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(renderScrollState);
  }

  function handleMotionPreference() {
    if (reduceMotion.matches) {
      document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
        group.classList.add("is-visible");
      });
      document.querySelectorAll(".how__step").forEach(function (step) {
        step.classList.add("is-visible", "is-active");
      });
      var handoff = document.querySelector("[data-handoff-story]");
      if (handoff) handoff.classList.add("is-playing");
      var dash = document.querySelector("[data-dash-story]");
      if (dash) dash.classList.add("is-playing");
      var eco = document.querySelector("[data-eco-story]");
      if (eco) eco.classList.add("is-playing");
      var nexusLockup = document.querySelector("[data-nexus-story]");
      if (nexusLockup) nexusLockup.classList.add("is-playing");
    }
    requestScrollRender();
  }

  paintAllWeatherArt();
  initHero();
  initGroupReveals();
  initHowRail();
  initWeatherShowcase();
  initHowAccordion();
  initHandoffStory();
  initDashboardStory();
  initEcosystemStory();
  initNexusStory();
  initFaq();
  initActiveNav();
  initFooterYear();
  initAxonScale();
  initTheme();
  initMobileNav();
  updateHeader();

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", handleMotionPreference);
  }
})();
