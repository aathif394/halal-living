import type { Metadata } from "next";
import { Frame } from "@/components/chrome";
import { Crumbs } from "@/components/crumbs";
import { FormNotice } from "@/components/form-notice";
import { SuggestForm } from "@/components/suggest-form";
import { CITIES } from "@/lib/cities";
import { readNotice } from "@/lib/filters";

export const metadata: Metadata = { title: "Suggest a place" };

export default async function SuggestPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const notice = readNotice(await searchParams);
  const city = CITIES[0]!;
  return (
    <Frame city={city}>
      <div className="hl-page-main">
        <Crumbs items={[{ href: "/", label: "Halal Living" }, { label: "Suggest a place" }]} />
        <h1>Know a place we haven&rsquo;t found?</h1>
        <p className="hl-prose">Tell us about a restaurant or masjid. Someone from the community checks it before it&rsquo;s listed.</p>
        <FormNotice
          notice={notice}
          sent="Thanks. Someone from the community will check this before it's listed."
          error="That didn't send. Add the place name, a real email, and a short note, then try again."
        />
        <SuggestForm next="/suggest" />
      </div>
    </Frame>
  );
}
