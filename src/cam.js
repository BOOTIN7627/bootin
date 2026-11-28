
/* ===== カメラ：撮る → 色を変える・切り取る・回す・日付を入れる → メモに保存／スマホに保存 =====
   写真はいじっている間だけ持っておく（保存するまでは記録しない） */
const CAM_FX=[
  ['none','元の色'],['sepia','セピア'],['mono','白黒'],['kohaku','琥珀'],
  ['midori','緑'],['ao','碧'],['showa','昭和の写真'],['yuyake','夕焼け'],
  ['kukkiri','くっきり'],['yoru','夜の青'],['sakura','桜色'],['retro','古い映画']
];
const CAM_CROP=[['','自由な形'],['1','正方形'],['4:3','横長'],['3:4','縦長'],['16:9','ワイド']];
const CAM_FRAME=[['','なし'],['white','白ふち'],['date','日付入り'],['both','白ふち＋日付']];
UI.cam=UI.cam||null;
function camStart(file){
  const fr=new FileReader();
  fr.onerror=()=>toast('写真を読み込めませんでした');
  fr.onload=()=>{ const img=new Image(); img.onerror=()=>toast('写真を読み込めませんでした');
    img.onload=()=>{ UI.cam={img,fx:'none',light:0,crop:'',box:null,rot:0,frame:'',out:''}; UI.camCut=false; UI.camThumbs=null; if(cur()==='cam') render(); else go('cam'); };
    img.src=fr.result; };
  fr.readAsDataURL(file);
}
document.addEventListener('change',ev=>{
  const el=ev.target; if(!el.classList||!el.classList.contains('cam-in')) return;
  const f=el.files&&el.files[0]; el.value=''; if(f) camStart(f);
});
/* 1つの点の色を変える */
function camPix(fx,r,g,b){
  const y=.299*r+.587*g+.114*b;
  switch(fx){
    case 'sepia': return [y*1.07+28, y*.93+12, y*.72-6];
    case 'mono': return [y,y,y];
    case 'kohaku': return [r*1.08+22, g*.98+8, b*.66];
    case 'midori': return [r*.82+y*.08, g*1.06+16, b*.80+y*.06];
    case 'ao': return [r*.70+y*.1, g*.96+10, b*1.12+26];
    case 'showa': { const sr=y*1.02+30, sg=y*.92+20, sb=y*.74+10; return [sr*.62+r*.25+30, sg*.62+g*.25+26, sb*.62+b*.25+22]; }
    case 'yuyake': return [r*1.12+26, g*.94+4, b*.70-4];
    case 'kukkiri': { const k=1.45; return [y+(r-y)*k, y+(g-y)*k, y+(b-y)*k]; }
    case 'yoru': return [r*.72, g*.86+4, b*1.1+30];
    case 'sakura': return [r*1.04+26, g*.92+10, b*.98+20];
    case 'retro': { const k=.55; return [(y+(r-y)*k)*.9+28, (y+(g-y)*k)*.88+24, (y+(b-y)*k)*.78+18]; }
  }
  return [r,g,b];
}
function camContrast(fx){ return {kukkiri:1.12,yuyake:1.08,showa:.84,retro:.82,mono:1.05}[fx]||1; }
/* 切り取る枠（回したあとの写真に対する割合 0〜1）。形だけ決めたときは真ん中に最大で */
function camAspect(crop){ if(!crop) return 0; const [a,b]=crop==='1'?[1,1]:crop.split(':').map(Number); return a/b; }
function camDims(o){ const rot=((o.rot%360)+360)%360; return rot%180?[o.img.height,o.img.width,rot]:[o.img.width,o.img.height,rot]; }
function camCenterBox(o){ const [sw,sh]=camDims(o); const a=camAspect(o.crop); if(!a){ o.box=null; return; }
  let w=1,hh=1; if(sw/sh>a) w=sh*a/sw; else hh=sw/a/sh; o.box={x:(1-w)/2,y:(1-hh)/2,w,h:hh}; }
/* 写真を描く（max＝長い辺の大きさ）。full＝切り取り前の全体（枠を動かす画面用） */
function camDraw(c,o,max,full){
  const img=o.img; const [sw,sh,rot]=camDims(o);
  const b=(!full&&o.box)||{x:0,y:0,w:1,h:1};
  const bx=b.x*sw, by=b.y*sh, cw=b.w*sw, ch=b.h*sh;
  const fr=full?'':o.frame; const pad=(fr==='white'||fr==='both')?.045:0;
  const r=Math.min(1,max/Math.max(cw,ch)); const W=Math.round(cw*r), H=Math.round(ch*r);
  const P=Math.round(Math.max(W,H)*pad);
  c.width=W+P*2; c.height=H+P*2+(P?Math.round(P*1.6):0);
  const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
  x.save(); x.beginPath(); x.rect(P,P,W,H); x.clip();
  x.translate(P+W/2+(sw/2-(bx+cw/2))*r,P+H/2+(sh/2-(by+ch/2))*r); x.rotate(rot*Math.PI/180);
  const s=r; const dw=img.width*s, dh=img.height*s; x.drawImage(img,-dw/2,-dh/2,dw,dh); x.restore();
  /* 色 */
  if(o.fx!=='none'||o.light){
    const d=x.getImageData(P,P,W,H); const p=d.data; const L=o.light*1.6; const k=camContrast(o.fx);
    const vig=o.fx==='showa'||o.fx==='retro'; const cx=W/2, cy=H/2, rr=Math.hypot(cx,cy);
    for(let i=0,n=0;i<p.length;i+=4,n++){
      let [R,G,B]=camPix(o.fx,p[i],p[i+1],p[i+2]);
      if(k!==1){ R=(R-128)*k+128; G=(G-128)*k+128; B=(B-128)*k+128; }
      if(L){ R+=L; G+=L; B+=L; }
      if(vig){ const px=n%W, py=(n/W)|0; const f=1-.45*Math.pow(Math.hypot(px-cx,py-cy)/rr,2.2); R*=f; G*=f; B*=f; }
      p[i]=R; p[i+1]=G; p[i+2]=B;
    }
    x.putImageData(d,P,P);
  }
  /* 日付（昔のカメラのようなオレンジの字） */
  if(fr==='date'||fr==='both'){
    const n=new Date(); const t=`'${String(n.getFullYear()).slice(2)} ${n.getMonth()+1} ${n.getDate()}`;
    const fs=Math.max(14,Math.round(Math.min(W,H)*.055));
    x.font=`700 ${fs}px "Courier New",monospace`; x.textAlign='right'; x.textBaseline='bottom';
    x.shadowColor='rgba(255,90,0,.9)'; x.shadowBlur=fs*.35; x.fillStyle='#FFB23F';
    x.fillText(t,P+W-fs*.6,P+H-fs*.5); x.shadowBlur=0;
  }
  return c;
}
/* 色の見本（小さい写真） */
function camThumbs(){
  if(UI.camThumbs) return UI.camThumbs;
  const o=UI.cam; const T={}; const c=document.createElement('canvas');
  for(const [k] of CAM_FX){ camDraw(c,{img:o.img,fx:k,light:0,crop:'4:3',rot:o.rot,frame:''},110); T[k]=c.toDataURL('image/jpeg',.7); }
  return UI.camThumbs=T;
}

/* ===== 写真の保存の窓口 =====
   商品化（スマホのアプリ）にするときは、この PhotoIO の中身だけを差し替える：
   toPhone → 端末の「写真（フォト）」へ元の大きさのまま直接保存（iPhoneは写真ライブラリ、Androidはギャラリー）
   toApp   → アプリの中の保存場所へ（今は小さく縮めてブラウザに保存。商品では端末のファイルに元の大きさで）
   今の試作版（Claudeの中のページ）では、ボタン1つでフォトに入れることができないため、
   「送る・共有」→「画像を保存」か、写真の長押し→「写真に保存」で入れてもらう。 */
const PhotoIO={
  canDirect:false,                      /* 商品化したら true（フォトに直接入れられる） */
  async toPhone(dataUrl,name){          /* 戻り値：'saved'＝保存した／'share'＝共有の画面を出した／'manual'＝長押しで */
    try{ const b=await (await fetch(dataUrl)).blob(); const f=new File([b],name||'bootin.jpg',{type:'image/jpeg'});
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[f]}))){ await navigator.share({files:[f]}); return 'share'; } }catch(e){ if(e&&e.name==='AbortError') return 'share'; }
    return 'manual';
  },
  toApp(dataUrl){ return dataUrl; }      /* 今は縮めた写真をそのまま記録 */
};
const CAM_APP_MAX=900, CAM_PHONE_MAX=2400;

function vCam(){
  const o=UI.cam;
  if(!o) return sub('カメラ',`<div class="sec" style="text-align:center"><p>写真を撮るか、スマホの中の写真を選んでください。</p>
    <div class="btns"><label class="btn"><input type="file" accept="image/*" capture="environment" class="cam-in" hidden>📷 撮る</label><label class="btn plain"><input type="file" accept="image/*" class="cam-in" hidden>🖼️ 写真を選ぶ</label></div></div>
    <button class="row" data-go="photos"><span class="em">🗂️</span><span class="grow"><b>写真帳を見る</b><br><span class="small muted">残した写真を「家族」「レシート」などに分けて見られます</span></span></button>`);
  const seg=(list,val,act)=>`<div class="chips cwrap" style="padding:2px 0">${list.map(([k,n])=>`<button class="chip" aria-pressed="${val===k}" data-act="${act}" data-c="${k}">${n}</button>`).join('')}</div>`;
  if(UI.camCut) return sub('写真を切り取る',`
  <p class="small" style="margin:0 0 6px"><b>枠の中を指で動かすと場所が、四すみの○を動かすと大きさが変わります。</b></p>
  <div class="camwrap"><div class="cropwrap" id="crop-w"><canvas id="cam-cv"></canvas>
    <div class="cropbox" id="crop-b"><i class="g1"></i><i class="g2"></i><i class="g3"></i><i class="g4"></i>
    <span class="hd" data-h="nw"></span><span class="hd" data-h="ne"></span><span class="hd" data-h="sw"></span><span class="hd" data-h="se"></span></div></div></div>
  <div class="sec"><h3>形</h3>${seg(CAM_CROP,o.crop,'camcrop')}
    <div class="btns"><button class="btn plain" data-act="camrot" data-c="-90">↺ 左に回す</button><button class="btn plain" data-act="camrot" data-c="90">↻ 右に回す</button></div></div>
  <div class="btns"><button class="btn" data-act="camcutok">✓ これで切る</button><button class="btn plain" data-act="camcutno">切り取りをやめる</button></div>`);
  const T=camThumbs();
  return sub('カメラ',`
  <div class="camwrap"><canvas id="cam-cv" aria-label="いじっている写真"></canvas></div>
  <div class="sec"><h3>✂️ 切り取る・回す</h3>
    <button class="btn w" data-act="camcut">✂️ 指で範囲を決めて切り取る${o.box?'（切り取り中）':''}</button>
    <div class="btns"><button class="btn plain" data-act="camrot" data-c="-90">↺ 左に回す</button><button class="btn plain" data-act="camrot" data-c="90">↻ 右に回す</button></div></div>
  <div class="sec"><h3>🎨 色を変える</h3>
    <div class="camf">${CAM_FX.map(([k,n])=>`<button aria-pressed="${o.fx===k}" data-act="camfx" data-c="${k}"><i style="background-image:url(${T[k]})"></i>${n}</button>`).join('')}</div>
    <div class="camrow" style="margin-top:10px"><span class="lb">☀️ 明るさ</span><input type="range" id="cam-light" min="-40" max="40" step="2" value="${o.light}" aria-label="明るさ"><button class="mini" data-act="camlight0">もとに</button></div></div>
  <div class="sec"><h3>🖼️ ふち・日付</h3>${seg(CAM_FRAME,o.frame,'camframe')}</div>
  <div class="sec"><h3>💾 できあがり</h3>
    <div class="btns"><button class="btn" data-act="camphone">📱 スマホの写真（フォト）に保存</button></div>
    <div class="btns"><button class="btn plain" data-act="camalbum">🗂️ 写真帳に入れる（家族・レシートなどに分けて）</button></div>
    <div class="btns"><button class="btn plain" data-act="camapp">📝 アプリの中（メモ）に保存</button></div>
    <div class="btns"><label class="btn plain"><input type="file" accept="image/*" capture="environment" class="cam-in" hidden>📷 撮りなおす</label><label class="btn plain"><input type="file" accept="image/*" class="cam-in" hidden>🖼️ ほかの写真</label></div>
    <div id="cam-out" class="camout">${o.out?camOutHtml(o.out):''}</div></div>`);
}
function camOutHtml(u){ return `<div class="camnote"><b>📱 スマホの写真に入れるには</b><br>下の写真を<b>指で長押し</b>して「<b>"写真"に保存</b>」（Androidは「画像をダウンロード」）を選んでください。パソコンは右クリックで保存。</div><img src="${u}" alt="できあがった写真">`; }
function camPaint(){ const c=$('#cam-cv'); if(c&&UI.cam) camDraw(c,UI.cam,900,UI.camCut); }
/* 切り取り枠を指で動かす */
function cropAfter(){
  const w=$('#crop-w'), bx=$('#crop-b'), c=$('#cam-cv'); if(!w||!bx||!c) return; const o=UI.cam;
  if(!o.box) o.box={x:.1,y:.1,w:.8,h:.8};
  const [sw,sh]=camDims(o); const a=camAspect(o.crop); const ar=a?a*sh/sw:0; /* 割合での縦横比（w/h） */
  const place=()=>{ const b=o.box; Object.assign(bx.style,{left:b.x*100+'%',top:b.y*100+'%',width:b.w*100+'%',height:b.h*100+'%'}); };
  place(); let st=null; const MIN=.08;
  w.addEventListener('pointerdown',e=>{ const hd=e.target.dataset&&e.target.dataset.h; if(!hd&&!bx.contains(e.target)) return;
    e.preventDefault(); st={hd:hd||'move',x:e.clientX,y:e.clientY,b:{...o.box},W:c.clientWidth,H:c.clientHeight}; try{w.setPointerCapture(e.pointerId);}catch(_){} });
  w.addEventListener('pointermove',e=>{ if(!st) return; e.preventDefault();
    const dx=(e.clientX-st.x)/st.W, dy=(e.clientY-st.y)/st.H; const b0=st.b; let b={...b0};
    if(st.hd==='move'){ b.x=Math.min(1-b.w,Math.max(0,b0.x+dx)); b.y=Math.min(1-b.h,Math.max(0,b0.y+dy)); }
    else{ const L=st.hd.includes('w'), T=st.hd.includes('n');
      const ax=L?b0.x+b0.w:b0.x, ay=T?b0.y+b0.h:b0.y;           /* 動かさない角 */
      let nw=Math.max(MIN,b0.w+(L?-dx:dx)), nh=Math.max(MIN,b0.h+(T?-dy:dy));
      nw=Math.min(nw,L?ax:1-ax); nh=Math.min(nh,T?ay:1-ay);
      if(ar){ if(nw/nh>ar) nw=nh*ar; else nh=nw/ar; }
      b={x:L?ax-nw:ax,y:T?ay-nh:ay,w:nw,h:nh}; }
    o.box=b; place(); });
  const end=()=>{ st=null; }; w.addEventListener('pointerup',end); w.addEventListener('pointercancel',end);
}
function camAfter(){
  if(cur()!=='cam'||!UI.cam) return; camPaint(); if(UI.camCut) cropAfter();
  const r=$('#cam-light'); if(r){ r.addEventListener('input',()=>{ UI.cam.light=+r.value; UI.cam.out=''; const o=$('#cam-out'); if(o) o.innerHTML=''; camPaint(); }); }
}
const _camRender=render; render=function(){ _camRender.apply(this,arguments); try{ camAfter(); }catch(e){} };
function camRe(){ UI.cam.out=''; render(); }
function camMake(max){ const c=document.createElement('canvas'); camDraw(c,UI.cam,max); return c.toDataURL('image/jpeg',max>1000?.92:.8); }
function camToMemo(){
  const ph=PhotoIO.toApp(camMake(CAM_APP_MAX)); const now=new Date(); const fxn=(CAM_FX.find(x=>x[0]===UI.cam.fx)||['',''])[1];
  S.memos.push({id:uid(),t:ymd(now)+'T'+pad(now.getHours())+':'+pad(now.getMinutes()),text:'カメラで撮った写真'+(UI.cam.fx!=='none'?'（'+fxn+'）':''),photo:ph,from:'カメラ',title:'',cat:''});
  save(); $('.sheet-bg')?.remove(); toast('アプリの中（メモ）に保存しました');
}
async function camPhone(){
  $('.sheet-bg')?.remove();
  const u=camMake(CAM_PHONE_MAX); UI.cam.out=u;
  const r=await PhotoIO.toPhone(u,'bootin_'+today().replace(/-/g,'')+'.jpg');
  if(r==='saved'){ toast('スマホの写真に保存しました'); return; }
  const o=$('#cam-out'); if(o){ o.innerHTML=camOutHtml(u); o.scrollIntoView({behavior:'smooth',block:'center'}); }
  if(r==='share') toast('出てきた画面で「画像を保存」を選ぶと写真に入ります');
}
Object.assign(ACTS,{
  camfx:(el,d)=>{ UI.cam.fx=d.c; camRe(); },
  camlight0:()=>{ UI.cam.light=0; camRe(); },
  camcut:()=>{ UI.camBox0=UI.cam.box?{...UI.cam.box}:null; UI.camCut=true; render(); window.scrollTo(0,0); },
  camcrop:(el,d)=>{ UI.cam.crop=d.c; if(d.c) camCenterBox(UI.cam); else if(!UI.cam.box) UI.cam.box={x:.1,y:.1,w:.8,h:.8}; camRe(); },
  camcutok:()=>{ const b=UI.cam.box; if(b&&b.w>.985&&b.h>.985) UI.cam.box=null; UI.camCut=false; UI.camThumbs=null; camRe(); window.scrollTo(0,0); },
  camcutno:()=>{ UI.cam.box=null; UI.cam.crop=''; UI.camCut=false; camRe(); },
  camrot:(el,d)=>{ UI.cam.rot+= +d.c; UI.camThumbs=null; if(UI.cam.crop) camCenterBox(UI.cam); else UI.cam.box=UI.camCut?{x:.1,y:.1,w:.8,h:.8}:null; camRe(); },
  camframe:(el,d)=>{ UI.cam.frame=d.c; camRe(); },
  camphone:()=>{ camPhone(); },
  /* アプリの中に入れるときは、小さくなることを先に知らせる */
  camapp:()=>{ $('.sheet-bg')?.remove(); const bg=document.createElement('div'); bg.className='sheet-bg';
    bg.innerHTML=`<div class="sheet" role="dialog" aria-label="アプリの中に保存"><h2>📝 アプリの中に保存<button class="ib ghost x" data-act="closesheet" aria-label="閉じる">✕</button></h2>
    <div class="camnote warn"><b>⚠️ アプリの中に入れる写真は小さくなります</b><br>アプリの中に入れると、写真は小さく縮めて保存します（長い辺が${CAM_APP_MAX}ドット）。メモで見るには十分ですが、<b>印刷したり大きく伸ばしたりすると粗く</b>なります。<br>きれいなまま残したいときは、<b>先にスマホの写真（フォト）にも保存</b>しておいてください。</div>
    <div class="btns" style="flex-direction:column"><button class="btn" data-act="camboth">📱＋📝 スマホにも保存してから、アプリに入れる</button><button class="btn plain" data-act="camapp2">📝 小さくてよいので、アプリにだけ入れる</button><button class="btn plain" data-act="closesheet">やめる</button></div></div>`;
    bg.addEventListener('click',e=>{ if(e.target===bg) bg.remove(); }); document.body.appendChild(bg); },
  camapp2:()=>camToMemo(),
  camalbum:()=>{ $('.sheet-bg')?.remove(); const bg=document.createElement('div'); bg.className='sheet-bg';
    bg.innerHTML=`<div class="sheet" role="dialog" aria-label="写真帳に入れる"><h2>🗂️ 写真帳に入れる<button class="ib ghost x" data-act="closesheet" aria-label="閉じる">✕</button></h2>
    <p class="small muted" style="margin:0 0 8px">どこに入れますか？（あとで写真帳から変えられます）</p>
    <div class="btns" style="flex-direction:column">${phCats().map(c=>`<button class="btn plain" data-act="camalbum2" data-c="${h(c)}">${h(c)}</button>`).join('')}</div></div>`;
    bg.addEventListener('click',e=>{ if(e.target===bg) bg.remove(); }); document.body.appendChild(bg); },
  camalbum2:async(el,d)=>{ $('.sheet-bg')?.remove(); try{ const c=document.createElement('canvas'); camDraw(c,UI.cam,1600); const img=c.toDataURL('image/jpeg',.85); camDraw(c,UI.cam,320); const thumb=c.toDataURL('image/jpeg',.7);
      const now=new Date(); await phPut({id:uid(),t:ymd(now)+'T'+pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds()),cat:d.c,memo:'',img,thumb}); UI.phCat=d.c; toast(`🗂️ 写真帳の「${d.c}」に入れました`); }catch(e){ toast('写真帳に入れられませんでした'); } },
  camboth:()=>{ camToMemo(); camPhone(); }
});

/* ===== デザインのモード（クールブラック／クールレディース） =====
   見た目は CSS の [data-style] で切り替える。キャラの絵は、劇場の画面以外では出さない */
const CHARA_SRC=new Set([BOO_F,OP_BOO,OP_SAD,OP_EN,OP_TON,OP_ERI,OP_AYA,CHARA_OZ]);
const isChara=u=>CHARA_SRC.has(u)||String(u).startsWith('data:image/svg+xml;charset=utf-8,');
const coolStyle=()=>S.set.style==='black'||S.set.style==='ladies';
const _styleRender=render; render=function(){
  const root=document.documentElement; if(coolStyle()) root.setAttribute('data-style',S.set.style); else root.removeAttribute('data-style');
  _styleRender.apply(this,arguments); try{ styleAfter(); }catch(e){} };
function styleAfter(){
  if(!coolStyle()||/^gekijo/.test(cur())) return;
  $$('#app img').forEach(im=>{ if(isChara(im.getAttribute('src')||'')) im.remove(); });
  $$('#app .hb.kuro').forEach(b=>{ b.childNodes.forEach(n=>{ if(n.nodeType===3) n.textContent=n.textContent.replace('クロにゃんに聞く','AIに聞く'); }); });
  $$('#app .mini-ota .t').forEach(t=>{ t.textContent='お知らせ'; });
  $$('#app .say').forEach(x=>{ x.classList.add('nochara'); });
}
/* オープニングは、クールのモード専用のものを後で作る。それまでは出さない */
ACTS.opening=()=>{ if(coolStyle()){ toast('このモードのオープニングは準備中です'); return; } playOpening(); };
