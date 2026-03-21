/**
 * XArcade — minimal starter (iterations add features on top).
 * Data is in-memory only until you implement persistence in a later sprint.
 */
(function () {
  "use strict";

  /** @type {string[]} */
  var games = [];

  var form = document.getElementById("add-form");
  var titleInput = document.getElementById("title");
  var listEl = document.getElementById("game-list");

  function render() {
    listEl.innerHTML = "";
    for (var i = 0; i < games.length; i++) {
      var li = document.createElement("li");
      li.textContent = games[i];
      listEl.appendChild(li);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var title = titleInput.value.trim();
    if (!title) return;
    games.push(title);
    titleInput.value = "";
    render();
  });

  render();
})();
