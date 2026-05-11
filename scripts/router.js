import * as index  from './index.js';
import * as panels from './panels.js';

const PARAM = 'stack';

let _base   = '';
let _config = null;

export const base     = ()   => _base;
export const basename = path => _base + path;
export const href     = id   =>
  _base + '/' + id.split('/').map(encodeURIComponent).join('/');

export function init(config) {
  _config = config;
  _base   = computeBase(config);
  decodeSpaRedirect();
  redirectRootToLanding();
  window.addEventListener('popstate', syncFromURL);
  syncFromURL();
}

// SPEC §6: the root path redirects to the default landing note (first
// bookmark) so the URL always names the visible primary note.
function redirectRootToLanding() {
  const rel = location.pathname.startsWith(_base)
    ? location.pathname.slice(_base.length)
    : location.pathname;
  const segments = rel.split('/').filter(Boolean);
  if (segments.length > 0) return;
  const landing = _config.bookmarks?.[0];
  if (!landing) return;
  const encoded = landing.split('/').map(encodeURIComponent).join('/');
  history.replaceState(null, '', _base + '/' + encoded + location.search + location.hash);
}

function computeBase(config) {
  if (location.host.endsWith('.github.io')) {
    const seg = location.pathname.split('/').filter(Boolean)[0];
    return seg ? '/' + seg : '';
  }
  return config.basename ?? '';
}

// rafgraph/spa-github-pages handshake: 404.html rewrites
//   /immergruen/foo/bar?baz   →   /immergruen/?/foo/bar&baz
// On entry we restore the original path before any other module reads the URL.
function decodeSpaRedirect() {
  const search = location.search;
  if (!search.startsWith('?/')) return;
  const decoded = search.slice(2)
    .replace(/&/g, '?')
    .replace(/~and~/g, '&');
  const restored = _base + '/' + decoded + location.hash;
  history.replaceState(null, '', restored);
}

export function getStack() {
  const path = location.pathname.startsWith(_base)
    ? location.pathname.slice(_base.length)
    : location.pathname;
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);

  let primary = null;
  for (let i = segments.length; i > 0; i--) {
    const candidate = segments.slice(0, i).join('/');
    if (index.hasNote(candidate)) { primary = candidate; break; }
  }

  if (!primary) {
    if (segments.length === 0) {
      primary = _config.bookmarks?.[0] ?? '__not_found__';
    } else {
      primary = '__not_found__';
    }
  }

  const stacked = new URLSearchParams(location.search)
    .getAll(PARAM).map(decodeURIComponent).filter(Boolean);
  return [primary, ...stacked];
}

export function pushStack(stack) {
  const [primary, ...rest] = stack;
  const params = new URLSearchParams();
  rest.forEach(id => params.append(PARAM, id));
  const query = params.toString();
  const path  = primary.split('/').map(encodeURIComponent).join('/');
  const url   = _base + '/' + path + (query ? '?' + query : '');
  history.pushState(null, '', url);
  syncFromURL();
}

function syncFromURL() {
  panels.renderStack(getStack());
}
