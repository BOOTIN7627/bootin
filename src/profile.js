
/* ===== マイプロフィール（★1）と記念日（★2）=====
   名前・ふりがな・生年月日・血液型・住所・電話は「私のこと」カード（S.set.me）と同じものを使う。
   S.set.me に足すもの：zip, tels[], mails[], honseki
   S.annivs=[{id,date:'YYYY-MM-DD',name,memo}] → カレンダーと1日のカードに毎年出る */
const BLOODS=['','A','B','O','AB','わからない'];
function meTels(){ const m=S.set.me; const t=(m.tels&&m.tels.length)?m.tels:(m.tel?[m.tel]:[]); return t.filter(Boolean); }
function bdayText(b){
  if(!/^\d{4}-\d\d-\d\d$/.test(b||'')) return h(b||'');
  const w=wareki(b); const a=age(b,today());
  return `${jpDate(b,false)}${w?`（${w}）`:''}${a!=null&&a>=0?`　${a}歳`:''}`;
}
function annivOn(s){ return (S.annivs||[]).filter(a=>a.date&&a.date.slice(5)===s.slice(5)&&a.date<=s); }
function annivYears(a,s){ const y=+s.slice(0,4)-+a.date.slice(0,4); return y>0?y:null; }
function vProfile(){
  const m=S.set.me; const tels=meTels(); const mails=(m.mails||[]).filter(Boolean);
  const isD=/^\d{4}-\d\d-\d\d$/.test(m.bday||'');
  const sz=isD?seiza(m.bday.slice(5)):'';
  const has=m.name||tels.length||m.addr||m.bday;
  const pad=a=>a.concat(['','']).slice(0,Math.max(2,a.length+1)); const ts=pad(tels), ms=pad(mails);
  const an=(S.annivs||[]).slice().sort((a,b)=>a.date.slice(5).localeCompare(b.date.slice(5)));
  return sub('マイプロフィール',`
  ${has?`<div class="sec prof"><h3>${h(m.name||'（名前なし）')}${m.kana?`<span class="small muted">　${h(m.kana)}</span>`:''}</h3><dl class="kv">
    ${m.bday?`<dt>生年月日</dt><dd>${bdayText(m.bday)}</dd>`:''}
    ${sz?`<dt>星座</dt><dd>${sz}</dd>`:''}
    ${m.blood?`<dt>血液型</dt><dd>${h(m.blood)}${/^(A|B|O|AB)$/.test(m.blood)?'型':''}</dd>`:''}
    ${m.addr||m.zip?`<dt>住所</dt><dd>${m.zip?`〒${h(m.zip)}<br>`:''}${h(m.addr||'')}${m.addr?`<span class="minis">${mapBtns(m.addr)}</span>`:''}</dd>`:''}
    ${tels.map((t,i)=>`<dt>電話${tels.length>1?i+1:''}</dt><dd><a href="${telHref(t)}">${h(t)}</a></dd>`).join('')}
    ${mails.map((t,i)=>`<dt>メール${mails.length>1?i+1:''}</dt><dd><a href="mailto:${h(t)}">${h(t)}</a></dd>`).join('')}
    ${m.honseki?`<dt>本籍地</dt><dd>${h(m.honseki)}</dd>`:''}
  </dl></div>`:sayBoo('あなたのことを書いておくページだよ。名前や生年月日は「私のこと」カードと同じものを使うよ。')}
  <div class="sec"><h3>記念日</h3>
    ${an.length?`<div class="list">${an.map(a=>{const nx=nextAnniv(a);return `<div class="row anrow"><span class="em">💐</span><span class="t"><b>${h(a.name)}</b><span>${+a.date.slice(5,7)}月${+a.date.slice(8)}日${a.date.slice(0,4)!=='0000'?`（${jpDate(a.date,false)}から）`:''}${nx.days===0?'　<b class="today">今日です</b>':`　あと${nx.days}日`}</span>${a.memo?`<span>${h(a.memo)}</span>`:''}</span><button class="mini" data-act="anndel" data-id="${a.id}">削除</button></div>`;}).join('')}</div>`:'<p class="muted small" style="margin:0 0 6px">まだありません。結婚記念日や、家族の大事な日などを入れておけます。</p>'}
    <form data-form="anniv" class="anform"><div class="f2"><input type="date" name="date" required aria-label="記念日の日付"><input name="name" required placeholder="例：結婚記念日" aria-label="記念日の名前"></div>
      <input name="memo" placeholder="メモ（なくてもよい）" aria-label="メモ"><button class="btn plain" type="submit">＋ 記念日を足す</button></form>
    <p class="small muted" style="margin:6px 0 0">記念日はカレンダーと1日のカードに毎年出ます。</p></div>
  <form class="sec" data-form="profile"><h3>${has?'書き直す':'書いておくこと'}</h3>
    <div class="f"><label for="pf-name">名前</label><input id="pf-name" name="name" value="${h(m.name||'')}"></div>
    <div class="f"><label for="pf-kana">ふりがな</label><input id="pf-kana" name="kana" value="${h(m.kana||'')}"></div>
    <div class="f"><label for="pf-bday">生年月日</label><input id="pf-bday" name="bday" type="${isD||!m.bday?'date':'text'}" value="${h(m.bday||'')}" min="1900-01-01"><span class="small muted">星座と和暦は自動で出ます</span></div>
    <div class="f"><label for="pf-blood">血液型</label><select id="pf-blood" name="blood">${BLOODS.concat(BLOODS.includes(m.blood||'')?[]:[m.blood]).map(b=>`<option value="${h(b)}" ${b===(m.blood||'')?'selected':''}>${b?h(b)+(/^(A|B|O|AB)$/.test(b)?'型':''):'（選ぶ）'}</option>`).join('')}</select></div>
    <div class="f"><label for="pf-zip">郵便番号</label><input id="pf-zip" name="zip" inputmode="numeric" placeholder="例：420-0000" value="${h(m.zip||'')}" style="max-width:10em"></div>
    <div class="f"><label for="pf-addr">住所</label><input id="pf-addr" name="addr" value="${h(m.addr||'')}"></div>
    <div class="f"><span class="lb">電話（いくつでも）</span>${ts.map((t,i)=>`<input name="tels" type="tel" value="${h(t)}" placeholder="${i?(i+1)+'つ目の番号':'例：090-0000-0000'}" aria-label="電話${i+1}" style="margin-bottom:4px">`).join('')}</div>
    <div class="f"><span class="lb">メール（いくつでも）</span>${ms.map((t,i)=>`<input name="mails" type="email" value="${h(t)}" placeholder="${i?(i+1)+'つ目のアドレス':'例：name@example.com'}" aria-label="メール${i+1}" style="margin-bottom:4px">`).join('')}</div>
    <div class="f"><label for="pf-hon">本籍地</label><input id="pf-hon" name="honseki" value="${h(m.honseki||'')}"></div>
    <p class="small muted">暗証番号・カード番号・マイナンバーは書かないでください。</p>
    <div class="btns"><button class="btn" type="submit">登録する</button><button class="btn plain" type="button" data-go="me">「私のこと」カードを見る</button></div>
  </form>`,{crumb:'私と家族 › マイプロフィール'});
}
function nextAnniv(a){ const t=today(); let y=+t.slice(0,4); let s=`${y}-${a.date.slice(5)}`; if(s<t){ y++; s=`${y}-${a.date.slice(5)}`; }
  return {s,days:Math.round((parseD(s)-parseD(t))/864e5)}; }
Object.assign(ACTS,{
  anndel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='もう一度押すと削除'; return; } S.annivs=(S.annivs||[]).filter(a=>a.id!==el.dataset.id); save(); render(); }
});
FORMS.profile=(f,fd)=>{
  const m=S.set.me;
  for(const k of ['name','kana','bday','blood','zip','addr','honseki']) m[k]=String(fd.get(k)||'').trim();
  m.tels=fd.getAll('tels').map(x=>String(x).trim()).filter(Boolean); m.tel=m.tels[0]||'';
  m.mails=fd.getAll('mails').map(x=>String(x).trim()).filter(Boolean);
  save(); toast('登録しました'); render(); window.scrollTo(0,0);
};
FORMS.anniv=(f,fd)=>{
  const date=fd.get('date'), name=String(fd.get('name')||'').trim(); if(!date||!name){ toast('日付と名前を入れてください'); return; }
  S.annivs=S.annivs||[]; S.annivs.push({id:'a'+Date.now().toString(36),date,name,memo:String(fd.get('memo')||'').trim()});
  save(); toast('記念日を足しました'); render();
};
