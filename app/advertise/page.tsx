import type { Metadata } from "next";
import { Frame } from "@/components/chrome";
import { Crumbs } from "@/components/crumbs";
import { FormNotice } from "@/components/form-notice";
import { CITIES } from "@/lib/cities";
import { readNotice } from "@/lib/filters";
import { submitAdvertise } from "@/lib/actions";

export const metadata: Metadata = { title: "Advertise" };

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const notice = readNotice(await searchParams);
  const city = CITIES[0]!;
  return (
    <Frame city={city}>
      <div className="hl-page-main">
        <Crumbs items={[{ href: "/", label: "Halal Living" }, { label: "Advertise" }]} />
        <h1>Advertise with Halal Living</h1>
        <p className="hl-prose">Reach people actively looking for halal restaurants and masjids in four cities.</p>
        <FormNotice
          notice={notice}
          sent="Thanks. We'll be in touch about your placement."
          error="That didn't send. Fill in your business name, a way to reach you, and a short note, then try again."
        />
        <form className="hl-form two" action={submitAdvertise} style={{ marginTop: 22 }}>
          <input className="hl-honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <label>
            Your name
            <input name="name" required minLength={2} autoComplete="name" />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Business name
            <input name="business" required minLength={2} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            What would you like to advertise?
            <textarea name="message" required minLength={8} rows={4} />
          </label>
          <button type="submit">Send →</button>
        </form>
      </div>
    </Frame>
  );
}
