import os; os.makedirs('audit-out',exist_ok=True)
import sys,json
from playwright.sync_api import sync_playwright

OFF=open('__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'off.js')').read()
def check(pg):
    return pg.evaluate(OFF)
def scroll_all(pg):
    pg.evaluate("""async()=>{const els=[document.scrollingElement,...document.querySelectorAll('[data-view-overlay],[data-detail-overlay]')];for(const e of els){if(!e)continue;for(let y=0;y<e.scrollHeight;y+=600){e.scrollTop=y;await new Promise(r=>setTimeout(r,40))}}}""")
def run(cities,sizes,tag):
    out={}
    with sync_playwright() as p:
        b=p.chromium.launch()
        for city in cities:
            for w,h in sizes:
                pg=b.new_page(viewport={'width':w,'height':h});errs=[]
                pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:200]))
                pg.on('console',lambda m:errs.append('CONSOLE '+m.text[:160]) if m.type=='error' else None)
                base='file://'+__import__("os").path.abspath(__import__("os").environ.get("HL_FILE","index.html"))+''
                pg.goto(base+'#/'+city);pg.wait_for_timeout(2600)
                rec={}
                routes=[('home','#/'+city),('rest','#/'+city+'/restaurants'),('mas','#/'+city+'/masjids'),('404','#/'+city+'/nope-page')]
                for name,hs in routes:
                    pg.evaluate(f"location.hash={json.dumps(hs)}");pg.wait_for_timeout(1300)
                    scroll_all(pg);pg.wait_for_timeout(300)
                    o=check(pg); rec[name]={'off':o,'hash':pg.evaluate('location.hash')}
                    pg.screenshot(path=f'audit-out/{tag}_{city}_{w}_{name}.png')
                # detail pages: find first restaurant & masjid slugs
                for kind,lst in (('rdet','restaurants'),('mdet','masjids')):
                    pg.evaluate(f"location.hash='#/{city}/{lst}'");pg.wait_for_timeout(1200)
                    slug=pg.evaluate("""()=>{const o=document.querySelector('[data-view-overlay]');if(o)o.scrollTop=0;const L=[...document.querySelectorAll('[data-view-overlay] *')].filter(e=>{if(e.children.length||!e.textContent.trim())return false;const cs=getComputedStyle(e),fs=parseFloat(cs.fontSize);return +cs.fontWeight>=800&&fs>=15&&fs<=24&&e.getBoundingClientRect().top>300&&!/^Halal Living$|km$|Show|See|Clear|Sort|Area|All of/.test(e.textContent.trim())});return L.length?L[0].textContent.trim():null}""")
                    if slug:
                        s2=slug.lower().replace('&','and');import re;s2=re.sub(r'[^a-z0-9]+','-',s2).strip('-')
                        pg.evaluate(f"location.hash='#/{city}/{lst}/{s2}'");pg.wait_for_timeout(2200)
                        scroll_all(pg);pg.wait_for_timeout(300)
                        rec[kind]={'name':slug,'hash':pg.evaluate('location.hash'),'off':check(pg),'nf':pg.evaluate("!!document.body.innerText.match(/couldn.t find|not found|404/i)")}
                        pg.screenshot(path=f'audit-out/{tag}_{city}_{w}_{kind}.png')
                rec['errs']=errs
                out[f'{city}_{w}x{h}']=rec
                pg.close()
        b.close()
    json.dump(out,open(f'audit-out/{tag}.json','w'),indent=1)
    for k,v in out.items():
        bad={n:x['off'] for n,x in v.items() if isinstance(x,dict) and 'off' in x and (x['off']['out'] or x['off']['sw']>x['off']['vw'])}
        print(k,'errs',len(v['errs']),v['errs'][:3],'overflow',bad, {n:(x.get('name'),x.get('hash'),x.get('nf')) for n,x in v.items() if n in('rdet','mdet')})
if __name__=='__main__':
    import ast
    run(ast.literal_eval(sys.argv[1]),ast.literal_eval(sys.argv[2]),sys.argv[3])
