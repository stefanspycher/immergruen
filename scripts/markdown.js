import {escapeHtml} from './dom.js';

const FENCE       = /^```(\S*)?\s*$/;
const FENCE_CLOSE = /^```\s*$/;
const HEADING     = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const HR          = /^(---|\*\*\*|___)\s*$/;
const BQ          = /^>\s?(.*)$/;
const TABLE_ROW   = /^\|.*\|\s*$/;
const TABLE_SEP   = /^\|\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/;
const LIST_ITEM   = /^(\s*)([-*+]|\d+\.)\s+(.*)$/;
const INDENT_CODE = /^    (.*)$/;

const HARD_BREAK_MARK = '\x01';

export function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  return parseBlocks(lines);
}

function parseBlocks(lines) {
  let out = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') { i++; continue; }

    let m = line.match(FENCE);
    if (m) {
      const lang = m[1] || '';
      const content = [];
      i++;
      while (i < lines.length && !FENCE_CLOSE.test(lines[i])) {
        content.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      out += `<pre><code${langAttr}>${escapeHtml(content.join('\n'))}</code></pre>`;
      continue;
    }

    m = line.match(HEADING);
    if (m) {
      const n = m[1].length;
      out += `<h${n}>${inline(m[2])}</h${n}>`;
      i++;
      continue;
    }

    if (HR.test(line)) {
      out += '<hr>';
      i++;
      continue;
    }

    if (BQ.test(line)) {
      const bqLines = [];
      while (i < lines.length && BQ.test(lines[i])) {
        bqLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out += `<blockquote>${parseBlocks(bqLines)}</blockquote>`;
      continue;
    }

    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const head = splitTableRow(line);
      const aligns = parseAligns(lines[i + 1]);
      i += 2;
      const body = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        body.push(splitTableRow(lines[i]));
        i++;
      }
      out += renderTable(head, aligns, body);
      continue;
    }

    if (LIST_ITEM.test(line)) {
      const items = [];
      while (
        i < lines.length &&
        (LIST_ITEM.test(lines[i]) ||
          (lines[i].trim() === '' &&
            i + 1 < lines.length &&
            LIST_ITEM.test(lines[i + 1])))
      ) {
        if (lines[i].trim() !== '') items.push(parseItem(lines[i]));
        i++;
      }
      out += renderList(items, items[0].indent);
      continue;
    }

    if (INDENT_CODE.test(line)) {
      const codeLines = [];
      while (
        i < lines.length &&
        (INDENT_CODE.test(lines[i]) ||
          (lines[i].trim() === '' &&
            i + 1 < lines.length &&
            INDENT_CODE.test(lines[i + 1])))
      ) {
        codeLines.push(INDENT_CODE.test(lines[i]) ? lines[i].slice(4) : '');
        i++;
      }
      out += `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isBlockStart(lines[i], lines[i + 1])
    ) {
      let l = lines[i];
      if (l.endsWith('  ')) l = l.trimEnd() + HARD_BREAK_MARK;
      else if (l.endsWith('\\')) l = l.slice(0, -1) + HARD_BREAK_MARK;
      para.push(l);
      i++;
    }
    out += `<p>${inline(para.join(' '))}</p>`;
  }
  return out;
}

function isBlockStart(line, next) {
  if (FENCE.test(line)) return true;
  if (HEADING.test(line)) return true;
  if (HR.test(line)) return true;
  if (BQ.test(line)) return true;
  if (LIST_ITEM.test(line)) return true;
  if (TABLE_ROW.test(line) && next && TABLE_SEP.test(next)) return true;
  if (INDENT_CODE.test(line)) return true;
  return false;
}

function splitTableRow(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}

function parseAligns(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map(c => {
    const t = c.trim();
    const left = t.startsWith(':');
    const right = t.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return null;
  });
}

function renderTable(head, aligns, body) {
  const cell = (tag, c, i) => {
    const a = aligns[i];
    const style = a ? ` style="text-align:${a}"` : '';
    return `<${tag}${style}>${inline(c)}</${tag}>`;
  };
  const headHtml = '<tr>' + head.map((c, i) => cell('th', c, i)).join('') + '</tr>';
  const bodyHtml = body.map(row =>
    '<tr>' + row.map((c, i) => cell('td', c, i)).join('') + '</tr>'
  ).join('');
  return `<table><thead>${headHtml}</thead><tbody>${bodyHtml}</tbody></table>`;
}

function parseItem(line) {
  const m = line.match(LIST_ITEM);
  return { indent: m[1].length, marker: m[2], content: m[3] };
}

function renderList(items, indent) {
  const ordered = /^\d/.test(items.find(it => it.indent === indent).marker);
  const tag = ordered ? 'ol' : 'ul';
  let html = `<${tag}>`;
  let i = 0;
  while (i < items.length) {
    if (items[i].indent !== indent) { i++; continue; }

    const children = [];
    let j = i + 1;
    while (j < items.length && items[j].indent > indent) {
      children.push(items[j]);
      j++;
    }

    let content = items[i].content;
    let liClass = '';
    let taskHtml = '';
    const t = content.match(/^\[([ xX])\]\s+(.*)$/);
    if (t) {
      const checked = t[1].toLowerCase() === 'x' ? ' checked' : '';
      taskHtml = `<input type="checkbox" disabled${checked}>`;
      content = t[2];
      liClass = ' class="task-list-item"';
    }

    let liInner = taskHtml + inline(content);
    if (children.length > 0) {
      liInner += renderList(children, children[0].indent);
    }
    html += `<li${liClass}>${liInner}</li>`;
    i = j;
  }
  html += `</${tag}>`;
  return html;
}

function inline(text) {
  const holds = [];
  const hold = html => {
    holds.push(html);
    return `\x00${holds.length - 1}\x00`;
  };

  // 2. Code spans (consume first; no further inline parsing inside)
  text = text.replace(/`([^`]+)`/g, (_, c) =>
    hold(`<code>${escapeHtml(c)}</code>`));

  // 3. Auto-links (URL then email)
  text = text.replace(/<(https?:\/\/[^>\s]+)>/g, (_, url) => {
    const ext = isExternal(url);
    const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : '';
    return hold(`<a href="${escapeHtml(url)}"${attrs}>${escapeHtml(url)}</a>`);
  });
  text = text.replace(/<([^@\s>]+@[^@\s>]+)>/g, (_, email) =>
    hold(`<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`));

  // 4. Images
  text = text.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, src, title) => {
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return hold(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${titleAttr}>`);
    }
  );

  // 5. Markdown links
  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, label, href, title) => {
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const ext = isExternal(href);
      const extAttr = ext ? ' target="_blank" rel="noopener noreferrer"' : '';
      return hold(`<a href="${escapeHtml(href)}"${titleAttr}${extAttr}>${escapeHtml(label)}</a>`);
    }
  );

  // 1. HTML-escape what remains
  text = escapeHtml(text);

  // 6. Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // 7. Italic
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 8. Strikethrough
  text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // 9. Hard line breaks
  text = text.split(HARD_BREAK_MARK).join('<br>');

  // Restore placeholders
  text = text.replace(/\x00(\d+)\x00/g, (_, n) => holds[+n]);

  return text;
}

function isExternal(href) {
  try {
    const u = new URL(href, location.href);
    return u.origin !== location.origin;
  } catch {
    return false;
  }
}
