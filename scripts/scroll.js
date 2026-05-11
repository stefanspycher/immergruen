import * as index from './index.js';

const COLLAPSE_THRESHOLD = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--collapse-threshold'),
  10
);
const PANEL_WIDTH = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--panel-width'),
  10
);

const root = document.getElementById('panels');
let observer = null;
let siteTitle = '';

export function init(config) {
  siteTitle = config.title ?? '';
  observer = new IntersectionObserver(onIntersect, {
    root,
    threshold: [0, 0.5, 1],
  });
  root.addEventListener('scroll', () => {
    syncCollapse();
    updateTitle();
  }, { passive: true });
}

export function observe(panel) {
  observer?.observe(panel);
}

export function scrollToPanel(panel) {
  if (!panel) return;
  // Use the panel's offsetLeft so we land on a panel-aligned scroll position.
  root.scrollTo({ left: panel.offsetLeft, behavior: 'smooth' });
}

export function scrollToNote(id) {
  const panel = root.querySelector(`.panel[data-note-id="${cssEscape(id)}"]`);
  scrollToPanel(panel);
}

export function onStackChanged(stack) {
  // When the stack grows, focus the newly added (last) panel. When the stack
  // shrinks or a same-id update fires, keep the existing scroll position.
  const last = root.lastElementChild;
  if (last) scrollToPanel(last);
  syncCollapse();
  updateTitle();
}

function onIntersect(entries) {
  entries.forEach(entry => {
    entry.target.dataset.visible = String(entry.isIntersecting);
  });
  syncCollapse();
  updateTitle();
}

function syncCollapse() {
  [...root.children].forEach(panel => {
    const width = panel.getBoundingClientRect().width;
    panel.dataset.collapsed = String(width < COLLAPSE_THRESHOLD);
  });
}

function updateTitle() {
  const visibleTitles = [...root.children]
    .filter(p => p.dataset.visible !== 'false')
    .map(p => index.getNote(p.dataset.noteId)?.title)
    .filter(Boolean);
  document.title = visibleTitles.length
    ? visibleTitles.join(' | ')
    : siteTitle;
}

// CSS.escape is supported in all evergreen-target browsers. Fall back to
// a regex for older runtimes.
function cssEscape(s) {
  return typeof CSS !== 'undefined' && CSS.escape
    ? CSS.escape(s)
    : s.replace(/[^a-zA-Z0-9_-]/g, m => '\\' + m);
}
