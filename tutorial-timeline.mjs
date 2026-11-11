import {FIGHT_START_DISTANCE,REEL_PER_TAP,FIGHT_ESCAPE_DISTANCE} from './engine.mjs?v=20261111.4-gh';
/** Tutorial-only clock. No game state, input, scores or persistence are involved. */
export const DEMO_BITE_REACTION_MS = 350;
export const DEMO_REEL_INTERVAL_MS = 4500 / Math.ceil(FIGHT_START_DISTANCE / REEL_PER_TAP);
export const TUTORIAL_PHASES = Object.freeze([
  { id: 'waiting', duration: 3500, step: 0 },
  { id: 'bite', duration: 2400, step: 1 },
  { id: 'reel', duration: 5000, step: 2 },
  { id: 'catch', duration: 2200, step: 2 },
  { id: 'slack', duration: 4300, step: 3 },
  { id: 'escape', duration: 1600, step: 3 },
  { id: 'summary', duration: Infinity, step: 4 },
].map(Object.freeze));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function tutorialWaitingMs(value = 3500) {
  return Number.isFinite(value) ? clamp(value, 3000, 4200) : 3500;
}
export function tutorialPhaseStart(id, waitingMs = 3500) {
  let start = 0;
  for (const phase of TUTORIAL_PHASES) {
    if (phase.id === id) return start;
    start += phase.id === 'waiting' ? tutorialWaitingMs(waitingMs) : phase.duration;
  }
  return 0;
}
/** Pure, deterministic illustration state. All motion is frozen in reduced mode.
 * Demo timing is intentionally compressed and is not a game simulation.
 */
export function getTutorialFrame(elapsedMs, { waitingMs = 3500, reducedMotion = false } = {}) {
  const total = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  let since = total, phase = TUTORIAL_PHASES[0], duration, cursor = 0;
  for (const entry of TUTORIAL_PHASES) {
    phase = entry;
    duration = entry.id === 'waiting' ? tutorialWaitingMs(waitingMs) : entry.duration;
    since = total - cursor;
    if (total < cursor + duration) break;
    cursor += duration;
  }
  const progress = Number.isFinite(duration) ? clamp(since / duration, 0, 1) : 1;
  let distance = null;
  if (phase.id === 'reel') {
    const taps = Math.min(Math.ceil(FIGHT_START_DISTANCE / REEL_PER_TAP), Math.floor(since / DEMO_REEL_INTERVAL_MS));
    distance = reducedMotion ? 28 : Math.max(0, FIGHT_START_DISTANCE - taps * REEL_PER_TAP);
  }
  if (phase.id === 'catch') distance = 0;
  if (phase.id === 'slack') distance = reducedMotion ? 85 : Math.round(FIGHT_START_DISTANCE + (FIGHT_ESCAPE_DISTANCE-FIGHT_START_DISTANCE) * clamp(since / 3700, 0, 1));
  if (phase.id === 'escape') distance = 100;
  const tapped = phase.id === 'bite' && (reducedMotion || since >= DEMO_BITE_REACTION_MS);
  const tapPulse = !reducedMotion && ((phase.id === 'bite' && since >= DEMO_BITE_REACTION_MS && since < DEMO_BITE_REACTION_MS + 240) || (phase.id === 'reel' && since % DEMO_REEL_INTERVAL_MS < DEMO_REEL_INTERVAL_MS * .44 && distance > 0));
  const landed = phase.id === 'catch';
  const fishProgress = landed ? (reducedMotion ? 1 : 1 - (1 - clamp(since / 1250, 0, 1)) ** 3) : 0;
  return {
    phase: phase.id, step: phase.step, phaseElapsedMs: since, progress,
    distance, tapped, tapPulse, reactionMs: tapped ? DEMO_BITE_REACTION_MS : null,
    finger: phase.id === 'bite' || phase.id === 'reel' || phase.id === 'slack',
    fingerMode: phase.id === 'slack' ? 'idle' : phase.id === 'reel' ? 'repeat' : 'once',
    fishVisible: landed, fishY: 288 - fishProgress * 160, fishAngle: -90,
    // Sink once, then jig entirely below the opaque surface (Y=194).
    jigY: phase.id === 'waiting' ? (reducedMotion ? 216 : since < 700 ? 140 + 76 * since / 700 : 216 + Math.sin(since / 190) * 14) : 216,
    anglerAngle: reducedMotion ? 0 : phase.id === 'waiting' ? Math.sin(since / 190) * 2.2 : phase.id === 'reel' ? Math.sin(since / 135) * 2 : 0,
    // The summary never starts a round. Only an explicit Skip/Start does that.
    complete: phase.id === 'summary',
  };
}
