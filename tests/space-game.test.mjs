import assert from 'node:assert/strict';
import test from 'node:test';
import { sweptHit, rankRuns, readRuns } from '../src/components/home/space-game-rules.ts';

test('fast objects crossing the rocket collide even when both endpoints miss', () => {
  assert.equal(sweptHit({x:0,y:0,z:-4}, {x:0,y:0,z:4}, 1), true);
  assert.equal(sweptHit({x:2,y:0,z:-4}, {x:2,y:0,z:4}, 1), false);
  assert.equal(sweptHit({x:0,y:0,z:0}, {x:0,y:0,z:0}, 1), true);
  assert.equal(sweptHit({x:0,y:0,z:3}, {x:0,y:0,z:4}, 1), false);
});

test('relative-motion collision includes a rocket crossing sideways', () => {
  assert.equal(sweptHit({x:-3,y:0,z:-2}, {x:3,y:0,z:2}, 0.5), true);
  assert.equal(sweptHit({x:-3,y:2,z:-2}, {x:3,y:2,z:2}, 0.5), false);
});

const run = (id, score, stars=0) => ({id, name:'Pilot', score, stars, date:'2026-09-15T00:00:00Z'});
test('leaderboard ranks numerically, breaks ties by stars and retains only ten', () => {
  const ranked = rankRuns(Array.from({length:15}, (_,i) => run(String(i), i*100)));
  assert.equal(ranked.length, 10);
  assert.equal(ranked[0].score, 1400);
  assert.equal(ranked.at(-1).score, 500);
  assert.equal(rankRuns([run('a',100,1),run('b',100,2)])[0].id, 'b');
});

test('corrupt storage and invalid records cannot break the leaderboard', () => {
  assert.deepEqual(readRuns('{broken'), []);
  assert.deepEqual(readRuns('null'), []);
  assert.deepEqual(rankRuns([null, {}, run('a',NaN), run('b',-1), {...run('c',1),date:'bad'}]), []);
  assert.equal(rankRuns([run('a',100), run('a',100)]).length, 1);
  const original = [run('a',1),run('b',2)];
  rankRuns(original);
  assert.equal(original[0].id, 'a');
});
