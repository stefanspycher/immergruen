import * as index    from './index.js';
import * as cache    from './cache.js';
import * as renderer from './renderer.js';

const POPOVER_DELAY = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--popover-delay-ms'),
  10
);
const POPOVER_WIDTH = parseInt(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--popover-width'),
  10
);

const el      = document.getElementById('popover');
const content = el.querySelector('.popover-content');

let hoverTimer  = null;
let currentLink = null;

export function wire(linkEl) {
  if (linkEl.dataset.popoverWired === 'true') return;
  linkEl.dataset.popoverWired = 'true';
  linkEl.addEventListener('mouseenter', () => {
    currentLink = linkEl;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => show(linkEl), POPOVER_DELAY);
  });
  linkEl.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimer);
    if (currentLink === linkEl) currentLink = null;
    hide();
  });
}

async function show(linkEl) {
  const id = linkEl.dataset.note;
  if (!id) return;

  // Position before fetching so the popover never flashes at (0,0).
  position(linkEl);
  content.innerHTML = '';
  el.hidden = false;

  const md = renderer.isNotFound(id)
    ? renderer.notFoundContent()
    : await loadContent(id);

  // The hover may have ended while we were fetching.
  if (currentLink !== linkEl) return;
  content.innerHTML = renderer.process(id, md);
}

function hide() {
  el.hidden = true;
  content.innerHTML = '';
}

function position(linkEl) {
  const r = linkEl.getBoundingClientRect();
  const fitsRight = r.right + POPOVER_WIDTH <= window.innerWidth;
  const x = fitsRight ? r.right : Math.max(0, r.left - POPOVER_WIDTH);
  const midY = r.top + r.height / 2;
  el.style.left = x + 'px';
  el.style.top  = midY + 'px';
  el.style.transform = 'translateY(-50%)';
}

async function loadContent(id) {
  if (cache.has(id)) return cache.get(id);
  const note = index.getNote(id);
  if (!note) return renderer.notFoundContent();
  const path = note.path.split('/').map(encodeURIComponent).join('/');
  const res  = await fetch('./' + path);
  const text = res.ok ? await res.text() : renderer.notFoundContent();
  cache.set(id, text);
  return text;
}
