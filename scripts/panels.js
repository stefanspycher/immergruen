import * as index    from './index.js';
import * as cache    from './cache.js';
import * as renderer from './renderer.js';
import * as router   from './router.js';
import * as scroll   from './scroll.js';
import * as popover  from './popover.js';
import {escapeHtml}  from './dom.js';

const root     = document.getElementById('panels');
const template = document.getElementById('panel-template');

let currentStack = [];

export function renderHeader({title, bookmarks}) {
  const landing = bookmarks?.[0] ?? renderer.NOT_FOUND_ID;
  const titleEl = document.querySelector('.site-title');
  titleEl.textContent  = title;
  titleEl.href         = router.href(landing);
  titleEl.dataset.note = landing;
  document.querySelector('.bookmarks').innerHTML = (bookmarks ?? [])
    .map(id => {
      const t = index.getNote(id)?.title ?? id;
      return `<a href="${router.href(id)}" data-note="${id}" class="bookmark-link">${escapeHtml(t)}</a>`;
    }).join('');
}

export function renderStack(stack) {
  // Remove panels that are no longer in the stack.
  [...root.children].forEach(panel => {
    if (!stack.includes(panel.dataset.noteId)) panel.remove();
  });

  // Insert / reorder panels to match `stack`.
  stack.forEach((id, i) => {
    const existing = root.children[i];
    if (existing && existing.dataset.noteId === id) return;
    const panel = existingPanelFor(id) ?? stampPanel(id, i);
    root.insertBefore(panel, existing ?? null);
    if (panel.dataset.state !== 'ready') hydrate(panel, id);
  });

  // z-index ascends with stack position so later panels paint on top.
  [...root.children].forEach((p, i) => p.style.zIndex = i + 1);
  currentStack = stack;
  updateLinkOpenState();
  scroll.onStackChanged(stack);
}

function existingPanelFor(id) {
  return [...root.children].find(p => p.dataset.noteId === id) ?? null;
}

function stampPanel(id, stackIndex) {
  const fragment = template.content.cloneNode(true);
  const panel    = fragment.querySelector('.panel');
  panel.dataset.noteId = id;
  panel.style.zIndex   = stackIndex + 1;
  scroll.observe(panel);
  return panel;
}

async function hydrate(panel, id) {
  const note  = index.getNote(id);
  const title = note?.title ?? renderer.NOT_FOUND_TITLE;
  panel.querySelector('.panel-title').textContent = title;

  const md = renderer.isNotFound(id)
    ? renderer.notFoundContent()
    : await loadContent(id, note);

  panel.querySelector('.panel-content').innerHTML = renderer.process(id, md);
  if (!renderer.isNotFound(id) && note?.backlinks?.length) {
    renderBacklinks(panel, note);
  }
  panel.dataset.state = 'ready';

  panel.querySelectorAll('.internal-link').forEach(el => popover.wire(el));
  updateLinkOpenState();
}

async function loadContent(id, note) {
  if (cache.has(id)) return cache.get(id);
  const path = note.path.split('/').map(encodeURIComponent).join('/');
  const res  = await fetch('./' + path);
  const text = res.ok ? await res.text() : renderer.notFoundContent();
  cache.set(id, text);
  return text;
}

function renderBacklinks(panel, note) {
  const footer = panel.querySelector('.panel-backlinks');
  const items  = note.backlinks.map(id => {
    const t = index.getNote(id)?.title ?? id;
    return `<a href="${router.href(id)}" data-note="${id}" class="internal-link">${escapeHtml(t)}</a>`;
  }).join('');
  footer.innerHTML = '<p class="backlinks-label">Linked from</p>' + items;
  footer.hidden = false;
}

function updateLinkOpenState() {
  document.querySelectorAll('a[data-note]').forEach(el => {
    el.dataset.open = currentStack.includes(el.dataset.note) ? 'true' : 'false';
  });
}

const BREAKPOINT = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--breakpoint'),
  10
);
const isMobile = () => window.innerWidth < BREAKPOINT;

document.addEventListener('click', e => {
  const link = e.target.closest('a[data-note]');
  if (!link) return;
  e.preventDefault();
  const id = link.dataset.note;

  // Header clicks (site title, bookmarks) are top-level navigation per
  // SPEC.md §11: they always replace the stack with `[id]`, even if the
  // target is already open. Detected by absence of a parent `.panel`.
  const parentPanel = link.closest('.panel');
  if (!parentPanel || isMobile()) {
    router.pushStack([id]);
    return;
  }

  if (currentStack.includes(id)) {
    scroll.scrollToNote(id);
    return;
  }

  const parentId = parentPanel.dataset.noteId;
  const idx      = currentStack.indexOf(parentId);
  const trimmed  = idx >= 0
    ? currentStack.slice(0, idx + 1)
    : currentStack.slice(0, 1);

  router.pushStack([...trimmed, id]);
});

let _lastMobile = isMobile();
window.addEventListener('resize', () => {
  const now = isMobile();
  if (now !== _lastMobile) {
    _lastMobile = now;
    renderStack(currentStack);
  }
});
