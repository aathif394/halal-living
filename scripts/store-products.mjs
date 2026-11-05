#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { normalizeStoreProduct, STORE_ORIGIN } from "../lib/store-products.ts";

const businesses = [];
let more = true;
while (more) {
  const response = await fetch(`${STORE_ORIGIN}/api/businesses?onlyVerified=true&limit=100&offset=${businesses.length}`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Business catalog HTTP ${response.status}`);
  const page = await response.json();
  businesses.push(...page.data);
  more = page.hasMore && page.data.length > 0;
}
const products = [];
const failed = [];
let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < businesses.length) {
    const business = businesses[next++];
    try {
      const response = await fetch(`${STORE_ORIGIN}/api/products?businessId=${encodeURIComponent(business.id)}`, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const page = await response.json();
      for (const raw of page.data || []) {
        const product = normalizeStoreProduct(raw, business);
        if (product) products.push(product);
      }
    } catch { failed.push(business.name); }
  }
}));
if (!products.length) throw new Error("The store returned no products; previous snapshot preserved.");
products.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(new URL("../data/store-products.json", import.meta.url), JSON.stringify({ updatedAt: new Date().toISOString(), products }, null, 2) + "\n");
console.log(JSON.stringify({ products: products.length, brands: new Set(products.map(product => product.businessId)).size, failed }, null, 2));
