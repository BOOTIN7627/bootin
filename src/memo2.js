
/* ===== メモ帳（11/28）：メモは1か所に集める。カテゴリーと題名を付けて整理、大きな画面で書式つき編集 =====
   S.memos=[{id,t,text,html?,title?,cat?,kept?,photo?,from?}]  kept=true で「整理済み」、なければ「未整理（とりあえず保管）」 */
function memoCats(){ return TREE.map(r=>r.name).concat(['その他']); }
/* いま開いている画面が、どの大きい入口（1段目）の中か */
function curCat(){
  const r=cur(); if(r.startsWith('node/')) return redOf(r.slice(5));
  const base=r.split('/')[0]; for(const [id,v] of Object.entries(IMPL)) if(v===base) return redOf(id);
  return '';
}
/* 書式つきメモの安全な表示（決まった書式だけ残す） */
function cleanHtml(html){
  const doc=new DOMParser().parseFromString('<div>'+String(html||'')+'</div>','text/html');
  const OK=new Set(['B','STRONG','I','EM','U','S','BR','DIV','P','UL','OL','LI','H3','H4','SPAN','FONT','MARK','BLOCKQUOTE']);
  const walk=el=>{ [...el.childNodes].forEach(n=>{ if(n.nodeType===3) return; if(n.nodeType!==1){ n.remove(); return; }
      if(!OK.has(n.tagName)){ n.replaceWith(...n.childNodes); return; }
      const col=n.getAttribute('color')||(n.style&&n.style.color)||''; const bg=n.style&&n.style.backgroundColor||''; const fs=n.getAttribute('size')||'';
      [...n.attributes].forEach(a=>n.removeAttribute(a.name));
      if(/^(#[0-9a-f]{3,6}|rgb\([\d, ]+\))$/i.test(col)) n.style.color=col;
      if(/^(#[0-9a-f]{3,6}|rgb\([\d, ]+\))$/i.test(bg)) n.style.backgroundColor=bg;
      if(n.tagName==='FONT'&&/^[1-7]$/.test(fs)) n.setAttribute('size',fs);
      walk(n); }); };
  const root=doc.body.firstChild; walk(root); return root.innerHTML;
}
const memoBody=m=>m.html?`<div class="mhtml">${cleanHtml(m.html)}</div>`:`<div style="white-space:pre-wrap;overflow-wrap:anywhere">${h(m.text||'')}</div>`;
const memoPlain=m=>m.html?new DOMParser().parseFromString(m.html,'text/html').body.textContent:(m.text||'');
function vMemo(){
  const cats=memoCats(); const tab=UI.memoTab||'all';
  const tabs=[['all','すべて'],['tmp','未整理'],['kept','整理済み'],['other','ほかの場所のメモ']];
  return sub('メモ帳',`<div class="btns" style="margin-top:0"><button class="btn" data-go="memoedit/new">📝 新しく書く（大きい画面）</button></div>
  <input class="search" id="mq" type="search" placeholder="メモを探す" value="${h(UI.memoQ)}">
  <div class="chips cwrap">${tabs.map(([k,n])=>`<button class="chip" aria-pressed="${tab===k}" data-act="memotab" data-c="${k}">${n}</button>`).join('')}</div>
  <div class="chips">${['',...cats].map(c=>`<button class="chip" aria-pressed="${(UI.memoCat||'')===c}" data-act="memocat" data-c="${h(c)}">${c?emojiOf(c)+' '+h(c):'カテゴリー：全部'}</button>`).join('')}</div>
  <div id="mlist">${memoList()}</div>
  <p class="small muted">右下の「✏️ メモ」で、どの画面からでもすぐ書けます。題名とカテゴリーは、あとで「整理」で付けられます。</p>`,{crumb:'設定・機能 › その他の機能'});
}
function memoList(){
  const q=UI.memoQ.trim(), tab=UI.memoTab||'all', cat=UI.memoCat||'';
  if(tab==='other'){
    const list=allMemos().filter(m=>m.src!=='さっとメモ'&&(!q||(m.text+m.sub).includes(q)));
    if(!list.length) return `<div class="empty">ほかの場所（1日のカード・人物帳・施設帳）に書いたメモは、まだありません。</div>`;
    return `<div class="list">${list.map(m=>`<div class="sec mcard"><div class="small"><span class="src">${h(m.src)}</span>${h(m.sub)}</div><div style="white-space:pre-wrap;overflow-wrap:anywhere;margin-top:4px">${h(m.text)}</div><div class="minis"><button class="mini" data-go="${m.go}">書いた所を開く ›</button></div></div>`).join('')}</div>`;
  }
  const list=S.memos.filter(m=>(tab==='all'||(tab==='kept'?m.kept:!m.kept))&&(!cat||m.cat===cat)&&(!q||(memoPlain(m)+(m.title||'')+(m.from||'')).includes(q))).sort((a,b)=>(b.u||b.t).localeCompare(a.u||a.t));
  if(!list.length) return `<div class="empty">${BOO_IMG}${q||cat||tab!=='all'?'この条件のメモはありません。':'メモはまだありません。右下の「✏️ メモ」から書いてみよう。'}</div>`;
  return `<div class="list">${list.map(m=>`<div class="sec mcard ${m.kept?'kept':''}"><div class="mhead"><b>${h(m.title||'無題')}</b>${m.cat?`<span class="mcat">${emojiOf(m.cat)} ${h(m.cat)}</span>`:''}<span class="mstate">${m.kept?'整理済み':'未整理'}</span></div>
    <div class="small muted">${jpDate(m.t.slice(0,10),false)} ${m.t.slice(11,16)}${m.from?'　'+h(m.from)+'で':''}</div>
    <div class="mprev">${memoBody(m)}</div>${m.photo?`<img class="memoimg" src="${m.photo}" alt="メモの写真">`:''}
    <div class="minis"><button class="mini" data-go="memoedit/${m.id}">✏️ 開いて直す・整理</button><button class="mini" data-act="delmemo" data-id="${m.id}">${UI.confirm==='m'+m.id?'本当に削除する':'削除'}</button></div></div>`).join('')}</div>`;
}
/* 大きい画面で書く・直す（太字・色・大きい字・見出し・箇条書き） */
function vMemoEdit(id){
  const isNew=id==='new'; const m=isNew?{title:'',cat:curCatPrev(),html:'',text:''}:S.memos.find(x=>x.id===id); if(!m) return vMemo();
  const body=m.html?cleanHtml(m.html):h(m.text||'').replace(/\n/g,'<br>');
  const TB=[['bold','<b>B</b>','太字'],['underline','<u>U</u>','下線'],['red','<span style="color:#D32F2F">赤</span>','赤い字'],['blue','<span style="color:#1565E8">青</span>','青い字'],['green','<span style="color:#2E7D32">緑</span>','緑の字'],['mark','<mark>蛍</mark>','蛍光ペン'],['big','大','大きい字'],['h3','見出し','見出し'],['ul','・箇条','箇条書き'],['clear','消','書式を消す']];
  return sub(isNew?'メモを書く':'メモを直す・整理',`<div class="f"><input name="mt" id="me-title" value="${h(m.title||'')}" placeholder="題名（入れなければ「無題」）" aria-label="題名"></div>
   <div class="f"><select id="me-cat" aria-label="カテゴリー"><option value="">カテゴリー（あとで決めてもよい）</option>${memoCats().map(c=>`<option ${m.cat===c?'selected':''}>${h(c)}</option>`).join('')}</select></div>
   <div class="metb">${TB.map(([k,l,a])=>`<button type="button" data-act="mefmt" data-c="${k}" aria-label="${a}">${l}</button>`).join('')}</div>
   <div id="me-body" class="mebody" contenteditable="true" aria-label="メモの中身">${body}</div>
   <div class="btns"><button class="btn" data-act="mesave" data-id="${isNew?'':m.id}" data-k="1">📁 整理して保管</button><button class="btn plain" data-act="mesave" data-id="${isNew?'':m.id}" data-k="">とりあえず保管</button></div>
   <p class="small muted">「整理して保管」は手帳のように取っておくメモ、「とりあえず保管」は未整理のメモです。いらなくなったら一覧の「削除」で消せます。ワード10枚分くらいまで書けます。</p>`,{crumb:'メモ帳'});
}
function curCatPrev(){ const p=stack[stack.length-2]||''; if(p.startsWith('node/')) return redOf(p.slice(5)); const base=p.split('/')[0]; for(const [id,v] of Object.entries(IMPL)) if(v===base) return redOf(id); return ''; }
Object.assign(ACTS,{
  memotab:(el,d)=>{ UI.memoTab=d.c; render(); },
  memocat:(el,d)=>{ UI.memoCat=d.c; render(); },
  mefmt:(el,d)=>{ const b=$('#me-body'); if(!b) return; b.focus(); const ex=(c,v)=>{ try{ document.execCommand(c,false,v); }catch(e){} };
    ({bold:()=>ex('bold'),underline:()=>ex('underline'),red:()=>ex('foreColor','#D32F2F'),blue:()=>ex('foreColor','#1565E8'),green:()=>ex('foreColor','#2E7D32'),mark:()=>ex('hiliteColor','#FFF176'),big:()=>ex('fontSize','5'),h3:()=>ex('formatBlock','h3'),ul:()=>ex('insertUnorderedList'),clear:()=>{ ex('removeFormat'); ex('formatBlock','div'); }}[d.c]||(()=>{}))(); },
  mesave:(el,d)=>{ const b=$('#me-body'); const html=cleanHtml(b.innerHTML); const text=b.innerText.trim(); if(!text){ toast('なにか書いてください'); return; }
    if(html.length>200000){ toast('長すぎます。2つに分けてください'); return; }
    const now=new Date(), ts=ymd(now)+'T'+pad(now.getHours())+':'+pad(now.getMinutes());
    let m=d.id?S.memos.find(x=>x.id===d.id):null; if(!m){ m={id:uid(),t:ts,from:'メモ帳'}; S.memos.push(m); }
    Object.assign(m,{title:$('#me-title').value.trim(),cat:$('#me-cat').value,html,text,kept:!!d.k,u:ts}); save(); toast(d.k?'整理して保管しました':'とりあえず保管しました'); go('memo',true); }
});
Object.assign(ACTS,{ memoof:(el,d)=>{ UI.memoCat=d.c; UI.memoTab='all'; go('memo'); } });
