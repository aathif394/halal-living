import { readEnv } from "./supabase.ts";

export async function clarityId(): Promise<string> {
  const id =
    (await readEnv("NEXT_PUBLIC_CLARITY_ID")) ||
    (await readEnv("CLARITY_ID")) ||
    process.env.NEXT_PUBLIC_CLARITY_ID ||
    process.env.CLARITY_ID ||
    "";
  return id.trim();
}
