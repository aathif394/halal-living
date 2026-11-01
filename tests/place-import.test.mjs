import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesTarget, normalizeEntry, googleImageUrl, photoCandidates, photoAuthors, STATIC_PLACE_PHOTO } from "../lib/place-import.ts";

const target = { id: "one", table: "restaurants", city: "chennai", slug: "buhari", name: "Buhari Hotel", lat: 13.06, lng: 80.26 };
const entry = { title: "Buhari Restaurant", latitude: 13.061, longitude: 80.261, place_id: "ChIJtest", review_rating: 4.2, review_count: 200, open_hours: { Monday: ["10 am–11 pm"], Wednesday: ["Closed"] }, user_reviews: [{ Name: "Visitor", Rating: 4, Description: "Good food", When: "a month ago" }] };

test("matches nearby names but rejects the wrong branch and missing coordinates", () => {
  assert.equal(matchesTarget(target, entry), true);
  assert.equal(matchesTarget(target, { ...entry, latitude: 12.9 }), false);
  assert.equal(matchesTarget(target, { ...entry, title: "Unrelated Hotel" }), false);
  assert.equal(matchesTarget(target, { ...entry, longitude: null }), false);
  assert.equal(matchesTarget({ ...target, lat: null }, entry), false);
});

test("normalizes real gosom JSON field names, deduplicates reviews and preserves weekday positions", () => {
  const result = normalizeEntry({ ...entry, user_reviews_extended: entry.user_reviews }, "2026-11-01T00:00:00Z");
  assert.equal(result.google_reviews.length, 1);
  assert.equal(result.google_reviews[0].body, "Good food");
  assert.equal(result.google_hours.length, 7);
  assert.equal(result.google_hours[1], "");
  assert.equal(result.google_hours[2], "Closed");
  assert.equal(result.google_open_now, null);
  assert.equal(result.google_rating, 4.2);
});

test("only accepts HTTPS Google photo hosts, including redirects", () => {
  assert.ok(googleImageUrl("https://lh3.googleusercontent.com/p/photo=w500"));
  for (const url of ["https://evil.example/a.jpg", "http://lh3.googleusercontent.com/a", "https://lh3.googleusercontent.com.evil.example/a", "https://u:p@lh3.googleusercontent.com/a", "https://lh3.googleusercontent.com:8080/a", "file:///etc/passwd"]) assert.equal(googleImageUrl(url), null);
  assert.equal(photoCandidates({ thumbnail: "https://lh3.googleusercontent.com/a", images: [{ image: "https://lh3.googleusercontent.com/a" }, { image: "https://evil.example/a" }] }).length, 1);
});

test("only permits content-addressed local photo paths in snapshots", () => {
  assert.ok(STATIC_PLACE_PHOTO.test(`/places/photos/${"a".repeat(64)}.jpg`));
  assert.equal(STATIC_PLACE_PHOTO.test("/places/photos/../../secret.jpg"), false);
  assert.equal(STATIC_PLACE_PHOTO.test("https://evil.example/photo.jpg"), false);
});

test("uses Google review photos for galleries and preserves photographer credit", () => {
  const url = "https://lh3.googleusercontent.com/grass-cs/photo=k-no";
  const data = { images: [], user_reviews: [{ Name: "Photographer", Images: [url] }] };
  assert.deepEqual(photoCandidates(data), [url]);
  assert.deepEqual(photoAuthors(data, url), ["Photographer"]);
});

test("matches diacritics and distinctive short business names", () => {
  assert.equal(matchesTarget({ ...target, name: "Charminar Biryani" }, { ...entry, title: "Charminār Biryāni Centre" }), true);
  assert.equal(matchesTarget({ ...target, name: "4M Biryani House" }, { ...entry, title: "4M Biryani" }), true);
});
