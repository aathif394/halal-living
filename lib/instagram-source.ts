/** Read public Instagram embed metadata; never download or re-encode the video. */
export function instagramVideoSource(html: string, shortcode: string): string {
  const context = html.match(/"contextJSON"\s*:\s*("(?:\\.|[^"\\])*")/);
  if (!context) throw new Error("Instagram did not provide a video source.");
  const data = JSON.parse(JSON.parse(context[1]!));
  const media = data?.gql_data?.shortcode_media;
  if (media?.shortcode !== shortcode || media.is_video !== true) throw new Error("Instagram returned a different reel.");
  const url = new URL(media.video_url);
  if (url.protocol !== "https:" || url.username || url.password || url.port || !/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname) || !url.pathname.endsWith(".mp4")) {
    throw new Error("Instagram returned an invalid video URL.");
  }
  return url.href;
}

const sources = new Map<string, { expires: number; promise: Promise<string> }>();

export function originalInstagramVideo(shortcode: string): Promise<string> {
  const cached = sources.get(shortcode);
  if (cached && cached.expires > Date.now()) return cached.promise;
  const promise = (async () => {
    const response = await fetch(`https://www.instagram.com/reel/${shortcode}/embed/`, {
      signal: AbortSignal.timeout(12000),
      headers: { "accept-language": "en-US,en;q=0.9", "user-agent": "Mozilla/5.0", accept: "text/html" },
    });
    if (!response.ok) throw new Error(`Instagram returned HTTP ${response.status}.`);
    return instagramVideoSource(await response.text(), shortcode);
  })();
  sources.set(shortcode, { expires: Date.now() + 10 * 60 * 1000, promise });
  promise.catch(() => sources.delete(shortcode));
  return promise;
}
