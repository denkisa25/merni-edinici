(function () {
  function toggleCat(id) {
    var cat = document.getElementById("cat-" + id);
    var body = document.getElementById("body-" + id);
    var open = cat.classList.contains("open");
    document.querySelectorAll(".cat.open").forEach(function (o) {
      o.classList.remove("open");
      o.querySelector(".cat-head").setAttribute("aria-expanded", "false");
      document.getElementById("body-" + o.id.replace("cat-", "")).style.maxHeight = "0";
    });
    if (!open) {
      cat.classList.add("open");
      cat.querySelector(".cat-head").setAttribute("aria-expanded", "true");
      body.style.maxHeight = body.scrollHeight + "px";
      cat.querySelectorAll(".home-ing").forEach(function (el) {
        el.style.animation = "none";
        el.offsetHeight;
        el.style.animation = "";
      });
    }
  }

  window.toggleCat = toggleCat;

  var firstCat = document.querySelector(".cat");
  if (firstCat) toggleCat(firstCat.id.replace("cat-", ""));

  var ings = window.__HOME_INGS__ || [];
  var q = document.getElementById("q");
  var res = document.getElementById("results");
  if (!q || !res) return;

  q.addEventListener("input", function () {
    var v = q.value.trim().toLowerCase();
    if (!v) { res.classList.remove("show"); res.innerHTML = ""; return; }
    var hits = ings.filter(function (x) { return x.name.toLowerCase().includes(v); }).slice(0, 7);
    res.innerHTML = hits.length
      ? hits.map(function (h) {
          return '<a href="' + h.url + '"><span class="nm">' + h.name + '</span><span class="vl">' + h.val + "</span></a>";
        }).join("")
      : '<div class="empty">Няма съвпадение за „' + q.value + '"</div>';
    res.classList.add("show");
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search")) res.classList.remove("show");
  });
})();
