import os; os.makedirs('audit-out',exist_ok=True)
import sys,json
from playwright.sync_api import sync_playwright
SIZES=[(360,780),(390,844),(844,390),(768,1024),(1024,768),(1100,900),(1366,900),(1440,900),(1920,1080)]
OFF="""()=>{const vw=innerWidth;const out=[];const sw=document.documentElement.scrollWidth;
for(const e of document.querySelectorAll('body *')){const r=e.getBoundingClientRect();if(r.width===0||r.height===0)continue;if(r.right<=vw+1&&r.left>=-1)continue;
let p=e.parentElement,clipped=false;while(p&&p!==document.body){const cs=getComputedStyle(p);if(cs.overflowX!=='visible'||cs.overflow==='hidden'||cs.clipPath!=='none'){const pr=p.getBoundingClientRect();if(pr.right<=vw+1&&pr.left>=-1){clipped=true;break}}if(cs.position==='fixed'&&false)break;p=p.parentElement}
if(!clipped){const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0)continue;out.push((e.tagName+'.'+(e.className&&e.className.baseVal===undefined?e.className:'')).slice(0,40)+' '+(e.textContent||'').trim().slice(0,30)+' ['+Math.round(r.left)+','+Math.round(r.right)+']')}if(out.length>8)break}
return {sw,vw,out}}"""
def run(city=None):
    res={}
    with sync_playwright() as p:
        b=p.chromium.launch()
        for w,h in SIZES:
            pg=b.new_page(viewport={'width':w,'height':h});errs=[]
            pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:200]))
            pg.on('console',lambda m:errs.append('CONSOLE '+m.type+' '+m.text[:200]) if m.type in('error','warning') else None)
            pg.goto('file://'+__import__("os").path.abspath(__import__("os").environ.get("HL_FILE","index.html"))+'');pg.wait_for_timeout(2500)
            for y in range(0,20000,700):
                pg.evaluate(f'window.scrollTo(0,{y})');pg.wait_for_timeout(60)
            pg.wait_for_timeout(500);pg.evaluate('window.scrollTo(0,0)');pg.wait_for_timeout(300)
            o=pg.evaluate(OFF)
            pg.screenshot(path=f'audit-out/home_{w}x{h}.png',full_page=True)
            res[f'{w}x{h}']={'errs':errs,'off':o}
            pg.close()
        b.close()
    print(json.dumps(res,indent=1))
run()
