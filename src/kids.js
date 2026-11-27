
/* ===== 子育て（★9 身長・体重・頭囲の成長曲線・★10 健診・予防接種の日程と接種済み）=====
   S.kids=[{id,name,bday,grow:[{date,h,w,hd}],shots:{名前:[{date,done}]},checks:{名前:{date,done}}}]
   予定を入れると「子育て」の色でカレンダーに出る（S.events、cat:'kids'） */
const KID_CHECKS=['1か月健診','3〜4か月健診','6〜7か月健診','9〜10か月健診','1歳6か月健診','3歳児健診'];
const KID_SHOTS=[['B型肝炎',3],['ロタウイルス',3],['5種混合（4種混合＋ヒブ）',4],['小児用肺炎球菌',4],['BCG',1],['MR（麻しん風しん）',2],['水痘（水ぼうそう）',2],['日本脳炎',4],['おたふくかぜ（任意）',2],['インフルエンザ（任意）',2]];
function kidAge(b,s){ if(!b) return ''; const [y,m,d]=b.split('-').map(Number); const t=parseD(s||today()); let mo=(t.getFullYear()-y)*12+(t.getMonth()+1-m); if(t.getDate()<d) mo--; if(mo<0) return ''; return mo<24?`${mo}か月`:`${Math.floor(mo/12)}歳${mo%12?mo%12+'か月':''}`; }
function kidMonths(b,s){ const [y,m,d]=b.split('-').map(Number); const t=parseD(s); return (t.getFullYear()-y)*12+(t.getMonth()+1-m)+(t.getDate()-d)/30.4; }
function vKids(id){
  const K=S.kids||[]; const k=K.find(x=>x.id===id)||(id?null:K[0]);
  const tabs=K.length?`<div class="chips">${K.map(x=>`<button class="chip" aria-pressed="${k&&x.id===k.id}" data-go-r="kids/${x.id}">👶 ${h(x.name)}</button>`).join('')}<button class="chip" data-go-r="kids/new">＋ 子どもを足す</button></div>`:'';
  if(!k||id==='new') return sub('子育て',`${tabs}${K.length?'':sayBoo('お子さんの名前と生まれた日を入れると、成長の記録と、健診・予防接種の表が使えるよ。')}
    <form class="sec" data-form="kid"><h3>子どもを足す</h3><div class="f"><label for="kd-n">名前</label><input id="kd-n" name="name" required placeholder="例：はると"></div>
    <div class="f"><label for="kd-b">生まれた日</label><input id="kd-b" type="date" name="bday" required max="${today()}"></div><div class="btns"><button class="btn" type="submit">足す</button></div></form>`,{crumb:'私と家族 › 子育て'});
  const g=(k.grow||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const ser=(key,name,color,unit)=>{ const pts=g.filter(x=>x[key]!==''&&x[key]!=null&&!isNaN(+x[key])).map(x=>[x.date,+x[key]]); return pts.length?`<div class="hck1"><b>${name}</b><span class="small muted">（${unit}）　最新 ${pts[pts.length-1][1]}${unit}</span>${pts.length>1?lineChart([{name,color,pts}],{label:name+'のグラフ',h:110}):''}</div>`:''; };
  const sh=k.shots||{}; const ck=k.checks||{};
  return sub('子育て',`${tabs}
  <div class="sec"><h3>👶 ${h(k.name)}　<span class="small muted">${jpDate(k.bday,false)}生まれ・${kidAge(k.bday)}</span></h3>
    ${g.length?ser('h','身長','#1565C0','cm')+ser('w','体重','#2E8B57','kg')+ser('hd','頭囲','#C07A00','cm'):'<p class="small muted" style="margin:0">まだ記録がありません。</p>'}
    <details class="hadd"><summary>＋ 身長・体重・頭囲を記録する</summary><form data-form="grow" data-id="${k.id}">
      <div class="f"><label for="gr-d">測った日</label><input id="gr-d" type="date" name="date" value="${today()}" required></div>
      <div class="hrec"><span class="lb">身長</span><span><input name="h" inputmode="decimal" style="width:5.6em" aria-label="身長"> cm</span><span class="lb">体重</span><span><input name="w" inputmode="decimal" style="width:5.6em" aria-label="体重"> kg</span><span class="lb">頭囲</span><span><input name="hd" inputmode="decimal" style="width:5.6em" aria-label="頭囲"> cm</span></div>
      <div class="btns"><button class="btn" type="submit">記録する</button></div></form></details>
    ${g.length?`<details class="hadd"><summary>これまでの記録（${g.length}回）</summary>${g.slice().reverse().map(x=>`<div class="hrow"><span>${jpDate(x.date,false)}<br><span class="small muted">${kidAge(k.bday,x.date)}</span></span><span>${[x.h?'身長'+x.h+'cm':'',x.w?'体重'+x.w+'kg':'',x.hd?'頭囲'+x.hd+'cm':''].filter(Boolean).join('　')} <button class="mini" data-act="growdel" data-k="${k.id}" data-d="${x.date}">削除</button></span></div>`).join('')}</details>`:''}
    <p class="small muted" style="margin:6px 0 0">標準の範囲（成長曲線の帯）は、母子手帳のグラフと見比べてください。</p></div>
  <div class="sec"><h3>🩺 健診</h3>${KID_CHECKS.map(n=>{const c=ck[n]||{};return `<div class="kdrow"><button class="ck ${c.done?'on':''}" data-act="kidck" data-k="${k.id}" data-n="${h(n)}" aria-label="${h(n)} 済み">${c.done?'✓':''}</button><span class="t">${h(n)}</span><input type="date" value="${h(c.date||'')}" data-kdate="check" data-k="${k.id}" data-n="${h(n)}" aria-label="${h(n)}の日"></div>`;}).join('')}</div>
  <div class="sec"><h3>💉 予防接種</h3>${KID_SHOTS.map(([n,c])=>{const L=sh[n]||[];return `<div class="kdshot"><b>${h(n)}</b><div class="kdcells">${[...Array(c)].map((_,i)=>{const x=L[i]||{};return `<span class="kdc ${x.done?'on':''}"><button class="ck ${x.done?'on':''}" data-act="shotck" data-k="${k.id}" data-n="${h(n)}" data-i="${i}" aria-label="${h(n)} ${i+1}回目 済み">${x.done?'✓':i+1}</button><input type="date" value="${h(x.date||'')}" data-kdate="shot" data-k="${k.id}" data-n="${h(n)}" data-i="${i}" aria-label="${h(n)} ${i+1}回目の日"></span>`;}).join('')}</div></div>`;}).join('')}
    <p class="small muted" style="margin:6px 0 0">回数と時期は、母子手帳と市町村のお知らせで確かめてください。日にちを入れると、まだ済んでいないものはカレンダーに「子育て」の色で出ます。</p></div>
  <div class="btns"><button class="btn danger" data-act="kiddel" data-id="${k.id}">${h(k.name)}の記録を削除</button></div>`,{crumb:'私と家族 › 子育て'});
}
/* 健診・接種の日にちをカレンダー（子育ての色）に出す */
function kidItemsOn(s){ const out=[]; for(const k of S.kids||[]){
  for(const [n,c] of Object.entries(k.checks||{})) if(c.date===s) out.push({k:'an',a:{name:`${k.name}：${n}${c.done?'（済み）':''}`,em:'🩺'},allday:true,time:'',color:'#D6457A',yrs:null});
  for(const [n,L] of Object.entries(k.shots||{})) (L||[]).forEach((x,i)=>{ if(x&&x.date===s) out.push({k:'an',a:{name:`${k.name}：${n} ${i+1}回目${x.done?'（済み）':''}`,em:'💉'},allday:true,time:'',color:'#D6457A',yrs:null}); });
 } return out; }
function kidSave(el,fn){ const k=(S.kids||[]).find(x=>x.id===el.dataset.k); if(!k) return; fn(k); save(); }
Object.assign(ACTS,{
  kidck:el=>{ kidSave(el,k=>{ k.checks=k.checks||{}; const c=k.checks[el.dataset.n]=k.checks[el.dataset.n]||{}; c.done=!c.done; if(c.done&&!c.date) c.date=today(); }); render(); },
  shotck:el=>{ kidSave(el,k=>{ k.shots=k.shots||{}; const L=k.shots[el.dataset.n]=k.shots[el.dataset.n]||[]; const i=+el.dataset.i; const x=L[i]=L[i]||{}; x.done=!x.done; if(x.done&&!x.date) x.date=today(); }); render(); },
  growdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='削除？'; return; } kidSave(el,k=>{ k.grow=(k.grow||[]).filter(x=>x.date!==el.dataset.d); }); render(); },
  kiddel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='もう一度押すと、記録をすべて削除します'; return; } S.kids=(S.kids||[]).filter(x=>x.id!==el.dataset.id); save(); go('kids',true); }
});
function kidsAfter(){ $$('input[data-kdate]').forEach(i=>i.addEventListener('change',()=>{ kidSave(i,k=>{ if(i.dataset.kdate==='check'){ k.checks=k.checks||{}; (k.checks[i.dataset.n]=k.checks[i.dataset.n]||{}).date=i.value; } else { k.shots=k.shots||{}; const L=k.shots[i.dataset.n]=k.shots[i.dataset.n]||[]; (L[+i.dataset.i]=L[+i.dataset.i]||{}).date=i.value; } }); toast('日にちを入れました'); })); }
FORMS.kid=(f,fd)=>{ S.kids=S.kids||[]; const k={id:uid(),name:String(fd.get('name')).trim(),bday:fd.get('bday'),grow:[],shots:{},checks:{}}; S.kids.push(k); save(); toast('足しました'); go('kids/'+k.id,true); };
FORMS.grow=(f,fd)=>{ kidSave({dataset:{k:f.dataset.id}},k=>{ const d=fd.get('date'); const r={date:d}; for(const x of ['h','w','hd']){ const v=String(fd.get(x)||'').trim(); if(v) r[x]=v; } k.grow=(k.grow||[]).filter(g=>g.date!==d); k.grow.push(r); }); toast('記録しました'); render(); };
