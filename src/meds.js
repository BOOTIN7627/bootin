/* ===== お薬（健康 › 健康管理） ===== */
const SLOTS=[['b','朝'],['l','昼'],['d','夕'],['s','寝る前']];
const TIMINGS=[['before','食前',-30,'食事の30分前'],['just','食直前',-5,'食事のすぐ前'],['right','食直後',5,'食事のすぐ後'],['after','食後',30,'食事の30分後'],['between','食間',120,'食事の2時間後'],['none','食事に関係なく',0,'食事の時刻']];
const SLOTNAME=Object.fromEntries(SLOTS); const TIMING=Object.fromEntries(TIMINGS.map(t=>[t[0],t]));
const UNITS=['錠','包','カプセル','mL','滴','枚','回','本'];
function mealTime(slot){ const m=S.set.meal||{b:'07:00',l:'12:00',d:'18:00',s:'22:00'}; return m[slot]; }
const addMin=(hm,n)=>{const [h,m]=hm.split(':').map(Number);let t=Math.max(0,Math.min(23*60+59,h*60+m+n));return pad(Math.floor(t/60))+':'+pad(t%60);};
function slotTime(med,slot){ if(slot==='s') return addMin(mealTime('s'),-30); return addMin(mealTime(slot),TIMING[med.timing||'after'][2]); }
function medActiveOn(med,s){
  if(med.freq==='prn') return false;
  if(med.start&&s<med.start) return false; if(med.end&&s>med.end) return false;
  if(med.freq==='weekly') return (med.days||[]).includes(parseD(s).getDay());
  if(med.freq==='every'){ const st=med.start||S.set.started||s; const n=Math.max(2,+med.every||2); const diff=dnum(s)-dnum(st); return diff>=0&&diff%n===0; }
  return true;
}
function dosesOn(s){
  const out=[];
  for(const m of S.meds||[]){ if(!medActiveOn(m,s)) continue;
    for(const sl of m.slots||[]) out.push({med:m,key:m.id+'|'+sl,label:SLOTNAME[sl],time:slotTime(m,sl),how:sl==='s'?'寝る前':TIMING[m.timing||'after'][1]});
    for(const t of m.times||[]) if(t) out.push({med:m,key:m.id+'|t'+t,label:'',time:t,how:'時刻を決めて'});
  }
  return out.sort((a,b)=>a.time.localeCompare(b.time));
}
const taken=(s,key)=>((S.medlog||{})[s]||{})[key];
function medFreqText(m){
  if(m.freq==='prn') return '頓服（必要なときだけ）';
  if(m.freq==='weekly') return (m.days&&m.days.length===1?'週1回 ':'')+(m.days||[]).map(d=>WD[d]).join('・')+'曜日';
  if(m.freq==='every') return (+m.every||2)===2?'1日おき':`${+m.every}日ごと`;
  return '毎日';
}
function medSchedText(m){
  if(m.freq==='prn') return '頓服（必要なときだけ）';
  const parts=(m.slots||[]).map(sl=>SLOTNAME[sl]); const t=(m.times||[]).filter(Boolean);
  return `${medFreqText(m)}・${parts.join('・')}${parts.length&&!(parts.length===1&&m.slots[0]==='s')?'　'+TIMING[m.timing||'after'][1]:''}${t.length?(parts.length?'・':'')+t.join('、'):''}`;
}
function lowStock(m){ return m.left!==''&&m.left!=null&&+m.left<=(+m.low||0)&&+m.low>0; }
function doseBtn(d,s){ const tk=taken(s,d.key);
  return `<div class="ev" style="border-left-color:#2E8B57"><span class="tm">${d.time}</span><span class="bd"><b>💊 ${h(d.med.name)}</b><span>${d.label?h(d.label)+'・':''}${h(d.how)}${d.med.dose?'・'+h(d.med.dose)+h(d.med.unit||''):''}</span></span>
  <button class="mini ${tk?'':'navi'}" data-act="medtake" data-k="${h(d.key)}" data-s="${s}" style="align-self:center">${tk?'✓ '+tk+' 飲んだ':'飲んだ'}</button></div>`; }
function medTop(){
  const t=today(); if(isOff('健康')||isOff('健康/健康管理')) return '';
  const ds=dosesOn(t); if(!ds.length&&!(S.meds||[]).some(lowStock)) return '';
  const now=new Date(); const hm=pad(now.getHours())+':'+pad(now.getMinutes());
  const todo=ds.filter(d=>!taken(t,d.key)&&d.time<=addMin(hm,90));
  const low=(S.meds||[]).filter(lowStock);
  const rest=ds.filter(d=>!taken(t,d.key)).length;
  return `<div class="sec"><h2>💊 お薬 <button class="more" data-go="meds">お薬の一覧 ›</button></h2>
   ${todo.length?`<div class="evs">${todo.map(d=>doseBtn(d,t)).join('')}</div>`:`<p class="small muted" style="margin:0">${rest?`次は ${ds.find(d=>!taken(t,d.key)).time}（${h(ds.find(d=>!taken(t,d.key)).med.name)}）`:(ds.length?'今日の分はすべて飲みました ✓':'')}</p>`}
   ${low.map(m=>`<p class="small" style="margin:6px 0 0;color:var(--warn);font-weight:700">⚠ ${h(m.name)}が残り${h(m.left)}${h(m.unit||'')}です</p>`).join('')}</div>`;
}
function medDay(s){
  if(isOff('健康')||isOff('健康/健康管理')) return '';
  const ds=dosesOn(s); if(!ds.length) return '';
  return `<div class="sec"><h3>💊 この日のお薬</h3><div class="evs">${ds.map(d=>doseBtn(d,s)).join('')}</div></div>`;
}
function vMeds(){
  const t=today(); const ds=dosesOn(t); const m=S.set.meal;
  const node=NODES['健康/健康管理/健康管理'];
  return sub('お薬',`
  ${ds.length?`<div class="sec"><h3>今日の分</h3><div class="evs">${ds.map(d=>doseBtn(d,t)).join('')}</div></div>`:''}
  <div class="list" style="margin-top:10px">${(S.meds||[]).length?(S.meds||[]).map(x=>`<button class="row" data-go="medit/${x.id}"><span class="em">💊</span><span class="t"><b>${h(x.name)}</b><span>${h(medSchedText(x))}</span>${x.left!==''&&x.left!=null?`<span style="${lowStock(x)?'color:var(--warn);font-weight:700':''}">残り ${h(x.left)}${h(x.unit||'')}${lowStock(x)?'（少なくなりました）':''}</span>`:''}</span>${x.freq==='prn'?`<span class="mini navi" data-act="medprn" data-id="${x.id}">飲んだ</span>`:''}<span class="go">›</span></button>`).join(''):`<div class="empty">${BOO_IMG}飲んでいるお薬を登録すると、飲む時刻に合わせてお知らせし、飲んだ印と残りの数を管理できるよ。</div>`}</div>
  <div class="btns"><button class="btn" data-go="medit/new">＋ お薬を登録</button></div>
  <details class="tree" style="margin-top:12px"><summary>⏰ 食事と寝る時刻（お知らせの基準）</summary><form data-form="meal" style="padding:0 12px 12px">
    <p class="small muted" style="margin:0">お知らせの時刻は、この時刻から決まります。食前＝30分前、食直前＝5分前、食直後＝5分後、食後＝30分後、食間＝2時間後、寝る前＝寝る時刻の30分前。</p>
    <div class="two"><div class="f"><label for="ml-b">朝食</label>${timeSel('b',m.b,'ml-b')}</div><div class="f"><label for="ml-l">昼食</label>${timeSel('l',m.l,'ml-l')}</div></div>
    <div class="two"><div class="f"><label for="ml-d">夕食</label>${timeSel('d',m.d,'ml-d')}</div><div class="f"><label for="ml-s">寝る</label>${timeSel('s',m.s,'ml-s')}</div></div>
    <div class="btns"><button class="btn" type="submit">登録する</button></div></form></details>
  <div class="sec"><h3>🔔 お知らせについて</h3><p class="small" style="margin:0">BOOTINを開いている間は、飲む時刻に音と表示でお知らせします。${'Notification' in window&&!IN_FRAME?`<button class="mini" data-act="notifyok">スマホの通知も許可する</button>`:''}<br>アプリを閉じているときは確実には鳴らせないため、大事なお薬はスマホの時計アプリのアラームも一緒に使ってください（下の時刻を目安に）。</p>
    ${ds.length?`<p class="small muted" style="margin:6px 0 0">今日の時刻：${[...new Set(ds.map(d=>d.time))].join('、')}</p>`:''}</div>
  ${node?`<details class="tree" style="margin-top:10px"><summary>健康管理のほかの記録（準備中）</summary><ul class="plan" style="padding:0 12px 12px">${node.items.filter(x=>!/薬/.test(x[0])).map(([t,c,w])=>`<li>${WHEN[w]?`<span class="when ${WHEN[w][0]}">${WHEN[w][1]}</span>`:''}<span>${h(t)}</span></li>`).join('')}</ul></details>`:''}`,{crumb:'健康 › 健康管理'});
}
function vMedEdit(id){
  const isNew=id==='new'; const m=isNew?{name:'',purpose:'',dose:'1',unit:'錠',slots:['b'],timing:'after',times:[],freq:'daily',days:[],every:2,start:today(),end:'',left:'',low:'',placeId:'',photo:'',memo:''}:(S.meds||[]).find(x=>x.id===id);
  if(!m) return sub('お薬','<p>見つかりませんでした。</p>');
  const pls=S.places.filter(p=>(p.big||[]).includes('医療')).concat(S.places.filter(p=>!(p.big||[]).includes('医療')));
  const fq=(v,t)=>`<label><input type="radio" name="freq" value="${v}" ${m.freq===v?'checked':''}>${t}</label>`;
  return sub(isNew?'お薬を登録':'お薬の登録を直す',`<form data-form="med" data-id="${isNew?'':m.id}">
  <div class="f"><label for="md-name">お薬の名前</label><input id="md-name" name="name" required value="${h(m.name)}" placeholder="例：アムロジピン、血圧の薬"></div>
  <div class="f"><label for="md-pur">何のお薬か</label><input id="md-pur" name="purpose" value="${h(m.purpose||'')}" placeholder="例：血圧を下げる"></div>
  <div class="two"><div class="f"><label for="md-dose">1回の量</label><input id="md-dose" name="dose" inputmode="decimal" value="${h(m.dose||'')}"></div><div class="f"><label for="md-unit">単位</label><select id="md-unit" name="unit">${UNITS.map(u=>`<option ${m.unit===u?'selected':''}>${u}</option>`).join('')}</select></div></div>
  <div class="f"><span class="lb">飲む日</span><div class="choose" id="md-freq">${fq('daily','毎日')}${fq('weekly','曜日を決める（週1回など）')}${fq('every','1日おき・○日ごと')}${fq('prn','頓服（必要なときだけ）')}</div></div>
  <div class="f" id="md-days" ${m.freq==='weekly'?'':'hidden'}><span class="lb">曜日（週1回なら1つだけ）</span><div class="choose">${[...WD].map((w,i)=>`<label><input type="checkbox" name="days" value="${i}" ${(m.days||[]).includes(i)?'checked':''}>${w}</label>`).join('')}</div></div>
  <div class="f" id="md-every" ${m.freq==='every'?'':'hidden'}><label for="md-ev">何日ごと（2＝1日おき）</label><input id="md-ev" name="every" type="number" min="2" max="60" value="${h(m.every||2)}"></div>
  <div id="md-when" ${m.freq==='prn'?'hidden':''}>
  <div class="f"><span class="lb">飲む時（いくつでも）</span><div class="choose">${SLOTS.map(([k,t])=>`<label><input type="checkbox" name="slots" value="${k}" ${(m.slots||[]).includes(k)?'checked':''}>${t}</label>`).join('')}</div></div>
  <div class="f"><span class="lb">食事との関係</span><div class="choose">${TIMINGS.map(([k,t,,d])=>`<label title="${d}"><input type="radio" name="timing" value="${k}" ${(m.timing||'after')===k?'checked':''}>${t}</label>`).join('')}</div></div>
  <div class="two"><div class="f"><label for="md-t0">時刻を決めて飲む（任意）</label>${timeSel('t0',(m.times||[])[0],'md-t0')}</div><div class="f"><label for="md-t1">もう1つ</label>${timeSel('t1',(m.times||[])[1],'md-t1')}</div></div>
  <div class="two"><div class="f"><label for="md-st">飲み始め</label><input id="md-st" type="date" name="start" value="${h(m.start||'')}"></div><div class="f"><label for="md-en">飲み終わり（決まっていれば）</label><input id="md-en" type="date" name="end" value="${h(m.end||'')}"></div></div>
  </div>
  <div class="two"><div class="f"><label for="md-left">いま残っている数</label><input id="md-left" name="left" type="number" min="0" step="0.5" value="${h(m.left??'')}" placeholder="例：28"></div><div class="f"><label for="md-low">この数以下で知らせる</label><input id="md-low" name="low" type="number" min="0" value="${h(m.low??'')}" placeholder="例：7"></div></div>
  <div class="f"><label for="md-pl">もらっている病院・薬局（施設帳から）</label><select id="md-pl" name="placeId"><option value="">― 選ばない ―</option>${pls.map(p=>`<option value="${p.id}" ${m.placeId===p.id?'selected':''}>${h(p.name)}</option>`).join('')}</select></div>
  <div class="f"><span class="lb">お薬手帳・袋の写真</span><div class="photo-pick"><span id="md-prev">${m.photo?`<img src="${m.photo}" alt="" style="height:70px;border-radius:8px">`:''}</span><input type="file" id="md-file" accept="image/*"><input type="hidden" name="photo" id="md-photo" value="${h(m.photo||'')}"></div></div>
  <div class="f"><label for="md-memo">メモ</label><textarea id="md-memo" name="memo" placeholder="飲み合わせの注意など">${h(m.memo||'')}</textarea></div>
  <div class="btns"><button class="btn" type="submit">登録する</button>${isNew?'':`<button class="btn danger" type="button" data-act="delmed" data-id="${m.id}">${UI.confirm==='md'+m.id?'本当に削除する':'このお薬を削除'}</button>`}</div></form>`,{crumb:'健康 › 健康管理 › お薬'});
}
function medAfter(){
  const fr=$('#md-freq'); if(fr) fr.addEventListener('change',()=>{ const v=$('#md-freq input:checked').value; $('#md-days').hidden=v!=='weekly'; $('#md-every').hidden=v!=='every'; $('#md-when').hidden=v==='prn'; });
  const f=$('#md-file'); if(f) f.addEventListener('change',async()=>{ const x=f.files[0]; if(!x) return; try{ const d=await readPhoto(x,900); $('#md-photo').value=d; $('#md-prev').innerHTML=`<img src="${d}" alt="" style="height:70px;border-radius:8px">`; }catch(e){ toast('写真を読み込めませんでした'); } });
}
function medStep(m,sign){ if(m.left===''||m.left==null) return; const q=parseFloat(m.dose)||1; m.left=Math.max(0,Math.round((+m.left-sign*q)*10)/10); }
const MED_ACTS={
  medtake:(el,d)=>{ const [mid]=d.k.split('|'); const m=(S.meds||[]).find(x=>x.id===mid); S.medlog=S.medlog||{}; const day=S.medlog[d.s]=S.medlog[d.s]||{};
    if(day[d.k]){ delete day[d.k]; if(m) medStep(m,-1); toast('取り消しました'); }
    else { const n=new Date(); day[d.k]=pad(n.getHours())+':'+pad(n.getMinutes()); if(m) medStep(m,1); toast('○ 飲んだ印を付けました'); }
    save(); render(); },
  medprn:(el,d,ev)=>{ ev.stopPropagation(); const m=(S.meds||[]).find(x=>x.id===d.id); if(!m) return; const n=new Date(); const t=today(); S.medlog=S.medlog||{}; const day=S.medlog[t]=S.medlog[t]||{}; day[m.id+'|p'+pad(n.getHours())+pad(n.getMinutes())]=pad(n.getHours())+':'+pad(n.getMinutes()); medStep(m,1); save(); toast('○ 飲んだ記録を付けました'); render(); },
  delmed:(el,d)=>{ if(UI.confirm!=='md'+d.id){UI.confirm='md'+d.id; render(); return;} S.meds=S.meds.filter(x=>x.id!==d.id); save(); toast('削除しました'); UI.confirm=''; stack=['home']; go('meds',false); },
  notifyok:async()=>{ try{ const r=await Notification.requestPermission(); toast(r==='granted'?'通知を許可しました':'通知は許可されませんでした'); }catch(e){ toast('この画面では通知が使えません'); } },
};
const MED_FORMS={
  med:(f,fd)=>{
    const id=f.dataset.id; S.meds=S.meds||[]; const m=id?S.meds.find(x=>x.id===id):{id:uid()};
    const tm=k=>fd.get(k+'_h')?fd.get(k+'_h')+':'+fd.get(k+'_m'):'';
    Object.assign(m,{name:fd.get('name').trim(),purpose:fd.get('purpose').trim(),dose:fd.get('dose').trim(),unit:fd.get('unit'),freq:fd.get('freq')||'daily',days:fd.getAll('days').map(Number),every:+fd.get('every')||2,
      slots:fd.getAll('slots'),timing:fd.get('timing')||'after',times:[tm('t0'),tm('t1')].filter(Boolean),start:fd.get('start')||'',end:fd.get('end')||'',left:fd.get('left')===''?'':+fd.get('left'),low:fd.get('low')===''?'':+fd.get('low'),placeId:fd.get('placeId')||'',photo:fd.get('photo')||'',memo:fd.get('memo').trim()});
    if(m.freq==='weekly'&&!m.days.length){ toast('曜日を選んでください'); return; }
    if(m.freq!=='prn'&&!m.slots.length&&!m.times.length){ toast('飲む時（朝・昼など）か時刻を選んでください'); return; }
    if(!id) S.meds.push(m); save(); toast('お薬を登録しました'); go('meds',true);
  },
  meal:(f,fd)=>{ const tm=k=>fd.get(k+'_h')?fd.get(k+'_h')+':'+fd.get(k+'_m'):''; S.set.meal={b:tm('b')||'07:00',l:tm('l')||'12:00',d:tm('d')||'18:00',s:tm('s')||'22:00'}; save(); toast('登録しました'); render(); }
};
/* 開いている間のお知らせ */
const medAlerted=new Set();
function medCheck(){
  const now=new Date(); const hm=pad(now.getHours())+':'+pad(now.getMinutes()); const t=today();
  for(const d of dosesOn(t)){ const k=t+d.key; if(d.time===hm&&!taken(t,d.key)&&!medAlerted.has(k)){ medAlerted.add(k); beep(); toast(`💊 ${d.med.name}（${d.label||''}${d.how}）の時間です`);
    try{ if('Notification' in window&&Notification.permission==='granted') new Notification('BOOTIN お薬の時間',{body:`${d.med.name}（${d.label||''}${d.how}）`,icon:'icon-192.png'}); }catch(e){}
    if(cur()==='home') render(); } }
}
