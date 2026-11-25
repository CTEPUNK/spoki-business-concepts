"use strict";

const byId = (id) => document.getElementById(id);
const spriteUrl = (document.documentElement.dataset.base || "./") + "assets/ui.svg#";
let allLessons = publishedLessons();
let schedulePeriod = tangoSchedule.period;
const pageSize = 3;
const query = new URLSearchParams(location.search);
let selectedLevel = Object.hasOwn(tangoSchedule.levels, query.get("level")) ? query.get("level") : "zero";
let selectedGroup = Object.hasOwn(tangoSchedule.groups, query.get("group")) ? query.get("group") : null;
if (selectedGroup) selectedLevel = tangoSchedule.groups[selectedGroup].level;
let shownCount = pageSize;
let selectedLesson;
let bookingTrigger;

function icon(name, className = "icon") {
  return '<svg class="' + className + '" aria-hidden="true"><use href="' + spriteUrl + name + '"/></svg>';
}

function cardArt(index) {
  const drawing = [
    { line: "M5 50C6 30 48 40 44 5", x: 21, y: 26, angle: 42 },
    { line: "M4 49C26 51 8 14 49 9", x: 18, y: 24, angle: 20 },
    { line: "M8 50C49 44 17 18 48 4", x: 26, y: 24, angle: 13 }
  ][index % 3];
  return '<svg viewBox="0 0 54 56" class="card-art" aria-hidden="true"><path class="trace" d="' + drawing.line +
    '"/><g transform="translate(' + drawing.x + ' ' + drawing.y + ') rotate(' + drawing.angle +
    ')"><use href="' + spriteUrl + 'sole" x="-5" y="-1" width="7" height="15"/><use href="' + spriteUrl + 'sole" x="2" y="-12" width="7" height="15"/></g></svg>';
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
  if (hero && nextFirst) {
    const { group } = nextFirst;
    hero.innerHTML = 'Ближайшее занятие с нуля<strong><span>' + calendarParts(nextFirst).date + ' · ' + group.start +
      '</span><span class="hero-price">' + (group.fee === null ? "Цену уточнит школа" : priceFormat.format(group.fee) + ' ₽ ' + feeUnit(group)) + '</span></strong>';
  } else if (hero) {
    hero.textContent = "Группы для первого урока и для тех, кто уже танцует.";
  }
  const level = tangoSchedule.levels[selectedLevel];
  const scopedTitle = selectedGroup ? tangoSchedule.groups[selectedGroup].title : "";
  const matchesSelection = group => group.level === selectedLevel && (!scopedTitle || group.title === scopedTitle);
  let lessons = allLessons.filter(lesson => matchesSelection(lesson.group) && startsAt(lesson) > now);
  const dated = lessons.length > 0;
  if (!dated) {
    lessons = Object.values(tangoSchedule.groups).filter(matchesSelection).map(group => ({ group, date: null }));
  }
  byId("date-range-text").textContent = dated ? schedulePeriod : "Ближайшую дату уточняет школа";
  byId("level-description").textContent = level.description + (dated ? "" : " Ниже — обычные дни занятий. Уточните дату, время и цену у преподавателя.");
  const scope = byId("group-scope");
  scope.hidden = !selectedGroup;
  scope.querySelector("span").textContent = scopedTitle;
  document.querySelectorAll("[data-level]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.level === selectedLevel)));
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

function selectLevel(level) {
  selectedLevel = level;
  selectedGroup = null;
  shownCount = pageSize;
  const url = new URL(location.href);
  url.searchParams.set("level",level);
  url.searchParams.delete("group");
  history.replaceState(null,"",url);
  renderSchedule();
}
document.querySelectorAll("[data-level]").forEach(button => button.addEventListener("click", () => selectLevel(button.dataset.level)));
byId("clear-group").addEventListener("click", () => {
  selectLevel(selectedLevel);
  document.querySelector('[data-level][aria-pressed="true"]').focus();
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
