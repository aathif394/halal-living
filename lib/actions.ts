"use server";

import { redirect } from "next/navigation";
import { getSupabase } from "./supabase";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function nextPath(formData: FormData, fallback: string): string {
  const next = field(formData, "next");
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

function emailOk(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitSuggestion(formData: FormData) {
  const destination = nextPath(formData, "/suggest");
  if (field(formData, "company")) redirect(`${destination}${destination.includes("?") ? "&" : "?"}sent=1`);

  const kind = field(formData, "kind") === "masjid" ? "masjid" : "restaurant";
  const place = field(formData, "place");
  const area = field(formData, "area");
  const why = field(formData, "why");
  const name = field(formData, "name");
  const email = field(formData, "email");
  const phone = field(formData, "phone");

  if (place.length < 2 || !emailOk(email) || why.length < 8) {
    redirect(`${destination}${destination.includes("?") ? "&" : "?"}error=1`);
  }

  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic: kind,
    name: name || "Community suggestion",
    email,
    subject: `Suggestion: ${place}`,
    body: [`Place: ${place}`, `Kind: ${kind}`, area && `Area: ${area}`, phone && `Phone: ${phone}`, "", why]
      .filter(Boolean)
      .join("\n"),
  });
  if (error) redirect(`${destination}${destination.includes("?") ? "&" : "?"}error=1`);
  redirect(`${destination}${destination.includes("?") ? "&" : "?"}sent=1`);
}

export async function submitAdvertise(formData: FormData) {
  if (field(formData, "company")) redirect("/advertise?sent=1");
  const name = field(formData, "name");
  const email = field(formData, "email");
  const business = field(formData, "business");
  const message = field(formData, "message");
  if (name.length < 2 || !emailOk(email) || business.length < 2 || message.length < 8) {
    redirect("/advertise?error=1");
  }
  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic: "ads",
    name,
    email,
    subject: `Advertise: ${business}`,
    body: message,
  });
  if (error) redirect("/advertise?error=1");
  redirect("/advertise?sent=1");
}
