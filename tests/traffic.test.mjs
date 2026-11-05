import test from 'node:test';
import assert from 'node:assert/strict';
import { trafficWindows, cityPageViews, trafficSnapshot } from '../lib/traffic.ts';
import snapshot from '../data/traffic.json' with { type: 'json' };

test('initial analytics uses a measured snapshot only within its actual month', () => {
  assert.deepEqual(trafficSnapshot(new Date(snapshot.updatedAt)), snapshot);
  assert.equal(trafficSnapshot(new Date('2099-01-01T12:00:00Z')), null);
});

test('analytics starts at the local month boundary and splits long months into complete seven-day queries', () => {
  const now=new Date('2026-11-30T20:00:00Z');
  const windows=trafficWindows(now);
  assert.equal(windows[0].start,'2026-11-30T18:30:00.000Z'); // December in India.
  const november=trafficWindows(new Date('2026-11-30T10:00:00Z'));
  assert.equal(november[0].start,'2026-10-31T18:30:00.000Z');
  assert.equal(november.at(-1).end,'2026-11-30T10:00:00.000Z');
  for(let i=0;i<november.length;i++){
    assert.ok(Date.parse(november[i].end)-Date.parse(november[i].start)<=7*86400000);
    if(i)assert.equal(november[i-1].end,november[i].start);
  }
});
test('only page views within each actual city route count toward that city', () => {
  const row=(requestPath,count)=>({count,dimensions:{requestPath}});
  assert.deepEqual(cityPageViews([row('/chennai',3),row('/chennai/restaurants/zaheer',4),row('/chennai-not-a-city',99),row('/mumbai/masjids',2),row('/dashboard',1000),row('/chennai',-1)]),{chennai:7,mumbai:2,bangalore:0,hyderabad:0});
});
