
/* ---------- オープニング（BOOTINの文字を押したときだけ） ---------- */
function playOpening(){
  $('.op-bg')?.remove();
  const bg=document.createElement('div'); bg.className='op-bg'; bg.setAttribute('role','dialog'); bg.setAttribute('aria-label','オープニング');
  bg.innerHTML=`<div class="op-stage">
    <div class="op-burst"></div>
    <div class="op-boo"><img class="op-b1" src="${OP_BOO}" alt="ぶーちん"><img class="op-b2" src="${OP_SAD}" alt="">
      <svg class="op-shades" viewBox="0 0 100 30" aria-hidden="true"><path d="M2 4 H46 Q47 26 25 26 Q4 26 2 4 Z M54 4 H98 Q96 26 75 26 Q53 26 54 4 Z" fill="#111"/><path d="M44 7 Q50 2 56 7" fill="none" stroke="#111" stroke-width="4"/><path d="M10 9 H22 M62 9 H74" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/></svg>
      <span class="op-pow">ポカッ</span><span class="op-sweat">💧</span></div>
    <img class="op-en" src="${OP_EN}" alt="エンちん">
    <div class="op-say op-s1">なんでも任せな！</div>
    <div class="op-say op-s2">何調子に乗ってるの！</div>
    <div class="op-say op-s3">…しょぼん</div>
    <div class="op-logo">BOOTIN</div>
  </div><button class="op-close" aria-label="閉じる">タップで閉じる ✕</button>`;
  const close=()=>{ bg.classList.add('op-out'); setTimeout(()=>bg.remove(),250); };
  bg.addEventListener('click',close);
  document.body.appendChild(bg);
}
