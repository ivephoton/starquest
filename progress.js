// Progress: which levels are solid, what was missed, stars and stickers.
//
// Stored in localStorage, which on an iPad home-screen app persists like any
// other app's data.

const KEY = 'starquest.progress.v1';

export const MASTER_MIN = 8;
export const MASTER_ACC = 0.82;

export const TIERS = {
  add: [['Adding a one-digit number', '加一位数'],
        ['Two-digit plus two-digit', '两位数加两位数'],
        ['Carrying over ten', '进位加法'],
        ['Bigger carrying sums', '较大的进位加法']],
  sub: [['Taking away a one-digit number', '减一位数'],
        ['Two-digit take two-digit', '两位数减两位数'],
        ['Borrowing from the tens', '退位减法'],
        ['Bigger borrowing sums', '较大的退位减法']],
  mul: [['2, 5 and 10 times tables', '2、5、10 的乘法表'],
        ['3 and 4 times tables', '3、4 的乘法表'],
        ['6, 7, 8 and 9 times tables', '6-9 的乘法表'],
        ['11 and 12, and all mixed', '11、12 与混合']],
  spell: [['Level 1 - up to 6 letters', '第一级 - 6 个字母以内'],
          ['Level 2 - 7 to 10 letters', '第二级 - 7-10 个字母'],
          ['Level 3 - more than 10 letters', '第三级 - 10 个字母以上']],
  hanzi: [['Year 2, first term', '二年级上册'],
          ['Year 2, second term', '二年级下册'],
          ['Year 3', '三年级']],
};

export const SUBJECT_NAME = {
  add: ['Adding', '加法'], sub: ['Taking away', '减法'],
  mul: ['Times tables', '乘法表'], spell: ['Spelling', '英语拼写'],
  hanzi: ['Chinese', '认汉字'], mixed: ['Everything', '混合练习'],
};

export const SPELL_BANDS = [
  ['Up to 6 letters', '6 个字母以内'],
  ['7 to 10 letters', '7-10 个字母'],
  ['More than 10 letters', '10 个字母以上'],
];

export const BADGES = [
  ['first', ['First Quest', '第一次冒险'], 'Finish your first round.'],
  ['stars25', ['25 Stars', '25 颗星'], 'Collect 25 stars.'],
  ['stars100', ['100 Stars', '100 颗星'], 'Collect 100 stars.'],
  ['perfect', ['Perfect Round', '全对'], 'Get every question right.'],
  ['streak10', ['On Fire', '连对十题'], 'Answer 10 in a row correctly.'],
  ['add_master', ['Adding Champion', '加法冠军'], 'Master every adding level.'],
  ['sub_master', ['Taking Away Champion', '减法冠军'], 'Master every subtraction level.'],
  ['mul_master', ['Times Table Champion', '乘法冠军'], 'Master every times table.'],
  ['spell_master', ['Spelling Champion', '拼写冠军'], 'Master every spelling level.'],
  ['hanzi_master', ['Character Champion', '汉字冠军'], 'Master every Chinese level.'],
  ['days3', ['Three Days Running', '连续三天'], 'Play on three different days.'],
];

export class Progress {
  constructor(data = {}) {
    this.name = data.name || '';
    this.avatar = data.avatar || 'fox';
    this.skills = data.skills || {};
    this.stars = data.stars || 0;
    this.badges = data.badges || [];
    this.bestStreak = data.bestStreak || 0;
    this.totalRight = data.totalRight || 0;
    this.totalSeen = data.totalSeen || 0;
    this.rounds = data.rounds || 0;
    this.days = data.days || [];
    this.review = data.review || [];
    this.lang = data.lang || 'en';
    this.music = data.music !== false;
    this.sfx = data.sfx !== false;
    this.streak = 0;
  }

  rec(key) {
    if (!this.skills[key]) this.skills[key] = [0, 0, 0];
    return this.skills[key];
  }

  accuracy(key) {
    const s = this.rec(key);
    return s[0] ? s[1] / s[0] : 0;
  }

  mastered(key) {
    const s = this.rec(key);
    return s[0] >= MASTER_MIN && s[1] / s[0] >= MASTER_ACC;
  }

  subjectKeys(subject) {
    if (subject === 'mul')
      return [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(t => `mul.${t}`);
    const n = TIERS[subject].length;
    return Array.from({ length: n }, (_, i) => `${subject}.t${i}`);
  }

  tierFor(subject) {
    if (subject === 'mul') {
      const groups = [[2, 5, 10], [3, 4], [6, 7, 8, 9], [11, 12]];
      for (let i = 0; i < groups.length; i++)
        if (!groups[i].every(t => this.mastered(`mul.${t}`))) return i;
      return groups.length - 1;
    }
    const n = TIERS[subject].length;
    for (let i = 0; i < n; i++)
      if (!this.mastered(`${subject}.t${i}`)) return i;
    return n - 1;
  }

  subjectProgress(subject) {
    const keys = this.subjectKeys(subject);
    return [keys.filter(k => this.mastered(k)).length, keys.length];
  }

  answer(q, correct) {
    const s = this.rec(q.skill);
    s[0]++; this.totalSeen++;
    if (correct) {
      s[1]++; s[2]++; this.totalRight++; this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
    } else {
      s[2] = 0; this.streak = 0;
      this.review.push({ subject: q.kind, tier: q.tier,
                         due: 2 + Math.floor(Math.random() * 3) });
    }
  }

  dueReviews(subjects, limit = 3) {
    const out = [], keep = [];
    for (const r of this.review) {
      if (subjects.includes(r.subject) && r.due <= 0 && out.length < limit) out.push(r);
      else keep.push(r);
    }
    for (const r of keep) r.due = Math.max(0, r.due - 1);
    this.review = keep.slice(-40);
    return out;
  }

  finishRound(right, total) {
    this.rounds++;
    const gained = right + (right === total ? 3 : 0);
    this.stars += gained;
    const today = new Date().toISOString().slice(0, 10);
    if (!this.days.includes(today)) this.days.push(today);
    const solid = s => {
      const [a, b] = this.subjectProgress(s);
      return a === b;
    };
    const conds = {
      first: this.rounds >= 1,
      stars25: this.stars >= 25,
      stars100: this.stars >= 100,
      perfect: right === total && total > 0,
      streak10: this.bestStreak >= 10,
      add_master: solid('add'), sub_master: solid('sub'),
      mul_master: solid('mul'), spell_master: solid('spell'),
      hanzi_master: solid('hanzi'),
      days3: this.days.length >= 3,
    };
    const fresh = [];
    for (const [id] of BADGES) {
      if (conds[id] && !this.badges.includes(id)) {
        this.badges.push(id); fresh.push(id);
      }
    }
    this.save();
    return [gained, fresh];
  }

  /** Put the star total back to zero, leaving everything else alone. */
  refreshStars() {
    this.stars = 0;
    this.save();
    return 0;
  }

  toJSON() {
    return { name: this.name, avatar: this.avatar, skills: this.skills,
             stars: this.stars, badges: this.badges,
             bestStreak: this.bestStreak, totalRight: this.totalRight,
             totalSeen: this.totalSeen, rounds: this.rounds, days: this.days,
             review: this.review, lang: this.lang, music: this.music,
             sfx: this.sfx };
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.toJSON())); }
    catch (e) { /* private browsing, or storage full: play on regardless */ }
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return new Progress(JSON.parse(raw));
  } catch (e) { /* fall through to a fresh start */ }
  return new Progress();
}
