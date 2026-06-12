import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initAnimations, runLoader } from "./animations.js";
import { initMascot } from "./scene.js";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* anchor links via lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    else target.scrollIntoView({ behavior: "smooth" });
  });
});

/* ---------------- nav state ---------------- */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------------- mobile menu ---------------- */
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");
let menuOpen = false;

function openMenu() {
  menuOpen = true;
  burger.setAttribute("aria-expanded", "true");
  menu.setAttribute("aria-hidden", "false");
  gsap.set(menu, { visibility: "visible" });
  gsap.fromTo(menu, { clipPath: "circle(0% at 92% 5%)" }, { clipPath: "circle(150% at 92% 5%)", duration: 0.7, ease: "power3.inOut" });
  gsap.fromTo(".menu__links a", { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, delay: 0.25, duration: 0.6, ease: "power3.out" });
  lenis?.stop();
}
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  burger.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-hidden", "true");
  gsap.to(menu, {
    clipPath: "circle(0% at 92% 5%)", duration: 0.55, ease: "power3.inOut",
    onComplete: () => gsap.set(menu, { visibility: "hidden" }),
  });
  lenis?.start();
}
burger.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));

/* ---------------- magnetic buttons ---------------- */
if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 0.35;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power3.out" });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
    });
  });
}

/* ---------------- FAQ accordion ---------------- */
document.querySelectorAll(".faq__item").forEach((item) => {
  const summary = item.querySelector("summary");
  const body = item.querySelector(".faq__body");
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = item.hasAttribute("open");
    if (isOpen) {
      gsap.to(body, {
        height: 0, opacity: 0, duration: 0.4, ease: "power3.inOut",
        onComplete: () => { item.removeAttribute("open"); gsap.set(body, { clearProps: "all" }); },
      });
    } else {
      item.setAttribute("open", "");
      gsap.set(body, { height: "auto" });
      gsap.from(body, { height: 0, opacity: 0, duration: 0.5, ease: "power3.out", onComplete: () => gsap.set(body, { clearProps: "height" }) });
    }
  });
});

/* ---------------- before / after slider ---------------- */
(function initBA() {
  const frame = document.getElementById("ba-frame");
  const before = document.getElementById("ba-before");
  const handle = document.getElementById("ba-handle");
  if (!frame) return;
  const viewport = frame.querySelector(".ba__viewport");

  const setPct = (pct) => {
    pct = Math.max(2, Math.min(98, pct));
    before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = `${pct}%`;
    handle.setAttribute("aria-valuenow", Math.round(pct));
  };
  setPct(50);

  let dragging = false;
  const fromEvent = (e) => {
    const r = viewport.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    return ((cx - r.left) / r.width) * 100;
  };
  const start = (e) => { dragging = true; setPct(fromEvent(e)); };
  const move = (e) => { if (dragging) setPct(fromEvent(e)); };
  const end = () => (dragging = false);

  viewport.addEventListener("pointerdown", start);
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerup", end);

  handle.addEventListener("keydown", (e) => {
    const now = parseFloat(handle.getAttribute("aria-valuenow"));
    if (e.key === "ArrowLeft") setPct(now - 4);
    if (e.key === "ArrowRight") setPct(now + 4);
  });

  /* scroll-in wipe: before-layer sweeps from full to half */
  if (!reduceMotion) {
    const wipe = { pct: 98 };
    gsap.to(wipe, {
      pct: 50,
      ease: "power2.out",
      scrollTrigger: { trigger: frame, start: "top 80%", end: "top 35%", scrub: 0.6 },
      onUpdate: () => { if (!dragging) setPct(wipe.pct); },
    });
  }
})();

/* ---------------- boot sequence ---------------- */
initAnimations({ reduceMotion });

let mascot = null;
try {
  mascot = initMascot(document.getElementById("mascot-canvas"), { reduceMotion });
} catch (err) {
  console.warn("WebGL mascot unavailable, using fallback.", err);
  fallbackMascot();
}

runLoader({
  reduceMotion,
  onHeroReady: () => mascot?.enter(),
});

function fallbackMascot() {
  const stage = document.querySelector(".hero__stage");
  const holder = document.createElement("div");
  holder.style.cssText = "position:absolute;inset:8%;display:grid;place-items:center;";
  holder.innerHTML = `
    <svg viewBox="0 0 200 220" width="78%" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="208" rx="56" ry="9" fill="#121212" opacity=".08"/>
      <path d="M100 12c-5 0-9 4-9 9v23C63 50 44 73 44 100c0 31 25 54 56 54s56-23 56-54c0-27-19-50-47-56V21c0-5-4-9-9-9z" fill="#F59A13" stroke="#121212" stroke-width="7" stroke-linejoin="round"/>
      <ellipse cx="81" cy="100" rx="13" ry="15" fill="#fff" stroke="#121212" stroke-width="5"/>
      <ellipse cx="121" cy="100" rx="13" ry="15" fill="#fff" stroke="#121212" stroke-width="5"/>
      <circle cx="84" cy="101" r="5" fill="#121212"/>
      <circle cx="118" cy="101" r="5" fill="#121212"/>
      <path d="M88 130c7 6 17 6 24 0" stroke="#121212" stroke-width="5" stroke-linecap="round"/>
      <circle cx="152" cy="38" r="7" fill="#F59A13" stroke="#121212" stroke-width="4"/>
      <circle cx="168" cy="22" r="5" fill="#F59A13" stroke="#121212" stroke-width="4"/>
    </svg>`;
  stage.appendChild(holder);
}
