let token = localStorage.getItem("jwt") || null;
const app = document.getElementById("app");
const API_BASE = "http://localhost:3000";
const apiUrl = `${API_BASE}/data/recipes`;

// Routing
window.addEventListener("hashchange", render);
window.addEventListener("load", render);

function render() {
  const route = location.hash || "#/";
  if (route === "#/") showOverview();
  else if (route === "#/add") {
    if (!token) showLoginRequired();
    else showAddForm();
  }
  else if (route === "#/login") showLogin();
  else if (route === "#/register") showRegister();
  else showOverview();
}

// Utils
function authHeader() {
  const currentToken = localStorage.getItem("jwt");
  return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
}

function requireAuthOrMessage() {
  if (!token) {
    app.innerHTML = `<div class="empty">Bitte zuerst einloggen, um diese Funktion zu nutzen.</div>`;
    return false;
  }
  return true;
}

function logout() {
  token = null;
  localStorage.removeItem("jwt");
  alert("Logout erfolgreich!");
  location.hash = "#/";
}
window.logout = logout;

function showLoginRequired() {
  app.innerHTML = `
    <div class="empty">
      <h2>Anmeldung erforderlich</h2>
      <p>Bitte melden Sie sich an, um ein neues Rezept zu erstellen.</p>
      <a href="#/login" class="btn" style="display: inline-block; margin-top: 10px; text-decoration: none;">Zum Login</a>
    </div>
  `;
}

// Views
async function showOverview() {
  // GET ist öffentlich; wenn Token vorhanden, wird er mitgeschickt (optional)
  const res = await fetch(apiUrl, { headers: { ...authHeader() } });
  if (!res.ok) {
    app.innerHTML = `<div class="empty">Fehler beim Laden der Rezepte.</div>`;
    return;
  }
  const recipes = await res.json();

  app.innerHTML = `
    <h2 class="section-title">Alle Rezepte</h2>
    <div class="grid" id="grid"></div>
  `;
  const grid = document.getElementById("grid");

  if (!recipes.length) {
    grid.innerHTML = `<div class="empty">Noch keine Rezepte vorhanden. Erstelle dein erstes Rezept über "Neues Rezept".</div>`;
    return;
  }

  recipes.forEach(r => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <h3>${escapeHtml(r.title)}</h3>
      <div class="recipe-meta">Schwierigkeit: ${escapeHtml(r.difficulty || "—")}</div>
      <p><strong>Zutaten:</strong><br>${nl2br(escapeHtml(r.ingredients || ""))}</p>
      <p><strong>Zubereitung:</strong><br>${nl2br(escapeHtml(r.instructions || ""))}</p>
      <div class="actions">
        <button class="secondary" data-edit="${r.id}">Bearbeiten</button>
        <button class="danger" data-del="${r.id}">Löschen</button>
      </div>
    `;
    grid.appendChild(card);

    card.querySelector(`[data-edit="${r.id}"]`).onclick = () => editRecipe(r.id);
    card.querySelector(`[data-del="${r.id}"]`).onclick = () => deleteRecipe(r.id);
  });
}

function showLogin() {
  const currentToken = localStorage.getItem("jwt");
  if (currentToken) {
    app.innerHTML = `
      <div class="empty">
        <h2>Bereits angemeldet</h2>
        <p>Du bist bereits eingeloggt. Gehe zurück zur <a href="#/">Übersicht</a> oder <a href="javascript:logout()">logout</a>.</p>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <h2 class="section-title">Login</h2>
    <form id="loginForm">
      <input type="text" id="user" placeholder="Benutzername" required />
      <input type="password" id="pass" placeholder="Passwort" required />
      <button type="submit" class="btn">Login</button>
      <div id="loginFeedback" class="feedback"></div>
    </form>
  `;
  document.getElementById("loginForm").onsubmit = async e => {
    e.preventDefault();
    const username = document.getElementById("user").value.trim();
    const password = document.getElementById("pass").value.trim();
    const feedback = document.getElementById("loginFeedback");

    if (!username || !password) {
      feedback.textContent = "❌ Benutzername und Passwort dürfen nicht leer sein!";
      feedback.style.color = "red";
      return;
    }

    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const tokenText = await res.text();
      token = tokenText.trim();
      localStorage.setItem("jwt", token);
      feedback.textContent = "✅ Login erfolgreich!";
      feedback.style.color = "green";
      setTimeout(() => location.hash = "#/", 600);
    } else {
      let msg = "Login fehlgeschlagen";
      try { msg = (await res.json()).message || msg; } catch {}
      feedback.textContent = "❌ " + msg;
      feedback.style.color = "red";
    }
  };
}

function showRegister() {
  app.innerHTML = `
    <h2 class="section-title">Registrieren</h2>
    <form id="registerForm">
      <input type="text" id="newUser" placeholder="Benutzername" required />
      <input type="password" id="newPass" placeholder="Passwort" required />
      <button type="submit" class="btn">Registrieren</button>
      <div id="registerFeedback" class="feedback"></div>
    </form>
  `;
  document.getElementById("registerForm").onsubmit = async e => {
    e.preventDefault();
    const username = document.getElementById("newUser").value.trim();
    const password = document.getElementById("newPass").value.trim();
    const feedback = document.getElementById("registerFeedback");

    if (!username || !password) {
      feedback.textContent = "❌ Benutzername und Passwort dürfen nicht leer sein!";
      feedback.style.color = "red";
      return;
    }

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      feedback.textContent = "✅ Benutzer erfolgreich erstellt! Bitte einloggen.";
      feedback.style.color = "green";
      setTimeout(() => location.hash = "#/login", 800);
    } else {
      let msg = "Registrierung fehlgeschlagen";
      try { msg = (await res.json()).message || msg; } catch {}
      feedback.textContent = "❌ " + msg;
      feedback.style.color = "red";
    }
  };
}

function showAddForm() {
  app.innerHTML = `
    <h2 class="section-title">Neues Rezept</h2>
    <form id="addForm">
      <input id="title" placeholder="Titel" required />
      <textarea id="ingredients" placeholder="Zutaten" required></textarea>
      <textarea id="instructions" placeholder="Zubereitung" required></textarea>
      <select id="difficulty">
        <option value="leicht">leicht</option>
        <option value="mittel" selected>mittel</option>
        <option value="schwer">schwer</option>
      </select>
      <button type="submit" class="btn">Speichern</button>
      <div id="addFeedback" class="feedback"></div>
    </form>
  `;

  document.getElementById("addForm").onsubmit = async e => {
    e.preventDefault();
    const recipe = {
      id: Math.random().toString(36).substr(2, 9),
      title: document.getElementById("title").value.trim(),
      ingredients: document.getElementById("ingredients").value.trim(),
      instructions: document.getElementById("instructions").value.trim(),
      difficulty: document.getElementById("difficulty").value
    };

    const feedback = document.getElementById("addFeedback");

    if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
      feedback.textContent = "❌ Alle Felder müssen ausgefüllt werden!";
      feedback.style.color = "red";
      return;
    }

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...authHeader()
      },
      body: JSON.stringify(recipe)
    });

    if (res.ok) {
      feedback.textContent = "✅ Rezept gespeichert.";
      feedback.style.color = "green";
      setTimeout(() => location.hash = "#/", 700);
    } else {
      let msg = "Speichern fehlgeschlagen";
      try { msg = (await res.json()).message || msg; } catch {}
      feedback.textContent = "❌ " + msg;
      feedback.style.color = "red";
    }
  };
}

async function editRecipe(id) {
  const res = await fetch(`${apiUrl}/${id}`, { headers: { ...authHeader() } });
  if (!res.ok) { alert("Rezept laden fehlgeschlagen."); return; }
  const recipe = await res.json();

  app.innerHTML = `
    <h2 class="section-title">Rezept bearbeiten</h2>
    <form id="editForm">
      <input id="title" value="${escapeAttr(recipe.title)}" required />
      <textarea id="ingredients" required>${escapeHtml(recipe.ingredients || "")}</textarea>
      <textarea id="instructions" required>${escapeHtml(recipe.instructions || "")}</textarea>
      <select id="difficulty">
        <option value="leicht" ${recipe.difficulty==="leicht"?"selected":""}>leicht</option>
        <option value="mittel" ${recipe.difficulty==="mittel"?"selected":""}>mittel</option>
        <option value="schwer" ${recipe.difficulty==="schwer"?"selected":""}>schwer</option>
      </select>
      <button type="submit" class="btn">Speichern</button>
      <div id="editFeedback" class="feedback"></div>
    </form>
  `;

  document.getElementById("editForm").onsubmit = async e => {
    e.preventDefault();
    const updated = {
      id: id,
      title: document.getElementById("title").value.trim(),
      ingredients: document.getElementById("ingredients").value.trim(),
      instructions: document.getElementById("instructions").value.trim(),
      difficulty: document.getElementById("difficulty").value
    };
    const feedback = document.getElementById("editFeedback");

    if (!updated.title || !updated.ingredients || !updated.instructions) {
      feedback.textContent = "❌ Alle Felder müssen ausgefüllt werden!";
      feedback.style.color = "red";
      return;
    }

    const resp = await fetch(`${apiUrl}/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        ...authHeader()
      },
      body: JSON.stringify(updated)
    });

    if (resp.ok) {
      feedback.textContent = "✅ Rezept aktualisiert.";
      feedback.style.color = "green";
      setTimeout(() => location.hash = "#/", 700);
    } else {
      let msg = "Aktualisierung fehlgeschlagen";
      try { msg = (await resp.json()).message || msg; } catch {}
      feedback.textContent = "❌ " + msg;
      feedback.style.color = "red";
    }
  };
}

async function deleteRecipe(id) {
  if (!confirm("Dieses Rezept wirklich löschen?")) return;

  const resp = await fetch(`${apiUrl}/${id}`, {
    method: "DELETE",
    headers: { ...authHeader() }
  });

  if (resp.ok) {
    showOverview();
  } else {
    alert("Löschen fehlgeschlagen.");
  }
}

// Helpers (kleine XSS-Guards)
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function escapeAttr(str) { return escapeHtml(str); }
function nl2br(str) { return str.replace(/\n/g, "<br>"); }