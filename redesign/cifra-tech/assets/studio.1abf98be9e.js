"use strict";
const select = (selector, root = document) => root.querySelector(selector);
const selectAll = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const fine = matchMedia("(pointer: fine)");
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function setupHeader() {
  const button = select(".menu-toggle");
  const nav = select(".nav");
  function close(restore = false) {
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Открыть меню");
    nav.classList.remove("open");
    if (restore) button.focus();
  }
  button.addEventListener("click", () => {
    if (nav.classList.contains("open")) return close(true);
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Закрыть меню");
    nav.classList.add("open");
    select("a", nav).focus();
  });
  nav.addEventListener("click", () => close());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) close(true);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".header")) close();
  });
  document.addEventListener("focusin", (event) => {
    if (!event.target.closest(".header")) close();
  });
  matchMedia("(min-width:761px)").addEventListener("change", () => close());
  const contact = select(".contact-button");
  function resetContact() {
    contact.style.removeProperty("--mx");
    contact.style.removeProperty("--my");
  }
  contact.addEventListener("pointermove", (event) => {
    if (reduced.matches || !fine.matches || event.pointerType === "touch") return;
    const box = contact.getBoundingClientRect();
    contact.style.setProperty("--mx", ((event.clientX - box.left) / box.width * 5 - 2.5).toFixed(2) + "px");
    contact.style.setProperty("--my", ((event.clientY - box.top) / box.height * 4 - 2).toFixed(2) + "px");
  });
  contact.addEventListener("pointerleave", resetContact);
  reduced.addEventListener("change", resetContact);
}

function setupScenes() {
  const hero = select(".hero-art");
  const layers = selectAll("[data-scroll]");
  let frame = 0;
  let pointerX = 0, pointerY = 0;
  function draw() {
    frame = 0;
    const h = document.documentElement.clientHeight;
    if (hero) {
      const p = reduced.matches ? 0 : clamp(window.scrollY / Math.max(160, hero.offsetHeight * .7), 0, 1);
      hero.style.setProperty("--dx", (pointerX * 15).toFixed(2) + "px");
      hero.style.setProperty("--dy", (pointerY * 10).toFixed(2) + "px");
      hero.style.setProperty("--turn", (pointerX * 4 + pointerY * .65).toFixed(2) + "deg");
      hero.style.setProperty("--front-x", (p * 53).toFixed(2) + "px");
      hero.style.setProperty("--front-y", (p * -40).toFixed(2) + "px");
      hero.style.setProperty("--rear-x", (p * -25).toFixed(2) + "px");
      hero.style.setProperty("--rear-y", (p * 19).toFixed(2) + "px");
      hero.style.setProperty("--blade", (p * 14).toFixed(2) + "deg");
    }
    for (const el of layers) {
      const b = el.getBoundingClientRect();
      const p = reduced.matches ? .5 : clamp((h - b.top) / (h + b.height), 0, 1);
      el.style.setProperty("--photo-y", ((p - .5) * 6.3).toFixed(3) + "%");
      el.style.setProperty("--rule-scale", (.45 + p * .55).toFixed(3));
      el.style.setProperty("--pass-x", ((.6 - p) * 35).toFixed(2) + "px");
      el.style.setProperty("--pass-tilt", ((.6 - p) * -18).toFixed(2) + "deg");
      el.style.setProperty("--rays", (.35 + p * .65).toFixed(3));
      for (const part of selectAll(".section-element", el)) {
        part.style.setProperty("--element-x", ((1 - p) * Number(part.dataset.shift)).toFixed(2) + "px");
      }
    }
  }
  function queue() { if (!frame) frame = requestAnimationFrame(draw); }
  if (hero) {
    hero.addEventListener("pointermove", (event) => {
      if (reduced.matches || !fine.matches || event.pointerType === "touch") return;
      const b = hero.getBoundingClientRect();
      pointerX = clamp((event.clientX - b.left) / b.width * 2 - 1, -1, 1);
      pointerY = clamp((event.clientY - b.top) / b.height * 2 - 1, -1, 1);
      queue();
    });
    hero.addEventListener("pointerleave", () => { pointerX = pointerY = 0; queue(); });
  }
  reduced.addEventListener("change", () => { pointerX = pointerY = 0; queue(); });
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("pageshow", queue);
  document.addEventListener("toggle", queue, true);
  new ResizeObserver(queue).observe(document.body);
  draw();
}

function revealRepair() {
  const key = location.hash.slice(1);
  const target = key ? document.getElementById(key) : null;
  if (target?.matches("details.repair-detail")) {
    target.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }
}
window.addEventListener("hashchange", revealRepair);

const kinds = [
  { key:"camera", label:"Фотокамера", model:"Например, Nikon Z6", symptoms:["Не включается", "Пятна на снимках", "Ошибка на экране"], kit:["Аккумулятор", "Объектив", "Крышка корпуса", "Зарядное устройство"] },
  { key:"lens", label:"Объектив", model:"Например, Tamron 28–75 мм", symptoms:["Не работает автофокус", "Заедает кольцо зума", "Камера не видит объектив"], kit:["Передняя крышка", "Задняя крышка", "Бленда", "Фильтр"] },
  { key:"flash", label:"Вспышка", model:"Например, Nikon SB-700", symptoms:["Нет импульса", "Не синхронизируется", "Не включается"], kit:["Подставка", "Рассеиватель", "Чехол", "Элементы питания"] },
  { key:"video", label:"Видео- или кинокамера", model:"Укажите марку или обозначение на корпусе", symptoms:["Не идёт запись", "Не включается", "Ошибка на экране"], kit:["Аккумулятор", "Объектив", "Зарядное устройство", "Кабель"] },
  { key:"action", label:"Экшн-камера", model:"Например, GoPro HERO7", symptoms:["Не заряжается", "Зависает", "Повреждён дисплей"], kit:["Аккумулятор", "Защитный бокс", "Крепление", "Кабель"] },
  { key:"laptop", label:"Ноутбук", model:"Укажите марку или обозначение на корпусе", symptoms:["Не включается", "Перегревается", "Повреждён дисплей"], kit:["Блок питания", "Кабель", "Чехол"] },
  { key:"other", label:"Другая техника", model:"Укажите марку или название устройства", symptoms:["Не включается", "Работает с перебоями"], kit:["Блок питания", "Кабель", "Чехол"] }
];

function makeSelector(onChoose) {
  const trigger = select("#tech-trigger"), list = select("#tech-options");
  let current = -1, active = 0;
  const options = kinds.map((kind, i) => {
    const row = document.createElement("div");
    row.id = "tech-choice-" + i;
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", "false");
    row.textContent = kind.label;
    row.addEventListener("pointerdown", e => { if (e.pointerType === "mouse") e.preventDefault(); });
    row.addEventListener("click", () => { choose(i); close(); trigger.focus({preventScroll:true}); });
    list.append(row);
    return row;
  });
  function choose(i) {
    current = i;
    options.forEach((el, n) => el.setAttribute("aria-selected", String(n === current)));
    select("#tech-value").textContent = current < 0 ? "Выберите технику" : kinds[i].label;
    onChoose(kinds[i]);
  }
  function mark(i) {
    active = clamp(i, 0, options.length - 1);
    options.forEach((el, n) => el.toggleAttribute("data-active", n === active));
    trigger.setAttribute("aria-activedescendant", options[active].id);
    const row = options[active];
    list.scrollTop += Math.min(0, row.getBoundingClientRect().top - list.getBoundingClientRect().top - 4);
    list.scrollTop += Math.max(0, row.getBoundingClientRect().bottom - list.getBoundingClientRect().bottom + 4);
  }
  function open() {
    trigger.focus({preventScroll:true});
    trigger.setAttribute("aria-expanded", "true");
    list.hidden = false;
    mark(Math.max(0, current));
    const box = list.getBoundingClientRect();
    if (box.bottom > innerHeight - 8) window.scrollBy(0, Math.min(box.bottom - innerHeight + 8, Math.max(0, trigger.getBoundingClientRect().top - select(".header").offsetHeight - 8)));
  }
  function close() {
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
    list.hidden = true;
  }
  trigger.addEventListener("click", () => list.hidden ? open() : close());
  trigger.addEventListener("keydown", event => {
    const key = event.key;
    if (key === "Escape" || key === "Tab") { close(); return; }
    if (["ArrowDown","ArrowUp","Home","End"].includes(key)) {
      event.preventDefault();
      if (list.hidden) { open(); if (key === "End") mark(options.length - 1); return; }
      mark(key === "Home" ? 0 : key === "End" ? options.length - 1 : active + (key === "ArrowDown" ? 1 : -1));
    } else if ((key === " " || key === "Enter") && !list.hidden) {
      event.preventDefault(); choose(active); close();
    } else if (key.length === 1 && key !== " " && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const idx = kinds.findIndex(k => k.label.toLocaleLowerCase("ru").startsWith(key.toLocaleLowerCase("ru")));
      if (idx >= 0) { event.preventDefault(); if (list.hidden) open(); mark(idx); }
    }
  });
  document.addEventListener("pointerdown", e => { if (!list.hidden && !trigger.contains(e.target) && !list.contains(e.target)) close(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !list.hidden) { close(); trigger.focus({preventScroll:true}); }
  });
  trigger.addEventListener("blur", () => {
    requestAnimationFrame(() => { if (document.activeElement !== trigger && !list.contains(document.activeElement)) close(); });
  });
  return { choose, close, current: () => kinds[current] };
}

function setupWizard() {
  const form = select("#brief-form");
  if (!form) return;
  const steps = selectAll("[data-step]", form), result = select("#result");
  const model = select("#model"), unknown = select("#unknown"), symptom = select("#symptom");
  const extra = select("#kit-extra"), summary = select("#summary");
  let step = 0, lastParts = [], previousKind = "", symptomKind = "";
  let kitMemory = new Map();
  let view = 0, lastPress;
  // The next view can place another action under the same finger or pointer.
  select(".wizard").addEventListener("click", event => {
    if (!event.detail || !event.target.closest("button,a")) return;
    const now = performance.now();
    if (lastPress && view !== lastPress.view && now - lastPress.time < 380 &&
        Math.hypot(event.clientX - lastPress.x, event.clientY - lastPress.y) < 12) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    lastPress = {view,time:now,x:event.clientX,y:event.clientY};
  },true);

  function error(id, note = "") {
    const element = select("#" + (id === "tech" ? "tech-trigger" : id));
    select("#"+id+"-error").textContent = note;
    element.setAttribute("aria-invalid", String(Boolean(note)));
    if (id === "tech") element.setAttribute("aria-describedby", "tech-error");
    return element;
  }
  function changeKind(kind) {
    error("tech");
    if (!kind) { previousKind = ""; return; }
    model.placeholder = kind.model;
    if (kind.key === previousKind) return;
    if (previousKind) kitMemory.set(previousKind, selectAll("#kit-options input:checked").map(el=>el.value));
    const checks = select("#kit-options");
    checks.replaceChildren();
    for (const name of kind.kit) {
      const label = document.createElement("label"), input = document.createElement("input");
      label.className = "check";
      input.type = "checkbox"; input.value = name; input.checked = (kitMemory.get(kind.key) || []).includes(name);
      label.append(input, document.createTextNode(name)); checks.append(label);
    }
    select("#symptom-examples").replaceChildren();
    for (const label of kind.symptoms) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = label;
      b.addEventListener("click", () => {
        const existing = symptom.value.trim();
        if (!existing.includes(label)) symptom.value = existing ? existing + (/[.!?]$/.test(existing) ? " " : ". ") + label : label;
        symptomKind = kind.key; error("symptom");
      });
      select("#symptom-examples").append(b);
    }
    if (previousKind && symptomKind === previousKind && kinds.find(k=>k.key===previousKind).symptoms.includes(symptom.value)) symptom.value = "";
    previousKind = kind.key;
  }
  const picker = makeSelector(changeKind);
  model.addEventListener("input", () => error("model"));
  unknown.addEventListener("change", () => error("model"));
  symptom.addEventListener("input", () => { symptomKind = ""; error("symptom"); });
  function focusPanel(item) {
    item.focus({preventScroll:true});
    const header = select(".header").getBoundingClientRect().bottom;
    const box = item.getBoundingClientRect();
    if (box.top < header + 12 || box.bottom > innerHeight - 12) item.scrollIntoView({block:"start"});
  }
  function show(index, moveFocus=true) {
    view++; step = index; picker.close();
    result.hidden = true; form.hidden = false;
    steps.forEach((pane,i)=>pane.hidden = i !== step);
    selectAll(".form-progress i").forEach((bar,i)=>bar.classList.toggle("done",i<=step));
    if (moveFocus) focusPanel(select("legend",steps[index]));
  }
  function validate() {
    let first;
    if (step === 0) {
      if (!picker.current()) first = error("tech","Выберите вид техники.");
      if (!model.value.trim() && !unknown.checked) {
        const input = error("model","Укажите марку или отметьте, что точная модель неизвестна.");
        first = first || input;
      }
    }
    if (step === 1 && !symptom.value.trim()) first = error("symptom","Добавьте симптом или выберите пример выше.");
    if (first) { focusPanel(first); return false; }
    return true;
  }
  function compose() {
    const device = picker.current();
    let identity = model.value.trim() || "маркировка неизвестна";
    if (unknown.checked && model.value.trim()) identity += ", точную модель нужно уточнить";
    const kit = [device.label, ...selectAll("#kit-options input:checked").map(input=>input.value), extra.value.trim()].filter(Boolean);
    return [
      ["Техника",device.label],
      ["Марка или модель",identity],
      ["Симптом",symptom.value.trim()],
      ["Планирую передать",kit.join(", ")],
      ["Вопрос",unknown.checked || device.key === "other" ? "Поможете уточнить модель и возможность приёма? Что взять с собой?" : "Принимаете ли вы эту модель с таким симптомом? Что взять с собой?"]
    ].map(([label,value])=>label+": "+value);
  }
  function finish() {
    const parts = compose();
    let draft = summary.value;
    if (!lastParts.length || draft === lastParts.join("\n")) draft = parts.join("\n");
    else {
      parts.forEach((line,i)=>{
        if (line === lastParts[i]) return;
        if (draft.includes(lastParts[i])) draft = draft.replace(lastParts[i], () => line);
        else draft = draft.trimEnd() + "\n" + line;
      });
    }
    lastParts = parts; summary.value = draft;
    view++; form.hidden = true; result.hidden = false;
    select("#copy-status").textContent = "";
    focusPanel(select("#result-title"));
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!validate()) return;
    if (step === 2) finish(); else show(step+1);
  });
  selectAll("[data-back]",form).forEach(b=>b.addEventListener("click",()=>show(Math.max(0,step-1))));
  select("#edit").addEventListener("click",()=>show(0));
  select("#restart").addEventListener("click",()=>{
    form.reset(); kitMemory = new Map(); previousKind = symptomKind = "";
    picker.choose(-1); select("#kit-options").replaceChildren(); select("#symptom-examples").replaceChildren();
    model.placeholder = "Например, Nikon Z6"; lastParts = []; summary.value = "";
    ["tech","model","symptom"].forEach(id=>error(id)); show(0);
  });
  select("#copy").addEventListener("click",async()=>{
    const status = select("#copy-status");
    if (!summary.value.trim()) { status.textContent = "Введите текст для копирования."; focusPanel(summary); return; }
    let copied = false;
    try { await navigator.clipboard.writeText(summary.value); copied = true; }
    catch {
      focusPanel(summary); summary.select();
      try { copied = document.execCommand("copy"); } catch { copied = false; }
    }
    status.textContent = copied ? "Текст скопирован." : "Текст выделен. Его можно скопировать через меню устройства.";
  });
  const key = new URLSearchParams(location.search).get("tech");
  picker.choose(kinds.findIndex(k=>k.key===key));
  show(0,false);
}

setupHeader();
setupScenes();
revealRepair();
setupWizard();
