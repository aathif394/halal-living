import { submitSuggestion } from "@/lib/actions";

export function SuggestForm({ next, areaPlaceholder }: { next: string; areaPlaceholder?: string }) {
  return (
    <form className="hl-form two" action={submitSuggestion}>
      <input className="hl-honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <input type="hidden" name="next" value={next} />
      <label>
        What are you suggesting?
        <select name="kind" defaultValue="restaurant">
          <option value="restaurant">Restaurant</option>
          <option value="masjid">Masjid</option>
        </select>
      </label>
      <label>
        Place name
        <input name="place" required minLength={2} />
      </label>
      <label>
        Area
        <input name="area" placeholder={areaPlaceholder} />
      </label>
      <label>
        Your name
        <input name="name" autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Phone
        <input name="phone" autoComplete="tel" inputMode="tel" />
      </label>
      <label style={{ gridColumn: "1 / -1" }}>
        Why do you recommend it?
        <textarea name="why" required minLength={8} rows={4} />
      </label>
      <button type="submit">Send suggestion →</button>
    </form>
  );
}
