
/* ===== 防災（警報・注意報、地震、台風）と天気の解説 =====
   使うのは無料の公的な情報だけ：気象庁のJSON（警報・天気概況・台風）、P2P地震情報（地震）、国土地理院（場所→市町村コード） */
const JMA_OFFICE={'01':'016000','02':'020000','03':'030000','04':'040000','05':'050000','06':'060000','07':'070000','08':'080000','09':'090000','10':'100000','11':'110000','12':'120000','13':'130000','14':'140000','15':'150000','16':'160000','17':'170000','18':'180000','19':'190000','20':'200000','21':'210000','22':'220000','23':'230000','24':'240000','25':'250000','26':'260000','27':'270000','28':'280000','29':'290000','30':'300000','31':'310000','32':'320000','33':'330000','34':'340000','35':'350000','36':'360000','37':'370000','38':'380000','39':'390000','40':'400000','41':'410000','42':'420000','43':'430000','44':'440000','45':'450000','46':'460100','47':'471000'};
const WARN_NAME={'02':'暴風雪警報','03':'大雨警報','04':'洪水警報','05':'暴風警報','06':'大雪警報','07':'波浪警報','08':'高潮警報',
 '10':'大雨注意報','12':'大雪注意報','13':'風雪注意報','14':'雷注意報','15':'強風注意報','16':'波浪注意報','17':'融雪注意報','18':'洪水注意報','19':'高潮注意報','20':'濃霧注意報','21':'乾燥注意報','22':'なだれ注意報','23':'低温注意報','24':'霜注意報','25':'着氷注意報','26':'着雪注意報',
 '32':'暴風雪特別警報','33':'大雨特別警報','35':'暴風特別警報','36':'大雪特別警報','37':'波浪特別警報','38':'高潮特別警報'};
const warnLevel=c=>(+c>=32?3:+c<10?2:1); // 3特別警報 2警報 1注意報
const SCALE={10:'1',20:'2',30:'3',40:'4',45:'5弱',50:'5強',55:'6弱',60:'6強',70:'7'};
let bosaiLoading=false;
async function getJSON(u){ const r=await fetch(u,{cache:'no-cache'}); if(!r.ok) throw new Error(r.status); return r.json(); }
/* 天気の場所 → 市町村コード（国土地理院） */
async function bosaiMuni(){
  const w=S.set.wx, c=S.cache.muni;
  if(c&&c.lat===w.lat&&c.lon===w.lon) return c.code;
  const d=await getJSON(`https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${w.lat}&lon=${w.lon}`);
  const code=d&&d.results&&d.results.muniCd; if(!code) throw new Error('muni');
  S.cache.muni={lat:w.lat,lon:w.lon,code:String(code).padStart(5,'0')}; return S.cache.muni.code;
}
async function loadBosai(force){
  const b=S.cache.bosai; const w=S.set.wx;
  if(!force&&b&&b.lat===w.lat&&b.lon===w.lon&&Date.now()-b.at<10*60e3) return b;
  if(bosaiLoading) return null; bosaiLoading=true;
  const out={at:Date.now(),lat:w.lat,lon:w.lon,warn:null,quake:null,tc:null,ov:null,err:{}};
  try{
    let muni=''; try{ muni=await bosaiMuni(); }catch(e){ out.err.muni=1; }
    out.muni=muni; const pc=muni.slice(0,2); out.pref=pc?PREFS[+pc-1]:''; const off=JMA_OFFICE[pc];
    const jobs=[];
    if(off){
      jobs.push(getJSON(`https://www.jma.go.jp/bosai/warning/data/warning/${off}.json`).then(d=>{
        const cand=[muni+'00',muni.slice(0,4)+'000']; let area=null;
        for(const at of d.areaTypes||[]) for(const a of at.areas||[]) if(cand.includes(a.code)) area=a;
        const list=area?(area.warnings||[]).filter(x=>x.code&&WARN_NAME[x.code]&&x.status!=='解除'&&!/なし/.test(x.status||'')).map(x=>({code:x.code,name:WARN_NAME[x.code],lv:warnLevel(x.code),status:x.status})):[];
        list.sort((a,b)=>b.lv-a.lv);
        out.warn={time:d.reportDatetime,head:d.headlineText||'',list,found:!!area,office:off,area:area?area.code:''};
      }).catch(()=>{out.err.warn=1;}));
      jobs.push(getJSON(`https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${off}.json`).then(d=>{ out.ov={time:d.reportDatetime,office:d.publishingOffice,head:d.headlineText||'',text:d.text||''}; }).catch(()=>{out.err.ov=1;}));
    }
    jobs.push(getJSON('https://api.p2pquake.net/v2/history?codes=551&limit=20').then(d=>{
      out.quake=(d||[]).filter(x=>x.earthquake&&x.earthquake.hypocenter&&x.earthquake.hypocenter.name).slice(0,10).map(x=>{const e=x.earthquake; const mine=(x.points||[]).filter(p=>p.pref===out.pref).reduce((m,p)=>Math.max(m,p.scale||0),0);
        return {time:e.time,name:e.hypocenter.name,mag:e.hypocenter.magnitude,depth:e.hypocenter.depth,max:e.maxScale,mine,tsunami:e.domesticTsunami};});
    }).catch(()=>{out.err.quake=1;}));
    jobs.push(getJSON('https://www.jma.go.jp/bosai/typhoon/data/targetTc.json').then(d=>{ out.tc=Array.isArray(d)?d:[]; }).catch(()=>{out.err.tc=1;}));
    await Promise.all(jobs);
    S.cache.bosai=out; save(); return out;
  }finally{ bosaiLoading=false; }
}
function bosaiNow(){ const b=S.cache.bosai, w=S.set.wx; return b&&b.lat===w.lat&&b.lon===w.lon?b:null; }
const quakeAge=q=>{ const t=Date.parse((q.time||'').replace(/\//g,'-').replace(' ','T')+'+09:00'); return isNaN(t)?1e12:Date.now()-t; };
/* トップに出す知らせ（警報・大きな地震） */
function bosaiBar(){
  const b=bosaiNow(); if(!b) return ''; let out='';
  const big=b.warn&&b.warn.list.filter(x=>x.lv>=2);
  if(big&&big.length){ const sp=big.some(x=>x.lv===3);
    out+=`<button class="bosaibar ${sp?'sp':''}" data-go="bosai"><span class="em">${sp?'🚨':'⚠️'}</span><span class="t"><b>${h(big.map(x=>x.name).join('・'))}</b><span>${h(S.set.wx.name)}に出ています。避難の情報も確かめてください</span></span><span class="go">›</span></button>`; }
  const q=(b.quake||[]).find(q=>quakeAge(q)<3*3600e3&&(q.max>=40||q.mine>=30));
  if(q) out+=`<button class="bosaibar eq" data-go="bosai"><span class="em">🌏</span><span class="t"><b>地震 最大震度${SCALE[q.max]||'-'}${q.mine?`（${h(b.pref)} 震度${SCALE[q.mine]||'-'}）`:''}</b><span>${h(q.time.slice(5,16))}　震源：${h(q.name)}</span></span><span class="go">›</span></button>`;
  return out;
}
/* 天気画面に出す：解説と警報の要約 */
function wxComment(d){
  if(!d||!d.daily) return '';
  const H=d.hourly, now=d.current.time.slice(0,13); let st=H.time.findIndex(x=>x.slice(0,13)>=now); if(st<0) st=0;
  const day=d.daily, i0=0; const hi=Math.round(day.temperature_2m_max[i0]), lo=Math.round(day.temperature_2m_min[i0]);
  const s=[]; s.push(`今日は${wxt(day.weather_code[i0])[1]||'おおむね穏やか'}。最高${hi}℃、最低${lo}℃。`);
  let rainAt=-1; for(let i=st;i<st+12&&i<H.time.length;i++){ if((H.precipitation_probability[i]||0)>=50){rainAt=i;break;} }
  if(rainAt>=0) s.push(`${+H.time[rainAt].slice(11,13)}時ごろから雨の確率が${H.precipitation_probability[rainAt]}%に上がります。傘を持って出かけると安心です。`);
  else if((day.precipitation_probability_max[i0]||0)<20) s.push('雨の心配はほとんどありません。');
  const diff=hi-lo; if(diff>=10) s.push(`朝と昼の気温の差が${diff}℃あります。脱ぎ着しやすい服がおすすめです。`);
  if(day.temperature_2m_max[1]!=null){ const t=Math.round(day.temperature_2m_max[1])-hi; if(t<=-4) s.push(`明日は今日より${-t}℃ほど寒くなりそうです。`); else if(t>=4) s.push(`明日は今日より${t}℃ほど暖かくなりそうです。`); }
  if(hi>=31) s.push('暑さが厳しいので、水分をこまめにとってください。'); if(lo<=0) s.push('朝は氷点下。道路の凍結に気をつけて。');
  return s.join('');
}
function wxBosaiSec(d){
  const b=bosaiNow(); const ov=b&&b.ov; const cm=wxComment(d);
  let html=`<div class="sec wxcm"><h3>🎙️ 今日の天気のひとこと</h3><p style="margin:0">${h(cm)}</p>${ov&&ov.text?`<details style="margin-top:8px"><summary><b>${h(ov.office||'気象台')}の解説を読む</b></summary><p class="small" style="white-space:pre-wrap;margin:6px 0 0">${h(ov.text)}</p><p class="small muted" style="margin:4px 0 0">${h((ov.time||'').slice(0,16).replace('T',' '))} 発表</p></details>`:''}</div>`;
  const wl=b&&b.warn?b.warn.list:[];
  html+=`<button class="row bosairow" data-go="bosai"><span class="em">🛟</span><span class="t"><b>防災情報（警報・地震・台風）</b><span>${wl.length?h(wl.map(x=>x.name).join('・')):(b&&b.warn?'今、警報・注意報は出ていません':'押すと警報・地震・台風を見ます')}</span></span><span class="go">›</span></button>`;
  return html;
}
function vBosai(){
  const b=bosaiNow(); const nm=h(S.set.wx.name);
  let body=`<p class="small muted" style="margin:0 0 6px">場所：<b>${nm}</b>（天気の場所と同じです。<button class="linkb" data-go="weather">天気の画面</button>で変えられます）</p>
  <div class="btns"><button class="btn wxrl" data-act="bosaireload">最新情報に更新 <span class="rl" aria-hidden="true">🔄</span></button></div>`;
  if(!b){ body+=`<div class="empty">${bosaiLoading?'読み込んでいます…':'読み込めませんでした。電波のある所で「最新情報に更新」を押してください。'}</div>`; return sub('防災情報',body,{crumb:'NEWS・知識 › NEWS'}); }
  // 警報・注意報
  const w=b.warn;
  body+=`<div class="sec"><h3>⚠️ 警報・注意報</h3>${w?(w.list.length?`<div class="wlist">${w.list.map(x=>`<span class="wtag lv${x.lv}">${h(x.name)}</span>`).join('')}</div>`:'<p style="margin:0">今、警報・注意報は出ていません。</p>')+(w.head?`<p class="small" style="margin:8px 0 0">${h(w.head)}</p>`:'')+`<p class="small muted" style="margin:4px 0 0">${h((w.time||'').slice(0,16).replace('T',' '))} 気象庁発表</p>`:'<p class="small muted" style="margin:0">読み込めませんでした。</p>'}
    <a class="btn plain" style="margin-top:8px" href="https://www.jma.go.jp/bosai/warning/#area_type=class20s&area_code=${h(w&&w.area||'')}" target="_blank" rel="noopener">気象庁の警報の地図を開く</a>
    <p class="small" style="margin:8px 0 0"><b>避難指示などの避難情報</b>は市町村が出します。テレビ・ラジオ、市町村の防災メールやスマホの緊急速報でも確かめてください。</p></div>`;
  // 地震
  const qs=b.quake||[];
  body+=`<div class="sec"><h3>🌏 最近の地震</h3>${qs.length?qs.map(q=>`<div class="eqrow ${q.max>=40?'big':''}"><span class="sc">震度<b>${SCALE[q.max]||'-'}</b></span><span class="t"><b>${h(q.name)}</b><span>${h((q.time||'').slice(5,16))}　M${q.mag>0?q.mag:'-'}${q.depth>0?`・深さ${q.depth}km`:''}${q.mine?`　<b>${h(b.pref)}：震度${SCALE[q.mine]}</b>`:''}${q.tsunami&&q.tsunami!=='None'&&q.tsunami!=='Unknown'?'　<b class="tsu">津波に注意</b>':''}</span></span></div>`).join(''):`<p class="small muted" style="margin:0">${b.err.quake?'読み込めませんでした。':'最近の地震はありません。'}</p>`}
    <p class="small muted" style="margin:6px 0 0">地震のデータ：P2P地震情報（気象庁の発表をもとにした無料の情報）</p></div>`;
  // 台風
  const tc=b.tc;
  body+=`<div class="sec"><h3>🌀 台風情報</h3>${tc==null?'<p class="small muted" style="margin:0">読み込めませんでした。</p>':tc.length?`<p style="margin:0"><b>今、台風が${tc.length}個あります。</b>位置と進路の予想は、気象庁の台風の地図で見られます。</p>`:'<p style="margin:0">今、台風は発生していません。</p>'}
    <a class="btn plain" style="margin-top:8px" href="https://www.jma.go.jp/bosai/map.html#contents=typhoon" target="_blank" rel="noopener">気象庁の台風の位置・進路予想図を開く</a></div>
    <p class="small muted">情報のもと：気象庁・国土地理院・P2P地震情報（どれも無料）。このアプリは補助です。大事な判断は公式の発表で確かめてください。</p>`;
  return sub('防災情報',body,{crumb:'NEWS・知識 › NEWS'});
}
