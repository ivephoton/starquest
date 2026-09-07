// Everything drawn on screen, as SVG. Vector rather than bitmap, so it stays
// sharp on an iPad's display at any size.

import { STROKES, EM, Y_OFFSET } from './data.js';

export const AVATARS = ['fox', 'dog', 'cat', 'bird', 'mouse', 'kangaroo', 'koala'];
export const AVATAR_NAME = {
  fox: ['Fox', '小狐狸'], dog: ['Dog', '小狗'], cat: ['Cat', '小猫'],
  bird: ['Bird', '小鸟'], mouse: ['Mouse', '小老鼠'],
  kangaroo: ['Kangaroo', '袋鼠'], koala: ['Koala', '考拉'],
};
const AVATAR_COL = {
  fox: '#ffb284', dog: '#cea678', cat: '#b0b0be', bird: '#7ec4ec',
  mouse: '#c4b2ba', kangaroo: '#d09c70', koala: '#a8a8b0',
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p);
  g = Math.round(g + (t - g) * p);
  b = Math.round(b + (t - b) * p);
  return `rgb(${r},${g},${b})`;
}

/** One of the seven animals, as an inline SVG string. */
export function avatarSVG(kind, size = 96, mood = 'happy') {
  const body = AVATAR_COL[kind] || AVATAR_COL.fox;
  const inner = shade(body, -0.15), dark = shade(body, -0.3);
  const cx = 50, cy = 54, r = 38;
  let ears = '';
  if (kind === 'fox' || kind === 'cat') {
    ears = `<path d="M26 30 L14 2 L48 20 Z" fill="${body}"/>
            <path d="M74 30 L86 2 L52 20 Z" fill="${body}"/>
            <path d="M29 28 L20 10 L44 22 Z" fill="#ff8a7a"/>
            <path d="M71 28 L80 10 L56 22 Z" fill="#ff8a7a"/>`;
  } else if (kind === 'dog') {
    ears = `<ellipse cx="14" cy="52" rx="12" ry="24" fill="${dark}"/>
            <ellipse cx="86" cy="52" rx="12" ry="24" fill="${dark}"/>`;
  } else if (kind === 'mouse') {
    ears = `<circle cx="20" cy="20" r="18" fill="${body}"/>
            <circle cx="80" cy="20" r="18" fill="${body}"/>
            <circle cx="20" cy="20" r="10" fill="#ff9a9a"/>
            <circle cx="80" cy="20" r="10" fill="#ff9a9a"/>`;
  } else if (kind === 'kangaroo') {
    ears = `<ellipse cx="34" cy="8" rx="8" ry="24" fill="${body}"/>
            <ellipse cx="66" cy="8" rx="8" ry="24" fill="${body}"/>
            <ellipse cx="34" cy="10" rx="4" ry="16" fill="#ff9a9a"/>
            <ellipse cx="66" cy="10" rx="4" ry="16" fill="#ff9a9a"/>`;
  } else if (kind === 'koala') {
    ears = `<circle cx="12" cy="36" r="22" fill="${shade(body, 0.15)}"/>
            <circle cx="88" cy="36" r="22" fill="${shade(body, 0.15)}"/>
            <circle cx="12" cy="36" r="13" fill="#ffb0b0"/>
            <circle cx="88" cy="36" r="13" fill="#ffb0b0"/>`;
  } else if (kind === 'bird') {
    ears = `<ellipse cx="12" cy="60" rx="10" ry="18" fill="${dark}"/>
            <ellipse cx="88" cy="60" rx="10" ry="18" fill="${dark}"/>
            <path d="M44 18 L56 18 L50 2 Z" fill="#fac45a"/>`;
  }
  const sad = mood === 'sad';
  const eye = sad
    ? `<path d="M34 46 q6 -6 12 0" stroke="#3a3446" stroke-width="3" fill="none"/>
       <path d="M54 46 q6 -6 12 0" stroke="#3a3446" stroke-width="3" fill="none"/>`
    : (mood === 'cheer'
      ? `<path d="M34 50 q6 -8 12 0" stroke="#3a3446" stroke-width="3" fill="none"/>
         <path d="M54 50 q6 -8 12 0" stroke="#3a3446" stroke-width="3" fill="none"/>`
      : `<circle cx="40" cy="47" r="4.5" fill="#3a3446"/>
         <circle cx="60" cy="47" r="4.5" fill="#3a3446"/>
         <circle cx="38.5" cy="45.5" r="1.5" fill="#fff"/>
         <circle cx="58.5" cy="45.5" r="1.5" fill="#fff"/>`);
  const nose = kind === 'koala'
    ? `<ellipse cx="50" cy="60" rx="9" ry="11" fill="#3a3438"/>`
    : (kind === 'bird'
      ? `<path d="M44 58 L56 58 L50 70 Z" fill="#fab046"/>`
      : `<circle cx="50" cy="60" r="4" fill="#3a3446"/>`);
  const mouth = kind === 'bird' ? '' : (sad
    ? `<path d="M40 76 q10 -8 20 0" stroke="#3a3446" stroke-width="3" fill="none"/>`
    : `<path d="M40 68 q10 10 20 0" stroke="#3a3446" stroke-width="3" fill="none"/>`);
  const whisk = (kind === 'cat' || kind === 'mouse')
    ? `<g stroke="${dark}" stroke-width="1.6">
         <line x1="30" y1="58" x2="8" y2="54"/><line x1="30" y1="63" x2="8" y2="63"/>
         <line x1="70" y1="58" x2="92" y2="54"/><line x1="70" y1="63" x2="92" y2="63"/>
       </g>` : '';
  return `<svg viewBox="0 0 100 104" width="${size}" height="${size * 1.04}"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${ears}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${body}"
            stroke="${dark}" stroke-width="2"/>
    <ellipse cx="${cx}" cy="64" rx="24" ry="18" fill="#fff"/>
    ${eye}${nose}${mouth}${whisk}
  </svg>`;
}

// ------------------------------------------------------- Chinese strokes
export function hasStrokes(ch) { return !!STROKES[ch]; }
export function strokeCount(ch) { return STROKES[ch] ? STROKES[ch].s.length : 0; }

/**
 * A character in a 田字格.
 *
 * `done` strokes are drawn solid, the rest faintly. If `active` is given that
 * stroke is picked out and a marker travels along its centre line, so the
 * direction the brush moves is unmistakable.
 */
export function strokeSVG(ch, size, opts = {}) {
  const d = STROKES[ch];
  const { done = null, active = null, progress = 1, ghost = true,
          grid = true, doneCol = '#3a3446', activeCol = '#ff847c' } = opts;
  if (!d) return `<div class="big-char" style="font-size:${size * 0.8}px">${ch}</div>`;
  const n = d.s.length;
  const shown = done === null ? n : done;
  const parts = [];
  if (grid) {
    parts.push(`<rect x="1" y="1" width="${EM - 2}" height="${EM - 2}"
      fill="none" stroke="#d6ccdd" stroke-width="10"/>
      <line x1="0" y1="${EM / 2}" x2="${EM}" y2="${EM / 2}" stroke="#e6dfec" stroke-width="6"/>
      <line x1="${EM / 2}" y1="0" x2="${EM / 2}" y2="${EM}" stroke="#e6dfec" stroke-width="6"/>`);
  }
  const g = [];
  if (ghost) for (let i = shown; i < n; i++)
    g.push(`<path d="${d.s[i]}" fill="#ece8f2"/>`);
  for (let i = 0; i < Math.min(shown, n); i++)
    g.push(`<path d="${d.s[i]}" fill="${doneCol}"/>`);
  if (active !== null && active >= 0 && active < n) {
    g.push(`<path d="${d.s[active]}" fill="${activeCol}"/>`);
    const pt = medianPoint(d.m[active], progress);
    g.push(`<circle cx="${pt[0]}" cy="${pt[1]}" r="34" fill="#fff"
             stroke="${activeCol}" stroke-width="12"/>`);
  }
  // the data is y-up, so flip it into screen coordinates
  parts.push(`<g transform="translate(0, ${Y_OFFSET}) scale(1, -1)">${g.join('')}</g>`);
  return `<svg viewBox="0 0 ${EM} ${EM}" width="${size}" height="${size}"
    xmlns="http://www.w3.org/2000/svg" class="hanzi">${parts.join('')}</svg>`;
}

function medianPoint(pts, frac) {
  if (!pts || pts.length < 2) return pts && pts[0] ? pts[0] : [0, 0];
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
    const d = Math.hypot(dx, dy);
    seg.push(d); total += d;
  }
  if (!total) return pts[0];
  let want = total * Math.max(0, Math.min(1, frac)), run = 0;
  for (let i = 0; i < seg.length; i++) {
    if (run + seg[i] >= want && seg[i] > 0) {
      const t = (want - run) / seg[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
              pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
    }
    run += seg[i];
  }
  return pts[pts.length - 1];
}

export const STROKE_SECS = 0.55, STROKE_GAP = 0.18;

/** Walks a character's strokes in order, then holds on the finished form. */
export class StrokeAnimation {
  constructor(ch) { this.ch = ch; this.n = strokeCount(ch); this.t = 0; }
  restart() { this.t = 0; }
  update(dt) { this.t += dt; }
  get total() { return this.n * (STROKE_SECS + STROKE_GAP) + 1.2; }
  get finished() { return this.t >= this.total; }
  state() {
    const per = STROKE_SECS + STROKE_GAP;
    if (!this.n) return [0, null, 1];
    const idx = Math.floor(this.t / per);
    if (idx >= this.n) return [this.n, null, 1];
    const within = this.t - idx * per;
    if (within <= STROKE_SECS) return [idx, idx, within / STROKE_SECS];
    return [idx + 1, null, 1];
  }
}

// ------------------------------------------------------- column method
/** The vertical algorithm, written the way it is taught at school. */
export function columnSVG(a, b, op, answer) {
  const at = Math.floor(a / 10), ao = a % 10;
  const bt = Math.floor(b / 10), bo = b % 10;
  const ansT = Math.floor(answer / 10), ansO = answer % 10;
  const carry = op === '+' && ao + bo >= 10;
  const borrow = op === '-' && ao < bo;
  const W = 240, H = 250;
  const colX = [175, 110];          // ones, tens
  const p = [];
  const t = (x, y, s, cls) => `<text x="${x}" y="${y}" class="${cls}"
      text-anchor="middle">${s}</text>`;
  if (carry) p.push(t(colX[1], 34, '1', 'cm-mark'));
  if (borrow) {
    p.push(t(colX[1], 34, String(at - 1), 'cm-mark'));
    p.push(t(colX[0], 34, String(ao + 10), 'cm-mark'));
  }
  // Only write a tens digit if there is one — otherwise 3 + 5 would be set
  // out as "03", which is not how anybody writes it.
  if (a >= 10) p.push(t(colX[1], 92, String(at), 'cm-digit'));
  p.push(t(colX[0], 92, String(ao), 'cm-digit'));
  if (borrow) {
    p.push(`<line x1="88" y1="80" x2="132" y2="70" class="cm-strike"/>`);
    p.push(`<line x1="153" y1="80" x2="197" y2="70" class="cm-strike"/>`);
  }
  p.push(t(30, 152, op, 'cm-op'));
  if (b >= 10) p.push(t(colX[1], 152, String(bt), 'cm-digit'));
  p.push(t(colX[0], 152, String(bo), 'cm-digit'));
  p.push(`<line x1="18" y1="172" x2="212" y2="172" class="cm-rule"/>`);
  if (ansT) p.push(t(colX[1], 232, String(ansT), 'cm-ans'));
  p.push(t(colX[0], 232, String(ansO), 'cm-ans'));
  return `<svg viewBox="0 0 ${W} ${H}" class="column" xmlns="http://www.w3.org/2000/svg">
    ${p.join('')}</svg>`;
}

/** A times table drawn as rows of dots to count. */
export function arraySVG(rows, cols) {
  const cell = 34, pad = 6;
  const w = cols * cell + pad * 2, h = rows * cell + pad * 2;
  const dots = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      dots.push(`<circle cx="${pad + c * cell + cell / 2}"
        cy="${pad + r * cell + cell / 2}" r="${cell / 2 - 5}" fill="#ac8ee2"/>`);
  return `<svg viewBox="0 0 ${w} ${h}" class="dots"
    xmlns="http://www.w3.org/2000/svg">${dots.join('')}</svg>`;
}

/** A star, filled or empty. */
export function starSVG(size = 32, filled = true) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? 24 : 10.5;
    pts.push(`${25 + Math.cos(ang) * r},${25 + Math.sin(ang) * r}`);
  }
  return `<svg viewBox="0 0 50 50" width="${size}" height="${size}"
    xmlns="http://www.w3.org/2000/svg"><polygon points="${pts.join(' ')}"
    fill="${filled ? '#ffce54' : 'none'}"
    stroke="${filled ? '#f0b030' : '#d6ccdd'}" stroke-width="3"/></svg>`;
}
