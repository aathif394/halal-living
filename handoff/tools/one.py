import os; os.makedirs('audit-out',exist_ok=True)
import sys
from playwright.sync_api import sync_playwright
url,w,h,out=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
scroll=int(sys.argv[5]) if len(sys.argv)>5 else 0
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':w,'height':h});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+__import__("os").path.abspath(__import__("os").environ.get("HL_FILE","index.html"))+''+url);pg.wait_for_timeout(3000)
    if scroll:
        pg.evaluate(f"(()=>{{const o=document.querySelector('[data-detail-overlay]')||document.querySelector('[data-view-overlay]');if(o)o.scrollTop={scroll};else window.scrollTo(0,{scroll})}})()");pg.wait_for_timeout(700)
    pg.screenshot(path=out);print(errs)
