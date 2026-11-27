
/* ===== ゴミ出しの日 =====
   S.gomi=[{id,name,em,mode:'week'|'nth',days:[0-6],nth:[1-5]}]
   week＝毎週その曜日、nth＝第○週のその曜日（例：第1・第3水曜） */
const GOMI_PRESET=[['🔥','燃えるゴミ'],['🧴','プラスチック'],['♻️','資源ゴミ'],['🍾','びん・缶'],['📰','古紙'],['🪨','燃えないゴミ'],['🛋️','粗大ゴミ']];
function gomiOn(s){
  const d=parseD(s), wd=d.getDay(), nth=Math.floor((d.getDate()-1)/7)+1;
  return (S.gomi||[]).filter(g=>(g.days||[]).includes(wd)&&(g.mode!=='nth'||(g.nth||[]).includes(nth)));
}
function gomiRule(g){
  const ds=(g.days||[]).slice().sort().map(i=>WD[i]).join('・');
  return g.mode==='nth'?`第${(g.nth||[]).slice().sort().join('・第')} ${ds}曜日`:`毎週 ${ds}曜日`;
}
/* トップと1日のカードに出す札 */
function gomiTag(s){
  const td=gomiOn(s); const hr=new Date().getHours(); const isToday=s===today();
  const tm=isToday&&hr>=15?gomiOn(addDays(s,1)):[];
  if(!td.length&&!tm.length) return '';
  return `<button class="gomitag" data-go="gomi">${td.length?`<span><b>🗑️ ${isToday?'今日':'この日'}のゴミ</b> ${td.map(g=>`${g.em||''}${h(g.name)}`).join('・')}</span>`:''}${tm.length?`<span class="tm"><b>明日のゴミ</b> ${tm.map(g=>`${g.em||''}${h(g.name)}`).join('・')}</span>`:''}</button>`;
}
function vGomi(){
  const list=(S.gomi||[]);
  const wk=[0,1,2,3,4,5,6].map(i=>`<label><input type="checkbox" name="days" value="${i}">${WD[i]}</label>`).join('');
  const nt=[1,2,3,4,5].map(i=>`<label><input type="checkbox" name="nth" value="${i}">第${i}</label>`).join('');
  // これから1週間
  const t=today(); let week='';
  for(let i=0;i<7;i++){ const s=addDays(t,i); const g=gomiOn(s); week+=`<div class="gwrow ${i===0?'now':''}"><span class="${dayClass(s)}">${i===0?'今日':i===1?'明日':`${+s.slice(5,7)}/${+s.slice(8)}`}（${WD[parseD(s).getDay()]}）</span><span>${g.length?g.map(x=>`${x.em||''}${h(x.name)}`).join('・'):'<span class="muted">なし</span>'}</span></div>`; }
  return sub('ゴミ出しの日',`
  ${list.length?`<div class="sec"><h3>これから1週間</h3>${week}</div>`:''}
  <div class="sec"><h3>登録したゴミ</h3>${list.length?list.map(g=>`<div class="gomirow"><span class="em">${g.em||'🗑️'}</span><span class="t"><b>${h(g.name)}</b><span>${gomiRule(g)}</span></span><button class="mini" data-act="gomidel" data-id="${g.id}">削除</button></div>`).join(''):'<p class="muted" style="margin:0">まだありません。下から登録してください。</p>'}</div>
  <form class="sec" data-form="gomi"><h3>ゴミの日を登録する</h3>
    <div class="f"><span class="lb">ゴミの種類（押すと入ります）</span><div class="chips">${GOMI_PRESET.map(([e,n])=>`<button type="button" class="chip" data-act="gomipick" data-e="${e}" data-n="${n}">${e} ${n}</button>`).join('')}</div>
      <div style="display:flex;gap:6px;margin-top:6px"><input name="em" id="gm-em" value="🗑️" style="width:3.2em;text-align:center" aria-label="印"><input name="name" id="gm-name" required placeholder="例：燃えるゴミ" style="flex:1;min-width:0"></div></div>
    <div class="f"><span class="lb">いつ出す？</span><div class="choose" id="gm-mode"><label><input type="radio" name="mode" value="week" checked>毎週</label><label><input type="radio" name="mode" value="nth">第○週だけ（例：第1・第3）</label></div></div>
    <div class="f" id="gm-nth" hidden><span class="lb">何週目？</span><div class="choose">${nt}</div></div>
    <div class="f"><span class="lb">曜日（いくつでも）</span><div class="choose">${wk}</div></div>
    <button class="btn" type="submit">登録する</button>
  </form>
  <p class="small muted">登録したゴミの日は、トップの「今日の予定」と1日のカードに出ます。午後3時を過ぎると、明日のゴミも出ます。</p>`,{crumb:'生活管理 › 地域コミュニティ'});
}
Object.assign(ACTS,{
  gomipick:el=>{ const m=$('#gm-em'); if(!m) return; m.value=el.dataset.e; $('#gm-name').value=el.dataset.n; },
  gomidel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='もう一度押すと削除'; return; } S.gomi=(S.gomi||[]).filter(g=>g.id!==el.dataset.id); save(); render(); }
});
FORMS.gomi=(f,fd)=>{
  const days=fd.getAll('days').map(Number), nth=fd.getAll('nth').map(Number), mode=fd.get('mode');
  if(!days.length){ toast('曜日を選んでください'); return; }
  if(mode==='nth'&&!nth.length){ toast('何週目かを選んでください'); return; }
  S.gomi=S.gomi||[]; S.gomi.push({id:'g'+Date.now().toString(36),name:(fd.get('name')||'').trim()||'ゴミ',em:(fd.get('em')||'').trim(),mode,days,nth:mode==='nth'?nth:[]});
  save(); toast('登録しました'); render();
};
