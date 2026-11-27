
/* ===== 家計簿（★54）=====
   S.kakei=[{id,date,io:'out'|'in',cat,amount,memo}]  月ごとの合計・項目ごとの合計・年の累計 */
const KK_OUT=[['🍚','食費'],['🍜','外食'],['🧻','日用品'],['🚃','交通'],['🏥','医療'],['💡','光熱・水道'],['📱','通信'],['🏠','住まい'],['📚','教育'],['🎨','趣味・娯楽'],['🎁','交際'],['👕','衣服'],['📦','その他']];
const KK_IN=[['💼','給料'],['👴','年金'],['💰','その他の収入']];
const kkEm=c=>(KK_OUT.concat(KK_IN).find(x=>x[1]===c)||['📦'])[0];
const yen=n=>(Math.round(n)||0).toLocaleString()+'円';
function vKakei(ym){
  if(!/^\d{4}-\d\d$/.test(ym||'')) ym=today().slice(0,7);
  const [y,m]=ym.split('-').map(Number); const prev=ymd(new Date(y,m-2,1)).slice(0,7), next=ymd(new Date(y,m,1)).slice(0,7);
  const L=(S.kakei||[]).filter(x=>x.date.startsWith(ym)).sort((a,b)=>b.date.localeCompare(a.date));
  const sum=io=>L.filter(x=>x.io===io).reduce((a,x)=>a+(+x.amount||0),0);
  const out=sum('out'), inn=sum('in');
  const yOut=(S.kakei||[]).filter(x=>x.date.startsWith(String(y))&&x.date.slice(0,7)<=ym&&x.io==='out').reduce((a,x)=>a+(+x.amount||0),0);
  const byCat={}; for(const x of L.filter(x=>x.io==='out')) byCat[x.cat]=(byCat[x.cat]||0)+(+x.amount||0);
  const cats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]); const mx=cats.length?cats[0][1]:1;
  const io=UI.kkIo||'out'; const CL=io==='in'?KK_IN:KK_OUT; const sel=UI.kkCat&&CL.some(c=>c[1]===UI.kkCat)?UI.kkCat:CL[0][1];
  let days=''; let cur='';
  for(const x of L){ if(x.date!==cur){ cur=x.date; days+=`<div class="kkday">${+x.date.slice(5,7)}/${+x.date.slice(8)}（${WD[parseD(x.date).getDay()]}）</div>`; }
    days+=`<div class="kkrow"><span class="em">${kkEm(x.cat)}</span><span class="t"><b>${h(x.cat)}</b>${x.memo?`<span>${h(x.memo)}</span>`:''}</span><span class="amt ${x.io}">${x.io==='in'?'+':''}${yen(x.amount)}</span><button class="mini" data-act="kkdel" data-id="${x.id}">削除</button></div>`; }
  return sub('家計簿',`
  ${calNav(`${y}年${m}月`,`data-go-r="kakei/${prev}"`,`data-go-r="kakei/${next}"`,ym!==today().slice(0,7)?`data-go-r="kakei/${today().slice(0,7)}"`:'')}
  <div class="sec kksum"><div><span>出たお金</span><b class="out">${yen(out)}</b></div><div><span>入ったお金</span><b class="in">${yen(inn)}</b></div><div><span>差し引き</span><b>${inn-out<0?'−':''}${yen(Math.abs(inn-out))}</b></div>
    <p class="small muted" style="grid-column:1/-1;margin:2px 0 0">${y}年1月からの出たお金の累計：<b>${yen(yOut)}</b></p></div>
  <form class="sec" data-form="kakei"><h3>＋ 書く</h3>
    <div class="choose kkio"><button type="button" class="chip" aria-pressed="${io==='out'}" data-act="kkio" data-v="out">出たお金</button><button type="button" class="chip" aria-pressed="${io==='in'}" data-act="kkio" data-v="in">入ったお金</button></div>
    <div class="chips kkcats">${CL.map(([e,n])=>`<button type="button" class="chip" aria-pressed="${n===sel}" data-act="kkcat" data-v="${n}">${e} ${n}</button>`).join('')}</div>
    <input type="hidden" name="cat" value="${h(sel)}"><input type="hidden" name="io" value="${io}">
    <div class="two"><div class="f"><label for="kk-a">金額（円）</label><input id="kk-a" name="amount" inputmode="numeric" required placeholder="例：1280"></div><div class="f"><label for="kk-d">日にち</label><input id="kk-d" type="date" name="date" value="${ym===today().slice(0,7)?today():ym+'-01'}"></div></div>
    <div class="f"><input name="memo" placeholder="メモ（例：スーパー、薬局）" aria-label="メモ"></div>
    <div class="btns"><button class="btn" type="submit">書く</button></div></form>
  ${cats.length?`<div class="sec"><h3>項目ごと（出たお金）</h3>${cats.map(([c,v])=>`<div class="kkbar"><span>${kkEm(c)} ${h(c)}</span><i style="width:${Math.max(4,v/mx*100)}%"></i><b>${yen(v)}</b></div>`).join('')}</div>`:''}
  <div class="sec"><h3>この月の記録</h3>${days||'<p class="muted" style="margin:0">まだありません。</p>'}</div>
  <p class="small muted">カード番号や口座番号は書かないでください。</p>`,{crumb:'生活管理 › 家計管理'});
}
Object.assign(ACTS,{
  kkio:el=>{ UI.kkIo=el.dataset.v; UI.kkCat=''; render(); },
  kkcat:el=>{ UI.kkCat=el.dataset.v; $$('.kkcats .chip').forEach(b=>b.setAttribute('aria-pressed',b===el)); const i=$('form[data-form=kakei] input[name=cat]'); if(i) i.value=el.dataset.v; },
  kkdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='削除？'; return; } S.kakei=(S.kakei||[]).filter(x=>x.id!==el.dataset.id); save(); render(); }
});
FORMS.kakei=(f,fd)=>{
  const a=String(fd.get('amount')||'').replace(/[^\d]/g,''); if(!a){ toast('金額を入れてください'); return; }
  S.kakei=S.kakei||[]; S.kakei.push({id:uid(),date:fd.get('date')||today(),io:fd.get('io')==='in'?'in':'out',cat:fd.get('cat')||'その他',amount:+a,memo:String(fd.get('memo')||'').trim()});
  save(); toast('書きました'); render();
};
