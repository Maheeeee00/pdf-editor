/*
 * Student Tools — local editor
 * ------------------------------------------------------------
 * Serves the site on http://localhost:5500 with click-to-edit turned on,
 * saves each edit straight into the site's files, and publishes to Vercel.
 * It listens on 127.0.0.1 only, so no other computer can reach it.
 * Start it with start-editor.bat (or: node server.js).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = +(process.env.PORT || 5500);
const ROOT = path.resolve(__dirname, "..");
const EDITOR = __dirname;
const BACKUPS = path.join(EDITOR, "backups");
const TOOLS_FILE = path.join(ROOT, "assets", "tools.js");
const TOOL_FIELDS = ["name", "category", "summary", "icon"];
const HOSTS = ["localhost:" + PORT, "127.0.0.1:" + PORT];
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

// Resolves a URL path to a file inside the site folder, or null if it points outside it.
function sitePath(urlPath) {
  const f = path.resolve(ROOT, "." + decodeURIComponent(urlPath));
  return f === ROOT || f.startsWith(ROOT + path.sep) ? f : null;
}

// Only the site's own pages can be edited — not the editor or the software folder.
function editablePage(urlPath) {
  if (typeof urlPath !== "string") return null;
  const f = sitePath(urlPath);
  if (!f || path.extname(f).toLowerCase() !== ".html" || !fs.existsSync(f)) return null;
  const top = path.relative(ROOT, f).split(path.sep)[0];
  return top === "editor" || top === "software" ? null : f;
}

// Keeps a copy of a file before every save (the newest 100 are kept).
function backup(file) {
  fs.mkdirSync(BACKUPS, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = stamp + "_" + path.relative(ROOT, file).replace(/[\\/]/g, "_");
  fs.copyFileSync(file, path.join(BACKUPS, name));
  const all = fs.readdirSync(BACKUPS).sort();
  all.slice(0, Math.max(0, all.length - 100)).forEach((n) => fs.unlinkSync(path.join(BACKUPS, n)));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 5e6) { reject(new Error("Request too large")); req.destroy(); }
      else chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { reject(new Error("Bad request")); }
    });
  });
}

// Changes one field (e.g. summary) of one tool in assets/tools.js, leaving the rest of the file as it is.
function setToolField(src, id, field, value) {
  const idMatch = new RegExp('\\bid:\\s*"' + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"').exec(src);
  if (!idMatch) throw new Error("Tool not found in tools.js");
  const start = idMatch.index;
  const after = start + idMatch[0].length;
  const next = src.slice(after).search(/\n\s*id:\s*"/);
  const end = next === -1 ? src.length : after + next;
  const block = src.slice(start, end);
  const fieldRe = new RegExp("(\\b" + field + ':\\s*)"(?:[^"\\\\]|\\\\.)*"');
  if (!fieldRe.test(block)) throw new Error("Field '" + field + "' not found in tools.js");
  return src.slice(0, start) + block.replace(fieldRe, (all, pre) => pre + JSON.stringify(value)) + src.slice(end);
}

let publishing = false;

function runVercelDeploy() {
  return new Promise((resolve) => {
    const cmd = "npx --yes vercel@latest deploy --prod --yes";
    const p = process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", cmd], { cwd: ROOT, windowsHide: true })
      : spawn("sh", ["-c", cmd], { cwd: ROOT });
    let log = "";
    p.stdout.on("data", (d) => { log += d; process.stdout.write(d); });
    p.stderr.on("data", (d) => { log += d; process.stderr.write(d); });
    p.on("error", (err) => resolve({ code: -1, log: String(err) }));
    p.on("close", (code) => resolve({ code, log: log.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "") }));
  });
}

async function handlePost(req, res, pathname) {
  // Only pages served by this editor may save — blocks other websites from posting here.
  const fromHere = HOSTS.some((h) => req.headers.origin === "http://" + h);
  if (!fromHere || !String(req.headers["content-type"]).startsWith("application/json")) {
    return send(res, 403, { ok: false, error: "Not allowed" });
  }
  const body = await readJson(req);

  if (pathname === "/__editor/save-page") {
    const f = editablePage(body.file);
    if (!f || typeof body.html !== "string" || !/^<!doctype html>/i.test(body.html)) {
      return send(res, 400, { ok: false, error: "This page can't be saved" });
    }
    backup(f);
    fs.writeFileSync(f, body.html, "utf8");
    console.log("Saved " + path.relative(ROOT, f));
    return send(res, 200, { ok: true });
  }

  if (pathname === "/__editor/save-tool") {
    if (typeof body.id !== "string" || !TOOL_FIELDS.includes(body.field) || typeof body.value !== "string") {
      return send(res, 400, { ok: false, error: "Can't save that field" });
    }
    const updated = setToolField(fs.readFileSync(TOOLS_FILE, "utf8"), body.id, body.field, body.value);
    backup(TOOLS_FILE);
    fs.writeFileSync(TOOLS_FILE, updated, "utf8");
    console.log("Saved assets/tools.js (" + body.id + "." + body.field + ")");
    return send(res, 200, { ok: true });
  }

  if (pathname === "/__editor/publish") {
    if (publishing) return send(res, 409, { ok: false, error: "Already publishing — please wait" });
    publishing = true;
    try {
      console.log("Publishing to Vercel…");
      const { code, log } = await runVercelDeploy();
      if (code !== 0) {
        const needsLogin = /credentials|vercel login|not logged in|log in/i.test(log);
        const error = needsLogin
          ? "Not signed in to Vercel. Run: npx.cmd vercel login"
          : (log.trim().split("\n").filter(Boolean).pop() || "Publish failed");
        return send(res, 500, { ok: false, error, log });
      }
      const aliased = /Aliased:\s*(https:\/\/\S+)/.exec(log);
      const urls = (log.match(/https:\/\/[^\s[\]]+\.vercel\.app/g) || []).sort((a, b) => a.length - b.length);
      return send(res, 200, { ok: true, url: aliased ? aliased[1] : urls[0] || null, log });
    } finally {
      publishing = false;
    }
  }

  return send(res, 404, { ok: false, error: "Unknown action" });
}

http.createServer(async (req, res) => {
  try {
    if (!HOSTS.includes(req.headers.host)) return send(res, 403, "Forbidden", "text/plain");
    const url = new URL(req.url, "http://localhost");

    if (req.method === "POST") return await handlePost(req, res, url.pathname);

    if (url.pathname === "/__editor/edit.js") {
      return send(res, 200, fs.readFileSync(path.join(EDITOR, "edit.js")), TYPES[".js"]);
    }
    if (url.pathname === "/__editor/raw") {
      const f = editablePage(url.searchParams.get("file"));
      return f ? send(res, 200, fs.readFileSync(f, "utf8"), TYPES[".txt"]) : send(res, 404, "Not found", TYPES[".txt"]);
    }

    let p = url.pathname;
    if (p.endsWith("/")) p += "index.html";
    const f = sitePath(p);
    if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return send(res, 404, "Not found", TYPES[".txt"]);

    const ext = path.extname(f).toLowerCase();
    if (ext === ".html") {
      // Add the edit-mode script to the page as it is sent. The file on disk never contains it.
      const tag = '<script src="/__editor/edit.js"></script>\n';
      const html = fs.readFileSync(f, "utf8");
      const i = html.toLowerCase().lastIndexOf("</body>");
      return send(res, 200, i === -1 ? html + tag : html.slice(0, i) + tag + html.slice(i), TYPES[".html"]);
    }
    return send(res, 200, fs.readFileSync(f), TYPES[ext] || "application/octet-stream");
  } catch (e) {
    console.error(e);
    send(res, 500, { ok: false, error: e.message });
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log("Student Tools editor: http://localhost:" + PORT);
  console.log("Click any text on the page to change it. Close this window to stop.");
});
