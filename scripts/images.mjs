import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = new URL('../public/places/photos/', import.meta.url);
const output = new URL('thumbs/v1/', directory);
await mkdir(output, { recursive: true });
const sources = (await readdir(directory)).filter(name => /^[a-f0-9]{64}\.(jpg|png|webp)$/.test(name));
let index = 0, generated = 0;
// Bound image decoding memory; unchanged, content-addressed assets are only built once.
await Promise.all(Array.from({ length: 4 }, async () => {
  while (index < sources.length) {
    const name = sources[index++];
    for (const width of [320, 640]) {
      const target = new URL(`${name}.${width}.webp`, output);
      try { if ((await stat(target)).size > 0) continue; } catch {}
      await sharp(fileURLToPath(new URL(name, directory)))
        .rotate().resize({ width }).webp({ quality: 75 }).toFile(fileURLToPath(target));
      generated++;
    }
  }
}));
console.log(`Place photos: ${generated} generated; ${sources.length * 2} responsive assets ready.`);
