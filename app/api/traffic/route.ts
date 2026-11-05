import { monthlyTraffic } from "@/lib/traffic";

export const dynamic = "force-dynamic";
export async function GET() {
  const traffic = await monthlyTraffic();
  return Response.json(traffic || { error: "Analytics temporarily unavailable" }, { status: traffic ? 200 : 503, headers: { "cache-control": traffic ? "public, max-age=60" : "no-store" } });
}
