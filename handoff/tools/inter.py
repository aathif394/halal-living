import os; os.makedirs('audit-out',exist_ok=True)
import sys,json
from playwright.sync_api import sync_playwright
OFF=open('__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'off.js')').read()
W=int(sys.argv[1]);H=int(sys.argv[2]);T=sys.argv[3]
log=[]
def L(*a):log.append(' '.join(str(x) for x in a));print(*a,flush=True)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':W,'height':H});errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:300]))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text[:200]) if m.type=='error' else None)
    U='file://'+__import__("os").path.abspath(__import__("os").environ.get("HL_FILE","index.html"))+''
    pg.goto(U+'#/chennai');pg.wait_for_timeout(2600)
    def vis(t,exact=False):return pg.get_by_text(t,exact=exact).locator('visible=true')
    def shot(n):pg.screenshot(path=f'audit-out/I{T}_{n}.png')
    def step(name,fn):
        n0=len(errs)
        try: fn(); L('OK',name)
        except Exception as e: L('FAIL',name,str(e).split('\n')[0][:200])
        if len(errs)>n0: L('  errors:',errs[n0:])
    # 1 search
    def s1():
        if W<1100:
            pg.locator('input[aria-label="Open search"]').first.click();pg.wait_for_timeout(700)
            inp=pg.locator('input[aria-label="Search"]').first;inp.fill('biryani');pg.wait_for_timeout(700);shot('search')
            pg.keyboard.press('Enter');pg.wait_for_timeout(1200);shot('search_after');L('  hash',pg.evaluate('location.hash'))
        else:
            inp=pg.locator('input').locator('visible=true').first;inp.click();inp.fill('biryani');pg.wait_for_timeout(800);shot('search')
            pg.keyboard.press('Enter');pg.wait_for_timeout(1200);shot('search_after');L('  hash',pg.evaluate('location.hash'))
        pg.evaluate("location.hash='#/chennai'");pg.wait_for_timeout(1200)
    step('search',s1)
    # 2 city chooser
    def s2():
        if W<1100: pg.mouse.click(110,30)
        else: pg.locator('.hl-city').locator('visible=true').first.click()
        pg.wait_for_timeout(900);shot('chooser')
        pg.mouse.click(195,380) if W<1100 else pg.mouse.click(520,600);pg.wait_for_timeout(2500);shot('mumbai');L('  hash',pg.evaluate('location.hash'),'title has Mumbai',pg.evaluate("document.body.innerText.includes('in Mumbai')"))
        pg.evaluate("location.hash='#/chennai'");pg.wait_for_timeout(2500)
    step('city switch',s2)
    # 3 map toggle
    def s3():
        el=vis('Show map').first;el.scroll_into_view_if_needed();el.click();pg.wait_for_timeout(1200);shot('map')
        L('  label now',vis('Hide map').count());vis('Hide map').first.click();pg.wait_for_timeout(500)
    step('map toggle',s3)
    # 4 reels viewer
    def s4():
        el=pg.get_by_text('Check out these reels').first;el.scroll_into_view_if_needed();pg.wait_for_timeout(800)
        r=pg.get_by_text('Dum biryani reveal').locator('visible=true').first;r.click();pg.wait_for_timeout(1200);shot('reel')
        pg.keyboard.press('Escape');pg.wait_for_timeout(800);L('  reel closed?',pg.get_by_text('Dum biryani reveal').locator('visible=true').count())
        shot('reel_after')
    step('reels',s4)
    # 5 suggest form invalid submit
    def s5():
        pg.evaluate("location.hash='#/chennai'");pg.wait_for_timeout(1500)
        el=pg.locator('[data-suggest]').first;el.scroll_into_view_if_needed();pg.wait_for_timeout(600)
        if W<1100:
            vis('Suggest a place').first.click();pg.wait_for_timeout(900)
        btn=vis('Send suggestion').first;btn.click();pg.wait_for_timeout(700);shot('suggest_invalid')
        email=pg.locator('input[placeholder*="reach you"]').locator('visible=true').first;email.fill('not-an-email');btn.click();pg.wait_for_timeout(600);shot('suggest_bademail')
    step('suggest form',s5)
    def closeall():
        pg.keyboard.press('Escape');pg.wait_for_timeout(500)
        L('  overlays after Esc', pg.evaluate("[...document.querySelectorAll('[aria-modal=true],[role=dialog]')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.top<innerHeight&&r.bottom>0&&cs.visibility!=='hidden'&&+cs.opacity>0}).map(e=>(e.getAttribute('aria-label')||e.id||e.className||'').toString().slice(0,40))"))
    closeall()
    # 6 subscribe
    def s6():
        pg.evaluate("location.hash='#/chennai'");pg.wait_for_timeout(1500)
        pg.locator('[aria-label="Stay updated by email"]').first.click();pg.wait_for_timeout(900);shot('subscribe')
        inputs=pg.locator('input').locator('visible=true');L('  inputs',inputs.count())
        closeall();shot('subscribe_closed')
    step('subscribe',s6)
    # 7 ad enquiry
    def s7():
        el=vis('Post your ad here').first;el.scroll_into_view_if_needed();el.click();pg.wait_for_timeout(900);shot('adform');closeall()
    step('ad enquiry',s7)
    # 8 install
    def s8():
        pg.evaluate("window.hlInstall()");pg.wait_for_timeout(900);shot('install')
        pg.keyboard.press('Escape');pg.wait_for_timeout(500);L('  sheet open after Esc',pg.locator('#hl-pwa-sheet').count())
        closeall()
    step('install sheet',s8)
    # 9 bottom nav (mobile)
    if W<1100:
        def s9():
            for lab in ['Food','Masjids','Home']:
                pg.locator(f'nav[aria-label=Main] button[aria-label="{lab}"]').click();pg.wait_for_timeout(1100);L('  ',lab,pg.evaluate('location.hash'))
            pg.locator('nav[aria-label=Main] button[aria-label="Masjid locator"]').click();pg.wait_for_timeout(1200);shot('locator')
        step('bottom nav',s9)
    # 10 detail back
    def s10():
        pg.evaluate("location.hash='#/chennai/masjids/masjid-e-noor'");pg.wait_for_timeout(2200)
        pg.go_back();pg.wait_for_timeout(1500);L('  back hash',pg.evaluate('location.hash'))
    step('detail back',s10)
    o=pg.evaluate(OFF);L('overflow end',o)
    L('TOTAL ERRS',errs)
