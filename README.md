# Student Tools

A small static "tools" section for the school website. No build step — just HTML, CSS and JavaScript.

```
index.html              Tools home page (search + category filters)
tools/stirling-pdf.html Guide + launcher for Stirling PDF
assets/style.css        Shared styles (light and dark mode)
assets/tools.js         The list of tools — edit this to add tools
```

## Editing the text (click to edit)

1. Double-click `editor\start-editor.bat`. The site opens at http://localhost:5500 in **edit mode**.
2. Click any heading, paragraph, list item or tool card and type. **Enter** (or clicking elsewhere) saves it
   straight into the file; **Shift+Enter** adds a line break; **Esc** cancels the change you're making.
3. Click **🚀 Publish to Vercel** in the toolbar to put your changes on the live site.

Edit mode only exists on this computer; the live site has no editing. A copy of each file is kept in
`editor\backups\` before every save (newest 100), so you can restore an older version.
Use **👁 Preview** in the toolbar to click links and buttons normally.

## Adding it to the school website

Copy the whole folder into your website (for example as `/tools/`) and link to `index.html` from your menu.
Open `index.html` directly in a browser to preview it.

## Stirling PDF needs a server

Stirling PDF (https://github.com/Stirling-Tools/stirling-pdf) is a self-hosted app: it does not run inside these pages.
The school (or IT department) runs it on a server, and these pages link to it. Files then stay on the school's server.

Quick start with Docker (on the server):

```
docker run -d --name stirling-pdf -p 8080:8080 --restart unless-stopped stirlingtools/stirling-pdf:latest
```

Then open `assets/tools.js` and change `openUrl` for Stirling PDF to the server's address,
for example `https://pdf.yourschool.edu` or `http://192.168.1.20:8080`.
Check the project's README for the latest install options and image name.

The "Use it on this page" button embeds the tool in an iframe. If it appears blank, the server
is blocking embedding or uses `http` while your site uses `https` — the "Open" button always works.

## Adding another tool

1. In `assets/tools.js`, copy the Stirling PDF entry and change the fields.
2. Copy `tools/stirling-pdf.html` to `tools/<new-tool>.html`, change the text, and change the `id` in the script at the bottom.
