import {SINKING_MS, LANDING_MS} from './engine.mjs?v=20261111.4-gh';

export const WATERLINE_Y = 800;
export const ARM_PIVOT_X = 208;
export const ARM_PIVOT_Y = 741;
/** All moving tackle is rooted at the same fixed shoulder, never at the boat. */
export function transformArmPoint(pose,x,y){const r=pose.angle*Math.PI/180;return {x:ARM_PIVOT_X+(x-ARM_PIVOT_X)*Math.cos(r)-(y-ARM_PIVOT_Y)*Math.sin(r),y:ARM_PIVOT_Y+(x-ARM_PIVOT_X)*Math.sin(r)+(y-ARM_PIVOT_Y)*Math.cos(r)};}

const clamp = n => Math.max(0, Math.min(1, n));
const mix = (a, b, p) => a + (b - a) * p;
const smooth = p => p * p * (3 - 2 * p);

// Each tug has a sharp attack and a long release, rather than high-frequency jitter.
function tug(ms) {
  const phase = (ms % 800) / 800;
  return phase < .15 ? smooth(phase / .15) : 1 - smooth((phase - .15) / .85);
}
function fightPose(pose, ms) {
  const pull = tug(ms);
  Object.assign(pose, {
    pull, angle: -5 + 13 * pull, dx: 0, dy: 0,
    fishX: 750 + 130 * pull, fishY: 850 + 80 * pull,
    fishAngle: -8 + 43 * pull,
    rodTipX: 770 + 110 * pull, rodTipY: 440 + 170 * pull,
    rodC1X: 485 + 45 * pull, rodC1Y: 505 + 55 * pull,
    rodC2X: 650 + 100 * pull, rodC2Y: 350 + 160 * pull,
  });
}
function attachMouth(pose) {
  const radians = pose.fishAngle * Math.PI / 180;
  pose.jx = pose.fishX + 225 * pose.fishScale * Math.cos(radians);
  pose.jy = pose.fishY + 225 * pose.fishScale * Math.sin(radians);
}

/** Pure visual state in the original 1024 × 1536 artwork coordinates.
 * `submerged` is boolean; all other fields are finite numbers. The angle applies only to the arms and rod. The boat/body remain stationary.
 * Rod coordinates use source-art canvas coordinates; transform the rod and line tip together.
 */
export function getPose(state, elapsedMs, reducedMotion = false) {
  const ms = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const pose = {
    angle: 0, dx: 0, dy: 0, jx: 800, jy: 600, jr: 0,
    jigScale: 1, jigOpacity: 1, submerged: false, pull: 0,
    fishX: 800, fishY: 930, fishScale: 1, fishAngle: 0,
    rodTipX: 757, rodTipY: 423,
    rodC1X: 485, rodC1Y: 505, rodC2X: 650, rodC2Y: 350,
  };
  if (state === 'sinking') {
    const p = reducedMotion ? 1 : clamp(ms / SINKING_MS);
    pose.jy = mix(600, 1110, p);
    pose.jr = reducedMotion ? 0 : 8 * Math.sin(p * Math.PI * 2);
  } else if (state === 'waiting') {
    const jerk = reducedMotion ? 0 : tug(ms);
    pose.jy = 1110 - 150 * jerk;
    pose.angle = -5 * jerk;
    pose.dy = 0;
    pose.jr = -14 * jerk;
  } else if (state === 'bite') {
    pose.jy = 970 + (reducedMotion ? 0 : 16 * Math.sin(ms / 65));
    pose.jr = reducedMotion ? 0 : 12 * Math.sin(ms / 45);
  } else if (state === 'fighting' || state === 'fight') {
    fightPose(pose, reducedMotion ? 120 : ms);
    attachMouth(pose);
  } else if (state === 'landed') {
    fightPose(pose, 120);
    const p = reducedMotion ? 1 : clamp(ms / LANDING_MS);
    const ease = 1 - (1 - p) ** 2;
    pose.fishX = mix(800, 790, ease);
    pose.fishY = mix(1060, 550, ease);
    // All source fish face right. A -90-degree rotation lifts the head first.
    pose.fishAngle = -90 + (reducedMotion ? 0 : 3 * Math.sin(p * Math.PI));
    pose.fishScale = 1;
    pose.angle = mix(pose.angle, -7, ease);
    pose.dx = mix(pose.dx, 0, ease);
    pose.dy = 0;
    pose.pull *= 1 - ease;
    pose.rodTipX = mix(pose.rodTipX, 757, ease);
    pose.rodTipY = mix(pose.rodTipY, 423, ease);
    pose.rodC1X = mix(pose.rodC1X, 485, ease);
    pose.rodC1Y = mix(pose.rodC1Y, 505, ease);
    pose.rodC2X = mix(pose.rodC2X, 650, ease);
    pose.rodC2Y = mix(pose.rodC2Y, 350, ease);
    attachMouth(pose);
  }
  if (reducedMotion) pose.angle = pose.dx = pose.dy = pose.jr = 0;
  pose.submerged = pose.jy > WATERLINE_Y;
  const depth = clamp((pose.jy - WATERLINE_Y) / 310);
  pose.jigScale = mix(1, .67, depth);
  // The sea is opaque: the jig vanishes as it crosses the surface.
  pose.jigOpacity = 1 - clamp((pose.jy - (WATERLINE_Y - 45)) / 45);
  return pose;
}

/** Mouth and rotated bounds for each fish, in source-scene coordinates. */
export function getFishAttachment(pose, species) {
  const width = 1024 * (species.id === 'tachiuo' ? .48 : .44) * pose.fishScale;
  const height = width / species.aspect;
  const x = (species.mouthX - .5) * width;
  const y = (species.mouthY - .5) * height;
  const r = pose.fishAngle * Math.PI / 180;
  return {
    x: pose.fishX + x * Math.cos(r) - y * Math.sin(r),
    y: pose.fishY + x * Math.sin(r) + y * Math.cos(r),
    width, height,
    bottom: pose.fishY + Math.abs(width * Math.sin(r)) / 2 + Math.abs(height * Math.cos(r)) / 2,
    headIsUp: Math.sin(r) < -.9,
  };
}
