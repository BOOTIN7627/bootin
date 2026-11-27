
/* はじめ */
load();
if(!IN_FRAME){ const r=decodeURI(location.hash.slice(1)); if(r&&r!=='home') stack=['home',r]; try{history.replaceState(null,'','#'+cur());}catch(e){} }
render();
if('serviceWorker' in navigator && !IN_FRAME && location.protocol==='https:'){ const had=!!navigator.serviceWorker.controller; let rl=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(had&&!rl){ rl=true; location.reload(); } });
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{}); }
