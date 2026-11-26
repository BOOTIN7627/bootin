import base64, json, os, shutil
d=lambda f:'data:image/png;base64,'+base64.b64encode(open(f,'rb').read()).decode()
tree=open('tree.json').read(); koyomi=open('koyomi.json').read()
css=open('style.css').read()+open('op.css').read()
js=f"const TREE={tree};\nconst KOYOMI={koyomi};\nconst BOO_F='{d('boo_f.png')}';\nconst OP_BOO='{d('op_boo_f.png')}';\nconst OP_SAD='{d('op_boo_sad.png')}';\nconst OP_EN='{d('op_en_angry.png')}';\nconst OP_TON='{d('op_ton.png')}';\n"+open('core.js').read()+open('views.js').read()+open('meds.js').read()+open('op.js').read()+open('app.js').read()
fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap">'
body=f'<style>{css}</style>\n<div id="app"></div>\n<script>\n{js}\n</script>\n'
# artifact
open('bootin-art.html','w').write('<title>BOOTIN 試作版</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'+fonts+'\n'+body)
# pwa
os.makedirs('pwa',exist_ok=True)
head=f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>BOOTIN</title><meta name="theme-color" content="#F6C915"><link rel="manifest" href="manifest.webmanifest?v=2">
<link rel="icon" href="icon3-192.png"><link rel="apple-touch-icon" href="icon3-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="BOOTIN">
{fonts}<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}[hidden]{{display:none!important}}img{{max-width:100%}}</style></head><body>'''
open('pwa/index.html','w').write(head+body+'</body></html>')
json.dump({"name":"BOOTIN","short_name":"BOOTIN","start_url":"./?app=2","scope":"./","display":"standalone","background_color":"#FBF8EE","theme_color":"#F6C915","lang":"ja",
 "id":"./?app=2","icons":[{"src":"icon3-192.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"icon3-512.png","sizes":"512x512","type":"image/png","purpose":"any"},{"src":"icon3-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]},open('pwa/manifest.webmanifest','w'),ensure_ascii=False)
ver=str(int(os.path.getmtime('app.js')))
open('pwa/sw.js','w').write(f"""const C='bootin-{ver}';
self.addEventListener('install',e=>{{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','manifest.webmanifest','icon3-192.png','icon3-512.png'])));self.skipWaiting();}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim();}});
self.addEventListener('fetch',e=>{{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
e.respondWith(fetch(e.request).then(r=>{{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));}});
""")
for f in ['icon-192.png','icon-512.png']: shutil.copy(f,'pwa/'+f.replace('icon-','icon3-'))
for f in ['icon-192.png','icon-512.png']:
    if os.path.exists('pwa/'+f): os.remove('pwa/'+f)
print(os.path.getsize('bootin-art.html'))
