export interface FlightInput { x: number; y: number }
export interface FlightMotion extends FlightInput { vx: number; vy: number }
export interface FlightBounds { x: number; y: number }

export const FLIGHT_SPEED = 13;
export const FLIGHT_CAMERA_DISTANCE = 18;
export const FLIGHT_CAMERA_FOV = 55;
export const CAMERA_FOLLOW = 0.2;

export function readFlightInput(keys: ReadonlySet<string>, touch: FlightInput): FlightInput {
  const x = Number(keys.has("KeyD")) - Number(keys.has("KeyA")) + touch.x;
  const y = Number(keys.has("KeyW")) - Number(keys.has("KeyS")) + touch.y;
  const length = Math.max(1, Math.hypot(x, y));
  return { x: x / length, y: y / length };
}

export function getFlightBounds(aspect: number, viewportHeight: number): FlightBounds {
  const halfHeight = Math.tan(FLIGHT_CAMERA_FOV * Math.PI / 360) * FLIGHT_CAMERA_DISTANCE;
  // Reserve room for the banked model, HUD and touch controls. Allow for the
  // camera still being at the opposite edge when the pilot changes direction.
  const hudMargin = halfHeight * Math.min(0.46, 340 / Math.max(1, viewportHeight));
  return {
    x: Math.max(0, Math.min(10, (halfHeight * aspect - 1) / (1 + CAMERA_FOLLOW))),
    y: Math.max(0, Math.min(5, (halfHeight - hudMargin - 1) / (1 + CAMERA_FOLLOW))),
  };
}

export function stepFlight(motion: FlightMotion, input: FlightInput, bounds: FlightBounds, delta: number): void {
  // Drop long background-tab gaps rather than jumping across the arena.
  const dt = Math.min(Math.max(delta, 0), 1 / 20);
  if (dt === 0) return;
  const rate = Math.hypot(input.x, input.y) > 0 ? 18 : 24;
  const blend = -Math.expm1(-rate * dt);
  const targetX = input.x * FLIGHT_SPEED;
  const targetY = input.y * FLIGHT_SPEED;

  // Integrate the exponential velocity exactly so 30/60/144Hz feel the same.
  motion.x += targetX * dt + (motion.vx - targetX) * blend / rate;
  motion.y += targetY * dt + (motion.vy - targetY) * blend / rate;
  motion.vx += (targetX - motion.vx) * blend;
  motion.vy += (targetY - motion.vy) * blend;

  motion.x = Math.max(-bounds.x, Math.min(bounds.x, motion.x));
  motion.y = Math.max(-bounds.y, Math.min(bounds.y, motion.y));
  if ((motion.x >= bounds.x && motion.vx > 0) || (motion.x <= -bounds.x && motion.vx < 0)) motion.vx = 0;
  if ((motion.y >= bounds.y && motion.vy > 0) || (motion.y <= -bounds.y && motion.vy < 0)) motion.vy = 0;
}
