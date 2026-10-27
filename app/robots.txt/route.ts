import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = await siteUrl();
  const body = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
