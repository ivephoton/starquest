// Star Quest for the web. All screens live here.

import { WORDS, HANZI } from './data.js';
import { buildRound, ROUND_LEN, TYPE_NAME, HANZI_TYPES,
         WORDS_BY_TIER, HANZI_BY_TIER } from './content.js';
import { Progress, loadProgress, TIERS, SUBJECT_NAME, SPELL_BANDS,
         BADGES } from './progress.js';
import { avatarSVG, AVATARS, AVATAR_NAME, strokeSVG, hasStrokes, strokeCount,
         StrokeAnimation, columnSVG, arraySVG, starSVG } from './art.js';
import * as audio from './audio.js';

const app = document.getElementById('app');
let P = loadProgress();
let lang = P.lang || 'en';

const T = (en, zh) => (lang === 'zh' ? zh : en);
const esc = s => String(s).replace(/[&<>]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/** Stars shown short so the counter can never overflow its corner. */
export function starText(n) {
  if (n < 10000) return String(n);
  if (n < 100000) return (Math.floor(n / 100) / 10).toFixed(1) + 'k';
  if (n < 1000000) return Math.floor(n / 1000) + 'k';
  if (n < 100000000) return (Math.floor(n / 100000) / 10).toFixed(1) + 'm';
  return Math.floor(n / 1000000) + 'm';
}

const SUBJECT_COL = { add: 'var(--coral)', sub: 'var(--sky-d)',
  mul: 'var(--grape)', spell: 'var(--mint-d)', hanzi: 'var(--coral-d)',
  mixed: 'var(--sun-d)' };
const SUBJECT_SYM = { add: '12 + 34', sub: '56 − 21', mul: '7 × 8',
  spell: 'a b c', hanzi: '汉 字', mixed: '? ? ?' };

function show(html) { app.innerHTML = html; }
function on(sel, fn, ev = 'click') {
  app.querySelectorAll(sel).forEach(el => el.addEventListener(ev, e => {
    audio.unlock();
    fn(e, el);
  }));
}

function starBar() {
  return `<div class="stars">${starSVG(30)}<span>${starText(P.stars)}</span></div>`;
}

// ================================================================= title
function titleScreen() {
  show(`<div class="screen title-wrap">
    <h1>${T('Star Quest', '小星星闯关')}</h1>
    <h2>${T('Maths, Spelling and Chinese', '数学 · 英语拼写 · 认汉字')}</h2>
    <div id="mascot">${avatarSVG(P.avatar, 130)}</div>
    <h2>${T('What is your name?', '你叫什么名字？')}</h2>
    <input class="name-input" id="nm" maxlength="12"
           value="${esc(P.name)}" placeholder="${T('Type your name', '输入名字')}"
           autocomplete="off" autocorrect="off" spellcheck="false">
    <h2>${T('Pick your buddy', '选一个小伙伴')}</h2>
    <div class="avatar-row">${AVATARS.map(a =>
      `<button class="avatar-btn ${a === P.avatar ? 'on' : ''}" data-av="${a}"
        aria-label="${AVATAR_NAME[a][0]}">${avatarSVG(a, 58)}</button>`).join('')}</div>
    <div class="row">
      <button class="b-mint" id="play" style="min-width:220px;font-size:30px">
        ${T('Play!', '开始！')}</button>
      <button class="b-sky" id="lang">中文 / EN</button>
    </div>
  </div>`);
  on('[data-av]', (e, el) => {
    P.avatar = el.dataset.av; P.save();
    audio.play('click'); titleScreen();
  });
  on('#lang', () => { lang = lang === 'zh' ? 'en' : 'zh'; P.lang = lang; P.save(); titleScreen(); });
  on('#play', () => {
    P.name = (app.querySelector('#nm').value || '').trim() || T('Friend', '小朋友');
    P.save(); audio.play('click'); menuScreen();
  });
}

// ================================================================== menu
function menuScreen() {
  const subs = ['add', 'sub', 'mul', 'spell', 'hanzi', 'mixed'];
  show(`<div class="screen">
    <div class="spread">
      <div><h1 style="text-align:left;font-size:clamp(22px,4vw,44px)">
        ${T('Hello ' + esc(P.name) + '!', '你好，' + esc(P.name) + '！')}</h1></div>
      ${starBar()}
    </div>
    <div class="tiles">${subs.map(k => {
      const [done, tot] = k === 'mixed' ? [0, 0] : P.subjectProgress(k);
      const tier = k === 'mixed' ? 0 : P.tierFor(k);
      return `<button class="tile" data-sub="${k}">
        <div class="head" style="background:${SUBJECT_COL[k]}">
          ${T(...SUBJECT_NAME[k])}</div>
        <div class="sym" style="color:${SUBJECT_COL[k]}">${SUBJECT_SYM[k]}</div>
        ${k === 'mixed' ? `<div class="sub">${T('A bit of everything', '全部混合')}</div>`
          : `<div class="bar"><i style="width:${tot ? done / tot * 100 : 0}%;
               background:${SUBJECT_COL[k]}"></i></div>
             <div class="sub">${T(...TIERS[k][tier])}</div>`}
      </button>`; }).join('')}</div>
    <div class="row">
      <button class="b-sun" id="stickers">${T('My Stickers', '我的贴纸')}</button>
      <button class="b-grape" id="report">${T('For Grown-ups', '家长报告')}</button>
      <button class="b-sky" id="lang">中文 / EN</button>
      <button class="${audio.isMusicOn() ? 'b-mint' : 'b-grey'}" id="mus">
        ${T('Music', '音乐')} ${audio.isMusicOn() ? 'ON' : 'OFF'}</button>
    </div>
  </div>`);
  on('[data-sub]', (e, el) => {
    const k = el.dataset.sub;
    audio.play('click');
    if (k === 'spell' || k === 'hanzi') levelScreen(k);
    else startRound(k, null, null);
  });
  on('#stickers', stickerScreen);
  on('#report', reportScreen);
  on('#lang', () => { lang = lang === 'zh' ? 'en' : 'zh'; P.lang = lang; P.save(); menuScreen(); });
  on('#mus', () => { audio.setMusic(!audio.isMusicOn()); P.music = audio.isMusicOn(); P.save(); menuScreen(); });
}

// ================================================================ levels
let hanziType = 'read';

function levelScreen(subject) {
  const hz = subject === 'hanzi';
  const bands = hz ? TIERS.hanzi : SPELL_BANDS;
  const counts = hz ? HANZI_BY_TIER.map(a => a.length)
                    : WORDS_BY_TIER.map(a => a.length);
  const eg = hz ? ['春', '朋友', '蝴蝶'] : ['apple', 'elephant', 'grandfather'];
  show(`<div class="screen">
    <div class="spread"><button class="b-grey" id="back">${T('Back', '返回')}</button>
      ${starBar()}</div>
    <h1>${T(...SUBJECT_NAME[subject])}</h1>
    ${hz ? `<div class="row">${['read','pick','strokes','word','mixed'].map(t =>
      `<button class="${t === hanziType ? 'b-coral' : 'b-grey'}" data-ht="${t}">
        ${T(...TYPE_NAME[t])}</button>`).join('')}</div>` : ''}
    <div class="tiles" style="grid-template-columns:repeat(3,1fr)">
      ${[0, 1, 2].map(i => {
        const key = `${subject}.t${i}`, seen = P.rec(key)[0];
        const acc = Math.round(P.accuracy(key) * 100);
        const c = ['var(--sky-d)', 'var(--grape)', 'var(--coral)'][i];
        return `<button class="tile" data-lv="${i}">
          <div class="head" style="background:${c}">${T('Level ' + (i + 1), '第 ' + (i + 1) + ' 级')}</div>
          <div class="sub" style="font-size:clamp(15px,2vw,22px);color:${c};padding-top:8px">
            ${T(...bands[i])}</div>
          <div class="sym">${eg[i]}</div>
          <div class="sub">${T(counts[i] + (hz ? ' characters' : ' words'),
                               counts[i] + (hz ? ' 个字' : ' 个单词'))}</div>
          <div class="sub">${seen ? T(acc + '% right so far', '正确率 ' + acc + '%')
                                  : T('not tried yet', '还没练过')}</div>
        </button>`; }).join('')}
    </div>
    <div class="row"><button class="b-mint" id="auto" style="min-width:280px">
      ${T('Choose for me', '让游戏帮我选')}</button></div>
  </div>`);
  on('#back', menuScreen);
  on('[data-ht]', (e, el) => { hanziType = el.dataset.ht; audio.play('click'); levelScreen(subject); });
  on('[data-lv]', (e, el) => startRound(subject, +el.dataset.lv, hz ? hanziType : null));
  on('#auto', () => startRound(subject, null, hz ? hanziType : null));
}

// ================================================================== quiz
let S = null;      // the round in progress

function startRound(subject, tier, qtype) {
  S = { subject, tier, qtype, qs: buildRound(P, subject, ROUND_LEN, tier, qtype),
        i: 0, right: 0, typed: '', picked: null, state: 'ask', hint: false,
        anim: null, showTimer: 0 };
  audio.play('click');
  enterQuestion();
}

function enterQuestion() {
  const q = S.qs[S.i];
  S.typed = ''; S.picked = null; S.hint = false;
  S.anim = q.kind === 'hanzi' ? new StrokeAnimation(q.char) : null;
  if (q.kind === 'spell') { S.state = 'show'; S.showTimer = 3.0; }
  else S.state = 'ask';
  quizScreen();
}

function submit() {
  const q = S.qs[S.i];
  const given = String(S.typed).trim().toLowerCase();
  if (!given) return;
  const ok = given === String(q.answer).toLowerCase();
  P.answer(q, ok);
  if (ok) { S.right++; S.state = 'right'; audio.play('correct'); audio.play('star'); }
  else { S.state = 'wrong'; audio.play('wrong'); }
  quizScreen();
  if (ok) setTimeout(nextQuestion, 1100);
}

function nextQuestion() {
  S.i++;
  if (S.i >= S.qs.length) {
    const [gained, fresh] = P.finishRound(S.right, S.qs.length);
    audio.play(fresh.length ? 'badge' : 'fanfare');
    resultScreen(gained, fresh);
  } else enterQuestion();
}

function quizScreen() {
  const q = S.qs[S.i];
  const dots = S.qs.map((_, i) =>
    `<i class="${i < S.i ? 'done' : (i === S.i ? 'now' : '')}"></i>`).join('');
  show(`<div class="screen">
    <div class="topbar">
      <button class="b-grey" id="back">${T('Back', '返回')}</button>
      <div class="dots">${dots}</div>${starBar()}
    </div>
    <div class="qcard" id="qcard">${questionHTML(q)}</div>
    <div id="answer">${answerHTML(q)}</div>
    <div id="feedback">${feedbackHTML(q)}</div>
  </div>`);
  wireQuiz(q);
  if (S.state === 'show') runShowTimer();
  if (S.hint || S.state === 'wrong') runStrokeAnim();
}

function questionHTML(q) {
  if (q.kind === 'spell') {
    if (S.state === 'show') {
      return `<div class="qask">${T('Look carefully...', '看清楚哦……')}</div>
        <div class="bar" style="margin:10px 20%"><i id="tbar"
          style="width:100%;background:var(--mint-d)"></i></div>
        <div class="qtext" style="color:var(--mint-d)">${esc(q.word)}</div>
        <div class="ipa">${esc(q.ipa)}</div>
        <div class="qask">${esc(q.syllables.replace(/-/g, ' - '))}</div>`;
    }
    const clue = esc(q.clue).replace('___',
      `<span style="color:var(--mint-d)">_____</span>`);
    return `<div class="qask">${T('Which word fits?', '哪个词合适？')}</div>
      <div class="qclue">${clue}</div><div class="ipa">${esc(q.ipa)}</div>`;
  }
  if (q.kind === 'hanzi') return hanziQuestionHTML(q);
  return `<div class="qtext">${esc(q.prompt)} = ?</div>`;
}

function hanziQuestionHTML(q) {
  const ask = `<div class="qask">${T(...q.ask)}</div>`;
  const shown = S.picked !== null ? S.picked : null;
  const col = S.state === 'right' ? 'var(--mint-d)'
            : S.state === 'wrong' ? 'var(--coral-d)' : 'var(--ink)';
  if (q.qtype === 'read') {
    return ask + `<div class="answer-box" style="color:${col};border-color:${
      shown ? col : 'var(--shadow)'}">${shown ? esc(shown)
        : `<span class="muted" style="font-size:22px">${T('choose a sound', '选一个读音')}</span>`}</div>
      <div style="margin-top:10px">${strokeSVG(q.char, 150, { ghost: false })}</div>`;
  }
  if (q.qtype === 'strokes') {
    return ask + `<div>${strokeSVG(q.char, 150, { ghost: false })}</div>
      ${shown ? `<div class="qclue" style="color:${col}">${esc(shown)} ${T('strokes', '画')}</div>` : ''}`;
  }
  if (q.qtype === 'pick') {
    return ask + `<div class="qtext" style="font-size:clamp(26px,4.4vw,46px)">${esc(q.prompt)}</div>
      <div class="qask">${esc(q.subprompt)}</div>
      <div>${shown && hasStrokes(shown)
        ? strokeSVG(shown, 140, { ghost: false, doneCol: col })
        : `<div style="width:140px;height:140px;margin:0 auto;border:5px dashed var(--coral);border-radius:10px"></div>`}</div>`;
  }
  // 组词: each character in its own 田字格, the missing one an empty box
  const cells = [...q.word].map((ch, i) => {
    if (i === q.blankAt) {
      return shown
        ? `<span class="tian" style="outline:5px solid ${col};border-radius:8px">
             ${strokeSVG(shown, 108, { ghost: false, doneCol: col })}</span>`
        : `<span class="tian" style="display:inline-block;width:108px;height:108px;
             border:5px solid var(--coral);border-radius:8px"></span>`;
    }
    return `<span class="tian">${strokeSVG(ch, 108, { ghost: false })}</span>`;
  }).join(' ');
  return ask + `<div class="row" style="gap:14px">${cells}</div>
    <div class="ipa" style="margin-top:6px">${esc(q.subprompt)}</div>`;
}

function answerHTML(q) {
  if (S.state === 'show') return '';
  if (q.kind === 'hanzi') {
    if (S.state !== 'ask') return '';
    return `<div class="choices">${q.options.map((o, i) =>
      `<button class="choice ${S.picked === o ? 'on' : ''}" data-opt="${esc(o)}">
        <small>${i + 1}</small>${esc(o)}</button>`).join('')}</div>
      <div class="row" style="margin-top:12px">
        <button class="b-mint" id="confirm" ${S.picked === null ? 'disabled' : ''}
          style="min-width:220px">${T('Confirm', '确 定')}</button>
        <button class="b-grape" id="hint">${S.hint ? T('Hide help', '收起提示')
          : T('Show me', '看提示')}</button>
      </div>`;
  }
  if (q.kind === 'spell') {
    const n = q.answer.length;
    const cells = Array.from({ length: n }, (_, i) =>
      `<i class="${i < S.typed.length ? 'filled' : ''}">${esc(S.typed[i] || '')}</i>`).join('');
    if (S.state !== 'ask') return `<div class="letters">${cells}</div>`;
    return `<div class="letters">${cells}</div>
      <div class="row" style="margin-top:12px">
        <input class="name-input" id="spellin" style="width:min(360px,70vw)"
          value="${esc(S.typed)}" autocomplete="off" autocorrect="off"
          autocapitalize="off" spellcheck="false"
          placeholder="${T('type the word', '拼写这个词')}">
        <button class="b-mint" id="confirm">${T('Confirm', '确 定')}</button>
        <button class="b-grape" id="hint">${S.hint ? T('Hide help', '收起提示')
          : T('Show me', '看提示')}</button>
      </div>`;
  }
  if (S.state !== 'ask')
    return `<div class="row"><span class="answer-box">${esc(S.typed)}</span></div>`;
  const keys = ['7','8','9','4','5','6','1','2','3','⌫','0','OK'];
  return `<div class="row"><span class="answer-box">${esc(S.typed) || '&nbsp;'}</span></div>
    <div class="pad">${keys.map(k =>
      `<button class="${k === 'OK' ? 'b-mint' : (k === '⌫' ? 'b-coral' : 'b-sky')}"
        data-key="${k}">${k}</button>`).join('')}</div>
    <div class="row" style="margin-top:10px">
      <button class="b-grape" id="hint">${S.hint ? T('Hide help', '收起提示')
        : T('Show me', '看提示')}</button></div>`;
}

function feedbackHTML(q) {
  if (S.state === 'right')
    return `<div class="feedback f-good">${T('Brilliant!', '太棒了！')}</div>`;
  if (S.state === 'wrong') return correctionHTML(q);
  if (S.hint) return hintHTML(q);
  return '';
}

function correctionHTML(q) {
  let body;
  if (q.kind === 'spell') {
    body = `<div class="qtext" style="font-size:clamp(26px,4.6vw,50px);color:var(--mint-d)">
        ${esc(q.answer)}</div>
      <div class="qclue">${esc(q.syllables.replace(/-/g, ' - '))}</div>
      <div class="ipa">${esc(q.ipa)}</div>
      ${S.typed ? `<div class="muted">${T('You wrote: ' + esc(S.typed),
        '你写的是：' + esc(S.typed))}</div>` : ''}`;
  } else if (q.kind === 'hanzi') {
    body = hanziRevealHTML(q);
  } else if (q.hint.type === 'column') {
    body = `<div class="row" style="align-items:flex-start;gap:24px">
        ${columnSVG(q.a, q.b, q.hint.op, q.answer)}
        <div style="text-align:left">
          <div class="qclue" style="color:var(--mint-d)">${esc(q.prompt)} = ${q.answer}</div>
          ${q.hint.steps.map(s => `<div class="muted">${esc(T(...s))}</div>`).join('')}
          ${S.typed ? `<div style="color:var(--coral-d)">${T('You wrote ' + esc(S.typed),
            '你写的是 ' + esc(S.typed))}</div>` : ''}
        </div></div>`;
  } else {
    body = `<div class="qclue" style="color:var(--mint-d)">${esc(q.prompt)} = ${q.answer}</div>
      ${arraySVG(q.hint.rows, q.hint.cols).replace('class="dots"', 'class="dots-img"')}`;
  }
  return `<div class="feedback f-bad">
    <div class="qask">${T('Not quite - here is how to do it', '差一点点，我们一起看')}</div>
    ${body}
    <div class="row" style="margin-top:12px">
      <button class="b-mint" id="next" style="min-width:200px">
        ${T('Got it', '知道了')}</button></div></div>`;
}

function hanziRevealHTML(q) {
  const [done, active, prog] = S.anim ? S.anim.state() : [q.strokes, null, 1];
  const shown = Math.min(done + (active !== null ? 1 : 0), q.strokes) || 1;
  const strip = hasStrokes(q.char)
    ? `<div class="strip">${Array.from({ length: q.strokes }, (_, i) =>
        strokeSVG(q.char, 46, { done: i + 1, ghost: true })).join('')}</div>` : '';
  return `<div class="row" style="align-items:flex-start;gap:22px">
      <div><div id="anim">${strokeSVG(q.char, 150,
        { done, active, progress: prog })}</div>
        <div class="muted">${T(`stroke ${shown} of ${q.strokes}`,
          `第 ${shown} 画 / 共 ${q.strokes} 画`)}</div></div>
      <div style="text-align:left">
        <div class="qclue">${esc(q.pinyin)}</div>
        <div class="muted">${esc(q.meaning)}</div>
        <div style="margin-top:6px">${T('word: ', '组词：')}
          <b>${esc(q.word)}</b> ${esc(q.wordPinyin)}</div>
        ${S.picked ? `<div style="color:var(--coral-d);margin-top:6px">
          ${T('You chose ' + esc(S.picked), '你选的是 ' + esc(S.picked))}</div>` : ''}
      </div></div>${strip}`;
}

function hintHTML(q) {
  const h = q.hint;
  if (h.type === 'column') {
    return `<div class="feedback f-bad"><div class="qask">${esc(T(...h.note))}</div>
      <div class="row" style="align-items:flex-start;gap:24px">
        ${columnSVG(h.a, h.b, h.op, h.answer)}
        <div style="text-align:left">${h.steps.map(s =>
          `<div class="muted">${esc(T(...s))}</div>`).join('')}</div></div></div>`;
  }
  if (h.type === 'array') {
    return `<div class="feedback f-bad"><div class="qask">${esc(T(...h.note))}</div>
      ${arraySVG(h.rows, h.cols).replace('class="dots"', 'class="dots-img"')}</div>`;
  }
  if (h.type === 'hanzi') {
    return `<div class="feedback f-bad">${hanziRevealHTML(q)}</div>`;
  }
  return `<div class="feedback f-bad"><div class="qask">${esc(T(...h.note))}</div>
    <div class="qtext" style="font-size:clamp(24px,4vw,44px);color:var(--grape-d)">
      ${esc(h.word)}</div>
    <div class="qclue">${esc(h.syllables.replace(/-/g, ' - '))}</div>
    <div class="ipa">${esc(h.ipa)}</div></div>`;
}

function wireQuiz(q) {
  on('#back', menuScreen);
  on('#next', nextQuestion);
  on('#hint', () => { S.hint = !S.hint; audio.play('click'); quizScreen(); });
  on('[data-opt]', (e, el) => {
    if (S.picked === el.dataset.opt) { S.typed = S.picked; submit(); return; }
    S.picked = el.dataset.opt; audio.play('click'); quizScreen();
  });
  on('#confirm', () => {
    if (q.kind === 'hanzi') { if (S.picked === null) return; S.typed = S.picked; }
    else if (q.kind === 'spell') {
      const el = app.querySelector('#spellin');
      S.typed = el ? el.value.trim().toLowerCase() : S.typed;
    }
    submit();
  });
  on('[data-key]', (e, el) => {
    const k = el.dataset.key;
    if (k === '⌫') S.typed = S.typed.slice(0, -1);
    else if (k === 'OK') { submit(); return; }
    else if (S.typed.length < 4) S.typed += k;
    audio.play('click');
    const box = app.querySelector('.answer-box');
    if (box) box.innerHTML = esc(S.typed) || '&nbsp;';
  });
  const sp = app.querySelector('#spellin');
  if (sp) {
    sp.addEventListener('input', () => {
      S.typed = sp.value.trim().toLowerCase();
      const cells = app.querySelectorAll('.letters i');
      cells.forEach((c, i) => {
        c.textContent = S.typed[i] || '';
        c.className = i < S.typed.length ? 'filled' : '';
      });
    });
    sp.addEventListener('keydown', ev => { if (ev.key === 'Enter') submit(); });
    setTimeout(() => sp.focus(), 60);
  }
}

// spelling's look-then-cover timer, and the stroke animation loop
let timerId = null, animId = null;
function runShowTimer() {
  clearInterval(timerId);
  const started = Date.now();
  timerId = setInterval(() => {
    const left = 3.0 - (Date.now() - started) / 1000;
    const bar = app.querySelector('#tbar');
    if (!bar) { clearInterval(timerId); return; }
    bar.style.width = Math.max(0, left / 3.0 * 100) + '%';
    if (left <= 0) { clearInterval(timerId); S.state = 'ask'; quizScreen(); }
  }, 50);
}

function runStrokeAnim() {
  clearInterval(animId);
  if (!S.anim) return;
  animId = setInterval(() => {
    const holder = app.querySelector('#anim');
    if (!holder) { clearInterval(animId); return; }
    S.anim.update(0.06);
    if (S.anim.finished) S.anim.restart();
    const q = S.qs[S.i];
    const [done, active, prog] = S.anim.state();
    holder.innerHTML = strokeSVG(q.char, 150, { done, active, progress: prog });
  }, 60);
}

// =============================================================== results
function resultScreen(gained, fresh) {
  clearInterval(timerId); clearInterval(animId);
  const perfect = S.right === S.qs.length;
  show(`<div class="screen title-wrap">
    <h1>${perfect ? T('Perfect!', '全对！')
      : S.right >= S.qs.length * 0.6 ? T('Well done!', '做得好！')
      : T('Good try!', '继续加油！')}</h1>
    <div>${avatarSVG(P.avatar, 120, S.right ? 'cheer' : 'happy')}</div>
    <h2>${T(`${S.right} out of ${S.qs.length} right`,
             `答对 ${S.right} / ${S.qs.length} 题`)}</h2>
    <div class="row">${S.qs.map((_, i) => starSVG(34, i < S.right)).join('')}</div>
    <h2>${T(`+${gained} stars`, `+${gained} 颗星`)}</h2>
    ${fresh.length ? `<div class="card"><div class="qask">${T('New sticker!', '获得新贴纸！')}</div>
      <div class="row">${fresh.map(b => badgeHTML(b, true)).join('')}</div></div>` : ''}
    <div class="row">
      <button class="b-mint" id="again" style="min-width:220px">${T('Again!', '再来一次')}</button>
      <button class="b-sky" id="menu">${T('Choose another', '换一个')}</button>
    </div></div>`);
  on('#again', () => startRound(S.subject, S.tier, S.qtype));
  on('#menu', menuScreen);
}

// =============================================================== stickers
function badgeHTML(id, earned) {
  const meta = BADGES.find(b => b[0] === id);
  const cols = { first: 'var(--coral)', stars25: 'var(--sun)',
    stars100: 'var(--sun-d)', perfect: 'var(--mint-d)', streak10: 'var(--coral-d)',
    add_master: 'var(--coral)', sub_master: 'var(--sky-d)',
    mul_master: 'var(--grape)', spell_master: 'var(--mint-d)',
    hanzi_master: 'var(--coral-d)', days3: 'var(--grape-d)' };
  return `<div class="badge ${earned ? '' : 'locked'}">
    <div class="disc" style="background:${earned ? cols[id] : 'var(--shadow)'}">
      ${earned ? '★' : '?'}</div>
    <div>${T(...meta[1])}</div></div>`;
}

function stickerScreen() {
  show(`<div class="screen">
    <div class="spread"><button class="b-grey" id="back">${T('Back', '返回')}</button>
      ${starBar()}</div>
    <h1>${T('My Stickers', '我的贴纸')}</h1>
    <h2>${T(`${P.badges.length} of ${BADGES.length} collected`,
             `已收集 ${P.badges.length} / ${BADGES.length}`)}</h2>
    <div class="badges">${BADGES.map(b =>
      badgeHTML(b[0], P.badges.includes(b[0]))).join('')}</div></div>`);
  on('#back', menuScreen);
}

// ================================================================ report
let confirmStars = false, confirmAll = false;

function reportScreen() {
  const acc = P.totalSeen ? Math.round(P.totalRight / P.totalSeen * 100) : 0;
  const rows = ['add', 'sub', 'mul', 'spell', 'hanzi'].map(s => {
    const keys = P.subjectKeys(s);
    const [done, tot] = P.subjectProgress(s);
    const pills = keys.map(k => {
      const seen = P.rec(k)[0], a = P.accuracy(k);
      const c = !seen ? 'var(--shadow)' : a >= 0.82 ? 'var(--mint-d)'
              : a >= 0.6 ? 'var(--sun-d)' : 'var(--coral)';
      return `<span class="pill" style="background:${c}">${k.split('.').pop()}</span>
        <small class="muted">${seen ? Math.round(a * 100) + '%' : '–'}</small>`;
    }).join(' ');
    return `<tr><td><b>${T(...SUBJECT_NAME[s])}</b><br>
      <small class="muted">${T(`${done} of ${tot} levels solid`,
        `已掌握 ${done} / ${tot} 级`)}</small></td><td>${pills}</td></tr>`;
  }).join('');
  show(`<div class="screen">
    <div class="spread"><button class="b-grey" id="back">${T('Back', '返回')}</button>
      ${starBar()}</div>
    <h1>${T('Progress report', '学习报告')}</h1>
    <div class="card"><div class="row">
      ${[[T('Rounds', '轮数'), P.rounds], [T('Questions', '答题'), P.totalSeen],
         [T('Correct', '正确率'), acc + '%'], [T('Best streak', '连对'), P.bestStreak],
         [T('Stars', '星星'), starText(P.stars)]].map(([l, v]) =>
        `<div style="text-align:center;min-width:110px">
          <div style="font-size:clamp(22px,3.4vw,36px);font-weight:700">${v}</div>
          <small class="muted">${l}</small></div>`).join('')}
    </div></div>
    <div class="card"><table class="report">${rows}</table>
      <div class="muted" style="margin-top:8px">
        ${T('Green means solid, orange is coming along, red needs practice.',
            '绿色已掌握，橙色还在进步，红色需要多练。')}</div></div>
    <div class="row">
      <button class="${confirmStars ? 'b-sun' : 'b-grey'}" id="rs">
        ${confirmStars ? T('Tap again to zero', '再按一次清零')
                       : T('Reset stars', '星星清零')}</button>
      <button class="${confirmAll ? 'b-coral' : 'b-grey'}" id="ra">
        ${confirmAll ? T('Confirm reset?', '确认清空？')
                     : T('Reset progress', '清空进度')}</button>
    </div></div>`);
  on('#back', () => { confirmStars = confirmAll = false; menuScreen(); });
  on('#rs', () => {
    if (confirmStars) { P.refreshStars(); confirmStars = false; }
    else { confirmStars = true; confirmAll = false;
           setTimeout(() => { confirmStars = false; }, 4000); }
    reportScreen();
  });
  on('#ra', () => {
    if (confirmAll) {
      const nm = P.name, av = P.avatar;
      P = new Progress(); P.name = nm; P.avatar = av; P.save();
      confirmAll = false;
    } else { confirmAll = true; confirmStars = false;
             setTimeout(() => { confirmAll = false; }, 4000); }
    reportScreen();
  });
}

// ------------------------------------------------------------------ boot
audio.setMusic(P.music);
audio.setSfx(P.sfx);
document.addEventListener('touchstart', audio.unlock, { once: true });
document.addEventListener('mousedown', audio.unlock, { once: true });
titleScreen();

// exposed so the test harness can drive the same code the app runs
export { P, S, startRound, submit, nextQuestion, buildRound };
