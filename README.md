# Sarfaraz.ts — Portfolio

Code-themed / terminal-style portfolio. Pure HTML / CSS / JS. Zero deps.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create repo (suggested name: `ssadev.github.io` or `portfolio`).
2. Push:
   ```bash
   git init
   git add .
   git commit -m "init portfolio"
   git branch -M main
   git remote add origin git@github.com:ssadev/<repo>.git
   git push -u origin main
   ```
3. GitHub → repo Settings → Pages → Source: `main` / root → Save.
4. If repo is `<user>.github.io`, site live at `https://<user>.github.io/`.
   Otherwise at `https://<user>.github.io/<repo>/`.

`.nojekyll` is included so GitHub serves files as-is (no Jekyll pipeline).

## Files

- `index.html` — markup
- `styles.css` — VS Code Dark+ theme, Monokai alt
- `script.js` — copy-email, theme toggle, easter egg
- `resume.pdf` — downloadable resume
- `.nojekyll` — disable Jekyll on GitHub Pages

## Customizing

- Edit content directly in `index.html` (no templates / build step).
- Swap palette by editing CSS variables under `:root` and `[data-theme="monokai"]`.
- Replace `resume.pdf` to update download.
