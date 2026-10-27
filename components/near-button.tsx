"use client";

export function NearButton({ label = "Use my location" }: { label?: string }) {
  return (
    <button
      className="hl-chip"
      type="button"
      onClick={() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((position) => {
          const url = new URL(window.location.href);
          url.searchParams.set("lat", position.coords.latitude.toFixed(5));
          url.searchParams.set("lng", position.coords.longitude.toFixed(5));
          window.location.href = url.toString();
        });
      }}
    >
      {label}
    </button>
  );
}
