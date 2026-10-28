import os; os.makedirs('audit-out',exist_ok=True)
import json,sys
from playwright.sync_api import sync_playwright
AXE=open(__import__('os').environ.get('AXE_JS','node_modules/axe-core/axe.min.js')).read()
routes=['#/chennai','#/chennai/restaurants','#/chennai/masjids','#/chennai/restaurants/al-nawaz-biryani-house','#/chennai/masjids/masjid-e-noor','#/chennai/zzz']
agg={}
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h in [(390,844),(1366,900)]:
        for r in routes:
            pg=b.new_page(viewport={'width':w,'height':h});pg.goto('file://'+__import__("os").path.abspath(__import__("os").environ.get("HL_FILE","index.html"))+''+r);pg.wait_for_timeout(3000)
            pg.add_script_tag(content=AXE)
            res=pg.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']},resultTypes:['violations']});return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes.slice(0,4).map(n=>[n.target.join(' '),(n.failureSummary||'').slice(0,160),n.html.slice(0,140)])}))}")
            for v in res:
                k=v['id'];agg.setdefault(k,{'impact':v['impact'],'where':[],'ex':v['ex']})
                agg[k]['where'].append(f"{w}{r}:{v['n']}")
            pg.close()
for k,v in agg.items():
    print('##',k,v['impact'],v['where'])
    for e in v['ex'][:3]:print('   ',e)
