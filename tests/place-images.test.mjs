import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import snapshot from '../data/google-places.json' with { type: 'json' };
import { placeImageVariants } from '../lib/place-images.ts';

test('every published Google photo has smaller, decodable static WebP variants', async () => {
  execFileSync(process.execPath, ['scripts/images.mjs'], { cwd: fileURLToPath(new URL('..', import.meta.url)) });
  const photos = [...new Set(Object.values(snapshot.places).flatMap(place => place.google_photos.map(photo => photo.name)))];
  let originalBytes = 0, compactBytes = 0;
  for (const src of photos) {
    const variants = placeImageVariants(src);
    originalBytes += (await stat(new URL('../public' + src, import.meta.url))).size;
    const file = new URL('../public' + variants.src, import.meta.url);
    compactBytes += (await stat(file)).size;
    const metadata = await sharp(fileURLToPath(file)).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.width, 640);
    const small = new URL('../public' + variants.src.replace('.640.webp', '.320.webp'), import.meta.url);
    assert.equal((await sharp(fileURLToPath(small)).metadata()).width, 320);
  }
  assert.ok(photos.length > 400);
  assert.ok(compactBytes < originalBytes, `${compactBytes} must be smaller than ${originalBytes}`);
});

test('external photos, illustration fallbacks and original lightbox URLs are preserved', () => {
  for (const src of ['https://example.com/photo.jpg', '/art/food-1.svg', '/reels/example.jpg']) {
    assert.deepEqual(placeImageVariants(src), { src });
  }
});
