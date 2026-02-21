# Hypomnēmata

A tool for the ancient practice of collecting quotes, extracts, reflections, and principles. Fully offline, statically hosted.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:5173/hypomnemata/)
npm run build     # Build for production (output in dist/)
npm run preview   # Preview production build
node test.mjs     # Run browser tests (requires dev server running)
```

## Stack

- **UI:** Preact + preact/hooks
- **Build:** Vite
- **PWA:** vite-plugin-pwa (Workbox)
- **Storage:** Dexie.js (IndexedDB)
- **Search:** MiniSearch (fuzzy text)
- **Semantic Search:** Transformers.js (optional, lazy-loaded)

## Project Structure

```
src/
  main.jsx              — app entry
  app.jsx               — root component, hash-based routing
  components/
    EntryCard.jsx       — entry display card
    EntryForm.jsx       — add/edit form with tag parsing
    SearchBar.jsx       — search input
    TagList.jsx         — tag management view
    Meditate.jsx        — random entry resurfacing
    Settings.jsx        — export/import, clear data
    KeyboardHelp.jsx    — keyboard shortcuts overlay
  db/
    index.js            — Dexie schema
    operations.js       — CRUD helpers
  search/
    text.js             — MiniSearch setup
    semantic.js         — Transformers.js lazy loader
  styles/
    global.css          — design system, typography
    components.css      — component styles
  utils/
    tags.js             — #hashtag parsing, source detection
    dates.js            — relative date formatting
```

## Deployment

Built for GitHub Pages with base path `/hypomnemata/`. Deployed via GitHub Actions.
