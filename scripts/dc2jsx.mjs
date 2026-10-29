// Compiles a dc-runtime template (the Halal Living mockup's template language) into JSX,
// reproducing the runtime's parse + render semantics.
import { parseFragment } from 'parse5';
import crypto from 'node:crypto';

const CAMEL_ATTR = 'sc-camel-';
const RAW_WRAP = { select: 'sc-raw-select', table: 'sc-raw-table', tbody: 'sc-raw-tbody', thead: 'sc-raw-thead', tfoot: 'sc-raw-tfoot', tr: 'sc-raw-tr', td: 'sc-raw-td', th: 'sc-raw-th', caption: 'sc-raw-caption' };
const RAW_UNWRAP = Object.fromEntries(Object.entries(RAW_WRAP).map(([k, v]) => [v, k]));
const EVENT_MAP = { onclick: 'onClick', onchange: 'onChange', oninput: 'onInput', onsubmit: 'onSubmit', onkeydown: 'onKeyDown', onkeyup: 'onKeyUp', onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', onfocus: 'onFocus', onblur: 'onBlur', onmousemove: 'onMouseMove' };
const ATTRS = `(?:[^>"']|"[^"]*"|'[^']*')*`;
const IMPORT_SELF_CLOSE_RE = new RegExp('<(x-import|dc-import)(' + ATTRS + ')/>', 'gi');
const CAMEL_ATTR_RE = /(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)/g;
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*/;
const NUMBER_RE = /^-?\d+(\.\d+)?$/;
const A11Y_TAGS = new Set(['div', 'span', 'li', 'p', 'section', 'article']);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const HTML_ATTR = {
  tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength', autocomplete: 'autoComplete',
  autofocus: 'autoFocus', inputmode: 'inputMode', enterkeyhint: 'enterKeyHint', spellcheck: 'spellCheck',
  contenteditable: 'contentEditable', crossorigin: 'crossOrigin', srcset: 'srcSet', colspan: 'colSpan', rowspan: 'rowSpan',
  allowfullscreen: 'allowFullScreen', playsinline: 'playsInline', autoplay: 'autoPlay', referrerpolicy: 'referrerPolicy',
  datetime: 'dateTime', novalidate: 'noValidate', fetchpriority: 'fetchPriority', 'xlink:href': 'xlinkHref',
  'accept-charset': 'acceptCharset', 'http-equiv': 'httpEquiv', frameborder: 'frameBorder', formaction: 'formAction',
  usemap: 'useMap', itemprop: 'itemProp', itemscope: 'itemScope', itemtype: 'itemType', viewbox: 'viewBox',
};

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

export function cssToObj(css) {
  const o = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    o[prop.startsWith('--') ? prop : camel(prop)] = decl.slice(i + 1).trim();
  }
  return o;
}

function encodeCase(html) {
  html = html.replace(IMPORT_SELF_CLOSE_RE, (_, t, a) => '<' + t + a + '></' + t + '>');
  html = html.replace(/<helmet(\s|>)/gi, '<sc-helmet$1').replace(/<\/helmet\s*>/gi, '</sc-helmet>');
  html = html.replace(CAMEL_ATTR_RE, (_, sp, name, eq) => sp + CAMEL_ATTR + name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()) + eq);
  for (const [real, alias] of Object.entries(RAW_WRAP)) html = html.replace(new RegExp('(</?)' + real + '(?=[\\s>])', 'gi'), '$1' + alias);
  return html;
}

// ---- expressions (mirrors the runtime's resolve()) ----
function parensWrapWhole(e) {
  let d = 0;
  for (let i = 0; i < e.length; i++) {
    if (e[i] === '(') d++;
    else if (e[i] === ')') { d--; if (d === 0 && i < e.length - 1) return false; }
  }
  return d === 0;
}
function findTopLevelEquality(expr) {
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (depth === 0 && (c === '=' || c === '!') && expr[i + 1] === '=') {
      if (i > 0 && (expr[i - 1] === '=' || expr[i - 1] === '!')) continue;
      if (!expr.slice(0, i).trim()) continue;
      const op = expr[i + 2] === '=' ? c + '==' : c + '=';
      return { index: i, op };
    }
  }
  return null;
}
export function tx(src, scope, warn) {
  const expr = String(src).trim();
  if (!expr) return 'undefined';
  if (expr[0] === '(' && expr[expr.length - 1] === ')' && parensWrapWhole(expr)) return tx(expr.slice(1, -1), scope, warn);
  const eq = findTopLevelEquality(expr);
  if (eq) return '(' + tx(expr.slice(0, eq.index), scope, warn) + ' ' + eq.op + ' ' + tx(expr.slice(eq.index + eq.op.length), scope, warn) + ')';
  if (expr[0] === '!') return '!(' + tx(expr.slice(1), scope, warn) + ')';
  if (['true', 'false', 'null', 'undefined'].includes(expr)) return expr;
  if (NUMBER_RE.test(expr)) return expr;
  if (expr.length >= 2 && (expr[0] === '"' || expr[0] === "'") && expr[expr.length - 1] === expr[0]) return JSON.stringify(expr.slice(1, -1));
  const head = expr.match(IDENT_RE);
  if (!head) { warn('bad expr: ' + expr); return 'undefined'; }
  let out = scope.has(head[0]) ? head[0] : 'v.' + head[0];
  let i = head[0].length;
  while (i < expr.length) {
    if (expr[i] === '.') {
      const m = expr.slice(i + 1).match(IDENT_RE) || expr.slice(i + 1).match(/^\d+/);
      if (!m) { warn('bad path: ' + expr); return 'undefined'; }
      out += /^\d/.test(m[0]) ? `?.[${m[0]}]` : `?.${m[0]}`;
      i += 1 + m[0].length;
    } else if (expr[i] === '[') {
      let depth = 1, j = i + 1;
      while (j < expr.length && depth > 0) { if (expr[j] === '[') depth++; else if (expr[j] === ']') { depth--; if (!depth) break; } j++; }
      if (depth) { warn('bad index: ' + expr); return 'undefined'; }
      out += `?.[${tx(expr.slice(i + 1, j), scope, warn)}]`;
      i = j + 1;
    } else { warn('unsupported expr: ' + expr); return 'undefined'; }
  }
  return out;
}

// returns { kind:'static', value } | { kind:'whole', js } | { kind:'mixed', parts:[...] }
function compileAttr(raw, scope, warn) {
  const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
  if (whole) return { kind: 'whole', js: tx(whole[1], scope, warn) };
  if (raw.includes('{{')) {
    const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
    const js = '`' + parts.map((s, i) => (i & 1 ? '${' + tx(s, scope, warn) + ' ?? ""}' : s.replace(/[`\\]/g, (c) => '\\' + c).replace(/\$\{/g, '\\${'))).join('') + '`';
    return { kind: 'mixed', js };
  }
  return { kind: 'static', value: raw };
}

function importantify(css) {
  const decls = [];
  let start = 0, depth = 0, quote = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; }
    else if (c === "'" || c === '"') quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ';' && depth === 0) { decls.push(css.slice(start, i)); start = i + 1; }
  }
  decls.push(css.slice(start));
  return decls.map((d) => d.trim()).filter(Boolean).map((d) => (/!\s*important$/i.test(d) ? d : d + ' !important')).join(';');
}

export function convert(html, opts = {}) {
  const warnings = [];
  const warn = (m) => warnings.push(m);
  const pseudo = new Map();
  const helmetCss = [];
  const imports = opts.imports || {};
  const usedImports = new Set();
  const frag = parseFragment(encodeCase(html));
  let indent = 0;

  const pad = () => '  '.repeat(indent + 2);

  function pseudoClass(name, css) {
    const key = name + '|' + css;
    if (!pseudo.has(key)) {
      const cls = (opts.prefix || 'hp') + crypto.createHash('sha1').update(key).digest('hex').slice(0, 7);
      const isEl = name === 'before' || name === 'after';
      pseudo.set(key, { cls, rule: '.' + cls + (isEl ? '::' : ':') + name + '{' + (isEl ? css : importantify(css)) + '}' });
    }
    return pseudo.get(key).cls;
  }

  function attrName(node, name) {
    let key = name;
    if (key.startsWith(CAMEL_ATTR)) return camel(key.slice(CAMEL_ATTR.length));
    if (key === 'class') return 'className';
    if (key === 'for') return 'htmlFor';
    if (key.startsWith('on')) return EVENT_MAP[key] || 'on' + key[2].toUpperCase() + key.slice(3);
    if (HTML_ATTR[key]) return HTML_ATTR[key];
    if (key.startsWith('aria-') || key.startsWith('data-')) return key;
    if (key.includes('-')) return camel(key);
    return key;
  }

  function propJs(c) {
    if (c.kind === 'static') return JSON.stringify(c.value);
    return '{' + c.js + '}';
  }

  function walkChildren(node, scope) {
    return (node.content ? node.content.childNodes : node.childNodes).map((c) => walk(c, scope)).filter((s) => s != null);
  }

  function walkText(txt, scope) {
    if (!txt.includes('{{')) {
      if (!txt.trim() && !txt.includes(' ')) return null;
      return '{' + JSON.stringify(txt) + '}';
    }
    const parts = txt.split(/\{\{([\s\S]+?)\}\}/g);
    return parts.map((p, i) => (i & 1 ? '{ip(' + tx(p, scope, warn) + ')}' : p ? '{' + JSON.stringify(p) + '}' : '')).join('');
  }

  function getAttrs(node) {
    return (node.attrs || []).map((a) => ({ name: a.prefix ? a.prefix + ':' + a.name : a.name, value: a.value }));
  }

  function walk(node, scope) {
    if (node.nodeName === '#text') return walkText(node.value, scope);
    if (node.nodeName === '#comment' || node.nodeName === '#documentType') return null;
    const tag = node.tagName;
    const attrs = getAttrs(node);
    const get = (n) => attrs.find((a) => a.name === n)?.value;
    if (tag === 'sc-for') {
      const list = compileAttr(get('list') || '', scope, warn);
      const as = get('as') || 'item';
      const inner = new Set(scope); inner.add(as); inner.add('$index');
      indent++;
      const kids = walkChildren(node, inner).join('\n' + pad());
      indent--;
      const listJs = list.kind === 'static' ? 'undefined' : list.js;
      return `{arr(${listJs}).map((${as}, $index) => (<Fragment key={$index}>\n${pad()}  ${kids}\n${pad()}</Fragment>))}`;
    }
    if (tag === 'sc-if') {
      const val = compileAttr(get('value') || '', scope, warn);
      indent++;
      const kids = walkChildren(node, scope).join('\n' + pad());
      indent--;
      const cond = val.kind === 'static' ? JSON.stringify(val.value) : val.js;
      return `{(${cond}) ? (<>\n${pad()}  ${kids}\n${pad()}</>) : null}`;
    }
    if (tag === 'sc-helmet') {
      for (const c of node.childNodes) if (c.tagName === 'style') helmetCss.push(c.childNodes.map((t) => t.value).join(''));
      return null;
    }
    if (tag === 'dc-import' || tag === 'x-import') {
      const name = get('name') || get('component') || '';
      const comp = imports[name];
      if (!comp) { warn('no import mapping for ' + name); return null; }
      usedImports.add(name);
      const props = [];
      for (const { name: n, value } of attrs) {
        if (['name', 'component', 'hint-size', 'style', 'data-dc-tpl', 'sc-name'].includes(n)) continue;
        let key = n.startsWith(CAMEL_ATTR) ? camel(n.slice(CAMEL_ATTR.length)) : n;
        if (key.includes('-') && !key.startsWith('aria-') && !key.startsWith('data-')) key = camel(key);
        props.push(key + '=' + propJs(compileAttr(value, scope, warn)));
      }
      return `<${comp[0]} ${props.join(' ')} />`;
    }
    const realTag = RAW_UNWRAP[tag] || tag;
    const props = [];
    const pseudoCls = [];
    const present = new Set();
    let styleStaticStr = '';
    let classJs = null;
    for (const { name, value } of attrs) {
      if (name === 'sc-name' || name === 'data-dc-tpl' || name === 'hint-size') continue;
      if (name.startsWith('style-')) { pseudoCls.push(pseudoClass(name.slice(6), value)); continue; }
      const key = attrName(node, name);
      present.add(key);
      const c = compileAttr(value, scope, warn);
      if (key === 'style') {
        if (c.kind === 'static') { styleStaticStr = c.value; props.push('style={' + JSON.stringify(cssToObj(c.value)) + '}'); }
        else if (c.kind === 'mixed') { styleStaticStr = value.replace(/\{\{[\s\S]+?\}\}/g, ''); props.push('style={sx(' + c.js + ')}'); }
        else props.push('style={sxv(' + c.js + ')}');
        continue;
      }
      if (key === 'className') { classJs = c; continue; }
      if ((key === 'value' || key === 'checked') && c.kind === 'whole') { props.push(`${key}={${c.js} ?? ${key === 'checked' ? 'false' : '""'}}`); continue; }
      props.push(key + '=' + propJs(c));
    }
    if (classJs || pseudoCls.length) {
      const extra = pseudoCls.join(' ');
      if (!classJs) props.push('className=' + JSON.stringify(extra));
      else if (classJs.kind === 'static') props.push('className=' + JSON.stringify([classJs.value, extra].filter(Boolean).join(' ')));
      else props.push('className={cx(' + classJs.js + (extra ? ', ' + JSON.stringify(extra) : '') + ')}');
    }
    // the runtime's installA11y(): clickable div/span/li/p/section/article become keyboard buttons
    if (A11Y_TAGS.has(realTag) && present.has('onClick') && !present.has('role') && !present.has('tabIndex') && !present.has('aria-hidden') && !/position\s*:\s*fixed/.test(styleStaticStr)) {
      const own = props.find((p) => p.startsWith('onKeyDown='));
      const ownJs = own ? own.slice('onKeyDown={'.length, -1) : 'undefined';
      if (own) props.splice(props.indexOf(own), 1);
      props.push('role="button"', 'tabIndex={0}', `onKeyDown={kb(${ownJs})}`);
      if (!present.has('aria-label') && present.has('title')) {
        const t = props.find((p) => p.startsWith('title='));
        props.push('aria-label' + t.slice(5));
      }
    }
    const open = '<' + realTag + (props.length ? ' ' + props.join(' ') : '');
    if (realTag === 'style' || realTag === 'script') {
      const body = node.childNodes.map((t) => t.value || '').join('');
      return open + ' dangerouslySetInnerHTML={{ __html: ' + JSON.stringify(body) + ' }} />';
    }
    if (VOID.has(realTag)) return open + ' />';
    indent++;
    const kids = walkChildren(node, scope);
    indent--;
    if (!kids.length) return open + ' />';
    return open + '>' + kids.join('') + '</' + realTag + '>';
  }

  const top = frag.childNodes.map((c) => walk(c, new Set())).filter((s) => s != null);
  return {
    jsx: top,
    css: [...pseudo.values()].map((p) => p.rule).join('\n'),
    helmetCss: helmetCss.join('\n'),
    imports: [...usedImports].map((n) => imports[n]),
    warnings,
  };
}
