let token = localStorage.getItem("jwt") || null;

const app = document.getElementById("app");
const nav = document.getElementById("mainNav");
const navToggle = document.getElementById("navToggle");
const logoutButton = document.getElementById("logoutButton");
const toastRegion = document.getElementById("toastRegion");
const API_BASE = "http://localhost:3000";
const apiUrl = `${API_BASE}/data/recipes`;

document.getElementById("currentYear").textContent = new Date().getFullYear();
window.addEventListener("hashchange", render);
window.addEventListener("load", render);

navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Navigation schließen" : "Navigation öffnen");
});

nav.addEventListener("click", event => {
  if (event.target.closest("a")) closeNavigation();
});

logoutButton.addEventListener("click", logout);

function closeNavigation() {
  nav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Navigation öffnen");
}

function render() {
  token = localStorage.getItem("jwt") || null;
  const route = location.hash || "#/";

  updateNavigation(route);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (route === "#/") showOverview();
  else if (route === "#/add") token ? showRecipeForm() : showLoginRequired();
  else if (route === "#/login") showLogin();
  else if (route === "#/register") showRegister();
  else showNotFound();
}

function updateNavigation(route) {
  document.querySelectorAll("[data-auth-only]").forEach(item => item.hidden = !token);
  document.querySelectorAll("[data-guest-only]").forEach(item => item.hidden = Boolean(token));
  document.querySelectorAll("[data-route]").forEach(link => {
    const isActive = link.dataset.route === route;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function authHeader() {
  const currentToken = localStorage.getItem("jwt");
  return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
}

function logout() {
  token = null;
  localStorage.removeItem("jwt");
  showToast("Du wurdest erfolgreich abgemeldet.", "success");
  location.hash = "#/";
  render();
}

window.logout = logout;

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `${icon(type === "error" ? "alert" : "check")}<span>${escapeHtml(message)}</span>`;
  toastRegion.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function setFeedback(element, message, type) {
  element.textContent = message;
  element.className = `feedback ${type}`;
}

function setButtonLoading(button, isLoading, loadingLabel = "Bitte warten …") {
  if (isLoading) {
    button.dataset.originalLabel = button.innerHTML;
    button.textContent = loadingLabel;
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.originalLabel || button.innerHTML;
    button.disabled = false;
  }
}

function showOverview() {
  if (!token) {
    showLandingPage();
    return;
  }

  showDashboardLoading();
  loadRecipes();
}

function showLandingPage() {
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Deine digitale Rezeptsammlung</p>
        <h1 class="display-title">Gute Rezepte.<br><em>Schön bewahrt.</em></h1>
        <p class="lead">Sammle Gerichte, die du liebst, und finde sie genau dann wieder, wenn der nächste Genussmoment ruft.</p>
        <div class="hero-actions">
          <a class="btn" href="#/register">Jetzt loslegen ${icon("arrow")}</a>
          <span class="hero-login-prompt">Bereits dabei?</span>
          <a class="btn btn-secondary" href="#/login">melde dich an</a>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="plate">
          <svg viewBox="0 0 120 120">
            <path d="M28 72c6-25 21-39 45-42-2 9-1 18 8 27-10 17-28 27-53 15Z" />
            <path d="M42 68c11-10 22-19 39-25M50 57c-1-7 1-13 4-18M61 50c2 7 7 12 13 15" />
            <path d="M35 82c17 7 36 5 51-8" />
          </svg>
        </div>
        <div class="visual-note">„Kochen ist Liebe, die man schmecken kann.“</div>
      </div>
    </section>
    <section class="feature-strip" aria-label="Vorteile">
      <div class="feature">${icon("book")}<div><strong>Alles an einem Ort</strong><span>Deine Lieblingsrezepte übersichtlich organisiert.</span></div></div>
      <div class="feature">${icon("spark")}<div><strong>Schnell & einfach</strong><span>Rezepte in wenigen Augenblicken festhalten.</span></div></div>
      <div class="feature">${icon("shield")}<div><strong>Persönlich geschützt</strong><span>Zugriff auf deine Sammlung nach Anmeldung.</span></div></div>
    </section>
  `;
}

function showDashboardLoading() {
  app.innerHTML = `
    <section>
      <div class="dashboard-head">
        <div><p class="eyebrow">Meine Küche</p><h1 class="section-title">Rezeptsammlung</h1></div>
      </div>
      <div class="grid" aria-label="Rezepte werden geladen">
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    </section>
  `;
}

async function loadRecipes() {
  try {
    const response = await fetch(apiUrl, { headers: authHeader() });
    if (!response.ok) throw new Error("Die Rezepte konnten nicht geladen werden.");
    const recipes = await response.json();
    renderDashboard(recipes);
  } catch (error) {
    showState({
      iconName: "alert",
      title: "Keine Verbindung zur Küche",
      text: "Das Backend ist nicht erreichbar. Starte es mit „npm start“ und versuche es erneut.",
      action: `<button class="btn" type="button" id="retryButton">Erneut versuchen ${icon("refresh")}</button>`
    });
    document.getElementById("retryButton").onclick = showOverview;
  }
}

function renderDashboard(recipes) {
  const easyCount = recipes.filter(recipe => recipe.difficulty === "leicht").length;
  const hardCount = recipes.filter(recipe => recipe.difficulty === "schwer").length;

  app.innerHTML = `
    <section>
      <div class="dashboard-head">
        <div>
          <p class="eyebrow">Meine Küche</p>
          <h1 class="section-title">Rezeptsammlung</h1>
        </div>
        <div class="dashboard-tools">
          <label class="search-wrap">
            <span hidden>Rezepte durchsuchen</span>
            ${icon("search")}
            <input id="recipeSearch" type="search" placeholder="Rezepte durchsuchen …" autocomplete="off" />
          </label>
          <a class="btn" href="#/add">${icon("plus")} Rezept hinzufügen</a>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-card"><span>Alle Rezepte</span><strong>${recipes.length}</strong></div>
        <div class="stat-card"><span>Schnell & leicht</span><strong>${easyCount}</strong></div>
        <div class="stat-card"><span>Für besondere Tage</span><strong>${hardCount}</strong></div>
      </div>
      <div class="grid" id="grid"></div>
    </section>
  `;

  const grid = document.getElementById("grid");
  renderRecipeCards(recipes, grid);

  document.getElementById("recipeSearch").addEventListener("input", event => {
    const term = event.target.value.trim().toLocaleLowerCase("de");
    const filtered = recipes.filter(recipe =>
      [recipe.title, recipe.ingredients, recipe.difficulty]
        .some(value => String(value || "").toLocaleLowerCase("de").includes(term))
    );
    renderRecipeCards(filtered, grid, Boolean(term));
  });
}

function renderRecipeCards(recipes, grid, isSearch = false) {
  grid.innerHTML = "";

  if (!recipes.length) {
    grid.innerHTML = `
      <div class="state-card" style="grid-column: 1 / -1; margin: 0; max-width: none;">
        <span class="state-icon">${icon(isSearch ? "search" : "book")}</span>
        <div>
          <h2>${isSearch ? "Kein passendes Rezept" : "Noch ist dein Kochbuch leer"}</h2>
          <p>${isSearch ? "Probiere einen anderen Suchbegriff." : "Speichere dein erstes Lieblingsrezept und starte deine persönliche Sammlung."}</p>
          ${isSearch ? "" : `<a class="btn" href="#/add">${icon("plus")} Erstes Rezept anlegen</a>`}
        </div>
      </div>`;
    return;
  }

  recipes.forEach((recipe, index) => {
    const card = document.createElement("article");
    card.className = "recipe-card";
    card.dataset.difficulty = recipe.difficulty || "mittel";
    card.style.animationDelay = `${Math.min(index * 55, 330)}ms`;
    card.innerHTML = `
      <div class="card-top">
        <span class="recipe-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="difficulty">${escapeHtml(recipe.difficulty || "mittel")}</span>
      </div>
      <h3>${escapeHtml(recipe.title)}</h3>
      <div class="recipe-block">
        <strong>Zutaten</strong>
        <p>${nl2br(escapeHtml(recipe.ingredients || ""))}</p>
      </div>
      <div class="recipe-block instructions">
        <strong>Zubereitung</strong>
        <p>${nl2br(escapeHtml(recipe.instructions || ""))}</p>
      </div>
      <div class="actions">
        <button class="btn btn-small btn-secondary secondary" type="button" data-edit="${escapeAttr(recipe.id)}">${icon("edit")} Bearbeiten</button>
        <button class="btn btn-small btn-icon btn-danger" type="button" data-del="${escapeAttr(recipe.id)}" aria-label="${escapeAttr(recipe.title)} löschen">${icon("trash")}</button>
      </div>
    `;
    grid.appendChild(card);
    card.querySelector("[data-edit]").onclick = () => editRecipe(recipe.id);
    card.querySelector("[data-del]").onclick = () => deleteRecipe(recipe.id, recipe.title);
  });
}

function showLoginRequired() {
  showState({
    iconName: "lock",
    title: "Anmeldung erforderlich",
    text: "Melde dich an, um ein neues Rezept zu erstellen und deine Sammlung zu verwalten.",
    action: `<a href="#/login" class="btn">Zum Login ${icon("arrow")}</a>`
  });
}

function showLogin() {
  if (token) {
    showState({
      iconName: "check",
      title: "Du bist bereits angemeldet",
      text: "Deine persönliche Rezeptsammlung wartet schon auf dich.",
      action: `<a href="#/" class="btn">Zur Übersicht ${icon("arrow")}</a>`
    });
    return;
  }

  app.innerHTML = authTemplate({
    eyebrow: "Willkommen zurück",
    title: "Einloggen",
    description: "Öffne deine persönliche Rezeptsammlung.",
    quote: "Ein gutes Essen bringt gute Menschen zusammen.",
    quoteSource: "Genuss beginnt hier",
    form: `
      <form id="loginForm">
        <div class="field">
          <label for="user">Benutzername</label>
          <input type="text" id="user" placeholder="Dein Benutzername" autocomplete="username" required />
        </div>
        <div class="field">
          <label for="pass">Passwort</label>
          <input type="password" id="pass" placeholder="Dein Passwort" autocomplete="current-password" required />
        </div>
        <button type="submit" class="btn">Einloggen ${icon("arrow")}</button>
        <div id="loginFeedback" class="feedback" aria-live="polite"></div>
      </form>
      <p class="auth-switch">Noch kein Konto? <a href="#/register">Jetzt registrieren</a></p>`
  });

  document.getElementById("loginForm").onsubmit = handleLogin;
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value;
  const feedback = document.getElementById("loginFeedback");
  const button = event.currentTarget.querySelector("button[type='submit']");

  if (!username || !password) {
    setFeedback(feedback, "Bitte fülle Benutzername und Passwort aus.", "error");
    return;
  }

  setButtonLoading(button, true, "Wird angemeldet …");
  try {
    const response = await fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      let message = "Benutzername oder Passwort ist nicht korrekt.";
      try { message = (await response.json()).message || message; } catch {}
      throw new Error(message);
    }
    token = (await response.text()).trim();
    localStorage.setItem("jwt", token);
    setFeedback(feedback, "Login erfolgreich – deine Sammlung wird geöffnet.", "success");
    showToast("Willkommen zurück!", "success");
    setTimeout(() => { location.hash = "#/"; }, 500);
  } catch (error) {
    setFeedback(feedback, error.message || "Login fehlgeschlagen.", "error");
    setButtonLoading(button, false);
  }
}

function showRegister() {
  app.innerHTML = authTemplate({
    eyebrow: "Deine Sammlung",
    title: "Konto erstellen",
    description: "Ein Account, alle Lieblingsrezepte – jederzeit griffbereit.",
    quote: "Rezepte sind Geschichten, die auf dem Teller weitererzählt werden.",
    quoteSource: "Dein Kochbuch",
    form: `
      <form id="registerForm">
        <div class="field">
          <label for="newUser">Benutzername</label>
          <input type="text" id="newUser" placeholder="Wähle einen Benutzernamen" autocomplete="username" required />
        </div>
        <div class="field">
          <label for="newPass">Passwort</label>
          <input type="password" id="newPass" placeholder="Wähle ein sicheres Passwort" autocomplete="new-password" minlength="4" required />
          <span class="field-hint">Mindestens 4 Zeichen</span>
        </div>
        <button type="submit" class="btn">Konto erstellen ${icon("arrow")}</button>
        <div id="registerFeedback" class="feedback" aria-live="polite"></div>
      </form>
      <p class="auth-switch">Schon registriert? <a href="#/login">Zum Login</a></p>`
  });

  document.getElementById("registerForm").onsubmit = handleRegister;
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById("newUser").value.trim();
  const password = document.getElementById("newPass").value;
  const feedback = document.getElementById("registerFeedback");
  const button = event.currentTarget.querySelector("button[type='submit']");

  if (!username || !password) {
    setFeedback(feedback, "Bitte fülle alle Felder aus.", "error");
    return;
  }
  if (password.length < 4) {
    setFeedback(feedback, "Das Passwort muss mindestens 4 Zeichen lang sein.", "error");
    return;
  }

  setButtonLoading(button, true, "Konto wird erstellt …");
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      let message = "Registrierung fehlgeschlagen.";
      try { message = (await response.json()).message || message; } catch {}
      throw new Error(message);
    }
    setFeedback(feedback, "Konto erstellt – du kannst dich jetzt einloggen.", "success");
    showToast("Dein Konto wurde erstellt.", "success");
    setTimeout(() => { location.hash = "#/login"; }, 700);
  } catch (error) {
    setFeedback(feedback, error.message || "Registrierung fehlgeschlagen.", "error");
    setButtonLoading(button, false);
  }
}

function authTemplate({ eyebrow, title, description, quote, quoteSource, form }) {
  return `
    <section class="auth-shell">
      <div class="auth-card">
        <aside class="auth-art" aria-hidden="true">
          <p class="auth-quote">„${quote}“<span>${quoteSource}</span></p>
        </aside>
        <div class="auth-form">
          <p class="eyebrow">${eyebrow}</p>
          <h1 class="section-title">${title}</h1>
          <p>${description}</p>
          ${form}
        </div>
      </div>
    </section>`;
}

function showRecipeForm(recipe = null) {
  const editing = Boolean(recipe);
  app.innerHTML = `
    <section class="panel-layout">
      <aside class="panel-intro">
        <p class="eyebrow">${editing ? "Rezept verfeinern" : "Neue Idee"}</p>
        <h1 class="section-title">${editing ? "Rezept bearbeiten" : "Rezept hinzufügen"}</h1>
        <p>${editing ? "Passe Zutaten, Zubereitung oder Schwierigkeitsgrad an." : "Halte Zutaten und Zubereitung fest, damit dein Lieblingsgericht nie verloren geht."}</p>
      </aside>
      <div class="form-card">
        <form id="${editing ? "editForm" : "addForm"}">
          <div class="field-grid">
            <div class="field field-full">
              <label for="title">Rezeptname</label>
              <input id="title" value="${editing ? escapeAttr(recipe.title) : ""}" placeholder="z. B. Cremiges Pilzrisotto" required />
            </div>
            <div class="field">
              <label for="difficulty">Schwierigkeit</label>
              <select id="difficulty">
                ${["leicht", "mittel", "schwer"].map(level => `<option value="${level}" ${(recipe?.difficulty || "mittel") === level ? "selected" : ""}>${level[0].toUpperCase() + level.slice(1)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="recipeCategory">Kategorie</label>
              <input id="recipeCategory" value="Lieblingsrezept" disabled aria-describedby="categoryHint" />
              <span class="field-hint" id="categoryHint">Weitere Kategorien folgen bald.</span>
            </div>
            <div class="field field-full">
              <label for="ingredients">Zutaten</label>
              <textarea id="ingredients" placeholder="Eine Zutat pro Zeile …" required>${editing ? escapeHtml(recipe.ingredients || "") : ""}</textarea>
            </div>
            <div class="field field-full">
              <label for="instructions">Zubereitung</label>
              <textarea id="instructions" placeholder="Beschreibe die Zubereitung Schritt für Schritt …" required>${editing ? escapeHtml(recipe.instructions || "") : ""}</textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn">${icon("check")} ${editing ? "Änderungen speichern" : "Rezept speichern"}</button>
            <a class="btn btn-secondary" href="#/">Abbrechen</a>
          </div>
          <div id="${editing ? "editFeedback" : "addFeedback"}" class="feedback" aria-live="polite"></div>
        </form>
      </div>
    </section>`;

  document.getElementById(editing ? "editForm" : "addForm").onsubmit = event => saveRecipe(event, recipe?.id);
}

async function saveRecipe(event, id = null) {
  event.preventDefault();
  const editing = Boolean(id);
  const feedback = document.getElementById(editing ? "editFeedback" : "addFeedback");
  const button = event.currentTarget.querySelector("button[type='submit']");
  const recipe = {
    id: id || Math.random().toString(36).slice(2, 11),
    title: document.getElementById("title").value.trim(),
    ingredients: document.getElementById("ingredients").value.trim(),
    instructions: document.getElementById("instructions").value.trim(),
    difficulty: document.getElementById("difficulty").value
  };

  if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
    setFeedback(feedback, "Bitte fülle alle Pflichtfelder aus.", "error");
    return;
  }

  setButtonLoading(button, true, editing ? "Wird aktualisiert …" : "Wird gespeichert …");
  try {
    const response = await fetch(editing ? `${apiUrl}/${id}` : apiUrl, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(recipe)
    });
    if (!response.ok) throw new Error(editing ? "Aktualisierung fehlgeschlagen." : "Speichern fehlgeschlagen.");
    setFeedback(feedback, editing ? "Rezept wurde aktualisiert." : "Rezept wurde gespeichert.", "success");
    showToast(editing ? "Änderungen gespeichert." : "Rezept hinzugefügt.", "success");
    setTimeout(() => {
      location.hash = "#/";
      render();
    }, 550);
  } catch (error) {
    setFeedback(feedback, error.message, "error");
    setButtonLoading(button, false);
  }
}

async function editRecipe(id) {
  if (!token) return showLoginRequired();
  showDashboardLoading();
  try {
    const response = await fetch(`${apiUrl}/${id}`, { headers: authHeader() });
    if (!response.ok) throw new Error("Das Rezept konnte nicht geladen werden.");
    showRecipeForm(await response.json());
  } catch (error) {
    showState({ iconName: "alert", title: "Rezept nicht gefunden", text: error.message, action: `<a class="btn" href="#/">Zur Übersicht</a>` });
  }
}

async function deleteRecipe(id, title) {
  if (!confirm(`„${title}“ wirklich löschen?`)) return;
  try {
    const response = await fetch(`${apiUrl}/${id}`, { method: "DELETE", headers: authHeader() });
    if (!response.ok) throw new Error("Löschen fehlgeschlagen.");
    showToast("Rezept wurde gelöscht.", "success");
    showOverview();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function showNotFound() {
  showState({
    iconName: "search",
    title: "Diese Seite gibt es nicht",
    text: "Vielleicht wurde das Rezept verschoben – oder die URL stimmt nicht ganz.",
    action: `<a class="btn" href="#/">Zur Startseite ${icon("arrow")}</a>`
  });
}

function showState({ iconName, title, text, action }) {
  app.innerHTML = `
    <section class="state-card">
      <div>
        <span class="state-icon">${icon(iconName)}</span>
        <h2>${title}</h2>
        <p>${text}</p>
        ${action || ""}
      </div>
    </section>`;
}

function icon(name) {
  const paths = {
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    book: '<path d="M4 5a3 3 0 0 1 3-2h13v16H7a3 3 0 0 0-3 2ZM4 5v16"/>',
    spark: '<path d="m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8ZM19 15l.6 2.1 1.9.9-1.9.9L19 21l-.6-2.1-1.9-.9 1.9-.9Z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.spark}</svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) { return escapeHtml(value); }
function nl2br(value) { return value.replace(/\n/g, "<br>"); }
