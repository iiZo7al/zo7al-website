import assert from "node:assert/strict";
import test from "node:test";
import { PerspectiveCamera, Vector3 } from "three";
import {
  CAMERA_FOLLOW,
  FLIGHT_CAMERA_DISTANCE,
  FLIGHT_CAMERA_FOV,
  FLIGHT_SPEED,
  getFlightBounds,
  readFlightInput,
  stepFlight,
  stepPointerFlight,
} from "../src/components/home/rocket-motion.ts";

const idle = { x: 0, y: 0 };
const openArena = { x: 100, y: 100 };
const createMotion = () => ({ x: 0, y: 0, vx: 0, vy: 0 });
const inputFor = (...keys) => readFlightInput(new Set(keys), idle);
const near = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be within ${tolerance} of ${expected}`);
};

function fly(motion, input, seconds, fps = 60, bounds = openArena) {
  for (let frame = 0; frame < Math.round(seconds * fps); frame++) {
    stepFlight(motion, input, bounds, 1 / fps);
  }
  return motion;
}

test("physical WASD codes map to the four screen directions", () => {
  assert.deepEqual(inputFor("KeyW"), { x: 0, y: 1 });
  assert.deepEqual(inputFor("KeyA"), { x: -1, y: 0 });
  assert.deepEqual(inputFor("KeyS"), { x: 0, y: -1 });
  assert.deepEqual(inputFor("KeyD"), { x: 1, y: 0 });
  for (const code of ["w", "a", "s", "d", "Space"]) {
    assert.deepEqual(inputFor(code), idle);
  }
});

test("opposite keys cancel independently while diagonals retain equal axis speed", () => {
  assert.deepEqual(inputFor("KeyW", "KeyS"), idle);
  assert.deepEqual(inputFor("KeyA", "KeyD"), idle);
  assert.deepEqual(inputFor("KeyW", "KeyA", "KeyS", "KeyD"), idle);
  assert.deepEqual(inputFor("KeyW", "KeyS", "KeyD"), { x: 1, y: 0 });

  for (const [horizontal, vertical, xSign, ySign] of [
    ["KeyD", "KeyW", 1, 1],
    ["KeyA", "KeyW", -1, 1],
    ["KeyD", "KeyS", 1, -1],
    ["KeyA", "KeyS", -1, -1],
  ]) {
    const input = inputFor(horizontal, vertical);
    near(Math.hypot(input.x, input.y), 1);
    near(Math.abs(input.x), Math.abs(input.y));
    assert.equal(Math.sign(input.x), xSign);
    assert.equal(Math.sign(input.y), ySign);
  }
});

test("touch preserves analog strength and combined devices cannot exceed full speed", () => {
  assert.deepEqual(readFlightInput(new Set(), { x: 0.3, y: -0.4 }), { x: 0.3, y: -0.4 });
  const touchDiagonal = readFlightInput(new Set(), { x: 1, y: 1 });
  near(Math.hypot(touchDiagonal.x, touchDiagonal.y), 1);
  const mixed = readFlightInput(new Set(["KeyD"]), { x: 0.2, y: 0.5 });
  near(Math.hypot(mixed.x, mixed.y), 1);
  assert.ok(mixed.x > mixed.y && mixed.y > 0);
  assert.deepEqual(readFlightInput(new Set(["KeyD"]), { x: -1, y: 0 }), idle);

  const slow = fly(createMotion(), { x: 0.5, y: 0 }, 1);
  const full = fly(createMotion(), inputFor("KeyD"), 1);
  near(slow.x, full.x / 2);
  near(slow.vx, full.vx / 2);
});

test("acceleration starts immediately and moves continuously without jumping to full velocity", () => {
  const motion = createMotion();
  const input = inputFor("KeyD", "KeyW");
  const dt = 1 / 60;
  stepFlight(motion, input, openArena, dt);
  const firstSpeed = Math.hypot(motion.vx, motion.vy);
  assert.ok(firstSpeed > 0 && firstSpeed < FLIGHT_SPEED);
  assert.ok(motion.x > 0 && motion.y > 0);
  assert.ok(Math.hypot(motion.x, motion.y) < FLIGHT_SPEED * dt);

  for (let frame = 0; frame < 60; frame++) {
    const previous = { ...motion };
    stepFlight(motion, input, openArena, dt);
    assert.ok(Math.hypot(motion.vx, motion.vy) >= Math.hypot(previous.vx, previous.vy));
    assert.ok(Math.hypot(motion.vx, motion.vy) <= FLIGHT_SPEED + 1e-10);
    assert.ok(Math.hypot(motion.x - previous.x, motion.y - previous.y) <= FLIGHT_SPEED * dt + 1e-10);
  }
  assert.ok(Math.hypot(motion.vx, motion.vy) > FLIGHT_SPEED * 0.99);
});

test("releasing controls decelerates with a short smooth coast", () => {
  const motion = fly(createMotion(), inputFor("KeyD"), 1);
  const beforeRelease = { ...motion };
  stepFlight(motion, idle, openArena, 1 / 60);
  assert.ok(motion.x > beforeRelease.x);
  assert.ok(motion.vx > 0 && motion.vx < beforeRelease.vx);
  fly(motion, idle, 1);
  assert.ok(motion.vx < 1e-8);
  assert.ok(motion.x - beforeRelease.x < FLIGHT_SPEED * 0.1);
  near(motion.y, 0);
});

test("reversing direction brakes existing momentum before accelerating the other way", () => {
  const motion = fly(createMotion(), inputFor("KeyD"), 1);
  const beforeReversal = { ...motion };
  stepFlight(motion, inputFor("KeyA"), openArena, 1 / 60);
  assert.ok(motion.vx > 0 && motion.vx < beforeReversal.vx);
  assert.ok(motion.x > beforeReversal.x);
  assert.ok(motion.x - beforeReversal.x <= FLIGHT_SPEED / 60);
  fly(motion, inputFor("KeyA"), 0.2);
  assert.ok(motion.vx < 0);
  assert.ok(motion.x < beforeReversal.x);
});

test("all arena corners clamp both axes, remove outward velocity, and allow immediate inward movement", () => {
  const bounds = { x: 1, y: 2 };
  for (const xSign of [-1, 1]) {
    for (const ySign of [-1, 1]) {
      const motion = {
        x: xSign * (bounds.x - 0.001),
        y: ySign * (bounds.y - 0.001),
        vx: xSign * 8,
        vy: ySign * 8,
      };
      const outward = readFlightInput(new Set(), { x: xSign, y: ySign });
      stepFlight(motion, outward, bounds, 1 / 60);
      assert.equal(motion.x, xSign * bounds.x);
      assert.equal(motion.y, ySign * bounds.y);
      assert.equal(motion.vx, 0);
      assert.equal(motion.vy, 0);
      stepFlight(motion, { x: -outward.x, y: -outward.y }, bounds, 1 / 60);
      assert.ok(Math.abs(motion.x) < bounds.x);
      assert.ok(Math.abs(motion.y) < bounds.y);
      assert.equal(Math.sign(motion.vx), -xSign);
      assert.equal(Math.sign(motion.vy), -ySign);
    }
  }
});

test("touching a wall preserves motion parallel to it, including a collapsed horizontal arena", () => {
  const motion = { x: 1, y: 0, vx: 3, vy: 4 };
  stepFlight(motion, inputFor("KeyD", "KeyW"), { x: 1, y: 2 }, 1 / 60);
  assert.equal(motion.x, 1);
  assert.equal(motion.vx, 0);
  assert.ok(motion.y > 0 && motion.vy > 0);

  const narrow = createMotion();
  stepFlight(narrow, inputFor("KeyD", "KeyW"), { x: 0, y: 2 }, 1 / 60);
  assert.equal(narrow.x, 0);
  assert.equal(narrow.vx, 0);
  assert.ok(narrow.y > 0 && narrow.vy > 0);
});

test("long frame gaps are capped and zero or negative time leaves motion unchanged", () => {
  const start = { x: 1, y: -1, vx: 4, vy: 3 };
  const input = inputFor("KeyD", "KeyW");
  const normal = { ...start };
  stepFlight(normal, input, openArena, 0.05);
  for (const elapsed of [0.5, 10, 120, Infinity]) {
    const delayed = { ...start };
    stepFlight(delayed, input, openArena, elapsed);
    assert.deepEqual(delayed, normal);
    assert.ok(Math.hypot(delayed.x - start.x, delayed.y - start.y) <= FLIGHT_SPEED * 0.05);
  }
  for (const elapsed of [0, -1]) {
    const unchanged = { ...start };
    stepFlight(unchanged, input, openArena, elapsed);
    assert.deepEqual(unchanged, start);
  }
});

test("the same flight has consistent positions and velocities at 30, 60, and 144 fps", () => {
  const stages = [
    [inputFor("KeyW", "KeyD"), 1],
    [idle, 0.5],
    [inputFor("KeyS", "KeyA"), 1],
    [inputFor("KeyD"), 0.5],
    [idle, 0.5],
  ];
  const flights = [30, 60, 144].map((fps) => {
    const motion = createMotion();
    return stages.map(([input, seconds]) => ({ ...fly(motion, input, seconds, fps) }));
  });
  for (const flight of flights.slice(1)) {
    flight.forEach((motion, stage) => {
      for (const property of ["x", "y", "vx", "vy"]) near(motion[property], flights[0][stage][property]);
    });
  }
});

for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [667, 375], [844, 390], [1280, 800], [1920, 1080]]) {
  test(`${width} × ${height}: the rocket envelope stays visible with centered, current, and opposite camera follow`, () => {
    const bounds = getFlightBounds(width / height, height);
    assert.ok(bounds.x > 0 && bounds.x <= 10);
    assert.ok(bounds.y > 0 && bounds.y <= 5);
    const camera = new PerspectiveCamera(FLIGHT_CAMERA_FOV, width / height, 0.1, 200);

    for (const xSign of [-1, 1]) {
      for (const ySign of [-1, 1]) {
        const rocket = { x: bounds.x * xSign, y: bounds.y * ySign };
        for (const follow of [0, CAMERA_FOLLOW, -CAMERA_FOLLOW]) {
          camera.position.set(rocket.x * follow, rocket.y * follow, FLIGHT_CAMERA_DISTANCE);
          camera.updateMatrixWorld();
          // Project a one-unit model margin, rather than reusing the bounds calculation.
          for (const offsetX of [-1, 1]) {
            for (const offsetY of [-1, 1]) {
              const screen = new Vector3(rocket.x + offsetX, rocket.y + offsetY, 0).project(camera);
              assert.ok(Math.abs(screen.x) <= 1 + 1e-10, `horizontal screen edge crossed at follow ${follow}`);
              assert.ok(Math.abs(screen.y) <= 1 + 1e-10, `vertical screen edge crossed at follow ${follow}`);
              const verticalClearance = (1 - Math.abs(screen.y)) * height / 2;
              assert.ok(verticalClearance >= (height < 500 ? 70 : 100), "leave room for the flight HUD and touch controls");
            }
          }
        }
      }
    }
  });
}

test("extremely narrow or initially zero-sized viewports produce finite nonnegative bounds", () => {
  for (const [aspect, height] of [[0, 0], [0.01, 800], [1, 0], [100, 200]]) {
    const bounds = getFlightBounds(aspect, height);
    assert.ok(Number.isFinite(bounds.x) && bounds.x >= 0);
    assert.ok(Number.isFinite(bounds.y) && bounds.y >= 0);
  }
});


test("arrows match WASD and duplicate keys never double speed", () => {
  for (const [arrow, wasd] of [["ArrowUp", "KeyW"], ["ArrowDown", "KeyS"], ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]]) {
    assert.deepEqual(inputFor(arrow), inputFor(wasd));
    assert.deepEqual(inputFor(arrow, wasd), inputFor(wasd));
  }
});
test("pointer steering converges without overshoot across refresh rates", () => {
  for (const fps of [30, 60, 144]) {
    const motion = createMotion(), target = { x: 4, y: -2 };
    for(let i=0;i<fps*4;i++) stepPointerFlight(motion, target, openArena, 1/fps);
    near(motion.x, target.x, 0.001); near(motion.y, target.y, 0.001);
    assert.ok(Math.hypot(motion.vx,motion.vy)<0.01);
  }
});

test("mouse reaches 95 percent of target in 150ms and stays within the arena", () => {
  for (const fps of [30, 60, 144]) {
    const m=createMotion();
    for(let i=0;i<Math.ceil(fps*0.15);i++) stepPointerFlight(m,{x:8,y:4},openArena,1/fps);
    assert.ok(m.x>=7.6 && m.x<=8); assert.ok(m.y>=3.8 && m.y<=4);
    for(let i=0;i<fps;i++) stepPointerFlight(m,{x:100,y:-100},{x:10,y:5},1/fps);
    assert.ok(m.x<=10 && m.y>=-5);
  }
});
