// Sound, synthesised in the browser with Web Audio.
//
// No audio files, so the whole app stays small enough to cache offline.
// iOS keeps audio locked until the user touches the screen, so everything
// here waits for the first tap before starting.

let ctx = null, master = null, musicBus = null, limiter = null;
let musicOn = true, sfxOn = true, started = false, loopTimer = null;

// The two bus levels. Everything below mixes relative to these, so this is
// the only place to touch if the whole app is too loud or too quiet.
// A limiter on the end (see unlock) catches the peaks, so these can sit
// well above 1 without the sound breaking up when notes land together.
const MASTER_LEVEL = 2.2;
const MUSIC_LEVEL = 0.3;

export function setMusic(on) {
  musicOn = on;
  if (on) startMusic(); else stopMusic();
}
export function setSfx(on) { sfxOn = on; }
export function isMusicOn() { return musicOn; }
export function isSfxOn() { return sfxOn; }

/** Called from the first touch: iOS will not make a sound before that. */
export function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { return; }

  // iOS treats Web Audio as ambient sound, which the Ring/Silent switch
  // mutes even at full volume. Declaring the page as playback opts out of
  // that. Safari 16.4 and up; simply absent elsewhere, so guard it.
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch (e) { /* older iOS: the silent switch still wins */ }

  // A limiter on the very end. Several notes often overlap — a chord, or an
  // effect landing on top of the music — and without this their sum would
  // clip and crackle as soon as the levels were raised to something audible.
  limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  limiter.connect(ctx.destination);

  master = ctx.createGain();
  master.gain.value = MASTER_LEVEL;
  master.connect(limiter);
  if (musicOn) startMusic();
}

function note(freq, t0, dur, type = 'triangle', vol = 0.3, dest = null) {
  if (!ctx || freq <= 0) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest || master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

// ---------------------------------------------------------------- effects
const SFX = {
  correct: () => { const t = ctx.currentTime;
    [1046.5, 1318.5, 1568].forEach((f, i) => note(f, t + i * 0.075, 0.3, 'triangle', 0.26)); },
  // soft and falling, never a buzzer
  wrong: () => { const t = ctx.currentTime;
    note(329.6, t, 0.24, 'sine', 0.2); note(261.6, t + 0.15, 0.32, 'sine', 0.18); },
  star: () => { const t = ctx.currentTime;
    note(1568, t, 0.2, 'sine', 0.16); note(2093, t + 0.05, 0.22, 'sine', 0.13); },
  click: () => note(880, ctx.currentTime, 0.09, 'triangle', 0.14),
  fanfare: () => { const t = ctx.currentTime;
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => note(f, t + i * 0.13, 0.5, 'triangle', 0.24));
    note(1318.5, t + 0.52, 0.7, 'triangle', 0.2); },
  badge: () => { const t = ctx.currentTime;
    [784, 987.8, 1174.7, 1568].forEach((f, i) => note(f, t + i * 0.1, 0.42, 'sine', 0.22)); },
};

export function play(name) {
  if (!ctx || !sfxOn) return;
  const f = SFX[name];
  if (f) { try { f(); } catch (e) { /* ignore */ } }
}

// ------------------------------------------------------------------ music
// Four phrases rather than one on repeat, so the ear has somewhere to go.
const A = [[0,2],[2,1],[1,1],[0,2],[-3,2],[0,1],[1,1],[2,2],[3,2],[2,1],[1,1],[0,4]];
const Bp = [[4,2],[5,1],[4,1],[3,2],[2,2],[3,1],[4,1],[5,2],[6,2],[5,2],[4,4]];
const C = [[6,2],[5,1],[6,1],[8,2],[6,2],[5,1],[4,1],[3,2],[4,2],[3,1],[2,1],[3,4]];
const D = [[2,2],[1,1],[0,1],[-3,2],[0,2],[1,1],[2,1],[1,2],[0,2],[-3,2],[0,6]];
const BASS = [0, 3, 1, 4, 0, 5, 4, 0];
const SCALE = [0, 2, 4, 5, 7, 9, 11];
const BPM = 108;

function deg(d) {
  const oct = Math.floor(d / 7), i = ((d % 7) + 7) % 7;
  return 261.63 * Math.pow(2, (SCALE[i] + 12 * (oct + 1)) / 12);
}

function scheduleLoop() {
  if (!ctx || !musicOn || !musicBus) return;
  const beat = 60 / BPM;
  let t = ctx.currentTime + 0.2;
  const start = t;
  const sections = [A, Bp, C, D];
  sections.forEach((phrase, si) => {
    let bt = t;
    for (const [d, beats] of phrase) {
      note(deg(d), bt, beats * beat * 0.9, 'triangle', 0.2, musicBus);
      bt += beats * beat;
    }
    const bars = Math.round((bt - t) / (beat * 4));
    for (let i = 0; i < bars; i++)
      note(deg(BASS[(si * 2 + i) % BASS.length] - 7), t + i * beat * 4,
           beat * 3, 'sine', 0.14, musicBus);
    t = bt;
  });
  const total = t - start;
  loopTimer = setTimeout(scheduleLoop, Math.max(1000, (total - 0.3) * 1000));
}

export function startMusic() {
  if (!ctx || !musicOn || started) return;
  started = true;
  // Every run gets a bus of its own, so notes left over from an earlier run
  // have nothing to play through. See stopMusic for why that matters.
  musicBus = ctx.createGain();
  musicBus.gain.value = MUSIC_LEVEL;
  musicBus.connect(master);
  scheduleLoop();
}

export function stopMusic() {
  started = false;
  if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
  // A run puts the whole 45-second piece into the schedule at once, and
  // stopping cannot un-schedule it. Merely turning the gain down would leave
  // those notes alive and waiting, so switching the music back on would play
  // them on top of the new run — the same tune twice, out of step with
  // itself. Detaching the bus cuts them off for good.
  if (musicBus) { musicBus.disconnect(); musicBus = null; }
}
