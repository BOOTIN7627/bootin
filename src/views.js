/* ===== 画面 ===== */
const IN_FRAME=(()=>{try{return window.top!==window;}catch(e){return true;}})();
let stack=['home'];
const UI={plArea:'home',plNear:null,editGrid:false,dayCat:'',calCat:'',pCat:'',pQ:'',plBig:'',plQ:'',shopTab:'often',memoSrc:'',memoQ:'',toolTab:'clock',openReds:new Set(),confirm:''};
const cur=()=>stack[stack.length-1];
function go(r,replace){
  UI.confirm='';
  if(replace) stack[stack.length-1]=r; else stack.push(r);
  if(!IN_FRAME){ try{ replace?history.replaceState(null,'','#'+r):history.pushState(null,'','#'+r);}catch(e){} }
  render(); window.scrollTo(0,0);
}
function back(){
  if(stack.length>1){ if(!IN_FRAME){ history.back(); return; } stack.pop(); render(); window.scrollTo(0,0); }
  else go('home',true);
}
window.addEventListener('popstate',()=>{ if(IN_FRAME) return; const r=decodeURI(location.hash.slice(1))||'home'; if(stack.length>1&&stack[stack.length-2]===r) stack.pop(); else stack=r==='home'?['home']:['home',r]; render(); });

function openNode(id){
  const im=implOf(id);
  const R={cal:'cal/'+today().slice(0,7),people:'people',places:'places',shops:'shops',memo:'memo',tools:'tools',search:'search/',settings:'settings',data:'data',weather:'weather',otayori:'otayori',meds:'meds'};
  go(im?(R[im]||im):'node/'+id);
}

const BOO_IMG=`<img src="${BOO_F}" alt="ぶーちん">`;
function sub(title,body,opt={}){
  return `<div class="hd"><button class="ib" data-act="back" aria-label="もどる">← もどる</button><div class="grow"><h1>${h(title)}</h1>${opt.crumb?`<div class="small muted">${opt.crumb}</div>`:''}</div><button class="topbtn" data-go="home" aria-label="トップ画面へ">TOPへ</button></div>${body}`;
}
function crumbOf(id){ const parts=[]; let n=NODES[NODES[id]?.parent]; while(n){parts.unshift(n.name); n=NODES[n.parent];} return parts.map(h).join(' › '); }
function sayBoo(text){return `<div class="say">${BOO_IMG}<div class="b">${text}</div></div>`;}

/* ---------- トップ画面 ---------- */
const WXT={0:['☀️','晴れ'],1:['🌤️','晴れ'],2:['⛅','くもり時々晴れ'],3:['☁️','くもり'],45:['🌫️','きり'],48:['🌫️','きり'],51:['🌦️','小雨'],53:['🌦️','小雨'],55:['🌧️','雨'],56:['🌧️','冷たい雨'],57:['🌧️','冷たい雨'],61:['🌧️','雨'],63:['🌧️','雨'],65:['🌧️','強い雨'],66:['🌧️','冷たい雨'],67:['🌧️','冷たい雨'],71:['🌨️','雪'],73:['🌨️','雪'],75:['❄️','大雪'],77:['🌨️','雪'],80:['🌦️','にわか雨'],81:['🌧️','にわか雨'],82:['⛈️','激しい雨'],85:['🌨️','にわか雪'],86:['❄️','大雪'],95:['⛈️','雷雨'],96:['⛈️','雷雨'],99:['⛈️','雷雨']};
const wxt=c=>WXT[c]||['🌡️',''];
function menuCells(){
  return S.set.grid.slice(0,9).filter(id=>NODES[id]&&!isOff(id)).map(id=>`<button class="cell" data-act="open" data-id="${h(id)}"><span class="em">${emojiOf(id)}</span><span class="nm">${h(NODES[id].name)}</span></button>`).join('');
}
function vHome(){
  const t=today(); const l=lunar(t); const elder=S.set.mode==='elder'; const stu=S.set.mode==='student';
  const items=itemsOn(t).slice(0,4);
  let grid=S.set.grid.slice(0,9); while(grid.length<9) grid.push('');
  const show=grid;
  const cells=show.map((id,i)=>{
    const n=NODES[id]; const ok=n&&!isOff(id);
    const ctl=UI.editGrid?`<span class="ctl"><button data-act="gmove" data-i="${i}" data-d="-1" aria-label="前へ">◀</button><button data-act="gpick" data-i="${i}" aria-label="変える">✎</button><button data-act="gmove" data-i="${i}" data-d="1" aria-label="後ろへ">▶</button></span>`:'';
    if(!ok) return `<div class="cell empty" ${UI.editGrid?'':`data-act="gpick" data-i="${i}" role="button" tabindex="0"`}><span class="em">＋</span><span class="nm">空き</span>${ctl}</div>`;
    const tag=UI.editGrid?'div':'button';
    return `<${tag} class="cell" ${UI.editGrid?'':`data-act="open" data-id="${h(id)}"`}><span class="em">${emojiOf(id)}</span><span class="nm">${h(n.name)}</span>${ctl}</${tag}>`;
  }).join('');
  const todaySec=`<div class="sec t-today"><h2>今日の予定 <button class="more" data-go="day/${t}">1日のカード ›</button></h2>${gomiTag(t)}${tobanTag()}
    ${items.length?`<div class="evs">${items.map(it=>evRow(it,t,true)).join('')}</div>`:`<p class="muted" style="margin:0">今日の予定はまだありません。</p>`}
    <div class="btns"><button class="btn plain" data-go="evnew/${t}">＋ 予定を入れる</button>${(S.gomi||[]).length?'':'<button class="btn plain" data-go="gomi">🗑️ ゴミの日を登録</button>'}</div></div>`;
  const fav=elder?S.people.filter(p=>p.fav&&p.phones&&p.phones[0]&&p.phones[0].num):[];
  const glow=clockGlowOn();
  const head0=elder?`<button class="ib hb moshi" data-go="bosai">🚨 もしものとき</button><button class="ib hb help" data-act="otasuke">🆘 おたすけ</button><button class="ib hb kuro" data-go="kuro"><img src="${charaImg('kuro')}" alt="">聞く</button>`
    :stu?`<button class="ib hb dic" data-go="dict/kokugo">国語</button><button class="ib hb dic" data-go="dict/kanwa">漢和</button><button class="ib hb dic" data-go="dict/waei">和英</button><button class="ib hb kuro" data-go="kuro"><img src="${charaImg('kuro')}" alt="">聞く</button>`
    :`<button class="ib hb ghost icon" data-go="search/" aria-label="アプリ内検索">🔍</button><button class="ib hb kuro" data-go="kuro"><img src="${charaImg('kuro')}" alt="">クロにゃんに聞く</button>`;
  return `
  <div class="hcol1"><div class="hd hhd"><button class="brand grow" data-act="opening" aria-label="BOOTIN（オープニングを見る）"><img src="${BOO_F}" alt=""><span>BOOTIN</span></button>
    ${elder||stu?'':head0}<button class="ib hb ghost icon gear" data-go="settings" aria-label="設定">⚙️</button></div>${elder||stu?`<div class="hbtns ${elder?'el':'st'}">${head0}</div>`:''}
  <div class="clockw"><button class="clock ${glow?'glow':''}" id="clockBox" data-go="tools"><span class="d" id="clockD">${jpDate(t)}</span><span class="t" id="clockT">--:--</span>
    <span class="k">${wareki(t)}${l?`・旧暦${l.leap?'閏':''}${l.m}月${l.d}日・${rokuyo(t)}`:''}${sekki(t)?`・${sekki(t)}`:''}${holJP(t)?`・${holJP(t)}`:''}</span></button>
    <button class="cglow" data-act="cglow" aria-label="時計の光り方を変える（今：${['光らない','夜だけ光る','いつも光る'][['off','night','on'].indexOf(S.set.clockGlow||'off')]}）">${{off:'✨',night:'🌙',on:'💡'}[S.set.clockGlow||'off']}</button></div>
  ${bosaiBar()}
  ${UI.editGrid?`<div class="grid">${cells}</div>`:`<div class="topnav ${elder?'elder':''}"><div class="grid compact sq">${stu?stuCells9():cells}</div>
    <div class="quick"><button class="qb q-cal" data-go="cal/${t.slice(0,7)}"><span class="em">📅</span><span>カレンダー</span></button>
    <button class="qb q-day" data-go="day/${t}"><span class="em">🗓️</span><span>1日のカード</span></button>
    <button class="qb q-navi ${elder?'nabi':''}" data-go="navi"><span class="em">🧭</span><span>ナビ</span></button></div></div>`}
  ${quickRows()}
  ${UI.editGrid?`<div class="editbar"><span class="small muted">◀ ▶ で並べかえ、✎ で中身を変えます</span><button class="ib" data-act="gedit">✓ できあがり</button></div>`:''}
  ${rainNote()}${laundryBar()}
  <div class="mobile-only">${todaySec}</div>${stuTop()}${medTop()}
  <div class="minirow">${miniCal()}<div class="minibox">${wxMini()}${otaMini()}</div></div>
  ${UI.editGrid?'':`<div class="editbar end"><button class="ib ghost" data-act="gedit">⇄ ボタンの並べかえ</button></div>`}
  </div><div class="hcol2 pc-only">${todaySec}${topCal()}</div>`;
}
/* 時計を光らせる：off／night（夜6時〜朝6時）／on */
function clockGlowOn(){ const g=S.set.clockGlow||'off'; if(g==='on') return true; if(g==='night'){ const hr=new Date().getHours(); return hr>=18||hr<6; } return false; }
/* トップの小さい天気：マークと気温だけ。雨のときだけ「今 雨」 */
function wxMini(){
  const w=S.cache.wx&&S.cache.wx.data;
  if(!w) return `<button class="mini-wx" data-go="weather"><span class="big">🌤️</span><span class="t"><em>📍${h(S.set.wx.name)}</em><b>天気</b></span></button>`;
  const c=w.current.weather_code, raining=RAINCODES.includes(c);
  return `<button class="mini-wx ${raining?'rain':''}" data-go="weather" aria-label="${h(S.set.wx.name)}の天気 ${h(wxt(c)[1])} ${Math.round(w.current.temperature_2m)}度"><span class="big">${wxt(c)[0]}</span><span class="t"><em>📍${h(S.set.wx.name)}</em><b>${Math.round(w.current.temperature_2m)}℃</b>${raining?'<i>今 雨</i>':''}</span></button>`;
}
/* ぶーちんのお便り：キャラと「ぶーちんより」、新しいのが来たら「新着」 */
function otaKey(){ const o=OTAYORI[0]; return o?o.d+'|'+o.t:''; }
function otaMini(){ const isNew=S.set.otaSeen!==otaKey();
  return `<button class="mini-ota" data-go="otayori"><img src="${BOO_F}" alt=""><span class="t">ぶーちんより</span>${isNew?'<span class="newb">新着</span>':''}</button>`; }
/* 日にちだけの小さいカレンダー（押すと大きいカレンダー、日を押すと1日のカード） */
function miniCal(){
  const t=today(); const [y,m]=t.split('-').map(Number); const first=new Date(y,m-1,1), days=new Date(y,m,0).getDate();
  let cells=''; for(let i=0;i<first.getDay();i++) cells+='<span></span>';
  for(let d=1;d<=days;d++){ const s=`${y}-${pad(m)}-${pad(d)}`; const wd=(first.getDay()+d-1)%7; const has=itemsOn(s).length>0;
    cells+=`<button class="${s===t?'td':''} ${wd===0||holJP(s)?'su':wd===6?'sa':''}" data-go="day/${s}" aria-label="${m}月${d}日${has?' 予定あり':''}">${d}${has?'<i></i>':''}</button>`; }
  return `<div class="minical"><button class="mch" data-go="cal/${t.slice(0,7)}">${y}年${m}月 <span>大きく ›</span></button><div class="mcw">${'日月火水木金土'.split('').map((x,i)=>`<span class="${i===0?'su':i===6?'sa':''}">${x}</span>`).join('')}</div><div class="mcg">${cells}</div></div>`;
}
function evRow(it,s,compact){
  if(it.k==='an'){ const a=it.a; return `<div class="ev" style="border-left-color:${it.color}"><span class="tm">${a.em||(a.me?'🎂':'💐')}</span><span class="bd"><button style="all:unset;cursor:pointer;display:block" data-go="${a.go||(a.em?'kids':'profile')}"><b>${h(a.name)}${it.yrs!=null?`（${it.yrs}${a.me?'歳':'周年'}）`:''}</b>${a.memo&&!compact?`<span>${h(a.memo)}</span>`:''}</button></span></div>`; }
  if(it.k==='bd'){ const p=it.p; const tel=p.phones&&p.phones.find(x=>x.num);
    return `<div class="ev" style="border-left-color:${it.color}"><span class="tm">🎂</span><span class="bd"><button style="all:unset;cursor:pointer" data-go="person/${p.id}"><b>${h(p.name)}さんの誕生日${it.age!=null?`（${it.age}歳）`:''}</b></button>${tel&&!compact?`<span class="minis"><a class="mini tel" href="${telHref(tel.num)}">📞 電話</a></span>`:''}</span></div>`; }
  const e=it.e; const pl=placeOf(e); const ppl=(e.people||[]).map(id=>S.people.find(p=>p.id===id)).filter(Boolean);
  const tm=e.time?(e.time+(e.etime&&!compact?`<br><span class="small muted">〜${e.etime}</span>`:'')):(e.tmode==='unknown'?'<span class="unk">時刻<br>不明</span>':'終日');
  return `<div class="ev" style="border-left-color:${it.color}"><span class="tm">${tm}</span><span class="bd">
    <button style="all:unset;cursor:pointer;display:block" data-go="ev/${e.id}"><b>${h(e.title)}</b>
    <span>${h(evCat(e.cat).name)}${e.rep?'・'+REP_LABEL[e.rep]:''}${pl?'・📍'+h(pl.name):''}${ppl.length?'・'+ppl.map(p=>h(p.name)).join('、'):''}</span>
    ${e.memo&&!compact?`<span>${h(e.memo)}</span>`:''}</button>
    ${!compact&&(pl||ppl.some(p=>p.phones&&p.phones[0]&&p.phones[0].num))?`<span class="minis">${pl?mapBtns(pl.q):''}${ppl.filter(p=>p.phones&&p.phones[0]&&p.phones[0].num).map(p=>`<a class="mini tel" href="${telHref(p.phones[0].num)}">📞 ${h(p.name)}</a>`).join('')}</span>`:''}
  </span></div>`;
}

/* ---------- 枠のページと【準備中】 ---------- */
const WHEN={'★★':['s','年明け'],'♠♠':['p','3月ごろ'],'♥♥':['p','その後']};
function vNode(id){
  const n=NODES[id]; if(!n) return sub('見つかりません','<p>この画面は見つかりませんでした。</p>');
  if(n.lv==='y'||!n.kids.length){
    const items=n.items||[];
    return sub(n.name,`${lvBand(n)}<div class="junbi">${BOO_IMG}<div><span class="stamp">【準備中】</span></div><p>「${h(n.name)}」はただいま準備中です。<br>できたら、ぶーちんのお便りでお知らせします。</p></div>
      ${items.length?`<div class="sec"><h3>この中に入る予定のもの</h3><ul class="plan">${items.map(([t,c,w])=>`<li>${WHEN[w]?`<span class="when ${WHEN[w][0]}">${WHEN[w][1]}</span>`:''}<span>${h(t)}</span></li>`).join('')}</ul></div>`:''}
      <div class="btns"><button class="btn plain" data-act="qmemo">✏️ ここに欲しいことをメモ</button></div>`,{crumb:crumbOf(id)});
  }
  const kids=n.kids.filter(k=>!isOff(k)).sort((a,b)=>hasImpl(b)-hasImpl(a)); const hidden=n.kids.length-kids.length;
  return sub(n.name,`${lvBand(n)}<div class="list lvlist lv-${n.lv==='r'?'b':'y'}">${kids.map(k=>{const kn=NODES[k];const ok=hasImpl(k);
      return `<button class="row" data-act="open" data-id="${h(k)}"><span class="em">${emojiOf(k)}</span><span class="t"><b>${h(kn.name)}</b><span>${kn.kids.length?kn.kids.map(x=>NODES[x].name).join('・'):(kn.items||[]).slice(0,2).map(x=>x[0]).join('・')}</span></span>${ok?'<span class="badge ok">使える</span>':'<span class="badge wait">準備中</span>'}<span class="go">›</span></button>`;}).join('')}</div>
    ${hidden?`<p class="small muted">オフにしている機能が${hidden}個あります。<button class="more" style="background:none;border:0;color:var(--accent);font-weight:700" data-go="features">設定で出す</button></p>`:''}${id==='設定・機能'?`<button class="row guiderow" data-go="menumap" style="margin-top:10px"><span class="em">🗺️</span><span class="t"><b>メニューの全体図</b><span>どのボタンの中に、どの機能があるかを一覧で見られます</span></span><span class="go">›</span></button><p class="small muted" style="text-align:center">この画面の版：${BUILD}</p>`:''}`,{crumb:crumbOf(id)});
}

/* ---------- 1日のカード ---------- */
function vDay(s){
  if(!/^\d{4}-\d\d-\d\d$/.test(s)) s=today();
  const l=lunar(s); const hj=holJP(s); const hc=holCN(s); const sk=sekki(s);
  const items=itemsOn(s,UI.dayCat);
  const chips=[{id:'',name:'すべて'}].concat(S.set.evcats).map(c=>`<button class="chip" aria-pressed="${UI.dayCat===c.id}" data-act="daycat" data-c="${c.id}">${c.color?`<span class="dot" style="background:${c.color}"></span>`:''}${h(c.name)}</button>`).join('');
  const NEXT=[['❤️ 健康の記録','健康/健康管理/健康管理'],['📔 日記','おたのしみ/日記・ブログ/日記'],['🍳 料理の記録','生活管理/日常管理/料理'],['📺 TV','おたのしみ/TV/番組']].filter(x=>NODES[x[1]]&&!isOff(x[1]));
  return sub('1日のカード',`
  <div class="dayhd"><button class="arrow" data-go-r="day/${addDays(s,-1)}" aria-label="前の日">◀</button>
    <div class="c"><b class="${dayClass(s)}">${jpDate(s)}</b></div>
    <button class="arrow" data-go-r="day/${addDays(s,1)}" aria-label="次の日">▶</button></div>
  <div class="koyomi"><span class="kk">${wareki(s)}</span>${l?`<span class="kk">旧暦 ${l.leap?'閏':''}${l.m}月${l.d}日</span><span class="kk">${rokuyo(s)}</span>`:''}${sk?`<span class="kk">${sk}</span>`:''}
    ${hj?`<button class="kk hol" data-act="explain" data-k="jp" data-n="${h(hj)}">🎌 ${h(hj)} ⓘ</button>`:''}${hc?`<button class="kk cn" data-act="explain" data-k="cn" data-n="${h(hc)}">中国：${h(hc)} ⓘ</button>`:''}
    ${s!==today()?`<button class="kk" data-go-r="day/${today()}">今日へ</button>`:''}</div>
  <div class="chips">${chips}</div>${gomiTag(s)}
  ${items.length?`<div class="evs">${items.map(it=>evRow(it,s,false)).join('')}</div>`:`<div class="empty">この日の予定はありません。</div>`}
  ${medDay(s)}
  <div class="btns"><button class="btn" data-go="evnew/${s}">＋ 予定を入れる</button><button class="btn plain" data-go="cal/${s.slice(0,7)}">📅 月のカレンダー</button></div>
  <div class="sec"><h3>📝 大きなメモ欄</h3><textarea id="daymemo" class="search" style="min-height:140px" placeholder="この日のメモ。キーボードのマイクを押すと、声でも入れられます">${h(S.daymemo[s]||'')}</textarea><p class="small muted" style="margin:4px 0 0">書いたものは自動で保存され、「さっとメモ」の一覧にも出ます。</p></div>
  ${NEXT.length?`<div class="sec"><h3>つぎへ</h3><div class="btns">${NEXT.map(([t,id])=>`<button class="btn plain" data-act="open" data-id="${h(id)}">${t}</button>`).join('')}</div></div>`:''}`);
}

/* ---------- 月のカレンダー ---------- */
function calGrid(ym,cat){
  const [y,m]=ym.split('-').map(Number); const first=new Date(y,m-1,1); const start=new Date(y,m-1,1-first.getDay());
  const weeks=Math.ceil((first.getDay()+new Date(y,m,0).getDate())/7);
  return calCells(start,weeks,cat,d=>d.getMonth()!==m-1?'out':'');
}
function calFromToday(cat){
  const n=new Date(); const start=new Date(n.getFullYear(),n.getMonth(),n.getDate()-n.getDay()); const t=today();
  return calCells(start,5,cat,d=>{const s=ymd(d); if(s<t) return 'past'; return d.getMonth()!==n.getMonth()?'nx':'';});
}
function topCal(){
  const mode=S.set.topCal||'from'; const t=today(); const ym=UI.topYm||'';
  const show=ym&&ym!==t.slice(0,7)?ym:'';
  const base=show||t.slice(0,7); const [y,m]=base.split('-').map(Number);
  const prev=ymd(new Date(y,m-2,1)).slice(0,7), next=ymd(new Date(y,m,1)).slice(0,7);
  const body=show?calGrid(show,''):(mode==='from'?calFromToday(''):calGrid(t.slice(0,7),''));
  return `<div class="sec t-cal"><h2>📅 カレンダー <button class="more" data-go="cal/${show||t.slice(0,7)}">大きく見る ›</button></h2>
  <div class="chips" style="padding-top:0"><button class="chip" aria-pressed="${!show&&mode==='from'}" data-act="topcal" data-c="from">今日から1か月</button><button class="chip" aria-pressed="${!show&&mode==='month'}" data-act="topcal" data-c="month">今月（${+t.slice(5,7)}月）</button></div>
  ${calNav(show?`${y}年${m}月`:(mode==='from'?'今日から1か月':`${y}年${m}月`),`data-act="topym" data-ym="${prev}"`,`data-act="topym" data-ym="${next}"`,show?`data-act="topym" data-ym=""`:'')}
  <div data-swipe="top" data-prev="${prev}" data-next="${next}">${body}</div>
  ${!show&&mode==='from'?`<p class="small muted" style="margin:4px 0 0">色の付いた日は来月です。</p>`:''}</div>`;
}
/* 前の月・次の月・今日 のボタン（左右に指でスライドしても動く） */
function calNav(title,pa,na,ta){
  return `<div class="calnav"><button class="btn plain" ${pa} aria-label="前の月">◀ 前の月</button><div class="c"><b>${title}</b>${ta?`<button class="todayb" ${ta}>今日へ</button>`:''}</div><button class="btn plain" ${na} aria-label="次の月">次の月 ▶</button></div>`;
}
function calCells(start,weeks,cat,cls){
  const t=today(); let cells='';
  for(let i=0;i<weeks*7;i++){
    const d=new Date(start); d.setDate(start.getDate()+i); const s=ymd(d);
    const its=itemsOn(s,cat); const hj=holJP(s); const hc=holCN(s);
    const shown=its.slice(0,2).map(it=>`<span class="e" style="background:${it.color}">${it.k==='bd'?'🎂'+h(it.p.name):it.k==='an'?(it.a.em||(it.a.me?'🎂':'💐'))+h(it.a.name):(it.e.time?it.e.time.replace(/^0/,'')+' ':'')+h(it.e.title)}</span>`).join('');
    const c=cls(d); cells+=`<button class="dy ${c} ${s===t?'today':''}" data-go="day/${s}" aria-label="${jpDate(s)} 予定${its.length}件"><span class="n ${dayClass(s)}">${d.getDate()===1&&c!=='out'?(d.getMonth()+1)+'/':''}${d.getDate()}</span>${hj?`<span class="hn">${h(hj)}</span>`:hc?`<span class="hn" style="color:#B23A3A">${h(hc)}</span>`:''}${shown}${its.length>2?`<span class="mo">他${its.length-2}件</span>`:''}</button>`;
  }
  return `<div class="cal">${[...WD].map((w,i)=>`<div class="wd ${i===0?'c-sun':i===6?'c-sat':''}">${w}</div>`).join('')}${cells}</div>`;
}
function vCal(ym){
  if(!/^\d{4}-\d\d$/.test(ym)) ym=today().slice(0,7);
  const [y,m]=ym.split('-').map(Number);
  const prev=ymd(new Date(y,m-2,1)).slice(0,7), next=ymd(new Date(y,m,1)).slice(0,7); const t=today();
  const chips=[{id:'',name:'総合'}].concat(S.set.evcats).map(c=>`<button class="chip" aria-pressed="${UI.calCat===c.id}" data-act="calcat" data-c="${c.id}">${c.color?`<span class="dot" style="background:${c.color}"></span>`:''}${h(c.name)}</button>`).join('');
  return sub('カレンダー',`
  <div class="c" style="text-align:center"><b style="font-size:1.4rem">${y}年${m}月</b> <span class="small muted">${wareki(ym+'-01')}</span></div>
  ${calNav(`${m}月`,`data-go-r="cal/${prev}"`,`data-go-r="cal/${next}"`,ym!==t.slice(0,7)?`data-go-r="cal/${t.slice(0,7)}"`:'')}
  <div class="chips">${chips}</div>
  <div class="calview"><span class="seg">${[['m','月'],['w','1週間']].map(([k,n])=>`<button aria-pressed="${(S.set.calView||'m')===k}" data-act="calview" data-c="${k}">${n}</button>`).join('')}</span>
   <span class="seg">${[['','文字ふつう'],['big','文字大きく']].map(([k,n])=>`<button aria-pressed="${(S.set.calBig||'')===k}" data-act="calbig" data-c="${k}">${n}</button>`).join('')}</span></div>
  ${(S.set.calView||'m')==='w'?calWeek(ym):`<div data-swipe="big" data-prev="${prev}" data-next="${next}" class="${S.set.calBig?'calbig':''}">${calGrid(ym,UI.calCat)}</div>`}
  <p class="small muted">左右に指でスライドしても月が変わります。日にちを押すと、その日の「1日のカード」が開きます。<span class="c-hol"><span style="display:inline-block;width:1.1em;height:1.1em;border-radius:50%;background:rgba(229,57,53,.2);vertical-align:-3px;margin-right:2px"></span>祝日</span>　<span class="c-sun">■日曜</span>　<span class="c-sat">■土曜</span></p>
  <div class="btns"><button class="btn" data-go="evnew/${ym===t.slice(0,7)?t:ym+'-01'}">＋ 予定を入れる</button></div>`);
}

/* ---------- 予定を入れる ---------- */
function timeSel(name,val,id){
  const step=+S.set.minStep||15; const [vh,vm]=(val||'').split(':'); const hs=+S.set.hFrom, he=+S.set.hTo;
  const main=[],other=[]; for(let i=0;i<24;i++) (i>=hs&&i<=he?main:other).push(i);
  const opt=i=>`<option value="${pad(i)}" ${vh===pad(i)?'selected':''}>${i}時</option>`;
  const mins=[]; for(let m=0;m<60;m+=step) mins.push(m); if(vm&&!mins.includes(+vm)){mins.push(+vm);mins.sort((a,b)=>a-b);}
  return `<span class="tsel"><select id="${id}" name="${name}_h" aria-label="時"><option value="">--</option>${main.map(opt).join('')}${other.length?`<optgroup label="早朝・深夜">${other.map(opt).join('')}</optgroup>`:''}</select><select name="${name}_m" aria-label="分">${mins.map(m=>`<option value="${pad(m)}" ${vm===pad(m)?'selected':''}>${pad(m)}分</option>`).join('')}</select></span>`;
}
function vEvent(id,date){
  const isNew=!id; const e=isNew?{date:date||today(),time:'',etime:'',cat:'home',title:'',place:'',placeId:'',people:[],memo:'',rep:'',until:''}:S.events.find(x=>x.id===id);
  if(!e) return sub('予定','<p>この予定は見つかりませんでした。</p>');
  const pls=S.places.slice().sort((a,b)=>a.name.localeCompare(b.name,'ja'));
  const ppl=S.people.slice().sort((a,b)=>(a.kana||a.name).localeCompare(b.kana||b.name,'ja'));
  return sub(isNew?'予定を入れる':'予定を直す',`<form data-form="event" data-id="${id||''}">
  <div class="f"><label for="ev-title">なにをする</label><input id="ev-title" name="title" required value="${h(e.title)}" placeholder="例：歯医者、町内会の溝掃除"></div>
  <div class="two"><div class="f"><label for="ev-date">日にち</label><input id="ev-date" type="date" name="date" required value="${e.date}"></div>
    <div class="f"><label for="ev-rep">くり返し</label><select id="ev-rep" name="rep">${[['','なし'],['w','毎週'],['m','毎月'],['y','毎年']].map(([v,t])=>`<option value="${v}" ${e.rep===v?'selected':''}>${t}</option>`).join('')}</select></div></div>
  <div class="f"><span class="lb">時刻</span><div class="choose" id="ev-tmode">${[['set','🕘 時刻を決める'],['allday','☀️ 終日'],['unknown','❓ 時刻不明']].map(([v,t])=>`<label><input type="radio" name="tmode" value="${v}" ${(e.time?'set':(e.tmode==='unknown'?'unknown':(isNew?'set':'allday')))===v?'checked':''}>${t}</label>`).join('')}</div>
  <p class="small muted" style="margin:4px 0 0">終日＝一日じゅうの予定。時刻不明＝あるのは決まっているが、時間がまだわからない予定。</p></div>
  <div id="ev-times" ${e.time||isNew?'':'hidden'}><div class="two"><div class="f"><label for="ev-time">始まり</label>${timeSel('time',e.time,'ev-time')}</div>
    <div class="f"><label for="ev-etime">終わり（なくてもよい）</label>${timeSel('etime',e.etime,'ev-etime')}</div></div>
  <p class="small muted" style="margin:2px 0 0">分は${S.set.minStep||15}分きざみ。きざみ方とよく使う時間帯は「設定」で変えられます。</p></div>
  <div class="f"><span class="lb">カテゴリー（色）</span><div class="choose">${S.set.evcats.map(c=>`<label><input type="radio" name="cat" value="${c.id}" ${e.cat===c.id?'checked':''}><span class="dot" style="background:${c.color}"></span>${h(c.name)}</label>`).join('')}</div></div>
  <div class="f"><label for="ev-pid">場所（施設帳から選ぶ）</label><select id="ev-pid" name="placeId"><option value="">― 選ばない ―</option>${pls.map(p=>`<option value="${p.id}" ${e.placeId===p.id?'selected':''}>${h(p.name)}</option>`).join('')}</select></div>
  <div class="f"><label for="ev-place">場所（自由に書く）</label><input id="ev-place" name="place" value="${h(e.place||'')}" placeholder="例：静岡駅北口、〇〇公民館"></div>
  ${ppl.length?`<div class="f"><span class="lb">いっしょの人（人物帳から）</span><div class="choose">${ppl.map(p=>`<label><input type="checkbox" name="people" value="${p.id}" ${(e.people||[]).includes(p.id)?'checked':''}>${h(p.name)}</label>`).join('')}</div></div>`:''}
  <div class="f"><label for="ev-memo">メモ</label><textarea id="ev-memo" name="memo" placeholder="持ち物、話すことなど">${h(e.memo||'')}</textarea></div>
  <div class="btns"><button class="btn" type="submit">登録する</button>${isNew?'':`<button class="btn danger" type="button" data-act="delev" data-id="${id}">${UI.confirm==='ev'+id?'本当に削除する':'この予定を削除'}</button>`}</div>
  </form>`);
}

/* ---------- 人物帳 ---------- */
function vPeople(){
  const chips=[{id:'',name:'すべて'}].concat(S.set.pcats).map(c=>`<button class="chip" aria-pressed="${UI.pCat===c.id}" data-act="pcat" data-c="${c.id}">${c.color!=null?`<span class="dot" style="background:${COLORS10[c.color]}"></span>`:''}${h(c.name)}</button>`).join('');
  return sub('人物帳',`<input class="search" id="pq" type="search" placeholder="名前・ふりがな・メモで探す" value="${h(UI.pQ)}">
  <div class="chips">${chips}</div><div class="gojuon">${GOJU.map(([k])=>`<button aria-pressed="${UI.pRow===k}" data-act="prow" data-c="${k}">${k}</button>`).join('')}</div><div id="plist">${peopleList()}</div>
  <div class="btns"><button class="btn" data-go="pedit/new">＋ 人を登録</button><button class="btn plain" data-go="pcats">🎨 カテゴリーと色</button></div>`,{crumb:'交友・アドレス'});
}
function peopleList(){
  const q=UI.pQ.trim(), qh=toHira(q);
  const row=UI.pRow?GOJU.find(x=>x[0]===UI.pRow):null;
  const list=S.people.filter(p=>(!UI.pCat||(p.cats&&p.cats.length?p.cats:['other']).includes(UI.pCat))
      &&(!q||p.name.includes(q)||toHira(p.kana||'').startsWith(qh)||toHira(p.name).startsWith(qh)||(p.log||[]).some(x=>x.text.includes(q)))
      &&(!row||row[1].includes(toHira(p.kana||p.name).charAt(0))))
    .sort((a,b)=>toHira(a.kana||a.name).localeCompare(toHira(b.kana||b.name),'ja'));
  if(!S.people.length) return `<div class="empty">${BOO_IMG}まだだれも登録されていません。<br>まずは家族や友だちから登録してみよう。<div class="btns"><button class="btn plain" data-act="sample">見本の人とお店を入れてみる</button></div></div>`;
  if(!list.length) return `<div class="empty">見つかりませんでした。</div>`;
  return `<div class="list">${list.map(p=>{const tel=p.phones&&p.phones.find(x=>x.num);
    return `<button class="row" data-go="person/${p.id}">${face(p,50)}<span class="t"><b>${h(p.name)}</b><span>${h(p.kana||'')}${tel?'　📞'+h(tel.num):''}</span></span><span style="display:flex;gap:3px">${(p.cats||[]).map(c=>pcat(c)).filter(Boolean).map(c=>`<span class="dot" title="${h(c.name)}" style="background:${COLORS10[c.color]}"></span>`).join('')}</span><span class="go">›</span></button>`;}).join('')}</div>`;
}
function vPerson(id){
  const p=S.people.find(x=>x.id===id); if(!p) return sub('人物帳','<p>見つかりませんでした。</p>');
  const tel=(p.phones||[]).filter(x=>x.num); const mail=(p.emails||[]).filter(Boolean);
  const md=p.bday?p.bday.slice(5):''; const a=age(p.bday,today());
  const cats=(p.cats&&p.cats.length?p.cats:['other']).map(pcat).filter(Boolean);
  const act=(em,label,href,small)=>`<a class="act" ${href?`href="${href}" ${href.startsWith('http')?'target="_blank" rel="noopener"':''}`:'aria-disabled="true"'}><span class="em">${em}</span>${label}${small?`<small>${h(small)}</small>`:''}</a>`;
  const evs=S.events.filter(e=>(e.people||[]).includes(id)&&(e.rep||e.date>=today())).sort((x,y)=>x.date.localeCompare(y.date)).slice(0,5);
  return sub('人物帳',`<div class="hero">${face(p,92)}<div style="min-width:0"><h2>${h(p.name)}</h2><div class="kana">${h(p.kana||'')}</div>
    <div class="tags">${cats.map(c=>`<span class="tag"><span class="dot" style="background:${COLORS10[c.color]}"></span>${h(c.name)}</span>`).join('')}</div></div></div>
  <div class="acts">${act('📞','電話',tel[0]&&telHref(tel[0].num),tel[0]&&tel[0].label)}${act('✉️','メール',mail[0]&&'mailto:'+mail[0])}${act('🗺️','地図',p.addr&&mapUrl(p.addr))}
    ${act('💬','LINE',p.line&&'https://line.me/R/ti/p/~'+encodeURIComponent(p.line),p.line)}${act('📘','Facebook',p.fb&&(p.fb.startsWith('http')?p.fb:'https://www.facebook.com/'+encodeURIComponent(p.fb)))}${act('🟢','WeChat',p.wechat&&'weixin://',p.wechat)}</div>
  <div class="sec"><dl class="kv">
    ${tel.map(x=>`<dt>📞 ${h(x.label||'電話')}</dt><dd><a href="${telHref(x.num)}">${h(x.num)}</a></dd>`).join('')}
    ${mail.map(m=>`<dt>✉️ メール</dt><dd><a href="mailto:${h(m)}">${h(m)}</a></dd>`).join('')}
    ${p.addr?`<dt>🏠 住所</dt><dd>${p.zip?'〒'+h(p.zip)+'<br>':''}${h(p.addr)}<div class="minis">${mapBtns(p.addr)}</div></dd>`:''}
    ${p.bday?`<dt>🎂 誕生日</dt><dd>${p.bday.startsWith('0000')?`${+md.slice(0,2)}月${+md.slice(3)}日`:`${jpDate(p.bday,false)}（${wareki(p.bday)}）`}${a!=null?`　${a}歳`:''}<br><span class="small muted">${seiza(md)}</span></dd>`:''}
    ${p.blood?`<dt>🩸 血液型</dt><dd>${h(p.blood)}型</dd>`:''}
    <dt>⭕ 輪</dt><dd class="small muted">輪（グループで共有）は準備中です</dd>
  </dl></div>
  ${evs.length?`<div class="sec"><h3>いっしょの予定</h3><div class="evs">${evs.map(e=>evRow({k:'ev',e,color:evCat(e.cat).color},e.date,true).replace('<span class="tm">',`<span class="tm"><span class="small">${+e.date.slice(5,7)}/${+e.date.slice(8)}</span><br>`)).join('')}</div></div>`:''}
  ${logBox('person',p)}
  <div class="btns"><button class="btn plain" data-go="pedit/${p.id}">✎ 登録内容を直す</button><button class="btn plain" data-act="evwith" data-id="${p.id}">＋ この人と予定</button></div>`,{crumb:'交友・アドレス › 人物帳'});
}
function logBox(kind,obj){
  const log=(obj.log||[]).slice().sort((a,b)=>b.d.localeCompare(a.d));
  return `<div class="sec"><h3>📝 大きなメモ欄（日付つき）</h3>
  <form data-form="log" data-kind="${kind}" data-id="${obj.id}"><textarea class="search" id="logtext" name="text" style="min-height:90px" placeholder="${kind==='person'?'好きなもの、話したこと、会った記録など':'感想、頼んだもの、担当の人など'}"></textarea>
  <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:6px">${kind==='person'?'<label class="ck"><input type="checkbox" name="met"> 会った記録にする</label>':'<label class="ck"><input type="checkbox" name="met"> 行った記録にする</label>'}<button class="btn" type="submit">書き足す</button></div></form>
  ${log.length?`<ul class="log" style="margin-top:10px">${log.map(x=>`<li><time>${jpDate(x.d.slice(0,10))}${x.met?(kind==='person'?'　🤝会った':'　👣行った'):''}</time>${h(x.text)}</li>`).join('')}</ul>`:''}</div>`;
}
function vPEdit(id){
  const isNew=id==='new'; const p=isNew?{name:'',kana:'',cats:[],phones:[],emails:[],zip:'',addr:'',bday:'',blood:'',line:'',fb:'',wechat:'',photo:'',fav:false}:S.people.find(x=>x.id===id);
  if(!p) return sub('人物帳','<p>見つかりませんでした。</p>');
  const ph=[0,1,2,3].map(i=>(p.phones||[])[i]||{label:['携帯','自宅','携帯2','仕事'][i],num:''});
  const noYear=p.bday&&p.bday.startsWith('0000');
  return sub(isNew?'人を登録':'登録内容を直す',`<form data-form="person" data-id="${isNew?'':p.id}">
  <div class="f"><span class="lb">顔写真</span><div class="photo-pick"><span id="ph-prev">${face(p,72)}</span><input type="file" id="ph-file" accept="image/*"><input type="hidden" name="photo" id="ph-data" value="${h(p.photo||'')}"></div><span class="small muted">写真はこのスマホの中にだけ、小さくして保存します。</span></div>
  <div class="two"><div class="f"><label for="p-name">名前</label><input id="p-name" name="name" required value="${h(p.name)}"></div><div class="f"><label for="p-kana">ふりがな</label><input id="p-kana" name="kana" value="${h(p.kana||'')}"></div></div>
  <div class="f"><span class="lb">カテゴリー（いくつでも）</span><div class="choose">${S.set.pcats.map(c=>`<label><input type="checkbox" name="cats" value="${c.id}" ${(p.cats||[]).includes(c.id)?'checked':''}><span class="dot" style="background:${COLORS10[c.color]}"></span>${h(c.name)}</label>`).join('')}</div></div>
  ${ph.map((x,i)=>`<div class="two"><div class="f"><label for="p-pl${i}">電話${i+1}の名前</label><input id="p-pl${i}" name="pl${i}" value="${h(x.label)}"></div><div class="f"><label for="p-pn${i}">番号</label><input id="p-pn${i}" name="pn${i}" type="tel" value="${h(x.num)}"></div></div>`).join('')}
  <div class="f"><label for="p-m0">メール</label><input id="p-m0" name="m0" type="email" value="${h((p.emails||[])[0]||'')}"></div>
  <div class="f"><label for="p-m1">メール2</label><input id="p-m1" name="m1" type="email" value="${h((p.emails||[])[1]||'')}"></div>
  <div class="two"><div class="f"><label for="p-zip">郵便番号</label><input id="p-zip" name="zip" inputmode="numeric" value="${h(p.zip||'')}" placeholder="420-0000"></div><div class="f"><label for="p-blood">血液型</label><select id="p-blood" name="blood">${['','A','B','O','AB'].map(b=>`<option ${p.blood===b?'selected':''} value="${b}">${b||'―'}</option>`).join('')}</select></div></div>
  <div class="f"><label for="p-addr">住所</label><input id="p-addr" name="addr" value="${h(p.addr||'')}"></div>
  <div class="f"><span class="lb">誕生日（年・月・日を選ぶ）</span>${ymdSel('bday',p.bday&&!noYear?p.bday:p.bday?'2000'+p.bday.slice(4):'',{y0:1910,y1:+today().slice(0,4)})}<label class="ck"><input type="checkbox" name="noyear" ${noYear?'checked':''}> 生まれた年はわからない</label></div>
  <div class="two"><div class="f"><label for="p-line">LINE ID</label><input id="p-line" name="line" value="${h(p.line||'')}"></div><div class="f"><label for="p-wc">WeChat ID</label><input id="p-wc" name="wechat" value="${h(p.wechat||'')}"></div></div>
  <div class="f"><label for="p-fb">Facebook（名前かアドレス）</label><input id="p-fb" name="fb" value="${h(p.fb||'')}"></div>
  <label class="ck"><input type="checkbox" name="fav" ${p.fav?'checked':''}> よく電話する人（高齢者モードのトップに顔と名前を出す）</label>
  <div class="btns"><button class="btn" type="submit">登録する</button>${isNew?'':`<button class="btn danger" type="button" data-act="delperson" data-id="${p.id}">${UI.confirm==='p'+p.id?'本当に削除する':'この人を削除'}</button>`}</div></form>`);
}
function vPCats(){
  return sub('カテゴリーと色',`<p class="small muted">人物帳の分け方です。1人をいくつにでも入れられます。「その他」は消せません。</p>
  <form data-form="pcats"><div class="list">${S.set.pcats.map((c,i)=>`<div class="row"><span class="dot" style="background:${COLORS10[c.color]};width:20px;height:20px"></span><span class="t"><input name="n${i}" aria-label="名前" value="${h(c.name)}" ${c.id==='other'?'readonly':''} style="width:100%;border:0;background:none;font-weight:700"></span>
    <select name="c${i}" aria-label="色">${COLORS10.map((col,j)=>`<option value="${j}" ${c.color===j?'selected':''}>色${j+1}</option>`).join('')}</select>
    ${c.id==='other'?'':`<button type="button" class="mini" data-act="delpcat" data-i="${i}">削除</button>`}</div>`).join('')}</div>
  <div class="f"><label for="pc-new">新しいカテゴリー</label><input id="pc-new" name="newname" placeholder="例：同窓会、ゴルフ仲間"></div>
  <div class="btns"><button class="btn" type="submit">登録する</button></div></form>`);
}

/* ---------- 施設帳 ---------- */
const BIG_EMOJI={'食事':'🍽️','買い物':'🛒','医療':'🏥','介護':'🤝','運動':'🏃','遊び・趣味':'🎤','公共':'🏛️','寺社':'⛩️','業者':'🔧','美容':'💇','車・交通':'🚗','学び・子ども':'🎒','その他':'📍'};
function stars(sc){ sc=+sc||0; if(!sc) return '<span class="muted small">点数なし</span>'; if(sc>=10) return '<span class="stars"><span class="ten">★</span></span> <span class="small">10点</span>'; return `<span class="stars">${'★'.repeat(Math.floor(sc/5))}${'☆'.repeat(sc%5)}</span> <span class="small">${sc}点</span>`; }
function placeRow(p){ const b=(p.big||[])[0]||'その他';
  return `<button class="row" data-go="place/${p.id}"><span class="em">${BIG_EMOJI[b]||'📍'}</span><span class="t"><b>${h(p.name)}</b><span>${h([(p.genre||[]).join('・'),[p.pref,p.city].filter(Boolean).join(' ')||p.addr].filter(Boolean).join('　'))}${p._km!=null?`　<b class="km">約${p._km<1?Math.round(p._km*1000)+'m':p._km.toFixed(1)+'km'}</b>`:''}</span></span>${p.silver?'<span class="badge ok">シルバー割</span>':''}<span class="go">›</span></button>`; }
function vPlaces(){
  const chips=[''].concat(PLACE_BIG).map(b=>`<button class="chip" aria-pressed="${UI.plBig===b}" data-act="plbig" data-c="${b}">${b?BIG_EMOJI[b]+' '+b:'すべて'}</button>`).join('');
  return sub('施設帳',`<p class="small muted" style="margin:0 0 6px">お店・病院・役所などの場所は、ここに1回だけ登録します。予定やほかの機能からも呼び出せます。</p>
  <input class="search" id="plq" type="search" placeholder="🔍 ラーメン・店の名前・地名などで探す" value="${h(UI.plQ)}">
  ${plAreaBar()}
  <div class="chips">${chips}</div>${UI.plBig?plGenreChips():''}<div id="pllist">${placeList()}</div>
  <div class="btns"><button class="btn" data-go="pledit/new">＋ 場所を登録</button></div>`,{crumb:'店・利用施設'});
}
function plGenreChips(){
  const used=[...new Set(S.places.filter(p=>(p.big||[]).includes(UI.plBig)).flatMap(p=>p.genre||[]))];
  if(!used.length) return '';
  return `<div class="chips" style="padding-top:0"><span class="small muted">細かく：</span>${['',...used].map(g=>`<button class="chip" aria-pressed="${(UI.plG||'')===g}" data-act="plg" data-c="${h(g)}">${g?h(g):'すべて'}</button>`).join('')}</div>`;
}
function plAreaBar(){
  const ha=homeArea(); const used={}; S.places.forEach(p=>{ if(p.pref) used[p.pref]=(used[p.pref]||0)+1; });
  const opts=[['home',ha.pref?`🏠 ふだんの地域（${ha.pref}${ha.city?' '+ha.city:''}）`:'🏠 ふだんの地域（まだ決めていません）'],['','🗾 全国（すべて）']].concat(PREFS.filter(p=>used[p]).map(p=>[p,`${p}（${used[p]}）`]));
  return `<div class="plarea"><select id="plarea" aria-label="地域">${opts.map(([v,t])=>`<option value="${h(v)}" ${UI.plArea===v?'selected':''}>${h(t)}</option>`).join('')}</select>
  <button class="btn ${UI.plNear?'':'plain'}" data-act="plnear">📍 ${UI.plNear?'近い順をやめる':'今いる場所の近い順'}</button></div>
  ${!ha.pref?`<p class="small muted" style="margin:4px 0 0">ふだんの地域は <button class="linkb" data-go="settings">設定</button> で決められます（自宅の住所からも自動で決まります）。</p>`:''}
  ${UI.plNear?`<p class="small muted" style="margin:4px 0 0">今いる場所から近い順に、全国の登録店を並べています。</p>`:''}`;
}
function plText(p){ return [p.name,(p.big||[]).join(' '),(p.genre||[]).join(' '),p.addr,p.pref,p.city,p.hours,(p.log||[]).map(x=>x.text).join(' ')].join(' '); }
function placeList(){
  const q=UI.plQ.trim(); const ha=homeArea();
  if(!S.places.length) return `<div class="empty">${BOO_IMG}まだ場所が登録されていません。<br>よく行くお店やかかりつけの病院から入れてみよう。<div class="btns"><button class="btn plain" data-act="sample">見本の人とお店を入れてみる</button></div></div>`;
  let list=S.places.filter(p=>(!UI.plBig||(p.big||[]).includes(UI.plBig))&&(!UI.plG||(p.genre||[]).includes(UI.plG))&&(!q||plText(p).includes(q)));
  list.forEach(p=>{ p._km=(UI.plNear&&p.lat!=null)?kmBetween(UI.plNear.lat,UI.plNear.lon,p.lat,p.lon):null; });
  const byName=(a,b)=>a.name.localeCompare(b.name,'ja');
  if(UI.plNear){ list.sort((a,b)=>(a._km??1e9)-(b._km??1e9)||byName(a,b)); const known=list.filter(p=>p._km!=null), unk=list.filter(p=>p._km==null);
    return (known.length?`<div class="list">${known.map(placeRow).join('')}</div>`:'<div class="empty">近い店は見つかりませんでした。</div>')+(unk.length?`<h3 class="small muted" style="margin:10px 0 4px">場所がわからない店（住所を入れると近い順に入ります）</h3><div class="list">${unk.map(placeRow).join('')}</div>`:''); }
  list.sort(byName);
  const area=UI.plArea==='home'?ha.pref:UI.plArea;
  if(!area) return list.length?`<div class="list">${list.map(placeRow).join('')}</div>`:'<div class="empty">見つかりませんでした。</div>';
  const inA=list.filter(p=>p.pref===area), outA=list.filter(p=>p.pref!==area);
  const homeCity=UI.plArea==='home'&&ha.city; if(homeCity) inA.sort((a,b)=>(b.city===homeCity)-(a.city===homeCity)||byName(a,b));
  let html=inA.length?`<div class="list">${inA.map(placeRow).join('')}</div>`:`<div class="empty">${h(area)}には${q?'「'+h(q)+'」に合う店が':'登録した場所が'}ありません。</div>`;
  if(outA.length) html+=q?`<h3 class="small muted" style="margin:10px 0 4px">ほかの地域（${outA.length}件）</h3><div class="list">${outA.map(placeRow).join('')}</div>`:`<p class="small muted" style="margin:8px 0 0">ほかの地域にも${outA.length}件あります。<button class="linkb" data-act="plall">全国で見る</button></p>`;
  return html;
}
function vShops(){
  const tabs=[['often','よく行く'],['want','行ってみたい'],['all','すべて']];
  const base=S.places.filter(p=>(p.big||[]).some(b=>b==='食事'||b==='買い物'));
  const list=base.filter(p=>UI.shopTab==='all'||p[UI.shopTab]).sort((a,b)=>(b.score||0)-(a.score||0));
  return sub('お店の帳',`<p class="small muted" style="margin:0">施設帳の「食事」「買い物」のお店を集めて見る帳面です。</p>
  <div class="chips">${tabs.map(([k,t])=>`<button class="chip" aria-pressed="${UI.shopTab===k}" data-act="shoptab" data-c="${k}">${t}</button>`).join('')}</div>
  ${list.length?`<div class="list">${list.map(p=>placeRow(p).replace('<span class="go">',`<span class="small">${stars(p.score)}</span><span class="go">`)).join('')}</div>`:'<div class="empty">ここに入るお店はまだありません。お店を登録するときに「よく行く」「行ってみたい」を付けてください。</div>'}
  <div class="btns"><button class="btn" data-go="pledit/new">＋ お店を登録</button></div>`,{crumb:'店・利用施設'});
}
function vPlace(id){
  const p=S.places.find(x=>x.id===id); if(!p) return sub('施設帳','<p>見つかりませんでした。</p>');
  const q=p.addr||p.name; const evs=S.events.filter(e=>e.placeId===id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  const act=(em,label,href,blank)=>`<a class="act" ${href?`href="${href}" ${blank?'target="_blank" rel="noopener"':''}`:'aria-disabled="true"'}><span class="em">${em}</span>${label}</a>`;
  return sub('施設帳',`<div class="hero"><span class="face" style="width:72px;height:72px;display:grid;place-items:center;font-size:2.2rem">${BIG_EMOJI[(p.big||[])[0]]||'📍'}</span><div style="min-width:0"><h2>${h(p.name)}</h2>
    <div class="tags">${(p.big||[]).map(b=>`<span class="tag">${h(b)}</span>`).join('')}${(p.genre||[]).map(g=>`<span class="tag">${h(g)}</span>`).join('')}${p.often?'<span class="tag">よく行く</span>':''}${p.want?'<span class="tag">行ってみたい</span>':''}${p.silver?'<span class="tag" style="border-color:var(--ok);color:var(--ok)">シルバー割あり</span>':''}</div>
    <div>${stars(p.score)}</div></div></div>
  <div class="acts">${act('📞','電話',p.tel&&telHref(p.tel))}${act('🗺️','MAP',mapUrl(q),1)}${act('🧭','NAVI',naviUrl(q),1)}</div>
  <div class="sec"><dl class="kv">${p.addr?`<dt>住所</dt><dd>${h(p.addr)}</dd>`:''}${p.tel?`<dt>電話</dt><dd><a href="${telHref(p.tel)}">${h(p.tel)}</a></dd>`:''}${p.hours?`<dt>営業時間</dt><dd>${h(p.hours)}</dd>`:''}${p.hp?`<dt>HP</dt><dd><a href="${h(p.hp)}" target="_blank" rel="noopener">${h(p.hp)}</a></dd>`:''}</dl>
  ${!p.addr&&!p.tel&&!p.hours&&!p.hp?'<p class="small muted" style="margin:0">住所や電話はまだ入っていません。</p>':''}</div>
  ${evs.length?`<div class="sec"><h3>ここでの予定</h3><div class="list">${evs.map(e=>`<button class="row" data-go="ev/${e.id}"><span class="t"><b>${h(e.title)}</b><span>${jpDate(e.date)}${e.time?' '+e.time:''}${e.rep?'・'+REP_LABEL[e.rep]:''}</span></span><span class="go">›</span></button>`).join('')}</div></div>`:''}
  ${logBox('place',p)}
  <div class="btns"><button class="btn plain" data-go="pledit/${p.id}">✎ 登録内容を直す</button><button class="btn plain" data-act="evat" data-id="${p.id}">＋ ここで予定</button></div>`,{crumb:'店・利用施設 › 施設帳'});
}
function genreChips(bigs,sel,q){
  q=(q||'').trim(); const seen=new Set();
  const bl=q?PLACE_BIG.filter(b=>Object.values(genresOf(b)).flat().some(g=>g.includes(q))):bigs;
  const chip=(g,b)=>{seen.add(g); return `<label><input type="checkbox" name="genre" value="${h(g)}" data-big="${h(b)}" ${sel.includes(g)?'checked':''}>${h(g)}</label>`;};
  let out=bl.map(b=>{
    const groups=Object.entries(genresOf(b)).map(([gn,gs])=>{const v=gs.filter(g=>!q||g.includes(q)&&!seen.has(g)); if(!v.length) return ''; return `${gn?`<div class="gsub">${h(gn)}</div>`:''}<div class="choose">${v.map(g=>chip(g,b)).join('')}</div>`;}).join('');
    return groups?`<div class="gbox"><div class="gbig">${BIG_EMOJI[b]||'📍'} ${h(b)}</div>${groups}</div>`:'';}).join('');
  const rest=sel.filter(g=>!seen.has(g));
  if(rest.length) out+=`<div class="gbox"><div class="gbig">選んでいるもの</div><div class="choose">${rest.map(g=>chip(g,'')).join('')}</div></div>`;
  if(!out) out=q?`<span class="small muted">「${h(q)}」は見つかりません。右の「足す」で新しく作れます。</span>`:'<span class="small muted">先に上の「大きなジャンル」を選ぶと、細かいジャンルが出ます。</span>';
  return out;
}
function vPlEdit(id){
  const isNew=id==='new'; const p=isNew?{name:'',big:[],genre:[],addr:'',tel:'',hp:'',hours:'',score:0,often:false,want:false,silver:false}:S.places.find(x=>x.id===id);
  if(!p) return sub('施設帳','<p>見つかりませんでした。</p>');
  return sub(isNew?'場所を登録':'登録内容を直す',`<form data-form="place" data-id="${isNew?'':p.id}">
  <div class="f"><label for="pl-name">名前</label><input id="pl-name" name="name" required value="${h(p.name)}" placeholder="例：〇〇歯科、△△スーパー"></div>
  <div class="f"><span class="lb">① 大きなジャンル（いくつでも）</span><div class="choose" id="pl-big">${PLACE_BIG.map(b=>`<label><input type="checkbox" name="big" value="${b}" ${(p.big||[]).includes(b)?'checked':''}>${BIG_EMOJI[b]} ${b}</label>`).join('')}</div></div>
  <div class="f"><span class="lb">② 細かいジャンル</span>
    <div style="display:flex;gap:6px;margin-bottom:6px"><input id="pl-newg" type="search" placeholder="🔍 探す・足す（例：飲み屋、うなぎ）" style="flex:1;min-width:0;padding:8px 10px;border:2px solid var(--line);border-radius:10px;background:var(--card)"><button type="button" class="mini" data-act="addgenre">足す</button></div>
    <div id="pl-genre">${genreChips(p.big||[],p.genre||[])}</div></div>
  <div class="f"><label for="pl-addr">住所（MAP・NAVI・近い順に使います）</label><input id="pl-addr" name="addr" value="${h(p.addr||'')}" placeholder="例：東京都新宿区西新宿2-8-1"></div>
  <div class="two"><div class="f"><label for="pl-pref">都道府県</label><select id="pl-pref" name="pref"><option value="">（えらぶ）</option>${PREFS.map(x=>`<option ${(p.pref||'')===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="f"><label for="pl-city">市区町村</label><input id="pl-city" name="city" value="${h(p.city||'')}" placeholder="例：静岡市"></div></div>
  <input type="hidden" name="lat" value="${p.lat??''}"><input type="hidden" name="lon" value="${p.lon??''}">
  <p class="small muted" style="margin:-4px 0 8px"><span id="pl-pos">${p.lat!=null?'📍 位置は登録済みです':'住所を入れると、登録するときに位置を自動で調べます'}</span>　<button type="button" class="linkb" data-act="plhere">今いる場所をこの店の位置にする</button></p>
  <div class="two"><div class="f"><label for="pl-tel">電話</label><input id="pl-tel" type="tel" name="tel" value="${h(p.tel||'')}"></div><div class="f"><label for="pl-score">点数（10点満点）</label><select id="pl-score" name="score">${[0,1,2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${+p.score===n?'selected':''}>${n?n+'点':'なし'}</option>`).join('')}</select></div></div>
  <div class="f"><label for="pl-hours">営業時間・休み</label><input id="pl-hours" name="hours" value="${h(p.hours||'')}" placeholder="例：9:00〜18:00　木曜休み"></div>
  <div class="f"><label for="pl-hp">ホームページ</label><input id="pl-hp" type="url" name="hp" value="${h(p.hp||'')}" placeholder="https://"></div>
  <label class="ck"><input type="checkbox" name="often" ${p.often?'checked':''}> よく行く</label>
  <label class="ck"><input type="checkbox" name="want" ${p.want?'checked':''}> 行ってみたい</label>
  <label class="ck"><input type="checkbox" name="silver" ${p.silver?'checked':''}> シルバー割引などがある</label>
  <div class="btns"><button class="btn" type="submit">登録する</button>${isNew?'':`<button class="btn danger" type="button" data-act="delplace" data-id="${p.id}">${UI.confirm==='pl'+p.id?'本当に削除する':'この場所を削除'}</button>`}</div></form>`);
}

/* ---------- さっとメモ ---------- */
function allMemos(){
  const out=[];
  for(const m of S.memos) out.push({src:'さっとメモ',sub:m.from||'',t:m.t,text:m.text,photo:m.photo,id:m.id,go:''});
  for(const [d,txt] of Object.entries(S.daymemo)) if(txt&&txt.trim()) out.push({src:'1日のカード',sub:jpDate(d),t:d+'T00:00',text:txt,go:'day/'+d});
  for(const p of S.people) for(const x of p.log||[]) out.push({src:'人物帳',sub:p.name,t:x.d,text:x.text,go:'person/'+p.id});
  for(const p of S.places) for(const x of p.log||[]) out.push({src:'施設帳',sub:p.name,t:x.d,text:x.text,go:'place/'+p.id});
  return out.sort((a,b)=>b.t.localeCompare(a.t));
}
function vMemo(){
  const srcs=['','さっとメモ','1日のカード','人物帳','施設帳'];
  return sub('さっとメモ',`<p class="small muted" style="margin:0 0 6px">どこで書いたメモも、ここに全部集まります。右下の「✏️ メモ」でいつでも書けます。</p>
  <input class="search" id="mq" type="search" placeholder="メモを探す" value="${h(UI.memoQ)}">
  <div class="chips">${srcs.map(s=>`<button class="chip" aria-pressed="${UI.memoSrc===s}" data-act="memosrc" data-c="${s}">${s||'すべて'}</button>`).join('')}</div>
  <div id="mlist">${memoList()}</div>`,{crumb:'設定・機能 › その他の機能'});
}
function memoList(){
  const q=UI.memoQ.trim(); const list=allMemos().filter(m=>(!UI.memoSrc||m.src===UI.memoSrc)&&(!q||(m.text+m.sub).includes(q)));
  if(!list.length) return `<div class="empty">${BOO_IMG}メモはまだありません。右下の「✏️ メモ」から書いてみよう。</div>`;
  return `<div class="list">${list.map(m=>`<div class="sec" style="margin:0"><div class="small"><span class="src">${h(m.src)}</span>${h(m.sub)}　<span class="muted">${m.t.length>10?jpDate(m.t.slice(0,10),false)+' '+m.t.slice(11,16):''}</span></div>
    <div style="white-space:pre-wrap;overflow-wrap:anywhere;margin-top:4px">${h(m.text)}</div>${m.photo?`<img class="memoimg" src="${m.photo}" alt="メモの写真">`:''}
    <div class="minis">${m.go?`<button class="mini" data-go="${m.go}">書いた所を開く ›</button>`:''}${m.id?`<button class="mini" data-act="delmemo" data-id="${m.id}">${UI.confirm==='m'+m.id?'本当に削除する':'削除'}</button>`:''}</div></div>`).join('')}</div>`;
}

/* ---------- 便利道具 ---------- */
const T={timerEnd:0,timerLeft:0,timerRun:false,swStart:0,swAcc:0,swRun:false,laps:[],calc:'',calcPeople:2};
function vTools(){
  const tabs=[['clock','🕐 時計'],['world','🌏 世界の時計'],['timer','⏲️ タイマー'],['sw','⏱️ ストップウォッチ'],['calc','🧮 計算機']];
  let body='';
  if(UI.toolTab==='clock') body=`<div class="sec"><div class="tool-t" id="bigT">--:--:--</div><p style="text-align:center;margin:4px 0 0;font-weight:700">${jpDate(today())}　${wareki(today())}</p></div>`;
  if(UI.toolTab==='world') body=`<div class="list" id="world">${worldRows()}</div>`;
  if(UI.toolTab==='timer') body=`<div class="sec"><div class="tool-t" id="tmT">${fmtMS(T.timerRun?T.timerEnd-Date.now():T.timerLeft)}</div>
    <div class="btns">${[1,3,5,10,30].map(n=>`<button class="btn plain" data-act="tmadd" data-s="${n*60}">＋${n}分</button>`).join('')}<button class="btn plain" data-act="tmadd" data-s="10">＋10秒</button></div>
    <div class="btns"><button class="btn" data-act="tmgo">${T.timerRun?'一時停止':'スタート'}</button><button class="btn plain" data-act="tmreset">リセット</button></div></div>`;
  if(UI.toolTab==='sw') body=`<div class="sec"><div class="tool-t" id="swT">${fmtSW(swNow())}</div>
    <div class="btns"><button class="btn" data-act="swgo">${T.swRun?'ストップ':'スタート'}</button><button class="btn plain" data-act="swlap">ラップ</button><button class="btn plain" data-act="swreset">リセット</button></div>
    ${T.laps.length?`<ol class="small" style="font-variant-numeric:tabular-nums">${T.laps.map(x=>`<li>${fmtSW(x)}</li>`).join('')}</ol>`:''}</div>`;
  if(UI.toolTab==='calc') body=`<div class="sec"><div class="calc-d" id="calcD">${h(T.calc||'0')}</div>
    <div class="calc">${['C','(',')','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','00','.','='].map(k=>`<button data-act="ck" data-k="${k}" class="${'÷×−+()C'.includes(k)?'op':k==='='?'eq':''}">${k}</button>`).join('')}</div>
    <div class="btns"><button class="btn plain" data-act="ck" data-k="tax10">税込10%</button><button class="btn plain" data-act="ck" data-k="tax8">税込8%</button></div>
    <div class="btns" style="align-items:center"><label for="wkp" style="flex:0 0 auto;font-weight:700">割り勘</label><input id="wkp" type="number" min="1" value="${T.calcPeople}" style="width:5em;flex:0 0 auto;padding:8px;border:2px solid var(--line);border-radius:10px;background:var(--card)"> 人で <button class="btn plain" data-act="ck" data-k="split">割る（100円単位で切り上げ）</button></div>
    <p class="small muted" id="splitR"></p></div>`;
  return sub('便利道具',`<div class="chips tooltabs">${tabs.map(([k,t])=>`<button class="chip" aria-pressed="${UI.toolTab===k}" data-act="tooltab" data-c="${k}">${t}</button>`).join('')}</div>${body}`,{crumb:'設定・機能 › その他の機能'});
}
const WORLD=[['東京','Asia/Tokyo'],['北京・上海','Asia/Shanghai'],['ソウル','Asia/Seoul'],['ハワイ','Pacific/Honolulu'],['ロサンゼルス','America/Los_Angeles'],['ニューヨーク','America/New_York'],['ロンドン','Europe/London'],['パリ','Europe/Paris'],['シドニー','Australia/Sydney']];
function worldRows(){ const now=new Date(); return WORLD.map(([n,z])=>{ let t='';try{t=new Intl.DateTimeFormat('ja-JP',{timeZone:z,month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(now);}catch(e){} return `<div class="row"><span class="t"><b>${n}</b></span><span style="font-weight:700;font-variant-numeric:tabular-nums">${t}</span></div>`;}).join(''); }
const fmtMS=ms=>{ms=Math.max(0,ms);const s=Math.ceil(ms/1000);return pad(Math.floor(s/60))+':'+pad(s%60);};
const swNow=()=>T.swAcc+(T.swRun?Date.now()-T.swStart:0);
const fmtSW=ms=>{const cs=Math.floor(ms/10)%100,s=Math.floor(ms/1000);return (s>=3600?Math.floor(s/3600)+':':'')+pad(Math.floor(s/60)%60)+':'+pad(s%60)+'.'+pad(cs);};
function beep(){ try{ const A=window.AudioContext||window.webkitAudioContext; const a=new A(); [0,0.4,0.8].forEach(t=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.3,a.currentTime+t);o.start(a.currentTime+t);o.stop(a.currentTime+t+.25);}); }catch(e){} try{navigator.vibrate&&navigator.vibrate([300,150,300]);}catch(e){} }
function calcEval(src){
  const toks=src.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').match(/\d+\.?\d*|\.\d+|[-+*/()]/g)||[];
  let i=0; const peek=()=>toks[i], next=()=>toks[i++];
  function prim(){ const t=next(); if(t==='('){const v=expr(); next(); return v;} if(t==='-') return -prim(); const v=parseFloat(t); if(isNaN(v)) throw 0; return v; }
  function term(){ let v=prim(); while(peek()==='*'||peek()==='/'){ const o=next(); const r=prim(); v=o==='*'?v*r:v/r; } return v; }
  function expr(){ let v=term(); while(peek()==='+'||peek()==='-'){ const o=next(); const r=term(); v=o==='+'?v+r:v-r; } return v; }
  const v=expr(); if(i<toks.length||!isFinite(v)) throw 0; return Math.round(v*1e8)/1e8;
}

/* ---------- 天気 ---------- */
const CITIES=[['札幌',43.06,141.35],['仙台',38.27,140.87],['東京',35.68,139.77],['横浜',35.44,139.64],['名古屋',35.18,136.91],['静岡',34.98,138.38],['大阪',34.69,135.5],['京都',35.01,135.77],['神戸',34.69,135.2],['岡山',34.66,133.92],['広島',34.39,132.46],['福岡',33.59,130.4],['那覇',26.21,127.68],['北京',39.9,116.4],['上海',31.23,121.47]];
let wxLoading=false;
async function loadWx(force){
  const c=S.cache.wx; if(!force&&c&&c.lat===S.set.wx.lat&&c.lon===S.set.wx.lon&&Date.now()-c.at<30*60e3) return c.data;
  if(wxLoading) return null; wxLoading=true;
  try{
    const u=`https://api.open-meteo.com/v1/forecast?latitude=${S.set.wx.lat}&longitude=${S.set.wx.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunset&minutely_15=precipitation&forecast_minutely_15=16&timezone=auto&forecast_days=7`;
    const r=await fetch(u); if(!r.ok) throw 0; const d=await r.json();
    S.cache.wx={at:Date.now(),lat:S.set.wx.lat,lon:S.set.wx.lon,data:d}; save(); return d;
  }catch(e){ S.cache.wxErr=Date.now(); return null; } finally{ wxLoading=false; }
}
function uvText(u){return u>=11?'極端に強い':u>=8?'非常に強い':u>=6?'強い':u>=3?'中くらい':'弱い';}
function heatText(t){return t>=35?'危険（運動は原則中止）':t>=31?'厳重警戒':t>=28?'警戒':t>=25?'注意':'';}
/* 洗濯物：これから3時間に雨が降りそうか（15分ごとの雨量＋1時間ごとの雨の確率） */
function rainSoon(d){
  if(!d||!d.current||!d.hourly) return null; const now=d.current.time.slice(0,16);
  if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(d.current.weather_code)) return {now:true};
  const M=d.minutely_15;
  if(M&&M.time) for(let i=0;i<M.time.length;i++){ const t=M.time[i]; if(t<now) continue; if((M.precipitation[i]||0)>=0.1) return {at:t.slice(11,16).replace(/^0/,''),mm:M.precipitation[i]}; }
  const H=d.hourly; let st=H.time.findIndex(x=>x.slice(0,13)>=now.slice(0,13)); if(st<0) return null;
  for(let i=st;i<st+3&&i<H.time.length;i++){ const p=H.precipitation_probability[i]||0, mm=H.precipitation?H.precipitation[i]||0:0; if(p>=50||mm>=0.2) return {at:+H.time[i].slice(11,13)+'時',p}; }
  return null;
}
const RAINCODES=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
function rainNote(){
  const w=S.cache.wx&&S.cache.wx.data; const r=rainSoon(w); if(!r||r.now) return '';
  return `<button class="rainnote" data-go="weather/h"><img src="${charaImg('teru','sad')}" alt="てるチン"><b>まもなく雨</b><span>${h(r.at)}ごろから${r.p!=null?`（${r.p}%）`:''}　傘と洗濯物に注意</span><span class="go">›</span></button>`;
}
function laundryBar(){
  if(S.set.laundry===false) return ''; const w=S.cache.wx&&S.cache.wx.data; const nd=new Date(); const hr=nd.getHours();
  const ss=w&&w.daily&&w.daily.sunset&&w.daily.time[0]===today()?w.daily.sunset[0]:null;
  if(ss){ const [H,M]=ss.slice(11,16).split(':').map(Number); const m=hr*60+nd.getMinutes(), s=H*60+M;
    if(m>=s-30&&m<=s+90) return `<button class="laundry sun" data-go="weather"><span class="em">🌇👕</span><span class="t"><b>時間です、洗濯物取り込んで！</b><span>今日の日の入り ${H}:${String(M).padStart(2,'0')}（${h(S.set.wx.name)}）</span></span><span class="go">›</span></button>`; }
  return '';
}
function vWeather(mode){
  const c=S.cache.wx; const d=c&&c.lat===S.set.wx.lat&&c.lon===S.set.wx.lon?c.data:null;
  let body='';
  if(!d) body=`<div class="empty">${S.cache.wxErr&&!wxLoading?'天気を読み込めませんでした。電波のある所でもう一度開いてください。<br><span class="small">（この試作の見本画面では、天気が出ないことがあります）</span>':'天気を読み込んでいます…'}</div>`;
  else{
    const cu=d.current; const hrs=[]; const nowH=new Date().toISOString().slice(0,13);
    let st=d.hourly.time.findIndex(x=>x.slice(0,13)>=cu.time.slice(0,13)); if(st<0) st=0;
    for(let i=st;i<st+24&&i<d.hourly.time.length;i+=3) hrs.push(i);
    const ht=heatText(d.daily.temperature_2m_max[0]);
    const H=d.hourly; let hl='', lastDay='';
    for(let i=st;i<st+48&&i<H.time.length;i++){ const tt=H.time[i], dd=tt.slice(0,10);
      if(dd!==lastDay){ lastDay=dd; hl+=`<div class="hday">${dd===today()?'今日　':dd===ymd(new Date(Date.now()+864e5))?'明日　':''}${+dd.slice(5,7)}/${+dd.slice(8)}（${WD[parseD(dd).getDay()]}）</div>`; }
      const pp=H.precipitation_probability[i], pr=H.precipitation?H.precipitation[i]:null, ws=H.wind_speed_10m?H.wind_speed_10m[i]:null;
      hl+=`<div class="hrow ${i===st?'now':''}"><span class="hh">${i===st?'今':+tt.slice(11,13)+'時'}</span><span class="hi">${wxt(H.weather_code[i])[0]}</span><span class="hp ${pp>=50?'wet':''}"><b>☔${pp??'-'}%</b>${pr?`<small>${pr}mm</small>`:''}</span><span class="ht">${Math.round(H.temperature_2m[i])}℃</span><span class="hw">${h(wxt(H.weather_code[i])[1])}</span><span class="hv">${ws==null?'':'風'+Math.round(ws/3.6)}</span></div>`; }
    const M=d.minutely_15; let m15='';
    if(M&&M.time){ const now=cu.time.slice(0,16); const ix=M.time.map((t,i)=>i).filter(i=>M.time[i]>=now).slice(0,12);
      if(ix.length) m15=`<div class="sec"><h3>これから3時間の雨（15分ごと）</h3><div class="hours">${ix.map(i=>{const mm=M.precipitation[i]||0; return `<div class="${mm>=0.1?'wet15':''}"><div class="small">${M.time[i].slice(11,16).replace(/^0/,'')}</div><div style="font-size:1.3rem">${mm>=0.1?'☔':'－'}</div><b class="small">${mm>=0.1?mm+'mm':'なし'}</b></div>`;}).join('')}</div></div>`; }
    const hourSec=m15+`<div class="sec" id="wx-hours"><h3>さらに詳細な1時間ごとの天気（2日分）</h3><p class="small muted" style="margin:0 0 6px">☔は雨の降る確率（大きい字）、mmは1時間の雨の量、その次が気温、風は風の強さ（m/s）です。</p><div class="hlist">${hl}</div></div>`;
    body=`<div class="sec" style="display:flex;gap:14px;align-items:center"><span style="font-size:3.2rem">${wxt(cu.weather_code)[0]}</span><div><b style="font-size:2rem;font-family:var(--f-disp)">${Math.round(cu.temperature_2m)}℃</b> ${h(wxt(cu.weather_code)[1])}<div class="small muted">体感 ${Math.round(cu.apparent_temperature)}℃・湿度 ${cu.relative_humidity_2m}%・風 ${Math.round(cu.wind_speed_10m/3.6)}m/s</div></div></div>
    ${wxBosaiSec(d)}${mode==='h'?hourSec:''}<div class="sec"><h3>3時間ごと</h3><div class="hours">${hrs.map(i=>`<div><div class="small">${+d.hourly.time[i].slice(11,13)}時</div><div style="font-size:1.4rem">${wxt(d.hourly.weather_code[i])[0]}</div><b>${Math.round(d.hourly.temperature_2m[i])}℃</b><div class="small muted">☔${d.hourly.precipitation_probability[i]??'-'}%</div></div>`).join('')}</div></div>
    <div class="sec"><h3>今日の目安</h3><dl class="kv">${d.daily.sunset?`<dt>日の入り</dt><dd>${+d.daily.sunset[0].slice(11,13)}:${d.daily.sunset[0].slice(14,16)}</dd>`:''}<dt>紫外線</dt><dd>${uvText(d.daily.uv_index_max[0])}（${Math.round(d.daily.uv_index_max[0])}）</dd>${ht?`<dt>熱中症</dt><dd>${ht}</dd>`:''}<dt>花粉</dt><dd class="muted small">準備中</dd></dl></div>
    <div class="sec"><h3>1週間</h3>${d.daily.time.map((t,i)=>`<div class="wxday"><span class="${dayClass(t)}" style="font-weight:700">${+t.slice(5,7)}/${+t.slice(8)}（${WD[parseD(t).getDay()]}）</span><span style="font-size:1.3rem">${wxt(d.daily.weather_code[i])[0]}</span><span>${h(wxt(d.daily.weather_code[i])[1])} <span class="small muted">☔${d.daily.precipitation_probability_max[i]??'-'}%</span></span><span style="font-variant-numeric:tabular-nums"><b style="color:var(--sun)">${Math.round(d.daily.temperature_2m_max[i])}</b> / <b style="color:var(--sat)">${Math.round(d.daily.temperature_2m_min[i])}</b></span></div>`).join('')}</div>
    ${mode==='h'?'':hourSec}<p class="small muted">天気のデータ：Open-Meteo（無料）</p>`;
  }
  return sub('天気',`<div class="f"><label for="wx-city">場所：${h(S.set.wx.name)}</label><select id="wx-city">${CITIES.map(([n])=>`<option ${S.set.wx.name===n?'selected':''}>${n}</option>`).join('')}${CITIES.some(c=>c[0]===S.set.wx.name)?'':`<option selected>${h(S.set.wx.name)}</option>`}</select></div>
  <div class="btns"><button class="btn plain" data-act="wxhere">📍 今いる場所にする</button><button class="btn wxrl" data-act="wxreload">最新情報に更新 <span class="rl" aria-hidden="true">🔄</span></button></div>${body}`,{crumb:'NEWS・知識 › NEWS'});
}

/* ---------- お便り ---------- */
function vOtayori(){
  if(S.set.otaSeen!==otaKey()){ S.set.otaSeen=otaKey(); save(); }
  return sub('ぶーちんからのお便り',OTAYORI.map(o=>`<div class="sec"><div class="small muted">${jpDate(o.d)}</div><h3 style="margin:2px 0 6px">${h(o.t)}</h3>${sayBoo(h(o.b).replace(/\n/g,'<br>'))}</div>`).join('')+`<p class="small muted">運営からのお知らせは、オフにできません。</p>`,{crumb:'おたのしみ › ぶーちん劇場'});
}

/* ---------- 探す ---------- */
function vSearch(q){
  q=(q||'').trim(); let res='';
  if(q){
    const nodes=Object.values(NODES).filter(n=>!isOff(n.id)&&(n.name.includes(q)||(n.items||[]).some(x=>x[0].includes(q)))).slice(0,30);
    const ppl=S.people.filter(p=>[p.name,p.kana,(p.log||[]).map(x=>x.text).join(' ')].join(' ').includes(q));
    const pls=S.places.filter(p=>plText(p).includes(q));
    const evs=S.events.filter(e=>(e.title+' '+(e.memo||'')).includes(q)).slice(0,20);
    const mms=allMemos().filter(m=>m.text.includes(q)).slice(0,20);
    const sec=(t,arr,f)=>arr.length?`<div class="sec"><h3>${t}（${arr.length}）</h3><div class="list">${arr.map(f).join('')}</div></div>`:'';
    res=sec('機能',nodes,n=>`<button class="row" data-act="open" data-id="${h(n.id)}"><span class="em">${emojiOf(n.id)}</span><span class="t"><b>${h(n.name)}</b><span>${crumbOf(n.id)}</span></span>${hasImpl(n.id)?'<span class="badge ok">使える</span>':'<span class="badge wait">準備中</span>'}</button>`)
      +sec('人',ppl,p=>`<button class="row" data-go="person/${p.id}">${face(p,40)}<span class="t"><b>${h(p.name)}</b></span></button>`)
      +sec('場所',pls,placeRow)
      +sec('予定',evs,e=>`<button class="row" data-go="ev/${e.id}"><span class="t"><b>${h(e.title)}</b><span>${jpDate(e.date)}</span></span></button>`)
      +sec('メモ',mms,m=>`<button class="row" ${m.go?`data-go="${m.go}"`:'data-go="memo"'}><span class="t"><b>${h(m.text.slice(0,40))}</b><span>${h(m.src)} ${h(m.sub)}</span></span></button>`);
    if(!res) res='<div class="empty">見つかりませんでした。ほかの言葉でも探してみてください。</div>';
  }
  return sub('アプリ内検索',`<form data-form="search"><input class="search" id="sq" name="q" type="search" value="${h(q)}" placeholder="「〇〇したい」「歯医者」「誕生日」など" autofocus></form>
  ${q?'':`<p class="small" style="margin:8px 0 0;font-weight:700">アプリの中の機能・人・場所・予定・メモを、まとめて探します。下は言葉の例です。押すとその言葉で探します。</p><div class="chips cwrap">${['予定','誕生日','メモ','病院','割り勘','天気','子育て','幹事'].map(w=>`<button class="chip" data-go="search/${w}">${w}</button>`).join('')}</div><p class="small muted">機能の名前、人、場所、予定、メモをまとめて探します。まだ準備中の機能も見つかります。</p>`}${res}`);
}

/* ---------- 設定 ---------- */
function vSettings(){
  const s=S.set; const r=(name,val,cur,label)=>`<label><input type="radio" name="${name}" value="${val}" ${cur===val?'checked':''} data-act="setr">${label}</label>`;
  return sub('設定',`
  <button class="row guiderow" data-go="menumap"><span class="em">🗺️</span><span class="t"><b>メニューの全体図</b><span>どのボタンの中に、どの機能があるかを一覧で見られます</span></span><span class="go">›</span></button>
  <button class="row guiderow" data-go="guide"><span class="em">📖</span><span class="t"><b>使い方・機能の説明</b><span>ライフサポート万能アプリ「BOOTIN」の細かい機能の説明がぜんぶ見られます</span></span><span class="go">›</span></button>
  <div class="list">
    <button class="row" data-act="gotoedit"><span class="em">⇄</span><span class="t"><b>トップの9マスを変える</b><span>赤・青・黄の枠から自由に選んで置けます</span></span><span class="go">›</span></button>
    <button class="row" data-go="features"><span class="em">🔌</span><span class="t"><b>機能のオン・オフ</b><span>使わない機能を表示しないようにできます（いつでも戻せます）</span></span><span class="go">›</span></button>
  </div>
  ${modeSec()}
  <div class="sec"><h3>予定の時刻</h3><div class="choose">${r('minStep',15,+s.minStep,'15分きざみ')}${r('minStep',10,+s.minStep,'10分きざみ')}${r('minStep',5,+s.minStep,'5分きざみ')}${r('minStep',1,+s.minStep,'1分きざみ')}</div>
    <div class="f"><span class="lb">よく使う時間帯（この外は「早朝・深夜」にまとめます）</span><span class="tsel"><select data-act="sethr" data-k="hFrom" aria-label="から">${[...Array(24).keys()].map(i=>`<option value="${i}" ${+s.hFrom===i?'selected':''}>${i}時</option>`).join('')}</select>から<select data-act="sethr" data-k="hTo" aria-label="まで">${[...Array(24).keys()].map(i=>`<option value="${i}" ${+s.hTo===i?'selected':''}>${i}時</option>`).join('')}</select>まで</span></div></div>
  <div class="sec"><h3>文字の大きさ</h3><div class="choose">${r('font',1,s.font,'ふつう')}${r('font',2,s.font,'大きめ')}${r('font',3,s.font,'とても大きい')}</div></div>
  <div class="sec"><h3>ふだんの地域</h3><p class="small muted" style="margin:0 0 6px">施設帳では、ふだんはこの地域の店が先に出ます。空のときは自宅の住所から決めます。</p>
  <div class="two"><select data-act="setarea" data-k="pref" aria-label="都道府県"><option value="">（自宅の住所から）</option>${PREFS.map(x=>`<option ${(s.area||{}).pref===x?'selected':''}>${x}</option>`).join('')}</select><input data-act="setarea" data-k="city" value="${h((s.area||{}).city||'')}" placeholder="市区町村（例：静岡市）" aria-label="市区町村"></div></div>
  <div class="sec"><h3>トップの入口の上のライン</h3><div class="choose">${[['r','#E0452B','赤'],['bee','var(--bee)','枠と同じ色'],['ink','#1E1B14','黒'],['b','#3B82D6','青'],['g','#2E9B4F','緑'],['rb','linear-gradient(90deg,#E0452B,#F08A00,#D9B300,#2E9B4F,#2D6CDF,#B94FC8)','にじ'],['none','transparent','なし']].map(([k,c,t])=>r('gline',k,s.gline||'r',`<span class="sw" style="background:${c};width:22px;height:8px;border-radius:4px;display:inline-block;border:1px solid var(--line)"></span>${t}`)).join('')}</div></div>
  <div class="sec"><h3>着せかえ（枠の色）</h3><p class="small muted" style="margin:0 0 6px">押すとすぐ変わります。気分で変えてください。</p><div class="choose kise">${[['bee','#F6C915','きいろ'],['aka','#D93A2B','あか'],['ao','#2D62C8','あお'],['kuro','#1E1B14','くろ'],['midori','#2E8B4F','みどり'],['orange','#F08A00','オレンジ'],['murasaki','#6B4FC8','むらさき'],['sakura','#F4A7B9','さくら'],['sora','#8CCBF0','そら'],['wakaba','#A8D672','わかば']].map(([k,c,t])=>r('kise',k,s.kise,`<span class="sw" style="background:${c}"></span>${t}`)).join('')}</div>
  <h3 style="margin-top:12px">柄のある着せかえ</h3><div class="choose kise">${[['kisetsu','🍁🌸','季節で自動'],['haru','🌸','春・さくら'],['natsu','🌊','夏・なみ'],['momiji','🍁','秋・もみじ'],['yuki','❄️','冬・ゆき'],['seigaiha','🌀','和・青海波（藍）'],['ichimatsu','◼️','和・市松（渋い緑）']].map(([k,e,t])=>r('kise',k,s.kise,`${e} ${t}`)).join('')}</div>
  <p class="small muted" style="margin:6px 0 0">「季節で自動」は、3〜5月は春、6〜8月は夏、9〜11月は秋、12〜2月は冬に自動で変わります。</p>
    <div class="choose" style="margin-top:8px">${r('theme','',s.theme,'明るさ：スマホに合わせる')}${r('theme','light',s.theme,'明るい')}${r('theme','dark',s.theme,'暗い')}</div></div>
  <div class="sec"><h3>洗濯物のお知らせ</h3><label class="ck"><input type="checkbox" data-act="setlaundry" ${s.laundry!==false?'checked':''}> トップに洗濯物のお知らせを出す</label><p class="small muted" style="margin:4px 0 0">・雨が降りそうなとき（朝6時〜夜8時）：赤い「雨危険、洗濯物取り込んで！」。これから3時間の天気（15分ごとの雨の量と、1時間ごとの雨の確率50%以上）で判断します。<br>・日の入りの30分前から1時間半後まで：オレンジの「時間です、洗濯物取り込んで！」。日の入りの時刻は天気の場所に合わせて毎日自動で変わります。<br>アプリを開いたときに出ます。</p></div>
  <div class="sec"><h3>暦</h3><label class="ck"><input type="checkbox" data-act="setcn" ${s.cn?'checked':''}> 中国の祝日・行事も出す（春節・中秋節など）</label></div>
  <div class="list">
    <button class="row" data-go="otasukeset"><span class="em">🆘</span><span class="t"><b>おたすけボタンの準備</b><span>${s.home.addr?'自宅：'+h(s.home.addr):'自宅の住所と家族の電話を入れておきます'}</span></span><span class="go">›</span></button>
    <button class="row" data-go="me"><span class="em">🪪</span><span class="t"><b>「私のこと」カード</b><span>もしものときに見せるカード（日本語・中国語・英語）</span></span><span class="go">›</span></button>
    <button class="row" data-go="weather"><span class="em">🌤️</span><span class="t"><b>天気の場所</b><span>${h(s.wx.name)}</span></span><span class="go">›</span></button><button class="row" data-go="gomi"><span class="em">🗑️</span><span class="t"><b>ゴミ出しの日</b><span>${(S.gomi||[]).length?(S.gomi||[]).map(g=>h(g.name)).join('・'):'まだ登録していません'}</span></span><span class="go">›</span></button><button class="row" data-go="zip"><span class="em">〒</span><span class="t"><b>郵便番号を調べる</b><span>〒から住所、住所から〒</span></span><span class="go">›</span></button><button class="row" data-go="games"><span class="em">🎮</span><span class="t"><b>よく使うゲーム</b><span>学生モードのトップに並べるリンク</span></span><span class="go">›</span></button>
    <button class="row" data-go="data"><span class="em">💾</span><span class="t"><b>データ（書き出し・読み込み・見本）</b><span>スマホの中に保存しているデータの管理</span></span><span class="go">›</span></button>
    <button class="row" data-go="install"><span class="em">📲</span><span class="t"><b>ホーム画面に置く方法</b><span>アプリのように1回押しで開けます</span></span><span class="go">›</span></button>
  </div>
  <p class="small muted">BOOTIN 試作版 ${VERSION}</p>
  <div class="sec"><h3>ご意見・ご要望</h3><div class="list"><button class="row" data-go="iken"><span class="em">📮</span><span class="t"><b>ぶーちんへのご意見・ご要望</b><span>使いにくいところ、ほしい機能を送れます。返事も届きます</span></span><span class="go">›</span></button>
    <button class="row room" data-go="room"><span class="em">🐷</span><span class="t"><b>ぶーちんの部屋</b><span>合言葉で入る部屋です</span></span><span class="go">🔒</span></button></div></div><p class="small muted" style="text-align:center">この画面の版：${BUILD}</p>`,{crumb:'設定・機能'});
}
function vFeatures(){
  const sw=(id,cls)=>{const n=NODES[id];const lock=LOCKED.has(id);const on=!S.set.off[id]||lock;
    return `<div class="tw ${cls}"><span class="nm">${h(n.name)} ${hasImpl(id)?'<span class="badge ok">使える</span>':'<span class="badge wait">準備中</span>'}</span>${lock?'<span class="lock">🔒いつもオン</span>':''}<span class="sw"><input type="checkbox" data-act="feat" data-id="${h(id)}" ${on?'checked':''} ${lock?'disabled':''} aria-label="${h(n.name)}"><i></i></span></div>`;};
  return sub('機能のオン・オフ',`<p class="small muted" style="margin:0">オフにした機能は、トップや一覧に表示されなくなるだけで、中のデータは消えません。1日のカード・設定・おたすけ・お便りはいつもオンです。</p>
  <div class="btns"><button class="btn plain" data-act="featall">全部出す</button><button class="btn plain" data-act="featimpl">使える機能だけ出す</button></div>
  ${ROOTS.map(rid=>{const r=NODES[rid];return `<details class="tree" ${UI.openReds.has(rid)?'open':''} data-red="${h(rid)}"><summary><span>${RED_EMOJI[rid]}</span><span style="flex:1">${h(rid)}</span><span class="sw" data-act="none"><input type="checkbox" data-act="feat" data-id="${h(rid)}" ${!S.set.off[rid]||LOCKED.has(rid)?'checked':''} ${LOCKED.has(rid)?'disabled':''} aria-label="${h(rid)}"><i></i></span></summary>
    ${r.kids.map(b=>sw(b,'b')+NODES[b].kids.map(y=>sw(y,'y')).join('')).join('')}</details>`;}).join('')}`,{crumb:'設定・機能'});
}
function vGridPick(i){
  i=+i; const curId=S.set.grid[i];
  const btn=(id,cls)=>{const n=NODES[id];return `<div class="tw ${cls}"><span class="nm">${cls==='r'?RED_EMOJI[id]+' ':''}${h(n.name)} ${hasImpl(id)?'':'<span class="badge wait">準備中</span>'}</span><button class="mini" data-act="gset" data-i="${i}" data-id="${h(id)}" ${curId===id?'disabled':''}>${curId===id?'置いてある':'ここに置く'}</button></div>`;};
  return sub(`${i+1}番目のマスに置くもの`,`<p class="small muted" style="margin:0">大きな入口（赤枠）だけでなく、中の枠（青・黄）も直接置けます。</p>
  <div class="btns"><button class="btn plain" data-act="gset" data-i="${i}" data-id="">このマスを空にする</button></div>
  ${ROOTS.filter(r=>!isOff(r)).map(rid=>`<details class="tree"><summary>${RED_EMOJI[rid]} ${h(rid)}</summary>${btn(rid,'b').replace('tw b','tw')}${NODES[rid].kids.filter(b=>!isOff(b)).map(b=>btn(b,'b')+NODES[b].kids.filter(y=>!isOff(y)).map(y=>btn(y,'y')).join('')).join('')}</details>`).join('')}`);
}
function vOtasukeSet(){
  const hm=S.set.home;
  return sub('おたすけボタンの準備',`<form data-form="otasuke">
  <div class="f"><label for="o-addr">自宅の住所（「自宅へ道案内」に使います）</label><input id="o-addr" name="addr" value="${h(hm.addr)}"></div>
  <div class="two"><div class="f"><label for="o-tn">電話する家族の名前</label><input id="o-tn" name="telName" value="${h(hm.telName)}" placeholder="例：妻、長男"></div><div class="f"><label for="o-tel">その電話番号</label><input id="o-tel" type="tel" name="tel" value="${h(hm.tel)}"></div></div>
  <p class="small muted">人物帳で「家族」に入れた人の電話も、おたすけに並びます。</p>
  <div class="btns"><button class="btn" type="submit">登録する</button></div></form>`);
}
function vMe(){
  const m=S.set.me; const L=(ja,zh,en)=>`<dt>${ja}<br><span class="small">${zh} / ${en}</span></dt>`;
  const has=m.name||m.tel||m.contact;
  return sub('「私のこと」カード',`
  ${has?`<div class="mecard"><h3>私のこと　关于我　About me</h3><dl class="kv" style="grid-template-columns:8.5em 1fr">
    ${m.name?L('名前','姓名','Name')+`<dd><b style="font-size:1.2rem">${h(m.name)}</b>${m.kana?`<br><span class="small">${h(m.kana)}</span>`:''}</dd>`:''}
    ${m.bday?L('生年月日','出生日期','Birth')+`<dd>${/^\d{4}-\d\d-\d\d$/.test(m.bday)?`${h(m.bday.replace(/-/g,'/'))}<br><span class="small">${bdayText(m.bday)}</span>`:h(m.bday)}</dd>`:''}
    ${m.blood?L('血液型','血型','Blood')+`<dd>${h(m.blood)}</dd>`:''}
    ${m.addr?L('住所','住址','Address')+`<dd>${h(m.addr)}</dd>`:''}
    ${m.sick?L('持病','慢性病','Conditions')+`<dd>${h(m.sick)}</dd>`:''}
    ${m.med?L('飲んでいる薬','正在服用的药','Medicine')+`<dd>${h(m.med)}</dd>`:''}
    ${m.allergy?L('アレルギー','过敏','Allergy')+`<dd>${h(m.allergy)}</dd>`:''}
    ${m.contact||m.contactTel?L('緊急連絡先','紧急联系人','Emergency')+`<dd>${h(m.contact)}<br><a href="${telHref(m.contactTel)}">${h(m.contactTel)}</a></dd>`:''}
    ${m.note?L('ひとこと','备注','Note')+`<dd>${h(m.note)}</dd>`:''}</dl></div>`:sayBoo('もしものときに、まわりの人に見せるカードだよ。下に書いておくと、おたすけボタンからすぐ出せるよ。')}
  <form data-form="me"><h3 style="margin-top:18px">カードに書くこと</h3>
  ${[['name','名前'],['kana','ふりがな・ローマ字'],['bday','生年月日'],['blood','血液型'],['addr','住所'],['sick','持病'],['med','飲んでいる薬'],['allergy','アレルギー'],['contact','緊急連絡先（名前・続き柄）'],['contactTel','緊急連絡先の電話'],['note','ひとこと（例：耳が遠いです）']].map(([k,t])=>`<div class="f"><label for="me-${k}">${t}</label><input id="me-${k}" name="${k}" value="${h(m[k]||'')}"></div>`).join('')}
  <p class="small muted">暗証番号・カード番号・マイナンバーは書かないでください。</p>
  <div class="btns"><button class="btn" type="submit">登録する</button></div></form>`,{crumb:'私と家族 › もしものとき'});
}
function vData(){
  let size=0; try{size=(localStorage.getItem(KEY)||'').length;}catch(e){}
  const hasSample=S.people.some(p=>p.sample)||S.places.some(p=>p.sample);
  return sub('データ',`<div class="sec"><h3>保存しているデータ</h3><dl class="kv"><dt>人物帳</dt><dd>${S.people.length}人</dd><dt>施設帳</dt><dd>${S.places.length}か所</dd><dt>予定</dt><dd>${S.events.length}件</dd><dt>さっとメモ</dt><dd>${S.memos.length}件</dd><dt>使っている量</dt><dd>約${Math.ceil(size*2/1024)}KB（目安の上限 約5,000KB）</dd></dl>
  <p class="small muted" style="margin:6px 0 0">データはこのスマホのこの画面の中にだけ保存しています。機種変更やもしものときのために、ときどき書き出してください。</p></div>
  <div class="sec"><h3>書き出し（バックアップ）</h3><div class="btns"><button class="btn" data-act="export">💾 ファイルに書き出す</button><button class="btn plain" data-act="exportcopy">📋 文字でコピー</button></div></div>
  <div class="sec"><h3>読み込み（元に戻す）</h3><p class="small muted" style="margin:0">書き出したファイルを選ぶと、今のデータと入れかわります。</p><div class="f"><input type="file" id="imp-file" accept=".json,application/json,text/plain" aria-label="読み込むファイル"></div>
    <div class="f"><label for="imp-text">または、コピーした文字をここに貼る</label><textarea id="imp-text"></textarea></div><div class="btns"><button class="btn plain" data-act="importtext">貼った文字から読み込む</button></div></div>
  <div class="sec"><h3>見本</h3><div class="btns">${hasSample?'<button class="btn plain" data-act="unsample">見本のデータを削除</button>':'<button class="btn plain" data-act="sample">見本の人・お店・予定を入れる</button>'}</div></div>
  <div class="sec"><h3>すべて削除</h3><button class="btn danger" data-act="wipe">${UI.confirm==='wipe'?'本当にすべて削除する（元に戻せません）':'すべてのデータを削除'}</button></div>`,{crumb:'設定・機能 › マイルームの設定'});
}
function vInstall(){
  return sub('ホーム画面に置く方法',`${sayBoo('BOOTINはお店（アプリストア）を通さないアプリだよ。下のやり方で、スマホのホーム画面に置けるよ。')}
  <div class="sec"><h3>iPhone（Safari）</h3><ol><li>SafariでBOOTINのページを開く</li><li>下の「共有」ボタン（□に↑）を押す</li><li>「ホーム画面に追加」を押す</li><li>右上の「追加」を押す</li></ol></div>
  <div class="sec"><h3>Android（Chrome）</h3><ol><li>ChromeでBOOTINのページを開く</li><li>右上の「︙」を押す</li><li>「ホーム画面に追加」または「アプリをインストール」を押す</li></ol></div>
  <p class="small muted">ホーム画面のぶーちんのアイコンから開くと、アプリと同じように全画面で使えます。データは開いたスマホの中に保存されます。</p>`);
}
