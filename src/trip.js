
/* ===== 旅行計画（10件まで）→ 行程の組み立て・旅のしおり・車の運行計画表・A4縦で印刷/PDF（11/28 本人の要望） =====
   費用ゼロ版：AIは使わず、行きたい場所の順番と「移動の目安（国土地理院の住所検索で距離→交通手段ごとの速さ）」で組み立てる。
   クロにゃん（AI）が自動で組み立てる形は後の段階（CC♥♥）。
   S.trips=[{id,name,from,to,memo,start,startTime,dayStart,mode,members,stops:[{id,day,ord,time,name,addr,tel,hp,memo,move,mv,stay,km,lat,lon,driver}]}] */
const MOVES=['','🚃 電車','🚗 車','🚌 バス','🚢 船','✈️ 飛行機','🚶 歩き','🚕 タクシー'];
const MOVE_KMH={'🚃 電車':45,'🚗 車':40,'🚌 バス':25,'🚢 船':25,'✈️ 飛行機':450,'🚶 歩き':4,'🚕 タクシー':30};
const MOVE_ADD={'🚃 電車':15,'✈️ 飛行機':90,'🚢 船':20,'🚌 バス':10};   /* 乗りかえ・待ち時間の目安 */
const isCar=m=>m==='🚗 車'||m==='🚕 タクシー';
/* 移動時間の目安（分）。車は長い距離なら高速道路の速さで */
function mvEst(km,mode){ if(km==null||!MOVE_KMH[mode]) return 0; let v=MOVE_KMH[mode]; if(isCar(mode)) v=km>60?75:km>20?50:30; return Math.max(5,Math.round(km/v*60+(MOVE_ADD[mode]||0))); }
const t2m=t=>{ if(!t) return null; const [a,b]=t.split(':').map(Number); return a*60+(b||0); };
const m2t=m=>{ m=Math.max(0,Math.round(m)); return pad(Math.floor(m/60)%24)+':'+pad(m%60); };
const mnTxt=m=>m>=60?`${Math.floor(m/60)}時間${m%60?m%60+'分':''}`:`${m}分`;
/* 子ども連れ：kids＝'' なし／'baby' 乳幼児（0〜3才）／'small' 幼児・小学生 */
const KIDS=[['','いない'],['baby','乳幼児（0〜3才）がいる'],['small','幼児・小学生がいる']];
const restEvery=tr=>tr.kids==='baby'?60:tr.kids==='small'?90:120;
const stayAdd=tr=>tr.kids==='baby'?30:tr.kids==='small'?15:0;
function tripBring(tr){ const n=(+tr.adults||0)+(+tr.children||0); const L=['保険証（コピーでも）','お金・カード','スマホと充電器','常備薬'];
  if(tripDays(tr)>1) L.push('着替え（'+(tripDays(tr)-1)+'泊分）','洗面道具');
  if(tripHasCar(tr)) L.push('運転免許証','ETCカード','酔い止め');
  if(tr.kids==='baby') L.push('おむつ・おしりふき','ミルク・哺乳びん・離乳食','母子手帳・こどもの保険証','着替え（多めに）','抱っこひも・ベビーカー','ビニール袋');
  if(tr.kids==='small') L.push('こどもの保険証','おやつ・飲み物','着替え1組','ハンカチ・ティッシュ','車や電車で遊べるもの');
  return L; }
const isRail=m=>m==='🚃 電車'||m==='🚌 バス'||m==='✈️ 飛行機'||m==='🚢 船';
const placeQ=s=>s?(s.addr||s.name||''):'';
function transitLinks(from,to,date,time){ if(!from||!to) return '';
  const g=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`;
  let y=`https://transit.yahoo.co.jp/search/result?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&type=1`;
  if(date&&time){ const [Y,M,D]=date.split('-'); const [hh,mm]=time.split(':'); y+=`&y=${Y}&m=${M}&d=${D}&hh=${+hh}&m1=${mm[0]}&m2=${mm[1]}`; }
  return `<a class="mini" href="${y}" target="_blank" rel="noopener">🚃 乗換案内</a><a class="mini" href="${g}" target="_blank" rel="noopener">🗺️ 電車の道順</a>`; }
/* 名前から場所を探す（国土地理院・無料）。住所らしい名前が返ってきたら住所の目安にする */
async function tripGeo(q){ try{ const r=await fetch('https://msearch.gsi.go.jp/address-search/AddressSearch?q='+encodeURIComponent(q)); const j=await r.json();
  if(j&&j[0]){ const [lon,lat]=j[0].geometry.coordinates; const ti=(j[0].properties&&j[0].properties.title)||''; return {lat:+lat,lon:+lon,title:/[都道府県]/.test(ti)?ti:''}; } }catch(e){} return null; }
function tripDays(tr){ return tr.from&&tr.to?Math.max(1,Math.round((parseD(tr.to)-parseD(tr.from))/864e5)+1):1; }
function tripStops(tr,d){ return (tr.stops||[]).filter(s=>(+s.day||1)===d).sort((a,b)=>((a.ord??999)-(b.ord??999))||(a.time||'99').localeCompare(b.time||'99')); }
/* 行程を組み立てる：出発時刻から、移動時間＋滞在時間を足していく。車は2時間ごとに休憩を入れる */
function tripPlan(tr){
  const days=[]; const nd=tripDays(tr); let prevPt=tr.start?{name:tr.start,lat:tr.slat,lon:tr.slon}:null;
  const inn=tr.inn?{name:tr.inn,lat:tr.ilat,lon:tr.ilon}:null;
  for(let d=1;d<=nd;d++){
    let cur=t2m(d===1?(tr.startTime||'08:00'):(tr.dayStart||'09:00')); const rows=[]; let drive=0, sumKm=0, sumDrive=0;
    if(d===1&&tr.start) rows.push({kind:'start',name:tr.start,dep:cur});
    else if(d>1&&inn){ rows.push({kind:'start',name:'🏨 '+inn.name,dep:cur}); prevPt=inn; }
    else if(d>1&&prevPt) rows.push({kind:'start',name:prevPt.name,dep:cur});
    const legs=tripStops(tr,d).map(s=>({s,mode:s.move||tr.mode||''}));
    if(d<nd&&inn){ const last=legs.length?legs[legs.length-1]:null; const km=last&&last.s.lat!=null&&inn.lat!=null?Math.round(kmBetween(last.s.lat,last.s.lon,inn.lat,inn.lon)*1.3*10)/10:null;
      legs.push({s:{id:'inn',name:'🏨 '+inn.name+'（泊まる所）',km,stay:0,inn:1},mode:tr.mode||''}); }
    for(const L of legs){ const s=L.s, mode=L.mode;
      let mv=+s.mv||mvEst(s.km,mode); if(!mv&&rows.length) mv=30;
      let rest=0; const RE=restEvery(tr); if(isCar(mode)&&mv){ rest=Math.floor((drive+mv)/RE); drive=(drive+mv)%RE; }
      const fixed=t2m(s.time); const arr=fixed!=null?fixed:cur+mv+rest*15; const st0=s.stay!=null&&s.stay!==''?+s.stay:60; const stay=st0+(!s.inn&&st0>0?stayAdd(tr):0);
      rows.push({kind:'stop',s,mode,mv,rest,fromName:String((prevPt&&prevPt.name)||'').replace(/^🏨 /,'').replace(/（泊まる所）$/,''),from:cur,arr,dep:arr+stay,stay,km:s.km,est:!s.mv});
      if(isCar(mode)){ sumDrive+=mv; sumKm+=s.km||0; }
      cur=arr+stay; prevPt=s;
    }
    days.push({d,date:tr.from?addDays(tr.from,d-1):'',rows,sumKm,sumDrive});
  }
  return days;
}
const tripHasCar=tr=>[tr.mode,...(tr.stops||[]).map(s=>s.move)].some(isCar);
function tripPeople(tr){ const a=+tr.adults||0, c=+tr.children||0; if(!a&&!c) return ''; return `${a+c}人（大人${a}${c?`・子ども${c}`:''}）`+(tr.kids==='baby'?'・乳幼児連れ':tr.kids==='small'?'・子ども連れ':''); }
function tripDateTxt(tr){ return tr.from?jpDate(tr.from)+(tr.to&&tr.to!==tr.from?' 〜 '+jpDate(tr.to):''):'日にち未定'; }
function vTrips(id){
  const L=S.trips||[]; const tr=id&&id!=='new'?L.find(x=>x.id===id):null;
  if(id==='new'||(tr&&UI.tripEdit===tr.id)){ const x=tr||{name:'',from:'',to:'',memo:'',start:'',startTime:'08:00',dayStart:'09:00',mode:'🚗 車',members:''};
    if(!tr&&L.length>=10) return sub('旅行計画','<p>旅行計画は10件までです。古いものを削除してから作ってください。</p>');
    return sub(tr?'旅行を直す':'旅行を作る',`<form class="sec" data-form="trip" data-id="${tr?tr.id:''}">
      <div class="f"><label for="tp-n">旅行の名前</label><input id="tp-n" name="name" required value="${h(x.name)}" placeholder="例：京都 紅葉旅行"></div>
      <div class="two"><div class="f"><label for="tp-f">行く日</label><input id="tp-f" type="date" name="from" value="${h(x.from)}"></div><div class="f"><label for="tp-t">帰る日</label><input id="tp-t" type="date" name="to" value="${h(x.to)}"></div></div>
      <div class="f"><label for="tp-s">出発する場所</label><input id="tp-s" name="start" value="${h(x.start||'')}" placeholder="例：自宅、静岡駅"></div>
      <div class="two"><div class="f"><label for="tp-st">出発の時刻（1日目）</label><input id="tp-st" type="time" name="startTime" value="${h(x.startTime||'08:00')}"></div><div class="f"><label for="tp-ds">2日目からの出発</label><input id="tp-ds" type="time" name="dayStart" value="${h(x.dayStart||'09:00')}"></div></div>
      <div class="f"><label for="tp-inn">泊まる所（泊まりのとき）</label><input id="tp-inn" name="inn" value="${h(x.inn||'')}" placeholder="例：京都〇〇ホテル（名前か住所）"></div>
      <div class="f"><label for="tp-mo">主な交通手段</label><select id="tp-mo" name="mode">${MOVES.map(m=>`<option value="${m}" ${m===(x.mode||'')?'selected':''}>${m||'― 選ばない ―'}</option>`).join('')}</select></div>
      <div class="two"><div class="f"><label for="tp-ad">大人の人数</label><input id="tp-ad" name="adults" type="number" min="0" value="${h(x.adults||'')}" placeholder="例：2"></div><div class="f"><label for="tp-ch">子どもの人数</label><input id="tp-ch" name="children" type="number" min="0" value="${h(x.children||'')}" placeholder="例：1"></div></div>
      <div class="f"><label for="tp-kd">小さい子ども</label><select id="tp-kd" name="kids">${KIDS.map(([k,n])=>`<option value="${k}" ${k===(x.kids||'')?'selected':''}>${n}</option>`).join('')}</select><span class="small muted">子ども連れだと、休憩を多めに・見学の時間を長めにして組み立て、持ち物の例も変わります。</span></div>
      <div class="f"><label for="tp-mb">行く人（しおりに載ります）</label><input id="tp-mb" name="members" value="${h(x.members||'')}" placeholder="例：父・母・ゆうた"></div>
      <div class="f"><label for="tp-m">メモ・持ち物（しおりに載ります）</label><textarea id="tp-m" name="memo" rows="3" placeholder="例：保険証、充電器、雨具">${h(x.memo||'')}</textarea></div>
      <div class="btns"><button class="btn" type="submit">保存する</button>${tr?`<button class="btn danger" type="button" data-act="tripdel" data-id="${tr.id}">削除</button>`:''}</div></form>`,{crumb:'おたのしみ › 旅行'}); }
  if(!tr) return sub('旅行計画',`${L.length?'':sayBoo('行きたい場所と交通手段を入れると、時間の目安を組み立てて「旅のしおり」にするよ。車なら運行計画表も作るよ。A4で印刷やPDFにもできるよ。')}
    <div class="list">${L.slice().sort((a,b)=>(b.from||'').localeCompare(a.from||'')).map(x=>`<button class="row" data-go="trips/${x.id}"><span class="em">🧳</span><span class="t"><b>${h(x.name)}</b><span>${x.from?jpDate(x.from,false)+(x.to&&x.to!==x.from?'〜'+(+x.to.slice(5,7))+'/'+(+x.to.slice(8)):''):'日にち未定'}・行き先${(x.stops||[]).length}か所</span></span><span class="go">›</span></button>`).join('')}</div>
    <div class="btns">${L.length<10?'<button class="btn" data-go="trips/new">＋ 旅行を作る</button><button class="btn plain" data-act="trippastenew">📋 ジェミニなどで作った計画を貼り付けて作る</button>':''}</div><p class="small muted">${L.length}/10件</p>`,{crumb:'おたのしみ › 旅行'});
  const nd=tripDays(tr); const plan=tripPlan(tr); const ed=UI.stopEdit&&(tr.stops||[]).find(s=>s.id===UI.stopEdit);
  let body=''; for(const D of plan){ if(nd>1) body+=`<div class="kkday">${D.d}日目${D.date?`　${jpDate(D.date)}`:''}</div>`;
    const st=tripStops(tr,D.d);
    body+=D.rows.map(r=>{
      if(r.kind==='start') return `<div class="tpstop tpst"><span class="tm">${m2t(r.dep)}</span><span class="t"><b>${r.name.startsWith("🏨")?"":"🏠 "}${h(r.name)}</b><span class="small muted">出発</span></span></div>`;
      const s=r.s; const i=st.indexOf(s);
      const mvl=r.mv?`<div class="tpmove">${h(r.mode||'')} 約${mnTxt(r.mv)}${r.km?`（約${Math.round(r.km)}km）`:''}${r.est?' <span class="muted">目安</span>':''}${r.rest?`<br>☕ 途中で休憩 15分×${r.rest}回（運転${mnTxt(restEvery(tr))}ごと）`:''}${r.s.transit?`<span class="tptr">🚃 ${h(r.s.transit)}</span>`:''}${isRail(r.mode)&&!r.s.inn?`<span class="minis" style="padding:0">${transitLinks(r.fromName,placeQ(r.s),D.date,m2t(r.from))}</span>`:''}</div>`:'';
      if(s.inn) return `${mvl}<div class="tpstop tpst"><span class="tm">${m2t(r.arr)}</span><span class="t"><b>${h(s.name)}</b><span class="small muted">着</span></span></div>`;
      return `${mvl}<div class="tpstop"><span class="tm">${m2t(r.arr)}<small>〜${m2t(r.dep)}</small></span><span class="t"><b>${h(s.name)}</b>${s.addr?`<span>${h(s.addr)}${s.addrEst?' <i class="muted">（自動で入れた目安）</i>':''}</span>`:`<span class="noaddr">⚠️ 住所がまだです（ナビ用に入れてください）</span>`}${s.tel?`<span>☎ ${h(s.tel)}</span>`:''}${s.memo?`<span class="small muted">${h(s.memo)}</span>`:''}<span class="small muted">いる時間 ${mnTxt(r.stay)}</span>
      <span class="minis">${s.addr||s.name?mapBtns(s.addr||s.name):''}${s.tel?`<a class="mini tel" href="${telHref(s.tel)}">📞 電話</a>`:''}${s.hp?`<a class="mini" href="${h(s.hp)}" target="_blank" rel="noopener">🌐 HP</a>`:''}
      ${i>0?`<button class="mini" data-act="stopmv" data-id="${tr.id}" data-s="${s.id}" data-c="-1" aria-label="上へ">▲</button>`:''}${i<st.length-1?`<button class="mini" data-act="stopmv" data-id="${tr.id}" data-s="${s.id}" data-c="1" aria-label="下へ">▼</button>`:''}
      <button class="mini" data-act="stopedit" data-id="${tr.id}" data-s="${s.id}">✏️ 直す</button><button class="mini" data-act="stopdel" data-id="${tr.id}" data-s="${s.id}">削除</button></span></span></div>`; }).join('')||'<p class="small muted" style="margin:0">まだありません。</p>'; }
  const sf=ed||{name:'',day:1,time:'',move:'',mv:'',stay:60,addr:'',tel:'',hp:'',memo:''};
  return sub(tr.name,`<div class="sec"><h3>🧳 ${h(tr.name)} <button class="more" data-act="tripedit" data-id="${tr.id}">直す ›</button></h3>
    <p style="margin:0">${tripDateTxt(tr)}</p><p class="small muted" style="margin:4px 0 0">出発：${h(tr.start||'（未入力）')} ${h(tr.startTime||'08:00')}・主な交通：${h(tr.mode||'未選択')}${tripPeople(tr)?'・'+h(tripPeople(tr)):''}${tr.members?'（'+h(tr.members)+'）':''}</p>${tr.memo?`<p class="small" style="white-space:pre-wrap;margin:6px 0 0">${h(tr.memo)}</p>`:''}</div>
  <div class="btns"><button class="btn w" data-act="tripbuild" data-id="${tr.id}">🧭 時間の目安を出して行程を組み立てる</button></div>
  <div class="btns"><button class="btn plain w" data-go="trippaste/${tr.id}">📋 ジェミニなどで作った計画を貼り付ける</button></div>
  <p class="small muted" style="margin:-2px 0 8px">場所と交通手段から、移動時間の目安（地図の直線距離から計算）を入れて並べます。着く時間・いる時間・移動時間は「✏️ 直す」で自由に変えられます。</p>
  ${(()=>{ const n=(tr.stops||[]).filter(s=>!s.addr).length; return n?`<div class="camnote warn" style="margin:0 0 8px">⚠️ 住所が入っていない場所が <b>${n}か所</b> あります。車のナビに入れるため、各場所の「✏️ 直す」で住所と電話番号（あれば）を入れてください。「MAP」を押すとGoogleマップで住所や電話番号を確かめられます。</div>`:''; })()}
  <div class="sec"><h3>📍 行程</h3>${body}</div>
  <div class="btns"><button class="btn w" data-go="tripprint/${tr.id}">📄 旅のしおり${tripHasCar(tr)?'・運行計画表':''}を見る（A4で印刷・PDF）</button></div>
  <form class="sec" data-form="stop" data-id="${tr.id}" data-s="${ed?ed.id:''}" id="stopform"><h3>${ed?'✏️ 行き先を直す':'＋ 行きたい場所を足す'}</h3>
    <div class="f"><label for="sp-n">場所・施設の名前</label><input id="sp-n" name="name" required value="${h(sf.name)}" placeholder="例：清水寺"></div>
    <div class="f"><label for="sp-a">住所（入れると時間の目安が正確になります）</label><input id="sp-a" name="addr" value="${h(sf.addr||'')}"></div>
    <div class="two">${nd>1?`<div class="f"><label for="sp-d">何日目</label><select id="sp-d" name="day">${[...Array(nd)].map((_,i)=>`<option value="${i+1}" ${(+sf.day||1)===i+1?'selected':''}>${i+1}日目</option>`).join('')}</select></div>`:'<input type="hidden" name="day" value="1">'}
      <div class="f"><label for="sp-mv">ここまでの交通手段</label><select id="sp-mv" name="move">${MOVES.map(m=>`<option value="${m}" ${m===(sf.move||'')?'selected':''}>${m||'主な交通手段と同じ'}</option>`).join('')}</select></div></div>
    <div class="two"><div class="f"><label for="sp-st">いる時間（分）</label><input id="sp-st" name="stay" type="number" min="0" step="5" value="${h(sf.stay??60)}"></div><div class="f"><label for="sp-mm">移動時間（分・空なら目安）</label><input id="sp-mm" name="mv" type="number" min="0" step="5" value="${h(sf.mv||'')}"></div></div>
    <div class="f"><label for="sp-t">着く時間を決める（決まっているときだけ）</label><input id="sp-t" type="time" name="time" value="${h(sf.time||'')}"></div>
    <div class="two"><div class="f"><label for="sp-tel">電話</label><input id="sp-tel" name="tel" type="tel" value="${h(sf.tel||'')}"></div><div class="f"><label for="sp-hp">HP</label><input id="sp-hp" name="hp" type="url" placeholder="https://" value="${h(sf.hp||'')}"></div></div>
    <div class="f"><label for="sp-tr">乗り換え・乗る電車やバス（電車・バスのとき）</label><textarea id="sp-tr" name="transit" rows="2" placeholder="例：静岡 8:05 ひかり → 京都 9:50（2号車）／京都 10:02 JR奈良線 → 稲荷">${h(sf.transit||'')}</textarea><span class="small muted">行程の「🚃 乗換案内」で調べて、ここに書いておくとしおりに載ります。</span></div>
    <div class="f"><label for="sp-m">メモ（しおりに載ります）</label><input id="sp-m" name="memo" value="${h(sf.memo||'')}" placeholder="例：拝観料 400円、駐車場あり"></div>
    <div class="btns"><button class="btn" type="submit">${ed?'直す':'足す'}</button>${ed?'<button class="btn plain" type="button" data-act="stopeditno">やめる</button>':''}</div></form>`,{crumb:'おたのしみ › 旅行'});
}
/* ===== 旅のしおり・運行計画表（A4縦） ===== */
function tripSheet(tr){
  const plan=tripPlan(tr); const car=tripHasCar(tr);
  const days=plan.map(D=>`<h3 class="a4h">${plan.length>1?`${D.d}日目　`:''}${D.date?jpDate(D.date):''}</h3><table class="a4t"><tr><th style="width:5.5em">時間</th><th>行き先・すること</th><th style="width:30%">メモ</th></tr>
    ${D.rows.map(r=>r.kind==='start'?`<tr><td>${m2t(r.dep)} 発</td><td>${r.name.startsWith("🏨")?"":"🏠 "}${h(r.name)}</td><td></td></tr>`:`${r.mv?`<tr class="mv"><td></td><td colspan="2">${h(r.mode||'')} 約${mnTxt(r.mv)}${r.km?`・約${Math.round(r.km)}km`:''}${r.rest?`　☕ 途中で休憩15分×${r.rest}回`:''}${r.s.transit?`<br>🚃 ${h(r.s.transit)}`:''}</td></tr>`:''}<tr><td><b>${m2t(r.arr)}</b>${r.s.inn?' 着':'〜'+m2t(r.dep)}</td><td><b>${h(r.s.name)}</b>${r.s.addr?`<br><small>〒 ${h(r.s.addr)}</small>`:r.s.inn?'':'<br><small class="a4miss">住所：</small>'}${r.s.tel?`<br><small>☎ ${h(r.s.tel)}</small>`:''}</td><td><small>${h(r.s.memo||'')}</small></td></tr>`).join('')}</table>`).join('');
  const unko=car?`<div class="a4brk"></div><h2 class="a4title">🚗 運行計画表</h2><p class="a4sub">${h(tr.name)}　${tripDateTxt(tr)}</p>
    ${plan.map(D=>{ let n=0; const rs=D.rows.filter(r=>r.kind!=='start'); let from=(D.rows.find(r=>r.kind==='start')||{}).name||'出発地';
      const lines=rs.map(r=>{
        const row=isCar(r.mode)?`<tr><td>${++n}</td><td>${h(from)} → ${h(r.s.name)}${r.rest?`<br><small>☕ 途中で休憩15分×${r.rest}回</small>`:''}</td><td>${m2t(r.from)}</td><td>${m2t(r.arr)}</td><td>${r.km?Math.round(r.km)+'km':'―'}</td><td>${mnTxt(r.mv)}</td><td class="navi"><small>${r.s.addr?h(r.s.addr):r.s.inn?h(tr.inn):'<span class="a4miss">（住所未入力）</span>'}${r.s.tel?'<br>☎ '+h(r.s.tel):''}</small></td></tr>`:`<tr class="mv"><td></td><td colspan="6">${h(from)} → ${h(r.s.name)}（${h(r.mode||'車以外')}）</td></tr>`;
        from=r.s.name; return row; }).join('');
      return `<h3 class="a4h">${plan.length>1?`${D.d}日目　`:''}${D.date?jpDate(D.date):''}</h3><table class="a4t"><tr><th>No</th><th>区間</th><th>出発</th><th>到着</th><th>距離</th><th>運転</th><th style="width:32%">ナビに入れる住所・電話</th></tr>${lines}
        <tr class="sum"><td></td><td>合計</td><td></td><td></td><td>${D.sumKm?'約'+Math.round(D.sumKm)+'km':'―'}</td><td>${mnTxt(D.sumDrive)}</td><td></td></tr></table>`; }).join('')}
    <p class="a4note">距離と時間は地図の直線距離から計算した目安です（長い距離は高速道路の速さ）。渋滞や道の混み具合で変わります。運転2時間ごとに15分の休憩を入れています。</p>`:'';
  return `<div class="a4" id="a4">
    <h2 class="a4title">🧳 ${h(tr.name)}</h2><p class="a4sub">旅のしおり　${tripDateTxt(tr)}</p>
    <table class="a4t a4info"><tr><th>出発</th><td>${h(tr.start||'')} ${h(tr.startTime||'')}</td></tr>${tripPeople(tr)||tr.members?`<tr><th>行く人</th><td>${h(tripPeople(tr))} ${h(tr.members||'')}</td></tr>`:''}${tr.inn?`<tr><th>泊まる所</th><td>${h(tr.inn)}</td></tr>`:''}<tr><th>主な交通</th><td>${h(tr.mode||'')}</td></tr></table>
    ${days}
    <h3 class="a4h">🎒 持ち物チェック</h3><div class="a4bring">${tripBring(tr).map(x=>`<span>□ ${h(x)}</span>`).join('')}</div>
    ${tr.memo?`<h3 class="a4h">📝 メモ</h3><p class="a4memo">${h(tr.memo)}</p>`:''}
    ${unko}
    <p class="a4foot">BOOTIN で作成</p></div>`;
}
function tripText(tr){
  const plan=tripPlan(tr); let t=`🧳 ${tr.name}\n${tripDateTxt(tr)}\n`; if(tr.members) t+=`行く人：${tr.members}\n`;
  for(const D of plan){ t+=`\n【${plan.length>1?D.d+'日目 ':''}${D.date?jpDate(D.date):''}】\n`;
    for(const r of D.rows){ if(r.kind==='start') t+=`${m2t(r.dep)} ${r.name} 出発\n`; else { if(r.mv) t+=`　↓ ${r.mode||''} 約${mnTxt(r.mv)}${r.rest?`（休憩${r.rest}回）`:''}\n`; if(r.s.transit) t+=`　🚃 ${r.s.transit}\n`; t+=`${m2t(r.arr)} ${r.s.name}${r.s.memo?'（'+r.s.memo+'）':''}\n`; if(r.s.addr) t+=`　〒 ${r.s.addr}\n`; if(r.s.tel) t+=`　☎ ${r.s.tel}\n`; } } }
  if(tr.memo) t+=`\n📝 ${tr.memo}\n`; return t;
}
function vTripPrint(id){
  const tr=(S.trips||[]).find(x=>x.id===id); if(!tr) return sub('旅のしおり','<p>見つかりませんでした。</p>');
  return sub('旅のしおり',`<div class="sec noprint"><h3>📤 皆に送る・印刷する</h3>
    <div class="btns"><button class="btn" data-act="tripshare" data-id="${tr.id}">💬 LINEやメールで送る（文字）</button></div>
    <p class="small" style="margin:2px 0 8px">いちばん簡単です。押すと送り先の一覧が出るので、LINEやメールを選び、送る相手を選びます。行程と時間が文字で届きます。</p>
    <div class="btns"><button class="btn plain" data-act="tripprintgo">📄 PDFにして送る・🖨️ 印刷する</button></div>
    <ol class="small" style="margin:2px 0 0;padding-left:1.3em;line-height:1.7"><li>押すと印刷の画面が出ます。</li><li><b>印刷する</b>ときは、上の「プリンタを選択」でプリンターを選んで印刷。</li><li><b>PDFにする</b>ときは、「PDF形式で保存」を選んで保存。スマホの「ダウンロード」に入ります。</li><li>LINEのトークで「＋」→「ファイル」から、そのPDFを選んで送ります。</li></ol>
    <p class="small muted" style="margin:6px 0 0">しおりの見本は下に出ています（A4縦）。</p></div>
  ${tripSheet(tr)}`,{crumb:'旅行計画'});
}
function tripOf(el){ return (S.trips||[]).find(x=>x.id===el.dataset.id); }
Object.assign(ACTS,{
  tripedit:el=>{ UI.tripEdit=el.dataset.id; render(); },
  tripdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='もう一度押すと削除'; return; } S.trips=(S.trips||[]).filter(x=>x.id!==el.dataset.id); UI.tripEdit=''; save(); go('trips',true); },
  stopdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='削除？'; return; } const t=tripOf(el); if(t){ t.stops=t.stops.filter(s=>s.id!==el.dataset.s); save(); render(); } },
  stopedit:el=>{ UI.stopEdit=el.dataset.s; render(); setTimeout(()=>$('#stopform')?.scrollIntoView({behavior:'smooth'}),50); },
  stopeditno:()=>{ UI.stopEdit=''; render(); },
  stopmv:el=>{ const t=tripOf(el); if(!t) return; const s=t.stops.find(x=>x.id===el.dataset.s); const L=tripStops(t,+s.day||1); L.forEach((x,i)=>x.ord=i);
    const i=L.indexOf(s), j=i+(+el.dataset.c); if(j<0||j>=L.length) return; [L[i].ord,L[j].ord]=[L[j].ord,L[i].ord]; save(); render(); },
  tripbuild:async el=>{ const t=tripOf(el); if(!t) return; toast('時間の目安を調べています…');
    let ok=0, ng=0; const pt=async q=>q?await geocode(q):null;
    if(t.start&&t.slat==null){ const g=await pt(t.start); if(g){ t.slat=g.lat; t.slon=g.lon; } }
    if(t.inn&&t.ilat==null){ const g=await pt(t.inn); if(g){ t.ilat=g.lat; t.ilon=g.lon; } }
    const nd=tripDays(t); let prev=t.slat!=null?{lat:t.slat,lon:t.slon}:null;
    for(let d=1;d<=nd;d++){ const L=tripStops(t,d); L.forEach((x,i)=>x.ord=i); if(d>1&&t.ilat!=null) prev={lat:t.ilat,lon:t.ilon};
      for(const s of L){ if(s.lat==null){ const g=await tripGeo(s.addr||s.name); if(g){ s.lat=g.lat; s.lon=g.lon; if(!s.addr&&g.title){ s.addr=g.title; s.addrEst=true; } } }
        if(s.lat!=null&&prev&&prev.lat!=null){ s.km=Math.round(kmBetween(prev.lat,prev.lon,s.lat,s.lon)*1.3*10)/10; ok++; } else if(prev) ng++;
        if(s.lat!=null) prev=s; } }
    save(); render(); toast(ng?`${ok}か所の目安を入れました。${ng}か所は場所が見つからず、移動30分で仮置きしました（住所を入れると直ります）`:'行程を組み立てました。直したい所は「✏️ 直す」で'); },
  tripprintgo:()=>{ try{ window.print(); }catch(e){ toast('このスマホでは印刷の画面を出せませんでした'); } },
  tripshare:async el=>{ const t=tripOf(el); if(!t) return; const tx=tripText(t);
    try{ if(navigator.share){ await navigator.share({title:t.name,text:tx}); return; } }catch(e){ if(e&&e.name==='AbortError') return; }
    try{ await navigator.clipboard.writeText(tx); toast('文字をコピーしました。LINEなどに貼り付けてください'); }catch(e){ toast('送れませんでした'); } }
});
FORMS.trip=(f,fd)=>{ S.trips=S.trips||[]; const id=f.dataset.id; const t=id?S.trips.find(x=>x.id===id):{id:uid(),stops:[]};
  const st=String(fd.get('start')||'').trim(); if(st!==(t.start||'')){ t.slat=null; t.slon=null; }
  const inn=String(fd.get('inn')||'').trim(); if(inn!==(t.inn||'')){ t.ilat=null; t.ilon=null; } t.inn=inn;
  Object.assign(t,{name:String(fd.get('name')).trim(),from:fd.get('from')||'',to:fd.get('to')||fd.get('from')||'',memo:String(fd.get('memo')||'').trim(),
    adults:fd.get('adults')||'',children:fd.get('children')||'',kids:fd.get('kids')||'',start:st,startTime:fd.get('startTime')||'08:00',dayStart:fd.get('dayStart')||'09:00',mode:fd.get('mode')||'',members:String(fd.get('members')||'').trim()});
  if(!id) S.trips.push(t); UI.tripEdit=''; save(); toast('保存しました'); go('trips/'+t.id,true); };
FORMS.stop=(f,fd)=>{ const t=tripOf(f); if(!t) return; const hp=String(fd.get('hp')||'').trim(); const sid=f.dataset.s;
  const v={day:+fd.get('day')||1,time:fd.get('time')||'',name:String(fd.get('name')).trim(),addr:String(fd.get('addr')||'').trim(),tel:String(fd.get('tel')||'').trim(),hp:/^https?:\/\//.test(hp)?hp:'',memo:String(fd.get('memo')||'').trim(),move:fd.get('move')||'',transit:String(fd.get('transit')||'').trim(),
    mv:fd.get('mv')===''?'':+fd.get('mv'),stay:fd.get('stay')===''?60:+fd.get('stay')};
  if(sid){ const s=t.stops.find(x=>x.id===sid); if(s){ if(s.addr!==v.addr||s.name!==v.name){ s.lat=null; s.lon=null; s.km=null; } if(s.addr!==v.addr) s.addrEst=false; Object.assign(s,v); } UI.stopEdit=''; toast('直しました'); }
  else { t.stops.push({id:uid(),ord:tripStops(t,v.day).length,...v}); toast('足しました'); }
  save(); render(); };
