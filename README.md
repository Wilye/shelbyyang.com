## Website To-Dos
- [ ] Fix the flashing in between page navigations
- [ ] Write blogs page
- [ ] Write photos page
- [ ] Sync Obsidian notes to notes page
    - [x] Preprocess Obsidian specific syntax (strip image embeds (will add image support later), turn highlights into `<mark>`, and resolve wiki links)
    - [x] Parse standard markdown into HTML (headings, bold, list items, codes, URLs, etc.)
    - [x] Setup page template {title, sectionLabel, body, navHtml}
    - [ ] Support for obsidian callouts
    - [ ] Support for images
    - [ ] Support for math
    - [ ] Support for footnotes
    - [ ] Support for mermaid
    - [ ] Let user choose between terminal and directory in the right sidebar
- [ ] Switch from raw HTML/CSS/JS to some modern framework (optional ?)
- [x] Fix cursor disappearing from terminal upon navigations
- [ ] Incorporate a custom avatar that follows the cursor around (Live2D Cubism)
- [ ] Make sure that the bootline keeps going when the user tabs out of the website
- [ ] Fix the top navigation bar scrolling with the page
- [ ] Add header support in directory navigation for notes (maybe do a dropdown?)
- [ ] Make dark mode less dark

## Run on new machine
```
npm install
./sync-notes.sh
```

## How to Update Notes
If edited notes in Obsidian, run (will auto build):
```
./sync-notes.sh
```

If notes weren't edited, and you only need to rebuild the markdown notes into HTML, run:
```
node scripts/build-notes.js
```

## Deployment
Deployed with Cloudflare Pages. Notes are automatically built from `notes-src/`.
