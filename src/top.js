
/* ===== トップ画面まわり（11/28）：クロにゃんに聞く・ナビ・時計の光・お薬1行 ===== */
function speechOK(){ return !!(window.SpeechRecognition||window.webkitSpeechRecognition); }
/* マイクで話した言葉を入れる（Chromeの音声入力。使えないときはキーボードのマイクを案内） */
function listen(cb){
  const R=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!R){ toast('このスマホでは、キーボードのマイクのボタンで話してください'); return; }
  try{ const r=new R(); r.lang='ja-JP'; r.interimResults=false; r.maxAlternatives=1;
    r.onresult=e=>{ const t=(e.results[0]&&e.results[0][0].transcript||'').trim(); if(t) cb(t); };
    r.onerror=e=>toast(e.error==='not-allowed'?'マイクを使う許可が必要です':'うまく聞き取れませんでした');
    r.start(); toast('🎤 どうぞ、話してください'); }catch(e){ toast('マイクが使えませんでした'); }
}
/* --- クロにゃんに聞く：アプリの使い方と、アプリの中を探す。外の調べものはリンクで --- */
function vKuro(q){
  q=(q||'').trim(); let res='';
  if(q){
    const ws=q.replace(/[？?。、！!]/g,' ').split(/\s+/).filter(Boolean);
    const hit=x=>ws.some(w=>x.includes(w));
    const gd=[]; GUIDE.forEach(([em,t,items])=>items.forEach(([a,b])=>{ if(hit(t+a+b)) gd.push([em,t,a,b]); }));
    const nodes=Object.values(NODES).filter(n=>!isOff(n.id)&&hasImpl(n.id)&&hit(n.name+' '+(n.items||[]).map(x=>x[0]).join(' '))).slice(0,8);
    res=(gd.length?`<div class="sec"><h3>使い方（${gd.length}）</h3>${gd.slice(0,8).map(([em,t,a,b])=>`<details class="gitem"><summary>${em} ${h(t)}：${h(a)}</summary><p>${h(b)}</p></details>`).join('')}</div>`:'')
      +(nodes.length?`<div class="sec"><h3>アプリの中の機能</h3><div class="list">${nodes.map(n=>`<button class="row" data-act="open" data-id="${h(n.id)}"><span class="em">${emojiOf(n.id)}</span><span class="t"><b>${h(n.name)}</b><span>${crumbOf(n.id)}</span></span><span class="go">›</span></button>`).join('')}</div></div>`:'')
      +`<div class="sec"><h3>外で調べる</h3><div class="list">
        <a class="row" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(q)}"><span class="em">🌐</span><span class="t"><b>Googleで調べる</b><span>${h(q)}</span></span><span class="go">›</span></a>
        <a class="row" target="_blank" rel="noopener" href="https://ja.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}"><span class="em">📚</span><span class="t"><b>ウィキペディアで調べる</b><span>${h(q)}</span></span><span class="go">›</span></a>
        <button class="row" data-go="search/${h(q)}"><span class="em">🔍</span><span class="t"><b>アプリ内検索で探す</b><span>人・場所・予定・メモの中から</span></span><span class="go">›</span></button></div></div>`;
  }
  return sub('クロにゃんに聞く',`<div class="kuro-hero"><img src="${charaImg('kuro')}" alt="クロにゃん"><div class="b">${q?`「${h(q)}」だにゃ。わかることを並べたにゃ。`:'何でも聞いてにゃ。アプリの使い方も、調べものの入口も教えるにゃ。'}</div></div>
   <form data-form="kuro" class="kuro-f"><input class="search" id="kq" name="q" type="search" value="${h(q)}" placeholder="例：薬の飲み忘れ、ゴミの日、静岡の天気"><button type="button" class="btn mic" data-act="kmic" aria-label="話して聞く">🎤</button><button class="btn">聞く</button></form>
   ${res}<p class="small muted">いまのクロにゃんは、アプリの説明書と中身から答えます。会話して答えるクロにゃんは、もう少し先にできる予定です。</p>`,{crumb:'トップ'});
}
/* --- ナビ：話して行き先→地図アプリで道案内、今いる場所を送る、近くのトイレ・喫煙所 --- */
const NAVIMODE={car:['🚗','車','driving'],walk:['🚶','歩き','walking'],train:['🚃','電車','transit']};
function naviGo(dest){ if(!dest) return; const m=NAVIMODE[S.set.naviMode||'car'][2];
  location.href=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=${m}&dir_action=navigate`; }
function vNavi(){
  const md=S.set.naviMode||'car';
  const pls=(S.places||[]).filter(p=>p.addr).slice(0,6);
  return sub('ナビ',`<div class="sec navi-big">
    <button class="btn navimic" data-act="navimic"><span class="em">🎤</span><span><b>行き先を話す</b><small>話し終わると、すぐ道案内が始まります</small></span></button>
    <form data-form="navi" class="kuro-f"><input class="search" name="dest" type="search" placeholder="行き先（例：静岡駅、○○病院）" aria-label="行き先"><button class="btn">案内</button></form>
    <div class="chips cwrap">${Object.entries(NAVIMODE).map(([k,[em,n]])=>`<button class="chip" aria-pressed="${md===k}" data-act="navimode" data-c="${k}">${em} ${n}</button>`).join('')}</div>
    ${pls.length?`<h3 style="margin:10px 0 4px">よく行く場所</h3><div class="list">${pls.map(p=>`<button class="row" data-act="navito" data-d="${h(p.addr)}"><span class="em">📍</span><span class="t"><b>${h(p.name)}</b><span>${h(p.addr)}</span></span><span class="go">🧭</span></button>`).join('')}</div>`:''}</div>
   <div class="sec"><h3>📍 今いる場所を送る</h3><p class="small" style="margin:0 0 8px">待ち合わせで「今ここにいるよ」と知らせたいときに。押すと、今いる場所の地図のリンクを、LINEやメールで送れます。相手が開くと、その場所が拡大された地図で見られます。</p>
    <div class="btns"><button class="btn" data-act="hereshare">📤 今いる場所を送る</button><button class="btn plain" data-act="heremap">🗺️ 地図で見る</button></div></div>
   <div class="sec"><h3>近くをすぐ探す</h3><div class="qgrid">${[['🚻','トイレ','トイレ'],['🚬','喫煙所','喫煙所'],['🏧','ATM','ATM'],['🏪','コンビニ','コンビニ'],['⛽','ガソリン','ガソリンスタンド'],['🅿️','駐車場','駐車場']].map(([em,n,q])=>`<a class="qgb" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('近くの'+q)}"><span class="em">${em}</span>${n}</a>`).join('')}</div>
    <p class="small muted" style="margin:6px 0 0">地図のアプリで、今いる場所の近くを探します。</p></div>`,{crumb:'トップ'});
}
function hereGet(cb){
  if(!navigator.geolocation){ toast('このスマホでは場所がわかりません'); return; }
  toast('📍 今いる場所を調べています…');
  navigator.geolocation.getCurrentPosition(p=>cb(p.coords.latitude.toFixed(6),p.coords.longitude.toFixed(6)),()=>toast('場所を使う許可が必要です'),{enableHighAccuracy:true,timeout:15000});
}
/* --- お薬（ふだんのモード）：1行で「今日の分は飲みました」 --- */
function medLine(){
  const t=today(); if(isOff('健康')||isOff('健康/健康管理')) return '';
  const ds=dosesOn(t); const low=(S.meds||[]).filter(lowStock); if(!ds.length&&!low.length) return '';
  const all=ds.length&&ds.every(d=>taken(t,d.key));
  return `<div class="medline ${all?'ok':''}"><button class="mlt" data-go="meds">💊 お薬</button>${ds.length?`<button class="mlb" data-act="medall">${all?'✓ OK！ 今日の分は飲みました':'今日の分は飲みました'}</button>`:''}</div>
   ${low.map(m=>`<p class="small" style="margin:4px 0 0;color:var(--warn);font-weight:700">⚠ ${h(m.name)}が残り${h(m.left)}${h(m.unit||'')}です</p>`).join('')}`;
}
Object.assign(ACTS,{
  cglow:()=>{ const o=['off','night','on']; const n=o[(o.indexOf(S.set.clockGlow||'off')+1)%3]; S.set.clockGlow=n; save(); render(); toast({off:'時計：光らない',night:'時計：夜（6時〜朝6時）だけ光る',on:'時計：いつも光る'}[n]); },
  kmic:()=>listen(t=>go('kuro/'+t,true)),
  navimic:()=>listen(t=>{ toast('🧭 「'+t+'」へ案内します'); setTimeout(()=>naviGo(t),600); }),
  navimode:(el,d)=>{ S.set.naviMode=d.c; save(); render(); },
  navito:(el,d)=>naviGo(d.d),
  hereshare:()=>hereGet((a,b)=>{ const url=`https://www.google.com/maps/search/?api=1&query=${a},${b}`; const text='今ここにいます（地図を開くと場所がわかります）';
    if(navigator.share) navigator.share({title:'今いる場所',text,url}).catch(()=>{});
    else { try{ navigator.clipboard.writeText(text+'\n'+url); toast('地図のリンクを写しました。LINEなどに貼ってください'); }catch(e){ location.href=url; } } }),
  heremap:()=>hereGet((a,b)=>{ location.href=`https://www.google.com/maps/search/?api=1&query=${a},${b}`; }),
  medall:()=>{ const t=today(); const ds=dosesOn(t); S.medlog=S.medlog||{}; const day=S.medlog[t]=S.medlog[t]||{};
    const all=ds.every(d=>day[d.key]);
    if(all){ ds.forEach(d=>{ delete day[d.key]; medStep(d.med,-1); }); toast('取り消しました'); }
    else { const n=new Date(); const hm=pad(n.getHours())+':'+pad(n.getMinutes()); ds.forEach(d=>{ if(!day[d.key]){ day[d.key]=hm; medStep(d.med,1); } }); toast('✓ OK！ 今日の分に飲んだ印を付けました'); }
    save(); render(); }
});
FORMS.kuro=(f,fd)=>{ go('kuro/'+String(fd.get('q')||'').trim(),true); };
FORMS.navi=(f,fd)=>{ naviGo(String(fd.get('dest')||'').trim()); };
/* ストップウォッチとタイマーを、なめらかに動かす（画面の書きかえに合わせて） */
(function smooth(){ const sw=document.getElementById('swT'); if(sw&&T.swRun) sw.textContent=fmtSW(swNow());
  const tm=document.getElementById('tmT'); if(tm&&T.timerRun) tm.textContent=fmtMS(T.timerEnd-Date.now());
  requestAnimationFrame(smooth); })();
/* 学生モードの9マス */
function stuCells9(){
  const t=today();
  return [['📰','ニュース','node/NEWS・知識/NEWS'],['✅','やること','todo'],['🏫','時間割・テスト','school'],['🧠','脳トレ','brain'],['📖','辞書','dict'],['📞','家族に連絡','famcall'],['🌤️','天気','weather'],['📝','メモ','memo'],['🎈','おたのしみ','node/おたのしみ']]
    .map(([e,n,r])=>`<button class="cell" data-go="${r}"><span class="em">${e}</span><span class="nm">${n}</span></button>`).join('');
}
/* よく電話する人／よく電話する店・施設／よく使うゲーム：4つずつワンタッチ */
function quickRows(){
  const md=S.set.mode; if(md!=='elder'&&md!=='student') return '';
  const four=(arr,cls,empty,go)=>{ const out=arr.slice(0,4).map(x=>x); while(out.length<4) out.push(null);
    return `<div class="qrow ${cls}">${out.map(x=>x||`<button class="qr empty" data-go="${go}"><span class="em">＋</span><span>${empty}</span></button>`).join('')}</div>`; };
  const ppl=S.people.filter(p=>p.fav&&(p.phones||[]).some(x=>x.num)).map(p=>`<a class="qr" href="${telHref(p.phones.find(x=>x.num).num)}">${face(p,30)}<span>${h(p.name)}</span></a>`);
  let html=four(ppl,'tel','電話する人','people');
  if(md==='elder'){ const pls=(S.places||[]).filter(p=>p.often&&p.tel).map(p=>`<a class="qr" href="${telHref(p.tel)}"><span class="em">${BIG_EMOJI[(p.big||[])[0]]||'🏢'}</span><span>${h(p.name)}</span></a>`);
    html+=four(pls,'shop','お店・施設','places'); }
  else { const gs=(S.set.games||[]).map(g=>`<a class="qr" target="_blank" rel="noopener" href="${h(g.url)}"><span class="em">🎮</span><span>${h(g.name)}</span></a>`);
    html+=four(gs,'game','ゲーム','games'); }
  return html+`<p class="small muted qnote">${md==='elder'?'人物帳で「よく電話する人」、施設帳で「よく行く」に印を付けて電話番号を入れると、ここに並びます。':'人物帳で「よく電話する人」に印を付けると上の段に、下の段には好きなゲームのリンクを入れられます。'}</p>`;
}
function vGames(){
  const gs=S.set.games||[];
  return sub('よく使うゲーム',`${sayBoo('よく遊ぶゲームのページを4つまで、トップに並べられるよ。ゲームのページを開いて、上のアドレスを写して貼り付けてね。')}
   <div class="list">${gs.map((g,i)=>`<div class="row"><span class="em">🎮</span><span class="t"><b>${h(g.name)}</b><span>${h(g.url)}</span></span><button class="mini" data-act="gamedel" data-i="${i}">消す</button></div>`).join('')||'<p class="muted">まだありません。</p>'}</div>
   ${gs.length<4?`<form data-form="game" class="sec"><div class="f"><label>名前</label><input name="name" placeholder="例：パズル" required></div><div class="f"><label>アドレス（https://〜）</label><input name="url" type="url" placeholder="https://" required></div><button class="btn">入れる</button></form>`:''}`,{crumb:'トップ'});
}
FORMS.game=(f,fd)=>{ const url=String(fd.get('url')||'').trim(); if(!/^https?:\/\//.test(url)){ toast('https:// で始まるアドレスを入れてください'); return; }
  S.set.games=S.set.games||[]; S.set.games.push({name:String(fd.get('name')).trim(),url}); save(); toast('入れました'); render(); };
Object.assign(ACTS,{ gamedel:(el,d)=>{ S.set.games.splice(+d.i,1); save(); render(); } });
/* カレンダー：1週間を大きな字で（その週の予定を全部、文字で並べる） */
function calWeek(ym){
  const t=today(); let st=UI.calWk||'';
  if(!st||st.slice(0,7)!==ym&&ymd(new Date(parseD(st).getTime()+6*864e5)).slice(0,7)!==ym){ const base=ym===t.slice(0,7)?t:ym+'-01'; const d=parseD(base); d.setDate(d.getDate()-d.getDay()); st=ymd(d); }
  const sd=parseD(st); const days=[...Array(7)].map((_,i)=>{const d=new Date(sd); d.setDate(sd.getDate()+i); return ymd(d);});
  const pw=ymd(new Date(sd.getTime()-7*864e5)), nw=ymd(new Date(sd.getTime()+7*864e5));
  const rows=days.map(s=>{ const its=itemsOn(s,UI.calCat); const d=parseD(s); const hj=holJP(s);
    return `<button class="wkrow ${s===t?'today':''}" data-go="day/${s}"><span class="wkd ${dayClass(s)}"><b>${d.getMonth()+1}/${d.getDate()}</b>${WD[d.getDay()]}</span><span class="wki">${hj?`<i class="hol">${h(hj)}</i>`:''}${its.length?its.map(it=>`<span class="wke"><i style="background:${it.color}"></i>${it.k==='bd'?'🎂'+h(it.p.name)+'の誕生日':it.k==='an'?(it.a.em||'💐')+h(it.a.name):(it.e.time?`<em>${it.e.time.replace(/^0/,'')}</em>`:'')+h(it.e.title)}</span>`).join(''):'<span class="muted">予定なし</span>'}</span></button>`; }).join('');
  return `<div class="wknav"><button class="btn plain" data-act="calwk" data-c="${pw}">◀ 前の週</button><button class="btn plain" data-act="calwk" data-c="${nw}">次の週 ▶</button></div><div class="wk ${S.set.calBig?'calbig':''}">${rows}</div>`;
}
Object.assign(ACTS,{
  calview:(el,d)=>{ S.set.calView=d.c; UI.calWk=''; save(); render(); },
  calbig:(el,d)=>{ S.set.calBig=d.c; save(); render(); },
  calwk:(el,d)=>{ UI.calWk=d.c; const ym=d.c.slice(0,7); go('cal/'+ym,true); }
});
/* いまどの段にいるか：1段目（赤）→2段目（青）→3段目（黄） */
const LVNAME={r:['1段目','大きい入口'],b:['2段目','中の入口'],y:['3段目','機能']};
function lvBand(n){ const path=[]; let x=n; while(x){ path.unshift(x); x=NODES[x.parent]; }
  return `<div class="lvband">${path.map(p=>`<button class="lvchip lv-${p.lv}" ${p===n?'aria-current="page"':`data-act="open" data-id="${h(p.id)}"`}><i>${LVNAME[p.lv][0]}</i>${h(p.name)}</button>`).join('<span class="lvsep">›</span>')}</div>`; }
/* メニューの全体図：赤→青→黄の一覧 */
function vMenuMap(){
  const reds=TREE.map(r=>NODES[r.name]).filter(n=>n&&!isOff(n.id));
  return sub('メニューの全体図',`<p class="small" style="margin:0 0 8px">色で段がわかります。<span class="lvchip lv-r"><i>1段目</i>赤</span> <span class="lvchip lv-b"><i>2段目</i>青</span> <span class="lvchip lv-y"><i>3段目</i>黄</span>　押すとその画面が開きます。</p>
  ${reds.map(r=>`<details class="mm" ${UI.mmOpen===r.id?'open':''}><summary class="mmr"><span class="em">${emojiOf(r.id)}</span>${h(r.name)}<span class="small">（${r.kids.filter(k=>!isOff(k)).length}）</span></summary>
    ${r.kids.filter(k=>!isOff(k)).map(b=>{ const bn=NODES[b]; return `<div class="mmb"><button class="mmbh" data-act="open" data-id="${h(b)}">${emojiOf(b)} ${h(bn.name)}</button><div class="mmys">${bn.kids.filter(k=>!isOff(k)).map(y=>`<button class="mmy ${hasImpl(y)?'ok':''}" data-act="open" data-id="${h(y)}">${h(NODES[y].name)}</button>`).join('')}</div></div>`; }).join('')}</details>`).join('')}
  <p class="small muted">黄色の濃いボタンは使える機能、うすいボタンは準備中です。</p>`,{crumb:'設定・機能'});
}
/* ===== 郵便番号（無料のHeartRails Geo APIをJSONPで使う。登録や費用はなし） ===== */
function geoapi(params){ return new Promise((ok,ng)=>{ const cb='geo'+Date.now().toString(36)+Math.floor(Math.random()*1e4); const sc=document.createElement('script');
  const t=setTimeout(()=>{ cleanup(); ng(new Error('timeout')); },10000);
  function cleanup(){ clearTimeout(t); delete window[cb]; sc.remove(); }
  window[cb]=d=>{ cleanup(); ok(d&&d.response||{}); };
  sc.src='https://geoapi.heartrails.com/api/json?'+new URLSearchParams({...params,jsonp:cb}).toString(); sc.onerror=()=>{ cleanup(); ng(new Error('net')); }; document.head.appendChild(sc); }); }
const zfmt=z=>{ z=String(z||'').replace(/[^0-9]/g,''); return z.length===7?z.slice(0,3)+'-'+z.slice(3):z; };
async function zipToAddr(z){ z=String(z||'').replace(/[^0-9]/g,''); if(z.length!==7) return []; const r=await geoapi({method:'searchByPostal',postal:z}); return (r.location||[]).map(x=>x.prefecture+x.city+x.town); }
async function addrToZip(a){ a=String(a||'').replace(/\s/g,''); const p=prefOf(a); if(!p) return [];
  let rest=a.slice(a.startsWith(p)?p.length:p.replace(/[都府県]$/,'').length); const m=rest.match(/^(.+?市.+?区|.+?郡.+?[町村]|.+?市|.+?区|.+?[町村])/); if(!m) return [];
  const city=m[1]; const town=rest.slice(city.length).replace(/[0-9０-９\-－ー丁目番地号].*$/,'');
  const r=await geoapi({method:'getTowns',prefecture:p,city}); const ts=(r.location||[]);
  let hit=town?ts.filter(x=>town.startsWith(x.town.replace(/（.*$/,''))||x.town.startsWith(town)):[];
  hit.sort((x,y)=>y.town.length-x.town.length);
  return hit.slice(0,8).map(x=>({zip:zfmt(x.postal),addr:x.prefecture+x.city+x.town})); }
/* 住所を入れたら郵便番号を自動で（郵便番号が空のときだけ）。郵便番号を7けた入れたら住所を自動で（住所が空のときだけ） */
function zipAfter(){
  for(const [zid,aid] of [['p-zip','p-addr'],['pf-zip','pf-addr']]){ const z=$('#'+zid), a=$('#'+aid); if(!z||!a||z.dataset.zw) continue; z.dataset.zw='1';
    a.addEventListener('change',async()=>{ if(z.value.trim()) return; try{ const r=await addrToZip(a.value); if(r.length){ z.value=r[0].zip; toast('〒'+r[0].zip+' を入れました'); } }catch(e){} });
    z.addEventListener('input',async()=>{ const v=z.value.replace(/[^0-9]/g,''); if(v.length!==7||a.value.trim()) return; try{ const r=await zipToAddr(v); if(r.length){ a.value=r[0]; z.value=zfmt(v); toast('住所を入れました。番地を足してください'); } }catch(e){} });
  }
}
function vZip(){
  return sub('郵便番号を調べる',`<div class="sec"><h3>〒から住所</h3><form data-form="zip1" class="kuro-f"><input class="search" name="z" inputmode="numeric" placeholder="例：420-0853" aria-label="郵便番号"><button class="btn">調べる</button></form><div id="zip1r"></div></div>
   <div class="sec"><h3>住所から〒</h3><form data-form="zip2" class="kuro-f"><input class="search" name="a" placeholder="例：静岡県静岡市葵区追手町" aria-label="住所"><button class="btn">調べる</button></form><div id="zip2r"></div>
   <p class="small muted" style="margin:6px 0 0">都道府県から町の名前まで入れると見つかります。人物帳やプロフィールで住所を入れると、郵便番号は自動で入ります。</p></div>
   <p class="small muted">無料の郵便番号の案内サービスを使っています。</p>`,{crumb:'設定・機能'});
}
FORMS.zip1=async(f,fd)=>{ const o=$('#zip1r'); o.innerHTML='<p class="muted">調べています…</p>'; try{ const r=await zipToAddr(fd.get('z')); o.innerHTML=r.length?r.map(x=>`<div class="row"><span class="t"><b>${h(x)}</b></span></div>`).join(''):'<p class="muted">見つかりませんでした。7けたで入れてください。</p>'; }catch(e){ o.innerHTML='<p class="muted">つながりませんでした。電波のよいところでもう一度。</p>'; } };
FORMS.zip2=async(f,fd)=>{ const o=$('#zip2r'); o.innerHTML='<p class="muted">調べています…</p>'; try{ const r=await addrToZip(fd.get('a')); o.innerHTML=r.length?r.map(x=>`<div class="row"><span class="t"><b>〒${h(x.zip)}</b><span>${h(x.addr)}</span></span></div>`).join(''):'<p class="muted">見つかりませんでした。都道府県から町の名前まで入れてください。</p>'; }catch(e){ o.innerHTML='<p class="muted">つながりませんでした。電波のよいところでもう一度。</p>'; } };

/* 人物帳：あいうえお順・ひらがなでもカタカナでも候補が出る */
const toHira=s=>String(s||'').replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const GOJU=[['あ','あいうえおぁぃぅぇぉ'],['か','かきくけこがぎぐげご'],['さ','さしすせそざじずぜぞ'],['た','たちつてとだぢづでどっ'],['な','なにぬねの'],['は','はひふへほばびぶべぼぱぴぷぺぽ'],['ま','まみむめも'],['や','やゆよゃゅょ'],['ら','らりるれろ'],['わ','わをん']];
Object.assign(ACTS,{ prow:(el,d)=>{ UI.pRow=UI.pRow===d.c?'':d.c; const l=$('#plist'); if(l){ l.innerHTML=peopleList(); $$('.gojuon button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===UI.pRow)); } else render(); } });

/* 生年月日など：年・月・日を別々に選ぶ（スマホのカレンダーで何年もさかのぼらなくてよい） */
function ymdSel(name,val,o={}){
  const [vy,vm,vd]=(val||'').split('-'); const y0=o.y0||1920, y1=o.y1||+today().slice(0,4);
  const ys=[]; for(let y=y1;y>=y0;y--) ys.push(y);
  const opt=(arr,v,lab)=>`<option value="">${lab}</option>`+arr.map(x=>`<option value="${pad(x)}" ${v&&+v===+x?'selected':''}>${x}</option>`).join('');
  return `<span class="ymd"><select class="ymd-y" aria-label="年" ${o.req?'required':''}>${ys.map(y=>`<option value="${y}" ${+vy===y?'selected':''}>${y}年（${wareki(y+'-07-01').replace(/年.*/,'年')}）</option>`).join('').replace(/^/,`<option value="">年</option>`)}</select><select class="ymd-m" aria-label="月" ${o.req?'required':''}>${opt([...Array(12)].map((_,i)=>i+1),vm,'月')}</select><select class="ymd-d" aria-label="日" ${o.req?'required':''}>${opt([...Array(31)].map((_,i)=>i+1),vd,'日')}</select><input type="hidden" name="${name}" value="${h(val||'')}"></span>`;
}
document.addEventListener('change',e=>{ const w=e.target.closest&&e.target.closest('.ymd'); if(!w) return;
  const y=w.querySelector('.ymd-y').value, m=w.querySelector('.ymd-m').value, d=w.querySelector('.ymd-d').value;
  w.querySelector('input[type=hidden]').value=y&&m&&d?`${y}-${m}-${d}`:''; });
