import type { Metadata } from "next";
import { Frame } from "@/components/chrome";
import { Icon } from "@/components/icons";
import { CITIES } from "@/lib/cities";
import { getAboutPage } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "How we verify · Halal Living" },
  description: "A person suggests a place, and someone from the community checks it before it is listed.",
};

const STEPS = [
  { title: "You tell us", body: "The name, the area and why you rate it." },
  { title: "We go and check", body: "A local volunteer visits within a week." },
  { title: "It goes live", body: "Listed with a badge that says what we found." },
];

export default async function HowWeVerify() {
  const about = await getAboutPage().catch(() => null);
  const steps = about?.process_steps?.length ? about.process_steps.map((step) => ({ title: step.title, body: step.body })) : STEPS;
  return (
    <Frame city={CITIES[0]!}>
      <section className="hl-lhero">
        <div className="hl-stars-bg" aria-hidden="true" />
        <div className="hl-wrap hl-lhero__in">
          <nav className="hl-crumbs" aria-label="Breadcrumb">
            <a href="/chennai">Home</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">How we verify</span>
          </nav>
          <h1 className="hl-lhero__h">{about?.title || "How we verify"}</h1>
        </div>
      </section>
      <div className="hl-wrap hl-sec hl-prose">
        <p>{about?.thesis_body || "Someone suggests a restaurant or masjid. A person from the community checks it before it is published."}</p>
        <ol className="hl-sg__steps hl-sg__steps--light">
          {steps.map((step) => (
            <li key={step.title}>
              <b>{step.title}</b>
              <span>{step.body}</span>
            </li>
          ))}
        </ol>
        <p>
          <a className="hl-link" href="/chennai#suggest">
            Suggest a place
            <Icon name="arrowRight" size={14} stroke={2.6} />
          </a>
        </p>
      </div>
    </Frame>
  );
}
