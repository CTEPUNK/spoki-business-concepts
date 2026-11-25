"use strict";

// The marked walking phrase grows a pair of prints on each beat.
const steps = [[42,174,54],[100,120,58],[172,110,117],[221,160,132],[275,167,8],[263,100,17],[339,72,101],[469,89,36]];
byId("floor-steps").innerHTML = steps.map(([x,y,angle]) =>
  '<g class="floor-step" transform="translate(' + x + ' ' + y + ')"><circle r="3"/><g class="sole-pair" transform="rotate(' + angle +
  ')"><use href="./assets/ui.svg#sole" x="-13" y="-16" width="9" height="20"/><use href="./assets/ui.svg#sole" x="4" y="-26" width="9" height="20"/></g></g>'
).join("");
const stepMarks = [...document.querySelectorAll(".floor-step")];
const beats = [];
const tap = byId("beat-tap");
function resetRhythm() {
  beats.length = 0;
  stepMarks.forEach(mark => mark.classList.remove("active","just-added"));
  byId("beat-status").textContent = "0 из 8 долей";
  tap.querySelector("span").textContent = "Отбить долю";
  byId("beat-reset").hidden = true;
}
tap.addEventListener("click", () => {
  if (beats.length === steps.length) {
    resetRhythm();
    return;
  }
  const mark = stepMarks[beats.length];
  beats.push(performance.now());
  mark.classList.add("active","just-added");
  byId("beat-reset").hidden = false;
  if (beats.length < steps.length) {
    byId("beat-status").textContent = beats.length + " из 8 долей";
    return;
  }
  const tempo = Math.round(60000 * (beats.length - 1) / Math.max(1, beats[beats.length - 1] - beats[0]));
  byId("beat-status").textContent = "8 из 8. Рисунок готов!" + (tempo >= 35 && tempo <= 260 ? " Ваш темп — " + tempo + " уд/мин." : "");
  tap.querySelector("span").textContent = "Повторить";
  byId("beat-reset").hidden = true;
});
byId("beat-reset").addEventListener("click", () => { resetRhythm(); tap.focus(); });
byId("beat-controls").hidden = false;
