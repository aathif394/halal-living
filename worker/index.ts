import { runWithExecutionContext } from "vinext/shims/request-context";
import handler from "vinext/server/fetch-handler";
import { runDigest } from "../lib/digest";

type AssetsBinding = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

type Env = {
  ASSETS?: AssetsBinding;
};

type ExecutionContextLike = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
};

const cssCache = new Map<string, Promise<string | null>>();
const LINK_RE = /<link\b[^>]*>/gi;
const HEAD_END = new TextEncoder().encode("</head>");

function findBytes(haystack: Uint8Array, needle: Uint8Array): number {
  const last = haystack.length - needle.length;
  for (let i = 0; i <= last; i++) {
    let matched = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return i;
  }
  return -1;
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

function stylesheetHref(tag: string): string | null {
  if (!/\brel\s*=\s*["'][^"']*\bstylesheet\b/i.test(tag)) return null;
  const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!href || !href.startsWith("/_next/static/") || !href.endsWith(".css")) return null;
  return href;
}

function loadCss(request: Request, assets: AssetsBinding, href: string): Promise<string | null> {
  const cached = cssCache.get(href);
  if (cached) return cached;
  const pending = assets.fetch(new URL(href, request.url)).then(async (response) => {
    if (!response.ok) {
      cssCache.delete(href);
      return null;
    }
    return (await response.text()).replace(/<\/style/gi, "<\\/style");
  });
  cssCache.set(href, pending);
  return pending;
}

async function inlineStyles(response: Response, request: Request, env: Env): Promise<Response> {
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/html") || !response.body || response.headers.has("content-encoding") || !env.ASSETS) return response;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let buffered = new Uint8Array(0);
  let headEnd = -1;
  while (headEnd < 0) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    buffered = concatBytes(chunks);
    headEnd = findBytes(buffered, HEAD_END);
    if (buffered.length > 512_000) break;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  const passThrough = () => new Response(new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
    cancel() {
      return reader.cancel();
    },
  }), { status: response.status, statusText: response.statusText, headers });
  if (headEnd < 0) return passThrough();

  const head = new TextDecoder().decode(buffered.subarray(0, headEnd));
  const hrefs = [...new Set([...head.matchAll(LINK_RE)].map((match) => stylesheetHref(match[0])).filter((href): href is string => !!href))];
  if (hrefs.length === 0) return passThrough();
  const css = new Map<string, string>();
  await Promise.all(hrefs.map(async (href) => {
    const text = await loadCss(request, env.ASSETS!, href);
    if (text) css.set(href, text);
  }));
  if (css.size === 0) return passThrough();
  const rewritten = head.replace(LINK_RE, (tag) => {
    const href = stylesheetHref(tag);
    const text = href ? css.get(href) : undefined;
    if (!href || !text) return tag;
    return `<style data-clarity-unmask="true" data-href="${href}">${text}</style>`;
  });
  const tail = buffered.subarray(headEnd);
  return new Response(new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(rewritten));
      controller.enqueue(tail);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
    cancel() {
      return reader.cancel();
    },
  }), { status: response.status, statusText: response.statusText, headers });
}

const worker = {
  fetch(request: Request, env: Env, ctx: ExecutionContextLike) {
    return runWithExecutionContext(ctx, async () => {
      const response = await handler.fetch(request, env, ctx);
      return inlineStyles(response, request, env);
    });
  },
  // Monthly "Stay updated" digest (cron in cloudflare.config.ts: 03:30 UTC on the 1st = 09:00 IST).
  scheduled(_event: unknown, _env: Env, ctx: ExecutionContextLike) {
    ctx.waitUntil(runDigest().catch((error) => console.error("digest run failed:", error instanceof Error ? error.message : error)));
  },
};

export default worker;
