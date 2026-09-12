/* ============================================================================
   IBB — site behaviour
   No dependencies. Everything here degrades safely: if this file fails to load,
   the pages are still complete, readable and navigable.
   ========================================================================== */
(function () {
  "use strict";

  /* Where the contact form posts. Leave empty and the form falls back to
     opening the visitor's mail client, pre-addressed — so it always works.
     To take submissions in the background, paste a form endpoint here
     (Formspree, Basin, Netlify Forms, Google Apps Script, …). */
  var FORM_ENDPOINT = "";
  var CONTACT_EMAIL = "ibbatucla@gmail.com";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------------ nav -- */
  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    var toggle = $(".nav__toggle", nav);
    var links  = $(".nav__links", nav);
    var solid  = nav.classList.contains("nav--solid");

    if (!solid) {
      var onScroll = function () {
        nav.classList.toggle("is-stuck", window.scrollY > 24);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    if (!toggle || !links) return;
    var close = function () {
      toggle.setAttribute("aria-expanded", "false");
      links.classList.remove("is-open");
      document.body.style.removeProperty("overflow");
    };
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("is-open", !open);
      document.body.style.overflow = !open ? "hidden" : "";
    });
    $$("a", links).forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close(); toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 899) close();
    });
  }

  /* -------------------------------------------------------------- reveals -- */
  function initReveals() {
    var items = $$("[data-reveal]");
    if (!items.length) return;

    if (reduced.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    /* Stagger siblings inside a shared [data-reveal-group] so a row of three
       cards arrives in sequence rather than all at once. */
    $$("[data-reveal-group]").forEach(function (group) {
      var step = parseInt(group.getAttribute("data-reveal-group"), 10) || 80;
      $$("[data-reveal]", group).forEach(function (el, i) {
        el.style.setProperty("--reveal-delay", (i * step) + "ms");
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------- counters -- */
  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;

    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduced.matches || isNaN(target)) { el.textContent = target + suffix; return; }
      var dur = 1400, t0 = null;
      var tick = function (now) {
        if (t0 === null) t0 = now;
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);          /* ease-out cubic */
        el.textContent = Math.round(target * eased) + suffix;   /* keep the suffix so the
                                                                   number never resizes at the end */
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target); io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) {
      el.textContent = "0" + (el.getAttribute("data-suffix") || "");
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------ accordion -- */
  function initAccordion() {
    $$(".faq__q").forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        panel.style.height = open ? "0px" : panel.firstElementChild.offsetHeight + "px";
      });
      /* keep an open panel correctly sized when the text reflows */
      window.addEventListener("resize", function () {
        if (btn.getAttribute("aria-expanded") === "true") {
          panel.style.height = panel.firstElementChild.offsetHeight + "px";
        }
      });
    });
  }


  /* ----------------------------------------------------------------- form -- */
  function initForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    var status = $(".form__status", form);

    var setError = function (field, msg) {
      var box = form.querySelector('[data-error-for="' + field.name + '"]');
      if (box) box.textContent = msg || "";
      field.setAttribute("aria-invalid", msg ? "true" : "false");
    };

    var validate = function () {
      var ok = true, first = null;
      $$("input, textarea", form).forEach(function (f) {
        if (!f.name) return;
        var msg = "";
        if (f.required && !f.value.trim()) msg = "This field is required.";
        else if (f.type === "email" && f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value)) {
          msg = "Please enter a valid email address.";
        }
        setError(f, msg);
        if (msg) { ok = false; first = first || f; }
      });
      if (first) first.focus();
      return ok;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (status) { status.textContent = ""; status.removeAttribute("data-tone"); }
      if (!validate()) {
        if (status) { status.textContent = "Please correct the highlighted fields."; status.setAttribute("data-tone", "err"); }
        return;
      }
      var data = new FormData(form);

      if (!FORM_ENDPOINT) {
        /* No backend configured — hand off to the visitor's mail client so the
           form is never a dead end. */
        var name = [data.get("firstName"), data.get("lastName")].filter(Boolean).join(" ");
        var body = "From: " + name + " <" + (data.get("email") || "") + ">\n\n" + (data.get("message") || "");
        window.location.href = "mailto:" + CONTACT_EMAIL +
          "?subject=" + encodeURIComponent("Website enquiry from " + (name || "a visitor")) +
          "&body=" + encodeURIComponent(body);
        if (status) {
          status.textContent = "Opening your email app… if nothing happens, write to " + CONTACT_EMAIL + " directly.";
          status.setAttribute("data-tone", "ok");
        }
        return;
      }

      var btn = $('button[type="submit"]', form);
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }
      fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("bad status"); return r; })
        .then(function () {
          form.reset();
          if (status) { status.textContent = "Thank you, we'll be in touch shortly."; status.setAttribute("data-tone", "ok"); }
        })
        .catch(function () {
          if (status) {
            status.textContent = "Something went wrong. Please email " + CONTACT_EMAIL + " instead.";
            status.setAttribute("data-tone", "err");
          }
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        });
    });

    /* clear an error as soon as the visitor starts fixing it */
    $$("input, textarea", form).forEach(function (f) {
      f.addEventListener("input", function () { if (f.getAttribute("aria-invalid") === "true") setError(f, ""); });
    });
  }

  /* -------------------------------------------------------------- signup --- */
  function initSignup() {
    $$("[data-signup]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = $("input", form);
        var note  = $("[data-signup-status]", form.parentNode) || $("[data-signup-status]", form);
        if (!input || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value)) {
          if (note) { note.textContent = "Please enter a valid email address."; note.setAttribute("data-tone", "err"); }
          input && input.focus();
          return;
        }
        window.location.href = "mailto:" + CONTACT_EMAIL +
          "?subject=" + encodeURIComponent("Mailing list signup") +
          "&body=" + encodeURIComponent("Please add " + input.value + " to the IBB mailing list.");
        if (note) { note.textContent = "Thanks. Confirm the email we just opened for you."; note.setAttribute("data-tone", "ok"); }
        form.reset();
      });
    });
  }

  /* -------------------------------------------------------------- gallery -- */
  /* The swiping itself is a native scroll-snap track (touch, trackpad,
     shift-wheel). This only adds the arrows, the dots and arrow-key steps, and
     keeps them in sync with wherever the track comes to rest. */
  function initGallery() {
    $$("[data-gallery]").forEach(function (gallery) {
      var track  = $(".gallery__track", gallery);
      var slides = track ? $$(".gallery__slide", track) : [];
      var prev   = $("[data-gallery-prev]", gallery);
      var next   = $("[data-gallery-next]", gallery);
      var dotBox = $(".gallery__dots", gallery);
      if (slides.length < 2) { gallery.classList.add("is-single"); return; }

      var current = 0;
      var go = function (i) {
        i = Math.max(0, Math.min(slides.length - 1, i));
        track.scrollTo({
          left: slides[i].offsetLeft - slides[0].offsetLeft,
          behavior: reduced.matches ? "auto" : "smooth"
        });
      };

      var dots = slides.map(function (slide, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "gallery__dot";
        dot.setAttribute("aria-label", "Show testimonial " + (i + 1) + " of " + slides.length);
        dot.addEventListener("click", function () { go(i); });
        if (dotBox) dotBox.appendChild(dot);
        return dot;
      });

      var sync = function () {
        var step = slides[1].offsetLeft - slides[0].offsetLeft;
        current = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / step)));
        dots.forEach(function (dot, i) {
          if (i === current) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
        if (prev) prev.disabled = current === 0;
        if (next) next.disabled = current === slides.length - 1;
      };

      var queued = false;
      track.addEventListener("scroll", function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; sync(); });
      }, { passive: true });

      if (prev) prev.addEventListener("click", function () { go(current - 1); });
      if (next) next.addEventListener("click", function () { go(current + 1); });
      track.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft")  { e.preventDefault(); go(current - 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); }
      });
      window.addEventListener("resize", sync);
      sync();
    });
  }

  /* ---------------------------------------------------------------- misc --- */
  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function init() {
    initNav(); initReveals(); initCounters(); initAccordion();
    initGallery(); initForm(); initSignup(); initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
