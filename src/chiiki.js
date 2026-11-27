
/* ===== 地域コミュニティ（★43 ゴミ出しの日・★44 当番の順番表・★45 回覧板・会費のメモ・★46 地域カレンダー）=====
   S.tobans=[{id,name,members:[名前],me:自分の名前,unit:'w'|'m',every:数,start:'YYYY-MM-DD'}]
   S.kairan=[{id,date,kind,text,amount,done}] */
function vChiiki(){
  const g=(S.gomi||[]).length, tb=(S.tobans||[]).length, kr=(S.kairan||[]).filter(x=>!x.done).length;
  const ev=S.events.filter(e=>e.cat==='local'&&e.date>=today()).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const row=(em,t,s,go,act)=>`<button class="row" ${act?`data-act="${act}"`:`data-go="${go}"`}><span class="em">${em}</span><span class="t"><b>${t}</b><span>${s}</span></span><span class="go">›</span></button>`;
  return sub('地域コミュニティ',`<div class="list">
    ${row('🗑️','ゴミ出しの日',g?`${g}種類を登録`:'曜日を登録すると、今日の予定に出ます','gomi')}
    ${row('🔁','当番の順番表',tb?(S.tobans.map(t=>`${h(t.name)}：今は${h(tobanNow(t).who)}さん`).join('、')):'次は誰かを自動で回します','toban')}
    ${row('📋','回覧板・会費のメモ',kr?`済んでいないもの ${kr}件`:'回覧板を回した日、会費を払った記録','kairan')}
    ${row('🏘️','地域カレンダー',ev?`次は ${+ev.date.slice(5,7)}/${+ev.date.slice(8)} ${h(ev.title)}`:'溝掃除・防災訓練・運動会など（「地域」の色）','','localcal')}
  </div>`,{crumb:'生活管理 › 日常管理'});
}
function tobanIdx(t,s){
  const n=(t.members||[]).length; if(!n||!t.start) return 0;
  let k; if(t.unit==='m'){ k=(+s.slice(0,4)-+t.start.slice(0,4))*12+(+s.slice(5,7)-+t.start.slice(5,7)); }
  else k=Math.floor((dnum(s)-dnum(t.start))/7);
  k=Math.floor(k/Math.max(1,+t.every||1)); return ((k%n)+n)%n;
}
function tobanNow(t){ const n=(t.members||[]).length; const i=tobanIdx(t,today()); return {i,who:n?t.members[i]:'',next:n?t.members[(i+1)%n]:''}; }
function tobanTag(){
  const out=[]; for(const t of S.tobans||[]){ if(!t.me) continue; const x=tobanNow(t);
    const u=t.unit==='m'?'月':'週'; if(x.who===t.me) out.push(`🔁 ${h(t.name)}：今${u}はあなたの番です`); else if(x.next===t.me) out.push(`🔁 ${h(t.name)}：次の${u}はあなたの番です`); }
  return out.length?`<button class="gomitag" data-go="toban"><span>${out.join('　')}</span></button>`:'';
}
function vToban(){
  const L=S.tobans||[]; const ed=UI.tbEdit?L.find(x=>x.id===UI.tbEdit):null; const t=ed||{name:'',members:[],me:'',unit:'w',every:1,start:today()};
  return sub('当番の順番表',`
  ${L.map(x=>{const n=tobanNow(x);return `<div class="sec"><h3>${h(x.name)} <button class="more" data-act="tbedit" data-id="${x.id}">直す ›</button></h3>
    <p style="margin:0 0 6px">今の当番：<b class="tbnow">${h(n.who)||'―'}</b>さん　<span class="small muted">次：${h(n.next)}さん（${x.every>1?x.every:''}${x.unit==='m'?'か月':'週'}ごとに交代）</span></p>
    <div class="tblist">${x.members.map((m,i)=>`<span class="${i===n.i?'on':''}">${i+1}. ${h(m)}${m===x.me?'（自分）':''}</span>`).join('')}</div></div>`;}).join('')}
  <form class="sec" data-form="toban" data-id="${ed?ed.id:''}"><h3>${ed?'直す':'＋ 順番表を作る'}</h3>
    <div class="f"><label for="tb-n">名前</label><input id="tb-n" name="name" required value="${h(t.name)}" placeholder="例：ゴミ当番、班長"></div>
    <div class="f"><label for="tb-m">回る順番（1行に1人・1軒）</label><textarea id="tb-m" name="members" rows="5" required placeholder="例：&#10;山田&#10;佐藤&#10;藤原">${h((t.members||[]).join('\n'))}</textarea></div>
    <div class="f"><label for="tb-me">この中の自分（お知らせするため）</label><input id="tb-me" name="me" value="${h(t.me||'')}" placeholder="例：藤原"></div>
    <div class="f"><span class="lb">交代するのは</span><div class="choose"><label><input type="radio" name="unit" value="w" ${t.unit!=='m'?'checked':''}>週ごと</label><label><input type="radio" name="unit" value="m" ${t.unit==='m'?'checked':''}>月ごと</label></div>
      <span class="small muted">何週・何か月ごと：</span><input name="every" type="number" min="1" max="12" value="${h(t.every||1)}" style="width:4em" aria-label="何週・何か月ごと"></div>
    <div class="f"><label for="tb-s">1番目の人の番が始まる日</label><input id="tb-s" type="date" name="start" required value="${h(t.start||today())}"></div>
    <div class="btns"><button class="btn" type="submit">${ed?'保存する':'作る'}</button>${ed?`<button class="btn plain" type="button" data-act="tbcancel">やめる</button><button class="btn danger" type="button" data-act="tbdel" data-id="${ed.id}">削除</button>`:''}</div>
    <p class="small muted" style="margin:0">自分の番と、その1つ前になると、トップの「今日の予定」にお知らせが出ます。</p></form>`,{crumb:'生活管理 › 地域コミュニティ'});
}
function vKairan(){
  const L=(S.kairan||[]).slice().sort((a,b)=>(a.done-b.done)||b.date.localeCompare(a.date));
  return sub('回覧板・会費のメモ',`<form class="sec" data-form="kairan">
    <div class="f"><div class="choose"><label><input type="radio" name="kind" value="回覧板" checked>📋 回覧板</label><label><input type="radio" name="kind" value="会費">💴 会費</label><label><input type="radio" name="kind" value="メモ">📝 メモ</label></div></div>
    <div class="two"><div class="f"><label for="kr-d">日にち</label><input id="kr-d" type="date" name="date" value="${today()}"></div><div class="f"><label for="kr-a">金額（会費のとき）</label><input id="kr-a" name="amount" inputmode="numeric" placeholder="例：3000"></div></div>
    <div class="f"><input name="text" required placeholder="例：回覧板が来た（次は佐藤さんへ）" aria-label="内容"></div>
    <div class="btns"><button class="btn" type="submit">＋ 書いておく</button></div></form>
  <div class="sec">${L.length?L.map(x=>`<div class="todo ${x.done?'done':''}"><button class="ck" data-act="krck" data-id="${x.id}" aria-label="${x.done?'済んでいないに戻す':'済んだ'}">${x.done?'✓':''}</button><span class="tdt">${x.kind==='会費'?'💴':x.kind==='回覧板'?'📋':'📝'} ${h(x.text)}${x.amount?`　<b>${(+x.amount).toLocaleString()}円</b>`:''}<small>${jpDate(x.date,false)}</small></span><button class="mini" data-act="krdel" data-id="${x.id}">削除</button></div>`).join(''):'<p class="muted" style="margin:0">まだありません。</p>'}
  <p class="small muted" style="margin:6px 0 0">回した・払ったら、左の四角を押して印を付けます。</p></div>`,{crumb:'生活管理 › 地域コミュニティ'});
}
Object.assign(ACTS,{
  tbedit:el=>{ UI.tbEdit=el.dataset.id; render(); setTimeout(()=>{const f=$('form[data-form=toban]'); if(f) f.scrollIntoView();},30); },
  tbcancel:()=>{ UI.tbEdit=''; render(); },
  tbdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='もう一度押すと削除'; return; } S.tobans=(S.tobans||[]).filter(x=>x.id!==el.dataset.id); UI.tbEdit=''; save(); render(); },
  krck:el=>{ const x=(S.kairan||[]).find(k=>k.id===el.dataset.id); if(x){ x.done=!x.done; save(); render(); } },
  krdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='削除？'; return; } S.kairan=(S.kairan||[]).filter(k=>k.id!==el.dataset.id); save(); render(); },
  localcal:()=>{ UI.calCat='local'; go('cal/'+today().slice(0,7)); }
});
FORMS.toban=(f,fd)=>{
  const id=f.dataset.id; S.tobans=S.tobans||[]; const t=id?S.tobans.find(x=>x.id===id):{id:uid()};
  Object.assign(t,{name:String(fd.get('name')).trim(),members:String(fd.get('members')).split('\n').map(x=>x.trim()).filter(Boolean),me:String(fd.get('me')||'').trim(),unit:fd.get('unit')==='m'?'m':'w',every:Math.max(1,+fd.get('every')||1),start:fd.get('start')});
  if(!id) S.tobans.push(t); UI.tbEdit=''; save(); toast('保存しました'); render(); window.scrollTo(0,0);
};
FORMS.kairan=(f,fd)=>{ S.kairan=S.kairan||[]; S.kairan.push({id:uid(),date:fd.get('date')||today(),kind:fd.get('kind')||'メモ',text:String(fd.get('text')).trim(),amount:String(fd.get('amount')||'').replace(/[^\d]/g,''),done:false}); save(); toast('書いておきました'); render(); };
