
/* ---------- オープニング（BOOTINの文字を押したときだけ） ----------
   パターンを OP_PATTERNS に並べ、押すたびにランダムで1つ選ぶ（前回と同じものは続けて出さない） */
let opLast=-1;
function opBooWrap(){
  const arms=`<svg class="op-arms" viewBox="0 0 218 210" aria-hidden="true"><g stroke="#6B4A3A" stroke-width="5" stroke-linecap="round" fill="#FAD4D8">
    <path d="M58 138 Q110 128 150 158 Q156 170 144 172 Q104 150 62 158 Q48 150 58 138 Z"/>
    <path d="M160 138 Q108 128 68 158 Q62 170 74 172 Q114 150 156 158 Q170 150 160 138 Z"/></g></svg>`;
  const shades=`<svg class="op-shades" viewBox="0 0 100 30" aria-hidden="true"><path d="M2 4 H46 Q47 26 25 26 Q4 26 2 4 Z M54 4 H98 Q96 26 75 26 Q53 26 54 4 Z" fill="#111"/><path d="M44 7 Q50 2 56 7" fill="none" stroke="#111" stroke-width="4"/><path d="M10 9 H22 M62 9 H74" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/></svg>`;
  return `<div class="op-booWrap"><div class="op-boo"><img class="op-b1" src="${OP_BOO}" alt="ぶーちん">${arms}<img class="op-b2" src="${OP_SAD}" alt="">${shades}<span class="op-sweat">💧</span></div>
      <span class="op-name op-nBoo">ぶーちん</span></div>`;
}
function opJag(html,cls,tail){
  // tail: 'r'＝右下へ（右にいる人が話す） 'l'＝左下へ 'b'＝下へ
  const P='100,6 112,22 130,8 134,26 156,14 154,34 180,28 170,46 194,54 176,64 192,80 170,82 178,100 154,94 150,112 132,100 120,114 106,100 90,114 80,98 60,108 58,90 36,98 40,80 14,82 26,66 6,56 26,46 12,30 38,32 34,14 58,24 64,6 80,20';
  const T=tail==='r'?'M146 80 L198 116 L126 96 Z':tail==='l'?'M60 80 L2 114 L80 98 Z':'M88 96 L100 122 L114 96 Z';
  return `<div class="op-jag ${cls||''}"><svg viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true"><g fill="#fff" stroke="#1E1B14" stroke-width="3.5" stroke-linejoin="round"><path d="${T}"/><polygon points="${P}"/></g><path d="${T}" fill="#fff"/></svg><span>${html}</span></div>`;
}
const OP_LOGO=`<div class="op-logo" aria-label="BOOTIN"><span>BOOTIN</span></div>`;
const OP_PATTERNS=[
  /* 1: エンちんに叩かれる → トンじい */
  ()=>`<div class="op-burst"></div><div class="op-flash"></div>
    <div class="op-ton"><span class="op-say op-sTon">だから言ったの</span><img src="${OP_TON}" alt=""><span class="op-name">トンじい</span></div>
    ${opBooWrap()}
    <div class="op-say op-s1">何でもオレに任せな！</div>
    <div class="op-say op-s3">しょんぼり…</div>
    ${opJag('💢 なに調子に<br>乗ってんの！','op-jagEn','r')}
    <div class="op-en"><img src="${OP_EN}" alt=""><span class="op-name">エンちん</span></div>
    <div class="op-pow">バシッ</div>${OP_LOGO}<div class="op-catch">ライフサポート万能アプリ</div>`,
  /* 2: チビえりにお祓いされる → アーヤ */
  ()=>`<div class="op-burst"></div><div class="op-flash op-flashW"></div>
    <div class="op-aya"><img src="${OP_AYA}" alt=""><span class="op-name">アーヤ</span><span class="op-say op-sAya">あ、いつもの<br>情けないぶーちんに<br>戻ったわ</span></div>
    ${opBooWrap()}
    <div class="op-say op-s1">オレは全知全能だぜ！</div>
    <div class="op-say op-s3">もじもじ…</div>
    <div class="op-eri"><div class="op-say op-sEri">憑いてるね。<br>お祓いしてこ</div><img src="${OP_ERI}" alt=""><span class="op-name">チビえり</span></div>
    <div class="op-pow op-powE">シャラーン</div>${OP_LOGO}<div class="op-catch">ライフサポート万能アプリ</div>`,
  /* 3: アンギエのいたずら（サングラスを取られる）→ ファーの一喝 */
  ()=>{ const s=k=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(OP3_SVG[k]||'');
   return `<div class="op-burst"></div><div class="op-flash"></div>
    <img class="op3-peek" src="${s('angie_joy')}" alt="">
    ${opBooWrap().replace('<img class="op-b2"',`<img class="op3-bk" src="${s('boo_bikkuri')}" alt=""><img class="op-b2"`)}
    <div class="op-say op-s1">最強伝説が始まるぜ！</div>
    <div class="op3-wild"><img src="${s('angie_wild')}" alt=""><span class="op-name">アンギエ</span></div>
    <div class="op-pow op3-hyoi">ヒョイッ</div>
    ${opJag('アンギエの<br>方が似合うぜ','op3-jag1','b')}
    <div class="op-say op3-s2">主役はオレなのに…</div>
    <div class="op3-sad"><img src="${s('angie_sad')}" alt=""><span class="op-name">アンギエ</span></div>
    <div class="op3-fa"><img src="${s('fa_ang')}" alt=""><span class="op-name">ファー</span></div>
    ${opJag('💢 いたずらアンギエ、<br>お兄さんをイジメると<br>ご飯抜きだよ！','op3-jag2','l')}
    ${OP_LOGO}<div class="op3-catch">ライフサポート万能アプリ</div>`; }
];
function playOpening(n){
  $('.op-bg')?.remove();
  if(n==null){ do{ n=Math.floor(Math.random()*OP_PATTERNS.length); }while(OP_PATTERNS.length>1&&n===opLast); }
  opLast=n;
  const bg=document.createElement('div'); bg.className='op-bg op-p'+(n+1); bg.setAttribute('role','dialog'); bg.setAttribute('aria-label','オープニング');
  bg.innerHTML=OP_PATTERNS[n]()+`<button class="op-close" aria-label="閉じる">タップで閉じる ✕</button>`;
  const close=()=>{ bg.classList.add('op-out'); setTimeout(()=>bg.remove(),250); };
  bg.addEventListener('click',close);
  document.body.appendChild(bg);
}
