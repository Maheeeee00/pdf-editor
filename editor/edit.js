/*
 * Student Tools — click-to-edit mode
 * ------------------------------------------------------------
 * Loaded only by the local editor (editor/server.js). It is never part of
 * the published site, so students cannot edit anything.
 *
 * Click any text to change it. Enter (or clicking elsewhere) saves,
 * Shift+Enter adds a line break, Esc undoes the change you are making.
 */
(function () {
  var PAGE_TEXT = "h1,h2,h3,h4,p,li,summary,td,th,.feature strong,.feature span,.site-footer .wrap";
  var SKIP = "#grid,#chips,script,style,.ed-bar";

  var file = location.pathname.replace(/\/$/, "/index.html");
  var source = null;            // this page's file, parsed; edits are copied into it, then it is saved
  var original = new WeakMap(); // element -> its HTML when editing started
  var queue = Promise.resolve();
  var on = true;
  try { on = localStorage.getItem("ed-on") !== "0"; } catch (e) {}

  // ---- Styles and toolbar ------------------------------------------------
  var css = document.createElement("style");
  css.textContent =
    "body.ed-on [data-ed]{cursor:text;border-radius:4px}" +
    "body.ed-on [data-ed]:hover{outline:2px dashed #2f5bea;outline-offset:3px}" +
    "body.ed-on [data-ed]:focus{outline:2px solid #2f5bea;outline-offset:3px;background:rgba(47,91,234,.07)}" +
    "body{padding-bottom:96px}" +
    ".ed-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;" +
    "justify-content:center;flex-wrap:wrap;gap:8px 12px;width:max-content;max-width:calc(100vw - 32px);padding:10px 14px;" +
    "border-radius:14px;background:#1c2233;color:#fff;font:14px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;" +
    "box-shadow:0 6px 24px rgba(0,0,0,.28)}" +
    ".ed-bar button{font:inherit;font-weight:600;border:0;border-radius:9px;padding:7px 12px;cursor:pointer}" +
    ".ed-bar button:disabled{opacity:.6;cursor:wait}" +
    ".ed-toggle{background:#3a4258;color:#fff}.ed-pub{background:#2f5bea;color:#fff}" +
    ".ed-msg{color:#c9cfdd}.ed-msg.err{color:#ffb4a8}.ed-msg a{color:#a9bdff}";
  document.head.appendChild(css);

  var bar = document.createElement("div");
  bar.className = "ed-bar";
  bar.innerHTML =
    '<span>✏️ <strong>Edit mode</strong></span>' +
    '<span class="ed-msg" role="status"></span>' +
    '<button type="button" class="ed-toggle"></button>' +
    '<button type="button" class="ed-pub">🚀 Publish to Vercel</button>';
  document.body.appendChild(bar);
  var msg = bar.querySelector(".ed-msg");
  var toggleBtn = bar.querySelector(".ed-toggle");
  var pubBtn = bar.querySelector(".ed-pub");

  function status(text, isError, html) {
    msg.className = "ed-msg" + (isError ? " err" : "");
    if (html) msg.innerHTML = html; else msg.textContent = text;
  }

  fetch("/__editor/raw?file=" + encodeURIComponent(file))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (t) { source = new DOMParser().parseFromString(t, "text/html"); })
    .catch(function () { status("This page's file couldn't be loaded, so changes here won't save.", true); });

  // ---- Making text editable ----------------------------------------------
  function mark() {
    document.querySelectorAll(PAGE_TEXT + ",[data-field]").forEach(function (el) {
      if (el.hasAttribute("data-ed")) return;
      var isTool = el.hasAttribute("data-field");
      if (!isTool && el.closest(SKIP)) return;
      if (el.parentElement.closest("[data-ed]")) return; // already part of a bigger editable block
      el.setAttribute("data-ed", isTool ? "tool" : "page");
      el.setAttribute("contenteditable", on ? "true" : "false");
    });
  }

  function setMode(value) {
    on = value;
    try { localStorage.setItem("ed-on", on ? "1" : "0"); } catch (e) {}
    document.body.classList.toggle("ed-on", on);
    document.querySelectorAll("[data-ed]").forEach(function (el) {
      el.setAttribute("contenteditable", on ? "true" : "false");
    });
    if (on) document.querySelectorAll("details").forEach(function (d) { d.open = true; });
    toggleBtn.textContent = on ? "👁 Preview" : "✏️ Edit";
    status(on ? "Click any text to change it — it saves by itself." : "Preview: links and buttons work normally.");
  }

  // ---- Saving ------------------------------------------------------------
  function post(url, body) {
    status("Saving…");
    queue = queue.then(function () {
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) {
          return r.json().then(function (j) {
            if (!r.ok || !j.ok) throw new Error(j.error || "error " + r.status);
            return j;
          });
        })
        .then(function () { status("Saved ✓ " + new Date().toLocaleTimeString()); })
        .catch(function (e) { status("Not saved: " + e.message, true); });
    });
    return queue;
  }

  function cleanHtml(html) {
    return html.replace(/(<br\s*\/?>|\s|&nbsp;)+$/i, "").replace(/^(\s|&nbsp;)+/, "");
  }

  function savePage(el) {
    if (!source) return status("Not saved: this page's file isn't loaded.", true);
    // Find the same element in the file by its position in the page.
    var steps = [];
    for (var node = el; node !== document.body; node = node.parentElement) {
      steps.unshift(Array.prototype.indexOf.call(node.parentElement.children, node));
    }
    var target = source.body;
    for (var i = 0; i < steps.length && target; i++) target = target.children[steps[i]];
    if (!target || target.tagName !== el.tagName) {
      return status("Not saved: couldn't find this text in the file. Reload the page and try again.", true);
    }
    target.innerHTML = cleanHtml(el.innerHTML);
    post("/__editor/save-page", { file: file, html: serialize() });
  }

  // Writes the page back out, keeping the file's layout tidy across repeated saves.
  function serialize() {
    return ("<!doctype html>\n" + source.documentElement.outerHTML)
      .replace(/^(<!doctype html>\n<html[^>]*>)\s*<head>/i, "$1\n<head>")
      .replace(/\s*<\/body>\s*<\/html>\s*$/i, "\n</body>\n</html>\n");
  }

  function saveTool(el) {
    var id = el.closest("[data-tool]").getAttribute("data-tool");
    var field = el.getAttribute("data-field");
    var value = el.textContent.replace(/\s+/g, " ").trim();
    if (typeof TOOLS !== "undefined") {
      TOOLS.forEach(function (t) { if (t.id === id) t[field] = value; });
    }
    post("/__editor/save-tool", { id: id, field: field, value: value });
  }

  function save(el) {
    var before = original.get(el);
    original.delete(el);
    if (before === undefined || before === el.innerHTML) return;
    if (el.getAttribute("data-ed") === "tool") saveTool(el); else savePage(el);
  }

  // ---- Events ------------------------------------------------------------
  function editable(target) {
    return on && target && target.closest ? target.closest("[data-ed]") : null;
  }

  document.addEventListener("focusin", function (e) {
    var el = editable(e.target);
    if (el && !original.has(el)) original.set(el, el.innerHTML);
  });

  document.addEventListener("focusout", function (e) {
    var el = editable(e.target);
    if (el) save(el);
  });

  document.addEventListener("keydown", function (e) {
    var el = editable(e.target);
    if (!el) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      el.blur();
    } else if (e.key === "Escape") {
      if (original.has(el)) el.innerHTML = original.get(el);
      el.blur();
    } else if (e.key === " " && el.tagName === "SUMMARY") {
      e.preventDefault(); // stop the space key from folding the guide
      document.execCommand("insertText", false, " ");
    }
  });

  document.addEventListener("click", function (e) {
    var el = editable(e.target);
    if (!el) return;
    // While editing, clicking text should place the cursor, not follow a link or fold a guide.
    if (e.target.closest("a") || el.tagName === "SUMMARY") e.preventDefault();
  }, true);

  document.addEventListener("paste", function (e) {
    if (!editable(e.target)) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text);
  });

  toggleBtn.addEventListener("click", function () { setMode(!on); });

  pubBtn.addEventListener("click", function () {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    pubBtn.disabled = true;
    status("Publishing to Vercel… this can take a minute.");
    queue.then(function () {
      return fetch("/__editor/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.error || "Publish failed");
        if (j.url) {
          var a = document.createElement("a");
          a.href = j.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = j.url;
          status("", false, "Live ✓ ");
          msg.appendChild(a);
        } else {
          status("Published ✓");
        }
      })
      .catch(function (e) { status("Not published: " + e.message, true); })
      .then(function () { pubBtn.disabled = false; });
  });

  // Cards on the home page are redrawn when you search or filter; make the new ones editable too.
  new MutationObserver(mark).observe(document.body, { childList: true, subtree: true });

  mark();
  setMode(on);
})();
