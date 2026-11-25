"use strict";

const siteMenu = document.querySelector(".site-menu");
if (siteMenu) {
  siteMenu.addEventListener("keydown", event => {
    if (event.key === "Escape" && siteMenu.open) {
      siteMenu.open = false;
      siteMenu.querySelector("summary").focus();
    }
  });
  siteMenu.addEventListener("click", event => { if (event.target.closest("a")) siteMenu.open = false; });
  document.addEventListener("click", event => { if (!siteMenu.contains(event.target)) siteMenu.open = false; });
  document.addEventListener("focusin", event => { if (!siteMenu.contains(event.target)) siteMenu.open = false; });
}

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const scenes = [...document.querySelectorAll(".scene")];
let pointerFrame = 0;
let currentTarget;
let mouseX = 0;
let mouseY = 0;
function moveDecoration(target, x, y) {
  const smallX = (x * 5).toFixed(2) + "px";
  const smallY = (y * 4).toFixed(2) + "px";
  target.style.setProperty("--px", (x * 9).toFixed(2) + "px");
  target.style.setProperty("--py", smallY);
  target.style.setProperty("--ax", smallX);
  target.style.setProperty("--ay", smallY);
  target.style.setProperty("--floor-x", smallX);
  target.style.setProperty("--floor-y", smallY);
  target.style.setProperty("--tilt", (x * .65).toFixed(2) + "deg");
  target.style.setProperty("--mx", (x * 3).toFixed(2) + "px");
  target.style.setProperty("--my", (y * 2).toFixed(2) + "px");
}
document.addEventListener("pointermove", event => {
  if (reduceMotion.matches || !finePointer.matches || event.pointerType === "touch") return;
  const target = event.target.closest(".class-card, .header-contact, .scene");
  if (target !== currentTarget) {
    if (currentTarget) moveDecoration(currentTarget, 0, 0);
    currentTarget = target;
  }
  if (!target) return;
  mouseX = event.clientX;
  mouseY = event.clientY;
  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = 0;
    if (!currentTarget) return;
    const bounds = currentTarget.getBoundingClientRect();
    moveDecoration(currentTarget, (mouseX - bounds.left) / bounds.width * 2 - 1, (mouseY - bounds.top) / bounds.height * 2 - 1);
  });
}, { passive: true });
document.addEventListener("pointerout", event => {
  if (!event.relatedTarget && currentTarget) {
    moveDecoration(currentTarget, 0, 0);
    currentTarget = null;
  }
});
let scrollFrame = 0;
function drawOnScroll() {
  scrollFrame = 0;
  if (reduceMotion.matches) return;
  const height = window.innerHeight;
  for (const scene of scenes) {
    const rect = scene.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > height) continue;
    const travel = Math.max(0, Math.min(1, (height - rect.top) / (height * .57 + rect.height * .32)));
    scene.style.setProperty("--trail-gap", (1 - travel).toFixed(3));
    if (scene.classList.contains("hero")) scene.style.setProperty("--scroll-x", Math.min(18, Math.max(0,-rect.top) * .075).toFixed(2) + "px");
  }
}
function scheduleDrawing() { if (!scrollFrame) scrollFrame = requestAnimationFrame(drawOnScroll); }
window.addEventListener("scroll", scheduleDrawing, { passive: true });
window.addEventListener("resize", scheduleDrawing, { passive: true });
reduceMotion.addEventListener("change", scheduleDrawing);
scheduleDrawing();
