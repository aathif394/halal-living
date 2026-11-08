import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {mapEmbedUrl,mapDirectionsUrl} from '../lib/maps.ts';

const baseline = path => execFileSync('git',['show',`50618bb:${path}`],{encoding:'utf8'});
const source = path => readFile(new URL('../'+path,import.meta.url),'utf8');

// Performance changes may replace anchors and image delivery without changing the UI.
const normalizeDelivery = text => text
 .replace(/import \{ PlaceImage \} from "\.\/place-image";\n/g, '')
 .replace(/import (Link|Image) from "next\/(link|image)";\n/g, '')
 .replace(/import \{ useRouter \} from "next\/navigation";\n/g, '')
 .replace(/<Link(?=[\s>])/g, '<a').replace(/<\/Link>/g, '</a>')
 .replace(/\s+prefetch=\{(?:true|false)\}/g, '')
 .replace(/<(?:Image|PlaceImage) src=\{place.photo\} alt=""[^>]*\/>/g, '<img src={place.photo} alt="" loading="lazy" />')
 .replace(/<(?:Image|PlaceImage) src=\{current.photo\} alt=""[^>]*\/>/g, '<img src={current.photo} alt="" />')
 .replace('  const router = useRouter();\n', '')
 .replace('router.push(href)', 'window.location.assign(href)')
 .replace(/\n{3,}/g, '\n\n').trimStart();

test('Google map uses real coordinates without a billable API key',()=>{
 const url=new URL(mapEmbedUrl([13.0662117,80.2684857]));
 assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('q'),'13.0662117,80.2684857');
 assert.equal(url.searchParams.get('output'),'embed');assert.equal(url.searchParams.get('z'),'16');assert.equal(url.searchParams.has('key'),false);
 assert.equal(new URL(mapDirectionsUrl([13.0662117,80.2684857])).searchParams.get('destination'),'13.0662117,80.2684857');
 for(const value of [null,[NaN,80],[13,Infinity],[91,80],[13,181]])assert.equal(mapEmbedUrl(value),'');
});

test('navigation destinations, forms and other UI are preserved with client routing',async()=>{
 const paths=execFileSync('git',['ls-tree','-r','--name-only','HEAD'],{encoding:'utf8'}).trim().split('\n').filter(p=>p==='app/globals.css'||p.startsWith('components/')||(/^app\//.test(p)&&p.endsWith('.tsx')));
 for(const path of paths){if(['app/globals.css','app/layout.tsx','app/[city]/page.tsx','components/detail.tsx','components/place-browser.tsx','components/reel-player.tsx','components/city-home.tsx','components/home-client.tsx','components/reels.tsx','components/launch.tsx','components/icons.tsx','components/motion.tsx','components/city-switcher.tsx','components/subscribe.tsx'].includes(path))continue;assert.equal(normalizeDelivery((await source(path)).replace("place.art, reels, row.slug)", "place.art, reels)").replace("loadReels(city.slug)", "loadReels()")),normalizeDelivery(baseline(path)),path);}
});

// Signup preferences were explicitly changed; preserve its existing floating/mobile shell.
test('signup retains its floating button and responsive dialog shell',async()=>{
 const current=await source('components/subscribe.tsx'),old=baseline('components/subscribe.tsx');
 const shell=text=>text.slice(text.indexOf('  const visible = shown;'));
 assert.equal(shell(current),shell(old));
});

test('all four place maps retain their real-coordinate integration',async()=>{
 const html=await source('components/detail.tsx');
 assert.equal((html.match(/name=\{place.name\} lat=\{place.lat\} lng=\{place.lng\}/g)||[]).length,4);
});

test('directory filters, cards, search and surrounding map card remain unchanged',async()=>{
 const normalize=text=>normalizeDelivery(text).replace('import { mapEmbedUrl } from "@/lib/maps";\n','').replace(/function PlacesMap\([\s\S]*?\nexport function PlaceBrowser/,'export function PlaceBrowser')
  // Narrow phones now show the map icon with the same accessible button label.
  .replace(' aria-label={map ? "Hide map" : "Show map"}', '')
  .replace('<span className="hl-mapbtn__label">{map ? "Hide map" : "Show map"}</span>', '{map ? "Hide map" : "Show map"}');
 const current=await source('components/place-browser.tsx'),old=baseline('components/place-browser.tsx');assert.equal(normalize(current),normalize(old));
 const card=text=>text.slice(text.indexOf('      <a className="hl-pmap__open"'),text.indexOf('\nexport function PlaceBrowser'));
 assert.equal(card(normalizeDelivery(current)),card(normalizeDelivery(old)));
});

test('Google snapshots have reviewed matches, scoped prayer-room data and local photos',async()=>{
 const snapshot=JSON.parse(await source('data/google-places.json'));
 const catalog=JSON.parse(await source('data/reel-directory.json'));
 const matches=JSON.parse(await source('data/google-place-matches.json'));
 const listings=new Map(catalog.places.map(place=>[
   `${place.kind==='restaurants'?'restaurants':'prayer_halls'}/${place.city}/${place.slug}`,place
 ]));
 assert.deepEqual(Object.keys(snapshot.places).sort(),Object.keys(matches).sort());
 for(const [key,place] of listings){
   if(place.city==='chennai')assert.ok(snapshot.places[key],key);
 }
 for(const [key,row] of Object.entries(snapshot.places)){
   const place=listings.get(key);
   assert.ok(place,key);
   const {scope,placeId,title}=matches[key];
   assert.equal(row.google_place_id,placeId,key);
   if(scope==='venue'||scope==='landmark'){
     assert.equal(place.kind,'masjids',key);
     assert.equal(row.google_rating,null,key);
     assert.equal(row.google_review_count,null,key);
     assert.deepEqual(row.google_reviews,[],key);
     assert.deepEqual(row.google_hours,[],key);
   }
   if(scope==='venue')assert.equal(row.google_venue_name,title,key);
   if(scope==='landmark'){
     assert.ok(place.note.includes(title),key);
     assert.equal(row.address,place.address,key);
     assert.equal(row.google_phone,null,key);
     assert.equal(row.google_website,undefined,key);
     assert.equal(row.google_business_status,undefined,key);
     assert.deepEqual(row.google_photos,[],key);
   }
 }
 const places=Object.values(snapshot.places);
 const photos=places.flatMap(p=>p.google_photos);assert.ok(photos.length>400);assert.ok(places.flatMap(p=>p.google_reviews).length>400);
 for(const p of places){assert.ok(Number.isFinite(p.lat)&&Number.isFinite(p.lng));for(const photo of p.google_photos){assert.match(photo.name,/^\/places\/photos\/[a-f0-9]{64}\.(jpg|png|webp)$/);assert.ok((await stat(new URL('../public'+photo.name,import.meta.url))).size>0);}}
});
