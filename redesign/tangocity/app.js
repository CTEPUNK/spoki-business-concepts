"use strict";

const byId = (id) => document.getElementById(id);
const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
const weekFormat = new Intl.DateTimeFormat("ru-RU", { weekday: "long", timeZone: "UTC" });
const priceFormat = new Intl.NumberFormat("ru-RU");
let allLessons = tangoSchedule.days.flatMap(([date, ids]) =>
  ids.map(id => ({ group: tangoSchedule.groups[id], date }))
);
let schedulePeriod = tangoSchedule.period;
const pageSize = 3;
let selectedLevel = "zero";
let shownCount = pageSize;
let selectedLesson;
let bookingTrigger;

function icon(name, className = "icon") {
  return '<svg class="' + className + '" aria-hidden="true"><use href="#' + name + '"/></svg>';
}

function timeRange(group) {
  return group.start + "–" + group.end;
}

function feeUnit(group) {
  return group.units === 2 ? "за 2 урока" : "за 1 урок";
}

function calendarParts(lesson) {
  if (!lesson.date) return { day: "Регулярная группа", date: lesson.group.weekly };
  const utcDate = new Date(lesson.date + "T12:00:00Z");
  const weekday = weekFormat.format(utcDate);
  return { day: weekday.charAt(0).toUpperCase() + weekday.slice(1), date: dayFormat.format(utcDate) };
}

function startsAt(lesson) {
  return Date.parse(lesson.date + "T" + lesson.group.start + ":00+03:00");
}

function cardArt(index) {
  const drawing = [
    { line: "M5 50C6 30 48 40 44 5", x: 21, y: 26, angle: 42 },
    { line: "M4 49C26 51 8 14 49 9", x: 18, y: 24, angle: 20 },
    { line: "M8 50C49 44 17 18 48 4", x: 26, y: 24, angle: 13 }
  ][index % 3];
  return '<svg viewBox="0 0 54 56" class="card-art" aria-hidden="true"><path class="trace" d="' + drawing.line +
    '"/><g transform="translate(' + drawing.x + ' ' + drawing.y + ') rotate(' + drawing.angle +
    ')"><use href="#sole" x="-5" y="-1" width="7" height="15"/><use href="#sole" x="2" y="-12" width="7" height="15"/></g></svg>';
}

function makeCard(lesson, index) {
  const { group, date } = lesson;
  const stamp = calendarParts(lesson);
  const card = document.createElement("article");
  card.className = "class-card";
  card.innerHTML = '<div class="card-heading"><p class="card-day">' + stamp.day + '</p><h3 tabindex="-1">' +
    (date ? '<time datetime="' + date + '">' + stamp.date + '</time>' : stamp.date) + '</h3></div>' +
    cardArt(index) + '<p class="card-time">' + icon("i-clock") + timeRange(group) + '</p>' +
    '<div class="card-body"><p class="card-group">' + group.title + '</p><p class="card-place">' +
    icon("i-pin") + '<span><span>м. Смоленская · зал 1</span><span>Смоленская-Сенная пл., 27с7</span></span></p></div>' +
    '<div class="card-footer"><p class="price">' + (group.fee === null ? 'Уточнить<small>стоимость' : priceFormat.format(group.fee) + ' ₽<small>' + feeUnit(group)) +
    '</small></p><button type="button" class="button primary">Записаться ' + icon("i-arrow","arrow") + '</button></div>';
  const trigger = card.querySelector("button");
  trigger.dataset.lesson = group.title + "/" + (date || "");
  trigger.setAttribute("aria-label", "Записаться: " + group.title + ", " + stamp.date + ", " + group.start);
  trigger.addEventListener("click", () => openBooking(lesson, trigger));
  return card;
}

function renderSchedule(focusIndex) {
  const now = Date.now();
  const nextFirst = allLessons.find(lesson => lesson.group.level === "zero" && startsAt(lesson) > now);
  const hero = byId("hero-next");
  if (nextFirst) {
    const { group } = nextFirst;
    hero.innerHTML = 'Ближайшее занятие с нуля<strong><span>' + calendarParts(nextFirst).date + ' · ' + group.start +
      '</span><span class="hero-price">' + (group.fee === null ? "Цену уточнит школа" : priceFormat.format(group.fee) + ' ₽ ' + feeUnit(group)) + '</span></strong>';
  } else {
    hero.textContent = "Группы для первого урока и для тех, кто уже танцует.";
  }
  const level = tangoSchedule.levels[selectedLevel];
  let lessons = allLessons.filter(lesson => lesson.group.level === selectedLevel && startsAt(lesson) > now);
  const dated = lessons.length > 0;
  if (!dated) {
    lessons = Object.values(tangoSchedule.groups).filter(group => group.level === selectedLevel).map(group => ({ group, date: null }));
  }
  byId("date-range-text").textContent = dated ? schedulePeriod : "Ближайшую дату уточняет школа";
  byId("level-description").textContent = level.description + (dated ? "" : " Ниже — обычные дни занятий. Уточните дату, время и цену у преподавателя.");
  const shown = lessons.slice(0, shownCount);
  const list = byId("class-list");
  list.replaceChildren(...shown.map(makeCard));
  const remaining = lessons.length - shown.length;
  const more = byId("show-more");
  more.hidden = !remaining;
  more.querySelector("span").textContent = "Ещё занятия (" + remaining + ")";
  byId("results-status").textContent = level.name + ". Показано " + shown.length + " из " + lessons.length + ".";
  if (typeof focusIndex === "number") list.children[focusIndex]?.querySelector("h3").focus();
}

document.querySelectorAll("[data-level]").forEach(button => {
  button.addEventListener("click", () => {
    selectedLevel = button.dataset.level;
    shownCount = pageSize;
    document.querySelectorAll("[data-level]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    renderSchedule();
  });
});
byId("show-more").addEventListener("click", () => {
  const firstNew = shownCount;
  shownCount += pageSize;
  renderSchedule(firstNew);
});

const booking = byId("booking");
const messageForm = byId("message-form");
function resetMessage() {
  messageForm.reset();
  messageForm.hidden = false;
  byId("message-result").hidden = true;
  byId("prepared-message").value = "";
  byId("copy-status").textContent = "";
  byId("message-box").open = false;
}

function openBooking(lesson, trigger) {
  if (lesson.date && startsAt(lesson) <= Date.now()) {
    renderSchedule();
    byId("results-status").textContent = "Занятие уже началось. Выберите следующую дату.";
    document.querySelector('[data-level][aria-pressed="true"]').focus();
    return;
  }
  selectedLesson = lesson;
  bookingTrigger = trigger;
  const { group, date } = lesson;
  const teacher = tangoSchedule.teachers[group.teacher];
  const stamp = calendarParts(lesson);
  resetMessage();
  byId("booking-title").textContent = group.title;
  byId("booking-when").innerHTML = (date ? stamp.day + ", " + stamp.date : group.weekly + " · дату уточните") +
    ' <span class="time-with-zone">· ' + timeRange(group) + ' мск</span>';
  const price = byId("booking-price");
  price.textContent = group.fee === null ? "Стоимость этого занятия уточните у преподавателя." : priceFormat.format(group.fee) + " ₽ " + feeUnit(group) + " с человека";
  if (group.units === 2) {
    const note = document.createElement("small");
    note.textContent = "Школа указала цену сразу за два урока. Если планируете прийти на один, уточните разовую оплату у преподавателя.";
    price.append(note);
  }
  byId("booking-instruction").textContent = "Запись ведёт " + teacher.name + ". Назовите группу и дату" +
    (group.level === "zero" ? ". Если вы без пары, уточните наличие места." : ".");
  const phone = byId("booking-call");
  phone.href = "tel:" + teacher.number;
  phone.querySelector(".call-number").textContent = teacher.display;
  booking.showModal();
  booking.scrollTop = 0;
  byId("booking-title").focus({ preventScroll: true });
}

byId("close-booking").addEventListener("click", () => booking.close());
booking.addEventListener("click", event => {
  if (event.target !== booking) return;
  const bounds = booking.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) booking.close();
});
booking.addEventListener("close", () => {
  resetMessage();
  selectedLesson = null;
  bookingTrigger?.focus({ preventScroll: true });
});

messageForm.addEventListener("submit", event => {
  event.preventDefault();
  const { group, date } = selectedLesson;
  const stamp = calendarParts(selectedLesson);
  const visit = date ? stamp.date : "в один из дней по расписанию (" + group.weekly.toLowerCase() + ")";
  const solo = new FormData(messageForm).get("party") === "solo";
  byId("prepared-message").value = "Здравствуйте! " + (solo ? "Хочу записаться" : "Хотим записаться вдвоём") +
    " на танго в группу «" + group.title + "» " + visit + ", " + timeRange(group) + ", зал на Смоленской. " +
    (solo ? "Приду без пары. " : "") + "Подскажите, пожалуйста, есть ли место и сколько будет стоить занятие?";
  messageForm.hidden = true;
  byId("message-result").hidden = false;
  byId("prepared-message").focus();
});
byId("edit-message").addEventListener("click", () => {
  byId("message-result").hidden = true;
  byId("copy-status").textContent = "";
  messageForm.hidden = false;
  (messageForm.querySelector(":checked") || messageForm.querySelector("input")).focus();
});
byId("copy-message").addEventListener("click", async () => {
  const message = byId("prepared-message");
  try {
    await navigator.clipboard.writeText(message.value);
    byId("copy-status").textContent = "Текст скопирован. Отправьте его преподавателю в MAX.";
  } catch {
    message.focus();
    message.select();
    byId("copy-status").textContent = "Текст выделен для копирования.";
  }
});

renderSchedule();
byId("schedule-controls").hidden = false;
byId("schedule-fallback").hidden = true;
function lessonDetails(lesson) {
  const {group, date} = lesson;
  return [date,group.title,group.start,group.end,group.fee,group.units].join("/");
}
function currentCardButton(key) {
  return [...document.querySelectorAll(".class-card button")].find(button => button.dataset.lesson === key);
}
async function syncWithSchool() {
  const live = await fetchSchoolCalendar();
  if (!live || (schedulePeriod === live.period && live.lessons.map(lessonDetails).join("|") === allLessons.map(lessonDetails).join("|"))) return;
  const focusKey = document.activeElement?.dataset.lesson;
  const bookingKey = bookingTrigger?.dataset.lesson;
  const changedBooking = booking.open && (!selectedLesson.date || !live.lessons.some(lesson => lessonDetails(lesson) === lessonDetails(selectedLesson)));
  schedulePeriod = live.period;
  allLessons = live.lessons;
  renderSchedule();
  if (booking.open) {
    bookingTrigger = currentCardButton(bookingKey) || document.querySelector('[data-level][aria-pressed="true"]');
    if (changedBooking) {
      booking.close();
      byId("level-description").textContent += " Школа обновила расписание. Выберите занятие заново.";
    }
  } else if (focusKey) {
    (currentCardButton(focusKey) || document.querySelector('[data-level][aria-pressed="true"]')).focus({preventScroll:true});
  }
}
syncWithSchool();
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !booking.open) renderSchedule();
});

// The marked walking phrase grows a pair of prints on each beat.
const steps = [[42,174,54],[100,120,58],[172,110,117],[221,160,132],[275,167,8],[263,100,17],[339,72,101],[469,89,36]];
byId("floor-steps").innerHTML = steps.map(([x,y,angle]) =>
  '<g class="floor-step" transform="translate(' + x + ' ' + y + ')"><circle r="3"/><g class="sole-pair" transform="rotate(' + angle +
  ')"><use href="#sole" x="-13" y="-16" width="9" height="20"/><use href="#sole" x="4" y="-26" width="9" height="20"/></g></g>'
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
