
/* ===== 旅行計画（10件まで。行き先ごとの住所・電話・HP・メモ、順路と時間と交通手段）=====
   S.trips=[{id,name,from,to,memo,stops:[{id,day,time,name,addr,tel,hp,memo,move}]}] */
const MOVES=['','🚃 電車','🚗 車','🚌 バス','🚢 船','✈️ 飛行機','🚶 歩き','🚕 タクシー'];
function vTrips(id){
  const L=S.trips||[]; const tr=id&&id!=='new'?L.find(x=>x.id===id):null;
  if(id==='new'||(tr&&UI.tripEdit===tr.id)){ const x=tr||{name:'',from:'',to:'',memo:''};
    if(!tr&&L.length>=10) return sub('旅行計画','<p>旅行計画は10件までです。古いものを削除してから作ってください。</p>');
    return sub(tr?'旅行を直す':'旅行を作る',`<form class="sec" data-form="trip" data-id="${tr?tr.id:''}">
      <div class="f"><label for="tp-n">旅行の名前</label><input id="tp-n" name="name" required value="${h(x.name)}" placeholder="例：京都 紅葉旅行"></div>
      <div class="two"><div class="f"><label for="tp-f">行く日</label><input id="tp-f" type="date" name="from" value="${h(x.from)}"></div><div class="f"><label for="tp-t">帰る日</label><input id="tp-t" type="date" name="to" value="${h(x.to)}"></div></div>
      <div class="f"><label for="tp-m">メモ（持ち物、宿の予約番号ではなく宿の名前など）</label><textarea id="tp-m" name="memo" rows="3">${h(x.memo||'')}</textarea></div>
      <div class="btns"><button class="btn" type="submit">保存する</button>${tr?`<button class="btn danger" type="button" data-act="tripdel" data-id="${tr.id}">削除</button>`:''}</div></form>`,{crumb:'おたのしみ › 旅行'}); }
  if(!tr) return sub('旅行計画',`${L.length?'':sayBoo('行き先と順番を書いておくと、旅のしおりになるよ。10件まで作れるよ。')}
    <div class="list">${L.slice().sort((a,b)=>(b.from||'').localeCompare(a.from||'')).map(x=>`<button class="row" data-go="trips/${x.id}"><span class="em">🧳</span><span class="t"><b>${h(x.name)}</b><span>${x.from?jpDate(x.from,false)+(x.to&&x.to!==x.from?'〜'+(+x.to.slice(5,7))+'/'+(+x.to.slice(8)):''):'日にち未定'}・行き先${(x.stops||[]).length}か所</span></span><span class="go">›</span></button>`).join('')}</div>
    <div class="btns">${L.length<10?'<button class="btn" data-go="trips/new">＋ 旅行を作る</button>':''}</div><p class="small muted">${L.length}/10件</p>`,{crumb:'おたのしみ › 旅行'});
  const nd=tr.from&&tr.to?Math.max(1,Math.round((parseD(tr.to)-parseD(tr.from))/864e5)+1):1;
  const st=(tr.stops||[]).slice().sort((a,b)=>(a.day-b.day)||(a.time||'99').localeCompare(b.time||'99'));
  let body=''; for(let d=1;d<=nd;d++){ const ss=st.filter(s=>(+s.day||1)===d); if(nd>1) body+=`<div class="kkday">${d}日目${tr.from?`　${jpDate(addDays(tr.from,d-1))}`:''}</div>`;
    body+=ss.map(s=>`${s.move?`<div class="tpmove">${h(s.move)}</div>`:''}<div class="tpstop"><span class="tm">${h(s.time||'')}</span><span class="t"><b>${h(s.name)}</b>${s.addr?`<span>${h(s.addr)}</span>`:''}${s.memo?`<span class="small muted">${h(s.memo)}</span>`:''}
      <span class="minis">${s.addr||s.name?mapBtns(s.addr||s.name):''}${s.tel?`<a class="mini tel" href="${telHref(s.tel)}">📞 電話</a>`:''}${s.hp?`<a class="mini" href="${h(s.hp)}" target="_blank" rel="noopener">🌐 HP</a>`:''}<button class="mini" data-act="stopdel" data-id="${tr.id}" data-s="${s.id}">削除</button></span></span></div>`).join('')||(nd>1?'<p class="small muted" style="margin:0">まだありません。</p>':''); }
  return sub(tr.name,`<div class="sec"><h3>🧳 ${h(tr.name)} <button class="more" data-act="tripedit" data-id="${tr.id}">直す ›</button></h3>
    <p style="margin:0">${tr.from?jpDate(tr.from)+(tr.to&&tr.to!==tr.from?' 〜 '+jpDate(tr.to):''):'日にち未定'}</p>${tr.memo?`<p class="small" style="white-space:pre-wrap;margin:6px 0 0">${h(tr.memo)}</p>`:''}</div>
  <div class="sec"><h3>📍 行程（旅のしおり）</h3>${body||'<p class="small muted" style="margin:0">行き先を足すと、時間順に並びます。</p>'}</div>
  <form class="sec" data-form="stop" data-id="${tr.id}"><h3>＋ 行き先を足す</h3>
    <div class="f"><label for="sp-n">行き先の名前</label><input id="sp-n" name="name" required placeholder="例：清水寺"></div>
    <div class="two">${nd>1?`<div class="f"><label for="sp-d">何日目</label><select id="sp-d" name="day">${[...Array(nd)].map((_,i)=>`<option value="${i+1}">${i+1}日目</option>`).join('')}</select></div>`:'<input type="hidden" name="day" value="1">'}<div class="f"><label for="sp-t">着く時間</label><input id="sp-t" type="time" name="time"></div></div>
    <div class="f"><label for="sp-mv">ここまでの交通手段</label><select id="sp-mv" name="move">${MOVES.map(m=>`<option value="${m}">${m||'― 選ばない ―'}</option>`).join('')}</select></div>
    <div class="f"><label for="sp-a">住所</label><input id="sp-a" name="addr"></div>
    <div class="two"><div class="f"><label for="sp-tel">電話</label><input id="sp-tel" name="tel" type="tel"></div><div class="f"><label for="sp-hp">HP</label><input id="sp-hp" name="hp" type="url" placeholder="https://"></div></div>
    <div class="f"><label for="sp-m">メモ</label><input id="sp-m" name="memo" placeholder="例：拝観料 400円"></div>
    <div class="btns"><button class="btn" type="submit">足す</button></div></form>`,{crumb:'おたのしみ › 旅行'});
}
function tripOf(el){ return (S.trips||[]).find(x=>x.id===el.dataset.id); }
Object.assign(ACTS,{
  tripedit:el=>{ UI.tripEdit=el.dataset.id; render(); },
  tripdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='もう一度押すと削除'; return; } S.trips=(S.trips||[]).filter(x=>x.id!==el.dataset.id); UI.tripEdit=''; save(); go('trips',true); },
  stopdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='削除？'; return; } const t=tripOf(el); if(t){ t.stops=t.stops.filter(s=>s.id!==el.dataset.s); save(); render(); } }
});
FORMS.trip=(f,fd)=>{ S.trips=S.trips||[]; const id=f.dataset.id; const t=id?S.trips.find(x=>x.id===id):{id:uid(),stops:[]};
  Object.assign(t,{name:String(fd.get('name')).trim(),from:fd.get('from')||'',to:fd.get('to')||fd.get('from')||'',memo:String(fd.get('memo')||'').trim()}); if(!id) S.trips.push(t); UI.tripEdit=''; save(); toast('保存しました'); go('trips/'+t.id,true); };
FORMS.stop=(f,fd)=>{ const t=tripOf(f); if(!t) return; const hp=String(fd.get('hp')||'').trim();
  t.stops.push({id:uid(),day:+fd.get('day')||1,time:fd.get('time')||'',name:String(fd.get('name')).trim(),addr:String(fd.get('addr')||'').trim(),tel:String(fd.get('tel')||'').trim(),hp:/^https?:\/\//.test(hp)?hp:'',memo:String(fd.get('memo')||'').trim(),move:fd.get('move')||''}); save(); toast('足しました'); render(); };
