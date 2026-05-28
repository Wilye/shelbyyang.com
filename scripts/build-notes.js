#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'notes-src');
const OUTPUT_DIR = path.join(ROOT, 'notes');

function slugify(name) {
  return name
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function walkTree(dir, urlBase = '/notes') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.') && !e.name.startsWith('_'))
    .filter(e => !(e.isDirectory() && e.name === 'attachments'))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));

  const dirs = [];
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const slug = slugify(entry.name);
      dirs.push({
        name: entry.name,
        slug,
        url: `${urlBase}/${slug}/`,
        children: walkTree(fullPath, `${urlBase}/${slug}`),
      });
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      const base = entry.name.replace(/\.md$/i, '');
      const slug = slugify(base);
      files.push({
        name: base,
        slug,
        url: `${urlBase}/${slug}.html`,
        sourcePath: fullPath,
      });
    }
  }
  return { dirs, files };
}

function buildWikiMap(tree, map = {}) {
  for (const file of tree.files) {
    map[file.name.toLowerCase()] = file.url;
  }
  for (const dir of tree.dirs) {
    buildWikiMap(dir.children, map);
  }
  return map;
}

function preprocess(content, wikiMap) {
  // strip Obsidian image embeds: ![[whatever.png ...]]
  content = content.replace(/!\[\[[^\]]+\]\]/g, '');

  // highlights: ==text== → <mark>text</mark>
  content = content.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');

  // wiki-links: [[Page]] or [[Page|Alias]]
  content = content.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const [target, alias] = inner.split('|').map(s => s.trim());
    const display = alias || target;
    const url = wikiMap[target.toLowerCase()];
    if (url) return `[${display}](${url})`;
    return `<span class="wiki-broken">${escapeHtml(display)}</span>`;
  });

  return content;
}

function renderNav(tree, currentUrl) {
  let html = '<ul class="notes-tree">';
  for (const dir of tree.dirs) {
    const isActive = currentUrl === dir.url || currentUrl.startsWith(dir.url);
    html += `<li><a href="${dir.url}" class="notes-tree-dir${isActive ? ' active' : ''}">${escapeHtml(dir.name)}</a>`;
    if (dir.children.dirs.length || dir.children.files.length) {
      html += renderNav(dir.children, currentUrl);
    }
    html += '</li>';
  }
  for (const file of tree.files) {
    const isActive = currentUrl === file.url;
    html += `<li><a href="${file.url}" class="notes-tree-file${isActive ? ' active' : ''}">${escapeHtml(file.name)}</a></li>`;
  }
  html += '</ul>';
  return html;
}

function renderIndex(node) {
  if (!node.dirs.length && !node.files.length) {
    return '<p class="notes-empty">nothing here yet.</p>';
  }
  let html = '<ul class="notes-list">';
  for (const dir of node.dirs) {
    html += `<li><a href="${dir.url}" class="notes-link">${escapeHtml(dir.name)}</a></li>`;
  }
  for (const file of node.files) {
    html += `<li><a href="${file.url}" class="notes-link">${escapeHtml(file.name)}</a></li>`;
  }
  html += '</ul>';
  return html;
}

function pageTemplate({ title, sectionLabel, body, navHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shelby Yang — ${escapeHtml(title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="/styles.css">
    <link rel="icon" href="/favicon.ico">
</head>
<body class="pre-boot notes-page">
    <div class="page-layout">
        <div class="main-content">
            <div class="title">
                <a href="/" class="title-link">Shelby Yang</a>
                <nav class="nav-links">
                    <a href="/notes/">notes</a>
                    <a href="/blogs.html">blogs</a>
                    <a href="/photos.html">photos</a>
                    <button class="theme-toggle" aria-label="Toggle theme">☼</button>
                </nav>
            </div>
            <div class="boot-line" id="boot"></div>
            <div class="section-label">// ${escapeHtml(sectionLabel)}</div>
            <article class="notes-content">
${body}
            </article>
        </div>
        <aside class="notes-nav">
            <div class="notes-nav-header">// directory</div>
${navHtml}
        </aside>
    </div>
    <script src="/terminal.js"></script>
</body>
</html>
`;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeOut(relPath, html) {
  const fullPath = path.join(OUTPUT_DIR, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, html);
}

function build() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`source dir not found: ${SOURCE_DIR}`);
    console.error(`run ./sync-notes.sh first`);
    process.exit(1);
  }

  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  ensureDir(OUTPUT_DIR);

  const tree = walkTree(SOURCE_DIR);
  const wikiMap = buildWikiMap(tree);

  let pageCount = 0;

  // root landing
  writeOut('index.html', pageTemplate({
    title: 'notes',
    sectionLabel: 'notes',
    body: renderIndex(tree),
    navHtml: renderNav(tree, '/notes/'),
  }));
  pageCount++;

  function buildSubtree(node, relPath, urlPath) {
    // directory landing (skip for root, already done above)
    if (relPath) {
      writeOut(path.join(relPath, 'index.html'), pageTemplate({
        title: node._name,
        sectionLabel: node._name,
        body: renderIndex(node),
        navHtml: renderNav(tree, urlPath),
      }));
      pageCount++;
    }

    for (const subdir of node.dirs) {
      buildSubtree(
        { ...subdir.children, _name: subdir.name },
        path.join(relPath, subdir.slug),
        `${urlPath}${subdir.slug}/`
      );
    }

    for (const file of node.files) {
      const md = fs.readFileSync(file.sourcePath, 'utf8');
      const processed = preprocess(md, wikiMap);
      const rendered = marked.parse(processed);
      writeOut(path.join(relPath, `${file.slug}.html`), pageTemplate({
        title: file.name,
        sectionLabel: file.name,
        body: rendered,
        navHtml: renderNav(tree, file.url),
      }));
      pageCount++;
    }
  }

  buildSubtree(tree, '', '/notes/');

  console.log(`built ${pageCount} page${pageCount === 1 ? '' : 's'} → ${path.relative(ROOT, OUTPUT_DIR)}/`);
}

build();
