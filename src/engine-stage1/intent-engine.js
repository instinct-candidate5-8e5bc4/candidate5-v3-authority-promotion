'use strict';
// Deterministic intent engine (owner Stage 1 constraint 6). No language model,
// no network, no llm-worker.js. Hebrew free text and voice transcripts go
// through the same normalizer and lexicon; menu and direct scene interaction
// supply the canonical intent directly. Output is either one canonical intent
// or a typed refusal (ambiguous / unsupported) with a short clarifying
// question - never a guess.

const PREFIXES = 'והבלמשכ';
const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

function normalize(text) {
  return String(text || '')
    .normalize('NFC')
    .replace(/[\u0591-\u05C7]/g, '') // niqqud and cantillation
    .replace(/[\u05F3\u05F4'"`׳״]/g, '')
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .toLowerCase()
    .replace(/[^0-9a-z\u05D0-\u05EA]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normWord(w) {
  return normalize(w);
}

// Token candidates: the token and up to two stripped single-letter prefixes.
function candidates(tok) {
  const out = [tok];
  let t = tok;
  for (let i = 0; i < 2 && t.length > 2 && PREFIXES.includes(t[0]); i++) {
    t = t.slice(1);
    out.push(t);
  }
  return out;
}

function lev1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function tokenMatches(tokens, words) {
  const ws = words.map(normWord);
  for (const tok of tokens) {
    for (const c of candidates(tok)) {
      for (const w of ws) {
        if (c === w) return true;
        if (c.length >= 4 && w.length >= 4 && lev1(c, w)) return true;
      }
    }
  }
  return false;
}

const SIDE = {
  left: ['שמאל', 'שמאלית', 'שמאלי'],
  right: ['ימין', 'ימנית', 'ימני'],
};
const TARGET = {
  NEAR_CASUALTY_FLOOR: ['מטופל', 'פצוע', 'נפגע', 'אלי', 'לידי', 'אליו'],
  WALL: ['קיר'],
};

const LEXICON = [
  {
    intentId: 'ASK_WHAT_HAPPENED',
    groups: [['מה'], ['קרה']],
    params: () => ({ ok: true, params: {} }),
  },
  {
    intentId: 'EXAM_INSPECT_FOREARM',
    groups: [['בדוק', 'תבדוק', 'בודק', 'בדיקה', 'הסתכל', 'תסתכל', 'תראה'], ['יד', 'ידו', 'זרוע', 'אמה']],
    params: (tokens) => sideParam(tokens, 'איזו יד לבדוק - ימין או שמאל?'),
  },
  {
    intentId: 'MOVE_BAG',
    groups: [['הזז', 'תזיז', 'הבא', 'תביא', 'קרב', 'תקרב', 'שים', 'תשים', 'הנח', 'תניח'], ['תיק']],
    params: (tokens) => {
      const hits = Object.keys(TARGET).filter((k) => tokenMatches(tokens, TARGET[k]));
      if (hits.length !== 1) return { ok: false, clarification: 'לאן להזיז את התיק - ליד המטופל?' };
      return { ok: true, params: { target: hits[0] } };
    },
  },
  {
    intentId: 'APPLY_SYNTHETIC_DRESSING',
    groups: [['חבוש', 'תחבוש', 'חבישה', 'תחבושת', 'חבשה']],
    params: (tokens) => sideParam(tokens, 'על איזו יד לחבוש - ימין או שמאל?'),
  },
];

function sideParam(tokens, clarification) {
  const hits = Object.keys(SIDE).filter((k) => tokenMatches(tokens, SIDE[k]));
  if (hits.length !== 1) return { ok: false, clarification };
  return { ok: true, params: { region: hits[0] + '-forearm' } };
}

// Recognized but not implemented in Stage 1.
const UNSUPPORTED = {
  CPR: ['החייאה', 'עיסויים', 'עיסוי', 'הנשמה', 'הנשמות'],
  AED: ['דפיברילטור', 'דפי', 'aed'],
  OXYGEN: ['חמצן'],
  TOURNIQUET: ['חוסם', 'חסע'],
  IV: ['עירוי', 'אינפוזיה'],
};

const CATALOG = Object.freeze({
  ASK_WHAT_HAPPENED: { params: {} },
  EXAM_INSPECT_FOREARM: { params: { region: ['left-forearm', 'right-forearm'] } },
  MOVE_BAG: { params: { target: Object.keys(TARGET) } },
  APPLY_SYNTHETIC_DRESSING: { params: { region: ['left-forearm', 'right-forearm'] } },
});

function resolveText(text) {
  const n = normalize(text);
  if (!n) return { kind: 'AMBIGUOUS', reason: 'EMPTY', clarification: 'לא הבנתי. מה לעשות?' };
  const tokens = n.split(' ');
  const full = [];
  const partial = [];
  for (const entry of LEXICON) {
    const hits = entry.groups.map((g) => tokenMatches(tokens, g));
    if (hits.every(Boolean)) full.push(entry);
    else if (hits[0]) partial.push(entry);
  }
  const unsupported = Object.keys(UNSUPPORTED).filter((k) => tokenMatches(tokens, UNSUPPORTED[k]));
  if (full.length + (unsupported.length ? 1 : 0) > 1) {
    return { kind: 'AMBIGUOUS', reason: 'MULTIPLE_INTENTS', candidates: [...full.map((e) => e.intentId), ...unsupported], clarification: 'ביקשת כמה דברים. מה לעשות קודם?' };
  }
  if (full.length === 1) {
    const p = full[0].params(tokens);
    if (!p.ok) return { kind: 'AMBIGUOUS', reason: 'MISSING_OR_CONFLICTING_PARAMETER', intentId: full[0].intentId, clarification: p.clarification };
    return { kind: 'INTENT', intentId: full[0].intentId, params: p.params, normalized: n };
  }
  if (unsupported.length === 1) return { kind: 'UNSUPPORTED', capability: unsupported[0], normalized: n };
  if (partial.length) return { kind: 'AMBIGUOUS', reason: 'INCOMPLETE', candidates: partial.map((e) => e.intentId), clarification: 'על מה לבצע את הפעולה?' };
  return { kind: 'AMBIGUOUS', reason: 'UNRECOGNIZED', clarification: 'לא הבנתי. אפשר לנסח שוב?' };
}

function resolveStructured(intentId, params) {
  const def = CATALOG[intentId];
  if (!def) return { kind: 'UNSUPPORTED', capability: String(intentId) };
  const p = params || {};
  for (const [k, allowed] of Object.entries(def.params)) {
    if (!allowed.includes(p[k])) return { kind: 'AMBIGUOUS', reason: 'MISSING_OR_CONFLICTING_PARAMETER', intentId, clarification: 'חסר פרט לפעולה.' };
  }
  const extra = Object.keys(p).filter((k) => !(k in def.params));
  if (extra.length) return { kind: 'AMBIGUOUS', reason: 'UNKNOWN_PARAMETER', intentId, clarification: 'חסר פרט לפעולה.' };
  const clean = {};
  for (const k of Object.keys(def.params).sort()) clean[k] = p[k];
  return { kind: 'INTENT', intentId, params: clean };
}

// Single entry point for all channels.
function resolve(input) {
  if (!input || typeof input !== 'object') return { kind: 'INVALID' };
  if (input.channel === 'text' || input.channel === 'voice') return resolveText(input.text);
  if (input.channel === 'menu' || input.channel === 'direct') return resolveStructured(input.intentId, input.params);
  return { kind: 'INVALID' };
}

module.exports = { normalize, resolve, resolveText, resolveStructured, CATALOG, UNSUPPORTED };
