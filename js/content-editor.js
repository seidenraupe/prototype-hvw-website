/**
 * On-Page-Redaktion: Entwurf speichern, Vorschau, Freigabe.
 * Erlaubt: fett / kursiv / unterstrichen. Kein Layout.
 */
(function () {
  const API = "redaktion/api.php";
  let session = null;
  let schema = {};
  let draftFields = {};
  let liveFields = {};
  let view = "draft";
  let dirty = false;
  let activeEl = null;

  const $ = (sel, root) => (root || document).querySelector(sel);

  function csrfHeaders() {
    return {
      "Content-Type": "application/json",
      "X-CSRF-Token": session && session.csrf ? session.csrf : "",
    };
  }

  async function api(action, options) {
    const opts = options || {};
    const url = API + "?action=" + encodeURIComponent(action);
    const res = await fetch(url, Object.assign({ credentials: "same-origin", cache: "no-store" }, opts));
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || "Die Anfrage ist fehlgeschlagen.");
    }
    return data;
  }

  function plainLen(html) {
    const d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || "").replace(/\s+/g, " ").trim().length;
  }

  function collectFields() {
    const out = {};
    document.querySelectorAll("[data-content]").forEach((el) => {
      const id = el.getAttribute("data-content");
      const rich = el.getAttribute("data-content-rich") === "1";
      out[id] = rich ? window.hvwSanitizeRich(el.innerHTML) : (el.textContent || "").replace(/\s+/g, " ").trim();
    });
    return out;
  }

  function setView(mode) {
    view = mode;
    applyCurrent();
    updateBar();
  }

  function applyCurrent() {
    const fields = view === "live" ? liveFields : draftFields;
    window.hvwApplyContent(fields);
    document.body.classList.toggle("hvw-editing", view === "draft");
    document.querySelectorAll("[data-content]").forEach((el) => {
      const canEdit = view === "draft";
      el.contentEditable = canEdit ? "true" : "false";
      el.classList.toggle("hvw-editable", canEdit);
      el.spellcheck = true;
    });
  }

  function fieldMeta(id) {
    return schema[id] || { label: id, max: 400, rich: false, multiline: true };
  }

  function updateCounter() {
    const box = $("#hvw-counter");
    if (!box || !activeEl) {
      if (box) box.textContent = "";
      return;
    }
    const id = activeEl.getAttribute("data-content");
    const meta = fieldMeta(id);
    const len = plainLen(activeEl.getAttribute("data-content-rich") === "1" ? activeEl.innerHTML : activeEl.textContent);
    box.textContent = meta.label + " · " + len + " / " + meta.max + " Zeichen";
    box.classList.toggle("is-over", len > meta.max);
  }

  function markDirty() {
    dirty = true;
    updateBar();
  }

  function updateBar() {
    const bar = $("#hvw-editor-bar");
    if (!bar) return;
    const changes = diffCount();
    $("#hvw-role-label").textContent = session.name + " (" + (session.role === "freigabe" ? "Freigabe" : "Redaktion") + ")";
    $("#hvw-status").textContent =
      view === "live"
        ? "Sie sehen die Live-Seite"
        : changes
          ? "Entwurf · " + changes + " Änderung" + (changes === 1 ? "" : "en") + (dirty ? " (nicht gespeichert)" : "")
          : dirty
            ? "Entwurf · nicht gespeichert"
            : "Entwurf · identisch mit Live";
    $("#hvw-btn-draft").hidden = view === "draft";
    $("#hvw-btn-live").hidden = view === "live";
    $("#hvw-btn-save").disabled = view !== "draft";
    const pub = $("#hvw-btn-publish");
    if (pub) {
      pub.hidden = session.role !== "freigabe";
      pub.disabled = view !== "draft" || dirty || changes === 0;
    }
  }

  function diffCount() {
    const current = view === "draft" && dirty ? Object.assign({}, draftFields, collectFields()) : draftFields;
    let n = 0;
    Object.keys(schema).forEach((id) => {
      if (String(current[id] || "") !== String(liveFields[id] || "")) n += 1;
    });
    return n;
  }

  function exec(cmd) {
    document.execCommand(cmd, false, null);
    if (activeEl && activeEl.getAttribute("data-content-rich") === "1") {
      activeEl.innerHTML = window.hvwSanitizeRich(activeEl.innerHTML);
    }
    markDirty();
    updateCounter();
  }

  function onKey(e) {
    if (!activeEl) return;
    const meta = fieldMeta(activeEl.getAttribute("data-content"));
    if (e.key === "Enter" && !meta.multiline) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" && meta.multiline && !e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      markDirty();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveDraft();
    }
    if ((e.metaKey || e.ctrlKey) && "biu".includes(e.key.toLowerCase())) {
      if (activeEl.getAttribute("data-content-rich") !== "1") e.preventDefault();
    }
  }

  function onPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain") || "";
    document.execCommand("insertText", false, text.replace(/\r/g, ""));
    markDirty();
  }

  async function saveDraft() {
    const fields = Object.assign({}, draftFields, collectFields());
    try {
      const data = await api("save", { method: "POST", headers: csrfHeaders(), body: JSON.stringify({ fields }) });
      draftFields = fields;
      dirty = false;
      toast("Entwurf gespeichert. Noch nicht öffentlich.");
      updateBar();
      return data;
    } catch (err) {
      toast(err.message, true);
      throw err;
    }
  }

  async function publish() {
    if (dirty) await saveDraft();
    if (!confirm("Entwurf jetzt öffentlich schalten?")) return;
    try {
      await api("publish", { method: "POST", headers: csrfHeaders(), body: "{}" });
      liveFields = Object.assign({}, draftFields);
      toast("Freigegeben — die Texte sind live.");
      updateBar();
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function discard() {
    if (!confirm("Entwurf verwerfen und die Live-Texte wiederherstellen?")) return;
    try {
      await api("discard", { method: "POST", headers: csrfHeaders(), body: "{}" });
      draftFields = Object.assign({}, liveFields);
      dirty = false;
      applyCurrent();
      toast("Entwurf verworfen.");
      updateBar();
    } catch (err) {
      toast(err.message, true);
    }
  }

  function showDiff() {
    const current = Object.assign({}, draftFields, collectFields());
    const rows = [];
    Object.keys(schema).forEach((id) => {
      const a = String(liveFields[id] || "");
      const b = String(current[id] || "");
      if (a === b) return;
      const label = fieldMeta(id).label;
      rows.push(
        "<article class=\"hvw-diff-item\"><h3>" +
          escapeHtml(label) +
          "</h3><p class=\"hvw-diff-old\">" +
          escapeHtml(strip(a)) +
          "</p><p class=\"hvw-diff-new\">" +
          escapeHtml(strip(b)) +
          "</p></article>"
      );
    });
    $("#hvw-diff-body").innerHTML = rows.length
      ? rows.join("")
      : "<p>Keine Unterschiede zum Live-Stand.</p>";
    $("#hvw-diff").hidden = false;
  }

  function strip(html) {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d.textContent || "";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function toast(msg, isError) {
    const el = $("#hvw-toast");
    el.textContent = msg;
    el.classList.toggle("is-error", !!isError);
    el.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }

  function mountBar() {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div id="hvw-editor-bar" role="region" aria-label="Redaktion">
        <div class="hvw-editor-bar__main">
          <span id="hvw-role-label"></span>
          <span id="hvw-status"></span>
          <span id="hvw-counter"></span>
        </div>
        <div class="hvw-editor-bar__tools">
          <button type="button" id="hvw-btn-b" title="Fett"><strong>F</strong></button>
          <button type="button" id="hvw-btn-i" title="Kursiv"><em>K</em></button>
          <button type="button" id="hvw-btn-u" title="Unterstrichen"><u>U</u></button>
        </div>
        <div class="hvw-editor-bar__actions">
          <button type="button" id="hvw-btn-live">Live ansehen</button>
          <button type="button" id="hvw-btn-draft">Entwurf ansehen</button>
          <button type="button" id="hvw-btn-diff">Änderungen</button>
          <button type="button" id="hvw-btn-save">Entwurf speichern</button>
          <button type="button" id="hvw-btn-discard">Verwerfen</button>
          <button type="button" id="hvw-btn-publish">Live schalten</button>
          <button type="button" id="hvw-btn-logout">Abmelden</button>
        </div>
      </div>
      <div id="hvw-toast" hidden></div>
      <div id="hvw-diff" hidden>
        <div class="hvw-diff-panel">
          <div class="hvw-diff-head">
            <h2>Änderungen im Entwurf</h2>
            <button type="button" id="hvw-diff-close">Schliessen</button>
          </div>
          <div id="hvw-diff-body"></div>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add("hvw-has-editor");

    $("#hvw-btn-b").addEventListener("click", () => exec("bold"));
    $("#hvw-btn-i").addEventListener("click", () => exec("italic"));
    $("#hvw-btn-u").addEventListener("click", () => exec("underline"));
    $("#hvw-btn-save").addEventListener("click", () => saveDraft().catch(() => {}));
    $("#hvw-btn-publish").addEventListener("click", () => publish());
    $("#hvw-btn-discard").addEventListener("click", () => discard());
    $("#hvw-btn-live").addEventListener("click", () => {
      if (dirty && !confirm("Ungespeicherte Änderungen bleiben im Formular. Trotzdem Live ansehen?")) return;
      setView("live");
    });
    $("#hvw-btn-draft").addEventListener("click", () => setView("draft"));
    $("#hvw-btn-diff").addEventListener("click", showDiff);
    $("#hvw-diff-close").addEventListener("click", () => {
      $("#hvw-diff").hidden = true;
    });
    $("#hvw-btn-logout").addEventListener("click", async () => {
      try {
        await api("logout", { method: "POST", headers: csrfHeaders(), body: "{}" });
      } catch (_e) {}
      location.reload();
    });
  }

  function bindFields() {
    document.querySelectorAll("[data-content]").forEach((el) => {
      el.addEventListener("focus", () => {
        activeEl = el;
        updateCounter();
      });
      el.addEventListener("input", () => {
        markDirty();
        updateCounter();
      });
      el.addEventListener("keydown", onKey);
      el.addEventListener("paste", onPaste);
      el.addEventListener("blur", () => {
        if (el.getAttribute("data-content-rich") === "1") {
          el.innerHTML = window.hvwSanitizeRich(el.innerHTML);
        }
      });
    });
  }

  async function boot() {
    try {
      const meRes = await fetch(API + "?action=me", { credentials: "same-origin", cache: "no-store" });
      const me = await meRes.json();
      if (!me.user) return;
      session = me.user;
      const sch = await (await fetch(API + "?action=schema", { credentials: "same-origin" })).json();
      schema = sch.fields || {};
      const live = await (await fetch("data/content-live.json", { cache: "no-cache" })).json();
      liveFields = live.fields || {};
      const draftRes = await fetch(API + "?action=content&source=draft", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const draft = await draftRes.json();
      draftFields = draft.fields || Object.assign({}, liveFields);
      mountBar();
      bindFields();
      setView("draft");
    } catch (err) {
      console.warn("Redaktion nicht gestartet:", err);
    }
  }

  boot();
})();
