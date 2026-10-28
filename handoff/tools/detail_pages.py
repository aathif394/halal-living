"""Unpack / repack the restaurant and masjid detail pages that live inside index.html.

They are stored as base64 HTML in window.__resources:
  "./Restaurant%20Detail.dc.html" and "./Masjid%20Detail.dc.html"

  python3 tools/detail_pages.py unpack   # writes detail/Restaurant.dc.html, detail/Masjid.dc.html
  python3 tools/detail_pages.py pack     # writes them back into index.html (keeps a .bak copy)
"""
import base64, re, sys, shutil, os
SRC = os.environ.get('HL_FILE', 'index.html')
KEYS = {'Restaurant': './Restaurant%20Detail.dc.html', 'Masjid': './Masjid%20Detail.dc.html'}
def rx(key): return re.compile(r'("' + re.escape(key) + r'": "data:text/html;base64,)([^"]+)"')
def unpack():
    s = open(SRC, encoding='utf-8').read(); os.makedirs('detail', exist_ok=True)
    for n, k in KEYS.items():
        m = rx(k).search(s); open(f'detail/{n}.dc.html', 'w', encoding='utf-8').write(base64.b64decode(m.group(2)).decode('utf-8'))
        print('wrote detail/%s.dc.html' % n)
def pack():
    s = open(SRC, encoding='utf-8').read(); shutil.copy(SRC, SRC + '.bak')
    for n, k in KEYS.items():
        d = open(f'detail/{n}.dc.html', encoding='utf-8').read()
        enc = base64.b64encode(d.encode('utf-8')).decode()
        s, c = rx(k).subn(lambda m: m.group(1) + enc + '"', s); assert c == 1, n
    open(SRC, 'w', encoding='utf-8').write(s); print('packed into', SRC)
{'unpack': unpack, 'pack': pack}[sys.argv[1]]()
