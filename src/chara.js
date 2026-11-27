
/* ===== ぶーちん劇場：キャラ紹介と相関図（絵はキャラ担当スレッドの chara-svg、CHARA_SVG に埋め込み）=====
   表情 n=ふだん joy=喜 ang=怒 sad=哀 fun=楽。クロにゃんは n だけ、OZ は PNG（CHARA_OZ）だけ。 */
const CHARA=[
 ['boo','ぶーちん','主人公・子ぶた','家族','世話を焼かれるけど焼かない甘えん坊。サングラスをかけると急に強気','奥さんはエンちん、息子はてるチン。トンじいは先輩','要するにさ…えーっと、なんだっけ','#FDECEF'],
 ['en','エンちん','ツバメ・ぶーちんの奥さん','家族','少し上から口うるさい、しっかり者','ぶーちんの奥さん。ファーの姉','まったく、また忘れてるでしょ','#E8EEF9'],
 ['teru','てるチン','息子・天気の係','家族','クールでマイペース、でも臆病。気分が一定しない','ぶーちんとエンちんの息子。マイペースで、親の言うことは半分だけ聞く','……べつに。晴れるんじゃない','#E3F2FD'],
 ['kuro','クロにゃん','黒猫・家の物知り','仲間','全知全能（を名乗る）物知り','ぶーちんの家の猫。OZの友達','何でも聞いてにゃ','#EEE9F6'],
 ['ton','トンじい','ぶーちんの先輩','仲間','口うるさいが、かわいいものに弱い','ぶーちんの先輩で友人','だからオレ、言ったの','#F3EEE6'],
 ['eri','チビえり','巫女・静岡弁','仲間','小柄でかわいいしっかり者','調子に乗ったぶーちんをお祓いする','行ってこ！見てこ！','#FDEDEA'],
 ['aya','アーヤ','健康コーチ・遠州弁','仲間','強気で威勢がいい','マーシーと二人で、ぶーちんの歩数と体重をしごく','やってみそ！','#FFF3E0'],
 ['masi','マーシー','会社の仲間・マラソン','仲間','めちゃくちゃ明るい','ぶーちんの会社の仲間。アーヤとコーチ仲間','あなたヤバい人ですね','#E8F1FB'],
 ['fa','ファー','エンちんの妹','仲間','美形でしっかり者','エンちんの妹、アンギエの奥さん。ぶーちんを「お兄さん」と呼ぶ','お兄さん、元気あるよ？','#FDECEC'],
 ['angie','アンギエ','ファーの旦那・黒豚','仲間','陽気ないたずら好き。でも面倒見がいい','ファーの旦那。ぶーちんとはカンペー仲間','アンギエ、おなかすいた','#EFEFEF'],
 ['oz','OZ','前の会社の後輩・ネズミ','仲間','頭がよく、気が利く','ぶーちんの前の会社の後輩。クロにゃんの友達','ハハハ、それは無理です','#F5EEE6']
];
/* 4コマ（新しいものを先頭に）。who＝出てくるキャラ（キャラ紹介からつなぐ） */
const KOMA=[{id:'chi',t:'血は争えん',who:['ton'],d:'2026-11-27'}];
const EXPR=[['n','ふだん'],['joy','喜'],['ang','怒'],['sad','哀'],['fun','楽']];
const CIMG={};
function charaImg(k,e){ e=e||'n'; const key=k+'_'+e; if(CIMG[key]) return CIMG[key];
  if(k==='oz') return CHARA_OZ; const s=CHARA_SVG[key]||CHARA_SVG[k+'_n']; if(!s) return BOO_F;
  return CIMG[key]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s); }
const TAGC={'家族':'#F6C915','仲間':'#9FD3F5','レア':'#F4A7B9'};
function vGekijo(tab){
  tab=tab||'chara';
  const tabs=`<div class="chips gktabs">${[['chara','みんな'],['map','相関図'],['4koma','4コマ'],['rare','レア図鑑'],['otayori','お便り']].map(([k,n])=>`<button class="chip" aria-pressed="${tab===k}" data-go-r="gekijo/${k}">${n}</button>`).join('')}</div>`;
  let body='';
  if(tab==='chara') body=`<div class="cgrid">${CHARA.map(c=>`<button class="ccard" data-go="chara/${c[0]}"><span class="ctag" style="background:${TAGC[c[3]]}">${c[3]}</span><img src="${charaImg(c[0])}" alt=""><b>${h(c[1])}</b><span>${h(c[2])}</span></button>`).join('')}
    <div class="ccard rare"><span class="ctag" style="background:${TAGC['レア']}">レア</span><span class="shadow">？</span><b>？？？</b><span>まだ会っていない</span></div></div>`;
  if(tab==='map') body=soukanzu();
  if(tab==='rare') body=`<div class="sec" style="text-align:center">${sayBoo('めったに会えない「レアキャラ」がいるらしいよ。会えたら、ここに集まるよ。')}<div class="cgrid">${[1,2,3].map(()=>`<div class="ccard rare"><span class="shadow">？</span><b>？？？</b><span>まだ会っていない</span></div>`).join('')}</div></div>`;
  if(tab==='4koma') body=KOMA.map(m=>`<div class="sec koma" id="koma-${m.id}"><h3 style="margin:2px 0 2px">${h(m.t)}</h3><div class="small muted">${jpDate(m.d)}・${m.who.map(k=>h(CHARA.find(c=>c[0]===k)[1])).join('・')}ほか</div><img src="${KOMA_IMG[m.id]}" alt="4コマ「${h(m.t)}」" loading="lazy"></div>`).join('')+`<p class="small muted" style="text-align:center">4コマは、ときどき増えます。</p>`;
  if(tab==='otayori') body=OTAYORI.map(o=>`<div class="sec"><div class="small muted">${jpDate(o.d)}</div><h3 style="margin:2px 0 6px">${h(o.t)}</h3>${sayBoo(h(o.b).replace(/\n/g,'<br>'))}</div>`).join('');
  return sub('ぶーちん劇場',tabs+body,{crumb:'おたのしみ'});
}
function vChara(k){
  const c=CHARA.find(x=>x[0]===k); if(!c) return vGekijo('chara');
  const ex=k==='kuro'||k==='oz'?[]:EXPR;
  const e=UI.cExpr&&UI.cExpr[0]===k?UI.cExpr[1]:'n';
  return sub(c[1],`<div class="chero" style="background:${c[7]}"><img src="${charaImg(k,e)}" alt="${h(c[1])}"><div><h2>${h(c[1])}</h2><span class="small">${h(c[2])}</span></div></div>
  <dl class="kv cdl"><dt>性格</dt><dd>${h(c[4])}</dd><dt>関係</dt><dd>${h(c[5])}</dd><dt>ひとこと</dt><dd>「${h(c[6])}」</dd></dl>
  ${ex.length?`<div class="sec"><h3>表情 <span class="small muted">押すと上の絵が変わります</span></h3><div class="cexp">${ex.map(([x,n])=>`<button data-act="cexpr" data-k="${k}" data-e="${x}" aria-pressed="${x===e}"><img src="${charaImg(k,x)}" alt=""><span>${n}</span></button>`).join('')}</div></div>`:''}
  ${KOMA.some(m=>m.who.includes(k))?`<div class="sec"><h3>この子が出てくる4コマ</h3>${KOMA.filter(m=>m.who.includes(k)).map(m=>`<button class="row" data-go-r="gekijo/4koma"><span class="em">📖</span><span class="t"><b>${h(m.t)}</b><span>4コマを読む</span></span><span class="go">›</span></button>`).join('')}</div>`:''}
  <div class="btns"><button class="btn plain" data-go-r="gekijo/map">相関図で見る</button><button class="btn plain" data-go-r="gekijo/chara">みんなにもどる</button></div>`,{crumb:'ぶーちん劇場 › キャラ紹介'});
}
function soukanzu(){
  const N={kuro:[390,150],oz:[120,150],teru:[640,120],en:[660,340],fa:[660,560],angie:[660,820],ton:[110,430],masi:[120,660],aya:[260,900],eri:[480,880],boo:[390,480]};
  const E=[['boo','en','夫婦 ♥','#D9443F',0],['boo','teru','息子','#D9443F',0],['en','teru','','#D9443F',0],['en','fa','姉妹','#D9443F',0],['fa','angie','夫婦 ♥','#D9443F',0],['boo','fa','お兄さん','#D9443F',1],['boo','angie','カンペー仲間','#E08A00',1],
   ['boo','kuro','家の物知り','#2D8A57',0],['kuro','oz','友達','#2D8A57',0],['boo','oz','前の会社の後輩','#2D6CDF',0],['boo','ton','先輩・友人','#2D6CDF',0],['boo','masi','会社の仲間','#2D6CDF',0],
   ['masi','aya','コーチ仲間','#E08A00',0],['boo','aya','しごかれる','#E08A00',1],['boo','eri','お祓い','#8E5BD0',1]];
  const OFF={'boo|angie':[-30,-10],'en|fa':[0,22],'boo|aya':[-20,0],'masi|aya':[20,0],'boo|fa':[-40,-8],'boo|eri':[0,20],'boo|oz':[-45,35],'boo|kuro':[0,20],'fa|angie':[0,10]};
  let ln='',lb='';
  for(const [a,b,t,c,d] of E){ const [x1,y1]=N[a],[x2,y2]=N[b];
    ln+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="6" ${d?'stroke-dasharray="14 10"':''} stroke-linecap="round"/>`;
    if(!t) continue; const o=OFF[a+'|'+b]||[0,0]; const f=({'boo|en':0.45,'boo|oz':0.62})[a+'|'+b]||(a==='boo'?0.6:0.5); const mx=x1+(x2-x1)*f+o[0], my=y1+(y2-y1)*f+o[1]; const w=t.length*25+28;
    lb+=`<g><rect x="${mx-w/2}" y="${my-21}" width="${w}" height="42" rx="21" fill="#fff" stroke="${c}" stroke-width="4"/><text x="${mx}" y="${my+9}" text-anchor="middle" fill="${c}" class="sl">${h(t)}</text></g>`; }
  let nd='';
  for(const [k,[x,y]] of Object.entries(N)){ const big=k==='boo', r=big?92:70; const c=CHARA.find(z=>z[0]===k);
    nd+=`<g class="snode" data-go="chara/${k}"><circle cx="${x}" cy="${y}" r="${r}" fill="${big?'#FFF1C2':'#fff'}" stroke="${big?'#F6C915':'#1E1B14'}" stroke-width="6"/>
     <image href="${charaImg(k)}" x="${x-r+12}" y="${y-r+12}" width="${2*r-24}" height="${2*r-24}"/>
     <rect x="${x-c[1].length*15-18}" y="${y+r-16}" width="${c[1].length*30+36}" height="44" rx="22" fill="#1E1B14"/><text x="${x}" y="${y+r+15}" text-anchor="middle" class="sn">${h(c[1])}</text></g>`; }
  const leg=[['家族','#D9443F'],['仕事','#2D6CDF'],['友達・家','#2D8A57'],['いじり・コーチ','#E08A00'],['ツッコミ','#8E5BD0']].map(([t,c])=>`<span><i style="background:${c}"></i>${t}</span>`).join('');
  return `<div class="hleg smleg">${leg}<span>点線＝ときどき絡む</span></div>
  <div class="smap"><svg viewBox="0 0 780 1010" role="img" aria-label="キャラの相関図"><style>.sl{font:900 26px sans-serif}.sn{font:900 28px sans-serif;fill:#fff}</style>${ln}${nd}${lb}
  <g><rect x="560" y="935" width="210" height="66" rx="16" fill="#FFF5F8" stroke="#F4A7B9" stroke-width="3" stroke-dasharray="8 6"/><text x="665" y="964" text-anchor="middle" font-size="22" font-weight="900" fill="#B0466A">レアキャラは</text><text x="665" y="990" text-anchor="middle" font-size="20" fill="#B0466A">会うと仲間入り</text></g></svg></div>
  <p class="small muted">キャラを押すと、紹介のページが開きます。</p>`;
}
Object.assign(ACTS,{ cexpr:el=>{ UI.cExpr=[el.dataset.k,el.dataset.e]; render(); } });
