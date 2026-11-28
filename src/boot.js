
/* はじめ */
load();
if(!IN_FRAME){ const r=decodeURI(location.hash.slice(1)); if(r&&r!=='home') stack=['home',r]; try{history.replaceState(null,'','#'+cur());}catch(e){} }
render();
if('serviceWorker' in navigator && !IN_FRAME && location.protocol==='https:'){ const had=!!navigator.serviceWorker.controller; let rl=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(had&&!rl){ rl=true; location.reload(); } });
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{}); }

/* 立ち上がりの画面を、そっと消す */
(function(){ const sp=document.getElementById('splash'); if(!sp) return; setTimeout(()=>{ sp.style.opacity='0'; setTimeout(()=>sp.remove(),400); },700); })();
