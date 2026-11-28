
/* ===== 旅行計画の貼り付け（11/28 本人）：ジェミニなどで作った旅行計画の文章を貼ると、日・時刻・場所・住所・電話・交通を読み取って行程に入れる。
   読み取りは文字の形で見分けるだけ（費用なし）。読み取ったあとは今までどおり手直しできる */
const TP_MOVE=[[/新幹線|電車|JR|私鉄|地下鉄|在来線|特急|快速|線/,'🚃 電車'],[/高速バス|路線バス|バス/,'🚌 バス'],[/タクシー/,'🚕 タクシー'],[/飛行機|空港|便/,'✈️ 飛行機'],[/フェリー|船/,'🚢 船'],[/徒歩|歩いて|歩き/,'🚶 歩き'],[/車|ドライブ|高速道路|IC|インター|運転/,'🚗 車']];
const TP_PREF=/(北海道|東京都|京都府|大阪府|.{2,3}県)/;
function tpMove(s){ for(const [re,m] of TP_MOVE) if(re.test(s)) return m; return ''; }
function tpClean(s){ return String(s).replace(/\*\*|__|^#+\s*|^[-・●○◆■□▶►*]+\s*/g,'').replace(/^[\s:：|]+|[\s:：|]+$/g,'').trim(); }
function tripParse(text){
  const out={stops:[],start:'',startTime:'',days:1}; let day=1, cur=null, pendMove='', pendTr='';
  const lines=String(text).replace(/\r/g,'').split('\n');
  for(let raw of lines){ let L=raw.trim(); if(!L) continue;
    if(/^\|?\s*:?-{2,}/.test(L)) continue;                                   /* 表の区切り線 */
    const dm=L.match(/(\d+)\s*日目/)||L.match(/^(?:Day|DAY)\s*(\d+)/); if(dm&&!/^\D{0,3}\d{1,2}[:：]\d{2}/.test(L)){ day=+dm[1]; out.days=Math.max(out.days,day); cur=null; continue; }
    let cells=L.includes('|')?L.split('|').map(tpClean).filter(Boolean):null;
    if(cells&&cells.length>=2&&/時間|時刻|場所|行き先|スポット/.test(L)&&!/\d{1,2}[:：]\d{2}/.test(L)) continue; /* 表の見出し */
    const flat=cells?cells.join(' ／ '):tpClean(L);
    const tm=flat.match(/(?:^|\s|／)(\d{1,2})[:：時](\d{2})?分?\s*(?:頃|ごろ)?\s*(?:[〜~～\-－ー]\s*(\d{1,2})[:：時](\d{2})?分?)?/);
    const tel=flat.match(/(0\d{1,4}[-－‐ー]\d{1,4}[-－‐ー]\d{3,4})/);
    const adm=flat.match(/(?:住所|所在地)\s*[:：]?\s*(?:〒?\s*\d{3}-?\d{4}\s*)?([^／|]+)/)||flat.match(/〒\s*\d{3}-?\d{4}\s*([^／|]+)/);
    const addrLike=!adm&&cells?cells.find(c=>TP_PREF.test(c)&&/[市区町村郡]/.test(c)):null;
    const isMoveLine=/^(→|↓|⇒|【?移動】?|移動|アクセス|乗り換え|乗換)/.test(tpClean(L))&&!tm;
    if(isMoveLine){ const m=tpMove(flat); if(m) pendMove=m; const t=flat.replace(/^(→|↓|⇒|【?移動】?|移動|アクセス|乗り換え|乗換)\s*[:：]?\s*/,''); if(t&&/[→駅線]/.test(t)) pendTr=(pendTr?pendTr+'／':'')+t; continue; }
    if(tm){
      let name=flat.slice(flat.indexOf(tm[0])+tm[0].length);
      if(cells){ const rest=cells.filter(c=>!c.includes(tm[0].trim())&&c!==(tel&&tel[1])&&!(TP_PREF.test(c)&&/[市区町村郡]/.test(c))&&!/^\d{1,2}[:：]\d{2}/.test(c)); name=rest[0]||name; }
      name=tpClean(name.split(/[／（(]/)[0].replace(/[:：]\s*$/,'').replace(/^[:：\s]+/,'')).slice(0,40);
      const hh=+tm[1], mm=tm[2]?+tm[2]:0; const time=pad(hh)+':'+pad(mm);
      const stay=tm[3]?Math.max(0,(+tm[3]*60+(tm[4]?+tm[4]:0))-(hh*60+mm)):'';
      if(/出発/.test(flat)&&!out.stops.some(s=>s.day===day)&&day===1&&!out.start){ out.start=name.replace(/出発|を?出発する?/g,'').trim()||name; out.startTime=time; const m=tpMove(flat); if(m) pendMove=m; cur=null; continue; }
      if(/出発/.test(flat)&&day>1&&!out.stops.some(s=>s.day===day)){ out.dayStart=out.dayStart||time; cur=null; continue; }
      const memo=cells?cells.filter(c=>c!==name&&!c.includes(tm[0].trim())&&!(tel&&c.includes(tel[1]))&&!(TP_PREF.test(c)&&/[市区町村郡]/.test(c))).join('、').slice(0,80):(flat.match(/[（(]([^）)]+)[）)]/)||[])[1]||'';
      const mv=tpMove(flat)&&!pendMove?tpMove(flat):'';
      cur={id:uid(),day,time,name:name||'（名前なし）',addr:'',tel:'',hp:'',memo,move:pendMove||mv,transit:pendTr,mv:'',stay:stay===''?60:stay};
      if(adm) cur.addr=tpClean(adm[1]).slice(0,80); else if(addrLike) cur.addr=addrLike;
      if(tel) cur.tel=tel[1].replace(/[－‐ー]/g,'-');
      out.stops.push(cur); pendMove=''; pendTr=''; continue;
    }
    if(cur){ if(adm){ cur.addr=tpClean(adm[1]).slice(0,80); }
      else if(TP_PREF.test(flat)&&/[市区町村郡]/.test(flat)&&!cur.addr&&flat.length<70){ cur.addr=flat.replace(/^(住所|所在地)\s*[:：]?/,'').trim(); }
      if(tel&&!cur.tel) cur.tel=tel[1].replace(/[－‐ー]/g,'-');
      if(!adm&&!tel&&!(TP_PREF.test(flat)&&/[市区町村郡]/.test(flat))){ const m=tpMove(flat); if(m&&/移動|で向かう|分|時間/.test(flat)) pendMove=m; else if(flat.length<60&&cur.memo.length<80) cur.memo=(cur.memo?cur.memo+'、':'')+flat.replace(/^(メモ|ポイント|備考)\s*[:：]/,''); }
    }
  }
  /* 「何時から何時」がない所は、次の時刻までをいる時間にする（移動30分を引く） */
  for(let i=0;i<out.stops.length;i++){ const s=out.stops[i], n=out.stops[i+1]; if(n&&n.day===s.day&&s.stay===60){ const d=t2m(n.time)-t2m(s.time)-30; if(d>=10&&d<=600) s.stay=Math.round(d/5)*5; } }
  return out;
}
function vTripPaste(id){
  const tr=(S.trips||[]).find(x=>x.id===id); if(!tr) return sub('貼り付け','<p>見つかりませんでした。</p>');
  const P=UI.tpParsed;
  return sub('旅行計画を貼り付ける',`<div class="sec"><h3>📋 ほかで作った旅行計画を入れる</h3>
    <ol class="small" style="margin:0 0 8px;padding-left:1.3em;line-height:1.7"><li>ジェミニなどで作った旅行計画の文章を、長押しして「コピー」します。</li><li>下の枠を長押しして「貼り付け」ます。</li><li>「読み取る」を押すと、日にち・時刻・場所・住所・電話番号・交通手段を読み取ります。</li><li>中身を確かめて「この内容で入れる」。あとから「✏️ 直す」で自由に直せます。</li></ol>
    <p class="small muted" style="margin:0 0 6px">うまく読み取れるのは「1日目」「10:30 清水寺」「住所：〜」「電話：075-〜」のように、1行ずつ書かれた文章や表です。</p>
    <textarea id="tp-paste" rows="9" placeholder="例）&#10;1日目&#10;7:30 静岡駅 出発（車）&#10;10:30〜12:00 清水寺&#10;住所：京都府京都市東山区清水1-294&#10;電話：075-551-1234&#10;12:30 昼ごはん 祇園">${h(UI.tpText||'')}</textarea>
    <div class="btns"><button class="btn" data-act="tpread" data-id="${tr.id}">🔍 読み取る</button></div></div>
  ${P?`<div class="sec"><h3>読み取った内容（${P.stops.length}か所）</h3>
    ${P.start?`<p class="small" style="margin:0 0 6px">出発：${h(P.start)} ${h(P.startTime)}</p>`:''}
    ${P.stops.length?P.stops.map(s=>`<div class="tpstop"><span class="tm">${P.days>1?`<small>${s.day}日目</small>`:''}${h(s.time)}</span><span class="t"><b>${h(s.name)}</b>${s.addr?`<span>〒 ${h(s.addr)}</span>`:'<span class="noaddr">住所なし</span>'}${s.tel?`<span>☎ ${h(s.tel)}</span>`:''}${s.move?`<span class="small muted">ここまで：${h(s.move)}</span>`:''}${s.transit?`<span class="small muted">🚃 ${h(s.transit)}</span>`:''}${s.memo?`<span class="small muted">${h(s.memo)}</span>`:''}</span></div>`).join(''):'<p class="muted">時刻のある行が見つかりませんでした。「10:30 清水寺」のように、時刻と場所が1行に書かれているか確かめてください。</p>'}
    ${P.stops.length?`<div class="btns"><button class="btn" data-act="tpapply" data-id="${tr.id}" data-c="replace">✓ この内容で入れる（今の行き先と入れかえ）</button></div>${(tr.stops||[]).length?`<div class="btns"><button class="btn plain" data-act="tpapply" data-id="${tr.id}" data-c="add">＋ 今の行き先の後ろに足す</button></div>`:''}`:''}</div>`:''}`,{crumb:'旅行計画'});
}
Object.assign(ACTS,{
  tpread:el=>{ UI.tpText=($('#tp-paste')||{}).value||''; UI.tpParsed=tripParse(UI.tpText); render(); setTimeout(()=>{ const x=$$('.sec')[1]; x&&x.scrollIntoView({behavior:'smooth'}); },60); },
  tpapply:el=>{ const t=tripOf(el), P=UI.tpParsed; if(!t||!P) return;
    if(el.dataset.c==='replace') t.stops=[];
    P.stops.forEach(s=>{ s.ord=tripStops(t,s.day).length; t.stops.push(s); });
    if(P.start&&(!t.start||el.dataset.c==='replace')){ t.start=P.start; t.slat=null; t.slon=null; }
    if(P.startTime&&(el.dataset.c==='replace'||!t.startTime)) t.startTime=P.startTime;
    if(P.dayStart) t.dayStart=P.dayStart;
    if(P.days>1&&t.from&&tripDays(t)<P.days) t.to=addDays(t.from,P.days-1);
    if(!t.mode){ const m=P.stops.map(s=>s.move).find(Boolean); if(m) t.mode=m; }
    UI.tpParsed=null; UI.tpText=''; save(); toast(`${P.stops.length}か所を入れました。時刻は貼り付けた計画のままです`); go('trips/'+t.id,true); },
  trippastenew:()=>{ S.trips=S.trips||[]; if(S.trips.length>=10){ toast('旅行計画は10件までです'); return; } const t={id:uid(),name:'貼り付けた旅行',from:'',to:'',memo:'',stops:[],startTime:'08:00',dayStart:'09:00',mode:''}; S.trips.push(t); save(); UI.tpParsed=null; UI.tpText=''; go('trippaste/'+t.id); }
});
