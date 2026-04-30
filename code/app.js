function showPage(name) {
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.add('hidden');
  }
  document.getElementById('page-' + name).classList.remove('hidden');

  var navItems = document.querySelectorAll('.nav-item');
  for (var j = 0; j < navItems.length; j++) {
    navItems[j].classList.remove('active');
  }
  var activeNav = document.getElementById('nav-' + name);
  if (activeNav) activeNav.classList.add('active');
}

(function () {
  "use strict";

  var games = [];
  var editingId = null;

  var form = document.getElementById("add-form");
  var titleEl = document.getElementById("title");
  var statusEl = document.getElementById("status");
  var playingOptionEl = statusEl.querySelector('option[value="playing"]');
  var doneOptionEl = statusEl.querySelector('option[value="done"]');
  var percentEl = document.getElementById("percent");
  var genreEl = document.getElementById("genre");
  var formErrorEl = document.getElementById("form-error");
  var statusFilterEl = document.getElementById("status-filter");
  var sortByEl = document.getElementById("sort-by");
  var listEl = document.getElementById("game-list");
  var emptyEl = document.getElementById("empty");

  function makeId() {
    return Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function parsePercent(rawValue) {
    var v = String(rawValue).trim();
    if (v === "") return null;
    var n = Number(v);
    if (!Number.isFinite(n)) return null;
    n = Math.round(n);
    if (n < 0 || n > 100) return null;
    return n;
  }

  function setFormError(msg) { formErrorEl.textContent = msg; }

  function normalizeTitle(t) { return t.trim().toLowerCase(); }

  function updateStatusAvailability() {
    var raw = percentEl.value.trim();
    var parsed = raw === "" ? null : parsePercent(raw);
    var allowDone = raw === "" || parsed === 100;
    var allowPlaying = raw === "" || parsed !== 100;
    doneOptionEl.disabled = !allowDone;
    playingOptionEl.disabled = !allowPlaying;
    if (!allowDone && statusEl.value === "done") statusEl.value = "playing";
    if (!allowPlaying && statusEl.value === "playing") statusEl.value = "done";
  }

  function startEdit(id) { editingId = id; render(); }
  function cancelEdit() { editingId = null; render(); }

  function deleteGame(id) {
    for (var i = 0; i < games.length; i++) {
      if (games[i].id === id) { games.splice(i, 1); break; }
    }
    if (editingId === id) editingId = null;
    render();
  }

  function getCreatedAt(game) {
    if (typeof game.createdAt === "number") return game.createdAt;
    var firstPart = Number(String(game.id || "").split("-")[0]);
    return Number.isFinite(firstPart) ? firstPart : 0;
  }

  function compareGames(a, b) {
    var s = sortByEl.value;
    if (s === "title-asc") return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    if (s === "title-desc") return b.title.localeCompare(a.title, undefined, { sensitivity: "base" });
    if (s === "status") {
      var rank = { playing: 0, done: 1 };
      var d = rank[a.status] - rank[b.status];
      return d !== 0 ? d : a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }
    return getCreatedAt(b) - getCreatedAt(a);
  }

  function getGenreLabel(v) {
    var map = { action:"Action", adventure:"Adventure", rpg:"RPG", sports:"Sports", strategy:"Strategy" };
    return map[v] || "Other";
  }

  function getVisibleGames() {
    var sel = statusFilterEl.value;
    return games.filter(function(g) { return sel === "all" || g.status === sel; });
  }

  function makeBadge(status) {
    var el = document.createElement("span");
    el.className = status === "done" ? "badge badge-done" : "badge badge-playing";
    el.textContent = status === "done" ? "Completed" : "Playing";
    return el;
  }

  function makeProgressBar(pct) {
    var wrap = document.createElement("div");
    wrap.className = "progress-wrap";
    var bg = document.createElement("div");
    bg.className = "progress-bar-bg";
    var fill = document.createElement("div");
    fill.className = "progress-bar-fill";
    fill.style.width = (pct === null ? 0 : pct) + "%";
    bg.appendChild(fill);
    var label = document.createElement("span");
    label.className = "progress-pct";
    label.textContent = (pct === null ? 0 : pct) + "%";
    wrap.appendChild(bg);
    wrap.appendChild(label);
    return wrap;
  }

  function renderDashboard() {
    var dashList = document.getElementById("dashboard-list");
    var dashEmpty = document.getElementById("dashboard-empty");
    dashList.innerHTML = "";
    if (games.length === 0) { dashEmpty.style.display = "block"; return; }
    dashEmpty.style.display = "none";
    var recent = games.slice().sort(function(a,b){ return getCreatedAt(b)-getCreatedAt(a); }).slice(0,5);
    recent.forEach(function(g) {
      var li = document.createElement("li");
      li.className = "dash-game-row";
      var info = document.createElement("div");
      var t = document.createElement("div"); t.className = "dash-game-title"; t.textContent = g.title;
      var gn = document.createElement("div"); gn.className = "dash-game-genre"; gn.textContent = getGenreLabel(g.genre||"other");
      info.appendChild(t); info.appendChild(gn);
      li.appendChild(info);
      li.appendChild(makeBadge(g.status));
      li.appendChild(makeProgressBar(g.percent));
      dashList.appendChild(li);
    });
  }

  function render() {
    listEl.innerHTML = "";
    var visible = getVisibleGames();
    emptyEl.style.display = visible.length ? "none" : "block";

    var byGenre = {};
    visible.forEach(function(g) {
      var k = g.genre || "other";
      if (!byGenre[k]) byGenre[k] = [];
      byGenre[k].push(g);
    });

    var order = ["action","adventure","rpg","sports","strategy","other"];
    order.forEach(function(currentGenre) {
      if (!byGenre[currentGenre] || byGenre[currentGenre].length === 0) return;

      var heading = document.createElement("li");
      heading.className = "genre-heading";
      heading.textContent = getGenreLabel(currentGenre);
      listEl.appendChild(heading);

      byGenre[currentGenre].sort(compareGames).forEach(function(g) {
        var thisId = g.id;
        var li = document.createElement("li");

        if (editingId !== null && g.id === editingId) {
          // ── Inline edit mode ──
          var titleInput = document.createElement("input");
          titleInput.type = "text"; titleInput.value = g.title; titleInput.required = true;

          var statusSelect = document.createElement("select");
          ["playing","done"].forEach(function(v) {
            var o = document.createElement("option"); o.value = v;
            o.textContent = v === "done" ? "Done" : "Playing";
            statusSelect.appendChild(o);
          });
          statusSelect.value = g.status === "backlog" ? "playing" : g.status;
          var editPlayingOpt = statusSelect.querySelector('option[value="playing"]');
          var editDoneOpt = statusSelect.querySelector('option[value="done"]');

          var percentInput = document.createElement("input");
          percentInput.type = "number"; percentInput.min="0"; percentInput.max="100";
          percentInput.value = g.percent === null ? "" : String(g.percent);

          var genreSelect = document.createElement("select");
          ["action","adventure","rpg","sports","strategy","other"].forEach(function(v) {
            var o = document.createElement("option"); o.value = v; o.textContent = getGenreLabel(v);
            genreSelect.appendChild(o);
          });
          genreSelect.value = g.genre || "other";

          var saveBtn = document.createElement("button");
          saveBtn.type="button"; saveBtn.className="btn-save"; saveBtn.textContent="Save";
          var cancelBtn = document.createElement("button");
          cancelBtn.type="button"; cancelBtn.className="btn-secondary"; cancelBtn.textContent="Cancel";

          var actions = document.createElement("div");
          actions.className = "game-actions";
          actions.appendChild(saveBtn); actions.appendChild(cancelBtn);

          var editError = document.createElement("p");
          editError.className = "error-text";

          var editFields = document.createElement("div");
          editFields.className = "edit-fields";
          [titleInput, statusSelect, percentInput, genreSelect, actions, editError].forEach(function(el) {
            editFields.appendChild(el);
          });

          function updateEditAvail() {
            var raw = percentInput.value.trim();
            var p = raw === "" ? null : parsePercent(raw);
            editDoneOpt.disabled = !(raw === "" || p === 100);
            editPlayingOpt.disabled = !(raw === "" || p !== 100);
            if (editDoneOpt.disabled && statusSelect.value === "done") statusSelect.value = "playing";
            if (editPlayingOpt.disabled && statusSelect.value === "playing") statusSelect.value = "done";
          }

          saveBtn.addEventListener("click", function() {
            var newTitle = titleInput.value.trim();
            if (!newTitle) { editError.textContent = "Please enter a game title."; return; }
            var newStatus = statusSelect.value;
            var newPct = parsePercent(percentInput.value);
            if (percentInput.value.trim() !== "" && newPct === null) { editError.textContent = "Completion must be 0–100."; return; }
            if (newPct !== null && newPct !== 100 && newStatus === "done") { editError.textContent = "Status cannot be Done unless completion is 100."; return; }
            if (newPct === 100 && newStatus === "playing") { editError.textContent = "Status cannot be Playing when completion is 100."; return; }
            for (var j = 0; j < games.length; j++) {
              if (games[j].id === thisId) {
                games[j].title = newTitle; games[j].status = newStatus;
                games[j].percent = newPct; games[j].genre = genreSelect.value;
                break;
              }
            }
            editingId = null; render();
          });

          cancelBtn.addEventListener("click", function() { cancelEdit(); });
          percentInput.addEventListener("input", updateEditAvail);
          updateEditAvail();
          li.appendChild(editFields);
          listEl.appendChild(li);
          return;
        }

        //Normal game row 
        li.className = "game-row";

        var info = document.createElement("div");
        var titleDiv = document.createElement("div");
        titleDiv.className = "game-row-title"; titleDiv.textContent = g.title;
        var genreDiv = document.createElement("div");
        genreDiv.className = "game-row-genre"; genreDiv.textContent = getGenreLabel(g.genre||"other");
        info.appendChild(titleDiv); info.appendChild(genreDiv);

        var actionsDiv = document.createElement("div");
        actionsDiv.className = "game-actions";

        var editBtn = document.createElement("button");
        editBtn.type="button"; editBtn.className="btn-secondary"; editBtn.textContent="Edit";
        editBtn.addEventListener("click", function() { startEdit(thisId); });

        var delBtn = document.createElement("button");
        delBtn.type="button"; delBtn.className="btn-danger"; delBtn.textContent="Delete";
        delBtn.addEventListener("click", function() { deleteGame(thisId); });

        actionsDiv.appendChild(editBtn); actionsDiv.appendChild(delBtn);

        li.appendChild(info);
        li.appendChild(makeBadge(g.status));
        li.appendChild(makeProgressBar(g.percent));
        li.appendChild(actionsDiv);
        listEl.appendChild(li);
      });
    });

    renderDashboard();
  }

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var title = titleEl.value.trim();
    if (!title) { setFormError("Please enter a game title."); return; }
    var pctRaw = percentEl.value.trim();
    var pct = pctRaw === "" ? null : parsePercent(pctRaw);
    if (pctRaw !== "" && pct === null) { setFormError("Completion must be 0–100."); return; }
    if (pct !== null && pct !== 100 && statusEl.value === "done") { setFormError("Status cannot be Done unless completion is 100."); return; }
    if (pct === 100 && statusEl.value === "playing") { setFormError("Status cannot be Playing when completion is 100."); return; }
    setFormError("");

    var existingIndex = -1;
    var norm = normalizeTitle(title);
    for (var i = 0; i < games.length; i++) {
      if (normalizeTitle(games[i].title) === norm) { existingIndex = i; break; }
    }

    if (existingIndex !== -1) {
      if (!window.confirm("A game with this title already exists. Press OK to update it, or Cancel to keep both unchanged.")) {
        setFormError("Update cancelled."); return;
      }
      games[existingIndex].title = title;
      games[existingIndex].status = statusEl.value;
      games[existingIndex].percent = pct;
      games[existingIndex].genre = genreEl.value;
      games[existingIndex].createdAt = Date.now();
    } else {
      games.push({ id: makeId(), title: title, status: statusEl.value, percent: pct, genre: genreEl.value, createdAt: Date.now() });
    }

    titleEl.value = ""; statusEl.value = "playing"; percentEl.value = ""; genreEl.value = "action";
    updateStatusAvailability();
    render();
    showPage("games");
  });

  percentEl.addEventListener("input", updateStatusAvailability);
  statusEl.addEventListener("change", function() { if (statusEl.value === "done") setFormError(""); });
  statusFilterEl.addEventListener("change", render);
  sortByEl.addEventListener("change", render);

  updateStatusAvailability();
  render();
})();

showPage('dashboard');