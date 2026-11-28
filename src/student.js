
/* ===== 学生モード（T10・★132）と学生の子（時間割・部活・塾・テストの点・進路メモ）=====
   トップを大きな6マス（カレンダー・やること・時間割とテスト・脳トレ・辞書・家族に連絡）にする。
   親の合言葉（4けた）を決めておくと、学生モードから戻すときに聞く。ビジネスの入口は出さない。
   S.todos=[{id,t,due,done}]  S.school={tt:{'曜-時限':'科目'},club,juku,shinro}  S.tests=[{id,date,name,subj,score,max}]  S.brain={best} */
const STU_DAYS=['月','火','水','木','金','土'];
function stuCells(){
  const t=today();
  return [['📅','カレンダー',`cal/${t.slice(0,7)}`],['✅','やること','todo'],['🏫','時間割・テスト','school'],['🧠','脳トレ','brain'],['📖','辞書','dict'],['📞','家族に連絡','famcall']]
    .map(([e,n,r])=>`<button class="cell" data-go="${r}"><span class="em">${e}</span><span class="nm">${n}</span></button>`).join('');
}
function stuTop(){
  if(S.set.mode!=='student') return '';
  const t=today(); const wd=parseD(t).getDay(); const tt=(S.school||{}).tt||{};
  const per=[1,2,3,4,5,6].map(i=>tt[`${wd}-${i}`]).map((s,i)=>s?`<span><b>${i+1}</b>${h(s)}</span>`:'').join('');
  const td=(S.todos||[]).filter(x=>!x.done).sort((a,b)=>(a.due||'9').localeCompare(b.due||'9')).slice(0,4);
  return `<div class="sec t-stu"><h2>✅ やること <button class="more" data-go="todo">一覧 ›</button></h2>
    ${td.length?td.map(x=>todoRow(x)).join(''):'<p class="small muted" style="margin:0">やることはありません。</p>'}
    ${wd>=1&&wd<=6&&per?`<h3 class="stuh">🏫 今日の時間割</h3><div class="ttday">${per}</div>`:''}</div>`;
}
function todoRow(x){ const t=today(); const late=x.due&&x.due<t&&!x.done;
  return `<div class="todo ${x.done?'done':''}"><button class="ck" data-act="todock" data-id="${x.id}" aria-label="${x.done?'やっていないに戻す':'できた'}">${x.done?'✓':''}</button><span class="tdt">${h(x.t)}${x.due?`<small class="${late?'late':''}">${x.due===t?'今日まで':late?'期限すぎ '+(+x.due.slice(5,7))+'/'+(+x.due.slice(8)):'〜'+(+x.due.slice(5,7))+'/'+(+x.due.slice(8))}</small>`:''}</span></div>`; }
function vTodo(){
  const L=(S.todos||[]).slice().sort((a,b)=>(a.done-b.done)||(a.due||'9').localeCompare(b.due||'9'));
  const done=L.filter(x=>x.done).length;
  return sub('やること',`<form class="sec" data-form="todo"><div class="f"><input name="t" required placeholder="例：数学のプリント" aria-label="やること"></div>
    <div class="two"><div class="f"><label for="td-d">いつまで（なくてもよい）</label><input id="td-d" type="date" name="due"></div><div class="f" style="align-self:end"><button class="btn" type="submit">＋ 足す</button></div></div></form>
    <div class="sec">${L.length?L.map(todoRow).join(''):'<p class="muted" style="margin:0">まだありません。</p>'}
    ${done?`<div class="btns"><button class="btn plain" data-act="tododone">できたもの（${done}件）を消す</button></div>`:''}</div>`,{crumb:'学生モード'});
}
function vSchool(){
  const sc=S.school||{}; const tt=sc.tt||{}; const ed=UI.ttEdit;
  const head=`<div></div>${STU_DAYS.map(d=>`<div class="th">${d}</div>`).join('')}`;
  const body=[1,2,3,4,5,6].map(i=>`<div class="th">${i}</div>${STU_DAYS.map((d,j)=>{const k=`${j+1}-${i}`;return ed?`<input name="tt_${k}" value="${h(tt[k]||'')}" aria-label="${d}曜${i}時間目">`:`<div class="td">${h(tt[k]||'')}</div>`;}).join('')}`).join('');
  const tests=(S.tests||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
  const groups={}; for(const x of tests){ const k=x.date+'|'+x.name; (groups[k]=groups[k]||[]).push(x); }
  return sub('時間割・テスト',`
  <form class="sec" data-form="tt"><h3>🏫 時間割 ${ed?'':'<button type="button" class="more" data-act="ttedit">直す ›</button>'}</h3>
    <div class="tt">${head}${body}</div>${ed?'<div class="btns"><button class="btn" type="submit">保存する</button></div>':''}</form>
  <div class="sec"><h3>📝 テストの点</h3>
    ${Object.entries(groups).map(([k,xs])=>{const [d,n]=k.split('|');const sum=xs.reduce((a,x)=>a+(+x.score||0),0);return `<div class="tgrp"><b>${h(n||'テスト')}</b> <span class="small muted">${jpDate(d,false)}　合計 ${sum}点</span>
      <div class="tsc">${xs.map(x=>`<span>${h(x.subj)} <b>${h(x.score)}</b>${x.max&&+x.max!==100?`/${h(x.max)}`:''}<button class="x" data-act="testdel" data-id="${x.id}" aria-label="消す">×</button></span>`).join('')}</div></div>`;}).join('')||'<p class="small muted" style="margin:0 0 6px">まだありません。</p>'}
    <details class="hadd"><summary>＋ 点数を入れる</summary><form data-form="test">
      <div class="two"><div class="f"><label for="ts-d">日にち</label><input id="ts-d" type="date" name="date" required value="${today()}"></div><div class="f"><label for="ts-n">テストの名前</label><input id="ts-n" name="name" placeholder="例：2学期期末" value="${h(UI.lastTest||'')}"></div></div>
      <div class="two"><div class="f"><label for="ts-s">科目</label><input id="ts-s" name="subj" required placeholder="例：数学"></div><div class="f"><label for="ts-p">点数</label><input id="ts-p" name="score" inputmode="numeric" required></div></div>
      <div class="f"><label for="ts-m">満点（100点でなければ）</label><input id="ts-m" name="max" inputmode="numeric" placeholder="100" style="max-width:8em"></div>
      <div class="btns"><button class="btn" type="submit">入れる</button></div></form></details></div>
  <form class="sec" data-form="schoolmemo"><h3>⚽ 部活・塾・進路のメモ</h3>
    <div class="f"><label for="sc-c">部活</label><textarea id="sc-c" name="club" rows="2" placeholder="例：練習は火・木・土、試合の日程">${h(sc.club||'')}</textarea></div>
    <div class="f"><label for="sc-j">塾・習い事</label><textarea id="sc-j" name="juku" rows="2" placeholder="例：月・水 19時〜">${h(sc.juku||'')}</textarea></div>
    <div class="f"><label for="sc-s">進路メモ</label><textarea id="sc-s" name="shinro" rows="3" placeholder="例：行きたい学校、説明会の日">${h(sc.shinro||'')}</textarea></div>
    <div class="btns"><button class="btn plain" type="submit">メモを保存</button></div></form>`,{crumb:'私と家族 › 学生の子'});
}
/* 脳トレ：かんたん計算10問 */
let BR=null;
function brainQ(){ const ops=['+','-','×']; const o=ops[Math.floor(Math.random()*3)]; let a,b;
  if(o==='×'){a=2+Math.floor(Math.random()*8);b=2+Math.floor(Math.random()*8);} else {a=5+Math.floor(Math.random()*45);b=1+Math.floor(Math.random()*30); if(o==='-'&&b>a)[a,b]=[b,a];}
  return {a,b,o,ans:o==='+'?a+b:o==='-'?a-b:a*b}; }
function vBrain(){
  const best=(S.brain||{}).best;
  if(!BR) return sub('脳トレ',`${sayBoo('かんたんな計算を10問。早く正しく答えてね。')}
    ${best?`<p style="text-align:center">これまでの一番：<b>${(best/1000).toFixed(1)}秒</b>（10問全部正解）</p>`:''}
    <div class="btns" style="justify-content:center"><button class="btn" data-act="brainstart">はじめる</button></div>`,{crumb:'おたのしみ › ゲーム'});
  if(BR.i>=10){ const sec=(BR.end-BR.start)/1000;
    return sub('脳トレ',`<div class="sec" style="text-align:center"><h3>おわり！</h3><p style="font-size:1.6rem;margin:6px 0"><b>${BR.ok}</b> / 10問 正解</p><p>かかった時間 <b>${sec.toFixed(1)}秒</b>${BR.newBest?'<br><b style="color:var(--warn)">新記録！</b>':''}</p>
      <div class="btns" style="justify-content:center"><button class="btn" data-act="brainstart">もう一度</button><button class="btn plain" data-act="brainend">おしまい</button></div></div>`,{crumb:'おたのしみ › ゲーム'}); }
  const q=BR.q;
  return sub('脳トレ',`<div class="sec brain"><p class="small muted" style="margin:0">${BR.i+1} / 10問　${BR.last||''}</p><div class="bq">${q.a} ${q.o} ${q.b} =</div>
    <form data-form="brain"><input id="br-a" name="a" inputmode="numeric" autocomplete="off" aria-label="答え" class="ba"><button class="btn" type="submit">答える</button></form></div>`,{crumb:'おたのしみ › ゲーム'});
}
function vDict(k){
  const w=UI.dictW||'';
  let L=[['国語辞典','https://www.weblio.jp/content/'],['英和・和英','https://ejje.weblio.jp/content/'],['中国語','https://cjjc.weblio.jp/content/'],['漢字（読み・書き順）','https://kanji.jitenon.jp/cat/search?getdata='],['ウィキペディア','https://ja.wikipedia.org/wiki/Special:Search?search=']];
  const FIRST={kokugo:'国語辞典',kanwa:'漢字（読み・書き順）',waei:'英和・和英'}[k]; if(FIRST) L=[...L.filter(x=>x[0]===FIRST),...L.filter(x=>x[0]!==FIRST)];
  return sub('辞書',`<div class="sec"><div class="f"><input class="search" id="dict-w" type="search" value="${h(w)}" placeholder="🔍 調べたい言葉" aria-label="調べたい言葉"></div>
    <div class="list">${L.map(([n,u])=>`<a class="row" target="_blank" rel="noopener" data-dict="${u}" href="${w?u+encodeURIComponent(w):'#'}"><span class="em">📖</span><span class="t"><b>${n}で調べる</b><span>${w?h(w):'言葉を入れてから押します'}</span></span><span class="go">↗</span></a>`).join('')}</div>
    <p class="small muted">外の辞書サイト（無料）が開きます。</p></div>`,{crumb:'NEWS・知識 › 辞書'});
}
function vFamCall(){
  const fam=S.people.filter(p=>(p.cats||[]).includes('c1'));
  const me=S.set.me||{};
  return sub('家族に連絡',`${fam.length?`<div class="list">${fam.map(p=>{const tel=(p.phones||[]).find(x=>x.num);const mail=(p.emails||[]).find(Boolean);return `<div class="row famrow">${face(p,52)}<span class="t"><b>${h(p.name)}</b><span class="minis">${tel?`<a class="mini tel" href="${telHref(tel.num)}">📞 電話</a>`:''}${p.line?`<a class="mini" href="https://line.me/R/" target="_blank" rel="noopener">💬 LINE</a>`:''}${mail?`<a class="mini" href="mailto:${h(typeof mail==='string'?mail:mail.addr||'')}">✉️ メール</a>`:''}</span></span></div>`;}).join('')}</div>`
    :sayBoo('人物帳で「家族」のカテゴリーに入れた人が、ここに並ぶよ。')}
    ${me.contact||me.contactTel?`<div class="sec"><h3>もしものときの連絡先</h3><p style="margin:0">${h(me.contact||'')}　${me.contactTel?`<a href="${telHref(me.contactTel)}">${h(me.contactTel)}</a>`:''}</p></div>`:''}
    <div class="btns"><button class="btn plain" data-go="people">人物帳を開く</button></div>`,{crumb:'交友・アドレス'});
}
Object.assign(ACTS,{
  todock:el=>{ const x=(S.todos||[]).find(t=>t.id===el.dataset.id); if(x){ x.done=!x.done; save(); render(); } },
  tododone:()=>{ S.todos=(S.todos||[]).filter(x=>!x.done); save(); render(); },
  ttedit:()=>{ UI.ttEdit=true; render(); },
  testdel:el=>{ if(el.dataset.sure!=='1'){ el.dataset.sure='1'; el.textContent='消す？'; return; } S.tests=(S.tests||[]).filter(x=>x.id!==el.dataset.id); save(); render(); },
  brainstart:()=>{ BR={i:0,ok:0,start:Date.now(),q:brainQ()}; render(); setTimeout(()=>{const a=$('#br-a'); if(a) a.focus();},50); },
  brainend:()=>{ BR=null; render(); },
  pinunlock:()=>{ const v=($('#pin-in')||{}).value||''; if(v===S.set.parentPin){ UI.pinOk=true; render(); } else toast('合言葉がちがいます'); }
});
FORMS.todo=(f,fd)=>{ const t=String(fd.get('t')||'').trim(); if(!t) return; S.todos=S.todos||[]; S.todos.push({id:uid(),t,due:fd.get('due')||'',done:false}); save(); render(); };
FORMS.tt=(f,fd)=>{ S.school=S.school||{}; const tt={}; for(const [k,v] of fd.entries()) if(k.startsWith('tt_')&&String(v).trim()) tt[k.slice(3)]=String(v).trim(); S.school.tt=tt; UI.ttEdit=false; save(); toast('保存しました'); render(); };
FORMS.test=(f,fd)=>{ S.tests=S.tests||[]; const name=String(fd.get('name')||'').trim(); UI.lastTest=name; S.tests.push({id:uid(),date:fd.get('date'),name,subj:String(fd.get('subj')).trim(),score:String(fd.get('score')).trim(),max:String(fd.get('max')||'').trim()}); save(); toast('入れました'); render(); };
FORMS.schoolmemo=(f,fd)=>{ S.school=S.school||{}; for(const k of ['club','juku','shinro']) S.school[k]=String(fd.get(k)||'').trim(); save(); toast('保存しました'); render(); };
FORMS.brain=(f,fd)=>{ if(!BR) return; const v=String(fd.get('a')||'').trim(); if(v==='') return;
  const ok=+v===BR.q.ans; if(ok) BR.ok++; BR.last=ok?'⭕ 正解':`❌ ${BR.q.a} ${BR.q.o} ${BR.q.b} = ${BR.q.ans}`; BR.i++;
  if(BR.i>=10){ BR.end=Date.now(); const tm=BR.end-BR.start; S.brain=S.brain||{}; if(BR.ok===10&&(!S.brain.best||tm<S.brain.best)){ S.brain.best=tm; BR.newBest=true; save(); } }
  else BR.q=brainQ();
  render(); setTimeout(()=>{const a=$('#br-a'); if(a) a.focus();},50); };
FORMS.pin=(f,fd)=>{ const v=String(fd.get('pin')||'').trim(); if(v&&!/^\d{4}$/.test(v)){ toast('数字4けたにしてください'); return; } S.set.parentPin=v; save(); toast(v?'合言葉を決めました':'合言葉をなくしました'); render(); };
/* 設定のモード欄 */
function modeSec(){
  const s=S.set; const r=(val,label)=>`<label><input type="radio" name="mode" value="${val}" ${s.mode===val?'checked':''} data-act="setr">${label}</label>`;
  const locked=s.mode==='student'&&s.parentPin&&!UI.pinOk;
  return `<div class="sec"><h3>モード</h3>
    ${locked?`<p class="small" style="margin:0 0 6px">学生モードを変えるには、親の合言葉（4けた）を入れてください。</p><div class="two"><input id="pin-in" inputmode="numeric" maxlength="4" aria-label="親の合言葉" class="pinin"><button class="btn plain" data-act="pinunlock">開ける</button></div>`
      :`<div class="choose">${r('normal','通常')}${r('elder','高齢者')}${r('student','学生')}</div>`}
    <p class="small muted" style="margin:4px 0 0">高齢者モード：トップを大きな6マスにして「よく電話する人」を上に出します。<br>学生モード：トップを「カレンダー・やること・時間割とテスト・脳トレ・辞書・家族に連絡」の6マスにします。ビジネスの入口は出しません。</p>
    ${s.mode==='student'&&!locked?`<form data-form="pin" class="two" style="margin-top:8px"><div class="f"><label for="pin-set">親の合言葉（4けた・なくてもよい）</label><input id="pin-set" name="pin" inputmode="numeric" maxlength="4" value="${h(s.parentPin||'')}"></div><div class="f" style="align-self:end"><button class="btn plain" type="submit">決める</button></div></form><p class="small muted" style="margin:0">決めておくと、学生モードから戻すときに聞きます。</p>`:''}</div>`;
}
