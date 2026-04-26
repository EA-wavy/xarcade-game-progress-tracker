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
  var formErrorEl = document.getElementById("form-error");
  var statusFilterEl = document.getElementById("status-filter");
  var listEl = document.getElementById("game-list");
  var emptyEl = document.getElementById("empty");

  function makeId() {
    // Simple id for this prototype so edit/delete can work reliably.
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

  function setFormError(message) {
    formErrorEl.textContent = message;
  }

  function normalizeTitle(title) {
    return title.trim().toLowerCase();
  }

  function updateStatusAvailability() {
    var raw = percentEl.value.trim();
    var parsed = raw === "" ? null : parsePercent(raw);

    // If completion is blank, both statuses are available.
    var allowDone = raw === "" || parsed === 100;
    var allowPlaying = raw === "" || parsed !== 100;

    doneOptionEl.disabled = !allowDone;
    playingOptionEl.disabled = !allowPlaying;

    if (!allowDone && statusEl.value === "done") {
      statusEl.value = "playing";
    }
    if (!allowPlaying && statusEl.value === "playing") {
      statusEl.value = "done";
    }
  }

  function startEdit(id) {
    editingId = id;
    render();
  }

  function cancelEdit() {
    editingId = null;
    render();
  }

  function deleteGame(id) {
    for (var i = 0; i < games.length; i++) {
      if (games[i].id === id) {
        games.splice(i, 1);
        break;
      }
    }
    if (editingId === id) editingId = null;
    render();
  }

  function completionForSort(game) {
    return game.percent === null ? 0 : game.percent;
  }

  function getVisibleGames() {
    var filtered = [];
    var selectedStatus = statusFilterEl.value;

    for (var i = 0; i < games.length; i++) {
      if (selectedStatus === "all" || games[i].status === selectedStatus) {
        filtered.push(games[i]);
      }
    }

    filtered.sort(function (a, b) {
      var completionDiff = completionForSort(a) - completionForSort(b);
      if (completionDiff !== 0) return completionDiff;
      return a.title.localeCompare(b.title);
    });

    return filtered;
  }

  function render() {
    listEl.innerHTML = "";
    var visibleGames = getVisibleGames();
    emptyEl.style.display = visibleGames.length ? "none" : "block";

    for (var i = 0; i < visibleGames.length; i++) {
      var g = visibleGames[i];
      let thisId = g.id;
      var li = document.createElement("li");

      // If this is the one being edited, show inputs instead of text.
      if (editingId !== null && g.id === editingId) {
        var titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.value = g.title;
        titleInput.required = true;

        var statusSelect = document.createElement("select");
        var s1 = document.createElement("option");
        s1.value = "playing";
        s1.textContent = "Playing";
        var s2 = document.createElement("option");
        s2.value = "done";
        s2.textContent = "Done";
        statusSelect.appendChild(s1);
        statusSelect.appendChild(s2);
        statusSelect.value = g.status === "backlog" ? "playing" : g.status;
        var editPlayingOptionEl = statusSelect.querySelector('option[value="playing"]');
        var editDoneOptionEl = statusSelect.querySelector('option[value="done"]');

        var percentInput = document.createElement("input");
        percentInput.type = "number";
        percentInput.min = "0";
        percentInput.max = "100";
        percentInput.step = "1";
        percentInput.placeholder = "";
        percentInput.value = g.percent === null ? "" : String(g.percent);

        var saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "btn-save";
        saveBtn.textContent = "Save";

        var cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn-secondary";
        cancelBtn.textContent = "Cancel";

        var actions = document.createElement("div");
        actions.className = "game-actions";
        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);

        var editError = document.createElement("p");
        editError.className = "error-text";
        editError.textContent = "";

        var editFields = document.createElement("div");
        editFields.className = "edit-fields";
        editFields.appendChild(titleInput);
        editFields.appendChild(statusSelect);
        editFields.appendChild(percentInput);
        editFields.appendChild(actions);
        editFields.appendChild(editError);

        function updateEditStatusAvailability() {
          var rawEdit = percentInput.value.trim();
          var parsedEdit = rawEdit === "" ? null : parsePercent(rawEdit);
          var allowEditDone = rawEdit === "" || parsedEdit === 100;
          var allowEditPlaying = rawEdit === "" || parsedEdit !== 100;

          editDoneOptionEl.disabled = !allowEditDone;
          editPlayingOptionEl.disabled = !allowEditPlaying;

          if (!allowEditDone && statusSelect.value === "done") {
            statusSelect.value = "playing";
          }
          if (!allowEditPlaying && statusSelect.value === "playing") {
            statusSelect.value = "done";
          }
        }

        saveBtn.addEventListener("click", function () {
          var newTitle = titleInput.value.trim();
          if (!newTitle) {
            editError.textContent = "Please enter a game title.";
            return;
          }

          var newStatus = statusSelect.value;
          var newPercent = parsePercent(percentInput.value);
          if (percentInput.value.trim() !== "" && newPercent === null) {
            editError.textContent = "Completion must be a number from 0 to 100.";
            return;
          }
          if (newPercent !== null && newPercent !== 100 && newStatus === "done") {
            editError.textContent = "Status cannot be Done unless completion is 100.";
            return;
          }
          if (newPercent === 100 && newStatus === "playing") {
            editError.textContent = "Status cannot be Playing when completion is 100.";
            return;
          }
          editError.textContent = "";

          for (var j = 0; j < games.length; j++) {
            if (games[j].id === thisId) {
              games[j].title = newTitle;
              games[j].status = newStatus;
              games[j].percent = newPercent;
              break;
            }
          }

          editingId = null;
          render();
        });

        cancelBtn.addEventListener("click", function () {
          cancelEdit();
        });

        percentInput.addEventListener("input", function () {
          updateEditStatusAvailability();
        });

        updateEditStatusAvailability();

        li.appendChild(editFields);
        listEl.appendChild(li);
        continue;
      }

      var pctText = g.percent === null ? "" : " | " + g.percent + "%";
      var text = document.createElement("span");
      text.className = "game-item-text";
      text.textContent = g.title + " | " + g.status + pctText;
      li.appendChild(text);

      var actionsRow = document.createElement("div");
      actionsRow.className = "game-actions";

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-secondary";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () {
        startEdit(thisId);
      });

      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        deleteGame(thisId);
      });

      actionsRow.appendChild(editBtn);
      actionsRow.appendChild(deleteBtn);
      li.appendChild(actionsRow);
      listEl.appendChild(li);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var title = titleEl.value.trim();
    if (!title) {
      setFormError("Please enter a game title.");
      return;
    }

    var pctRaw = percentEl.value.trim();
    var pct = pctRaw === "" ? null : parsePercent(pctRaw);
    if (pctRaw !== "" && pct === null) {
      setFormError("Completion must be a number from 0 to 100.");
      return;
    }
    if (pct !== null && pct !== 100 && statusEl.value === "done") {
      setFormError("Status cannot be Done unless completion is 100.");
      return;
    }
    if (pct === 100 && statusEl.value === "playing") {
      setFormError("Status cannot be Playing when completion is 100.");
      return;
    }
    setFormError("");

    var existingIndex = -1;
    var normalizedNewTitle = normalizeTitle(title);
    for (var i = 0; i < games.length; i++) {
      if (normalizeTitle(games[i].title) === normalizedNewTitle) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex !== -1) {
      var confirmReplace = window.confirm(
        "A game with this title already exists. Press OK to update the existing entry, or Cancel to keep both unchanged."
      );
      if (!confirmReplace) {
        setFormError("Update cancelled. Existing game was not changed.");
        return;
      }

      games[existingIndex].title = title;
      games[existingIndex].status = statusEl.value;
      games[existingIndex].percent = pct;
    } else {
      games.push({
        id: makeId(),
        title: title,
        status: statusEl.value,
        percent: pct
      });
    }

    titleEl.value = "";
    statusEl.value = "playing";
    percentEl.value = "";
    updateStatusAvailability();
    render();
  });

  percentEl.addEventListener("input", function () {
    updateStatusAvailability();
  });

  statusEl.addEventListener("change", function () {
    if (statusEl.value === "done") {
      setFormError("");
    }
  });

  statusFilterEl.addEventListener("change", function () {
    render();
  });

  updateStatusAvailability();
  render();
})();
