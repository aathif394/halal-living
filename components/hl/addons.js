// @ts-nocheck
// Plain-JS behaviours from the approved mockup (focus trap, error page, pill indicator, sticky headers, halal note, install sheet).
// Each runs once, after hydration, exactly as it did in the mockup.

export function focusTrap() {
// Modal dialogs: move focus in when one opens, keep Tab inside it, and give focus back on close.
(function () {
  var open = null, back = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function items(d) { return [].slice.call(d.querySelectorAll(FOCUSABLE)).filter(function (el) { return el.offsetParent !== null || el.getClientRects().length; }); }
  function check() {
    var all = document.querySelectorAll('[role=dialog][aria-modal=true]'), d = all.length ? all[all.length - 1] : null;
    if (d === open) return;
    if (d) {
      if (!open) back = document.activeElement;
      open = d;
      if (!d.contains(document.activeElement)) {
        var f = items(d), first = d.querySelector('[aria-label=Close],[aria-label=Back]') || f[0];
        if (first) { try { first.focus({ preventScroll: true }); } catch (e) {} }
        else { d.setAttribute('tabindex', '-1'); try { d.focus({ preventScroll: true }); } catch (e) {} }
      }
    } else {
      open = null;
      if (back && back.isConnected) { try { back.focus({ preventScroll: true }); } catch (e) {} }
      back = null;
    }
  }
  var q = 0;
  new MutationObserver(function () { if (q) return; q = requestAnimationFrame(function () { q = 0; check(); }); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !open || !open.isConnected) return;
    var f = items(open); if (!f.length) { e.preventDefault(); return; }
    var a = f[0], z = f[f.length - 1];
    if (!open.contains(document.activeElement)) { e.preventDefault(); a.focus(); return; }
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }, true);
})();
}

export function errorWatch() {
(function () {
  var shown = false;
  var COPY = {
    render: ['SOMETHING WENT WRONG', 'This page didn’t load properly', 'It’s a problem on our side, not yours. Reloading usually fixes it.'],
    boot: ['COULDN’T LOAD', 'We couldn’t load Halal Living', 'Check your connection and reload. If you’re online, it’s a problem on our side and we’re on it.']
  };
  function show(kind) {
    if (shown) return; shown = true;
    var el = document.getElementById('hl-error'); if (!el) return;
    var c = COPY[kind] || COPY.render;
    document.getElementById('he-k').textContent = c[0];
    document.getElementById('he-title').textContent = c[1];
    document.getElementById('he-sub').textContent = c[2];
    document.getElementById('he-ref').textContent = kind.toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    el.hidden = false;
    var sk = document.getElementById('hl-skel'); if (sk) sk.remove(); try { window.__hlLaunchFinish && window.__hlLaunchFinish(); var hl = document.getElementById('hlm'); if (hl) hl.remove(); } catch (e) {}
    try { document.body.style.overflow = 'hidden'; document.title = 'Something went wrong · Halal Living'; } catch (e) {}
    try { document.getElementById('he-reload').focus(); } catch (e) {}
  }
  window.__hlShowError = show;
  document.addEventListener('click', function (e) {
    var id = e.target && e.target.id;
    if (id === 'he-reload') location.reload();
    if (id === 'he-home') { location.assign('/'); }
  });
  // A component crashed: the runtime marks its host with .sc-has-error.
  var poll = setInterval(function () { if (document.querySelector('#dc-root .sc-has-error')) { clearInterval(poll); show('render'); } }, 1200);
  // The app never rendered (script failed, blocked, or crashed during boot).
  setTimeout(function () { var r = document.getElementById('dc-root'); if (!r || (r.textContent || '').replace(/\s+/g, '').length < 40) show('boot'); }, 9000);
  // Connection status.
  var hideT;
  function net(online) {
    var el = document.getElementById('hl-net'); if (!el) return;
    el.querySelector('span').textContent = online ? 'Back online' : 'You’re offline. Listings still work; maps, the store and sharing need a connection.';
    el.classList.toggle('ok', online); el.classList.add('on');
    clearTimeout(hideT); if (online) hideT = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }
  window.addEventListener('offline', function () { net(false); });
  window.addEventListener('online', function () { net(true); });
  document.addEventListener('DOMContentLoaded', function () { if (navigator.onLine === false) net(false); });
  // Broken images: hide the broken icon and leave a soft tile behind.
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG' || t.__hlf) return;
    if ((t.getAttribute('src') || '').indexOf('{{') >= 0) return;
    t.__hlf = 1; t.style.visibility = 'hidden';
    var p = t.parentNode; if (p && p.style && !p.style.background) p.style.background = '#EFEDE9';
  }, true);
})();
}

export function switchIndicator() {
(function(){
function place(sw){
  var items=sw.querySelectorAll('.hl-switch__item'),act=null;
  for(var i=0;i<items.length;i++){var b=items[i].style.backgroundColor;if(b&&b!=='transparent'&&b!=='rgba(0, 0, 0, 0)'){act=items[i];break;}}
  var ind=sw.querySelector('.hl-switch__ind');
  if(!act){if(ind)ind.style.opacity='0';return;}
  if(!ind){ind=document.createElement('span');ind.className='hl-switch__ind';sw.insertBefore(ind,sw.firstChild);}
  var w=act.offsetWidth,x=act.offsetLeft;
  if(!w){return;}
  ind.style.opacity='1';ind.style.width=w+'px';ind.style.transform='translateX('+x+'px)';
  if(!ind.hasAttribute('data-anim'))requestAnimationFrame(function(){requestAnimationFrame(function(){ind.setAttribute('data-anim','1');});});
}
function slide(sw){
  var items=sw.querySelectorAll('[data-slide-i]'),act=null;
  for(var i=0;i<items.length;i++){var b=items[i].style.backgroundColor;if(b&&b!=='transparent'&&b!=='rgba(0, 0, 0, 0)'){act=items[i];break;}}
  var ind=sw.querySelector('.hl-slide-ind');
  if(!act){if(ind)ind.style.opacity='0';return;}
  if(!ind){ind=document.createElement('span');ind.className='hl-slide-ind';sw.insertBefore(ind,sw.firstChild);}
  var w=act.offsetWidth;if(!w)return;
  ind.style.opacity='1';ind.style.width=w+'px';ind.style.height=act.offsetHeight+'px';ind.style.borderRadius=getComputedStyle(act).borderRadius;
  ind.style.backgroundColor=act.style.backgroundColor;ind.style.transform='translate('+act.offsetLeft+'px,'+act.offsetTop+'px)';
  if(!ind.hasAttribute('data-anim'))requestAnimationFrame(function(){requestAnimationFrame(function(){ind.setAttribute('data-anim','1');});});
}
function bn(){
  var nav=document.querySelector('nav[aria-label="Main"]');if(!nav)return;
  var act=nav.querySelector('.bn-it[aria-current="page"]'),g=nav.querySelector('.hl-bn-ind');
  if(!act){if(g)g.style.opacity='0';return;}
  if(!g){g=document.createElement('span');g.className='hl-bn-ind';nav.appendChild(g);}
  var u=act.querySelector('[data-bn-u]');if(u)g.style.background=u.style.background;
  g.style.opacity='1';g.style.transform='translateX('+(act.offsetLeft+act.offsetWidth/2-8)+'px)';
  if(!g.hasAttribute('data-anim'))requestAnimationFrame(function(){requestAnimationFrame(function(){g.setAttribute('data-anim','1');});});
}
function run(){bn();var a=document.querySelectorAll('.hl-switch');for(var i=0;i<a.length;i++)place(a[i]);var b=document.querySelectorAll('[data-slide]');for(var j=0;j<b.length;j++)slide(b[j]);}
document.addEventListener('click',function(e){
  var it=e.target.closest&&e.target.closest('.hl-switch__item[data-defer]');
  if(!it||it.__go)return;
  var sw=it.parentElement,ind=sw.querySelector('.hl-switch__ind');
  if(!ind||ind.style.opacity==='0'||it.style.backgroundColor)return;
  e.stopPropagation();e.preventDefault();
  var cur=sw.querySelector('.hl-switch__item[data-defer][style*="background"]');
  ind.style.width=it.offsetWidth+'px';ind.style.transform='translateX('+it.offsetLeft+'px)';
  if(cur){var c=cur.style.color;cur.style.color='#fff';cur.style.backgroundColor='';it.style.color=c;it.style.backgroundColor='#fff';}
  setTimeout(function(){it.__go=true;it.click();},340);
},true);
setInterval(run,120);window.addEventListener('resize',run);document.addEventListener('click',function(){setTimeout(run,0);setTimeout(run,60);},true);
})();
}

export function stickyHeaders() {
// sticky headers: transparent at the top, coloured and blurred once their page has started to scroll
(function () {
  var q = 0;
  function scroller(el) { for (var p = el.parentElement; p; p = p.parentElement) { var o = getComputedStyle(p).overflowY; if (o === 'auto' || o === 'scroll') return p; } return null; }
  function upd() {
    q = 0;
    var hs = document.querySelectorAll('[data-dhead],[data-mhead],[data-shead]');
    for (var i = 0; i < hs.length; i++) { var h = hs[i], sc = scroller(h), y = sc ? sc.scrollTop : (window.pageYOffset || document.documentElement.scrollTop || 0); if (y > 8) { if (!h.hasAttribute('data-sc')) h.setAttribute('data-sc', ''); } else if (h.hasAttribute('data-sc')) h.removeAttribute('data-sc'); }
  }
  function sched() { if (!q) q = requestAnimationFrame(upd); }
  document.addEventListener('scroll', sched, { capture: true, passive: true });
  new MutationObserver(sched).observe(document.documentElement, { childList: true, subtree: true });
  sched();
})();
}

export function halalNote() {
// close the halal note when tapping elsewhere or pressing Escape
document.addEventListener('click', function (e) { document.querySelectorAll('details.hl-halal[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); }); });
document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; document.querySelectorAll('details.hl-halal[open]').forEach(function (d) { d.removeAttribute('open'); var s = d.querySelector('summary'); if (s) s.focus(); }); });
}

export function installSheet() {
(function () {
  var ICON = window.__HL_APPICON, BTN = '#B94421';
  try { if ('serviceWorker' in navigator && window.isSecureContext && window.top === window) navigator.serviceWorker.register('/sw.js').catch(function () {}); } catch (e) {}
  var deferred = null, KEY = 'hl-pwa-later';
  var ua = navigator.userAgent || '', iOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function standalone() { try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } }
  function later(v) { try { if (v === undefined) return +localStorage.getItem(KEY) || 0; localStorage.setItem(KEY, String(v)); } catch (e) { return 0; } }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', function () { deferred = null; close(); try { localStorage.setItem('hl-installed', '1'); } catch (e) {} window.dispatchEvent(new Event('hl:installed')); toast('Halal Living is on your home screen'); });
  var st = document.createElement('style');
  st.textContent = [
    '#hl-pwa-scrim{position:fixed;inset:0;z-index:400;background:rgba(24,10,4,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .35s;font-family:Figtree,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}',
    '#hl-pwa-scrim.on{opacity:1}',
    '#hl-pwa-sheet{position:absolute;left:0;right:0;bottom:0;margin:0 auto;max-width:440px;box-sizing:border-box;background:#FFFCFA;color:#1C1C1C;border-radius:28px 28px 0 0;overflow:hidden;transform:translateY(105%);transition:transform .5s cubic-bezier(.2,.9,.25,1);box-shadow:0 -16px 48px rgba(0,0,0,.25);touch-action:none}',
    '#hl-pwa-scrim.on #hl-pwa-sheet{transform:translateY(var(--dy,0px))}#hl-pwa-sheet.drag{transition:none}',
    '@media (min-width:700px){#hl-pwa-sheet{bottom:24px;border-radius:28px}}',
    '.hlp-band{position:relative;height:118px;background:radial-gradient(120% 140% at 85% -20%,rgba(255,255,255,.22),transparent 55%),var(--b);overflow:hidden}',
    '.hlp-band::before{content:"";position:absolute;inset:0;opacity:.14;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Cpath d=%27M20 4 C24 14 26 16 36 20 C26 24 24 26 20 36 C16 26 14 24 4 20 C14 16 16 14 20 4z%27 fill=%27%23fff%27/%3E%3C/svg%3E")}',
    '.hlp-grab{position:absolute;top:10px;left:50%;width:42px;height:5px;margin-left:-21px;border-radius:9px;background:rgba(255,255,255,.55)}',
    '.hlp-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:999px;border:0;outline:none!important;box-shadow:none;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,.2);color:#fff;font:700 18px/1 system-ui;cursor:pointer;display:flex;align-items:center;justify-content:center}',
    '.hlp-phone{position:absolute;left:50%;bottom:-40px;width:184px;margin-left:-92px;height:124px;border-radius:24px 24px 0 0;background:rgba(255,255,255,.16);border:1.5px solid rgba(255,255,255,.35);border-bottom:0;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:16px 18px;box-sizing:border-box}',
    '.hlp-phone i{display:block;aspect-ratio:1;border-radius:9px;background:rgba(255,255,255,.22)}',
    '.hlp-phone img{width:100%;aspect-ratio:1;border-radius:9px;display:block;box-shadow:0 6px 14px rgba(0,0,0,.3);animation:hlpPop .7s cubic-bezier(.34,1.56,.64,1) .35s both}',
    '@keyframes hlpPop{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}',
    '.hlp-body{padding:22px max(22px,env(safe-area-inset-right,0px)) calc(18px + env(safe-area-inset-bottom,0px)) max(22px,env(safe-area-inset-left,0px))}',
    '.hlp-h{font:900 24px/1.15 Figtree,system-ui,sans-serif;letter-spacing:-.025em;margin:0;text-align:center;text-wrap:balance}',
    '.hlp-s{font:500 14.5px/1.45 Figtree,system-ui,sans-serif;color:#61665F;margin:6px 0 0;text-align:center}',
    '.hlp-perks{display:grid;gap:10px;margin:18px 0 0;padding:0;list-style:none}',
    '.hlp-perks li{display:flex;align-items:center;gap:12px;font:700 14.5px Figtree,system-ui,sans-serif;color:#2B2F2C}',
    '.hlp-perks span{flex:none;width:36px;height:36px;border-radius:12px;background:var(--t);color:var(--b);display:flex;align-items:center;justify-content:center}',
    '.hlp-steps{display:grid;gap:8px;margin:18px 0 0;padding:0;list-style:none;counter-reset:s}',
    '.hlp-steps li{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:#fff;border:1px solid #EFE8E4;font:600 14.5px/1.35 Figtree,system-ui,sans-serif;color:#2B2F2C;counter-increment:s}',
    '.hlp-steps li::before{content:counter(s);flex:none;width:24px;height:24px;border-radius:999px;background:var(--b);color:#fff;font:800 12px/24px Figtree,system-ui,sans-serif;text-align:center}',
    '.hlp-steps b{font-weight:800}.hlp-steps em{font-style:normal;margin-left:auto;flex:none;width:32px;height:32px;border-radius:10px;background:var(--t);color:var(--b);display:flex;align-items:center;justify-content:center}',
    '.hlp-go{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:56px;margin-top:20px;border-radius:999px;border:0;background:var(--b);color:#fff;font:800 17px Figtree,system-ui,sans-serif;cursor:pointer;box-shadow:0 12px 26px var(--s),0 3px 8px rgba(0,0,0,.15);transition:transform .2s}',
    '.hlp-go:active{transform:scale(.96)}',
    '.hlp-no{display:block;width:100%;height:44px;margin-top:6px;border:0;background:transparent;color:#6A6F6B;font:700 14.5px Figtree,system-ui,sans-serif;cursor:pointer}',
    '#hl-pwa-sheet .hlp-x:focus-visible{outline:2px solid #fff!important;box-shadow:none!important}#hl-pwa-sheet:focus{outline:none!important;box-shadow:0 -16px 48px rgba(0,0,0,.25)!important}.hlp-go:focus:not(:focus-visible),.hlp-no:focus:not(:focus-visible),.hlp-x:focus:not(:focus-visible){outline:none}',
    '.hlp-note{margin:10px 0 0;text-align:center;font:600 12.5px Figtree,system-ui,sans-serif;color:#8A8F8B}',
    '#hl-pwa-toast{position:fixed;left:50%;bottom:calc(110px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:410;background:#1C1C1C;color:#fff;font:700 14px Figtree,system-ui,sans-serif;padding:12px 18px;border-radius:999px;box-shadow:0 10px 24px rgba(0,0,0,.25);white-space:nowrap}',
    '@media (prefers-reduced-motion:reduce){#hl-pwa-sheet,.hlp-phone img{transition:none;animation:none}}'
  ].join('');
  document.head.appendChild(st);
  var el = null;
  function close() { if (!el) return; var x = el; el = null; x.classList.remove('on'); setTimeout(function () { x.remove(); }, 450); }
  function toast(t) { var d = document.createElement('div'); d.id = 'hl-pwa-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600); }
  var I = {
    bolt: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 5 14h6l-1 7 8-11h-6z"/></svg>',
    pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    wifi: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01"/></svg>',
    share: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    plus: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    dots: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    dl: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    ok: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
  };
  function theme() {
    try { var f = document.querySelector('.bn-fab'); var c = f && getComputedStyle(f).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)') return c; } catch (e) {}
    return BTN;
  }
  function steps() {
    if (iOS) return '<ol class="hlp-steps"><li><span>Tap <b>Share</b> in Safari’s toolbar</span><em>' + I.share + '</em></li><li><span>Choose <b>Add to Home Screen</b></span><em>' + I.plus + '</em></li><li><span>Tap <b>Add</b> in the top corner</span><em>' + I.ok + '</em></li></ol>';
    return '<ol class="hlp-steps"><li><span>Open your browser menu</span><em>' + I.dots + '</em></li><li><span>Tap <b>Install app</b> or <b>Add to Home screen</b></span><em>' + I.plus + '</em></li><li><span>Confirm with <b>Install</b></span><em>' + I.ok + '</em></li></ol>';
  }
  function open(showSteps) {
    if (iOS && !showSteps && typeof navigator.install !== 'function') showSteps = true;
    if (el || standalone()) { if (standalone()) toast('You already have the app open'); return; }
    var b = theme();
    el = document.createElement('div'); el.id = 'hl-pwa-scrim';
    el.style.setProperty('--b', b); el.style.setProperty('--t', 'color-mix(in srgb, ' + b + ' 12%, #fff)'); el.style.setProperty('--s', 'color-mix(in srgb, ' + b + ' 45%, transparent)');
    el.innerHTML = '<div id="hl-pwa-sheet" role="dialog" aria-modal="true" aria-labelledby="hlp-h">' +
      '<div class="hlp-band"><div class="hlp-grab"></div><button type="button" class="hlp-x" aria-label="Close">×</button>' +
      '<div class="hlp-phone" aria-hidden="true"><i></i><img alt="" src="' + ICON + '"><i></i><i></i><i></i><i></i></div></div>' +
      '<div class="hlp-body"><p class="hlp-h" id="hlp-h">' + (showSteps ? 'Add Halal Living to your home screen' : 'Get the Halal Living app') + '</p>' +
      '<p class="hlp-s">' + (showSteps ? (iOS ? 'Takes 10 seconds in Safari.' : 'Takes 10 seconds from your browser menu.') : 'Free, tiny, and no app store needed.') + '</p>' +
      (showSteps ? steps() : '<ul class="hlp-perks"><li><span>' + I.bolt + '</span>Opens in one tap, full screen</li><li><span>' + I.pin + '</span>Masjid locator always at hand</li><li><span>' + I.wifi + '</span>Loads fast, even on weak signal</li></ul>') +
      '<button type="button" class="hlp-go">' + (showSteps ? I.ok + 'Got it' : I.dl + 'Install app') + '</button>' +
      (showSteps ? '' : '<button type="button" class="hlp-no">Maybe later</button>') + '</div></div>';
    document.body.appendChild(el);
    var sh = el.querySelector('#hl-pwa-sheet');
    sh.tabIndex = -1; try { sh.style.outline = 'none'; sh.focus({ preventScroll: true }); } catch (e) {}
    requestAnimationFrame(function () { requestAnimationFrame(function () { el && el.classList.add('on'); }); });
    function dismiss() { later(Date.now()); close(); }
    el.addEventListener('click', function (e) { if (e.target === el) dismiss(); });
    el.querySelector('.hlp-x').onclick = dismiss;
    var onEsc = function (e) { if (e.key === 'Escape' && el) { document.removeEventListener('keydown', onEsc); dismiss(); } }; document.addEventListener('keydown', onEsc);
    var no = el.querySelector('.hlp-no'); if (no) no.onclick = dismiss;
    el.querySelector('.hlp-go').onclick = function () { if (showSteps) { close(); return; } install(); };
    // Drag the sheet down to dismiss it.
    var y0 = null, dy = 0, band = el.querySelector('.hlp-band');
    band.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; sh.classList.add('drag'); try { band.setPointerCapture(e.pointerId); } catch (er) {} });
    band.addEventListener('pointermove', function (e) { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); el.style.setProperty('--dy', dy + 'px'); });
    function end() { if (y0 == null) return; y0 = null; sh.classList.remove('drag'); if (dy > 90) { el.style.setProperty('--dy', '0px'); dismiss(); } else el.style.setProperty('--dy', '0px'); }
    band.addEventListener('pointerup', end); band.addEventListener('pointercancel', end);
  }
  // One tap on Install hands straight over to the browser's own install, so the visitor only confirms once.
  function nativePrompt() { var d = deferred; deferred = null; d.prompt(); (d.userChoice || Promise.resolve({})).then(function (c) { if (c && c.outcome === 'accepted') toast('Installing Halal Living…'); else later(Date.now()); }); }
  function install() {
    close();
    try { if (typeof navigator.install === 'function') { navigator.install().then(function () { toast('Installing Halal Living…'); }).catch(function () { fallback(); }); return; } } catch (e) {}
    if (deferred) { nativePrompt(); return; }
    // The browser can be a moment late in saying it is ready; wait briefly before showing manual steps.
    var waited = 0, iv = setInterval(function () { waited += 150; if (deferred) { clearInterval(iv); nativePrompt(); } else if (waited >= 1500) { clearInterval(iv); fallback(); } }, 150);
  }
  function fallback() { setTimeout(function () { open(true); }, 300); }
  try { var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('hla-off', !e.isIntersecting); }); }) : null;
    if (io) { var seen = new WeakSet(); new MutationObserver(function () { document.querySelectorAll('[data-appcard]').forEach(function (c) { if (!seen.has(c)) { seen.add(c); io.observe(c); } }); }).observe(document.body, { childList: true, subtree: true }); } } catch (e) {}
  window.hlInstall = function () { if (standalone()) { toast('You already have the app open'); return; } if (iOS && typeof navigator.install !== 'function') { open(true); return; } install(); };
  // Offer it once on phones, after the visitor has looked around a little; ask again after 14 days if they said not now.
  var t0 = Date.now();
  function maybe() {
    if (standalone() || el) return;
    if (window.innerWidth >= 1100) return;
    if (Date.now() - later() < 14 * 864e5) return;
    if (document.querySelector('[data-view-overlay]') && Date.now() - t0 < 20000) return;
    // Only offer it unprompted where one tap can actually install it (Android/desktop Chrome, Edge, Samsung), or on iPhone where we show the two steps.
    if (!deferred && !iOS) { setTimeout(maybe, 5000); return; }
    open(false);
  }
  setTimeout(maybe, 12000);
})();
}
