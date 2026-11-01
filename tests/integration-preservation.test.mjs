import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {mapEmbedUrl,mapDirectionsUrl} from '../lib/maps.ts';

const baseline = path => execFileSync('git',['show',`d67e035:${path}`],{encoding:'utf8'});
const source = path => readFile(new URL('../'+path,import.meta.url),'utf8');

test('Google map uses real coordinates without a billable API key',()=>{
 const url=new URL(mapEmbedUrl([13.0662117,80.2684857]));
 assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('q'),'13.0662117,80.2684857');
 assert.equal(url.searchParams.get('output'),'embed');assert.equal(url.searchParams.get('z'),'16');assert.equal(url.searchParams.has('key'),false);
 assert.equal(new URL(mapDirectionsUrl([13.0662117,80.2684857])).searchParams.get('destination'),'13.0662117,80.2684857');
 for(const value of [null,[NaN,80],[13,Infinity],[91,80],[13,181]])assert.equal(mapEmbedUrl(value),'');
});

test('navigation, forms and other UI outside the requested fixes stay identical to the restored app',async()=>{
 const paths=execFileSync('git',['ls-tree','-r','--name-only','HEAD'],{encoding:'utf8'}).trim().split('\n').filter(p=>p==='app/globals.css'||p.startsWith('components/')||(/^app\//.test(p)&&p.endsWith('.tsx')));
 for(const path of paths){if(['app/globals.css','components/detail.tsx','components/place-browser.tsx','components/reel-player.tsx','components/city-home.tsx'].includes(path))continue;assert.equal(await source(path),baseline(path),path);}
});

test('all four place maps retain their real-coordinate integration',async()=>{
 const html=await source('components/detail.tsx');
 assert.equal((html.match(/name=\{place.name\} lat=\{place.lat\} lng=\{place.lng\}/g)||[]).length,4);
});

test('directory filters, cards, search and surrounding map card remain unchanged',async()=>{
 const normalize=text=>text.replace('import { mapEmbedUrl } from "@/lib/maps";\n','').replace(/function PlacesMap\([\s\S]*?\nexport function PlaceBrowser/,'export function PlaceBrowser');
 const current=await source('components/place-browser.tsx'),old=baseline('components/place-browser.tsx');assert.equal(normalize(current),normalize(old));
 const card=text=>text.slice(text.indexOf('      <a className="hl-pmap__open"'),text.indexOf('\nexport function PlaceBrowser'));
 assert.equal(card(current),card(old));
});

test('snapshot photos all exist and keep the expected matched-place coverage',async()=>{
 const snapshot=JSON.parse(await source('data/google-places.json'));const places=Object.values(snapshot.places);assert.equal(places.length,59);
 const photos=places.flatMap(p=>p.google_photos);assert.equal(photos.length,428);assert.ok(places.flatMap(p=>p.google_reviews).length>=295);
 for(const p of places){assert.ok(Number.isFinite(p.lat)&&Number.isFinite(p.lng));for(const photo of p.google_photos){assert.match(photo.name,/^\/places\/photos\/[a-f0-9]{64}\.(jpg|png|webp)$/);assert.ok((await stat(new URL('../public'+photo.name,import.meta.url))).size>0);}}
});
