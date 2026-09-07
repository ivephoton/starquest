// Question generation.
//
// A direct port of the desktop version's rules, kept deliberately close to
// it so the two stay in step: the same tiers, the same carry/borrow
// guarantees, the same four Chinese tests.

import { WORDS, HANZI } from './data.js';

export const ROUND_LEN = 10;

let rng = Math.random;
export function setRandom(fn) { rng = fn; }

function ri(lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- maths
function addSteps(a, b, ans) {
  const ao = a % 10, bo = b % 10, at = Math.floor(a / 10), bt = Math.floor(b / 10);
  const ones = ao + bo;
  if (ones >= 10) {
    return [
      [`Ones: ${ao} + ${bo} = ${ones}. Write ${ones % 10}, carry the 1.`,
       `个位：${ao} + ${bo} = ${ones}，写 ${ones % 10} 进 1。`],
      [`Tens: 1 + ${at} + ${bt} = ${Math.floor(ans / 10)}.`,
       `十位：1 + ${at} + ${bt} = ${Math.floor(ans / 10)}。`]];
  }
  return [
    [`Ones: ${ao} + ${bo} = ${ones}.`, `个位：${ao} + ${bo} = ${ones}。`],
    [`Tens: ${at} + ${bt} = ${Math.floor(ans / 10)}.`,
     `十位：${at} + ${bt} = ${Math.floor(ans / 10)}。`]];
}

function subSteps(a, b, ans) {
  const ao = a % 10, bo = b % 10, at = Math.floor(a / 10), bt = Math.floor(b / 10);
  if (ao < bo) {
    return [
      [`You cannot take ${bo} from ${ao}, so borrow a ten.`,
       `个位 ${ao} 不够减 ${bo}，向十位借一个十。`],
      [`Ones: ${ao + 10} - ${bo} = ${ao + 10 - bo}.`,
       `个位：${ao + 10} - ${bo} = ${ao + 10 - bo}。`],
      [`Tens: ${at - 1} - ${bt} = ${Math.floor(ans / 10)}.`,
       `十位：${at - 1} - ${bt} = ${Math.floor(ans / 10)}。`]];
  }
  return [
    [`Ones: ${ao} - ${bo} = ${ao - bo}.`, `个位：${ao} - ${bo} = ${ao - bo}。`],
    [`Tens: ${at} - ${bt} = ${Math.floor(ans / 10)}.`,
     `十位：${at} - ${bt} = ${Math.floor(ans / 10)}。`]];
}

// Built digit by digit rather than guessed and retried, so each tier always
// produces exactly the kind of sum it promises.
export function makeAdd(tier) {
  let a, b;
  if (tier === 0) {
    const oa = ri(0, 7); a = ri(1, 8) * 10 + oa; b = ri(1, 9 - oa);
  } else if (tier === 1) {
    const oa = ri(0, 8), ob = ri(0, 9 - oa);
    const ta = ri(1, 7), tb = ri(1, 8 - ta);
    a = ta * 10 + oa; b = tb * 10 + ob;
  } else if (tier === 2) {
    const oa = ri(1, 9); b = ri(10 - oa, 9); a = ri(1, 8) * 10 + oa;
  } else {
    const oa = ri(1, 9), ob = ri(10 - oa, 9);
    const ta = ri(1, 4), tb = ri(1, 8 - ta);
    a = ta * 10 + oa; b = tb * 10 + ob;
  }
  const ans = a + b;
  return { kind: 'add', tier, skill: `add.t${tier}`, a, b, answer: ans,
           prompt: `${a} + ${b}`,
           hint: { type: 'column', op: '+', a, b, answer: ans,
                   steps: addSteps(a, b, ans),
                   note: ['Line the numbers up and start with the ones.',
                          '数位对齐，从个位开始算。'] } };
}

export function makeSub(tier) {
  let a, b;
  if (tier === 0) {
    const oa = ri(1, 9); a = ri(1, 9) * 10 + oa; b = ri(1, oa);
  } else if (tier === 1) {
    const oa = ri(0, 9), ob = ri(0, oa);
    const tb = ri(1, 8), ta = ri(tb + 1, 9);
    a = ta * 10 + oa; b = tb * 10 + ob;
  } else if (tier === 2) {
    const oa = ri(0, 8); b = ri(oa + 1, 9); a = ri(1, 9) * 10 + oa;
  } else {
    const oa = ri(0, 8), ob = ri(oa + 1, 9);
    const tb = ri(1, 8), ta = ri(tb + 1, 9);
    a = ta * 10 + oa; b = tb * 10 + ob;
  }
  const ans = a - b;
  return { kind: 'sub', tier, skill: `sub.t${tier}`, a, b, answer: ans,
           prompt: `${a} - ${b}`,
           hint: { type: 'column', op: '-', a, b, answer: ans,
                   steps: subSteps(a, b, ans),
                   note: ['Line the numbers up and start with the ones.',
                          '数位对齐，从个位开始算。'] } };
}

export const MUL_TIERS = [[2, 5, 10], [3, 4], [6, 7, 8, 9], [11, 12]];

export function makeMul(tier) {
  let table;
  if (tier >= 3) {
    table = pick([11, 12].concat(pick(MUL_TIERS.slice(0, 3))));
  } else {
    table = pick(MUL_TIERS[tier]);
  }
  const other = ri(2, 12);
  const [a, b] = rng() < 0.5 ? [table, other] : [other, table];
  const ans = a * b;
  const rows = Math.min(a, b), cols = Math.max(a, b);
  return { kind: 'mul', tier, skill: `mul.${table}`, a, b, table, answer: ans,
           prompt: `${a} × ${b}`,
           hint: { type: 'array', rows, cols,
                   note: [`${rows} rows of ${cols}. Count them up.`,
                          `${rows} 行，每行 ${cols} 个。`] } };
}

// ------------------------------------------------------------- spelling
export const WORDS_BY_TIER = [[], [], []];
for (const w of WORDS) WORDS_BY_TIER[w.t].push(w);

export function makeSpell(tier) {
  tier = Math.min(Math.max(tier, 0), 2);
  const e = pick(WORDS_BY_TIER[tier]);
  return { kind: 'spell', tier, skill: `spell.t${tier}`, answer: e.w,
           word: e.w, ipa: e.ipa, syllables: e.syl, clue: e.clue,
           prompt: e.clue.replace('___', '_____'),
           hint: { type: 'reveal', word: e.w, ipa: e.ipa, syllables: e.syl,
                   note: ['Look at the word, then cover it and type it.',
                          '先看清楚，再遮住，然后拼出来。'] } };
}

// -------------------------------------------------------------- Chinese
export const HANZI_BY_TIER = [[], [], []];
for (const h of HANZI) HANZI_BY_TIER[h.t].push(h);

export const HANZI_TYPES = ['read', 'pick', 'strokes', 'word'];
export const TYPE_NAME = {
  read: ['Reading', '认读'], pick: ['Characters', '认字'],
  strokes: ['Strokes', '笔画'], word: ['Word building', '组词'],
  mixed: ['All mixed', '混合'],
};

function distractors(entry, field, n = 3) {
  let pool = HANZI_BY_TIER[entry.t].filter(e => e.c !== entry.c);
  if (pool.length < n) pool = HANZI.filter(e => e.c !== entry.c);
  pool = shuffle(pool.slice());
  const seen = new Set([entry[field]]), out = [];
  for (const e of pool) {
    if (seen.has(e[field])) continue;
    seen.add(e[field]);
    out.push(e[field]);
    if (out.length === n) break;
  }
  return out;
}

function strokeOptions(n) {
  const out = new Set([n]);
  while (out.size < 4) {
    const v = n + pick([-3, -2, -2, -1, -1, 1, 1, 2, 2, 3]);
    if (v >= 1 && v <= 24) out.add(v);
  }
  return shuffle([...out].map(String));
}

export function makeHanzi(tier, qtype) {
  tier = Math.min(Math.max(tier, 0), 2);
  const e = pick(HANZI_BY_TIER[tier]);
  if (!qtype || qtype === 'mixed') qtype = pick(HANZI_TYPES);
  let answer, options, ask, big, sub, blankAt = null;

  if (qtype === 'read') {
    answer = e.p; options = distractors(e, 'p').concat([e.p]);
    ask = ['How is this character read?', '这个字怎么读？'];
    big = e.c; sub = '';
  } else if (qtype === 'pick') {
    answer = e.c; options = distractors(e, 'c').concat([e.c]);
    ask = ['Which character makes this sound?', '哪个字是这个音？'];
    big = e.p; sub = e.m;
  } else if (qtype === 'strokes') {
    answer = String(e.n); options = strokeOptions(e.n);
    ask = ['How many strokes does it have?', '这个字有几画？'];
    big = e.c; sub = '';
  } else {
    answer = e.c; options = distractors(e, 'c').concat([e.c]);
    ask = ['Which character completes the word?', '哪个字能组成这个词？'];
    blankAt = e.w.indexOf(e.c);
    big = e.w; sub = e.wp;
  }
  shuffle(options);
  return { kind: 'hanzi', tier, skill: `hanzi.t${tier}`, qtype,
           prompt: big, subprompt: sub, answer, options, ask, blankAt,
           char: e.c, pinyin: e.p, meaning: e.m, word: e.w,
           wordPinyin: e.wp, strokes: e.n,
           hint: { type: 'hanzi', char: e.c, pinyin: e.p, meaning: e.m,
                   word: e.w, wordPinyin: e.wp, strokes: e.n,
                   note: ['Watch how it is written.', '看清笔画顺序。'] } };
}

// ---------------------------------------------------------------- round
const MAKERS = { add: makeAdd, sub: makeSub, mul: makeMul,
                 spell: makeSpell, hanzi: makeHanzi };

export function makeQuestion(subject, tier, qtype) {
  if (subject === 'hanzi') return makeHanzi(tier, qtype);
  return MAKERS[subject](tier);
}

export function buildRound(progress, subject, n = ROUND_LEN,
                           forceTier = null, qtype = null) {
  const subjects = subject === 'mixed'
    ? ['add', 'sub', 'mul', 'spell', 'hanzi'] : [subject];
  const out = [];
  if (forceTier === null) {
    for (const r of progress.dueReviews(subjects, Math.max(1, Math.floor(n / 3))))
      out.push(makeQuestion(r.subject, r.tier, r.subject === 'hanzi' ? qtype : null));
  }
  let guard = 0;
  while (out.length < n && guard++ < 400) {
    const s = pick(subjects);
    const tier = forceTier !== null ? forceTier : progress.tierFor(s);
    const q = makeQuestion(s, tier, s === 'hanzi' ? qtype : null);
    if (out.some(o => o.prompt === q.prompt && o.kind === q.kind)) continue;
    out.push(q);
  }
  return shuffle(out).slice(0, n);
}
