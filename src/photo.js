
/* ===== カメラ・写真帳（11/28）：撮った写真をアプリの中に分けて残す。費用なし =====
   写真は大きいので、スマホの中の別の保管場所（IndexedDB）に入れる。S.photoCats＝分け方 */
const PH_CATS0=['家族','レシート','メモ・書類','お店・場所','料理','その他'];
const phCats=()=>S.photoCats&&S.photoCats.length?S.photoCats:PH_CATS0;
let PHDB=null;
function phdb(){ if(PHDB) return PHDB; PHDB=new Promise((ok,ng)=>{ try{ const r=indexedDB.open('bootin-photos',1);
  r.onupgradeneeded=()=>{ const s=r.result.createObjectStore('p',{keyPath:'id'}); s.createIndex('t','t'); };
  r.onsuccess=()=>ok(r.result); r.onerror=()=>ng(r.error); }catch(e){ ng(e); } }); return PHDB; }
async function phAll(){ const db=await phdb(); return new Promise((ok,ng)=>{ const out=[]; const tx=db.transaction('p'); const c=tx.objectStore('p').openCursor();
  c.onsuccess=()=>{ const x=c.result; if(x){ const v=x.value; out.push({id:v.id,t:v.t,cat:v.cat,memo:v.memo,thumb:v.thumb}); x.continue(); } else ok(out.sort((a,b)=>b.t.localeCompare(a.t))); }; c.onerror=()=>ng(c.error); }); }
async function phGet(id){ const db=await phdb(); return new Promise((ok,ng)=>{ const r=db.transaction('p').objectStore('p').get(id); r.onsuccess=()=>ok(r.result); r.onerror=()=>ng(r.error); }); }
async function phPut(v){ const db=await phdb(); return new Promise((ok,ng)=>{ const tx=db.transaction('p','readwrite'); tx.objectStore('p').put(v); tx.oncomplete=()=>ok(); tx.onerror=()=>ng(tx.error); }); }
async function phDel(id){ const db=await phdb(); return new Promise((ok,ng)=>{ const tx=db.transaction('p','readwrite'); tx.objectStore('p').delete(id); tx.oncomplete=()=>ok(); tx.onerror=()=>ng(tx.error); }); }
/* 写真を縮めて保存（長い辺1600px、小さい見本は320px） */
function shrink(file,max,q){ return new Promise((ok,ng)=>{ const u=URL.createObjectURL(file); const im=new Image();
  im.onload=()=>{ const s=Math.min(1,max/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=Math.round(im.width*s); c.height=Math.round(im.height*s);
    c.getContext('2d').drawImage(im,0,0,c.width,c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg',q)); };
  im.onerror=()=>{ URL.revokeObjectURL(u); ng(new Error('img')); }; im.src=u; }); }
async function phAdd(files,cat){
  let n=0; for(const f of files){ if(!/^image\//.test(f.type)) continue;
    try{ const full=await shrink(f,1600,.82), thumb=await shrink(f,320,.7); const now=new Date();
      await phPut({id:uid(),t:ymd(now)+'T'+pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds()),cat:cat||'',memo:'',img:full,thumb}); n++; }catch(e){} }
  return n;
}
function vPhotos(cat){
  cat=cat||UI.phCat||''; UI.phCat=cat;
  return sub('カメラ・写真帳',`<div class="phbtns"><label class="btn phcam">📷 写真を撮る<input type="file" accept="image/*" capture="environment" class="cam-in" hidden></label>
    <label class="btn plain" for="ph-pick">🖼️ スマホの写真から選ぶ</label><input id="ph-pick" type="file" accept="image/*" multiple hidden></div>
  <div class="f" style="margin:6px 0 0"><label for="ph-cat" class="small">「スマホの写真から選ぶ」で入れる場所</label><select id="ph-cat">${phCats().map(c=>`<option ${c===(UI.phPut||cat||phCats()[0])?'selected':''}>${h(c)}</option>`).join('')}</select></div>
  <div class="chips">${['',...phCats()].map(c=>`<button class="chip" aria-pressed="${cat===c}" data-act="phcat" data-c="${h(c)}">${c?h(c):'すべて'}</button>`).join('')}</div>
  <div id="phgrid" class="phgrid"><p class="muted">読み込んでいます…</p></div>
  <p class="small muted">⚠️ 写真帳の写真は、容量をとらないよう小さくして残します（印刷や拡大には向きません）。きれいに残したい写真は、撮ったあとの「スマホに保存」も使ってください。写真はこのスマホの中だけに残ります（どこにも送りません）。スマホを替えるときやアプリを消すときは、残したい写真を「共有」でスマホのアルバムなどに移してください。</p>`,{crumb:'設定・機能 › 写真管理'});
}
async function photosAfter(){
  const g=$('#phgrid'); if(!g) return;
  const cam=$('#ph-cam'), pick=$('#ph-pick'), sel=$('#ph-cat');
  const add=async inp=>{ const fs=[...inp.files]; if(!fs.length) return; UI.phPut=sel.value; toast('保存しています…'); const n=await phAdd(fs,sel.value); inp.value=''; toast(n?`📷 ${n}枚を「${sel.value}」に入れました`:'保存できませんでした'); render(); };
  if(pick&&!pick.dataset.w){ pick.dataset.w=1; pick.addEventListener('change',()=>add(pick)); sel.addEventListener('change',()=>{UI.phPut=sel.value;}); }
  try{ const all=(await phAll()).filter(p=>!UI.phCat||p.cat===UI.phCat);
    g.innerHTML=all.length?all.map(p=>`<button class="phc" data-go="photo/${p.id}"><img src="${p.thumb}" alt="${h(p.cat||'写真')}" loading="lazy">${p.memo?'<i>📝</i>':''}</button>`).join(''):`<div class="empty" style="grid-column:1/-1">${BOO_IMG}まだ写真はありません。「📷 写真を撮る」から始めよう。</div>`;
  }catch(e){ g.innerHTML='<p class="muted">このスマホでは写真を保存できませんでした（シークレットモードなど）。</p>'; }
}
function vPhoto(id){
  return sub('写真',`<div id="ph1" data-id="${h(id)}"><p class="muted">読み込んでいます…</p></div>`,{crumb:'カメラ・写真帳'});
}
async function photoAfter(){
  const w=$('#ph1'); if(!w||w.dataset.ok) return; w.dataset.ok=1; const p=await phGet(w.dataset.id).catch(()=>null);
  if(!p){ w.innerHTML='<p class="muted">この写真は見つかりませんでした。</p>'; return; }
  w.innerHTML=`<img class="phbig" src="${p.img}" alt="">
   <div class="small muted" style="margin:6px 0">${jpDate(p.t.slice(0,10),false)} ${p.t.slice(11,16)}</div>
   <div class="f"><label for="ph1-cat">入れる場所</label><select id="ph1-cat">${phCats().map(c=>`<option ${c===p.cat?'selected':''}>${h(c)}</option>`).join('')}</select></div>
   <div class="f"><label for="ph1-memo">ひとこと</label><textarea id="ph1-memo" placeholder="例：〇〇スーパーのレシート、駐車場の場所">${h(p.memo||'')}</textarea></div>
   <div class="btns"><button class="btn" data-act="phsave" data-id="${p.id}">保存</button>${navigator.share?`<button class="btn plain" data-act="phshare" data-id="${p.id}">📤 共有・送る</button>`:''}<button class="btn danger" data-act="phdel" data-id="${p.id}">削除</button></div>`;
}
Object.assign(ACTS,{
  phcat:(el,d)=>{ UI.phCat=d.c; render(); },
  phsave:async(el,d)=>{ const p=await phGet(d.id); if(!p) return; p.cat=$('#ph1-cat').value; p.memo=$('#ph1-memo').value.trim(); await phPut(p); toast('保存しました'); back(); },
  phdel:async(el,d)=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='もう一度押すと削除'; return; } await phDel(d.id); toast('削除しました'); back(); },
  phshare:async(el,d)=>{ const p=await phGet(d.id); if(!p) return; try{ const b=await (await fetch(p.img)).blob(); const f=new File([b],'bootin-'+p.t.slice(0,10)+'.jpg',{type:'image/jpeg'});
    if(navigator.canShare&&navigator.canShare({files:[f]})) await navigator.share({files:[f],title:'写真',text:p.memo||''}); else toast('このスマホでは写真を送れませんでした'); }catch(e){} }
});
