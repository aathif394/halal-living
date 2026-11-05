#!/usr/bin/env node
// Local-only Google Maps ingestion. No paid APIs, cloud browsers or database writes.
import { readFile, writeFile, mkdir, rename, stat, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { matchesTarget, normalizeEntry, photoCandidates, photoAuthors, snapshotKey, distanceKm, googleImageUrl } from "../lib/place-import.ts";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const WORK = path.join(ROOT, ".local/places");
const SNAPSHOT = path.join(ROOT, "data/google-places.json");
const IMAGE = "gosom/google-maps-scraper@sha256:e205c02913c5a69c16fc2094b8e5b194a2f655166d2c1126d50548d216e6b1b2";
const args = process.argv.slice(2);
const command = args[0] || "help";
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const flag = name => args.includes(name);
const limit = Math.max(1, Math.min(1000, Number(option("--limit", "1000")) || 1));
const city = option("--city", "");
const resultsPath = path.resolve(option("--results", path.join(WORK, "results.jsonl")));

for (const file of [".env", ".env.local"]) {
  try { process.loadEnvFile(path.join(ROOT, file)); } catch (error) { if (error.code !== "ENOENT") throw error; }
}

async function readJson(file) { return JSON.parse(await readFile(file, "utf8")); }
async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n");
  await rename(temp, file);
}

async function prepare() {
  const snapshot = await readJson(SNAPSHOT);
  const catalog = await readJson(path.join(ROOT, "data/reel-directory.json"));
  const targets = catalog.places.filter(place => !city || place.city === city).map(place => ({
    id: `reel-${place.slug}`, table: place.kind === "restaurants" ? "restaurants" : "prayer_halls",
    slug: place.slug, name: place.name, city: place.city, address: place.address, area: place.area,
    lat: 0, lng: 0,
  })).filter(target => !flag("--missing") || !snapshot.places[snapshotKey(target)]);
  const selected = targets.slice(0, limit);
  await atomicJson(path.join(WORK, "targets.json"), selected);
  const queries = selected.map(target => {
    const imported = snapshot.places[snapshotKey(target)];
    // Stable IDs avoid searching for already-linked places on subsequent refreshes.
    const source = imported?.google_maps_url || target.google_maps_url || [target.name, target.address, target.city, "India"].filter(Boolean).join(", ");
    return `${source.replace(/[\r\n]/g, " ")} #!#${target.id}`;
  });
  await writeFile(path.join(WORK, "queries.txt"), queries.join("\n") + (queries.length ? "\n" : ""));
  console.log(`Prepared ${selected.length} public listings in .local/places/queries.txt.`);
  return selected;
}

function dockerRun(dockerArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", dockerArgs, { cwd: ROOT, stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`Local Docker scraper exited with ${code}.`)));
  });
}

async function run() {
  const targets = await readJson(path.join(WORK, "targets.json"));
  if (!targets.length) { console.log("No listings to scrape."); return; }
  const resultName = path.basename(resultsPath);
  if (path.dirname(resultsPath) !== WORK) throw new Error("For Docker runs, --results must be inside .local/places/.");
  if (flag("--resume")) {
    try { await stat(resultsPath); } catch { throw new Error("No existing results to resume. Omit --resume for a first run."); }
  }
  const dockerArgs = ["run", "--rm", "--name", "halal-living-places", "--memory", "2g", "--cpus", "2", "--shm-size", "512m", "-v", `${WORK}:/work`, IMAGE,
    "-input", "/work/queries.txt", "-results", `/work/${resultName}`, "-json", "-lang", "en", "-depth", "1", "-c", "2", "-browser-pool-size", "1", "-pages-per-browser", "2", "-exit-on-inactivity", "2m"];
  if (flag("--extra-reviews")) dockerArgs.push("-extra-reviews");
  if (flag("--resume")) dockerArgs.push("-resume");
  await dockerRun(dockerArgs);
}

async function downloadPhoto(rawUrl) {
  let url = rawUrl.replace(/=(?:w\d+[^?]*|k-no)$/, "=w1000-h750-k-no");
  let response;
  for (let i = 0; i < 4; i++) {
    if (!googleImageUrl(url)) throw new Error("Untrusted photo host.");
    response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("Missing photo redirect.");
      url = new URL(location, url).href;
      continue;
    }
    break;
  }
  if (!response?.ok || !response.body) throw new Error(`Photo HTTP ${response?.status}.`);
  const mime = response.headers.get("content-type")?.split(";")[0];
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime];
  if (!ext) { await response.body.cancel(); throw new Error("Unsupported photo format."); }
  const MAX = 4 * 1024 * 1024;
  if (Number(response.headers.get("content-length")) > MAX) { await response.body.cancel(); throw new Error("Photo exceeds 4 MB."); }
  const chunks = [];
  let bytes = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX) { await reader.cancel(); throw new Error("Photo exceeds 4 MB."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (bytes < 100) throw new Error("Empty photo.");
  const data = Buffer.concat(chunks);
  const hash = createHash("sha256").update(data).digest("hex");
  const name = `/places/photos/${hash}.${ext}`;
  await mkdir(path.join(ROOT, "public/places/photos"), { recursive: true });
  await writeFile(path.join(ROOT, "public", name), data);
  return name;
}

function parseResults(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  return trimmed.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
}

async function importResults() {
  const targets = await readJson(path.join(WORK, "targets.json"));
  const approvedMatches = await readJson(path.join(ROOT, "data/google-place-matches.json"));
  const entries = parseResults(await readFile(resultsPath, "utf8"));
  const snapshot = await readJson(SNAPSHOT);
  const timestamp = new Date().toISOString();
  const report = { imported: [], unmatched: [], photoErrors: [] };
  const photoCache = new Map();
  for (const target of targets) {
    const key = snapshotKey(target);
    if (flag("--missing") && snapshot.places[key]) continue;
    const approved = approvedMatches[key]?.placeId;
    if (flag("--only-reviewed") && !approved) continue;
    const candidates = entries.filter(entry => approved
      ? entry.place_id === approved && matchesTarget({ ...target, google_place_id: approved }, entry)
      : (!entry.input_id || entry.input_id === target.id) && matchesTarget(target, entry));
    candidates.sort((a, b) => distanceKm(target.lat, target.lng, a.latitude, a.longitude ?? a.longtitude) - distanceKm(target.lat, target.lng, b.latitude, b.longitude ?? b.longtitude));
    const entry = candidates[0];
    if (!entry?.place_id) { report.unmatched.push(key); continue; }
    const normalized = normalizeEntry(entry, timestamp);
    if (approvedMatches[key]?.scope === "venue") {
      // The building's reviews and hours do not describe its prayer room.
      normalized.google_venue_name = String(entry.title);
      normalized.address = `${target.address} · ${normalized.address || ""}`;
      normalized.google_rating = null;
      normalized.google_review_count = null;
      normalized.google_reviews = [];
      normalized.google_hours = [];
    }
    const photos = await Promise.all(photoCandidates(entry).map(async url => {
      try {
        if (!photoCache.has(url)) photoCache.set(url, downloadPhoto(url));
        const name = await photoCache.get(url);
        return { name, attributions: photoAuthors(entry, url) };
      } catch (error) { report.photoErrors.push({ place: key, message: error.message }); return null; }
    }));
    normalized.google_photos = photos.filter((photo, index) => photo && photos.findIndex(other => other?.name === photo.name) === index);
    const previous = snapshot.places[key];
    // Partial refreshes must not erase previously downloaded media or reviews.
    if (previous?.google_place_id === normalized.google_place_id) {
      if (!normalized.google_photos.length) normalized.google_photos = previous.google_photos;
      if (!normalized.google_reviews.length) normalized.google_reviews = previous.google_reviews;
    }
    snapshot.places[key] = normalized;
    report.imported.push({ key, name: entry.title, photos: normalized.google_photos.length, reviews: normalized.google_reviews.length });
    console.log(`Imported ${key}: ${normalized.google_photos.length} photos, ${normalized.google_reviews.length} reviews.`);
  }
  if (report.imported.length) {
    snapshot.updatedAt = timestamp;
    await atomicJson(SNAPSHOT, snapshot);
  }
  report.unmatched = targets.filter(target => !snapshot.places[snapshotKey(target)]).map(snapshotKey);
  report.totalEnriched = Object.keys(snapshot.places).length;
  await atomicJson(path.join(WORK, "report.json"), report);
  console.log(`Imported ${report.imported.length}; unmatched ${report.unmatched.length}; photo errors ${report.photoErrors.length}. Details: .local/places/report.json`);
  if (!report.imported.length && targets.length) process.exitCode = 1;
}

async function prunePhotos() {
  const snapshot = await readJson(SNAPSHOT);
  const used = new Set(Object.values(snapshot.places).flatMap(place => place.google_photos.map(photo => path.basename(photo.name))));
  const directory = path.join(ROOT, "public/places/photos");
  const archive = path.join(WORK, "unused-photos");
  await mkdir(archive, { recursive: true });
  let count = 0;
  for (const filename of await readdir(directory)) {
    if (!/^[a-f0-9]{64}\.(jpg|png|webp)$/.test(filename) || used.has(filename)) continue;
    await rename(path.join(directory, filename), path.join(archive, filename));
    count++;
  }
  console.log(`Archived ${count} unreferenced generated photos under .local/places/unused-photos/. No originals deleted.`);
}

try {
  if (command === "prepare") await prepare();
  else if (command === "run") await run();
  else if (command === "import") await importResults();
  else if (command === "prune") await prunePhotos();
  else if (command === "refresh") { const targets = await prepare(); if (targets.length) { await run(); await importResults(); } }
  else console.log("Usage: node scripts/places.mjs prepare|run|import|refresh|prune [--city chennai] [--limit 5] [--missing] [--extra-reviews] [--resume]\n\nRequires Node 24+ and a running local Docker engine. Reads only the reel catalog; Google matches without coordinates require reviewed place IDs.\nResults and reports: .local/places/. Snapshot and photos become deployable site assets.\nNo cloud compute or paid APIs are used. No deployment runs automatically.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
