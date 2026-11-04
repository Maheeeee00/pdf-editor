# Software used by Student Tools

This folder holds the setup files for the programs the tools pages link to.
It is **not** part of the website itself: `.vercelignore` keeps it out of the Vercel deploy.

| Folder | Software | Used by |
|---|---|---|
| `stirling-pdf/` | [Stirling PDF](https://github.com/Stirling-Tools/stirling-pdf) — PDF toolbox (Java server, port 8080) | `tools/stirling-pdf.html` |

When you add a new self-hosted tool, give it its own folder here with the same layout.

After a tool is online, put its address in `assets/tools.js` (`openUrl`).
