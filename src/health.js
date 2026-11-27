
/* ===== 健康管理（★13 基本データ・★16 通院一覧・★17 健診の数値・★18 通院予約・★19 毎日の記録）=====
   S.hl={'YYYY-MM-DD':{s1,d1,p1,s2,d2,p2,w,sl,memo}}  朝(1)・夜(2)の血圧（上s・下d）と脈拍p、体重w、睡眠sl（時間）
   S.hbase={h,w,vr,vl,date}
   S.hck={items:[{id,name,unit}],recs:[{id,date,v:{itemId:値}}]}
   通院予約は「健康」の色の予定（S.events、appt:true）として入れるので、カレンダーにもそのまま出る */
const HCK_DEF=[['weight','体重','kg'],['bp_s','血圧（上）','mmHg'],['bp_d','血圧（下）','mmHg'],['glu','血糖値','mg/dL'],['a1c','HbA1c','%'],['ua','尿酸値','mg/dL'],['tg','中性脂肪','mg/dL'],['ldl','LDLコレステロール','mg/dL']];
function hck(){ if(!S.hck) S.hck={items:HCK_DEF.map(([id,name,unit])=>({id,name,unit})),recs:[]}; return S.hck; }
function hlOf(s){ return (S.hl||{})[s]||{}; }
const num=v=>v===''||v==null||isNaN(+v)?null:+v;
/* かんたんな折れ線グラフ（series=[{name,color,pts:[[日付,値]]}]） */
function lineChart(series,opt={}){
  const all=series.flatMap(s=>s.pts); if(all.length<1) return '';
  const W=320,H=opt.h||120,L=34,R=8,T=10,B=20;
  const xs=[...new Set(all.map(p=>p[0]))].sort(); const xi=d=>xs.length<2?(W-L-R)/2:(xs.indexOf(d)/(xs.length-1))*(W-L-R);
  let lo=Math.min(...all.map(p=>p[1])),hi=Math.max(...all.map(p=>p[1])); if(lo===hi){lo-=1;hi+=1;} const pd=(hi-lo)*.12; lo-=pd; hi+=pd;
  const y=v=>T+(1-(v-lo)/(hi-lo))*(H-T-B);
  const fmt=v=>Math.abs(hi-lo)<10?v.toFixed(1):Math.round(v);
  const lines=series.map(s=>{ const p=s.pts.slice().sort((a,b)=>a[0].localeCompare(b[0])); if(!p.length) return '';
    return `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" points="${p.map(q=>`${L+xi(q[0])},${y(q[1])}`).join(' ')}"/>${p.map(q=>`<circle cx="${L+xi(q[0])}" cy="${y(q[1])}" r="3.2" fill="${s.color}"/>`).join('')}`; }).join('');
  const md=d=>`${+d.slice(5,7)}/${+d.slice(8)}`;
  return `<svg class="hchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${h(opt.label||'グラフ')}">
   <line x1="${L}" x2="${W-R}" y1="${y(hi-pd)}" y2="${y(hi-pd)}" class="gl"/><line x1="${L}" x2="${W-R}" y1="${y(lo+pd)}" y2="${y(lo+pd)}" class="gl"/>
   <text x="${L-4}" y="${y(hi-pd)+4}" text-anchor="end">${fmt(hi-pd)}</text><text x="${L-4}" y="${y(lo+pd)+4}" text-anchor="end">${fmt(lo+pd)}</text>
   <text x="${L}" y="${H-4}">${md(xs[0])}</text>${xs.length>1?`<text x="${W-R}" y="${H-4}" text-anchor="end">${md(xs[xs.length-1])}</text>`:''}
   ${lines}</svg>${series.length>1?`<div class="hleg">${series.map(s=>`<span><i style="background:${s.color}"></i>${h(s.name)}</span>`).join('')}</div>`:''}`;
}
function bpText(s,d,p){ return s||d?`${s||'-'}/${d||'-'}${p?`　脈${p}`:''}`:''; }
function vHealth(){
  const t=today(); const ds=UI.hDate||t; const r=hlOf(ds); const b=S.hbase||{};
  const appts=S.events.filter(e=>e.cat==='health'&&e.date>=t&&(e.appt||e.placeId)).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))).slice(0,6);
  const meds=S.meds||[];
  const clinicIds=new Set([...(S.places||[]).filter(p=>(p.big||[]).includes('医療')).map(p=>p.id),...S.events.filter(e=>e.appt&&e.placeId).map(e=>e.placeId),...(S.meds||[]).map(m=>m.placeId).filter(Boolean)]);
  const clinics=S.places.filter(p=>clinicIds.has(p.id));
  const pls=S.places.slice().sort((a,b)=>((b.big||[]).includes('医療'))-((a.big||[]).includes('医療'))||a.name.localeCompare(b.name,'ja'));
  const inp=(k,ph,w,mode)=>`<input name="${k}" inputmode="${mode||'numeric'}" value="${h(r[k]??'')}" placeholder="${ph}" aria-label="${ph}" style="width:${w||4.6}em">`;
  const last7=[...Array(7)].map((_,i)=>addDays(t,-i)).filter(s=>Object.keys(hlOf(s)).length);
  return sub('健康管理',`
  <form class="sec" data-form="hlog"><h3>📝 毎日の記録 <input type="date" name="date" value="${ds}" max="${t}" id="hl-date" aria-label="記録する日" class="hdate"></h3>
    <div class="hrec"><span class="lb">朝の血圧</span><span>${inp('s1','上',3.6)} / ${inp('d1','下',3.6)} 脈 ${inp('p1','脈拍',3.4)}</span>
    <span class="lb">夜の血圧</span><span>${inp('s2','上',3.6)} / ${inp('d2','下',3.6)} 脈 ${inp('p2','脈拍',3.4)}</span>
    <span class="lb">体重</span><span>${inp('w','例：62.5',5.6,'decimal')} kg</span>
    <span class="lb">睡眠</span><span>${inp('sl','例：7',4.6,'decimal')} 時間</span></div>
    <div class="f" style="margin-top:6px"><input name="memo" value="${h(r.memo||'')}" placeholder="体調メモ（例：少し頭が重い）" aria-label="体調メモ"></div>
    <div class="btns"><button class="btn" type="submit">記録する</button><button class="btn plain" type="button" data-go="hlist">これまでの記録とグラフ</button></div></form>
  ${last7.length?`<div class="sec"><h3>この1週間</h3>${last7.map(s=>{const x=hlOf(s);return `<div class="hrow"><span class="${dayClass(s)}">${s===t?'今日':`${+s.slice(5,7)}/${+s.slice(8)}`}（${WD[parseD(s).getDay()]}）</span><span>${[bpText(x.s1,x.d1,x.p1)?'朝 '+bpText(x.s1,x.d1,x.p1):'',bpText(x.s2,x.d2,x.p2)?'夜 '+bpText(x.s2,x.d2,x.p2):'',x.w?x.w+'kg':'',x.sl?'睡眠'+x.sl+'時間':''].filter(Boolean).join('<br>')}${x.memo?`<br><span class="small muted">${h(x.memo)}</span>`:''}</span></div>`;}).join('')}</div>`:''}
  <div class="sec"><h3>💊 お薬 <button class="more" data-go="meds">お薬の一覧 ›</button></h3>${meds.length?meds.map(m=>`<div class="small">・${h(m.name)}　<span class="muted">${h(medSchedText(m))}</span></div>`).join(''):'<p class="small muted" style="margin:0">まだ登録していません。</p>'}</div>
  <div class="sec"><h3>🏥 通院の予約</h3>
    ${appts.length?`<div class="evs">${appts.map(e=>{const pl=placeOf(e);return `<button class="ev" style="border-left-color:#2E8B57" data-go="ev/${e.id}"><span class="tm">${+e.date.slice(5,7)}/${+e.date.slice(8)}<br><span class="small">${e.time||''}</span></span><span class="bd"><b>${h(e.title)}</b><span>${pl?'📍'+h(pl.name):''}${e.memo?'・'+h(e.memo):''}</span></span></button>`;}).join('')}</div>`:'<p class="small muted" style="margin:0 0 6px">これからの予約はありません。</p>'}
    <details class="hadd"><summary>＋ 予約を入れる</summary><form data-form="appt">
      <div class="two"><div class="f"><label for="ap-d">日にち</label><input id="ap-d" type="date" name="date" required min="${t}"></div><div class="f"><label for="ap-t">時刻</label><input id="ap-t" type="time" name="time"></div></div>
      <div class="f"><label for="ap-p">病院（施設帳から）</label><select id="ap-p" name="placeId"><option value="">― 選ばない ―</option>${pls.map(p=>`<option value="${p.id}">${h(p.name)}</option>`).join('')}</select></div>
      <div class="f"><label for="ap-n">名前（病院を選ばないとき）</label><input id="ap-n" name="name" placeholder="例：○○内科"></div>
      <div class="f"><label for="ap-m">メモ</label><input id="ap-m" name="memo" placeholder="例：血液検査、朝ごはん抜き"></div>
      <div class="btns"><button class="btn" type="submit">予約を入れる</button></div>
      <p class="small muted" style="margin:0">カレンダーにも「健康」の色で出ます。</p></form></details></div>
  <div class="sec"><h3>🏥 通っている病院</h3>
    ${clinics.length?`<div class="list">${clinics.map(p=>{const nx=S.events.filter(e=>e.placeId===p.id&&e.date>=t).sort((a,b)=>a.date.localeCompare(b.date))[0];return `<button class="row" data-go="place/${p.id}"><span class="em">🏥</span><span class="t"><b>${h(p.name)}</b><span>${nx?`次の予約 ${+nx.date.slice(5,7)}/${+nx.date.slice(8)}${nx.time?' '+nx.time:''}`:(p.tel?h(p.tel):'')}</span></span><span class="go">›</span></button>`;}).join('')}</div>`:'<p class="small muted" style="margin:0">施設帳で大きなジャンルを「医療」にした病院が、ここに並びます。</p>'}
    <div class="btns"><button class="btn plain" data-go="pledit/new">＋ 施設帳に病院を足す</button></div></div>
  <div class="sec"><h3>📈 健康診断の数値 <button class="more" data-go="hcheck">開く ›</button></h3>${hckSummary()}</div>
  <form class="sec" data-form="hbase"><h3>📏 基本データ${b.date?`<span class="small muted">　${jpDate(b.date,false)}に測定</span>`:''}</h3>
    <div class="hrec"><span class="lb">身長</span><span><input name="h" inputmode="decimal" value="${h(b.h||'')}" style="width:5.6em" aria-label="身長"> cm</span>
    <span class="lb">体重</span><span><input name="w" inputmode="decimal" value="${h(b.w||'')}" style="width:5.6em" aria-label="体重"> kg${b.h&&b.w?`　<span class="small muted">BMI ${(b.w/((b.h/100)**2)).toFixed(1)}</span>`:''}</span>
    <span class="lb">視力</span><span>右 <input name="vr" inputmode="decimal" value="${h(b.vr||'')}" style="width:4em" aria-label="視力 右">　左 <input name="vl" inputmode="decimal" value="${h(b.vl||'')}" style="width:4em" aria-label="視力 左"></span>
    <span class="lb">測った日</span><span><input type="date" name="date" value="${h(b.date||'')}" aria-label="測った日"></span></div>
    <div class="btns"><button class="btn plain" type="submit">基本データを保存</button></div></form>
  <p class="small muted">血圧や数値の良し悪しは、かかりつけのお医者さんに確かめてください。</p>`,{crumb:'健康 › 健康管理'});
}
function vHList(){
  const days=Object.keys(S.hl||{}).sort().reverse(); const from=addDays(today(),-29);
  const in30=days.filter(s=>s>=from);
  const P=k=>in30.map(s=>[s,num(hlOf(s)[k])]).filter(p=>p[1]!=null);
  const bp=[{name:'朝 上',color:'#D32F2F',pts:P('s1')},{name:'朝 下',color:'#F48FB1',pts:P('d1')},{name:'夜 上',color:'#1565C0',pts:P('s2')},{name:'夜 下',color:'#90CAF9',pts:P('d2')}].filter(s=>s.pts.length);
  const w=P('w');
  return sub('これまでの記録',`
  <div class="sec"><h3>血圧（30日）</h3>${bp.length?lineChart(bp,{label:'血圧のグラフ',h:150}):'<p class="small muted" style="margin:0">まだ記録がありません。</p>'}</div>
  ${w.length?`<div class="sec"><h3>体重（30日）</h3>${lineChart([{name:'体重',color:'#2E8B57',pts:w}],{label:'体重のグラフ'})}</div>`:''}
  <div class="sec"><h3>一覧</h3>${days.length?`<div class="htbl"><div class="hh"><span>日</span><span>朝</span><span>夜</span><span>体重</span><span>睡眠</span></div>${days.slice(0,60).map(s=>{const x=hlOf(s);return `<div><span class="${dayClass(s)}">${+s.slice(5,7)}/${+s.slice(8)}</span><span>${bpText(x.s1,x.d1)||'-'}</span><span>${bpText(x.s2,x.d2)||'-'}</span><span>${x.w||'-'}</span><span>${x.sl||'-'}</span>${x.memo?`<em>${h(x.memo)}</em>`:''}</div>`;}).join('')}</div>`:'<p class="small muted" style="margin:0">まだ記録がありません。</p>'}</div>`,{crumb:'健康 › 健康管理'});
}
function hckSummary(){
  const c=hck(); if(!c.recs.length) return '<p class="small muted" style="margin:0">健康診断の結果を入れると、去年と比べたりグラフで見たりできます。</p>';
  const recs=c.recs.slice().sort((a,b)=>b.date.localeCompare(a.date)); const L=recs[0], P=recs[1];
  return `<p class="small muted" style="margin:0 0 4px">いちばん新しい結果（${jpDate(L.date,false)}）</p><div class="hcks">${c.items.filter(i=>num(L.v[i.id])!=null).map(i=>{const a=num(L.v[i.id]),b=P?num(P.v[i.id]):null;return `<span><b>${h(i.name)}</b> ${a}${h(i.unit)}${b!=null&&b!==a?`<i class="${a>b?'up':'dn'}">${a>b?'↑':'↓'}${+(Math.abs(a-b)).toFixed(2)}</i>`:''}</span>`;}).join('')}</div>`;
}
function vHCheck(){
  const c=hck(); const recs=c.recs.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const charts=c.items.map(i=>{const pts=recs.map(r=>[r.date,num(r.v[i.id])]).filter(p=>p[1]!=null); return pts.length?`<div class="hck1"><b>${h(i.name)}</b><span class="small muted">（${h(i.unit)}）</span>${pts.length>1?lineChart([{name:i.name,color:'#2E8B57',pts}],{label:i.name+'のグラフ',h:100}):`<div class="small">${pts[0][1]}${h(i.unit)}</div>`}</div>`:'';}).join('');
  return sub('健康診断の数値',`
  ${recs.length?`<div class="sec"><h3>移り変わり</h3>${charts}</div>
  <div class="sec"><h3>入れた結果</h3><div class="list">${recs.slice().reverse().map(r=>`<div class="row"><span class="em">📋</span><span class="t"><b>${jpDate(r.date,false)}</b><span>${c.items.filter(i=>num(r.v[i.id])!=null).map(i=>`${h(i.name)} ${r.v[i.id]}`).join('・')}</span></span><button class="mini" data-act="hckdel" data-id="${r.id}">削除</button></div>`).join('')}</div></div>`:sayBoo('健康診断の結果の紙から、数字を写して入れてね。毎年入れると、グラフで比べられるよ。')}
  <form class="sec" data-form="hck"><h3>結果を入れる</h3>
    <div class="f"><label for="hc-d">受けた日</label><input id="hc-d" type="date" name="date" required max="${today()}"></div>
    <div class="hrec">${c.items.map(i=>`<span class="lb">${h(i.name)}</span><span><input name="v_${i.id}" inputmode="decimal" style="width:6em" aria-label="${h(i.name)}"> ${h(i.unit)}</span>`).join('')}</div>
    <p class="small muted" style="margin:6px 0">わかる項目だけで大丈夫です。</p>
    <div class="btns"><button class="btn" type="submit">保存する</button></div></form>
  <form class="sec" data-form="hckitem"><h3>項目を足す</h3><div class="two"><div class="f"><label for="hi-n">項目の名前</label><input id="hi-n" name="name" required placeholder="例：γ-GTP"></div><div class="f"><label for="hi-u">単位</label><input id="hi-u" name="unit" placeholder="例：U/L"></div></div>
    <div class="btns"><button class="btn plain" type="submit">＋ 足す</button></div></form>`,{crumb:'健康 › 健康管理'});
}
Object.assign(ACTS,{
  hckdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='もう一度押すと削除'; return; } hck().recs=hck().recs.filter(r=>r.id!==el.dataset.id); save(); render(); }
});
FORMS.hlog=(f,fd)=>{
  const d=fd.get('date')||today(); const r={}; for(const k of ['s1','d1','p1','s2','d2','p2','w','sl','memo']){ const v=String(fd.get(k)||'').trim(); if(v) r[k]=v; }
  S.hl=S.hl||{}; if(Object.keys(r).length) S.hl[d]=r; else delete S.hl[d];
  UI.hDate=''; save(); toast('記録しました'); render();
};
FORMS.hbase=(f,fd)=>{ S.hbase={}; for(const k of ['h','w','vr','vl','date']) S.hbase[k]=String(fd.get(k)||'').trim(); if(!S.hbase.date&&(S.hbase.h||S.hbase.w)) S.hbase.date=today(); save(); toast('保存しました'); render(); };
FORMS.appt=(f,fd)=>{
  const pid=fd.get('placeId')||''; const pl=S.places.find(p=>p.id===pid); const nm=String(fd.get('name')||'').trim();
  const e={id:uid(),title:(pl?pl.name:nm||'通院')+'（通院）',date:fd.get('date'),time:fd.get('time')||'',etime:'',tmode:'',cat:'health',rep:'',placeId:pid,place:pl?'':nm,people:[],memo:String(fd.get('memo')||'').trim(),appt:true};
  if(!e.date){ toast('日にちを選んでください'); return; }
  S.events.push(e); save(); toast('予約を入れました'); render();
};
FORMS.hck=(f,fd)=>{
  const c=hck(); const v={}; for(const i of c.items){ const x=String(fd.get('v_'+i.id)||'').trim(); if(x!==''&&!isNaN(+x)) v[i.id]=x; }
  if(!Object.keys(v).length){ toast('数字を1つ以上入れてください'); return; }
  c.recs.push({id:uid(),date:fd.get('date'),v}); save(); toast('保存しました'); render(); window.scrollTo(0,0);
};
FORMS.hckitem=(f,fd)=>{ const c=hck(); c.items.push({id:'u'+uid(),name:String(fd.get('name')).trim(),unit:String(fd.get('unit')||'').trim()}); save(); toast('項目を足しました'); render(); };
