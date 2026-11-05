import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initialStoreProducts, normalizeStoreProduct, sampleStoreProducts } from '../lib/store-products.ts';

test('initial store cards are available synchronously from real products without a network request', () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Initial rendering must not fetch the store'); };
  try {
    const products = initialStoreProducts();
    assert.equal(products.length, 5);
    assert.equal(new Set(products.map(product => product.businessId)).size, 5);
    for (const product of products) assert.equal(new URL(product.url).hostname, 'www.livingcollective.store');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

const business = {id:'brand-a',name:'Brand A',slug:'brand-a'};
const raw = {id:1,slug:'shirt',name:'Shirt',price:500,stock_status:'in_stock',thumbnail_image:'https://example.com/shirt.jpg'};
test('store cards use real public product prices, images and direct product links', () => {
  const product = normalizeStoreProduct({...raw,show_as_sale:true,sale_price:350},business);
  assert.equal(product.price,350);
  assert.equal(product.url,'https://www.livingcollective.store/product/brand-a/shirt');
  assert.equal(normalizeStoreProduct({...raw,stock_status:'out_of_stock'},business),null);
  assert.equal(normalizeStoreProduct({...raw,price:null},business),null);
  assert.equal(normalizeStoreProduct({...raw,thumbnail_image:'javascript:alert(1)'},business),null);
});
test('random selections do not mutate the catalog, repeat products or concentrate on one brand', () => {
  const products = Array.from({length:20},(_,i)=>({...normalizeStoreProduct({...raw,id:i+1},business),id:String(i),businessId:'brand-'+(i%6)}));
  const before=JSON.stringify(products);
  const one=sampleStoreProducts(products,5,()=>0.1),two=sampleStoreProducts(products,5,()=>0.9);
  assert.equal(new Set(one.map(p=>p.id)).size,5);
  assert.equal(new Set(one.map(p=>p.businessId)).size,5);
  assert.notDeepEqual(one.map(p=>p.id),two.map(p=>p.id));
  assert.equal(JSON.stringify(products),before);
});
test('fallback catalog contains actual store products from multiple businesses', () => {
  const {products}=JSON.parse(readFileSync(new URL('../data/store-products.json',import.meta.url)));
  assert.ok(products.length>5);
  assert.ok(new Set(products.map(p=>p.businessId)).size>=5);
  assert.equal(new Set(products.map(p=>p.id)).size,products.length);
  for(const product of products){assert.equal(new URL(product.url).hostname,'www.livingcollective.store');assert.equal(new URL(product.image).protocol,'https:');assert.ok(product.price>=0);}
});
