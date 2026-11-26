/* ===== 動き ===== */
function routeView(r){
  const [a,...rest]=r.split('/'); const arg=decodeURIComponent(rest.join('/'));
  switch(a){
    case 'home': return vHome();
    case 'day': return vDay(arg);
    case 'cal': return vCal(arg);
    case 'ev': return vEvent(arg);
    case 'evnew': return vEvent('',arg);
    case 'node': return vNode(arg);
    case 'people': return vPeople();
    case 'person': return vPerson(arg);
    case 'pedit': return vPEdit(arg);
    case 'pcats': return vPCats();
    case 'places': return vPlaces();
    case 'shops': return vShops();
    case 'place': return vPlace(arg);
    case 'pledit': return vPlEdit(arg);
    case 'memo': return vMemo();
    case 'tools': return vTools();
    case 'weather': return vWeather();
    case 'otayori': return vOtayori();
    case 'search': return vSearch(arg);
    case 'settings': return vSettings();
    case 'features': return vFeatures();
    case 'gridpick': return vGridPick(arg);
    case 'otasukeset': return vOtasukeSet();
    case 'me': return vMe();
    case 'data': return vData();
    case 'install': return vInstall();
    case 'meds': return vMeds();
    case 'medit': return vMedEdit(arg);
  }
  return vHome();
}
function sideNav(){
  const r=cur(); const reds=ROOTS.filter(x=>!isOff(x));
  const it=(go,em,t,act)=>`<button class="sn ${act?'on':''}" ${go.startsWith('@')?`data-act="${go.slice(1)}"`:`data-go="${go}"`}><span>${em}</span>${h(t)}</button>`;
  return `<aside class="side"><div class="brand"><img src="${BOO_F}" alt="">BOOTIN</div>
  ${it('home','🏠','トップ',r==='home')}${it('cal/'+today().slice(0,7),'📅','カレンダー',r.startsWith('cal'))}${it('day/'+today(),'🗓️','今日の1日カード',r.startsWith('day'))}
  <div class="sn-h">入口</div>${reds.map(id=>`<button class="sn ${r==='node/'+id?'on':''}" data-act="open" data-id="${h(id)}"><span>${RED_EMOJI[id]}</span>${h(id)}</button>`).join('')}
  <div class="sn-h">いつでも</div>${it('memo','✏️','さっとメモ',r==='memo')}${it('search/','🔍','探す',r.startsWith('search'))}${it('tools','🧰','便利道具',r==='tools')}${it('@otasuke','🆘','おたすけ')}</aside>`;
}
function render(){
  const root=document.documentElement;
  root.classList.toggle('f2',S.set.font==2); root.classList.toggle('f3',S.set.font==3||(S.set.mode==='elder'&&S.set.font==1));
  if(S.set.theme) root.setAttribute('data-theme',S.set.theme); else root.removeAttribute('data-theme');
  root.setAttribute('data-kise',S.set.kise||'bee');
  const r=cur();
  if(r==='home'&&!IN_FRAME) {}
  $('#app').innerHTML=`<div class="shell">${sideNav()}<main class="wrap ${r==='home'?'home':''}">${routeView(r)}</main></div><nav class="tabbar" aria-label="移動">${r==='home'?'':`<button data-act="back"><span>←</span>もどる</button>`}${[['home','🏠','トップ'],['day/'+today(),'🗓️','1日カード'],['cal/'+today().slice(0,7),'📅','カレンダー'],['people','📇','人物帳'],['memo','✏️','メモ一覧']].map(([g,e,t])=>`<button data-go="${g}" ${(g==='home'?r==='home':r.split('/')[0]===g.split('/')[0])?'aria-current="page"':''}><span>${e}</span>${t}</button>`).join('')}</nav><button class="fab" data-act="qmemo" aria-label="さっとメモ">✏️ メモ</button>`;
  after(r);
}
function after(r){
  tick();
  if(r==='home'||r==='weather'){ const c=S.cache.wx; if(!(c&&c.lat===S.set.wx.lat&&c.lon===S.set.wx.lon&&Date.now()-c.at<30*60e3)&&!(S.cache.wxErr&&Date.now()-S.cache.wxErr<60e3)){ loadWx().then(d=>{ if(cur()===r) render(); }); } }
  const dm=$('#daymemo'); if(dm){ let tm; dm.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(()=>{const s=cur().split('/')[1]; S.daymemo[s]=dm.value; if(!dm.value.trim()) delete S.daymemo[s]; save();},400);}); }
  const pq=$('#pq'); if(pq) pq.addEventListener('input',()=>{UI.pQ=pq.value;$('#plist').innerHTML=peopleList();});
  const plq=$('#plq'); if(plq) plq.addEventListener('input',()=>{UI.plQ=plq.value;$('#pllist').innerHTML=placeList();});
  const mq=$('#mq'); if(mq) mq.addEventListener('input',()=>{UI.memoQ=mq.value;$('#mlist').innerHTML=memoList();});
  const sq=$('#sq'); if(sq&&!sq.value) try{sq.focus();}catch(e){}
  const wc=$('#wx-city'); if(wc) wc.addEventListener('change',()=>{const c=CITIES.find(x=>x[0]===wc.value); if(c){S.set.wx={name:c[0],lat:c[1],lon:c[2]}; S.cache.wxErr=0; save(); render(); loadWx(true).then(()=>render());}});
  const pf=$('#ph-file'); if(pf) pf.addEventListener('change',async()=>{const f=pf.files[0]; if(!f) return; try{const d=await readPhoto(f,320); $('#ph-data').value=d; $('#ph-prev').innerHTML=face({photo:d},72);}catch(e){toast('写真を読み込めませんでした');}});
  const big=$('#pl-big'); if(big) big.addEventListener('change',()=>{const bigs=$$('#pl-big input:checked').map(x=>x.value); const sel=$$('#pl-genre input:checked').map(x=>x.value); $('#pl-genre').innerHTML=genreChips(bigs,sel);});
  const imf=$('#imp-file'); if(imf) imf.addEventListener('change',()=>{const f=imf.files[0]; if(!f) return; const fr=new FileReader(); fr.onload=()=>doImport(fr.result); fr.readAsText(f);});
  medAfter();
  $$('details.tree[data-red]').forEach(d=>d.addEventListener('toggle',()=>{d.open?UI.openReds.add(d.dataset.red):UI.openReds.delete(d.dataset.red);}));
}

/* 時計 */
function tick(){
  const now=new Date(); const hm=pad(now.getHours())+':'+pad(now.getMinutes());
  const a=$('#clockT'); if(a) a.textContent=hm;
  const b=$('#bigT'); if(b) b.textContent=hm+':'+pad(now.getSeconds());
  const w=$('#world'); if(w&&now.getSeconds()===0) w.innerHTML=worldRows();
  const tm=$('#tmT'); if(tm&&T.timerRun) tm.textContent=fmtMS(T.timerEnd-Date.now());
  if(now.getSeconds()<1) medCheck();
  if(T.timerRun&&Date.now()>=T.timerEnd){ T.timerRun=false; T.timerLeft=0; beep(); toast('⏲️ 時間です！'); if(cur()==='tools') render(); }
  const sw=$('#swT'); if(sw&&T.swRun) sw.textContent=fmtSW(swNow());
  if($('#clockD')&&$('#clockD').textContent!==jpDate(today())&&cur()==='home') render();
}
setInterval(tick,250);

/* 左右に指でスライドして月を変える */
let swX=0,swY=0,swT=null;
document.addEventListener('touchstart',ev=>{const t=ev.target.closest('[data-swipe]'); swT=t; if(!t) return; swX=ev.touches[0].clientX; swY=ev.touches[0].clientY;},{passive:true});
document.addEventListener('touchend',ev=>{ if(!swT) return; const t=swT; swT=null;
  const dx=ev.changedTouches[0].clientX-swX, dy=ev.changedTouches[0].clientY-swY;
  if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5) return;
  const ym=dx<0?t.dataset.next:t.dataset.prev;
  swipeBlock=Date.now();
  if(t.dataset.swipe==='big') go('cal/'+ym,true); else { UI.topYm=ym; render(); }
},{passive:true});
let swipeBlock=0;

/* 押したとき */
document.addEventListener('click',async ev=>{
  if(Date.now()-swipeBlock<400){ ev.preventDefault(); return; }
  const g=ev.target.closest('[data-go],[data-go-r]');
  if(g&&!ev.target.closest('a')){ ev.preventDefault(); if(g.dataset.goR) go(g.dataset.goR,true); else go(g.dataset.go); return; }
  const el=ev.target.closest('[data-act]'); if(!el) return;
  const A=el.dataset.act; const d=el.dataset;
  if(A==='none') { ev.stopPropagation(); return; }
  if(el.tagName==='BUTTON'||el.getAttribute('role')==='button') ev.preventDefault();
  const fn=ACTS[A]; if(fn) await fn(el,d,ev);
});
document.addEventListener('keydown',ev=>{ if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('[role=button][data-act]')){ev.preventDefault();ev.target.click();} if(ev.key==='Escape'){const s=$('.sheet-bg'); if(s) s.remove();} });
document.addEventListener('change',ev=>{
  const el=ev.target;
  if(el.dataset.act==='setr'){ const v=isNaN(+el.value)||el.value===''?el.value:+el.value; S.set[el.name]=v; save(); render(); }
  if(el.dataset.act==='sethr'){ S.set[el.dataset.k]=+el.value; if(+S.set.hFrom>+S.set.hTo){const a=S.set.hFrom;S.set.hFrom=S.set.hTo;S.set.hTo=a;} save(); render(); }
  if(el.dataset.act==='setcn'){ S.set.cn=el.checked; save(); }
  if(el.dataset.act==='feat'){ const id=el.dataset.id; if(el.checked) delete S.set.off[id]; else S.set.off[id]=true; save(); }
});
document.addEventListener('submit',async ev=>{
  const f=ev.target.closest('form[data-form]'); if(!f) return; ev.preventDefault();
  const fn=FORMS[f.dataset.form]; if(fn) await fn(f,new FormData(f));
});

const ACTS={
  back:()=>back(),
  open:(el,d)=>openNode(d.id),
  gedit:()=>{UI.editGrid=!UI.editGrid; render();},
  gotoedit:()=>{UI.editGrid=true; go('home');},
  gmove:(el,d)=>{const i=+d.i,j=i+(+d.d); const g=S.set.grid; while(g.length<9) g.push(''); if(j<0||j>8) return; [g[i],g[j]]=[g[j],g[i]]; save(); render();},
  gpick:(el,d)=>go('gridpick/'+d.i),
  gset:(el,d)=>{const g=S.set.grid; while(g.length<9) g.push(''); g[+d.i]=d.id; save(); toast(d.id?'置きました':'空にしました'); UI.editGrid=true; stack=['home']; go('home',true);},
  daycat:(el,d)=>{UI.dayCat=d.c; render();},
  calcat:(el,d)=>{UI.calCat=d.c; render();},
  pcat:(el,d)=>{UI.pCat=d.c; render();},
  plbig:(el,d)=>{UI.plBig=d.c; render();},
  shoptab:(el,d)=>{UI.shopTab=d.c; render();},
  memosrc:(el,d)=>{UI.memoSrc=d.c; render();},
  tooltab:(el,d)=>{UI.toolTab=d.c; render();},
  explain:(el,d)=>{const t=(d.k==='jp'?HOL_EXPLAIN:CN_EXPLAIN)[d.n]||''; sheet(`${d.k==='jp'?'🎌':'🇨🇳'} ${h(d.n)}`,`<p style="font-size:1.1rem">${h(t||'説明はまだありません。')}</p>`);},
  delev:(el,d)=>{ if(UI.confirm!=='ev'+d.id){UI.confirm='ev'+d.id; render(); return;} S.events=S.events.filter(e=>e.id!==d.id); save(); toast('予定を削除しました'); UI.confirm=''; back(); },
  delperson:(el,d)=>{ if(UI.confirm!=='p'+d.id){UI.confirm='p'+d.id; render(); return;} S.people=S.people.filter(p=>p.id!==d.id); S.events.forEach(e=>{if(e.people)e.people=e.people.filter(x=>x!==d.id);}); save(); toast('削除しました'); stack=['home']; go('people',false); },
  delplace:(el,d)=>{ if(UI.confirm!=='pl'+d.id){UI.confirm='pl'+d.id; render(); return;} S.places=S.places.filter(p=>p.id!==d.id); S.events.forEach(e=>{if(e.placeId===d.id){e.place=e.place||'';e.placeId='';}}); save(); toast('削除しました'); stack=['home']; go('places',false); },
  delmemo:(el,d)=>{ if(UI.confirm!=='m'+d.id){UI.confirm='m'+d.id; $('#mlist').innerHTML=memoList(); return;} S.memos=S.memos.filter(m=>m.id!==d.id); save(); UI.confirm=''; $('#mlist').innerHTML=memoList(); },
  delpcat:(el,d)=>{ const c=S.set.pcats[+d.i]; if(!c||c.id==='other') return; S.set.pcats.splice(+d.i,1); S.people.forEach(p=>{p.cats=(p.cats||[]).filter(x=>x!==c.id);}); save(); render(); },
  evwith:(el,d)=>{ go('evnew/'+today()); setTimeout(()=>{const c=$(`input[name=people][value="${d.id}"]`); if(c) c.checked=true;},0); },
  evat:(el,d)=>{ go('evnew/'+today()); setTimeout(()=>{const s=$('#ev-pid'); if(s) s.value=d.id;},0); },
  addgenre:()=>{ const inp=$('#pl-newg'); const v=inp.value.trim(); if(!v) return; const bigs=$$('#pl-big input:checked').map(x=>x.value); const b=bigs[0]||'その他'; S.set.genres[b]=S.set.genres[b]||[]; if(!S.set.genres[b].includes(v)) S.set.genres[b].push(v); save(); const sel=$$('#pl-genre input:checked').map(x=>x.value).concat(v); $('#pl-genre').innerHTML=genreChips(bigs.length?bigs:['その他'],sel); inp.value=''; },
  qmemo:()=>quickMemo(),
  otasuke:()=>otasuke(),
  tmadd:(el,d)=>{ if(T.timerRun) T.timerEnd+=(+d.s)*1000; else T.timerLeft+=(+d.s)*1000; render(); },
  tmgo:()=>{ if(T.timerRun){T.timerLeft=T.timerEnd-Date.now();T.timerRun=false;} else if(T.timerLeft>0){T.timerEnd=Date.now()+T.timerLeft;T.timerRun=true;} else toast('先に時間を足してください'); render(); },
  tmreset:()=>{T.timerRun=false;T.timerLeft=0;render();},
  swgo:()=>{ if(T.swRun){T.swAcc+=Date.now()-T.swStart;T.swRun=false;} else {T.swStart=Date.now();T.swRun=true;} render(); },
  swlap:()=>{ if(T.swRun){T.laps.unshift(swNow()); render();} },
  swreset:()=>{T.swRun=false;T.swAcc=0;T.laps=[];render();},
  ck:(el,d)=>{
    const k=d.k; const D=$('#calcD'); const R=$('#splitR'); if(R) R.textContent='';
    try{
      if(k==='C') T.calc='';
      else if(k==='=') T.calc=String(calcEval(T.calc||'0'));
      else if(k==='tax10'||k==='tax8'){ const v=calcEval(T.calc||'0'); T.calc=String(Math.floor(v*(k==='tax10'?1.1:1.08))); }
      else if(k==='split'){ const v=calcEval(T.calc||'0'); const n=Math.max(1,+$('#wkp').value||1); T.calcPeople=n; const per=Math.ceil(v/n/100)*100; T.calc=String(per); if(R) R.textContent=`${v.toLocaleString()}円を${n}人で：1人${per.toLocaleString()}円（集めると${(per*n).toLocaleString()}円、${(per*n-v).toLocaleString()}円あまり）`; }
      else T.calc+=k;
    }catch(e){ T.calc=''; toast('式が正しくありません'); }
    D.textContent=T.calc||'0';
  },
  wxhere:()=>{ if(!navigator.geolocation){toast('この画面では今いる場所が使えません');return;} navigator.geolocation.getCurrentPosition(p=>{S.set.wx={name:'今いる場所',lat:+p.coords.latitude.toFixed(2),lon:+p.coords.longitude.toFixed(2)}; S.cache.wxErr=0; save(); render(); loadWx(true).then(()=>render());},()=>toast('今いる場所を使えませんでした。一覧から選んでください'),{timeout:10000}); },
  wxreload:()=>{ S.cache.wxErr=0; S.cache.wx=null; render(); loadWx(true).then(()=>render()); },
  featall:()=>{ S.set.off={}; save(); render(); toast('すべて表示しました'); },
  featimpl:()=>{ const off={}; for(const id in NODES){ const n=NODES[id]; if(n.lv==='y'&&!hasImpl(id)&&!LOCKED.has(id)) off[id]=true; if(n.lv!=='y'&&!hasImpl(id)&&!LOCKED.has(id)) off[id]=true; } S.set.off=off; save(); render(); toast('使える機能だけにしました'); },
  export:()=>{ const txt=JSON.stringify(S); try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'})); a.download='BOOTIN-'+today()+'.json'; document.body.appendChild(a); a.click(); a.remove(); toast('書き出しました（ダウンロードを見てください）'); }catch(e){ toast('書き出せませんでした。「文字でコピー」を使ってください'); } },
  exportcopy:async()=>{ const txt=JSON.stringify(S); try{ await navigator.clipboard.writeText(txt); toast('コピーしました。メモ帳などに貼って保存してください'); }catch(e){ const t=$('#imp-text'); t.value=txt; t.select(); toast('下の欄に出しました。全部選んでコピーしてください'); } },
  importtext:()=>doImport($('#imp-text').value),
  sample:()=>{ addSample(); toast('見本を入れました'); render(); },
  unsample:()=>{ S.people=S.people.filter(p=>!p.sample); S.places=S.places.filter(p=>!p.sample); S.events=S.events.filter(p=>!p.sample); S.memos=S.memos.filter(p=>!p.sample); S.meds=(S.meds||[]).filter(p=>!p.sample); save(); toast('見本を削除しました'); render(); },
  wipe:()=>{ if(UI.confirm!=='wipe'){UI.confirm='wipe'; render(); return;} S=fresh(); save(); UI.confirm=''; toast('すべて削除しました'); stack=['home']; go('home',true); },
  topcal:(el,d)=>{S.set.topCal=d.c; UI.topYm=''; save(); render();},
  topym:(el,d)=>{UI.topYm=d.ym; render();},
  closesheet:()=>{ const s=$('.sheet-bg'); if(s) s.remove(); },
  qphoto:async()=>{},
};
function doImport(txt){
  try{ const j=JSON.parse(txt); if(!j||!j.v||!j.set) throw 0; S=j; const f=fresh(); for(const k in f) if(S[k]===undefined) S[k]=f[k]; save(); toast('読み込みました'); stack=['home']; go('home',true); }
  catch(e){ toast('読み込めませんでした。BOOTINで書き出したものか確かめてください'); }
}

const FORMS={
  event:(f,fd)=>{
    const id=f.dataset.id; const e=id?S.events.find(x=>x.id===id):{id:uid()};
    const tm=k=>fd.get(k+'_h')?fd.get(k+'_h')+':'+fd.get(k+'_m'):'';
    Object.assign(e,{title:fd.get('title').trim(),date:fd.get('date'),time:tm('time'),etime:tm('time')?tm('etime'):'',cat:fd.get('cat')||'other',rep:fd.get('rep')||'',placeId:fd.get('placeId')||'',place:fd.get('place').trim(),people:fd.getAll('people'),memo:fd.get('memo').trim()});
    if(!id) S.events.push(e); save(); toast('予定を登録しました'); stack=['home']; go('day/'+e.date,true);
  },
  person:(f,fd)=>{
    const id=f.dataset.id; const p=id?S.people.find(x=>x.id===id):{id:uid(),log:[]};
    let bday=fd.get('bday')||''; if(bday&&fd.get('noyear')) bday='0000'+bday.slice(4);
    Object.assign(p,{name:fd.get('name').trim(),kana:fd.get('kana').trim(),cats:fd.getAll('cats'),photo:fd.get('photo')||'',
      phones:[0,1,2,3].map(i=>({label:fd.get('pl'+i).trim(),num:fd.get('pn'+i).trim()})),emails:[fd.get('m0').trim(),fd.get('m1').trim()].filter(Boolean),
      zip:fd.get('zip').trim(),addr:fd.get('addr').trim(),bday,blood:fd.get('blood'),line:fd.get('line').trim(),fb:fd.get('fb').trim(),wechat:fd.get('wechat').trim(),fav:!!fd.get('fav')});
    if(!id) S.people.push(p); save(); toast('登録しました'); go('person/'+p.id,true);
  },
  place:(f,fd)=>{
    const id=f.dataset.id; const p=id?S.places.find(x=>x.id===id):{id:uid(),log:[]};
    Object.assign(p,{name:fd.get('name').trim(),big:fd.getAll('big'),genre:fd.getAll('genre'),addr:fd.get('addr').trim(),tel:fd.get('tel').trim(),hp:fd.get('hp').trim(),hours:fd.get('hours').trim(),score:+fd.get('score')||0,often:!!fd.get('often'),want:!!fd.get('want'),silver:!!fd.get('silver')});
    if(!p.big.length) p.big=['その他'];
    if(!id) S.places.push(p); save(); toast('登録しました'); go('place/'+p.id,true);
  },
  log:(f,fd)=>{
    const txt=(fd.get('text')||'').trim(); if(!txt) return;
    const arr=f.dataset.kind==='person'?S.people:S.places; const o=arr.find(x=>x.id===f.dataset.id); if(!o) return;
    o.log=o.log||[]; const now=new Date(); o.log.push({d:ymd(now)+'T'+pad(now.getHours())+':'+pad(now.getMinutes()),text:txt,met:!!fd.get('met')}); save(); render(); toast('書き足しました');
  },
  pcats:(f,fd)=>{
    S.set.pcats.forEach((c,i)=>{ const n=(fd.get('n'+i)||'').trim(); if(n&&c.id!=='other') c.name=n; c.color=+fd.get('c'+i); });
    const nn=(fd.get('newname')||'').trim(); if(nn){ const used=S.set.pcats.map(c=>c.color); S.set.pcats.splice(S.set.pcats.length-1,0,{id:uid(),name:nn,color:[0,1,2,3,4,5,6,7,8].find(x=>!used.includes(x))??0}); }
    save(); toast('登録しました'); render();
  },
  search:(f,fd)=>go('search/'+encodeURIComponent((fd.get('q')||'').trim()),true),
  otasuke:(f,fd)=>{ S.set.home={addr:fd.get('addr').trim(),tel:fd.get('tel').trim(),telName:fd.get('telName').trim()}; save(); toast('登録しました'); back(); },
  me:(f,fd)=>{ for(const [k,v] of fd.entries()) S.set.me[k]=String(v).trim(); save(); toast('登録しました'); render(); window.scrollTo(0,0); },
  qmemo:(f,fd)=>{
    const txt=(fd.get('text')||'').trim(); const ph=fd.get('photo')||''; if(!txt&&!ph){toast('なにか書いてください');return;}
    const now=new Date(); S.memos.push({id:uid(),t:ymd(now)+'T'+pad(now.getHours())+':'+pad(now.getMinutes()),text:txt,photo:ph,from:f.dataset.from||''}); save();
    $('.sheet-bg')?.remove(); toast('メモを登録しました'); if(cur()==='memo') render();
  }
};

Object.assign(ACTS,MED_ACTS); Object.assign(FORMS,MED_FORMS);
/* 下から出る窓 */
function sheet(title,body){
  $('.sheet-bg')?.remove();
  const bg=document.createElement('div'); bg.className='sheet-bg';
  bg.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="${h(title.replace(/<[^>]+>/g,''))}"><h2>${title}<button class="ib ghost x" data-act="closesheet" aria-label="閉じる">✕</button></h2>${body}</div>`;
  bg.addEventListener('click',e=>{ if(e.target===bg) bg.remove(); });
  document.body.appendChild(bg); return bg;
}
function pageTitle(){ const h1=$('main h1'); return h1?h1.textContent:'トップ'; }
function quickMemo(){
  const from=pageTitle();
  const bg=sheet('✏️ さっとメモ',`<form data-form="qmemo" data-from="${h(from)}">
    <textarea class="search" name="text" id="qm-text" style="min-height:150px" placeholder="思いついたことを、なんでも"></textarea>
    <div class="photo-pick" style="margin-top:8px"><label class="btn plain" for="qm-file" style="flex:none">📷 写真</label><input type="file" id="qm-file" accept="image/*" hidden><input type="hidden" name="photo" id="qm-photo"><span id="qm-prev" class="small muted">${SR?'🎤 は声で入れるボタンです':'キーボードのマイクで声でも入れられます'}</span>${SR?'<button type="button" class="btn plain" id="qm-mic" style="flex:none">🎤 声</button>':''}</div>
    <p class="small muted" style="margin:6px 0 0">「${h(from)}」で書いた印が付きます。あとで「さっとメモ」の一覧で見られます。</p>
    <div class="btns"><button class="btn" type="submit">登録する</button></div></form>`);
  const fi=$('#qm-file',bg); fi.addEventListener('change',async()=>{ const f=fi.files[0]; if(!f) return; try{ const d=await readPhoto(f,900); $('#qm-photo',bg).value=d; $('#qm-prev',bg).innerHTML=`<img src="${d}" alt="" style="height:60px;border-radius:8px">`; }catch(e){ toast('写真を読み込めませんでした'); } });
  const mic=$('#qm-mic',bg); if(mic) mic.addEventListener('click',()=>{ try{ const r=new SR(); r.lang='ja-JP'; r.interimResults=false; mic.textContent='🎤 聞いています…'; r.onresult=e=>{ const t=$('#qm-text',bg); t.value+=(t.value?'\n':'')+e.results[0][0].transcript; }; r.onend=()=>{mic.textContent='🎤 声';}; r.onerror=()=>{mic.textContent='🎤 声'; toast('声を聞き取れませんでした');}; r.start(); }catch(e){ toast('この画面では声の入力が使えません'); } });
  setTimeout(()=>{try{$('#qm-text',bg).focus();}catch(e){}},50);
}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition||null;
function otasuke(){
  const hm=S.set.home; const fam=S.people.filter(p=>(p.cats||[]).includes('c1')&&p.phones&&p.phones.find(x=>x.num));
  sheet('🆘 おたすけ',`<div class="list">
    <a class="bigbtn" href="https://www.google.com/maps/@?api=1&map_action=map" target="_blank" rel="noopener"><span class="em">📍</span><span>ここはどこ？<small>地図で今いる場所を見る</small></span></a>
    ${hm.addr?`<a class="bigbtn" href="${naviUrl(hm.addr)}" target="_blank" rel="noopener"><span class="em">🏠</span><span>自宅へ道案内<small>${h(hm.addr)}</small></span></a>`:`<button class="bigbtn" data-go="otasukeset"><span class="em">🏠</span><span>自宅へ道案内<small>まだ自宅の住所がありません。押して入れてください</small></span></button>`}
    ${hm.tel?`<a class="bigbtn" href="${telHref(hm.tel)}"><span class="em">📞</span><span>${h(hm.telName||'家族')}へ電話<small>${h(hm.tel)}</small></span></a>`:''}
    ${fam.map(p=>{const t=p.phones.find(x=>x.num);return `<a class="bigbtn" href="${telHref(t.num)}">${face(p,44)}<span>${h(p.name)}へ電話<small>${h(t.num)}</small></span></a>`;}).join('')}
    ${!hm.tel&&!fam.length?`<button class="bigbtn" data-go="otasukeset"><span class="em">📞</span><span>家族へ電話<small>まだ電話番号がありません。押して入れてください</small></span></button>`:''}
    <button class="bigbtn" data-go="me"><span class="em">🪪</span><span>「私のこと」カード<small>まわりの人に見せる</small></span></button>
    <a class="bigbtn red" href="tel:188"><span class="em">☎️</span><span>188（消費者ホットライン）<small>あやしい電話・契約で困ったとき</small></span></a>
  </div>`);
  $$('.sheet [data-go]').forEach(b=>b.addEventListener('click',()=>$('.sheet-bg')?.remove()));
}

/* 見本 */
function addSample(){
  const t=today(); const P=(o)=>({id:uid(),sample:true,log:[],phones:[],emails:[],cats:[],...o});
  const a=P({name:'見本 花子',kana:'みほん はなこ',cats:['c1'],phones:[{label:'携帯',num:'090-0000-0001'}],bday:'1958-'+t.slice(5),blood:'A',addr:'静岡県静岡市葵区追手町9-6',fav:true,log:[{d:t+'T09:00',text:'見本です。好きなもの：あんみつ、園芸',met:false}]});
  const b=P({name:'見本 一郎',kana:'みほん いちろう',cats:['c3','c4'],phones:[{label:'携帯',num:'090-0000-0002'}],bday:'0000-'+addDays(t,3).slice(5),fav:true});
  const c=P({name:'見本 三郎',kana:'みほん さぶろう',cats:['c5'],phones:[{label:'自宅',num:'054-000-0003'}]});
  S.people.push(a,b,c);
  const L=(o)=>({id:uid(),sample:true,log:[],genre:[],score:0,...o});
  const s1=L({name:'見本スーパー',big:['買い物'],genre:['スーパー'],addr:'静岡駅',often:true,score:7,silver:true,hours:'9:00〜21:00'});
  const s2=L({name:'見本歯科',big:['医療'],genre:['歯科'],addr:'静岡市役所',tel:'054-000-0010',hours:'9:00〜18:00　木・日休み'});
  const s3=L({name:'見本食堂',big:['食事'],genre:['和食'],addr:'駿府城公園',want:true,score:10});
  S.places.push(s1,s2,s3);
  const E=(o)=>({id:uid(),sample:true,time:'',etime:'',rep:'',place:'',placeId:'',people:[],memo:'',...o});
  S.events.push(E({title:'歯医者（見本）',date:t,time:'10:30',etime:'11:00',cat:'health',placeId:s2.id,memo:'保険証を持っていく'}),
    E({title:'ゴミ出し（燃えるゴミ）',date:t,cat:'local',rep:'w'}),
    E({title:'一郎さんと昼ごはん（見本）',date:addDays(t,2),time:'12:00',cat:'hobby',placeId:s3.id,people:[b.id]}),
    E({title:'会議（見本）',date:addDays(t,1),time:'14:00',etime:'15:00',cat:'work'}));
  S.meds=S.meds||[]; S.meds.push({id:uid(),sample:true,name:'血圧の薬（見本）',purpose:'血圧を下げる',dose:'1',unit:'錠',freq:'daily',days:[],every:2,slots:['b'],timing:'after',times:[],start:t,end:'',left:20,low:5,placeId:s2.id,photo:'',memo:''});
  S.memos.push({id:uid(),sample:true,t:t+'T08:00',text:'見本のメモ：牛乳と卵を買う',from:'トップ'});
  save();
}

/* はじめ */
load();
if(!IN_FRAME){ const r=decodeURI(location.hash.slice(1)); if(r&&r!=='home') stack=['home',r]; try{history.replaceState(null,'','#'+cur());}catch(e){} }
render();
if('serviceWorker' in navigator && !IN_FRAME && location.protocol==='https:'){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
