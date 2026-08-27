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
  let reviewIndex = 0;
  const REVIEW_KEY = "hvw-review-id";
  const ACCEPTED_KEY = "hvw-review-accepted";
  let acceptedIds = loadAccepted();

  const $ = (sel, root) => (root || document).querySelector(sel);

  function isFreigabe() {
    return session && session.role === "freigabe";
  }

  function loadAccepted() {
    try {
      const raw = sessionStorage.getItem(ACCEPTED_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_e) {
      return new Set();
    }
  }

  function persistAccepted() {
    sessionStorage.setItem(ACCEPTED_KEY, JSON.stringify([...acceptedIds]));
  }

  function currentPageName() {
    const parts = (location.pathname || "").split("/").filter(Boolean);
    let name = parts[parts.length - 1] || "index.html";
    if (!name.includes(".")) name = "index.html";
    return name;
  }

  function pageHref(page) {
    return page || "index.html";
  }

  function currentFields() {
    return Object.assign({}, draftFields, view === "draft" ? collectFields() : {});
  }

  function allChanges() {
    const current = currentFields();
    const list = [];
    Object.keys(schema).forEach((id) => {
      if (String(current[id] || "") !== String(liveFields[id] || "")) {
        list.push({
          id,
          label: fieldMeta(id).label,
          page: fieldMeta(id).page || "index.html",
          live: String(liveFields[id] || ""),
          draft: String(current[id] || ""),
        });
      }
    });
    return list;
  }

  function fieldEl(id) {
    return document.querySelector('[data-content="' + String(id).replace(/"/g, "") + '"]');
  }

  function clip(html, max) {
    const text = strip(html).replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + "…";
  }

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

  function fieldValue(el) {
    const rich = el.getAttribute("data-content-rich") === "1";
    return rich
      ? window.hvwSanitizeRich(el.innerHTML)
      : (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function collectFields() {
    const out = {};
    document.querySelectorAll("[data-content]").forEach((el) => {
      out[el.getAttribute("data-content")] = fieldValue(el);
    });
    return out;
  }

  function markChangedFields() {
    const editing = view === "draft";
    document.querySelectorAll("[data-content]").forEach((el) => {
      const id = el.getAttribute("data-content");
      const changed = editing && fieldValue(el) !== String(liveFields[id] || "");
      const accepted = changed && acceptedIds.has(id);
      el.classList.toggle("hvw-changed", changed && !accepted);
      el.classList.toggle("hvw-accepted", accepted);
      if (accepted) {
        el.setAttribute("title", "Angenommen — wird mit «Live schalten» öffentlich");
        el.setAttribute("data-change-hint", "Angenommen");
      } else if (changed) {
        el.setAttribute("title", "Geändert — noch nicht öffentlich, wartet auf Freigabe");
        el.setAttribute("data-change-hint", "Geändert — zur Freigabe");
      } else {
        el.removeAttribute("title");
        el.removeAttribute("data-change-hint");
        acceptedIds.delete(id);
      }
    });
    persistAccepted();
    updateReviewDock();
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
    markChangedFields();
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
    markChangedFields();
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
    const legend = $("#hvw-legend");
    if (legend) legend.hidden = view !== "draft" || changes === 0;
    const diffBtn = $("#hvw-btn-diff");
    if (diffBtn) diffBtn.classList.toggle("is-attention", view === "draft" && changes > 0);
    $("#hvw-btn-draft").hidden = view === "draft";
    $("#hvw-btn-live").hidden = view === "live";
    $("#hvw-btn-save").disabled = view !== "draft";
    const pub = $("#hvw-btn-publish");
    if (pub) {
      pub.hidden = !isFreigabe();
      pub.disabled = view !== "draft" || dirty || changes === 0;
    }
    const zugang = $("#hvw-btn-zugang");
    if (zugang) zugang.hidden = !isFreigabe();
    updateReviewDock();
  }

  function diffCount() {
    return allChanges().length;
  }

  function syncReviewIndex(changes) {
    if (!changes.length) {
      reviewIndex = 0;
      return;
    }
    if (reviewIndex >= changes.length) reviewIndex = changes.length - 1;
    if (reviewIndex < 0) reviewIndex = 0;
  }

  function highlightCurrent(id) {
    document.querySelectorAll("[data-content].hvw-review-current").forEach((el) => {
      el.classList.remove("hvw-review-current");
    });
    const el = fieldEl(id);
    if (!el) return null;
    el.classList.add("hvw-review-current");
    return el;
  }

  function goToChange(index, opts) {
    const options = opts || {};
    if (view !== "draft") setView("draft");
    const changes = allChanges();
    if (!changes.length) {
      updateReviewDock();
      return;
    }
    reviewIndex = ((index % changes.length) + changes.length) % changes.length;
    const item = changes[reviewIndex];
    sessionStorage.setItem(REVIEW_KEY, item.id);
    if (!options.stay && item.page && item.page !== currentPageName()) {
      location.href = pageHref(item.page);
      return;
    }
    const el = highlightCurrent(item.id);
    if (el) {
      el.scrollIntoView({ behavior: options.instant ? "auto" : "smooth", block: "center" });
      if (options.focus) {
        el.focus({ preventScroll: true });
        activeEl = el;
        updateCounter();
      }
    }
    updateReviewDock();
  }

  function goRelative(step) {
    const changes = allChanges();
    if (!changes.length) return;
    syncReviewIndex(changes);
    goToChange(reviewIndex + step);
  }

  function goToNextOpen() {
    const changes = allChanges();
    if (!changes.length) {
      updateReviewDock();
      return;
    }
    const start = reviewIndex;
    for (let i = 1; i <= changes.length; i += 1) {
      const next = changes[(start + i) % changes.length];
      if (!acceptedIds.has(next.id)) {
        goToChange((start + i) % changes.length);
        return;
      }
    }
    updateReviewDock();
  }

  function acceptCurrent() {
    const changes = allChanges();
    if (!changes.length) return;
    syncReviewIndex(changes);
    acceptedIds.add(changes[reviewIndex].id);
    persistAccepted();
    markChangedFields();
    toast("Änderung angenommen.");
    goToNextOpen();
  }

  function editCurrent() {
    const changes = allChanges();
    if (!changes.length) return;
    syncReviewIndex(changes);
    const id = changes[reviewIndex].id;
    acceptedIds.delete(id);
    persistAccepted();
    goToChange(reviewIndex, { focus: true });
  }

  function revertCurrent() {
    const changes = allChanges();
    if (!changes.length) return;
    syncReviewIndex(changes);
    const item = changes[reviewIndex];
    if (!confirm("Diese Änderung rückgängig machen und den Live-Text wiederherstellen?")) return;
    draftFields[item.id] = liveFields[item.id] || "";
    acceptedIds.delete(item.id);
    persistAccepted();
    const el = fieldEl(item.id);
    if (el) window.hvwApplyContent({ [item.id]: draftFields[item.id] });
    markDirty();
    saveDraft(true).catch(() => {});
    toast("Änderung rückgängig gemacht.");
    const left = allChanges();
    if (left.length) goToChange(Math.min(reviewIndex, left.length - 1), { stay: true });
    else updateReviewDock();
  }

  function updateReviewDock() {
    const dock = $("#hvw-review-dock");
    if (!dock) return;
    const changes = view === "draft" ? allChanges() : [];
    const show = isFreigabe() && view === "draft" && changes.length > 0;
    dock.hidden = !show;
    document.body.classList.toggle("hvw-has-review", show);
    if (!show) {
      document.querySelectorAll(".hvw-review-current").forEach((el) => el.classList.remove("hvw-review-current"));
      return;
    }
    syncReviewIndex(changes);
    const item = changes[reviewIndex];
    const open = changes.filter((c) => !acceptedIds.has(c.id)).length;
    $("#hvw-review-pos").textContent = reviewIndex + 1 + " / " + changes.length;
    $("#hvw-review-label").textContent = item.label;
    $("#hvw-review-open").textContent =
      open === 0
        ? "Alle angenommen — jetzt live schalten"
        : open + " noch offen";
    $("#hvw-review-old").textContent = clip(item.live, 140) || "—";
    $("#hvw-review-new").textContent = clip(item.draft, 140) || "—";
    const otherPage = item.page && item.page !== currentPageName();
    $("#hvw-review-page").textContent = otherPage ? "andere Seite — «Zur Stelle» wechseln" : "";
    $("#hvw-btn-accept").disabled = otherPage || acceptedIds.has(item.id);
    $("#hvw-btn-edit").disabled = otherPage;
    $("#hvw-btn-revert").disabled = otherPage;
    if (!otherPage) highlightCurrent(item.id);
  }

  function resumeReview() {
    if (!isFreigabe()) return;
    const changes = allChanges();
    if (!changes.length) return;
    const wanted = sessionStorage.getItem(REVIEW_KEY);
    if (wanted) {
      const found = changes.findIndex((c) => c.id === wanted);
      if (found >= 0) {
        goToChange(found, { instant: true, stay: true });
        return;
      }
    }
    const onPage = changes.findIndex((c) => (c.page || "index.html") === currentPageName());
    if (onPage >= 0) goToChange(onPage, { instant: true, stay: true });
    else {
      reviewIndex = 0;
      updateReviewDock();
    }
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

  async function saveDraft(quiet) {
    const fields = Object.assign({}, draftFields, collectFields());
    try {
      const data = await api("save", { method: "POST", headers: csrfHeaders(), body: JSON.stringify({ fields }) });
      draftFields = fields;
      dirty = false;
      if (!quiet) toast("Entwurf gespeichert. Noch nicht öffentlich.");
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
      acceptedIds = new Set();
      persistAccepted();
      sessionStorage.removeItem(REVIEW_KEY);
      markChangedFields();
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
      acceptedIds = new Set();
      persistAccepted();
      sessionStorage.removeItem(REVIEW_KEY);
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
        "<article class=\"hvw-diff-item\" data-jump=\"" +
          escapeHtml(id) +
          "\"><h3>" +
          escapeHtml(label) +
          "</h3><p class=\"hvw-diff-old\">" +
          escapeHtml(strip(a)) +
          "</p><p class=\"hvw-diff-new\">" +
          escapeHtml(strip(b)) +
          "</p><p><button type=\"button\" class=\"hvw-diff-jump\" data-jump-id=\"" +
          escapeHtml(id) +
          "\">Zur Stelle</button></p></article>"
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
          <span id="hvw-legend" hidden><span class="hvw-legend-swatch" aria-hidden="true"></span> Orange = geändert, noch nicht live</span>
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
          <button type="button" id="hvw-btn-publish" hidden>Live schalten</button>
          <a id="hvw-btn-zugang" hidden href="redaktion/zugang.php">E-Mail-Zugang</a>
          <button type="button" id="hvw-btn-logout">Abmelden</button>
        </div>
      </div>
      <div id="hvw-review-dock" hidden>
        <div class="hvw-review-dock__nav">
          <button type="button" id="hvw-btn-prev" title="Vorherige Änderung">← Vorherige</button>
          <span id="hvw-review-pos">0 / 0</span>
          <button type="button" id="hvw-btn-next" title="Nächste Änderung">Nächste →</button>
        </div>
        <div class="hvw-review-dock__meta">
          <strong id="hvw-review-label"></strong>
          <span id="hvw-review-page"></span>
          <span id="hvw-review-open"></span>
        </div>
        <div class="hvw-review-dock__compare">
          <p><span>Live</span> <span id="hvw-review-old"></span></p>
          <p><span>Entwurf</span> <span id="hvw-review-new"></span></p>
        </div>
        <div class="hvw-review-dock__actions">
          <button type="button" id="hvw-btn-goto">Zur Stelle</button>
          <button type="button" id="hvw-btn-accept">Annehmen</button>
          <button type="button" id="hvw-btn-edit">Ändern</button>
          <button type="button" id="hvw-btn-revert">Rückgängig</button>
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
    $("#hvw-diff-body").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-jump-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-jump-id");
      $("#hvw-diff").hidden = true;
      const changes = allChanges();
      const idx = changes.findIndex((c) => c.id === id);
      if (idx >= 0) goToChange(idx, { focus: true });
    });
    $("#hvw-btn-prev").addEventListener("click", () => goRelative(-1));
    $("#hvw-btn-next").addEventListener("click", () => goRelative(1));
    $("#hvw-btn-goto").addEventListener("click", () => goToChange(reviewIndex, { focus: true }));
    $("#hvw-btn-accept").addEventListener("click", acceptCurrent);
    $("#hvw-btn-edit").addEventListener("click", editCurrent);
    $("#hvw-btn-revert").addEventListener("click", revertCurrent);
    document.addEventListener("keydown", (e) => {
      if (!isFreigabe() || view !== "draft") return;
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        goRelative(1);
      }
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        goRelative(-1);
      }
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
        const id = el.getAttribute("data-content");
        if (acceptedIds.has(id)) {
          acceptedIds.delete(id);
          persistAccepted();
        }
        markDirty();
        updateCounter();
      });
      el.addEventListener("keydown", onKey);
      el.addEventListener("paste", onPaste);
      el.addEventListener("blur", () => {
        if (el.getAttribute("data-content-rich") === "1") {
          el.innerHTML = window.hvwSanitizeRich(el.innerHTML);
        }
        markChangedFields();
      });
      el.addEventListener("click", (e) => {
        if (view !== "draft") return;
        e.stopPropagation();
      });
    });
    document.addEventListener(
      "click",
      (e) => {
        if (view !== "draft") return;
        const field = e.target.closest && e.target.closest("[data-content]");
        if (!field) return;
        const link = e.target.closest("a");
        if (link && link.contains(field)) e.preventDefault();
      },
      true
    );
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
      resumeReview();
    } catch (err) {
      console.warn("Redaktion nicht gestartet:", err);
    }
  }

  boot();
})();
