import type { Metadata } from "next";
import { Frame } from "@/components/chrome";
import { Crumbs } from "@/components/crumbs";
import { JsonLd } from "@/components/json-ld";
import { CITIES } from "@/lib/cities";
import { getAboutPage } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = { title: "How we verify" };

const DEFAULT_STEPS = [
  { number: "01", title: "Someone suggests a place", body: "A restaurant or masjid gets submitted through the suggest form, by a visitor or the owner." },
  { number: "02", title: "A person checks it", body: "Someone from the community confirms the address, halal status, and details before anything goes live." },
  { number: "03", title: "It's labelled honestly", body: "HMC certified, self-certified, or vegetarian — the certification shown is always what was actually provided." },
];

export default async function HowWeVerifyPage() {
  const about = await getAboutPage();
  const base = await siteUrl();
  const city = CITIES[0]!;
  const steps = about?.process_steps?.length ? about.process_steps : DEFAULT_STEPS;

  return (
    <Frame city={city}>
      <div className="hl-page-main">
        <Crumbs items={[{ href: "/", label: "Halal Living" }, { label: "How we verify" }]} />
        <h1>{about?.title || "How we verify"}</h1>
        <p className="hl-prose">
          {about?.thesis_body ||
            "A person suggests a place, and someone from the community checks it before it is listed. We'd rather be small and accurate than big and wrong."}
        </p>
        <h2>{about?.process_title || "The process"}</h2>
        <div className="hl-facts" style={{ marginTop: 18 }}>
          {steps.map((step) => (
            <div key={step.number}>
              <b>{step.number} · {step.title}</b>
              <p style={{ margin: "4px 0 0" }}>{step.body}</p>
            </div>
          ))}
        </div>
        {about?.quote ? (
          <blockquote className="hl-quote">
            “{about.quote}”
            {about.quote_author ? <footer>{about.quote_author}</footer> : null}
          </blockquote>
        ) : null}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: about?.title || "How we verify",
          url: `${base}/how-we-verify`,
          description: about?.thesis_body || "How Halal Living verifies restaurants and masjids.",
        }}
      />
    </Frame>
  );
}
