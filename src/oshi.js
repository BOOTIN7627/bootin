
/* ===== 推しの帳（★121 誕生日・記念日のお祝い、ライブ・舞台の日程とチケット）=====
   S.oshi=[{id,name,kind,bday,days:[{date,name}],memo,lives:[{id,date,time,title,place,ticket}]}]
   誕生日・記念日・ライブはカレンダー（趣味の色）と今日の予定に出る */
const OSHI_KIND=['歌手・アイドル','俳優','声優','アニメ・漫画','VTuber','お笑い','スポーツ選手','チーム','その他'];
function oshiItemsOn(s){ const out=[]; for(const o of S.oshi||[]){
  if(o.bday&&o.bday.slice(5)===s.slice(5)) out.push({k:'an',a:{name:`${o.name}の誕生日🎉`,em:'💖',go:'oshi/'+o.id},allday:true,time:'',color:'#13979A',yrs:null});
  for(const d of o.days||[]) if(d.date&&d.date.slice(5)===s.slice(5)&&d.date<=s){ const y=+s.slice(0,4)-+d.date.slice(0,4); out.push({k:'an',a:{name:`${o.name}：${d.name}${y>0?`（${y}周年）`:''}`,em:'💖',go:'oshi/'+o.id},allday:true,time:'',color:'#13979A',yrs:null}); }
  for(const l of o.lives||[]) if(l.date===s) out.push({k:'an',a:{name:`${o.name}：${l.title}${l.time?' '+l.time:''}${l.place?'（'+l.place+'）':''}`,em:'🎤',go:'oshi/'+o.id},allday:true,time:'',color:'#13979A',yrs:null});
 } return out; }
function vOshi(id){
  const L=S.oshi||[]; const o=id&&id!=='new'?L.find(x=>x.id===id):null;
  if(!o&&id!=='new') return sub('推しの帳',`${L.length?'':sayBoo('好きな人やチームを登録すると、誕生日や記念日、ライブの日をお知らせするよ。')}
    <div class="list">${L.map(x=>{const nx=(x.lives||[]).filter(l=>l.date>=today()).sort((a,b)=>a.date.localeCompare(b.date))[0];return `<button class="row" data-go="oshi/${x.id}"><span class="em">💖</span><span class="t"><b>${h(x.name)}</b><span>${h(x.kind||'')}${x.bday?`・誕生日 ${+x.bday.slice(5,7)}/${+x.bday.slice(8)}`:''}${nx?`・次のライブ ${+nx.date.slice(5,7)}/${+nx.date.slice(8)}`:''}</span></span><span class="go">›</span></button>`;}).join('')}</div>
    <div class="btns"><button class="btn" data-go="oshi/new">＋ 推しを登録</button></div>`,{crumb:'おたのしみ › 推しの帳'});
  if(id==='new'||UI.oshiEdit===id){ const x=o||{name:'',kind:'',bday:'',memo:''};
    return sub(o?'推しを直す':'推しを登録',`<form class="sec" data-form="oshi" data-id="${o?o.id:''}">
      <div class="f"><label for="os-n">名前</label><input id="os-n" name="name" required value="${h(x.name)}" placeholder="例：好きな歌手、チーム"></div>
      <div class="f"><label for="os-k">種類</label><select id="os-k" name="kind">${OSHI_KIND.map(k=>`<option ${k===x.kind?'selected':''}>${k}</option>`).join('')}</select></div>
      <div class="f"><label for="os-b">誕生日（わかれば。年は分からなければ今年で）</label><input id="os-b" type="date" name="bday" value="${h(x.bday||'')}"></div>
      <div class="f"><label for="os-m">メモ（好きなところ、公式サイトなど）</label><textarea id="os-m" name="memo" rows="3">${h(x.memo||'')}</textarea></div>
      <div class="btns"><button class="btn" type="submit">保存する</button>${o?`<button class="btn danger" type="button" data-act="oshidel" data-id="${o.id}">削除</button>`:''}</div></form>`,{crumb:'おたのしみ › 推しの帳'}); }
  const lives=(o.lives||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)); const t=today();
  return sub(o.name,`<div class="sec"><h3>💖 ${h(o.name)} <button class="more" data-act="oshiedit" data-id="${o.id}">直す ›</button></h3>
    <dl class="kv">${o.kind?`<dt>種類</dt><dd>${h(o.kind)}</dd>`:''}${o.bday?`<dt>誕生日</dt><dd>${+o.bday.slice(5,7)}月${+o.bday.slice(8)}日</dd>`:''}${o.memo?`<dt>メモ</dt><dd style="white-space:pre-wrap">${linkify(o.memo)}</dd>`:''}</dl></div>
  <div class="sec"><h3>🎉 記念日</h3>${(o.days||[]).map((d,i)=>`<div class="kdrow"><span>💖</span><span class="t">${h(d.name)}　<span class="small muted">${jpDate(d.date,false)}</span></span><button class="mini" data-act="oshidaydel" data-id="${o.id}" data-i="${i}">削除</button></div>`).join('')||'<p class="small muted" style="margin:0 0 6px">デビュー日、結成日など。毎年カレンダーに出ます。</p>'}
    <form data-form="oshiday" data-id="${o.id}" class="anform"><div class="f2"><input type="date" name="date" required aria-label="日付"><input name="name" required placeholder="例：デビュー日" aria-label="記念日の名前"></div><button class="btn plain" type="submit">＋ 記念日を足す</button></form></div>
  <div class="sec"><h3>🎤 ライブ・舞台の日程とチケット</h3>${lives.map(l=>`<div class="kdrow ${l.date<t?'past':''}"><span>🎤</span><span class="t"><b>${h(l.title)}</b><br><span class="small">${jpDate(l.date)}${l.time?' '+l.time:''}${l.place?'・'+h(l.place):''}</span>${l.ticket?`<br><span class="small muted">🎫 ${h(l.ticket)}</span>`:''}</span><button class="mini" data-act="livedel" data-id="${o.id}" data-l="${l.id}">削除</button></div>`).join('')||'<p class="small muted" style="margin:0 0 6px">まだありません。</p>'}
    <details class="hadd"><summary>＋ 日程を入れる</summary><form data-form="live" data-id="${o.id}">
      <div class="f"><label for="lv-t">公演の名前</label><input id="lv-t" name="title" required placeholder="例：全国ツアー 静岡公演"></div>
      <div class="two"><div class="f"><label for="lv-d">日にち</label><input id="lv-d" type="date" name="date" required></div><div class="f"><label for="lv-h">開演</label><input id="lv-h" type="time" name="time"></div></div>
      <div class="f"><label for="lv-p">会場</label><input id="lv-p" name="place"></div>
      <div class="f"><label for="lv-k">チケット（席・受け取り方・発券の締め切りなど）</label><input id="lv-k" name="ticket" placeholder="例：A席 3列、コンビニ発券 12/1まで"></div>
      <div class="btns"><button class="btn" type="submit">入れる</button></div></form></details></div>`,{crumb:'おたのしみ › 推しの帳'});
}
function linkify(t){ return h(t).replace(/https?:\/\/[^\s<]+/g,u=>`<a href="${u}" target="_blank" rel="noopener">${u}</a>`); }
function oshiOf(el){ return (S.oshi||[]).find(x=>x.id===el.dataset.id); }
Object.assign(ACTS,{
  oshiedit:el=>{ UI.oshiEdit=el.dataset.id; render(); },
  oshidel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='もう一度押すと削除'; return; } S.oshi=(S.oshi||[]).filter(x=>x.id!==el.dataset.id); UI.oshiEdit=''; save(); go('oshi',true); },
  oshidaydel:el=>{ const o=oshiOf(el); if(o){ o.days.splice(+el.dataset.i,1); save(); render(); } },
  livedel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='削除？'; return; } const o=oshiOf(el); if(o){ o.lives=o.lives.filter(l=>l.id!==el.dataset.l); save(); render(); } }
});
FORMS.oshi=(f,fd)=>{ S.oshi=S.oshi||[]; const id=f.dataset.id; const o=id?S.oshi.find(x=>x.id===id):{id:uid(),days:[],lives:[]};
  Object.assign(o,{name:String(fd.get('name')).trim(),kind:fd.get('kind'),bday:fd.get('bday')||'',memo:String(fd.get('memo')||'').trim()}); if(!id) S.oshi.push(o); UI.oshiEdit=''; save(); toast('保存しました'); go('oshi/'+o.id,true); };
FORMS.oshiday=(f,fd)=>{ const o=oshiOf(f); if(!o) return; o.days=o.days||[]; o.days.push({date:fd.get('date'),name:String(fd.get('name')).trim()}); save(); render(); };
FORMS.live=(f,fd)=>{ const o=oshiOf(f); if(!o) return; o.lives=o.lives||[]; o.lives.push({id:uid(),date:fd.get('date'),time:fd.get('time')||'',title:String(fd.get('title')).trim(),place:String(fd.get('place')||'').trim(),ticket:String(fd.get('ticket')||'').trim()}); save(); toast('入れました'); render(); };
