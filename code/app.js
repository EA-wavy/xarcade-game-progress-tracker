(function () {
  "use strict";

  /** @type {{ title: string, status: string, percent: number | null }[]} */
  var games = [];

  var form = document.getElementById("add-form");
  var titleEl = document.getElementById("title");
  var statusEl = document.getElementById("status");
  var percentEl = document.getElementById("percent");
  var listEl = document.getElementById("game-list");
  var emptyEl = document.getElementById("empty");

  function render() {
    listEl.innerHTML = "";
    emptyEl.style.display = games.length ? "none" : "block";

    for (var i = 0; i < games.length; i++) {
      var g = games[i];
      var li = document.createElement("li");
      var pctText = g.percent === null ? "" : " | " + g.percent + "%";
      li.textContent = g.title + " | " + g.status + pctText;
      listEl.appendChild(li);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var title = titleEl.value.trim();
    if (!title) return;

    var pctRaw = percentEl.value.trim();
    var pct = null;
    if (pctRaw !== "") {
      var n = Number(pctRaw);
      if (!Number.isFinite(n)) return;
      pct = Math.max(0, Math.min(100, Math.round(n)));
    }

    games.push({
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
