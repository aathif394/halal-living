import seed from "../data/store-products.json" with { type: "json" };

export const STORE_ORIGIN = "https://www.livingcollective.store";
export type StoreBusiness = { id: string; name: string; slug: string };
export type StoreProduct = {
  id: string; name: string; category: string; price: number; image: string; url: string;
  businessId: string; businessName: string; businessSlug: string;
};

/** Only published, purchasable products with a real image and price reach the home page. */
export function normalizeStoreProduct(value: unknown, business: StoreBusiness): StoreProduct | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!row.id || typeof row.name !== "string" || !row.name.trim() || /out.of.stock|unavailable/i.test(String(row.stock_status))) return null;
  const price = Number(row.show_as_sale && row.sale_price != null ? row.sale_price : row.price);
  if (row.price == null || !Number.isFinite(price) || price < 0) return null;
  const rawImage = row.thumbnail_image || row.photo || (Array.isArray(row.gallery_images) ? row.gallery_images[0] : "");
  let image: URL;
  try { image = new URL(String(rawImage)); } catch { return null; }
  if (image.protocol !== "https:" || image.username || image.password) return null;
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  return {
    id: String(row.id), name: row.name.trim(), category: String(row.category || "From the store"), price,
    image: image.href,
    url: slug ? `${STORE_ORIGIN}/product/${encodeURIComponent(business.slug || business.id)}/${encodeURIComponent(slug)}` : `${STORE_ORIGIN}/product/${encodeURIComponent(String(row.id))}`,
    businessId: business.id, businessName: business.name, businessSlug: business.slug,
  };
}

export function sampleStoreProducts(products: StoreProduct[], count = 5, random = Math.random): StoreProduct[] {
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  const selected: StoreProduct[] = [];
  const businesses = new Set<string>();
  const ids = new Set<string>();
  for (const product of shuffled) {
    if (businesses.has(product.businessId) || ids.has(product.id)) continue;
    selected.push(product); businesses.add(product.businessId); ids.add(product.id);
    if (selected.length === count) return selected;
  }
  for (const product of shuffled) {
    if (ids.has(product.id)) continue;
    selected.push(product); ids.add(product.id);
    if (selected.length === count) break;
  }
  return selected;
}

const catalog = seed.products as StoreProduct[];

// Render real catalog cards immediately while current prices load independently.
export function initialStoreProducts(): StoreProduct[] {
  return sampleStoreProducts(catalog);
}
const cache = new Map<string, { expires: number; promise: Promise<StoreProduct[]> }>();

function currentBusinessProducts(sample: StoreProduct): Promise<StoreProduct[]> {
  const existing = cache.get(sample.businessId);
  if (existing && existing.expires > Date.now()) return existing.promise;
  const promise = (async () => {
    try {
      const response = await fetch(`${STORE_ORIGIN}/api/products?businessId=${encodeURIComponent(sample.businessId)}`, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error("Store catalog temporarily unavailable");
      const json = await response.json() as { data?: unknown[] };
      if (!Array.isArray(json.data)) throw new Error("Invalid store catalog");
      const business = { id: sample.businessId, name: sample.businessName, slug: sample.businessSlug };
      return json.data.map(row => normalizeStoreProduct(row, business)).filter((row): row is StoreProduct => row !== null);
    } catch {
      return catalog.filter(product => product.businessId === sample.businessId);
    }
  })();
  cache.set(sample.businessId, { expires: Date.now() + 10 * 60 * 1000, promise });
  return promise;
}

export async function randomStoreProducts(): Promise<StoreProduct[]> {
  const choices = sampleStoreProducts(catalog);
  const live = (await Promise.all(choices.map(currentBusinessProducts))).flat();
  return sampleStoreProducts(live);
}
