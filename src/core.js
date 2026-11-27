'use strict';
/* ===== BOOTIN 試作版 第1弾 : 土台 ===== */
const VERSION='0.1.0';
const RED_EMOJI={'私と家族':'👪','健康':'💊','生活管理':'📅','交友・アドレス':'👥','店・利用施設':'🏪','おたのしみ':'🎈','NEWS・知識':'📰','ビジネス':'💼','設定・機能':'⚙️'};
const BLUE_EMOJI={'カレンダー':'📅','人物帳':'📇','施設帳':'🏢','お店の帳':'🍽️','施設の住所録':'🏢','その他の機能':'🧰','トップ画面の設定':'🔧','マイルームの設定':'🏠','健康管理':'💊','家計管理':'💴','交流の輪':'⭕','ゲーム':'🎲','旅行':'🧳','NEWS':'📰','ぶーちん劇場':'🐷','趣味':'🎨','推しの帳':'📣','日記・ブログ':'📔','写真管理':'🖼️','マイプロフィール':'🙂','家族のプロフィール':'👪','住まい管理':'🏠','日常管理':'🧺'};

/* 作ってある機能（パワポの枠の名前でつなぐ） */
const IMPL={
  '生活管理/カレンダー':'cal','生活管理/カレンダー/カレンダー':'cal','生活管理/カレンダー/暦と色':'cal',
  '交友・アドレス/人物帳':'people','交友・アドレス/人物帳/登録すること':'people','交友・アドレス/人物帳/分け方':'people','交友・アドレス/人物帳/人のカード':'people',
  '店・利用施設/施設帳':'places','店・利用施設/施設帳/すべての場所の元':'places','店・利用施設/施設帳/分類は2段':'places','店・利用施設/施設帳/施設のカード':'places',
  '店・利用施設/お店の帳':'shops','店・利用施設/お店の帳/お店の帳':'shops',
  '店・利用施設/施設の住所録':'places','店・利用施設/施設の住所録/施設の住所録':'places',
  '設定・機能/その他の機能/さっとメモ（メモの一元管理）':'memo','設定・機能/その他の機能/便利道具':'tools','設定・機能/その他の機能/聞く・探す':'search',
  '健康/健康管理':'meds','健康/健康管理/健康管理':'meds',
  '設定・機能/トップ画面の設定':'settings','設定・機能/トップ画面の設定/出すものと見た目':'settings',
  '設定・機能/マイルームの設定/データと見やすさ':'data',
  'NEWS・知識/NEWS/天気の詳細':'weather','生活管理/天気・防災/天気':'weather','生活管理/天気・防災/防災情報':'bosai',
  'おたのしみ/ぶーちん劇場/劇場':'otayori'
};
/* 外せない土台 */
const LOCKED=new Set(['設定・機能','設定・機能/トップ画面の設定','設定・機能/トップ画面の設定/出すものと見た目','設定・機能/マイルームの設定','設定・機能/マイルームの設定/データと見やすさ','設定・機能/その他の機能','設定・機能/その他の機能/聞く・探す','設定・機能/その他の機能/さっとメモ（メモの一元管理）','おたのしみ','おたのしみ/ぶーちん劇場','おたのしみ/ぶーちん劇場/劇場']);

/* 運営からのお知らせ（ぶーちんからのお便り） */
const OTAYORI=[
  {d:'2026-11-26',t:'試作版へようこそ！',b:'ぶーちんだよ。これはBOOTINの試作版の第1弾。いま使えるのは、カレンダーと1日のカード、人物帳、施設帳、さっとメモ、便利道具、天気、設定だよ。\nほかのボタンも押せるけど【準備中】と出るよ。順番に作っていくから、待っててね。\n入れたデータはこのスマホの中だけに保存されるよ。ときどき「設定 → データ」で書き出しておくと安心だよ。'}
];

/* ---- 枠の木 ---- */
const NODES={}; const ROOTS=[];
(function build(){
  for(const r of TREE){
    const rid=r.name; NODES[rid]={id:rid,name:r.name,lv:'r',kids:[],parent:null};
    ROOTS.push(rid);
    for(const b of r.blue){
      const bid=rid+'/'+b.name; NODES[bid]={id:bid,name:b.name,lv:'b',kids:[],parent:rid};
      NODES[rid].kids.push(bid);
      for(const y of b.yel){
        let yid=bid+'/'+y.name; if(NODES[yid]) yid+='（2）';
        NODES[yid]={id:yid,name:y.name,lv:'y',kids:[],parent:bid,items:y.items};
        NODES[bid].kids.push(yid);
      }
    }
  }
})();
function redOf(id){let n=NODES[id];while(n&&n.parent)n=NODES[n.parent];return n?n.name:'';}
function emojiOf(id){const n=NODES[id];if(!n)return '❔';return (n.lv!=='r'&&BLUE_EMOJI[n.name])||RED_EMOJI[redOf(id)]||'📁';}
function implOf(id){return IMPL[id]||null;}
function hasImpl(id){ if(IMPL[id])return true; const n=NODES[id]; return !!(n&&n.kids.some(hasImpl)); }
function isOff(id){ let n=NODES[id]; while(n){ if(S.set.off[n.id]&&!LOCKED.has(n.id))return true; n=NODES[n.parent]; } return false; }

/* ---- 保存 ---- */
const KEY='bootin.v1';
const EVCATS=[{id:'work',name:'仕事',color:'#2D6CDF'},{id:'home',name:'家庭',color:'#E07A1F'},{id:'health',name:'健康',color:'#2E8B57'},{id:'local',name:'地域',color:'#8E5BC4'},{id:'kids',name:'子育て',color:'#D6457A'},{id:'hobby',name:'趣味',color:'#13979A'},{id:'other',name:'その他',color:'#7A7363'}];
const COLORS10=['#E0452B','#F08A00','#D9B300','#2E9B4F','#13979A','#2D6CDF','#5B4FD6','#B94FC8','#D6457A','#7A7363'];
const PLACE_BIG=['食事','買い物','医療','介護','運動','遊び・趣味','公共','寺社','業者','美容','車・交通','学び・子ども','その他'];
/* 大きなジャンル → 小見出し → 細かいジャンル（自分で足したものは S.set.genres に入る） */
const PLACE_GENRE={
 '食事':{'和食':['和食','寿司','そば・うどん','天ぷら','とんかつ','うなぎ','鍋・しゃぶしゃぶ','定食・食堂','丼もの','おでん'],
   '洋食・中華・各国':['洋食','イタリアン','フレンチ','ハンバーグ・ステーキ','カレー','中華','韓国料理','エスニック'],
   '麺・肉・粉もの':['ラーメン','焼肉','焼き鳥','ホルモン','お好み焼き・もんじゃ','餃子'],
   'お酒の店':['居酒屋','飲み屋','バー','スナック','立ち飲み','ビアガーデン'],
   '喫茶・軽食':['カフェ・喫茶店','パン屋','ケーキ・洋菓子','和菓子・甘味','ファミレス','ファストフード'],
   '持ち帰り':['弁当','惣菜','宅配・出前']},
 '買い物':{'毎日の買い物':['スーパー','コンビニ','ドラッグストア','100円ショップ','八百屋','魚屋','肉屋','酒屋','米屋','豆腐屋','業務スーパー'],
   '大きなお店':['ホームセンター','百貨店','ショッピングモール','家電量販店','ディスカウントストア'],
   '専門店':['服','靴','メガネ','本屋','文房具','花屋','家具','手芸','釣り具','スポーツ用品','おもちゃ','ペット用品','リサイクル','携帯ショップ']},
 '医療':{'診療科':['内科','小児科','歯科','眼科','耳鼻科','皮膚科','整形外科','外科','婦人科','泌尿器科','心療内科・精神科','脳神経外科'],
   '病院・薬・からだ':['総合病院','クリニック','薬局','健診センター','接骨院・整骨院','鍼灸','マッサージ','動物病院']},
 '介護':{'':['デイサービス','デイケア','ショートステイ','訪問介護','訪問看護','ケアマネ事業所','地域包括支援センター','老人ホーム','グループホーム','福祉用具']},
 '運動':{'':['ジム','プール','体育館','ヨガ','ゴルフ練習場','ゴルフ場','テニス','ボウリング','公園','グラウンド','ダンス','道場']},
 '遊び・趣味':{'':['カラオケ','映画館','温泉・銭湯','旅館・ホテル','パチンコ','ゲームセンター','釣り場','キャンプ場','美術館・博物館','動物園・水族館','遊園地','カルチャー教室']},
 '公共':{'役所・手続き':['市役所・区役所','支所','税務署','年金事務所','ハローワーク','法務局','保健所','公民館'],
   'お金・郵便':['郵便局','銀行','信用金庫・農協','ATM'],
   '安全・交通':['警察署・交番','消防署','駅','バス停'],
   '本・文化':['図書館','文化会館']},
 '寺社':{'':['寺','神社','教会','霊園・墓地','斎場']},
 '業者':{'家の工事・修理':['電気工事','水道・ガス','リフォーム','大工・工務店','植木・庭','鍵','害虫駆除'],
   '家事・片付け':['ハウスクリーニング','引っ越し','クリーニング','不用品回収','便利屋'],
   '相談・手続き':['司法書士・行政書士','税理士','保険','不動産']},
 '美容':{'':['美容室','理容室','ネイル','エステ','まつげ','脱毛','化粧品']},
 '車・交通':{'':['ガソリンスタンド','車屋・整備','車検','洗車','駐車場','レンタカー','タクシー','バイク屋','自転車屋']},
 '学び・子ども':{'':['保育園・幼稚園','学校','学童','児童館','塾','習い事']},
 'その他':{}};
function genresOf(b){ const d=PLACE_GENRE[b]||{}; const all=Object.values(d).flat(); const OLD=['カフェ','本','病院','ゴルフ','市役所','霊園','清掃','水道・電気']; const add=((S.set.genres||{})[b]||[]).filter(g=>!all.includes(g)&&!OLD.includes(g)); const o={...d}; if(add.length) o['自分で足したもの']=add; return o; }
function fresh(){
  return {v:1,
    set:{mode:'normal',font:1,kise:'bee',theme:'',grid:ROOTS.slice(0,9),gline:'r',off:{},cn:true,
      home:{addr:'',tel:'',telName:''},area:{pref:'',city:''},me:{name:'',kana:'',bday:'',blood:'',addr:'',tel:'',allergy:'',sick:'',med:'',contact:'',contactTel:'',note:''},
      wx:{name:'静岡',lat:34.98,lon:138.38},evcats:EVCATS.map(c=>({...c})),
      pcats:[{id:'c1',name:'家族',color:0},{id:'c2',name:'親せき',color:1},{id:'c3',name:'友人',color:3},{id:'c4',name:'仕事',color:5},{id:'c5',name:'ご近所',color:7},{id:'other',name:'その他',color:9}],
      minStep:15,hFrom:6,hTo:22,topCal:'from',meal:{b:'07:00',l:'12:00',d:'18:00',s:'22:00'},genres:{},started:new Date().toISOString().slice(0,10)},
    people:[],places:[],events:[],memos:[],meds:[],medlog:{},daymemo:{},cache:{}};
}
let S;
function load(){
  let j=null; try{ j=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){}
  S=j&&j.v?j:fresh();
  const f=fresh(); for(const k in f) if(S[k]===undefined) S[k]=f[k];
  for(const k in f.set) if(S.set[k]===undefined) S.set[k]=f.set[k];
}
let saveWarned=false;
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){ if(!saveWarned){saveWarned=true;toast('保存できませんでした。写真が多いと入りきらないことがあります');} } }
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

/* ---- 小道具 ---- */
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseD=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return ymd(d);};
const today=()=>ymd(new Date());
const WD='日月火水木金土';
function jpDate(s,withWd=true){const d=parseD(s);return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`+(withWd?`（${WD[d.getDay()]}）`:'');}
function toast(msg){const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
const mapUrl=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
const naviUrl=q=>'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(q);
function mapBtns(q){ if(!q) return ''; return `<a class="mini map" href="${mapUrl(q)}" target="_blank" rel="noopener">🗺️ MAP</a><a class="mini navi" href="${naviUrl(q)}" target="_blank" rel="noopener">🧭 NAVI</a>`; }
const telHref=n=>'tel:'+String(n).replace(/[^\d+]/g,'');

/* ---- 暦 ---- */
const DAY0=Date.UTC(1970,0,1);
const dnum=s=>{const [y,m,d]=s.split('-').map(Number);return Math.round((Date.UTC(y,m-1,d)-DAY0)/864e5);};
function lunar(s){
  const n=dnum(s); const M=KOYOMI.m;
  if(n<M[0][0]||n>=M[M.length-1][0]+30) return null;
  let lo=0,hi=M.length-1; while(lo<hi){const mid=(lo+hi+1)>>1; if(M[mid][0]<=n) lo=mid; else hi=mid-1;}
  return {m:M[lo][1],d:n-M[lo][0]+1,leap:!!M[lo][2]};
}
const ROKUYO=['大安','赤口','先勝','友引','先負','仏滅'];
function rokuyo(s){const l=lunar(s);return l?ROKUYO[(l.m+l.d)%6]:'';}
const SEKKI={}; for(const [n,name] of KOYOMI.t) SEKKI[n]=name;
function sekki(s){return SEKKI[dnum(s)]||'';}
function wareki(s){const d=parseD(s);const y=d.getFullYear();
  if(s>='2019-05-01'){const n=y-2018;return '令和'+(n===1?'元':n)+'年';}
  if(s>='1989-01-08'){const n=y-1988;return '平成'+(n===1?'元':n)+'年';}
  if(s>='1926-12-25'){const n=y-1925;return '昭和'+(n===1?'元':n)+'年';}
  return '';}
const HOLCACHE={};
function nthMon(y,m,n){const d=new Date(y,m-1,1);const off=(8-d.getDay())%7;return ymd(new Date(y,m-1,1+off+(n-1)*7));}
function holidaysJP(y){
  if(HOLCACHE[y]) return HOLCACHE[y];
  const H={}; const add=(m,d,n)=>{H[y+'-'+pad(m)+'-'+pad(d)]=n;};
  add(1,1,'元日'); H[nthMon(y,1,2)]='成人の日'; add(2,11,'建国記念の日'); if(y>=2020) add(2,23,'天皇誕生日');
  const sh=Math.floor(20.8431+0.242194*(y-1980)-Math.floor((y-1980)/4)); add(3,sh,'春分の日');
  add(4,29,'昭和の日'); add(5,3,'憲法記念日'); add(5,4,'みどりの日'); add(5,5,'こどもの日');
  H[nthMon(y,7,3)]='海の日'; add(8,11,'山の日'); H[nthMon(y,9,3)]='敬老の日';
  const sb=Math.floor(23.2488+0.242194*(y-1980)-Math.floor((y-1980)/4)); add(9,sb,'秋分の日');
  H[nthMon(y,10,2)]='スポーツの日'; add(11,3,'文化の日'); add(11,23,'勤労感謝の日');
  // 国民の休日（はさまれた平日）
  for(const k of Object.keys(H)){const n2=addDays(k,2);if(H[n2]){const mid=addDays(k,1);if(!H[mid]&&parseD(mid).getDay()!==0)H[mid]='国民の休日';}}
  // 振替休日
  for(const k of Object.keys(H).sort()){ if(parseD(k).getDay()===0){ let n=addDays(k,1); while(H[n]) n=addDays(n,1); H[n]='振替休日'; } }
  return HOLCACHE[y]=H;
}
const HOL_EXPLAIN={'元日':'年のはじめを祝う日。','成人の日':'大人になった人を祝い、はげます日。1月の第2月曜日。','建国記念の日':'国ができたことをしのび、国を愛する心を養う日。','天皇誕生日':'今の天皇の誕生日を祝う日。','春分の日':'自然をたたえ、生き物をいつくしむ日。昼と夜の長さがほぼ同じになる。','昭和の日':'昭和の時代をふり返り、国の将来を考える日。もとは昭和天皇の誕生日。','憲法記念日':'日本国憲法が始まった日（1947年）。','みどりの日':'自然に親しみ、その恵みに感謝する日。','こどもの日':'子どもの幸せをはかり、母に感謝する日。端午の節句。','海の日':'海の恵みに感謝し、海の国日本の繁栄を願う日。7月の第3月曜日。','山の日':'山に親しみ、山の恵みに感謝する日。','敬老の日':'お年寄りを敬い、長寿を祝う日。9月の第3月曜日。','秋分の日':'祖先を敬い、亡くなった人をしのぶ日。お彼岸の中日。','スポーツの日':'スポーツに親しみ、健康な心と体を養う日。10月の第2月曜日。','文化の日':'自由と平和を愛し、文化をすすめる日。','勤労感謝の日':'働くことを大切にし、生産を祝い、たがいに感謝する日。','振替休日':'祝日が日曜日と重なったときの代わりの休み。','国民の休日':'祝日と祝日にはさまれた平日がお休みになる日。'};
const CN_EXPLAIN={'元旦':'中国の新暦のお正月。','春節':'中国の旧正月。一番大きなお祝いで、家族が集まり、長い休みになる。','元宵節':'旧暦1月15日。灯籠を飾り、白玉だんご（湯圓）を食べる。','清明節':'お墓参りをして先祖をしのぶ日。休日になる。','労働節':'メーデー。5月1日から数日の連休になる。','端午節':'旧暦5月5日。ちまきを食べ、ドラゴンボートレースをする。休日。','七夕':'旧暦7月7日。中国の七夕（情人節とも）。','中秋節':'旧暦8月15日。月餅を食べ、家族で月を見る。休日。','重陽節':'旧暦9月9日。お年寄りを敬う日。','国慶節':'中華人民共和国ができた日。10月1日から約1週間の連休。'};
const CNCACHE={};
function festCN(y){
  if(CNCACHE[y]) return CNCACHE[y];
  const F={}; F[y+'-01-01']='元旦'; F[y+'-05-01']='労働節'; F[y+'-10-01']='国慶節';
  const L={'1-1':'春節','1-15':'元宵節','5-5':'端午節','7-7':'七夕','8-15':'中秋節','9-9':'重陽節'};
  let s=y+'-01-01'; while(s<=y+'-12-31'){ const l=lunar(s); if(l&&!l.leap&&L[l.m+'-'+l.d]) F[s]=L[l.m+'-'+l.d]; if(sekki(s)==='清明')F[s]='清明節'; s=addDays(s,1); }
  return CNCACHE[y]=F;
}
function holJP(s){return holidaysJP(+s.slice(0,4))[s]||'';}
function holCN(s){return S.set.cn?(festCN(+s.slice(0,4))[s]||''):'';}
function dayClass(s){ if(holJP(s)) return 'c-hol'; const w=parseD(s).getDay(); return w===0?'c-sun':w===6?'c-sat':''; }
function seiza(md){ // 'MM-DD'
  const [m,d]=md.split('-').map(Number); const v=m*100+d;
  const Z=[[120,'やぎ座'],[219,'みずがめ座'],[321,'うお座'],[420,'おひつじ座'],[521,'おうし座'],[622,'ふたご座'],[723,'かに座'],[823,'しし座'],[923,'おとめ座'],[1024,'てんびん座'],[1123,'さそり座'],[1222,'いて座'],[1232,'やぎ座']];
  for(const [lim,n] of Z) if(v<lim) return n; return '';}
function age(bday,on){ if(!bday||bday.startsWith('0000')) return null; const [y,m,d]=bday.split('-').map(Number); const t=parseD(on); let a=t.getFullYear()-y; if(t.getMonth()+1<m||(t.getMonth()+1===m&&t.getDate()<d)) a--; return a; }

/* ---- 予定 ---- */
function evCat(id){return S.set.evcats.find(c=>c.id===id)||S.set.evcats[S.set.evcats.length-1];}
function occurs(e,s){
  if(s<e.date) return false;
  const r=e.rep||'';
  if(!r) return s<=(e.end||e.date);
  if(e.until&&s>e.until) return false;
  if(r==='w') return parseD(s).getDay()===parseD(e.date).getDay();
  if(r==='m') return s.slice(8)===e.date.slice(8);
  if(r==='y') return s.slice(5)===e.date.slice(5);
  return false;
}
function itemsOn(s,catFilter){
  const out=[];
  for(const e of S.events){ if(occurs(e,s)&&(!catFilter||e.cat===catFilter)) out.push({k:'ev',e,allday:!e.time,unk:!e.time&&e.tmode==='unknown',time:e.time||'',color:evCat(e.cat).color}); }
  if(!catFilter||catFilter==='home'){
    for(const p of S.people){ if(p.bday&&p.bday.slice(5)===s.slice(5)){ const a=age(p.bday,s); out.push({k:'bd',p,allday:true,time:'',color:'#D6457A',age:a}); } }
  }
  out.sort((a,b)=>(a.allday===b.allday?0:a.allday?-1:1)||(!!a.unk-!!b.unk)||a.time.localeCompare(b.time));
  return out;
}
const REP_LABEL={'':'','w':'毎週','m':'毎月','y':'毎年'};
function placeOf(e){ if(e.placeId){const p=S.places.find(x=>x.id===e.placeId); if(p) return {name:p.name,q:p.addr||p.name,id:p.id};} return e.place?{name:e.place,q:e.place}:null; }

/* ---- 顔 ---- */
const SIL=`<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="var(--soft)"/><circle cx="32" cy="25" r="12" fill="var(--line)"/><path d="M10 60c2-13 11-20 22-20s20 7 22 20z" fill="var(--line)"/></svg>`;
function face(p,size){ return `<span class="face" style="width:${size}px;height:${size}px">${p&&p.photo?`<img src="${p.photo}" alt="">`:SIL}</span>`; }
function pcat(id){return S.set.pcats.find(c=>c.id===id);}

/* ---- 写真を小さくして取り込む ---- */
function readPhoto(file,max=360){
  return new Promise((res,rej)=>{
    const fr=new FileReader(); fr.onerror=rej;
    fr.onload=()=>{ const img=new Image(); img.onerror=rej; img.onload=()=>{ const r=Math.min(1,max/Math.max(img.width,img.height)); const c=document.createElement('canvas'); c.width=Math.round(img.width*r); c.height=Math.round(img.height*r); c.getContext('2d').drawImage(img,0,0,c.width,c.height); res(c.toDataURL('image/jpeg',.8)); }; img.src=fr.result; };
    fr.readAsDataURL(file);
  });
}

/* ---- 地域（都道府県・市町村）と距離 ---- */
const PREFS=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
function prefOf(a){ a=String(a||''); for(const p of PREFS){ if(a.startsWith(p)) return p; } for(const p of PREFS){ const s=p.replace(/[都府県]$/,''); if(p!=='北海道'&&a.startsWith(s)) return p; } return ''; }
function cityOf(a){ a=String(a||''); const p=prefOf(a); if(p) a=a.slice(a.startsWith(p)?p.length:p.replace(/[都府県]$/,'').length); const m=a.match(/^(.+?郡.+?[町村]|.+?市|.+?区|.+?[町村])/); return m?m[1]:''; }
function homeArea(){ const ar=S.set.area||{}; if(ar.pref) return ar; const a=S.set.home&&S.set.home.addr; return {pref:prefOf(a),city:cityOf(a)}; }
function kmBetween(a,b,c,d){ const R=6371,r=x=>x*Math.PI/180; const x=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
async function geocode(addr){ try{ const r=await fetch('https://msearch.gsi.go.jp/address-search/AddressSearch?q='+encodeURIComponent(addr)); const j=await r.json(); if(j&&j[0]){ const [lon,lat]=j[0].geometry.coordinates; return {lat:+lat,lon:+lon}; } }catch(e){} return null; }
