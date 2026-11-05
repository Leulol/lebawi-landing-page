/*
 * The pitch's small behaviours. Owns only classes, attributes and inline transforms on the
 * page; nothing is loaded or stored. Without JavaScript every word and screenshot is there
 * and the crest simply stays whole.
 *
 *  - The crest on the left follows the story. Each section says which ለ are home
 *    (data-home="2,3"), which one is lit (data-lit) and the label under it (data-label):
 *    the problem scatters all five, each fix brings one back.
 *  - When "One record. Five views." (the last section) reaches the middle of the screen,
 *    the crest leaves the left column and slides into the wheel (a FLIP: measure both
 *    places, start the wheel's crest where the left one was, let it travel home).
 *    Scrolling back up returns it to the left.
 *  - The five groups light up their ለ in the wheel, on hover or focus.
 *  - Presenting: P (or Present). → / Space / Page Down go on, scrolling first through a
 *    section taller than the screen; ← / Page Up go back; Home / End; F full screen; Esc.
 *  - Sections fade in as they arrive (not with reduced motion).
 */
(function () {
  const root = document.documentElement;
  root.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- The crest follows the story ---------- */
  const story = document.querySelector(".story");
  const pieces = Array.from(document.querySelectorAll(".piece"));
  const stageLabel = document.getElementById("stage-label");
  const steps = Array.from(document.querySelectorAll(".step"));

  function showStep(step) {
    const home = (step.dataset.home || "").split(",").filter(Boolean);
    pieces.forEach((piece) => {
      piece.classList.toggle("home", home.includes(piece.dataset.le));
      piece.classList.toggle("lit", piece.dataset.le === step.dataset.lit);
    });
    stageLabel.textContent = step.dataset.label || "";
  }
  pieces.forEach((piece) => piece.classList.add("home"));   // whole until the problem arrives

  /* ---------- The crest lands in "One record. Five views." ---------- */
  const oneRecord = document.getElementById("one-record");
  const wheel = document.querySelector(".wheel");
  const wheelCrest = document.getElementById("wheel-crest");
  const stageSvg = document.querySelector("#stage-crest svg");
  let landed = false;

  function land() {
    landed = true;
    const from = stageSvg.getBoundingClientRect();         // viewBox 380 wide
    const to = wheelCrest.getBoundingClientRect();         // viewBox 300 wide
    const scale = (from.width / 380) / (to.width / 300);
    const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
    story.classList.add("landed");
    wheel.classList.add("landed");
    if (reduceMotion || !from.width) return;
    wheelCrest.style.transition = "none";
    wheelCrest.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    wheelCrest.getBoundingClientRect();                     // commit the start position
    wheelCrest.style.transition = "transform 1.1s cubic-bezier(.22, 1, .36, 1)";
    wheelCrest.style.transform = "";
  }

  function unland() {
    landed = false;
    story.classList.remove("landed");
    wheel.classList.remove("landed");
    wheelCrest.style.transition = "none";
    wheelCrest.style.transform = "";
  }

  if ("IntersectionObserver" in window) {
    const middle = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        showStep(entry.target);
        const shouldLand = entry.target === oneRecord;       // the last section: the crest moves over
        if (shouldLand !== landed) (shouldLand ? land : unland)();
      });
    }, { rootMargin: "-45% 0px -45% 0px" });               // a step is current when it crosses the middle
    steps.forEach((step) => middle.observe(step));
  }

  /* ---------- The five groups light up their ለ ---------- */
  const groups = document.querySelectorAll("#groups li");
  function light(n) {
    wheel.classList.toggle("has-on", Boolean(n));
    wheel.querySelectorAll(".wheel-le").forEach((le) => le.classList.toggle("on", le.dataset.le === n));
    groups.forEach((li) => li.classList.toggle("on", li.dataset.le === n));
  }
  groups.forEach((li) => {
    li.tabIndex = 0;
    li.addEventListener("mouseenter", () => light(li.dataset.le));
    li.addEventListener("focus", () => light(li.dataset.le));
    li.addEventListener("mouseleave", () => light(null));
    li.addEventListener("blur", () => light(null));
  });

  /* ---------- Fade sections in as they arrive ---------- */
  const fading = steps;
  if ("IntersectionObserver" in window) {
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("seen"); seen.unobserve(entry.target); } });
    }, { rootMargin: "0px 0px -15% 0px" });
    fading.forEach((el) => seen.observe(el));
  } else {
    fading.forEach((el) => el.classList.add("seen"));
  }

  /* ---------- Presenting ---------- */
  const slides = Array.from(document.querySelectorAll(".slide"));
  const toggle = document.getElementById("present-toggle");
  const hud = document.getElementById("hud");
  const count = document.getElementById("hud-count");

  function currentIndex() {
    const line = window.innerHeight * 0.4;
    let index = 0;
    slides.forEach((slide, i) => { if (slide.getBoundingClientRect().top <= line) index = i; });
    return index;
  }
  function goTo(index) { slides[Math.max(0, Math.min(slides.length - 1, index))].scrollIntoView({ block: "start" }); }
  function next() {
    const bottom = slides[currentIndex()].getBoundingClientRect().bottom;
    if (bottom > window.innerHeight + 24) window.scrollBy({ top: Math.min(bottom - window.innerHeight, window.innerHeight * 0.8) });
    else goTo(currentIndex() + 1);
  }
  function previous() {
    const top = slides[currentIndex()].getBoundingClientRect().top;
    if (top < -24) window.scrollBy({ top: Math.max(top, -window.innerHeight * 0.8) });
    else goTo(currentIndex() - 1);
  }
  function updateHud() {
    const i = currentIndex();
    count.textContent = `${i + 1} / ${slides.length} · ${slides[i].dataset.title || ""}`;
  }
  function setPresenting(on) {
    const index = currentIndex();
    root.classList.toggle("presenting", on);
    toggle.setAttribute("aria-pressed", String(on));
    hud.hidden = !on;
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    goTo(index);
    updateHud();
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
  }

  toggle.addEventListener("click", () => setPresenting(!root.classList.contains("presenting")));
  document.getElementById("hud-prev").addEventListener("click", previous);
  document.getElementById("hud-next").addEventListener("click", next);
  document.getElementById("hud-exit").addEventListener("click", () => setPresenting(false));
  window.addEventListener("scroll", () => { if (!hud.hidden) updateHud(); }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest && event.target.closest("input, textarea, select")) return;
    const presenting = root.classList.contains("presenting");
    const key = event.key;
    if (key === "p" || key === "P") { setPresenting(!presenting); event.preventDefault(); return; }
    if (key === "ArrowRight") { next(); event.preventDefault(); return; }
    if (key === "ArrowLeft") { previous(); event.preventDefault(); return; }
    if (!presenting) return;
    if (key === "Escape") { setPresenting(false); return; }
    if (key === "f" || key === "F") { toggleFullscreen(); return; }
    if (key === " " && event.target.closest && event.target.closest("a, button")) return;
    if (key === " " || key === "PageDown" || key === "ArrowDown") { event.preventDefault(); (event.shiftKey ? previous : next)(); }
    else if (key === "PageUp" || key === "ArrowUp") { event.preventDefault(); previous(); }
    else if (key === "Home") { event.preventDefault(); goTo(0); }
    else if (key === "End") { event.preventDefault(); goTo(slides.length - 1); }
  });
})();
