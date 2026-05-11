import {renderMarkdown}  from './markdown.js';
import * as index        from './index.js';
import * as router       from './router.js';
import {escapeHtml}      from './dom.js';

export const NOT_FOUND_ID    = '__not_found__';
export const NOT_FOUND_TITLE = 'Not found';
const NOT_FOUND_MARKDOWN     =
  `# ${NOT_FOUND_TITLE}\n\nThis note does not exist.`;

export const isNotFound        = id => id === NOT_FOUND_ID;
export const notFoundContent   = () => NOT_FOUND_MARKDOWN;
export const resolveOrFallback = id =>
  index.hasNote(id) || isNotFound(id) ? id : NOT_FOUND_ID;

export function process(id, rawMd) {
  const stripped    = stripFrontmatter(rawMd);
  const withHeading = injectTitleHeading(id, stripped);
  const html        = renderMarkdown(withHeading);
  return resolveWikilinks(html);
}

function stripFrontmatter(md) {
  return md.startsWith('---')
    ? md.replace(/^---[\s\S]*?---\r?\n?/, '')
    : md;
}

function injectTitleHeading(id, md) {
  if (/^\s*#/.test(md)) return md;
  const title = isNotFound(id)
    ? NOT_FOUND_TITLE
    : (index.getNote(id)?.title ?? id);
  return `# ${title}\n\n${md}`;
}

const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function resolveTarget(raw) {
  const trimmed = raw.trim();
  if (index.hasNote(trimmed)) return trimmed;
  const byTitle = index.findByTitle(trimmed);
  return byTitle ?? NOT_FOUND_ID;
}

function resolveWikilinks(html) {
  const PROTECTED = /(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/g;
  const parts = html.split(PROTECTED);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part;
    return part.replace(WIKILINK, (_, raw, label) => {
      const target = resolveTarget(raw);
      const text   = label?.trim() ?? raw.trim();
      return `<a href="${router.href(target)}" data-note="${target}" class="internal-link">${escapeHtml(text)}</a>`;
    });
  }).join('');
}
