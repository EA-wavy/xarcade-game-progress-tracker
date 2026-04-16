(function () {
  "use strict";

  var games = [];
  var editingId = null;

  var form = document.getElementById("add-form");
  var titleEl = document.getElementById("title");
  var statusEl = document.getElementById("status");
  var percentEl = document.getElementById("percent");
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
    if (n < 0) n = 0;
    if (n > 100) n = 100;
    return n;
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

  function render() {
    listEl.innerHTML = "";
    emptyEl.style.display = games.length ? "none" : "block";

    for (var i = 0; i < games.length; i++) {
      var g = games[i];
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
        s1.value = "backlog";
        s1.textContent = "Backlog";
        var s2 = document.createElement("option");
        s2.value = "playing";
        s2.textContent = "Playing";
        var s3 = document.createElement("option");
        s3.value = "done";
        s3.textContent = "Done";
        statusSelect.appendChild(s1);
        statusSelect.appendChild(s2);
        statusSelect.appendChild(s3);
        statusSelect.value = g.status;

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

        var editFields = document.createElement("div");
        editFields.className = "edit-fields";
        editFields.appendChild(titleInput);
        editFields.appendChild(statusSelect);
        editFields.appendChild(percentInput);
        editFields.appendChild(actions);

        saveBtn.addEventListener("click", function () {
          var newTitle = titleInput.value.trim();
          if (!newTitle) return;

          var newStatus = statusSelect.value;
          var newPercent = parsePercent(percentInput.value);
          if (percentInput.value.trim() !== "" && newPercent === null) return;

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
    if (!title) return;

    var pctRaw = percentEl.value.trim();
    var pct = pctRaw === "" ? null : parsePercent(pctRaw);
    if (pctRaw !== "" && pct === null) return;

    games.push({
      id: makeId(),
      title: title,
      status: statusEl.value,
      percent: pct
    });

    titleEl.value = "";
    statusEl.value = "backlog";
    percentEl.value = "";
    render();
  });

  render();
})();
