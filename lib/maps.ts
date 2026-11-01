type Position = [number, number] | null;

function valid(position: Position): position is [number, number] {
  return position !== null && position.every(Number.isFinite) && Math.abs(position[0]) <= 85.0511 && Math.abs(position[1]) <= 180;
}

export function mapEmbedUrl(position: Position): string {
  if (!valid(position)) return "";
  // Consumer map embed: no Maps JavaScript/Places API or billable API key.
  const url = new URL("https://www.google.com/maps");
  url.searchParams.set("q", position.join(","));
  url.searchParams.set("z", "16");
  url.searchParams.set("output", "embed");
  return url.href;
}

export function mapDirectionsUrl(position: Position): string {
  if (!valid(position)) return "";
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", position.join(","));
  return url.href;
}
