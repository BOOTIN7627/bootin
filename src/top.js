
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
    <div class="chips wrap">${Object.entries(NAVIMODE).map(([k,[em,n]])=>`<button class="chip" aria-pressed="${md===k}" data-act="navimode" data-c="${k}">${em} ${n}</button>`).join('')}</div>
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
