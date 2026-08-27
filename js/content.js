/**
 * Texte aus data/content-live.json in [data-content]-Felder schreiben.
 * Wenn jemand angemeldet ist, wird der Redaktions-Editor nachgeladen.
 */
(function () {
  const LIVE_URL = "data/content-live.json";
  const API = "redaktion/api.php";

  function sanitizeRich(html) {
    const allowed = { STRONG: true, EM: true, U: true, BR: true };
    const wrap = document.createElement("div");
    wrap.innerHTML = String(html || "");
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) return;
        if (child.nodeType !== Node.ELEMENT_NODE) {
          child.remove();
          return;
        }
        if (!allowed[child.tagName]) {
          const parent = child.parentNode;
          while (child.firstChild) parent.insertBefore(child.firstChild, child);
          child.remove();
          return;
        }
        while (child.attributes.length) child.removeAttribute(child.attributes[0].name);
        walk(child);
      });
    };
    walk(wrap);
    return wrap.innerHTML;
  }

  function applyFields(fields) {
    if (!fields) return;
    document.querySelectorAll("[data-content]").forEach((el) => {
      const id = el.getAttribute("data-content");
      if (!Object.prototype.hasOwnProperty.call(fields, id)) return;
      const rich = el.getAttribute("data-content-rich") === "1";
      const value = fields[id];
      if (rich) el.innerHTML = sanitizeRich(value);
      else el.textContent = String(value || "").replace(/\s+/g, " ").trim();
    });
  }

  async function loadLive() {
    try {
      const res = await fetch(LIVE_URL, { cache: "no-cache" });
      if (!res.ok) return;
      const data = await res.json();
      applyFields(data.fields || {});
    } catch (err) {
      console.warn("Live-Texte nicht geladen:", err);
    }
  }

  async function maybeEditor() {
    try {
      const res = await fetch(API + "?action=me", { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.user) {
        loadEditor();
        return;
      }
      showLoginInvite();
    } catch (_err) {
      /* PHP-Redaktion nicht erreichbar (z. B. reiner Datei-Server) */
    }
  }

  function loadEditor() {
    if (!document.querySelector('link[href="css/content-editor.css"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "css/content-editor.css";
      document.head.appendChild(css);
    }
    if (!document.querySelector('script[src="js/content-editor.js"]')) {
      const script = document.createElement("script");
      script.src = "js/content-editor.js";
      document.body.appendChild(script);
    }
  }

  function showLoginInvite() {
    if (document.getElementById("hvw-login-invite")) return;
    const page = (location.pathname.split("/").pop() || "index.html");
    const next = "../" + (page.includes(".") ? page : "index.html");
    const bar = document.createElement("div");
    bar.id = "hvw-login-invite";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Änderungsmodus");
    bar.style.background = "#146b54";
    bar.style.color = "#fff";
    bar.style.borderBottom = "3px solid #c9a227";
    bar.innerHTML =
      "<p><strong>Änderungsmodus</strong> — Texte bearbeiten oder freigeben?</p>" +
      "<a href=\"redaktion/?next=" +
      encodeURIComponent(next) +
      "\">Anmelden</a>";
    document.body.appendChild(bar);
    document.body.classList.add("hvw-has-login-invite");
  }

  window.hvwApplyContent = applyFields;
  window.hvwSanitizeRich = sanitizeRich;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadLive().then(maybeEditor);
    });
  } else {
    loadLive().then(maybeEditor);
  }
})();
