import snapshotData from "../data/google-places.json";
import type { PlaceSnapshot } from "./place-import";

const snapshot = snapshotData as PlaceSnapshot;

export function withPlaceSnapshot(row: Record<string, unknown>, table: "restaurants" | "prayer_halls"): Record<string, unknown> {
  const place = snapshot.places[`${table}/${String(row.city)}/${String(row.slug)}`];
  return place ? { ...row, ...place } : row;
}
