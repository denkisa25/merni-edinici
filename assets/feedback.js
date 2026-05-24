(function () {
  var el = document.getElementById("feedback");
  if (!el) return;
  var slug = location.pathname.replace(/\/$/, "").split("/").pop() || "home";
  var key = "feedback:" + slug;
  var already = localStorage.getItem(key);
  var msg = el.querySelector(".feedback-msg");

  function showDone(text) {
    el.querySelectorAll("button").forEach(function (b) { b.disabled = true; b.style.opacity = "0.4"; });
    msg.textContent = text;
  }

  if (already) { showDone("Вече гласувахте"); return; }

  el.querySelectorAll("button[data-vote]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var v = btn.dataset.vote === "up" ? 1 : -1;
      localStorage.setItem(key, v);
      try { if (typeof gtag === "function") gtag("event", "feedback", { value: v, page_path: location.pathname }); } catch (_) {}
      showDone("Благодаря!");
    });
  });
})();
