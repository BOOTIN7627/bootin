
/* ===== ご意見・ご要望 と ぶーちんの部屋 =====
   受け渡し場所は Google スプレッドシート＋Apps Script（無料）。FB_URL にその公開アドレスを入れる。
   合言葉はスクリプトの側だけで確かめる（このファイルは誰でも見られるので、合言葉は書かない）。
   S.set.fbId＝このスマホの目印（返事を受け取るため） S.fbSeen＝読んだ返事のid */
const FB_URL='';
function fbId(){ if(!S.set.fbId){ S.set.fbId='u'+uid()+uid(); save(); } return S.set.fbId; }
async function fbCall(body){
  const r=await fetch(FB_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow'});
  if(!r.ok) throw new Error('http'); const d=await r.json(); if(d.err) throw new Error(d.err); return d;
}
let FB={mine:null,loading:false,err:'',room:null,pass:''};
function fbLoadMine(){ if(!FB_URL||FB.loading) return; FB.loading=true; FB.at=Date.now();
  fbCall({a:'mine',uid:fbId()}).then(d=>{FB.mine=d.rows||[];FB.err='';}).catch(()=>{FB.err='読み込めませんでした';}).finally(()=>{FB.loading=false; if(cur()==='iken') render();}); }
function vIken(){
  if(!FB_URL) return sub('ご意見・ご要望',`<div class="junbi">${BOO_IMG}<div><span class="stamp">【準備中】</span></div><p>ぶーちんへのご意見・ご要望を送る窓口を、ただいま準備しています。</p></div>`,{crumb:'設定・機能'});
  if((FB.mine===null||Date.now()-(FB.at||0)>20000)&&!FB.err) fbLoadMine();
  const me=S.set.me||{};
  const mine=(FB.mine||[]).slice().reverse();
  return sub('ご意見・ご要望',`${sayBoo('使ってみて「ここが使いにくい」「こんなのがほしい」と思ったら、なんでも書いて送ってね。作っている人に届くよ。')}
  <form class="sec" data-form="iken"><div class="f"><label for="ik-n">お名前（ニックネームでも）</label><input id="ik-n" name="name" value="${h(UI.ikName??(me.name||''))}" maxlength="40"></div>
    <div class="f"><label for="ik-t">ご意見・ご要望</label><textarea id="ik-t" name="text" rows="5" required maxlength="2000" placeholder="例：カレンダーの文字をもう少し大きくしてほしい"></textarea></div>
    <p class="small muted" style="margin:0 0 6px">暗証番号・カード番号・マイナンバーは書かないでください。</p>
    <div class="btns"><button class="btn" type="submit" ${UI.ikSending?'disabled':''}>${UI.ikSending?'送っています…':'送る'}</button></div></form>
  <div class="sec"><h3>送ったものと、ぶーちんからの返事</h3>
    ${FB.err?`<p class="small" style="color:var(--warn)">${FB.err}</p>`:''}${FB.mine===null&&!FB.err?'<p class="small muted">読み込んでいます…</p>':''}
    ${mine.map(m=>`<div class="ikrow"><div class="small muted">${h(fmtTs(m.time))}</div><div>${h(m.text)}</div>${m.reply?`<div class="ikrep"><img src="${BOO_F}" alt=""><span><b>ぶーちんより</b>${h(m.reply)}</span></div>`:'<div class="small muted">まだ返事はありません</div>'}</div>`).join('')||(FB.mine?'<p class="small muted" style="margin:0">まだ送っていません。</p>':'')}
    <div class="btns"><button class="btn plain" data-act="ikreload">返事を見る 🔄</button></div></div>`,{crumb:'設定・機能'});
}
function fmtTs(t){ const d=new Date(t); if(isNaN(d)) return ''; return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${pad(d.getMinutes())}`; }
function vRoom(){
  const body=!FB_URL?'<p>受け渡し場所の設定がまだです。</p>'
   :FB.room===null?`<form class="sec" data-form="room"><h3>🔑 合言葉</h3><div class="f"><input id="rm-p" name="pass" type="password" autocomplete="current-password" aria-label="合言葉" required></div><div class="btns"><button class="btn" type="submit">入る</button></div>${FB.err?`<p class="small" style="color:var(--warn)">${h(FB.err)}</p>`:''}</form>`
   :`<p class="small muted">届いたご意見 ${FB.room.length}件（新しい順）</p>${FB.room.slice().reverse().map(m=>`<div class="sec ikrow"><div class="small muted">${h(fmtTs(m.time))}　<b>${h(m.name||'名前なし')}</b></div><div style="white-space:pre-wrap">${h(m.text)}</div>
     <form data-form="rreply" data-id="${h(m.id)}"><textarea name="text" rows="2" placeholder="返事を書く" aria-label="返事">${h(m.reply||'')}</textarea><div class="btns"><button class="btn plain" type="submit">${m.reply?'返事を直す':'返事を送る'}</button></div></form></div>`).join('')}
     <div class="btns"><button class="btn plain" data-act="roomreload">新しく読み直す 🔄</button><button class="btn plain" data-act="roomout">部屋を出る</button></div>`;
  return sub('ぶーちんの部屋',`${sayBoo('ここは作っている人だけが入れる部屋だよ。')}${body}`,{crumb:'設定・機能'});
}
function roomLoad(){ return fbCall({a:'list',pass:FB.pass}).then(d=>{FB.room=d.rows||[];FB.err='';}).catch(e=>{FB.room=null;FB.err=e.message==='pass'?'合言葉がちがいます':'読み込めませんでした';}).finally(()=>render()); }
Object.assign(ACTS,{
  ikreload:()=>{ FB.mine=null; FB.err=''; render(); },
  roomreload:()=>{ roomLoad(); },
  roomout:()=>{ FB.room=null; FB.pass=''; render(); }
});
FORMS.iken=(f,fd)=>{ const text=String(fd.get('text')||'').trim(); if(!text) return; UI.ikName=String(fd.get('name')||'').trim(); UI.ikSending=true; render();
  fbCall({a:'send',uid:fbId(),name:UI.ikName,text}).then(()=>{toast('送りました。ありがとう！'); FB.mine=null;}).catch(()=>toast('送れませんでした。電波のよいところでもう一度')).finally(()=>{UI.ikSending=false; render();}); };
FORMS.room=(f,fd)=>{ FB.pass=String(fd.get('pass')||''); roomLoad(); };
FORMS.rreply=(f,fd)=>{ const text=String(fd.get('text')||'').trim(); fbCall({a:'reply',pass:FB.pass,id:f.dataset.id,text}).then(()=>{toast('返事を送りました'); roomLoad();}).catch(()=>toast('送れませんでした')); };
