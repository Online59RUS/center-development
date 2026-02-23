// app.js
function formatPrice(p) {
  const s = String(p ?? "").trim();
  if (!s) return "";
  if (/[₽]|руб|r\./i.test(s)) return s.replace(/\s+/g, " ").trim();
  const n = Number(s.replace(/[^\d]/g, ""));
  if (!n) return s;
  return n.toLocaleString("ru-RU") + " ₽";
}

function $(sel) {
  return document.querySelector(sel);
}
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}

function getParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

function renderHome() {
  const h = $("#homeCards");
  if (!h) return;

  $("#brandTitle").textContent = window.SITE.brand.title;
  $("#brandSubtitle").textContent = window.SITE.brand.subtitle;

  h.innerHTML = window.SITE.sections
    .map(
      (s) => `
    <div class="card">
      <div class="card__title">${esc(s.title)}</div>
      <div class="card__meta">Открыть каталог</div>
      <div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn btn--primary" href="${esc(s.href)}">Выбрать</a>
        <a class="btn btn--ghost" href="${esc(s.href)}">Подробнее</a>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderSection(sectionId) {
  const grid = $("#sectionGrid");
  if (!grid) return;

  const section = window.SITE.sections.find((s) => s.id === sectionId);
  $("#sectionTitle").textContent = section ? section.title : "Каталог";

  const searchInput = document.getElementById("sectionSearchInput");
  const items = window.SITE.services.filter((x) => x.section === sectionId);

  function draw(list) {
    grid.innerHTML = list
      .map(
        (s) => `
      <div class="card">
        <div class="card__title">${esc(s.title)}</div>
        <div class="badges">
          ${(s.badges || [])
            .slice(0, 4)
            .map((b) => `<span class="badge">${esc(b)}</span>`)
            .join("")}
        </div>
        <div class="card__meta">${esc(formatPrice(s.price))}</div>
        <div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn--primary" href="service.html?id=${encodeURIComponent(s.id)}">Подробнее</a>
        </div>
      </div>
    `,
      )
      .join("");
  }

  draw(items);

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase().trim();

      const filtered = items.filter((s) => {
        const haystack =
          (s.title || "") +
          " " +
          (s.lead || "") +
          " " +
          (s.badges || []).join(" ") +
          " " +
          (s.keywords || []).join(" ") +
          " " +
          (s.blocks || []).flatMap((b) => b.items || []).join(" ");

        return haystack.toLowerCase().includes(q);
      });

      draw(filtered);
    });
  }
}

function renderService() {
  const root = $("#serviceRoot");
  if (!root) return;

  const id = getParam("id");
  const s = window.SITE.services.find((x) => x.id === id);

  if (!s) {
    root.innerHTML = `<div class="service"><h1>Услуга не найдена</h1><p class="lead">Проверь ссылку.</p></div>`;
    return;
  }

  $("#svcTitle").textContent = s.title;

  root.innerHTML = `
    <div class="service">
      <div class="badges">
        <span class="badge">${esc((window.SITE.sections.find((sec) => sec.id === s.section) || {}).title || "")}</span>
        ${(s.badges || []).map((b) => `<span class="badge">${esc(b)}</span>`).join("")}
      </div>

      <h1>${esc(s.title)}</h1>
      <p class="lead">${esc(s.lead || "Описание добавим после согласования с владельцем сервиса.")}</p>

      ${s.price ? `<div class="block"><h3>Цена</h3><p class="lead">${esc(formatPrice(s.price))}</p></div>` : ""}

      ${(s.blocks || [])
        .map(
          (bl) => `
        <div class="block">
          <h3>${esc(bl.h)}</h3>
          ${
            bl.items && bl.items.length
              ? `<ul class="list">${bl.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
              : `<p class="small">Контент добавим после согласования логики.</p>`
          }
        </div>
      `,
        )
        .join("")}

      <div class="block" style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn btn--primary" href="index.html#request?service=${encodeURIComponent(s.title)}">Оставить заявку</a>
        <a class="btn btn--ghost" href="${esc(s.section)}.html">Назад в раздел</a>
        <a class="btn btn--ghost" href="index.html">На главную</a>
      </div>
    </div>
  `;
}

function autofillServiceInForm(form) {
  if (!location.hash.startsWith("#request")) return;

  const qs = location.hash.split("?")[1] || "";
  const params = new URLSearchParams(qs);
  const svc = params.get("service");

  if (svc) {
    const serviceInput = form.querySelector('input[name="service"]');
    if (serviceInput) serviceInput.value = svc;
  }

  const anchor = document.getElementById("request");
  if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initGlobalSearch() {
  const input = document.getElementById("globalSearchInput");
  const out = document.getElementById("globalResults");
  if (!input || !out) return;

  const services = window.SITE.services || [];

  function draw(list) {
    out.innerHTML = list
      .map(
        (s) => `
      <div class="card">
        <div class="card__title">${esc(s.title)}</div>
        <div class="badges">
          <span class="badge">${esc((window.SITE.sections.find((sec) => sec.id === s.section) || {}).title || "")}</span>
          ${(s.badges || [])
            .slice(0, 3)
            .map((b) => `<span class="badge">${esc(b)}</span>`)
            .join("")}
        </div>
        <div class="card__meta">${esc(formatPrice(s.price))}</div>
        <div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn--primary" href="service.html?id=${encodeURIComponent(s.id)}">Подробнее</a>
        </div>
        </div>
    `,
      )
      .join("");
  }

  out.innerHTML = "";

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    if (q.length < 2) {
      out.innerHTML = "";
      return;
    }

    const filtered = services
      .filter((s) => {
        const haystack =
          (s.title || "") +
          " " +
          (s.lead || "") +
          " " +
          (s.badges || []).join(" ") +
          " " +
          (s.keywords || []).join(" ") +
          " " +
          (s.blocks || []).flatMap((b) => b.items || []).join(" ");
        return haystack.toLowerCase().includes(q);
      })
      .slice(0, 12);

    draw(filtered);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Рендер страниц
  renderHome();
  initGlobalSearch();

  const page = document.body.getAttribute("data-page");
  if (page === "section")
    renderSection(document.body.getAttribute("data-section"));
  if (page === "service") renderService();

  // --- Web3Forms submit ---
  const form = document.getElementById("requestForm");
  const statusEl = document.getElementById("requestStatus");
  if (!form || !statusEl) return;

  autofillServiceInForm(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusEl.textContent = "Отправляем...";

    const email = form.querySelector('input[name="email"]')?.value || "";
    const service = form.querySelector('input[name="service"]')?.value || "";

    const formData = new FormData(form);
    formData.append("access_key", "372d1c09-27d3-44a9-97f7-dbd7721d160a");

    formData.append("subject", `Заявка: ${service || "Каталог сервисов"}`);
    formData.append("from_name", "Центр развития - каталог сервисов");
    if (email) formData.append("replyto", email);

    formData.append("page", location.href);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        statusEl.textContent = "Заявка отправлена. Спасибо!";
        form.reset();
      } else {
        statusEl.textContent =
          "Ошибка отправки: " + (result.message || "unknown");
        console.error("Web3Forms error:", result);
      }
    } catch (error) {
      console.error("Network error:", error);
      statusEl.textContent = "Ошибка соединения. Попробуйте позже.";
    }
  });
});
function test(){console.log("x")}
