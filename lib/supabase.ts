import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type WorkersEnv = { env?: Record<string, unknown> };

export async function readEnv(name: string): Promise<string | undefined> {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  try {
    const mod = (await import(/* @vite-ignore */ "cloudflare:workers")) as WorkersEnv;
    const value = mod.env?.[name];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

export async function getSupabase(): Promise<SupabaseClient> {
  const url = await readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = await readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) {
    throw new Error("Supabase URL or publishable key is not configured.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getServiceSupabase(): Promise<SupabaseClient | null> {
  const url = await readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = await readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
