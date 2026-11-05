import snapshotData from "../data/google-places.json";
import type { PlaceSnapshot } from "./place-import";

const snapshot = snapshotData as PlaceSnapshot;

export function withPlaceSnapshot<T extends Record<string, unknown>>(row: T, table: "restaurants" | "prayer_halls"): T {
  const place = snapshot.places[`${table}/${String(row.city)}/${String(row.slug)}`];
  return place ? { ...row, ...place } : row;
}
