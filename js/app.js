// app.js
function $(sel){ return document.querySelector(sel); }
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

function getParam(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

function renderHome(){
  const h = $("#homeCards");
  if(!h) return;

  $("#brandTitle").textContent = window.SITE.brand.title;
  $("#brandSubtitle").textContent = window.SITE.brand.subtitle;

  h.innerHTML = window.SITE.sections.map(s => `
    <div class="card">
      <div class="card__title">${esc(s.title)}</div>
      <div class="card__meta">Открыть каталог</div>
      <div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn btn--primary" href="${esc(s.href)}">Выбрать</a>
        <a class="btn btn--ghost" href="${esc(s.href)}">Подробнее</a>
      </div>
    </div>
  `).join("");
}

function renderSection(sectionId){
  const grid = $("#sectionGrid");
  if(!grid) return;

  const section = window.SITE.sections.find(s => s.id === sectionId);
  $("#sectionTitle").textContent = section ? section.title : "Каталог";

  const searchInput = document.getElementById("sectionSearchInput");

  let items = window.SITE.services.filter(x => x.section === sectionId);

  function draw(list){
    grid.innerHTML = list.map(s => `
      <div class="card">
        <div class="card__title">${esc(s.title)}</div>
        <div class="badges">
          ${(s.badges||[]).slice(0,4).map(b => `<span class="badge">${esc(b)}</span>`).join("")}
        </div>
        <div class="card__meta">${esc(s.price || "")}</div>
        <div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn--primary" href="service.html?id=${encodeURIComponent(s.id)}">Подробнее</a>
        </div>
      </div>
    `).join("");
  }

  draw(items);

  if(searchInput){
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase().trim();

      const filtered = items.filter(s => {
      const haystack =
        (s.title || "") + " " +
        (s.lead || "") + " " +
        (s.badges || []).join(" ") + " " +
        (s.blocks || []).flatMap(b => b.items || []).join(" ");

  return haystack.toLowerCase().includes(q);
});

      draw(filtered);
    });
  }
}


function renderService(){
  const root = $("#serviceRoot");
  if(!root) return;

  const id = getParam("id");
  const s = window.SITE.services.find(x => x.id === id);

  if(!s){
    root.innerHTML = `<div class="service"><h1>Услуга не найдена</h1><p class="lead">Проверь ссылку.</p></div>`;
    return;
  }

  $("#svcTitle").textContent = s.title;

  root.innerHTML = `
    <div class="service">
      <div class="badges">
        <span class="badge">${esc((window.SITE.sections.find(sec=>sec.id===s.section)||{}).title || "")}</span>
        ${(s.badges||[]).map(b => `<span class="badge">${esc(b)}</span>`).join("")}
      </div>

      <h1>${esc(s.title)}</h1>
      <p class="lead">${esc(s.lead || "")}</p>

      ${s.price ? `<div class="block"><h3>Цена</h3><p class="lead">${esc(s.price)}</p></div>` : ""}

      ${(s.blocks||[]).map(bl => `
        <div class="block">
          <h3>${esc(bl.h)}</h3>
          ${bl.items && bl.items.length ? `<ul class="list">${bl.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>` : `<p class="small">Контент добавим после согласования логики.</p>`}
        </div>
      `).join("")}

      <div class="block" style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn btn--primary" href="mailto:training@company.ru?subject=${encodeURIComponent("Заявка: "+s.title)}&body=${encodeURIComponent("Услуга: "+s.title)}">Оставить заявку</a>
        <a class="btn btn--ghost" href="${esc(s.section)}.html">Назад в раздел</a>
        <a class="btn btn--ghost" href="index.html">На главную</a>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderHome();

  const page = document.body.getAttribute("data-page");
  if(page === "section") renderSection(document.body.getAttribute("data-section"));
  if(page === "service") renderService();
});

// --- Request form (site-internal UI) ---
const form = document.getElementById("requestForm");
const statusEl = document.getElementById("requestStatus");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    // Можно подставлять выбранную услугу автоматически позже
    // payload.page = location.href;

    statusEl.textContent = "Отправляем...";

    // endpoint можно задать в data.js: window.SITE.requestEndpoint
    const endpoint = window.SITE.requestEndpoint;

    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("bad_status");
        statusEl.textContent = "Заявка отправлена. Спасибо!";
        form.reset();
      } else {
        // Демо-режим (без сервера): сохраняем в LocalStorage
        const key = "center_requests";
        const list = JSON.parse(localStorage.getItem(key) || "[]");
        list.push({ ...payload, createdAt: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(list));

        statusEl.textContent = "Заявка сохранена (демо-режим). Подключим реальную отправку следующим шагом.";
        form.reset();
      }
    } catch (err) {
      statusEl.textContent = "Не получилось отправить. Проверь подключение endpoint или попробуй позже.";
    }
  });
}
