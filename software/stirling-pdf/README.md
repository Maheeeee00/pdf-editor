# Stirling PDF — hosting files

Source: https://github.com/Stirling-Tools/stirling-pdf
Stirling PDF is a Java server (about 1–2 GB RAM). It cannot run on Vercel, so it needs a host of its own.
Pick **one** of the options below, then set `openUrl` in `../../assets/tools.js` to its address.

## Option A: Hugging Face Spaces (free, online)

The `huggingface-space/` folder is a ready-made Docker Space.

1. Sign in at https://huggingface.co and click **New Space**.
2. Choose **Docker** → **Blank** and the free **CPU basic** hardware.
3. Upload `huggingface-space/Dockerfile` and `huggingface-space/README.md` (replace the default README).
4. Wait for the build. Your tool is at `https://<username>-<space-name>.hf.space`.

Free Spaces go to sleep when nobody uses them, so the first visit after a while can take a minute.

## Option B: School server or VPS with Docker

```
docker compose up -d
```

Run it in this folder (uses `docker-compose.yml`). The tool is then at `http://<server-address>:8080`.
For students outside the school network, put it behind HTTPS (e.g. a reverse proxy such as Caddy or Nginx).

## Option C: A Windows PC with Java 25 (testing)

Stirling PDF v3.x needs **Java 25** (it will not start on Java 21).

1. Install Java 25: `winget install EclipseAdoptium.Temurin.25.JRE`
2. Double-click `download-stirling-pdf.bat` (re-run it if the download stops; it resumes).
3. Double-click `start-stirling-pdf.bat`. The tool runs at http://localhost:8080.

Only that PC can use it unless the firewall allows port 8080.
