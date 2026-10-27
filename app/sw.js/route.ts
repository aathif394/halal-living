export const dynamic = "force-dynamic";

const worker = `self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf("/api/") === 0) return;
  event.respondWith(fetch(request).catch(function () { return caches.match(request); }));
});
`;

export function GET() {
  return new Response(worker, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-cache",
      "service-worker-allowed": "/",
    },
  });
}
