import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   helpers
   ============================================================ */

/* prep an svg path for a draw-on animation */
function prepDraw(path) {
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  return len;
}

/* wrap each word of a pure-text element for stagger reveals */
function splitWords(el) {
  const text = el.textContent;
  el.textContent = "";
  el.setAttribute("aria-label", text);
  const words = text.split(/\s+/).filter(Boolean);
  const spans = [];
  words.forEach((w, i) => {
    const mask = document.createElement("span");
    mask.style.cssText = "display:inline-block;overflow:clip;vertical-align:bottom;";
    mask.setAttribute("aria-hidden", "true");
    const word = document.createElement("span");
    word.style.display = "inline-block";
    word.textContent = w;
    mask.appendChild(word);
    el.appendChild(mask);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    spans.push(word);
  });
  return spans;
}

/* ============================================================
   loader + hero intro
   ============================================================ */
export function runLoader({ reduceMotion, onHeroReady }) {
  const loader = document.getElementById("loader");

  /* set initial hero states (only when we're going to animate) */
  const heroLines = document.querySelectorAll(".hero__title .line");
  const heroBits = [".hero__eyebrow", ".hero__sub", ".hero__cta", ".hero__proof"];

  if (reduceMotion) {
    loader.remove();
    onHeroReady?.();
    return;
  }

  heroLines.forEach((line) => {
    const mask = document.createElement("span");
    mask.style.cssText = "display:block;overflow:clip;";
    line.parentNode.insertBefore(mask, line);
    mask.appendChild(line);
  });
  gsap.set(".hero__title .line", { yPercent: 112 });
  gsap.set(heroBits, { y: 26, opacity: 0 });
  gsap.set(".nav", { y: -16, opacity: 0 });
  gsap.set(".hero__blob", { scale: 0.4, opacity: 0, transformOrigin: "60% 40%" });
  gsap.set([".hero__note", ".hero__scrollhint"], { opacity: 0 });

  const heroStrokes = document.querySelectorAll(".hero .u-stroke .draw, .hero .doodle .draw");
  heroStrokes.forEach(prepDraw);

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  /* flask fills */
  tl.to(".loader__liquid", { attr: { y: 18 }, duration: 0.9, ease: "power2.inOut" })
    .from(".loader__word", { opacity: 0, y: 12, duration: 0.4 }, "-=0.55")
    .to(".loader__inner", { scale: 0.88, opacity: 0, duration: 0.4, ease: "power2.in" }, "+=0.15")
    .to(loader, {
      yPercent: -100,
      duration: 0.75,
      ease: "power4.inOut",
      onComplete: () => loader.remove(),
    }, "-=0.05")
    /* hero in */
    .to(".hero__blob", { scale: 1, opacity: 1, duration: 1.2, ease: "power3.out" }, "-=0.45")
    .to(".nav", { y: 0, opacity: 1, duration: 0.7 }, "<")
    .to(".hero__title .line", { yPercent: 0, duration: 0.95, stagger: 0.09, ease: "power4.out" }, "<+0.08")
    .add(() => onHeroReady?.(), "<+0.2")
    .to(heroBits, { y: 0, opacity: 1, duration: 0.8, stagger: 0.09 }, "<+0.25")
    .to(heroStrokes, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.12 }, "<+0.1")
    .to([".hero__note", ".hero__scrollhint"], { opacity: 1, duration: 0.6 }, "<+0.3");
}

/* ============================================================
   scroll animations
   ============================================================ */
export function initAnimations({ reduceMotion }) {
  if (reduceMotion) {
    initProcessStatic();
    return;
  }

  /* ----- generic reveals ----- */
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 34,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });

  /* ----- heading word reveals (pure-text headings) ----- */
  gsap.utils.toArray("[data-split]").forEach((el) => {
    const hasMarkup = el.querySelector("svg, em, span, br");
    if (hasMarkup) {
      /* keep markup intact: mask-reveal the whole block */
      gsap.from(el, {
        y: 48,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    } else {
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 115,
        duration: 0.85,
        stagger: 0.07,
        ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    }
  });

  /* ----- draw-on strokes outside the hero ----- */
  gsap.utils.toArray("main .draw").forEach((path) => {
    if (path.closest(".hero")) return;
    prepDraw(path);
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: "power2.inOut",
      scrollTrigger: { trigger: path.closest("section, .ba") || path, start: "top 75%" },
      delay: 0.35,
    });
  });

  /* ----- marquee: infinite, scroll-velocity reactive ----- */
  initMarquee();

  /* ----- problem mascot: gentle settle ----- */
  gsap.from(".problem__mascot svg", {
    y: 40,
    rotate: -8,
    transformOrigin: "50% 100%",
    duration: 1.1,
    ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".problem__layout", start: "top 75%" },
  });
  gsap.to(".problem__cloud", {
    y: -6,
    repeat: -1,
    yoyo: true,
    duration: 2.2,
    ease: "sine.inOut",
  });

  /* ----- cards: stagger with tiny rotation settle ----- */
  ScrollTrigger.batch(".problem__cards .card, .pricing__grid .price", {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      gsap.from(batch, {
        y: 46,
        opacity: 0,
        rotate: (i) => (i % 2 ? 1.6 : -1.6),
        transformOrigin: "50% 100%",
        duration: 0.85,
        stagger: 0.1,
        ease: "power3.out",
        overwrite: true,
      }),
  });

  /* ----- hero parallax out ----- */
  gsap.to(".hero__inner", {
    yPercent: -8,
    opacity: 0.25,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "bottom 90%", end: "bottom 30%", scrub: true },
  });
  gsap.to(".hero__blob", {
    yPercent: 18,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ----- horizontal process ----- */
  initProcess();

  /* ----- cta blob drift ----- */
  gsap.to(".cta__blob", {
    yPercent: -24,
    xPercent: 10,
    ease: "none",
    scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
  });

  /* ----- footer giant wordmark rises ----- */
  gsap.from(".footer__giant", {
    yPercent: 45,
    opacity: 0,
    ease: "power2.out",
    scrollTrigger: { trigger: ".footer", start: "top 92%", end: "top 55%", scrub: 0.7 },
  });
}

/* ============================================================
   marquee
   ============================================================ */
function initMarquee() {
  const track = document.getElementById("marquee-track");
  if (!track) return;
  const chunk = track.querySelector(".marquee__chunk");

  /* duplicate until we can loop seamlessly */
  const needed = Math.ceil((window.innerWidth * 2) / chunk.offsetWidth) + 1;
  for (let i = 0; i < needed; i++) track.appendChild(chunk.cloneNode(true));

  let x = 0;
  let speed = 0.55; // px per frame baseline
  let boost = 0;

  ScrollTrigger.create({
    trigger: document.body,
    start: 0,
    end: "max",
    onUpdate: (self) => {
      boost = gsap.utils.clamp(-6, 6, self.getVelocity() / 220);
    },
  });

  gsap.ticker.add(() => {
    x -= speed + Math.abs(boost);
    boost *= 0.94;
    const w = chunk.offsetWidth;
    if (-x >= w) x += w;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
}

/* ============================================================
   process — pinned horizontal scroll (desktop)
   ============================================================ */
function initProcess() {
  const mm = gsap.matchMedia();

  mm.add("(min-width: 861px)", () => {
    const track = document.getElementById("process-track");
    const section = document.getElementById("process");

    const distance = () => track.scrollWidth - window.innerWidth + 80;

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + (distance() + 300),
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    /* steps pop as they pass */
    gsap.utils.toArray(".step").forEach((step) => {
      gsap.from(step, {
        y: 60,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: step,
          containerAnimation: tween,
          start: "left 88%",
        },
      });
    });

    /* dotted line marches along */
    const path = document.getElementById("process-path");
    gsap.to(path, {
      strokeDashoffset: -160,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + (distance() + 300),
        scrub: true,
      },
    });

    return () => {};
  });

  mm.add("(max-width: 860px)", () => {
    initProcessStatic();
  });
}

/* mobile / reduced motion: plain horizontal swipe */
function initProcessStatic() {
  const track = document.getElementById("process-track");
  if (!track) return;
  track.style.width = "auto";
  track.style.overflowX = "auto";
  track.style.paddingBottom = "1rem";
  track.style.webkitOverflowScrolling = "touch";
}
