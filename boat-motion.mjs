// All coordinates and translations use the original 1024 × 1536 artwork.
export const BOAT_PIVOT_X = 350;
export const BOAT_PIVOT_Y = 1000;

const smooth = p => p * p * (3 - 2 * p);

/** Fight-only boat movement. Angles are degrees; jigging never moves the boat. */
export function getBoatPose(state, elapsedMs, reducedMotion = false) {
  if (reducedMotion || (state !== 'fighting' && state !== 'fight')) {
    return {angle: 0, dx: 0, dy: 0};
  }
  const ms = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  // Match the rod's 800 ms pull: a 120 ms attack, then a weighted release.
  const phase = (ms % 800) / 800;
  const pull = phase < .15 ? smooth(phase / .15) : 1 - smooth((phase - .15) / .85);
  // One broad roll spans two pulls. Reduce time before trig, even for huge values.
  const roll = Math.sin((ms % 1600) / 1600 * Math.PI * 2);
  return {
    angle: 2.4 * roll + .6 * pull,
    dx: 14 * roll + 6 * pull,
    dy: 18 * pull,
  };
}

/** Rotate around the boat pivot, then translate, like its enclosing SVG/CSS rig. */
export function transformBoatPoint(pose, x, y) {
  const radians = pose.angle * Math.PI / 180;
  const cos = Math.cos(radians), sin = Math.sin(radians);
  const localX = x - BOAT_PIVOT_X, localY = y - BOAT_PIVOT_Y;
  return {
    x: BOAT_PIVOT_X + localX * cos - localY * sin + pose.dx,
    y: BOAT_PIVOT_Y + localX * sin + localY * cos + pose.dy,
  };
}
