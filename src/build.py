import base64, json, os, shutil
d=lambda f:'data:image/png;base64,'+base64.b64encode(open(f,'rb').read()).decode()
import glob,re
OP3={os.path.basename(f)[4:-4]:re.sub(r'>\s+<','><',open(f,encoding='utf8').read()).strip() for f in glob.glob('op3/*.svg')}
CH={os.path.basename(f)[:-4]:re.sub(r'>\s+<','><',open(f,encoding='utf8').read()).strip() for f in glob.glob('chara/*.svg')}
tree=open('tree.json').read(); koyomi=open('koyomi.json').read()
css=open('style.css').read()+open('op.css').read()
import time as _t
BUILD=_t.strftime("%m/%d %H:%M",_t.gmtime(_t.time()+9*3600))
js=f"const BUILD='{BUILD}';\nconst TREE={tree};\nconst KOYOMI={koyomi};\nconst BOO_F='{d('boo_f.png')}';\nconst OP_BOO='{d('op_boo_f.png')}';\nconst OP_SAD='{d('op_boo_sad.png')}';\nconst OP_EN='{d('op_en_angry.png')}';\nconst OP_TON='{d('op_ton.png')}';\nconst OP_ERI='{d('op_eri.png')}';\nconst OP_AYA='{d('op_aya.png')}';\n"+'const OP3_SVG='+json.dumps(OP3,ensure_ascii=False)+';\n'+'const KOMA_IMG={'+','.join(f"'{os.path.basename(f)[:-5]}':'data:image/webp;base64,"+base64.b64encode(open(f,'rb').read()).decode()+"'" for f in sorted(glob.glob('koma/*.webp')))+'};\n'+'const CHARA_SVG='+json.dumps(CH,ensure_ascii=False)+';\nconst CHARA_OZ=\''+d('chara/oz_n.png')+'\';\n'+open('core.js').read()+open('views.js').read()+open('meds.js').read()+open('op.js').read()+open('bosai.js').read()+open('guide.js').read()+open('app.js').read()+open('gomi.js').read()+open('profile.js').read()+open('health.js').read()+open('student.js').read()+open('chiiki.js').read()+open('kakei.js').read()+open('kids.js').read()+open('oshi.js').read()+open('trip.js').read()+open('chara.js').read()+open('feedback.js').read()+open('memo2.js').read()+open('top.js').read()+open('boot.js').read()
fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap">'
SPLASH='''<div id="splash" style="position:fixed;inset:0;z-index:200;background:#F6C915 repeating-linear-gradient(135deg,rgba(30,27,20,.09) 0 26px,transparent 26px 52px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;transition:opacity .35s"><img src="icon4-512.png" alt="" style="width:46vw;max-width:220px;border-radius:50%;box-shadow:0 6px 0 #1E1B14,0 0 0 5px #1E1B14"><div style="font:900 italic clamp(3rem,16vw,5rem)/1 system-ui,sans-serif;color:#FFE14D;-webkit-text-stroke:3px #1E1B14;paint-order:stroke fill;text-shadow:4px 4px 0 #E0452B,7px 7px 0 #1E1B14;transform:rotate(-6deg)">BOOTIN</div><div style="background:#fff;border:3px solid #1E1B14;border-radius:999px;padding:4px 16px;font:900 1rem system-ui,sans-serif;color:#1E1B14">ライフサポート万能アプリ</div></div>'''
body=f'<style>{css}</style>\n<div id="app"></div>\n<script>\n{js}\n</script>\n'
# artifact
open('bootin-art.html','w').write('<title>BOOTIN 試作版</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'+fonts+'\n'+body)
# pwa
os.makedirs('pwa',exist_ok=True)
head=f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>BOOTIN</title><meta name="theme-color" content="#F6C915"><link rel="manifest" href="manifest.webmanifest?v=3">
<link rel="icon" href="icon4-192.png"><link rel="apple-touch-icon" href="icon4-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="BOOTIN">
{fonts}<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}[hidden]{{display:none!important}}img{{max-width:100%}}</style></head><body>'''
open('pwa/index.html','w').write(head+body.replace('<div id="app"></div>','<div id="app"></div>'+SPLASH,1)+'</body></html>')
json.dump({"name":"BOOTIN","short_name":"BOOTIN","start_url":"./?app=2","scope":"./","display":"standalone","background_color":"#F6C915","theme_color":"#F6C915","lang":"ja",
 "id":"./?app=2","icons":[{"src":"icon4-192.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"icon4-512.png","sizes":"512x512","type":"image/png","purpose":"any"},{"src":"icon4-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]},open('pwa/manifest.webmanifest','w'),ensure_ascii=False)
import time
ver=str(int(time.time()))
open('pwa/sw.js','w').write(f"""const C='bootin-{ver}';
self.addEventListener('install',e=>{{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','manifest.webmanifest','icon4-192.png','icon4-512.png'])));self.skipWaiting();}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim();}});
self.addEventListener('fetch',e=>{{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
const nav=e.request.mode==='navigate';
e.respondWith(fetch(nav?u.pathname+'?v='+Date.now():e.request.url,{{cache:nav?'no-store':'no-cache',credentials:'same-origin'}}).then(r=>{{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));}});
""")
for f in ['icon-192.png','icon-512.png']: shutil.copy(f,'pwa/'+f.replace('icon-','icon4-'))
for f in ['icon-192.png','icon-512.png']:
    if os.path.exists('pwa/'+f): os.remove('pwa/'+f)
print(os.path.getsize('bootin-art.html'))
