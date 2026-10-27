export function FormNotice({
  notice,
  sent,
  error,
}: {
  notice?: "sent" | "error";
  sent: string;
  error: string;
}) {
  if (notice === "sent") return <p className="hl-banner" role="status">{sent}</p>;
  if (notice === "error") return <p className="hl-banner" role="alert">{error}</p>;
  return null;
}
