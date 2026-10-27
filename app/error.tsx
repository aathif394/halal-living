"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="hl-page-main">
      <h1>The directory didn't load.</h1>
      <p className="hl-prose">Try again in a moment.</p>
      <button className="hl-btn" type="button" onClick={() => reset()}>Try again</button>
    </main>
  );
}
