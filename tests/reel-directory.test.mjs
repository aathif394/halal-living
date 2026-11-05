import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';

const catalog = JSON.parse(readFileSync(new URL('../data/reel-directory.json', import.meta.url)));
const reels = new Map(catalog.reels.map(reel => [reel.id, reel]));

test('every public listing has a real reel and the relationship works both ways', () => {
  assert.equal(new Set(catalog.places.map(place => place.slug)).size, catalog.places.length);
  assert.equal(reels.size, catalog.reels.length);
  for (const place of catalog.places) {
    assert.ok(place.reelIds.length, `${place.name} has no reel`);
    assert.ok(['restaurants', 'masjids'].includes(place.kind));
    for (const id of place.reelIds) {
      const reel = reels.get(id);
      assert.ok(reel, `${place.name}: missing ${id}`);
      assert.equal(reel.kind, place.kind);
      assert.equal(reel.city, place.city);
      assert.ok(reel.placeSlugs.includes(place.slug));
      assert.ok(reel.places.some(link => link.slug === place.slug && link.name === place.name));
    }
  }
  for (const reel of reels.values()) {
    assert.ok(reel.placeSlugs.length);
    for (const slug of reel.placeSlugs) assert.ok(catalog.places.some(place => place.slug === slug && place.reelIds.includes(reel.id)));
  }
});

test('published reels link to Instagram originals and do not ship video files', () => {
  for (const reel of reels.values()) {
    assert.match(reel.id, /^[A-Za-z0-9_-]+$/);
    assert.equal(reel.permalink, `https://www.instagram.com/reel/${reel.id}/`);
    assert.equal(reel.video, undefined);
    assert.equal(reel.poster, `/reels/${reel.id}.jpg`);
    assert.equal(existsSync(new URL(`../public/reels/${reel.id}.mp4`, import.meta.url)), false);
    assert.ok(statSync(new URL(`../public${reel.poster}`, import.meta.url)).size > 1024);
  }
});
