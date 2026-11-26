
/* ---------- オープニング（BOOTINの文字を押したときだけ） ----------
   今は1パターン。今後パターンを増やして OP_PATTERNS からランダムに選ぶ */
function playOpening(){
  $('.op-bg')?.remove();
  const bg=document.createElement('div'); bg.className='op-bg'; bg.setAttribute('role','dialog'); bg.setAttribute('aria-label','オープニング');
  const arms=`<svg class="op-arms" viewBox="0 0 218 210" aria-hidden="true"><g stroke="#6B4A3A" stroke-width="5" stroke-linecap="round" fill="#FAD4D8">
    <path d="M58 138 Q110 128 150 158 Q156 170 144 172 Q104 150 62 158 Q48 150 58 138 Z"/>
    <path d="M160 138 Q108 128 68 158 Q62 170 74 172 Q114 150 156 158 Q170 150 160 138 Z"/></g></svg>`;
  const shades=`<svg class="op-shades" viewBox="0 0 100 30" aria-hidden="true"><path d="M2 4 H46 Q47 26 25 26 Q4 26 2 4 Z M54 4 H98 Q96 26 75 26 Q53 26 54 4 Z" fill="#111"/><path d="M44 7 Q50 2 56 7" fill="none" stroke="#111" stroke-width="4"/><path d="M10 9 H22 M62 9 H74" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/></svg>`;
  bg.innerHTML=`<div class="op-burst"></div><div class="op-flash"></div>
    <div class="op-ton"><span class="op-say op-sTon">だから言ったの</span><img src="${OP_TON}" alt=""><span class="op-name">トンじい</span></div>
    <div class="op-booWrap"><div class="op-boo"><img class="op-b1" src="${OP_BOO}" alt="ぶーちん">${arms}<img class="op-b2" src="${OP_SAD}" alt="">${shades}<span class="op-sweat">💧</span></div>
      <span class="op-name op-nBoo">ぶーちん</span></div>
    <div class="op-say op-s1">何でもオレに任せな！</div>
    <div class="op-en"><div class="op-jag"><div class="op-jagIn"></div><span>何調子に乗ってんの！</span></div><img src="${OP_EN}" alt=""><span class="op-name">エンちん</span></div>
    <div class="op-pow">バシッ</div>
    <div class="op-logo" aria-label="BOOTIN"><span>BOOTIN</span></div>
    <button class="op-close" aria-label="閉じる">タップで閉じる ✕</button>`;
  const close=()=>{ bg.classList.add('op-out'); setTimeout(()=>bg.remove(),250); };
  bg.addEventListener('click',close);
  document.body.appendChild(bg);
}
