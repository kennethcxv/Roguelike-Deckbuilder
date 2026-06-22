/**
 * WebAudio synthesis — all sound is generated at runtime (no asset files).
 * SFX are short oscillator blips with envelopes; music is a slow per-act drone with a
 * sparse arpeggio. Everything is guarded so it no-ops where WebAudio is unavailable
 * (tests/SSR) and respects the master/sfx/music volumes from settings.
 */

export type SfxName =
  | 'click'
  | 'card'
  | 'present'
  | 'score'
  | 'gavel'
  | 'coin'
  | 'win'
  | 'lose'
  | 'error'
  | 'shuffle';

interface Vols {
  master: number;
  sfx: number;
  music: number;
}

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let vols: Vols = { master: 0.8, sfx: 0.8, music: 0.45 };

let musicNodes: { osc: OscillatorNode[]; lfo: OscillatorNode; gain: GainNode } | null = null;
let arpTimer: ReturnType<typeof setInterval> | null = null;
let currentAct = 0;

export function initAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    const AC: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    masterGain = ctx.createGain();
    sfxGain = ctx.createGain();
    musicGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    sfxGain.connect(masterGain);
    musicGain.connect(masterGain);
    applyVolumes();
  } catch {
    ctx = null;
  }
}

export function setVolumes(next: Partial<Vols>): void {
  vols = { ...vols, ...next };
  applyVolumes();
}

function applyVolumes(): void {
  if (!masterGain || !sfxGain || !musicGain) return;
  masterGain.gain.value = clamp01(vols.master);
  sfxGain.gain.value = clamp01(vols.sfx);
  musicGain.gain.value = clamp01(vols.music) * 0.5;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function blip(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.3,
  when = 0,
): void {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.connect(g);
  g.connect(sfxGain);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function sweep(from: number, to: number, dur: number, gain = 0.25): void {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  o.connect(g);
  g.connect(sfxGain);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const CHORD = [0, 4, 7, 12];

export function playSfx(name: SfxName): void {
  if (!ctx) return;
  switch (name) {
    case 'click':
      blip(520, 0.06, 'triangle', 0.18);
      break;
    case 'card':
      blip(360, 0.08, 'triangle', 0.22);
      blip(540, 0.06, 'sine', 0.12, 0.02);
      break;
    case 'present':
      sweep(220, 660, 0.35, 0.22);
      break;
    case 'score':
      CHORD.forEach((s, i) => blip(440 * Math.pow(2, s / 12), 0.12, 'square', 0.14, i * 0.05));
      break;
    case 'gavel':
      blip(140, 0.12, 'square', 0.4);
      blip(90, 0.18, 'sine', 0.4, 0.06);
      break;
    case 'coin':
      blip(880, 0.05, 'square', 0.2);
      blip(1320, 0.07, 'square', 0.16, 0.04);
      break;
    case 'win':
      [0, 4, 7, 12, 16].forEach((s, i) =>
        blip(523.25 * Math.pow(2, s / 12), 0.4, 'triangle', 0.2, i * 0.12),
      );
      break;
    case 'lose':
      [0, -3, -7, -12].forEach((s, i) =>
        blip(330 * Math.pow(2, s / 12), 0.5, 'sawtooth', 0.18, i * 0.16),
      );
      break;
    case 'error':
      blip(120, 0.18, 'sawtooth', 0.25);
      break;
    case 'shuffle':
      for (let i = 0; i < 5; i++) blip(300 + Math.random() * 400, 0.04, 'triangle', 0.08, i * 0.03);
      break;
  }
}

// ── Music: per-act drone + sparse arpeggio ──

const ACT_ROOTS = [146.83, 130.81, 110.0]; // D3, C3, A2 — calmer → graver
const ACT_SCALES = [
  [0, 3, 5, 7, 10], // act 1 minor pentatonic-ish
  [0, 2, 3, 7, 8], // act 2 tenser
  [0, 2, 5, 7, 9], // act 3 grand
];

export function playMusic(act: number): void {
  if (!ctx || !musicGain) return;
  if (act === currentAct && musicNodes) return;
  stopMusic();
  currentAct = act;
  const root = ACT_ROOTS[Math.min(2, Math.max(0, act - 1))] ?? 130.81;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(musicGain);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);

  const osc: OscillatorNode[] = [];
  for (const semi of [0, 7, 12]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = root * Math.pow(2, semi / 12);
    o.detune.value = (Math.random() - 0.5) * 8;
    o.connect(gain);
    o.start();
    osc.push(o);
  }
  // slow tremolo
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.12;
  lfoGain.gain.value = 0.15;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  lfo.start();

  musicNodes = { osc, lfo, gain };

  const scale = ACT_SCALES[Math.min(2, Math.max(0, act - 1))] ?? ACT_SCALES[0]!;
  arpTimer = setInterval(() => {
    if (!ctx || !musicGain) return;
    const semi = scale[Math.floor(Math.random() * scale.length)]!;
    const note = root * 2 * Math.pow(2, semi / 12);
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = note;
    o.connect(g);
    g.connect(musicGain);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.start(t);
    o.stop(t + 1.5);
  }, 2600);
}

export function stopMusic(): void {
  if (arpTimer) {
    clearInterval(arpTimer);
    arpTimer = null;
  }
  if (musicNodes && ctx) {
    const { osc, lfo, gain } = musicNodes;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    for (const o of osc) o.stop(t + 0.5);
    lfo.stop(t + 0.5);
    musicNodes = null;
  }
  currentAct = 0;
}
