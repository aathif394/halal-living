import Link from "next/link";
import type { Metadata } from "next";
import { Frame } from "@/components/chrome";
import { CITIES } from "@/lib/cities";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

// Linked from every digest email. A GET only shows the button: link scanners open links, so unsubscribing needs a POST.
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t = "", done } = await searchParams;
  const title = done === "1" ? "You’re unsubscribed" : done === "0" ? "That link has expired" : "Unsubscribe from Halal Living updates";
  const text =
    done === "1"
      ? "You won’t get the monthly email any more. You can sign up again any time from a city page."
      : done === "0"
        ? "We couldn’t find that subscription. It may already be cancelled."
        : "You’ll stop getting the monthly email with new restaurants and masjids.";
  return (
    <Frame city={CITIES[0]!}>
      <section className="hl-lhero">
        <div className="hl-stars-bg" aria-hidden="true" />
        <div className="hl-wrap hl-lhero__in">
          <p className="hl-kicker">MONTHLY UPDATES</p>
          <h1 className="hl-lhero__h">{title}</h1>
        </div>
      </section>
      <div className="hl-wrap hl-sec">
        <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 560, margin: "0 0 20px" }}>{text}</p>
        {done == null && t ? (
          <form method="post" action="/api/unsubscribe">
            <input type="hidden" name="t" value={t} />
            <button type="submit" className="hl-btn" style={{ background: CITIES[0]!.btn, color: "#fff", border: 0, borderRadius: 999, padding: "12px 22px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Unsubscribe
            </button>
          </form>
        ) : (
          <Link href="/" style={{ fontWeight: 700 }}>Back to Halal Living</Link>
        )}
      </div>
    </Frame>
  );
}
