"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="hl-errpage">
      <p className="hl-kicker">SOMETHING WENT WRONG</p>
      <h1>This page didn’t load properly</h1>
      <p>It’s a problem on our side, not yours. Reloading usually fixes it.</p>
      <div className="hl-errpage__btns">
        <button type="button" onClick={() => reset()}>
          Reload page
        </button>
        <a href="/chennai">Go to home</a>
      </div>
    </main>
  );
}
