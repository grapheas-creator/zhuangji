


/* ══════════════════════════════════════════════════════════════
   game.js 目录 — 自动生成，按行号或章节名搜索即可跳转
   ══════════════════════════════════════════════════════════════
   L31     基础
   L122    数据
   L586    真实型号覆盖：清掉程序生成的机箱/散热，换成市面真实型号
   L587    精简商品表：机箱 / 散热只保留有代表性的型号（用户要求）
   L1208   topcpu.net 跑分校准（2026-10-27）
   L1388   淘宝实价校准（2026-10-28 抓取，样本≥5 且偏差<80% 才采用）
   L2151   软件库
   L2198   第一章剧情
   L2492   剧情插曲：第三天打烊后，技嘉推销员上门
   L3024   任务
   L3536   状态
   L3801   淘宝来信
   L3933   存档系统
   L4077   筛选
   L4197   机箱示意图
   L4198   3D 机箱（Three.js）
   L4251   ITX 套图（2026-11-04 生成）：mini-ITX 主板俯视 + ITX 机箱正面
   L4255   2026-11-04 四套 ITX 主板实拍（900×900，构图已统一）
   L4262   2026-11-04 ITX 新增：B560 / Z790 / Z890(1851)
   L4466   渲染
   L4844   新手清单：跟着操作自动打勾，做完自动收起
   L4867   傻瓜式引导：按装机顺序一步步带，聚光灯打在下一步该点的地方
   L7489   交付演出
   L8249   设置页：音乐 / 音效 / 语音 音量
   L8742   电脑端引导 v3（状态机，整块重写）
   ══════════════════════════════════════════════════════════════ */

/* ================= 基础 ================= */
const APP_VER='v0.12.0';
/* 小更新只 +1 这个构建号（5 位，自动补零）；大改才动 APP_VER 并把它归零为 00001 */
const APP_BUILD='01286';
window.__BOOT_OK=1;
const APP_FULL=APP_VER+'.'+APP_BUILD;
/* 水印上统一的写法：v0.12.0 · 01182 */
const APP_VER_TXT=APP_VER+' · 内容 '+APP_BUILD;   /* 不再显示在角落，仅供更新通知/设置页使用 */
/* 只要主脚本执行到这里，就在版本号后面加 · JS（用于排查脚本是否真的跑了） */
try{(function(){var _v=document.getElementById('tVer');if(_v){_v.textContent=APP_VER_TXT;_v.style.display='none';}
var _t=document.getElementById('verTag');if(_t){_t.textContent=APP_VER_TXT;_t.style.display='none';}})();}catch(e){}
/* 任何上层弹窗出现时，把下层锁住：不能滚、不能点 */
const MODAL_SEL='.mask.on,.ho-overlay,.story-pop,.dayopen,.titleScr:not(.hide)';
function syncModalLock(){
  try{
    const on=!!document.querySelector(MODAL_SEL);
    document.body.classList.toggle('modal-open',on);
    /* 弹窗（剧情 / 说明 / 购买确认）关掉之后，把引导重新拉起来：
       以前关掉弹窗没人叫醒教练，玩家会以为引导没了、卡在原地。 */
    if(!on&&!_syncModalLock._t){
      _syncModalLock._t=setTimeout(()=>{_syncModalLock._t=0;try{coachRefresh();}catch(e){}},140);
    }
  }catch(e){}
}
/* 夸克 / UC / 百度这类浏览器会注入自己的脚本和阅读模式，
   重特效（backdrop-filter、大面积渐变、动画）在它们里面容易闪或掉帧。
   QQ 不再算低特效：玩家要保留动画与毛玻璃，X5 的两个渲染坑单独用 x5 兜底。 */
function watchModals(){
  try{
    const ua=navigator.userAgent||'';
    if(/MicroMessenger/i.test(ua))document.documentElement.classList.add('wx');
    if(/Quark|UCBrowser|baiduboxapp/i.test(ua)){
      document.documentElement.classList.add('lowfx');
      document.body.classList.add('lowfx');
    }
    /* QQ（X5）：内联 SVG 会被渲染成白板、渐变文字会发暗，
       单独打个 x5 标记，标题页改走纯 CSS 机箱（见 .x5 那段样式）。 */
    if(/MQQBrowser|QQBrowser/i.test(ua)){
      document.documentElement.classList.add('x5');
      document.body.classList.add('x5');
    }
  }catch(e){}
  try{
    new MutationObserver(syncModalLock).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  }catch(e){}
  syncModalLock();
}
function showFatal(msg){
  try{
    /* 先把噪音过滤掉，再决定要不要建这个条：
       之前是先建 DOM 再 return，空消息会留下一条没有字色的红条 */
    if(!msg)return;
    if(/^Script error/i.test(msg))return;
    if(/unconfigurable property|Attempting to change the setter/i.test(msg))return;
    if(/ResizeObserver loop/i.test(msg))return;
    /* 3D 初始化失败已经回退 SVG，不需要打扰玩家 */
    if(/Case3D|WebGL|GLTF|THREE\./i.test(msg))return;
    const now=Date.now();
    if(now-(showFatal._last||0)<6000&&showFatal._same===msg)return;
    showFatal._last=now;showFatal._same=msg;
    let el=document.getElementById('fatalBar');
    if(!el){
      el=document.createElement('div');el.id='fatalBar';
      el.style.cssText='position:fixed;left:8px;right:8px;top:6px;z-index:9999;padding:8px 12px;'+
        'background:rgba(90,29,29,.96);color:#ffe3e0;font:12px/1.5 -apple-system,sans-serif;'+
        'border:1px solid #a15454;border-radius:10px;white-space:pre-wrap;box-shadow:0 10px 24px rgba(0,0,0,.5)';
      el.onclick=()=>{try{el.remove();}catch(e){}};
      document.body.appendChild(el);
    }
    el.textContent='脚本出错：'+msg+'（点一下可关闭，截这张图发给我）';
    clearTimeout(el._t);
    el._t=setTimeout(()=>{try{el.remove();}catch(e){}},10000);
  }catch(e){}
}
try{
  window.addEventListener('error',ev=>showFatal((ev&&ev.message)||'未知错误'));
  window.addEventListener('unhandledrejection',ev=>showFatal('异步错误 '+(ev&&ev.reason&&ev.reason.message||ev&&ev.reason||'')));
}catch(e){}   /* 每次交付 +1，别的地方不要再写死版本号 */
function rngFrom(s){let a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const R2=(v,s)=>Math.round(v/s)*s;
const money=n=>'¥'+Math.round(n).toLocaleString('zh-CN');
const isNVIDIA=g=>g.n.startsWith('NVIDIA');
const isAMD=g=>g.n.startsWith('AMD');
function jitter(p,seed){if(p==null)return null;
  const r=rngFrom(hash('j'+seed+p))();
  const d=Math.round((r-0.5)*2*Math.max(2,Math.min(18,p*0.05)));
  return Math.max(1,p+d);}
const CAT_ICON={cpu:__IMG0,gpu:__IMG1,mb:__IMG2,ram:__IMG3,psu:__IMG4,case:__IMG5,cooler:__IMG6,disk:__IMG7};
function icon(k){const u=CAT_ICON[k];return u?`<img class="cico" alt="" src="${u}">`:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><use href="#i-${k}"/></svg>`;}

/* ================= 数据 ================= */
const CPU_RAW=[
['Intel Core i3-2100','LGA1155','DDR3',65,1,1450,null,40],
['Intel Core i5-2400','LGA1155','DDR3',95,1,2900,null,65],
['Intel Core i5-2500K','LGA1155','DDR3',95,1,4200,null,70],['Intel Core i5-3450','LGA1155','DDR3',77,1,4300,null,90],
['Intel Core i5-3570K','LGA1155','DDR3',77,1,5100,null,110],
['Intel Core i7-2600K','LGA1155','DDR3',95,1,6100,null,110],['Intel Core i7-3770','LGA1155','DDR3',77,1,6500,null,140],

['Intel Xeon E3-1230 v2','LGA1155','DDR3',69,0,6300,null,110],
['Intel Xeon E3-1270 v2','LGA1155','DDR3',69,0,7200,null,140],
['Intel Core i3-4160','LGA1150','DDR3',54,1,2600,null,70],
['Intel Core i5-4460','LGA1150','DDR3',84,1,4200,null,90],['Intel Core i5-4590','LGA1150','DDR3',84,1,4600,null,100],
['Intel Core i5-4690K','LGA1150','DDR3',88,1,5400,null,130],['Intel Core i7-4770','LGA1150','DDR3',84,1,6900,null,165],

['Intel Core i7-4790K','LGA1150','DDR3',88,1,7900,null,160],
['Intel Xeon E3-1231 v3','LGA1150','DDR3',80,0,6800,null,120],
['Intel Xeon E3-1246 v3','LGA1150','DDR3',84,1,7600,null,160],
['Intel Core i3-6100','LGA1151','DDR4',51,1,3800,null,90],['Intel Core i3-7100','LGA1151','DDR4',51,1,4100,null,110],
['Intel Core i5-6400','LGA1151','DDR4',65,1,5200,null,120],['Intel Core i5-6500','LGA1151','DDR4',65,1,5800,null,140],
['Intel Core i5-6600K','LGA1151','DDR4',91,1,6300,null,170],['Intel Core i5-7500','LGA1151','DDR4',65,1,6400,null,190],
['Intel Core i7-6700','LGA1151','DDR4',65,1,8400,null,220],['Intel Core i7-6700K','LGA1151','DDR4',91,1,9200,null,230],
['Intel Core i7-7700','LGA1151','DDR4',65,1,8900,null,240],['Intel Core i7-7700K','LGA1151','DDR4',91,1,9600,null,260],
['Intel Core i3-8100','LGA1151V2','DDR4',65,1,5900,null,140],['Intel Core i3-9100F','LGA1151V2','DDR4',65,0,6400,null,180],
['Intel Core i5-8400','LGA1151V2','DDR4',65,1,9500,null,280],['Intel Core i5-8500','LGA1151V2','DDR4',65,1,9900,null,300],
['Intel Core i5-8600K','LGA1151V2','DDR4',95,1,10900,null,340],['Intel Core i5-9400F','LGA1151V2','DDR4',65,0,9300,null,300],
['Intel Core i7-8700','LGA1151V2','DDR4',65,1,12100,null,420],['Intel Core i7-8700K','LGA1151V2','DDR4',95,1,12600,null,450],
['Intel Core i7-9700K','LGA1151V2','DDR4',95,1,14200,null,600],['Intel Core i9-9900','LGA1151V2','DDR4',65,1,15300,null,650],
['Intel Core i9-9900K','LGA1151V2','DDR4',95,1,15800,null,700],
['Intel Core i3-10100','LGA1200','DDR4',65,1,7200,null,250],['Intel Core i3-10105F','LGA1200','DDR4',65,0,6900,null,230],
['Intel Core i5-10400','LGA1200','DDR4',65,1,11000,null,380],['Intel Core i5-10400F','LGA1200','DDR4',65,0,10800,null,350],
['Intel Core i5-10500','LGA1200','DDR4',65,1,11500,null,420],['Intel Core i5-11400','LGA1200','DDR4',65,1,13200,null,450],
['Intel Core i5-11400F','LGA1200','DDR4',65,0,13000,null,420],['Intel Core i5-11600K','LGA1200','DDR4',125,1,16300,null,600],
['Intel Core i7-10700','LGA1200','DDR4',65,1,16200,null,650],['Intel Core i7-10700K','LGA1200','DDR4',125,1,17300,null,700],
['Intel Core i7-11700K','LGA1200','DDR4',125,1,19300,null,850],['Intel Core i9-10900K','LGA1200','DDR4',125,1,21300,null,1200],
['Intel Core i9-11900K','LGA1200','DDR4',125,1,20600,null,1300],
['Intel Core i3-12100','LGA1700','DDR4',58,1,10900,430,320],['Intel Core i3-12100F','LGA1700','DDR4',58,0,10600,400,300],
['Intel Core i5-12400','LGA1700','DDR4',65,1,11900,780,580],['Intel Core i5-12400F','LGA1700','DDR4',65,0,11700,700,520],
['Intel Core i5-12490F','LGA1700','DDR4',65,0,12400,1280,900],['Intel Core i5-12600K','LGA1700','DDR4',125,1,17800,1100,850],
['Intel Core i5-13400','LGA1700','DDR4',65,1,18200,1000,780],['Intel Core i5-13400F','LGA1700','DDR4',65,0,17900,900,700],
['Intel Core i5-13600K','LGA1700','DDR5',181,1,24000,1550,1200],['Intel Core i5-13600KF','LGA1700','DDR5',181,0,23800,1400,1100],
['Intel Core i5-14600K','LGA1700','DDR5',181,1,25200,1800,1400],['Intel Core i5-14600KF','LGA1700','DDR5',181,0,24900,1600,1250],
['Intel Core i7-12700K','LGA1700','DDR5',190,1,22400,2400,1500],['Intel Core i7-12700KF','LGA1700','DDR5',190,0,22100,2730,1450],
['Intel Core i7-13700K','LGA1700','DDR5',253,1,30300,2000,1950],['Intel Core i7-14700K','LGA1700','DDR5',253,1,34500,2400,1900],
['Intel Core i9-13900K','LGA1700','DDR5',253,1,38800,2800,2300],['Intel Core i9-14900K','LGA1700','DDR5',253,1,41000,3300,2700],
['Intel Core Ultra 5 245K','LGA1851','DDR5',159,0,26200,1200,950],['Intel Core Ultra 5 245KF','LGA1851','DDR5',159,0,25900,1150,900],
['Intel Core Ultra 7 265K','LGA1851','DDR5',250,1,36300,2500,2000],['Intel Core Ultra 7 265KF','LGA1851','DDR5',250,0,35900,2400,1900],
['Intel Core Ultra 9 285K','LGA1851','DDR5',250,1,43200,4000,3200],



['Intel Xeon E5-2666 v3','LGA2011-3','DDR3',135,0,10500,150,120],
['Intel Xeon E5-2680 v3','LGA2011-3','DDR4',120,0,13600,null,180],
['Intel Xeon E5-2690 v3','LGA2011-3','DDR4',135,0,14800,420,350],['Intel Xeon E5-2696 v3','LGA2011-3','DDR4',145,0,18500,450,380],

['AMD FX-6300','AM3+','DDR3',95,0,3100,null,60],['AMD FX-8350','AM3+','DDR3',125,0,4700,null,110],

['AMD Athlon 200GE','AM4','DDR4',35,1,2500,null,90],['AMD Athlon 3000G','AM4','DDR4',35,1,2900,300,220],
['AMD Ryzen 3 1200','AM4','DDR4',65,0,4200,null,70],['AMD Ryzen 3 3100','AM4','DDR4',65,0,6800,350,250],
['AMD Ryzen 5 1600','AM4','DDR4',65,0,8000,null,200],['AMD Ryzen 5 2600','AM4','DDR4',65,0,8800,null,150],
['AMD Ryzen 5 3600','AM4','DDR4',65,0,9500,480,350],['AMD Ryzen 5 3600X','AM4','DDR4',95,0,9800,null,380],
['AMD Ryzen 5 5500','AM4','DDR4',65,0,10000,420,330],['AMD Ryzen 5 5600','AM4','DDR4',65,0,11000,500,400],
['AMD Ryzen 5 5600G','AM4','DDR4',65,1,10800,650,500],['AMD Ryzen 5 5600X','AM4','DDR4',65,0,11200,650,500],
['AMD Ryzen 7 1700','AM4','DDR4',65,0,11200,null,280],['AMD Ryzen 7 2700X','AM4','DDR4',105,0,12400,null,400],
['AMD Ryzen 7 3700X','AM4','DDR4',65,0,13400,700,520],['AMD Ryzen 7 5700X','AM4','DDR4',65,0,15100,899,600],
['AMD Ryzen 7 5700X3D','AM4','DDR4',105,0,15400,1100,850],['AMD Ryzen 7 5800X','AM4','DDR4',105,0,15600,1000,750],
['AMD Ryzen 7 5800X3D','AM4','DDR4',105,0,15100,1200,1000],['AMD Ryzen 9 3900X','AM4','DDR4',105,0,19200,null,900],
['AMD Ryzen 9 5900X','AM4','DDR4',105,0,22300,1600,1300],['AMD Ryzen 9 5950X','AM4','DDR4',105,0,28500,1800,1500],
['AMD Ryzen 5 7500F','AM5','DDR5',65,0,15700,900,750],['AMD Ryzen 5 7600','AM5','DDR5',65,1,16100,1100,900],
['AMD Ryzen 5 7600X','AM5','DDR5',105,1,16600,1150,950],['AMD Ryzen 5 8400F','AM5','DDR5',65,0,14600,800,680],
['AMD Ryzen 5 9600X','AM5','DDR5',65,1,17400,1499,1200],['AMD Ryzen 7 7700','AM5','DDR5',65,1,19800,1600,1300],
['AMD Ryzen 7 7700X','AM5','DDR5',105,1,20300,1700,1400],['AMD Ryzen 7 7800X3D','AM5','DDR5',120,1,18200,3099,2400],
['AMD Ryzen 7 9700X','AM5','DDR5',65,1,23000,2849,2300],['AMD Ryzen 7 9800X3D','AM5','DDR5',120,1,23300,3800,3300],
['AMD Ryzen 9 7900X','AM5','DDR5',170,1,28900,2400,2000],['AMD Ryzen 9 7950X','AM5','DDR5',170,1,29600,3300,2800],
['AMD Ryzen 9 9900X','AM5','DDR5',120,1,33000,3000,2500],['AMD Ryzen 9 9950X','AM5','DDR5',170,1,42300,4200,3700],
['AMD Threadripper 3960X','TRX40','DDR4',280,0,48000,null,6000],
['AMD EPYC 7302','SP3','DDR4',155,0,26000,2500,1800],['AMD EPYC 7402','SP3','DDR4',180,0,38000,3000,2200],
['AMD EPYC 7502','SP3','DDR4',180,0,41000,3800,3000],['AMD EPYC 7B13','SP3','DDR4',225,0,45000,3000,2400],
['AMD EPYC 9354','SP5','DDR5',280,0,78000,15000,13000],['AMD EPYC 9454','SP5','DDR5',290,0,88000,18000,16000],
['AMD EPYC 9654','SP5','DDR5',360,0,125000,22000,19000],
['Intel Core i7-7800X','LGA2066','DDR4',140,0,10100,null,230],
['Intel Core i7-7820X','LGA2066','DDR4',140,0,12400,null,380],
['Intel Core i9-7900X','LGA2066','DDR4',140,0,14998,null,600],
['Intel Core i9-7940X','LGA2066','DDR4',165,0,21292,null,1100],
['Intel Core i9-9980XE','LGA2066','DDR4',165,0,27081,null,1900],
['Intel Core i9-10980XE','LGA2066','DDR4',165,0,24309,null,2600],
['AMD Threadripper 1900X','TR4','DDR4',180,0,8979,null,480],
['AMD Threadripper 1920X','TR4','DDR4',180,0,15038,null,650],
['AMD Threadripper 1950X','TR4','DDR4',180,0,19635,null,850],
['AMD Threadripper 2920X','TR4','DDR4',180,0,15269,null,880],
['AMD Threadripper 2950X','TR4','DDR4',180,0,18797,null,1150],
['AMD Threadripper 2990WX','TR4','DDR4',250,0,29651,null,2400],
['AMD Threadripper 3970X','TRX40','DDR4',280,0,46874,null,8500],
['AMD Threadripper 3990X','TRX40','DDR4',280,0,75671,null,15000],
['AMD Threadripper 7960X','sTR5','DDR5',350,0,65824,null,9000],
['AMD Threadripper 7970X','sTR5','DDR5',350,0,64623,null,12000],
['AMD Threadripper 7980X','sTR5','DDR5',350,0,98341,null,18000],
['AMD Threadripper 7995WX','sTR5','DDR5',350,0,100295,null,100000],
['AMD EPYC 7702','SP3','DDR4',200,0,49035,5000,3800],
['AMD EPYC 7763','SP3','DDR4',280,0,61455,9000,7000],
['AMD EPYC 9654','SP5','DDR5',360,0,104913,22000,18000],
];
const GPU_RAW=[
['NVIDIA GeForce 210',300,170,30,null,40],['NVIDIA GeForce GT 220',450,180,58,null,50],
['NVIDIA GeForce GT 240',700,190,69,null,60],['NVIDIA GeForce GT 430',900,180,60,null,60],
['NVIDIA GeForce GT 440',1000,180,65,null,65],['NVIDIA GeForce GT 610',600,170,49,null,40],
['NVIDIA GeForce GT 620',650,180,49,null,45],['NVIDIA GeForce GT 630',800,180,65,null,55],
['NVIDIA GeForce GT 640',1200,190,65,null,70],['NVIDIA GeForce GT 705',700,180,29,null,50],
['NVIDIA GeForce GT 730',1200,180,49,null,80],['NVIDIA GeForce GT 740',1600,190,64,null,100],
['NVIDIA GeForce GT 1030',1800,170,30,null,280],
['NVIDIA GeForce GTX 260',900,270,182,null,70],['NVIDIA GeForce GTX 275',1100,270,219,null,80],
['NVIDIA GeForce GTX 280',1200,270,236,null,90],['NVIDIA GeForce GTX 285',1300,270,204,null,110],
['NVIDIA GeForce GTX 295',1900,270,289,null,150],['NVIDIA GeForce GTX 460',1600,210,160,null,90],
['NVIDIA GeForce GTX 470',2000,240,215,null,100],['NVIDIA GeForce GTX 480',2400,270,250,null,120],
['NVIDIA GeForce GTX 550 Ti',1800,210,116,null,90],['NVIDIA GeForce GTX 560',2200,240,150,null,100],
['NVIDIA GeForce GTX 560 Ti',2600,240,170,null,120],['NVIDIA GeForce GTX 570',3200,270,219,null,140],
['NVIDIA GeForce GTX 580',3600,270,244,null,160],['NVIDIA GeForce GTX 650',1900,200,64,null,90],
['NVIDIA GeForce GTX 650 Ti',2400,220,110,null,110],['NVIDIA GeForce GTX 650 Ti Boost',2800,240,134,null,130],
['NVIDIA GeForce GTX 660',3000,240,140,null,140],['NVIDIA GeForce GTX 660 Ti',3400,240,150,null,160],
['NVIDIA GeForce GTX 670',4000,240,170,null,180],['NVIDIA GeForce GTX 680',4500,250,195,null,200],
['NVIDIA GeForce GTX 690',4900,280,300,null,280],['NVIDIA GeForce GTX 745',1600,200,55,null,90],
['NVIDIA GeForce GTX 750',1900,190,55,null,120],['NVIDIA GeForce GTX 750 Ti',2000,200,60,null,120],
['NVIDIA GeForce GTX 760',3000,240,170,null,150],['NVIDIA GeForce GTX 760 Ti',2900,240,170,null,150],
['NVIDIA GeForce GTX 770',3800,250,230,null,180],['NVIDIA GeForce GTX 780',4200,270,250,null,220],
['NVIDIA GeForce GTX 780 Ti',4600,270,250,null,260],['NVIDIA GeForce GTX 950',1700,200,90,null,180],
['NVIDIA GeForce GTX 960',2400,250,120,null,180],['NVIDIA GeForce GTX 970',3800,270,145,null,300],
['NVIDIA GeForce GTX 980',4300,270,165,null,380],['NVIDIA GeForce GTX 980 Ti',5200,270,250,null,480],
['NVIDIA GeForce GTX 1050',1900,200,75,null,450],['NVIDIA GeForce GTX 1050 3G',1800,200,75,null,380],
['NVIDIA GeForce GTX 1050 Ti',2500,230,75,null,380],['NVIDIA GeForce GTX 1060 3G',3500,250,120,null,380],
['NVIDIA GeForce GTX 1060 5G',3800,250,120,null,350],['NVIDIA GeForce GTX 1060 6G',4200,250,120,null,400],
['NVIDIA GeForce GTX 1070',5800,270,150,null,600],['NVIDIA GeForce GTX 1070 Ti',6600,270,180,null,750],
['NVIDIA GeForce GTX 1080',7300,270,180,null,900],['NVIDIA GeForce GTX 1080 Ti',9800,270,250,null,1200],
['NVIDIA Titan X (Pascal)',8900,270,250,null,1500],['NVIDIA Titan Xp',10200,270,250,null,1800],
['NVIDIA Titan V',12000,270,250,null,2200],
['NVIDIA GeForce GTX 1630',2900,200,75,700,500],['NVIDIA GeForce GTX 1650',3900,230,75,800,550],
['NVIDIA GeForce GTX 1650 GDDR6',4100,230,75,850,600],['NVIDIA GeForce GTX 1650 Super',4700,230,100,1100,750],
['NVIDIA GeForce GTX 1660',5700,230,120,1000,700],['NVIDIA GeForce GTX 1660 Super',6300,250,125,900,650],
['NVIDIA GeForce GTX 1660 Ti',6500,230,120,1000,700],
['NVIDIA GeForce RTX 2060',8000,230,160,900,700],['NVIDIA GeForce RTX 2060 Super',8800,250,175,1200,850],
['NVIDIA GeForce RTX 2070',9200,250,175,1400,950],['NVIDIA GeForce RTX 2070 Super',10000,270,215,1600,1100],
['NVIDIA GeForce RTX 2080',10800,280,215,1800,1200],['NVIDIA GeForce RTX 2080 Super',11500,280,250,2000,1350],
['NVIDIA GeForce RTX 2080 Ti',13500,280,260,2400,1600],
['NVIDIA GeForce RTX 3050 6G',6300,200,70,1200,900],['NVIDIA GeForce RTX 3050 8G',7200,240,130,1400,1000],
['NVIDIA GeForce RTX 3060 8G',8200,240,170,1500,1150],['NVIDIA GeForce RTX 3060 12G',8900,240,170,1600,1200],
['NVIDIA GeForce RTX 3060 Ti',11700,240,200,1900,1400],['NVIDIA GeForce RTX 3070',13700,280,220,2000,1500],
['NVIDIA GeForce RTX 3070 Ti',14500,280,290,2400,1800],['NVIDIA GeForce RTX 3080 10G',17500,290,320,3000,2200],
['NVIDIA GeForce RTX 3080 12G',18000,290,350,3400,2500],['NVIDIA GeForce RTX 3080 Ti',19500,290,350,4000,3000],
['NVIDIA GeForce RTX 3090',20400,310,350,5500,4200],['NVIDIA GeForce RTX 3090 Ti',22000,320,450,7000,5500],
['NVIDIA GeForce RTX 4060',10600,240,115,2300,1800],['NVIDIA GeForce RTX 4060 Ti 8G',13300,240,160,2800,2200],
['NVIDIA GeForce RTX 4060 Ti 16G',13500,240,165,3200,2600],['NVIDIA GeForce RTX 4070',17800,300,200,4200,3400],
['NVIDIA GeForce RTX 4070 Super',19500,300,220,4800,3900],['NVIDIA GeForce RTX 4070 Ti',21800,320,285,5800,4700],
['NVIDIA GeForce RTX 4070 Ti SUPER',23200,320,285,6500,5200],['NVIDIA GeForce RTX 4080',27600,340,320,8500,7000],
['NVIDIA GeForce RTX 4080 Super',28400,340,320,9000,7500],['NVIDIA GeForce RTX 4090',36900,340,450,22000,18000],
['NVIDIA GeForce RTX 4090 D',34000,340,425,16000,14000],
['NVIDIA GeForce RTX 5050',9500,230,130,2600,2200],['NVIDIA GeForce RTX 5060',13000,245,145,3600,2900],
['NVIDIA GeForce RTX 5060 Ti',15600,245,180,4000,3300],['NVIDIA GeForce RTX 5070',21000,300,250,4900,4200],
['NVIDIA GeForce RTX 5070 Ti',27000,320,300,6300,5400],['NVIDIA GeForce RTX 5080',32100,330,360,12000,10000],
['NVIDIA GeForce RTX 5090',48200,345,575,54000,48000],['NVIDIA GeForce RTX 5090 D',44000,345,575,36000,33000],
['AMD Radeon HD 4350',250,170,20,null,30],['AMD Radeon HD 4650',600,190,48,null,35],
['AMD Radeon HD 4670',700,190,59,null,40],['AMD Radeon HD 4850',1400,230,110,null,60],
['AMD Radeon HD 4870',1600,240,150,null,70],['AMD Radeon HD 5450',250,170,20,null,30],
['AMD Radeon HD 5550',600,190,39,null,35],['AMD Radeon HD 5570',700,190,43,null,38],
['AMD Radeon HD 5670',900,190,64,null,45],['AMD Radeon HD 5750',1300,210,86,null,55],
['AMD Radeon HD 5770',1500,210,108,null,60],['AMD Radeon HD 5830',1900,240,175,null,70],
['AMD Radeon HD 5850',2100,240,151,null,80],['AMD Radeon HD 5870',2400,270,188,null,90],
['AMD Radeon HD 6450',300,170,18,null,30],['AMD Radeon HD 6570',700,180,44,null,40],
['AMD Radeon HD 6670',900,190,66,null,45],['AMD Radeon HD 6750',1300,210,86,null,55],
['AMD Radeon HD 6770',1500,210,108,null,60],['AMD Radeon HD 6790',1800,240,150,null,70],
['AMD Radeon HD 6850',2000,240,127,null,75],['AMD Radeon HD 6870',2300,240,151,null,85],
['AMD Radeon HD 6950',2800,270,200,null,100],['AMD Radeon HD 6970',3100,270,250,null,110],
['AMD Radeon HD 7750',1500,200,55,null,60],['AMD Radeon HD 7770',1800,220,80,null,70],
['AMD Radeon HD 7850',2200,240,130,null,80],['AMD Radeon HD 7870',2600,240,175,null,100],
['AMD Radeon HD 7950',3000,270,200,null,120],['AMD Radeon HD 7970',3400,270,250,null,140],
['AMD Radeon R5 230',300,170,19,null,30],['AMD Radeon R7 240',800,180,30,null,50],
['AMD Radeon R7 250',1000,190,65,null,60],['AMD Radeon R7 260X',1800,220,115,null,80],
['AMD Radeon R7 350',1200,200,75,null,70],['AMD Radeon R7 360',2200,220,100,null,90],
['AMD Radeon R9 270',2600,240,150,null,100],['AMD Radeon R9 270X',2800,240,180,null,110],
['AMD Radeon R9 280X',3200,270,250,null,120],['AMD Radeon R9 290',3800,270,275,null,150],
['AMD Radeon R9 290X',4000,270,290,null,170],['AMD Radeon R9 380',3600,240,190,null,150],
['AMD Radeon R9 380X',3800,240,190,null,160],['AMD Radeon R9 390',4200,270,275,null,180],
['AMD Radeon R9 390X',4500,270,275,null,200],
['AMD Radeon RX 460',3000,200,75,null,150],['AMD Radeon RX 470',3500,240,120,null,200],
['AMD Radeon RX 480',3800,240,150,null,230],['AMD Radeon RX 550',1500,180,50,null,120],
['AMD Radeon RX 560',2600,200,80,null,150],['AMD Radeon RX 570',4000,240,150,null,220],
['AMD Radeon RX 580 8G',4400,250,185,null,280],['AMD Radeon RX 590',4800,250,225,null,300],
['AMD Radeon RX 5500',6000,220,130,null,700],['AMD Radeon RX 5500 XT',6400,220,130,null,750],
['AMD Radeon RX 5600',7200,250,150,null,900],['AMD Radeon RX 5600 XT',7500,250,160,null,950],
['AMD Radeon RX 5700',8200,270,180,null,1100],['AMD Radeon RX 5700 XT',8800,270,225,null,800],
['AMD Radeon VII',12500,270,300,null,1500],['AMD Radeon RX 6400',3800,170,53,700,550],
['AMD Radeon RX 6500 XT',4900,200,107,1000,750],['AMD Radeon RX 6600',8200,230,132,1200,900],
['AMD Radeon RX 6600 XT',9500,240,160,1500,1100],['AMD Radeon RX 6650 XT',9800,240,180,1700,1250],
['AMD Radeon RX 6700',10500,270,175,1800,1300],['AMD Radeon RX 6700 XT',12000,280,230,1800,1300],
['AMD Radeon RX 6750 XT',12500,280,250,2000,1500],['AMD Radeon RX 6800',16000,280,250,2400,1800],
['AMD Radeon RX 6800 XT',18500,320,300,2800,2100],['AMD Radeon RX 6900 XT',19500,320,300,3200,2400],
['AMD Radeon RX 6950 XT',21000,320,335,3500,2700],['AMD Radeon RX 7600',10500,240,165,1900,1500],
['AMD Radeon RX 7600 XT',10800,270,190,2100,1650],['AMD Radeon RX 7700 XT',17000,280,245,2600,2100],
['AMD Radeon RX 7800 XT',19500,320,263,3800,2900],['AMD Radeon RX 7900 GRE',23500,320,260,4000,3200],
['AMD Radeon RX 7900 XT',26500,330,315,4800,3900],['AMD Radeon RX 7900 XTX',29800,340,355,5600,4500],
['AMD Radeon RX 9060 XT',14000,250,160,3200,2800],['AMD Radeon RX 9070',23500,320,220,4499,3900],
['AMD Radeon RX 9070 XT',27500,330,304,5200,4300]
];
function seriesOf(n){
  let m=n.match(/RTX\s?(\d{2})\d{2}/);if(m)return m[1]+'系';
  m=n.match(/GTX\s?(\d{3,4})/);if(m){const d=m[1];return d.length===4?d.slice(0,2)+'系':d.slice(0,1)+'系';}
  m=n.match(/GT\s?(\d{3})/);if(m)return 'GT系';
  m=n.match(/RX\s?(\d{4})/);if(m)return m[1].slice(0,2)+'系';
  if(n.includes('R9'))return 'R9系';if(n.includes('R7'))return 'R7系';
  if(n.includes('HD'))return 'HD系';if(n.includes('Vega')||n.includes('VII'))return 'Vega/VII';
  return '其它';
}
const GEN_SCORE_FIX={'LGA1155':0.68,'LGA1150':0.68,'LGA1151':0.68,'LGA1151V2':0.68,'LGA1200':0.68,
  'LGA2011':0.55,'LGA2011-3':0.55,'AM3+':0.66};
const C=CPU_RAW.map(([n,s,m,t,ig,cs,p,u])=>({n,s,m,t,ig,cs:Math.round(cs*(GEN_SCORE_FIX[s]||1)),p:jitter(p,'c'+n),u:jitter(u,'u'+n)}));

/* 逐颗校准：整代系数压不准的，按真实 Cinebench R23 多核直接覆盖 */
const CPU_SCORE_FIX={'Intel Core i3-8100':3300,'Intel Core i3-9100F':3500,'Intel Core i5-8400':5000,
'Intel Core i5-8500':6000,'Intel Core i5-8600K':5700,'Intel Core i5-9400F':5000,'Intel Core i7-8700':7300,
'Intel Core i7-8700K':7700,'Intel Core i7-9700K':8900,'Intel Core i9-9900':10500,'Intel Core i9-9900K':12400,
'AMD Ryzen 9 7950X':38000,'AMD Ryzen 7 5800X3D':14000,'AMD Ryzen 7 5700X3D':13500,
'AMD Ryzen 5 7600':14500,'AMD Ryzen 5 7600X':15300};
C.forEach(c=>{if(CPU_SCORE_FIX[c.n]!=null)c.cs=CPU_SCORE_FIX[c.n];});
const G=GPU_RAW.map(([n,ts,len,tbp,p,u])=>{
  const o={n,ts,len,tbp,p:jitter(p,'gc'+n),u:jitter(u,'gu'+n)};o.series=seriesOf(n);return o;});
function igScore(c){
  if(!c||!c.ig)return 0;const n=c.n;
  if(n.includes('Ultra'))return 3400;
  if(c.s==='LGA1155')return n.includes('i3')?180:400;
  if(c.s==='LGA1150')return 420;
  if(c.s==='LGA1151')return 530;
  if(c.s==='LGA1151V2')return 560;
  if(c.s==='LGA1200')return n.includes('11')?720:600;
  if(c.s==='LGA1700')return n.includes('i3')?800:950;
  if(c.s==='AM4')return n.includes('5600G')?1500:(n.includes('Athlon')?500:0);
  if(c.s==='AM5')return 900;
  return 0;
}
const CHIPSET=[
['H61','LGA1155','DDR3',2,16,'MATX',0,4,1,130,30,'—'],['B75','LGA1155','DDR3',4,32,'MATX',0,4,1,228,65,'—'],
['Z77','LGA1155','DDR3',4,32,'ATX',0,6,2,250,75,'—'],['H81','LGA1150','DDR3',2,16,'MATX',0,4,1,143,45,'—'],
['H97','LGA1150','DDR3',4,32,'MATX',1,6,2,249,150,'PCIe 3.0×4'],
['B85','LGA1150','DDR3',4,32,'MATX',0,4,1,143,65,'—'],['Z97','LGA1150','DDR3',4,32,'ATX',1,6,2,249,90,'PCIe 2.0×2'],
['H110','LGA1151','DDR4',2,32,'MATX',0,4,1,135,0,'—'],
['B150','LGA1151','DDR4',4,64,'MATX',1,6,2,144,0,'PCIe 3.0×4'],
['Z170','LGA1151','DDR4',4,64,'ATX',2,6,3,136,0,'PCIe 3.0×4'],
['H270','LGA1151','DDR4',4,64,'ATX',2,6,2,166,0,'PCIe 3.0×4'],
['B250','LGA1151','DDR4',4,64,'MATX',1,4,1,161,0,'PCIe 3.0×4'],['Z270','LGA1151','DDR4',4,64,'ATX',2,6,2,176,0,'PCIe 3.0×4'],
['H311','LGA1151V2','DDR3',2,16,'MATX',1,4,2,294,0,'—'],
['B365','LGA1151V2','DDR4',4,64,'MATX',2,6,2,0,219,'PCIe 3.0×4'],
['Z370','LGA1151V2','DDR4',4,64,'ATX',2,6,3,0,249,'PCIe 3.0×4'],
['B360','LGA1151V2','DDR4',4,64,'MATX',1,4,1,350,250,'PCIe 3.0×4'],['Z390','LGA1151V2','DDR4',4,128,'ATX',2,6,2,700,500,'PCIe 3.0×4'],
['H410','LGA1200','DDR4',2,64,'MATX',1,4,1,217,140,'PCIe 3.0×4'],
['H510','LGA1200','DDR4',2,64,'MATX',1,4,2,0,179,'PCIe 3.0×4'],
['B560','LGA1200','DDR4',4,64,'MATX',2,6,2,0,209,'PCIe 4.0×4'],['B460','LGA1200','DDR4',4,128,'MATX',2,4,1,227,180,'PCIe 3.0×4'],
['Z490','LGA1200','DDR4',4,128,'ATX',2,6,2,900,650,'PCIe 3.0×4'],['H610','LGA1700','DDR4',2,64,'MATX',1,4,1,400,300,'PCIe 3.0×4'],
['B660','LGA1700','DDR4',4,128,'ATX',2,4,2,650,500,'PCIe 4.0×4'],['B760','LGA1700','DDR5',4,192,'ATX',3,4,2,384,300,'PCIe 4.0×4'],
['Z790','LGA1700','DDR5',4,192,'ATX',4,4,2,1500,1100,'PCIe 5.0×4 + 4.0×4'],['H810','LGA1851','DDR5',2,96,'MATX',1,2,2,600,450,'PCIe 4.0×4'],['B860','LGA1851','DDR5',4,192,'ATX',3,4,2,1600,1300,'PCIe 5.0×4'],
['Z890','LGA1851','DDR5',4,192,'ATX',4,6,3,2500,2000,'PCIe 5.0×4 + 4.0×4'],
['X99M-D3','LGA2011-3','DDR3',4,64,'MATX',1,3,1,208,110,'PCIe 3.0×4'],
['X99M-D4','LGA2011-3','DDR4',4,64,'MATX',1,4,2,208,150,'PCIe 3.0×4'],
['X99D3','LGA2011-3','DDR3',4,128,'ATX',0,6,2,399,210,'—'],
['X99','LGA2011-3','DDR4',8,256,'ATX',1,6,3,399,270,'PCIe 3.0×4'],
['A520','AM4','DDR4',4,64,'MATX',1,4,2,0,245,'PCIe 3.0×4'],
['A320','AM4','DDR4',2,64,'MATX',1,4,1,200,150,'PCIe 3.0×4'],
['B450','AM4','DDR4',4,128,'MATX',1,4,1,350,250,'PCIe 3.0×4'],['B550','AM4','DDR4',4,128,'ATX',2,6,2,600,450,'PCIe 4.0×4'],
['X570','AM4','DDR4',4,128,'ATX',2,6,2,900,650,'PCIe 4.0×4'],['A620','AM5','DDR5',2,96,'MATX',1,4,2,600,480,'PCIe 4.0×4'],
['B650','AM5','DDR5',4,192,'ATX',3,4,2,1100,850,'PCIe 5.0×4'],['X670E','AM5','DDR5',4,192,'ATX',4,6,3,2200,1700,'PCIe 5.0×4 ×2'],
['TRX40','TRX40','DDR4',8,256,'EATX',2,8,3,3000,2200,'PCIe 4.0×4'],
['X299','LGA2066','DDR4',8,256,'ATX',3,8,4,2600,1900,'PCIe 3.0×4'],
['X399','TR4','DDR4',8,128,'ATX',2,8,4,2200,1500,'PCIe 3.0×4'],
['TRX50','sTR5','DDR5',4,512,'ATX',3,8,4,6000,5000,'PCIe 5.0×4'],['SP3','SP3','DDR4',8,1024,'EATX',2,8,3,4000,3200,'PCIe 4.0×4'],
['SP5','SP5','DDR5',12,1536,'EATX',2,8,3,6000,5000,'PCIe 5.0×4'],['970','AM3+','DDR3',4,32,'ATX',0,6,2,180,120,'—'],['760G','AM3+','DDR3',2,16,'MATX',0,4,2,0,60,'—']];
/* 主板按闲鱼实测校准（2026-10-27）：H610 159 / H81 55 / B450 138 / B550 254 / X570 452 / B660 480，
   其余芯片组样本被配件污染，统一用 0.58（可靠样本比值中位）。 */
const MB_FIX={'H610':0.53,'B450':0.55,'B550':0.56,'X570':0.70,'B660':0.90,'H61':1,'B75':1,'Z77':1,'H81':1,'B85':1,'Z97':1,'H110':1,'B150':1,'Z170':1,'H270':1,'B250':1,'Z270':1,'H310':1,'H311':1,'X99M-D3':1,'X99M-D4':1,'X99D3':1,'X99':1,'H410':1,'B460':1,'B760':1};
const MB_BRANDS=['ASUS 华硕','MSI 微星','ASRock 华擎','七彩虹','铭瑄','昂达','映泰','蓝宝石','影驰',
'索泰','盈通','梅捷','翔升','精粤','磐正','顶星','超微','泰安','信步'];
const MB_DEAD=['B360','Z390','Z490','X79'];
const B=[];
const BOARD_MODELS={
'H61':["劲鲨 H61M-I", "精粤 H61M-G", "华硕 P8H61-M LX", "技嘉 GA-H61M-S2P", "微星 H61M-P31"],
'B75':["华南 B75", "精粤 B75M-VH PLUS", "华硕 P8B75-M", "技嘉 B75M-D3V", "华擎 B75M-DGS"],
'Z77':["华硕 P8Z77-V LX", "技嘉 Z77X-D3H", "微星 Z77A-G43", "华擎 Z77 Extreme4", "七彩虹 战斧C.Z77 V20"],
'H97':["精粤 H97M-VH PLUS", "精粤 H97I-PLUS", "华硕 H97M-E", "技嘉 H97M-D3H", "微星 H97M-G43"],
'H81':["精粤 H81M-H", "华南 H81 PLUS", "华硕 H81M-K", "技嘉 H81M-DS2", "微星 H81M-P33", "华擎 H81M-VG4"],
'B85':['精粤 B85M-VDH','铭瑄 B85M-VDH R2.0','华南 B85','华南 B85-ITX','华硕 B85M-G','技嘉 B85M-D3H','微星 B85M-E45'],
'Z97':["华硕 Z97-A", "技嘉 Z97X-UD3H", "微星 Z97-G43", "七彩虹 战斧C.Z97 X5"],
'H110':["铭瑄 MS-H110M", "七彩虹 H110M-D4", "微星 H110M-D4", "技嘉 H110M-D4", "华硕 H110M-D4"],
'B150':["铭瑄 MS-B150M", "七彩虹 B150M-D4", "微星 B150M-D4", "技嘉 B150M-D4", "华硕 B150M-D4"],
'Z170':["七彩虹 Z170-D4", "微星 Z170-D4", "技嘉 Z170-D4", "华硕 Z170-D4", "华擎 Z170-D4"],
'H270':["七彩虹 H270-D4", "微星 H270-D4", "技嘉 H270-D4", "华硕 H270-D4", "华擎 H270-D4"],
'B250':["华硕 PRIME B250M-K", "技嘉 B250M-D3H", "微星 B250M PRO-VD", "华擎 B250M-HDV", "铭瑄 MS-挑战者 B250M"],
'Z270':["华硕 STRIX Z270E", "技嘉 Z270X-UD3", "微星 Z270 GAMING PRO", "华擎 Z270 Extreme4", "七彩虹 战斧C.Z270"],
'B360':['华硕 EX-B360M-V3','技嘉 B360M-DS3H','微星 B360M MORTAR','华擎 B360M Pro4','铭瑄 MS-挑战者 B360M'],
'Z390':["华硕 ROG STRIX Z390-E", "技嘉 Z390 AORUS ELITE", "微星 MPG Z390 GAMING EDGE", "华擎 Z390 Taichi", "七彩虹 CVN Z390M"],
'H410':["华硕 PRIME H410M-K", "技嘉 H410M-H", "微星 H410M PRO", "华擎 H410M-HDV", "铭瑄 MS-挑战者 H410M","华擎 H410M-ITX/ac"],
'B460':['华硕 PRIME B460M-K','技嘉 B460M-DS3H','微星 B460M MORTAR','华擎 B460M Pro4','铭瑄 MS-挑战者 B460M','华硕 TUF GAMING B460M-PLUS','微星 B460M PRO-VDH WIFI'],
'Z490':['华硕 ROG STRIX Z490-A','技嘉 Z490 AORUS ELITE','微星 MPG Z490 GAMING PLUS','华擎 Z490 Phantom Gaming 4','七彩虹 CVN Z490'],
'H610':["华硕 PRIME H610M-E D4", "技嘉 H610M H", "微星 PRO H610M-E", "华擎 H610M-HDV", "铭瑄 MS-挑战者 H610M","华硕 PRIME H610M-F D4","昂达 H610-VH4-B","精粤 H610M-D PLUS","精粤 H610M-K","精粤 H610M-E","精粤 H610M-GAMING","精粤 H610M-GAMING WIFI"],
'B660':["华硕 EX-B660M-V5 D4", "技嘉 B660M DS3H", "微星 PRO B660M-A", "华擎 B660M Pro RS", "铭瑄 MS-挑战者 B660M-K","铭瑄 MS-挑战者 B660M-F","七彩虹 网驰 B660M-G DELUXE V20","华硕 B660M-T D4","华硕 EX-B660M-V5 PRO D4"],
'B760':["华硕 PRIME B760M-K D4", "技嘉 B760M DS3H", "微星 MAG B760M MORTAR WIFI D5", "华擎 B760M Pro RS", "铭瑄 MS-终结者 B760M","华硕 EX-B760M-V5 D4","华硕 B760M-AYW WIFI D4","昂达 B760E-B","微星 B760M BOMBER WIFI D5"],
'Z790':["华硕 ROG STRIX Z790-A GAMING WIFI", "技嘉 Z790 AORUS ELITE", "微星 MPG Z790 EDGE WIFI", "华擎 Z790 Steel Legend WiFi", "七彩虹 CVN Z790D5 GAMING FROZEN V20","华硕 PRIME Z790-P WIFI","华硕 PRIME Z790M-PLUS","华硕 ROG STRIX Z790-I GAMING WIFI"],
'H810':["铭瑄 MS-Challenger H810M-K WIFI","铭瑄 MS-eSport H810M WIFI ICE","铭瑄 MS-Challenger H810ITX WIFI"],
'B860':["华硕 TUF GAMING B860M-PLUS WIFI", "技嘉 B860M DS3H", "微星 PRO B860M-B WIFI", "华擎 B860M Pro RS WiFi", "铭瑄 MS-Terminator B860M WIFI","七彩虹 BATTLE-AX B860M-PLUS S WIFI7 V20","七彩虹 BATTLE-AX B860M-PLUS WIFI V20","七彩虹 BATTLE-AX B860M-WHITE WIFI V20","七彩虹 BATTLE-AX B860M-E WIFI V20","七彩虹 BATTLE-AX B860M-P WIFI V20","七彩虹 CVN B860I GAMING FROZEN V20","七彩虹 CVN B860M GAMING FROZEN V20","微星 B860M GAMING PLUS WIFI6E","微星 MAG B860M MORTAR WIFI","华擎 B860M-X WiFi","华擎 B860M-H2"],
'Z890':["华硕 ROG STRIX Z890-A", "技嘉 Z890 AORUS ELITE", "微星 MPG Z890 EDGE", "华擎 Z890 Steel Legend", "七彩虹 CVN Z890M", "微星 PRO Z890-P WIFI6E"],
'X99M-D3':["精粤 X99M-D D3", "华南 X99-4MT V2.0", "华南 X99-P4T"],
'X99M-D4':["精粤 X99M-G D4/ARGB", "华南 X99-4MF PLUS", "华南 X99M-F"],
'X99D3':["华南 X99-CD3 GAMING", "华南 X99-T8 GAMING V6.0", "精粤 X99-TI D3 PLUS"],
'X99':["华南 X99-F8 V6.0", "华南 X99-CD4 GAMING", "精粤 X99-TI D4 PLUS"],
'A320':["华硕 PRIME A320M-K", "技嘉 A320M-S2H", "微星 A320M-A PRO", "华擎 A320M-HDV", "七彩虹 断剑C.A320M"],
'B450':['华硕 TUF B450M-PRO','技嘉 B450M DS3H','微星 B450M MORTAR','华擎 B450M Pro4','梅捷 SY-狂龙 B450M','精粤 B450M PRO','精粤 B450I-PLUS'],
'B550':['华硕 TUF B550M-PLUS','技嘉 B550M AORUS ELITE','微星 B550M MORTAR','华擎 B550M Pro4','铭瑄 MS-终结者 B550M','七彩虹 战斧 B550M-GAMING WIFI6E V14','精粤 B550M PRO','精粤 B550M GAMING ARGB','精粤 B550I GAMING'],
'X570':['华硕 TUF X570-PLUS','技嘉 X570 AORUS ELITE','微星 MPG X570 GAMING EDGE','华擎 X570 Steel Legend','七彩虹 CVN X570','华硕 PRIME X570-P'],
'A620':["华硕 PRIME A620M-K", "技嘉 A620M S2H", "微星 PRO A620M-E", "铭瑄 MS-挑战者 A620M", "华硕 A620M-AYW WIFI"],
'B650':["华硕 TUF GAMING B650M-PLUS WIFI", "技嘉 B650M DS3H", "微星 MAG B650M MORTAR WIFI", "铭瑄 MS-Terminator B650M WIFI6", "华硕 ROG STRIX B650-A GAMING WIFI", "华硕 B650M-AYW WIFI", "华硕 TUF GAMING B650M-E WIFI", "微星 B650M GAMING WIFI", "精粤 B650M-D", "精粤 B650I Night Devil V2.3", "铭瑄 MS-Challenger B650M-K WIFI"],
'X670E':["华硕 ROG STRIX X670E-A", "技嘉 X670E AORUS ELITE", "微星 MPG X670E CARBON WIFI", "华擎 X670E Taichi"],
'TRX40':["华硕 ROG ZENITH II EXTREME", "技嘉 TRX40 AORUS MASTER", "微星 TRX40 PRO", "华擎 TRX40 Creator", "超微 M12SWA-TF"],
'SP3':["超微 H11DSi", "华硕 KRPA-U16", "泰安 S8030", "超微 H11SSL-i", "超微 H12SSL-i"],
'SP5':["超微 H13SSL-N", "华硕 K14PA-U12", "泰安 S8050", "超微 H13DSH", "华硕 K14PP-D16"],
'970':['华硕 M5A97 R2.0','技嘉 970A-DS3P','华擎 970 Pro3','七彩虹 战斧C.A970 X5 V14'],
'990FX':["华硕 CROSSHAIR V FORMULA", "技嘉 990FXA-UD3", "微星 990FXA-GD65", "华擎 990FX Extreme3", "七彩虹 战斧C.A990FX"],
'H311':['华南 H311-VHD3','华南 H311-D3','精粤 H311M-HD4','精粤 H311i-PLUS','劲鲨 H311M-K'],
'X299':['华硕 PRIME X299-A II','技嘉 X299 UD4','微星 X299 SLI PLUS','华擎 X299 Taichi CLX','华硕 PRIME X299-DELUXE'],
'X399':['华硕 ROG ZENITH EXTREME','技嘉 X399 AORUS XTREME','微星 X399 SLI PLUS','华擎 X399 Taichi'],
'TRX50':['华硕 Pro WS TRX50-SAGE WIFI','技嘉 TRX50 AERO D','华硕 Pro WS TRX50-SAGE WIFI','华擎 TRX50 WS'],
'760G':["微星 760GM-P23 (FX)", "华硕 M5A78L-M LX3"],
'H510':['华硕 PRIME H510M-F','微星 H510M PRO','七彩虹 H510M-D M.2','华擎 H510M-HDV/M.2','华擎 H510M-ITX/ac','微星 H510I PRO WIFI','铭瑄 MS-挑战者 H510ITX','七彩虹 CVN H510I GAMING V20'],
'B560':['华硕 PRIME B560M-K','技嘉 B560M DS3H','七彩虹 B560M-D PRO'],
'B365':['华擎 B365M Pro4','七彩虹 B365M','华擎 B365M-HDV','华硕 PRIME B365M-A'],
'Z370':['华硕 PRIME Z370-A','华硕 PRIME Z370-P','微星 Z370-OC PRO','微星 Z370M MORTAR','华硕 ROG STRIX Z370-E'],
'A520':['华硕 PRIME A520M-K','昂达 A520-VH','精粤 A520M-K','华擎 A520M-ITX/ac','昂达 A520SD4-ITX']
};
const _MPF=[1.0,0.95,1.1,0.9,1.05];
CHIPSET.forEach(([cs,s,m,dimm,max,ff,m2,sata,pcie,p,u,m2spec])=>{
  let list=BOARD_MODELS[cs]||[cs];
    /* 9 代及以下每芯片组最多 4 张：1 张新板品牌 + 3 张一线 */
  if(['LGA1155','LGA1150','LGA1151','LGA1151V2'].includes(s)){
    const isNew=x=>/^(华南|精粤|劲鲨)/.test(x);
    const ITX_ALWAYS=['华南 B85-ITX','精粤 B450I-PLUS','精粤 B550I GAMING','劲鲨 H61M-I','精粤 H97I-PLUS'];
    const kept=[...list.filter(isNew).slice(0,1),...list.filter(x=>!isNew(x)).slice(0,3)];
    list=[...kept,...list.filter(x=>ITX_ALWAYS.includes(x)&&!kept.includes(x))];
  }
  const MB_DROP=new Set(["七彩虹 H270-D4","七彩虹 CVN Z490","华南 X99M-D3","华南 X99M-D4","梅捷 SY-狂龙 B450M","铭瑄 MS-终结者 B550M","技嘉 X570 AORUS ELITE","技嘉 A620M S2H","铭瑄 MS-挑战者 A620M","铭瑄 MS-终结者 B650M","华硕 ROG STRIX X670E-A","技嘉 X670E AORUS ELITE","七彩虹 CVN X670E","超微 M12SWA-TF","泰安 S8030","泰安 S8050","华硕 K14PP-D16","七彩虹 战斧C.A990FX","七彩虹 CVN X570","微星 PRO H610M-E","华擎 H610M-HDV","华硕 PRIME H610M-F D4","精粤 H610M-K","精粤 H610M-E","精粤 H610M-GAMING","精粤 H610M-GAMING WIFI","微星 PRO B660M-A","华擎 B660M Pro RS","铭瑄 MS-挑战者 B660M-F","华硕 EX-B660M-V5 PRO D4","华擎 B760M Pro RS","铭瑄 MS-终结者 B760M","华硕 B760M-AYW WIFI D4","华擎 Z790 Steel Legend WiFi","七彩虹 CVN Z790D5","七彩虹 CVN Z790D5 GAMING FROZEN V20","微星 MPG Z790 EDGE WIFI","华硕 B660M-T D4","华硕 PRIME B760M-K D4","七彩虹 BATTLE-AX B860M-PLUS WIFI V20","七彩虹 BATTLE-AX B860M-WHITE WIFI V20","七彩虹 BATTLE-AX B860M-P WIFI V20","七彩虹 CVN B860M GAMING FROZEN V20","微星 B860M GAMING PLUS WIFI6E","华擎 B860M-H2","微星 MPG Z890 EDGE","华擎 A620M-HDV","华擎 B650M Pro RS"]);
  const MB_RENAME={"铭瑄 B85M-VDH R2.0": "微星 B85M-E45", "微星 Z170-D4": "华硕 Z170-AR", "华南 X99-F8": "华南 X99-F8 V6.0", "华南 X99-CD4": "华南 X99-CD4 GAMING", "华南 X99-CD3": "华南 X99-CD3 GAMING", "华南 X99-T8": "华南 X99-T8 GAMING V6.0", "华南 X99-TF": "华南 X99-TF GAMING V6.0", "华南 X99-4MT": "华南 X99-4MT V2.0", "华南 X99-4MF": "华南 X99-4MF PLUS", "华南 X99-8D3": "华南 X99-8D3 PRO", "华南 X99-8D": "华南 X10X99-8D", "华南 X99-MTF": "华南 X99-MTF V1.0", "华南 H311-VHD3": "华南 H311 VHD3", "华南 H311-D3": "华南 H311-D3 V2.0", "MS-终结者 B760M": "MS-Terminator B760M D4", "MS-终结者 B860M": "MS-Terminator B860M", "MS-H110M": "MS-H110M 全固版", "MS-B150M": "MS-B150M Combo", "铭瑄 MS-终结者 B760M": "铭瑄 MS-Terminator B760M D4", "铭瑄 MS-终结者 B860M": "铭瑄 MS-Terminator B860M", "铭瑄 MS-H110M": "铭瑄 MS-H110M 全固版", "铭瑄 MS-B150M": "铭瑄 MS-B150M Combo", "七彩虹 H110M-D4": "七彩虹 C.H110M-K 全固态版 V20", "七彩虹 B150M-D4": "七彩虹 战斧C.B150M-D 魔音版 V22", "七彩虹 Z170-D4": "七彩虹 战斧C.Z170 魔音版 V21", "七彩虹 B365M": "七彩虹 战斧B365M-D 魔音版 V20", "微星 H270-D4": "微星 H270 PC MATE", "华硕 STRIX Z270E": "华硕 ROG STRIX Z270E GAMING", "华硕 ROG STRIX Z390-E": "华硕 ROG STRIX Z390-E GAMING", "微星 MPG Z390 GAMING EDGE": "微星 MPG Z390 GAMING EDGE AC", "精粤 A520M-K": "精粤 A520M-H", "华擎 B550M Pro4": "华擎 B550M-HDV"};
  list=list.filter(x=>!MB_DROP.has(x)).map(x=>MB_RENAME[x]||x);
  list.forEach((nm,i)=>{
    const f=_MPF[i%5];
    /* 按型号细分规格：小-* 板多为 2 槽、中高端 4 槽 / 更多 M.2 与 PCIe */
    let _dim=dimm,_max=max,_ff=ff,_m2=m2,_sata=sata,_pcie=pcie;
    if(/(M-K|M-E|M-H|M-D|M-A|HDV|DGS|S2P|S2H|P31|E33|H61V|H55|V 全固|H81M|H61M)/.test(nm)&&!/X99/.test(nm)){_dim=Math.min(_dim,2);_max=Math.min(_max,64);_sata=Math.min(_sata,4);_pcie=Math.min(_pcie,2);}
    if(/(DS3H|MORTAR|PRO4|Pro RS|Steel Legend|AORUS|TUF|Extreme4|Taichi|EDGE|CARBON|ZENITH|PRIME [BZX][0-9])/.test(nm)){_m2=Math.max(_m2,2);_sata=Math.max(_sata,6);_pcie=Math.max(_pcie,3);}
    if(/^(Z790|Z890|X670E|X570|Z97|Z490|Z390|Z270|Z77)/.test(nm.split(' ').pop())){_m2=Math.max(_m2,2);_pcie=Math.max(_pcie,3);}
    if(/(ITX|H97I|B85-ITX)/.test(nm)){_dim=Math.min(_dim,2);_ff='ITX';_pcie=Math.min(_pcie,1);}
    else if(/(H610M|B660M|B760M|B650M|B450M|B550M|A620M|A320M|H81M|B85M|H97M|B250M|B460M|H410M|Z390M|B360M|B75M|H61M|X570M)/.test(nm)){_ff='MATX';}
    B.push({n:nm,s,m,dimm:_dim,max:_max,ff:_ff,m2:_m2,sata:_sata,pcie:_pcie,m2spec,
      p:MB_DEAD.includes(cs)?null:jitter(R2(p*f*(MB_FIX[cs]||0.58),1),'mb'+cs+i),
      u:jitter(R2(u*f*(MB_FIX[cs]||0.58),1),'mbu'+cs+i)});
  });
});
const RAM_BRANDS=['金士顿','威刚','海盗船','芝奇','光威','英睿达','金百达','影驰','宇瞻','十铨',
'阿斯加特','朗科','玖合','金泰克','协德'];
/* 内存：代际 × 容量 × 频率（频率按真实产品线，价格随频率上浮） */
const RAM_TIERS=[
 ['DDR3',4,[1333,1600]],['DDR3',8,[1600]],   /* DDR3 不出 16G（用户 2026-11-03 定） */
 ['DDR4',8,[2666,3000,3200]],['DDR4',16,[3000,3200,3600]],['DDR4',32,[3200,3600]],
 ['DDR5',16,[4800,5600,6000]],['DDR5',24,[6000]],['DDR5',32,[5600,6000,6400]],['DDR5',64,[6000]]
];
const RAM_BASEU={'DDR3':{4:22,8:42},'DDR4':{8:240,16:460,32:900},'DDR5':{16:1300,24:1800,32:2450,64:4700}};
const RAM_BASEP={'DDR4':{8:360,16:700,32:1400},'DDR5':{16:1700,32:3300,64:6400}};
const RAM_REF={'DDR3':1600,'DDR4':3200,'DDR5':6000};
/* 时序：同一代里 CL 越低越贵，用价格把「旗舰 / 中端 / 低端」拉开
   （档位仍由 assignTiers 按同代同容量的价格比出来，不另外写死） */
const RAM_CL={'DDR3':{1333:11,1600:11},'DDR4':{2666:19,3000:18,3200:16,3600:16},
              'DDR5':{4800:40,5600:36,6000:30,6400:32}};
const RAM_CL_REF={'DDR3':11,'DDR4':16,'DDR5':32};
const RAM_SPECS=[];
const M=[];
RAM_BRANDS.forEach((br)=>RAM_TIERS.forEach(([mem,cap,freqs],ti)=>freqs.forEach((mhz,fi)=>{
  const ki=ti*7+fi, rj=rngFrom(hash(br+ki)),jf=0.92+rj()*0.22;
  const fk=1+(mhz-RAM_REF[mem])*0.00035;
  const baseU=RAM_BASEU[mem][cap]||100, baseP=(RAM_BASEP[mem]||{})[cap];
  const cl=(RAM_CL[mem]||{})[mhz]||0;
  /* CL 比同代参考值低 → 更贵；高 → 更便宜（±20% 以内） */
  const ck=cl?(1+((RAM_CL_REF[mem]||cl)-cl)*0.02):1;
  M.push({n:`${br} ${mem} ${mhz} ${cap}G 单条`,m:mem,cap,mhz,st:1,cl,
    p:baseP?jitter(R2(baseP*fk*jf*ck,1),'r'+br+ki):null,
    u:jitter(R2(baseU*fk*jf*ck,1),'ru'+br+ki)});
})));
/* ===== 套条：两根一起卖（mult=2），占两个内存槽，工作台照片直接是插好两条的样子 =====
   ① 结构性套条：DDR4/DDR5 每个规格都有一条「16G×2」的版本，价 = 两条单条的价，不另外估溢价。
   ② RAM_FLAG：用户 2026-11-03 淘宝实拍价的旗舰条（大牌 + 海力士 A-die），只卖全新。 */
const MK=[];
M.slice().forEach(x=>{
  if(x.m!=='DDR4'&&x.m!=='DDR5')return;
  MK.push({n:x.n.replace(/ \d+G 单条$/,' '+x.cap+'G×2 套条'),m:x.m,mult:2,kit:1,cap:x.cap,mhz:x.mhz,st:1,cl:x.cl,
    p:x.p==null?null:R2(x.p*2,1),u:x.u==null?null:R2(x.u*2,1)});
});
/* 实拍单条（¥1584 / ¥1665）—— 不进上面那轮，免得再凭空调出个两倍价的套条 */
M.push({n:'十铨 引领者 DDR5 6000 16G 单条',m:'DDR5',cap:16,mhz:6000,st:1,cl:30,p:1584,u:null,flag:1});
M.push({n:'玖合 玲珑 DDR5 6000 16G 单条',m:'DDR5',cap:16,mhz:6000,st:1,cl:28,p:1665,u:null,flag:1});
M.push({n:'云彣 绫龙 DDR5 6000 24G 单条',m:'DDR5',cap:24,mhz:6000,st:1,cl:38,p:1949,u:null,flag:1});
[['威刚','XPG 威龙',28,4239],['阿斯加特','吹雪联名二代',0,3999],['光威','神武RGB',28,3899],
 ['金百达','星刃',0,3878],['铭瑄','暗耀D5',28,3375],['科赋','BOLT V',28,3421]].forEach(function(f){
  MK.push({n:f[0]+' '+f[1]+' DDR5 6000 16G×2 套条',m:'DDR5',cap:16,mhz:6000,st:1,cl:f[2],
    mult:2,kit:1,flag:1,p:f[3],u:null});
});
/* 24G×2（48G）套条：2026-11-03 用户淘宝实拍价，只留能看清型号的 */
[['威刚','XPG D300G 吹雪',28,3847],['威刚','XPG 龙耀',28,3689],
 ['十铨','引领者',28,4380],['阿斯加特','女武神二代',28,4499],
 ['海姆达尔','黑',36,4399]].forEach(f=>{
  MK.push({n:f[0]+' '+f[1]+' DDR5 6000 24G×2 套条',m:'DDR5',cap:24,mhz:6000,st:1,cl:f[2],
    mult:2,kit:1,flag:1,p:f[3],u:null});
});
MK.forEach(x=>M.push(x));

/* 品牌系数按闲鱼实测（650W：海韵GX 400 / 振华 182 / 长城 115 / 酷冷 99 / 杂牌 87）重排 */
const PSU_BRANDS=[['海韵','PRIME',1.5],['海韵','FOCUS GX',1.36],['鑫谷','昆仑',0.85],['全汉','MEGA',0.68],
['振华','卓凌',0.62],['微星','MAG',0.51],['安钛克','NE',0.44],['先马','XP',0.41],['长城','GX+',0.39],
['鑫谷','GM',0.37],['长城','猎金',0.34],['先马','黑钻',0.34],['酷冷至尊','MWE',0.34],['航嘉','MVP',0.31],
['利民','TR',0.27],['爱国者','ES',0.24],
['超频三','KF',0.33],['九州风神','DQ',0.47],['航嘉','WD',0.36],['Tt','SMART',0.44]];
const PSU_WATT=[200,250,300,350,400,450,500,550,650,750,850,1000,1200,1600];
const P=[];
PSU_BRANDS.forEach(([br,series,f])=>PSU_WATT.forEach((w,wi)=>{
  const base=w<=350?(w*0.55+30):(w*0.62+60);
  const rj=rngFrom(hash(br+wi)),price=R2(base*f*(0.95+rj()*0.2),1);
  P.push({n:`${br} ${series} ${w}W`,w,p:jitter(price,'p'+br+wi),u:jitter(R2(price*0.68,1),'pu'+br+wi)});
}));
/* 真实电源（替换「艾湾 GD」「雅浚 XF」两条虚构系列）。新价=2026-10 京东到手价，二手为估算。 */
const REAL_PSU=[
 {n:'长城 GW-ATX200JD',w:200,p:99,u:60},{n:'大水牛 劲强250',w:250,p:99,u:55},
 {n:'航嘉 JUMPER300',w:300,p:161,u:95},{n:'长城 HOPE350',w:350,p:170,u:100},
 {n:'长城 HOPE400',w:400,p:179,u:105},{n:'航嘉 JUMPER450',w:450,p:189,u:110},
 {n:'长城 HOPE500',w:500,p:179,u:105},{n:'长城 X550',w:550,p:293,u:170},
 {n:'长城 HOPE650',w:650,p:236,u:140},{n:'九州风神 PQ650G',w:650,p:295,u:180},
 {n:'长城 HOPE750',w:750,p:289,u:170},{n:'长城 F7',w:750,p:407,u:250},
 {n:'九州风神 PQ750G',w:750,p:417,u:250},{n:'长城 F8',w:850,p:458,u:280},
 {n:'九州风神 PQ850G',w:850,p:455,u:280},{n:'长城 F10',w:1000,p:505,u:310},
 {n:'九州风神 PQ1000G',w:1000,p:522,u:320},{n:'长城 F12',w:1200,p:589,u:360},
 {n:'九州风神 PQ1200G',w:1200,p:560,u:350},{n:'长城 F16',w:1600,p:1187,u:750}
];
REAL_PSU.forEach(x=>P.push(x));
const CASE_BRANDS=['酷冷至尊','先马','爱国者','乔思伯','追风者','联力','长城','鑫谷','银欣','游戏悍将',
'安钛克','航嘉','大水牛','金河田','Tt','NZXT','分形工艺','海盗船'];
const CASE_TYPE=[['薄铁皮办公箱',['MATX'],280,150,0,2,75],['M-ATX 入门侧透',['MATX','ITX'],330,160,240,2,150],
['M-ATX 静音',['MATX','ITX'],320,165,240,2,230],['M-ATX 海景房',['MATX','ITX'],350,165,240,2,430],
['ITX 迷你',['ITX'],200,70,0,1,110],['ITX 侧透',['ITX'],320,150,240,1,520],
['ITX 开放式',['ITX'],330,160,0,1,350],['ATX 中塔入门',['ATX','MATX','ITX'],330,160,240,3,180],
['ATX 中塔主流',['ATX','MATX','ITX'],380,170,360,3,380],['ATX 海景房',['EATX','ATX','MATX','ITX'],420,167,420,3,850],
['全塔入门',['EATX','ATX','MATX'],400,180,360,6,500],['全塔高端',['EATX','ATX','MATX'],430,190,420,6,2200]];
const K=[];   /* 机箱数据统一由下面的 REAL_CASES 提供（见「真实型号覆盖」段） */
const COOL_TYPE=[['廉价下压散热（60W级）',60,48,0,10],['原装风冷（70W级）',70,52,0,18],['双热管下压（95W）',95,55,0,35],
['四热管单塔（130W）',130,150,0,65],['六热管单塔（180W）',180,160,0,100],['双塔风冷（250W）',250,165,0,130],
['240 一体水冷（220W）',220,0,240,280],['360 一体水冷（320W）',320,0,360,450]];
const COOL_BRANDS=['酷冷至尊','利民','九州风神','超频三','乔思伯','ID-COOLING','猫头鹰','安钛克','微星','冰曼',
'采融','大镰刀','瓦尔基里','雅浚','几何未来','恩杰','追风者','先马'];
const STD_SOCKETS=['AM4','AM5','AM3+','TRX40','LGA1155','LGA1150','LGA1151','LGA1151V2','LGA1200','LGA1700','LGA1851','LGA2066','TR4','sTR5'];
const H=[];
COOL_BRANDS.forEach((br)=>COOL_TYPE.forEach(([tn,cap,h,rad,base],ti)=>{
  const rj=rngFrom(hash(br+ti+'v2')),price=R2(base*(0.85+rj()*0.4),1);
  H.push({n:`${br} ${tn}`,cap,h,rad,s:STD_SOCKETS,p:jitter(price,'h'+br+ti),u:jitter(R2(price*0.7,1),'hu'+br+ti)});
}));
[['服务器风冷 SP3',400,120,0,['SP3','SP5','LGA2011','LGA2011-3'],400],['服务器风冷 SP5',450,125,0,['SP3','SP5'],600],
['LGA2011 专用风冷',300,140,0,['LGA2011','LGA2011-3'],300]]
.forEach(([n,cap,h,rad,s,p])=>H.push({n,cap,h,rad,s,p:jitter(p,'hs'+n),u:jitter(R2(p*0.75,1),'hsu'+n)}));

/* ===== 真实型号覆盖：清掉程序生成的机箱/散热，换成市面真实型号 ===== */
/* ===== 精简商品表：机箱 / 散热只保留有代表性的型号（用户要求）===== */
setTimeout(function(){
  /* 精简前先按全量分一次档位 */
  try{if(typeof assignTiers==='function')assignTiers();
try{(G||[]).forEach(function(x){if(x&&(x.ts||0)>=30445&&x.tier==='budget')x.tier='mid';});
(C||[]).forEach(function(x){if(x&&(x.cs||0)>=19539&&x.tier==='budget')x.tier='mid';});}catch(e){}}catch(e){}
  /* 机箱/散热同样只在手机端精简；电脑端保留全量 */
  const _mob=(typeof isMobile==='function')?isMobile():(window.innerWidth<=1159);
  /* 电脑端：不裁任何东西，直接收工 */
  if(!_mob){try{if(typeof assignTiers==='function')assignTiers();}catch(e){}return;}
  try{const keep=new Set(["九尾狐 U1", "九尾狐 T13 海景房", "积至 家悦X1", "积至 坦克 侧透", "先马 趣造2", "先马 平头哥M2", "鑫谷 拉克斯", "酷冷至尊 MB400L", "先马 鲁班1", "爱国者 星璨 岚", "迅钛 玄武 MINI 海景房", "航嘉 S980 海景房", "乔思伯 D300 海景房", "爱国者 YOGO T21 ATX", "联力 L216 中塔", "酷冷至尊 TD500 Mesh", "NZXT H5 Flow", "巧美 mini ITX 17×17", "乔思伯 C6", "乔思伯 A4", "大水牛 商悦 ATX", "硕一 鲲鹏 CH9L", "动力火车 御浪 EATX", "NAS 8 盘位机箱", "联力 O11 Dynamic", "分形工艺 North", "乔思伯 D31", "酷冷至尊 Q300L", "爱国者 YOGO M2", "金河田 预见 FM01", "鱼巢 S5MAX", "微星 碉堡 海景房"]);for(let i=K.length-1;i>=0;i--){if(!keep.has(K[i].n))K.splice(i,1);}}catch(e){}
  /* 电源 / 内存 / 硬盘：只留有代表性的 6~7 个品牌，砍掉同质化长尾。
     规则按品牌名前缀匹配（型号名以品牌开头）。 */
  try{
    /* 手机端目录收敛：先收敛品牌，再在每个品牌里只留一条产品线、砍掉冗余档位。
       电脑端不裁，保留全量。 */
    const cut=(arr,keep)=>{if(!keep)return;for(let i=arr.length-1;i>=0;i--){const x=arr[i];if(!x||!x.n)continue;if(!keep(x))arr.splice(i,1);}};

    /* ---------- 电源：7 个品牌 + 每品牌一条线 + 只留常见瓦数 ---------- */
    /* 品牌收敛，但每个品牌的「旗舰/中端/低端」几条线都要保留 ——
       否则同一品牌内部就没有档位差异了。只砍瓦数档。 */
    const PSU_BRAND=/^(海韵|振华|长城|鑫谷|先马|航嘉|九州风神|大水牛)/;
    /* 只收敛品牌，瓦数一档都不砍：200W 到 1600W 每个档位都要有货。 */
    cut(P,function(x){return PSU_BRAND.test(x.n);});

    /* ---------- 内存：11 个品牌（含套条/旗舰条），每品牌只留 6 个主力规格 ---------- */
    const RAM_BRAND=/^(金士顿|威刚|海盗船|光威|金百达|英睿达|铭瑄|科赋|十铨|阿斯加特|玖合)/;
    /* 同上：只收敛品牌。DDR3 1333 4G 到 DDR5 6000 64G 每一档都留着，
       频率/时序不同的条目继续保留，档位差异交给 assignTiers 比价。 */
    cut(M,function(x){return RAM_BRAND.test(x.n);});

    /* ---------- 硬盘：6 个品牌，每品牌留 6 个主容量 ---------- */
    const DISK_BRAND=/^(三星|西部数据|希捷|铠侠|致态|金士顿)/;
    /* 只收敛品牌，容量一档都不砍：
       SATA 固态 60G–8T、M.2 128G–8T、机械 320G–20T 每档都要有货。 */
    cut(ST,function(x){return DISK_BRAND.test(x.n);});
  }catch(e){}
  try{const keep2=new Set(["原装散热 Intel 下压", "AMD 原装幽灵散热", "九州风神 玄冰400", "酷冷至尊 T400i", "利民 AX120 R SE", "利民 AK120", "利民 PA120", "九州风神 大霜塔V5", "九州风神 AK620", "利民 FC140", "猫头鹰 NH-D15", "利民 水冷 240", "利民 水冷 360", "九州风神 冰堡垒360", "恩杰 Kraken 240", "服务器风冷 SP3", "服务器风冷 SP5", "LGA2011 专用风冷", "超频三 青鸟四", "九州风神 冰凌MINI", "乔思伯 CR-1000", "超频三 红海H4", "雅浚 B3", "ID-COOLING SE-224", "乔思伯 CR-2000", "超频三 巨浪360", "先马 XW240"]);for(let i=H.length-1;i>=0;i--){if(!keep2.has(H[i].n))H.splice(i,1);}}catch(e){}
},0);
const REAL_CASES=[{"n": "九尾狐 U1", "ff": ["MATX", "ITX"], "mg": 330, "mc": 165, "rad": 0, "bay": 2, "p": 27, "u": 15},{"n": "九尾狐 T13 海景房", "ff": ["MATX", "ITX"], "mg": 330, "mc": 160, "rad": 240, "bay": 2, "p": 48, "u": 20},{"n": "巧美 mini ITX 17×17", "ff": ["ITX"], "mg": 185, "mc": 70, "rad": 0, "bay": 1, "p": 44, "u": 19},{"n": "航嘉 暮光", "ff": ["MATX", "ITX"], "mg": 330, "mc": 165, "rad": 240, "bay": 2, "p": 70, "u": 30},{"n": "航嘉 S980 海景房", "ff": ["ATX", "MATX", "ITX"], "mg": 420, "mc": 175, "rad": 360, "bay": 4, "p": 239, "u": 101},{"n": "积至 家悦X1", "ff": ["MATX", "ITX"], "mg": 300, "mc": 155, "rad": 0, "bay": 2, "p": 34, "u": 16},{"n": "积至 坦克 侧透", "ff": ["ATX", "MATX", "ITX"], "mg": 340, "mc": 165, "rad": 240, "bay": 2, "p": 89, "u": 45},{"n": "硕一 麻雀 V200", "ff": ["MATX", "ITX"], "mg": 280, "mc": 160, "rad": 0, "bay": 2, "p": 57, "u": 25},{"n": "硕一 鲲鹏 CH9L", "ff": ["ATX", "MATX", "ITX"], "mg": 400, "mc": 165, "rad": 360, "bay": 2, "p": 254, "u": 134},{"n": "爱国者 YOGO T21 ATX", "ff": ["ATX", "MATX", "ITX"], "mg": 400, "mc": 170, "rad": 360, "bay": 3, "p": 239, "u": 106},{"n": "爱国者 星璨 岚/小岚", "ff": ["MATX", "ITX"], "mg": 370, "mc": 165, "rad": 240, "bay": 2, "p": 289, "u": 145},{"n": "迅钛 玄武 MINI 海景房", "ff": ["MATX", "ITX"], "mg": 330, "mc": 160, "rad": 240, "bay": 2, "p": 50, "u": 24},{"n": "迅钛 问境 M2", "ff": ["MATX", "ITX"], "mg": 300, "mc": 160, "rad": 0, "bay": 2, "p": 64, "u": 28},{"n": "金河田 预见 FM01", "ff": ["ATX", "MATX", "ITX"], "mg": 340, "mc": 165, "rad": 240, "bay": 2, "p": 109, "u": 46},{"n": "金河田 幻屿 海景房", "ff": ["MATX", "ITX"], "mg": 400, "mc": 170, "rad": 360, "bay": 3, "p": 304, "u": 143},{"n": "先马 黑洞PRO 黑洞X", "ff": ["ATX", "MATX"], "mg": 380, "mc": 170, "rad": 240, "bay": 3, "p": 249, "u": 118},{"n": "先马 平头哥 M9", "ff": ["MATX", "ITX"], "mg": 400, "mc": 165, "rad": 360, "bay": 3, "p": 428, "u": 223},{"n": "联力 L216 中塔", "ff": ["ATX", "MATX", "ITX"], "mg": 400, "mc": 170, "rad": 360, "bay": 3, "p": 269, "u": 147},{"n": "联力 O11D MINI V2", "ff": ["ATX", "MATX", "ITX"], "mg": 420, "mc": 175, "rad": 360, "bay": 4, "p": 449, "u": 248},{"n": "乔思伯 D300 海景房", "ff": ["MATX", "ITX"], "mg": 420, "mc": 175, "rad": 360, "bay": 3, "p": 455, "u": 233},{"n": "酷冷至尊 MF400 Mesh", "ff": ["MATX", "ITX"], "mg": 380, "mc": 170, "rad": 240, "bay": 2, "p": 722, "u": 360},{"n": "瓦尔基里 VK03 触屏", "ff": ["ATX", "MATX"], "mg": 420, "mc": 175, "rad": 360, "bay": 3, "p": 299, "u": 136},{"n": "瓦尔基里 VK03M 曲面", "ff": ["MATX", "ITX"], "mg": 400, "mc": 170, "rad": 360, "bay": 3, "p": 319, "u": 170},{"n": "微星 碉堡 海景房", "ff": ["MATX", "ITX"], "mg": 420, "mc": 175, "rad": 360, "bay": 3, "p": 423, "u": 180},{"n": "微星 300R/L PZ 悬浮", "ff": ["ATX", "MATX"], "mg": 420, "mc": 180, "rad": 360, "bay": 4, "p": 508, "u": 250},{"n": "华硕 PA602 创梦", "ff": ["ATX", "MATX"], "mg": 450, "mc": 185, "rad": 420, "bay": 4, "p": 489, "u": 232},{"n": "分形工艺 Epoch", "ff": ["ATX", "MATX"], "mg": 430, "mc": 180, "rad": 360, "bay": 4, "p": 599, "u": 301},{"n": "追风者 XT523", "ff": ["ATX", "MATX"], "mg": 420, "mc": 175, "rad": 360, "bay": 4, "p": 649, "u": 347},{"n": "银欣 SG02 HTPC 卧式", "ff": ["MATX", "ITX"], "mg": 300, "mc": 155, "rad": 0, "bay": 1, "p": 356, "u": 161},{"n": "超频三 创界 C3N300", "ff": ["MATX", "ITX"], "mg": 380, "mc": 170, "rad": 360, "bay": 3, "p": 463, "u": 203},{"n": "利民 A70", "ff": ["ATX", "MATX", "ITX"], "mg": 420, "mc": 168, "rad": 360, "bay": 2, "p": 479, "u": 246},{"n": "鑫谷 无尽 Pro+", "ff": ["EATX", "ATX", "MATX"], "mg": 400, "mc": 170, "rad": 360, "bay": 3, "p": 111, "u": 59},{"n": "Tt 启航者 S5 mini", "ff": ["ATX", "MATX", "ITX"], "mg": 330, "mc": 165, "rad": 240, "bay": 2, "p": 109, "u": 55},{"n": "大水牛 商悦 ATX", "ff": ["ATX", "MATX"], "mg": 280, "mc": 155, "rad": 240, "bay": 2, "p": 60, "u": 33},{"n": "华南金牌 双路海景房", "ff": ["EATX", "ATX", "MATX"], "mg": 420, "mc": 170, "rad": 240, "bay": 3, "p": 108, "u": 46},{"n": "玩嘉 孤勇者 雪", "ff": ["MATX", "ITX"], "mg": 330, "mc": 165, "rad": 240, "bay": 2, "p": 599, "u": 259},{"n": "鱼巢 S5MAX", "ff": ["MATX", "ITX"], "mg": 338, "mc": 155, "rad": 180, "bay": 2, "p": 288, "u": 132},{"n": "Sahara 太空舱 3", "ff": ["MATX", "ITX"], "mg": 330, "mc": 165, "rad": 240, "bay": 2, "p": 279, "u": 155},{"n": "动力火车 御浪 EATX", "ff": ["EATX", "ATX", "MATX"], "mg": 430, "mc": 180, "rad": 360, "bay": 4, "p": 268, "u": 133},{"n": "酷冷至尊 Q300L", "ff": ["MATX", "ITX"], "mg": 360, "mc": 157, "rad": 240, "bay": 1, "p": 299, "u": 80},{"n": "酷冷至尊 MB400L", "ff": ["MATX", "ITX"], "mg": 360, "mc": 160, "rad": 240, "bay": 2, "p": 119, "u": 49},{"n": "酷冷至尊 TD500 Mesh", "ff": ["EATX", "ATX", "MATX", "ITX"], "mg": 410, "mc": 165, "rad": 360, "bay": 2, "p": 298, "u": 99},{"n": "先马 平头哥M2", "ff": ["MATX", "ITX"], "mg": 330, "mc": 160, "rad": 240, "bay": 2, "p": 109, "u": 35},{"n": "先马 趣造2", "ff": ["MATX", "ITX"], "mg": 355, "mc": 166, "rad": 280, "bay": 4, "p": 84, "u": 45},{"n": "先马 黑洞5", "ff": ["ATX", "MATX"], "mg": 400, "mc": 170, "rad": 360, "bay": 3, "p": 175, "u": 96},{"n": "先马 鲁班1", "ff": ["ATX", "MATX", "ITX"], "mg": 350, "mc": 165, "rad": 240, "bay": 2, "p": 140, "u": 50},{"n": "爱国者 星璨 岚", "ff": ["MATX", "ITX"], "mg": 390, "mc": 170, "rad": 360, "bay": 2, "p": 57, "u": 52},{"n": "爱国者 破晓X", "ff": ["ATX", "MATX"], "mg": 400, "mc": 170, "rad": 360, "bay": 3, "p": 121, "u": 100},{"n": "爱国者 YOGO M2", "ff": ["ATX", "MATX"], "mg": 330, "mc": 160, "rad": 240, "bay": 2, "p": 130, "u": 50},{"n": "乔思伯 D31", "ff": ["ATX", "MATX", "ITX"], "mg": 400, "mc": 168, "rad": 360, "bay": 1, "p": 283, "u": 80},{"n": "乔思伯 C6", "ff": ["MATX", "ITX"], "mg": 330, "mc": 165, "rad": 240, "bay": 2, "p": 145, "u": 92},{"n": "乔思伯 A4", "ff": ["ITX"], "mg": 325, "mc": 55, "rad": 0, "bay": 1, "p": 354, "u": 194},{"n": "乔思伯 U4", "ff": ["ATX", "MATX"], "mg": 350, "mc": 170, "rad": 240, "bay": 2, "p": 140, "u": 94},{"n": "联力 216", "ff": ["ATX", "MATX", "ITX"], "mg": 400, "mc": 170, "rad": 360, "bay": 3, "p": 391, "u": 229},{"n": "联力 O11 Dynamic", "ff": ["EATX", "ATX", "MATX"], "mg": 420, "mc": 175, "rad": 360, "bay": 4, "p": 547, "u": 301},{"n": "长城 阿基米德KM-1", "ff": ["ATX", "MATX", "ITX"], "mg": 350, "mc": 165, "rad": 240, "bay": 2, "p": 109, "u": 60},{"n": "鑫谷 拉克斯", "ff": ["ATX", "MATX"], "mg": 330, "mc": 160, "rad": 240, "bay": 2, "p": 106, "u": 62},{"n": "银欣 FARA R1", "ff": ["ATX", "MATX"], "mg": 355, "mc": 165, "rad": 240, "bay": 2, "p": 499, "u": 275},{"n": "安钛克 NX200M", "ff": ["MATX", "ITX"], "mg": 290, "mc": 165, "rad": 0, "bay": 2, "p": 312, "u": 172},{"n": "航嘉 S920", "ff": ["ATX", "MATX", "ITX"], "mg": 360, "mc": 170, "rad": 240, "bay": 3, "p": 128, "u": 42},{"n": "大水牛 追风者", "ff": ["ATX", "MATX"], "mg": 330, "mc": 160, "rad": 240, "bay": 2, "p": 77, "u": 20},{"n": "海盗船 4000D", "ff": ["ATX", "MATX", "ITX"], "mg": 360, "mc": 170, "rad": 360, "bay": 2, "p": 191, "u": 174},{"n": "乔思伯 N3 NAS", "ff": ["ITX"], "mg": 250, "mc": 130, "rad": 0, "bay": 8, "p": 583, "u": 233},{"n": "追风者 NV5", "ff": ["EATX", "ATX", "MATX", "ITX"], "mg": 415, "mc": 184, "rad": 360, "bay": 2, "p": 221, "u": 128},{"n": "分形工艺 North", "ff": ["ATX", "MATX", "ITX"], "mg": 355, "mc": 170, "rad": 360, "bay": 2, "p": 899, "u": 560},{"n": "NAS 8 盘位机箱", "ff": ["ITX", "MATX"], "mg": 250, "mc": 145, "rad": 0, "bay": 8, "p": 279, "u": 173},{"n": "NAS 12 盘位机箱", "ff": ["ITX", "MATX"], "mg": 280, "mc": 145, "rad": 0, "bay": 12, "p": 484, "u": 300},{"n": "8 盘位工作站塔", "ff": ["EATX", "ATX", "MATX"], "mg": 400, "mc": 170, "rad": 360, "bay": 8, "p": 523, "u": 324},{"n": "NZXT H5 Flow", "ff": ["ATX", "MATX", "ITX"], "mg": 365, "mc": 165, "rad": 240, "bay": 1, "p": 349}];
const REAL_COOLS=[{"n":"原装散热 Intel 下压","cap":65,"h":50,"rad":0,"s":["LGA1155","LGA1150","LGA1151","LGA1200"],"p":25,"u":10},{"n":"AMD 原装幽灵散热","cap":65,"h":55,"rad":0,"s":["AM4","AM5"],"p":35,"u":15},{"n":"超频三 青鸟四","cap":95,"h":125,"rad":0,"s":["LGA1155","LGA1150","LGA1151","LGA1200","AM4"],"p":35,"u":12},{"n":"九州风神 冰凌MINI","cap":95,"h":130,"rad":0,"s":["LGA1155","LGA1150","LGA1151","LGA1200","AM4"],"p":40,"u":16},{"n":"酷冷至尊 T400i","cap":150,"h":155,"rad":0,"s":["LGA1155","LGA1150","LGA1151","LGA1200","LGA1700","LGA1851","AM4","AM5"],"p":89,"u":53},{"n":"利民 AX120 R SE","cap":160,"h":155,"rad":0,"s":["LGA1155","LGA1150","LGA1151","LGA1200","LGA1700","LGA1851","AM4","AM5"],"p":79,"u":47},{"n":"利民 AK120","cap":180,"h":155,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":129,"u":77},{"n":"利民 PA120","cap":220,"h":157,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":199,"u":119},{"n":"利民 FC140","cap":265,"h":158,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":299,"u":179},{"n":"九州风神 玄冰400","cap":130,"h":158,"rad":0,"s":["LGA1155","LGA1150","LGA1151","LGA1200","LGA1700","LGA1851","AM4"],"p":69,"u":41},{"n":"九州风神 大霜塔V5","cap":250,"h":158,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":229,"u":137},{"n":"九州风神 AK620","cap":240,"h":160,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":249,"u":149},{"n":"超频三 红海H4","cap":120,"h":145,"rad":0,"s":["LGA1155","LGA1150","LGA1151","LGA1200","AM4"],"p":49,"u":29},{"n":"超频三 蜂鸟H3","cap":160,"h":150,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":89,"u":53},{"n":"乔思伯 CR-1000","cap":130,"h":150,"rad":0,"s":["LGA1155","LGA1150","LGA1151","LGA1200","LGA1700","LGA1851","AM4"],"p":79,"u":47},{"n":"乔思伯 CR-2000","cap":200,"h":160,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":159,"u":95},{"n":"猫头鹰 NH-D15","cap":250,"h":165,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":749,"u":449},{"n":"猫头鹰 NH-U12S","cap":180,"h":158,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":549,"u":329},{"n":"雅浚 B3","cap":160,"h":153,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":89,"u":53},{"n":"采融 风神AQ","cap":200,"h":155,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":129,"u":77},{"n":"大镰刀 无限5","cap":240,"h":158,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":199,"u":119},{"n":"ID-COOLING SE-224","cap":180,"h":154,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":99,"u":59},{"n":"利民 水冷 240","cap":250,"h":55,"rad":240,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":299,"u":179},{"n":"利民 水冷 360","cap":300,"h":55,"rad":360,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":469,"u":281},{"n":"九州风神 冰堡垒360","cap":320,"h":55,"rad":360,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":799,"u":479},{"n":"瓦尔基里 E360","cap":350,"h":55,"rad":360,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":999,"u":599},{"n":"恩杰 Kraken 240","cap":280,"h":55,"rad":240,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":999,"u":599},{"n":"酷冷至尊 ML240L","cap":250,"h":55,"rad":240,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":449,"u":269},{"n":"超频三 巨浪360","cap":300,"h":55,"rad":360,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":399,"u":239},{"n":"乔思伯 HX6250","cap":300,"h":55,"rad":360,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":599,"u":359},{"n":"先马 XW240","cap":250,"h":55,"rad":240,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":299,"u":179},{"n":"追风者 冰灵360","cap":300,"h":55,"rad":360,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":699,"u":419},{"n":"几何未来 M360","cap":300,"h":55,"rad":360,"s":["LGA1700","LGA1851","LGA1200","AM4","AM5"],"p":599,"u":359},{"n":"酷冷至尊 暴雪T520","cap":180,"h":158,"rad":0,"s":["LGA1700","LGA1851","LGA1200","AM4"],"p":169,"u":101}];
const REAL_COOLS_EXTRA=[{"n":"服务器风冷 SP3","cap":400,"h":120,"rad":0,"s":["SP3","SP5","LGA2011","LGA2011-3"],"p":400,"u":300},{"n":"服务器风冷 SP5","cap":450,"h":125,"rad":0,"s":["SP3","SP5"],"p":600,"u":450},{"n":"LGA2011 专用风冷","cap":300,"h":140,"rad":0,"s":["LGA2011","LGA2011-3"],"p":300,"u":225}];
K.length=0;REAL_CASES.forEach(x=>K.push(x));
K.forEach(k=>{const ru=rngFrom(hash('ku2'+k.n))();k.u=Math.max(15,Math.min(360,Math.round(k.p*(0.42+ru*0.14))));});
/* 散热限高校准：中塔/办公箱实际都能吃 155mm 风冷，之前 150 会把主流散热挡在门外 */
K.forEach(k=>{if(k.mc>=120&&k.mc<155)k.mc=155;});
H.length=0;REAL_COOLS.forEach(x=>H.push(x));
/* 水冷兼容 HEDT/服务器大底座平台（游戏内简化处理） */
H.forEach(h=>{if(h.rad>0){['LGA2066','TR4','sTR5','TRX40','SP3','SP5'].forEach(_s=>{if(!h.s.includes(_s))h.s.push(_s);});}});REAL_COOLS_EXTRA.forEach(x=>H.push(x));
const ST=[];
['三星','西部数据','金士顿','致态','铠侠','英睿达','光威','梵想','雷克沙','影驰','海康威视','联想','惠普','东芝','建兴','闪迪'].forEach((br)=>{
  [[60,40],[120,75],[240,120],[480,150],[960,300],[2000,620],[4000,1300],[8000,2600]].forEach(([cap,base],ci)=>{
    const rj=rngFrom(hash(br+ci)),price=R2(base*(0.85+rj()*0.35),1);
    ST.push({n:`${br} SATA SSD ${cap>=1000?(cap/1000)+'T':cap+'G'}`,kind:'sata',cap,
      p:jitter(price,'s'+br+ci),u:jitter(R2(price*0.6,1),'su'+br+ci)});
  });
});
['三星','西部数据','致态','铠侠','金士顿','英睿达','光威','雷克沙'].forEach((br)=>{
  [[128,150],[256,240],[512,430],[1000,680],[2000,1500],[4000,3000],[8000,6500]].forEach(([cap,base],ci)=>{
    const rj=rngFrom(hash(br+'n'+ci)),price=R2(base*(0.85+rj()*0.4),1);
    ST.push({n:`${br} NVMe ${cap>=1000?(cap/1000)+'T':cap+'G'}`,kind:'m2',cap,
      p:jitter(price,'n'+br+ci),u:jitter(R2(price*0.65,1),'nu'+br+ci)});
  });
});
['西部数据','希捷','东芝'].forEach((br)=>{
  [[320,40],[500,60],[1000,430],[2000,580],[4000,980],[8000,2800],[16000,4100],[20000,5400]].forEach(([cap,base],ci)=>{
    const rj=rngFrom(hash(br+'h'+ci)),price=R2(base*(0.9+rj()*0.3),1);
    ST.push({n:`${br} HDD ${cap>=1000?(cap/1000)+'T':cap+'G'}`,kind:'hdd',cap,
      p:ci<2?null:jitter(price,'d'+br+ci),u:jitter(ci<2?base:R2(price*0.6,1),'du'+br+ci)});
  });
});

/* ================= 口碑系统 =================
   第三周（第 15 天）开始实行「客户会验机」：
   - 交付不再被兼容性检查卡住，你可以硬交一台不达标的机器
   - 但客户有大几率自己发现（分数不够 / 电源带不动 / 装不上）
   - 被发现的单进 10 单滚动记录，同一批里问题越多，扣得越狠
   - 长期达标口碑回升，最高 5 星；星级越高，找上门的单越多
   - 5 星附近额外订单由伙计代做，直接体现为每日报表里的「额外订单收入」
   - 口碑掉到 1 星附近就倒闭 */
const REP_UNLOCK_DAY=15;
const REP_MIN=1.0, REP_MAX=5.0, REP_BUST=1.2;
const REP_NAMES=['','1 星','2 星','3 星','4 星','5 星'];
function repUnlocked(){return (state.day||1)>=REP_UNLOCK_DAY;}
function repScore(){return (state.rep&&typeof state.rep.score==='number')?state.rep.score:3;}
function repStars(){return Math.max(1,Math.min(5,Math.round(repScore())));}
function repLabel(){
  const s=repStars();
  return REP_NAMES[s]+' '+('★'.repeat(s))+'☆'.repeat(5-s);
}
function repBadCount(){
  const log=(state.rep&&state.rep.log)||[];
  return log.slice(-10).filter(x=>!x).length;
}
/* 被发现的概率：10 单里已经有过 2 次，这次就更容易被抓 */
function repCatchChance(){
  return Math.min(0.92,0.55+0.07*repBadCount());
}
function repApply(ok){
  const r=state.rep||(state.rep={score:3,log:[],bad:0});
  r.log=r.log||[];
  r.log.push(!!ok);
  if(r.log.length>10)r.log=r.log.slice(-10);
  const bad=repBadCount();
  if(ok){
    /* 连续达标涨得快一些，越接近 5 星涨得越慢 */
    const gain=repScore()>=4.5?0.06:0.12;
    r.score=Math.min(REP_MAX,r.score+gain);
  }else{
    r.score=Math.max(REP_MIN,r.score-(0.28+0.12*bad));
  }
  r.bad=bad;
  return r.score;
}
/* 今天会有几单找上门 */
function repOrderCount(rand){
  const s=repStars();
  if(!repUnlocked())return 3+Math.floor(rand()*2);
  if(s>=5)return 4+Math.floor(rand()*2);
  if(s>=4)return 3+Math.floor(rand()*2);
  if(s>=3)return 3+Math.floor(rand()*1);
  if(s>=2)return 2+Math.floor(rand()*1);
  return 1;
}
/* 伙计代做的额外订单：只有接近 5 星才有 */
function repSideBusiness(){
  if(!repUnlocked())return {orders:0,income:0};
  const s=repStars();
  if(s<4)return {orders:0,income:0};
  const n=(s>=5?2:1)+Math.floor(Math.random()*2);
  const per=70+Math.floor(Math.random()*50);
  return {orders:n,income:n*per};
}

/* ================= 停产判定 =================
   现实里这些平台早就停线了：商店还能挂「全新」是假货。统一把 p 置空，
   商店就只剩「二手」一档（列表上显示「停产 · 只有二手」）。
   判断标准按平台断代，不逐型号写： */
(function markDiscontinued(){
  const deadSock=new Set(['LGA775','LGA1156','LGA1366','LGA1155','LGA1150','LGA2011','LGA2011-3',
    'AM2','AM2+','AM3','AM3+','FM1','FM2','FM2+','TR4','SP3']);
  C.forEach(c=>{if(deadSock.has(c.s))c.p=null;});          /* CPU */
  /* 老平台的全新货只来自劲鲨/精粤/华南这类品牌，价格是「全新库存板」行情 */
  const deadBoardSock=new Set([...deadSock].filter(x=>!['LGA1155','LGA1150','LGA1151','LGA2011-3'].includes(x)));
  B.forEach(b=>{if(deadBoardSock.has(b.s))b.p=null;});          /* 主板 */
  /* 1155：全新只有劲鲨/精粤，二手按实拍型号价 */
  const NEW_BOARD_P={'劲鲨 H61M-I':123,'精粤 H61M-G':168,'精粤 B75M-VH PLUS':228,'华南 B75':195};
  const U1155={
    '劲鲨 H61M-I':45,'精粤 H61M-G':45,'华硕 P8H61-M LX':45,'技嘉 GA-H61M-S2P':42,'微星 H61M-P31':45,
    '精粤 B75M-VH PLUS':79,'华南 B75':79,'华南金牌 B75':79,'华硕 P8B75-M':84,'技嘉 B75M-D3V':79,'华擎 B75M-DGS':69,
    '华硕 P8Z77-V LX':97,'技嘉 Z77X-D3H':93,'微星 Z77A-G43':85,'华擎 Z77 Extreme4':78,'七彩虹 战斧C.Z77 V20':78
  };
  const NEW1150={'劲鲨 B85M-K':143,'精粤 H97M-VH PLUS':249,'精粤 H97I-PLUS':249,'精粤 H81M-H':189,'精粤 B85M-VDH':199,'铭瑄 B85M-VDH R2.0':175,
    '华南 B85':215,'华南 B85-ITX':255,'华南 H81 PLUS':225,'华南 H97-ZD3':284,'华南 B75':195};
  const U1150={'华硕 H81M-K':61,'技嘉 H81M-DS2':58,'微星 H81M-P33':61,'华擎 H81M-VG4':58,
    '华硕 Z97-A':185,'技嘉 Z97X-UD3H':146,'微星 Z97-G43':205,'华擎 Z97 Extreme4':140,'七彩虹 战斧C.Z97 X5':135,
    '华硕 B85M-G':73,'技嘉 B85M-D3H':71,'微星 B85M-E45':68,
    '华硕 H97M-E':93,'技嘉 H97M-D3H':88,'微星 H97M-G43':85};
  B.forEach(b=>{
    if(b.s==='LGA1155'){
      if(U1155[b.n]!=null)b.u=U1155[b.n];
      b.p=NEW_BOARD_P[b.n]!=null?NEW_BOARD_P[b.n]:null;
      if(NEW_BOARD_P[b.n]!=null)b.u=null;      /* 新板品牌：只挂全新价 */
      return;
    }
    if(b.s==='LGA1150'){
      if(NEW1150[b.n]!=null){b.p=NEW1150[b.n];b.u=null;}   /* 新板品牌：只挂全新价 */
      else {b.p=null;if(U1150[b.n]!=null)b.u=U1150[b.n];}  /* 其余二手实价 */
    }
  });
  /* 精粤/劲鲨是新板品牌，只有全新货，不挂二手价 */
  /* 官网友情参数覆盖（子代理逐款核实） */
  const MB_SPEC_FIX={
'微星 H410M PRO':["MATX", 2, 64, 1, 4, 2],
'微星 B460M MORTAR':["MATX", 4, 128, 2, 6, 5],
'微星 MPG Z490 GAMING PLUS':["ATX", 4, 128, 2, 6, 5],
'微星 TRX40 PRO':["ATX", 8, 256, 2, 8, 5],
'微星 970A-G43':["ATX", 4, 32, 0, 6, 4],
'微星 990FXA-GD65':["ATX", 4, 32, 0, 6, 6],
'技嘉 H410M-H':["MATX", 2, 64, 1, 4, 3],
'超微 H11DSi':["EATX", 16, 2048, 1, 10, 5],
'华硕 PRIME A320M-K':["MATX", 2, 64, 1, 4, 3],
'技嘉 A320M-S2H':["MATX", 2, 32, 1, 4, 3],
'微星 A320M-A PRO':["MATX", 2, 32, 0, 4, 3],
'华擎 A320M-HDV':["MATX", 2, 32, 1, 4, 2],
'技嘉 B450M DS3H':["MATX", 4, 64, 1, 4, 3],
'微星 B450M MORTAR':["MATX", 4, 128, 2, 4, 4],
'华擎 B450M Pro4':["MATX", 4, 128, 2, 4, 3],
'华硕 TUF B550M-PLUS':["MATX", 4, 128, 2, 4, 3],
'技嘉 B550M AORUS ELITE':["MATX", 4, 128, 2, 4, 3],
'微星 B550M MORTAR':["MATX", 4, 128, 2, 6, 4],
'华硕 TUF X570-PLUS':["ATX", 4, 128, 2, 8, 5],
'微星 MPG X570 GAMING EDGE':["ATX", 4, 128, 2, 6, 5],
'华擎 X570 Steel Legend':["ATX", 4, 128, 2, 8, 5],
'七彩虹 CVN X570':["ATX", 4, 64, 2, null, 6],
'华硕 PRIME A620M-K':["MATX", 2, 96, 1, 4, 2],
'微星 PRO A620M-E':["MATX", 2, 128, 1, 4, 2],
'华硕 TUF B650M-PLUS':["MATX", 4, 256, 2, 4, 3],
'技嘉 B650M DS3H':["MATX", 4, 192, 2, 4, 2],
'微星 B650M MORTAR':["MATX", 4, 256, 2, 6, 3],
'华擎 B650M Pro RS':["MATX", 4, 256, 3, 4, 2],
'微星 MPG X670E CARBON':["ATX", 4, 256, 4, 6, 3],
'华擎 X670E Taichi':["EATX", 4, 256, 4, 8, 2],
'华硕 P8H61-M LX':["MATX", 2, 16, 0, 4, 4],
'技嘉 GA-H61M-S2P':["MATX", 2, 16, 0, 4, 2],
'微星 H61M-P31':["MATX", 2, 16, 0, 4, 2],
'精粤 H61M-G':["MATX", 2, 16, 0, 4, 2],
'华硕 P8B75-M':["MATX", 4, 32, 0, 6, 2],
'技嘉 B75M-D3V':["MATX", 2, 16, 0, 6, 3],
'华擎 B75M-DGS':["MATX", 2, 16, 0, 4, 2],
'华南 B75':["MATX", 2, 16, 0, 4, 2],
'精粤 B75M-VH PLUS':["MATX", 2, 16, 1, 4, 2],
'华擎 Z77 Extreme4':["ATX", 4, 32, 0, 8, 4],
'华硕 P8Z77-V LX':["ATX", 4, 32, 0, 6, 4],
'技嘉 Z77X-D3H':["ATX", 4, 32, 0, 4, 6],
'微星 Z77A-G43':["ATX", 4, 32, 0, 6, 3],
'华硕 H81M-K':["MATX", 2, 16, 0, 4, 3],
'技嘉 H81M-DS2':["MATX", 2, 16, 0, 4, 3],
'微星 H81M-P33':["MATX", 2, 16, 0, 4, 2],
'华擎 H81M-VG4':["MATX", 2, 16, 0, 4, 2],
'精粤 H81M-H':["MATX", 2, 16, 2, 3, 2],
'华南 H81 PLUS':["MATX", 2, 16, 1, 4, 2],
'华硕 B85M-G':["MATX", 4, 32, 0, 6, 3],
'技嘉 B85M-D3H':["MATX", 4, 32, 0, 6, 2],
'微星 B85M-E45':["MATX", 4, 32, 0, 6, 3],
'精粤 B85M-VDH':["MATX", 2, 16, 1, 4, 2],
'华南 B85':["MATX", 2, 16, 1, 4, 2],
'华南 B85-ITX':["ITX", 2, 16, 1, 4, 1],
'华硕 H97M-E':["MATX", 4, 32, 1, 6, 1],
'技嘉 H97M-D3H':["MATX", 4, 32, 0, 6, 2],
'精粤 H97M-VH PLUS':["MATX", 2, 32, 1, 4, 2],
'精粤 H97I-PLUS':["ITX", 2, 16, 1, 4, 1],
'华硕 Z97-A':["ATX", 4, 32, 1, 4, 5],
'技嘉 Z97X-UD3H':["ATX", 4, 32, 1, 6, 6],
'七彩虹 战斧C.Z97 X5':["ATX", 4, 32, 0, 5, 2],
'华硕 PRIME B250M-K':["MATX", 2, 32, 1, 6, 3],
'技嘉 B250M-D3H':["MATX", 4, 64, 1, 6, 2],
'微星 B250M PRO-VD':["MATX", 2, 32, 1, 6, 3],
'华擎 B250M-HDV':["MATX", 2, 32, 1, 6, 3],
'华硕 ROG STRIX Z270E':["ATX", 4, 64, 2, 6, 7],
'技嘉 Z270X-UD3':["ATX", 4, 64, 1, 6, 6],
'微星 Z270 GAMING PRO':["ATX", 4, 64, 2, 6, 6],
'华擎 Z270 Extreme4':["ATX", 4, 64, 2, 6, 6],
'七彩虹 战斧C.Z270':["ATX", 4, 64, 2, 5, 4],
'华硕 PRIME B360M-K':["MATX", 2, 32, 1, 6, 3],
'技嘉 B360M-DS3H':["MATX", 4, 64, 1, 6, 3],
'微星 B360M MORTAR':["MATX", 4, 64, 2, 4, 4],
'华擎 B360M Pro4':["MATX", 4, 64, 2, 6, 4],
'铭瑄 MS-挑战者 B360M':["MATX", 2, null, 2, 5, 2],
'技嘉 Z390 AORUS ELITE':["ATX", 4, 64, 2, 6, 6],
'华擎 Z390 Taichi':["ATX", 4, 64, 3, 8, 5],
'七彩虹 CVN Z390M':["MATX", 4, 64, 3, 5, 3],
'华硕 PRIME H610M-E D4':["MATX", 2, 64, 2, 4, 2, "DDR4"],
'技嘉 H610M H':["MATX", 2, 128, 1, 4, 2],
'微星 PRO H610M-E':["MATX", 2, 64, 1, 4, 2],
'华擎 H610M-HDV':["MATX", 2, 64, 0, 4, 2],
'铭瑄 MS-挑战者 H610M':["MATX", 2, 64, 1, 3, 2],
'华硕 EX-B660M-V5 D4':["MATX", 2, 64, 2, 4, 3, "DDR4"],
'技嘉 B660M DS3H':["MATX", 4, 128, 2, 4, 3],
'微星 PRO B660M-A':["MATX", 4, 128, 2, 4, 3],
'华擎 B660M Pro RS':["MATX", 4, 128, 2, 4, 3],
'铭瑄 MS-挑战者 B660M-K':["MATX", 2, 64, 1, 3, 2, "DDR4"],
'华硕 PRIME B760M-K D4':["MATX", 2, 64, 2, 4, 3, "DDR4"],
'技嘉 B760M DS3H':["MATX", 4, 192, 2, 4, 3],
'微星 MAG B760M MORTAR WIFI D5':["MATX", 4, 256, 2, 4, 3, "DDR5"],
'华擎 B760M Pro RS':["MATX", 4, 256, 3, 4, 2],
'华硕 ROG STRIX Z790-A GAMING WIFI':["ATX", 4, 192, 4, 4, 4, "DDR5"],
'技嘉 Z790 AORUS ELITE':["ATX", 4, 192, 4, 6, 3],
'微星 MPG Z790 EDGE WIFI':["ATX", 4, 256, 5, 7, 3, "DDR5"],
'华擎 Z790 Steel Legend WiFi':["ATX", 4, 256, 5, 8, 3, "DDR5"],
'七彩虹 CVN Z790D5 GAMING FROZEN V20':["ATX", 4, 192, 4, 6, 4, "DDR5"],
'华硕 TUF GAMING B860M-PLUS WIFI':["MATX", 4, 256, 3, 4, 2, "DDR5"],
'技嘉 B860M DS3H':["MATX", 4, 256, 2, 4, 3],
'微星 PRO B860M-B WIFI':["MATX", 2, 128, 2, 4, 2, "DDR5"],
'华擎 B860M Pro RS':["MATX", 4, 256, 3, 4, 2],
'华硕 ROG STRIX Z890-A':["ATX", 4, 256, 5, 4, 2],
'技嘉 Z890 AORUS ELITE':["ATX", 4, 256, 4, 4, 3],
'微星 MPG Z890 EDGE':["ATX", 4, 256, 5, 4, 3],
'华擎 Z890 Steel Legend':["ATX", 4, 256, 4, 4, 3],
'七彩虹 CVN Z890M':["MATX", 4, 192, 5, 4, 2],
'劲鲨 H61M-I':["ITX", null, null, 1, null, null],
'七彩虹 断剑C.A320M':["MATX", 2, 32, 0, 4, 2],
'华硕 TUF B450M-PRO':["MATX", 4, 128, 2, 6, 2],
'华擎 A620M-HDV':["MATX", 2, 128, 2, 2, 3],
'华硕 PRIME H410M-K':["MATX", 2, 64, 1, 4, 3],
'华擎 H410M-HDV':["MATX", 2, 64, 0, 4, 1],
'铭瑄 MS-挑战者 H410M':["MATX", 2, 64, 1, 3, 2],
'华硕 PRIME B460M-K':["MATX", 2, 64, 1, 6, 3],
'技嘉 B460M-DS3H':["MATX", 4, 128, 1, 6, 3],
'华擎 B460M Pro4':["MATX", 4, 128, 3, 6, 3],
'铭瑄 MS-挑战者 B460M':["MATX", 2, 32, 2, 5, 2],
'华硕 ROG STRIX Z490-A':["ATX", 4, 128, 2, 6, 5],
'技嘉 Z490 AORUS ELITE':["ATX", 4, 128, 2, 6, 4],
'华擎 Z490 Extreme4':["ATX", 4, 128, 3, 6, 5],
'精粤 X99M-D3':["MATX", 4, 64, 1, 3, 2],
'精粤 X99M-D3 ARGB':["MATX", 4, 128, 2, 4, 3],
'精粤 X99M-D4':["null", null, 256, 2, 6, 2],
'华南 X99-CD3':["ATX", 4, 128, 1, 8, 5],
'精粤 X99-TI':["ATX", 4, 128, 2, 6, 5],
'华南 X99-F8':["ATX", 8, 256, 2, 8, 5],
'精粤 X99-TI D3 PLUS':["ATX", 4, 128, 2, 8, 5],
'华南 X99-8D4':["EATX", 8, 256, 2, 6, 3],
'华硕 ROG ZENITH II EXTREME':["EATX", 8, 256, 4, 8, 4],
'技嘉 TRX40 AORUS MASTER':["EATX", 8, 256, 3, 8, 4],
'华擎 TRX40 Creator':["ATX", 8, 256, 3, 8, 4],
'华硕 KRPA-U16':["EATX", 16, 2048, 0, 4, 3],
'超微 H11SSL-i':["ATX", 8, 1024, 1, 16, 3],
'超微 H12SSL-i':["ATX", 8, 2048, 2, 8, 5],
'超微 H13SSL-N':["ATX", 12, 3072, 2, 8, 3],
'华硕 K14PA-U12':["EATX", 12, 3072, 1, 0, 0],
'超微 H13DSH':["EATX", 24, 6144, 2, 32, 2],
'华硕 M5A97':["ATX", 4, 32, 0, 6, 4],
'技嘉 970A-DS3P':["ATX", 4, 32, 0, 6, 5],
'华擎 970 Pro3':["ATX", 4, 64, 0, 6, 3],
'七彩虹 战斧C.A970 X5':["ATX", 4, null, 0, 6, null],
'华硕 CROSSHAIR V FORMULA':["ATX", 4, 32, 0, 6, 5],
'技嘉 990FXA-UD3':["ATX", 4, 32, 0, 8, 6],
'华擎 990FX Extreme3':["ATX", 4, 64, 0, 5, 4],
'华硕 Z170-D4':["ATX", 4, 64, 1, 6, 6],
'技嘉 H310M':["MATX", 2, 32, 1, 4, 3],
'华硕 H310M':["MATX", 2, 32, 0, 4, 3],
'华南 H311-VHD3':["MATX", 2, 16, 1, 4, 2],
'华南 H311-D3':["MATX", 2, 16, 1, 4, 2],
'华硕 Z170-AR':["ATX", 4, 64, 1, 6, 6],
'精粤 X99M-D D3':["MATX", 4, 64, 1, 3, 2],
'精粤 X99M-G D3 ARGB':["MATX", 4, 128, 2, 4, 3],
'精粤 X99M GAMING D3/ARGB':["MATX", 4, 128, 2, 4, 3],
'精粤 X99M-G D4/ARGB':["MATX", 4, 128, 2, 6, 2],
'精粤 X99M GAMING D4/ARGB':["MATX", 4, 128, 2, 4, 3],
'精粤 X99M-G D3 ARGB V2':["MATX", 4, 128, 2, 4, 3],
'精粤 X99-TI D4 PLUS':["ATX", 4, 128, 2, 6, 5],
'华南 X99-4MT':["MATX", 4, 128, 1, 3, 2],
'华南 X99-4MF':["MATX", 4, 128, 1, 3, 2],
'华南 X99-MTF':["MATX", 4, 64, 1, 4, 3],
'华南 X99M-F':["MATX", 2, 64, 1, 3, 2],
'华南 X99M-HD3':["MATX", 4, 128, 1, 3, 2],
'华南 X99-P4T':["MATX", 4, 128, 2, 4, 2],
'华南 X99-CD4':["ATX", 4, 128, 1, 8, 5],
'华南 X99-T8':["ATX", 8, 256, 2, 8, 5],
'华南 X99-TD3':["ATX", 4, 128, 2, 6, 4],
'华南 X99-8D3':["EATX", 8, 256, 2, 6, 3],
'华南 X99-8D':["EATX", 8, 512, 1, 10, 4],
'华南 X99-TF':["ATX", 8, 128, 2, 8, 5],
'华南 X99-F8 V6.0':["ATX", 8, 256, 2, 8, 5],
'华南 X99-CD4 GAMING':["ATX", 4, 128, 1, 8, 5],
'华南 X99-CD3 GAMING':["ATX", 4, 128, 1, 8, 5],
'华南 X99-T8 GAMING V6.0':["ATX", 8, 256, 2, 8, 5],
'华南 X99-TF GAMING V6.0':["ATX", 8, 128, 2, 8, 5],
'华南 X99-4MT V2.0':["MATX", 4, 128, 1, 3, 1],
'华南 X99-4MF PLUS':["MATX", 4, 128, 1, 3, 2],
'华南 X99-8D3 PRO':["EATX", 8, 256, 2, 6, 3],
'华南 X10X99-8D':["EATX", 8, 512, 1, 10, 4],
'华南 X99-MTF V1.0':["MATX", 4, 64, 1, 4, 3],
'华南 H311 VHD3':["MATX", 2, 16, 1, 4, 2],
'华南 H311-D3 V2.0':["MATX", 2, 16, 1, 4, 2],
'华硕 ROG ZENITH EXTREME':["EATX", 8, 128, 2, 8, 4],
'技嘉 X399 AORUS XTREME':["EATX", 8, 128, 2, 8, 4],
'华硕 X99-A II':["ATX", 8, 128, 1, 8, 4],
'技嘉 X99-UD4':["ATX", 8, 128, 1, 10, 4],
'微星 X99A SLI PLUS':["ATX", 8, 128, 2, 10, 4],
'华擎 X99 Taichi':["ATX", 8, 128, 2, 10, 3],
'铭瑄 MS-Terminator B760M D4':["MATX", 4, 128, 3, 4, 2, "DDR4"],
'华硕 PRIME H610M-F D4':["MATX", 2, 64, 1, 4, 2, "DDR4"],
'昂达 H610-VH4-B':["MATX", 2, 64, 1, 3, 2, "DDR4"],
'精粤 H610M-D PLUS':["MATX", 2, 64, 2, 4, 2, "DDR4"],
'精粤 H610M-K':["MATX", 2, 64, 2, 3, 2, "DDR4"],
'精粤 H610M-E':["MATX", 2, 64, 2, 3, 2, "DDR4"],
'精粤 H610M-GAMING':["MATX", 2, 64, 2, 4, 2, "DDR4"],
'精粤 H610M-GAMING WIFI':["MATX", 2, 64, 2, 4, 2, "DDR4"],
'铭瑄 MS-挑战者 B660M-F':["MATX", 2, 64, 1, 3, 2, "DDR4"],
'七彩虹 网驰 B660M-G DELUXE V20':["MATX", 2, 64, 2, 4, 2, "DDR4"],
'华硕 B660M-T D4':["MATX", 2, 64, 1, 4, 3, "DDR4"],
'华硕 EX-B660M-V5 PRO D4':["MATX", 2, 64, 2, 4, 3, "DDR4"],
'华硕 EX-B760M-V5 D4':["MATX", 2, 64, 2, 4, 3, "DDR4"],
'华硕 B760M-AYW WIFI D4':["MATX", 2, 64, 2, 4, 3, "DDR4"],
'昂达 B760E-B':["MATX", 2, 64, 1, 4, 2, "DDR4"],
'华硕 A620M-AYW WIFI':["MATX", 2, 128, 2, 4, 2, "DDR5"],
'华硕 PRIME A620M-K':["MATX", 2, 96, 1, 4, 2, "DDR5"],
'微星 PRO A620M-E':["MATX", 2, 128, 1, 4, 2, "DDR5"],
'精粤 B650M-D':["MATX", 2, 64, 2, 2, 2, "DDR5"],
'精粤 B650I Night Devil V2.3':["ITX", 2, 96, 2, 4, 1, "DDR5"],
'铭瑄 MS-Challenger B650M-K WIFI':["MATX", 2, 96, 1, 2, 2, "DDR5"],
'华硕 B650M-AYW WIFI':["MATX", 2, 96, 2, 4, 2, "DDR5"],
'华硕 TUF GAMING B650M-E WIFI':["MATX", 4, 192, 2, 4, 3, "DDR5"],
'华硕 TUF GAMING B650M-PLUS WIFI':["MATX", 4, 256, 2, 4, 3, "DDR5"],
'微星 B650M GAMING WIFI':["MATX", 2, 128, 2, 4, 2, "DDR5"],
'铭瑄 MS-Terminator B650M WIFI6':["MATX", 4, 192, 2, 4, 3, "DDR5"],
'微星 MAG B650M MORTAR WIFI':["MATX", 4, 256, 2, 6, 3, "DDR5"],
'华硕 ROG STRIX B650-A GAMING WIFI':["ATX", 4, 192, 3, 4, 4, "DDR5"],
'微星 MPG X670E CARBON WIFI':["ATX", 4, 256, 4, 6, 3, "DDR5"],
'华擎 X670E Taichi':["EATX", 4, 256, 4, 8, 2, "DDR5"],

'微星 B760M BOMBER WIFI D5':["MATX", 2, 128, 2, 4, 2, "DDR5"],
'华硕 PRIME Z790-P WIFI':["ATX", 4, 192, 3, 4, 4, "DDR5"],
'华硕 PRIME Z790M-PLUS':["MATX", 4, 192, 3, 4, 2, "DDR5"],
'华硕 ROG STRIX Z790-I GAMING WIFI':["ITX", 2, 96, 2, 2, 1, "DDR5"],
'华擎 H410M-ITX/ac':["ITX", 2, 64, 1, 4, 1, "DDR4"],
'华硕 PRIME X299-A II':["ATX", 8, 256, 2, 8, 6],
'微星 X299 SLI PLUS':["ATX", 8, 128, 2, 8, 6],
'华擎 X299 Taichi CLX':["ATX", 8, 256, 3, 8, 5],
'华硕 PRIME X299-DELUXE':["ATX", 8, 128, 2, 7, 6],
'华硕 Pro WS TRX50-SAGE WIFI':["EATX", 4, 1024, 3, 4, 5, "DDR5"],
'华硕 ROG ZENITH EXTREME':["EATX", 8, 128, 3, 6, 6],
'微星 X399 SLI PLUS':["ATX", 8, 128, 3, 8, 6],

'华擎 H510M-ITX/ac':["ITX", 2, 64, 1, 4, 1, "DDR4"],
'微星 H510I PRO WIFI':["ITX", 2, 64, 1, 4, 1, "DDR4"],
'铭瑄 MS-挑战者 H510ITX':["ITX", 2, 64, 1, 2, 1, "DDR4"],
'七彩虹 CVN H510I GAMING V20':["ITX", 2, 64, 1, 4, 1, "DDR4"],
'铭瑄 MS-Terminator B860M':["MATX", 4, 192, 3, 4, 3, "DDR5"],
'铭瑄 MS-Challenger H810M-K WIFI':["MATX", 2, 96, 1, 2, 2, "DDR5"],
'铭瑄 MS-eSport H810M WIFI ICE':["MATX", 2, 96, 2, 2, 2, "DDR5"],
'铭瑄 MS-Challenger H810ITX WIFI':["ITX", 2, 96, 2, 4, 1, "DDR5"],
'七彩虹 BATTLE-AX B860M-PLUS S WIFI7 V20':["MATX", 4, 192, 3, 4, 2, "DDR5"],
'七彩虹 BATTLE-AX B860M-PLUS WIFI V20':["MATX", 4, 192, 3, 4, 2, "DDR5"],
'七彩虹 BATTLE-AX B860M-WHITE WIFI V20':["MATX", 4, 192, 3, 4, 2, "DDR5"],
'七彩虹 BATTLE-AX B860M-E WIFI V20':["MATX", 2, 96, 3, 4, 2, "DDR5"],
'七彩虹 BATTLE-AX B860M-P WIFI V20':["MATX", 2, 96, 2, 4, 2, "DDR5"],
'七彩虹 CVN B860I GAMING FROZEN V20':["ITX", 2, 96, 2, 4, 1, "DDR5"],
'七彩虹 CVN B860M GAMING FROZEN V20':["MATX", 4, 192, 3, 4, 2, "DDR5"],
'微星 B860M GAMING PLUS WIFI6E':["MATX", 4, 256, 3, 4, 4, "DDR5"],
'微星 MAG B860M MORTAR WIFI':["MATX", 4, 256, 3, 4, 2, "DDR5"],
'微星 PRO Z890-P WIFI6E':["ATX", 4, 256, 4, 4, 4, "DDR5"],
'华擎 B860M-X WiFi':["MATX", 2, 128, 2, 4, 3, "DDR5"],
'华擎 B860M-H2':["MATX", 2, 128, 2, 4, 3, "DDR5"],
'华擎 B860M Pro RS WiFi':["MATX", 4, 256, 3, 4, 2, "DDR5"],
'铭瑄 MS-Terminator B860M WIFI':["MATX", 4, 192, 3, 4, 3, "DDR5"],

'铭瑄 MS-H110M 全固版':["MATX", 2, 32, 0, 4, 1],
'铭瑄 MS-B150M Combo':["MATX", 4, 32, 1, 5, 2],
'华硕 M5A78L-M LX3':["MATX", 2, 16, 0, 4, 2],
'技嘉 GA-78LMT-S2P':["MATX", 2, 8, 0, 6, 2],
'微星 760GM-P23 (FX)':["MATX", 2, 16, 0, 6, 2],
'华擎 760GM-HDV':["MATX", 2, 32, 0, 4, 2],
'华硕 M5A97 R2.0':["ATX", 4, 32, 0, 6, 4],
'七彩虹 战斧C.A970 X5 V14':["ATX", 4, 32, 0, 6, 4],
'华硕 PRIME H510M-F':["MATX", 2, 64, 1, 4, 2],
'微星 H510M PRO':["MATX", 2, 64, 1, 4, 2],
'七彩虹 H510M-D M.2':["MATX", 2, 64, 1, 4, 2],
'华硕 PRIME B560M-K':["MATX", 4, 128, 2, 6, 2],
'技嘉 B560M DS3H':["MATX", 4, 128, 2, 6, 2],
'七彩虹 B560M-D PRO':["MATX", 4, 128, 2, 6, 2],
'华硕 TUF GAMING B460M-PLUS':["MATX", 4, 128, 2, 6, 2],
'微星 B460M PRO-VDH WIFI':["MATX", 4, 128, 1, 6, 2],
'华擎 Z490 Phantom Gaming 4':["ATX", 4, 128, 2, 6, 3],
'华擎 H510M-HDV/M.2':["MATX", 2, 64, 1, 4, 2],
'华硕 Pro WS TRX50-SAGE WIFI':["EATX", 4, 1024, 3, 4, 5],
'华擎 TRX50 WS':["ATX", 4, 512, 3, 8, 4],
'华硕 EX-B360M-V3':["MATX", 2, 32, 0, 4, 3],
'华擎 B365M Pro4':["MATX", 4, 64, 2, 6, 3],
'华擎 B365M-HDV':["MATX", 2, 32, 1, 6, 3],
'华硕 PRIME B365M-A':["MATX", 4, 64, 2, 6, 3],
'华硕 PRIME Z370-A':["ATX", 4, 64, 2, 6, 7],
'华硕 PRIME Z370-P':["ATX", 4, 64, 2, 4, 6],
'微星 Z370-OC PRO':["ATX", 4, 64, 1, 6, 6],
'微星 Z370M MORTAR':["MATX", 4, 64, 2, 6, 2],
'华硕 ROG STRIX Z370-E':["ATX", 4, 64, 2, 6, 3],
'精粤 B450M PRO':["MATX", 2, 64, 1, 4, 2],
'华硕 PRIME A520M-K':["MATX", 2, 64, 1, 4, 2],
'昂达 A520-VH':["MATX", 2, 64, 1, 4, 2],
'华硕 PRIME X570-P':["ATX", 4, 128, 1, 4, 4],
'七彩虹 C.H110M-K 全固态版 V20':["MATX", 2, 32, 0, 4, 1],
'七彩虹 战斧C.B150M-D 魔音版 V22':["MATX", 2, 32, 0, 4, 3],
'七彩虹 战斧C.Z170 魔音版 V21':["ATX", 4, 64, 1, 4, 4],
'七彩虹 战斧B365M-D 魔音版 V20':["MATX", 2, 64, 1, 5, 2],
'微星 H270 PC MATE':["ATX", 4, 64, 2, 6, 5],
'华硕 ROG STRIX Z270E GAMING':["ATX", 4, 64, 2, 6, 7],
'华硕 ROG STRIX Z390-E GAMING':["ATX", 4, 64, 2, 6, 6],
'微星 MPG Z390 GAMING EDGE AC':["ATX", 4, 128, 2, 6, 6],
'七彩虹 战斧 B550M-GAMING WIFI6E V14':["MATX", 2, 64, 2, 4, 1],
'精粤 A520M-H':["MATX", 2, 64, 1, 4, 2],
'精粤 B550M PRO':["MATX", 4, 128, 2, 4, 2],
'精粤 B550M GAMING ARGB':["MATX", 4, 128, 2, 6, 2],
'华擎 B550M-HDV':["MATX", 4, 128, 2, 4, 2],
'精粤 B450I-PLUS':["ITX", 2, 64, 1, 4, 1],
'精粤 B550I GAMING':["ITX", 2, 64, 2, 4, 1],
'华擎 A520M-ITX/ac':["ITX", 2, 64, 1, 4, 1],
'昂达 A520SD4-ITX':["ITX", 2, 64, 1, 4, 1]
};
  B.forEach(b=>{const f=MB_SPEC_FIX[b.n];if(!f)return;if(f[0]!=null)b.ff=f[0];if(f[1]!=null)b.dimm=f[1];if(f[2]!=null)b.max=f[2];if(f[3]!=null)b.m2=f[3];if(f[4]!=null)b.sata=f[4];if(f[5]!=null)b.pcie=f[5];if(f[6]!=null)b.m=f[6];});
  const MB_U_PRICE={'华硕 PRIME A620M-K':330,'微星 PRO A620M-E':318,'华硕 A620M-AYW WIFI':400,'华硕 B650M-AYW WIFI':490,'华硕 TUF GAMING B650M-E WIFI':599,'华硕 TUF GAMING B650M-PLUS WIFI':746,'微星 B650M GAMING WIFI':712,'华硕 ROG STRIX B650-A GAMING WIFI':845,'华硕 PRIME X299-DELUXE':1400,'华硕 PRIME X299-A II':1300,'华擎 TRX40 Creator':1590,'微星 B760M BOMBER WIFI D5':399,'华硕 PRIME Z790-P WIFI':592,'华硕 PRIME Z790M-PLUS':885,'华硕 ROG STRIX Z790-I GAMING WIFI':968,'华硕 ROG STRIX Z790-A GAMING WIFI':1063,'微星 MAG B760M MORTAR WIFI D5':539,'华硕 PRIME H610M-E D4':324,'铭瑄 MS-挑战者 H610M':235,'昂达 H610-VH4-B':257,'华硕 EX-B660M-V5 D4':305,'铭瑄 MS-挑战者 B660M-K':265,'七彩虹 网驰 B660M-G DELUXE V20':275,'华硕 EX-B760M-V5 D4':394,'昂达 B760E-B':334,'铭瑄 MS-H110M 全固版':119,'铭瑄 MS-B150M Combo':119,'华硕 Z170-AR':136,'华硕 PRIME B250M-K':161,'技嘉 B250M-D3H':161,'技嘉 Z270X-UD3':176,'华硕 PRIME H410M-K':148,'技嘉 H410M-H':149,'技嘉 B460M-DS3H':178,'华硕 PRIME B460M-K':179,'华硕 ROG STRIX Z490-A':239,'微星 MPG Z490 GAMING PLUS':229,'七彩虹 CVN Z490':199,'微星 H410M PRO':148,'华硕 PRIME H510M-F':179,'微星 H510M PRO':189,'七彩虹 H510M-D M.2':168,'华硕 PRIME B560M-K':209,'技嘉 B560M DS3H':209,'七彩虹 B560M-D PRO':178,'微星 B460M MORTAR':230,'华擎 970 Pro3':88,'七彩虹 战斧C.A970 X5 V14':82,'铭瑄 MS-挑战者 B460M':128,'华硕 EX-B360M-V3':179,'微星 B360M MORTAR':199,'华擎 B365M Pro4':229,'华擎 B365M-HDV':209,'华硕 PRIME B365M-A':229,'华硕 PRIME Z370-A':289,'华硕 PRIME Z370-P':219,'微星 Z370-OC PRO':205,'微星 Z370M MORTAR':339,'华硕 ROG STRIX Z370-E':429,'华硕 PRIME A320M-K':188,'微星 B450M MORTAR':318,'华硕 TUF B550M-PLUS':637,'华硕 TUF B450M-PRO':371,'华擎 B450M Pro4':364,'华硕 PRIME A520M-K':245,'昂达 A520-VH':242,'华硕 TUF X570-PLUS':704,'华硕 PRIME X570-P':480,'华擎 A320M-HDV':160,'微星 A320M-A PRO':159,'七彩虹 断剑C.A320M':138,'微星 B550M MORTAR':652,'华擎 X570 Steel Legend':759,'微星 MPG X570 GAMING EDGE':598,'七彩虹 C.H110M-K 全固态版 V20':122,'七彩虹 战斧C.B150M-D 魔音版 V22':122,'七彩虹 战斧C.Z170 魔音版 V21':136,'七彩虹 战斧B365M-D 魔音版 V20':199,'微星 H270 PC MATE':166,'华硕 ROG STRIX Z270E GAMING':176,'华硕 ROG STRIX Z390-E GAMING':480,'微星 MPG Z390 GAMING EDGE AC':299,'七彩虹 战斧 B550M-GAMING WIFI6E V14':479,'华擎 B550M-HDV':359,'昂达 A520SD4-ITX':428,'华擎 A520M-ITX/ac':400,'华擎 B460M Pro4':250,'华擎 H410M-ITX/ac':279,'华擎 H510M-ITX/ac':239,'微星 H510I PRO WIFI':335,'铭瑄 MS-挑战者 H510ITX':200,'七彩虹 CVN H510I GAMING V20':298,'华擎 H410M-HDV':156,'华擎 H510M-HDV/M.2':176,'华硕 TUF GAMING B460M-PLUS':258,'微星 B460M PRO-VDH WIFI':198,'华擎 Z490 Phantom Gaming 4':214};
  const MB_PRICE={'精粤 X99M-D D3':208,'精粤 X99M-G D4/ARGB':208,'精粤 X99-TI D3 PLUS':399,'精粤 X99-TI D4 PLUS':399,'华硕 PRIME A620M-K':729,'精粤 B650M-D':409,'精粤 B650I Night Devil V2.3':479,'铭瑄 MS-Challenger B650M-K WIFI':569,'铭瑄 MS-Terminator B650M WIFI6':769,'微星 MAG B650M MORTAR WIFI':1018,'华硕 ROG STRIX B650-A GAMING WIFI':1558,'铭瑄 MS-Challenger H810M-K WIFI':539,'铭瑄 MS-eSport H810M WIFI ICE':689,'铭瑄 MS-Challenger H810ITX WIFI':668,'七彩虹 BATTLE-AX B860M-PLUS S WIFI7 V20':884,'七彩虹 BATTLE-AX B860M-E WIFI V20':736,'七彩虹 CVN B860I GAMING FROZEN V20':1599,'微星 MAG B860M MORTAR WIFI':1520,'微星 PRO Z890-P WIFI6E':1670,'华擎 B860M-X WiFi':719,'华擎 B860M Pro RS WiFi':999,'铭瑄 MS-Terminator B860M WIFI':858,'华硕 TUF GAMING B860M-PLUS WIFI':1259,'微星 PRO B860M-B WIFI':1040,'铭瑄 MS-Terminator B860M':809,'华南 X99-4MT V2.0':198,'华南 X99-4MF PLUS':208,'华南 X99-MTF V1.0':238,'华南 X99M-F':188,'华南 X99M-HD3':196,'华南 X99-P4T':228,'华南 X99-CD3 GAMING':316,'华南 X99-CD4 GAMING':346,'华南 X99-T8 GAMING V6.0':428,'华南 X99-TD3':318,'华南 X99-8D3 PRO':468,'华南 X10X99-8D':528,'华南 X99-F8 V6.0':362,'华南 X99-TF GAMING V6.0':398,'精粤 B450M PRO':245,'精粤 H610M-D PLUS':309,'七彩虹 战斧 B550M-GAMING WIFI6E V14':542,'精粤 A520M-H':308,'精粤 B550M PRO':388,'精粤 B550M GAMING ARGB':478,'华擎 B550M-HDV':669,'精粤 B450I-PLUS':418,'精粤 B550I GAMING':438,'华南 B85-ITX':255,'华擎 A520M-ITX/ac':688};
  B.forEach(b=>{const pv=MB_PRICE[b.n],uv=MB_U_PRICE[b.n];
    if(pv!=null)b.p=pv;
    if(uv!=null){b.u=uv;if(pv==null)b.p=null;}
  });;
  B.forEach(b=>{if(/^(精粤|劲鲨|华南)/.test(b.n))b.u=null;});
  const MB_NEW_ONLY_EARLY=new Set(['精粤 B650M-D','精粤 B650I Night Devil V2.3','铭瑄 MS-Challenger B650M-K WIFI','铭瑄 MS-Terminator B650M WIFI6','微星 MAG B650M MORTAR WIFI','华硕 TUF GAMING B860M-PLUS WIFI','微星 PRO B860M-B WIFI','铭瑄 MS-Challenger H810M-K WIFI','铭瑄 MS-eSport H810M WIFI ICE','铭瑄 MS-Challenger H810ITX WIFI','七彩虹 BATTLE-AX B860M-PLUS S WIFI7 V20','七彩虹 BATTLE-AX B860M-PLUS WIFI V20','七彩虹 BATTLE-AX B860M-WHITE WIFI V20','七彩虹 BATTLE-AX B860M-E WIFI V20','七彩虹 BATTLE-AX B860M-P WIFI V20','七彩虹 CVN B860I GAMING FROZEN V20','七彩虹 CVN B860M GAMING FROZEN V20','微星 B860M GAMING PLUS WIFI6E','微星 MAG B860M MORTAR WIFI','微星 PRO Z890-P WIFI6E','华擎 B860M-X WiFi','华擎 B860M-H2','华擎 B860M Pro RS WiFi','铭瑄 MS-Terminator B860M WIFI']);
  B.forEach(b=>{if(MB_NEW_ONLY_EARLY.has(b.n))b.u=null;});
  /* 只有全新实拍价的板子：二手价待闲鱼实拍，先置空（必须在 p≥u×1.15 约束之前） */
  const MB_USED_ONLY=new Set(['微星 PRO A620M-E','华硕 A620M-AYW WIFI','华硕 B650M-AYW WIFI','华硕 TUF GAMING B650M-E WIFI','华硕 TUF GAMING B650M-PLUS WIFI','微星 B650M GAMING WIFI','华硕 PRIME X299-DELUXE','华硕 PRIME X299-A II','微星 B760M BOMBER WIFI D5','华硕 PRIME Z790-P WIFI','华硕 PRIME Z790M-PLUS','华硕 ROG STRIX Z790-I GAMING WIFI','华硕 ROG STRIX Z790-A GAMING WIFI','微星 MAG B760M MORTAR WIFI D5','华硕 PRIME H610M-E D4','铭瑄 MS-挑战者 H610M','昂达 H610-VH4-B','华硕 EX-B660M-V5 D4','铭瑄 MS-挑战者 B660M-K','七彩虹 网驰 B660M-G DELUXE V20','华硕 B660M-T D4','华硕 PRIME B760M-K D4','华硕 EX-B760M-V5 D4','昂达 B760E-B']);
  B.forEach(b=>{if(MB_USED_ONLY.has(b.n))b.p=null;});
  /* LGA1151 只有全新库存板，不挂二手 */
  /* 1151：H310/H311 这类新板品牌只挂全新；其余（H110/B150/Z170/H270/B250/Z270）挂实拍二手价 */
  B.forEach(b=>{
    if(b.s!=='LGA1151'&&b.s!=='LGA1151V2')return;
    const isNewBrand=/^(华南|精粤|劲鲨)/.test(b.n)||/H3(10|11)/.test(b.n);
    if(isNewBrand)b.u=null;   /* 新板品牌不挂二手 */
  });
  /* 1700 以前平台：全新板只来自华南/精粤/劲鲨，其余只挂二手 */
  const OLD_SOCK=new Set(['LGA1155','LGA1150','LGA1151','LGA1151V2','LGA1200','LGA2011-3','AM3+']);
  B.forEach(b=>{
    if(!OLD_SOCK.has(b.s))return;
    if(!/^(华南|精粤|劲鲨)/.test(b.n)&&MB_PRICE[b.n]==null)b.p=null;
  });
  /* 清理既无全新价也无有效二手价的主板（避免出现 1 元假价） */
  for(let _i=B.length-1;_i>=0;_i--){
    const _b=B[_i];
    if((_b.p==null)&&(_b.u==null||_b.u<=1))B.splice(_i,1);
  }
  /* B550/X570 仍有全新货：按二手价上浮 20% 生成全新价 */
  B.forEach(b=>{
    if(b.s!=='AM4'||!b.u||b.p!=null)return;
    if(/B550/.test(b.n)){
      if(/^(微星|华硕)/.test(b.n))return;      /* 微星/华硕 B550 无全新货 */
      b.p=Math.round(b.u*1.2);return;
    }
    /* X570 已停产，只有二手 */
  });
  /* 移除全部技嘉（GIGABYTE/AORUS）产品 */
  for(let _i=B.length-1;_i>=0;_i--){if(/技嘉/.test(B[_i].n))B.splice(_i,1);}
  for(let _i=K.length-1;_i>=0;_i--){if(/技嘉/.test(K[_i].n))K.splice(_i,1);}
  /* 劲鲨 H61M-I：17×17 ITX、2×DDR3、带 M.2（官方图） */
  B.forEach(b=>{if(b.n==='劲鲨 H61M-I'){b.ff='ITX';b.dimm=2;b.max=16;b.m2=1;b.sata=4;b.pcie=1;}});
  /* 精粤 H97I-PLUS 是 ITX 小板（型号带 i） */
  B.forEach(b=>{if(b.n==='精粤 H97I-PLUS'){b.ff='ITX';b.dimm=2;b.max=32;b.pcie=1;}});
  M.forEach(m=>{if(m.m==='DDR2'||m.m==='DDR3')m.p=null;});  /* 内存：DDR3 及更老没有全新货 */
  /* 显卡：GTX 10 系（含）以前、RTX 20 系、RX 5000 及更老——都已停产 */
  const deadGpu=/RTX\s?20\d0|GTX\s?(4|5|6|7|9|10)\d0|GT\s?(4|6|7)\d0|HD\s?\d|R[579]\s?\d|RX\s?(3|4|5)\d0|Vega|Titan\s?(X|V|Z|Black)/i;
  G.forEach(g=>{if(deadGpu.test(g.n))g.p=null;});
})();

/* 抓不到实价的冷门机箱/散热：从游戏里删掉（名单见 PRUNE_UNPRICED） */
const PRUNE_UNPRICED=[];  /* 这些型号的价格已经补上，不再剔除 */
(function pruneUnpriced(){const dead=new Set(PRUNE_UNPRICED);
  [K,H].forEach(arr=>{for(let i=arr.length-1;i>=0;i--){if(dead.has(arr[i].n))arr.splice(i,1);}});
})();
/* ===== 商品档位（旗舰/中端/低端）=====
   按分类内「新品价」分位：前 20% 旗舰、20~60% 中端、其余低端。 */
function assignTiers(){
  /* 档位 = 「同一性能/规格档里，贵还是便宜」。
     —— 这样 5090 也有便宜款（中端）和溢价非公（旗舰），中端单不会无解。 */
  const keyOf=function(k,x){
    if(k==='cpu')return 'c'+Math.round(Math.log2(Math.max(x.cs||1,1))*2);
    if(k==='gpu')return 'g'+Math.round(Math.log2(Math.max(x.ts||1,1))*2);
    if(k==='ram')return 'r'+String(x.m||'')+String(x.cap||x.size||0);
    if(k==='disk')return 'd'+String(x.kind||'')+String(x.cap||x.size||0);
    if(k==='psu')return 'p'+Math.round((x.w||0)/100);
    if(k==='case')return 'k'+((x.ff||[]).slice().sort().join('')||'');
    if(k==='cooler')return 'h'+Math.round((x.cap||0)/50);
    if(k==='mb')return 'm'+String(x.s||'')+String(x.m||'');
    return 'x';
  };
  const cats={cpu:C,mb:B,ram:M,gpu:G,psu:P,case:K,cooler:H,disk:ST};
  const pr=function(x){return (x&&typeof x.p==='number'&&x.p>0)?x.p:((x&&typeof x.u==='number'&&x.u>0)?x.u:0);};
  const scoreOf={cpu:function(x){return x.cs||0;},gpu:function(x){return x.ts||0;}};
  Object.keys(cats).forEach(function(k){
    /* CPU/显卡：跟「性能相近的邻居」比价，比邻居中位价贵 15% 以上算旗舰、便宜 15% 以下算低端。
       原来是按 log2 分桶，桶里只剩两张时会把最贵的判成低端（9070XT 就是被这么误判的）。 */
    if(scoreOf[k]){
      const arr=(cats[k]||[]).filter(function(x){return x&&pr(x)>0;});
      arr.forEach(function(x){
        const s0=scoreOf[k](x);
        if(!s0){x.tier='mid';return;}
        const near=arr.filter(function(y){
          const s1=scoreOf[k](y);
          return s1&&Math.abs(s1-s0)<=s0*0.15;
        });
        if(near.length<3){x.tier='mid';return;}
        const prices=near.map(pr).sort(function(a,b){return a-b;});
        const med=prices[Math.floor(prices.length/2)];
        const p0=pr(x);
        x.tier=(p0>med*1.15?'flag':(p0<med*0.85?'budget':'mid'));
      });
      (cats[k]||[]).forEach(function(x){if(x&&!x.tier)x.tier='mid';});
      return;
    }
    const groups={};
    (cats[k]||[]).forEach(function(x){
      if(!x||pr(x)<=0)return;
      const g=keyOf(k,x);
      (groups[g]=groups[g]||[]).push(x);
    });
    Object.keys(groups).forEach(function(g){
      const arr=groups[g];
      if(arr.length<3){arr.forEach(function(x){x.tier='mid';});return;}
      arr.sort(function(a,b){return pr(a)-pr(b);});
      arr.forEach(function(x,i){
        const q=arr.length>1?i/(arr.length-1):1;
        x.tier=(q>=0.75?'flag':(q>=0.35?'mid':'budget'));
      });
    });
    (cats[k]||[]).forEach(function(x){if(x&&!x.tier)x.tier='mid';});
  });
}
assignTiers();
const MAP={cpu:C,mb:B,ram:M,gpu:G,cooler:H,psu:P,case:K,disk:ST};
const catOf=new Map();
Object.entries(MAP).forEach(([cat,arr])=>arr.forEach(x=>catOf.set(x,cat)));
const cheapest=x=>Math.min(x.p??1e9,x.u??1e9);



/* ================= 闲鱼实测校准（2026-10-27） =================
   数据来源：goofish.com 搜索接口，每关键词 30 条在售挂牌价的中位数。
   完整行情见 data/xianyu行情.md。
   - 有实测的型号直接覆盖
   - 其余按品类中位倍率平移（显卡 ×1.4，15000 元以上旗舰不缩放；CPU ×1.2；内存 ×0.9；机械盘 ×0.6；NVMe ×0.94） */
const XY_GPU_FIX={'NVIDIA GeForce GTX 1060 6G':619,'NVIDIA GeForce GTX 1650':620,
'NVIDIA GeForce GTX 1660 Super':849,'NVIDIA GeForce RTX 2060':710,
'NVIDIA GeForce RTX 3060 12G':2180,'NVIDIA GeForce RTX 3070':2194,
'NVIDIA GeForce RTX 4060':2599,'NVIDIA GeForce RTX 3090':8844,
'NVIDIA GeForce RTX 4070':5474,'NVIDIA GeForce RTX 5080':15500,
'AMD Radeon RX 580 8G':416,'AMD Radeon RX 6600':1140};
const XY_CPU_FIX={'Intel Core i7-4790K':316,'Intel Core i5-10400F':549,'Intel Core i7-10700K':960,
'Intel Core i5-13600K':1159,'Intel Core i3-12100F':462,'Intel Core i5-13400F':700,
'AMD Ryzen 5 3600':383,'AMD Ryzen 5 5600':621,'AMD Ryzen 5 7500F':520,'AMD Ryzen 7 5800X3D':2199};
G.forEach(g=>{if(XY_GPU_FIX[g.n]!=null){g.u=XY_GPU_FIX[g.n];return;}if(g.u<15000)g.u=Math.round(g.u*1.4);});
C.forEach(c=>{if(XY_CPU_FIX[c.n]!=null){c.u=XY_CPU_FIX[c.n];return;}c.u=Math.round(c.u*1.2);});
M.forEach(m=>{if(m.u!=null)m.u=Math.round(m.u*0.9);});   /* 只卖全新的件 u 是 null，别被算成 0（0 会被当成「最便宜」） */
ST.forEach(d=>{d.u=Math.round(d.u*(d.kind==='hdd'?0.85:(d.kind==='m2'?1.23:1)));});
/* ===== topcpu.net 跑分校准（2026-10-27） ===== */
const TC_CPU_FIX={"Intel Core i5-6400":3214,"Intel Core i5-6500":3420,"Intel Core i5-6600K":3963,"Intel Core i7-6700":4841,"Intel Core i7-6700K":5646,"Intel Core i7-7700":5443,"Intel Core i7-7700K":5881,"Intel Core i3-8100":3597,"Intel Core i3-9100F":3686,"Intel Core i5-8400":5798,"Intel Core i5-8600K":6612,"Intel Core i5-9400F":5579,"Intel Core i7-8700K":8734,"Intel Core i7-9700K":9416,"Intel Core i9-9900":12084,"Intel Core i3-10100":5565,"Intel Core i3-10105F":5689,"Intel Core i5-11400":9558,"Intel Core i5-11400F":10168,"Intel Core i7-10700":10429,"Intel Core i7-10700K":12983,"Intel Core i7-11700K":15011,"Intel Core i9-10900K":13761,"Intel Core i9-11900K":16211,"Intel Core i3-12100":7985,"Intel Core i3-12100F":8443,"Intel Core i5-12400F":12344,"Intel Core i5-12490F":11488,"Intel Core i5-13400":14311,"Intel Core i5-13400F":14311,"Intel Core i5-14600K":23983,"Intel Core i9-14900K":38497,"AMD Ryzen 3 1200":3010,"AMD Ryzen 3 3100":5627,"AMD Ryzen 5 1600":6233,"AMD Ryzen 5 2600":7101,"AMD Ryzen 5 5500":10550,"AMD Ryzen 7 1700":8046,"AMD Ryzen 7 2700X":10106,"AMD Ryzen 7 3700X":12173,"AMD Ryzen 7 5700X":14028,"AMD Ryzen 5 7500F":13809,"AMD Ryzen 5 8400F":13361,"AMD Ryzen 5 9600X":16284,"AMD Ryzen 7 9700X":19539};
const TC_GPU_FIX={"NVIDIA GeForce GT 1030":1087,"NVIDIA GeForce GTX 750":1169,"NVIDIA GeForce GTX 750 Ti":1276,"NVIDIA GeForce GTX 770":2153,"NVIDIA GeForce GTX 780":2790,"NVIDIA GeForce GTX 950":1903,"NVIDIA GeForce GTX 980 Ti":5789,"NVIDIA GeForce GTX 1050":1734,"NVIDIA GeForce GTX 1050 Ti":2353,"NVIDIA GeForce GTX 1060 3G":3863,"NVIDIA Titan X (Pascal)":9844,"NVIDIA Titan V":13217,"NVIDIA GeForce GTX 1630":2100,"NVIDIA GeForce GTX 1650":3566,"NVIDIA GeForce GTX 1650 GDDR6":3566,"NVIDIA GeForce RTX 2060":7572,"NVIDIA GeForce RTX 2080 Ti":14622,"NVIDIA GeForce RTX 3050 6G":4853,"NVIDIA GeForce RTX 3060 8G":7384,"NVIDIA GeForce RTX 4070 Super":21035,"NVIDIA GeForce RTX 5050":10205,"NVIDIA GeForce RTX 5060":13731,"NVIDIA GeForce RTX 5070":22683,"NVIDIA GeForce RTX 5090 D":48052,"AMD Radeon HD 7850":1334,"AMD Radeon HD 7950":1969,"AMD Radeon HD 7970":2310,"AMD Radeon R7 250":561,"AMD Radeon R7 260X":1476,"AMD Radeon R7 360":1371,"AMD Radeon R9 270":1603,"AMD Radeon R9 270X":1769,"AMD Radeon R9 280X":2348,"AMD Radeon R9 380":2757,"AMD Radeon R9 380X":3011,"AMD Radeon R9 390":3964,"AMD Radeon R9 390X":4259,"AMD Radeon RX 460":1754,"AMD Radeon RX 480":4137,"AMD Radeon RX 550":1194,"AMD Radeon RX 560":1855,"AMD Radeon RX 5500 XT":4858,"AMD Radeon RX 5700 XT":9425,"AMD Radeon VII":8923,"AMD Radeon RX 6400":3585,"AMD Radeon RX 6700":11195,"AMD Radeon RX 6700 XT":12804,"AMD Radeon RX 6750 XT":13542,"AMD Radeon RX 6900 XT":20764,"AMD Radeon RX 9070":26876,"AMD Radeon RX 9070 XT":30445};
C.forEach(c=>{if(TC_CPU_FIX[c.n]!=null)c.cs=TC_CPU_FIX[c.n];});
G.forEach(g=>{if(TC_GPU_FIX[g.n]!=null)g.ts=TC_GPU_FIX[g.n];});
/* ===== 补充常用型号（2026-10-27）=====
   价格：闲鱼实测中位（data/xianyu/）；跑分：topcpu.net 或同代同规格推算。
   追加在标定之后，因此保持给定值不再被整族系数缩放。 */
C.push(
 {n:'Intel Core i5-13490F',s:'LGA1700',m:'DDR4',t:65,ig:0,cs:14300,p:900,u:720},
 {n:'Intel Core i5-12600KF',s:'LGA1700',m:'DDR4',t:125,ig:0,cs:17600,p:null,u:800},
 {n:'Intel Core i7-11700F',s:'LGA1200',m:'DDR4',t:65,ig:0,cs:11500,p:null,u:700},
 {n:'Intel Core i9-11900F',s:'LGA1200',m:'DDR4',t:65,ig:0,cs:14500,p:null,u:900},
 {n:'Intel Core i5-10600KF',s:'LGA1200',m:'DDR4',t:125,ig:0,cs:9000,p:null,u:450},
 {n:'AMD Ryzen 5 5600GT',s:'AM4',m:'DDR4',t:65,ig:1,cs:11000,p:780,u:550},
 {n:'AMD Ryzen 9 3900XT',s:'AM4',m:'DDR4',t:105,ig:0,cs:19000,p:null,u:1100}
);
/* 2026-10-30 按淘宝实拍补的 FX / 速龙（AM3+ 平台，价格取截图） */
C.push(
 {n:'AMD FX-4300',s:'AM3+',m:'DDR3',t:95,ig:0,cs:1700,p:null,u:22},
 
 
 
 
 
 
 
 {n:'AMD FX-8300',s:'AM3+',m:'DDR3',t:95,ig:0,cs:3000,p:null,u:98},
 
 {n:'AMD Athlon X4 640',s:'AM3+',m:'DDR3',t:95,ig:0,cs:900,p:null,u:23},
 
 {n:'Intel Core i5-12500',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:15000,p:null,u:1275},
 {n:'Intel Core i5-12600',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:17000,p:null,u:1235},
 {n:'Intel Core i7-12700',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:23000,p:1755,u:1595},
 {n:'Intel Core i9-12900K',s:'LGA1700',m:'DDR4',t:125,ig:1,cs:27000,p:2435,u:2155},
 {n:'Intel Core i9-12900KF',s:'LGA1700',m:'DDR4',t:125,ig:0,cs:27000,p:2265,u:2035},
 {n:'Intel Core i7-12700F',s:'LGA1700',m:'DDR4',t:65,ig:0,cs:23000,p:1575,u:1275},
 {n:'Intel Core i9-12900F',s:'LGA1700',m:'DDR4',t:65,ig:0,cs:27000,p:null,u:2050},
 {n:'Intel Core i9-12900KS',s:'LGA1700',m:'DDR4',t:150,ig:1,cs:28000,p:null,u:2060},
 {n:'Intel Core i3-13100F',s:'LGA1700',m:'DDR4',t:58,ig:0,cs:8300,p:625,u:520},
 {n:'Intel Core i3-13100',s:'LGA1700',m:'DDR4',t:58,ig:1,cs:8500,p:null,u:645},
 {n:'Intel Core i5-13600',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:22000,p:null,u:1450},
 {n:'Intel Core i7-13700',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:29000,p:null,u:2175},
 {n:'Intel Core i7-13700F',s:'LGA1700',m:'DDR4',t:65,ig:0,cs:29000,p:null,u:1585},
 {n:'Intel Core i7-13700KF',s:'LGA1700',m:'DDR4',t:125,ig:0,cs:30000,p:null,u:1628},
 {n:'Intel Core i3-14100',s:'LGA1700',m:'DDR4',t:58,ig:1,cs:8700,p:null,u:659},
 {n:'Intel Core i3-14100F',s:'LGA1700',m:'DDR4',t:58,ig:0,cs:8700,p:null,u:529},
 {n:'Intel Core i5-14400F',s:'LGA1700',m:'DDR4',t:65,ig:0,cs:15000,p:null,u:809},
 {n:'Intel Core i5-14500',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:17000,p:null,u:1449},
 {n:'Intel Core i5-14600',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:22000,p:null,u:1562},
 {n:'Intel Core i7-14700',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:29000,p:null,u:1989},
 {n:'Intel Core i7-14700F',s:'LGA1700',m:'DDR4',t:65,ig:0,cs:29000,p:null,u:1959},
 {n:'Intel Core i7-14700KF',s:'LGA1700',m:'DDR4',t:125,ig:0,cs:30000,p:null,u:1989},
 {n:'Intel Core i7-14790F',s:'LGA1700',m:'DDR4',t:65,ig:0,cs:31000,p:null,u:1889},
 {n:'Intel Core i5-14400',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:16000,p:1105,u:967},
 {n:'Intel Core i5-14490F',s:'LGA1700',m:'DDR4',t:65,ig:0,cs:18000,p:909,u:825},
 {n:'Intel Core i9-12900',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:26000,p:null,u:2550},
 {n:'Intel Core i9-13900F',s:'LGA1700',m:'DDR4',t:65,ig:0,cs:33000,p:null,u:1699},
 {n:'Intel Core i9-13900',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:33000,p:null,u:3099},
 {n:'Intel Core i9-13900KF',s:'LGA1700',m:'DDR4',t:125,ig:0,cs:39000,p:null,u:2079},
 {n:'Intel Core i9-14900',s:'LGA1700',m:'DDR4',t:65,ig:1,cs:34000,p:null,u:3279},
 {n:'Intel Core i9-14900KF',s:'LGA1700',m:'DDR4',t:125,ig:0,cs:39000,p:null,u:2499},
 {n:'AMD Ryzen 5 5500GT',s:'AM4',m:'DDR4',t:65,ig:1,cs:11000,p:1199,u:939},
 {n:'AMD Ryzen 5 5500X3D',s:'AM4',m:'DDR4',t:65,ig:0,cs:10600,p:null,u:1379},
 {n:'AMD Ryzen 7 5700G',s:'AM4',m:'DDR4',t:65,ig:1,cs:13800,p:null,u:1189},
 {n:'AMD Ryzen 5 7600X3D',s:'AM5',m:'DDR5',t:65,ig:1,cs:13500,p:null,u:1519},
 {n:'AMD Ryzen 5 8600G',s:'AM5',m:'DDR5',t:65,ig:1,cs:13000,p:null,u:900},
 {n:'AMD Ryzen 7 8700G',s:'AM5',m:'DDR5',t:65,ig:1,cs:15000,p:null,u:1399},
 {n:'AMD Ryzen 5 9500F',s:'AM5',m:'DDR5',t:65,ig:0,cs:13000,p:null,u:800},
 {n:'AMD Ryzen 9 9900X3D',s:'AM5',m:'DDR5',t:120,ig:1,cs:30000,p:null,u:2799},
 {n:'AMD Ryzen 9 9950X3D',s:'AM5',m:'DDR5',t:170,ig:1,cs:42000,p:4275,u:3699},
 {n:'AMD Ryzen 9 9850X3D',s:'AM5',m:'DDR5',t:120,ig:1,cs:25000,p:2935,u:2500},
 {n:'AMD Ryzen 5 7400F',s:'AM5',m:'DDR5',t:65,ig:0,cs:12800,p:809,u:650},
 {n:'AMD Ryzen 5 8500G',s:'AM5',m:'DDR5',t:65,ig:1,cs:11500,p:708,u:580},
 {n:'AMD Ryzen 3 3200G',s:'AM4',m:'DDR4',t:65,ig:1,cs:4200,p:315,u:200},
 {n:'AMD Ryzen 5 3400G',s:'AM4',m:'DDR4',t:65,ig:1,cs:5200,p:449,u:280},
 {n:'AMD Ryzen 5 4500',s:'AM4',m:'DDR4',t:65,ig:0,cs:7500,p:419,u:350},
 {n:'AMD Ryzen 5 2600X',s:'AM4',m:'DDR4',t:95,ig:0,cs:7600,p:null,u:235},
 {n:'AMD Ryzen 3 2200G',s:'AM4',m:'DDR4',t:65,ig:1,cs:3900,p:null,u:105},
 {n:'AMD Ryzen 5 2400G',s:'AM4',m:'DDR4',t:65,ig:1,cs:4500,p:null,u:250},
 {n:'AMD Ryzen 7 2700',s:'AM4',m:'DDR4',t:65,ig:0,cs:9300,p:null,u:315},
 {n:'AMD Ryzen 7 1700X',s:'AM4',m:'DDR4',t:95,ig:0,cs:8700,p:null,u:230},
 {n:'AMD Ryzen 5 1400',s:'AM4',m:'DDR4',t:65,ig:0,cs:4200,p:null,u:60},
 {n:'AMD Ryzen 3 3300X',s:'AM4',m:'DDR4',t:65,ig:0,cs:7000,p:null,u:289},
 {n:'AMD Ryzen 5 1500X',s:'AM4',m:'DDR4',t:65,ig:0,cs:5000,p:null,u:105},
 {n:'AMD Ryzen 7 3800X',s:'AM4',m:'DDR4',t:105,ig:0,cs:13000,p:null,u:580},
 {n:'AMD Ryzen 9 3950X',s:'AM4',m:'DDR4',t:105,ig:0,cs:24000,p:null,u:1380},
 {n:'AMD Ryzen 9 7900X3D',s:'AM5',m:'DDR5',t:120,ig:1,cs:28000,p:null,u:1999},
 {n:'AMD Ryzen 9 7950X3D',s:'AM5',m:'DDR5',t:120,ig:1,cs:36000,p:null,u:2799},
 {n:'Intel Core i5-3350P',s:'LGA1155',m:'DDR3',t:69,ig:0,cs:2800,p:null,u:24},
 {n:'Intel Xeon E3-1220 v2',s:'LGA1155',m:'DDR3',t:69,ig:0,cs:3332,p:null,u:30},
 {n:'Intel Core i5-3470S',s:'LGA1155',m:'DDR3',t:65,ig:1,cs:2600,p:null,u:51},
 {n:'Intel Core i5-3470T',s:'LGA1155',m:'DDR3',t:35,ig:1,cs:2100,p:null,u:50},
 {n:'Intel Core i5-2400S',s:'LGA1155',m:'DDR3',t:65,ig:1,cs:2200,p:null,u:41},
 /* 同档位只留代表：Ivy i3 + 奔腾 G（游戏里原本没有奔腾） */
 {n:'Intel Core i3-3220',s:'LGA1155',m:'DDR3',t:55,ig:1,cs:1800,p:null,u:16},
 {n:'Intel Pentium G2030',s:'LGA1155',m:'DDR3',t:55,ig:1,cs:800,p:null,u:13},
 {n:'Intel Xeon E3-1220 v3',s:'LGA1150',m:'DDR3',t:80,ig:0,cs:4300,p:null,u:58},
 {n:'Intel Xeon E3-1226 v3',s:'LGA1150',m:'DDR3',t:84,ig:1,cs:4420,p:null,u:92},
 {n:'Intel Core i3-4160T',s:'LGA1150',m:'DDR3',t:35,ig:1,cs:1600,p:null,u:35},
 {n:'Intel Core i3-8300',s:'LGA1151V2',m:'DDR4',t:62,ig:1,cs:4000,p:null,u:130},
 {n:'Intel Core i3-8350K',s:'LGA1151V2',m:'DDR4',t:91,ig:1,cs:4300,p:null,u:145},
 {n:'Intel Core i5-8600',s:'LGA1151V2',m:'DDR4',t:65,ig:1,cs:6400,p:null,u:300},
 {n:'Intel Core i3-8100T',s:'LGA1151V2',m:'DDR4',t:35,ig:1,cs:3200,p:null,u:105},
 {n:'Intel Core i5-8400T',s:'LGA1151V2',m:'DDR4',t:35,ig:1,cs:5200,p:null,u:275},
 {n:'Intel Core i7-8700T',s:'LGA1151V2',m:'DDR4',t:35,ig:1,cs:6600,p:null,u:630},
 {n:'Intel Core i3-9100',s:'LGA1151V2',m:'DDR4',t:65,ig:1,cs:3686,p:null,u:135},
 {n:'Intel Core i3-9100T',s:'LGA1151V2',m:'DDR4',t:35,ig:1,cs:3000,p:null,u:115},
 {n:'Intel Core i5-9400',s:'LGA1151V2',m:'DDR4',t:65,ig:1,cs:5500,p:null,u:385},
 {n:'Intel Core i5-9400T',s:'LGA1151V2',m:'DDR4',t:35,ig:1,cs:4400,p:null,u:285},
 {n:'Intel Core i5-9500',s:'LGA1151V2',m:'DDR4',t:65,ig:1,cs:5952,p:null,u:390},
 {n:'Intel Core i5-9500F',s:'LGA1151V2',m:'DDR4',t:65,ig:0,cs:5952,p:null,u:335},
 {n:'Intel Core i5-9500T',s:'LGA1151V2',m:'DDR4',t:35,ig:1,cs:4700,p:null,u:290},
 {n:'Intel Core i5-9600',s:'LGA1151V2',m:'DDR4',t:65,ig:1,cs:6300,p:null,u:395},
 {n:'Intel Core i5-9600T',s:'LGA1151V2',m:'DDR4',t:35,ig:1,cs:5000,p:null,u:325},
 {n:'Intel Core i5-9600K',s:'LGA1151V2',m:'DDR4',t:95,ig:1,cs:6590,p:null,u:360},
 {n:'Intel Core i5-9600KF',s:'LGA1151V2',m:'DDR4',t:95,ig:0,cs:6590,p:null,u:350},
 {n:'Intel Core i7-9700',s:'LGA1151V2',m:'DDR4',t:65,ig:1,cs:8524,p:null,u:625},
 {n:'Intel Core i7-9700F',s:'LGA1151V2',m:'DDR4',t:65,ig:0,cs:8524,p:null,u:600},
 {n:'Intel Core i7-9700KF',s:'LGA1151V2',m:'DDR4',t:95,ig:0,cs:9416,p:null,u:610},
 {n:'Intel Core i7-9700T',s:'LGA1151V2',m:'DDR4',t:35,ig:1,cs:6800,p:null,u:605},
 {n:'Intel Core i9-9900KF',s:'LGA1151V2',m:'DDR4',t:95,ig:0,cs:12400,p:null,u:1079},
 {n:'Intel Core i9-9900KS',s:'LGA1151V2',m:'DDR4',t:95,ig:1,cs:13343,p:null,u:1799},
 {n:'Intel Core i9-9900T',s:'LGA1151V2',m:'DDR4',t:35,ig:1,cs:10202,p:null,u:1249},
 {n:'Intel Core i3-10105',s:'LGA1200',m:'DDR4',t:65,ig:1,cs:5700,p:null,u:515},
 {n:'Intel Core i3-10105T',s:'LGA1200',m:'DDR4',t:35,ig:1,cs:4300,p:null,u:440},
 {n:'Intel Core i5-10500T',s:'LGA1200',m:'DDR4',t:35,ig:1,cs:6300,p:null,u:640},
 {n:'Intel Core i7-10700F',s:'LGA1200',m:'DDR4',t:65,ig:0,cs:10429,p:null,u:830},
 {n:'Intel Core i7-10700KF',s:'LGA1200',m:'DDR4',t:125,ig:0,cs:11000,p:null,u:845},
 {n:'Intel Core i9-10900F',s:'LGA1200',m:'DDR4',t:65,ig:0,cs:13000,p:null,u:1310},
 {n:'Intel Core i9-10900KF',s:'LGA1200',m:'DDR4',t:125,ig:0,cs:13761,p:null,u:1667},
 {n:'Intel Core i5-11500',s:'LGA1200',m:'DDR4',t:65,ig:1,cs:9800,p:null,u:725},
 {n:'Intel Core i5-11600KF',s:'LGA1200',m:'DDR4',t:125,ig:0,cs:11277,p:null,u:660},
 {n:'Intel Core i7-11700',s:'LGA1200',m:'DDR4',t:65,ig:1,cs:12500,p:null,u:900},
 {n:'Intel Core i7-11700KF',s:'LGA1200',m:'DDR4',t:125,ig:0,cs:15011,p:null,u:980},
 {n:'Intel Core i9-11900',s:'LGA1200',m:'DDR4',t:65,ig:1,cs:15800,p:null,u:2232},
 {n:'Intel Core i9-11900KF',s:'LGA1200',m:'DDR4',t:125,ig:0,cs:16211,p:null,u:1390},
 {n:'Intel Core Ultra 5 230F',s:'LGA1851',m:'DDR5',t:65,ig:0,cs:18000,p:700,u:600},
 {n:'Intel Core Ultra 3 205',s:'LGA1851',m:'DDR5',t:65,ig:1,cs:13383,p:600,u:510},
 {n:'Intel Core Ultra 5 225',s:'LGA1851',m:'DDR5',t:65,ig:1,cs:16503,p:1000,u:850},
 {n:'Intel Core Ultra 5 235',s:'LGA1851',m:'DDR5',t:65,ig:1,cs:21677,p:1130,u:960},
 {n:'Intel Core Ultra 5 245',s:'LGA1851',m:'DDR5',t:65,ig:1,cs:22000,p:1400,u:1190},
 {n:'Intel Core Ultra 7 265',s:'LGA1851',m:'DDR5',t:65,ig:1,cs:23677,p:2250,u:1910},
 {n:'Intel Core Ultra 9 285',s:'LGA1851',m:'DDR5',t:65,ig:1,cs:30771,p:4050,u:3440},
 {n:'Intel Core Ultra 9 285T',s:'LGA1851',m:'DDR5',t:35,ig:1,cs:25000,p:3900,u:3310},
 {n:'Intel Xeon E5-2680 v4',s:'LGA2011-3',m:'DDR4',t:120,ig:0,cs:9000,p:null,u:44},
 {n:'Intel Xeon E5-2686 v4',s:'LGA2011-3',m:'DDR4',t:145,ig:0,cs:10500,p:null,u:101},
 {n:'Intel Core i3-10100F',s:'LGA1200',m:'DDR4',t:65,ig:0,cs:5565,p:null,u:370},
 {n:'Intel Core i3-10100T',s:'LGA1200',m:'DDR4',t:35,ig:1,cs:4200,p:null,u:420},
 {n:'Intel Core i5-4460S',s:'LGA1150',m:'DDR3',t:65,ig:1,cs:2800,p:null,u:90},
 {n:'Intel Core i7-4770S',s:'LGA1150',m:'DDR3',t:65,ig:1,cs:4500,p:null,u:290},
 {n:'Intel Core i5-4590T',s:'LGA1150',m:'DDR3',t:35,ig:1,cs:2900,p:null,u:110},
 {n:'Intel Core i3-6100T',s:'LGA1151',m:'DDR4',t:35,ig:1,cs:1800,p:null,u:22},
 {n:'Intel Core i5-6500T',s:'LGA1151',m:'DDR4',t:35,ig:1,cs:2800,p:null,u:80},
 {n:'Intel Core i7-6700T',s:'LGA1151',m:'DDR4',t:35,ig:1,cs:4000,p:null,u:220},
 {n:'Intel Core i5-6600',s:'LGA1151',m:'DDR4',t:65,ig:1,cs:3700,p:null,u:90},
 {n:'Intel Core i5-7400',s:'LGA1151',m:'DDR4',t:65,ig:1,cs:4100,p:null,u:104},
 {n:'Intel Core i5-7600',s:'LGA1151',m:'DDR4',t:65,ig:1,cs:4550,p:null,u:120},
 {n:'Intel Core i5-7600K',s:'LGA1151',m:'DDR4',t:91,ig:1,cs:4900,p:null,u:140},
 {n:'Intel Core i3-7100T',s:'LGA1151',m:'DDR4',t:35,ig:1,cs:2600,p:null,u:23},
);
G.push(
 {n:'NVIDIA GeForce RTX 2060 12G',ts:8600,len:175,tbp:185,p:null,u:1350,series:'20系'},
 {n:'NVIDIA GeForce RTX 3060 Ti G6X',ts:12000,len:242,tbp:225,p:null,u:1500,series:'30系'},
 {n:'AMD Radeon RX 6750 GRE 12G',ts:12500,len:267,tbp:250,p:2400,u:1784,series:'60系'},
 {n:'Intel Arc A750',ts:12800,len:267,tbp:225,p:1500,u:900,series:'Arc'},
 {n:'Intel Arc B580',ts:14700,len:272,tbp:190,p:2000,u:1500,series:'Arc'}
);
[['DDR4',3600,16,900,560],['DDR5',6400,32,4200,3400]].forEach(([mm,mhz,cap,pp,uu])=>{
  RAM_BRANDS.forEach((br,i)=>{
    const f=0.92+((i*7)%5)/20;
    M.push({n:`${br} ${mm} ${mhz} ${cap}G 单条`,m:mm,cap,mhz,st:1,p:Math.round(pp*f),u:Math.round(uu*f)});
  });
});

/* 补充实测覆盖（闲鱼中位）：1080Ti 899 / RX5700XT 839 / i9-9900K 980 */
G.forEach(x=>{if(x.n==='NVIDIA GeForce GTX 1080 Ti')x.u=899;else if(x.n==='AMD Radeon RX 5700 XT')x.u=839;});
C.forEach(x=>{if(x.n==='Intel Core i9-9900K')x.u=980;});
/* 校准收尾：二手价上调后，全新价不得低于二手价（原 67 条倒挂） */
[G,C,B,M,P,H,ST,K].forEach(arr=>arr.forEach(x=>{if(x.p!=null&&x.u!=null&&x.p<x.u*1.15)x.p=Math.round(x.u*1.15);}));
/* ===== 淘宝实价校准（2026-10-28 抓取，样本≥5 且偏差<80% 才采用） ===== */
const REAL_PRICES={"Intel Core i5-10400":{"u":383},"Intel Core i5-10400F":{"u":383},"Intel Core i5-12400":{"u":700},"Intel Core i5-12400F":{"u":700},"Intel Core i5-13400":{"u":719},"Intel Core i5-13400F":{"u":719},"Intel Core Ultra 5 245K":{"u":1772},"Intel Core Ultra 5 245KF":{"u":1772},"Intel Core Ultra 7 265K":{"u":1659},"Intel Core Ultra 7 265KF":{"u":1659},"Intel Core Ultra 9 285K":{"u":3224},"Intel Xeon E5-2666 v3":{"u":116},"AMD Ryzen 5 2600":{"u":277},"AMD Ryzen 5 5600":{"u":679},"AMD Ryzen 5 5600G":{"u":679},"AMD Ryzen 5 5600X":{"u":679},"AMD Ryzen 5 5600GT":{"u":679},"AMD Ryzen 9 7950X":{"u":2251},"AMD Ryzen 9 9950X":{"u":3976},"Intel Core i3-2100":{"u":17},"Intel Core i5-4590":{"u":105},"Intel Core i7-4790":{"u":162},"Intel Core i7-4790K":{"u":162},"Intel Core i5-7500":{"u":100},"Intel Core i5-8400":{"u":280},"Intel Core i9-9900K":{"u":938},"Intel Core i3-10100":{"u":236},"Intel Core i7-10700":{"u":834},"Intel Core i7-10700K":{"u":834},"Intel Core i5-11400":{"u":630},"Intel Core i5-11400F":{"u":630},"Intel Core i3-12100":{"u":525},"Intel Core i3-12100F":{"u":525},"Intel Core i9-14900K":{"u":614},"金士顿 DDR5 6000 16G 单条":{"p":456,"u":283},"金士顿 DDR5 6000 32G 单条":{"p":880,"u":546},"金士顿 DDR3 1600 8G 单条":{"u":70},"威刚 DDR4 3600 16G 单条":{"p":272,"u":169},"威刚 DDR5 6000 32G 单条":{"p":845,"u":524},"威刚 DDR3 1600 8G 单条":{"u":67},"海盗船 DDR5 6000 16G 单条":{"p":483,"u":299},"海盗船 DDR5 6000 32G 单条":{"p":933,"u":578},"海盗船 DDR3 1600 8G 单条":{"u":74},"光威 DDR4 3200 16G 单条":{"p":249,"u":154},"光威 DDR4 3600 16G 单条":{"p":261,"u":162},"光威 DDR3 1600 8G 单条":{"u":64},"金百达 DDR4 3200 16G 单条":{"p":254,"u":157},"金百达 DDR4 3600 16G 单条":{"p":266,"u":165},"金百达 DDR5 6000 16G 单条":{"p":428,"u":265},"金百达 DDR5 6000 32G 单条":{"p":827,"u":513},"金百达 DDR3 1600 8G 单条":{"u":66},"海韵 PRIME 650W":{"p":373},"振华 卓凌 550W":{"p":184},"振华 卓凌 650W":{"p":436},"振华 卓凌 750W":{"p":368},"全汉 MEGA 650W":{"p":154},"全汉 MEGA 750W":{"p":188},"酷冷至尊 MWE 550W":{"p":142},"酷冷至尊 MWE 650W":{"p":119},"酷冷至尊 MWE 750W":{"p":279},"长城 GX+ 650W":{"p":189},"长城 GX+ 750W":{"p":266},"航嘉 MVP 650W":{"p":158},"航嘉 MVP 750W":{"p":159},"鑫谷 昆仑 550W":{"p":199},"鑫谷 昆仑 650W":{"p":190},"先马 XP 550W":{"p":158},"先马 XP 650W":{"p":167},"先马 XP 750W":{"p":199},"安钛克 NE 550W":{"p":85},"安钛克 NE 650W":{"p":129},"安钛克 NE 750W":{"p":129},"微星 MAG 550W":{"p":119},"微星 MAG 650W":{"p":279},"微星 MAG 750W":{"p":279},"NVIDIA GeForce GTX 1050 Ti":{"u":488},"NVIDIA GeForce GTX 1060 3G":{"u":418},"NVIDIA GeForce GTX 1060 5G":{"u":550},"NVIDIA GeForce GTX 1070":{"u":686},"NVIDIA GeForce GTX 1070 Ti":{"u":735},"NVIDIA GeForce GTX 1080":{"u":700},"NVIDIA GeForce GTX 1080 Ti":{"u":899},"NVIDIA GeForce GTX 1630":{"u":380},"NVIDIA Titan V":{"u":1304},"NVIDIA Titan Xp":{"u":950},"NVIDIA Titan X (Pascal)":{"u":868},"Intel Arc A750":{"u":1216},"Intel Arc B580":{"u":2399},"NVIDIA GeForce GTX 1650 Super":{"u":639},"NVIDIA GeForce GTX 1660 Ti":{"u":938},"AMD Radeon HD 4350":{"u":35},"AMD Radeon HD 4650":{"u":35},"AMD Radeon HD 4670":{"u":32},"AMD Radeon HD 5450":{"u":39},"AMD Radeon HD 5550":{"u":50},"AMD Radeon HD 5570":{"u":39},"AMD Radeon HD 5750":{"u":40},"AMD Radeon HD 5870":{"u":80},"AMD Radeon HD 6450":{"u":45},"AMD Radeon HD 6570":{"u":42},"AMD Radeon HD 6670":{"u":50},"AMD Radeon HD 6750":{"u":46},"AMD Radeon HD 6770":{"u":50},"AMD Radeon HD 6790":{"u":55},"AMD Radeon HD 6850":{"u":55},"AMD Radeon HD 6950":{"u":70},"AMD Radeon HD 6970":{"u":110},"AMD Radeon HD 7750":{"u":90},"AMD Radeon HD 7770":{"u":76},"AMD Radeon HD 7850":{"u":88},"AMD Radeon HD 7870":{"u":110},"AMD Radeon R5 230":{"u":48},"AMD Radeon R7 240":{"u":65},"AMD Radeon R7 250":{"u":85},"AMD Radeon R7 260X":{"u":90},"AMD Radeon R7 350":{"u":100},"AMD Radeon R7 360":{"u":118},"AMD Radeon R9 270":{"u":118},"AMD Radeon R9 270X":{"u":120},"AMD Radeon R9 280X":{"u":135},"AMD Radeon R9 290":{"u":225},"AMD Radeon R9 290X":{"u":275},"AMD Radeon R9 380":{"u":199},"AMD Radeon R9 380X":{"u":254},"AMD Radeon R9 390":{"u":316},"AMD Radeon R9 390X":{"u":388},"NVIDIA GeForce RTX 2060 Super":{"u":1218},"NVIDIA GeForce RTX 2070":{"u":1050},"NVIDIA GeForce RTX 2070 Super":{"u":1219},"NVIDIA GeForce RTX 2080":{"u":1234},"NVIDIA GeForce RTX 2080 Ti":{"u":1764},"NVIDIA GeForce RTX 3050 6G":{"u":1699},"NVIDIA GeForce RTX 3060 12G":{"u":2046},"NVIDIA GeForce RTX 3060 Ti":{"u":2150},"NVIDIA GeForce RTX 3060 Ti G6X":{"u":2100},"NVIDIA GeForce RTX 3070 Ti":{"u":2799},"NVIDIA GeForce RTX 3080 12G":{"u":3499},"NVIDIA GeForce RTX 3080 Ti":{"u":2450},"NVIDIA GeForce RTX 3090 Ti":{"u":9199},"NVIDIA GeForce RTX 4060 Ti 16G":{"u":3200},"NVIDIA GeForce RTX 4060 Ti 8G":{"u":2890},"NVIDIA GeForce RTX 4070 Super":{"u":4538},"NVIDIA GeForce RTX 4070 Ti":{"u":5788},"NVIDIA GeForce RTX 4070 Ti SUPER":{"u":3899},"NVIDIA GeForce RTX 4080":{"u":9450},"NVIDIA GeForce RTX 4080 Super":{"u":7829},"NVIDIA GeForce RTX 5050":{"u":2950},"NVIDIA GeForce RTX 5060":{"u":4107},"NVIDIA GeForce RTX 5060 Ti":{"u":4899},"NVIDIA GeForce RTX 5070":{"u":6999},"NVIDIA GeForce RTX 5070 Ti":{"u":9666},"AMD Radeon RX 470":{"u":359},"AMD Radeon RX 480":{"u":369},"AMD Radeon RX 550":{"u":350},"AMD Radeon RX 5500":{"u":579},"AMD Radeon RX 560":{"u":333},"AMD Radeon RX 5600":{"u":680},"AMD Radeon RX 5600 XT":{"u":699},"AMD Radeon RX 570":{"u":328},"AMD Radeon RX 5700":{"u":780},"AMD Radeon RX 590":{"u":540},"AMD Radeon RX 6400":{"u":624},"AMD Radeon RX 6500 XT":{"u":650},"AMD Radeon RX 6600 XT":{"u":1299},"AMD Radeon RX 6650 XT":{"u":1399},"AMD Radeon RX 6700":{"u":1650},"AMD Radeon RX 6700 XT":{"u":1650},"AMD Radeon RX 6750 GRE 12G":{"u":1980},"AMD Radeon RX 6750 XT":{"u":1850},"AMD Radeon RX 6800":{"u":2299},"AMD Radeon RX 6800 XT":{"u":2200},"AMD Radeon RX 6950 XT":{"u":3200},"AMD Radeon RX 7600":{"u":1650},"AMD Radeon RX 7600 XT":{"u":2199},"AMD Radeon RX 7700 XT":{"u":2800},"AMD Radeon RX 7800 XT":{"u":3499},"AMD Radeon RX 7900 GRE":{"u":3368},"AMD Radeon RX 7900 XT":{"u":6000},"AMD Radeon RX 7900 XTX":{"u":6099},"AMD Radeon RX 9060 XT":{"u":2800},"AMD Radeon RX 9070":{"u":5900},"AMD Radeon RX 9070 XT":{"u":6000},"NVIDIA GeForce GT 220":{"u":45},"NVIDIA GeForce GT 240":{"u":35},"NVIDIA GeForce GT 610":{"u":60},"NVIDIA GeForce GT 620":{"u":65},"NVIDIA GeForce GT 630":{"u":88},"NVIDIA GeForce GT 640":{"u":75},"NVIDIA GeForce GT 705":{"u":75},"NVIDIA GeForce GT 730":{"u":110},"NVIDIA GeForce GT 740":{"u":100},"NVIDIA GeForce GT 1030":{"u":240},"NVIDIA GeForce GTX 260":{"u":50},"NVIDIA GeForce GTX 275":{"u":80},"NVIDIA GeForce GTX 280":{"u":70},"NVIDIA GeForce GTX 285":{"u":69},"NVIDIA GeForce GTX 295":{"u":180},"NVIDIA GeForce GTX 460":{"u":308},"NVIDIA GeForce GTX 550 Ti":{"u":80},"NVIDIA GeForce GTX 560":{"u":58},"NVIDIA GeForce GTX 560 Ti":{"u":59},"NVIDIA GeForce GTX 580":{"u":98},"NVIDIA GeForce GTX 650":{"u":92},"NVIDIA GeForce GTX 650 Ti":{"u":90},"NVIDIA GeForce GTX 650 Ti Boost":{"u":100},"NVIDIA GeForce GTX 660":{"u":148},"NVIDIA GeForce GTX 680":{"u":300},"NVIDIA GeForce GTX 690":{"u":767},"NVIDIA GeForce GTX 745":{"u":197},"NVIDIA GeForce GTX 750":{"u":160},"NVIDIA GeForce GTX 750 Ti":{"u":209},"NVIDIA GeForce GTX 760":{"u":175},"NVIDIA GeForce GTX 770":{"u":353},"NVIDIA GeForce GTX 950":{"u":230},"NVIDIA GeForce GTX 960":{"u":298},"NVIDIA GeForce GTX 970":{"u":400},"NVIDIA GeForce GTX 980":{"u":675},"NVIDIA GeForce GTX 980 Ti":{"u":994},"NVIDIA GeForce GTX 1050":{"u":300},"NVIDIA GeForce GTX 1060 6G":{"u":620},"NVIDIA GeForce GTX 1650":{"u":620},"NVIDIA GeForce GTX 1660 Super":{"u":850},"NVIDIA GeForce RTX 2060":{"u":1099},"NVIDIA GeForce RTX 2080 Super":{"u":1349},"NVIDIA GeForce RTX 3070":{"u":1950},"NVIDIA GeForce RTX 3080 10G":{"u":3049},"NVIDIA GeForce RTX 3090":{"u":4954},"NVIDIA GeForce RTX 4060":{"u":2864},"NVIDIA GeForce RTX 4070":{"u":3878},"NVIDIA GeForce RTX 4090":{"u":16360},"Intel Core i7-2600":{"u":128},"Intel Core i9-13900K":{"u":974},"酷冷至尊 Q300L":{"p":299,"u":80},"酷冷至尊 MB400L":{"p":119,"u":49},"酷冷至尊 TD500 Mesh":{"p":298,"u":99},"先马 平头哥M2":{"p":109,"u":35},"先马 趣造":{"p":84,"u":45},"先马 黑洞5":{"p":175,"u":96},"先马 鲁班1":{"p":140,"u":50},"爱国者 星璨":{"p":57,"u":52},"爱国者 破晓X":{"p":121,"u":100},"爱国者 YOGO M2":{"p":130,"u":50},"乔思伯 D31":{"p":283,"u":80},"乔思伯 C6":{"p":145,"u":92},"乔思伯 A4":{"p":354,"u":194},"乔思伯 U4":{"p":140,"u":94},"联力 216":{"p":391,"u":229},"联力 O11 Dynamic":{"p":547,"u":301},"长城 阿基米德KM-1":{"p":109,"u":60},"鑫谷 拉克斯":{"p":106,"u":62},"银欣 FARA R1":{"p":499,"u":275},"安钛克 NX200M":{"p":312,"u":172},"航嘉 S920":{"p":128,"u":42},"大水牛 追风者":{"p":77,"u":20},"海盗船 4000D":{"p":191,"u":174},"乔思伯 N3 NAS":{"p":583,"u":233},"铭瑄 B660":{"u":391},"昂达 B660PRO":{"u":450},"索泰 B660M":{"u":462},"梅捷 B660GAMING":{"u":506},"精粤 B660PLUS":{"u":372},"超微 B660WIFI":{"u":425},"七彩虹 B660MAX":{"u":564},"昂达 B760":{"u":166},"映泰 B760PRO":{"u":122},"映泰 B760M":{"u":119},"索泰 B760GAMING":{"u":160},"翔升 B760PLUS":{"u":144},"泰安 B760WIFI":{"u":167},"ASRock 华擎 B760MAX":{"u":160},"ASUS 华硕 B450":{"u":132},"影驰 B450PRO":{"u":179},"影驰 B450M":{"u":138},"影驰 B450GAMING":{"u":126},"泰安 B450PLUS":{"u":146},"超微 B450WIFI":{"u":131},"MSI 微星 B450MAX":{"u":145},"铭瑄 B550":{"u":230},"影驰 B550PRO":{"u":250},"蓝宝石 B550M":{"u":227},"索泰 B550GAMING":{"u":278},"泰安 B550PLUS":{"u":254},"MSI 微星 B550WIFI":{"u":274},"泰安 B550MAX":{"u":187},"ASRock 华擎 B650":{"u":364},"影驰 B650PRO":{"u":269},"影驰 B650M":{"u":338},"翔升 B650GAMING":{"u":247},"顶星 B650PLUS":{"u":270},"磐正 B650WIFI":{"u":244},"信步 B650MAX":{"u":307},"三星 NVMe 1T":{"p":822,"u":650},"西部数据 NVMe 1T":{"p":842,"u":650},"致态 NVMe 1T":{"p":808,"u":650},"铠侠 NVMe 1T":{"p":785,"u":650},"金士顿 NVMe 1T":{"p":784,"u":650},"英睿达 NVMe 1T":{"p":806,"u":650},"光威 NVMe 1T":{"p":815,"u":650},"雷克沙 NVMe 1T":{"p":827,"u":650},"西部数据 HDD 4T":{"p":1137,"u":589},"希捷 HDD 4T":{"p":1157,"u":589},"东芝 HDD 4T":{"p":1136,"u":589},"NVIDIA GeForce GTX 1660":{"u":722},"NVIDIA GeForce GTX 1050 3G":{"u":240},"NVIDIA GeForce GTX 1650 GDDR6":{"u":620},"金士顿 DDR3 1333 4G 单条":{"u":20},"金士顿 DDR3 1600 4G 单条":{"u":21},"金士顿 DDR3 1600 16G 单条":{"u":135},"金士顿 DDR4 2666 8G 单条":{"p":125,"u":78},"金士顿 DDR4 3000 8G 单条":{"p":130,"u":81},"金士顿 DDR4 3200 8G 单条":{"p":135,"u":84},"金士顿 DDR4 3000 16G 单条":{"p":260,"u":161},"金士顿 DDR4 3200 16G 单条":{"p":270,"u":167},"金士顿 DDR4 3200 32G 单条":{"p":520,"u":322},"金士顿 DDR4 3600 32G 单条":{"p":545,"u":338},"金士顿 DDR5 4800 16G 单条":{"p":404,"u":250},"金士顿 DDR5 5600 16G 单条":{"p":430,"u":267},"金士顿 DDR5 5600 32G 单条":{"p":830,"u":515},"金士顿 DDR5 6000 64G 单条":{"p":1696,"u":1052},"威刚 DDR3 1333 4G 单条":{"u":20},"威刚 DDR3 1600 4G 单条":{"u":21},"威刚 DDR3 1600 16G 单条":{"u":130},"威刚 DDR4 2666 8G 单条":{"p":120,"u":74},"威刚 DDR4 3000 8G 单条":{"p":125,"u":78},"威刚 DDR4 3200 8G 单条":{"p":130,"u":81},"威刚 DDR4 3000 16G 单条":{"p":250,"u":155},"威刚 DDR4 3200 16G 单条":{"p":260,"u":161},"威刚 DDR4 3200 32G 单条":{"p":499,"u":309},"威刚 DDR4 3600 32G 单条":{"p":523,"u":324},"威刚 DDR5 4800 16G 单条":{"p":388,"u":241},"威刚 DDR5 5600 16G 单条":{"p":413,"u":256},"威刚 DDR5 6000 16G 单条":{"p":438,"u":272},"威刚 DDR5 5600 32G 单条":{"p":797,"u":494},"威刚 DDR5 6000 64G 单条":{"p":1628,"u":1009},"海盗船 DDR3 1333 4G 单条":{"u":21},"海盗船 DDR3 1600 4G 单条":{"u":22},"海盗船 DDR3 1600 16G 单条":{"u":143},"海盗船 DDR4 2666 8G 单条":{"p":132,"u":82},"海盗船 DDR4 3000 8G 单条":{"p":138,"u":86},"海盗船 DDR4 3200 8G 单条":{"p":143,"u":89},"海盗船 DDR4 3000 16G 单条":{"p":276,"u":171},"海盗船 DDR4 3200 16G 单条":{"p":287,"u":178},"海盗船 DDR4 3200 32G 单条":{"p":551,"u":342},"海盗船 DDR4 3600 32G 单条":{"p":578,"u":358},"海盗船 DDR5 4800 16G 单条":{"p":428,"u":265},"海盗船 DDR5 5600 16G 单条":{"p":456,"u":283},"海盗船 DDR5 5600 32G 单条":{"p":880,"u":546},"海盗船 DDR5 6000 64G 单条":{"p":1798,"u":1115},"芝奇 DDR3 1333 4G 单条":{"u":21},"芝奇 DDR3 1600 4G 单条":{"u":22},"芝奇 DDR3 1600 8G 单条":{"u":71},"芝奇 DDR3 1600 16G 单条":{"u":138},"芝奇 DDR4 2666 8G 单条":{"p":127,"u":79},"芝奇 DDR4 3000 8G 单条":{"p":133,"u":82},"芝奇 DDR4 3200 8G 单条":{"p":138,"u":86},"芝奇 DDR4 3000 16G 单条":{"p":265,"u":164},"芝奇 DDR4 3200 16G 单条":{"p":276,"u":171},"芝奇 DDR4 3200 32G 单条":{"p":530,"u":329},"芝奇 DDR4 3600 32G 单条":{"p":556,"u":345},"芝奇 DDR5 4800 16G 单条":{"p":412,"u":255},"芝奇 DDR5 5600 16G 单条":{"p":439,"u":272},"芝奇 DDR5 6000 16G 单条":{"p":465,"u":288},"芝奇 DDR5 5600 32G 单条":{"p":847,"u":525},"芝奇 DDR5 6000 32G 单条":{"p":897,"u":556},"芝奇 DDR5 6000 64G 单条":{"p":1730,"u":1073},"光威 DDR3 1333 4G 单条":{"u":18},"光威 DDR3 1600 4G 单条":{"u":19},"光威 DDR3 1600 16G 单条":{"u":124},"光威 DDR4 2666 8G 单条":{"p":115,"u":71},"光威 DDR4 3000 8G 单条":{"p":120,"u":74},"光威 DDR4 3200 8G 单条":{"p":124,"u":77},"光威 DDR4 3000 16G 单条":{"p":239,"u":148},"光威 DDR4 3200 32G 单条":{"p":478,"u":296},"光威 DDR4 3600 32G 单条":{"p":501,"u":311},"光威 DDR5 4800 16G 单条":{"p":372,"u":231},"光威 DDR5 5600 16G 单条":{"p":396,"u":246},"光威 DDR5 6000 16G 单条":{"p":419,"u":260},"光威 DDR5 5600 32G 单条":{"p":764,"u":474},"光威 DDR5 6000 32G 单条":{"p":809,"u":502},"光威 DDR5 6000 64G 单条":{"p":1560,"u":967},"英睿达 DDR3 1333 4G 单条":{"u":19},"英睿达 DDR3 1600 4G 单条":{"u":20},"英睿达 DDR3 1600 8G 单条":{"u":69},"英睿达 DDR3 1600 16G 单条":{"u":132},"英睿达 DDR4 2666 8G 单条":{"p":122,"u":76},"英睿达 DDR4 3000 8G 单条":{"p":127,"u":79},"英睿达 DDR4 3200 8G 单条":{"p":132,"u":82},"英睿达 DDR4 3000 16G 单条":{"p":255,"u":158},"英睿达 DDR4 3200 16G 单条":{"p":265,"u":164},"英睿达 DDR4 3200 32G 单条":{"p":510,"u":316},"英睿达 DDR4 3600 32G 单条":{"p":534,"u":331},"英睿达 DDR5 4800 16G 单条":{"p":396,"u":246},"英睿达 DDR5 5600 16G 单条":{"p":421,"u":261},"英睿达 DDR5 6000 16G 单条":{"p":447,"u":277},"英睿达 DDR5 5600 32G 单条":{"p":813,"u":504},"英睿达 DDR5 6000 32G 单条":{"p":862,"u":534},"英睿达 DDR5 6000 64G 单条":{"p":1662,"u":1030},"金百达 DDR3 1333 4G 单条":{"u":17},"金百达 DDR3 1600 4G 单条":{"u":18},"金百达 DDR3 1600 16G 单条":{"u":127},"金百达 DDR4 2666 8G 单条":{"p":117,"u":73},"金百达 DDR4 3000 8G 单条":{"p":122,"u":76},"金百达 DDR4 3200 8G 单条":{"p":127,"u":79},"金百达 DDR4 3000 16G 单条":{"p":244,"u":151},"金百达 DDR4 3200 32G 单条":{"p":489,"u":303},"金百达 DDR4 3600 32G 单条":{"p":512,"u":317},"金百达 DDR5 4800 16G 单条":{"p":380,"u":236},"金百达 DDR5 5600 16G 单条":{"p":404,"u":250},"金百达 DDR5 5600 32G 单条":{"p":780,"u":484},"金百达 DDR5 6000 64G 单条":{"p":1594,"u":988},"影驰 DDR3 1333 4G 单条":{"u":18},"影驰 DDR3 1600 4G 单条":{"u":19},"影驰 DDR3 1600 8G 单条":{"u":65},"影驰 DDR3 1600 16G 单条":{"u":126},"影驰 DDR4 2666 8G 单条":{"p":116,"u":72},"影驰 DDR4 3000 8G 单条":{"p":121,"u":75},"影驰 DDR4 3200 8G 单条":{"p":126,"u":78},"影驰 DDR4 3000 16G 单条":{"p":242,"u":150},"影驰 DDR4 3200 16G 单条":{"p":251,"u":156},"影驰 DDR4 3200 32G 单条":{"p":484,"u":300},"影驰 DDR4 3600 32G 单条":{"p":507,"u":314},"影驰 DDR5 4800 16G 单条":{"p":376,"u":233},"影驰 DDR5 5600 16G 单条":{"p":400,"u":248},"影驰 DDR5 6000 16G 单条":{"p":424,"u":263},"影驰 DDR5 5600 32G 单条":{"p":772,"u":479},"影驰 DDR5 6000 32G 单条":{"p":818,"u":507},"影驰 DDR5 6000 64G 单条":{"p":1577,"u":978},"宇瞻 DDR3 1333 4G 单条":{"u":19},"宇瞻 DDR3 1600 4G 单条":{"u":20},"宇瞻 DDR3 1600 8G 单条":{"u":70},"宇瞻 DDR3 1600 16G 单条":{"u":135},"宇瞻 DDR4 2666 8G 单条":{"p":125,"u":78},"宇瞻 DDR4 3000 8G 单条":{"p":130,"u":81},"宇瞻 DDR4 3200 8G 单条":{"p":135,"u":84},"宇瞻 DDR4 3000 16G 单条":{"p":260,"u":161},"宇瞻 DDR4 3200 16G 单条":{"p":270,"u":167},"宇瞻 DDR4 3200 32G 单条":{"p":520,"u":322},"宇瞻 DDR4 3600 32G 单条":{"p":545,"u":338},"宇瞻 DDR5 4800 16G 单条":{"p":404,"u":250},"宇瞻 DDR5 5600 16G 单条":{"p":430,"u":267},"宇瞻 DDR5 6000 16G 单条":{"p":456,"u":283},"宇瞻 DDR5 5600 32G 单条":{"p":830,"u":515},"宇瞻 DDR5 6000 32G 单条":{"p":880,"u":546},"宇瞻 DDR5 6000 64G 单条":{"p":1696,"u":1052},"十铨 DDR3 1333 4G 单条":{"u":18},"十铨 DDR3 1600 4G 单条":{"u":19},"十铨 DDR3 1600 8G 单条":{"u":67},"十铨 DDR3 1600 16G 单条":{"u":130},"十铨 DDR4 2666 8G 单条":{"p":120,"u":74},"十铨 DDR4 3000 8G 单条":{"p":125,"u":78},"十铨 DDR4 3200 8G 单条":{"p":130,"u":81},"十铨 DDR4 3000 16G 单条":{"p":250,"u":155},"十铨 DDR4 3200 16G 单条":{"p":260,"u":161},"十铨 DDR4 3200 32G 单条":{"p":499,"u":309},"十铨 DDR4 3600 32G 单条":{"p":523,"u":324},"十铨 DDR5 4800 16G 单条":{"p":388,"u":241},"十铨 DDR5 5600 16G 单条":{"p":413,"u":256},"十铨 DDR5 6000 16G 单条":{"p":438,"u":272},"十铨 DDR5 5600 32G 单条":{"p":797,"u":494},"十铨 DDR5 6000 32G 单条":{"p":845,"u":524},"十铨 DDR5 6000 64G 单条":{"p":1628,"u":1009},"阿斯加特 DDR3 1333 4G 单条":{"u":19},"阿斯加特 DDR3 1600 4G 单条":{"u":20},"阿斯加特 DDR3 1600 8G 单条":{"u":70},"阿斯加特 DDR3 1600 16G 单条":{"u":135},"阿斯加特 DDR4 2666 8G 单条":{"p":125,"u":78},"阿斯加特 DDR4 3000 8G 单条":{"p":130,"u":81},"阿斯加特 DDR4 3200 8G 单条":{"p":135,"u":84},"阿斯加特 DDR4 3000 16G 单条":{"p":260,"u":161},"阿斯加特 DDR4 3200 16G 单条":{"p":270,"u":167},"阿斯加特 DDR4 3200 32G 单条":{"p":520,"u":322},"阿斯加特 DDR4 3600 32G 单条":{"p":545,"u":338},"阿斯加特 DDR5 4800 16G 单条":{"p":404,"u":250},"阿斯加特 DDR5 5600 16G 单条":{"p":430,"u":267},"阿斯加特 DDR5 6000 16G 单条":{"p":456,"u":283},"阿斯加特 DDR5 5600 32G 单条":{"p":830,"u":515},"阿斯加特 DDR5 6000 32G 单条":{"p":880,"u":546},"阿斯加特 DDR5 6000 64G 单条":{"p":1696,"u":1052},"朗科 DDR3 1333 4G 单条":{"u":16},"朗科 DDR3 1600 4G 单条":{"u":17},"朗科 DDR3 1600 8G 单条":{"u":62},"朗科 DDR3 1600 16G 单条":{"u":119},"朗科 DDR4 2666 8G 单条":{"p":110,"u":68},"朗科 DDR4 3000 8G 单条":{"p":114,"u":71},"朗科 DDR4 3200 8G 单条":{"p":119,"u":74},"朗科 DDR4 3000 16G 单条":{"p":229,"u":142},"朗科 DDR4 3200 16G 单条":{"p":238,"u":148},"朗科 DDR4 3200 32G 单条":{"p":458,"u":284},"朗科 DDR4 3600 32G 单条":{"p":480,"u":298},"朗科 DDR5 4800 16G 单条":{"p":356,"u":221},"朗科 DDR5 5600 16G 单条":{"p":378,"u":234},"朗科 DDR5 6000 16G 单条":{"p":401,"u":249},"朗科 DDR5 5600 32G 单条":{"p":730,"u":453},"朗科 DDR5 6000 32G 单条":{"p":774,"u":480},"朗科 DDR5 6000 64G 单条":{"p":1492,"u":925},"玖合 DDR3 1333 4G 单条":{"u":17},"玖合 DDR3 1600 4G 单条":{"u":18},"玖合 DDR3 1600 8G 单条":{"u":70},"玖合 DDR3 1600 16G 单条":{"u":135},"玖合 DDR4 2666 8G 单条":{"p":125,"u":78},"玖合 DDR4 3000 8G 单条":{"p":130,"u":81},"玖合 DDR4 3200 8G 单条":{"p":135,"u":84},"玖合 DDR4 3000 16G 单条":{"p":260,"u":161},"玖合 DDR4 3200 16G 单条":{"p":270,"u":167},"玖合 DDR4 3200 32G 单条":{"p":520,"u":322},"玖合 DDR4 3600 32G 单条":{"p":545,"u":338},"玖合 DDR5 4800 16G 单条":{"p":404,"u":250},"玖合 DDR5 5600 16G 单条":{"p":430,"u":267},"玖合 DDR5 6000 16G 单条":{"p":456,"u":283},"玖合 DDR5 5600 32G 单条":{"p":830,"u":515},"玖合 DDR5 6000 32G 单条":{"p":880,"u":546},"玖合 DDR5 6000 64G 单条":{"p":1696,"u":1052},"金泰克 DDR3 1333 4G 单条":{"u":16},"金泰克 DDR3 1600 4G 单条":{"u":17},"金泰克 DDR3 1600 8G 单条":{"u":63},"金泰克 DDR3 1600 16G 单条":{"u":122},"金泰克 DDR4 2666 8G 单条":{"p":112,"u":69},"金泰克 DDR4 3000 8G 单条":{"p":117,"u":73},"金泰克 DDR4 3200 8G 单条":{"p":122,"u":76},"金泰克 DDR4 3000 16G 单条":{"p":234,"u":145},"金泰克 DDR4 3200 16G 单条":{"p":243,"u":151},"金泰克 DDR4 3200 32G 单条":{"p":468,"u":290},"金泰克 DDR4 3600 32G 单条":{"p":491,"u":304},"金泰克 DDR5 4800 16G 单条":{"p":364,"u":226},"金泰克 DDR5 5600 16G 单条":{"p":387,"u":240},"金泰克 DDR5 6000 16G 单条":{"p":410,"u":254},"金泰克 DDR5 5600 32G 单条":{"p":747,"u":463},"金泰克 DDR5 6000 32G 单条":{"p":792,"u":491},"金泰克 DDR5 6000 64G 单条":{"p":1526,"u":946},"宏想 DDR3 1333 4G 单条":{"u":16},"宏想 DDR3 1600 4G 单条":{"u":17},"宏想 DDR3 1600 8G 单条":{"u":70},"宏想 DDR3 1600 16G 单条":{"u":135},"宏想 DDR4 2666 8G 单条":{"p":125,"u":78},"宏想 DDR4 3000 8G 单条":{"p":130,"u":81},"宏想 DDR4 3200 8G 单条":{"p":135,"u":84},"宏想 DDR4 3000 16G 单条":{"p":260,"u":161},"宏想 DDR4 3200 16G 单条":{"p":270,"u":167},"宏想 DDR4 3200 32G 单条":{"p":520,"u":322},"宏想 DDR4 3600 32G 单条":{"p":545,"u":338},"宏想 DDR5 4800 16G 单条":{"p":404,"u":250},"宏想 DDR5 5600 16G 单条":{"p":430,"u":267},"宏想 DDR5 6000 16G 单条":{"p":456,"u":283},"宏想 DDR5 5600 32G 单条":{"p":830,"u":515},"宏想 DDR5 6000 32G 单条":{"p":880,"u":546},"宏想 DDR5 6000 64G 单条":{"p":1696,"u":1052},"协德 DDR3 1333 4G 单条":{"u":16},"协德 DDR3 1600 4G 单条":{"u":17},"协德 DDR3 1600 8G 单条":{"u":60},"协德 DDR3 1600 16G 单条":{"u":115},"协德 DDR4 2666 8G 单条":{"p":106,"u":66},"协德 DDR4 3000 8G 单条":{"p":110,"u":68},"协德 DDR4 3200 8G 单条":{"p":115,"u":71},"协德 DDR4 3000 16G 单条":{"p":221,"u":137},"协德 DDR4 3200 16G 单条":{"p":230,"u":143},"协德 DDR4 3200 32G 单条":{"p":442,"u":274},"协德 DDR4 3600 32G 单条":{"p":463,"u":287},"协德 DDR5 4800 16G 单条":{"p":344,"u":213},"协德 DDR5 5600 16G 单条":{"p":366,"u":227},"协德 DDR5 6000 16G 单条":{"p":387,"u":240},"协德 DDR5 5600 32G 单条":{"p":706,"u":438},"协德 DDR5 6000 32G 单条":{"p":748,"u":464},"协德 DDR5 6000 64G 单条":{"p":1442,"u":894},"金士顿 DDR4 3600 16G 单条":{"p":283,"u":175},"海盗船 DDR4 3600 16G 单条":{"p":300,"u":186},"芝奇 DDR4 3600 16G 单条":{"p":289,"u":179},"英睿达 DDR4 3600 16G 单条":{"p":278,"u":172},"影驰 DDR4 3600 16G 单条":{"p":264,"u":164},"宇瞻 DDR4 3600 16G 单条":{"p":283,"u":175},"十铨 DDR4 3600 16G 单条":{"p":272,"u":169},"阿斯加特 DDR4 3600 16G 单条":{"p":283,"u":175},"朗科 DDR4 3600 16G 单条":{"p":249,"u":154},"玖合 DDR4 3600 16G 单条":{"p":283,"u":175},"金泰克 DDR4 3600 16G 单条":{"p":255,"u":158},"宏想 DDR4 3600 16G 单条":{"p":283,"u":175},"协德 DDR4 3600 16G 单条":{"p":241,"u":149},"金士顿 DDR5 6400 32G 单条":{"p":930,"u":577},"威刚 DDR5 6400 32G 单条":{"p":892,"u":553},"海盗船 DDR5 6400 32G 单条":{"p":985,"u":611},"芝奇 DDR5 6400 32G 单条":{"p":948,"u":588},"光威 DDR5 6400 32G 单条":{"p":855,"u":530},"英睿达 DDR5 6400 32G 单条":{"p":911,"u":565},"金百达 DDR5 6400 32G 单条":{"p":874,"u":542},"影驰 DDR5 6400 32G 单条":{"p":865,"u":536},"宇瞻 DDR5 6400 32G 单条":{"p":930,"u":577},"十铨 DDR5 6400 32G 单条":{"p":892,"u":553},"阿斯加特 DDR5 6400 32G 单条":{"p":930,"u":577},"朗科 DDR5 6400 32G 单条":{"p":818,"u":507},"玖合 DDR5 6400 32G 单条":{"p":930,"u":577},"金泰克 DDR5 6400 32G 单条":{"p":837,"u":519},"宏想 DDR5 6400 32G 单条":{"p":930,"u":577},"协德 DDR5 6400 32G 单条":{"p":790,"u":490},"酷冷至尊 T400i":{"p":84,"u":28},"利民 AX120 R SE":{"p":59,"u":45},"利民 AK120":{"p":82,"u":45},"利民 PA120":{"p":132,"u":60},"利民 FC140":{"p":291,"u":152},"九州风神 玄冰400":{"p":35,"u":32},"九州风神 AK620":{"p":299,"u":144},"猫头鹰 NH-D15":{"p":606,"u":214},"猫头鹰 NH-U12S":{"p":530,"u":100},"雅浚 B3":{"p":83,"u":30},"利民 水冷 360":{"p":315,"u":195},"九州风神 冰堡垒360":{"p":382,"u":347},"瓦尔基里 E360":{"p":829,"u":514},"恩杰 Kraken 240":{"p":1198,"u":743},"先马 XW240":{"p":378,"u":234},"服务器风冷 SP3":{"p":194,"u":109},"超频三 红海H4":{"p":55,"u":45},"ID-COOLING SE-224":{"p":114,"u":71},"利民 水冷 240":{"p":218,"u":94},"超频三 巨浪360":{"p":283,"u":175},"服务器风冷 SP5":{"p":199,"u":158},"九州风神 大霜塔V5":{"u":68},"酷冷至尊 ML240L":{"u":189,"p":300},"酷冷至尊 暴雪T520":{"u":59},"追风者 NV5":{"u":128,"p":221},"分形工艺 North":{"u":560,"p":899},"乔思伯 HX6250":{"u":149},"乔思伯 CR-1000":{"p":58},"NZXT H5 Flow":{"p":349},"NAS 8 盘位机箱":{"p":279,"u":173},"NAS 12 盘位机箱":{"p":484,"u":300},"4U 服务器机箱":{"p":188,"u":117},"8 盘位工作站塔":{"p":523,"u":324}};
Object.entries(REAL_PRICES).forEach(([n,o])=>{const p=catOf.size&&[...catOf.keys()].find(x=>x.n===n);if(!p)return;if(o.p!=null)p.p=o.p;if(o.u!=null)p.u=o.u;});
/* CPU 实价修正（2026-10 闲鱼/京东） */
const CPU_PRICE_FIX2={'Intel Core i7-7800X':[null,180],'Intel Core i7-7820X':[null,200],'Intel Core i9-7900X':[null,480],'Intel Core i9-7940X':[null,600],'Intel Core i9-9980XE':[null,1600],'Intel Core i9-10980XE':[null,2500],'AMD Threadripper 1900X':[null,380],'AMD Threadripper 1920X':[null,620],'AMD Threadripper 1950X':[null,480],'AMD Threadripper 2920X':[null,800],'AMD Threadripper 2950X':[null,1400],'AMD Threadripper 2990WX':[null,2400],'AMD Threadripper 3970X':[null,3600],'AMD Threadripper 3990X':[null,9500],'AMD Threadripper 7960X':[8599,8200],'AMD Threadripper 7970X':[11299,10500],'AMD Threadripper 7980X':[21599,16700],'AMD Threadripper 7995WX':[38000,32000],'AMD EPYC 7702':[null,2200],'AMD EPYC 7763':[null,5200],'AMD EPYC 9654':[null,21500]};
C.forEach(c=>{const f=CPU_PRICE_FIX2[c.n];if(f){c.p=f[0];c.u=f[1];}});
[G,C,B,M,P,H,ST,K].forEach(arr=>arr.forEach(x=>{if(x.p!=null&&x.u!=null&&x.p<x.u*1.15)x.p=Math.round(x.u*1.15);}));
  /* 只挂全新价的主板（无二手实拍数据） */
  const MB_NEW_ONLY=new Set([]);
  B.forEach(b=>{if(MB_NEW_ONLY.has(b.n))b.u=null;});
  /* 最终价格校正（实拍价，避免被其它环节二次加工） */
  const MB_FINAL={'七彩虹 战斧 B550M-GAMING WIFI6E V14':[542,479]};
  B.forEach(b=>{const f=MB_FINAL[b.n];if(f){b.p=f[0];b.u=f[1];}});
  /* HEDT X299/X399：无实拍，按用户给的行情区间（2000多~3/4000）定的估算值 */
  const MB_EST_FIX={'精粤 B650M-D':[null,348],'精粤 B650I Night Devil V2.3':[null,404],'铭瑄 MS-Challenger B650M-K WIFI':[null,473],'铭瑄 MS-Terminator B650M WIFI6':[null,621],'微星 MAG B650M MORTAR WIFI':[null,792],'铭瑄 MS-Challenger H810M-K WIFI':[null,450],'铭瑄 MS-Challenger H810ITX WIFI':[null,548],'铭瑄 MS-eSport H810M WIFI ICE':[null,563],'华擎 B860M-X WiFi':[null,585],'七彩虹 BATTLE-AX B860M-E WIFI V20':[null,597],'铭瑄 MS-Terminator B860M WIFI':[null,684],'七彩虹 BATTLE-AX B860M-PLUS S WIFI7 V20':[null,702],'华擎 B860M Pro RS WiFi':[null,779],'微星 PRO B860M-B WIFI':[null,806],'华硕 TUF GAMING B860M-PLUS WIFI':[null,943],'华擎 Z890 Steel Legend':[1322,980],'华硕 ROG STRIX Z890-A':[1438,1046],'七彩虹 CVN Z890M':[1509,1085],'微星 MAG B860M MORTAR WIFI':[null,1091],'七彩虹 CVN B860I GAMING FROZEN V20':[null,1132],'微星 PRO Z890-P WIFI6E':[null,1169],'微星 X299 SLI PLUS':[0,1500],'华擎 X299 Taichi CLX':[0,1700],'华硕 ROG ZENITH EXTREME':[0,2000],'微星 X399 SLI PLUS':[0,1600],'华擎 X399 Taichi':[0,1700],'华硕 ROG ZENITH II EXTREME':[0,1800],'微星 TRX40 PRO':[0,1500]};
  B.forEach(b=>{const e=MB_EST_FIX[b.n];if(e){if(e[0]===0)b.p=null;else if(e[0]!=null)b.p=e[0];if(e[1]!=null)b.u=e[1];}});

/* 同一型号被重复录入过（GPU 有 1070 Ti/1080 Ti，内存有 16 个品牌各两份），保留先出现的一条 */
(function dedupeParts(){
  [G,C,B,M,P,K,H,ST].forEach(arr=>{
    const seen=new Set();
    for(let i=arr.length-1;i>=0;i--){if(seen.has(arr[i].n))arr.splice(i,1);else seen.add(arr[i].n);}
  });
})();
/* ================= 价格覆盖表 =================
   上面那批数字是 2026-10 按关键词挂牌价中位数估的，个别型号离实际成交价差得远
   （例：i7-2600 原来 119，实际二手挂牌 ~180）。这里留一张开发者用的覆盖表：
     key   = 型号全名（与商店里显示的一字不差）
     value = [全新价, 二手价]，null 表示这个渠道没有货（停产 / 只走二手）
   覆盖发生在所有整族系数之后，写多少就是多少，不再被缩放。
   注意：这是数据层的东西，游戏里没有入口，玩家看不到也改不了。 */

/* ===== 内存实拍校准（2026-10-30 用户淘宝截图）=====
   分清两类来源：
   · 卖 DDR3 拆机的那家二手店，其 DDR4 挂价是【二手拆机价】→ 写 u
   · 光威/金百达/雷克沙/阿斯加特/铭瑄/瓦尔基里 旗舰店的是【全新价】→ 写 p
   二手按品牌档次拉开差距，全新按规格档位走（旗舰店同规格各品牌差得不多）。 */
const RAM_U_RATE={'金士顿':1.0,'海盗船':1.05,'芝奇':0.90,'英睿达':0.96,'宇瞻':0.94,'阿斯加特':0.93,
  '威刚':0.88,'十铨':0.88,'光威':0.85,'影驰':0.86,'金百达':0.84,'金泰克':0.875,'玖合':0.82,'宏想':0.80,'协德':0.78,'朗科':0.82};
/* 二手 DDR4 基准（金士顿，二手店拆机实拍） */
const RAM_U_BASE={'DDR4 2133 8G':205,'DDR4 2400 8G':224,'DDR4 2666 8G':249,'DDR4 3000 8G':265,'DDR4 3200 8G':280,
  'DDR4 2133 16G':430,'DDR4 2400 16G':490,'DDR4 2666 16G':549,'DDR4 3000 16G':575,'DDR4 3200 16G':599,'DDR4 3600 16G':700,
  'DDR4 3200 32G':1150,'DDR4 3600 32G':1250};
/* 全新 DDR4 基准（旗舰店实拍：8G 379~397、16G 679~788、32G 1398~1833） */
const RAM_P_BASE={'DDR4 2133 8G':290,'DDR4 2400 8G':310,'DDR4 2666 8G':330,'DDR4 3000 8G':360,'DDR4 3200 8G':395,
  'DDR4 2133 16G':560,'DDR4 2400 16G':600,'DDR4 2666 16G':640,'DDR4 3000 16G':680,'DDR4 3200 16G':700,'DDR4 3600 16G':800,
  'DDR4 3200 32G':1500,'DDR4 3600 32G':1650};
const DDR3_OBS_U={'金士顿':[21,23,70],'威刚':[20,22,69],'芝奇':[23,23,63],'海盗船':[23,27,79],
  '宇瞻':[21,23,67],'金泰克':[21,23,67],'十铨':[21,23,67],'阿斯加特':[21,23,67],
  '光威':[19,20,64],'影驰':[19,20,65],'金百达':[18,19,66],'朗科':[16,17,62],'玖合':[17,18,70],'宏想':[16,17,70],'协德':[16,17,60]};
M.forEach(m=>{
  if(m.flag)return;   /* 用户淘宝实拍价的旗舰条不要被这轮公式覆盖 */
  const br=m.n.split(' ')[0];
  if(m.m==='DDR4'){
    const key=m.m+' '+m.mhz+' '+m.cap+'G';
    const pbase=RAM_P_BASE[key], ubase=RAM_U_BASE[key];
    if(pbase!=null)m.p=pbase;
    if(ubase!=null)m.u=Math.round(ubase*(RAM_U_RATE[br]||0.86)/5)*5;
    if(m.mult>1){if(m.p!=null)m.p*=m.mult;if(m.u!=null)m.u*=m.mult;}
    return;
  }
  if(m.m==='DDR3'){
    const arr=DDR3_OBS_U[br];
    if(arr){
      if(m.cap===4&&m.mhz===1333)m.u=arr[0];
      else if(m.cap===4&&m.mhz===1600)m.u=arr[1];
      else if(m.cap===8&&m.mhz===1600)m.u=arr[2];
    }
    return;
  }
  if(m.m==='DDR5'){
    /* 2026-10-28 淘宝抓价（16G 1538~1799、32G 2569）清洗后取：16G 6000=1700、32G=2700。
       明显被低价件污染的样本不用（威刚 16G ¥95、光威 32G ¥100、金士顿 32G 1434 倒挂）。 */
    const baseF=m.cap===16?1700:(m.cap===24?2180:(m.cap===32?2700:5400));
    const ff=m.mhz===4800?0.78:(m.mhz===5600?0.95:(m.mhz===6400?1.05:1.0));
    const pr=Math.round(baseF*ff*(RAM_U_RATE[br]||0.86)/5)*5*(m.mult>1?m.mult:1);
    m.p=pr;m.u=Math.round(pr*0.62/5)*5;
  }
});

const PRICE_PATCH={
  /* 下面几条只做一件事：把被 ×1.4 缩放和手工覆盖搞乱的二手价拉回单调，
     不然会出现「更强的卡更便宜」的套利。数值仍待真实行情校准。 */
  'NVIDIA GeForce GTX 1070':[null,700],
  'NVIDIA GeForce GTX 1070 Ti':[null,820],
  'NVIDIA GeForce GTX 1080':[null,950],
  'NVIDIA GeForce GTX 1080 Ti':[null,1150],
  'AMD Radeon RX 5700':[null,700],
  /* 2026-10-30 审计：散热器按「散热瓦数」拉成单调阶梯。
     以前 150W 的 T400i 二手 ¥28，比 120W 的红海H4 ¥45 还便宜，属于明摆着的套利。 */
  '超频三 红海H4':[45,30],
  '九州风神 玄冰400':[45,34],
  '乔思伯 CR-1000':[55,36],
  '酷冷至尊 T400i':[75,45],
  '利民 AX120 R SE':[65,48],
  '雅浚 B3':[79,50],
  '利民 AK120':[85,62],
  'ID-COOLING SE-224':[95,62],
  '酷冷至尊 暴雪T520':[120,66],
  '利民 PA120':[145,98],
  '九州风神 AK620':[260,125],
  '九州风神 大霜塔V5':[200,120],
  '利民 FC140':[285,150],
  /* 2026-10-30 审计：E3 v2 二手价偏高（E3-1230 v2 实际 ~95）；i5-6500/7500 倒挂 */
  'Intel Xeon E3-1220 v2':[null,60],
  'Intel Xeon E3-1230 v2':[null,95],
  'Intel Xeon E3-1240 v2':[null,105],
  'Intel Xeon E3-1270 v2':[null,115],
  'Intel Core i5-6500':[null,110],
  /* 2026-10-30 审计：两代 i9 的二手价被算成了全新价的零头 */
  /* 2026-10-30 审计：同代显卡倒挂 */
  'NVIDIA GeForce RTX 3050 6G':[null,1100],
  'NVIDIA GeForce RTX 3060 Ti G6X':[null,2100],
  /* 2026-10-30 CPU 价格第二轮校准（按闲鱼成交价，同代拉成单调） */
  'AMD Ryzen 5 5500GT':[1099,959],
  'AMD Ryzen 7 5700X':[989,875],
  'AMD Ryzen 5 5600GT':[1319,1079],
  'AMD Ryzen 5 5600X':[799,670],
  'AMD Ryzen 5 2600':[null,225],
  'AMD Ryzen 7 2700X':[null,330],
  'AMD Ryzen 5 3600':[null,415],
  'AMD Ryzen 5 3600X':[null,445],
  'AMD Ryzen 7 3700X':[null,560],
  'AMD Ryzen 5 5500':[529,480],
  'AMD Ryzen 5 5600':[709,645],
  'AMD Ryzen 5 5600G':[1089,925],
  'AMD Ryzen 7 5700G':[1379,1150],
  'AMD Ryzen 7 5700X3D':[2059,1850],
  'AMD Ryzen 7 5800X':[null,995],
  'AMD Ryzen 9 5900X':[null,1560],
  'AMD Ryzen 5 5500X3D':[1579,1379],
  /* 2026-10-30 LGA1700 12/13 代按淘宝实拍（全新散片 + 梯度 = 盒装） */
  'Intel Core i5-12500':[null,1250],
  'Intel Core i5-12600':[null,1250],
  'Intel Core i7-13700K':[2400,2200],
  'Intel Core i7-12700F':[1600,1250],
  'Intel Core i7-12700K':[1775,1575],
  'AMD Athlon 3000G':[null,110],
  'AMD Ryzen 3 3100':[null,199],
  'AMD Ryzen 3 3200G':[null,250],
  'AMD Ryzen 5 3400G':[null,385],
  'AMD Ryzen 9 3900X':[null,880],
  'AMD Ryzen 9 3900XT':[null,930],
  'AMD Athlon 200GE':[null,48],
  'AMD Ryzen 7 1700':[null,220],
  'AMD Ryzen 5 1600':[null,135],
  'AMD Ryzen 3 1200':[null,40],
  'Intel Core i9-11900K':[null,1250],
  'Intel Core i9-10900K':[null,1250],
  'Intel Core i7-11700K':[null,850],
  'Intel Core i5-11600K':[null,650],
  'Intel Core i5-11400':[null,520],
  'Intel Core i5-11400F':[null,470],
  'Intel Core i7-2600':[null,140],
  'Intel Core i7-2600K':[null,170],
  'Intel Core i5-3570K':[null,105],
  'Intel Core i5-3450':[null,85],
  'Intel Core i3-2120':[null,30],
  'Intel Core i5-2300':[null,60],
  'Intel Core i7-4770':[null,170],
  'Intel Core i7-4790K':[null,230],
  'Intel Core i7-4770K':[null,200],
  'Intel Core i5-4690K':[null,135],
  'Intel Xeon E3-1271 v3':[null,160],
  'Intel Xeon E3-1246 v3':[null,150],
  'Intel Xeon E3-1226 v3':[null,130],
  'Intel Xeon E3-1225 v3':[null,120],
  'Intel Core i3-4160':[null,55],
  'Intel Core i3-4130':[null,45],
  'Intel Core i7-7700K':[null,380],
  'Intel Core i7-7700':[null,330],
  'Intel Core i5-7500':[null,165],
  'Intel Core i3-7100':[null,90],
  'Intel Core i3-6100':[null,80],
  'Intel Core i5-6600K':[null,175],
  'Intel Core Ultra 7 265K':[1780,1550],
  'Intel Core Ultra 7 265KF':[1715,1480],
  'Intel Core Ultra 5 245K':[1090,1010],
  'Intel Core Ultra 5 245KF':[1065,960],
  /* 2026-10-30 第三轮：按淘宝实拍截图校准（锐龙 5000 系 + FX） */
  'AMD Ryzen 7 5800X3D':[2380,2119],
  'AMD Ryzen 9 5950X':[null,2019],
  'AMD FX-8350':[null,220],
  /* 2026-10-30 第四轮：AM5 按淘宝实拍 */
  'AMD Ryzen 7 9800X3D':[2629,2379],
  'AMD Ryzen 9 9950X':[3049,2649],
  /* 没有全新依据的（截图里是拆机盒装/旧估算）先只走二手 */
  'AMD Ryzen 5 7500F':[789,545],
  'AMD Ryzen 5 8600G':[908,900],
  'AMD Ryzen 5 9500F':[829,800],
  'AMD Ryzen 5 7600X':[959,665],
  'AMD Ryzen 7 7800X3D':[2099,1629],
  'AMD Ryzen 9 7900X':[2399,1429],
  'AMD Ryzen 9 7950X':[2749,1829],
  'AMD Ryzen 5 9600X':[1155,899],
  'AMD Ryzen 7 9700X':[1489,1275],
  'AMD Ryzen 9 9950X3D':[4275,3699],
  'AMD FX-6300':[null,43],
  /* 没有实拍全新价的：按二手 ×1.1 估 */
  'AMD Ryzen 5 7600':[740,669],
  'AMD Ryzen 7 7700':[960,875],
  'AMD Ryzen 7 7700X':[1210,1099],
  'AMD Ryzen 9 9900X':[2090,1900],
  'AMD Ryzen 5 8400F':[880,797],
  'AMD Ryzen 7 8700G':[1540,1399],
  'AMD Ryzen 5 7600X3D':[1670,1519],
  'AMD Ryzen 9 9900X3D':[3080,2799],
  'AMD Ryzen 9 7900X3D':[2200,1999],
  'AMD Ryzen 9 7950X3D':[3080,2799],

  /* 2026-10-30 第四轮：13/14 代二手价（实拍），有全新价的保持 */
  'Intel Core i5-13600K':[null,1489],
  'Intel Core i7-13700':[null,2049],
  'Intel Core i7-13700F':[null,1489],
  'Intel Core i9-13900K':[3176,2559],

  /* 2026-10-31 全新盒装/散片实拍（盒装优先，散片按梯度补） */
  'Intel Core i3-12100F':[609,470],
  'Intel Core i3-12100':[779,680],
  'Intel Core i5-12400F':[839,690],
  'Intel Core i5-12400':[1035,890],
  'Intel Core i5-12490F':[829,690],
  'Intel Core i5-12600KF':[939,835],
  'Intel Core i5-12600K':[null,1320],
  'Intel Core i7-12700':[1769,1585],
  'Intel Core i7-12700KF':[1429,1250],
  'Intel Core i9-12900K':[2395,2140],
  'Intel Core i9-12900KF':[2248,2000],
  'Intel Core i3-13100F':[639,520],
  'Intel Core i3-13100':[759,645],
  'Intel Core i5-13400F':[965,730],
  'Intel Core i5-13400':[1095,890],
  'Intel Core i5-13490F':[1065,709],
  'Intel Core i5-13600KF':[1175,939],
  'Intel Core i3-14100F':[639,529],
  'Intel Core i3-14100':[779,659],
  'Intel Core i5-14400F':[939,809],
  'Intel Core i5-14600K':[1482,1449],
  'Intel Core i5-14600KF':[1345,1229],
  'Intel Core i7-14700':[2119,1989],
  'Intel Core i7-14700F':[2179,1959],
  'Intel Core i7-14700K':[2450,2349],
  'Intel Core i7-14700KF':[2229,1989],
  'Intel Core i9-14900K':[3250,2979],
  'Intel Core i9-14900KF':[3150,2499],

  /* 2026-10-31 14 代拆机实拍（另一家） */
  'Intel Core i3-14100':[779,660],
  'Intel Core i3-14100F':[639,567],
  'Intel Core i5-14400F':[939,827],
  'Intel Core i5-14500':[null,1417],
  'Intel Core i5-14600K':[1482,1347],
  'Intel Core i5-14600KF':[1345,1207],
  'Intel Core i7-14700':[2119,1957],
  'Intel Core i7-14700KF':[2229,1927],
  'Intel Core i5-14400':[1105,967],
  'Intel Core i5-14490F':[909,825],

  /* 2026-10-31 12/13 代拆机保实拍 */
  'Intel Core i5-12400F':[839,699],
  'Intel Core i5-12400':[1035,889],
  'Intel Core i5-12500':[null,1180],
  'Intel Core i5-12600KF':[939,830],
  'Intel Core i5-12600':[null,1200],
  'Intel Core i7-12700KF':[1429,1240],
  'Intel Core i7-12700K':[1775,1580],
  'Intel Core i3-13100':[759,679],
  'Intel Core i5-13400':[1095,929],
  'Intel Core i5-13600':[null,1270],
  'Intel Core i7-13700F':[null,1490],
  'Intel Core i7-13700':[null,2000],
  'Intel Core i7-13700KF':[null,1500],
  'Intel Core i9-13900KF':[null,1900],
  'Intel Core i9-13900K':[3176,2500],

  /* 2026-10-31 LGA1155 拆机实拍 */
  'Intel Core i3-2100':[null,12],
  'Intel Core i3-2120':[null,12],
  'Intel Core i5-2300':[null,43],
  'Intel Core i5-2400':[null,54],
  'Intel Core i5-3450':[null,56],
  'Intel Core i7-2600':[null,207],
  'Intel Core i7-3770':[null,227],
  /* 带 K 的没拍到，按非 K 往上放，避免倒挂 */
  'Intel Core i7-2600K':[null,230],
  'Intel Core i7-3770K':[null,250],

  /* 2026-10-31 LGA1155 第二轮（另一家更低） */
  'Intel Core i5-2300':[null,42],
  'Intel Core i5-2400':[null,51],
  'Intel Core i5-3450':[null,51],
  'Intel Core i5-2500K':[null,54],
  'Intel Core i7-2600':[null,203],
  'Intel Core i7-2600K':[null,178],
  'Intel Core i7-3770':[null,219],
  'Intel Core i7-3770K':[null,230],
  'Intel Core i5-2390T':[null,39],
  'Intel Core i5-2380P':[null,18],
  'Intel Core i5-2400S':[null,41],
  'Intel Core i5-3330S':[null,47],
  'Intel Core i5-3350P':[null,24],
  'Intel Core i5-3450S':[null,49],
  'Intel Core i5-3470S':[null,51],
  'Intel Core i5-3470T':[null,50],
  'Intel Core i5-3475S':[null,67],
  'Intel Core i5-3550S':[null,56],
  'Intel Core i5-3570S':[null,62],
  'Intel Core i3-3220':[null,16],
  'Intel Pentium G2030':[null,13],
  'Intel Core i5-3570K':[null,72],
  'Intel Xeon E3-1230 v2':[null,94],
  'Intel Xeon E3-1220 v2':[null,30],
  'Intel Xeon E3-1270 v2':[null,155],
  'Intel Xeon E3-1230 v2':[null,95],
  'Intel Xeon E3-1220 v2':[null,35],
  /* 2026-10-31 LGA1150 实拍（芯旺） */
  'Intel Core i7-4790K':[null,325],
  'Intel Core i7-4770':[null,285],
  'Intel Xeon E3-1246 v3':[null,240],
  'Intel Xeon E3-1231 v3':[null,165],
  'Intel Core i5-4690K':[null,125],
  'Intel Core i5-4590T':[null,110],
  'Intel Core i5-4590':[null,106],
  'Intel Core i5-4460':[null,95],
  'Intel Xeon E3-1220 v3':[null,58],
  'Intel Core i3-4160':[null,17],
  'Intel Xeon E3-1226 v3':[null,92],
  /* 2026-10-31 LGA1151（6/7 代）实拍（宇杰） */
  'Intel Core i7-7700K':[null,350],
  'Intel Core i7-7700':[null,330],
  'Intel Core i7-6700':[null,240],
  'Intel Core i7-6700K':[null,215],
  'Intel Core i5-7500':[null,115],
  'Intel Core i5-6600K':[null,90],
  'Intel Core i5-6500':[null,86],
  'Intel Core i5-6400':[null,82],
  'Intel Core i3-7100':[null,20],
  'Intel Core i3-6100':[null,16],
  'Intel Core i3-6100T':[null,22],
  'Intel Core i5-6500T':[null,80],
  'Intel Core i7-6700T':[null,220],
  'Intel Core i5-6600':[null,90],
  'Intel Core i5-7400':[null,104],
  'Intel Core i5-7600':[null,120],
  'Intel Core i5-7600K':[null,140],
  'Intel Core i3-7100T':[null,23],
  'Intel Core i3-4160T':[null,35],
  'Intel Core i5-2400S':[null,41],
  'Intel Core i5-3330S':[null,47],
  'Intel Core i5-3450S':[null,49],
  'Intel Core i5-3475S':[null,67],
  'Intel Core i5-3550S':[null,56],
  'Intel Core i5-3570S':[null,62],
  'Intel Core i5-4430S':[null,88],
  'Intel Core i5-4440S':[null,89],
  'Intel Core i5-4460S':[null,90],
  'Intel Core i5-4570S':[null,95],
  'Intel Core i5-4590S':[null,105],
  'Intel Core i5-4670S':[null,108],
  'Intel Core i5-4690S':[null,115],
  'Intel Core i7-4770S':[null,290],
  'Intel Core i7-4790S':[null,300],
  /* 2026-10-31 LGA1151V2（8 代）实拍（宇杰） */
  'Intel Core i3-8100':[null,107],
  'Intel Core i5-8400':[null,285],
  'Intel Core i5-8500':[null,288],
  'Intel Core i5-8600K':[null,315],
  'Intel Core i7-8700':[null,535],
  'Intel Core i7-8700K':[null,518],
  'Intel Core i3-8300':[null,130],
  'Intel Core i3-8350K':[null,145],
  'Intel Core i5-8600':[null,300],
  'Intel Core i3-8100T':[null,105],
  'Intel Core i5-8400T':[null,275],
  'Intel Core i7-8700T':[null,630],
  'Intel Core i3-8100':[null,111],
  'Intel Core i3-8300':[null,125],
  'Intel Core i5-8400':[null,282],
  'Intel Core i5-8500':[null,285],
  'Intel Core i5-8600':[null,289],
  'Intel Core i7-8700':[null,529],
  'Intel Core i7-8700T':[null,614],
  'Intel Core i3-9100F':[null,100],
  'Intel Core i5-9400F':[null,330],
  'Intel Core i7-9700K':[null,630],
  'Intel Core i3-9100':[null,135],
  'Intel Core i3-9100T':[null,115],
  'Intel Core i5-9400':[null,385],
  'Intel Core i5-9400T':[null,285],
  'Intel Core i5-9500':[null,390],
  'Intel Core i5-9500F':[null,335],
  'Intel Core i5-9500T':[null,290],
  'Intel Core i5-9600':[null,395],
  'Intel Core i5-9600T':[null,325],
  'Intel Core i5-9600K':[null,360],
  'Intel Core i5-9600KF':[null,350],
  'Intel Core i7-9700':[null,625],
  'Intel Core i7-9700F':[null,600],
  'Intel Core i7-9700KF':[null,610],
  'Intel Core i7-9700T':[null,605],
  /* 2026-10-31 9 代高端实拍（飞樾） */
  'Intel Core i9-9900K':[null,1119],
  'Intel Core i9-9900':[null,1199],
  'Intel Core i7-9700K':[null,629],
  'Intel Core i7-9700KF':[null,609],
  'Intel Core i7-9700T':[null,599],
  'Intel Core i9-9900KF':[null,1079],
  'Intel Core i9-9900KS':[null,1799],
  'Intel Core i9-9900T':[null,1249],
  /* 2026-10-31 8/9 代拆机散片（成都松瑞） */
  'Intel Core i7-8700':[null,530],
  'Intel Core i7-8700K':[null,520],
  'Intel Core i7-9700F':[null,600],
  'Intel Core i7-9700KF':[null,615],
  'Intel Core i7-9700':[null,630],
  'Intel Core i7-9700K':[null,640],
  'Intel Core i9-9900KF':[null,1110],
  'Intel Core i9-9900KS':[null,1680],
  'Intel Core i3-10100':[null,495],
  'Intel Core i3-10100F':[null,370],
  'Intel Core i3-10100T':[null,420],
  'Intel Core i3-10105':[null,515],
  'Intel Core i3-10105F':[null,390],
  'Intel Core i3-10105T':[null,440],
  'Intel Core i5-10400':[null,725],
  'Intel Core i5-10400F':[null,570],
  'Intel Core i5-10500':[null,720],
  'Intel Core i5-10500T':[null,640],
  'Intel Core i5-10600KF':[null,560],
  'Intel Core i7-10700':[null,1030],
  'Intel Core i7-10700F':[null,830],
  'Intel Core i7-10700K':[null,1065],
  'Intel Core i7-10700KF':[null,845],
  'Intel Core i9-10900F':[null,1310],
  'Intel Core i9-10900KF':[null,1667],
  'Intel Core i5-11400':[null,700],
  'Intel Core i5-11400F':[null,590],
  'Intel Core i5-11600K':[null,800],
  'Intel Core i7-11700K':[null,1070],
  'Intel Core i7-11700F':[null,825],
  'Intel Core i9-11900K':[null,2130],
  'Intel Core i9-11900F':[null,1260],
  'Intel Core i5-11500':[null,725],
  'Intel Core i5-11600KF':[null,660],
  'Intel Core i7-11700':[null,900],
  'Intel Core i7-11700KF':[null,980],
  'Intel Core i9-11900':[null,2232],
  'Intel Core i9-11900KF':[null,1390],
  /* 2026-10-31 LGA1851 中文盒装实拍（陆创） */
  'Intel Core Ultra 5 245K':[1090,1010],
  'Intel Core Ultra 5 245KF':[1065,960],
  'Intel Core Ultra 7 265K':[1780,1550],
  'Intel Core Ultra 7 265KF':[1715,1480],
  'Intel Core Ultra 9 285K':[3250,2980],
  'Intel Core Ultra 5 230F':[650,600],
  'Intel Core Ultra 3 205':[600,510],
  'Intel Core Ultra 5 225':[1160,950],
  'Intel Core Ultra 5 235':[1130,1030],
  'Intel Core Ultra 5 245':[1290,1250],
  'Intel Core Ultra 7 265':[2050,1885],
  'Intel Core Ultra 9 285':[3820,3440],
  'Intel Core Ultra 9 285T':[3550,3310],
  /* 2026-10-31 LGA2011-3 E5 实拍（远洋） */
  'Intel Xeon E5-2666 v3':[null,117],
  'Intel Xeon E5-2680 v3':[null,18],
  'Intel Xeon E5-2690 v3':[null,26],
  'Intel Xeon E5-2696 v3':[null,210],
  'Intel Xeon E5-2680 v4':[null,44],
  'Intel Xeon E5-2686 v4':[null,101],
  /* 2026-10-31 RTX 5090 按淘宝实价（5090 约 5 万，5090D 约 3.4 万） */
  'NVIDIA GeForce RTX 5090':[50500,48000],
  'NVIDIA GeForce RTX 5090 D':[34500,33000],
};
function allParts(){return [].concat(C,G,B,M,P,K,H,ST);}
(function applyPricePatch(patch){
  const idx=new Map();allParts().forEach(x=>idx.set(x.n,x));
  Object.keys(patch).forEach(k=>{
    const t=idx.get(k),v=patch[k];if(!t||!v)return;
    if(v[0]===null||typeof v[0]==='number')t.p=v[0];
    if(v[1]===null||typeof v[1]==='number')t.u=v[1];
  });
})(PRICE_PATCH);
/* ===== 抓价值回灌（2026-10-28 淘宝/闲鱼中位数，已剔除脏值）=====
   只装「能一一对应到库内型号」的：显卡按型号、电源按品牌+瓦数（该组合库内只有 1 款时）。
   散热/机箱的抓取是「品牌级中位数」，对不上具体型号，故不覆盖。 */
const GPU_CRAWL_U={"NVIDIA GeForce GT 1030":240,"NVIDIA GeForce GT 220":45,"NVIDIA GeForce GT 240":35,"NVIDIA GeForce GT 610":60,"NVIDIA GeForce GT 620":65,"NVIDIA GeForce GT 630":88,"NVIDIA GeForce GT 640":75,"NVIDIA GeForce GT 705":75,"NVIDIA GeForce GT 730":110,"NVIDIA GeForce GT 740":100,"NVIDIA GeForce GTX 1050":300,"NVIDIA GeForce GTX 1050 Ti":488,"NVIDIA GeForce GTX 1060 3G":418,"NVIDIA GeForce GTX 1060 5G":550,"NVIDIA GeForce GTX 1060 6G":620,"NVIDIA GeForce GTX 1070":686,"NVIDIA GeForce GTX 1070 Ti":735,"NVIDIA GeForce GTX 1080":700,"NVIDIA GeForce GTX 1080 Ti":899,"NVIDIA GeForce GTX 1630":380,"NVIDIA GeForce GTX 1650":620,"NVIDIA GeForce GTX 1650 Super":639,"NVIDIA GeForce GTX 1660 Super":850,"NVIDIA GeForce GTX 260":50,"NVIDIA GeForce GTX 275":80,"NVIDIA GeForce GTX 280":70,"NVIDIA GeForce GTX 285":69,"NVIDIA GeForce GTX 295":180,"NVIDIA GeForce GTX 460":308,"NVIDIA GeForce GTX 550 Ti":80,"NVIDIA GeForce GTX 560":58.37,"NVIDIA GeForce GTX 560 Ti":58.8,"NVIDIA GeForce GTX 580":98,"NVIDIA GeForce GTX 650":92,"NVIDIA GeForce GTX 650 Ti":90,"NVIDIA GeForce GTX 650 Ti Boost":99.99};
const PSU_CRAWL_P={"全汉 MEGA 550W":103,"全汉 MEGA 650W":154,"微星 MAG 550W":119,"全汉 MEGA 750W":188,"酷冷至尊 MWE 550W":142,"酷冷至尊 MWE 750W":279,"安钛克 NE 550W":85,"安钛克 NE 650W":129,"安钛克 NE 750W":129,"微星 MAG 750W":279,"振华 卓凌 550W":184,"振华 卓凌 750W":368,"微星 MAG 650W":279,"振华 卓凌 650W":436,"酷冷至尊 MWE 650W":119};
const D5_ANCHOR={'金士顿':1799,'海盗船':1538,'金百达':1690};
G.forEach(g=>{const v=GPU_CRAWL_U[g.n];if(v!=null){g.u=v;if(g.p!=null&&g.p<g.u*1.15)g.p=Math.round(g.u*1.2);}});
P.forEach(q=>{const v=PSU_CRAWL_P[q.n];if(v!=null){q.p=v;if(q.u!=null)q.u=Math.round(v*0.72);}});
M.forEach(m=>{
  if(m.m!=='DDR5'||m.flag)return;
  const br=m.n.split(' ')[0];
  const a=D5_ANCHOR[br]||Math.round(1700*(RAM_U_RATE[br]||0.86));
  const base=m.cap===16?a:(m.cap===24?Math.round(a*1.28):(m.cap===32?Math.round(a*1.65):Math.round(a*3.1)));
  const ff=m.mhz===4800?0.78:(m.mhz===5600?0.95:(m.mhz===6400?1.05:1.0));
  const pr=Math.round(base*ff/5)*5*(m.mult>1?m.mult:1);
  m.p=pr;m.u=Math.round(pr*0.62/5)*5;
});


[G,C,B,M,P,H,ST,K].forEach(arr=>arr.forEach(x=>{if(x.p!=null&&x.u!=null&&x.p<x.u*1.15)x.p=Math.round(x.u*1.15);}));

/* ===== 开 8000 档（2026-11-03 淘宝实拍，只有套条）=====
   8000 是特挑 A-die 极限频率，只保留拍到实价的 6 款，不生成公式条目。 */
(function(){
  [['宏碁','掠夺者 冰刃',16,2,3899],['佰维','DW100',16,2,3900.52],
   ['芝奇','皇家戟',16,2,4798],['金士顿','叛逆者',16,2,5916.03],
   ['科赋','炎龙V',24,2,6699.82],['芝奇','幻锋戟',24,2,6965.35]].forEach(function(a){
    M.push({n:a[0]+' '+a[1]+' DDR5 8000 '+a[2]+'G×2 套条',m:'DDR5',cap:a[2],mhz:8000,
      st:1,cl:36,mult:2,kit:1,flag:1,p:a[4],u:null});
  });
})();

/* ===== 光威 天策/龙武/神武 各档实拍（2026-11-03 旗舰店 SKU 列表）=====
   只加有明确容量+频率+价格的行；单面/双面、龙武RGB弈 这类重复变体先不加。 */
(function(){
  const add=(name,mhz,cap,mult,cl,p)=>{
    M.push({n:name,m:'DDR5',cap:cap,mhz:mhz,st:1,cl:cl,mult:mult||1,
      kit:mult>1?1:0,flag:1,p:p,u:null});
  };
  /* 单条 16G 6000 */
  add('光威 天策 DDR5 6000 16G 单条',6000,16,1,46,1499);
  add('光威 龙武弈 DDR5 6000 16G 单条',6000,16,1,46,1609);
  add('光威 神武RGB DDR5 6000 16G 单条',6000,16,1,46,1699);
  /* 单条 16G 6400 */
  add('光威 龙武 黑 DDR5 6400 16G 单条',6400,16,1,46,1559);
  add('光威 龙武 银 DDR5 6400 16G 单条',6400,16,1,46,1999);
  /* 16G×2 套条 6000 */
  add('光威 天策 DDR5 6000 16G×2 套条',6000,16,2,46,3099);
  add('光威 神策RGB DDR5 6000 16G×2 套条',6000,16,2,46,4199);
  /* 16G×2 套条 6400 */
  add('光威 龙武 黑 DDR5 6400 16G×2 套条',6400,16,2,46,3119);
  add('光威 龙武 银 DDR5 6400 16G×2 套条',6400,16,2,46,3799);
  /* 32G×2 套条 6000 */
  add('光威 龙武 银 DDR5 6000 32G×2 套条',6000,32,2,46,7499);
})();

/* ===== DDR5 16G 5600 单条：换成实拍 =====
   2026-11-03 淘宝截图。海力士拆机条、三星原厂条按用户要求不收录；
   只留 5 个品牌，其余公式条目删掉。套条这档还没拍，先不动。 */
(function(){
  for(let i=M.length-1;i>=0;i--){const x=M[i];
    if(x.m==='DDR5'&&x.mhz===5600&&x.cap===16&&!(x.mult>1))M.splice(i,1);}
  [['威刚','威龙 D300',1259,46],['金百达','银爵',1270,46],['金泰克','速虎',1280,46],
   ['雷克沙','战神',1293,46],['枭鲸','审判者',1135,46],['光威','天策',1489,46]].forEach(function(a){
    M.push({n:a[0]+' '+a[1]+' DDR5 5600 16G 单条',m:'DDR5',cap:16,mhz:5600,st:1,cl:a[3],p:a[2],u:null,flag:1});
  });
})();

/* ===== DDR3 只留实拍过的 6 个品牌 =====
   2026-11-03 用户淘宝截图只覆盖 金士顿/威刚/海盗船/芝奇/宇瞻/金泰克；
   其余 9 个品牌（光威/英睿达/金百达/影驰/十铨/阿斯加特/朗科/玖合/协德）是 10-28 抓的估值，整类删掉。 */
(function(){
  const K=new Set(['金士顿','威刚','海盗船','芝奇','宇瞻','金泰克','协德','光威']);
  for(let i=M.length-1;i>=0;i--){const x=M[i];if(x.m==='DDR3'&&!K.has(x.n.split(' ')[0]))M.splice(i,1);}
  /* 协德、光威按「随机品牌/杂牌」那档算：4G1333 ¥17 / 4G1600 ¥19（马甲条 18.5 取整）/ 8G1600 ¥53 */
  M.forEach(function(x){
    if(x.m!=='DDR3')return;
    const br=x.n.split(' ')[0];
    if(br!=='协德'&&br!=='光威')return;
    x.p=null; x.u=(x.cap===8?53:(x.mhz===1333?17:19));
  });
})();

/* ===== DDR5 4800 整类替换为实拍 =====
   2026-11-03 用户淘宝截图（16G 4800 单条 ¥1060~1336，威刚 D50 16G×2 ¥2348）。
   这个频率只留拍到实价的型号，其余（含套条）全删，不再用公式补。 */
(function(){
  for(let i=M.length-1;i>=0;i--){const x=M[i];if(x.m==='DDR5'&&x.mhz===4800)M.splice(i,1);}
  [['英睿达','',1060,40],['威刚','D300',1170,28],['铭瑄','珈姝',1299,40],['光威','天策',1279,40],
   ['华硕','奔跑者',1290,40],['七彩虹','战斧',1336,28]].forEach(function(a){
    M.push({n:a[0]+(a[1]?' '+a[1]:'')+' DDR5 4800 16G 单条',m:'DDR5',cap:16,mhz:4800,st:1,cl:a[3],p:a[2],u:null,flag:1});
  });
  M.push({n:'威刚 D50 DDR5 4800 16G×2 套条',m:'DDR5',cap:16,mhz:4800,st:1,cl:40,
    mult:2,kit:1,flag:1,p:2348,u:null});
})();




/* 2026-10-31 跑分按 topcpu.net 全量校准（Cinebench R23 多核） */
const CPU_TC_SCORE={"AMD Ryzen 3 1200":3010,
"AMD Ryzen 3 2200G":3586,
"AMD Ryzen 3 3100":5627,
"AMD Ryzen 3 3200G":3292,
"AMD Ryzen 3 3300X":6787,
"AMD Ryzen 5 1400":4017,
"AMD Ryzen 5 1500X":4641,
"AMD Ryzen 5 1600":6233,
"AMD Ryzen 5 2400G":4801,
"AMD Ryzen 5 2600":7101,
"AMD Ryzen 5 2600X":7506,
"AMD Ryzen 5 3400G":4776,
"AMD Ryzen 5 3600":9245,
"AMD Ryzen 5 3600X":9493,
"AMD Ryzen 5 4500":9298,
"AMD Ryzen 5 5500":10550,
"AMD Ryzen 5 5500GT":6907,
"AMD Ryzen 5 5500X3D":9804,
"AMD Ryzen 5 5600":11040,
"AMD Ryzen 5 5600G":10850,
"AMD Ryzen 5 5600GT":8680,
"AMD Ryzen 5 5600X":11464,
"AMD Ryzen 5 7400F":13500,
"AMD Ryzen 5 7500F":13809,
"AMD Ryzen 5 7600":14389,
"AMD Ryzen 5 7600X":15204,
"AMD Ryzen 5 7600X3D":13469,
"AMD Ryzen 5 8400F":13361,
"AMD Ryzen 5 8500G":11521,
"AMD Ryzen 5 8600G":13359,
"AMD Ryzen 5 9500F":12810,
"AMD Ryzen 5 9600X":16284,
"AMD Ryzen 7 1700":8046,
"AMD Ryzen 7 1700X":8737,
"AMD Ryzen 7 2700":8871,
"AMD Ryzen 7 2700X":10106,
"AMD Ryzen 7 3700X":12173,
"AMD Ryzen 7 3800X":13812,
"AMD Ryzen 7 5700G":13945,
"AMD Ryzen 7 5700X":14028,
"AMD Ryzen 7 5700X3D":13524,
"AMD Ryzen 7 5800X":15228,
"AMD Ryzen 7 5800X3D":14514,
"AMD Ryzen 7 7700":19910,
"AMD Ryzen 7 7700X":20001,
"AMD Ryzen 7 7800X3D":17762,
"AMD Ryzen 7 8700G":17858,
"AMD Ryzen 7 9700X":19539,
"AMD Ryzen 7 9800X3D":23349,
"AMD Ryzen 9 3900X":18454,
"AMD Ryzen 9 3900XT":18437,
"AMD Ryzen 9 3950X":24396,
"AMD Ryzen 9 5900X":22046,
"AMD Ryzen 9 5950X":28782,
"AMD Ryzen 9 7900X":29242,
"AMD Ryzen 9 7900X3D":27084,
"AMD Ryzen 9 7950X":38165,
"AMD Ryzen 9 7950X3D":38581,
"AMD Ryzen 9 9900X":32626,
"AMD Ryzen 9 9900X3D":34524,
"AMD Ryzen 9 9950X":42074,
"AMD Ryzen 9 9950X3D":42369,
"Intel Core Ultra 5 245K":25099,
"Intel Core Ultra 5 245KF":25194,
"Intel Core Ultra 7 265K":36296,
"Intel Core Ultra 7 265KF":37273,
"Intel Core Ultra 9 285K":41583,
"Intel Core i3-10100":5565,
"Intel Core i3-10105F":5689,
"Intel Core i3-12100":7985,
"Intel Core i3-12100F":8443,
"Intel Core i3-13100":8566,
"Intel Core i3-13100F":8814,
"Intel Core i3-14100":9077,
"Intel Core i3-14100F":8756,
"Intel Core i3-6100":2565,
"Intel Core i3-6100T":2052,
"Intel Core i3-8100":3597,
"Intel Core i3-8100T":2878,
"Intel Core i3-8350K":4467,
"Intel Core i3-9100":3686,
"Intel Core i3-9100F":4117,
"Intel Core i3-9100T":2949,
"Intel Core i5-10400":7610,
"Intel Core i5-10400F":7576,
"Intel Core i5-10500":8137,
"Intel Core i5-10600KF":10477,
"Intel Core i5-11400":9558,
"Intel Core i5-11400F":10168,
"Intel Core i5-11600K":11277,
"Intel Core i5-12400":12344,
"Intel Core i5-12400F":12344,
"Intel Core i5-12490F":11488,
"Intel Core i5-12500":12471,
"Intel Core i5-12600":13367,
"Intel Core i5-12600K":17648,
"Intel Core i5-12600KF":17648,
"Intel Core i5-13400":14311,
"Intel Core i5-13400F":14311,
"Intel Core i5-13490F":16572,
"Intel Core i5-13600":22103,
"Intel Core i5-13600K":23847,
"Intel Core i5-13600KF":23847,
"Intel Core i5-14400":16900,
"Intel Core i5-14400F":16124,
"Intel Core i5-14500":21949,
"Intel Core i5-14600":23945,
"Intel Core i5-14600K":23983,
"Intel Core i5-14600KF":23983,
"Intel Core i5-6400":3214,
"Intel Core i5-6500":3420,
"Intel Core i5-6500T":2736,
"Intel Core i5-6600":3810,
"Intel Core i5-6600K":3963,
"Intel Core i5-7400":3369,
"Intel Core i5-7600K":4143,
"Intel Core i5-8400":5798,
"Intel Core i5-8400T":3638,
"Intel Core i5-8500":5502,
"Intel Core i5-8600K":6612,
"Intel Core i5-9400F":5579,
"Intel Core i5-9500":5952,
"Intel Core i5-9500F":5952,
"Intel Core i5-9500T":4762,
"Intel Core i5-9600K":6590,
"Intel Core i5-9600KF":7218,
"Intel Core i7-10700":10429,
"Intel Core i7-10700K":12983,
"Intel Core i7-11700F":11029,
"Intel Core i7-11700K":15011,
"Intel Core i7-12700":20599,
"Intel Core i7-12700F":19795,
"Intel Core i7-12700K":22801,
"Intel Core i7-12700KF":22801,
"Intel Core i7-13700":24993,
"Intel Core i7-13700F":25403,
"Intel Core i7-13700K":30770,
"Intel Core i7-13700KF":30770,
"Intel Core i7-14700":32602,
"Intel Core i7-14700F":32790,
"Intel Core i7-14700K":34805,
"Intel Core i7-14700KF":34805,
"Intel Core i7-14790F":29535,
"Intel Core i7-6700":4841,
"Intel Core i7-6700K":5646,
"Intel Core i7-6700T":3873,
"Intel Core i7-7700":5443,
"Intel Core i7-7700K":5881,
"Intel Core i7-8700":7068,
"Intel Core i7-8700K":8734,
"Intel Core i7-8700T":5654,
"Intel Core i7-9700":8524,
"Intel Core i7-9700F":8461,
"Intel Core i7-9700K":9416,
"Intel Core i7-9700KF":9090,
"Intel Core i7-9700T":6819,
"Intel Core i9-10900K":13761,
"Intel Core i9-11900F":13150,
"Intel Core i9-11900K":16211,
"Intel Core i9-12900":26454,
"Intel Core i9-12900F":26455,
"Intel Core i9-12900K":27422,
"Intel Core i9-12900KF":27422,
"Intel Core i9-12900KS":27796,
"Intel Core i9-13900":35774,
"Intel Core i9-13900F":35774,
"Intel Core i9-13900K":37263,
"Intel Core i9-13900KF":37263,
"Intel Core i9-14900":34901,
"Intel Core i9-14900K":38497,
"Intel Core i9-14900KF":38497,
"Intel Core i9-9900":12084,
"Intel Core i9-9900K":12496,
"Intel Xeon E3-1231 v3":4409,"Intel Core i3-2100":1422,"Intel Core i5-2400":2011,"Intel Core i5-2500K":2432,"Intel Core i5-3570K":2752,"Intel Core i7-2600K":3964,"Intel Core i7-3770":3650,"Intel Xeon E3-1230 v2":3466,"Intel Core i5-4460":3093,"Intel Core i5-4590":3133,"Intel Core i5-4690K":4243,"Intel Core i7-4770":3349,"Intel Core i7-4790K":4936,"Intel Core i3-7100":2824,"Intel Core i5-7500":4004,"Intel Xeon E5-2670":5476,"Intel Xeon E5-2620 v3":4720,"Intel Xeon E5-2630 v3":5758,"Intel Xeon E5-2678 v3":10327,"Intel Xeon E5-2690 v3":11611,"Intel Xeon E5-2696 v3":12416,"Intel Xeon E5-2699 v3":12503,"AMD FX-8350":3355,"AMD Athlon 200GE":2060,"AMD Athlon 3000G":2163,"AMD EPYC 9654":104913,"AMD FX-6350":2887,"AMD FX-8300":2498,"Intel Xeon E3-1220 v2":2761,"Intel Core i5-3470S":2440,"Intel Core i5-3470T":1453,"Intel Core i5-2400S":1965,"Intel Core i3-3220":1715,"Intel Pentium G2030":1215,"Intel Xeon E3-1220 v3":2778,"Intel Xeon E3-1226 v3":3152,"Intel Core i3-4160T":1859,"Intel Core i5-9400":5341,"Intel Core i5-9400T":4974,"Intel Core i5-4460S":2617,"Intel Core i7-4770S":4253,"Intel Core i5-4590T":2466,"Intel Core i5-7600":4362};

C.forEach(c=>{if(CPU_TC_SCORE[c.n]!=null)c.cs=CPU_TC_SCORE[c.n];});
/* 跑分核实修正（子智能体对照 Cinebench R23 / PassMark 复核，只改核实出偏差的 6 条） */
const CPU_CS_FIX={"AMD EPYC 9354": 52060, "AMD EPYC 9454": 62530, "AMD Threadripper 3960X": 34930, "Intel Core i7-4770": 4480, "Intel Core i7-7800X": 7270, "Intel Xeon E5-2666 v3": 8910};
C.forEach(c=>{if(CPU_CS_FIX[c.n]!=null)c.cs=CPU_CS_FIX[c.n];});


/* ================= 软件库 ================= */
const SOFTWARE=[
 {n:'Microsoft Office 全套',g:'办公',m:{ts:0,cs:2000,ram:4},r:{ts:0,cs:5000,ram:8}},
 {n:'钉钉 / 腾讯会议',g:'办公',m:{ts:300,cs:2500,ram:4},r:{ts:800,cs:6000,ram:8}},
 {n:'财务 ERP（用友 / 金蝶）',g:'办公',m:{ts:0,cs:4000,ram:8},r:{ts:500,cs:8000,ram:16}},
 {n:'Chrome 同时 30 标签',g:'办公',m:{ts:0,cs:3000,ram:8},r:{ts:300,cs:8000,ram:16}},
 {n:'Photoshop 2026',g:'办公',m:{ts:1500,cs:6000,ram:8},r:{ts:3000,cs:10000,ram:16},k:{ts:8000,cs:18000,ram:32}},
 {n:'剪映 / Premiere 1080p',g:'办公',m:{ts:2000,cs:8000,ram:16},r:{ts:4000,cs:12000,ram:16}},
 {n:'AutoCAD 二维制图',g:'办公',m:{ts:1000,cs:5000,ram:8},r:{ts:2500,cs:9000,ram:16}},
 {n:'《英雄联盟》《CS2》',g:'游戏',m:{ts:1200,cs:3500,ram:8},r:{ts:2500,cs:5000,ram:8},k:{ts:12000,cs:12000,ram:16}},
 {n:'《绝地求生》',g:'游戏',m:{ts:3000,cs:6000,ram:16},r:{ts:6000,cs:8000,ram:16},k:{ts:18000,cs:14000,ram:32}},
 {n:'《赛博朋克2077》',g:'游戏',m:{ts:4500,cs:7000,ram:16},r:{ts:9000,cs:9000,ram:16},k:{ts:25000,cs:14000,ram:32}},
 {n:'《黑神话：悟空》',g:'游戏',m:{ts:5000,cs:7000,ram:16},r:{ts:10000,cs:9000,ram:16},k:{ts:26000,cs:14000,ram:32}},
 {n:'《极限竞速：地平线5》',g:'游戏',m:{ts:4000,cs:7000,ram:16},r:{ts:8000,cs:9000,ram:16},k:{ts:22000,cs:14000,ram:32}},
 {n:'《城市：天际线2》',g:'游戏',m:{ts:4000,cs:12000,ram:16},r:{ts:8000,cs:16000,ram:32},k:{ts:15000,cs:25000,ram:64}},
 {n:'OBS 1080p60 直播推流',g:'游戏',m:{ts:3000,cs:10000,ram:16},r:{ts:6000,cs:14000,ram:16}},
 {n:'达芬奇 4K 剪辑',g:'工作站',m:{ts:6000,cs:15000,ram:32},r:{ts:12000,cs:20000,ram:64},k:{ts:25000,cs:28000,ram:128}},
 {n:'Blender Cycles 渲染',g:'工作站',m:{ts:5000,cs:15000,ram:32},r:{ts:9000,cs:22000,ram:64},k:{ts:26000,cs:40000,ram:128}},
 {n:'3ds Max + Corona',g:'工作站',m:{ts:6000,cs:18000,ram:32},r:{ts:12000,cs:25000,ram:64},k:{ts:22000,cs:38000,ram:128}},
 {n:'AutoCAD 三维建模',g:'工作站',m:{ts:3000,cs:8000,ram:16},r:{ts:6000,cs:12000,ram:32}},
 {n:'ANSYS 有限元仿真',g:'工作站',m:{ts:2000,cs:20000,ram:64},r:{ts:3000,cs:30000,ram:128}},
 {n:'虚拟机 8 开',g:'工作站',m:{ts:800,cs:12000,ram:32},r:{ts:1000,cs:20000,ram:64}},
 {n:'剪映 1080p 简单剪辑（核显可用）',g:'办公',m:{ts:400,cs:3000,ram:8},r:{ts:1500,cs:5500,ram:16}},
 {n:'《无畏契约》电竞',g:'游戏',m:{ts:1200,cs:3500,ram:8},r:{ts:2500,cs:5000,ram:8},k:{ts:12000,cs:12000,ram:16}},
 {n:'《DOTA2》',g:'游戏',m:{ts:1500,cs:4000,ram:8},r:{ts:3000,cs:5500,ram:8},k:{ts:14000,cs:13000,ram:16}},
 {n:'《穿越火线 HD》',g:'游戏',m:{ts:1000,cs:3500,ram:8},r:{ts:2200,cs:5000,ram:8}},
 {n:'《原神》',g:'游戏',m:{ts:2000,cs:5000,ram:16},r:{ts:5000,cs:8000,ram:16},k:{ts:14000,cs:13000,ram:16}},
 {n:'《永劫无间》',g:'游戏',m:{ts:3000,cs:6000,ram:16},r:{ts:7000,cs:9000,ram:16},k:{ts:20000,cs:14000,ram:32}},
 {n:'《艾尔登法环》',g:'游戏',m:{ts:2500,cs:6000,ram:16},r:{ts:6000,cs:8000,ram:16}},
 {n:'《三角洲行动》',g:'游戏',m:{ts:3000,cs:6000,ram:16},r:{ts:8000,cs:10000,ram:16}},
 {n:'《幻兽帕鲁》',g:'游戏',m:{ts:2500,cs:5000,ram:16},r:{ts:5000,cs:8000,ram:16}},
 {n:'千牛 / 电商客服 8 开',g:'办公',m:{ts:0,cs:5000,ram:8},r:{ts:0,cs:8000,ram:16},k:{ts:0,cs:12000,ram:32}},
 {n:'网课录屏 + 直播',g:'办公',m:{ts:300,cs:4000,ram:8},r:{ts:1000,cs:7000,ram:16}},
 {n:'VS Code + Docker 编程',g:'办公',m:{ts:0,cs:5000,ram:16},r:{ts:0,cs:9000,ram:32}},
 {n:'达芬奇 4K 调色',g:'工作站',m:{ts:1500,cs:10000,ram:32},r:{ts:3000,cs:16000,ram:64}},
 {n:'本地 AI 推理（7B~14B）',g:'工作站',m:{ts:3000,cs:9000,ram:32},r:{ts:6000,cs:14000,ram:64}},
 {n:'Blender 多机渲染农场',g:'工作站',m:{ts:2000,cs:12000,ram:32},r:{ts:3000,cs:20000,ram:64}},
 {n:'4K 家庭影院播放',g:'办公',m:{ts:0,cs:4000,ram:8},r:{ts:500,cs:6000,ram:16}},
 {n:'剪映多轨道 4K',g:'办公',m:{ts:2000,cs:9000,ram:16},r:{ts:4000,cs:14000,ram:32}}];
const POOL={'0-0':[0,1,2,3,29,35],'0-1':[4,5,6,1,30,31,36],'0-2':[4,5,6,32,36],
 '1-0':[7,8,13,21,22,23,24],'1-1':[9,10,11,12,25,26,27,28],'1-2':[9,10,11,12,25,27],
 '2-0':[14,15,16,17,19,32,33,34],'2-1':[18,15,16,33],'2-2':[19,17,34]};
function refGpuName(ts){if(ts<=0)return '核显即可';
  const g=G.filter(x=>x.u!=null).slice().sort((a,b)=>a.ts-b.ts).find(x=>x.ts>=ts);return g?g.n:'（无）';}
function refCpuName(cs){if(cs<=0)return '任意';
  const c=C.slice().sort((a,b)=>a.cs-b.cs).find(x=>x.cs>=cs);return c?c.n:'（无）';}

/* ================= 第一章剧情 ================= */
const STORY=[];
STORY[1]={day:1,id:'c1d1',who:'陈默',role:'高中同学',av:'陈',col:'#5b8cff',
    lines:[
         '配置就按微信里说的来，单子给你挂上了。',
         '能亮、别剪到一半卡住就行，剩下的你看着配。',
        ],
  tip:'第一单：带核显的 CPU 能省掉一张显卡的钱。预算 1000 以内，二手件这时候不丢人。',
  job:{cat:'办公机',tier:0,name:'新手单 · 老同学的第一台剪辑机',
    sw:'剪映 1080p 简单剪辑（核显可用）',level:'m',
    target:{ts:0,cs:3000,ram:8,igp:1,igpText:'核显够用'},newOnly:false,tight:true,
    partBudget:620,labor:150,
    extra:['预算极紧：二手件、杂牌内存都接受','这台机器不用装独立显卡']},
  saveTo:'陈默',
  after:'行，比我想的安静。导出也不卡，我下午就去接活。',
  reward:{money:200,note:'老同学很满意，说会再来'}};

STORY[2]={day:2,id:'c1d2',who:'陈默',role:'高中同学',av:'陈',col:'#5b8cff',carry:'陈默',
    lines:[
         '我又来了。上次那台剪片子挺顺，最近跟室友打《英雄联盟》，帧数有点难看。',
         '听说加张卡就行？机箱小、电源也不知道够不够，你看着办，别让我白花钱。',
        ],
  tip:'回头客的机器已经在工作台上（金色描边是他自带、已经付过钱的件）。加卡前先看机箱限长和电源余量。',
  job:{cat:'办公机',tier:0,name:'回头客 · 给他这台机器加一张显卡',
    sw:'《英雄联盟》《CS2》',level:'m',
    target:{ts:2400,cs:2000,ram:8},newOnly:false,tight:false,
    partBudget:550,labor:350,
    extra:['旧机上的件已经付过钱，不用再买','注意电源余量和显卡长度']},
  after:'可以，这帧数开会都不卡了。下次我室友装机也给你带过来。',
  reward:{money:300}};

STORY[3]={day:3,id:'c1d3',who:'周芹',role:'打印店老板',av:'周',col:'#63a9e8',
    lines:[
         '小同志，我这是打印店，账都在机器里。最近老蓝屏，一蓝屏就做不成生意。',
         '二手的我不要，坏了耽误事。你给我上全新的，最好能开发票。',
         '钱我不太抠，但别给我配一堆用不上的东西。',
        ],
  tip:'全新单：交付时会查机器里有没有二手件，混一个都算违约。',
  job:{cat:'办公机',tier:0,name:'稳当单 · 打印店的账目机',
    sw:'财务 ERP（用友 / 金蝶）',level:'m',
    target:{ts:0,cs:4000,ram:8},newOnly:true,tight:false,
    partBudget:1200,labor:300,
    extra:['只要全新件，不接受二手']},
  after:'行，看着就是新东西。以后我这儿换机子还找你，别家不敢用。',
  reward:{money:400,note:'打印店老板成了常客'}};

STORY[4]={day:4,id:'c1d4',who:'隔壁老王介绍的客户',role:'同行转来的压价单',av:'王',col:'#f07a7a',
    lines:[
         '老王说你这儿实在。我这儿有台急用的游戏机，七百五，今天就要。',
         '我知道这价不高，干不了我就去找他了——他那儿确实便宜。',
        ],
  tip:'这单预算低于成本：做了亏点钱换人情（他会记着），拒了保钱，什么也不会发生。',
  job:{cat:'游戏机',tier:0,name:'压价单 · 750 块装一台游戏机',
    sw:'《英雄联盟》《CS2》',level:'m',
    target:{ts:2500,cs:2000,ram:8},newOnly:false,tight:true,
    partBudget:350,labor:100,
    extra:['预算极紧：二手件、杂牌内存都接受','这单基本赚不到钱']},
  after:'还真做出来了？行，是我看走眼。回头我帮你在群里说句话。',
  reward:{money:600,note:'同行圈里传开了'}};

STORY[5]={day:5,id:'c1d5',who:'老周',role:'城东配件批发',av:'周',col:'#5fc98a',
    lines:[
         '我姓周，城东做配件的。你上个月给南街那几家装过机，我听说过。',
         '我外甥上初中，要台机器上网课、打印作业，你给装一台，别糊弄孩子。',
         '钱我不抠，活干漂亮点。以后我这边的货，可以先给你留着。',
        ],
  tip:'预算宽松，但电源要用全新的——老周是懂行的，他第一眼就看电源。',
  job:{cat:'办公机',tier:0,name:'人脉单 · 老周外甥的上网课机器',
    sw:'钉钉 / 腾讯会议',level:'m',
    target:{ts:300,cs:2500,ram:8},newOnly:false,tight:false,
    partBudget:400,labor:200,
    extra:['预算宽松，但电源要用全新的']},
  after:'利索。以后报我名字，货先给你留着，价格也按批发价走。',
  reward:{flag:'supplier',note:'解锁供货商：以后随机工单的部件费 +5%'}};

STORY[6]={day:6,id:'c1d6',who:'李响',role:'大学生',av:'李',col:'#ff9ac7',
    lines:[
         '学长，我在宿舍打 CS2，预算三千出头。同学都说 A 卡性价比高。',
         '你给我上 AMD 的卡，别的我不管，能跑满 144 就行。',
        ],
  tip:'指定品牌单：交付时会核对显卡是 AMD，装成 N 卡直接不合格。',
  job:{cat:'游戏机',tier:1,name:'指定单 · 学生的 A 卡游戏机',
    sw:'《绝地求生》',level:'m',
    target:{ts:5000,cs:4500,ram:16},newOnly:false,tight:false,
    partBudget:1400,labor:400,gpuPref:'amd',
    extra:['显卡只要 AMD']},
  after:'卧槽这机器真溜，宿舍那帮人都问我在哪儿装的。',
  reward:{money:400,note:'学生党把室友都带来了'}};

STORY[7]={day:7,id:'c1d7',who:'沈工',role:'三维工作室',av:'沈',col:'#ffcb6b',
    lines:[
         '我们做三维渲染。之前一帧要渲半小时，甲方催得紧。',
         '要两张显卡一起算，钱不是问题，别给我整花里胡哨的灯。',
         '稳定性第一，跑通宵不能崩。',
        ],
  tip:'章末考：双卡工作站。两张卡必须同型号，主板要有两条 x16 插槽，电源别抠。',
  job:{cat:'工作机',tier:1,name:'毕业单 · 工作室的双卡渲染机',
    sw:'Blender Cycles 渲染',level:'m',
    target:{ts:24000,cs:12000,ram:32},newOnly:false,tight:false,
    partBudget:4200,labor:1500,
    extra:['显卡 ×2（同型号）']},
  after:'这速度……以前一天的活现在两小时。以后我们工作室的机子都给你。',
  reward:{flag:'workPro',note:'解锁工作机专精：以后工作机的部件费 +8%'}};

/* ===== 第二章 · 修修补补（第 8–12 天）=====
   这一章的活不是装机，是「看病」：客户把坏掉的机器抱来，症状写在对白里，
   你要花钱做检测、找出坏件、换掉它。换错件钱白花，客户回家还得再跑一趟。 */
STORY[8]={day:8,id:'c2d1',who:'陈默',role:'高中同学',av:'陈',col:'#5b8cff',
    lines:[
         '老同学，救命。昨天剪到一半，啪一下黑屏，机箱里一股糊味。',
         '现在按电源键一点反应都没有。你先看看是哪儿坏了，能修就修，我不想换整机。',
        ],
  tip:'维修单：现象就是证据。判断哪件坏了、拆下来换掉，换错件钱白花。',
  job:{cat:'办公机',tier:0,name:'抢修单 · 黑屏的剪辑机',
    sw:'剪映 1080p 简单剪辑（核显可用）',level:'m',
    target:{ts:400,cs:3000,ram:8},newOnly:false,tight:true,
    partBudget:450,labor:250,
    extra:['整机已经抱到店里','只收维修费，配件另算'],
    repair:{fault:'psu',clues:[
      '按开机键一点反应都没有：电源灯不亮，机箱风扇一下也不转',
      '机箱里有一股糊味，靠近电源的位置最明显',
      '电源风扇用手拨都拨不动（堵转）']}},
  after:'行啊，你怎么一测就知道是电源？这台还能再战两年。',
  reward:{money:250,note:'老同学把这事发到了同学群'}};

STORY[9]={day:9,id:'c2d2',who:'周芹',role:'打印店老板',av:'周',col:'#63a9e8',
    lines:[
         '小同志，店里那台机器又闹脾气：用一会儿就蓝屏，重启完能撑一阵。',
         '上次装机我信你，这次你也别让我来回跑，一次弄好。',
        ],
  tip:'蓝屏重启先别急着装系统：重装没用的话，查内存。',
  job:{cat:'办公机',tier:0,name:'维修单 · 蓝屏的账目机',
    sw:'财务 ERP（用友 / 金蝶）',level:'m',
    target:{ts:0,cs:4000,ram:8},newOnly:false,tight:false,
    partBudget:350,labor:200,
    extra:['整机已经抱到店里'],
    repair:{fault:'ram',clues:[
      '用一会儿就蓝屏，错误码 MEMORY_MANAGEMENT',
      '重启之后能撑一阵，然后又蓝',
      '两条内存，拔掉一条反而能正常进系统']}},
  after:'原来是内存的事。你这一测就出来了，比换整机划算多了。',
  reward:{money:300}};

STORY[10]={day:10,id:'c2d3',who:'同行老王',role:'同行转来的中间人',av:'王',col:'#f07a7a',
    lines:[
         '我这有个客人的机器，开机就花屏，进系统以后驱动老掉，重装也没用。',
         '我懒得查，转给你，修好给我分点就行，别跟客人说我转手了。',
        ],
  tip:'花屏、掉驱动：先换线换接口把外围排除掉，再动显卡。',
  job:{cat:'游戏机',tier:0,name:'转手单 · 花屏的游戏机',
    sw:'《英雄联盟》《CS2》',level:'m',
    target:{ts:2500,cs:2000,ram:8},newOnly:false,tight:false,
    partBudget:450,labor:300,
    extra:['整机已经抱到店里'],
    repair:{fault:'gpu1',clues:[
      '开机自检画面就有竖条纹，进系统后花屏',
      '驱动反复掉，画面一黑又恢复（TDR）',
      '换了一根线、换了个接口，还是一样']}},
  after:'果然是卡。行，这单算我欠你个人情。',
  reward:{money:200}};

STORY[11]={day:11,id:'c2d4',who:'网吧老板',role:'镇上的网吧',av:'网',col:'#7de0a8',
    lines:[
         '那批机器最近老出毛病：一进游戏就自动关机，风扇跟吹风机一样响。',
         '机箱我一直没敢拆，怕弄坏。你看看是不是又要换件了？',
        ],
  tip:'不是所有毛病都要换件：高负载才关机、风扇狂转，先看散热。',
  job:{cat:'游戏机',tier:0,name:'维修单 · 一开游戏就关机',
    sw:'《英雄联盟》《CS2》',level:'m',
    target:{ts:2500,cs:2000,ram:8},newOnly:false,tight:false,
    partBudget:250,labor:200,
    extra:['整机已经抱到店里'],
    repair:{fault:'dust',clues:[
      '进游戏三分钟就自动关机，待机却没事',
      '风扇狂转、噪音很大，出风口烫手',
      '拆开侧板：散热器鳍片被灰堵成毡，硅脂干成粉']}},
  after:'就吹了吹灰、换点硅脂？我还以为要换显卡呢。',
  reward:{money:350}};

STORY[12]={day:12,id:'c2d5',who:'沈工',role:'三维工作室',av:'沈',col:'#ffcb6b',
    lines:[
         '前台那台预览机，渲染跑一会儿就卡死，硬盘灯一直亮着。',
         '我们赶项目，今天必须弄好。别上来就说要换整机。',
        ],
  tip:'章末考：卡死 + 硬盘灯长亮 + 咔哒声，别犹豫，直接换盘。',
  job:{cat:'工作机',tier:0,name:'收尾单 · 卡死的预览机',
    sw:'Blender Cycles 渲染',level:'m',
    target:{ts:5000,cs:15000,ram:32},newOnly:false,tight:false,
    partBudget:500,labor:900,
    extra:['整机已经抱到店里'],
    repair:{fault:'disk',clues:[
      '渲染一会儿整机卡死，硬盘灯长亮不灭',
      '机箱里有咔哒、咔哒的响声',
      'BIOS 里有时认不到这块盘，SMART 报重映射扇区']}},
  after:'换了盘就好了？项目今晚能交。谢了。',
  reward:{flag:'diagPro',note:'解锁老练：以后检测费减半'}};


/* ===== 第三章 · 门面（第 13–18 天）=====
   名声传出去以后，来找你的不再是邻居：工作室、网吧、学校都来了。
   这一章考的不是"会不会装"，是"敢不敢接、接了能不能按时交"。 */
STORY[13]={day:13,id:'c3d1',who:'陈默',role:'高中同学',av:'陈',col:'#5b8cff',carry:'陈默',
    lines:[
         '还是我。上次那台我拿去给人拍婚礼，4K 素材一导就卡成 PPT。',
         '机器我抱来了，你说换什么就换什么，别整台重买，我舍不得。',
        ],
  tip:'老客户的机器在工作台上：先看现有平台能带多强的卡，别一上来就换主板换 CPU。',
  job:{cat:'游戏机',tier:1,name:'升级单 · 4K 剪辑要多一张好卡',
    sw:'DaVinci 4K 剪辑',level:'m',
    target:{ts:6000,cs:6000,ram:16},newOnly:false,tight:false,
    partBudget:1700,labor:400,
    extra:['旧机上的件已经付过钱，不用再买','电源余量要够新卡']},
  after:'导出快了四倍。我那帮拍婚礼的同行，都得来找你。',
  reward:{money:400,note:'老客户第二次回头，开始带人来'}};

STORY[14]={day:14,id:'c3d2',who:'苏姐',role:'自媒体工作室',av:'苏',col:'#ff9ac7',
    lines:[
         '我们做账号矩阵，现在四个人抢两台机器，交片老超时。',
         '先给我装一台打样的，配置齐整、别拿杂牌凑；这台行，剩下两台也交给你。',
         '发票要开，走公司账，别给我开成二手。',
        ],
  tip:'打样单：先做一台，全新件、配置齐整，做好了后面还有两台。',
  job:{cat:'工作机',tier:2,name:'批量单 · 工作室的三台同配剪辑机',
    sw:'Premiere 多轨 4K 剪辑',level:'m',
    target:{ts:4000,cs:8000,ram:16},newOnly:true,tight:false,
    partBudget:5200,labor:900,
    extra:['只要全新件，不接受二手','同一单里配置要齐整']},
  after:'三台跑起来，出片时间砍半。下个月扩编还找你。',
  reward:{money:700,note:'工作室成了长期客户'}};

STORY[15]={day:15,id:'c3d3',who:'小吴',role:'刚毕业',av:'吴',col:'#7de0a8',
    lines:[
         '网上淘的二手卡，卖家说"只拆封没用过"，便宜一千多。',
         '装上去第一天就花屏，竖条纹，驱动一装就掉。',
         '他让我先找人看看，说是我的电源问题……',
        ],
  tip:'维修单：花屏、掉驱动、换线换接口都没用——先按显卡查，别被"电源问题"带偏。',
  job:{cat:'游戏机',tier:0,name:'维修单 · 网上淘来的花屏卡',
    sw:'《英雄联盟》《CS2》',level:'m',
    target:{ts:2500,cs:2000,ram:8},newOnly:false,tight:false,
    partBudget:600,labor:300,
    extra:['整机已经抱到店里'],
    repair:{fault:'gpu1',clues:[
      '开机就花屏、竖条纹，进系统后驱动反复掉',
      '换线、换接口、换显示器都没用',
      '卡背面的螺丝有拆过痕迹，风扇上积着一层矿灰']}},
  after:'真是矿卡？我这就去退货。谢谢你没直接让我换整机。',
  reward:{money:300,note:'小吴把这件事发到了同城群'}};

STORY[16]={day:16,id:'c3d4',who:'网吧老板',role:'镇上的网吧',av:'网',col:'#7de0a8',
    lines:[
         '我那十台机器，学生现在都嫌卡，跑不动新的射击游戏。先拿一台出来改，改好了其余的照做。',
         '一台一台换整机我换不起，你把该换的换了，能再顶两年就行。',
         '我停业一天损失好几百，你抓紧。',
        ],
  tip:'批量翻新：钱要花在能提升帧数的地方（显卡优先），别在灯和机箱上烧钱。',
  job:{cat:'游戏机',tier:1,name:'翻新单 · 网吧的十台机器',
    sw:'《绝地求生》《CS2》',level:'m',
    target:{ts:7000,cs:6000,ram:16},newOnly:false,tight:false,
    partBudget:2400,labor:900,
    extra:['预算按一台算，别堆料','机箱能沿用就沿用']},
  after:'十台都跑起来了，学生又回来了。以后镇上要装机，我只报你一家。',
  reward:{money:900,note:'镇上最大的客户稳住了'}};

STORY[17]={day:17,id:'c3d5',who:'教务处主任',role:'镇中学',av:'教',col:'#ffcb6b',
    lines:[
         '机房三十台老机器，上课一半开不了机。先按一台样机走采购流程，成了再补齐剩下的。',
         '这次走采购流程：全新、要有保修、开票，学生用别出安全事故。',
         '预算不多，但你得给我一个能撑五年的方案。',
        ],
  tip:'政采单：全部全新、稳定优先，别用杂牌电源和二手盘——出了问题是要上门的。',
  job:{cat:'办公机',tier:2,name:'政采单 · 机房的三十台电脑',
    sw:'Microsoft Office 全套',level:'m',
    target:{ts:500,cs:5000,ram:8},newOnly:true,tight:false,
    partBudget:1500,labor:400,
    extra:['只要全新件，不接受二手','电源必须用新的','要能稳定撑五年']},
  after:'合同我签了。下学期开学前，机房要能上课。',
  reward:{money:400,note:'学校成了固定客户'}};

STORY[18]={day:18,id:'c3d6',who:'房东',role:'铺面房东',av:'房',col:'#ff9268',
    lines:[
         '你这小屋堆得连下脚的地方都没有了，隔壁铺面空着，要不要租？',
         '租金比现在贵一千二，但临街，客人看得见。',
         '定金先交，剩下的你自己算账。',
        ],
  tip:'章末：接得下来才叫生意。这一单要把预算算清楚——赚的那口饭，得够交房租。',
  job:{cat:'办公机',tier:1,name:'开张单 · 新铺面的第一台机器',
    sw:'Chrome 同时 30 标签',level:'m',
    target:{ts:500,cs:5000,ram:16},newOnly:false,tight:false,
    partBudget:1100,labor:300,
    extra:['给新店的收银机用','预算别超，房租还没交']},
  after:'装修你自己张罗，下个月起，这条街上就有你的招牌了。',
  reward:{money:1200,note:'攒够定金，铺面到手'}};

/* ================= 剧情插曲：第三天打烊后，技嘉推销员上门 ================= */
/* 剧情立绘：目前只有墨桀有图，其它角色用字母圆牌 */
/* 剧情插图：开张那天（白天），所有剧情共用这张底图 */
/* 首单提示：只说「预算 1000 以内」，不再报这单的具体部件费——
   玩家看的是花多少合适，不是账本。 */
try{
  var _s1=STORY[1];
  if(_s1&&_s1.job){
    _s1.tip='第一单：带核显的 CPU 能省掉一张显卡的钱。预算 1000 以内，二手件这时候不丢人。';
  }
}catch(e){}

const PLOT_CG=__IMG8;
/* 角色立绘（透明 WebP，去背自生成图）：墨桀 6 套 · 旺财 4 套 */


/* ---------- 立绘视频预加载：启动后全部建 video、空闲时逐个预热解码 ---------- */
window.PORTRAIT_VIDS=window.PORTRAIT_VIDS||{};
function preloadPortraits(){
  try{
    const V=window.PORTRAIT_VIDEO||{};
    const seen=new Set();
    const box=document.createElement('div');
    box.id='portraitVids';box.style.cssText='position:fixed;left:-9999px;top:0;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none';
    document.body.appendChild(box);
    const byUri={};
    Object.keys(V).forEach(k=>{
      const uri=V[k];if(!uri)return;
      if(byUri[uri]){PORTRAIT_VIDS[k]=byUri[uri];return;}
      const v=document.createElement('video');
      v.muted=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';
      v.src=uri;v.load();box.appendChild(v);byUri[uri]=v;PORTRAIT_VIDS[k]=v;
    });
    // 空闲时逐个播放 150ms 预热解码器，避免剧情第一次打开卡顿
    const keys=Object.keys(PORTRAIT_VIDS);let i=0;
    const warm=()=>{
      if(i>=keys.length)return;
      const v=PORTRAIT_VIDS[keys[i++]];
      try{const pr=v.play();if(pr&&pr.catch)pr.catch(()=>{});}catch(e){}
      setTimeout(()=>{try{v.pause();v.currentTime=0;}catch(e){}},150);
      setTimeout(warm,420);
    };
    setTimeout(warm,1600);
  }catch(e){}
}
try{setTimeout(preloadPortraits,800);}catch(e){}
/* ---------- 视频立绘（Seedance 绿幕 → WebGL 抠像） ---------- */
window.PORTRAIT_VIDEO=window.PORTRAIT_VIDEO||{};
const SpriteVid=(function(){
  const VS='attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,1.0-(p.y*.5+.5));gl_Position=vec4(p,0.,1.);}';
  const FS=`precision mediump float;varying vec2 uv;uniform sampler2D tex;uniform vec2 px;
  float geo(vec2 u){vec4 c=texture2D(tex,u);return c.g-max(c.r,c.b);}
  float key(vec2 u){float g1=geo(u);float g2=min(min(geo(u+vec2(px.x,0.)),geo(u-vec2(px.x,0.))),min(geo(u+vec2(0.,px.y)),geo(u-vec2(0.,px.y))));
    float g=min(g1,(g1+g2)*0.5);return 1.0-smoothstep(-0.02,0.16,g);}
  void main(){vec4 c=texture2D(tex,uv);float a=key(uv);
    float b=(a+key(uv+vec2(px.x,0.))+key(uv-vec2(px.x,0.))+key(uv+vec2(0.,px.y))+key(uv-vec2(0.,px.y)))/5.0;
    a=clamp(mix(a,b,0.6),0.0,1.0);float ge=c.g-max(c.r,c.b);vec3 rgb=c.rgb;
    rgb.g=mix(rgb.g,max(rgb.r,rgb.b),clamp(ge*6.0,0.0,1.0));gl_FragColor=vec4(rgb*a,a);}`;
  function sh(gl,t,src){const o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);return o;}
  function mount(canvas,key,uri){
    const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true});
    if(!gl)return null;
    const W=1080,H=1920;
    /* 只有首次挂载才重设尺寸；换姿态时保留上一帧画面，避免中间闪一下空白。 */
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
    const prog=gl.createProgram();gl.attachShader(prog,sh(gl,gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);gl.useProgram(prog);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.useProgram(prog);gl.uniform1i(gl.getUniformLocation(prog,'tex'),0);
    gl.uniform2f(gl.getUniformLocation(prog,'px'),1/W,1/H);
    let v=(window.PORTRAIT_VIDS||{})[key];
    if(!v){v=document.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.src=uri;}
    v.muted=true;v.loop=true;
    let raf=0,dead=false;
    function draw(){
      if(dead)return;
      if(v.readyState>=2){gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,v);
        gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
      raf=requestAnimationFrame(draw);
    }
    const api={play(){const p=v.play();if(p&&p.catch)p.catch(()=>{});if(!raf)raf=requestAnimationFrame(draw);},
      pause(){try{v.pause();}catch(e){} if(raf){cancelAnimationFrame(raf);raf=0;}},
      destroy(){dead=true;api.pause();}};
    return api;
  }
  return {mount};
})();

const SPRITES={
  mojie:{
    default:__IMG9,
    smirk:__IMG10,
    serious:__IMG11,
    work:__IMG12,
    skirt:__IMG13,
    dress:__IMG14
  },
  wangcai:{
    default:__IMG15,
    serious:__IMG16,
    awkward:__IMG17,
    work:__IMG18
  }
};
/* 每段剧情里墨桀穿什么、什么表情 */
/* 第2天「二手1060」剧情的插图：闲鱼商品页 / 与卖家聊天 */
const PLOT_ARTS={list:__IMG19,chat:__IMG20};
const PLOT_SPRITE={mojie2:'smirk',mojie6:'default',mojie9:'work',mojie12:'default',
  mojie15:'serious',mojie17:'serious',mojie21:'skirt',mojie24:'smirk',mojie27:'dress',mojie30:'dress'};
/* 旺财（玩家）在每段剧情里的状态 */
const PLOT_SPRITE_WC={mojie2:'awkward',mojie6:'default',mojie9:'work',mojie12:'default',
  mojie15:'serious',mojie17:'serious',mojie21:'default',mojie24:'default',mojie27:'default',mojie30:'default'};
/* 竖版剧情背景（手机）：同一家店，无人版，9:16 */
const PLOT_CG_PORTRAIT=__IMG21;
const CHAR_AVATAR={'我':__IMG22,
  '墨桀':__IMG23};
const CHAR_COL={'我':'#d9a066','墨桀':'#4fc4a8','韩经理':'#8a7dff','陈默':'#5b8cff','周芹':'#e0956a'};
const PLOT_EVENTS={
  opening:{id:'opening',who:'我',role:'开业第一天',av:'我',col:'#ffcf8f',
    lines:[
      '招牌挂上去了，「旺财装机店」。红布一掀，就算是开张了。',
      '押金、房租、焊台、第一批配件，把攒的几年工资全砸进去了。',
      '卡里剩下的这八千，是墨桀借给我的。',
      '墨桀：拿着，先把店开起来。赔了算我的，赚了算你的。',
      '这条街上没人知道这儿有家装机店，今天大概率不会有客人。',
      '只有老同学陈默说了好几天，开张这天来捧场，装一台剪视频的机器。',
      '那就先把这一单做好。店是一单一单攒起来的。'
    ],
    tip:'第一单是提前约好的老同学；街坊还不知道这家店，从明天起才会慢慢有人上门。'},
  mojie2:{id:'mojie2',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '昨天我想给自家那台老电脑升个显卡，在二手市场淘了张 1060 3G。',
      '六百多块，卖家说“自用、没拆没修”，照片拍得干干净净。',
      '到手插上，风扇转，屏幕黑的。换台机器再试，花了半屏，然后就重启。',
      '我找卖家。卖家：你电源不行吧？你主板插槽坏了吧？我：那退了吧。',
      '他就不回消息了。',
      '我把开箱视频、聊天记录、快递面单全翻出来，走了平台介入。',
      '折腾到半夜，钱退回来了。显卡还在我桌上，当个教训。',
      '墨桀听完，先笑，然后说：你运气好。',
      '我：怎么说？',
      '墨桀：二手件这行，十件里保不齐有一件是坏的。买到坏的，能扯皮要回来的，大概八成。',
      '墨桀：剩下两成，卖家拉黑你，平台让你举证，你举不出来，就只能自认倒霉。',
      '我：那我以后收二手件，得一件一件验。',
      '墨桀：还有，你要拿这种件去装客户机器，坏的装上去，客户不认卖家，只认你。',
      '我：明白。这亏我吃一次就够了。',
      '墨桀：行了，不说这个。我跟我舅、我表姐都说了，他们要装机就找你。别给我丢人。'
    ],
    tip:'二手件大约 10% 是坏的：买到坏的可以申请仲裁，约 80% 能把钱要回来，剩下 20% 只能认栽。'},
  mojie6:{id:'mojie6',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '墨桀：路过，看看你店还活着没。',
      '我：活得挺好，单子排着呢。',
      '墨桀：行啊，比你以前坐办公室强。别把自己累死就行。',
      '我：累死之前先把你的钱还上。',
      '墨桀：滚，谁催你了。'
    ],
    tip:'店活下来了。'},
  mojie12:{id:'mojie12',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '墨桀：有个发小要装台机器，预算不低，我让他来找你了。',
      '我：你介绍的，我成本上加一点就行。',
      '墨桀：就喜欢你这种傻的。别人开店都恨不得翻一倍。',
      '我：翻一倍的都干不长。'
    ],
    tip:'墨桀又拉来一个客户。'},
  mojie9:{id:'mojie9',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '墨桀抱着台旧电脑进来，机箱上的灰能种花。',
      '墨桀：我姑的机器，说风扇响得跟拖拉机似的。你给看看。',
      '我：放这儿吧，清个灰换个风扇的事。',
      '墨桀：别不收钱啊。我姑那人，你不收她还不高兴。',
      '我：行，收五十。顺便让她知道这条街上有家会修的店。',
      '墨桀：这就对了。口碑这东西，比广告好使。'
    ],
    tip:'墨桀把亲戚的旧机器也送来修——会修的名声开始传了。'},
  mojie17:{id:'mojie17',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '墨桀蹲在门口抽烟，看我给学校那张单子算成本。',
      '墨桀：三十台的活？垫资不少吧。',
      '我：先做一台样机，走采购流程，不用全垫。',
      '墨桀：你脑子比我清楚。换我早拍胸脯全接了。',
      '我：接了垫不起，到时候哭都来不及。',
      '墨桀：行，稳着来。真周转不开，跟我说，别硬扛。'
    ],
    tip:'墨桀提醒你：大单要稳，别把现金垫死。'},
  mojie21:{id:'mojie21',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '墨桀：街口那个铺子要转租，你知道吗？',
      '我：知道，租金不便宜。',
      '墨桀：你现在这店，人进来转个身都费劲。单子多了，得有个样子。',
      '我：我心里有数，再攒攒。',
      '墨桀：我不是催你花钱。我是说，你干得比你想的好。',
      '我：……你这话，比上次那瓶汽水还贵。'
    ],
    tip:'墨桀提起了扩店的事——第三阶段「门面」的引子。'},
  mojie24:{id:'mojie24',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '墨桀：打听了一圈，同行老王那批货是拆机件翻新的。',
      '我：我知道他便宜，便宜得不对劲。',
      '墨桀：他压价压得整条街难受。你要不要也跟着降？',
      '我：不降。降了就得用他那种货，用一次口碑就没了。',
      '墨桀：行。那我跟人聊天的时候，帮你把这话说出去。',
      '我：你还挺会做生意。',
      '墨桀：我只会帮兄弟吹牛。'
    ],
    tip:'同行压价，墨桀替你把「不卖翻新件」的名声传出去。'},
  mojie27:{id:'mojie27',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '墨桀把一张配置单拍在柜台上。',
      '墨桀：给我装一台。这回我要最好的，预算你定。',
      '我：你终于舍得给自己花钱了？',
      '墨桀：以前是给你捧场，这回是我自己要。你店现在什么价，我清楚。',
      '我：……行，给你装台配得上你那张单子的。',
      '墨桀：别给我省钱。省了我还来修。'
    ],
    tip:'墨桀第一次按正价下单——不是捧场，是认可。'},
  mojie30:{id:'mojie30',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '一个月了。店门口的灯箱亮到晚上十点。',
      '墨桀靠在门框上，手里还是两瓶汽水。',
      '墨桀：还记得开张那天吗？就一台机器，你我蹲在地上装到半夜。',
      '我：记得。卡里就八千，还是你借的。',
      '墨桀：现在呢？',
      '我：现在……排队。',
      '墨桀：那八千，值了。',
      '我：等扩了店，给你留个位置。',
      '墨桀：我不来。我就看着。'
    ],
    tip:'一个月过去，旺财装机店在街上站住了。'},
  mojie15:{id:'mojie15',who:'墨桀',role:'死党 · 八千块的债主',av:'墨',col:'#4fc4a8',
    lines:[
      '下午没什么单，我把抽屉最底下那个信封翻了出来。',
      '八沓钱，用橡皮筋捆着，边角还带着仓库的灰。我数了两遍，八千，一分不少。',
      '墨桀推门进来的时候，手里拎着两瓶汽水。',
      '墨桀：忙着呢？我路过，给你带瓶水。',
      '我：坐会儿，正好有事找你。',
      '我把信封推过去。他愣了一下，没接。',
      '墨桀：干嘛？周转不开了？不够我再给你凑点。',
      '我：不是借，是还。开张那天你塞给我的八千。',
      '墨桀：……哦。这个啊。',
      '他低头看着那个信封，手指在桌面上敲了两下，像是在算什么。',
      '墨桀：你店才开几天，先留着进货不行吗。',
      '我：进货的钱我另留了。这八千，你当时说“赔了算你的”，我不能真让你担着。',
      '墨桀笑了一下，把信封拿起来掂了掂，塞进外套内袋。',
      '墨桀：行，那我收着。说实话，这钱我本来没打算要回来。',
      '我：我知道。所以更得还。',
      '墨桀：当初借你，不是看你可怜。是你蹲在我家地板上画配置单画到半夜，那种人能干成事。',
      '我：……你这话说得比八千块还贵。',
      '墨桀：少来。下次扩店缺钱，还找我。这回算我入股。',
      '我：成交。',
      '汽水打开的时候“呲”的一声。店里的风扇还在转，外面天刚开始暗。'
    ],
    tip:'欠墨桀的八千，还上了。往后是合伙，不是人情。'},
  day3end:{id:'day3end',who:'韩经理',role:'上门推销 · 配件批发',av:'韩',col:'#8a7dff',
    lines:[
      '老板，还没关灯吧？耽误你两分钟。',
      '我这边有一批技嘉的主板，B760M 迫击炮、B650M 都有，工包全新，按七折给你。',
      '显卡、机箱、电源也能一起走，你要多少我供多少，账期好商量。',
      '我：技嘉的东西，我不收。',
      '我：爱国嘉的东西，狗都不卖。',
      '有钱不赚？这条街上就你一家这么硬。行吧，那我换一家问问。'
    ],
    tip:'店规：技嘉的配件不进、不卖。上门推销的一律回绝。'}
};
/* ===== 场景状态机：剧情 / 微信 / 接单卡共用一套开闭与互斥 =====
   playing=当前场景；chain=开场链是否在跑；seq=防双链序号。 */
const Scene={
  playing:null,chain:false,seq:0,
  chrome(on){document.body.classList.toggle('scene-mode',!on);if(on)try{renderAll();}catch(e){}},
  enter(kind){this.playing=kind;this.chrome(false);try{coachHide();}catch(e){}
    /* 加载页只由开局流程撤，场景层不碰它（否则顺序会被打乱） */},
  exit(){this.playing=null;setTimeout(()=>{
    if(!this.busy()&&document.body.classList.contains('scene-mode'))this.chrome(true);
    /* 场景结束后补一次引导刷新，让被收起的框回来 */
    try{if(typeof coachRefresh==='function')coachRefresh();}catch(e){}
  },420);},
  end(){this.chain=false;if(!this.playing&&document.body.classList.contains('scene-mode'))this.chrome(true);},
  busy(){return !!this.playing||this.chain;}
};
function playPlotEvent(evId,onDone){
  const ev=PLOT_EVENTS[evId];if(!ev)return false;
  if(document.getElementById('plotEvent'))return false;
  if(typeof sceneBusy==='function'&&sceneBusy('plotEvent'))return false;
  const lines=(ev.lines||[]).slice();
  if(!lines.length){if(typeof onDone==='function')onDone();return true;}
  const portrait=(typeof window!=='undefined'&&window.innerHeight>window.innerWidth);
  const baseArt=(portrait?PLOT_CG_PORTRAIT:(ev.art||PLOT_CG));
  const artSeq=ev.artAt||null;
  const artFor=i=>{
    if(!artSeq)return baseArt;
    let key='cg';
    for(const it of artSeq){if(i>=it[0])key=it[1];}
    return key==='cg'?baseArt:(PLOT_ARTS[key]||baseArt);
  };
  const ov=document.createElement('div');
  ov.className='plotCg';ov.id='plotEvent';
  ov.innerHTML='<div class="gal" style="--cg:url(\''+artFor(0)+'\')">'+
    '<img class="gal-cg" id="galCg" alt="" src="'+artFor(0)+'">'+
    '<div class="gal-shade"></div>'+
    '<img class="gal-sprite" id="galSprite" alt="" style="display:none">'+
    '<canvas class="gal-sprite gal-vid" id="galVid" width="1080" height="1920" style="display:none"></canvas>'+
    '<div class="gal-box">'+
      '<div class="gal-face" id="galAv"></div>'+
      '<div class="gal-body">'+
        '<div class="gal-name" id="galName"><span id="galWho"></span></div>'+
        '<div class="gal-text" id="galText"></div>'+
      '</div>'+
      '<div class="gal-hint" id="galHint">轻触继续 <b>▸</b></div>'+
    '</div></div>';
  document.body.appendChild(ov);Scene.enter('plot');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{try{ov.classList.add('on');
    const c=ov.querySelector('#galCg');if(c)c.classList.add('on');
    const sp=ov.querySelector('#galSprite');if(sp)setTimeout(()=>{try{sp.classList.add('on');}catch(e){}},380);}catch(e){}}));
  let closed=false,idx=0,typing=false,full='',timer=0,started=false;
  const nameEl=ov.querySelector('#galName'),avEl=ov.querySelector('#galAv'),
        whoEl=ov.querySelector('#galWho'),textEl=ov.querySelector('#galText'),
        hint=ov.querySelector('#galHint');
  const close=()=>{if(closed)return;closed=true;clearTimeout(timer);Scene.exit();
    if(vidPlayer){try{vidPlayer.destroy();}catch(e){}vidPlayer=null;}
    ov.style.opacity='0';setTimeout(()=>{try{ov.remove();}catch(e){}
      if(typeof onDone==='function')onDone();
      setTimeout(()=>{try{if(typeof coachRefresh==='function')coachRefresh();}catch(e){}},260);},260);};
  const parse=raw=>{
    if(/^我：/.test(raw))return{who:'我',txt:raw.slice(2)};
    if(/^[^：]{1,5}：/.test(raw))return{who:raw.split('：')[0],txt:raw.replace(/^[^：]+：/,'')};
    return{who:null,txt:raw};
  };
  const spriteEl=ov.querySelector('#galSprite');
  try{if(window.Live2Dish&&spriteEl){Live2Dish.attach(spriteEl);spriteEl.classList.add('l2d-on');}}catch(e){}
  const vidEl=ov.querySelector('#galVid');
  let vidPlayer=null,vidKey='';
  const showSprite=(who)=>{
    if(!spriteEl)return;
    let src=null,side='right',key='';
    if(who==='墨桀'){key='mojie_'+(PLOT_SPRITE[evId]||'default');src=SPRITES.mojie[PLOT_SPRITE[evId]||'default'];}
    else if(who==='我'){key='wangcai_'+(PLOT_SPRITE_WC[evId]||'default');src=SPRITES.wangcai[PLOT_SPRITE_WC[evId]||'default'];side='left';}
    else if(who==='陈默'||who==='周芹'){src=(SPRITES[who]||{})['default']||null;side=(who==='陈默')?'left':'right';}
    const vuri=key&&window.PORTRAIT_VIDEO&&window.PORTRAIT_VIDEO[key];
    if(vuri&&vidEl){
      spriteEl.style.display='none';
      vidEl.style.display='';vidEl.classList.toggle('left',side==='left');
      if(vidKey!==key){if(vidPlayer){try{vidPlayer.destroy();}catch(e){}}vidKey=key;vidPlayer=SpriteVid.mount(vidEl,key,vuri);}
      if(vidPlayer)vidPlayer.play();
      vidEl.classList.remove('show');void vidEl.offsetWidth;requestAnimationFrame(()=>{try{vidEl.classList.add('show');}catch(e){}});
      return;
    }
    if(vidEl){vidEl.style.display='none';vidEl.classList.remove('show');if(vidPlayer){try{vidPlayer.pause();}catch(e){}}}
    if(!src){spriteEl.style.display='none';return;}
    const same=(spriteEl.getAttribute('src')===src)&&spriteEl.classList.contains('show');
    if(spriteEl.getAttribute('src')!==src)spriteEl.setAttribute('src',src);
    spriteEl.classList.toggle('left',side==='left');
    spriteEl.style.display='';
    if(!same){
      spriteEl.classList.remove('show');
      void spriteEl.offsetWidth;
      requestAnimationFrame(()=>{try{spriteEl.classList.add('show');}catch(e){}});
    }
  };
  const setSpeaker=(who)=>{
    if(who)showSprite(who);   /* 旁白不换立绘，角色留在画面上 */
    const box=ov.querySelector('.gal-box');
    /* 没有说话人（旁白）时把名字牌整个收掉，否则会留一条空的粉条 */
    const _nm=whoEl?whoEl.parentNode:null;
    /* 用 .on 类控制名字牌显示：有说话人显示、旁白隐藏（CSS 只认这个类） */
    if(_nm){_nm.classList.toggle('on',!!who);_nm.style.display='';}
    if(!who){if(box)box.classList.add('is-nar');textEl.classList.add('nar');return;}
    if(box)box.classList.remove('is-nar');textEl.classList.remove('nar');
    whoEl.textContent=who;
    avEl.innerHTML='';
    const av=CHAR_AVATAR[who];
    if(av){const im=document.createElement('img');im.className='gal-av';im.src=av;im.alt=who;avEl.appendChild(im);}
    else{
      const d=document.createElement('span');d.className='gal-av';
      d.style.cssText='display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#1a1206;background:linear-gradient(180deg,'+(CHAR_COL[who]||'#f286a6')+',rgba(255,255,255,.35))';
      d.textContent=who.slice(-1);avEl.appendChild(d);
    }
  };
  const typeLine=()=>{
    if(closed)return;
    if(idx>=lines.length){close();return;}   /* 越界保护：快速点击时定时器可能重入 */
    const p=parse(lines[idx]);idx++;
    try{
      const cg=ov.querySelector('#galCg');
      if(cg){const want=artFor(idx-1);
        if(want&&cg.getAttribute('src')!==want){
          cg.setAttribute('src',want);
          try{const gal=ov.querySelector('.gal');if(gal)gal.style.setProperty('--cg','url("'+want+'")');}catch(e){}
        }}
    }catch(e){}
    setSpeaker(p.who);
    full=p.txt;textEl.textContent='';typing=true;
    hint.innerHTML='轻触继续 <b>▸</b>';
    let shown=0;
    const tick=()=>{
      if(closed||!typing)return;
      if(typeof full!=='string')return;      /* 关闭后 full 可能被清空 */
      shown=Math.min(full.length,shown+1);
      textEl.textContent=full.slice(0,shown);
      if(shown>=full.length){
        typing=false;
        if(idx>=lines.length)hint.innerHTML='轻触结束 <b>▸</b>';
        return;
      }
      const ch=full.charAt(shown-1);
      let d=58;
      if('，、；：'.indexOf(ch)>=0)d=140;
      else if('。！？…'.indexOf(ch)>=0)d=300;
      else if(ch==='—')d=220;
      timer=setTimeout(tick,d);
    };
    tick();
    try{SFX.pop();}catch(e){}
  };
  const moreBelow=()=>{
    try{return textEl.scrollHeight-textEl.scrollTop-textEl.clientHeight>6;}catch(e){return false;}
  };
  ov.onclick=()=>{
    if(closed)return;
    if(typing){typing=false;textEl.textContent=full;
      if(idx>=lines.length&&!moreBelow())hint.innerHTML='轻触结束 <b>▸</b>';
      return;}
    /* 还有没显示完的正文：先翻一页，不换句 */
    if(moreBelow()){
      try{textEl.scrollTop=textEl.scrollTop+textEl.clientHeight-12;}
      catch(e){textEl.scrollTop+=textEl.clientHeight;}
      if(!moreBelow()&&idx>=lines.length)hint.innerHTML='轻触结束 <b>▸</b>';
      return;
    }
    if(idx>=lines.length){close();return;}
    started=true;typeLine();
  };
  setTimeout(()=>{if(closed||started)return;started=true;try{typeLine();}catch(e){}},2050);
  return true;
}

/* 第2天剧情插图分段：0-5 商品页，6-10 聊天页，11+ 回到店铺 CG */
PLOT_EVENTS.mojie2.artAt=[[0,'list'],[6,'chat'],[11,'cg']];
/* 死党墨桀的几段剧情：第 2 / 6 / 12 / 20 天各来一趟 */
const MOJIE_PLOTS={2:'mojie2',6:'mojie6',9:'mojie9',12:'mojie12',17:'mojie17',21:'mojie21',24:'mojie24',27:'mojie27',30:'mojie30'};
function maybeMojiePlot(){
  if(!state||!state.story||!state.story.flags)return false;
  const evId=MOJIE_PLOTS[state.day];
  if(!evId)return false;
  const flag='plot_'+evId;
  if(state.story.flags[flag])return false;
  state.story.flags[flag]=true;save();
  return playPlotEvent(evId,()=>{setTimeout(()=>{try{maybeStoryPopup();}catch(e){}},180);});
}
/* ================= 两周还债 =================
   第 15 天（开张后两周）墨桀来收那八千：现金够就扣钱还上，不够就悲愤关店，游戏结束。 */
const DEBT_AMOUNT=8000, DEBT_DUE_DAY=15;
function debtPaid(){
  try{return !!(state&&state.story&&state.story.flags&&state.story.flags.repaid);}catch(e){return true;}
}
function updateDebtUI(){
  const el=document.getElementById('debtTxt');if(!el)return;
  if(!state||debtPaid()||state.over){el.style.display='none';return;}
  el.style.display='';
  el.innerHTML='欠墨桀<b>¥8,000</b><span style="opacity:.6;font-size:10px;margin-left:4px">还钱</span>';
  el.style.cursor='pointer';
}
/* 随时可还：点页眉的「欠墨桀」就能还，不设期限、没钱不惩罚 */
function repayDebt(){
  if(!state||debtPaid()){toast('这笔钱已经还过了');return;}
  if((state.cash||0)<DEBT_AMOUNT){toast('现金不够，攒够 ¥8,000 再来还');return;}
  modal('还钱给墨桀','现在把 <b>¥8,000</b> 还给他？<br>现金 '+money(state.cash)+' → '+money(state.cash-DEBT_AMOUNT),()=>{
    if((state.cash||0)<DEBT_AMOUNT){toast('现金不够');return;}
    state.cash-=DEBT_AMOUNT;state.todayOut=(state.todayOut||0)+DEBT_AMOUNT;
    state.story.flags.repaid=true;save();renderAll();
    try{SFX.coin();}catch(e){}
    try{playPlotEvent('mojie15',()=>{});}catch(e){}
  });
}
function debtDue(){
  if(!state||state.over)return false;
  if(state.day<DEBT_DUE_DAY||debtPaid())return false;
  if(state.story.flags.debtDone)return false;
  if((state.cash||0)>=DEBT_AMOUNT){
    state.story.flags.debtDone=true;
    state.cash-=DEBT_AMOUNT;state.todayOut=(state.todayOut||0)+DEBT_AMOUNT;
    state.story.flags.repaid=true;
    save();renderAll();
    playPlotEvent('mojie15',()=>{setTimeout(()=>{try{maybeStoryPopup();}catch(e){}},180);});
    return true;
  }
  return false;
}
function maybeDay3Plot(){
  if(!state||!state.story||!state.story.flags)return false;
  if(state.day!==4||state.story.flags.day3end)return false;
  state.story.flags.day3end=true;save();
  return playPlotEvent('day3end',()=>{setTimeout(()=>{try{maybeStoryPopup();}catch(e){}},180);});
}

const CHAPTERS=[
  {id:1,name:'开张',end:7,tail:'小店的回头客多起来了，门口开始排队。'},
  {id:2,name:'修修补补',end:12,tail:'会修东西的名声传出去了，隔壁镇都有人找上门。'},
  {id:3,name:'门面',end:18,tail:'临街的招牌挂起来了，排队的人从店里排到马路上。'}
];
function chapterBanner(){
  for(const c of CHAPTERS){
    const flag='ch'+c.id+'end';
    if(state.day>c.end&&!state.story.flags[flag]){
      state.story.flags[flag]=true;save();
      const next=CHAPTERS.find(x=>x.id===c.id+1);
      const sub=next?`第二章 · ${next.name}　开始了`:'后面的故事还在写，先自由接单';
      return `<div class="chat"><div class="h">
        <div class="av" style="background:linear-gradient(180deg,#f286a6,#e0698c);color:#2a1a05">章</div>
        <div><div class="who">第${c.id===1?'一':'二'}章 · ${c.name}</div><div class="role">已完成</div></div></div>
        <div class="line">${c.tail}</div>
        <div class="tip">${sub}</div></div>`;
    }
  }
  return '';
}
function storyDef(id){for(let i=1;i<STORY.length;i++){if(STORY[i]&&STORY[i].id===id)return STORY[i];}return null;}
function storyToday(){const s=STORY[state.day];if(!s)return null;if(state.story.done[s.id])return null;return s;}
function buildStoryJob(s){
  const j=Object.assign({id:'S'+s.day,story:true,storyId:s.id,client:s.who,status:'open',
    ultra:false,gpuPref:null,tight:false,newOnly:false,extra:[]},s.job);
  j.carry=s.carry||null;j.minMhz=(j.cat==="办公机"?0:(j.cat==="游戏机"?([3200,3600,6000][j.tier]||3200):3200));
  /* 剧情单给 3 天交期，别让新手一上来就超时 */
  j.deadline=3;j.dueDay=s.day+2;j.bornDay=s.day;
  return j;
}
function chatHTML(s){
  return `<div class="chat"><div class="h">
    <div class="av" style="background:${s.col||'#5b8cff'}">${s.av||s.who[0]}</div>
    <div><div class="who">${s.who}</div><div class="role">${s.role||'剧情客户'}</div></div></div>
    ${(s.lines||[]).map(t=>`<div class="line">${t}</div>`).join('')}</div>`;
}

/* ================= 任务 ================= */
const SPEC={
'办公机':[
 {cpu:c=>c.s==='LGA1150'&&c.ig===1,mb:b=>b.s==='LGA1150'&&b.m==='DDR3',ram:r=>r.m==='DDR3'&&r.cap<=8,psu:p=>p.w>=300,case:k=>k.ff.includes('MATX'),disk:d=>d.kind==='sata'&&d.cap<=480},
 {cpu:c=>c.s==='LGA1200'&&c.ig===1,mb:b=>b.s==='LGA1200'&&b.m==='DDR4',ram:r=>r.m==='DDR4'&&r.cap<=8,psu:p=>p.w>=400,case:k=>k.ff.includes('MATX'),disk:d=>d.kind==='m2'&&d.cap<=512},
 {cpu:c=>c.s==='LGA1700'&&c.ig===1,mb:b=>b.s==='LGA1700'&&b.m==='DDR4',ram:r=>r.m==='DDR4'&&r.cap<=16,psu:p=>p.w>=450,case:k=>k.ff.includes('MATX'),disk:d=>d.kind==='m2'&&d.cap<=1000,gpu:g=>g.ts<=2000}],
'游戏机':[
 {cpu:c=>c.s==='AM4'&&c.cs>=11000,mb:b=>b.s==='AM4'&&b.m==='DDR4',ram:r=>r.m==='DDR4'&&r.cap>=8&&r.cap<=16,psu:p=>p.w>=650,case:k=>k.ff.includes('ATX')&&k.mg>=380,disk:d=>d.kind==='m2'&&d.cap>=1000,gpu:g=>g.ts>=8500&&g.ts<=9500},
 {cpu:c=>c.s==='LGA1700'&&c.cs>=24000,mb:b=>b.s==='LGA1700'&&b.m==='DDR5',ram:r=>r.m==='DDR5'&&r.cap>=16,psu:p=>p.w>=850,case:k=>k.ff.includes('ATX')&&k.mg>=380,disk:d=>d.kind==='m2'&&d.cap>=1000,gpu:g=>g.ts>=17000&&g.ts<=18500},
 {cpu:c=>c.s==='AM5'&&c.cs>=18000,mb:b=>b.s==='AM5'&&b.m==='DDR5',ram:r=>r.m==='DDR5'&&r.cap>=16,psu:p=>p.w>=1000,case:k=>k.ff.includes('ATX')&&k.mg>=380,disk:d=>d.kind==='m2'&&d.cap>=2000,gpu:g=>g.ts>=26000&&g.ts<=29000}],
'工作机':[
 {cpu:c=>c.s==='SP3',mb:b=>b.s==='SP3',ram:r=>r.m==='DDR4'&&r.cap>=32,psu:p=>p.w>=1000,case:k=>k.bay>=8,disk:d=>d.kind==='m2'&&d.cap>=1000},
 {cpu:c=>c.s==='SP5',mb:b=>b.s==='SP5',ram:r=>r.m==='DDR5'&&r.cap>=32,psu:p=>p.w>=1500,case:k=>k.bay>=6,disk:d=>d.kind==='m2'&&d.cap>=2000,gpu:g=>g.ts>=30000,gpu2:true},
 {cpu:c=>c.s==='AM4'&&c.cs>=11000,mb:b=>b.s==='AM4'&&b.m==='DDR4',ram:r=>r.m==='DDR4'&&r.cap>=16,psu:p=>p.w>=650,case:k=>k.bay>=8,disk:d=>d.kind==='hdd'&&d.cap>=8000}]};
/* 随机单的抬头：按品类随机抽一个，玩家每次看到的名字都不一样 */
const JOB_NAMES={
 '办公机':['账目机','前台机','收银机','报税机','网店发货机','学校办公机','诊所登记机','律所文书机',
   '网课机','家用上网机','排产机','物业前台机','打印店主机','村委办公机'],
 '游戏机':['宿舍游戏机','毕业首台机','主播推流机','开黑主机','客厅影音机','网吧过渡机',
   '合买游戏机','二手翻新机','客厅游戏机','搬家小机箱'],
 '工作机':['渲染节点机','工作室预览机','建模工作站','剪辑台','实验室主机','小公司服务器',
   '出图工作站','动画算力机']
};
const ULTRA_NAMES=['跑分怪兽','4K 全家桶','顶配演示机','发烧友梦想机'];
/* 工单名字跟「客户拿它干什么」对齐：不再随机抽，避免「客厅影音机」却在打 CS2 */
const JOB_NAME_SW=[
  {re:/直播|OBS/i, names:['主播推流机','直播专机','推流工作台']},
  {re:/剪映|Premiere|达芬奇|剪辑/i, names:['剪辑台','短视频剪辑机','工作室预览机']},
  {re:/Photoshop|AutoCAD|3ds Max|建模|出图/i, names:['出图工作站','建模工作站','设计工作站','工作室预览机']},
  {re:/Blender|渲染|ANSYS|仿真|算力/i, names:['渲染节点机','动画算力机','仿真工作站']},
  {re:/虚拟机|多开/i, names:['多开挂机机','小公司服务器','实验室主机']},
  {re:/^《/, names:['开黑主机','宿舍游戏机','网吧过渡机','合买游戏机','客厅游戏机','搬家小机箱','毕业首台机']},
  {re:/Office|钉钉|ERP|Chrome|WPS/i, names:['账目机','前台机','收银机','报税机','网店发货机','学校办公机','家用上网机','打印店主机']}
];
function jobNameFor(cat,sws,rand,ultra){
  if(ultra)return ULTRA_NAMES[Math.floor(rand()*ULTRA_NAMES.length)];
  const nm=(sws&&sws[0]&&sws[0].n)||'';
  for(const g of JOB_NAME_SW){
    if(g.re.test(nm))return g.names[Math.floor(rand()*g.names.length)];
  }
  const pool=JOB_NAMES[cat]||['整机'];
  return pool[Math.floor(rand()*pool.length)];
}

/* 客户就给个名字：现实里你先知道的是「谁找你装机」，不是他的标签 */
const CLIENT_ROLES=['大学生','刚毕业','游戏主播','剪辑师','摄影师','会计','网店店主','网吧老板','打印店老板',
 '程序员','设计师','中学老师','医生','中介','房东','小老板','宝妈','退休大爷','婚庆摄像','带货主播'];
const CLIENT_NAMES=['王建国','李秀兰','张伟','刘敏','陈静','杨帆','赵磊','黄晓燕','周涛','吴倩',
'徐鹏','孙丽娟','胡军','朱文博','高翔','林晓东','何雨桐','郭强','马晓峰','罗静怡',
'梁文杰','宋佳','郑海涛','谢楠','韩雪','唐志强','冯磊','于洋','董秀英','萧然',
'程立','曹阳','袁媛','邓超','许静','傅明','沈佳琪','曾勇','彭涛','吕文',
'苏晴','卢俊','蒋雯','蔡旭','贾斌','丁宁','魏东','薛梅'];
function pickCat(rand){
  /* 现实里街边店的生意就是这个结构：办公机最多，游戏机其次，工作站是极少数大单 */
  const r=rand();
  if(r<0.40)return '办公机';
  if(r<0.99)return '游戏机';
  return '工作机';
}
function pickTier(rand,cat){
  const w={'办公机':[0.55,0.33,0.12],'游戏机':[0.46,0.34,0.20],'工作机':[0.42,0.33,0.25]}[cat];
  const r=rand();let acc=0;for(let i=0;i<3;i++){acc+=w[i];if(r<acc)return i;}return 0;
}
function pickGpuPref(rand,cat,tier){
  if(cat==='游戏机'){const r=rand();if(r<0.45)return null;if(r<0.80)return 'nvidia';return 'amd';}
  if(cat==='工作机'&&tier===1)return rand()<0.7?'nvidia':null;return null;
}
const brandOK=(g,pref)=>!pref||(pref==='nvidia'?isNVIDIA(g):isAMD(g));
const prefName=p=>p==='nvidia'?'NVIDIA':p==='amd'?'AMD':null;
function pickCheap(arr,pred,usedOK){const pool=arr.filter(x=>pred(x)&&(usedOK||x.p!=null));if(!pool.length)return null;
  return pool.reduce((a,b)=>cheapest(a)<=cheapest(b)?a:b);}
/* 机箱/电源/散热强制全新时，预算要跟着抬：按最便宜的新件与二手件差价补 */
function newForDelta(){
  const minP=(arr,key)=>{let m=Infinity;for(const x of arr){const v=x[key];if(v!=null&&v<m)m=v;}return m===Infinity?null:m;};
  const one=(arr)=>{
    const np=minP(arr,'p'),up=minP(arr,'u');
    if(np==null)return 0;
    return np-(up==null?np:up);
  };
  return Math.max(0,Math.round((one(K)+one(P)+one(H))/10)*10);
}
function buildRef(cat,tier,usedOK,pref,ultra){
  const s=SPEC[cat][tier];
  const _minMhz=(cat==="办公机"?0:(cat==="游戏机"?([3200,3600,6000][tier]||3200):3200));
  const cpu=pickCheap(C,s.cpu,usedOK),mb=pickCheap(B,s.mb,usedOK),ram=(pickCheap(M,r=>s.ram(r)&&(!_minMhz||r.mhz>=_minMhz),usedOK)||pickCheap(M,s.ram,usedOK)),
        psu=pickCheap(P,s.psu,usedOK),kase=pickCheap(K,s.case,usedOK),disk=pickCheap(ST,s.disk,usedOK);
  const cool=cpu?(pickCheap(H,h=>h.cap>=coolNeed(cpu)&&h.s.includes(cpu.s),usedOK)||pickCheap(H,h=>h.s.includes(cpu.s),usedOK)):null;
  /* 机箱要装得下散热：限高不够就换一个能装的 */
  let kaseFix=kase;
  if(kaseFix&&cool&&kaseFix.mc<cool.h){
    kaseFix=pickCheap(K,k=>s.case(k)&&k.mc>=cool.h,usedOK)||kaseFix;
  }
  let gpuPred=s.gpu;if(ultra)gpuPred=g=>g.ts>=48000;
  let gpu=null,prefUsed=pref;
  if(gpuPred){
    gpu=pickCheap(G,g=>gpuPred(g)&&brandOK(g,pref)&&(kaseFix?g.len<=kaseFix.mg:true),usedOK);
    if(!gpu&&pref){gpu=pickCheap(G,g=>gpuPred(g)&&(kase?g.len<=kase.mg:true),usedOK);prefUsed=null;}
  }
  if(!gpu&&cpu&&!cpu.ig)gpu=pickCheap(G,g=>kase?g.len<=kase.mg:true,usedOK);
  const list=[cpu,mb,ram,psu,kaseFix,disk,cool].filter(Boolean);
  if(gpu){list.push(gpu);if(s.gpu2)list.push(gpu);}
  return {list,pref:prefUsed,gpu,cpu,ram};
}
const costOf=(list,useNew)=>list.reduce((s,x)=>s+(useNew?x.p:(x.p??x.u)),0);
function scoreOf(cpu,gpu){let ts=gpu?gpu.ts+Math.round((cpu?cpu.cs:0)*0.03):igScore(cpu);return {ts,cs:cpu?cpu.cs:0};}

/* 这一单的「最低可装成本」：按客户真正的门槛（3DMark / Cinebench / 内存）
   挑一套最便宜的件。只在「参考机根本跑不动这单软件」时调用，
   用来给预算兜底，避免出现「装得出来但一定亏」的陷阱单。 */
function minBuildCost(need,opt){
  opt=opt||{};const t=need||{};const nw=!!opt.newOnly;
  const px=x=>x?(nw?(x.p!=null?x.p:null):(x.u!=null?x.u:(x.p!=null?x.p:null))):null;
  const byP=a=>a.slice().sort((x,y)=>px(x)-px(y));
  const dual=(opt.cat==='工作机'&&opt.tier===1);
  const water=(opt.cat==='游戏机'&&opt.tier===2);
  const ramNeed=Math.max(t.ram||0,(opt.cat==='工作机'&&opt.tier===0)?128:0);
  const hddNeed=(opt.cat==='工作机'&&opt.tier===2)?4:0;
  let best=null;
  const cpus=byP(C.filter(c=>px(c)!=null&&c.cs>=(t.cs||0)));
  for(const cpu of cpus.slice(0,60)){
    const ig=cpu.ig?igScore(cpu):0;
    let gpu=null;
    if((t.ts||0)>ig){
      const needTs=dual?Math.max(3000,(t.ts||0)*0.45):(t.ts||0);
      const gs=G.filter(g=>px(g)!=null&&g.ts+Math.round(cpu.cs*0.03)>=needTs
        &&(!opt.gpuPref||brandOK(g,opt.gpuPref))&&(!opt.ultra||g.ts>=48000));
      gpu=byP(gs)[0]||null;
      if(!gpu)continue;
    }
    const mbs=byP(B.filter(b=>px(b)!=null&&b.s===cpu.s&&(!dual||b.pcie>=2))).slice(0,3);
    for(const mb of mbs){
      let cap=0,rc=0,slots=0;
      for(const r of byP(M.filter(x=>px(x)!=null&&x.m===mb.m))){
        if(slots>=mb.dimm)break;rc+=px(r);cap+=r.cap;slots++;
        if(cap>=ramNeed)break;
      }
      if(cap<ramNeed)continue;
      const needW=100+cpu.t+(gpu?gpu.tbp*(dual?2:1):0);
      const psu=byP(P.filter(p=>px(p)!=null&&p.w>=needW))[0];if(!psu)continue;
      const cool=byP(H.filter(h=>px(h)!=null&&h.s.includes(cpu.s)&&h.cap>=coolNeed(cpu)&&(!water||h.rad>0)))[0];if(!cool)continue;
      const kase=byP(K.filter(k=>px(k)!=null&&k.ff.includes(mb.ff)&&k.mc>=cool.h&&(!gpu||k.mg>=gpu.len)))[0];if(!kase)continue;
      const disk=byP(ST.filter(d=>px(d)!=null&&(d.kind==='m2'?mb.m2>0:mb.sata>0)))[0];if(!disk)continue;
      let hdd=0;
      if(hddNeed){
        const hs=byP(ST.filter(d=>px(d)!=null&&d.kind==='hdd')).slice(0,hddNeed);
        if(hs.length<hddNeed)continue;
        hdd=hs.reduce((a,d)=>a+px(d),0);
      }
      const gcost=gpu?px(gpu)*(dual?2:1):0;
      const cost=px(cpu)+px(mb)+rc+px(psu)+px(cool)+px(kase)+px(disk)+hdd+gcost;
      if(!best||cost<best)best=cost;
    }
  }
  return best;
}
function makeJobs(dateStr,day){
  const rand=rngFrom(hash(dateStr+'#'+day+'#'+((state&&state.seed)||0))),jobs=[];
  const s=STORY[day];
  if(s&&!(state.story&&state.story.done[s.id]))jobs.push(buildStoryJob(s));
  /* 第 1 天只有老同学这一单：店刚开张，街坊还不知道这儿有家装机店 */
  if(day===1)return jobs;
  const fl=(state.story&&state.story.flags)||{};
  let n=repOrderCount(rand);
  if(day===2)n=2;                    /* 第二天：陈默回去说了，来了两单亲戚介绍的 */
  else if(day===3)n=3;               /* 第三天：慢慢传开 */

  /* 预算随天数逐步放宽：第 1 周 ≤5k、第 2 周 ≤8k、第 3 周 ≤12k、第 4 周 ≤20k，之后不设限。
     超了就降一档重来（最多 3 次），保证前期不会蹦出高预算单，也不会卡死在「装不起」。 */
  const _day=state.day||1;
  const _cap=_day<7?5000:(_day<14?8000:(_day<21?12000:(_day<28?20000:Infinity)));
  const _usedSw=new Set();
  for(let i=0;i<n;i++){
    /* 「整机单」：客户不懂配置，只要能装出一台能开机的机器。
       没有跑分门槛、没有软件要求，检查项就是「槽位齐 + 兼容」。
       以前这类单子全被性能门槛占满，弱硬件根本没活路，这里专门给一条。 */
    if(rand()<0.10){
      try{
        const _base=minBuildCost({ts:0,cs:0,ram:8},{});
        if(_base){
          const _b=Math.ceil(_base*1.45/50)*50;
          const _nm=['整机 · 街坊的办公机','整机 · 小店的收银机','整机 · 给学生配一台','整机 · 前台用的电脑'][Math.floor(rand()*4)];
          const _dl=2+Math.floor(rand()*3);
          jobs.push({id:'J'+day+'-'+i,cat:'办公机',tier:0,baseCost:_base,name:_nm,
            client:CLIENT_NAMES[Math.floor(rand()*CLIENT_NAMES.length)],
            clientRole:CLIENT_ROLES[Math.floor(rand()*CLIENT_ROLES.length)],
            sw:'Office',swList:'Office',level:'m',
            target:{ts:0,cs:0,ram:8},newOnly:false,tight:false,ultra:false,gpuPref:null,
            partBudget:_b,labor:Math.max(150,R2(_base*0.05,10)),
            extra:['不看跑分，装得出来、开得了机就行','二手件随便用，能用就收','硅脂该涂还得涂'],
            status:'open',deadline:_dl,dueDay:day+_dl-1,bornDay:day,
            hideScore:true,minMhz:0,assembly:true,grade:'low'});
          continue;
        }
      }catch(e){}
    }
    const _cat0=pickCat(rand), _tierStart=pickTier(rand,_cat0);
    let _tier=_tierStart, _job=null;
    for(let _try=0;_try<4;_try++){
    let cat=_cat0, tier=_tier;
    /* 工作机的入门单就要 128G（两万多），前四周先不派 */
    if(_cap<=20000&&cat==='工作机')cat='办公机';
    const bonus=(fl.supplier?1.05:1)*(fl.bargain?1.06:1)*((fl.workPro&&cat==='工作机')?1.08:1);
    const ultra=(cat==='游戏机'&&tier===2&&rand()<0.3);
    const pref=pickGpuPref(rand,cat,tier);
    const sp0=SPEC[cat][tier];
    const canAllNew=C.some(c=>sp0.cpu(c)&&c.p!=null)&&B.some(b=>sp0.mb(b)&&b.p!=null)&&M.some(r=>sp0.ram(r)&&r.p!=null)&&P.some(p=>sp0.psu(p)&&p.p!=null)&&K.some(k=>sp0.case(k)&&k.p!=null)&&ST.some(d=>sp0.disk(d)&&d.p!=null);
    /* 极限装机（ultra）一律全套全新件 */
    const newOnly=(ultra?canAllNew:(rand()<[0.25,0.45,0.70][tier]))&&canAllNew;
    const ref=buildRef(cat,tier,!newOnly,pref,ultra);
    const cost=newOnly?costOf(ref.list,true):costOf(ref.list,false);
    const pad=newOnly?(1.20+rand()*0.20):(1.24+rand()*0.28);
    const tight=!newOnly&&pad<1.4;
    const _budgetBase=cost*pad*bonus;
    const _laborRate=((state.day||1)>=10?0.045:0.05)+rand()*((state.day||1)>=10?0.04:0.05);
    const labor=Math.max(200,R2(cost*_laborRate,10));
    const key=({'办公机':'0','游戏机':'1','工作机':'2'})[cat]+'-'+tier;
    const idxs=POOL[key],best=scoreOf(ref.cpu,ref.gpu),ramCap=ref.ram?ref.ram.cap:0;
    /* 10% 的单子明写跑分，其余只看「软件能不能跑」 */
    const _showScore=((i*37+day*11)%10)===0;
    /* 判定档位按概率随机：最低和推荐都常见，4K 少；档位越高越可能碰上高配置。
       办公机不按 4K 验。显示/隐藏分数只影响措辞，不改变判定。 */
    const _lw=tier===0?[0.60,0.35,0.05]:(tier===1?[0.40,0.50,0.10]:[0.15,0.55,0.30]);
    const _lr=rand();
    let level=_lr<_lw[0]?'m':(_lr<_lw[0]+_lw[1]?'r':'k');
    if(cat==='办公机'&&level==='k')level='r';
    if(ultra)level='k';
    /* 按「这一档的配置要求」判断参考机跑不跑得动——不是拿软件最高档一刀切，
       所以剪映 / Photoshop 都不会被整体删掉，只是太重的那一档不会派给办公机。 */
    const needOf=id=>{const sw=SOFTWARE[id];return sw[level]||sw.r||sw.m;};
    const okList=idxs.filter(id=>{const nd=needOf(id);
      return best.ts>=(nd.ts||0)&&best.cs>=(nd.cs||0)&&ramCap>=(nd.ram||0);});
    let _pool=okList;
    if(!_pool.length){
      /* 一款都跑不动：从这一档要求最轻的 3 款里随机，别硬塞必然倒贴的单 */
      const _w=id=>{const nd=needOf(id);return (nd.ts||0)*2+(nd.cs||0)/10+(nd.ram||0)*30;};
      _pool=idxs.slice().sort((a,b)=>_w(a)-_w(b)).slice(0,3);
    }
    let pickId=_pool[Math.floor(rand()*_pool.length)];
    for(let _try=0;_try<6&&_usedSw.has(pickId)&&_pool.length>1;_try++)pickId=_pool[Math.floor(rand()*_pool.length)];
    _usedSw.add(pickId);
    const sw=SOFTWARE[pickId];
    let need=needOf(pickId);
    /* 有的客户既要办公又要打游戏：约 18% 的单子会多要 1–2 个软件（仍以单软件为主），
       门槛按最重的那项算。都从同一档的软件池里挑，避免搭出离谱的组合。 */
    const _swIds=[pickId];
    if(rand()<0.18){
      const extra=1+(rand()<0.30?1:0);
      for(let k=0;k<extra;k++){
        const cand=idxs.filter(x=>_swIds.indexOf(x)<0);
        if(!cand.length)break;
        _swIds.push(cand[Math.floor(rand()*cand.length)]);
      }
    }
    const swList=_swIds.map(id=>SOFTWARE[id]);
    if(swList.length>1){
      need={ts:0,cs:0,ram:0};
      swList.forEach(x=>{const nd=x[level]||x.r||x.m;
        need.ts=Math.max(need.ts,nd.ts||0);
        need.cs=Math.max(need.cs,nd.cs||0);
        need.ram=Math.max(need.ram,nd.ram||0);});
    }
    const swNames=swList.map(x=>x.n).join(' + ');
    /* 明写分数的单子里，一半是客户自己的纯跑分要求：不一定跟软件的分数挂钩，
       比如「我就想跑个 3DMark 8000」，软件可能只要 2000。 */
    if(_showScore&&rand()<0.04){   /* 分数型要求很少见：4% 左右 */
      const ts=(best.ts>1200&&rand()<0.65)?R2(best.ts*(0.65+rand()*0.45),100):0;
      const cs=(best.cs>2000&&(!ts||rand()<0.6))?R2(best.cs*(0.70+rand()*0.45),100):0;
      need={ts,cs,ram:need.ram};
      if(!need.ts&&!need.cs)need={ts:need.ts,cs:need.cs,ram:need.ram};
    }
    /* 旗舰单有性能底线：至少 9700X + 9070XT 这个级别。
       注意：这是「旗舰单的门槛」，不等于「超过这个级别就算旗舰单」——档位仍由预算/类型决定。 */
    const _grade=(newOnly?'high':(tight?'low':'mid'));
    /* 旗舰单最低要有多少钱：按「主板/电源/散热旗舰 + 其余中端以上 + 全新」扫一遍 */
    const flagshipFloor=function(){
      try{
        const nx=function(x){return (x&&typeof x.p==='number'&&x.p>0)?x.p:null;};
        const pick=function(arr,f){let b=null;arr.forEach(function(x){if(!f(x))return;const p=nx(x);if(p==null)return;if(!b||p<nx(b))b=x;});return b;};
        const mb=pick(B,function(x){return x.tier==='flag';});
        const psu=pick(P,function(x){return x.tier==='flag';});
        const cool=pick(H,function(x){return x.tier==='flag';});
        const cse=pick(K,function(x){return x.tier!=='budget';});
        const cpu=pick(C,function(x){return (x.cs||0)>=19539;});
        const gpu=pick(G,function(x){return (x.ts||0)>=30445&&x.tier!=='budget';});
        const ram=pick(M,function(x){return x.tier!=='budget'&&(x.cap||0)>=16;});
        const disk=pick(ST,function(x){return x.tier!=='budget';});
        const all=[mb,psu,cool,cse,cpu,gpu,ram,disk];
        if(all.some(function(x){return !x;}))return null;
        return all.reduce(function(s,x){return s+nx(x);},0);
      }catch(e){return null;}
    };
    if(_grade==='high'){
      need.cs=Math.max(need.cs||0,19539);
      need.ts=Math.max(need.ts||0,30445);
    }
    /* 预算跟着「客户真正的门槛」走：参考机分数比要求高一大截时，别按参考机成本给钱，
       否则门槛降下来了、预算没降，一单白赚几千。向上取整到 50，避免算出 302 给 300。 */
    const _tightK=Math.min(1,(need.ts>0&&best.ts>0)?need.ts/best.ts:1);
    /* 难度曲线：前 3 天宽松一点（新手期），25 天以后开始收紧 */
    const _bpDay=(state.day||1)<=3?0.06:((state.day||1)>=25?-0.05:0);
    const _budgetAdj=Math.min(1.0,Math.max(0.55+_bpDay,0.55+0.45*_tightK+_bpDay));
    let partBudget=Math.ceil(_budgetBase*_budgetAdj/50)*50;
    /* 兜底：如果这单的软件门槛参考机根本达不到，预算按「最低可装成本 ×1.15」抬起来。
       否则玩家按门槛配机必然倒贴（审计里 16/269 单属于这种）。 */
    try{
      /* 工作机（128G / 双卡 / 4 块 HDD）和 4K 游戏机（水冷）有额外硬性要求，
         参考机不一定覆盖，这些单一律算一次最低成本。 */
      const _ramNeed=Math.max(need.ram||0,(cat==='工作机'&&tier===0)?128:0);
      const _special=(cat==='工作机')||(cat==='游戏机'&&tier===2);
      /* 128G 工作机的最低成本函数偶尔凑不出容量，直接给个硬下限兜住 */
      if(cat==='工作机'&&tier===0)partBudget=Math.max(partBudget,21000);
      /* 顶配单写明要 5090 级别，预算必须覆盖一张 5090 再加整机 */
      if(ultra)partBudget=Math.max(partBudget,66000);
      if(_grade==='high'){
        const _ff=flagshipFloor();
        if(_ff)partBudget=Math.max(partBudget,Math.ceil(_ff*1.22/50)*50);
      }
      if(_special||!(best.ts>=(need.ts||0)&&best.cs>=(need.cs||0)&&ramCap>=_ramNeed)){
        const _floor=minBuildCost(Object.assign({},need,{ram:_ramNeed}),{newOnly,cat,tier,gpuPref:pref,ultra});
        if(_floor)partBudget=Math.max(partBudget,Math.ceil(_floor*1.15/50)*50);
      }
    }catch(e){}
    /* 软件本身不需要显卡分（need.ts=0，比如 Office / ERP）就别再按参考机核显分算门槛，
       否则一台「家用上网机」会被写成要 3DMark ≥ 400，等于逼玩家配显卡。 */
    /* 核显单：软件只要核显级别（3DMark ≤1200）就不写「3DMark 多少分」，
       改成「核显够用」或「能玩《XX》」——玩家不用去猜分数。 */
    const _igp = need.ts>0 && need.ts<=1200;
    const _swText=String(swNames||'');
    const _gameM=/(《[^》]+》)/.exec(_swText);
    const _igpText = _igp ? (_gameM ? ('能玩'+_gameM[1]) : '核显够用') : '';
    const target={
      ts:(_igp&&need.ts<=800)?0:(need.ts>0?R2(need.ts,100):0),
      cs:need.cs>0?R2(need.cs,100):0,
      ram:need.ram};
    if(_igp){target.igp=1;target.igpText=_igpText;}
    const extra=[];
    if(newOnly)extra.push('只要全新件，不接受二手');
    else if(tight)extra.push('预算极紧：二手件、杂牌内存都接受');
    else extra.push('预算宽松，但电源要用全新的');
    /* 旗舰单指定 A 卡但全表没有合规 A 卡时，取消品牌指定，否则这单无解 */
    if(_grade==='high'&&pref==='amd'){
      const _okAmd=(typeof G!=='undefined')&&G.some(function(g){return /Radeon|AMD/i.test(g.n)&&(g.ts||0)>=30445&&g.tier!=='budget'&&g.p!=null;});
      if(!_okAmd){pref=null;ref.pref=null;}
    }
    if(ref.pref)extra.push('显卡只要 '+prefName(ref.pref));
    if(ultra)extra.push('指定要 RTX 5090 级别');
    if(ultra)extra.push('极限装机：全套必须全新件');
    if(cat==='工作机'&&tier===0)extra.push('内存 ≥ 128G');
    if(cat==='工作机'&&tier===1)extra.push('显卡 ×2（同型号）');
    if(cat==='工作机'&&tier===2)extra.push('HDD ≥ 4 块');
    if(cat==='游戏机'&&tier===2)extra.push('必须水冷');
    /* 交期：1~7 天，近似正态（均值约 3.2 天，两头越来越少见） */
    let _dl=Math.round(3.2+(rand()+rand()+rand()-1.5)*1.9);
    _dl=Math.max(1,Math.min(7,_dl));
    /* 随机"加急单"：交期压到 1 天，手工费高一点 */
    let _labor=labor,_extra=extra,_jname=jobNameFor(cat,swList,rand,ultra);
    if(rand()<0.16){
      _dl=1;
      _labor=Math.round(_labor*1.5/10)*10;
      _extra.push('加急：今天就要，拖到明天就退单');
      _jname='急单 · '+_jname;
    }
    _job={id:'J'+day+'-'+i,cat,tier,baseCost:cost,name:_jname,
      client:CLIENT_NAMES[Math.floor(rand()*CLIENT_NAMES.length)],
      clientRole:CLIENT_ROLES[Math.floor(rand()*CLIENT_ROLES.length)],
      sw:swNames,swList:swNames,level,target,newOnly,tight,ultra,gpuPref:ref.pref,partBudget,
      grade:_grade,labor:_labor,extra:_extra,status:'open',deadline:_dl,dueDay:day+_dl-1,bornDay:day,
      hideScore:!_showScore,minMhz:(cat==="办公机"?0:(cat==="游戏机"?[3200,3600,6000][tier]:3200))};
    if(_job.partBudget<=_cap||tier===0)break;
    _tier=Math.max(0,tier-1);
    }
    if(_job&&(day===2||day===3)){
      /* 第 2 天：前两张单一张算墨桀的亲戚、一张算陈默的；第 3 天开始随机混着来 */
      let whoIntro;
      if(day===2)whoIntro=(i===0)?'墨桀的亲戚':'老同学陈默';
      else whoIntro=(rand()<0.5?'墨桀的亲戚':'老同学陈默');
      _job.extra.push(whoIntro+'介绍来的');
    }
    if(_job&&!_job.ultra&&!_job.tight&&!_job.newOnly&&rand()<0.8){
      _job.newFor=['case','psu','cooler'];
      _job.extra.push('机箱、电源、散热要用全新件');
      _job.partBudget=Math.ceil((_job.partBudget+newForDelta())/50)*50;
    }
    if(_job){
      /* 档位要求：高端单要旗舰全新，中端单要性价比（别上旗舰），低端单不限制 */
      if(_job.grade==='high')_job.extra.push('旗舰单：主板/电源/散热要旗舰件，机箱/显卡/内存/硬盘中端以上，CPU≥9700X、显卡≥9070XT');
      else if(_job.grade==='mid')_job.extra.push('性价比单：核心件走中端/低端就行，别上旗舰件');
      jobs.push(_job);
    }
  }
  return jobs;
}


/* ================= 音效与 BGM（WebAudio 合成，无外部音频文件） =================
   不用第三方音频素材：全部现场合成，避免版权/授权问题，也不增加文件体积。
   手机浏览器要求用户先触摸一次才能出声，所以 AudioContext 在第一次点击时创建。 */
const AE={ctx:null,master:null,musicGain:null,sfxGain:null,muted:false,musicTimer:0,nextT:0,step:0};
function aeMutedLoad(){try{return localStorage.getItem('pcbs_audio_muted')==='1';}catch(e){return false;}}
function aeMutedSave(){try{localStorage.setItem('pcbs_audio_muted',AE.muted?'1':'0');}catch(e){}}
function aeInit(){
  if(AE.ctx)return;
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return;
  AE.ctx=new C();
  AE.master=AE.ctx.createGain();AE.master.gain.value=0.55;AE.master.connect(AE.ctx.destination);
  AE.sfxGain=AE.ctx.createGain();AE.sfxGain.gain.value=0.7;AE.sfxGain.connect(AE.master);
  AE.musicGain=AE.ctx.createGain();AE.musicGain.gain.value=0.9;AE.musicGain.connect(AE.master);
  AE.muted=aeMutedLoad();
  const b=document.getElementById('btnMute');if(b)b.textContent=AE.muted?'🔇':'🔊';
  /* 关键：初始化完成后立刻套用设置里保存的音量，
     否则滑块位置是保存值、实际增益永远是默认值——「设置没用」就是这个原因。 */
  try{if(typeof volApply==='function')volApply();}catch(e){}
  if(!AE.muted)aeMusicStart();
}
function aeResume(){if(!AE.ctx){aeInit();}if(AE.ctx&&AE.ctx.state==='suspended')AE.ctx.resume();}
function aeTone(freq,dur,type,vol,slide,when){
  const ctx=AE.ctx;if(!ctx)return;
  const t=(when||ctx.currentTime);
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(freq,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),t+dur);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(vol||0.25,t+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(AE.sfxGain);o.start(t);o.stop(t+dur+0.02);
}
function aeNoise(dur,vol,hp,when,bus){
  const ctx=AE.ctx;if(!ctx)return;
  const t=(when||ctx.currentTime);
  const len=Math.floor(ctx.sampleRate*dur),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=ctx.createBufferSource();src.buffer=buf;
  const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=hp||600;
  const g=ctx.createGain();g.gain.value=vol||0.12;
  src.connect(f);f.connect(g);g.connect(bus||AE.sfxGain);src.start(t);
}
const SFX={
  click(){aeResume();aeTone(760,0.05,'square',0.10,520);},
  coin(){aeResume();const t=AE.ctx?AE.ctx.currentTime:0;aeTone(988,0.09,'triangle',0.22,988);aeTone(1319,0.14,'triangle',0.20,1319,t+0.07);},
  success(){aeResume();const t=AE.ctx?AE.ctx.currentTime:0;[523,659,784,1047].forEach((f,i)=>aeTone(f,0.22,'triangle',0.18,f,t+i*0.09));},
  fail(){aeResume();const t=AE.ctx?AE.ctx.currentTime:0;aeTone(220,0.22,'sawtooth',0.16,150,t);aeTone(180,0.26,'sawtooth',0.14,120,t+0.12);},
  whoosh(){aeResume();aeNoise(0.35,0.10,500);},
  pop(){aeResume();aeTone(420,0.08,'sine',0.16,620);},
  /* 微信消息音：短促上扬的「咻」，只在微信剧情里用。
     连着来消息时加 150ms 最小间隔，避免「咻咻」叠成一片。 */
  msgOut(){
    aeResume();const t=AE.ctx?AE.ctx.currentTime:0;
    /* 更明显：主音 + 高八度泛音，音量抬高、拖长到 110ms */
    aeTone(740,0.11,'triangle',0.42,1040,t);
    aeTone(1480,0.07,'sine',0.16,1480,t+0.01);
  },
  /* 跑分：一段上扫 + 滴答，跑完来一个上扬和弦 */
  bench(){
    aeResume();const ctx=AE.ctx;if(!ctx)return;const t=ctx.currentTime;
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sawtooth';o.frequency.setValueAtTime(150,t);
    o.frequency.exponentialRampToValueAtTime(760,t+1.15);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.linearRampToValueAtTime(0.05,t+0.12);
    g.gain.exponentialRampToValueAtTime(0.0001,t+1.22);
    o.connect(g);g.connect(AE.sfxGain);o.start(t);o.stop(t+1.26);
    for(let i=0;i<6;i++)aeTone(1150+i*90,0.045,'square',0.04,0,t+0.08+i*0.18);
  },
  benchDone(){aeResume();const t=AE.ctx?AE.ctx.currentTime:0;[880,1174,1568].forEach((f,i)=>aeTone(f,0.26,'triangle',0.17,f,t+i*0.08));}
};
/* BGM：Am7 - F - C - G 的循环，低音量垫底 */
const AE_CHORDS=[[220.0,261.6,329.6,392.0],[174.6,220.0,261.6,349.2],[261.6,329.6,392.0,523.3],[196.0,246.9,293.7,392.0]];
function aeMusicStep(step,when){
  const ctx=AE.ctx;if(!ctx)return;
  /* 音量为 0 时干脆不产生任何音符（包括打点噪声），才算真的关掉 */
  try{if(!AE.musicGain||AE.musicGain.gain.value<=0.001)return;}catch(e){}
  const bar=Math.floor(step/8)%4,ch=AE_CHORDS[bar];
  const beat=step%8;
  const mk=(freq,dur,type,vol)=>{
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,when);
    g.gain.exponentialRampToValueAtTime(vol,when+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,when+dur);
    o.connect(g);g.connect(AE.musicGain);o.start(when);o.stop(when+dur+0.03);
  };
  /* 音量基准整体 ×2.2（响度靠音符本身，不靠总线增益堆，避免整条链路削波） */
  const MV=2.2;
  /* 贝斯 */
  if(beat===0||beat===4)mk(ch[0]/2,0.55,'sine',0.20*MV);
  /* 和弦垫 */
  if(beat===0)ch.forEach(f=>mk(f,1.6,'triangle',0.045*MV*1.6));
  /* 琶音 */
  const arpNote=ch[(beat+Math.floor(step/8))%4]*2;
  mk(arpNote,0.22,'triangle',0.045*MV*1.5);
  /* 轻打点 */
  if(beat===2||beat===6)aeNoise(0.05,0.03,2000,when,AE.musicGain);
}
function aeMusicStart(){
  if(!AE.ctx||AE.muted||AE.musicTimer)return;
  AE.nextT=AE.ctx.currentTime+0.1;
  AE.musicTimer=setInterval(()=>{
    if(!AE.ctx||AE.muted)return;
    const stepDur=60/84/2; /* 84 BPM，八分音符 */
    while(AE.nextT<AE.ctx.currentTime+0.4){
      aeMusicStep(AE.step,AE.nextT);
      AE.nextT+=stepDur;AE.step++;
    }
  },120);
}
function aeMusicStop(){if(AE.musicTimer){clearInterval(AE.musicTimer);AE.musicTimer=0;}}
function aeToggleMute(){
  AE.muted=!AE.muted;aeMutedSave();
  const b=document.getElementById('btnMute');if(b)b.textContent=AE.muted?'🔇':'🔊';
  if(AE.muted)aeMusicStop();else{aeResume();aeMusicStart();}
}
/* ================= 状态 ================= */
const SAVE='pcbs2_biz_v17';
const SLOT_KEY=i=>'pcbs2_biz_slot'+i;
function newBuild(){
  return {case:null,psu:null,mb:null,cpu:null,cooler:null,gpu1:null,gpu2:null,paste:false,
          rams:[null,null,null,null],m2:[null,null,null,null],sata:[null,null,null,null,null,null]};
}
let state=null,build=newBuild(),curCat='cpu';
function defaultFilt(){return {price:[],extra:[],cond:[],ig:'all',mem:[],cap:[],mhz:[],sort:'usedAsc',minPerf:0,q:''};}
let filt=defaultFilt();
let swOpen={};
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function save(){try{localStorage.setItem(SAVE,JSON.stringify({v:3,ts:Date.now(),state,build}));}catch(e){}}
function load(){
  try{
    const s=localStorage.getItem(SAVE);if(!s)return false;
    const d=JSON.parse(s);
    if(d&&d.state){state=d.state;build=d.build||newBuild();}
    else{state=d;build=newBuild();}
    return true;
  }catch(e){return false;}
}
function applyState(st,bd){
  state=st;build=bd?JSON.parse(JSON.stringify(bd)):newBuild();
  state.inv=state.inv||[];
  state.story=state.story||{done:{},flags:{}};
  state.story.done=state.story.done||{};state.story.flags=state.story.flags||{};
  state.customers=state.customers||{};state.diag=state.diag||{};
  state.benches=state.benches||{};
  state.tut=state.tut||{done:{},hidden:false};
  state.rep=state.rep||{score:3,log:[],bad:0};
  state.life=state.life||{car:null,house:null};
  state.extraIncome=state.extraIncome||0;
  state.done=state.done||[];
  (state.jobs||[]).forEach(j=>{
    if(!j.story&&j.hideScore===undefined)j.hideScore=(hash(String(j.id))%100)<90;
  });
  state.pcBox=state.pcBox||[];
  state.tb=state.tb||null;state.inv.forEach(x=>{if(x.owner===undefined)x.owner=null;});
  state.machines=state.machines||[];state.benchMachines=state.benchMachines||{};
  if(typeof state.dayStartCash!=='number')state.dayStartCash=state.cash;
  state.todayIn=state.todayIn||0;state.todayOut=state.todayOut||0;state.todayStory=state.todayStory||0;
  if(!state.dayTotal)state.dayTotal=state.jobs.length;
  if(!state.panel||state.panel==='taobao'||state.panel==='xianyu')state.panel='jobs';
  uidSeq=1;state.inv.forEach(x=>{const n=+String(x.uid).slice(1);if(n>=uidSeq)uidSeq=n+1;});
  filt=defaultFilt();
  const r=document.getElementById('result');if(r){r.className='';r.innerHTML='';}
}
function newGame(silent){const d=today();
  state={date:d,day:1,cash:8000,jobs:[],dayTotal:0,activeId:null,panel:'jobs',inv:[],pcBox:[],
    story:{done:{},flags:{}},customers:{},tb:null,diag:{},benches:{},machines:[],benchMachines:{},
    dayStartCash:8000,todayIn:0,todayOut:0,todayStory:0,
    rep:{score:3,log:[],bad:0},life:{car:null,house:null},extraIncome:0,done:[],
    tut:{done:{},hidden:false},seed:(Math.random()*1e9)|0};
  state.jobs=makeJobs(d,1);state.dayTotal=state.jobs.length;build=newBuild();
  const r=document.getElementById('result');if(r){r.className='';r.innerHTML='';}
  /* silent：初始化时只要内存里有一局可渲染，不写盘——不然还没开局就多出一条「第1天」的自动存档 */
  if(!silent)save();}

let uidSeq=1;
function addInv(item){state.inv.push({uid:'i'+(uidSeq++),cat:item.cat,part:item.part,paid:item.paid,shop:item.shop,owner:item.owner||null,broken:!!item.broken,faulty:!!item.faulty});}
function invList(cat){return state.inv.filter(x=>x.cat===cat);}
function part(k){return build[k]?build[k].part:null;}
function ramPart(i){return build.rams[i]?build.rams[i].part:null;}
function m2Part(i){return build.m2[i]?build.m2[i].part:null;}
function sataPart(i){return build.sata[i]?build.sata[i].part:null;}
function totalCost(){let c=0;['case','psu','mb','cpu','cooler','gpu1','gpu2'].forEach(k=>c+=build[k]?build[k].paid:0);
  [...build.rams,...build.m2,...build.sata].forEach(s=>{if(s)c+=s.paid;});return c;}
function ramTotal(){
  let t=0;const seen={};
  build.rams.forEach(r=>{
    if(!r)return;
    const m=r.part.mult||1;
    if(m>1){
      if(r.kitId){if(seen[r.kitId])return;seen[r.kitId]=1;}
      t+=r.part.cap*m;return;
    }
    t+=r.part.cap;
  });
  return t;
}
/* 功耗按「实际装了哪些件」加出来，不再拍一个 100W 的固定底数。
   以前是 100 + CPU 的 TDP + 显卡的 TBP，于是只有核显的办公机也报 195W（100+95），
   看着像装了两块卡。现在：主板/风扇/外设 30W 打底，内存按条、硬盘按类型、散热按风冷水冷各算一份。 */
function powerParts(){
  const out=[];
  const cpu=part('cpu');
  if(cpu)out.push(['CPU',cpu.t]);
  [part('gpu1'),part('gpu2')].forEach(g=>{if(g)out.push(['显卡',g.tbp]);});
  const rams=build.rams.filter(Boolean);
  if(rams.length){
    const w=rams.reduce((s,r)=>s+(r.part.m==='DDR5'?5:3),0);
    out.push(['内存 x'+rams.length,w]);
  }
  let disk=0;
  build.m2.filter(Boolean).forEach(()=>{disk+=5;});
  build.sata.filter(Boolean).forEach(s=>{disk+=(s.part.kind==='hdd'?9:4);});
  if(disk)out.push(['硬盘',disk]);
  const cool=part('cooler');
  if(cool)out.push([cool.rad?'水冷':'散热',cool.rad?15:4]);
  if(part('mb'))out.push(['主板/风扇',30]);   /* 没装主板就别报 30W 底噪 */
  return out;
}
function powerNeed(){return powerParts().reduce((s,p)=>s+p[1],0);}
function totalScore(){let ts=0;const g1=part('gpu1'),g2=part('gpu2'),cpu=part('cpu');
  if(g1)ts+=g1.ts+Math.round((cpu?cpu.cs:0)*0.03);else ts+=igScore(cpu);
  if(g2)ts+=Math.round(g2.ts*0.85);return {ts,cs:cpu?cpu.cs:0,ram:ramTotal()};}
function job(){return state.jobs.find(j=>j.id===state.activeId);}
function saveBench(){if(!state.activeId)return;state.benches=state.benches||{};state.benches[state.activeId]=build;}
function takenJobs(){return state.jobs.filter(j=>j.status==='taken');}
function switchJob(dir){
  const list=takenJobs();if(list.length<2)return;
  saveBench();
  const i=list.findIndex(j=>j.id===state.activeId);
  const next=list[((i<0?0:i)+dir+list.length)%list.length];
  if(!next)return;
  state.activeId=next.id;
  build=state.benches[next.id]||newBuild();
  state.panel='shop';save();renderAll();
  toast('切换到：'+next.name);
}
function laborMul(){return 1;}

function jobLabor(j){
  const m=(j&&j.repair)?(repState(j.id).mistakes||0):0;
  return Math.round(j.labor*Math.pow(0.75,m)*laborMul());
}
function closedCount(){const total=state.dayTotal||state.jobs.length;
  const pending=state.jobs.filter(j=>j.status==='open'||j.status==='taken').length;
  return Math.max(0,total-pending);}
function carryToInv(bd,ownerId){
  if(!bd)return 0;
  let n=0;
  ['case','psu','mb','cpu','cooler','gpu1','gpu2'].forEach(k=>{
    if(bd[k]){addInv({cat:(k==='gpu1'||k==='gpu2')?'gpu':k,part:bd[k].part,paid:0,shop:'own',owner:ownerId});n++;}
  });
  ['rams','m2','sata'].forEach(arr=>{
    const cat=(arr==='rams')?'ram':'disk';
    (bd[arr]||[]).forEach(s=>{if(s){addInv({cat,part:s.part,paid:0,shop:'own',owner:ownerId});n++;}});
  });
  return n;
}

/* ================= 整机：客户送来的旧电脑是一个整体 =================
   以前 carryToInv() 把旧机拆成一堆散件塞进仓库：玩家得自己去七个分类里一件件找、
   一件件装，才看得出「这台机器长什么样」——旧机明明是抬进来的一整台机器。
   现在旧机是一个 machine 对象（state.machines）：
     · 收单时整机上到工作台（机箱/主板/CPU/散热/内存/硬盘/电源一次到位，金色描边＝客户的件）；
     · 没上台的整机在「仓库」里单独一张卡，可以「整机上台」或「拆成散件」；
     · 清空工作台时，客户的件不会被抖散到货架上，而是整机收回仓库。 */
function newMid(){return 'm'+Date.now().toString(36)+Math.floor(Math.random()*1e3);}
function machineNameOf(ownerKey,j){
  const c=(ownerKey&&state.customers&&state.customers[ownerKey])||null;
  const who=(c&&c.name)||ownerKey||(j&&j.client)||'客户';
  return who+'的旧机';
}
function addMachine(jobId,ownerKey,snapshot,opts){
  state.machines=state.machines||[];
  const md={mid:newMid(),jobId:jobId||null,owner:ownerKey||null,
    name:(opts&&opts.name)||machineNameOf(ownerKey),
    note:(opts&&opts.note)||'',
    onBench:false,
    build:JSON.parse(JSON.stringify(snapshot||{}))};
  state.machines.push(md);
  return md;
}
function getMachine(mid){return (state.machines||[]).find(m=>m.mid===mid)||null;}
function machinesInInv(){return (state.machines||[]).filter(m=>!m.onBench);}
/* 整机 → 一行摘要 */
function machineSpec(md){
  const b=(md&&md.build)||{},bits=[];
  if(b.cpu)bits.push(String(b.cpu.part.n).replace(/^Intel Core /,'').replace(/^Intel /,'').replace(/^AMD /,''));
  if(b.mb)bits.push(b.mb.part.s);
  const ram=(b.rams||[]).reduce((s,r)=>s+(r?r.part.cap:0),0);if(ram)bits.push(ram+'G');
  const dk=(b.m2||[]).concat(b.sata||[]).filter(Boolean);
  if(dk.length)bits.push(dk[0].part.cap>=1000?(dk[0].part.cap/1000)+'T SSD':dk[0].part.cap+'G 硬盘');
  if(b.gpu1)bits.push(String(b.gpu1.part.n).replace('NVIDIA GeForce ','').replace('AMD Radeon ',''));
  return bits.join(' · ')||'空机箱';
}
/* 整机 → 工作台（按装机顺序放；实在塞不进去的件退回仓库当散件，绝不凭空消失） */
function machineToBench(md){
  if(!md)return {ok:0,fail:0};
  const b=md.build||{};let ok=0,fail=0;
  const put=(cat,slotData)=>{
    if(!slotData)return;
    const r=placePart(cat,slotData.part,0,'own',md.jobId);
    if(r==='ok')ok++;
    else{addInv({cat,part:slotData.part,paid:0,shop:'own',owner:md.jobId});fail++;}
  };
  /* 上台顺序必须跟着装机规则走：主板 → CPU → 硅脂 → 散热 → 电源 → 机箱 → 显卡 → 内存/硬盘。
     以前按 case/psu/mb/cpu/cooler 的顺序放，机箱（要先有主板+电源）和电源（要先有主板）
     全部被 placePart 拒掉，整机上台后只剩主板和 CPU —— 于是工作台照片停在「主板」，
     看起来这台旧机根本没装起来。 */
  put('mb',b.mb);
  put('cpu',b.cpu);
  if(b.cpu&&build.cpu)build.paste=true;   /* 别人装好的整机，硅脂早涂过了 */
  put('cooler',b.cooler);
  put('psu',b.psu);
  put('case',b.case);
  put('gpu',b.gpu1);put('gpu',b.gpu2);
  (b.rams||[]).forEach(s=>put('ram',s));
  (b.m2||[]).forEach(s=>put('disk',s));
  (b.sata||[]).forEach(s=>put('disk',s));
  md.onBench=(ok>0);
  if(ok>0){
    state.benchMachines=state.benchMachines||{};
    if(md.jobId)state.benchMachines[md.jobId]=md.mid;
  }
  return {ok,fail};
}
/* 工作台上的整机 → 收回仓库（只收客户自带的件，玩家自己加的件还是回货架） */
function machineBackToInv(md){
  if(!md)return 0;
  const b={case:null,psu:null,mb:null,cpu:null,cooler:null,gpu1:null,gpu2:null,
    rams:[null,null,null,null],m2:[null,null,null,null],sata:[null,null,null,null,null,null]};
  let n=0;
  const take=(k,slotData)=>{
    if(!slotData)return false;
    if(md.jobId&&slotData.owner!==md.jobId)return false;   /* 客户的整机：只收他自带的件 */
    b[k]=slotData;n++;return true;                          /* 自己的整机：台上的件都算它的 */
  };
  ['case','psu','mb','cpu','cooler','gpu1','gpu2'].forEach(k=>{if(take(k,build[k]))build[k]=null;});
  build.rams.forEach((s,i)=>{if(take('ram'+i,s)){b.rams[i]=s;build.rams[i]=null;}});
  build.m2.forEach((s,i)=>{if(take('m2'+i,s)){b.m2[i]=s;build.m2[i]=null;}});
  build.sata.forEach((s,i)=>{if(take('sata'+i,s)){b.sata[i]=s;build.sata[i]=null;}});
  md.build=b;md.onBench=false;
  state.benchMachines=state.benchMachines||{};
  if(md.jobId&&state.benchMachines[md.jobId]===md.mid)delete state.benchMachines[md.jobId];
  return n;
}
/* 整机 → 散件（玩家主动拆机时才这么干） */
function machineToParts(md){
  if(!md)return 0;
  const n=carryToInv(md.build,md.jobId);
  state.machines=(state.machines||[]).filter(m=>m.mid!==md.mid);
  return n;
}
function dropMachinesOfJob(jobId){
  state.machines=(state.machines||[]).filter(m=>m.jobId!==jobId);
  if(state.benchMachines)delete state.benchMachines[jobId];
}
function benchIsEmpty(){
  return !build.case&&!build.psu&&!build.mb&&!build.cpu&&!build.cooler&&!build.gpu1&&!build.gpu2
    &&!build.rams.some(Boolean)&&!build.m2.some(Boolean)&&!build.sata.some(Boolean);
}
/* 一堆散件 → 一份整机构造（淘宝打包整机、客户旧机都用得上） */
function partsToBuild(parts){
  const b=newBuild();let ri=0,mi=0,si=0;
  (parts||[]).forEach(({cat,part})=>{
    if(!part)return;
    const cell={part,paid:0,shop:'own',owner:null};
    if(cat==='case'){if(!b.case)b.case=cell;}
    else if(cat==='psu'){if(!b.psu)b.psu=cell;}
    else if(cat==='mb'){if(!b.mb)b.mb=cell;}
    else if(cat==='cpu'){if(!b.cpu)b.cpu=cell;}
    else if(cat==='cooler'){if(!b.cooler)b.cooler=cell;}
    else if(cat==='gpu'){if(!b.gpu1)b.gpu1=cell;else if(!b.gpu2)b.gpu2=cell;}
    else if(cat==='ram'){if(ri<4)b.rams[ri++]=cell;}
    else if(cat==='disk'){
      if(part.kind==='m2'){if(mi<4)b.m2[mi++]=cell;}else{if(si<6)b.sata[si++]=cell;}
    }
  });
  return b;
}


/* ================= 淘宝来信 ================= */
const tbVal=p=>p.u??Math.round((p.p||0)*0.5);
function tbDate(){return new Date(state.date+'T12:00:00');}
function tbWeekday(){return tbDate().getDay();}
function tbWeekKey(){
  const d=tbDate();const wd=(d.getDay()+6)%7;d.setDate(d.getDate()-wd);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function tbPool(){
  const cap=400+state.day*450,out=[];
  Object.entries(MAP).forEach(([cat,arr])=>{
    const a=arr.filter(x=>!x.kit&&tbVal(x)>0&&tbVal(x)<=cap);
    if(a.length)out.push([cat,a]);
  });
  return out;
}
function tbUsedPC(rand,pool){
  const pick=(cat,f)=>{
    const g=pool.find(o=>o[0]===cat);if(!g)return null;
    const l=g[1].filter(f);
    return l.length?l[Math.floor(rand()*l.length)]:null;
  };
  const cpu=pick('cpu',()=>true);if(!cpu)return [];
  const mb=pick('mb',b=>b.s===cpu.s);
  const ram=pick('ram',r=>mb?r.m===mb.m:true);
  const cool=pick('cooler',h=>h.s.includes(cpu.s));
  const psu=pick('psu',p=>p.w>=Math.max(300,(cpu.t||0)+150));
  const kase=pick('case',k=>mb?k.ff.includes(mb.ff):true);
  const disk=pick('disk',()=>true);
  const gpu=rand()<0.55?pick('gpu',()=>true):null;
  const out=[],add=(cat,p)=>{if(p)out.push({cat,part:p});};
  add('cpu',cpu);add('mb',mb);add('ram',ram);add('cooler',cool);
  add('psu',psu);add('case',kase);add('disk',disk);add('gpu',gpu);
  return out;
}
const BROKEN_CATS=['gpu','mb','cpu','ram','disk','psu'];
function makeBroken(rand,pool){
  const cats=pool.filter(o=>BROKEN_CATS.indexOf(o[0])>=0);
  if(!cats.length)return null;
  const g=cats[Math.floor(rand()*cats.length)];
  const p=g[1][Math.floor(rand()*g[1].length)];
  const base=p.u??Math.round((p.p||0)*0.5);
  const sell=Math.max(6,R2(base*(0.12+rand()*0.16),1));
  return {cat:g[0],part:{n:'坏的 '+p.n,broken:true,from:p.n,sell}};
}
function makeTbOffer(){
  const rand=rngFrom(hash('tb'+tbWeekKey()+'#'+state.day));
  const pool=tbPool(),boxPool=pool.filter(o=>o[0]!=='case');
  const mult=0.8+rand()*2.2;
  const items=[];
  for(let i=0;i<2;i++)items.push({kind:'pc',items:tbUsedPC(rand,pool)});
  for(let i=0;i<3;i++){
    const n=10+Math.floor(rand()*21),parts=[];
    for(let j=0;j<n;j++){
      const g=boxPool[Math.floor(rand()*boxPool.length)];
      parts.push({cat:g[0],part:g[1][Math.floor(rand()*g[1].length)]});
    }
    for(let j=0;j<1+Math.floor(rand()*3);j++){
      const x=makeBroken(rand,boxPool);
      if(x)parts.push(x);
    }
    items.push({kind:'box',items:parts});
  }
  const flat=[];items.forEach(g=>g.items.forEach(x=>flat.push(x)));
  const val=flat.reduce((s,x)=>s+(x.part.broken?0:tbVal(x.part)),0);
  return {week:tbWeekKey(),price:R2(val/mult,100),mult,items,bought:false,closed:false};
}
function tbOffer(){
  if(state.day<=7){ if(state.tb)state.tb=null; return null; }
  const wd=tbWeekday();
  if(wd<1||wd>5){ if(state.tb){state.tb=null;save();} return null; }
  if(!state.tb||state.tb.week!==tbWeekKey()||!state.tb.items){state.tb=makeTbOffer();save();}
  return state.tb;
}
function tbCardHTML(o){
  return `<div class="lh"><div class="stamp">淘</div>
    <div><div class="who">淘宝 · 仓库清货专场</div><div class="sub">周一至周五受理 · 周六自动失效</div></div></div>
    <div class="para">老板，仓库清货，打包出。不拆卖，也不告诉你是啥。</div>
    <div class="lot">
      <div class="row"><span>二手主机 × 2</span><b>整机 · 含机箱</b></div>
      <div class="row"><span>配件箱 × 3</span><b>每箱 10–30 件 · 不含机箱</b></div>
    </div>
    <div class="price"><span style="font-size:11.5px;color:#8d7f60">打包价</span><span class="v">${money(o.price)}</span></div>
    <div class="hint">现有现金 ${money(state.cash)}　·　买完直接入库，拆出来是什么全看运气</div>`;
}
function tbRender(){
  const mask=document.getElementById('tbMask'),mini=document.getElementById('tbMini');
  if(!mask||!mini)return;
  const o=tbOffer();
  if(!o||o.bought){mask.classList.remove('on');mini.classList.remove('on');return;}
  if(o.closed){
    mask.classList.remove('on');mini.classList.add('on');
    document.getElementById('tbMiniTxt').textContent='淘宝来信 · '+money(o.price);
    return;
  }
  mini.classList.remove('on');
  document.getElementById('tbCard').innerHTML=tbCardHTML(o)+
    `<div class="acts"><button id="tbLater">稍后再说</button><button class="primary" id="tbBuy">买下</button></div>`;
  const buy=document.getElementById('tbBuy');
  buy.disabled=state.cash<o.price;
  buy.onclick=tbBuyNow;
  document.getElementById('tbLater').onclick=()=>{o.closed=true;save();tbRender();};
  mask.classList.add('on');
}
function tbBuyNow(){
  const o=state.tb;if(!o||o.bought)return;
  if(state.cash<o.price){toast('现金不够');return;}
  const flat=[],pcGroups=[];
  o.items.forEach(g=>{
    if(g.kind==='pc'&&g.items&&g.items.length)pcGroups.push(g.items);
    else (g.items||[]).forEach(x=>flat.push(x));
  });
  state.cash-=o.price;o.bought=true;o.closed=true;
  flat.forEach(x=>addInv({cat:x.cat,part:x.part,paid:0,shop:'xianyu'}));
  /* 打包里写的「主机」是一整台机器，不该摊成七零八落的散件 —— 进仓库的「整机」区 */
  let pcCount=0;
  pcGroups.forEach(parts=>{
    const b=partsToBuild(parts);
    const any=b.case||b.mb||b.cpu||b.psu||b.cooler||b.gpu1;
    if(any){addMachine(null,null,b,{name:'淘宝二手整机',note:'打包收来的整机，配置看运气'});pcCount++;}
    else parts.forEach(x=>flat.push(x));
  });
  const val=flat.reduce((s,x)=>s+(x.part.broken?(x.part.sell||0):tbVal(x.part)),0);
  save();renderAll();
  const diff=val-o.price;
  modal('到货',`<b>${flat.length} 件散件</b>${pcCount?`　+　<b>${pcCount} 台整机</b>`:''}已经进仓库了。<br>
    花费 ${money(o.price)}　散件估值 ${money(val)}<br>
    <b style="color:${diff>=0?'#7ee0a1':'#f08a8a'}">${diff>=0?'赚了':'亏了'} ${money(Math.abs(diff))}</b><br>
    <span style="font-size:11px;color:#8b93a1">${pcCount?'整机在「仓库 · 整机」里，可以整机装到工作台，也可以拆成散件再挑。':'散件要自己拼'}</span>`,()=>{});
  const noEl=document.getElementById('mNo');if(noEl)noEl.style.display='none';
  const yesEl=document.getElementById('mYes');if(yesEl)yesEl.textContent='收下';
}
/* ================= 存档系统 ================= */
/* 从标题页进来只能「读」：那时候还没开局，存档按钮等于凭空覆盖进度。
   mode='title' 隐藏所有写入入口，只留读取。 */
let _saveMode='game';
function autoSaveData(){
  try{
    const s=localStorage.getItem(SAVE);if(!s)return null;
    const d=JSON.parse(s);
    return (d&&d.state)?d:null;
  }catch(e){return null;}
}
function slotData(i){
  try{const s=localStorage.getItem(SLOT_KEY(i));if(!s)return null;const d=JSON.parse(s);
    if(!d||!d.state)return null;return d;}catch(e){return null;}
}
function slotMeta(d){
  const st=d.state;
  const done=(st.dayTotal||st.jobs.length)-st.jobs.filter(j=>j.status==='open').length;
  const d2=new Date(d.ts||Date.now());
  const ts=`${d2.getMonth()+1}/${d2.getDate()} ${String(d2.getHours()).padStart(2,'0')}:${String(d2.getMinutes()).padStart(2,'0')}`;
  return {done,total:st.dayTotal||st.jobs.length,ts,date:st.date,day:st.day,cash:st.cash};
}
function renderSlots(){
  const box=document.getElementById('slotList');if(!box)return;
  const readonly=_saveMode==='title';
  let html='';
  /* 第一格永远是「自动存档」：每次操作、关页面、切后台都会写到这里 */
  const a=autoSaveData();
  if(a){
    const m=slotMeta(a);
    html+=`<div class="slotrow auto"><div class="h"><div class="nm">自动存档<span class="autotag">关页面时也会写</span></div>
      <div style="font-size:10.5px;color:var(--dim)">${m.ts}</div></div>
      <div class="meta">日期 ${m.date}（第 ${m.day} 天）　现金 ${money(m.cash)}<br>
        当日进度 ${m.done}/${m.total}</div>
      <div class="btns"><button class="primary" data-load-auto="1">读取自动存档</button></div></div>`;
  }else{
    html+=`<div class="slotrow auto"><div class="h"><div class="nm">自动存档</div>
      <div style="font-size:10.5px;color:var(--dim)">空</div></div>
      <div class="meta">还没有自动存档（开一局就会开始写）</div></div>`;
  }
  for(let i=1;i<=3;i++){
    const d=slotData(i);
    if(d){
      const m=slotMeta(d);
      html+=`<div class="slotrow"><div class="h"><div class="nm">存档位 ${i}</div>
        <div style="font-size:10.5px;color:var(--dim)">${m.ts}</div></div>
        <div class="meta">日期 ${m.date}（第 ${m.day} 天）　现金 ${money(m.cash)}<br>
          当日进度 ${m.done}/${m.total}</div>
        <div class="btns">${readonly?'':`<button data-save="${i}">覆盖存档</button>`}
          <button class="primary" data-load="${i}">读取</button>
          ${readonly?'':`<button class="bad" data-del="${i}">删除</button>`}</div></div>`;
    }else{
      html+=`<div class="slotrow empty"><div class="h"><div class="nm">存档位 ${i}</div>
        <div class="meta">空 · 还没有存档</div></div>
        ${readonly?'':`<div class="btns"><button data-save="${i}">存到此处</button></div>`}</div>`;
    }
  }
  box.innerHTML=html;

  const loadData=(d,label)=>{
    if(!d)return;
    modal('读取存档',readonly?`读取${label}并开始游戏？`:`读取${label}会覆盖当前进度，确定？`,()=>{
      applyState(d.state,d.build);save();renderAll();closeSave();
      if(typeof hideTitle==='function')hideTitle();
      toast('已读取'+label);
    });
  };

  box.querySelectorAll('[data-load-auto]').forEach(b=>b.onclick=()=>loadData(autoSaveData(),'自动存档'));
  box.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{
    if(readonly){toast('标题页只能读档');return;}
    const i=b.dataset.save;
    try{localStorage.setItem(SLOT_KEY(i),JSON.stringify({v:3,ts:Date.now(),state,build}));}catch(e){toast('存档失败：浏览器空间不足');return;}
    renderSlots();toast('已存到存档位 '+i);
  });
  box.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>loadData(slotData(b.dataset.load),'存档位 '+b.dataset.load));
  box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    if(readonly){toast('标题页不能删存档');return;}
    const i=b.dataset.del;
    modal('删除存档','删除存档位 '+i+'？不可恢复。',()=>{localStorage.removeItem(SLOT_KEY(i));renderSlots();toast('已删除');});
  });
}
function openSave(mode){
  _saveMode=(mode||'game');
  const ro=_saveMode==='title';
  const t=document.getElementById('smaskTitle'),h=document.getElementById('smaskHint');
  if(t)t.textContent=ro?'读档':'存档 / 读档';
  if(h)h.textContent=ro
    ? '这里只能读：自动存档 + 3 个手动存档位。想开新局请点标题页的「开始新游戏」。'
    : '自动存档在每次操作和关页面时都会写一次；下面 3 个位置给你手动留档。导出文件可换电脑或发给别人继续玩。';
  const ex=document.getElementById('btnExport'),ng=document.getElementById('btnNewGame'),
        tr=document.getElementById('btnTutReset');
  [ex,ng,tr].forEach(el=>{if(el)el.style.display=ro?'none':'';});
  renderSlots();
  document.getElementById('smask').classList.add('on');
}
function closeSave(){closeMask(document.getElementById('smask'));}
function exportSave(){
  const data={v:3,ts:Date.now(),state,build};
  const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`旺财装机店-${state.date}-第${state.day}天.json`;
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);
  toast('已导出存档文件');
}
function importSave(file){
  const fr=new FileReader();
  fr.onload=()=>{
    try{
      const d=JSON.parse(fr.result);
      const st=(d&&d.state)?d.state:d;
      const bd=(d&&d.state)?d.build:null;
      if(!st||!st.jobs||!st.date)throw new Error('bad');
      applyState(st,bd);save();renderAll();closeSave();toast('存档已导入');
    }catch(e){toast('文件读不出来，可能不是存档');}
  };
  fr.readAsText(file);
}
document.getElementById('btnSave').onclick=()=>openSave('game');
document.getElementById('smaskNo').onclick=closeSave;
document.getElementById('smask').onclick=e=>{if(e.target.id==='smask')closeSave();};
document.getElementById('btnExport').onclick=exportSave;
document.getElementById('btnImport').onclick=()=>document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange=e=>{
  const f=e.target.files&&e.target.files[0];
  if(f)modal('导入存档','导入会覆盖当前进度，确定？',()=>importSave(f));
  e.target.value='';
};
document.getElementById('btnHelp').onclick=openHelp;
document.getElementById('btnTutReset').onclick=()=>{
  state.tut=state.tut||{done:{},hidden:false};
  state.tut.hidden=false;save();closeSave();state.panel='jobs';renderAll();
  toast('新手任务已显示在左侧顶部');
};
document.getElementById('btnNewGame').onclick=()=>{
  modal('新游戏','当前进度会被清空（自动存档也一起重置），确定重开？',()=>{
    newGame();renderAll();closeSave();
    if(typeof hideTitle==='function')hideTitle();
    toast('已开新局');
  });
};

/* ================= 筛选 ================= */
const PRICE_OPTS=[['all','全部'],['a','≤300'],['b','300–800'],['c','800–2000'],['d','2000–5000'],['e','5000–15000'],['f','>15000']];
function inPrice(v,keys){
  /* 多选：数组里任意一个区间命中就算过；空数组 / 'all' = 不限 */
  if(!keys||keys==='all'||!keys.length)return true;
  const arr=Array.isArray(keys)?keys:[keys];
  return arr.some(k=>{
    if(k==='a')return v<=300;if(k==='b')return v>300&&v<=800;if(k==='c')return v>800&&v<=2000;
    if(k==='d')return v>2000&&v<=5000;if(k==='e')return v>5000&&v<=15000;if(k==='f')return v>15000;
    return true;});
}
const SOCKETS=['LGA1155','LGA1150','LGA1151','LGA1151V2','LGA1200','LGA1700','LGA1851','LGA2011-3','AM3+','AM4','AM5','TRX40','SP3','SP5'];
const EXTRA_FILTERS={
 cpu:[...SOCKETS.map(s=>[s,s,x=>x.s===s,'sock'])],
 mb:[...SOCKETS.map(s=>[s,s,x=>x.s===s,'sock']),
     ['d4','4内存槽',x=>x.dimm>=4,'feat'],['m2','有M.2',x=>x.m2>=1,'feat'],['pcie','双x16',x=>x.pcie>=2,'feat'],
     ['DDR3','DDR3',x=>x.m==='DDR3','mem'],['DDR4','DDR4',x=>x.m==='DDR4','mem'],['DDR5','DDR5',x=>x.m==='DDR5','mem']],
 ram:[],
 gpu:[['n','NVIDIA',x=>isNVIDIA(x),'brand'],['a','AMD',x=>isAMD(x),'brand'],
      ['s10','10系',x=>x.series==='10系','series'],['s16','16系',x=>x.series==='16系','series'],
      ['s20','20系',x=>x.series==='20系','series'],['s30','30系',x=>x.series==='30系','series'],
      ['s40','40系',x=>x.series==='40系','series'],['s50','50系',x=>x.series==='50系','series']],
 cooler:[['w','水冷',x=>x.rad>0,'type'],['a','风冷',x=>x.rad===0,'type'],['c','≤70元',x=>x.p!=null&&x.p<=70,'price']],
 psu:[['a','200–400W',x=>x.w<=400,'watt'],['b','450–650W',x=>x.w>=450&&x.w<=650,'watt'],
      ['c','750–850W',x=>x.w>=750&&x.w<=850,'watt'],['d','≥1000W',x=>x.w>=1000,'watt']],
 case:[['itx','支持ITX',x=>x.ff.includes('ITX'),'ff'],['atx','支持ATX',x=>x.ff.includes('ATX'),'ff'],
       ['gpu','显卡≥380mm',x=>x.mg>=380,'feat'],['bay','盘位≥6',x=>x.bay>=6,'feat'],['cheap','≤150元',x=>x.p!=null&&x.p<=150,'price']],
 disk:[['m2','NVMe',x=>x.kind==='m2','kind'],['sata','SATA SSD',x=>x.kind==='sata','kind'],['hdd','机械',x=>x.kind==='hdd','kind'],
       ['a','≥1T',x=>x.cap>=1000,'cap'],['b','≥4T',x=>x.cap>=4000,'cap']]
};
const IG_OPTS=[['all','全部'],['ig','带核显'],['no','无核显']];
/* 内存筛选拆成两组：代际 / 容量（频率有单独一行，按实际在售频率生成） */
const MEM_OPTS=[['all','全部'],['DDR3','DDR3'],['DDR4','DDR4'],['DDR5','DDR5']];
const CAP_OPTS=[['all','全部'],['4','4G'],['8','8G'],['16','16G'],['32','32G'],['64','64G']];
function igPred(){
  if(curCat!=='cpu'||filt.ig==='all')return ()=>true;
  return filt.ig==='ig'?x=>x.ig===1:x=>x.ig!==1;
}
function qPred(){
  const q=(filt.q||'').trim().toLowerCase();
  if(!q)return ()=>true;
  const norm=t=>String(t||'').toLowerCase().replace(/[\s\-_/\\()（）\[\]【】]+/g,'');
  const qn=norm(q);
  const toks=q.split(/\s+/).filter(Boolean).map(norm).filter(Boolean);
  /* 注意：机箱的 ff 是数组，主板的 ff 是字符串（'MATX'）——以前这里直接 x.ff.join()，
     在「主板」分类里一搜索就抛 TypeError，整个列表渲染中断，看起来就是「搜完什么都没了」。 */
  const ffOf=x=>{const v=x&&x.ff;if(!v)return '';return Array.isArray(v)?v.join(' '):String(v);};
  return x=>{
    const raw=(((x&&x.n)||'')+' '+(x&&x.s||'')+' '+(x&&x.m||'')+' '+(x&&x.kind||'')+' '+ffOf(x)+' '+(x&&x.series||''));
    const hay=norm(raw);
    if(qn&&hay.indexOf(qn)>=0)return true;          /* 去空格后的整体匹配：650ti → 650 Ti */
    return toks.every(t=>hay.indexOf(t)>=0);        /* 多关键词仍然按"都出现" */
  };
}
/* 货况筛选：全新 / 二手，多选取「或」——选全新只看有全新货的，选二手只看有二手货的 */
function condPred(){
  const c=Array.isArray(filt.cond)?filt.cond:[];
  if(!c.length)return ()=>true;
  const nw=c.indexOf('new')>=0,us=c.indexOf('used')>=0;
  if(nw&&us)return x=>x&&(x.p!=null||x.u!=null);
  if(nw)return x=>x&&x.p!=null;
  if(us)return x=>x&&x.u!=null;
  return ()=>true;
}
const PERF_META={
 cpu:{max:40000,step:1000,label:'Cinebench 多核 ≥',fmt:v=>v.toLocaleString()},
 gpu:{max:50000,step:500,label:'3DMark TS ≥',fmt:v=>v.toLocaleString()},
 ram:{max:64,step:4,label:'容量 ≥',fmt:v=>v+'G'},
 disk:{max:20000,step:250,label:'容量 ≥',fmt:v=>v>=1000?(v/1000)+'T':v+'G'},
 mb:{max:1536,step:64,label:'内存上限 ≥',fmt:v=>v+'G'},
 psu:{max:1500,step:50,label:'功率 ≥',fmt:v=>v+'W'},
 cooler:{max:450,step:25,label:'解热 ≥',fmt:v=>v+'W'},
 case:{max:435,step:5,label:'显卡限长 ≥',fmt:v=>v+'mm'}
};
const PERFVAL={cpu:x=>x.cs,gpu:x=>x.ts,ram:x=>x.cap,disk:x=>x.cap,mb:x=>x.max,psu:x=>x.w,cooler:x=>x.cap,case:x=>x.mg};
/* 散热需求：TDP 标称 ≠ 实际发热。
   原装下压压 65W 的 i3/i5 完全够用，E3/锁频 i7 也没那么烫；
   只有高 TDP 和 K 系才需要按标称甚至更高来配。 */
function coolNeed(cpu){
  const t=(cpu&&cpu.t)||65;
  if(t<=65)return Math.max(35,Math.round(t*0.75));
  if(t<=95)return Math.round(t*0.85);
  if(t<=125)return Math.round(t*0.95);
  return t;
}
/* 性能滑块按「商品数量分位」映射：
   位置 0 = 全部显示，位置 1000 = 品类里最高的那一档。
   以前用对数刻度（min→max 对数插值），分数分布一挤，滑块前 1/3 行程就把商品筛光了，
   后面怎么拖都只有一两件。现在每一格筛掉的条数差不多，拖起来手感是均匀的。
   每个品类的上限仍然取 PERF_META[cat].max（比如 Cinebench 封到 40,000）：
   超过上限的件按上限算，所以拖到最右端仍然是「≥40,000」，它们照样在列表里。 */
const _perfVals={};
function perfValues(cat){
  if(_perfVals[cat])return _perfVals[cat];
  const meta=PERF_META[cat],cap=(meta&&meta.max)||Infinity;
  const list=MAP[cat];
  if(!Array.isArray(list)||typeof PERFVAL[cat]!=='function'){_perfVals[cat]=[];return _perfVals[cat];}
  const arr=list.map(x=>PERFVAL[cat](x))
    .filter(v=>typeof v==='number'&&isFinite(v)&&v>0)
    .map(v=>Math.min(v,cap)).sort((a,b)=>a-b);
  _perfVals[cat]=arr;
  return arr;
}
function posToPerf(p,cat){
  const arr=perfValues(cat),meta=PERF_META[cat],step=meta?meta.step:1;
  const t=Math.max(0,Math.min(1,(+p||0)/1000));
  if(t<=0||!arr.length)return 0;
  const i=Math.min(arr.length-1,Math.round(t*(arr.length-1)));
  return Math.max(0,Math.floor(arr[i]/step)*step);
}
function perfToPos(v,cat){
  if(!v||v<=0)return 0;
  const arr=perfValues(cat);
  if(!arr.length)return 0;
  let lo=0,hi=arr.length-1,ans=arr.length;
  while(lo<=hi){const m=(lo+hi)>>1;if(arr[m]<v)lo=m+1;else{ans=m;hi=m-1;}}
  const i=Math.min(ans,arr.length-1);
  return Math.round(i/Math.max(1,arr.length-1)*1000);
}

/* ================= 机箱示意图 ================= */
/* ================= 3D 机箱（Three.js） ================= */
const C3={ready:false,renderer:null,scene:null,camera:null,root:null,parts:{},fans:[],raf:0,drag:false,px:0,py:0,rotY:0.98,rotX:-0.10,spin:false};
function c3mat(color,metal,rough){return new THREE.MeshStandardMaterial({color:color,metalness:metal==null?.55:metal,roughness:rough==null?.5:rough,envMapIntensity:1.25});}
function c3box(w,h,d,x,y,z,color,edgeColor,metal,rough){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),c3mat(color,metal,rough));
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  const eg=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),
    new THREE.LineBasicMaterial({color:edgeColor||0xffa54d,transparent:true,opacity:0.9}));
  eg.position.copy(m.position);eg.visible=false;
  C3.root.add(m);C3.root.add(eg);
  return {m:m,e:eg};
}

function c3set(o,on,glow){
  if(!o)return;
  o.m.material.emissive.set(on?(glow===false?0x000000:0xff8a20):0x000000);
  o.m.material.emissiveIntensity=0;
  o.e.visible=!!on;if(o.e.material)o.e.material.opacity=on?0.22:0;
}

/* 工作台画面：true = 平面示意图（SVG），false = 3D 机箱。
   3D 还在，只是暂时不用；想切回来把这里改成 false 就行。 */
const BENCH_FLAT=true;
let _case3d=null,_case3dTried=false;
/* 3D 机箱暂时停用：工作台继续用原来的 2D 机箱图，等 3D 模型结构改对再打开 */
const CASE3D_ENABLED=false;
/* ---------- 实拍台面图：按「年代/档位」+ 已装件切图 ---------- */
function benchFam(mb){
  if(!mb)return null;
  if(mb.ff==='ITX'){
    /* ITX 按接口选套图。LGA1851 复用 Z790 图，仅把丝印换成 LGA1851。 */
    const so=mb.s||'';
    if(so==='AM4')return 'itx_am4';
    if(so==='AM5')return 'itx_am5';
    if(so==='LGA1200')return 'itx_b560';
    if(so==='LGA1700')return 'itx_z790';
    if(so==='LGA1851')return 'itx_z890';
    if(['LGA1155','LGA1150','LGA1151','LGA1151V2','LGA1156','LGA1366'].indexOf(so)>=0)return 'itx_115x';
    if(['LGA2011-3','LGA2066','LGA3647','LGA4677'].indexOf(so)>=0)return 'itx_x99';
    return 'itx';
  }
  const so=mb.s||'';
  if(so==='AM3+'||so==='AM3')return (mb.dimm&&mb.dimm<=2)?'am3_2':'am3';
  if(['LGA1155','LGA1150','LGA1151','LGA1151V2','LGA1156','LGA1366'].indexOf(so)>=0)return (mb.dimm&&mb.dimm<=2)?'115x_2':'115x';
  if(so==='AM4')return 'b550m';
  if(so==='AM5')return 'x870';
  if(['LGA2011-3','LGA2066','LGA3647','LGA4677'].indexOf(so)>=0)return 'x99';
  if(['TR4','TRX40','sTRX4','sTR5','SP3','SP5'].indexOf(so)>=0)return 'trx40';
  if(so==='LGA1200')return 'b760';
  if(so==='LGA1700'||so==='LGA1851')return (mb.p!=null&&mb.p>=1200)?'z790':'b760';
  return 'b760';
}
window.PASTE_IMG={"115x": __IMG24, "am3": __IMG25, "b760": __IMG26, "b550m": __IMG27, "z790": __IMG28, "x870": __IMG29, "x99": __IMG30, "trx40": __IMG31};
/* ===== ITX 套图（2026-11-04 生成）：mini-ITX 主板俯视 + ITX 机箱正面 ===== */
window.BENCH_IMG["itx"]={empty:__IMG32,cpu:__IMG33,ram1:__IMG34,ram2:__IMG35};
window.PASTE_IMG["itx"]=__IMG36;
window.CASE_ITX=__IMG37;
/* ===== 2026-11-04 四套 ITX 主板实拍（900×900，构图已统一） ===== */
(function(){
  const S={"itx_am4":{"empty":__IMG38,"cpu":__IMG39,"air":__IMG40,"ram1":__IMG41,"ram2":__IMG42},"itx_115x":{"empty":__IMG43,"cpu":__IMG44,"air":__IMG45,"ram1":__IMG46,"ram2":__IMG47},"itx_am5":{"empty":__IMG48,"cpu":__IMG49,"air":__IMG50,"ram1":__IMG51,"ram2":__IMG52},"itx_x99":{"empty":__IMG53,"cpu":__IMG54,"air":__IMG55,"ram1":__IMG56,"ram2":__IMG57}};
  for(const k in S){window.BENCH_IMG[k]=S[k];}
  const P={"itx_am4":__IMG58,"itx_115x":__IMG59,"itx_am5":__IMG60,"itx_x99":__IMG61};
  for(const k in P){window.PASTE_IMG[k]=P[k];}
})();
/* ===== 2026-11-04 ITX 新增：B560 / Z790 / Z890(1851) ===== */
(function(){
  const B560={"empty":__IMG62,"cpu":__IMG63,"air":__IMG64,"ram1":__IMG65,"ram2":__IMG66};
  const Z790={"empty":__IMG67,"cpu":__IMG68,"air":__IMG69,"ram1":__IMG70,"ram2":__IMG71};
  const Z890=Object.assign({},Z790,{cpu:__IMG72,paste:__IMG73});
  window.BENCH_IMG.itx_b560=B560; window.BENCH_IMG.itx_z790=Z790; window.BENCH_IMG.itx_z890=Z890;
  window.PASTE_IMG.itx_b560=__IMG74;
  window.PASTE_IMG.itx_z790=__IMG75;
  window.PASTE_IMG.itx_z890=__IMG73;
})();
function benchPhoto(){
  try{
    const b=build,mb=part('mb');if(!mb)return null;
    const fam=benchFam(mb);const set=(window.BENCH_IMG||{})[fam];if(!set)return null;
    const n=build.rams.filter(Boolean).length;
    if(b.case){
      const cs=b.case.part,cool=b.cooler&&b.cooler.part;
      const price=(cs&&cs.p)||0,liq=!!(cool&&cool.rad>0);
      const tier=(liq||price>=700)?'high':(price<=250?'cheap':'mid');
      const _itx=!!(cs&&cs.ff&&cs.ff.indexOf('ITX')>=0);
      const src=(_itx&&window.CASE_ITX)?window.CASE_ITX:((window.CASE_FRONT||{})[tier]||set.front);
      return src?{src,tag:''}:null;   /* 不再打档位标签 */
    }
    /* CPU 装好、散热还没压：涂之前显示干净 CPU，涂完显示带硅脂的实拍图。
       以前这里是反的：没涂时显示带硅脂的图，涂完反而跳回普通主板图。 */
    if(part('cpu')&&!b.cooler){
      /* 115x_2 这类「双内存槽」变体没有单独的涂硅脂图，回退到同芯片组基础图。
         以前只查 fam 精确键，2 槽板永远取不到 PASTE_IMG，涂完还是显示干净 CPU。 */
      const _pi=(window.PASTE_IMG||{})[fam]||(window.PASTE_IMG||{})[String(fam).replace(/_\d+$/,'')];
      if(b.paste){
        const src=_pi||set.cpu;
        return src?{src,tag:'已涂硅脂'}:null;
      }
      if(set.cpu)return {src:set.cpu,tag:'待涂硅脂'};
    }
    /* 装了内存就出一张「插好内存」的工作台照片：
       套条一次占两根槽，n=2 会自己落到 ram2 那张图（插好两条的样子）。
       以前这个分支排在散热后面，装了散热就永远看不到内存照片。 */
    if(b.cpu&&build.rams.filter(Boolean).length){
      const src=n>=4?(set.ram4||set.ram2||set.ram1):(n>=2?(set.ram2||set.ram1||set.ram4):(set.ram1||set.ram2||set.ram4));
      if(src)return {src,tag:'工作区'};
    }
    if(b.cooler){
      const liq=(b.cooler.part.rad||0)>0;
      const src=liq?(set.aio||set.air||set.cool):(set.air||set.cool||set.aio);
      return src?{src,tag:'工作区'}:null;
    }
    if(b.cpu){
      const src=n>=4?(set.ram4||set.ram2||set.ram1):(n>=2?(set.ram2||set.ram1||set.ram4):(n>=1?(set.ram1||set.ram2||set.ram4):(set.cpu||set.empty)));
      return src?{src,tag:'工作区'}:null;
    }
    return set.empty?{src:set.empty,tag:'工作区'}:null;
  }catch(e){return null;}
}
function renderBenchPhoto(host){
  const ph=benchPhoto();
  if(!ph)return false;
  /* 同一张图不再重建 DOM：renderAll 每跑一次就重写 innerHTML，
     <img> 会重播淡入动画——装完机箱后在手机上看起来就是整块台面在「抽搐」。
     图没变就只更新右下角的小标签。 */
  if(host.dataset.bpSig===ph.src&&host.querySelector('.benchPhotoBox img')){
    const tg=host.querySelector('.bpTag');
    if(tg&&tg.textContent!==ph.tag)tg.textContent=ph.tag;
    return true;
  }
  if(_case3d){try{_case3d.destroy();}catch(e){}_case3d=null;}
  host.classList.remove('flat');host.classList.add('photo');
  host.innerHTML=`<div class="benchPhotoBox"><img src="${ph.src}" alt="">`+(ph.tag?`<span class="bpTag">${ph.tag}</span>`:'')+`</div>`;
  host.dataset.bpSig=ph.src;
  try{
    const im=host.querySelector('.benchPhotoBox img');
    /* 散热器已经压上去了就别再给「点这里涂硅脂」的入口：
       客户抬来的整机本来就是装好的，点一下还能涂硅脂，等于回到拆机。
       散热器装着的时候要涂硅脂，必须先拆。 */
    if(im&&typeof part==='function'&&part('cpu')&&typeof build!=='undefined'&&!build.paste&&!build.cooler){
      im.style.cursor='pointer';
      im.title='点这里涂硅脂';
      im.onclick=()=>{try{if(typeof applyPaste==='function')applyPaste();}catch(e){}};
    }
  }catch(e){}
  return true;
}
let _stageView=null,_stageViewT=0;
function renderCaseArt(){
  const host=document.getElementById('art2d');
  if(!host)return;
  /* 刚装完电源/硬盘：强制显示机箱视图（空机箱），别跳回主板俯视图 */
  if(_stageView==='case'){delete host.dataset.bpSig;renderCaseArtSVG();return;}
  if(renderBenchPhoto(host))return;
  delete host.dataset.bpSig;
  if(!build.case){
    if(_case3d){try{_case3d.destroy();}catch(e){}_case3d=null;_case3dTried=false;}
    renderCaseArtSVG();return;
  }
  host.classList.remove('flat');
  if(CASE3D_ENABLED&&!_case3d&&!_case3dTried&&window.Case3D){
    try{_case3d=window.Case3D.mount(host,{maxDpr:window.innerWidth<=1040?1.5:2,recenterMs:800,accent:0xffa54d});}
    catch(e){_case3d=null;try{console.warn('Case3D mount failed',e);}catch(_){}}
    _case3dTried=!_case3d;
  }
  if(_case3d){try{_case3d.sync(build);_case3d.setPowered(poweredOn());return;}catch(e){try{_case3d.destroy();}catch(_){}_case3d=null;_case3dTried=true;}}
  renderCaseArtSVG();
}
/* 一台机器算不算「点亮」：机箱、主板、CPU、散热、电源都在，且没有坏件 */
function poweredOn(){
  try{
    return !!(part('case')&&part('mb')&&part('cpu')&&part('cooler')&&part('psu'));
  }catch(e){return false;}
}
function renderCaseArtSVG(){
  {const a=document.getElementById('art2d');
   if(a){a.classList.add('flat');
     const on=poweredOn();
     a.classList.toggle('spin',on);
   }}
  const mb=part('mb'),cpu=part('cpu'),gp=part('gpu1'),gp2=part('gpu2'),ps=part('psu'),cl=part('cooler'),cs=part('case');
  const ramN=build.rams.filter(Boolean).length,m2N=build.m2.filter(Boolean).length,sataN=build.sata.filter(Boolean).length;
  const lit='rgba(255,176,84,.92)',litFill='rgba(255,150,60,.18)',litLine='rgba(255,176,84,.55)';
  const dim='rgba(255,235,210,.26)',dimFill='rgba(255,235,210,.06)';
  const rect=(x,y,w,h,r,f,s,cls)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" stroke="${s}" stroke-width="1"${cls?` class="${cls}"`:''}/>`;
  if(!cs){
    document.getElementById('art2d').innerHTML=`<svg viewBox="0 0 380 260" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="26" width="320" height="208" rx="18" fill="rgba(255,235,210,.02)"
        stroke="rgba(255,220,180,.22)" stroke-width="1.4" stroke-dasharray="7 7"/>
      <text x="190" y="122" fill="rgba(255,235,210,.55)" font-size="13" text-anchor="middle">还没有机箱</text>
      <text x="190" y="144" fill="rgba(255,235,210,.28)" font-size="9.5" text-anchor="middle">先装一个机箱，才知道能塞进什么</text>
    </svg>`;
    return;
  }
  let s=`<svg viewBox="0 0 380 260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="caseG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#312820"/><stop offset="1" stop-color="#191512"/></linearGradient>
    <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(255,240,220,.09)"/><stop offset=".5" stop-color="rgba(255,240,220,.015)"/>
      <stop offset="1" stop-color="rgba(255,240,220,.05)"/></linearGradient>
    <linearGradient id="mbG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2f2822"/><stop offset="1" stop-color="#211c17"/></linearGradient>
  </defs>
  <rect x="8" y="8" width="364" height="244" rx="18" fill="url(#caseG)" stroke="rgba(255,220,180,.30)" stroke-width="1.3"/>
  <rect x="16" y="16" width="348" height="228" rx="13" fill="url(#glassG)" stroke="rgba(255,220,180,.06)"/>
  <path d="M24 26 L150 26 L60 232 L24 232 Z" fill="rgba(255,240,220,.03)"/>`;
  // 前面板风扇
  for(let i=0;i<3;i++){
    const cy=70+i*62, on=!!cs;
    s+=`<circle cx="46" cy="${cy}" r="21" fill="${on?litFill:dimFill}" stroke="${on?litLine:dim}" stroke-width="1.3"/>
        <g class="${on?'fan':''}"><circle cx="46" cy="${cy}" r="15" fill="none" stroke="${on?'rgba(255,196,120,.5)':dim}" stroke-width="1" stroke-dasharray="3 5"/></g>
        <circle cx="46" cy="${cy}" r="3.4" fill="${on?lit:dim}"/>`;
  }
  // 主板
  s+=`<g class="${mb?'lit':''}">${rect(96,32,196,142,7, mb?'url(#mbG)':dimFill, mb?litLine:dim)}
    <text x="188" y="170" fill="${mb?'rgba(255,207,143,.85)':'rgba(255,235,210,.30)'}" font-size="8" text-anchor="middle">${mb?(mb.s||'主板')+(mb.dimm?' · '+mb.dimm+' 槽':''):'主板'}</text></g>`;
  // CPU + 散热
  const cx=118,cy=54,cw=46,ch=44;
  s+=`<g class="${cpu?'lit':''}">${rect(cx,cy,cw,ch,5, cpu?litFill:dimFill, cpu?litLine:dim)}</g>`;
  if(cl){
    if(cl.rad>0){
      s+=`<g class="lit">${rect(104,26,180,13,4,'rgba(255,150,60,.16)',litLine)}
        <text x="194" y="36" fill="#ffcf8f" font-size="8" text-anchor="middle">${cl.rad}mm 冷排</text></g>`;
    }else{
      s+=`<g class="lit">${rect(cx-8,cy-8,cw+16,ch+16,5,'rgba(255,150,60,.14)',litLine)}
        <g class="fan"><circle cx="${cx+cw/2}" cy="${cy+ch/2-5}" r="9" fill="none"
          stroke="rgba(255,207,143,.55)" stroke-width="1.4" stroke-dasharray="3 4"/></g>
        <circle cx="${cx+cw/2}" cy="${cy+ch/2-5}" r="2.2" fill="rgba(255,207,143,.6)"/>
        <text x="${cx+cw/2}" y="${cy+ch/2+13}" fill="#ffcf8f" font-size="7.5" text-anchor="middle">风冷</text></g>`;
    }
  }
  // 内存槽：按主板实际槽位数画（没主板时默认 4 条）
  const dimmN=Math.max(2,Math.min(8,(mb&&mb.dimm)||4));
  for(let i=0;i<dimmN;i++){
    const on=i<ramN;
    s+=`<g class="${on?'lit':''}">${rect(178+i*13,46,8,58,2, on?litFill:dimFill, on?litLine:dim)}</g>`;
  }
  // 显卡
  const glen=gp?Math.max(96,Math.min(180,(gp.len||240)*0.55)):150;
  const shortName=n=>n.replace(/^(NVIDIA GeForce |NVIDIA |AMD Radeon |AMD |Intel )/,'');
  if(gp){
    s+=`<g class="lit">${rect(110,120,glen,26,5,'rgba(255,150,60,.16)',litLine)}
      <g class="fan slow"><circle cx="${110+glen-16}" cy="133" r="7" fill="none"
        stroke="${lit}" stroke-width="1.5" stroke-dasharray="2.5 3.5"/></g>
      <circle cx="${110+glen-16}" cy="133" r="1.8" fill="${lit}"/>
      <text x="${110+glen/2-8}" y="140" fill="#ffcf8f" font-size="8" text-anchor="middle">${shortName(gp.n).length>13?shortName(gp.n).slice(0,13)+'…':shortName(gp.n)}</text></g>`;
    if(gp2)s+=`<g class="lit">${rect(110,150,glen,20,5,'rgba(255,150,60,.12)',litLine)}</g>`;
  }else{
    s+=rect(110,120,150,26,5,dimFill,dim);
  }
  // 电源仓
  s+=`<g class="${ps?'lit':''}">${rect(104,192,150,40,6, ps?'rgba(255,150,60,.14)':dimFill, ps?litLine:dim)}
    ${ps?`<text x="179" y="216" fill="#ffcf8f" font-size="8" text-anchor="middle">${ps.w}W</text>`:''}</g>`;
  // 硬盘位
  for(let i=0;i<3;i++){
    const on=i<sataN;
    s+=`<g class="${on?'lit':''}">${rect(268,190+i*14,80,11,3, on?litFill:dimFill, on?litLine:dim)}</g>`;
  }
  // M.2
  for(let i=0;i<Math.min(2,m2N);i++){
    s+=`<g class="lit">${rect(178,112,72,5,2,litFill,litLine)}</g>`;
  }
  s+=`<text x="196" y="249" fill="rgba(255,235,210,.34)" font-size="7.5" text-anchor="middle">${cs?cs.n+' · '+cs.ff.join('/'):'还没有机箱'}</text>`;
  s+='</svg>';
  document.getElementById('art2d').innerHTML=s;
}


/* ================= 渲染 ================= */
const CATS=[['cpu','CPU'],['mb','主板'],['ram','内存'],['gpu','显卡'],['cooler','散热'],['psu','电源'],['case','机箱'],['disk','存储']];
const CNAME={cpu:'CPU',mb:'主板',ram:'内存',gpu:'显卡',cooler:'散热',psu:'电源',case:'机箱',disk:'存储'};
function slotCat(k){
  if(k==='gpu1'||k==='gpu2')return 'gpu';
  if(k.startsWith('ram'))return 'ram';
  if(k.startsWith('m2')||k.startsWith('sata'))return 'disk';
  return CNAME[k]?k:null;
}
/* 带淡出的关闭：加 .off 播完动画再真正隐藏 */
function closeMask(el){
  if(!el)return;
  if(el.__closing)return;
  el.__closing=true;
  el.classList.add('off');
  setTimeout(()=>{el.classList.remove('on','off');el.__closing=false;
    try{setTimeout(()=>coachRefresh(),60);}catch(e){} },240);
}
function modal(t,b,ok){
  try{if(typeof coachHide==='function')coachHide();}catch(e){}
  const yesEl=document.getElementById('mYes'),noEl=document.getElementById('mNo');
  if(yesEl){yesEl.textContent='确认';yesEl.disabled=false;}
  if(noEl)noEl.style.display='';
  document.getElementById('mTitle').textContent=t;
  document.getElementById('mBody').innerHTML=b;
  const _m=document.getElementById('mask');
  _m.classList.toggle('buyConfirm',t==='确认购买');
  _m.classList.add('on');
  const _yes=document.getElementById('mYes');
  let _yesDone=false;
  _yes.onclick=()=>{
    if(_yesDone)return;
    _yesDone=true;_yes.disabled=true;   /* 防连点：一次确认只执行一次回调 */
    try{closeMask(document.getElementById('mask'));}catch(e){}
    if(ok){try{ok();}catch(e){console.error(e);}}
  };
  document.getElementById('mNo').onclick=()=>closeMask(document.getElementById('mask'));
}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('on'),1800);}
let _benchPrev=null,_benchNew={};
/* 工单门槛文案：只需要 CPU 分的办公单就别硬写 3DMark（0 = 这一项没要求） */
/* 一张单子的「全部」硬性要求（顶部悬挂条、工单卡、检查区共用） */
/* 判定档位的叫法：最低 / 推荐 / 4K，和软件库里的三档一一对应 */
function lvlName(j){return j&&j.level==='k'?'4K 配置':(j&&j.level==='r'?'推荐配置':'最低配置');}
function targetBits(j){
  const t=(j&&j.target)||{},out=[];
  if(!j)return out;
  /* 任务档位：一眼看出这单是旗舰单还是性价比单 */
  if(!j.repair&&!j.assembly){
    if(j.grade==='high')out.push('旗舰单');
    else if(j.grade==='mid')out.push('性价比单');
    else if(j.grade==='low')out.push('低价单');
  }
  if(j.repair){
    out.push('维修');
    (j.repair.clues||[]).slice(0,2).forEach(c=>out.push('现象 '+c));
  }else if(j.assembly){
    out.push('装机就行');
  }else if(j.hideScore){
    out.push(lvlName(j));
  }else{
    if(t.igpText)out.push(t.igpText);
    else if(t.ts>0)out.push('3DMark '+t.ts.toLocaleString());
    if(t.cs>0)out.push('CB '+t.cs.toLocaleString());
  }
  if(t.ram&&!j.assembly)out.push('内存 '+t.ram+'G');
  if(j.minMhz)out.push('频率 '+j.minMhz+'MHz');
  if(j.newOnly)out.push('只要全新件');
  else if(j.newFor&&j.newFor.length)out.push('机箱电源散热全新');
  if(j.gpuPref)out.push(j.gpuPref==='amd'?'A 卡':'N 卡');
  if(!j.repair){
    if(j.cat==='工作机'&&j.tier===0)out.push('内存 128G');
    if(j.cat==='工作机'&&j.tier===1)out.push('双卡');
    if(j.cat==='工作机'&&j.tier===2)out.push('HDD 4 块');
    if(j.cat==='游戏机'&&j.tier===2)out.push('水冷');
  }
  if(j.carry)out.push('客户旧机');
  return out;
}
function fmtTarget(t){
  const bits=[];
  if(t&&t.ts>0)bits.push('3DMark ≥ '+t.ts.toLocaleString());
  if(t&&t.cs>0)bits.push('Cinebench ≥ '+t.cs.toLocaleString());
  if(t&&t.ram)bits.push('内存 ≥ '+t.ram+'G');
  return bits.join('　');
}/* 槽位里只写型号太干了：装上去之后顺手把关键参数带出来（插槽/功耗/限长这些） */
function slotSpec(cat,p){
  if(!p)return '';
  if(cat==='cpu')return [p.s, p.t+'W', '多核 '+p.cs, p.ig?'核显':'无核显'].join(' · ');
  if(cat==='mb')return [p.s, p.m+'×'+p.dimm, p.ff, 'SATA '+p.sata].join(' · ');
  if(cat==='ram')return [p.m+(p.mhz?'-'+p.mhz:''), p.cap+'G'].join(' · ');
  if(cat==='gpu')return [p.len+'mm', p.tbp+'W', 'TS '+p.ts].join(' · ');
  if(cat==='cooler')return [p.cap+'W', p.rad?('冷排 '+p.rad):('高 '+p.h+'mm')].join(' · ');
  if(cat==='psu')return '额定 '+p.w+'W';
  if(cat==='case'){
    const ff=Array.isArray(p.ff)?p.ff.join('/'):String(p.ff||'');
    return [ff, '卡≤'+p.mg, '盘位 '+p.bay].join(' · ');
  }
  if(cat==='disk')return [(p.kind==='m2'?'NVMe':(p.kind==='hdd'?'机械':'SATA')), (p.cap>=1000?(p.cap/1000)+'T':p.cap+'G')].join(' · ');
  return '';
}
function slotHTML(k,label,p,opt={}){
  const filled=!!p,dis=opt.dis?'dis':'',locked=opt.locked?'locked':'';
  const own=opt.own?'own':'';
  const just=_benchNew[k]&&(Date.now()-_benchNew[k]<900)?' just':'';
  const cat=slotCat(k);
  /* 空槽位直接给入口：去仓库翻 / 去商店买。
     锁住的槽位（前置件还没装）只给「商店」——买件随时可以，装才讲顺序，
     免得点「仓库」进去又是一个装不上的死胡同。 */
  const canBuy=!filled&&!dis&&!!cat;
  const canGoInv=canBuy&&!locked;
  const picks=canBuy?`<span class="picks">
      ${canGoInv?`<button type="button" class="pick" data-go="inv" data-cat="${cat}">仓库</button>`:''}
      <button type="button" class="pick" data-go="shop" data-cat="${cat}">商店</button></span>`:'';
  const _pic=filled?pict(p):'';
  const inner=filled?`${_pic?`<img class="slotPic" alt="" src="${_pic}">`:''}<span class="nm">${p.n}</span><span class="rm" data-rm="${k}">✕</span>`
    :(canBuy?picks:(opt.plus&&!opt.locked?`<span class="plus">＋</span>`:`<span class="ico">${opt.icon||''}</span>`));
  const spec=filled?slotSpec(cat,p):'';
  return `<div class="slot ${filled?'filled':''} ${own} ${dis} ${locked}${just}" data-k="${k}">
    <div class="k">${label}</div><div class="v">${inner}</div>${spec?`<div class="s">${spec}</div>`:''}</div>`;
}
function renderBenchDOM(){
  const mb=part('mb'),cs=part('case');
  /* 记住哪些槽位是从空变成有件，给它们一次短暂高亮 */
  noteBenchChanges();
  const now=Date.now();
  Object.keys(_benchNew).forEach(k=>{if(now-_benchNew[k]>1200)delete _benchNew[k];});
  const ownOf=k=>build[k]&&build[k].shop==='own';
  document.getElementById('rowTop').innerHTML=
    slotHTML('case','机箱',part('case'),{icon:icon('case'),own:ownOf('case')})+
    slotHTML('psu','电源',part('psu'),{icon:icon('psu'),locked:!cs,own:ownOf('psu')});
  document.getElementById('caseInfo').innerHTML=cs
    ?`机箱：<b>${cs.n}</b><br>支持主板 <b>${cs.ff.join(' / ')}</b>　显卡限长 <b>${cs.mg}mm</b>　散热限高 <b>${cs.mc}mm</b><br>
      冷排支持 <b>${cs.rad?cs.rad+'mm':'无'}</b>　硬盘位 <b>${cs.bay}</b> 个`
    :`<span class="warn">先装个机箱，才知道能装多大的主板、多长的显卡、多高的散热器。</span>`;
  try{
    const gItems=[];
    const addG=(label,p)=>{if(p)gItems.push({label,p});};
    addG('机箱',part('case'));addG('主板',part('mb'));addG('CPU',part('cpu'));addG('散热',part('cooler'));
    addG('显卡',part('gpu1'));addG('显卡 2',part('gpu2'));addG('电源',part('psu'));
    build.rams.forEach((r,i)=>{if(r)addG('内存 '+(i+1),r.part);});
    build.m2.forEach((r,i)=>{if(r)addG('M.2 '+(i+1),r.part);});
    build.sata.forEach((r,i)=>{if(r)addG('SATA '+(i+1),r.part);});
    const box=document.getElementById('partGallery');
    if(box){
      box.innerHTML=gItems.length?gItems.map(it=>{
        const ph=pict(it.p);
        const catMap={'机箱':'case','主板':'mb','CPU':'cpu','散热':'cooler','显卡':'gpu','显卡 2':'gpu','电源':'psu','内存':'ram','M.2':'disk','SATA':'disk'};
        const catKey=Object.keys(catMap).find(k=>it.label.startsWith(k))||'case';
        const isCpu=it.label==='CPU';
        const tagTxt=isCpu&&it.p.s?it.p.s:it.label;
        return `<div class="pgCard">${ph?`<img alt="" src="${ph}">`:`<span class="pgIcon">${icon(catMap[catKey])}</span>`}
          <div class="pgName">${it.p.n}</div><div class="pgTag${isCpu?' cpuPlate':''}">${tagTxt}</div></div>`;
      }).join(''):`<div class="pgEmpty">装进去的部件会在这里以实拍图展示</div>`;
    }
  }catch(e){}
  try{
    const pr=document.getElementById('pasteRow');
    if(pr){
      const need=!!part('cpu')&&!build.paste;
      pr.innerHTML=need?`<div class="pasteHint">CPU 顶盖还没涂硅脂，散热器压上去等于白装</div>
        <button type="button" class="pasteBtn" id="btnPaste">涂硅脂</button>`:'';
      const pb=document.getElementById('btnPaste');
      if(pb)pb.onclick=applyPaste;
    }
  }catch(e){}
  document.getElementById('mbInfo').innerHTML=mb
    ?`插槽 <b>${mb.s}</b>　内存 <b>${mb.dimm}×${mb.m}</b>（上限 ${mb.max}G）<br>
      M.2 <b>${mb.m2}</b> 个${mb.m2?`（${mb.m2spec}）`:'<span class="warn">（无 M.2 插槽）</span>'}　SATA <b>${mb.sata}</b> 个　PCIe x16 <b>${mb.pcie}</b> 条`
    :`<span class="warn">装好主板后，这里会显示 CPU 插槽、内存插槽、M.2 与 SATA 数量。</span>`;
  document.getElementById('rowMb').innerHTML=
    slotHTML('mb','主板',part('mb'),{icon:icon('mb'),locked:!cs,own:ownOf('mb')})+
    slotHTML('cpu','CPU',part('cpu'),{icon:icon('cpu'),locked:!mb,own:ownOf('cpu')})+
    slotHTML('cooler','散热器',part('cooler'),{icon:icon('cooler'),locked:!part('cpu'),own:ownOf('cooler')})+
    slotHTML('gpu1','显卡 1',part('gpu1'),{icon:icon('gpu'),locked:!mb,own:ownOf('gpu1')})+
    slotHTML('gpu2','显卡 2',part('gpu2'),{icon:icon('gpu'),locked:!mb||!part('gpu1'),own:ownOf('gpu2')});
  const dimm=mb?mb.dimm:4,ramSlots=Math.max(4,Math.min(8,dimm));let ramHTML='';
  for(let i=0;i<ramSlots;i++){const use=i<dimm;
    ramHTML+=slotHTML('ram'+i,`内存槽 ${i+1}`,ramPart(i),{plus:use&&!!mb,dis:!use,icon:icon('ram'),locked:!mb,own:build.rams[i]&&build.rams[i].shop==='own'});}
  document.getElementById('rowRam').innerHTML=ramHTML;
  const m2n=mb?mb.m2:0,m2Slots=Math.max(4,Math.min(8,m2n||4));let m2HTML='';
  for(let i=0;i<m2Slots;i++){const use=i<m2n;
    m2HTML+=slotHTML('m2'+i,`M.2 槽 ${i+1}`,m2Part(i),{plus:use,dis:!use,icon:icon('m2'),locked:!mb,own:build.m2[i]&&build.m2[i].shop==='own'});}
  document.getElementById('rowM2').innerHTML=m2HTML;
  const satan=mb?Math.min(mb.sata,6):0;let sHTML='';
  for(let i=0;i<6;i++){const use=i<satan&&i<(cs?cs.bay:6);
    sHTML+=slotHTML('sata'+i,`SATA 位 ${i+1}`,sataPart(i),{plus:use,dis:!use,icon:icon('disk'),locked:!mb,own:build.sata[i]&&build.sata[i].shop==='own'});}
  document.getElementById('rowSata').innerHTML=sHTML;
  document.querySelectorAll('.slot').forEach(s=>{
    s.onclick=e=>{
      /* 空槽位上的「仓库 / 商店」小按钮 */
      const go=e.target.closest&&e.target.closest('[data-go]');
      if(go){
        e.stopPropagation();
        if(!state.activeId){toast('先接受一个工单');return;}
        const cat=go.dataset.cat||slotCat(s.dataset.k)||curCat;
        const toShop=go.dataset.go==='shop';
        state.panel=toShop?'shop':'inv';curCat=cat;
        filt=defaultFilt();
        forceDocsView();save();renderAll();scrollLeftTop();
        toast((toShop?'商店':'仓库')+' · '+(CNAME[cat]||cat));
        return;
      }
      if(e.target.classList.contains('rm')){e.stopPropagation();removeSlot(s.dataset.k);save();renderAll();return;}
      const k=s.dataset.k;
      if(slotHas(k)){removeSlot(k);save();renderAll();return;}
      if(!state.activeId){toast('先接受一个工单');return;}
      if(s.classList.contains('locked')){toast('先把前置部件装上（主板→CPU→内存→散热→显卡→电源→机箱）');return;}
      if(s.classList.contains('dis')){toast('这块主板/机箱没有这个位置');return;}
      const cat=slotCat(k);
      if(!cat){toast('这个槽位暂时不能装');return;}
      state.panel='inv';curCat=cat;
      filt=defaultFilt();
      save();renderAll();scrollLeftTop();toast('仓库 · '+CNAME[cat]);
    };
  });
  renderCaseArt();
}
function noteBenchChanges(){
  const keys=['case','psu','mb','cpu','cooler','gpu1','gpu2'];
  for(let i=0;i<Math.max(8,build.rams.length);i++)keys.push('ram'+i);
  for(let i=0;i<Math.max(8,build.m2.length);i++)keys.push('m2'+i);
  for(let i=0;i<Math.max(6,build.sata.length);i++)keys.push('sata'+i);
  const cur={};
  keys.forEach(k=>{cur[k]=slotHas(k);});
  if(_benchPrev){
    keys.forEach(k=>{if(cur[k]&&!_benchPrev[k])_benchNew[k]=Date.now();});
  }
  _benchPrev=cur;
}
function slotHas(k){
  if(k.startsWith('ram'))return !!build.rams[+k.slice(3)];
  if(k.startsWith('m2'))return !!build.m2[+k.slice(2)];
  if(k.startsWith('sata'))return !!build.sata[+k.slice(4)];
  return !!build[k];
}
function backToInventory(cat,st){ if(!st)return; addInv({cat,part:st.part,paid:st.paid,shop:st.shop,owner:st.owner||null}); }
function removeSlot(k){
  if(k.startsWith('ram')){const i=+k.slice(3),s=build.rams[i];if(!s)return;
    if(s.kitId){
      let paid=0;
      for(let j=0;j<build.rams.length;j++){const c=build.rams[j];
        if(c&&c.kitId===s.kitId){paid+=c.paid||0;build.rams[j]=null;}}
      build.rams[i]=null;
      backToInventory('ram',{part:s.part,paid,shop:s.shop,owner:s.owner||null});return;
    }
    backToInventory('ram',s);build.rams[i]=null;return;}
  if(k.startsWith('m2')){const i=+k.slice(2),s=build.m2[i];backToInventory('disk',s);build.m2[i]=null;return;}
  if(k.startsWith('sata')){const i=+k.slice(4),s=build.sata[i];backToInventory('disk',s);build.sata[i]=null;return;}
  const cur=build[k];
  if(cur)backToInventory(catOf.get(cur.part)||slotCat(k),cur);
  build[k]=null;
}
let _cashShown=null,_cashRAF=0;
function setCash(v){
  const el=document.getElementById('cashTxt');if(!el)return;
  if(_cashShown==null||typeof requestAnimationFrame!=='function'||_cashShown===v){
    _cashShown=v;el.textContent=money(v);return;
  }
  const from=_cashShown,to=v,t0=performance.now();
  if(_cashRAF)cancelAnimationFrame(_cashRAF);
  try{
    const box=el.closest('.cash')||el.parentElement;
    if(box&&Math.abs(to-from)>=1){
      box.classList.remove('cashPop','cashUp','cashDown');
      void box.offsetWidth;
      box.classList.add('cashPop');
      box.classList.add(to>from?'cashUp':'cashDown');
      setTimeout(()=>{try{box.classList.remove('cashPop','cashUp','cashDown');}catch(e){}},680);
    }
  }catch(e){}
  const step=t=>{
    const k=Math.min(1,(t-t0)/420),e=1-Math.pow(1-k,3);
    el.textContent=money(from+(to-from)*e);
    if(k<1)_cashRAF=requestAnimationFrame(step);else{_cashShown=to;el.textContent=money(to);}
  };
  _cashRAF=requestAnimationFrame(step);
}
let _lastDaySeen=null;
function renderHeader(){
  const _d=document.getElementById('dateTxt'),_dd=document.getElementById('dayTxt');
  _d.textContent=state.date;
  _dd.textContent=state.day;
  if(_lastDaySeen!==null&&_lastDaySeen!==state.day){
    animPulse(_d,'dateFlip',760);animPulse(_dd,'dateFlip',760);
  }
  _lastDaySeen=state.day;
  setCash(state.cash);

  document.getElementById('progTxt').textContent=closedCount()+'/'+(state.dayTotal||state.jobs.length);
  try{
    const rt=document.getElementById('repTxt');
    if(rt){
      rt.style.display=repUnlocked()?'':'none';
      const s=repStars();
      rt.innerHTML='口碑 <b style="color:'+(s>=4?'#7de0a8':(s>=3?'#ffd27a':'#ff9c92'))+'">'+'★'.repeat(s)+'☆'.repeat(5-s)+'</b>';
    }
  }catch(e){}
  /* 允许带着没做完的单打烊：按钮不再因为有待办而禁用 */
  document.getElementById('btnClose').disabled=false;
  document.getElementById('btnToJobs').style.display=state.panel==='jobs'?'none':'';
  try{
    const lb=document.getElementById('btnLife');
    if(lb){
      const L=state.life||{};const c=LIFE_CARS.find(x=>x.id===L.car),h=LIFE_HOUSES.find(x=>x.id===L.house);
      lb.textContent=(c&&c.id!=='bike')||(h&&h.id!=='rent')?'生活 ●':'生活';
    }
  }catch(e){}
  try{syncHd();}catch(e){}
}
function renderMobileBar(){
  const bar=document.getElementById('mobileBar');
  if(!bar)return;
  if(!isMobile()){if(bar.innerHTML)bar.innerHTML='';return;}
  const j=state.activeId?job():null;
  if(!j){bar.innerHTML='';return;}
  const cost=totalCost(),budget=j.partBudget,t=j.target;
  const fails=checks().filter(c=>!c.ok&&!c.soft);
  const lv=j.level==='m'?'最低':j.level==='k'?'4K':'推荐';
  const pct=Math.min(100,Math.round(cost/Math.max(budget,1)*100));
  bar.innerHTML=`<div class="mbTop">
      <div class="mbName">${j.story?'剧情 · ':''}${j.cat} · ${j.name}</div>
      <div class="mbCost" style="color:${cost>budget?'#ff9a9a':'#7ee0a1'}">${money(cost)} / ${money(budget)}</div>
    </div>
    <div class="mbBar"><i class="${cost>budget?'over':''}" style="width:${pct}%"></i></div>
    ${(()=>{const list=takenJobs();if(list.length<2)return '';
      const idx=list.findIndex(x=>x.id===j.id)+1;
      return `<div class="mbNav"><button type="button" data-sw="-1" aria-label="上一单">‹</button>
        <span>${idx} / ${list.length}</span>
        <button type="button" data-sw="1" aria-label="下一单">›</button></div>`;})()}
    ${j.repair?'':`<div class="mbSw">能跑 ${j.sw}</div>`}
    <div class="mbTgt">${(()=>{
      const bits=targetBits(j);
      if(!bits.length)return '目标 <b>能开机就行</b>';
      return '目标 '+bits.map(b=>`<i class="tchip">${b}</i>`).join('');
    })()}</div>
    <div class="mbChk" style="color:${fails.length?'#ffa3a3':'#8ff0b3'}">${
      fails.length?(fails.slice(0,3).map(f=>'✕ '+f.m).join('　')+(fails.length>3?`　等 ${fails.length} 项`:'')):'✓ 装机检查全部通过'}</div>`;
  bar.querySelectorAll('[data-sw]').forEach(b=>b.onclick=e=>{e.stopPropagation();switchJob(+b.dataset.sw);});
  let _bx=null,_by=null;
  bar.ontouchstart=e=>{const t=e.touches[0];_bx=t.clientX;_by=t.clientY;};
  bar.ontouchend=e=>{
    if(_bx==null)return;
    const t=e.changedTouches[0],dx=t.clientX-_bx,dy=t.clientY-_by;
    _bx=null;
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.6){switchJob(dx<0?1:-1);}
  };
  bar.onclick=()=>{
    if(isMobile()){mViewSet('checks');return;}
    const r=document.getElementById('panelRight');
    if(r)r.scrollIntoView({behavior:'smooth',block:'start'});
  };
}
function renderModes(){
  const items=[['jobs','工单',state.jobs.filter(j=>j.status==='open').length],
               ['shop','商店',0],['inv','仓库',state.inv.length],['soft','软件库',0]];
  document.getElementById('modes').innerHTML=items.map(([k,n,c])=>
    `<button data-panel="${k}" class="${state.panel===k?'on':''}">${n}${c?`<span class="cnt">${c}</span>`:''}</button>`).join('');
  document.querySelectorAll('#modes button').forEach(b=>b.onclick=()=>{
    /* 不再「同页签直接 return」：状态和画面可能已经不同步，点一下至少要重画一次 */
    const _k=b.dataset.panel;
    if(state.panel===_k){try{renderAll();}catch(err){showFatal(String(err&&err.stack||err));}return;}
    const _box=document.getElementById('leftBody')||document.querySelector('main');
    const _swap=()=>{
      state.panel=_k;filt=defaultFilt();save();
      /* 切到仓库/商店时，直接停在这一步要你买/装的那个分类上 */
      try{if(state.tut&&!state.tut.guideOff&&state.day===1){const _s=coachStep();if(_s)_coachSyncPage(_s);}}catch(e){}
      try{renderAll();}catch(err){showFatal(String(err&&err.stack||err));}
      try{if(_box){_box.classList.remove('panelOut');}}catch(e){}
      scrollLeftTop();
    };
    /* 先让当前内容淡出，再换，避免硬切 */
    if(_box&&!document.documentElement.dataset.reduceMotion){
      _box.classList.add('panelOut');
      setTimeout(_swap,190);
    }else{_swap();}
  });
}
/* ===== 新手清单：跟着操作自动打勾，做完自动收起 ===== */
const TUT_STEPS=[
  {k:'accept', n:'接一单',   d:'在工单里点绿色「接受」，工作台就会亮起来'},
  {k:'buy',    n:'进一个件', d:'在商店点「新」或「二手」，货会放进仓库'},
  {k:'install',n:'装上工作台', d:'点工作台上的空槽位，跳到仓库后点「装上」'},
  {k:'checks', n:'检查变绿', d:'右侧兼容性检查的红叉要全部消掉，机器才开得了机'},
  {k:'deliver',n:'交付第一单', d:'全绿后点「交付」，收客户的钱、赚差价'},
  {k:'close',  n:'打烊',     d:'当天单子处理完，点右上「打烊」进下一天'}
];
function tutDone(){
  const t=state.tut||(state.tut={done:{},hidden:false});
  const d=Object.assign({},t.done);
  const j=state.activeId?job():null;
  /* 交付之后工作台会清空，这时候 checks() 当然全是缺件——不能让「检查变绿」重新变红，
     否则交完单引导还会把人拽回检查页，清单也永远卡在第 4 步 */
  d.checks=!!(d.deliver||(j&&checks().every(c=>c.ok||c.soft)));
  return d;
}
function tutProgress(){
  const d=tutDone();let n=0;
  TUT_STEPS.forEach(s=>{if(d[s.k])n++;});
  return {n,total:TUT_STEPS.length,cur:TUT_STEPS.find(s=>!d[s.k])};
}
/* ===== 傻瓜式引导：按装机顺序一步步带，聚光灯打在下一步该点的地方 ===== */
const TUT_PARTS=[
  {cat:'mb',     slot:'mb',     label:'主板',  buy:'先装主板。这单要 LGA1150 的板子，别买错接口。',
   inst:'点「主板」空槽位，去仓库挑一块 LGA1150 的。'},
  {cat:'cpu',    slot:'cpu',    label:'CPU',   buy:'CPU 用 i5-4590，一百二左右，核显够剪 1080p。',
   inst:'点「CPU」槽位，把它装上。'},
  {cat:'cooler', slot:'cooler', label:'散热器',buy:'装散热前先涂硅脂……省这一步要出事。',
   inst:'点「散热器」槽位装上。'},
  {cat:'ram',    slot:'ram',    label:'内存',  buy:'内存一条 DDR3 8G 就够了，插第 2 槽。',
   inst:'点「内存槽」的空位装上。'},
  {cat:'disk',   slot:'disk',   label:'硬盘',  buy:'SATA 120G 起，装系统够用。',
   inst:'点 M.2 或 SATA 空槽位，把盘装上。'},
  {cat:'psu',    slot:'psu',    label:'电源',  buy:'300W 以上就行，线先接好。',
   inst:'点「电源」槽位装上。'},
  {cat:'case',   slot:'case',   label:'机箱',  buy:'该把主板装进机箱了，显卡最后再插。',
   inst:'点「机箱」槽位，把整机装进箱子。'},
  {cat:'gpu',    slot:'gpu',    label:'显卡',  buy:'机箱装好再插显卡。这单核显够用，不用买。',
   inst:'点「显卡」槽位插上。'}
];
const SLOT_SEL={case:'[data-k="case"]',mb:'[data-k="mb"]',cpu:'[data-k="cpu"]',cooler:'[data-k="cooler"]',
  psu:'[data-k="psu"]',ram:'#rowRam'};
/* ---------- 新手单的目标配置：不写死型号，按这个单子的硬性条件从货里挑 ----------
   以前引导只在商店里点亮「列表第一件」，于是主板永远指到最便宜的 H61（LGA1155）——
   跟 i5-4590 的 LGA1150 插槽对不上，玩家照着买，装到检查那一步才发现红叉。
   现在每一步都先算出一件真正能用的件，再把它指出来。 */
const TUT_Q={case:'MATX',mb:'LGA1150',cpu:'',cooler:'',ram:'DDR3 8G',disk:'SATA SSD 120G',psu:'300W'};
/* 关键词先按分类的常用词收窄；万一那件货不在收窄后的列表里（型号名不含该词），
   就退到整名，最后退到不筛——保证引导指的那一件始终能点到。 */
function tutBuyQuery(cat){
  const p=tutPick(cat),base=TUT_Q[cat]||'';
  if(!p)return base;
  const saved=filt.q;
  const has=q=>{filt.q=q;let ok=false;try{ok=currentList().some(x=>x.n===p.n);}catch(e){ok=false;}filt.q=saved;return ok;};
  if(has(base))return base;
  if(has(p.n))return p.n;
  return '';
}
function tutPick(cat){
  const price=x=>(x.u!=null?x.u:(x.p!=null?x.p:Infinity));           /* 优先二手 */
  const has=x=>x.u!=null||x.p!=null;
  const pick=(arr,f)=>{const l=arr.filter(x=>has(x)&&f(x)).sort((a,b)=>price(a)-price(b));return l[0]||null;};
  /* CPU 这步的台词和语音都写死了「i5-4590」，所以指针必须也落在 i5-4590 上。
     以前这里是「i5-4590 或任何 LGA1150 带核显 3000 分」混在一起按价格排序，
     于是 92 块的 Xeon E3-1226 v3 排到了 105 块的 i5-4590 前面 ——
     嘴上说 i5-4590，框却框在 E3 上。 */
  if(cat==='cpu'){
    const exact=C.find(x=>x.n==='Intel Core i5-4590'&&has(x));
    if(exact)return exact;
    return pick(C,x=>x.s==='LGA1150'&&x.ig===1&&x.cs>=3000);
  }
  if(cat==='mb')return pick(B,x=>x.s==='LGA1150'&&x.m==='DDR3'&&x.dimm>=2);
  if(cat==='case'){
    const mb=tutPick('mb'),ff=mb?mb.ff:'MATX';
    /* 引导用的机箱必须装得下这一单会买的散热器，否则装到一半卡住 */
    const cl=tutPick('cooler'),needH=cl?cl.h:155;
    const fit=x=>x.ff.indexOf(ff)>=0&&x.bay>=1;
    return pick(K,x=>fit(x)&&x.mc>=needH) || pick(K,x=>fit(x));
  }
  if(cat==='cooler'){
    const cpu=tutPick('cpu'),need=coolNeed(cpu);
    return pick(H,x=>x.cap>=need&&!x.rad);
  }
  if(cat==='ram')return pick(M,x=>x.m==='DDR3'&&x.cap>=8);
  if(cat==='disk')return pick(ST,x=>x.kind==='sata'&&x.cap>=120);
  if(cat==='psu')return pick(P,x=>x.w>=300);
  return null;
}
/* 引导文案按「算出来的那件」写，玩家看到的就是要点的东西 */
function tutBuyText(cat){
  const p=tutPick(cat);
  const t=TUT_PARTS.find(x=>x.cat===cat);
  if(!p)return t?t.buy:'';
  const used=p.u!=null;
  const price=money(used?p.u:p.p);
  const how=used?'二手':'全新';
  const T={
    mb:'这单要 LGA1150 的板子，挑一块便宜靠谱的就行。',
    cpu:'CPU 用 i5-4590，够剪 1080p 了。',
    ram:'来一条 DDR3 8G，插第 2 槽。',
    cooler:'散热选个压得住的普通塔式就行。',
    disk:'硬盘拿个 120G 以上的 SSD。',
    psu:'电源 300W 以上就够。',
    case:'机箱要装得下板子和散热，别买太小。',
    gpu:'这单核显够用，不用买显卡。'
  };
  /* 只有 CPU 这句点了名。万一货架上没有 i5-4590 了（价格表一改就可能），
     就把型号换成实际挑中的那件，别让玩家拿「i5-4590」去照着一颗别的 CPU 点。 */
  if(cat==='cpu'&&p.n!=='Intel Core i5-4590'){
    return `CPU 用 ${p.n}（${how} ${price}），够剪 1080p 了。`;
  }
  return T[cat]||'挑一件合适的就行。';
}
/* 引导进行中时，商店里那件目标货加个「按这个买」标记 */
function tutMarkItem(cat,x){
  const t=state.tut;
  if(!t||t.guideOff||t.hidden||state.day>1||t.bought&&t.bought[cat])return '';
  const p=tutPick(cat);
  return (p&&p.n===x.n)?' tut-hit':'';
}
/* 硬盘看买的是 NVMe 还是 SATA，指向对应那一排里第一个空槽位 */
function diskSlotEl(){
  const it=state.inv.find(x=>x.cat==='disk'&&!x.broken);
  const m2=it&&it.part&&it.part.kind==='m2';
  const row=document.getElementById(m2?'rowM2':'rowSata');
  if(!row)return null;
  return row.querySelector('.slot:not(.filled):not(.locked):not(.dis)')||row.querySelector('.slot')||row;
}
/* 装件步骤：件还在仓库里、又已经切到仓库页时，直接指「装上」那颗按钮，
   否则玩家点完槽位跳过来会不知道下一步该点哪里 */
function tutInstallEl(it){
  if(state.panel==='inv'&&it&&it.cat){
    const inv=state.inv.find(x=>x.cat===it.cat&&!x.broken);
    if(inv){
      const b=document.querySelector(`[data-install="${inv.uid}"]`);
      if(b&&b.offsetParent!==null)return b;   /* 只认真的显示出来的按钮 */
    }
  }
  if(it.cat==='disk')return diskSlotEl();
  const sel=SLOT_SEL[it.slot];
  const box=sel?document.querySelector(sel):null;
  if(box){
    if(box.classList&&box.classList.contains('slot')){
      /* 空槽位上并存「仓库 / 商店」两个按钮：引导只放行「仓库」，
         整个槽位都框住的话，点商店也能穿过去，然后流程就断了 */
      const inv=box.querySelector('[data-go="inv"]');
      return inv||box;
    }
    /* 内存是一整排槽位：指第一个真正能插的空位，别指整排（点整排没反应） */
    const empty=box.querySelector('.slot:not(.filled):not(.locked):not(.dis)');
    if(empty)return empty;
  }
  return box||document.querySelector('#benchBox');
}
function tutParts(){const t=state.tut||(state.tut={done:{},hidden:false});t.bought=t.bought||{};t.parts=t.parts||{};return t;}
let _coachKey=null,_coachDrawnKey='',_coachDismissed=null,_coachRetry=null,_coachForcedStep=null,_coachFirstStep=null,_coachEl=null,_coachPageSyncT=null,_coachPageSig='';
/* 线性节拍用（必须声明：脚本是严格模式，未声明赋值会抛错，导致引导画不出来） */
let _coachSettleUntil=0,_coachSettleT=0;


/* 引导锁：第一天引导没走完时，只能点引导指的控件 */
function tutLocked(){
  try{
    /* 标题页、加载页阶段不算新手期：这时必须能点「开始新游戏」 */
    const scr=document.getElementById('titleScr');
    if(scr&&!scr.classList.contains('hide'))return false;
    if(document.getElementById('startLoad'))return false;
    if(state.day!==1)return false;
    const tu=state.tut||{};
    if(tu.guideOff)return false;
    /* 装机实拍层播放期间先别启用点击锁：它盖住全屏，锁只会让玩家白点并弹错提示。
       等实拍层收起、coachRefresh 重新画下一步后，锁自然恢复。 */
    if(typeof _benchDemoOn!=='undefined'&&_benchDemoOn)return false;
    /* 以 coachStep 有没有下一步为准：还有步骤就是引导中 */
    return !!coachStep();
  }catch(e){return false;}
}
function tutTargetEl(){
  try{const s=coachStep();if(!s||typeof s.sel!=='function')return null;return s.sel();}catch(e){return null;}
}
/* 新手期间严格锁：只有「引导指的那一个控件」可以点，其余点击一律拦掉 */
document.addEventListener('click',function(e){
  try{
    if(typeof tutLocked!=='function'||!tutLocked())return;
    const t=e.target;
    if(!t||!t.closest)return;
    /* 剧情/微信/接单卡/引导/弹窗/设置 都属于「引导允许的界面」 */
    if(t.closest('#coach,#tutGal,#tutPortrait,#mask,#setSheet,#dbgPanel,.tutActs,'+
                 '#plotEvent,#chatPop,#storyPop,#dayOverlay,#introCard,.gal-box,.gal-next'))return;
    const tgt=(typeof tutTargetEl==='function')?tutTargetEl():null;
    if(tgt&&(tgt===t||tgt.contains(t)))return;
    /* 允许滚动容器本身，避免整页卡死 */
    if(t.closest('#leftBody,#storeList,.list,.wxBody,#chatBody')){ /* 列表内滚动仍可触发，但点具体控件会被下面拦 */ }
    e.stopPropagation();e.preventDefault();
    try{if(typeof toast==='function')toast('先跟着旺财的提示操作');}catch(x){}
  }catch(err){}
},true);
/* 旧的引导锁监听已删除：它只看 #coach（桌面卡），手机上永远不生效，
   现在统一由前面那条「新手严格锁」负责，避免两套判定互相打架。 */

/* 引导画框时所在的「页面指纹」：面板 / 手机页签 / 分类 / 在施工单。
   任何一个变了，旧框就必须先消失，不能让它挂在新页面上等重画。 */
function _coachSig(){
  try{return [state.panel,typeof mView==='undefined'?'':mView,curCat,state.activeId||''].join('|');}catch(e){return '';}
}
/* 「工作台」在两种壳里不是一个东西：电脑端是中间那栏，手机端是底部页签。
   判断「在不在工作台」和「把框打在哪」都得两边都认，否则手机上永远判成「不在」。 */
function onBenchView(){
  try{if(typeof isMobile==='function'&&isMobile())return (typeof mView!=='undefined'&&mView==='bench');}catch(e){}
  return !!(typeof state!=='undefined'&&state&&state.panel==='bench');
}
function benchTabEl(){
  return document.querySelector('#mNav button[data-view="bench"]')||document.querySelector('#modes button[data-panel="bench"]');
}
/* 涂硅脂真正的可点位置：#btnPaste 那颗按钮 → 台面实拍图上的 CPU → 兜底整个台面 */
function pasteClickEl(){
  const b=document.getElementById('btnPaste');
  if(b)return b;
  const im=document.querySelector('#art2d .benchPhotoBox img');
  return im||document.getElementById('art2d');
}
function coachStep(){
  if(coachStep._gameStamp!==window.__gameNo){
    coachStep._gameStamp=window.__gameNo;
    coachStep._tgtAt=0;coachStep._ramReset=0;
  }
  if(_benchDemoOn&&window._benchDemoAt&&Date.now()-window._benchDemoAt>6000){_benchDemoOn=false;}
  /* 以前这里在「装件动画」的 1.6~2.3 秒里直接返回 null，引导整块消失再重新出现，
     看起来像闪了一下。现在动画期间照常给步骤，只是不切页。 */
  const t=state.tut||{};
  if(t.guideOff||state.day>1)return null;
  const d=tutDone();
  if(!d.accept)return {k:'accept',title:'旺财来带你装机',text:'先接单吧……老同学这台剪辑机，看起来不难。',sel:()=>document.querySelector('[data-accept]')};
  /* 交完第一单、还没打烊：直接收尾。
     以前这里会继续走配件循环，而交付后工作台已清空（totalScore 归零），
     「核显够不够」的判断随之失效，引导又回头让你买显卡——交完单还在催买配件。 */
  if(d.deliver&&!d.close)return {k:'close',title:'打烊',text:'今天的单处理完，打烊，明天继续。',sel:()=>document.getElementById('btnClose')};
  const p=tutParts();
  /* 买件步的「框」统一在这里生成：换到别处（丢件重买）时也能直接复用 */
  const buyStep=it=>({k:'buy:'+it.cat,cat:it.cat,title:'买'+it.label,text:tutBuyText(it.cat),
    sel:()=>{
      /* 指向「算出来的那一件」，不是列表第一件 */
      const q=tutPick(it.cat);
      if(q){
        const kind=q.u!=null?'used':'new';
        const el=document.querySelector(`[data-buy="${q.n}"][data-kind="${kind}"]`)
          ||document.querySelector(`[data-buy="${q.n}"]`);
        if(el)return el;
      }
      return document.querySelector('[data-buy]');
    }});
  for(const it of TUT_PARTS){
    /* 显卡这一步：这单「核显够用」，台词都在劝你别买，但步骤本身却要求 bought.gpu 为真，
       而 tutPick('gpu') 根本没有显卡分支（返回 null），框最后落到「随便一个购买按钮」上——
       玩家照着台词不买，引导就永远停在这一步，最后检查/交付永远到不了。
       所以：整机性能已经达标就直接跳过这一步。 */
    if(it.cat==='gpu'&&!p.bought.gpu&&!p.parts.gpu){
      const needGPU=(function(){
        try{
          const jj=job();if(!jj||!jj.target)return false;
          const t=jj.target;
          /* 核显单（igp 标记，或压根没有 3DMark 门槛）一律不需要显卡，
             不要再拿「参考机分数」去比，否则装完机箱会跳回买显卡这一步来回闪。 */
          if(t.igp||(t.ts||0)<=0)return false;
          if(lvlName&&/核显/.test(String(lvlName(jj)||'')))return false;
          return (t.ts||0)>totalScore().ts;
        }catch(e){return false;}
      })();
      if(!needGPU){p.skipGpu=1;continue;}   /* 用独立标记：伪装成 bought 会被下面的「买了却不在仓库」清掉，导致来回跳步 */
    }
    if(it.cat==='gpu'&&p.skipGpu)continue;    /* 这单核显够用：显卡步骤整体跳过 */
    if(!p.bought[it.cat]){
      if(it.cat==='cpu'&&curCat==='cpu'&&filt.ig!=='ig'&&state.panel==='shop')
        return {k:'cpu_ig',cat:'cpu',title:'带核显',text:'这单没有显卡预算——先点「带核显」，靠 CPU 自带的显卡输出。',sel:()=>document.querySelector('[data-ig="ig"]')};
      /* 已删除「任务要求3000」「拖滑块」两步：工单卡上已写明 CB 3,000，
         再讲一遍只会打断买件节奏（筛选由 tutPick 自动完成）。 */
      return buyStep(it);
    }
    if(it.cat==='ram'){
      let _need=false;
      if(filt.cap.length||filt.mem.length||filt.mhz.length||filt.price.length||filt.extra.length||filt.q){filt=defaultFilt();_need=true;}
      try{const _k=_filterKey();if(shopFilterOpen[_k]){shopFilterOpen[_k]=false;_need=true;}}catch(e){}
      /* 复位筛选后只重画一次，而且放到下一帧，避免在取步骤的过程中打断布局 */
      if(_need&&!coachStep._ramReset){
        coachStep._ramReset=1;
        setTimeout(()=>{coachStep._ramReset=0;try{renderLeft();renderAll();if(typeof coachRefresh==='function')coachRefresh();}catch(e){}},0);
      }
    }
    if(!p.parts[it.cat]){
      const inv=state.inv.find(x=>x.cat===it.cat&&!x.broken);
      /* 买了却不在仓库、也没装上（中途被卖掉 / 存档残留）：把「已买」清掉、直接回到买件，
         不然这一步会指着一个根本不存在的「装上」，永远走不下去 */
      if(p.bought[it.cat]&&!inv){p.bought[it.cat]=false;return buyStep(it);}
      /* 件躺在仓库里、玩家却站在商店/工作台时，屏幕上没有「装上」可点：
         先把框打在上面的「仓库」页签上，让他自己点过去 */
      /* 买错了件（插槽/代际对不上）：placePart 只会弹一句 toast 就没了，
         引导却继续指着「装上」，玩家会一直点、一直失败。这里直接告诉他怎么补救。 */
      if(inv){
        let why='';
        try{
          const mbp=part('mb');
          if(mbp&&it.cat==='cpu'&&inv.part.s&&inv.part.s!==mbp.s)
            why='这颗 CPU 是 '+inv.part.s+'，主板是 '+mbp.s+'，插不上去';
          if(mbp&&it.cat==='ram'&&inv.part.m&&inv.part.m!==mbp.m)
            why='这条内存是 '+inv.part.m+'，主板只吃 '+mbp.m;
        }catch(e){}
        if(why)return {k:'badPart:'+it.cat,cat:it.cat,title:'这件装不上',
          text:why+'。在仓库里点它右边的「卖」出掉，再回头买一件对得上的。',
          sel:()=>document.querySelector('[data-sell]')||document.querySelector('#modes button[data-panel="inv"]')};
      }
      if(inv&&state.panel!=='inv')
        return {k:'gotoInv',cat:it.cat,title:'去仓库装上',
          text:`${it.label}已经躺在仓库里了：点上面的「仓库」，再点它右边的「装上」。`,
          sel:()=>document.querySelector('#modes button[data-panel="inv"]')||document.querySelector('#modes')};
      return {k:(state.panel==='inv'?'install2':'install:'+it.cat),cat:it.cat,title:'装上'+it.label,
        text:(state.panel==='inv'?'点这件右边的「装上」，它会进到工作台对应的槽位。':it.inst),
        sel:()=>tutInstallEl(it)};
    }
    /* 交付之后工作台会被清空（build.paste 回到 false），这一条以前会让引导又跳回
       「去工作区涂硅脂」，交完单还追着你要涂硅脂。台面上没 CPU 就不该再提这件事。 */
    if(it.cat==='cpu'&&!build.paste&&part('cpu')){
      /* 手机上「工作台」是底部页签（mView），不是 #modes 里的按钮，
         而 state.panel 永远不会等于 'bench' —— 以前这里判断的是 state.panel，
         于是从装好 CPU 起引导就一直卡在「去工作区」，框还指着一个不存在的按钮。 */
      if(!onBenchView())return {k:'paste',cat:'cpu',title:'去工作区',text:'先切到「工作区」，CPU 装好了要涂硅脂。',
        sel:benchTabEl};
      return {k:'paste2',cat:'cpu',title:'涂硅脂',text:'点「涂硅脂」（或点台面上的 CPU 顶盖），挤一点硅脂，薄薄抹开。',
        sel:pasteClickEl};
    }
  }
  if(!d.checks)return {k:'checks',title:'让检查变绿',text:'红叉都消掉才能开机……再检查一遍。',sel:()=>document.getElementById('checks')};
  if(!d.deliver)return {k:'deliver',title:'交付',text:'检查全绿就交付，赚的钱就是利润。',
    sel:()=>{const vis=x=>x&&x.getBoundingClientRect&&x.getBoundingClientRect().width>0;
      const a=document.getElementById('abDeliver'),b=document.getElementById('btnDeliver');
      return vis(a)?a:(vis(b)?b:(a||b));}};
  if(!d.close)return {k:'close',title:'打烊',text:'今天的单处理完，打烊，明天继续。',sel:()=>document.getElementById('btnClose')};
  return null;
}
let _coachHiddenAt=0;

/* ---------- 旺财讲解员：立绘 + 语音 ---------- */
let _coachVid=null,_coachVidKey='',_coachSpeakOn=true;
let _tutVid=null,_tutMounted=false,_tutPose='';
let _tutPreloaded=false;
/* 预载三套姿态的视频，切换姿态时不再出现空白帧。 */
function preloadTutPoses(){
  if(_tutPreloaded)return;
  _tutPreloaded=true;
  try{
    window.PORTRAIT_VIDS=window.PORTRAIT_VIDS||{};
    ['default','work','serious'].forEach(pose=>{
      const key='wangcai_'+pose;
      if(window.PORTRAIT_VIDS[key])return;
      const uri=window.PORTRAIT_VIDEO&&PORTRAIT_VIDEO[key];
      if(!uri)return;
      const v=document.createElement('video');
      v.muted=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');
      v.preload='auto';v.src=uri;
      window.PORTRAIT_VIDS[key]=v;
      try{v.load();}catch(e){}
    });
  }catch(e){}
}
/* 教程里的旺财姿态：买件/装件用工作装，检查/交付用认真脸，其余默认。 */
function tutPoseForStep(step){
  const k=(step&&step.k)||'';
  if(k==='checks'||k==='deliver')return 'serious';
  if(k.indexOf('install')===0)return 'default';
  if(k.indexOf('buy:')===0||k==='cpu_ig'||k==='paste'||k==='paste2')return 'work';
  return 'default';
}
function tutMountPose(step){
  const vid=document.getElementById('tutVid');
  if(!vid)return;
  preloadTutPoses();
  const pose=tutPoseForStep(step);
  vid.dataset.pose=pose;
  if(!_tutVid||_tutPose!==pose){
    try{if(_tutVid)_tutVid.destroy();}catch(e){}
    _tutVid=null;_tutPose=pose;
    const uri=window.PORTRAIT_VIDEO&&PORTRAIT_VIDEO['wangcai_'+pose];
    if(uri&&typeof SpriteVid!=='undefined'){
      try{_tutVid=SpriteVid.mount(vid,'wangcai_'+pose,uri);}catch(e){_tutVid=null;}
    }
  }
  if(_tutVid)_tutVid.play();
}
/* 教程引导框固定在底部：不再按目标上下跳，遮挡交给页面滚动处理。 */
function tutFixedDock(){
  try{
    const g=document.getElementById('tutGal');
    if(!g)return;
    g.classList.remove('box-top');
    /* 默认贴到底部页签上方；只有「交付/检查/打烊」这些真正要点操作栏的步骤，
       才把卡片抬到操作栏上面，避免把交付按钮盖死。 */
    const step=(typeof coachStep==='function')?coachStep():null;
    const k=step&&step.k||'';
    const needBar=(k==='deliver'||k==='close'||k==='checks');
    const navh=parseFloat(getComputedStyle(document.body).getPropertyValue('--navh'))||60;
    const ab=document.getElementById('actionBar');
    let abh=0;
    if(needBar&&ab){const r=ab.getBoundingClientRect();if(r&&r.height&&getComputedStyle(ab).display!=='none')abh=r.height+10;}
    g.style.setProperty('--tut-card-gap',Math.round(navh+8+abh)+'px');
  }catch(e){}
}
function tutGalShow(step){
  try{
    /* 硬闸门：场景/弹窗/加载页开着时，任何调用方都不许把引导框画出来。
       这样「引导压在剧情上」不可能靠某条路径绕过去。 */
    const m=document.getElementById('mask');
    if((m&&m.classList.contains('on'))||
       document.getElementById('startLoad')||document.getElementById('chatPop')||
       document.getElementById('plotEvent')||document.getElementById('storyPop')||
       document.getElementById('dayOverlay')||document.getElementById('introCard'))return false;
    const g=document.getElementById('tutGal');if(!g)return false;
    const t=document.getElementById('tutText');if(t)t.textContent=(step&&step.text)||'';
    const vid=document.getElementById('tutVid');
    const skip=document.getElementById('tutSkip');
    const next=document.getElementById('tutNext');
    if(skip)skip.style.display=(step&&step.k==='accept')?'':'none';
    // 需要“知道了”的步骤：镜像原 coachNext 的显隐
    setTimeout(()=>{
      try{
        const src=document.getElementById('coachNext');
        const need=src&&src.style.display!=='none';
        if(next)next.style.display=need?'':'none';
      }catch(e){}
    },0);
    /* 手机端：引导框固定在底部，不再上下跳。 */
    try{tutFixedDock();}catch(e){}
    /* 多留滚动空间：卡片盖住视口底部时，目标还能滚到卡片上方。 */
    try{document.body.classList.add('tut-guide-open');}catch(e){}
    /* 立绘固定在底部引导条上方，不随步骤改位置。 */
    g.classList.add('on');
    /* 加完 on 之后只排一次：先定卡片高度（--tut-card-gap），
       再在同一帧里按定好的卡片顶边摆立绘。以前 0ms + 180ms 两次重排，
       立绘会先按旧位置站一次、再被挪到新位置，看起来就是上下抽一下。 */
    requestAnimationFrame(()=>{
      try{ tutFixedDock(); }catch(e){}
      requestAnimationFrame(()=>{ try{ tutDockSprite(); }catch(e){} });
    });
    if(vid){
      vid.style.display='';
      tutMountPose(step);
      requestAnimationFrame(()=>{try{vid.classList.add('show');}catch(e){}});
    }
  }catch(e){return false;}
    return true;
}
function tutGalHide(){
  try{_tutHiddenAt=Date.now();}catch(e){}
  try{const g=document.getElementById('tutGal');if(g)g.classList.remove('on');}catch(e){}
  try{document.body.classList.remove('tut-guide-open');}catch(e){}
  try{if(_tutVid)_tutVid.pause();}catch(e){}
  _sprDockKey='';
}
/* ===== 引导卡自愈 =====
   这条流程的调用链太长了（场景结束 → 切页 → 等滚动 → 画卡），
   任何一环没走通，玩家看到的就是「只有目标上的高亮框，没有旺财和台词」。
   这里每 1.5 秒查一次：只要有步骤在等着、又没有任何场景/弹窗挡着，
   而卡片已经收起超过 1.2 秒，就直接把它画回来。 */
let _tutHiddenAt=0,_tutHealAt=0;
/* 原来的「引导卡自愈」定时器已删除：
   它每 1.5 秒检查一次，只要卡片被收起超过 1.2 秒就重新画出来 ——
   引导已经结束了它还会把框弹回来，看起来就是闪一下。
   现在开局是线性 await，卡片只在该出现的那一步出现。 */

/* 手机端引导卡上下停靠：目标在屏幕下半部时把卡翻到顶部。
   只处理卡片位置，不改变点击锁、目标高亮或语音。 */
function tutDockBox(step){
  try{
    const g=document.getElementById('tutGal');
    if(!g)return;
    if(!(typeof isMobile==='function'&&isMobile())){g.classList.remove('box-top');return;}
    let el=null;
    try{el=(step&&typeof step.sel==='function')?step.sel():null;}catch(e){}
    if(!el){g.classList.remove('box-top');return;}
    const r=el.getBoundingClientRect();
    if(!r||!r.height){g.classList.remove('box-top');return;}
    const b=document.querySelector('#tutGal .gal-box');
    if(!b){g.classList.remove('box-top');return;}
    const h=b.getBoundingClientRect().height||182;
    const vh=window.innerHeight||700;
    const hd=document.querySelector('header');
    const topY=Math.max(118,(hd?hd.getBoundingClientRect().bottom:112)+6);
    const bottomY=vh-10-h;
    const hit=y=>r.top<y+h-2&&r.bottom>y+2;
    const bs=hit(bottomY),ts=hit(topY);
    let top=false;
    if(bs&&!ts)top=true;
    else if(bs&&ts){
      const ob=Math.min(r.bottom,bottomY+h)-Math.max(r.top,bottomY);
      const ot=Math.min(r.bottom,topY+h)-Math.max(r.top,topY);
      top=ot<ob;
    }
    g.classList.toggle('box-top',top);
  }catch(e){}
}

/* ---------- 引导立绘停靠：先量「哪儿有空」，再决定站哪 ----------
   规则（按优先级）：
     1. 任何时候都不许压住高亮洞（那正是玩家要点的东西）；
     2. 同样不压住时，尺寸越大越好：L(215) > M(168) > S(132) > XS(98)；
     3. 位置优先贴着对话框上沿 → 高亮件上方 → 高亮件下方 → 页眉下方；
     4. 左右：站在高亮件的反侧，看起来像「人站在旁边指给你看」。
   实在挤不下（高亮洞铺满整屏，比如工作台/检查面板）就退到最小号，
   按「重叠面积最小」摆放，至少别把整张卡盖死。 */
const SPR_AR=1080/1920;      /* 立绘 1080×1920，宽度 = 高度×0.5625 */
let _sprDockKey='';
function sprTiers(vh){
  /* 尺寸必须和 CSS 里的 .szL/.szM/.szS/.szXS 一致，否则量出来的矩形对不上 */
  return [['szL',Math.min(vh*0.27,215),0.44]];
}
function sprGeom(){
  const vw=window.innerWidth||390,vh=window.innerHeight||700;
  let top=90;
  try{
    const hd=document.querySelector('header');
    if(hd){const r=hd.getBoundingClientRect();if(r&&r.height)top=Math.max(62,r.bottom+4);}
  }catch(e){}
  let boxTop=vh-150,boxBottom=vh-10,boxTopMode=false;
  try{
    const b=document.querySelector('#tutGal .gal-box');
    if(b){const r=b.getBoundingClientRect();if(r&&r.height){
      boxTop=r.top-6;boxBottom=r.bottom+6;
      boxTopMode=document.getElementById('tutGal').classList.contains('box-top')||r.top<vh*0.36;
    }}
  }catch(e){}
  let hole=null;
  try{
    const c=document.getElementById('coach'),el=document.getElementById('coachHole');
    if(c&&c.classList.contains('on')&&el&&el.style.opacity!=='0'){
      const r=el.getBoundingClientRect();
      if(r&&r.width>4&&r.height>4)hole={l:r.left-6,t:r.top-6,r:r.right+6,b:r.bottom+6};
    }
  }catch(e){}
  const cards=[];
  try{
    document.querySelectorAll('#panelLeft .item,#panelLeft .job,#panelLeft .mcard').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r&&r.width>2&&r.height>2&&r.bottom>0&&r.top<vh){
        cards.push({l:r.left,t:r.top,r:r.right,b:r.bottom});
      }
    });
  }catch(e){}
  return {vw,vh,top,boxTop,boxBottom,boxTopMode,hole,cards};
}
/* 纯几何：给定空间、洞和商品卡，挑一个停靠位。
   卡片交叠权重最高；没有完全不压卡的位置时，选压得最少的最小姿态。 */
function sprPick(G){
  const tiers=sprTiers(G.vh);
  const holeC=G.hole?((G.hole.l+G.hole.r)/2):G.vw/2;
  const minY=G.boxTopMode?G.boxBottom+8:G.top;
  const maxY=G.boxTopMode?G.vh-112:G.boxTop;
  let best=null;
  tiers.forEach((t,ti)=>{
    const H=Math.round(t[1]);
    if(H<40)return;
    const W=Math.round(Math.min(H*SPR_AR,G.vw*t[2]));
    const xs=(holeC<G.vw/2)?[G.vw-8-W,8]:[8,Math.max(8,G.vw-8-W)];
    const ys=[];
    if(G.hole){
      ys.push({y:G.hole.t-8-H,k:1});
      ys.push({y:G.hole.b+8,k:2});
    }
    if(G.boxTopMode)ys.push({y:G.boxBottom+8,k:0});
    else ys.push({y:G.boxTop-H,k:0});
    ys.push({y:G.top,k:3});
    xs.forEach((x,xi)=>ys.forEach(c=>{
      const y=c.y;
      if(y<minY-2||y+H>maxY+2)return;
      let ov=0;
      if(G.hole){
        const w=Math.min(x+W,G.hole.r)-Math.max(x,G.hole.l);
        const hh=Math.min(y+H,G.hole.b)-Math.max(y,G.hole.t);
        if(w>0&&hh>0)ov=w*hh;
      }
      let cardOv=0;
      (G.cards||[]).forEach(q=>{
        const w=Math.min(x+W,q.r)-Math.max(x,q.l);
        const hh=Math.min(y+H,q.b)-Math.max(y,q.t);
        if(w>0&&hh>0)cardOv+=w*hh;
      });
      const score=cardOv*1000000+ov*10000+ti*100+c.k*10+xi;
      if(!best||score<best.score)best={score,cls:t[0],x,y,ov,H,cardOv};
    }));
  });
  return best;
}
function tutDockSprite(){
  try{
    const g=document.getElementById('tutGal'),cv=document.getElementById('tutVid');
    if(!g||!cv||!g.classList.contains('on')||cv.style.display==='none')return;
    /* 固定在引导条上方；左右跟着目标换边：
       目标在屏幕左半边就站右边，目标在右半边就站左边，尽量不挡要点的东西。 */
    const vh=window.innerHeight||800,vw=window.innerWidth||360;
    const card=document.querySelector('#tutGal .gal-box');
    let cardTop=vh-240;
    try{if(card){const cr=card.getBoundingClientRect();if(cr&&cr.height)cardTop=cr.top;}}catch(e){}
    const h=Math.min(vh*0.27,215);cv.classList.add('szL');
    const w=cv.offsetWidth||Math.round(h*0.5625);
    let side='left';
    try{
      const el=(typeof tutTargetEl==='function')?tutTargetEl():null;
      if(el){const r=el.getBoundingClientRect();if(r&&r.width&&(r.left+r.width/2)<vw/2)side='right';}
    }catch(e){}
    const x=side==='right'?Math.max(8,vw-w-8):8;
    const y=Math.max(96,cardTop-h-12);
    const key='dock|'+vh+'|'+Math.round(y)+'|'+Math.round(x);
    if(_sprDockKey===key)return;
    _sprDockKey=key;
    cv.classList.remove('spr-hide');
    cv.classList.remove('dim');
    cv.classList.add('dock');
    ['szL','szM','szS','szXS'].forEach(c=>cv.classList.remove(c));
    cv.classList.add('szL');
    cv.style.setProperty('--spx',Math.round(x)+'px');
    cv.style.setProperty('--spt',Math.round(y)+'px');
  }catch(e){}
}
/* 转屏 / 键盘弹出会让对话框变位置，重量一次 */
try{
  const _sprRe=()=>{if(_sprDockKey||document.getElementById('tutGal')){_sprDockKey='';setTimeout(()=>{try{tutFixedDock();tutDockSprite();}catch(e){}},60);}};
  window.addEventListener('resize',_sprRe,{passive:true});
  window.addEventListener('orientationchange',_sprRe,{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',_sprRe,{passive:true});
}catch(e){}

function _tutReport(msg){try{const d=document.getElementById('tutDebug');if(d){d.style.display='block';d.textContent=msg;}}catch(e){}}
function _tutTryMount(){
  /* 引导只保留一个立绘（tutGal 里那个）。
     这里以前还会再创建一个 #tutPortrait，于是同屏出现两个旺财。
     现在直接不创建：一套图形，一条线。 */
  return;
  try{
    const box=document.getElementById('tutPortrait'),cv=document.getElementById('tutCan');
    if(!cv||_tutVid)return;
    const key='wangcai_default',uri=window.PORTRAIT_VIDEO&&PORTRAIT_VIDEO[key];
    if(!uri||typeof SpriteVid==='undefined'){_tutReport('no uri/SpriteVid');return;}
    const v=(window.PORTRAIT_VIDS||{})[key];
    if(v&&v.readyState<2&&_tutTries<20){_tutTries++;setTimeout(_tutTryMount,400);_tutReport('wait video rs='+v.readyState+' try'+_tutTries);return;}
    _tutVid=SpriteVid.mount(cv,key,uri);
    if(_tutVid){
      _tutVid.play();
      _tutReport('mounted rs='+(v?v.readyState:'-')+' '+cv.width+'x'+cv.height);
      setTimeout(()=>{try{box.classList.add('video');}catch(e){}},600);
    }else{
      _tutTries++;
      if(_tutTries<20){setTimeout(_tutTryMount,500);_tutReport('retry mount '+_tutTries);}
      else _tutReport('mount failed');
    }
  }catch(e){_tutTries++;if(_tutTries<20)setTimeout(_tutTryMount,500);_tutReport('ERR '+(e&&e.message?e.message:e));}
}

/* 只留一个定义：这里以前写了三遍 coachFaceHide，后两遍把带 tutGalHide() 的那遍盖掉了，
   于是引导一收，底下那张剧情提示框（旺财立绘 + 文字）永远挂在屏幕上——
   玩家看到的就是「一张没有光圈的『点装上』卡片压在商店页上」，怎么点都不对。 */
function coachFaceHide(){
  try{tutGalHide();}catch(e){}
  try{const box=document.getElementById('tutPortrait');if(box)box.classList.remove('on');}catch(e){}
  try{if(_tutVid)_tutVid.pause();}catch(e){}
  try{if(_coachVid)_coachVid.pause();}catch(e){}
}
let _coachAudio=null,_coachAudioKey='';
function coachSay(key,text){
  try{
    if(!_coachSpeakOn)return;
    /* 弹窗、场景、加载页开着的时候不要念：玩家还在看说明/剧情，
       引导的语音先出来会显得莫名其妙。 */
    const blocked=function(){
      try{
        const m=document.getElementById('mask');
        return !!((m&&m.classList.contains('on'))||
          document.getElementById('startLoad')||document.getElementById('chatPop')||
          document.getElementById('plotEvent')||document.getElementById('storyPop'));
      }catch(e){return false;}
    };
    if(blocked())return;
    const norm=String(key||'').split('@')[0];
    if(coachSay._lastKey===norm&&Date.now()-(coachSay._lastAt||0)<2500)return;
    const uri=window.COACH_VOICE&&window.COACH_VOICE[norm];
    if(uri){
      if(_coachAudioKey!==norm){if(_coachAudio)_coachAudio.pause();_coachAudio=new Audio(uri);try{_coachAudio.volume=Math.min(1,(typeof VOL!=='undefined'?VOL.voice:1));}catch(e){};_coachAudioKey=norm;}
      coachSay._lastKey=norm;coachSay._lastAt=Date.now();
      try{_coachAudio.currentTime=0;const pr=_coachAudio.play();if(pr&&pr.catch)pr.catch(()=>{});}catch(e){}
      return;
    }
    if(!window.speechSynthesis||!text)return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g,''));
    u.lang='zh-CN';u.rate=1.05;u.pitch=1.15;
    const vs=speechSynthesis.getVoices()||[];const zh=vs.find(v=>/zh|Chinese/i.test(v.lang+v.name));if(zh)u.voice=zh;
    speechSynthesis.speak(u);
  }catch(e){}
}
function coachVoiceToggle(){
  _coachSpeakOn=!_coachSpeakOn;
  const b=document.getElementById('coachVoice');
  if(b)b.textContent=_coachSpeakOn?'🔊 语音':'🔇 静音';
  if(!_coachSpeakOn){try{speechSynthesis.cancel();}catch(e){}try{if(_coachAudio)_coachAudio.pause();}catch(e){}}
  else{const t=document.getElementById('coachText');if(t)coachSay(t.textContent);}
}
try{document.addEventListener('click',e=>{if(e.target&&e.target.id==='coachVoice')coachVoiceToggle();});}catch(e){}
function coachHide(){_coachHiddenAt=performance.now();try{if(typeof tutGalHide==='function')tutGalHide();}catch(e){}coachFaceHide();try{if(_coachAudio)_coachAudio.pause();}catch(e){}const c=document.getElementById('coach');if(c)c.classList.remove('on');_coachKey=null;_coachDrawnKey='';_coachEl=null;/* 收起引导时把滚动锁和压暗一起撤掉，否则会留下一层点不动的遮罩 */try{scrollLockOff();}catch(e){}try{scrollDimOff();}catch(e){}}
let _coachGlowEl=null;
function coachGlow(el){
  if(_coachGlowEl===el)return;
  if(_coachGlowEl&&_coachGlowEl!==el){try{_coachGlowEl.classList.remove('tut-glow');}catch(e){}}
  _coachGlowEl=el;
  if(el&&el.classList){try{el.classList.add('tut-glow');}catch(e){}}
}
function drawCoach(el,step){
  /* 纯说明类步骤（没有可点的目标）停两秒多自动往下走，不用「知道了」 */
  if(step.k==='cpu_target'){
    clearTimeout(drawCoach._t);
    drawCoach._t=setTimeout(()=>{
      state.tut=state.tut||{};state.tut.targetSeen=1;save();
      try{coachHide();coachRefresh();}catch(e){}
    },6000);
  }
  const c=document.getElementById('coach'),hole=document.getElementById('coachHole'),tip=document.getElementById('coachTip');
  if(!c||!hole||!tip)return;
  const _wasOn=c.classList.contains('on');
  const stepChanged=(_coachDrawnKey!==step.k);
  /* 文字、按钮显隐、脉冲动画只在「换了一步」时写一次；
     同一步骤内的重定位只挪几何，避免每帧重排导致卡顿 */
  const _recentHide=(performance.now()-(_coachHiddenAt||0))<800;
  if(stepChanged){
    positionCoach._liftN=0;positionCoach._liftT=0;
    const _cn=document.getElementById('coachNext');
    if(_cn)_cn.style.display=(step.k==='cpu_target')?'':'none';
    const _cs=document.getElementById('coachSkip');
    if(_coachFirstStep===null)_coachFirstStep=step.k;
    if(_cs)_cs.style.display=(step.k===_coachFirstStep)?'':'none';
    document.getElementById('coachStep').textContent='旺财解说';
    document.getElementById('coachTitle').textContent=step.title;
    document.getElementById('coachText').textContent=step.text;
    /* 只有「真的画出来了」才记录当前步骤。
       以前先写 _coachKey 再画，一旦这次被闸门挡掉（比如加载页还没撤），
       后续刷新看到 key 相同就直接 return，引导永远不再出现——首次进游戏
       只有语音没有框，就是这个原因。 */
    let _shown=false;
    try{_shown=tutGalShow(step);}catch(e){_shown=false;}
    /* 卡片没出来（弹窗/剧情刚好压上来）就整步退出：不写 key、不画光圈、不亮提示卡。
       以前这里照样往下走，末尾把 _coachKey 写成这一步，之后每轮 refresh
       都在「步骤没变」处直接 return，卡片就再也回不来了。 */
    if(!_shown)return;
    _coachKey=step.k;_coachDrawnKey=step.k;
    /* 线性时序：先出框 → 380ms 后念；这期间若换步，旧语音取消 */
    try{
      clearTimeout(coachSay._stepT);
      const _k=step.k;
      coachSay._stepT=setTimeout(function(){
        try{
          const s2=(typeof coachStep==='function')?coachStep():null;
          if(!s2||s2.k!==_k)return;
          coachSay(step.k,step.title+'。'+step.text);
        }catch(e){}
      },380);
    }catch(e){}
    coachGlow(el);
    _coachTipW=0;_coachTipH=0;
    try{
      const _h=document.getElementById('coachHole'),_tp=document.getElementById('coachTip');
      /* 只淡入提示卡；光圈如果从 opacity:0 淡入，那一瞬间没有高亮洞，
         四块挡板就变成整屏压暗 = 闪一下 */
      /* 卡片已经亮着时换步骤只换内容，不再重播淡入——
         否则每一步都会「弹一下」，玩家会以为引导弹了两三遍 */
      if(_tp&&!_wasOn&&!_recentHide){_tp.classList.remove('cFade');void _tp.offsetWidth;_tp.classList.add('cFade');}
    }catch(e){}
  }
  if(!positionCoach(el)){
    /* 刚点完按钮时面板可能正在重画，这一瞬间量不到目标；
       以前这里直接 coachHide()，于是「撤掉 → 重画 → 再撤」= 闪屏。
       现在先留着当前画面，静默重试几次，实在不行才收。 */
    _coachMiss=(_coachMiss||0)+1;
    try{const h=document.getElementById('coachHole');if(h)h.style.opacity='0';}catch(e){}
    if(_coachMiss<6){setTimeout(()=>{try{coachRefresh();}catch(e){}},90);return;}
    _coachMiss=0;coachHide();return;
  }
  _coachMiss=0;
  try{const h=document.getElementById('coachHole');if(h)h.style.opacity='';}catch(e){}
  /* 清掉上一根虚线框：以前只移除「上一次记下的那个元素」，列表重绘后就留下了孤儿框 */
  try{document.querySelectorAll('.tut-glow').forEach(e=>e.classList.remove('tut-glow'));}catch(e){}
  /* 定位成功之后才改文案：文字和光圈永远描述同一步。
     （以前文字先写、定位失败就重试，于是出现「文字是带核显、光圈还在当前工单」的错位） */
  {
    const _tt=document.getElementById('coachTitle'),_tx=document.getElementById('coachText');
    if(_tt&&_tt.textContent!==step.title)_tt.textContent=step.title;
    if(_tx&&_tx.textContent!==step.text)_tx.textContent=step.text;
  }
  c.classList.add('on');_coachKey=step.k;_coachDrawnKey=step.k;_coachEl=el;_coachPageSig=_coachSig();
  coachScrollGuard();
  coachWatchScroll();
  if(stepChanged){
    setTimeout(()=>{try{coachReposition(step);}catch(e){}},420);
  }
}
/* 只更新几何：光圈、提示卡、四块挡板 */
let _coachTipW=0,_coachTipH=0;
let _coachGeo="";
/* 把目标滚进真正看得见的一条带子：顶部 96px 是页眉，底部 120px 是交付栏/导航 */
let _coachFrozen=false,_scrollLockEl=null;
let _scrollDimEl=null;

function scrollDimOff(){if(_scrollDimEl)_scrollDimEl.classList.remove('on');}
function scrollLockOn(){
  if(!_scrollLockEl){
    _scrollLockEl=document.createElement('div');
    _scrollLockEl.id='scrollLock';
    document.body.appendChild(_scrollLockEl);
  }
  _scrollLockEl.classList.add('on');
}
function scrollLockOff(){if(_scrollLockEl)_scrollLockEl.classList.remove('on');}

function coachSafeBottom(){
  try{
    const card=document.querySelector('#tutGal .gal-box');
    if(card&&card.offsetParent!==null){
      const r=card.getBoundingClientRect();
      if(r&&r.height&&r.top>140)return Math.max(160,r.top-14);
    }
  }catch(e){}
  return (window.innerHeight||700)-120;
}
function coachNeedsScroll(el){
  try{
    const top=96,bottom=coachSafeBottom();
    const r=el.getBoundingClientRect();
    return !(r.top>=top&&r.bottom<=bottom);
  }catch(e){return false;}
}
/* 引导定位：平滑滚动到目标。
   （v0.9.1 查明之前那一下闪是面板淡入动画，不是滚动造成的，所以平滑可以保留） */
/* 找到真正在滚的那个容器：电脑端是 #panelLeft 这种面板，手机端是 window */
function coachScrollBox(el){
  let node=el.parentElement;
  while(node&&node!==document.body&&node!==document.documentElement){
    let cs=null;try{cs=getComputedStyle(node);}catch(e){}
    const oy=cs?cs.overflowY:'';
    if((oy==='auto'||oy==='scroll')&&node.scrollHeight>node.clientHeight+2)return node;
    node=node.parentElement;
  }
  return null;
}
/* 引导定位：平滑滚动到目标。
   电脑端滚面板、手机端滚窗口，用同一套 easeInOutQuad（900ms），
   滚动过程中每 30ms 把光圈对一次，停稳后再精确对一次。 */
let _coachAutoScrolling=false;
function coachScrollTo(el,dur,done){
  const vh=window.innerHeight||700;
  const top=96,bottom=coachSafeBottom();
  let r;try{r=el.getBoundingClientRect();}catch(e){done&&done();return false;}
  if(r.top>=top&&r.bottom<=bottom){done&&done();return false;}
  const box=coachScrollBox(el);
  const startTop=box?box.scrollTop:(window.scrollY||0);
  const mid=(r.top+r.bottom)/2, want=(top+bottom)/2;
  let delta=mid-want;
  if(box){
    const max=Math.max(0,box.scrollHeight-box.clientHeight);
    delta=Math.max(-startTop,Math.min(max-startTop,delta));
  }else{
    delta=Math.max(-startTop,delta);
  }
  const total=Math.max(260,dur||900);
  const t0=performance.now();
  let last=0;
  const raf=(typeof requestAnimationFrame==='function')?requestAnimationFrame:function(f){return setTimeout(f,16);};
  _coachAutoScrolling=true;
  const step=(t)=>{
    const k=Math.min(1,(t-t0)/total);
    const e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    const y=Math.round(startTop+delta*e);
    try{
      if(box)box.scrollTop=y;else window.scrollTo(0,y);
    }catch(err){}
    if(t-last>30){last=t;try{positionCoach(el);}catch(err){}}
    if(k<1){raf(step);}
    else{
      _coachAutoScrolling=false;
      try{positionCoach(el);}catch(err){}
      done&&done();
    }
  };
  raf(step);
  return true;
}
function positionCoach(el){
  let r;try{r=el.getBoundingClientRect();}catch(e){return false;}
  if(!r||!r.width)return false;
  /* 隐藏面板里的节点也有 rect（只是全 0 或跑偏），offsetParent 为 null 才是「真的没显示 */
  try{if(el.offsetParent===null&&el!==document.body)return false;}catch(e){}
  const pad=6,vw=window.innerWidth||390,vh=window.innerHeight||700;
  /* 只露一半（比如筛选区最下面那个「核显」小标签被面板底边切掉）时，画框会和内容错位：
     先把窗口滚到能整块看见，再重新量一次。 */
  {
    /* 安全区要扣掉底部引导卡片的实际高度；#tutGal 是全屏层，不能拿它的 offsetHeight。 */
    const topSafe=88,botSafe=coachSafeBottom();
    const _nowS=Date.now();
    const _off=(r.top<topSafe-24)||(r.bottom>botSafe+24);
    if(_off&&!_coachAutoScrolling&&!positionCoach._fixing&&(_nowS-(positionCoach._scrT||0)>1000)){
      positionCoach._scrT=_nowS;positionCoach._fixing=1;
      try{scrollElIntoView(el,{instant:true,bottom:botSafe});}catch(e){}
      try{r=el.getBoundingClientRect();}catch(e){}
      positionCoach._fixing=0;
      if(!r||!r.width)return false;
    }
  }
  if(r.bottom<0||r.top>vh)return false;
  const hole=document.getElementById('coachHole'),tip=document.getElementById('coachTip');
  if(!hole||!tip)return false;
  hole.style.left=(r.left-pad)+'px';hole.style.top=(r.top-pad)+'px';
  hole.style.width=(r.width+pad*2)+'px';hole.style.height=(r.height+pad*2)+'px';
  tip.style.maxWidth=Math.min(360,vw-32)+'px';
  if(!_coachTipW)_coachTipW=tip.offsetWidth||Math.min(360,vw-32);
  const tw=_coachTipW;
  tip.style.left=Math.max(12,Math.min(r.left,vw-tw-12))+'px';
  /* 提示卡放上还是放下：挑空间大的一侧，并且尽量不压住高亮区 */
  if(!_coachTipH)_coachTipH=tip.offsetHeight||150;
  const tipH=_coachTipH;
  const below=r.bottom+14, above=r.top-tipH-14;
  let top;
  if(below+tipH<=vh-8)top=below;
  else if(above>=8)top=above;
  else top=Math.max(8,Math.min(below,vh-tipH-8));
  const overlap=(t)=>Math.max(0,Math.min(t+tipH,r.bottom+8)-Math.max(t,r.top-8));
  if(overlap(top)>0){
    const other=(top===above)?below:above;
    if(overlap(other)<overlap(top))top=other;
  }
  top=Math.max(8,Math.min(top,vh-tipH-8));
  tip.style.top=top+'px';
  const L=r.left-pad,T=r.top-pad,R=r.right+pad,B=r.bottom+pad;
  const _geo=[L,T,R,B,vw,vh].join(",");
  if(_geo===_coachGeo)return true;
  _coachGeo=_geo;
  const sh=id=>document.getElementById(id);
  const put=(id,l,t,w,h)=>{
    const e=sh(id);if(!e)return;
    e.style.left=l+'px';e.style.top=t+'px';e.style.width=w+'px';e.style.height=h+'px';
  };
  put('csT',0,0,vw,Math.max(0,T));
  put('csB',0,Math.max(0,B),vw,Math.max(0,vh-B));
  put('csL',0,Math.max(0,T),Math.max(0,L),Math.max(0,B-T));
  put('csR',Math.max(0,R),Math.max(0,T),Math.max(0,vw-R),Math.max(0,B-T));
  /* 光圈换了位置，立绘也要跟着换个不挡道的地方（滚动跟随也会走到这里） */
  try{tutDockSprite();}catch(e){}
  return true;
}

/* 滚动后高亮位置会偏，跟着挪一下挡板和光圈 */
/* 引导期间禁止手动滑动页面：只拦手势和滚轮，不加遮罩，
   所以高亮件照样点得动；引导自己要滚时用 JS scrollIntoView，不受影响。 */
let _coachScrollGuard=false;
function coachScrollGuard(){
  if(_coachScrollGuard)return;
  _coachScrollGuard=true;
  const coachOn=()=>{const c=document.getElementById('coach');return !!(c&&c.classList.contains('on'));};
  const allow=e=>{
    const t=e.target;
    if(!t||!t.closest)return false;
    return !!t.closest('#coachTip');
  };
  const block=e=>{
    if(!coachOn()||allow(e))return;
    if(e.cancelable)e.preventDefault();
  };
  document.addEventListener('touchmove',block,{passive:false});
  window.addEventListener('wheel',block,{passive:false});
  /* 引导期间只放行「高亮的那个件」和引导卡本身，其它点击一律拦掉：
     以前玩家能点到筛选栏，一改筛选目标件就消失，引导直接走不下去 */
  const allowTap=e=>{
    const t=e.target;
    if(!t||!t.closest)return false;
    if(t.closest('#coachTip'))return true;
    /* 引导层自己的按钮（知道了 / 跳过引导 / 语音）必须能点。
       以前只放行了 #coachTip，可手机上真正的按钮长在 .tutGal 里，
       于是「知道了」怎么点都没反应 —— 文案还明摆着让你点。 */
    if(t.closest('.tutGal')||t.closest('#tutGal'))return true;
    /* 弹窗（确认购买 / 交付确认等）开着时必须能点，否则卡死在确认框里 */
    if(t.closest('.mask.on')||t.closest('#mask.on')||t.closest('.modal')||t.closest('.sheet'))return true;
    if(_coachEl&&_coachEl.contains&&_coachEl.contains(t))return true;
    return false;
  };
  const trapTap=e=>{
    if(!coachOn())return;
    /* 任何全屏过场/弹窗开着时都不拦：结算、新一天、剧情、确认框，否则按钮点不动 */
    try{
      /* 结算/剧情这类整屏层打开时，台词卡必须收起来——
         以前只是「不刷新」，卡片就一层不落地压在结算卡上，把「继续」按钮挡住了。 */
      if(document.querySelector('#dayOverlay,#dayOpen,.dayopen,#storyPop,#plotEvent,#chatPop')){
        try{coachHide();}catch(e){}
        return;
      }
      if(document.querySelector('#mask.on'))return;
    }catch(err){}
    if(allowTap(e))return;
    e.stopPropagation();
    if(e.cancelable)e.preventDefault();
  };
  ['pointerdown','mousedown','touchstart','click'].forEach(ev=>{
    document.addEventListener(ev,trapTap,{capture:true,passive:false});
  });
  document.addEventListener('keydown',e=>{
    if(!coachOn())return;
    if(['ArrowDown','ArrowUp','PageDown','PageUp',' ','Spacebar'].indexOf(e.key)>=0)e.preventDefault();
  },{passive:false});
}

let _coachScrollBound=false;
function coachWatchScroll(){
  if(_coachScrollBound)return;
  _coachScrollBound=true;
  let raf=0,last=0;
  const redo=()=>{
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const now=performance.now();
      if(_coachFrozen)return;     /* 引导正在自己滚：整个框冻结，别跟 */
      if(now-last<46)return;      /* 滚动中限到 ~20fps，别每帧都重排 */
      last=now;
      const c=document.getElementById('coach');
      if(!c||!c.classList.contains('on'))return;
      const step=coachStep&&coachStep();
      if(!step)return;
      let el=null;try{el=step.sel();}catch(e){}
      if(el&&el.getBoundingClientRect){
        if(!positionCoach(el))coachHide();
      }
    });
  };
  /* 滚动停下来后再精确对一次，保证最终位置严丝合缝 */
  let endT=0;
  const settle=()=>{
    clearTimeout(endT);
    endT=setTimeout(()=>{
      const c=document.getElementById('coach');
      if(!c||!c.classList.contains('on'))return;
      const step=coachStep&&coachStep();
      if(!step)return;
      let el=null;try{el=step.sel();}catch(e){}
      if(el&&el.getBoundingClientRect){if(!positionCoach(el))coachHide();}
    },150);
  };
  window.addEventListener('scroll',()=>{redo();settle();},{passive:true});
  window.addEventListener('resize',redo,{passive:true});
}
function coachReposition(step){
  const c=document.getElementById('coach');
  if(!c||!c.classList.contains('on'))return;
  let el=null;try{el=step.sel();}catch(e){}
  if(!el||typeof el.getBoundingClientRect!=='function')return;
  if(!positionCoach(el))coachHide();
}
function coachGo(step){
  let changed=false;
  const k=step.k||'';
  /* 只有「买件」类步骤才切到商店；接单回工单；装件/检查/交付不动面板，
     否则会把玩家想看的页面一直拽走 */
  if(k.indexOf('install:')===0){
    /* 装件步：面板切到仓库，同时把手机视图切回「单据」，
       否则仓库栏被 CSS 隐藏，装上按钮的 offsetParent 为 null，引导会退回到空槽位 */
    const hasInv=state.inv.some(x=>x.cat===step.cat&&!x.broken);
    if(hasInv){
      if(state.panel!=='inv'){state.panel='inv';curCat=step.cat;changed=true;}
      try{forceDocsView();}catch(e){}
    }
  }else if(k==='accept'||k==='close'){
    if(state.panel!=='jobs'){state.panel='jobs';changed=true;}
  }else if(k.indexOf('buy:')===0||k==='cpu_ig'||k==='cpu_slider'){
    if(state.panel!=='shop'){state.panel='shop';changed=true;}
    if(step.cat&&curCat!==step.cat){curCat=step.cat;shopLimit=40;filt=defaultFilt();
      filt=defaultFilt();changed=true;}
    /* 引导要走「带核显 / 性能滑块」时，把折叠的筛选区展开 */
    if((k==='cpu_ig'||k==='cpu_slider')&&!shopFilterState()){
      shopFilterOpen[_filterKey()]=true;changed=true;
    }
    if(k==='cpu_ig'){filt.ig=filt.ig==='ig'?'ig':'all';}
    /* 买件步骤把列表收窄到这类货上，并且保证「要买的那一件」一定在列表里 */
    if(k.indexOf('buy:')===0){
      const cat=k.slice(4);
      if(cat!=='cpu'){                     /* CPU 那步要保留「带核显 / 性能滑块」的教学筛选 */
        if(filt.minPerf){filt.minPerf=0;changed=true;}
        if(filt.ig!=='all'){filt.ig='all';changed=true;}
      }
      if(filt.price.length){filt.price=[];changed=true;}
      if(Array.isArray(filt.cond)&&filt.cond.length){filt.cond=[];changed=true;}
      if(filt.extra.length){filt.extra=[];changed=true;}
      if(filt.mhz.length){filt.mhz=[];changed=true;}
      const q=tutBuyQuery(cat);
      if((filt.q||'')!==q){filt.q=q;changed=true;}
      shopLimit=Math.max(shopLimit,40);
    }
  }
  /* 引导按步骤把手机送到对应页：买件/接单 → 单据；装件 → 工作台；检查/交付 → 检查。
     但如果玩家刚自己切过页（1.5 秒内），这一轮就让位，不跟他抢。 */
  let v=null;
  if(k==='accept'||k==='close'||k.indexOf('buy:')===0||k==='cpu_ig'||k==='cpu_slider')v='docs';
  /* 装件分两种：在仓库里装（@inv）就留在单据页，在工作台装（@slot）才去工作台。
     以前一律去工作台，导致你在仓库点「装上」的瞬间又被拽回工作台。 */
  else if(k.indexOf('install:')===0||k==='install')v=/(@inv)$/.test(k)?'docs':'bench';
  /* 「装上」和「去仓库」都得停在单据页：仓库是这一页上的页签，去了工作台就看不到它了 */
  else if(k==='install2'||k==='gotoInv')v='docs';
  else if(k==='checks'||k==='deliver')v='checks';
  if(v&&mView!==v&&Date.now()-_lastUserNav>1500){
    try{mViewSet(v,true);changed=true;}catch(e){}
  }
  if(changed){
    /* 引导要滚动的时候别播条目浮现：两套动画叠在一起，滚动就一卡一卡 */
    _suppressStagger=true;
    try{save();renderAll();}finally{_suppressStagger=false;}
  }
  return changed;
}
/* 开场期间（剧情 → 新手说明）不让教练提示抢焦点 */
let _openingSeq=false;
/* 开场锁的到期时间：锁只挡「说明卡还没关」这一小段，
   任何没走到解锁的路径（卡被点掉/被剧情顶掉/旧存档缺字段）都靠它自动松开。 */
let _openingUntil=0;
let _daySwitching=false;
let _coachHoldUntil=0;
let _crAt=0,_crTrail=null,_coachWaitCount=0,_coachMiss=0;
/* 把页面切到这一步该在的地方：装件→仓库（没有这件就去商店买）、买件→商店、
   接单/打烊→工单。切换期间不画框，避免「框画在别的页上」。 */
function _coachSyncPage(step){
  const k=step.k||'';
  const cat=step.cat||null;
  let want=null;
  if(k.indexOf('install:')===0){
    const has=(state.inv||[]).some(x=>x.cat===cat&&!x.broken);
    want=has?'inv':'shop';
  }else if(k==='install2'||k==='gotoInv'){
    /* 这两步的意思都是「去仓库装上」。以前这里没写，页面就停在商店，
       引导让人去点「仓库」，可页签早滚到屏幕外了——点快一点就直接卡死。 */
    want='inv';
  }else if(k.indexOf('buy:')===0||k==='cpu_ig'||k==='cpu_slider'){
    want='shop';
  }else if(k==='accept'||k==='close'){
    want='jobs';
  }else if(k==='deliver'||k==='checks'){
    /* 「检查/交付」在手机上是底部页签（mView），不是面板（state.panel）。
       以前把它当面板赋值，panel 变成不存在的 'checks'，人却还停在商店，
       于是屏幕上出现「台词让你交付 / 商店停在显卡」这种错位。 */
    try{
      if(typeof isMobile==='function'&&isMobile()){
        /* 这里以前会 renderAll() 并返回 true，上层看到「切过了」又刷一遍，
           和「装完件自动跳商店」打架，画面就在「检查」和「商店·显卡」之间来回闪。
           现在只切一次、1 秒内不重复，而且一律返回 false，不再带动上层刷新。 */
        if(typeof mView!=='undefined'&&mView!=='checks'){
          const _n=Date.now();
          if(_n-(_coachChecksAt||0)>1000){_coachChecksAt=_n;try{mViewSet('checks',true);}catch(e){}}
        }
        return false;
      }
    }catch(e){}
    try{const r=document.getElementById('panelRight');if(r)r.scrollIntoView({block:'start'});}catch(e){}
    return false;
  }
  if(!want)return false;
  const wrongPanel=(state.panel!==want);
  const wrongCat=!!cat&&curCat!==cat&&(want==='shop'||want==='inv');
  if(!wrongPanel&&!wrongCat)return false;
  state.panel=want;
  if(cat)curCat=cat;
  if(want==='shop'){shopLimit=Math.max(shopLimit||40,40);}
  try{renderAll();}catch(e){}
  return true;
}
function coachRefresh(){
  if(document.getElementById('introCard')){ try{coachHide();}catch(e){} return; }
  /* 一次点击会从好几个地方排队调用（40/80/150ms…），而且每调一次就要重排遮罩。
     这里做一次合并：70ms 内的重复调用只留最后一次。 */
  const _now=performance.now();
  if(_now-_crAt<180){
    if(!_crTrail)_crTrail=setTimeout(()=>{_crTrail=null;try{coachRefresh();}catch(e){}},80);
    return;
  }
  _crAt=_now;
  /* 刚完成某一步（比如把滑块拖到 3000）时先停一拍，别立刻把提示换成下一步 */
  if(Date.now()<_coachHoldUntil)return;
  const scr=document.getElementById('titleScr');
  if(scr&&!scr.classList.contains('hide')){coachHide();return;}
  /* 剧情/微信/弹窗开着时一律不出引导（连台词框一起收），避免两个框叠在一起 */
  try{
    if(Scene.playing||document.getElementById('chatPop')||document.getElementById('plotEvent')||
       document.getElementById('storyPop')||document.getElementById('dayOpen')||
       document.getElementById('dayOverlay')||
       (document.getElementById('mask')&&document.getElementById('mask').classList.contains('on'))){
      coachHide();return;
    }
  }catch(e){}
  /* 装机实拍层还盖着时不要画下一步：玩家看到的会是全屏主板照片，
     而高亮/点击锁已经跑到下一件货上。等实拍层收起后再 refresh。 */
  try{
    const bf=document.getElementById('buildFlash');
    if((typeof _benchDemoOn!=='undefined'&&_benchDemoOn)||(bf&&bf.classList.contains('on'))){
      try{if(typeof coachHide==='function')coachHide();}catch(e){}
      if(!_coachRetry)_coachRetry=setTimeout(()=>{_coachRetry=null;try{coachRefresh();}catch(e){}},260);
      return;
    }
  }catch(e){}
  /* 剧情弹窗 / 通用弹窗（新手说明、读取确认…）开着时不要抢焦点，
     等它们关掉再来；否则玩家会看到「接一单」的教练卡压在剧情上面。 */
  {
    const mask=document.getElementById('mask');
    const busy=(_openingSeq&&Date.now()<_openingUntil)||!!document.getElementById('plotEvent')||!!document.getElementById('storyPop')||!!(mask&&mask.classList.contains('on'));
    if(busy){
      /* 弹窗开着时不重画引导，但也别把引导收掉：
         收掉再重新出现，玩家看到的就是「这张卡弹了两遍」。
         弹窗层级本来就比引导高，留着不会盖住确认框。 */
      if(_coachWaitCount===undefined)_coachWaitCount=0;
      if(_coachWaitCount<40){
        _coachWaitCount++;
        if(!_coachRetry)_coachRetry=setTimeout(()=>{_coachRetry=null;try{coachRefresh();}catch(e){}},220);
      }
      return;
    }
    _coachWaitCount=0;
  }
  const step=coachStep();
  if(!step){coachHide();return;}
  if(_coachDismissed===step.k)return;
  /* （已移除 240ms 步间节拍：它要求 _coachKey 必须及时写入，
       手机端走 tutGal 分支时写入滞后，会把引导框一直挡掉。
       节奏改为「剧情之间 260ms + 语音 380ms」两处，够用且不挡绘制。） */
  /* 先切页、再画框：这一轮负责切，切完重新进 refresh 才画 */
  if(_coachSyncPage(step)){
    /* 切页时不收卡片（收了再画 = 肉眼看到两次弹出） */
    if(!_coachPageSyncT)_coachPageSyncT=setTimeout(()=>{
      _coachPageSyncT=null;
      try{coachRefresh();}catch(e){}
    },260);
    return;
  }
  if(_coachKey===step.k){
    /* 步骤没变，但面板被后续操作切走了（刚装完件回到仓库、刚买完切到仓库就是这样）。
       以前这里直接 return，教练卡就指着一个看不见的元素，玩家得自己点回商店。 */
    if((step.k||'').indexOf('buy:')===0&&state.panel!=='shop'&&_coachForcedStep!==step.k){_coachForcedStep=step.k;coachGo(step);}
    return;
  }
  /* 引导只在「步骤变了」的那一次把玩家送到对应页；
     之后玩家自己点去别处（比如点仓库），不能被引导反复拽回来 */
  if(_coachForcedStep!==step.k){
    _coachForcedStep=step.k;
    if(coachGo(step)){
      /* 只切页、不补画一次的话，光圈会停在上一页的目标上（文字是新的、框是旧的）。
         这里固定补一拍，切完页重新走完整的定位流程。 */
      if(!_coachPageSyncT)_coachPageSyncT=setTimeout(()=>{_coachPageSyncT=null;try{coachRefresh();}catch(e){}},300);
      return;
    }
  }
  const el=step.sel();
  if(!el||typeof el.getBoundingClientRect!=='function'){
    /* DOM 可能刚被重画（刚切页签 / 刚买完件），别急着判定「没得指」，稍等再看一眼 */
    if(!_coachRetry){_coachRetry=setTimeout(()=>{_coachRetry=null;try{coachRefresh();}catch(e){}},90);return;}
    coachHide();return;
  }
  /* 换步的瞬间就让旧光圈让位：
     能直接定位（目标已经在屏幕上）就把框和文案一起挪过去；
     定位不了（目标还在屏幕外）就先把框藏起来，等滚动结束再画。
     以前这里什么都不做，上一件货的框会一直亮到 0.9 秒滚动跑完 —— 就是「消失晚了」。 */
  if(_coachKey!==step.k){
    let _moved=false;
    try{_moved=positionCoach(el);}catch(e){}
    if(_moved){
      try{
        const _tt=document.getElementById('coachTitle'),_tx=document.getElementById('coachText');
        if(_tt)_tt.textContent=step.title;
        if(_tx)_tx.textContent=step.text;
      }catch(e){}
    }else{
      try{const _h=document.getElementById('coachHole');if(_h)_h.style.opacity='0';}catch(e){}
    }
    try{document.querySelectorAll('.tut-glow').forEach(e=>e.classList.remove('tut-glow'));}catch(e){}
  }
  /* 先把目标滚到位，滚稳了再画引导框：
     滚动期间不收框的话，每帧重定位会拖慢滚动，还会有「框在追目标」的廉价感 */
  if(!coachNeedsScroll(el)){
    setTimeout(()=>{try{resetCardScrolls();}catch(e){}drawCoach(el,step);},340);
    return;
  }
  /* 滚动期间把引导「冻结」在原地：不重算、不收框、不改亮度。
     以前收框会让高亮那块从亮变暗，就是那一下闪。 */
  /* 阶段化执行，任何一帧只有一个东西在动：
       P1 等切页淡入结束（不滚动）
       P2 一帧内瞬移到位（没有“滚动过程”可被抽帧）
       P3 画框、解锁
     期间遮罩保持原样，亮度全程不变。 */
  /* P1 等切页淡入结束 → P2 平滑滑到位（光圈跟着走，限帧 20fps）→ P3 收尾 */
  _coachFrozen=false;
  scrollLockOn();
  /* 不慌不忙的节奏：切页淡入完 → 再停 0.35 秒 → 0.9 秒滑到位 → 停 0.3 秒再画框 */
  /* 文案统一交给 drawCoach 在「定位成功之后」写。
     这里以前是提前写文案（想跟着切页淡入一起出现），结果定位失败、
     或者切页把这一轮打断时，文字已经是下一步、光圈还停在上一件货上——
     也就是玩家看到的「装上机箱 / 框着二手 ¥51」。 */
  const since=performance.now()-(_lastViewSwitchAt||0);
  const wait=Math.max(350,760-since);
  setTimeout(()=>{
    try{resetCardScrolls();}catch(e){}
    let moved=false;
    /* 这一步是否还是「当前步」：装完/买完之后 step 已经翻篇，
       延迟的 drawCoach 不能把旧框再画回来，否则引导层会整块留在屏幕上 */
    const still=()=>{try{const s=(typeof coachStep==='function')?coachStep():null;return !!(s&&s.k===step.k);}catch(e){return false;}};
    try{
      moved=coachScrollTo(el,900,()=>{
        setTimeout(()=>{
          scrollLockOff();
          try{resetCardScrolls();}catch(e){}
          if(!still())return;
          drawCoach(el,step);
        },120);
      });
    }catch(e){}
    if(!moved){
      setTimeout(()=>{scrollLockOff();if(!still())return;drawCoach(el,step);},140);
    }
  },wait);
}
function tutCardHTML(){
  if(state.day===1&&state.tut&&!state.tut.guideOff)return '';
  const {n,total,cur}=tutProgress();
  if(n>=total)return '';
  const d=tutDone();
  return `<div class="tut">
    <div class="tutH"><b>新手任务</b><span class="tutN">${n}/${total}</span>
      <button class="mini" data-help="1">?</button>
      <button class="mini" data-tut-hide="1">先收起来</button></div>
    <div class="tutBar"><i style="width:${Math.round(n/total*100)}%"></i></div>
    ${cur?`<div class="tutCur">现在做：<b>${cur.n}</b> — ${cur.d}</div>`:''}
    <div class="tutList">${TUT_STEPS.map((s,i)=>{
      const ok=!!d[s.k],active=cur&&cur.k===s.k;
      return `<div class="tutItem ${ok?'done':''} ${active?'cur':''}" data-tut-go="${s.k}">
        <span class="tutIdx">${ok?'✓':(i+1)}</span><span>${s.n}</span></div>`;
    }).join('')}</div>
  </div>`;
}
function tutStripHTML(){
  const {n,total,cur}=tutProgress();
  if(n>=total||!state.tut||state.tut.hidden)return '';
  return `<div class="tutStrip" data-tut-strip="1">
    <b>新手任务 ${n}/${total}</b>${cur?'　'+cur.n+'：'+cur.d:''}<span class="go">查看 ›</span></div>`;
}
function renderLeft(){
  try{renderModes();}catch(e){showFatal(String(e&&e.stack||e));}
  const body=document.getElementById('leftBody');
  if(state.panel==='jobs'){
    body.innerHTML=(state.tut&&!state.tut.hidden?tutCardHTML():'')+jobsHTML();bindJobs();
  }
  else if(state.panel==='soft'){body.innerHTML=tutStripHTML()+softHTML();bindSoft();}
  else{
    body.innerHTML=tutStripHTML()
      +(state.panel==='inv'?pcBoxHTML():'')
      +shopHTML();
    bindShop();bindPcBox();
  }
  bindTut();
  maybeTutTip();
  try{tutAutoNav();}catch(e){}
  /* 换了面板 / 换了分类 / 换了排序结果：让内容像剧情卡那样浮上来，而不是硬替换 */
  const _k=state.panel+'|'+curCat+'|'+(filt.q||'')+'|'+(state.activeId||'');
  if(_k!==_lastLeftKey){
    _lastLeftKey=_k;
    /* 一条一条浮上来，像剧情里文字方块逐个出现 */
    /* 引导自己的重绘：一个动画都不播。
       之前这里把 rows 置空去“跳过条目动画”，结果走进了 else 分支，
       给整块 leftBody 播了 panelSwap（从 25% 透明度淡入）—— 那就是那一下闪。 */
    if(_suppressStagger){
      /* 什么都不做 */
    }else{
      const rows=[...body.querySelectorAll('.item,.job,.mcard,li,.tut')];
      rows.forEach((el,i)=>{try{el.style.setProperty('--i',String(Math.min(i,14)));}catch(e){}});
      if(rows.length)animPulse(body,'stagger',1200);
      else animPulse(body,'panelSwap',360);
    }
  }
}
/* ================= 仓库 · 整机 =================
   一整台机器单独占一行，不拆成散件。目前只有爸爸给的那台开机机。
   后续「整机上台 / 拆成散件 / 标价出售」再逐步接上。 */
/* 爸爸的旧整机：从真实零件库里挑 i3-10100 / B460 / 8G×2 / 512G NVMe / 750Ti / 500W */
function giftDadPC(){
  try{
    state.machines=state.machines||[];
    if(state.machines.some(m=>m.dadGift)) return;
    const pick=(arr,f)=>arr.find(f);
    const cpu=pick(C,x=>x.n==='Intel Core i3-10100');
    const mb=pick(B,x=>/B460/i.test(x.n))||pick(B,x=>/H410/i.test(x.n));
    const cooler=pick(H,x=>(x.s||[]).includes('LGA1200'));
    const rams=M.filter(x=>/DDR4/.test(x.n)&&/8G/.test(x.n)&&/3200/.test(x.n)).slice(0,2);
    const ssd=pick(ST,x=>x.kind==='m2'&&/512G/.test(x.n));
    const gpu=pick(G,x=>x.n==='NVIDIA GeForce GTX 750 Ti');
    const psu=pick(P,x=>/500W/.test(x.n));
    const kase=K[0];
    const parts=[{cat:'cpu',part:cpu},{cat:'mb',part:mb},{cat:'cooler',part:cooler},
                 {cat:'ram',part:rams[0]},{cat:'ram',part:rams[1]},
                 {cat:'disk',part:ssd},{cat:'gpu',part:gpu},{cat:'psu',part:psu},{cat:'case',part:kase}]
                .filter(x=>x.part);
    const b=partsToBuild(parts);
    if(b.cpu&&b.mb) b.paste=true;      /* 爸爸早装过了，硅脂不用再涂 */
    const md=addMachine(null,null,b,{name:'爸爸的旧整机',
      note:'箱盖内侧写着：拆坏了不心疼，装好了就是你的第一台。'});
    md.dadGift=true;
    save();
    return md;
  }catch(e){ return null; }
}
function pcBoxHTML(){
  const list=(typeof machinesInInv==='function')?machinesInInv():(state.machines||[]).filter(m=>!m.onBench);
  if(!list.length) return '';
  return '<div class="pcBoxWrap"><div class="pcBoxHd">整机 <span class="pcBoxCnt">'+list.length+'</span></div>'
    + list.map((m,i)=>{
        const b=m.build||{};
        const detail=[];
        if(b.cpu)detail.push('CPU '+b.cpu.part.n);
        if(b.mb)detail.push('主板 '+b.mb.part.n);
        const rn=(b.rams||[]).filter(Boolean);
        if(rn.length)detail.push('内存 '+(rn[0].part.cap||0)+'G×'+rn.length);
        const dk=(b.m2||[]).concat(b.sata||[]).filter(Boolean)[0];
        if(dk)detail.push('硬盘 '+dk.part.n);
        if(b.gpu1)detail.push('显卡 '+b.gpu1.part.n);
        if(b.psu)detail.push('电源 '+b.psu.part.n);
        return '<div class="pcCard" data-mid="'+m.mid+'">'
          +'<div class="pcIcon">▣</div>'
          +'<div class="pcMain"><b>'+m.name+'</b>'
          +'<div class="pcSpec">'+(machineSpec(m)||'空机箱')+'</div>'
          +(m.note?'<div class="pcNote">'+m.note+'</div>':'')
          +'</div><div class="pcOps"><button type="button" class="mini" data-pcinfo="'+m.mid+'">查看</button></div>'
        +'</div>';
      }).join('')
    +'</div>';
}
function bindPcBox(){
  document.querySelectorAll('[data-pcinfo]').forEach(b=>{
    b.onclick=()=>{
      const m=(state.machines||[]).find(x=>x.mid===b.dataset.pcinfo); if(!m) return;
      const bd=m.build||{},rows=[];
      const add=(k,v)=>{ if(v)rows.push(k+'　'+v); };
      add('CPU',bd.cpu&&bd.cpu.part.n);
      add('主板',bd.mb&&bd.mb.part.n);
      add('散热',bd.cooler&&bd.cooler.part.n);
      const rr=(bd.rams||[]).filter(Boolean);
      add('内存',rr.length?rr.map(r=>r.part.n).join(' + '):'');
      const dk=(bd.m2||[]).filter(Boolean).concat((bd.sata||[]).filter(Boolean));
      add('硬盘',dk.length?dk.map(d=>d.part.n).join(' + '):'');
      add('显卡',bd.gpu1&&bd.gpu1.part.n);
      add('电源',bd.psu&&bd.psu.part.n);
      add('机箱',bd.case&&bd.case.part.n);
      modal(m.name,
        '<div style="font-size:12.5px;line-height:1.95;color:#6b5b60">'
        +rows.join('<br>')
        +(m.note?'<br><br><span style="color:#9b8088;font-size:11.5px">'+m.note+'</span>':'')
        +'</div>',null);
    };
  });
}
function jobsHTML(){
  let html='';

  /* 章节过场放在最上面：新章节第一天的剧情对白不能被它挤掉 */
  const bn=chapterBanner();if(bn)html+=bn;
  const sd=storyToday();
  if(sd)html+=chatHTML(sd);
  const remain=state.jobs.filter(j=>j.status==='open'||j.status==='taken').length;
  const takenN=state.jobs.filter(j=>j.status==='taken').length;
  html+=`<h3>今日工单（剩 ${remain} 单 / 共 ${state.dayTotal||state.jobs.length} 单）</h3>`;
  if(!state.jobs.length){
    html+=`<div class="empty">今天的工单都处理完了<br><span style="font-size:11px">点右上角「打烊」进入下一天</span></div>`;
    return html;
  }
  html+=state.jobs.map(j=>{
    const t=j.target;
    const lines=[];
    if(j.repair){
      (j.repair.clues||[]).slice(0,2).forEach(c=>lines.push('现象：'+c));
      lines.push('维修单 · 自己判断是哪件，换掉才算修好');
    }else if(j.hideScore){
      lines.push('按 '+lvlName(j)+' 验：能跑 '+j.sw);
      if(t.ram)lines.push(`内存别低于 ${t.ram}G`);
    }else{
      if(t.ts>0)lines.push(`3DMark ≥ ${t.ts.toLocaleString()}`);
      if(t.cs>0)lines.push(`Cinebench ≥ ${t.cs.toLocaleString()}`);
      if(t.ram)lines.push(`内存 ≥ ${t.ram}G`);
    }
    if(j.minMhz)lines.push("内存频率 ≥ "+j.minMhz+"MHz"); (j.extra||[]).forEach(e=>lines.push(e));
    if(j.dueDay!=null){
      const left=j.dueDay-(state.day||1);
      if(left<=0)lines.push('⚠ 今天到期，不做完就退单');
      else if(left===1)lines.push('交期：还剩 1 天');
      else lines.push('交期：还剩 '+left+' 天');
    }
    const labor=jobLabor(j);
    const cls=(j.cat==='办公机'?'':j.cat==='游戏机'?' game':' work')+(j.story?' story':'');
    const tag=j.story?'t3':(j.cat==='办公机'?'t0':j.cat==='游戏机'?'t1':'t2');
    const tagText=j.story?'剧情 · '+j.cat:j.cat;
    const lv=j.level==='m'?'最低配置':j.level==='k'?'4K 推荐配置':'推荐配置';
    const acts=j.status==='open'
      ?`<button class="good" data-accept="${j.id}">接受</button>${j.story?'':`<button class="bad" data-reject="${j.id}">拒绝</button>`}`
      :(j.status==='taken'
        ?`<span class="takenTag">已接单 · 施工中</span>`
        :`<span style="font-size:12px;color:${j.status==='done'?'#7ee0a1':'#8b93a1'}">${j.status==='done'?'已完成':'已拒绝'}</span>`);
    return `<div class="job${cls} ${j.status==='open'?'':(j.status==='taken'?' taken':' done')}">
      <div class="top"><div><span class="tag ${tag}">${tagText}</span><span class="nm">${j.name}</span></div>
      <div class="money">${money(j.partBudget)}<small>部件费</small></div></div>
      <div class="who">客户：${j.client}${j.clientRole?'（'+j.clientRole+'）':''}</div>
      <div class="softline">能运行 <b>${j.sw}</b>（${lv}）</div>
      <ul>${lines.map(r=>`<li>${r}</li>`).join('')}</ul>
      <div class="pay">人工费 ${money(labor)}${j.carry?'　·　旧机自动装到工作台':''}</div>
      <div class="acts">${acts}</div></div>`;
  }).join('');
  return html;
}
function bindJobs(){
  document.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>acceptJob(b.dataset.accept));
  document.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>{
    const jj=state.jobs.find(x=>x.id===b.dataset.reject);if(!jj)return;
    jj.status='rejected';
    if(jj.story){state.story.done[jj.storyId]=true;toast('这单回绝了，剧情继续往下走');}
    save();renderAll();
  });
}
/* 接单：每单一个独立工作台，已接的单在列表里变灰 */
function acceptJob(jid){
  const jj=state.jobs.find(x=>x.id===jid);
  if(!jj||jj.status!=='open'){toast('这单已经接过了');return;}
  const r=document.getElementById('result');if(r){r.className='';r.innerHTML='';}
  saveBench();
  state.activeId=jid;jj.status='taken';
  if(isMobile())mViewSet('bench',true);
  state.tut=state.tut||{done:{},hidden:false};state.tut.done.accept=true;
  state.benches=state.benches||{};
  let firstTime=false;
  if(!state.benches[jid]){
    firstTime=true;
    if(jj.repair){
      state.benches[jid]=repairMachine(jj);
      state.diag=state.diag||{};state.diag[jid]={};
    }else{
      state.benches[jid]=newBuild();
      if(state.day===1)curCat='mb';
      build=state.benches[jid];
      const cm=jj.carry&&state.customers[jj.carry]&&state.customers[jj.carry].machine;
      let placed=0;
      if(cm&&benchIsEmpty()){
        /* 客户抬来的是一整台机器：整机上工作台，而不是拆成散件堆进仓库 */
        const md=addMachine(jj.id,jj.carry,cm,{note:'客户抬来的整机，件都是他自带的'});
        placed=machineToBench(md).ok;
      }else if(cm){
        addMachine(jj.id,jj.carry,cm,{note:'客户抬来的整机，先上台再动手'});
      }
      state.panel='shop';
      save();renderAll();
      if(cm&&placed)toast('客户的旧机已整机上台（'+placed+' 个件），缺什么再买');
      else if(cm)toast('客户的旧机在仓库里，到「仓库 · 整机」点上台');
      else if(takenJobs().length>1)toast('已接第 '+takenJobs().length+' 单，顶部可切换');
      return;
    }
  }
  build=state.benches[jid];
  if(!firstTime)state.panel='shop';
  save();renderAll();
  if(jj.repair)toast('客户机器已在工作台，先做检测找出坏件');
}
function softHTML(){
  const groups=['办公','游戏','工作站'];
  const gc={'办公':'var(--office)','游戏':'var(--game)','工作站':'var(--work)'};
  let html=`<h3>软件配置查询</h3><div style="font-size:11px;color:#7d8491;line-height:1.7;margin-bottom:8px">
    口径：3DMark Time Spy 图形分 / Cinebench R23 多核 / 内存。点标题展开。</div>`;
  groups.forEach(g=>{
    const list=SOFTWARE.map((s,i)=>({s,i})).filter(o=>o.s.g===g);
    html+=`<div style="font-size:10.5px;color:${gc[g]};letter-spacing:1px;margin:10px 0 5px">${g}（${list.length}）</div>`;
    list.forEach(({s,i})=>{
      const open=!!swOpen[i];
      const row=(lv,cls,label)=>{const q=s[lv];if(!q)return '';
        return `<div class="reqrow"><div class="lv ${cls}">${label}</div><div class="val">
          3DMark <b>${q.ts.toLocaleString()}</b>　Cinebench <b>${q.cs.toLocaleString()}</b>　内存 <b>${q.ram}G</b>
          <div class="ref">参考显卡 ${refGpuName(q.ts)}　·　参考 CPU ${refCpuName(q.cs)}</div></div></div>`;};
      html+=`<div class="sw ${open?'open':''}" data-sw="${i}">
        <div class="hd"><div><span class="cat" style="background:rgba(255,255,255,.06);color:${gc[g]}">${s.g}</span>
        <span class="nm">${s.n}</span></div><span class="arr">▾</span></div>
        <div class="rows">${row('m','min','最低')}${row('r','rec','推荐')}${row('k','k4','4K')}</div></div>`;
    });
  });
  return html;
}
function maybeTutTip(){
  const t=state.tut;if(!t||t.hidden)return;
  /* 引导进行中，旺财已经在逐步说话；再顶一条长 toast 会挡住状态栏和商品。 */
  try{if(!t.guideOff&&state.day===1&&typeof coachStep==='function'&&coachStep())return;}catch(e){}
  t.seen=t.seen||{};
  const tip={
    shop:['点「新」或「二手」买入，货会进仓库；买之前先看客户要跑什么'],
    inv:['点「装上」把件放进对应槽位；灰色槽位要先装前置部件'],
    soft:['这里是软件配置表：查客户要跑的软件大概需要多少分']
  }[state.panel];
  if(!tip||t.seen[state.panel])return;
  t.seen[state.panel]=1;
  save();
  setTimeout(()=>toast(tip[0]),350);
}
function openHelp(){
  modal('玩法说明',`<div class="help">
    <div class="hsec"><b>怎么赚钱</b>
      客户给一笔「部件费」当预算，花得越少剩下的越是利润；另外每单还有人工费。</div>
    <div class="hsec"><b>装机的顺序</b>
      机箱 → 主板 → CPU → 散热 → 内存 / 硬盘 → 显卡。前置没装，后面的槽位是灰的。</div>
    <div class="hsec"><b>兼容性检查</b>
      右侧红叉 = 开不了机，必须全消；感叹号 = 能开机但会被客户挑毛病。</div>
    <div class="hsec"><b>交付</b>
      机器要跑得动客户指定的软件（分数/内存达标），否则被打回；二手件在「只要全新」的单上会被当场挑出。</div>
    <div class="hsec"><b>维修单</b>
      客户整机抱来，先看故障现象，判断哪一件坏了再换；有的毛病不用换件——清灰换硅脂、重装系统。换错件钱白花。</div>
    <div class="hsec"><b>多单并行</b>
      可以同时接几张单，每张单有自己的工作台，顶部工单条左右切换。</div>
    <div class="hsec"><b>口碑（第 15 天起）</b>
      第三周开始客户会验机：交付不再拦你，但机器不达标（分数不够、电源带不动）有大概率被发现。
      10 单里出问题越多越容易被抓，扣得也越狠；一直达标口碑会涨，最高 5 星。
      4 星以上会有伙计代做的额外订单，钱直接进每日报表。</div>
    <div class="hsec"><b>生活</b>
      右上「生活」里可以买车、买房，纯粹花钱，不带数值加成。</div>
    <div class="hsec"><b>存档</b>
      自动存档随时在写；右上「存档」里还有 3 个手动槽和导出/导入文件，换设备用它。</div>
  </div>`,()=>{});
  const no=document.getElementById('mNo');if(no)no.style.display='none';
  const yes=document.getElementById('mYes');if(yes)yes.textContent='知道了';
}
function bindTut(){
  document.querySelectorAll('[data-help]').forEach(b=>b.onclick=e=>{e.stopPropagation();openHelp();});
  const cn=document.getElementById('coachNext');
  if(cn)cn.onclick=()=>{
    /* 用当前步骤判断，而不是已绘制的 key：教练卡偶尔没画出来时按钮也要能用 */
    const st=(typeof coachStep==='function')?coachStep():null;
    if(!st||st.k!=='cpu_target')return;
    state.tut=state.tut||{};state.tut.targetSeen=1;save();
    coachHide();
    setTimeout(()=>{try{coachRefresh();}catch(e){}},150);
  };
  const cs=document.getElementById('coachSkip');
  if(cs)cs.onclick=()=>{
    /* 跳过是不可逆的（当天不再提示），先确认一下 */
    modal('跳过新手引导？',
      `跳过之后，第 1 天不会再一步步提示你先点哪里。<br>
       <span style="font-size:11.5px;color:#8b93a1">左侧「新手任务」清单还在，照着做也能过。以后不能恢复，只能重开新游戏。</span>`,
      ()=>{
        state.tut=state.tut||{done:{},hidden:false};state.tut.guideOff=true;save();
        coachHide();toast('已跳过引导，左侧任务清单还在');
      });
    const no=document.getElementById('mNo'),yes=document.getElementById('mYes');
    if(no)no.textContent='继续引导';
    if(yes)yes.textContent='跳过';
  };
  document.querySelectorAll('[data-tut-hide]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();state.tut.hidden=true;save();renderAll();
  });
  document.querySelectorAll('[data-tut-strip]').forEach(b=>b.onclick=()=>{
    state.panel='jobs';save();renderAll();scrollLeftTop();
  });
  document.querySelectorAll('[data-tut-go]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.tutGo;
    if(k==='accept'||k==='close')state.panel='jobs';
    else if(k==='buy')state.panel='shop';
    else if(k==='install')state.panel='inv';
    else if(k==='deliver')state.panel=state.activeId?'shop':'jobs';
    else if(k==='checks')state.panel='shop';
    save();renderAll();
    if(k==='checks'){const c=document.getElementById('checks');if(c)c.scrollIntoView({behavior:'smooth',block:'center'});}
    else scrollLeftTop();
  });
}
function bindSoft(){document.querySelectorAll('[data-sw]').forEach(el=>el.onclick=()=>{
  const i=+el.dataset.sw;swOpen[i]=!swOpen[i];el.classList.toggle('open');});}
function shopHTML(){
  const isInv=state.panel==='inv',pm=PERF_META[curCat];
  let html=(isInv?machinesHTML():'')+`<div class="tabs">${CATS.map(([k,n])=>{
    const c=isInv?invList(k).length:0;
    return `<button data-cat="${k}" class="${k===curCat?'on':''}">${icon(k)}<span>${n}${c?' '+c:''}</span></button>`;}).join('')}</div>`;
  /* 筛选区可折叠：桌面上一展开就吃掉大半屏，货架只剩一行半 —— 桌面默认收起，手机默认展开 */
  const fAct=filterSummary(),fOpen=shopFilterState();
  html+=`<div class="fphead ${fOpen?'open':''} ${fAct?'on':''}" id="fpHead">
    <span class="t">筛选</span><span class="s">${fAct||'价格 / 规格 / 性能 / 排序'}</span><span class="arr">▾</span></div>
    <div class="fpanel" id="fpBody"${fOpen?'':' style="display:none"'}>`;
  html+=`<div class="frow"><div class="lab">搜索（品牌 / 型号 / 接口）</div>
    <input type="text" id="qInput" placeholder="如 3060、AM4、DDR5、海韵…" value="${(filt.q||'').replace(/"/g,'&quot;')}"></div>`;
  const _selP=Array.isArray(filt.price)?filt.price:[];
  html+=`<div class="frow"><div class="lab">价格 <span class="slval">可多选</span></div><div class="fchips">${
    PRICE_OPTS.map(([k,n])=>`<span class="chip ${(k==='all'?(!_selP.length):_selP.includes(k))?'on':''}" data-price="${k}">${n}</span>`).join('')}</div></div>`;
  const _selC=Array.isArray(filt.cond)?filt.cond:[];
  html+=`<div class="frow"><div class="lab">货况 <span class="slval">可多选 · 或</span></div><div class="fchips">`+
    `<span class="chip ${!_selC.length?'on':''}" data-condall="1">全部</span>`+
    `<span class="chip ${_selC.includes('new')?'on':''}" data-cond="new">全新</span>`+
    `<span class="chip ${_selC.includes('used')?'on':''}" data-cond="used">二手</span></div></div>`;
  /* 规格 / 内存类型两行都可多选：同维度取「或」，跨维度取「与」 */
  const _ef=EXTRA_FILTERS[curCat]||[];
  const _selE=Array.isArray(filt.extra)?filt.extra:[];
  const _mem=_ef.filter(o=>o[3]==='mem');
  const _specItems=_ef.filter(o=>o[3]!=='mem');
  const _specDims=[...new Set(_specItems.map(o=>o[3]||'x'))];
  const _rowChip=(o,on)=>`<span class="chip ${on?'on':''}" data-extra="${o[0]}">${o[1]}</span>`;
  if(_specItems.length){
    const none=_selE.filter(k=>_specItems.some(o=>o[0]===k)).length===0;
    html+=`<div class="frow"><div class="lab">规格 <span class="slval">可多选</span></div><div class="fchips">`+
      `<span class="chip ${none?'on':''}" data-xall="${_specDims.join(',')}">全部</span>`+
      _specItems.map(o=>_rowChip(o,_selE.includes(o[0]))).join('')+`</div></div>`;
  }
  if(_mem.length){
    const none=_selE.filter(k=>_mem.some(o=>o[0]===k)).length===0;
    html+=`<div class="frow"><div class="lab">内存类型 <span class="slval">可多选</span></div><div class="fchips">`+
      `<span class="chip ${none?'on':''}" data-xall="mem">全部</span>`+
      _mem.map(o=>_rowChip(o,_selE.includes(o[0]))).join('')+`</div></div>`;
  }
  if(curCat==='cpu'){
    html+=`<div class="frow"><div class="lab">核显</div><div class="fchips">${
      IG_OPTS.map(([k,n])=>`<span class="chip ${filt.ig===k?'on':''}" data-ig="${k}">${n}</span>`).join('')}</div></div>`;
  }
  if(curCat==='ram'){
    /* 内存原来把「代际 / 容量 / 频率」全挤在「规格」一行里，9 个 chip 混着看很乱。
       拆成三行：代际（DDR3/4/5）· 容量（4G…64G）· 频率（1333…MHz），各自单选。 */
    html+=`<div class="frow"><div class="lab">代际</div><div class="fchips">${
      MEM_OPTS.map(([k,n])=>`<span class="chip ${(k==='all'?!filt.mem.length:filt.mem.includes(k))?'on':''}" data-mem="${k}">${n}</span>`).join('')}</div></div>`;
    html+=`<div class="frow"><div class="lab">容量</div><div class="fchips">${
      CAP_OPTS.map(([k,n])=>`<span class="chip ${(k==='all'?!filt.cap.length:filt.cap.includes(k))?'on':''}" data-cap="${k}">${n}</span>`).join('')}</div></div>`;
    const freqs=[...new Set(M.map(x=>x.mhz))].filter(Boolean).sort((a,b)=>a-b);
    html+=`<div class="frow"><div class="lab">频率</div><div class="fchips">${
      [['all','全部']].concat(freqs.map(f=>[String(f),f+'MHz']))
        .map(([k,n])=>`<span class="chip ${(k==='all'?!filt.mhz.length:filt.mhz.includes(String(k)))?'on':''}" data-mhz="${k}">${n}</span>`).join('')}</div></div>`;
  }
  const _tutCpu=(state.day===1&&state.tut&&!state.tut.guideOff&&curCat==='cpu');
  html+=`<div class="frow"><div class="lab">${pm.label} <span class="slval" id="slVal">${filt.minPerf?pm.fmt(filt.minPerf):'不限'}</span></div>
    <input type="range" id="perfSlider" ${_tutCpu?'data-tut="1"':''} min="0" max="1000" step="1" value="${perfToPos(filt.minPerf,curCat)}"></div>`;
  html+=`<div class="frow"><select id="sortSel">
    <option value="newAsc" ${filt.sort==='newAsc'?'selected':''}>全新价 从低到高</option>
    <option value="newDesc" ${filt.sort==='newDesc'?'selected':''}>全新价 从高到低</option>
    <option value="usedAsc" ${filt.sort==='usedAsc'?'selected':''}>二手价 从低到高</option>
    <option value="usedDesc" ${filt.sort==='usedDesc'?'selected':''}>二手价 从高到低</option>
    <option value="perf" ${filt.sort==='perf'?'selected':''}>性能 从高到低</option>
    <option value="perfAsc" ${filt.sort==='perfAsc'?'selected':''}>性能 从低到高</option></select></div>`;
  html+=`</div>`;
  html+=`<div id="shopList"></div>`;
  return html;
}
/* 折叠状态下显示一行「现在筛了什么」。
   注意：这里的初值不能直接调 isMobile()——布局模块在主脚本末尾才初始化，早调会踩 TDZ。 */
/* 筛选折叠：商店在手机上默认收起、桌面展开；仓库一律默认收起 */
let shopFilterOpen={shop:undefined,inv:undefined};
function _filterKey(){return state.panel==='inv'?'inv':'shop';}
function shopFilterState(){
  const k=_filterKey();
  if(shopFilterOpen[k]===undefined){
    shopFilterOpen[k]=false; /* 默认收起：手机展开会把列表挤到屏幕外，新手以为没货 */
  }
  return shopFilterOpen[k];
}
function filterSummary(){
  const bits=[];
  if(filt.q)bits.push('搜「'+filt.q+'」');
  const psel=Array.isArray(filt.price)?filt.price:[];
  if(psel.length)bits.push('价 '+psel.map(k=>{const o=PRICE_OPTS.find(x=>x[0]===k);return o?o[1]:k;}).join('/'));
  const esel=Array.isArray(filt.extra)?filt.extra:[];
  const csel=Array.isArray(filt.cond)?filt.cond:[];
  if(csel.length)bits.push('货况 '+(csel.includes('new')?'全新':'')+(csel.length>1?'/':'')+(csel.includes('used')?'二手':''));
  if(esel.length){const list=EXTRA_FILTERS[curCat]||[];
    bits.push(esel.map(k=>{const o=list.find(x=>x[0]===k);return o?o[1]:k;}).join('/'));}
  if(curCat==='cpu'&&filt.ig&&filt.ig!=='all')bits.push(filt.ig==='ig'?'带核显':'无核显');
  if(curCat==='ram'&&filt.mem.length)bits.push(filt.mem.join('/'));
  if(curCat==='ram'&&filt.cap.length)bits.push(filt.cap.map(c=>c+'G').join('/'));
  if(curCat==='ram'&&filt.mhz.length)bits.push(filt.mhz.map(m=>m+'MHz').join('/'));
  if(filt.minPerf)bits.push(PERF_META[curCat].label.replace(' ≥','')+'≥'+PERF_META[curCat].fmt(filt.minPerf));
  const so={newAsc:'全新↑',newDesc:'全新↓',usedAsc:'二手↑',usedDesc:'二手↓',perf:'性能↓',perfAsc:'性能↑'}[filt.sort];
  if(so&&filt.sort!=='usedAsc')bits.push(so);
  return bits.join(' · ');
}
function machinesHTML(){
  const list=machinesInInv();
  if(!list.length)return '';
  const j=state.activeId?job():null;
  return `<h3>整机（${list.length}）</h3>`+list.map(md=>{
    /* 客户送修的要「接了这一单」才能上台；自己买的整机（没有 jobId）随时可以 */
    const mine=!md.jobId||!!(j&&md.jobId===j.id);
    const jj=state.jobs.find(x=>x.id===md.jobId);
    const tag=md.jobId?(jj?('工单：'+jj.name):'客户送修的机器'):'自己的机器';
    return `<div class="mcard">
      <div class="mh"><span class="mi">${icon('case')}</span>
        <div class="mtxt"><div class="mn">${md.name}</div><div class="ms">${machineSpec(md)}</div></div></div>
      <div class="mmeta">${tag}${md.note?'　·　'+md.note:''}</div>
      <div class="macts">
        <button class="primary" data-mup="${md.mid}" ${mine?'':'disabled'}>${mine?'整机上台':'接了这一单才能上台'}</button>
        <button class="mini" data-mtear="${md.mid}">拆成散件</button>
      </div>
      ${md.jobId?(mine?'<div class="mhint">整台机器一次装到工作台，客户的件金色描边、不能卖。</div>'
                        :'<div class="mhint">拆成散件后，客户自带的件仍然只能装在他那一单上。</div>')
               :'<div class="mhint">整台装上去省事；拆成散件可以挑着用、也可以卖。</div>'}
    </div>`;
  }).join('');
}
function bindMachines(){
  document.querySelectorAll('[data-mup]').forEach(b=>b.onclick=()=>{
    const md=getMachine(b.dataset.mup);if(!md)return;
    if(!state.activeId){toast('先接受一个工单，工作台才有位置');return;}
    if(md.jobId&&md.jobId!==state.activeId){toast('这台机器属于另一张工单');return;}
    if(!benchIsEmpty()){toast('工作台上还有东西，先清空再整机上台');return;}
    const r=machineToBench(md);
    save();renderAll();
    if(r.ok){
      toast('整机上台（'+r.ok+' 个件）'+(r.fail?'，'+r.fail+' 个件放不下、已退回仓库':''));
      if(isMobile())mViewSet('bench',true);
    }else toast('这台机器没能上台');
  });
  document.querySelectorAll('[data-mtear]').forEach(b=>b.onclick=()=>{
    const md=getMachine(b.dataset.mtear);if(!md)return;
    modal('拆成散件',
      `<b>${md.name}</b><br>${machineSpec(md)}<br><br>
       拆开之后零件会一件件进仓库（客户自带的件还是只能装在他那一单上）。确认拆？`,()=>{
      const n=machineToParts(md);save();renderAll();toast('拆出 '+n+' 个件，进了仓库');
    });
  });
}
function bindShop(){
  document.querySelectorAll('#leftBody .tabs button').forEach(b=>b.onclick=()=>{
    curCat=b.dataset.cat;shopLimit=40;filt=defaultFilt();renderLeft();});
  bindMachines();
  const fh=document.getElementById('fpHead');
  if(fh)fh.onclick=()=>{shopFilterOpen[_filterKey()]=!shopFilterState();renderLeft();};
  const toggle=(arr,k)=>{const a=Array.isArray(arr)?arr.slice():[];
    if(k==='all')return [];
    const i=a.indexOf(k);if(i>=0)a.splice(i,1);else a.push(k);return a;};
  document.querySelectorAll('[data-price]').forEach(el=>el.onclick=()=>{filt.price=toggle(filt.price,el.dataset.price);renderLeft();});
  document.querySelectorAll('[data-cond]').forEach(el=>el.onclick=()=>{filt.cond=toggle(filt.cond,el.dataset.cond);renderLeft();});
  document.querySelectorAll('[data-condall]').forEach(el=>el.onclick=()=>{filt.cond=[];renderLeft();});
  document.querySelectorAll('[data-extra]').forEach(el=>el.onclick=()=>{filt.extra=toggle(filt.extra,el.dataset.extra);renderLeft();});
  document.querySelectorAll('[data-xall]').forEach(el=>el.onclick=()=>{
    const dims=String(el.dataset.xall||'').split(',');
    const list=EXTRA_FILTERS[curCat]||[];
    filt.extra=(Array.isArray(filt.extra)?filt.extra:[]).filter(k=>{
      const o=list.find(x=>x[0]===k);return o&&!dims.includes(o[3]||'x');});
    renderLeft();});
  document.querySelectorAll('[data-ig]').forEach(el=>el.onclick=()=>{filt.ig=el.dataset.ig;renderLeft();
    setTimeout(()=>{try{coachRefresh();}catch(e){}},40);});
  document.querySelectorAll('[data-mhz]').forEach(el=>el.onclick=()=>{filt.mhz=toggle(filt.mhz,el.dataset.mhz);renderLeft();});
  document.querySelectorAll('[data-mem]').forEach(el=>el.onclick=()=>{filt.mem=toggle(filt.mem,el.dataset.mem);renderLeft();});
  document.querySelectorAll('[data-cap]').forEach(el=>el.onclick=()=>{filt.cap=toggle(filt.cap,el.dataset.cap);renderLeft();});
  const qi=document.getElementById('qInput');
  if(qi)qi.oninput=()=>{
    clearTimeout(qi._t);
    qi._t=setTimeout(()=>{filt.q=qi.value;shopLimit=40;renderShopList();bindShopList();},160);
  };
  const sl=document.getElementById('perfSlider');
  if(sl)sl.oninput=()=>{const pm=PERF_META[curCat];
    let v=posToPerf(+sl.value,curCat);
    /* 引导期：拖到 3000 就锁死，不让再往上推 */
    if(sl.dataset.tut==='1'&&v>=3000){
      v=3000;sl.value=perfToPos(3000,curCat);sl.disabled=true;
      /* 锁住后稍停一下让玩家看清结果（原来 1.4 秒太长） */
      _coachHoldUntil=Date.now()+220;
      setTimeout(()=>{try{coachRefresh();}catch(e){}},260);
    }
    filt.minPerf=v;
    document.getElementById('slVal').textContent=filt.minPerf?pm.fmt(filt.minPerf):'不限';
    renderShopList();bindShopList();
    setTimeout(()=>{try{coachRefresh();}catch(e){}},40);};
  const ss=document.getElementById('sortSel');
  if(ss)ss.onchange=()=>{filt.sort=ss.value;renderLeft();};
  renderShopList();bindShopList();
}
function extraPred(){
  const list=EXTRA_FILTERS[curCat]||[];
  const sel=Array.isArray(filt.extra)?filt.extra:[];const cpred=condPred();
  if(!sel.length)return ()=>true;
  const dims={};
  sel.forEach(k=>{const o=list.find(x=>x[0]===k);if(!o)return;
    const d=o[3]||'x';(dims[d]=dims[d]||[]).push(o[2]);});
  const groups=Object.values(dims);
  if(!groups.length)return ()=>true;
  /* 同一行里的同类选项之间是「或」，不同维度之间是「与」：
     例：LGA1700 + LGA1200 → 任一；LGA1700 + 有M.2 → 同时满足 */
  return x=>groups.every(g=>g.some(f=>f(x)));
}
const refPrice=x=>x.p??x.u;
function currentList(){
  const isInv=state.panel==='inv',pred=extraPred(),ip=igPred(),qp=qPred();
  const inSet=(arr,v)=>!arr||!arr.length||(Array.isArray(arr)?arr:[arr]).some(a=>String(a)===String(v));
  const mpred=x=>inSet(filt.mhz,x&&x.mhz);
  /* 内存的代际 / 容量两行筛选（别的品类不参与） */
  const memPred=x=>curCat!=='ram'||inSet(filt.mem,x&&x.m);
  const capPred=x=>curCat!=='ram'||inSet(filt.cap,x&&x.cap);
  let arr;
  if(isInv)arr=invList(curCat).filter(x=>x.broken||(inPrice(x.paid,filt.price)&&pred(x.part)&&ip(x.part)&&qp(x.part)&&mpred(x.part)&&memPred(x.part)&&capPred(x.part)&&PERFVAL[curCat](x.part)>=filt.minPerf));
  else arr=MAP[curCat].filter(x=>(x.p!=null||x.u!=null))
    .filter(x=>inPrice(refPrice(x),filt.price)&&condPred()(x)&&pred(x)&&ip(x)&&qp(x)&&mpred(x)&&memPred(x)&&capPred(x)&&PERFVAL[curCat](x)>=filt.minPerf);
  const perfOf=x=>PERFVAL[curCat](isInv?x.part:x);
  /* 排序口径跟着下拉框走：全新价只看 p，二手价只看 u，没有该渠道的排到最后 */
  const priceOf=x=>{
    if(isInv)return x.paid;
    if(filt.sort==='newAsc'||filt.sort==='newDesc')return x.p==null?null:x.p;
    if(filt.sort==='usedAsc'||filt.sort==='usedDesc')return x.u==null?null:x.u;
    return refPrice(x);
  };
  arr.sort((a,b)=>{
    if(filt.sort==='perf')return perfOf(b)-perfOf(a);
    if(filt.sort==='perfAsc')return perfOf(a)-perfOf(b);
    const pa=priceOf(a),pb=priceOf(b);
    if(pa==null&&pb==null)return perfOf(b)-perfOf(a);
    if(pa==null)return 1;
    if(pb==null)return -1;
    return /Desc$/.test(filt.sort)?pb-pa:pa-pb;
  });
  return arr;
}
function specOf(k,x){
  if(!x)return '';
  if(k==='cpu'){let s=`${x.s} · ${x.m} · ${x.t}W · 多核${x.cs}`;s+=x.ig?` · 核显TS ${igScore(x)}`:' · 无核显';return s;}
  if(k==='mb')return `${x.s} · ${x.m}×${x.dimm} · ${x.ff} · M.2 ${x.m2}（${x.m2spec}） · SATA ${x.sata}`;
  if(k==='ram')return `${x.m}${x.mhz?'-'+x.mhz:''}${x.cl?' · CL'+x.cl:''} · ${x.mult>1?('套条 '+x.cap+'G×2（共'+(x.cap*x.mult)+'G）'):('单条 '+x.cap+'G')}`;
  if(k==='gpu')return `${x.series} · ${x.len}mm · ${x.tbp}W · TS ${x.ts}`;
  if(k==='cooler')return `${x.cap}W · ${x.rad?'冷排'+x.rad:'高'+x.h}mm`;
  if(k==='psu')return `额定 ${x.w}W`;
  if(k==='case')return `${x.ff.join('/')} · 卡≤${x.mg} · 散热≤${x.mc} · 盘位${x.bay}`;
  if(k==='disk')return `${x.kind==='m2'?'NVMe':(x.kind==='hdd'?'机械':'SATA')} · ${x.cap>=1000?(x.cap/1000)+'T':x.cap+'G'}`;
  return '';
}
let shopLimit=40;
/* 回收价：全新买的件按「拆封折价」回收，二手买的才按二手行情。
   以前不看来源，¥600 全新买的盘只能按 ¥180 二手价卖掉，亏得莫名其妙。 */
function resaleValue(it){
  const p=(it&&it.part)||{};
  if(it&&it.broken)return p.sell||10;
  if(it&&it.shop==='taobao'){
    if(p.p!=null)return Math.max(1,Math.round(p.p*0.9));
    return Math.max(1,Math.round((p.u||0)*0.9));
  }
  if(p.u!=null)return p.u;
  return Math.round((p.p||0)*0.5);
}
function sanitizeFilt(){
  try{
    if(curCat!=='ram'&&curCat!=='disk')filt.cap=[];
    if(curCat!=='ram'&&curCat!=='mb')filt.mem=[];
    if(curCat!=='ram')filt.mhz=[];
    if(curCat==='ram'&&filt.cap.length)filt.cap=filt.cap.filter(v=>[4,8,16,32,64].indexOf(Number(v))>=0);
  }catch(e){}
}
function renderShopList(){
  sanitizeFilt();
  let all=currentList(),isInv=state.panel==='inv',box=document.getElementById('shopList');
  /* 新手引导期间：如果筛选把货全藏了，自动清空一次，别把教程卡死 */
  if(!all.length&&state.tut&&!state.tut.guideOff&&(filt.cap.length||filt.mem.length||filt.mhz.length||filt.price.length||filt.extra.length||filt.q)){
    filt=defaultFilt();all=currentList();
  }
  {const key=(state.panel||'')+'|'+(curCat||'')+'|'+String(state.day||0);
   if(key!==_listKey){_listKey=key;setTimeout(()=>{try{animPulse(box,'listAnim',560);}catch(e){}},0);}}
  const arr=all.slice(0,shopLimit);
  try{box.classList.remove('listFade');void box.offsetWidth;box.classList.add('listFade');}catch(e){}
  if(!arr.length){
    /* 仓库里这件是空的：别只丢一句「没有符合条件的货」，直接给个去商店的出口 */
    box.innerHTML=isInv
      ? `<div class="empty">仓库里还没有${CNAME[curCat]||'这件'}<br><span style="font-size:11px">想要就先买一件，货会直接进仓库</span>
         <div class="acts"><button class="primary" data-toshop="1">去商店买${CNAME[curCat]||''}</button><button data-reset="1">清空筛选</button></div></div>`
      : `<div class="empty">没有符合条件的货<br><span style="font-size:11px">换个关键词，或降低性能要求、放宽价格</span>
         <div class="acts"><button data-reset="1">清空筛选</button></div></div>`;
    const rb=box.querySelector('[data-reset]');
    if(rb)rb.onclick=()=>{filt=defaultFilt();renderLeft();};
    const sb=box.querySelector('[data-toshop]');
    if(sb)sb.onclick=()=>{
      const cat=curCat;
      state.panel='shop';curCat=cat;
      filt=defaultFilt();
      save();renderAll();scrollLeftTop();
    };
    return;
  }
  box.innerHTML=`<div style="font-size:11px;color:#8d95a3;margin:4px 0 6px">共 ${all.length} 件${all.length>arr.length?`，先显示 ${arr.length} 件`:''}</div>`+
   arr.map(x=>{
    if(isInv){
      const p=x.part,own=!!x.owner,brk=!!x.broken,bad=!!x.faulty;
      const sell=resaleValue(x);
      const badNote=x.claim==='fail'?'仲裁失败，钱要不回来了，只能当废品卖':(x.claim==='ok'?'':'买到坏件：可以点「仲裁」要一次钱，80% 能要回来');
      return `<div class="item inv"><div class="ic">${partIcon(curCat,p.kind,p,true)}</div>
        <div class="mid"><div class="n">${p.n}${own?'<span class="tbbadge own">客户</span>':''}${brk?'<span class="tbbadge brk">故障</span>':''}${bad&&x.claim!=='ok'?'<span class="tbbadge brk">坏件</span>':''}</div>
        <div class="s">${brk?'故障件 · 装不上，只能当废品卖':(bad&&x.claim!=='ok'?badNote:specOf(curCat,p))}</div>
        <div class="irow">
          ${own?'':`<div class="ipaid">${money(x.paid)} · ${x.shop==='xianyu'?'二手':'全新'}</div>`}
          <div class="irow-acts">
            ${(brk||bad)?'':`<button class="ibtn" data-install="${x.uid}">装上</button>`}
            ${bad&&x.claim!=='ok'?`<button class="ibtn" data-claim="${x.uid}">仲裁</button>`:''}
            ${own?'':`<button class="ibtn ghost" data-sell="${x.uid}">${(brk||bad)?'卖废品':'卖 '+money(sell)}</button>`}
          </div>
        </div></div></div>`;
    }
    const nb=x.p!=null?`<button class="buy n" data-buy="${x.n}" data-kind="new">新 ${money(x.p)}</button>`:'';
    const off=(x.p!=null&&x.u!=null&&x.p>x.u)?Math.round((1-x.u/x.p)*100):0;
    const ub=x.u!=null?`<button class="buy u" data-buy="${x.n}" data-kind="used">二手 ${money(x.u)}</button>`:'';
    const status=x.p==null?'<span class="statonly only-used">停产 · 只有二手</span>':(x.u==null?'<span class="statonly only-new">仅全新</span>':'');
    const hit=tutMarkItem(curCat,x);
    return `<div class="item${hit}"><div class="ic">${partIcon(curCat,null,x,true)}</div>
      <div class="mid"><div class="n">${x.n}${hit?'<span class="tutbadge">按这个买</span>':''}${(function(){
        try{const t=x&&x.tier;if(!t)return '';
          const cls=t==='flag'?'tFlag':(t==='mid'?'tMid':'tBudget');
          return '<span class="tierTag '+cls+'">'+(t==='flag'?'旗舰':(t==='mid'?'中端':'低端'))+'</span>';
        }catch(e){return '';}}())}${(function(){
        try{
          const mbp=part('mb');if(!mbp)return '';
          if(curCat==='cpu'&&x.s&&x.s!==mbp.s)return '<span class="tutbadge bad">插槽不符</span>';
          if(curCat==='ram'&&x.m&&x.m!==mbp.m)return '<span class="tutbadge bad">代际不符</span>';
        }catch(e){}
        return '';
      })()}</div><div class="s">${specOf(curCat,x)}${status}${off>=8?`<span class="statonly off">省 ${off}%</span>`:''}</div></div>
      <div class="acts">${nb}${ub}</div></div>`;
   }).join('')+(all.length>arr.length?`<div class="acts" style="justify-content:center;margin:10px 0 4px">
      <button class="mini" data-more="1">加载更多（还有 ${all.length-arr.length} 件）</button></div>`:'');
}
function bindShopList(){
  const more=document.querySelector('[data-more]');
  if(more)more.onclick=()=>{shopLimit+=40;renderShopList();bindShopList();};
  document.querySelectorAll('[data-buy]').forEach(el=>el.onclick=()=>{
    const p=MAP[curCat].find(x=>x.n===el.dataset.buy);
    const used=el.dataset.kind==='used',price=used?p.u:p.p;
    if(price==null){toast(used?'这件没有二手货源':'这件已停产，只有二手');return;}
    if(state.cash<price){toast('现金不够，还差 '+money(price-state.cash));return;}
    modal('确认购买',`<b>${p.n}</b><br>${used?'二手':'全新'}　单价 <b>${money(price)}</b><br>
      现金 ${money(state.cash)} → ${money(state.cash-price)}`,()=>{
      if(state.cash<price){toast('现金不够');return;}
      try{SFX.coin();}catch(e){}
      state.cash-=price;state.todayOut=(state.todayOut||0)+price;
      /* 二手件（机箱除外）有 10% 是坏的：新手引导期间不触发，免得把教程卡死 */
      let _bad=false;
      try{
        const tutOn=!!(state.tut&&!state.tut.guideOff);
        if(used&&curCat!=='case'&&!tutOn&&Math.random()<0.10)_bad=true;
      }catch(e){}
      addInv({cat:curCat,part:_bad?Object.assign({},p,{faulty:true}):p,paid:price,shop:used?'xianyu':'taobao',faulty:_bad});
      if(state.tut){state.tut.done.buy=true;state.tut.bought=state.tut.bought||{};state.tut.bought[curCat]=true;}
      /* 买完件后如果引导下一步就是「装上」，直接把面板切到仓库再渲染，
         只重绘一次；否则会有「商店重绘 → 立刻切仓库重绘」的连续两次，中间那下就是闪 */
      try{
        const st=(typeof coachStep==='function')?coachStep():null;
        const _k2=(st&&st.k)||'';
        if(st&&(_k2.indexOf('install:')===0||_k2==='install2'||_k2==='gotoInv')&&state.inv.some(x=>x.cat===st.cat&&!x.broken)){
          state.panel='inv';curCat=st.cat;
          try{forceDocsView();}catch(e){}
        }
      }catch(e){}
      save();renderAll();try{if(!(state.tut&&!state.tut.guideOff&&state.day===1))toast('已入库，点工作台上的空槽位就能装上');}catch(e){}
    });
  });
  document.querySelectorAll('[data-sell]').forEach(el=>el.onclick=e=>{
    e.stopPropagation();
    const i=state.inv.findIndex(x=>x.uid===el.dataset.sell);if(i<0)return;
    const it=state.inv[i];
    if(it.owner){toast('客户自带的件不能卖');return;}
    const sell=resaleValue(it);
    modal('确认卖出',`<b>${it.part.n}</b><br>买入 ${money(it.paid)}　回收 <b>${money(sell)}</b>`,()=>{
      state.cash+=sell;state.todayIn=(state.todayIn||0)+sell;state.inv.splice(i,1);save();renderAll();toast('已卖出');});
  });
  document.querySelectorAll('[data-claim]').forEach(el=>el.onclick=e=>{
    e.stopPropagation();
    const i=state.inv.findIndex(x=>x.uid===el.dataset.claim);if(i<0)return;
    const it=state.inv[i];
    if(!it.faulty||it.claim)return;
    const win=Math.random()<0.8;
    if(win){
      state.cash+=it.paid||0;state.todayIn=(state.todayIn||0)+(it.paid||0);
      state.inv.splice(i,1);
      toast('仲裁成功，退回 '+money(it.paid||0));
    }else{
      it.claim='fail';
      toast('仲裁失败：卖家不认，钱要不回来了');
    }
    save();renderAll();
  });
  document.querySelectorAll('[data-install]').forEach(el=>el.onclick=e=>{
    e.stopPropagation();
    if(!state.activeId){toast('先接受一个工单才能装机');return;}
    const i=state.inv.findIndex(x=>x.uid===el.dataset.install);if(i<0)return;
    const it=state.inv[i];
    if(it.broken){toast('坏件装不上，只能当废品卖');return;}
    if(it.owner&&it.owner!==state.activeId){toast('这是客户自带的件，只能装在他那一单上');return;}
    const ok=placePart(it.cat,it.part,it.paid,it.shop,it.owner);
    if(ok==='ok'){
      /* 装哪件就显示哪一层：电源/机械盘/SATA 盘是装进机箱的，显示空机箱视图；
         M.2 是插在主板上的，显示主板视图。视图几秒后自动回到按配件推算的那张。 */
      try{
        const kind=(it.part&&it.part.kind)||'';
        /* 视图跟着「最后装的那件」走，不再几秒后自动跳回：
           装电源/机械盘/SATA 就一直停在机箱内部视图，直到装了主板类配件才回俯视图。 */
        _stageView=(it.cat==='psu')?'case':(it.cat==='disk'?(kind==='m2'?'board':'case'):null);
        clearTimeout(_stageViewT);
      }catch(e){}
      state.inv.splice(i,1);
      if(state.tut){state.tut.done.install=true;state.tut.parts=state.tut.parts||{};state.tut.parts[it.cat]=true;}
      save();renderAll();
      try{benchDemoAfterInstall(it.cat);}catch(e){}}

    else toast(ok);
  });
}
/* ===== 维修单：客户机器上工作台 =====
   不给「付费检测」，只给现场证据：现象、拆机看到的、听到的。
   判断靠玩家自己按维修常识推——换错件钱就白花，客户还得再跑一趟。
   维修手册是维修工本来就该会的东西，做成可查的表，不算提示作弊。 */
const REPAIR_KB=[
 {k:'psu',n:'电源',s:['按开机键毫无反应：电源灯不亮、风扇一下都不转',
   '偶尔能点亮，一进游戏就整机断电重启','机箱里闻到一股糊味','电源风扇不转（堵转），外壳发烫'],
   v:'完全没反应 / 一带载就断电 → 先查电源'},
 {k:'ram',n:'内存',s:['随机蓝屏，错误码 MEMORY_MANAGEMENT 或 IRQL_NOT_LESS_OR_EQUAL',
   '重启后有时能过，用一会儿又蓝','风扇转、但反复自检重启，屏幕一直不亮','两条内存时，拔掉一条反而能点亮'],
   v:'随机蓝屏 + 重装系统无效 → 查内存'},
 {k:'gpu1',n:'显卡',s:['开机就花屏、竖条纹','进系统后驱动反复掉（TDR），画面一黑又恢复',
   '能听到进系统的提示音，但屏幕一直是黑的','换线、换接口、换显示器都没用'],
   v:'花屏 / 掉驱动 → 先查显卡'},
 {k:'mb',n:'主板',s:['风扇都转、屏幕全黑，主板一声不响','USB 口全部失灵，键盘灯不亮',
   '电容鼓包、顶部爆浆','偶尔能点亮，进系统几秒就重启'],
   v:'能通电但不 POST、还不报警 → 查主板'},
 {k:'disk',n:'硬盘',s:['系统卡死，硬盘灯长亮不灭','机械盘有咔哒、咔哒的异响',
   'BIOS 里时有时无地认不到盘','SMART 报重映射扇区，文件开始损坏'],
   v:'卡死 + 灯长亮 + 异响 → 查硬盘'},
 {k:'cpu',n:'CPU',s:['风扇转、不显示，主板连续短鸣','散热器烫手，但风扇根本不转',
   '拆下散热器，针脚发黑或弯曲','一按开机就瞬间断电保护'],
   v:'CPU 极少坏，先看针脚和供电再下结论'},
 {k:'dust',n:'散热（积灰）',s:['高负载几分钟就自动关机','风扇狂转、噪音很大',
   '出风口积灰成毡，硅脂干裂发白','待机温度就 70 度以上'],
   v:'温度一高就关机 → 清灰换硅脂，别急着换件'},
 {k:'os',n:'系统 / 软件',s:['蓝屏，但硬件自检全部正常','最近装过驱动或系统更新之后开始',
   '安全模式下不蓝屏','硬盘 SMART 正常，内存 memtest 也过'],
   v:'硬件都正常还蓝屏 → 先重装系统'}
];
function repairKB(k){return REPAIR_KB.find(x=>x.k===k)||null;}
function repairMachine(job){
  const sp=SPEC[job.cat][job.tier];
  const cpu=pickCheap(C,sp.cpu,true);
  const mb=pickCheap(B,b=>sp.mb(b)&&(!cpu||b.s===cpu.s),true);
  const ram=pickCheap(M,r=>sp.ram(r)&&(!mb||r.m===mb.m),true);
  /* 机箱必须装得下这块主板的板型，硬盘必须插得上（M.2 槽为 0 就只挑 SATA） */
  const kase=pickCheap(K,k=>sp.case(k)&&(!mb||k.ff.includes(mb.ff)),true);
  const disk=pickCheap(ST,d=>sp.disk(d)&&(d.kind!=='m2'||(mb&&mb.m2>0)),true)
          ||pickCheap(ST,d=>d.kind!=='m2',true);
  const psu=pickCheap(P,sp.psu,true);
  const cool=cpu?pickCheap(H,h=>h.cap>=coolNeed(cpu)&&h.s.includes(cpu.s)
      &&(!kase||(h.h<=kase.mc&&(h.rad||0)<=kase.rad)),true):null;
  let gpu=sp.gpu?pickCheap(G,g=>sp.gpu(g)&&(!kase||g.len<=kase.mg),true):null;
  if(!gpu&&cpu&&!cpu.ig)gpu=pickCheap(G,g=>!kase||g.len<=kase.mg,true);
  const b=newBuild(),put=(k,p)=>{if(p)b[k]={part:p,paid:0,shop:'own',owner:job.id};};
  put('case',kase);put('psu',psu);put('mb',mb);put('cpu',cpu);put('cooler',cool);put('gpu1',gpu);
  if(ram)b.rams[0]={part:ram,paid:0,shop:'own',owner:job.id};
  if(disk){const arr=disk.kind==='m2'?'m2':'sata';b[arr][0]={part:disk,paid:0,shop:'own',owner:job.id};}
  const f=job.repair.fault;
  const slot=f==='ram'?b.rams[0]:(f==='disk'?(b.m2[0]||b.sata[0]):b[f]);
  if(slot&&slot.part&&f!=='dust'&&f!=='os'){slot.faulty=true;slot.part=Object.assign({},slot.part,{faulty:true});}
  return b;
}
function repState(jid){
  state.diag=state.diag||{};
  return state.diag[jid]||(state.diag[jid]={dust:false,os:false,mistakes:0});
}
function repairHTML(j){
  const d=repState(j.id);
  const clues=(j.repair.clues&&j.repair.clues.length?j.repair.clues:(repairKB(j.repair.fault)||{s:[]}).s);
  const manual=REPAIR_KB.map(x=>`<div class="kbr"><b>${x.n}</b><span>${x.v}</span>
      <div class="kbs">${x.s.map(s=>'· '+s).join('<br>')}</div></div>`).join('');
  const labor=Math.round(j.labor*Math.pow(0.75,d.mistakes||0));
  return `<div class="diagbox">
    <div class="dh">故障现象</div>
    <div class="clues">${clues.map(c=>'<div class="cl">· '+c+'</div>').join('')}</div>
    ${d.mistakes?`<div class="dnote" style="color:#ff9287">已经返工 ${d.mistakes} 次，这单人工费降到 ${money(labor)}</div>`:''}
    <div class="dbtns">
      <button class="minibtn ${d.dust?'done':''}" data-fix="dust">${d.dust?'已清灰换硅脂':'清灰 + 换硅脂 ¥20'}</button>
      <button class="minibtn ${d.os?'done':''}" data-fix="os">${d.os?'系统已重装':'重装系统'}</button>
      <button class="minibtn" data-kb="1">维修手册</button>
    </div>
    <div class="kb" id="kbBox" style="display:none">${manual}</div>
    <div class="dnote">对着现象判断是哪一件，拆下来换掉。换错的件钱白花，客户还得再来一趟。</div>
  </div>`;
}
function doRepairFix(jid,kind){
  const j=state.jobs.find(x=>x.id===jid);if(!j||!j.repair)return;
  const d=repState(jid);
  if(kind==='dust'){
    if(d.dust)return;
    if(state.cash<20){toast('现金不够，清灰材料要 ¥20');return;}
    state.cash-=20;state.todayOut=(state.todayOut||0)+20;d.dust=true;
    toast(j.repair.fault==='dust'?'吹干净、换上新硅脂，温度降下来了':'清完灰，还是老样子');
  }else{
    if(d.os)return;d.os=true;
    toast(j.repair.fault==='os'?'系统重装完，蓝屏没再出现':'重装完系统，问题照旧');
  }
  save();renderAll();
}
function applyPaste(){
  if(!part('cpu')){toast('先装 CPU');return;}
  if(build.paste){toast('已经涂过了');return;}
  if(build.cooler){toast('先拆下散热器，再涂硅脂');return;}
  if(build.case){toast('整机已经进机箱了，要涂得先拆出来');return;}
  build.paste=true;
  try{SFX.click();}catch(e){}
  toast('硅脂涂好了，可以压散热器了');
  try{state.tut=state.tut||{};state.tut.done.paste=true;save();}catch(e){}
  renderAll();
  /* 涂完必须把「带硅脂的主板实拍」弹出来，不能只在台面小图里悄悄换一张。
     展示层收起后再让引导切到下一步（买内存）。 */
  try{benchDemoAfterPaste();}catch(e){}
}
/* 涂硅脂后的全屏实拍：复用装机展示层，但入口和装机完成分开。 */
function benchDemoAfterPaste(){
  try{
    const ph=benchPhoto();
    const el=document.getElementById('buildFlash');
    if(!el||!ph)return;
    const img=document.getElementById('bfImg'),lb=document.getElementById('bfLabel');
    if(img)img.src=ph.src;
    if(lb)lb.textContent='已涂硅脂 · 薄薄抹开';
    _benchDemoOn=true;window._benchDemoAt=Date.now();
    el.classList.add('on');
    clearTimeout(_benchDemoT);
    _benchDemoT=setTimeout(()=>{
      el.classList.remove('on');
      _benchDemoT=setTimeout(()=>{
        _benchDemoOn=false;
        try{renderAll();}catch(e){}
        try{if(typeof coachRefresh==='function')coachRefresh();}catch(e){}
      },260);
    },1600);
  }catch(e){_benchDemoOn=false;}
}
let _benchDemoT=null,_benchDemoOn=false;
/* ===== 装机展示层（重做版）=====
   装上一件后：盖一层全屏实拍图 → 1.6s 后收起 → 回商店下一个分类。
   不依赖 panel 重渲染，不会被引导/滚动锁抢回去。 */
function benchDemoAfterInstall(cat){
  try{
    if(!(state.tut&&!state.tut.guideOff&&state.day===1))return;
    const ph=benchPhoto();
    const el=document.getElementById('buildFlash');
    if(!el)return;
    /* 没有照片就别掀这层：以前照样加 on，屏幕上就是一整块「破图」占位 */
    if(!ph){el.classList.remove('on');_benchDemoOn=false;return;}
    if(ph){
      const img=document.getElementById('bfImg'),lb=document.getElementById('bfLabel');
      if(img)img.src=ph.src;
      if(lb)lb.textContent=ph.tag||'装机进度';
    }
    _benchDemoOn=true;window._benchDemoAt=Date.now();
    el.classList.add('on');
    const hold=(cat==='case')?2300:1600;
    _benchDemoT=setTimeout(()=>{
      el.classList.remove('on');
      _benchDemoT=setTimeout(()=>{
        _benchDemoOn=false;
        try{
          /* 装完一件之后该去哪，要看引导的下一步，而不是「下一个还没买的分类」。
             以前一律切到商店、自动选到下一个未购分类：装完 CPU 时正好选中「内存」，
             可引导下一步是「涂硅脂」——于是商店停在内存列表、台词却在让你去涂硅脂，
             玩家会以为要先买内存。 */
          let ns=null;try{ns=(typeof coachStep==='function')?coachStep():null;}catch(e){}
          const nk=ns&&ns.k?ns.k:'';
          if(nk==='paste'||nk==='paste2'){
            /* 下一步在工作台上：留在工作台，别把人拽去商店 */
            try{if(typeof isMobile==='function'&&isMobile()&&typeof mViewSet==='function')mViewSet('bench',true);}catch(e){}
          }else if(nk==='deliver'||nk==='checks'||nk==='close'){
            /* 引导已经走到交付/打烊：这一步不该再把人往商店拽，
               否则每次装完件的定时器都会把页面抢到商店，和交付页互相闪。 */
          }else{
            state.panel='shop';
            const tp=tutParts();
            const want=(ns&&ns.cat)?TUT_PARTS.find(x=>x.cat===ns.cat&&!tp.bought[x.cat]):null;
            /* 只有「下一步明确要买某个分类」时才切分类。
               以前还带一句「否则找下一个没买的 / 没装的分类」，
               结果装机箱时跳到显卡（显卡是故意跳过的），
               引导已经走到「交付」了，商店却停在显卡列表。 */
            if(want){curCat=want.cat;filt=defaultFilt();shopLimit=40;}
          }
          renderAll();
          if(typeof coachRefresh==='function')coachRefresh();
        }catch(e){}
      },260);
    },hold);
  }catch(e){_benchDemoOn=false;}
}
function placePart(cat,p,paid,shop,owner){
  if(p&&p.faulty)return '这个件是坏的，装回去还是会出问题';
  const mb=part('mb'),cs=part('case');
  if(cat==='case'){
    if(build.case)return '机箱槽已占';
    if(!mb)return '先在台面上装好主板';
    if(!build.psu)return '先把电源装上，再整机进箱';
    if(!p.ff.includes(mb.ff))return '机箱不支持 '+mb.ff;
    if(build.cooler){const cl=build.cooler.part;
      if(cl.h>0&&p.mc<cl.h)return '散热器太高，限高 '+p.mc+'mm';
      if(cl.rad>0&&p.rad<cl.rad)return '机箱装不下 '+cl.rad+' 冷排';}
    build.case={part:p,paid,shop,owner:owner||null};return 'ok';
  }
  if(cat==='psu'){if(!mb)return '先装主板，台面上把电源接好';if(build.psu)return '电源槽已占，先把现有的拆下来';
    build.psu={part:p,paid,shop,owner:owner||null};return 'ok';}
  if(cat==='mb'){if(build.mb)return '主板槽已占，先把现有的拆下来';
    build.mb={part:p,paid,shop,owner:owner||null};return 'ok';}
  if(cat==='cpu'){if(!mb)return '先装主板';if(build.cpu)return 'CPU 槽已占，先把现有的拆下来';
    /* 6~9 代酷睿不分 1151 / 1151V2：两个插槽视为同一家族，随便配 */
    const _fam1151=s=>s==='LGA1151'||s==='LGA1151V2';
    const _modBoard=_fam1151(mb.s)&&_fam1151(p.s);
    if(mb.s!==p.s&&!_modBoard)return '插槽不匹配：主板 '+mb.s+'，CPU '+p.s;
    build.cpu={part:p,paid,shop,owner:owner||null};build.paste=false;return 'ok';}
  if(cat==='cooler'){if(!part('cpu'))return '先装 CPU';if(!build.paste)return '先在 CPU 顶盖涂硅脂，再压散热器';
    if(build.cooler)return '散热槽已占，先把现有的拆下来';
    if(!p.s.includes(mb.s))return '散热器不支持 '+mb.s;
    build.cooler={part:p,paid,shop,owner:owner||null};return 'ok';}
  if(cat==='gpu'){
    if(!mb)return '先装主板';
    if(!build.case)return '先把整机装进机箱，再插显卡';
    if(build.gpu1&&!build.gpu2){if(build.gpu1.part.n!==p.n)return '双卡必须同型号';
      if(mb.pcie<2)return '主板只有 1 条 x16';build.gpu2={part:p,paid,shop,owner:owner||null};return 'ok';}
    if(build.gpu1)return '显卡槽已满';
    if(build.case&&build.case.part.mg<p.len)return '显卡太长，机箱限长 '+build.case.part.mg+'mm';
    build.gpu1={part:p,paid,shop,owner:owner||null};return 'ok';}
  if(cat==='ram'){if(!mb)return '先装主板';if(!build.paste)return '先在 CPU 顶盖涂硅脂';if(!build.cooler)return '先压好散热器，再插内存';
    if(p.m!==mb.m)return '内存代际不匹配：主板 '+mb.m+'，这条 '+p.m;
    const mult=p.mult>1?p.mult:1;
    let idx=-1;
    for(let i=0;i+mult<=mb.dimm;i++){
      let free=true;for(let k=0;k<mult;k++)if(build.rams[i+k]){free=false;break;}
      if(free){idx=i;break;}
    }
    if(idx<0)return mult>1?('套条要连着插 '+mult+' 条，主板 '+mb.dimm+' 槽不够') : ('内存槽已插满（'+mb.dimm+' 条）');
    /* 套条两根记同一个 kitId：拆的时候一起下台，仓库只回一件 */
    const kid=mult>1?('k'+(uidSeq++)):null;
    for(let k=0;k<mult;k++)build.rams[idx+k]={part:p,paid:(k===0?paid:0),shop,owner:owner||null,kitId:kid};
    return 'ok';}
  if(cat==='disk'){
    if(!mb)return '先装主板';
    if(p.kind==='m2'){if(mb.m2<=0)return '这块主板没有 M.2 插槽';
      for(let i=0;i<mb.m2;i++)if(!build.m2[i]){build.m2[i]={part:p,paid,shop,owner:owner||null};return 'ok';}
      return 'M.2 槽已满（'+mb.m2+' 个）';}
    const lim=Math.min(mb.sata,cs?cs.bay:6,6);
    for(let i=0;i<lim;i++)if(!build.sata[i]){build.sata[i]={part:p,paid,shop,owner:owner||null};return 'ok';}
    return 'SATA 位已满（'+lim+' 个）';}
  return '未知类型';
}
function idleHTML(){
  const open=state.jobs.filter(j=>j.status==='open').length;
  const done=closedCount();
  const total=state.dayTotal||state.jobs.length;
  const storyOpen=state.jobs.filter(j=>j.story&&j.status==='open').length;
  return `<div class="idle">
    <div class="idle-hero">
      <div class="k">现金 · 第 ${state.day} 天</div>
      <div class="v">${money(state.cash)}</div>
      <div class="sub">${state.date}　今日 ${done}/${total} 单已完成</div>
    </div>
    <div class="idle-grid">
      <div class="cell"><b>${open}</b><span>待接工单</span></div>
      <div class="cell"><b>${done}</b><span>已交付</span></div>
      <div class="cell"><b>${state.inv.length}</b><span>仓库件数</span></div>
      <div class="cell"><b>${storyOpen?'1':'-'}</b><span>剧情待办</span></div>
    </div>
    <div class="idle-tip">从左边挑一单 <b>接受</b>，工作台和兼容性检查就会亮起来。</div>
  </div>`;
}
function idleTipsHTML(){
  const tips=[
    '不能开机就没法交付：先看「兼容性检查」，红色的必须全部消掉。',
    '客户只要全新件时，二手件会被当场挑出来，别赌。',
    '部件费是客户给的预算，花得越少利润越高，但别省到跑不动软件。',
    '每张工单都写了要跑什么软件，照着那个分数去配最稳。',
    '机箱限长、电源功率、散热高度——这三样最容易在最后翻车。',
    '没做完的单可以带到明天，但过了交期客户会退单、掉口碑。'
  ];
  const pick=tips[(state.day*3)%tips.length];
  return `<div class="tipcard"><div class="t">今日提示</div>${pick}</div>
    <div class="tipcard"><div class="t">进度</div>第 ${state.day} 天 · 已交付 ${closedCount()} / ${state.dayTotal||state.jobs.length} 单</div>`;
}
function renderIdle(){
  document.getElementById('panelRight').classList.add('idle');
  const mid=document.getElementById('panelMid');
  if(mid)mid.style.display='';
  if(isMobile()){const bb=document.getElementById('benchBox');if(bb)bb.style.display='none';}
  const hd=document.getElementById('chkHd');if(hd)hd.style.display='none';
  const jb=document.getElementById('jobInfo');if(jb)jb.innerHTML='';
  const ck=document.getElementById('checks');if(ck)ck.innerHTML='';
  const db=document.getElementById('deliverBox');if(db)db.innerHTML=idleTipsHTML();
  const em=document.getElementById('emptyMid');
  if(em){em.classList.remove('empty');em.innerHTML=idleHTML();}
  const bar=document.getElementById('actionBar');if(bar){bar.classList.remove('on');bar.innerHTML='';}
}
function renderActionBar(){
  const bar=document.getElementById('actionBar');
  const j=state.activeId?job():null;
  if(!j){bar.classList.remove('on');bar.innerHTML='';return;}
  /* 还没装任何件时没有可交付的东西：不要常驻「交付 · 成本 ¥0」大条占屏。 */
  if(benchIsEmpty()){bar.classList.remove('on');bar.innerHTML='';return;}
  const cost=totalCost();
  bar.classList.add('on');
  bar.innerHTML=`<button class="mini" id="abInv">仓库</button>
    <button class="primary" id="abDeliver">交付 · 成本 ${money(cost)}</button>
    ${j.story?`<button class="mini" id="abClear">清空</button>`:`<button class="bad mini" id="abGive">放弃</button>`}`;
  document.getElementById('abInv').onclick=()=>{state.panel='inv';save();renderAll();scrollLeftTop();};
  document.getElementById('abDeliver').onclick=confirmDeliver;
  const g=document.getElementById('abGive');
  if(g)g.onclick=()=>{const b=document.getElementById('btnAbandon');if(b)b.click();else toast('在右侧面板操作');};
  const c=document.getElementById('abClear');
  if(c)c.onclick=()=>{const b=document.getElementById('btnClearBench');if(b)b.click();else toast('在右侧面板操作');};
}
function renderBench(){
  const active=state.activeId;
  document.getElementById('benchBox').style.display=active?'':'none';
  document.getElementById('emptyMid').style.display=active?'none':'';
  if(!active){ renderIdle(); return; }
  document.getElementById('panelRight').classList.remove('idle');
  document.getElementById('chkHd').style.display='';
  const midEl=document.getElementById('panelMid');if(midEl)midEl.style.display='';
  const j=job();if(!j)return;
  /* 换工单时，把上一单留在这里的「交付成功/失败」卡片清掉，别和新工单的信息混在一起 */
  {
    const rb=document.getElementById('result');
    if(rb&&rb.innerHTML.trim()&&(rb.dataset.job||'')!==String(state.activeId||'')){rb.className='';rb.innerHTML='';delete rb.dataset.job;}
  }
  document.getElementById('benchTitle').textContent=`工作台 · ${j.story?'剧情 · ':''}${j.cat} · ${j.name}`;
  const t=j.target,lv=j.level==='m'?'最低配置':j.level==='k'?'4K 推荐配置':'推荐配置';
  /* 多单同时施工时，电脑端在「当前工单」标题右边给一组上一单/下一单（手机上顶部工单条已有）。
     以前只有手机条和工单卡上的「切换」，桌面端等于没有入口。 */
  const tk=takenJobs(),tkIdx=tk.findIndex(x=>x.id===j.id)+1;
  const swHTML=(!isMobile()&&tk.length>1)
    ? `<div class="jsw"><button type="button" data-sw="-1" aria-label="上一单" title="上一单">‹</button>
         <span>${tkIdx} / ${tk.length}</span>
         <button type="button" data-sw="1" aria-label="下一单" title="下一单">›</button></div>`
    : '';
  document.getElementById('jobInfo').innerHTML=`<div class="jobinfo-h"><h3>当前工单</h3>${swHTML}</div>
    <div style="font-size:12.5px;line-height:1.8">
    <b>${j.story?'【剧情】':''}${j.cat} · ${j.name}</b><br>
    客户：${j.client}<br>
    <span style="color:#9cc4ff">能运行 ${j.sw}（${lv}）</span><br>
    ${j.hideScore?`判定：${lvlName(j)}　·　要跑 ${j.sw}${t.ram?`　·　内存 ≥ ${t.ram}G`:''}<br>`:`判定：${fmtTarget(t)||'能开机就行'}<br>`}
    部件费 <b style="color:#c2456b">${money(j.partBudget)}</b>　人工费 <b style="color:#7ee0a1">${money(Math.round(j.labor*laborMul()))}</b></div>`
    +(j.repair?repairHTML(j):'');
  document.querySelectorAll('#jobInfo [data-sw]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();switchJob(+b.dataset.sw);
  });
  if(j.repair){
    document.querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>doRepairFix(j.id,b.dataset.fix));
    const kb=document.querySelector('[data-kb]');
    if(kb)kb.onclick=()=>{const box=document.getElementById('kbBox');if(box)box.style.display=box.style.display==='none'?'':'none';};
  }
  renderBenchDOM();renderChecks();renderActionBar();
}
/* 必备件表：新增品类只改这里，检查项自动生成 */
const REQ_SLOTS=[
  ['case',  '机箱',  ()=>!!part('case'),                                     '缺少机箱'],
  ['mb',    '主板',  ()=>!!part('mb'),                                       '缺少主板'],
  ['cpu',   'CPU',   ()=>!!part('cpu'),                                      '缺少 CPU'],
  ['ram',   '内存',  ()=>ramTotal()>0,                                       '缺少内存'],
  ['psu',   '电源',  ()=>!!part('psu'),                                      '缺少电源'],
  ['cooler','散热器',()=>!!part('cooler'),                                   '缺少散热器'],
  ['disk',  '硬盘',  ()=>build.m2.some(Boolean)||build.sata.some(Boolean),   '缺少硬盘（没有存储装不了系统）']
];
/* 部件图标：由 3D 引擎预渲染，随页面内联，离线可用 */
let PART_PHOTO=(window.PART_PHOTO||{});
/* 套条没有自己的实拍图：按型号退回同型号单条那张（"...16G×2 套条" → "...16G 单条"） */
function photoOfModel(n){
  try{
    if(!n)return '';
    const P=(typeof PART_PHOTO!=='undefined')?PART_PHOTO:null;
    if(!P)return '';
    if(P[n])return P[n];
    const m=/^(.*?)(\d+)G×2 套条$/.exec(n);
    if(m&&P[m[1]+m[2]+'G 单条'])return P[m[1]+m[2]+'G 单条'];
  }catch(e){}
  return '';
}
const PART_ICON={gpu:__IMG76,cpu:__IMG77,ram:__IMG78,mb:__IMG79,psu:__IMG80,case:__IMG81,cooler:__IMG82,disk:__IMG83,m2:__IMG84};
/* pict：工作台的“渲染图”。CPU 一律用「丝印 + 插槽」代表图（同一个接口长一样），
   这是刻意的——台面上要的是“这块板/这颗 U 装在哪”，不是商品照。 */
function pict(part){if(!part)return '';try{const g=part.g||part.cat;if(part.s&&window.CPU_SOCK_IMG&&CPU_SOCK_IMG[part.s]&&(part.cs!=null||part.ig!=null||part.t!=null))return CPU_SOCK_IMG[part.s];}catch(e){}return photoOfModel(part.n);}
/* pictExact：商店卡片/仓库列表的“缩略图”。优先按型号精确匹配商品图，
   没有这个型号的图才退回接口代表图 —— 别再让 i3-6100 顶着 i5-9400F 的照片。 */
function pictExact(part){
  if(!part)return '';
  try{
    const ph=photoOfModel(part.n);
    if(ph)return ph;
  }catch(e){}
  return pict(part);
}
function partIcon(cat,kind,part,exact){const ph=part?(exact?pictExact(part):pict(part)):'';if(ph)return `<img class="pico photo" alt="" src="${ph}">`;const k=(cat==="disk"&&kind==="m2")?"m2":cat;const s=PART_ICON[k];return s?`<img class="pico" alt="" src="${s}">`:icon(k);}
function checks(){
  const b={case:part('case'),mb:part('mb'),cpu:part('cpu'),cooler:part('cooler'),
    gpu1:part('gpu1'),gpu2:part('gpu2'),psu:part('psu')};
  const out=[],add=(ok,m,soft)=>out.push({ok,m,soft:!!soft});
  REQ_SLOTS.forEach(([k,label,has,err])=>{if(!has())add(false,err);});
  if(b.cpu&&b.mb)add(b.cpu.s===b.mb.s,b.cpu.s===b.mb.s?'CPU 插槽匹配':'CPU '+b.cpu.s+' 与主板 '+b.mb.s+' 不匹配');
  if(b.mb){
    const bad=build.rams.filter(r=>r&&r.part.m!==b.mb.m);
    add(!bad.length,!bad.length?'内存代际匹配':'有内存条与主板代际不符');
    add(build.rams.filter(Boolean).length<=b.mb.dimm,'内存条数 '+build.rams.filter(Boolean).length+' / 槽位 '+b.mb.dimm);
    add(ramTotal()<=b.mb.max,'内存 '+ramTotal()+'G / 上限 '+b.mb.max+'G');
    const usedM2=build.m2.filter(Boolean).length,usedSata=build.sata.filter(Boolean).length;
    add(usedM2<=b.mb.m2,'M.2 已用 '+usedM2+' / '+b.mb.m2);
    add(usedSata<=b.mb.sata,'SATA 已用 '+usedSata+' / '+b.mb.sata);
  }
  if(b.cooler&&b.cpu)add(b.cooler.cap>=coolNeed(b.cpu),'散热 '+b.cooler.cap+'W / 需要 '+coolNeed(b.cpu)+'W（CPU 标称 '+b.cpu.t+'W）');
  if(b.cpu&&b.cooler&&!build.paste)add(false,'CPU 没涂硅脂，散热器压上去也白搭');
  if(b.cpu&&!build.paste&&!b.cooler)add(false,'CPU 还没涂硅脂',true);
  if(b.mb&&b.case)add(b.case.ff.includes(b.mb.ff),b.case.ff.includes(b.mb.ff)?'主板装得进机箱':'机箱不支持 '+b.mb.ff);
  if(b.gpu1&&b.case)add(b.case.mg>=b.gpu1.len,'显卡 '+b.gpu1.len+'mm / 限长 '+b.case.mg+'mm');
  if(b.gpu2&&b.gpu1)add(b.gpu1.n===b.gpu2.n,'双卡同型号');
  if(b.cpu&&!b.cpu.ig&&!b.gpu1)add(false,'该 CPU 无核显，必须装独立显卡');
  if(b.psu&&!repUnlocked())add(b.psu.w>=powerNeed(),'需要 '+powerNeed()+'W / 电源 '+b.psu.w+'W');
  /* 档位检查（旗舰单）：
       主板/电源/散热 必须是旗舰件；
       机箱/显卡/内存/硬盘 至少中端；
       CPU ≥ 9700X(19539)、显卡 ≥ 9070XT(30445)。
     中端单反过来：核心件别上旗舰件。 */
  try{
    const _gj=state.activeId?job():null;
    if(_gj&&_gj.grade&&!_gj.repair){
      const _FLAG_MIN={mb:'主板',psu:'电源',cooler:'散热'};
      const _MID_MIN={case:'机箱',gpu1:'显卡',ram:'内存',disk:'硬盘'};
      if(_gj.grade==='high'){
        const f=build;
        const missFlag=[];
        Object.keys(_FLAG_MIN).forEach(function(k){
          const it=f[k];
          if(k==='psu'&&!it)return;
          if(!it||!it.part){missFlag.push(_FLAG_MIN[k]+'(未装)');return;}
          if(it.part.tier!=='flag')missFlag.push(_FLAG_MIN[k]);
        });
        add(!missFlag.length,missFlag.length?('旗舰单：'+missFlag.join('、')+' 不是旗舰件'):'旗舰单：主板/电源/散热都是旗舰');
        const lowMid=[];
        if(f.case&&f.case.part&&f.case.part.tier==='budget')lowMid.push('机箱');
        if(f.gpu1&&f.gpu1.part&&f.gpu1.part.tier==='budget')lowMid.push('显卡');
        build.rams.forEach(function(r){if(r&&r.part&&r.part.tier==='budget')lowMid.push('内存');});
        build.m2.concat(build.sata).forEach(function(d){if(d&&d.part&&d.part.tier==='budget')lowMid.push('硬盘');});
        add(!lowMid.length,lowMid.length?('旗舰单：'+lowMid.join('、')+' 只是低端件'):'旗舰单：机箱/显卡/内存/硬盘都在中端以上');
        /* 旗舰单：整套必须全新 */
        const _used=[];
        ['case','mb','cpu','cooler','psu','gpu1','gpu2'].forEach(function(k){
          if(f[k]&&f[k].shop==='xianyu')_used.push(({case:'机箱',mb:'主板',cpu:'CPU',cooler:'散热',psu:'电源',gpu1:'显卡',gpu2:'显卡2'})[k]);
        });
        build.rams.forEach(function(r){if(r&&r.shop==='xianyu')_used.push('内存');});
        build.m2.concat(build.sata).forEach(function(d){if(d&&d.shop==='xianyu')_used.push('硬盘');});
        add(!_used.length,_used.length?('旗舰单：'+_used.join('、')+' 用了二手，必须全新'):'旗舰单：全套全新');
        if(f.cpu&&f.cpu.part)add((f.cpu.part.cs||0)>=19539,'旗舰单：CPU 跑分 '+(f.cpu.part.cs||0)+' / 要求 ≥19539（9700X 级）');
        if(f.gpu1&&f.gpu1.part)add((f.gpu1.part.ts||0)>=30445,'旗舰单：显卡跑分 '+(f.gpu1.part.ts||0)+' / 要求 ≥30445（9070XT 级）');
      }else if(_gj.grade==='mid'){
        /* 中端单不做硬检查：玩家以赚钱为主，自然不会给中端单塞旗舰件。
           这里只留一句提示，不产生红叉。 */
      }
    }
  }catch(e){}
  const rams=build.rams.filter(Boolean);
  const _jj=state.activeId?job():null;
  if(_jj&&_jj.minMhz&&rams.length&&!_jj.repair){
    const low=Math.min(...rams.map(r=>r.part.mhz||0));
    add(low>=_jj.minMhz,"内存频率 "+low+"MHz / 客户要求 ≥ "+_jj.minMhz+"MHz");
  }
  if(rams.length>1){
    const names=new Set(rams.map(r=>r.part.n)),j=job();
    if(names.size>1&&!(j&&j.tight))add(false,'内存混搭：客户不接受不同型号混插（只有极低预算客户才容忍）');
    const frs=new Set(rams.map(r=>r.part.mhz).filter(Boolean));
    if(frs.size>1)add(false,'内存频率不一致（'+[...frs].join('/')+'MHz），会降到最低频率跑',true);
  }
  return out;
}

/* ---- 动效工具：改一个类、播完就摘，不残留 ---- */
let _lastLeftKey='',_suppressStagger=false;
function animPulse(el,cls,ms){
  if(!el)return;
  try{
    el.classList.remove(cls);
    void el.offsetWidth;            /* 强制重排，让动画能重播 */
    el.classList.add(cls);
    setTimeout(()=>{try{el.classList.remove(cls);}catch(e){}},ms||520);
  }catch(e){}
}
let _benchSig='', _listKey='', _wasAllGreen=false, _lastPanel='', _lastProfit=null, _readyUntil=0;
/* 工作台内容变了 → 闪一下（装配/拆件/换件都会走到这里） */
function animBench(){
  try{
    const b=build||{};
    const sig=[
      b.case&&b.case.part&&b.case.part.n, b.mb&&b.mb.part&&b.mb.part.n,
      b.cpu&&b.cpu.part&&b.cpu.part.n, b.cooler&&b.cooler.part&&b.cooler.part.n,
      b.psu&&b.psu.part&&b.psu.part.n, b.gpu1&&b.gpu1.part&&b.gpu1.part.n,
      b.gpu2&&b.gpu2.part&&b.gpu2.part.n,
      (b.rams||[]).filter(Boolean).map(x=>x.part&&x.part.n).join(','),
      (b.m2||[]).filter(Boolean).length,(b.sata||[]).filter(Boolean).length
    ].join('|');
    if(_benchSig&&sig!==_benchSig){
      animPulse(document.getElementById('panelMid'),'benchPulse',780);
      animPulse(document.getElementById('art2d'),'artPulse',680);
    }
    _benchSig=sig;
  }catch(e){}
}
function renderChecks(){
  const j=state.activeId?job():null,cost=totalCost(),pwr=powerParts(),need=powerNeed(),pw=part('psu')?part('psu').w:0;
  const budget=j?j.partBudget:0;
  const bd=pwr.map(([n,w])=>`${n} ${w}`).join(' · ');
  /* 第三周起不再提示电源够不够：客户会验机，玩家得自己判断 */
  const _powerHtml=repUnlocked()?'':`<div style="font-size:12px;color:#8b93a1">功耗 ${need}W / 电源 ${pw||'—'}W</div>
      <div class="pwrbd">${bd}</div>
      <div class="bar"><i style="width:${Math.min(100,Math.round(need/Math.max(pw||need,1)*100))}%" class="${pw&&need>pw?'over':''}"></i></div>`;
  document.getElementById('checks').innerHTML=
    (j?`<div style="font-size:12px;color:#8b93a1">花掉 <b style="color:#fff">${money(cost)}</b> / 预算 ${money(budget)}</div>
      <div class="bar"><i style="width:${Math.min(100,Math.round(cost/Math.max(budget,1)*100))}%" class="${cost>budget?'over':''}"></i></div>${_powerHtml}`:'')
    +checks().map(c=>`<div class="chk ${c.soft?'warn':(c.ok?'ok':'no')}"><span class="i">${c.soft?'!':(c.ok?'✓':'✕')}</span><span>${c.m}</span></div>`).join('');
  {
    /* 全部变绿的那一刻给整列一个脉冲，比逐行变色更容易注意到 */
    const rows=[...document.querySelectorAll('#checks .chk')];
    const allGreen=rows.length>0&&rows.every(r=>r.classList.contains('ok')||r.classList.contains('warn'));
    if(allGreen&&!_wasAllGreen){
      animPulse(document.getElementById('checks'),'allGreen',820);
      /* 交付按钮每次渲染都会重建，不能对它做一次性脉冲，得记个截止时间 */
      _readyUntil=Date.now()+2600;
    }
    _wasAllGreen=allGreen;
  }
  if(j){
    const labor=jobLabor(j),spare=budget-cost;
    document.getElementById('deliverBox').innerHTML=`<h3>交付</h3>
      <div style="font-size:12.5px;line-height:1.9">成本 <b>${money(cost)}</b>　部件费 <b>${money(budget)}</b><br>
      人工费 <b style="color:#7ee0a1">${money(labor)}</b><br>
      预计利润 <b style="color:${spare+labor>=0?'#7ee0a1':'#f08a8a'}">${money(spare+labor)}</b></div>
      <div style="display:flex;gap:6px;margin-top:9px;flex-wrap:wrap">
      <button class="primary" id="btnDeliver">开机测试并交付</button>
      ${j.story?`<button class="btn-soft" id="btnClearBench">清空工作台</button>`:`<button class="bad" id="btnAbandon">放弃本单</button>`}</div>`;
    document.getElementById('btnDeliver').onclick=confirmDeliver;
    try{if(_readyUntil&&Date.now()<_readyUntil)document.getElementById('btnDeliver').classList.add('readyPulse');}catch(e){}
    try{
      const box=document.getElementById('deliverBox');
      const el=[...box.querySelectorAll('b')].find(x=>x.textContent==='¥'+money(spare+labor).replace('¥',''))
             ||box.querySelector('b:last-of-type');
      const key=(spare+labor)|0;
      if(_lastProfit!==null&&_lastProfit!==key&&el)animPulse(el,'numPop',520);
      _lastProfit=key;
    }catch(e){}
    const ab=document.getElementById('btnAbandon');if(ab)ab.onclick=()=>{
      const cur=state.activeId?job():null;
      modal('放弃本单','已装的件会退回仓库，客户给差评。确认？',()=>{
        ['case','psu','mb','cpu','cooler','gpu1','gpu2'].forEach(k=>{if(slotHas(k))removeSlot(k);});
        build.rams.forEach((r,i)=>{if(r)removeSlot('ram'+i);});
        build.m2.forEach((r,i)=>{if(r)removeSlot('m2'+i);});
        build.sata.forEach((r,i)=>{if(r)removeSlot('sata'+i);});
        if(cur){
          cur.status='rejected';
          if(cur.story){state.story.done[cur.storyId]=true;}
        }
        if(cur)state.inv=state.inv.filter(x=>x.owner!==cur.id);
        if(cur){dropMachinesOfJob(cur.id);}
        if(cur&&state.benches)delete state.benches[cur.id];
        state.activeId=null;build=newBuild();state.panel='jobs';save();renderAll();});
    };
    const cb=document.getElementById('btnClearBench');
    if(cb)cb.onclick=()=>{
      /* 客户的整机不抖散：先把自带的件收进整机、整机回仓库，再收玩家自己的件 */
      const mid=state.benchMachines&&state.benchMachines[state.activeId];
      const md=(mid?getMachine(mid):null)
        || (state.machines||[]).find(m=>m.onBench&&m.jobId===state.activeId)
        || (state.machines||[]).find(m=>m.onBench&&!m.jobId)||null;
      let back=0;
      if(md)back=machineBackToInv(md);
      ['case','psu','mb','cpu','cooler','gpu1','gpu2'].forEach(k=>{if(build[k])removeSlot(k);});
      build.rams.forEach((r,i)=>{if(r)removeSlot('ram'+i);});
      build.m2.forEach((r,i)=>{if(r)removeSlot('m2'+i);});
      build.sata.forEach((r,i)=>{if(r)removeSlot('sata'+i);});
      save();renderAll();
      toast(md?'旧机已整机收回仓库'+(back?'（'+back+' 个件）':''):'工作台已清空，工单还在');
    };
  }else document.getElementById('deliverBox').innerHTML='';
}
let _tutNavKey=null,_tutNavBusy=false;
function tutAutoNav(){
  if(_tutNavBusy)return;
  try{
    const t=state.tut;
    if(!t||t.guideOff||state.day>1)return;
    const st=(typeof coachStep==='function')?coachStep():null;
    if(!st||_tutNavKey===st.k)return;
    _tutNavKey=st.k;
    _tutNavBusy=true;
    try{coachGo(st);}finally{_tutNavBusy=false;}
  }catch(e){}
}
function renderAll(){try{updateDebtUI();}catch(e){}
  /* 换页 / 换分类之前先把旧引导收掉：不然会出现「商店/仓库已经切过去了，
     上一件货的框还亮着」，等 0.3~1 秒才消失的错位。 */
  try{
    const _c=document.getElementById('coach');
    if(_c&&_c.classList.contains('on')&&_coachPageSig!==_coachSig())coachHide();
  }catch(e){}

  try{renderMNav();}catch(e){}
  renderHeader();renderMobileBar();renderLeft();renderBench();tbRender();
  /* 手机壳：没有在施工单时，工作台/检查两页没有意义，自动退回单据页 */
  try{
    if(isMobile()&&!state.activeId&&mView==='bench')mViewSet('docs',true);
  }catch(e){}
  try{resetCardScrolls();}catch(e){}
  setTimeout(()=>{try{animBench();}catch(e){}},20);
  try{
    if(_lastPanel!==state.panel){
      _lastPanel=state.panel;
      animPulse(document.getElementById('leftBody'),'panelIn',260);
    }
  }catch(e){}
  setTimeout(()=>{try{coachRefresh();}catch(e){}},80);
  setTimeout(()=>{try{maybeStoryPopup();}catch(e){}},700);
}
/* 手机上切页签 / 从槽位跳到仓库后，把视口带回顶部，不然像没反应 */
function forceDocsView(){
  try{
    mView='docs';
    document.body.dataset.view='docs';
    const nav=document.getElementById('mNav');
    if(nav)nav.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view==='docs'));
  }catch(e){}
}
function scrollLeftTop(){
  try{
    forceDocsView();
    window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){try{window.scrollTo(0,0);}catch(e2){}}
}
/* ================= 交付演出 ================= */
/* 「回工单列表」：交付后状态其实已经是 jobs 了，旧实现只是把同一个状态再点一遍，
   看起来就是按了没反应。现在真的做三件事：收起交付卡、切回单据页、滚到列表顶部，
   并按剩余单量给一句提示（没单了就提示可以打烊）。 */
function backToJobs(){
  state.panel='jobs';
  const r=document.getElementById('result');
  if(r){r.className='';r.innerHTML='';}
  const open=state.jobs.filter(j=>j.status==='open').length;
  const taken=state.jobs.filter(j=>j.status==='taken').length;
  if(typeof isMobile==='function'&&isMobile())mViewSet('docs',true);
  save();renderAll();
  try{
    const pl=document.getElementById('panelLeft');
    if(pl)pl.scrollTop=0;
    window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){}
  /* 只有「没接的单」和「接了没交的单」都清零，才叫处理完 */
  if(taken>0)toast('还有 '+taken+' 单接了没交付');
  else if(open>0)toast('还有 '+open+' 单没接');
  else toast('今天的单都处理完了，可以打烊');
}
function playHandover(box,finalHTML,sc,onDone){
  const finish=()=>{
    const bk=document.getElementById('btnBackJobs');
    if(bk)bk.onclick=backToJobs;
    if(typeof onDone==='function')onDone();
  };
  if(typeof requestAnimationFrame!=='function'||typeof setInterval!=='function'){
    box.innerHTML=finalHTML;finish();return;
  }
  const ov=document.createElement('div');
  ov.id='hoOverlay';ov.className='ho-overlay';
  ov.innerHTML='<div class="ho-card" id="hoCard"></div>';
  document.body.appendChild(ov);
  const card=document.getElementById('hoCard');
  const close=()=>{const x=document.getElementById('hoOverlay');if(x)x.remove();};
  const abort=()=>{close();box.className='result pass';box.dataset.job='';box.innerHTML=finalHTML;finish();};
  card.innerHTML=`<div class="ho-title"><span class="dot"></span>开机自检</div>
    <div class="ho-lines" id="hoLines"></div>`;
  const names=['BIOS 自检','CPU 识别','内存 训练','显卡 识别','风扇 转速'];
  const vals=['OK','OK',Math.round(sc.ram)+'G · OK','OK','安静'];
  let i=0;
  const timer=setInterval(()=>{
    const el=document.getElementById('hoLines');
    if(!el){clearInterval(timer);abort();return;}
    el.insertAdjacentHTML('beforeend',`<div class="ho-line"><span>${names[i]}</span><b>${vals[i]}</b></div>`);
    i++;
    if(i>=names.length){clearInterval(timer);setTimeout(stageBench,360);}
  },200);
  function stageBench(){
    if(!document.getElementById('hoCard')){abort();return;}
    try{SFX.bench();}catch(e){}
    card.innerHTML=`<div class="ho-title"><span class="dot"></span>跑分测试</div>
      <div class="ho-bar"><i id="hoBar"></i></div>
      <div class="ho-score">
        <div>Time Spy<b id="hoTs">0</b></div>
        <div>Cinebench R23<b id="hoCb">0</b></div>
        <div>内存<b id="hoRam">0G</b></div>
      </div>`;
    const bar=document.getElementById('hoBar'),t0=performance.now(),dur=1200;
    const tick=tt=>{
      const k=Math.min(1,(tt-t0)/dur),e=1-Math.pow(1-k,2.2);
      if(bar)bar.style.width=(k*100).toFixed(1)+'%';
      const ts=document.getElementById('hoTs'),cb=document.getElementById('hoCb'),rm=document.getElementById('hoRam');
      if(ts)ts.textContent=Math.round(sc.ts*e).toLocaleString();
      if(cb)cb.textContent=Math.round(sc.cs*e).toLocaleString();
      if(rm)rm.textContent=Math.round(sc.ram*e)+'G';
      if(k<1)requestAnimationFrame(tick);
      else setTimeout(()=>{try{SFX.benchDone();}catch(e){}close();box.className='result pass';box.dataset.job='';box.innerHTML=finalHTML;finish();},280);
    };
    requestAnimationFrame(tick);
  }
  ov.onclick=e=>{if(e.target===ov)abort();};
}function failResult(box,html,msg){
  box.className='result fail';box.dataset.job=String(state.activeId||'');box.innerHTML=html;
  try{toast(msg);}catch(e){}
  try{scrollElIntoView(box,{center:true});}catch(e){}
}
/* 口碑跌破底线：店黄了 */
/* ================= 生活：买车买房 =================
   钱得有地方花：车和房子都是纯消费品，买了以后显示在页眉，不提供数值加成。 */
const LIFE_CARS=[
  {id:'bike', n:'电动车',price:2800, d:'先有个代步的，跑配件市场方便'},
  {id:'fit',  n:'二手飞度',price:38000, d:'能装下整台机箱和显示器，下雨不用愁'},
  {id:'suv',  n:'城市 SUV',price:168000, d:'客户的大机箱、显示器，一趟拉完'},
  {id:'coupe',n:'轿跑',price:420000, d:'纯属给自己看的'},
];
const LIFE_HOUSES=[
  {id:'rent', n:'继续租房',price:0, d:'楼上那间，月租照付'},
  {id:'flat', n:'小两居',price:520000, d:'把店和住处分开，晚上能睡个整觉'},
  {id:'shop', n:'临街铺面',price:980000, d:'底下开店，楼上住人，招牌能挂出去'},
  {id:'villa',n:'联排',price:2400000, d:'别人来店里，会先看见你家院子'},
];
function openLife(){
  state.life=state.life||{car:null,house:null};
  const row=(it,kind)=>{
    const owned=state.life[kind]===it.id;
    const can=state.cash>=it.price;
    return `<div class="slotrow" style="margin-bottom:7px">
      <div class="h"><div class="nm">${it.n}</div>
        <div style="font-size:11px;color:${owned?'#7de0a8':(can?'#ffd27a':'#8b93a1')}">${owned?'已拥有':money(it.price)}</div></div>
      <div class="meta">${it.d}</div>
      <div class="btns">${owned?'':`<button class="mini" data-buy-life="${kind}:${it.id}" ${can?'':'disabled'}>${can?'买下':'钱不够'}</button>`}</div>
    </div>`;
  };
  modal('生活 · 花点钱',
    `<div style="font-size:11.5px;color:#8b93a1;line-height:1.7;margin-bottom:10px">
       车和房子不带来任何数值加成，就是花钱的地方。
     </div>
     <div style="font-size:11px;color:#b08e63;letter-spacing:1.5px;margin:2px 0 7px">车</div>
     ${LIFE_CARS.map(x=>row(x,'car')).join('')}
     <div style="font-size:11px;color:#b08e63;letter-spacing:1.5px;margin:10px 0 7px">房子</div>
     ${LIFE_HOUSES.map(x=>row(x,'house')).join('')}`,
    ()=>{});
  const no=document.getElementById('mNo');if(no)no.style.display='';
  const yes=document.getElementById('mYes');if(yes)yes.textContent='关闭';
  document.querySelectorAll('[data-buy-life]').forEach(b=>b.onclick=()=>{
    const [kind,id]=b.dataset.buyLife.split(':');
    const list=kind==='car'?LIFE_CARS:LIFE_HOUSES;
    const it=list.find(x=>x.id===id);if(!it)return;
    if(state.cash<it.price){toast('钱不够');return;}
    state.cash-=it.price;state.todayOut=(state.todayOut||0)+it.price;
    state.life[kind]=id;save();renderAll();closeMask(document.getElementById('mask'));
    toast('买下了：'+it.n);
  });
}
/* 已完成工单：交过的机器都能翻出来看配置、要求和利润 */
function openHistory(){
  const list=(state.done||[]).slice().reverse();
  const fmtT=t=>{
    const b=[];
    if(t&&t.ts>0)b.push('3DMark ≥ '+t.ts.toLocaleString());
    if(t&&t.cs>0)b.push('Cinebench ≥ '+t.cs.toLocaleString());
    if(t&&t.ram)b.push('内存 ≥ '+t.ram+'G');
    return b.join('　')||'无硬性要求';
  };
  const body=list.length?`<div style="max-height:58vh;overflow:auto;padding-right:2px">
    ${list.map(d=>`<div class="slotrow" style="margin-bottom:7px">
      <div class="h"><div class="nm">第 ${d.day} 天 · ${d.client}</div>
        <div style="font-size:11.5px;color:${d.income>=0?'#7de0a8':'#ff9c92'}">利润 ${money(d.income)}</div></div>
      <div class="meta">${d.cat} · ${d.name||''}<br>软件 ${d.sw}</div>
      <div class="meta">要求 ${fmtT(d.target)}</div>
      <div class="meta">实测 3DMark ${(d.ts||0).toLocaleString()}　Cinebench ${(d.cs||0).toLocaleString()}　内存 ${d.ram}G${d.caught?'　<span style="color:#ff9c92">被客户发现</span>':''}</div>
      <div class="meta" style="font-size:10.5px;line-height:1.7">配置：${(d.parts||[]).join(' · ')||'—'}</div>
      <div class="meta" style="font-size:10.5px">部件费 ${money(d.budget)}　成本 ${money(d.cost)}　人工 ${money(d.labor)}　当日口碑 ${d.rep} 星</div>
    </div>`).join('')}</div>`
    :'<div style="font-size:12px;color:#8b93a1;line-height:1.9">还没交付过工单。<br>交完一单就会记在这里：装了什么、要求多少、赚了多少。</div>';
  modal('已完成工单'+(list.length?`（${list.length} 单）`:''),body,()=>{});
  const no=document.getElementById('mNo');if(no)no.style.display='none';
  const yes=document.getElementById('mYes');if(yes)yes.textContent='关闭';
}
function gameOver(){
  const ov=document.createElement('div');
  ov.className='ho-overlay';ov.id='gameOverOverlay';
  ov.innerHTML=`<div class="ho-card" style="text-align:center">
    <div style="font-size:11px;letter-spacing:4px;color:#b08e63">口碑 ${repLabel()}</div>
    <div style="font-size:24px;font-weight:800;color:#ff9c92;margin:10px 0 6px">店，开不下去了</div>
    <div style="font-size:12.5px;color:#c9bba6;line-height:1.9">
      第 ${state.day} 天，街坊之间已经传开了：这家店的机器不太行。<br>
      门口那张「装机」的牌子，你摘下来的时候是下午。
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
      <button class="primary" id="goRestart">重新开张</button>
    </div></div>`;
  document.body.appendChild(ov);
  const b=document.getElementById('goRestart');
  if(b)b.onclick=()=>{try{localStorage.removeItem(SAVE);}catch(e){}location.reload();};
}
/* 交付前确认：交付是不可逆的（件随单交出、单子关闭） */
function confirmDeliver(){
  const j=state.activeId?job():null;
  if(!j){deliver();return;}
  let cost=0;try{cost=buildCost();}catch(e){}
  const labor=jobLabor(j);
  modal('确认交付？',
    `<b>${j.client}</b> 的《${j.sw}》<br>
     <span style="font-size:12px;color:#b9aa96">本单成本 ${money(cost)}　人工费 ${money(labor)}</span><br>
     <span style="font-size:11.5px;color:#8b93a1">交付后装机件随单交出、工单关闭，不能反悔。</span>`,
    ()=>deliver());
  const no=document.getElementById('mNo'),yes=document.getElementById('mYes');
  if(no)no.textContent='再检查一下';
  if(yes)yes.textContent='确认交付';
}
function deliver(){
  const j=state.activeId?job():null;
  const box=document.getElementById('result');
  if(!j){box.className='';box.innerHTML='';toast('当前没有在施工单');return;}
  const cost=totalCost(),sc=totalScore();
  const bad=checks().filter(c=>!c.ok&&!c.soft);
  /* 真·开不了机（缺件、插槽不对、装不进、尺寸不够）还是一律打回；
     客户要求类（内存频率、混插）算「能开机但会被挑毛病」，第三周起可以硬交 */
  const HARD_RE=/缺少|不匹配|不支持|装不进|限长|双卡|无核显|代际|条数|已用|上限/;
  const hardBad=bad.filter(c=>HARD_RE.test(c.m));
  const softBad=bad.filter(c=>!HARD_RE.test(c.m));
  if(hardBad.length){
    failResult(box,'<b>开不了机</b><br>'+hardBad.map(b=>'· '+b.m).join('<br>'),'开不了机：'+hardBad[0].m);
    return;
  }
  const t=j.target,fails=[];
  if(j.repair){
    const f=j.repair.fault,d=repState(j.id);
    const all=[build.case,build.psu,build.mb,build.cpu,build.cooler,build.gpu1,build.gpu2,
      ...build.rams,...build.m2,...build.sata].filter(Boolean);
    if(f==='dust'){ if(!d.dust)fails.push('一进游戏还是自动关机——灰和硅脂根本没处理'); }
    else if(f==='os'){ if(!d.os)fails.push('系统没重装，蓝屏原封不动'); }
    else if(all.some(s=>s.faulty||(s.part&&s.part.faulty)))
      fails.push('换下来的不是坏件——真正的故障件还在机器里');
  }else{
    if(sc.ts<t.ts)fails.push(`3DMark 差 ${(t.ts-sc.ts).toLocaleString()}`);
    if(sc.cs<t.cs)fails.push(`Cinebench 差 ${(t.cs-sc.cs).toLocaleString()}`);
    if(t.ram&&sc.ram<t.ram)fails.push(`内存 ${sc.ram}G 不足 ${t.ram}G`);
  }
  if(j.newOnly){
    const all=[build.case,build.psu,build.mb,build.cpu,build.cooler,build.gpu1,build.gpu2,
      ...build.rams,...build.m2,...build.sata].filter(Boolean);
    const used=all.filter(s=>s.shop==='xianyu');
    if(used.length)fails.push(`客户只要全新件，你用了 ${used.length} 个二手件`);
  }
  if(j.newFor&&j.newFor.length){
    const nm={case:'机箱',psu:'电源',cooler:'散热'};
    const bad=j.newFor.filter(k=>build[k]&&build[k].shop==='xianyu').map(k=>nm[k]||k);
    if(bad.length)fails.push('客户要求 '+bad.join('/')+' 用全新件');
  }
  if(j.gpuPref){
    const gs=[build.gpu1,build.gpu2].filter(Boolean);
    if(gs.some(s=>j.gpuPref==='nvidia'?!isNVIDIA(s.part):!isAMD(s.part)))
      fails.push(`客户指定要 ${prefName(j.gpuPref)} 显卡`);
  }
  if(!j.repair&&j.cat==='工作机'&&j.tier===0&&ramTotal()<128)fails.push('内存不足 128G');
  if(!j.repair&&j.cat==='工作机'&&j.tier===1&&!(build.gpu1&&build.gpu2))fails.push('没有装双卡');
  if(!j.repair&&j.cat==='工作机'&&j.tier===2){
    const hdd=build.sata.filter(s=>s&&s.part.kind==='hdd').length;
    if(hdd<4)fails.push('HDD 少于 4 块');
  }
  if(!j.repair&&j.cat==='游戏机'&&j.tier===2&&(!build.cooler||build.cooler.part.rad===0))fails.push('没有装水冷');
  /* 第三周起：不再拦着你交付，改成「客户自己验机」 */
  const _psuNow=part('psu');
  const _powerBad=!!(_psuNow&&_psuNow.w<powerNeed());
  const _missList=fails.slice();
  softBad.forEach(c=>_missList.push(c.m));
  if(_powerBad&&!_missList.some(x=>x.indexOf('电源')>=0))_missList.push('电源 '+_psuNow.w+'W 带不动，实测需要 '+powerNeed()+'W');
  const _missed=_missList.length>0;
  if(_missed&&!repUnlocked()){
    if(j.repair){const d=repState(j.id);d.mistakes=(d.mistakes||0)+1;save();}
    failResult(box,'<b>跑不动客户要的软件</b><br>'+fails.map(f=>'· '+f).join('<br>')+
      `<br><br>实测 Time Spy ${sc.ts.toLocaleString()}　Cinebench ${sc.cs.toLocaleString()}　内存 ${sc.ram}G`,
      '没达标：'+fails[0]);return;}
  /* 验机：不达标就有概率被发现；10 单内问题越多越容易被抓 */
  let _caught=false,_repNote='';
  if(repUnlocked()){
    if(_missed){
      const p=repCatchChance();
      _caught=Math.random()<p;
      if(_caught){
        const before=repScore();
        repApply(false);
        const after=repScore();
        _repNote='客户验机发现问题（'+_missList[0]+'），口碑 '+before.toFixed(1)+' → '+after.toFixed(1);
      }else{
        _repNote='客户没看出来，这次糊弄过去了（但 10 单里问题越多越容易被抓）';
      }
    }else{
      const before=repScore();
      repApply(true);
      _repNote='客户验机满意，口碑 '+before.toFixed(1)+' → '+repScore().toFixed(1);
    }
  }
  try{SFX.success();}catch(e){}
  /* 通过 */
  const labor=jobLabor(j);
  /* 差价全部归玩家（不做分成）。超预算时玩家自己承担。 */
  const income=j.partBudget+labor-cost;
  const billed=j.partBudget+labor;
  const snap=JSON.parse(JSON.stringify(build));
  state.cash+=billed;state.todayIn=(state.todayIn||0)+billed;if(j.story)state.todayStory=(state.todayStory||0)+1;
  const notes=[];
  state.inv=state.inv.filter(x=>x.owner!==j.id);
  state.jobs=state.jobs.filter(x=>x.id!==j.id);
  /* 剧情结算 */
  let storyAfter='',storyReward='';
  if(j.story){
    const s=storyDef(j.storyId);
    state.story.done[j.storyId]=true;
    if(s){
      if(s.saveTo){
        state.customers[s.saveTo]=state.customers[s.saveTo]||{name:s.saveTo};
        state.customers[s.saveTo].machine=snap;
      }
      const rw=s.reward||{};
      if(rw.money){state.cash+=rw.money;state.todayIn=(state.todayIn||0)+rw.money;}

      if(rw.flag){state.story.flags[rw.flag]=true;}
      if(rw.gift){
        (Array.isArray(rw.gift)?rw.gift:[rw.gift]).forEach(g=>{
          addInv({cat:g.cat,part:{n:'坏的 '+(g.name||'零件'),broken:true,from:g.name,sell:g.sell||30},paid:0,shop:'own'});
        });
      }
      storyAfter=s.after||'';
      storyReward=rw.note||'';
    }
  }
  state.tut=state.tut||{done:{},hidden:false};state.tut.done.deliver=true;
  if(_repNote)notes.push(_repNote);
  /* 留一份「已完成工单」：装了哪些件、要求是什么、赚了多少，以后能翻 */
  try{
    const _parts=[];
    const _push=x=>{if(x&&x.part&&x.part.n)_parts.push(x.part.n);};
    _push(snap.case);_push(snap.mb);_push(snap.cpu);_push(snap.cooler);_push(snap.psu);
    _push(snap.gpu1);_push(snap.gpu2);
    (snap.rams||[]).forEach(_push);(snap.m2||[]).forEach(_push);(snap.sata||[]).forEach(_push);
    state.done=state.done||[];
    state.done.push({
      day:state.day,date:state.date,id:j.id,client:j.client||'客户',cat:j.cat,name:j.name,sw:j.sw,
      level:j.level,target:{ts:j.target.ts,cs:j.target.cs,ram:j.target.ram},
      ts:sc.ts,cs:sc.cs,ram:sc.ram,parts:_parts,
      cost:cost,budget:j.partBudget,labor:labor,income:income,
      missed:_missList.slice(0,3),caught:!!_caught,rep:+repScore().toFixed(1)
    });
    if(state.done.length>60)state.done=state.done.slice(-60);
  }catch(e){}
  if(state.benches)delete state.benches[j.id];
  dropMachinesOfJob(j.id);
  /* 交付完别把玩家丢回空工作台：还有接了没做的单就直接切过去。
     （以前这里一律 activeId=null，玩家得回列表再点一次「切换」） */
  const _nextTaken=(state.jobs||[]).find(x=>x.status==='taken');
  if(_nextTaken){
    state.activeId=_nextTaken.id;
    build=state.benches[_nextTaken.id]||newBuild();
  }else{
    state.activeId=null;build=newBuild();
  }
  state.panel='jobs';
  if(isMobile())mViewSet('docs',true);
  box.className='result pass';
  const _finalHTML=`<b>交付成功，工单已关闭</b><br>
    ${j.client} 的 ${j.sw}<br>实测 TS ${sc.ts.toLocaleString()}　CB ${sc.cs.toLocaleString()}　内存 ${sc.ram}G<br>
    成本 ${money(cost)}　部件费 ${money(j.partBudget)}　人工费 ${money(labor)}<br>
    <b style="color:#7ee0a1">利润 ${money(income)}</b>
    ${notes.length?'<br><span style="color:#c2456b">'+notes.join('<br>')+'</span>':''}
    ${storyAfter?`<div style="margin-top:9px;padding:8px 10px;border-radius:9px;background:rgba(255,203,107,.10);border-left:2px solid var(--gold);font-size:12px;color:#ffe0a3">「${storyAfter}」</div>`:''}
    ${storyReward?`<div style="margin-top:6px;font-size:11.5px;color:var(--gold)">${storyReward}</div>`:''}
    ${_nextTaken?`<div style="margin-top:7px;font-size:11.5px;color:#c2456b" >已自动切到下一单：${_nextTaken.name}</div>`:''}
    <div style="display:flex;gap:6px;margin-top:11px;flex-wrap:wrap">
      <button class="primary" id="btnBackJobs">回工单列表</button></div>
    <div style="font-size:11px;color:var(--dim);margin-top:7px">（已装的部件随单交出，本次工单不再出现在列表里）</div>`;
  save();renderAll();
  toast('交付成功 ＋'+money(income));
  if(repUnlocked()&&repScore()<REP_BUST){setTimeout(()=>{try{gameOver();}catch(e){}},2600);}
  const spare=Math.max(0,j.partBudget-cost);   /* 计算利润余地：v0.6.0 漏了这个变量，一交付就 ReferenceError */
  const _margin=spare/Math.max(j.partBudget,1);
  const _fb=_margin>0.5?'客户很满意，说下次还找你。':(_margin>0.3?'客户挺满意，钱当场就结了。':'客户没多说什么，钱给了。');
  playHandover(box,_finalHTML,sc,()=>{
    modal('交付完成',
      `<div style="font-size:13px;line-height:1.9">
        <b>${j.client}</b> 的《${j.sw}》已经收走了。<br>
        <span style="font-size:11.5px;color:#8b93a1">实测 TS ${sc.ts.toLocaleString()}　CB ${sc.cs.toLocaleString()}　内存 ${sc.ram}G</span>
      </div>
      <div style="margin-top:10px;padding:11px 13px;border-radius:11px;background:rgba(255,176,84,.10);border:1px solid rgba(255,176,84,.22)">
        <div style="font-size:11px;color:#b08e63;letter-spacing:1px">本单利润</div>
        <div style="font-size:24px;font-weight:800;color:#7de0a8">${money(income)}</div>
        <div style="font-size:11px;color:#8b93a1">部件费 ${money(j.partBudget)}　成本 ${money(cost)}　人工 ${money(labor)}</div>
      </div>
      <div style="margin-top:9px;font-size:12px;color:#d8c9b4">「${_fb}」</div>
      ${storyAfter?`<div style="margin-top:8px;padding:8px 10px;border-radius:9px;background:rgba(255,203,107,.10);border-left:2px solid var(--gold);font-size:12px;color:#ffe0a3">「${storyAfter}」</div>`:''}
      `,()=>{backToJobs();});
    const no=document.getElementById('mNo');if(no)no.style.display='none';
    const yes=document.getElementById('mYes');if(yes)yes.textContent='继续接单';
  });
}
/* ================= 剧情弹窗 =================
   剧情单不再只躺在左侧列表里当聊天记录：有新的剧情人物上门时弹出窗口，
   逐句出话，看完可以直接「接这单」。每条剧情只自动弹一次（story.seen 记着），
   之后的对话仍然保留在工单列表里。 */
function playStory(sd,j,onDone){
  if(typeof sceneBusy==='function'&&sceneBusy('storyPop')){return false;}
  const old=document.getElementById('storyPop');if(old)old.remove();
  const lines=(sd.lines||[]).slice(0,4);
  const ov=document.createElement('div');
  ov.className='story-pop';ov.id='storyPop';
  ov.innerHTML=`<div class="sp-card">
    <div class="sp-hd">${(function(){
      try{
        const _im=(typeof CHAR_AVATAR!=='undefined')&&CHAR_AVATAR[sd.who];
        if(_im)return '<div class="sp-av"><img src="'+_im+'" alt=""></div>';
      }catch(e){}
      return '<div class="sp-av" style="background:'+(sd.col||'#5b8cff')+'">'+(sd.av||'客')+'</div>';
    })()}
      <div><div class="sp-who">${sd.who||'客户'}</div><div class="sp-role">${sd.role||''}</div></div>
      <div class="sp-day">第 ${state.day} 天</div></div>
    <div class="sp-lines">${lines.map((x,i)=>`<div class="sp-line" style="animation-delay:${(0.1+i*0.26).toFixed(2)}s">${x}</div>`).join('')}</div>
    ${sd.tip?`<div class="sp-tip" style="animation-delay:${(0.1+lines.length*0.26).toFixed(2)}s">${sd.tip}</div>`:''}
    <div class="sp-job"><span>${j.sw}</span><b>部件费 ${money(j.partBudget)}</b><b>人工费 ${money(jobLabor(j))}</b></div>
    <div class="sp-acts">
      <button class="mini" id="spLater">稍后再说</button>
      <button class="primary" id="spTake">接这单</button>
    </div></div>`;
  document.body.appendChild(ov);Scene.enter('story');
  requestAnimationFrame(()=>ov.classList.add('on'));
  const close=(take)=>{
    Scene.exit();
    state.story=state.story||{done:{},flags:{}};
    state.story.seen=state.story.seen||{};
    state.story.seen[j.storyId]=true;
    save();
    const x=document.getElementById('storyPop');
    if(x){x.classList.add('out');setTimeout(()=>{try{x.remove();}catch(e){}if(typeof onDone==='function')onDone();},240);}
    else if(typeof onDone==='function')onDone();
    if(take&&j.status==='open')acceptJob(j.id);
    else renderAll();
  };
  ov.querySelector('#spTake').onclick=()=>close(true);
  ov.querySelector('#spLater').onclick=()=>close(false);
  ov.onclick=e=>{if(e.target===ov)close(false);};
}
let _storyRetry=0;
/* 开局用：有未看过的剧情就先播剧情，播完（或没有剧情）再继续下一步。
   以前 startNew 里先弹「欢迎来到旺财装机店」，剧情只能等它关掉才挤出来，顺序反了。 */
/* 开局黑场：1.4 秒浮出画面 */
function bootFadeIn(){
  try{
    let el=document.getElementById('bootFade');
    if(!el){el=document.createElement('div');el.id='bootFade';document.body.appendChild(el);}
    el.classList.remove('out');
    el.style.opacity='1';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      el.classList.add('out');
      setTimeout(()=>{try{el.remove();}catch(e){}},2200);
    }));
  }catch(e){}
}
/* ===== 场景顺序：串行 await，一次只播一个 =====
   以前是「回调里递归调用自己 + 令牌/闸门/链标记」那套，点快了会把微信跳过、
   点慢了链会断在某一环导致引导不出来。现在改成线性顺序：
   每一步 await 到场景真正关闭才走下一步，全部走完一定调用 onDone。 */
function _playScene(starter){
  /* 把「播一个场景」包成 Promise：场景关闭时 resolve(true)；
     打不开（有别的场景占着）就每 300ms 重试，最多约 12 秒。 */
  return new Promise(function(resolve){
    var tries=0;
    function attempt(){
      var r=false;
      try{ r=starter(function(){resolve(true);}); }catch(e){ r=false; }
      if(r===false){
        tries++;
        if(tries<40){ setTimeout(attempt,300); return; }
        resolve(false); return;
      }
    }
    attempt();
  });
}
function _seqWait(ms){return new Promise(function(r){setTimeout(r,ms);});}
/* ===== 开局顺序（唯一一条线）=====
   屏幕上只有五种层：剧情 / 游戏底页 / 引导 / 页面锁 / 加载页。
   1 开头剧情  2 加载页  3 陈默微信  4 接单卡
   5 撤加载页 → 底页 + 「开始干活」+ 页面锁
   6 点开始干活 → 引导框 + Live2D
*/
/* 点完「开始新游戏」立刻调用；runBootIntro 里再调用一次也只是复用同一张加载页。 */
/* ===== 启动唯一的中间层：底图 =====
   顺序只有三段：CG → 底图 → 开始界面（标题页）。
   底图就是那张 9:20 店门口，撤掉之后不再回来。 */
function showBootStill(){
  try{
    if(window.__bootStillDone) return;
    var exists=document.getElementById('bootStill');
    if(exists){ try{exists.classList.add('on');}catch(e){} return; }
    var el=document.createElement('div');
    el.id='bootStill';
    document.body.appendChild(el);
    requestAnimationFrame(function(){ try{el.classList.add('on');}catch(e){} });
  }catch(e){}
}
function hideBootStill(){
  try{
    if(window.__bootStillDone) return;
    window.__bootStillDone=true;
    var el=document.getElementById('bootStill');
    if(!el) return;
    el.classList.remove('on');
    setTimeout(function(){ try{el.remove();}catch(e){} },420);
  }catch(e){}
}
try{ if(document.body) showBootStill(); else document.addEventListener('DOMContentLoaded',showBootStill,{once:true}); }catch(e){}
function showBootLoad(){
  try{
    if(window.__bootLoadDone) return;        /* 加载页只允许出现一次：撤掉之后不再回来 */
    if(document.getElementById('startLoad'))return;
    const el=document.createElement('div');
    el.id='startLoad';
    el.innerHTML='<div class="sl-bg"></div><div class="sl-veil"></div>'+
      '<div class="sl-inner"><div class="sl-logo">旺财装机店</div>'+
      '<div class="sl-sub">一间小店 · 一台台机器 · 一单单生意</div>'+
      '<div class="sl-bar"><i></i></div><div class="sl-tip">正在生火开张…</div></div>';
    document.body.appendChild(el);window.__loadAt=Date.now();
  }catch(e){}
}
function hideBootLoad(){
  try{
    window.__bootLoadDone=true;              /* 线性：撤掉就结束，不再创建第二次 */
    const el=document.getElementById('startLoad');if(!el)return;
    el.style.opacity='0';setTimeout(()=>{try{el.remove();}catch(e){}},420);
  }catch(e){}
}
async function runBootIntro(){
  const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
  state.story=state.story||{};state.story.seen=state.story.seen||{};
  const S=state.story.seen;

  /* 0 底图（CG 已经播完，这里是唯一一张静态过渡） */
  showBootStill();
  await wait(420);

  /* 1 开头剧情 */
  if(state.day===1&&!S['plot_opening']){
    const ok=await _playScene(cb=>playPlotEvent('opening',cb));
    if(ok){S['plot_opening']=1;state.story.flags.opening=true;try{save();}catch(e){}}
  }
  /* 2 剧情结束：底图可以让位给剧情画面 */
  hideBootStill();
  await wait(120);

  /* 2.5 爸爸寄来的包裹（留声机 + 旧整机）——必须在陈默微信之前 */
  if(window.__GRAMO&&window.__GRAMO.introOnce){
    try{ await window.__GRAMO.introOnce(); }catch(e){}
    try{ await wait(200); }catch(e){}
  }
  /* 3 陈默微信 */
  if(state.day===1&&!S['chat_chat_chenmo_d1']&&typeof CHAT_SCENES!=='undefined'&&CHAT_SCENES.chat_chenmo_d1){
    const ok=await _playScene(cb=>playChatScene('chat_chenmo_d1',cb));
    if(ok){S['chat_chat_chenmo_d1']=1;try{save();}catch(e){}}
  }
  /* 4 接单卡 */
  try{
    const j=state.jobs&&state.jobs.find(x=>x.story&&x.status==='open');
    if(j&&!S[j.storyId]){const sd=storyDef(j.storyId);if(sd)await _playScene(cb=>playStory(sd,j,cb));}
  }catch(e){}
  /* 5 撤加载页 → 底页 + 开工说明（页面锁生效） */
  await wait(420);

  try{Scene.end();}catch(e){}
  /* 新手说明前不要把引导画出来：maybeOnboard 会先等 600ms 再弹窗，
     这一下足够引导卡先露一帧，看起来就像「说明卡在引导后面」。 */
  try{if(typeof _openingSeq!=='undefined'){_openingSeq=true;_openingUntil=Date.now()+6000;}}catch(e){}
  try{if(typeof coachHide==='function')coachHide();}catch(e){}
  /* 等说明卡，但最多等 9 秒：这张卡如果被「点空白 / 被剧情顶掉 / 旧存档缺字段」
     之类的方式关掉，回调就不会跑，纯 await 会把整个开局流程挂在半路，
     开场锁永远不解 —— 引导框也就再也不出现。 */
  await Promise.race([
    new Promise(resolve=>{
      try{
        if(state.tut&&state.tut.onboarded){resolve();return;}
        if(typeof maybeOnboard==='function')maybeOnboard(resolve);else resolve();
      }catch(e){resolve();}
    }),
    new Promise(r=>setTimeout(r,9000))
  ]);
  /* 说明卡这一环结束就把开场锁解掉。
     以前解锁只靠「开始干活」按钮的回调：说明卡要是被空白处点掉、被剧情顶掉，
     或者旧存档没有 onboarded 字段，锁就一直挂着 —— 玩家看到的是
     引导框整段消失、只剩目标上的高亮框，直到 30 秒兜底才回来。 */
  try{if(typeof _openingSeq!=='undefined')_openingSeq=false;}catch(e){}
  /* 6 引导 + Live2D */
  await wait(320);
  try{if(typeof coachRefresh==='function')coachRefresh();}catch(e){}
}
async function playStoryForToday(onDone){
  try{
    state.story=state.story||{done:{},flags:{}};
    state.story.seen=state.story.seen||{};
    Scene.chain=true;
    var S=state.story;

    /* 1. 第 1 天开场（墨桀） */
    if(state.day===1&&!S.seen['plot_opening']){
      var ok1=await _playScene(function(cb){return playPlotEvent('opening',cb);});
      await _seqWait(260);
      if(ok1){S.seen['plot_opening']=1;S.flags.opening=true;try{save();}catch(e){}}
    }

    /* 1.5 开场留声机（在招牌剧情之后、陈默微信之前） */
    if(window.__GRAMO&&window.__GRAMO.introOnce){
      try{ await window.__GRAMO.introOnce(); }catch(e){}
    }

    /* 2. 第 1 天陈默微信（老存档已接单就跳过） */
    if(state.day===1&&!S.seen['chat_chat_chenmo_d1']){
      var started=!!(state.tut&&state.tut.done&&(state.tut.done.accept||state.tut.done.install));
      if(!started&&typeof playChatScene==='function'&&typeof CHAT_SCENES!=='undefined'&&CHAT_SCENES.chat_chenmo_d1){
        var ok2=await _playScene(function(cb){return playChatScene('chat_chenmo_d1',cb);});
        await _seqWait(260);
        if(ok2){S.seen['chat_chat_chenmo_d1']=1;try{save();}catch(e){}}
      }else{
        S.seen['chat_chat_chenmo_d1']=1;try{save();}catch(e){}
      }
    }

    /* 3. 现实相遇：第 2 天陈默到店 / 第 6 天表姐上门 */
    var plotByDay={2:'meet_chenmo',6:'meet_zhouqin'};
    var pid=plotByDay[state.day];
    if(pid&&!S.seen['plot_'+pid]&&typeof PLOT_EVENTS!=='undefined'&&PLOT_EVENTS[pid]){
      S.seen['plot_'+pid]=1;try{save();}catch(e){}
      await _playScene(function(cb){return playPlotEvent(pid,cb);});
      await _seqWait(260);
    }

    /* 4. 第 4 天韩经理微信 */
    if(state.day===4&&!S.seen['chat_chat_hanjingli']&&typeof CHAT_SCENES!=='undefined'&&CHAT_SCENES.chat_hanjingli){
      var ok4=await _playScene(function(cb){return playChatScene('chat_hanjingli',cb);});
      if(ok4){S.seen['chat_chat_hanjingli']=1;try{save();}catch(e){}}
    }

    /* 5. 剧情工单的接单卡 */
    var j=null;
    try{j=state.jobs.find(function(x){return x.story&&x.status==='open';});}catch(e){}
    if(j&&!S.seen[j.storyId]){
      var sd=storyDef(j.storyId);
      if(sd)await _playScene(function(cb){return playStory(sd,j,cb);});
    }
  }catch(e){
    console.error('[story]',e);
  }finally{
    Scene.chain=false;
    try{if(onDone)onDone();}catch(e){}
  }
}
function maybeStoryPopup(){
  /* 第一天：先看微信，再弹接单卡，别反过来 */
  try{
    if(state.day===1&&state.story&&state.story.seen&&!state.story.seen['chat_chat_chenmo_d1']&&
       typeof CHAT_SCENES!=='undefined'&&CHAT_SCENES.chat_chenmo_d1&&!state.tut?.guideOff)return;
  }catch(e){}
  try{
    if(!state||!state.jobs)return;
    if(_daySwitching)return;   /* 换天过场没结束，剧情一律等 */

    if(document.getElementById('storyPop'))return;
    /* 被别的弹窗挡住时（开局说明、交付、打烊结算、新一天过场）稍后再试，
       否则那一下 renderAll 正好撞在弹窗上，剧情就永远不弹了 */
    const blocked=()=>{
      const mask=document.getElementById('mask');
      return (mask&&mask.classList.contains('on'))||document.getElementById('hoOverlay')||
             document.getElementById('dayOverlay')||document.getElementById('dayOpen')||
             document.getElementById('storyPop')||document.getElementById('plotEvent');
    };
    if(blocked()){
      if(!_storyRetry)_storyRetry=setTimeout(()=>{_storyRetry=0;maybeStoryPopup();},1400);
      return;
    }
    const scr=document.getElementById('titleScr');
    if(scr&&!scr.classList.contains('hide'))return;
    /* （已删除这里的旧兜底：它会在 playStoryForToday 的开场还没播完时
        自己再播一遍 opening；开场统一由 playStoryForToday 负责。） */
    state.story=state.story||{done:{},flags:{}};
    /* 第一天的开张（墨桀）还没开始播之前，陈默的剧情一律往后排 */
    if(state.day===1&&state.story&&state.story.flags&&!state.story.flags.opening)return;
    const j=state.jobs.find(x=>x.story&&x.status==='open');
    if(!j)return;
    state.story=state.story||{done:{},flags:{}};
    state.story.seen=state.story.seen||{};
    if(state.story.seen[j.storyId])return;
    const sd=storyDef(j.storyId);
    if(!sd)return;
    playStory(sd,j);
  }catch(e){}
}/* ================= 新一天：日期大字过场 =================
   打烊结算卡收尾之后紧接着一张「第 N 天 / 日期」，1.5 秒后自动淡出，
   点一下也能跳过。只在「翻到新一天」时用，开局那次不弹。 */
function weekdayCn(dateStr){
  const wd=['周日','周一','周二','周三','周四','周五','周六'];
  try{return wd[new Date(dateStr+'T12:00:00').getDay()]||'';}catch(e){return '';}
}
/* 打烊后有剧情：先把游戏页面盖住，剧情起来后再淡出 */
function dayCurtainOn(){
  try{
    let el=document.getElementById('dayCurtain');
    if(!el){el=document.createElement('div');el.id='dayCurtain';document.body.appendChild(el);}
    el.style.display='block';el.style.opacity='1';
    const off=()=>{try{el.style.opacity='0';setTimeout(()=>{if(el)el.style.display='none';},360);}catch(e){}};
    let done=false;
    const tryOff=()=>{if(done)return;done=true;try{obs.disconnect();}catch(e){}setTimeout(off,240);};
    window.__dayCurtainOff=tryOff;
    const obs=new MutationObserver(()=>{if(document.getElementById('plotEvent')||document.getElementById('storyPop'))tryOff();});
    obs.observe(document.body,{childList:true,subtree:false});
  }catch(e){}
}
function playDayOpen(info,onDone){
  try{SFX.whoosh();}catch(e){}
  let done=false;
  const finish=()=>{
    if(done)return;done=true;
    const o=document.getElementById('dayOpen');if(o)o.remove();
    if(typeof onDone==='function')onDone();
  };
  /* 系统关了动画也照样显示这一页，只是不做淡入淡出：
     换天的日期对玩家是信息，不该因为「减少动态效果」就整个跳过。 */
  const reduce=(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  if(document.getElementById('dayOpen')){finish();return;}
  if(reduce||typeof requestAnimationFrame!=='function'){
    const ov=document.createElement('div');
    ov.className='dayopen static';ov.id='dayOpen';
    const md=(info.date||'').slice(5).replace('-',' / ');
    ov.innerHTML=`<div class="do-inner">
        <div class="do-k">第 ${info.day} 天</div>
        <div class="do-date">${md}</div>
        <div class="do-y">${(info.date||'').slice(0,4)}　${weekdayCn(info.date)}</div>
        <div class="do-line"></div>
        <div class="do-sub">今日工单 <b>${info.jobs||0}</b> 单</div>
      </div>`;
    document.body.appendChild(ov);
    ov.classList.add('on');
    setTimeout(finish,1500);
    ov.onclick=finish;
    return;
  }
  const ov=document.createElement('div');
  ov.className='dayopen';ov.id='dayOpen';
  const md=(info.date||'').slice(5).replace('-',' / ');
  ov.innerHTML=`<div class="do-inner">
      <div class="do-k">第 ${info.day} 天</div>
      <div class="do-date">${md}</div>
      <div class="do-y">${(info.date||'').slice(0,4)}　${weekdayCn(info.date)}</div>
      <div class="do-line"></div>
      <div class="do-sub">今日工单 <b>${info.jobs||0}</b> 单</div>
    </div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('on'));
  const t1=setTimeout(()=>{ov.classList.add('out');},1500);
  const t2=setTimeout(finish,1960);
  ov.onclick=()=>{clearTimeout(t1);clearTimeout(t2);finish();};
}/* ================= 打烊结算动画 =================
   点「打烊」先把今天对一遍账（交付/拒绝/剧情/进账/支出/净赚），再翻到第二天。
   数字从 0 滚到实际值，最后一拍打上「第 N 天」。关灯收工的感觉，比直接切天舒服。 */
function nextDateOf(dateStr){
  const d=new Date(dateStr+'T12:00:00');d.setDate(d.getDate()+1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function playDaySummary(st,onDone){
  let done=false;
  const finish=()=>{if(done)return;done=true;try{const x=document.getElementById('dayOverlay');if(x)x.remove();}catch(e){}onDone();};
  const reduce=(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  if(typeof requestAnimationFrame!=='function'||reduce){finish();return;}

  const ov=document.createElement('div');
  ov.className='ho-overlay';ov.id='dayOverlay';
  ov.innerHTML='<div class="ho-card day-card" id="dayCard"></div>';
  document.body.appendChild(ov);
  const card=document.getElementById('dayCard');
  const net=Math.round(st.cash-st.start);
  const nextDay=st.day+1,nextDate=nextDateOf(st.date);
  const rows=[];
  rows.push(`<div class="day-row" style="animation-delay:.10s"><span>交付</span><b>${st.delivered} 单</b></div>`);
  if(st.rejected>0)rows.push(`<div class="day-row" style="animation-delay:.20s"><span>拒绝</span><b>${st.rejected} 单</b></div>`);
  if(st.expired>0)rows.push(`<div class="day-row" style="animation-delay:.25s"><span>逾期退单</span><b class="out">${st.expired} 单</b></div>`);
  if(st.story>0)rows.push(`<div class="day-row story" style="animation-delay:.30s"><span>剧情</span><b>推进 ${st.story} 段</b></div>`);
  rows.push(`<div class="day-row" style="animation-delay:.40s"><span>进账</span><b class="in">＋${money(st.inSum)}</b></div>`);
  rows.push(`<div class="day-row" style="animation-delay:.50s"><span>支出</span><b class="out">−${money(st.outSum)}</b></div>`);
  if(st.side&&st.side.income>0){
    rows.push(`<div class="day-row" style="animation-delay:.60s"><span>额外订单（伙计代做 ${st.side.orders} 单）</span><b class="in">＋${money(st.side.income)}</b></div>`);
  }
  if(repUnlocked()){
    rows.push(`<div class="day-row" style="animation-delay:.70s"><span>口碑</span><b>${repLabel()}</b></div>`);
  }
  card.innerHTML=`<div class="day-h"><span class="dot"></span>第 ${st.day} 天 · 收工</div>
    <div class="day-date">${st.date}</div>
    <div class="day-rows">${rows.join('')}</div>
    <div class="day-net"><span>今日净赚</span><b id="dayNet" class="${net<0?'neg':''}">¥0</b></div>
    <div class="day-cash">现金 ${money(st.start)} → ${money(st.cash)}</div>
    <div class="ho-bar"><i id="dayBar"></i></div>
    <div class="day-next" id="dayNext"><span>第 ${nextDay} 天</span><em>${nextDate}</em></div>
    <div class="day-acts">
      <button class="mini" id="daySkip">跳过</button>
      <button class="primary" id="dayGo">开始第 ${nextDay} 天</button>
    </div>`;

  const netEl=document.getElementById('dayNet');
  const bar=document.getElementById('dayBar');
  const t0=performance.now(),dur=1150;
  const tick=t=>{
    const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);
    if(netEl)netEl.textContent=(net<0?'−¥':'+¥')+Math.abs(Math.round(net*e)).toLocaleString('zh-CN');
    if(bar)bar.style.width=(k*100).toFixed(1)+'%';
    if(k<1){requestAnimationFrame(tick);}
    else{
      if(netEl)netEl.textContent=(net<0?'−¥':'+¥')+Math.abs(net).toLocaleString('zh-CN');
      const nx=document.getElementById('dayNext');if(nx)nx.classList.add('on');
      /* 不再自动翻页：结算看完，由玩家自己点「开始第 N 天」 */
      const goBtn=document.getElementById('dayGo');
      if(goBtn)goBtn.classList.add('ready');
    }
  };
  requestAnimationFrame(tick);
  const skip=document.getElementById('daySkip');if(skip)skip.onclick=finish;
  const go=document.getElementById('dayGo');if(go)go.onclick=finish;
  ov.onclick=e=>{if(e.target===ov)finish();};
}
document.getElementById('btnMute').onclick=aeToggleMute;
/* ================= 设置页：音乐 / 音效 / 语音 音量 ================= */
const VOL={music:0.8,sfx:0.8,voice:1.0};
function volLoad(){try{const r=JSON.parse(localStorage.getItem('pcbs_vol')||'{}');
  if(typeof r.music==='number')VOL.music=r.music;
  if(typeof r.sfx==='number')VOL.sfx=r.sfx;
  if(typeof r.voice==='number')VOL.voice=r.voice;}catch(e){}}
function volSave(){try{localStorage.setItem('pcbs_vol',JSON.stringify(VOL));}catch(e){}}
function volApply(){
  try{
    if(AE.musicGain)AE.musicGain.gain.value=Math.min(1.4,0.9*(VOL.music/0.6));
    if(AE.sfxGain)AE.sfxGain.gain.value=0.7*(VOL.sfx/0.8);
    if(AE.master)AE.master.gain.value=Math.min(0.95,0.75*Math.max(0.45,Math.max(VOL.music,VOL.sfx,VOL.voice)));
  }catch(e){}
  try{if(_coachAudio)_coachAudio.volume=Math.min(1,VOL.voice);}catch(e){}
}
function openSettings(){
  const old=document.getElementById('setSheet');if(old)old.remove();
  const ov=document.createElement('div');ov.id='setSheet';
  const row=(id,label,val)=>'<div class="setRow"><span>'+label+'</span>'+
    '<input type="range" min="0" max="100" value="'+Math.round(val*100)+'" data-vol="'+id+'">'+
    '<b id="setVal_'+id+'">'+Math.round(val*100)+'</b></div>';
  const shell=(function(){
    try{
      var m=/WCShell\/(\d+)/.exec(navigator.userAgent||'');
      if(m) return m[1];
      if(window.__SHELL_BUILD) return String(window.__SHELL_BUILD);
    }catch(e){}
    return '—';
  })();
  ov.innerHTML='<div class="setCard"><div class="setHd">设置</div>'+
    row('music','音乐',VOL.music)+row('sfx','音效',VOL.sfx)+row('voice','语音',VOL.voice)+
    '<div style="margin:10px 2px 2px;font-size:11px;color:#9b8088;line-height:1.9">'+
      '<div>内容版本　'+(typeof APP_BUILD!=='undefined'?APP_BUILD:'—')+'</div>'+
      '<div>壳版本　　'+shell+'</div>'+
      '<div style="margin-top:6px"><button class="mini" id="setCheckUpd">检查更新</button>'+
      '<span id="setUpdMsg" style="margin-left:8px;color:#b8546a"></span></div>'+
    '</div>'+
    '<div class="setActs"><button class="mini" id="setTest">试听</button>'+
    '<button class="primary" id="setOk">完成</button></div>'+
    (function(){
      var t=document.getElementById('titleScr');
      var onTitle=!!t && !t.classList.contains('hide');
      if(onTitle) return '';                       /* 标题页的设置不显示这两个 */
      return '<div class="setActs" style="margin-top:8px">'+
        '<button class="mini" id="setToTitle">返回主菜单</button>'+
        '<button class="mini bad" id="setQuit">退出游戏</button></div>';
    })()+'</div>';
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('on'));
  ov.querySelectorAll('input[data-vol]').forEach(inp=>{
    inp.oninput=()=>{
      const k=inp.dataset.vol,v=parseInt(inp.value,10)/100;
      VOL[k]=v;const lab=document.getElementById('setVal_'+k);if(lab)lab.textContent=Math.round(v*100);
      volApply();volSave();
    };
  });
  const t=document.getElementById('setTest');
  if(t)t.onclick=()=>{try{AE.ctx&&AE.ctx.resume();SFX.msgOut();}catch(e){}};
  const cu=document.getElementById('setCheckUpd');
  if(cu)cu.onclick=()=>{
    const msg=document.getElementById('setUpdMsg');
    if(msg)msg.textContent='检查中…';
    fetch('../apk/version.json?t='+Date.now(),{cache:'no-store'})
      .then(r=>r.json())
      .then(o=>{
        const shellNow=(function(){try{return WCBridge.shellVersion()|0;}catch(e){return 0;}})();
        const contentNow=(typeof APP_BUILD!=='undefined')?APP_BUILD:'';
        const remoteC=o.content||'';
        let text='';
        if(o.code>shellNow){
          text='发现新壳 '+o.name;
          if(msg)msg.textContent=text;
          setTimeout(()=>{ if(typeof window.__WC_SHOW_UPDATE==='function') window.__WC_SHOW_UPDATE(o); },300);
          return;
        }
        if(remoteC&&remoteC!==contentNow){
          /* 不是最新就自己更新，不给按钮 */
          if(msg)msg.textContent='正在更新到 '+remoteC+'…';
          setTimeout(function(){
            const u=new URL(location.href);
            u.searchParams.set('v',remoteC);
            u.searchParams.set('t',String(Date.now()));
            location.replace(u.toString());
          },400);
          return;
        }else{
          text='已是最新'+(remoteC?'（'+remoteC+'）':'');
        }
        if(msg)msg.textContent=text;
      })
      .catch(()=>{ if(msg)msg.textContent='检查失败，请检查网络'; });
  };
  const ok=document.getElementById('setOk');
  if(ok)ok.onclick=()=>{ov.classList.remove('on');setTimeout(()=>ov.remove(),220);};
  const toTitle=document.getElementById('setToTitle');
  if(toTitle)toTitle.onclick=()=>{
    try{ ov.classList.remove('on'); }catch(e){}
    setTimeout(()=>{ try{ov.remove();}catch(e){} },200);
    modal('返回主菜单',
      '<div style="font-size:12.5px;line-height:1.9;color:#6b5b60">'
      +'要回到标题画面吗？<br><span style="color:#9b8088;font-size:11.5px">进度是自动存的，随时能继续。</span></div>',null);
    setTimeout(()=>{
      const y=document.getElementById('mYes'), n=document.getElementById('mNo');
      if(y){ y.textContent='回标题'; y.onclick=()=>{ try{saveGame&&saveGame();}catch(e){} setTimeout(()=>{ location.reload(); },120); }; }
      if(n){ n.textContent='再想想'; n.onclick=()=>{ try{closeMask(document.getElementById('mask'));}catch(e){} }; }
    },30);
  };
  const quit=document.getElementById('setQuit');
  if(quit)quit.onclick=()=>{
    try{ ov.classList.remove('on'); }catch(e){}
    setTimeout(()=>{ try{ov.remove();}catch(e){} },200);
    modal('退出游戏',
      '<div style="font-size:12.5px;line-height:1.9;color:#6b5b60">'
      +'要关掉旺财装机店吗？<br><span style="color:#9b8088;font-size:11.5px">进度是自动存的，下次进来接着干。</span></div>',null);
    setTimeout(()=>{
      const y=document.getElementById('mYes'), n=document.getElementById('mNo');
      if(y){ y.textContent='退出'; y.onclick=()=>{ try{saveGame&&saveGame();}catch(e){}
        try{ WCBridge.exitApp(); }catch(e){} setTimeout(()=>{ try{window.close();}catch(e){} },300); }; }
      if(n){ n.textContent='再等等'; n.onclick=()=>{ try{closeMask(document.getElementById('mask'));}catch(e){} }; }
    },30);
  };
  ov.onclick=(e)=>{if(e.target===ov){ov.classList.remove('on');setTimeout(()=>ov.remove(),220);}};
}
volLoad();
try{volApply();}catch(e){}
try{
  const sb=document.getElementById('btnSet');
  if(sb)sb.onclick=()=>{try{AE.ctx&&AE.ctx.resume();}catch(e){}openSettings();};
}catch(e){}

try{document.getElementById('debtTxt').onclick=repayDebt;}catch(e){}
document.addEventListener('pointerdown',aeResume,{once:true,passive:true});
document.addEventListener('click',e=>{
  const t=e.target&&e.target.closest?e.target.closest('button'):null;
  if(t&&t.id!=='btnMute'){try{SFX.click();}catch(err){}}
},true);
document.getElementById('btnLife').onclick=openLife;
document.getElementById('btnHistory').onclick=openHistory;
document.getElementById('btnToJobs').onclick=()=>{state.panel='jobs';if(isMobile())mViewSet('docs',true);save();renderAll();};
document.getElementById('btnClose').onclick=()=>{
  /* 现在允许带着没做完的单打烊：没到交期的明天继续，过了交期的算退单 */
  /* 先记账（这一天的数只在切换前有效），再播结算，最后才真正翻页 */
  /* 5 星附近的额外订单：伙计代做，直接进当日收入 */
  const side=repSideBusiness();
  if(side.income>0){
    /* 只进现金，不并入 todayIn：报表里单独一行，避免「进账」和「额外订单」重复显示 */
    state.cash+=side.income;
    state.extraIncome=(state.extraIncome||0)+side.income;
  }
  const st={
    side:side,
    day:state.day,date:state.date,cash:state.cash,
    start:(typeof state.dayStartCash==='number'?state.dayStartCash:state.cash),
    rejected:state.jobs.filter(j=>j.status==='rejected').length,
    expired:state.jobs.filter(j=>(j.status==='open'||j.status==='taken')&&j.dueDay!=null&&j.dueDay<=state.day).length,
    /* 「交付」要把拒绝掉的扣掉，否则拒绝的单会同时显示成拒绝和交付 */
    delivered:Math.max(0,closedCount()-state.jobs.filter(j=>j.status==='rejected').length),
    story:state.todayStory||0,
    inSum:state.todayIn||0,
    outSum:state.todayOut||0,
  };
  /* 点「打烊」就把教程最后一步记完成，不能等结算页的「开始第 2 天」——
     那个按钮本身会被新手点击锁拦住，形成死局。 */
  try{state.tut=state.tut||{done:{},hidden:false};state.tut.done.close=true;save();}catch(e){}
  try{if(typeof coachHide==='function')coachHide();}catch(e){}
  playDaySummary(st,()=>{
  dayCurtainOn();   /* 一进结算就盖住，避免闪出游戏页面 */
  const d=new Date(state.date+'T12:00:00');d.setDate(d.getDate()+1);
  const next=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  state.date=next;state.day+=1;
  /* 跨天保留：没做完且没到交期的单继续挂着；过了交期的算退单并扣口碑 */
  const _nextDay=state.day;
  const _carry=[];let _expired=0;
  for(const j of state.jobs){
    if(j.status!=='open'&&j.status!=='taken')continue;
    if(j.dueDay!=null&&j.dueDay<_nextDay){_expired++;}
    else {if(j.status==='taken')j.status='open';_carry.push(j);}   /* 接了没做完的退回"待接"，工作台进度还在 */
  }
  const _fresh=makeJobs(next,_nextDay);
  state.jobs=_carry.concat(_fresh);
  state.dayTotal=state.jobs.length;
  state.activeId=null;
  /* 只保留"还挂着"的工单工作台，退单的清掉 */
  const _keep=new Set(_carry.map(j=>j.id));
  const _nb={};for(const k in (state.benches||{})){if(_keep.has(k))_nb[k]=state.benches[k];}
  state.benches=_nb;state.diag={};state.panel='jobs';build=newBuild();
  if(_expired>0){
    try{repApply(false);}catch(e){}
    setTimeout(()=>toast(_expired+' 单过了交期，客户退单了'),1200);
    try{if(repUnlocked()&&repScore()<REP_BUST){setTimeout(()=>{try{gameOver();}catch(e){}},1500);}}catch(e){}
  }
  /* 昨天的机器跟着昨天的工单一起清掉，别一直堆在仓库里 */
  if(state.machines&&state.machines.length){
    state.machines=state.machines.filter(m=>!m.jobId||state.jobs.some(j=>j.id===m.jobId));
    state.machines.forEach(m=>{m.onBench=false;});   /* 工作台是隔日清空的，整机回到仓库 */
  }
  state.benchMachines={};
  state.tut=state.tut||{done:{},hidden:false};state.tut.done.close=true;
  state.dayStartCash=state.cash;state.todayIn=0;state.todayOut=0;state.todayStory=0;
  if(isMobile())mViewSet('docs',true);
  save();renderAll();
  try{debtDue();}catch(e){}   /* 第 15 天墨桀来收钱（之前是死代码） */
  /* 结算卡关掉之后再来一张「新的一天」：大字日期压上来，比底部一条 toast 更有翻篇感 */
  _daySwitching=true;
  playDayOpen({day:state.day,date:next,jobs:state.jobs.length},()=>{
    _daySwitching=false;
    /* 过场收掉之后，让页眉的日期再闪一次，玩家才看得见「换天了」 */
    try{animPulse(document.getElementById('dateTxt'),'dateFlip',760);
        animPulse(document.getElementById('dayTxt'),'dateFlip',760);}catch(e){}
    setTimeout(()=>{
      let shown=false;
      try{
        shown=!!maybeMojiePlot()||!!maybeDay3Plot();
        if(!shown){maybeStoryPopup();shown=!!document.getElementById('storyPop')||!!document.getElementById('plotEvent');}
      }catch(e){}
      if(!shown)setTimeout(()=>{
        if(!document.querySelector('#plotEvent,#storyPop')){try{window.__dayCurtainOff&&window.__dayCurtainOff();}catch(e){}}
      },420);
    },260);
    toast('第 '+state.day+' 天 · 今日 '+state.jobs.length+' 单，挑一单开工');
  });
  });
};
function syncHd(){
  const h=document.querySelector('header');
  if(h)document.documentElement.style.setProperty('--hd',h.offsetHeight+'px');
}
/* ==================== v6 布局控制：桌面 / 手机两套壳的切换逻辑 ====================
   断点只有一个：1160px。桌面是三栏（左单据 / 中工作台 / 右检查），页面不滚、各栏自滚；
   手机是一次一屏，靠底部页签在「单据 / 工作台 / 检查」之间切。
   所有和布局有关的判断都走 isMobile()，不再散落 innerWidth<=1040。 */
const MQ_MOBILE=(typeof window!=='undefined'&&window.matchMedia)?window.matchMedia('(max-width: 1159px)'):null;
function isMobile(){return MQ_MOBILE?MQ_MOBILE.matches:(typeof window!=='undefined'&&window.innerWidth<1160);}
const MVIEWS=['docs','bench','checks'];
let mView='docs';
let _lastUserNav=0;
let _viewTok=0,_viewPending=false,_lastViewSwitchAt=0;
function viewPanelEl(v){
  return document.getElementById(v==='bench'?'panelMid':(v==='checks'?'panelRight':'panelLeft'));
}
function mViewSet(v,silent){
  if(!isMobile())return false;
  if(MVIEWS.indexOf(v)<0)v='docs';
  const changed=(v!==mView);
  if(!changed)return false;
  const nav=document.getElementById('mNav');
  const lightNav=()=>{if(nav)nav.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===v));};

  /* 程序内部切页（引导、交付流程）：不做动画，直接切，避免流程被拖慢 */
  if(silent){
    mView=v;document.body.dataset.view=v;lightNav();
    _lastViewSwitchAt=performance.now();
    return true;
  }

  /* 玩家点页签：先让旧页淡出（110ms），再换页、新页淡入（280ms）。
     只用透明度、不加位移，所以整列不会被“推”一下。 */
  _lastUserNav=Date.now();
  const tok=++_viewTok;
  const oldEl=viewPanelEl(mView);
  const newEl=viewPanelEl(v);
  mView=v;_viewPending=true;lightNav();
  /* 连点页签时先把上一次的淡出状态清干净，别把某栏永久留在透明 */
  ['panelLeft','panelMid','panelRight'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.classList.remove('viewOut');
  });
  if(oldEl)oldEl.classList.add('viewOut');
  setTimeout(()=>{
    if(tok!==_viewTok){_viewPending=false;return;}
    ['panelLeft','panelMid','panelRight'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.classList.remove('viewOut');
    });
    _viewPending=false;
    document.body.dataset.view=v;
    try{window.scrollTo(0,0);}catch(e){}
    if(newEl){
      newEl.classList.remove('viewIn');
      void newEl.offsetWidth;
      newEl.classList.add('viewIn');
      setTimeout(()=>{try{newEl.classList.remove('viewIn');}catch(e){}},320);
    }
  },110);
  return true;
}
function renderMNav(){
  const nav=document.getElementById('mNav');if(!nav)return;
  if(!isMobile()){document.body.dataset.view='';return;}
  /* 切页动画进行中：不要在这里改 dataset.view，
     否则中途的一次 renderAll 会提前把页面换掉，看起来像「多切了一页」 */
  if(_viewPending)return;
  document.body.dataset.view=mView;
  nav.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===mView));
  const j=state.activeId?job():null;
  const open=state.jobs.filter(x=>x.status==='open').length;
  const bad=j?checks().filter(c=>!c.ok&&!c.soft).length:0;
  const nd=document.getElementById('navDocs');
  if(nd){nd.textContent=open||'';nd.className='cnt';}
  const nc=document.getElementById('navChecks');
  if(nc){nc.textContent=j?(bad||'✓'):'';nc.className='cnt'+(bad?' bad':'');}
  const nb=nav.querySelector('[data-view="bench"]');
  if(nb)nb.classList.toggle('off',!j);
  const nk=nav.querySelector('[data-view="checks"]');
  if(nk)nk.classList.toggle('off',!j);
}
function bindMNav(){
  const nav=document.getElementById('mNav');if(!nav||nav.dataset.bound)return;
  nav.dataset.bound='1';
  nav.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{
    const v=b.dataset.view;
    if(v!=='docs'&&!state.activeId){toast('先在「单据」里接一单');mViewSet('docs');return;}
    /* 从工作台 / 检查点回「单据」：先回到工单列表，
       而不是停在离开时那个商店/仓库页 */
    if(v==='docs'&&mView!=='docs'){
      if(state.panel!=='jobs'){state.panel='jobs';save();renderAll();}
    }
    mViewSet(v);
  });
}
/* 布局切换：只在真的跨过断点时重排，避免手机地址栏伸缩时反复重绘 */
let _layoutMobile=null;
function applyLayoutShell(force){
  const m=isMobile();
  document.body.classList.toggle('layout-mobile',m);
  document.body.classList.toggle('layout-desktop',!m);
  if(m){bindMNav();if(force||_layoutMobile!==m)mView=mView||'docs';document.body.dataset.view=mView;}
  else{document.body.dataset.view='';}
  _layoutMobile=m;
  syncHd();
}
/* 元素滚进可视区：只滚「页面」和真正能滚的祖先，不碰 overflow:hidden/clip 的卡片
   （scrollIntoView 会把那种盒子的内容滚走，且没有滚动条能拉回来） */
function scrollElIntoView(el,opt){
  const instant=!!(opt&&opt.instant);
  if(!el||typeof el.getBoundingClientRect!=='function')return;
  const center=!opt||opt.center!==false;
  let r;try{r=el.getBoundingClientRect();}catch(e){return;}
  if(!r||(!r.width&&!r.height))return;
  let node=el.parentElement;
  while(node&&node!==document.body&&node!==document.documentElement){
    let cs=null;try{cs=getComputedStyle(node);}catch(e){}
    const oy=cs?cs.overflowY:'';
    if((oy==='auto'||oy==='scroll')&&node.scrollHeight>node.clientHeight+2){
      const nr=node.getBoundingClientRect();
      const want=center?((nr.height-r.height)/2):(nr.height-r.height-16);
      node.scrollTop+=Math.round((r.top-nr.top)-want);
      try{r=el.getBoundingClientRect();}catch(e){}
      break;
    }
    node=node.parentElement;
  }
  const vh=window.innerHeight||700;
  const limit=(opt&&opt.bottom)?opt.bottom:(vh-84);
  if(r.top<74||r.bottom>limit){
    const top=(opt&&opt.bottom)
      ? (r.bottom+window.scrollY-limit)
      : (center?(r.top+window.scrollY-(vh-r.height)/2):(r.bottom+window.scrollY-vh+90));
    if(instant){try{window.scrollTo(0,Math.max(0,Math.round(top)));}catch(e){}}
    else{try{window.scrollTo({top:Math.max(0,Math.round(top)),behavior:'smooth'});}catch(e){try{window.scrollTo(0,Math.max(0,top));}catch(e2){}}}
  }
}
/* 保险：每次渲染后，把卡片内部被滚动的位置复位（历史存档 / 旧路径留下的脏状态） */
function resetCardScrolls(){
  document.querySelectorAll('.job,.chat,.item,.case').forEach(el=>{
    if(el&&el.scrollTop)el.scrollTop=0;
    if(el&&el.scrollLeft)el.scrollLeft=0;
  });
}
function onViewportChange(){
  const m=isMobile();
  if(m!==_layoutMobile){applyLayoutShell(true);try{renderAll();}catch(e){}}
  syncHd();
}
window.addEventListener('resize',onViewportChange);
window.addEventListener('orientationchange',onViewportChange);
/* ================= 关掉页面时自动存档 =================
   平时的 save() 都跟在具体操作后面；但玩家可能是「装到一半直接把浏览器叉掉」，
   或者手机上划掉微信，这时候最后一次操作可能没写盘。
   这里在页面真正离开前再兜一次：先把当前工作台存进 benches，再整体写一次档。 */
let _lastLeaveSave=0;
function saveOnLeave(){
  try{
    if(!state)return;                    /* 还没开档（停在标题页）就别写 */
    if(document.getElementById('titleScr')&&!document.getElementById('titleScr').classList.contains('hide'))return;
    saveBench();
    save();
    _lastLeaveSave=Date.now();
  }catch(e){}
}
window.addEventListener('pagehide',saveOnLeave);
window.addEventListener('beforeunload',saveOnLeave);
/* 微信/手机浏览器切后台时 pagehide 不一定触发，补一条可见性兜底（节流 3 秒） */
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='hidden')return;
  if(Date.now()-_lastLeaveSave<3000)return;
  saveOnLeave();
});
document.getElementById('tbMask').onclick=e=>{if(e.target.id==='tbMask'){const o=state.tb;if(o){o.closed=true;save();}tbRender();}};
document.getElementById('tbMini').onclick=()=>{const o=state.tb;if(o){o.closed=false;save();tbRender();}};
try{const vm=document.getElementById('verMark');if(vm){vm.textContent=APP_VER_TXT;vm.style.display='none';}}catch(e){}
/* 标题页花瓣：26 片，随机位置/速度/大小 */
try{
  (function(){
    const box=document.getElementById('tPetals');
    if(!box)return;
    let html='';
    for(let i=0;i<26;i++){
      const l=(Math.random()*100).toFixed(1);
      const dur=(7+Math.random()*7).toFixed(1);
      const delay=(-Math.random()*12).toFixed(1);
      const sz=(6+Math.random()*7).toFixed(1);
      const op=(0.45+Math.random()*0.5).toFixed(2);
      html+='<i style="left:'+l+'%;width:'+sz+'px;height:'+(sz*0.8).toFixed(1)+'px;animation-duration:'+dur+'s;animation-delay:'+delay+'s;opacity:'+op+'"></i>';
    }
    box.innerHTML=html;
  })();
}catch(e){}
try{
  if(!load())newGame(true);
}catch(e){
  try{console.error('boot failed',e);}catch(_){}
  try{
    var _mt=document.getElementById('tVer');
    if(_mt)_mt.textContent=APP_FULL+' · 启动失败';
  }catch(_){}
  /* 存档不兼容/损坏：清掉存档，给玩家一个能继续的入口 */
  try{
    var _box=document.createElement('div');
    _box.style.cssText='position:fixed;left:16px;right:16px;bottom:96px;z-index:9999;padding:14px;border-radius:14px;background:rgba(60,20,16,.96);border:1px solid #a15454;color:#ffe3e0;font:13px/1.6 -apple-system,sans-serif';
    _box.innerHTML='存档读取失败（可能是旧版本存档）。<br>点下面的按钮重置存档并重新开始。';
    var _b=document.createElement('button');
    _b.textContent='重置存档并重新开始';
    _b.style.cssText='margin-top:10px;padding:10px 16px;border-radius:10px;border:1px solid #ffd6e2;background:#f286a6;color:#2a1705;font-weight:700';
    _b.onclick=function(){location.reload();};
    _box.appendChild(document.createElement('br'));_box.appendChild(_b);
    document.body.appendChild(_box);
  }catch(_){}
}

function maybeOnboard(after){
  /* 每开一局都讲一次（存在本局 state 里），刷新页面后新开也会再看到；
     以前用 localStorage 永久记住，刷新一次就再也不出现了。 */
  let seen=false;
  try{seen=!!(state.tut&&state.tut.onboarded);}catch(e){}
  if(seen){_openingSeq=false;setTimeout(()=>{try{coachRefresh();}catch(e){}},240);if(after)after();return;}
  setTimeout(()=>{
    const _mobileWhere=(typeof isMobile==='function'&&isMobile());
    modal('欢迎来到旺财装机店',
      `<div style="line-height:1.85">
        ${_mobileWhere?'当前「单据」页上方有一条':'左边最上面有一张'}<b>「新手任务」</b>${_mobileWhere?'清单':'卡片'}，共六步，做到了会自动打勾：<br>
        <b>① 接一单 → ② 进一个件 → ③ 装上工作台 → ④ 检查变绿 → ⑤ 交付 → ⑥ 打烊</b>
      </div>
      <div style="margin-top:10px;font-size:11.5px;color:#8b93a1;line-height:1.75">
        不用记流程：清单会告诉你现在该做什么。<br>
        客户给的部件费是预算，花得越少赚得越多——但别省到跑不动客户的软件。
      </div>`,
      ()=>{try{state.tut=state.tut||{};state.tut.onboarded=1;save();}catch(e){}try{localStorage.setItem('pcbs2_onboard','1');}catch(e){}_openingSeq=false;setTimeout(()=>{try{coachRefresh();}catch(e){}},600);
        /* 弹窗关掉后延时 0.9 秒补念第一条：画框那条若被弹窗挡掉，这里兜住；
           已经念过则被 coachSay 的 2.5 秒去重挡掉，不会念两遍。 */
        setTimeout(function(){try{var _s=coachStep();if(_s&&typeof coachSay==='function')coachSay(_s.k,_s.title+'。'+_s.text);}catch(e){}},900);
      if(after)setTimeout(after,120);});
    const no=document.getElementById('mNo');if(no)no.style.display='none';
    const yes=document.getElementById('mYes');if(yes)yes.textContent='开始干活';
  },600);
}
function hideTitle(){const t=document.getElementById('titleScr');if(t)t.classList.add('hide');try{document.body.classList.remove('title-open');}catch(e){}}
let _titleFirst=true;
function showTitle(){
  const t=document.getElementById('titleScr');if(!t)return;
  try{ document.documentElement.classList.add('ready'); }catch(e){}
  /* 顺序：CG → 底图露出（停留一会儿）→ 开始界面，底图再撤 */
  if(_titleFirst){
    _titleFirst=false;
    setTimeout(function(){
      try{ hideBootStill(); }catch(e){}
      try{ showTitle(); }catch(e){}
    },1300);
    return;
  }
  try{document.body.classList.add('title-open');}catch(e){}
  const ver=document.getElementById('tVer');if(ver)ver.textContent=APP_VER_TXT;
  const hint=document.getElementById('tSaveHint');
  if(hint){
    try{
      const raw=localStorage.getItem(SAVE);
      if(raw){const d=JSON.parse(raw).state;hint.textContent=`已有存档：${d.date} · 第 ${d.day} 天（读档可继续）`;}
      else hint.textContent='还没有存档，将从第 1 天开始';
    }catch(e){hint.textContent='还没有存档，将从第 1 天开始';}
  }
  t.classList.remove('hide');
}
applyState(state,build);
(function stampVer(){
  try{
    document.title='旺财装机店 '+APP_FULL;
    const t=document.getElementById('verTag');if(t)t.textContent=APP_VER_TXT;
    const m=document.getElementById('verLine');if(m)m.textContent='当前版本 '+APP_FULL;
  }catch(e){}
})();
applyLayoutShell();
renderAll();
(function bindTitle(){
  const st=document.getElementById('tStart'),ld=document.getElementById('tLoad');
  const startNew=(mode)=>{
    /* 先盖加载页，再动标题/底页；否则会闪出一帧没有 UI 的游戏页面。 */
    try{showBootStill();}catch(e){}
    try{
      /* 先把自动存档清掉再开新局，避免任何残留被下一次 load 读回来 */
      try{localStorage.removeItem(SAVE);}catch(e){}
      _openingSeq=true;try{_openingUntil=Date.now()+6000;}catch(e){}
      window.__booting=true;
      /* 12 秒保险：说明卡还开着就等它关；关了就立刻解锁开场锁。
         以前这里还要求 state.tut.onboarded 已置位，可说明卡只要不是从
         「开始干活」按钮关掉的（点空白、被剧情顶掉、旧存档没这个字段），
         onboarded 就一直是 undefined —— 开场锁挂到 30 秒兜底才松，
         玩家接完单看到的就是「引导框整段消失、只剩高亮框」。 */
      setTimeout(()=>{try{
        const _m=document.getElementById('mask');
        if(_m&&_m.classList.contains('on'))return;
        _openingSeq=false;coachRefresh();
      }catch(e){}},12000);
      /* 更长的兜底：万一说明流程本身断了，也不要把玩家永久锁住。 */
      setTimeout(()=>{try{_openingSeq=false;coachRefresh();}catch(e){}},30000);
      newGame();
      window.__inGame=true;
      try{window.__gameNo=(window.__gameNo||0)+1;}catch(e){}
      /* 引导模式：跟着走 = 全程只能用高亮处的操作；自己玩 = 不弹引导 */
      state.tut=state.tut||{done:{},hidden:false};
      state.tut.guideOff=(mode==='free');
      state.panel='jobs';if(isMobile())mViewSet('docs',true);renderAll();
      try{window.scrollTo(0,0);}catch(e){}

    }catch(err){
      try{toast('开新局出错：'+(err&&err.message||err));console.error(err);}catch(e){}
    }finally{
      hideTitle();
      try{
        const m=document.querySelector('main');
        if(m){m.classList.remove('bootIn');void m.offsetWidth;m.classList.add('bootIn');
          setTimeout(()=>{try{m.classList.remove('bootIn');}catch(e){}},700);}
      }catch(e){}
      /* 开局：只调用一次 runBootIntro，顺序全部写在那里面 */
      try{window.__booting=true;}catch(e){}
      setTimeout(function(){
        Promise.resolve()
          .then(function(){return (typeof runBootIntro==='function')?runBootIntro():null;})
          .catch(function(){})
          .then(function(){try{window.__booting=false;}catch(e){}});
      },1000);

    }
  };
  const begin=(mode)=>{
    let hasSave=false;
    try{hasSave=!!localStorage.getItem(SAVE);}catch(e){}
    if(!hasSave){startNew(mode);return;}
    modal('开始新游戏',
      `<div class="warnBox">
         <div class="warnMain">⚠️ 当前自动存档会被覆盖</div>
         <div class="warnSub">手动存档位不受影响</div>
       </div>
       <div class="warnTip">想接着玩旧进度，请返回点「读档」。</div>`,
      ()=>startNew(mode));
    const no=document.getElementById('mNo');if(no){no.style.display='';no.textContent='取消';}
    const yes=document.getElementById('mYes');if(yes)yes.textContent='开始新游戏';
  };
  if(st)st.onclick=()=>begin('guided');
  /* 标题页 BGM：先自己试一次（APK 壳里已放开自动播放），不行再由首次点击兜底 */
  (function(){
    let started=false;
    const kick=()=>{
      if(started)return;started=true;
      try{ if(typeof aeInit==='function')aeInit(); }catch(e){}
      try{ if(typeof aeResume==='function')aeResume(); }catch(e){}
      try{ if(typeof aeMusicStart==='function'&&!AE.muted)aeMusicStart(); }catch(e){}
      try{document.removeEventListener('pointerdown',kick);document.removeEventListener('keydown',kick);}catch(e){}
    };
    document.addEventListener('pointerdown',kick,{once:false});
    document.addEventListener('keydown',kick,{once:false});
    /* 不靠点击：等首屏渲染稳定后再起播，避免开头那一下卡顿 */
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ setTimeout(kick, 900); });
    });
  })();
  const ts=document.getElementById('tSet');
  if(ts)ts.onclick=(e)=>{e.stopPropagation();try{if(typeof aeInit==='function')aeInit();}catch(err){}try{openSettings();}catch(err){}};

  if(ld)ld.onclick=()=>openSave('title');
  showTitle();
  watchModals();
})();

/* ================= 电脑端引导 v3（状态机，整块重写） ================= */
(function(){
  const DESKTOP = (function(){ try{ return !(typeof isMobile==='function' && isMobile()); }catch(e){ return true; } })();
  const COACH = { state:'idle', key:null, el:null, timer:0, holdUntil:0, miss:0, first:null };

  function $id(x){ return document.getElementById(x); }
  function visible(el){
    if(!el || el.nodeType!==1) return false;
    const r = el.getBoundingClientRect();
    if(!r.width || !r.height) return false;
    if(el.offsetParent===null && el!==document.body) return false;
    return true;
  }
  function scrollParent(el){
    let n = el.parentElement;
    while(n && n!==document.body && n!==document.documentElement){
      let cs=null; try{ cs=getComputedStyle(n); }catch(e){}
      if(cs && (cs.overflowY==='auto'||cs.overflowY==='scroll') && n.scrollHeight>n.clientHeight+2) return n;
      n = n.parentElement;
    }
    return null;
  }
  function wantPage(step){
    const k = step.k||'', cat = step.cat||null;
    if(k.indexOf('install:')===0){
      const has = (state.inv||[]).some(x=>x.cat===cat && !x.broken);
      return {panel: has?'inv':'shop', cat:cat};
    }
    if(k.indexOf('buy:')===0 || k==='cpu_ig' || k==='cpu_slider') return {panel:'shop', cat:cat};
    if(k==='accept' || k==='close') return {panel:'jobs', cat:null};
    return null;
  }
  function paint(el, step){
    const c=$id('coach'), hole=$id('coachHole'), tip=$id('coachTip');
    if(!c||!hole||!tip) return false;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth||1280, vh = window.innerHeight||720, pad = 6;
    const L = Math.max(0, r.left-pad), T = Math.max(0, r.top-pad);
    const R = Math.min(vw, r.right+pad), B = Math.min(vh, r.bottom+pad);
    hole.style.left = L+'px'; hole.style.top = T+'px';
    hole.style.width = Math.max(0,R-L)+'px'; hole.style.height = Math.max(0,B-T)+'px';
    hole.style.opacity = '1';
    const sh = (id,l,t,w,h)=>{ const e=$id(id); if(!e) return;
      e.style.left=l+'px'; e.style.top=t+'px';
      e.style.width=Math.max(0,w)+'px'; e.style.height=Math.max(0,h)+'px'; };
    sh('csT',0,0,vw,T); sh('csB',0,B,vw,vh-B);
    sh('csL',0,T,L,Math.max(0,B-T)); sh('csR',R,T,vw-R,Math.max(0,B-T));
    const tw = Math.min(360, vw-32); tip.style.maxWidth = tw+'px';
    const th = tip.offsetHeight || 150;
    let top = r.bottom+14;
    if(top+th > vh-8) top = r.top-th-14;
    if(top < 8) top = Math.max(8, Math.min(vh-th-8, r.bottom+10));
    tip.style.left = Math.max(12, Math.min(r.left, vw-tw-12))+'px';
    tip.style.top = top+'px';
    const tt=$id('coachTitle'), tx=$id('coachText');
    if(tt && tt.textContent!==step.title) tt.textContent=step.title;
    if(tx && tx.textContent!==step.text) tx.textContent=step.text;
    return true;
  }
  function show(step, el){
    const c = $id('coach'); if(!c) return;
    if(!paint(el, step)) return;
    c.classList.add('fast');
    c.classList.add('on');
    COACH.state='show'; COACH.key=step.k; COACH.el=el; COACH.miss=0;
    try{ _coachKey = step.k; }catch(e){}
    const cn=$id('coachNext');
    if(cn) cn.style.display = (step.k==='cpu_target')?'':'none';
    if(COACH.first===null) COACH.first = step.k;
    const cs=$id('coachSkip');
    if(cs) cs.style.display = (COACH.first===step.k)?'':'none';
    if(step.k==='cpu_target' && !(state.tut && state.tut.targetSeen)){
      if(COACH.tgtT) clearTimeout(COACH.tgtT);
      COACH.tgtT = setTimeout(function(){
        COACH.tgtT=0;
        try{ state.tut=state.tut||{}; state.tut.targetSeen=1; save(); }catch(e){}
        COACH.state='idle'; COACH.key=null;
        hideNow(); schedule(160);
      }, 6000);
    }
  }
  function hideNow(){
    const c=$id('coach'); if(c) c.classList.remove('on');
    COACH.state='idle';
  }
  function schedule(ms){
    if(COACH.timer) clearTimeout(COACH.timer);
    COACH.timer = setTimeout(function(){ COACH.timer=0; tick(); }, ms||40);
  }
  function tick(){
    try{
      const scr = $id('titleScr');
      if(scr && !scr.classList.contains('hide')){ COACH.key=null; hideNow(); return; }
      const t = state.tut||{};
      if(t.guideOff){ COACH.key=null; hideNow(); return; }
      const mask = $id('mask');
      if(mask && mask.classList.contains('on')){ COACH.state='wait'; schedule(240); return; }
      if(typeof _openingSeq!=='undefined' && _openingSeq){ schedule(240); return; }
      if($id('storyPop')){ schedule(240); return; }

      const step = (typeof coachStep==='function')? coachStep():null;
      if(!step){ COACH.key=null; hideNow(); return; }

      /* 步骤没变：只更新几何，绝不重播 */
      if(COACH.key===step.k && COACH.state==='show'){
        let el=null; try{ el = step.sel(); }catch(e){}
        if(visible(el)){ paint(el, step); COACH.el=el; if(COACH.timer===0 && _coachAutoFollow) schedule(120); }
        return;
      }

      /* 新步骤：先收起 → 切页 → 停 340ms → 再出现 */
      if(COACH.key!==step.k){
        hideNow();
        COACH.key = step.k;
        COACH.holdUntil = performance.now() + 340;
        COACH.miss = 0;
      }
      if(step.k==='cpu_ig' || step.k==='cpu_slider'){
        let open=false; try{ open = shopFilterState(); }catch(e){}
        if(!open){ try{ shopFilterOpen[_filterKey()]=true; }catch(e){} ; renderAll(); schedule(200); return; }
      }
      const need = wantPage(step);
      if(need){
        const wrongPanel = state.panel!==need.panel;
        const wrongCat = !!need.cat && curCat!==need.cat && (need.panel==='shop'||need.panel==='inv');
        if(wrongPanel || wrongCat){
          hideNow();
          state.panel = need.panel;
          if(need.cat) curCat = need.cat;
          if(need.panel==='shop') shopLimit = Math.max(shopLimit||40, 40);
          renderAll();
          schedule(220);
          return;
        }
      }
      if(performance.now() < COACH.holdUntil){ schedule(80); return; }

      let el=null; try{ el = step.sel(); }catch(e){}
      if(!visible(el)){
        const h=$id('coachHole'); if(h) h.style.opacity='0';
        COACH.miss++;
        schedule(COACH.miss<8 ? 110 : 300);
        return;
      }
      /* 一次性滚到位（不平滑、不分段），再拍上去 */
      const box = scrollParent(el);
      const vh = window.innerHeight||720, hi=110, lo=vh-150;
      let r = el.getBoundingClientRect();
      if(r.top<hi || r.bottom>lo){
        const delta = (r.top+r.bottom)/2 - (hi+lo)/2;
        try{ if(box) box.scrollTop += delta; else window.scrollBy(0, delta); }catch(e){}
        try{ r = el.getBoundingClientRect(); }catch(e){}
      }
      show(step, el);
    }catch(e){}
  }

  /* —— 对外只暴露这一组 —— */
  window.__coachTick = tick;
  window.__coachSchedule = schedule;

  if(!DESKTOP) return;   /* 手机端完全不接管 */

  coachRefresh = function(){ schedule(0); };
  coachReposition = function(){ schedule(0); };
  drawCoach = function(el, step){ if(el && step) show(step, el); };
  positionCoach = function(el){ if(!el) return false; const st=coachStep(); return !!(st && paint(el, st)); };
  coachScrollTo = function(el, dur, done){ try{ done && done(); }catch(e){} return true; };
  coachWatchScroll = function(){
    if(window.__coachScrollHook) return;
    window.__coachScrollHook = 1;
    const kick = function(){
      const c=$id('coach');
      if(c && c.classList.contains('on')) schedule(90);
    };
    window.addEventListener('scroll', kick, {passive:true, capture:true});
    window.addEventListener('resize', function(){ schedule(120); }, {passive:true});
  };
  /* 外部（38 处）调用 coachHide：只做「请求」，真正隐藏由状态机在 tick 里判定，
     避免和步骤切换互相打架（之前提示框弹两次就是两边抢着 hidn/show）。 */
  coachHide = function(){
    const step = (typeof coachStep==='function')? coachStep():null;
    const scr = $id('titleScr');
    /* 场景/弹窗/加载页开着时不能「排程」——必须立刻收，
       否则会看到引导框压在剧情上面（排程那 60ms 里玩家就看到了）。 */
    let _busy=false;
    try{
      const m=document.getElementById('mask');
      _busy=!!((m&&m.classList.contains('on'))||
        document.getElementById('startLoad')||document.getElementById('chatPop')||
        document.getElementById('plotEvent')||document.getElementById('storyPop'));
    }catch(e){}
    if(_busy){
      hideNow(); COACH.key=null;
      /* 关键：被剧情/弹窗收起来的框，不算「画过」。
         否则场景结束后 coachRefresh 看到步骤没变会直接返回，框永远回不来
         ——首次进游戏「只有语音没有框」就是这么来的。 */
      try{_coachKey=null;_coachDrawnKey=null;}catch(e){}
      return;
    }
    if(!step || (scr && !scr.classList.contains('hide'))){ hideNow(); COACH.key=null; return; }
    schedule(60);
  };
})();


/* ==================== 留声机系统（GRAMO） ====================
   爸爸留下的留声机 + 三张碟：
     · 传奇碟片「0_0000%」—— 第 3 天神秘人上门兜售，¥1500
     · 7co 典藏集（28 首）—— 第 5 天替某菇修好资料机之后，生活里解锁购买
   没有碟的时候右下角不出现留声机；有碟之后才能听，播放器只放已拥有的曲目。
   ============================================================ */
(function(){
  var SEVEN=[];
  for(var i=2;i<=29;i++){
    var n=(i<10?'0':'')+i;
    SEVEN.push('m'+n+((i===10||i===28)?'.ogg':'.mp3'));
  }
  var DISCS={
    legend:{id:'legend',name:'传奇碟片「0_0000%」',price:1500,tracks:['m01.mp3'],
      desc:'神秘人塞给你的一张碟，只有一首，但听一次就忘不掉。'},
    seven:{id:'seven',name:'7co 典藏集（28 首）',price:2200,tracks:SEVEN,
      desc:'某菇说：到我家来买，好汀的管够。'}
  };
  function G(){
    if(!state.gramo) state.gramo={own:{},intro:0,day3:0,boughtLegend:0,order5:0,shop7:0,phone:0,orderDay:0};
    var g=state.gramo;
    if(g.own==null)g.own={}; if(g.intro==null)g.intro=0; if(g.day3==null)g.day3=0;
    if(g.boughtLegend==null)g.boughtLegend=0; if(g.order5==null)g.order5=0; if(g.shop7==null)g.shop7=0;
    if(g.phone==null)g.phone=0; if(g.orderDay==null)g.orderDay=0;
    return g;
  }
  function owned(){ var g=G(),a=[]; for(var k in g.own) if(g.own[k]&&DISCS[k]) a.push(k); return a; }
  function allow(){ var a=[],o=owned(); for(var i=0;i<o.length;i++) a=a.concat(DISCS[o[i]].tracks); return a; }
  function sync(){
    try{ if(window.MusicPlayer&&MusicPlayer.setAllow) MusicPlayer.setAllow(allow()); }catch(e){}
  }
  function buy(id){
    var d=DISCS[id]; if(!d) return;
    var g=G(); if(g.own[id]){ toast('这张碟你已经有了'); return; }
    var cash=state.cash||0;
    if(cash<d.price){ toast('钱不够，还差 ¥'+(d.price-cash)); return; }
    state.cash-=d.price; g.own[id]=1;
    if(id==='legend'){ g.boughtLegend=1; g.orderDay=(state.day||1)+2; }
    try{renderAll();}catch(e){} try{save();}catch(e){} sync();
    toast('买下了「'+d.name+'」，右下角留声机可以听了');
  }

  /* ---- 弹窗：统一用游戏自带的 modal 风格 ---- */
  function discCard(d,ownedFlag){
    return '<div class="rowbox" style="margin:10px 0;padding:10px 12px;border:1px solid #f0cdd6;border-radius:12px;background:#fffdfb">'
      + '<div style="font-weight:700;color:#b8546a">'+d.name+'</div>'
      + '<div style="font-size:11.5px;color:#9b8088;margin:4px 0 6px;line-height:1.6">'+d.desc+'</div>'
      + '<div style="display:flex;justify-content:space-between;align-items:center">'
      +   '<b style="color:#d2768a">¥'+d.price+'</b>'
      +   (ownedFlag?'<span style="font-size:11px;color:#8fb98f">已拥有</span>':'')
      + '</div></div>';
  }

  /* 剧情卡：自己创建、自己销毁，不借用通用弹窗（共用弹窗会被上一幕的关闭动画顶掉） */
  function introCard(title, html, btnText, onNext){
    var ov=document.createElement('div');
    ov.id='introCard';
    ov.innerHTML='<div class="ic-box"><div class="ic-hd">'+title+'</div>'
      +'<div class="ic-body">'+html+'</div>'
      +'<div class="ic-acts"><button class="ic-btn" id="icNext">'+btnText+'</button></div></div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ ov.classList.add('on'); });
    var born=Date.now();
    var btn=ov.querySelector('#icNext');
    btn.onclick=function(){
      if(Date.now()-born<420) return;         /* 手滑不生效 */
      ov.classList.remove('on');
      setTimeout(function(){ try{ov.remove();}catch(e){} onNext&&onNext(); },240);
    };
  }

  function introPopup(){
    /* 开头：爸爸寄来的两个箱子 —— 留声机 + 一台旧电脑。 */
    return new Promise(function(resolve){
      var PAGES=[
        {t:'门口的两个纸箱',
         html:'<div class="ic-text">'
           +'早上一拉开卷帘门，门口摞着两个纸箱，边上还有一截胶带没撕干净。<br>'
           +'寄件人一栏是同一个名字，写着「爸」。<br><br>'
           +'<span class="ic-note">他这人从来不打电话——寄到了就是寄到了。</span></div>',
         ok:'拆第一个'},
        {t:'爸爸寄来的留声机',
         html:'<img src="assets/gramo.webp?v=01230" alt="" class="ic-img">'
           +'<div class="ic-text">'
           +'第一个箱子里是一台旧留声机，铜喇叭擦得能照出人影。<br>'
           +'底下压着一张字条，字迹还是他那手歪歪扭扭的字：<br><br>'
           +'<i class="ic-quote">「店里要是太安静了，就放点歌。<br>碟得自己攒，好的东西都藏得深。」</i><br><br>'
           +'<span class="ic-note">留声机放在了柜台右下角。没有碟的时候它不会响。</span></div>',
         ok:'再拆第二个'},
        {t:'第二个箱子里是台电脑',
         html:'<div class="ic-text">'
           +'第二个箱子沉得多。掀开纸壳，是一台被拆得差不多的老机器，配件用气泡膜一件件裹好：<br><br>'
           +'<div class="ic-spec"><b>爸爸的旧整机</b><br>'
           +'CPU　i3-10100<br>内存　8G × 2<br>硬盘　512G M.2 固态<br>'
           +'显卡　GTX 750 Ti<br>电源　500W</div><br>'
           +'箱盖内侧用油性笔写了一句：<br>'
           +'<i class="ic-quote">「这台你留着练手。拆坏了不心疼，装好了就是你的第一台。」</i><br><br>'
           +'<span class="ic-note">整机已经收进「仓库 · 整机」里了。</span></div>',
         ok:'收下'}
      ];
      var i=0;
      function step(){
        if(i>=PAGES.length){ resolve(true); return; }
        var pg=PAGES[i];
        introCard(pg.t, pg.html, pg.ok, function(){
          if(i===PAGES.length-1){
            try{ giftDadPC(); }catch(e){}
            phonePing(function(){ resolve(true); });
            return;
          }
          i++; step();
        });
      }
      step();
    });
  }

  /* 手机缩略图 + 消息音：留声机之后、陈默剧情之前的那一下 */
  function phonePing(done){
    try{ AE.ctx&&AE.ctx.resume(); }catch(e){}
    try{ SFX.msgOut(); }catch(e){}
    var box=document.createElement('div');
    box.id='phonePing';
    box.innerHTML='<div class="pp-ic">✉</div>'
      + '<div class="pp-txt"><b>陈默</b><span>在吗</span></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function(){ box.classList.add('on'); });
    setTimeout(function(){
      box.classList.remove('on');
      setTimeout(function(){
        try{ box.remove(); }catch(e){}
        if(typeof done==='function') done();
      }, 320);
    }, 1600);
  }

  function offerLegend(){
    modal('神秘人',
      '<div style="font-size:12.5px;line-height:1.9;color:#6b5b60">'
      + '一个裹着围巾的人推门进来，没看货架，直接把一张碟拍在柜台上。<br>'
      + '「这张，你听一次就知道值。一千五，不还价。」<br><br>'
      + '<span style="color:#9b8088;font-size:11.5px">碟面上一片空白，没有名字。</span></div>', null);
    setTimeout(function(){
      var yes=document.getElementById('mYes'), no=document.getElementById('mNo');
      if(yes){
        yes.textContent='买下 ¥1500';
        yes.onclick=function(){
          if((state.cash||0)<1500){ toast('钱不够，还差 ¥'+(1500-(state.cash||0))); return; }
          try{closeMask(document.getElementById('mask'));}catch(e){}
          buy('legend');
          setTimeout(function(){
            toast('碟听上了——那人临走说了句「过两天可能还得麻烦你」');
          },900);
        };
      }
      if(no){
        no.textContent='先不买';
        no.onclick=function(){
          try{closeMask(document.getElementById('mask'));}catch(e){}
          leavePhone();
        };
      }
    },30);
  }

  /* 不买 → 留号码到「生活」 */
  function leavePhone(){
    var g=G();
    if(g.phone||g.own.legend) return;
    g.phone=1;
    try{save();}catch(e){}
    setTimeout(function(){
      modal('柜台上的纸条',
        '<div style="font-size:12.5px;line-height:1.9;color:#6b5b60">'
        + '那人把碟收回怀里，在柜台留了张纸条，上面写着一个号码。<br>'
        + '「想通了就打这个号，我随时在。」<br><br>'
        + '<span style="color:#b8546a;font-weight:700">号码收进了「生活」里，随时可以打过去。</span>'
        + '</div>', null);
    },600);
  }

  /* 打电话买碟 */
  function callSeller(){
    var g=G();
    if(g.own.legend){ modal('神秘人','<div style="font-size:12.5px;line-height:1.8">「碟还好听吧？」他笑了一声，挂了。</div>',null); return; }
    var cash=state.cash||0;
    modal('拨打纸条上的号码',
      '<div style="font-size:12.5px;line-height:1.9;color:#6b5b60">'
      + '响了两声就接了。<br>「我就知道你会打来。碟还在，一千五。」<br><br>'
      + '<span style="color:#9b8088;font-size:11.5px">当前现金 ¥'+cash+'</span></div>', null);
    setTimeout(function(){
      var yes=document.getElementById('mYes');
      if(yes){
        yes.textContent='买下 ¥1500';
        yes.onclick=function(){
          if((state.cash||0)<1500){ toast('钱不够，还差 ¥'+(1500-(state.cash||0))); return; }
          try{closeMask(document.getElementById('mask'));}catch(e){}
          buy('legend');
          toast('他说过两天还有事找你');
        };
      }
    },30);
  }

  function offerSevenShop(){
    toast('生活里多了一样东西：某菇的碟片');
  }

  /* ---- 第 5 天：某菇的救命单 ---- */
  function makeSevenJob(day){
    var s={day:day,id:'g5',who:'某菇',role:'7co 的粉丝',av:'菇',col:'#ff9ac7',
      lines:[
        '我是某菇。听说你这儿能把死机的机器救活？',
        '里面有我追了七年的东西，比这台机器值钱多了。今天能修好吗？'
      ],
      job:{cat:'办公机',tier:0,name:'救命单 · 某菇的资料机',
        sw:'资料救援（不重装也行）',level:'m',
        target:{ts:0,cs:2000,ram:8},newOnly:false,tight:false,
        partBudget:900,labor:600,
        extra:['她说资料比机器重要，别乱重装系统']}};
    var j=buildStoryJob(s);
    j.id='GR5';j.storyId='g5';j.dueDay=day;   /* 当天必须交 */
    return j;
  }

  /* ---- 每天开始 ---- */
  function onDay(day){
    var g=G();
    /* 开场的留声机包褒不在按天触发，改成加载页撤掉那一刻（见 hideBootLoad 挂钩） */
    if(day===3&&!g.day3){
      g.day3=1; setTimeout(offerLegend,1200);
    }
    sync();
  }

  /* ---- 交付时判断：修好某菇的机器 → 解锁 7co 碟 ---- */
  function onDelivered(job){
    if(!job) return;
    if(job.id==='GR5'||job.storyId==='g5'){
      var g=G();
      if(!g.order5){
        g.order5=1;g.shop7=1;
        try{save();}catch(e){}
        setTimeout(function(){
          modal('某菇',
            '<div style="font-size:12.5px;line-height:1.9;color:#6b5b60">'
            + '「修好了！我的宝贝资料全在！」<br>'
            + '她抱着机箱笑，然后压低声音：<br><br>'
            + '<i style="color:#b8546a">「我是某菇，你修好了我的电脑，真是我的救命恩人，'
            + '以后你可以到我这里来买好汀的～我家还蛮大的，买完了可以直接睡，没问题的。」</i><br><br>'
            + '<span style="color:#9b8088;font-size:11.5px">生活 里解锁了「7co 典藏集」的购买。</span>'
            + '</div>', null);
        },1200);
      }
    }
  }

  /* 在播放器启动前就把白名单设好：它 defer 执行，比这里晚 */
  try{
    window.MUSIC_PLAYER_OPTIONS = Object.assign({}, window.MUSIC_PLAYER_OPTIONS, {allow: allow()});
  }catch(e){}

  /* ================= 挂到游戏上 ================= */
  /* 1) 开局：重置留声机状态 */
  try{
    var _newGame=newGame;
    newGame=function(silent){
      var r=_newGame.apply(this,arguments);
      try{ state.gramo={own:{},intro:0,day3:0,boughtLegend:0,order5:0,shop7:0}; }catch(e){}
      sync();
      return r;
    };
  }catch(e){}

  /* 2) 每天开始：注入第 5 天的单子 + 触发剧情 */
  try{
    var _makeJobs=makeJobs;
    makeJobs=function(dateStr,day){
      var jobs=_makeJobs.apply(this,arguments)||[];
      var g=G();
      if(g.orderDay&&day>=g.orderDay&&!g.order5&&!jobs.some(function(x){return x&&x.id==='GR5';})){
        try{ jobs.push(makeSevenJob(day)); }catch(e){}
      }
      setTimeout(function(){onDay(day);},600);
      return jobs;
    };
  }catch(e){}

  /* 3) 交付成功：解锁碟片 */
  try{
    var _deliver=deliver;
    deliver=function(){
      var before=state.activeId?job():null;
      var dupBefore=(state.machines||[]).length;
      var r=_deliver.apply(this,arguments);
      setTimeout(function(){
        try{
          /* 只有真的交付成功（story.done 里记了 g5）才解锁，失败不算 */
          var done=(state.story&&state.story.done)||{};
          if(done['g5']) onDelivered({id:'GR5',storyId:'g5'});
        }catch(e){}
      },300);
      return r;
    };
  }catch(e){}

  /* 4) 生活商店：加碟片货架 */
  try{
    var _modal=modal;
    modal=function(t,b,ok){
      var r=_modal.apply(this,arguments);
      try{
        if(t&&t.indexOf('生活')===0){
          var g=G();
          var body=document.getElementById('mBody');
          if(body){
            var html='<div style="margin-top:14px;border-top:1px dashed #eccfd7;padding-top:12px">'
              + '<div style="font-weight:700;color:#b8546a;margin-bottom:6px">留声机 · 碟片</div>';
            if(g.phone&&!g.own.legend){
              html+='<div style="margin:8px 0"><button class="mini" data-gramo="call">拨打陌生号码（买碟 ¥1500）</button></div>';
            }
            if(!g.boughtLegend&&!g.own.legend&&!g.phone){
              html+='<div style="font-size:11.5px;color:#b39aa2;margin-bottom:8px">留声机还空着。第 3 天会有人上门卖碟。</div>';
            }
            if(g.own.legend) html+=discCard(DISCS.legend,true);
            else if(g.boughtLegend===0&&state.day>=3){
              html+='<div style="margin:8px 0"><button class="mini" data-gramo="legend">买下传奇碟片 ¥1500</button></div>';
            }
            if(g.shop7){
              if(g.own.seven) html+=discCard(DISCS.seven,true);
              else html+='<div style="margin:8px 0"><button class="mini" data-gramo="seven">买下 7co 典藏集 ¥2200</button></div>';
            }else{
              html+='<div style="font-size:11.5px;color:#b39aa2;margin-top:8px">某菇说：帮她修好电脑，就能来买碟了。</div>';
            }
            html+='</div>';
            body.innerHTML=body.innerHTML+html;
            body.querySelectorAll('[data-gramo]').forEach(function(btn){
              btn.onclick=function(){
                var id=btn.getAttribute('data-gramo');
                try{closeMask(document.getElementById('mask'));}catch(e){}
                if(id==='call'){ callSeller(); return; }
                buy(id);
              };
            });
          }
        }
      }catch(e){}
      return r;
    };
  }catch(e){}

  /* 5) 启动时同步一次（读档后也要生效） */
  setTimeout(function(){ try{ G(); sync(); }catch(e){} },1200);

  /* 开场留声机：由剧情序列在「招牌剧情」之后调用，返回 Promise */
  var introDone=null;
  var INTRO_V=4;                       /* 剧情改版号：变了就让所有人再看一次 */
  function introOnce(){
    var g=G();
    if(g.intro&&g.introV===INTRO_V) return Promise.resolve(false);
    if(introDone) return introDone;
    var waitFree=function(tries){
      return new Promise(function(res){
        var t=tries||0;
        var busy=(document.getElementById('plotEvent')||document.getElementById('chatPop')
                  ||(document.getElementById('mask')&&document.getElementById('mask').classList.contains('on')));
        if(!busy||t>12) return res();
        setTimeout(function(){ waitFree(t+1).then(res); },250);
      });
    };
    introDone=waitFree(0).then(function(){ return new Promise(function(r){ setTimeout(r,420); }); })
      .then(function(){ return introPopup(); })
      .then(function(){
      g.intro=1; g.introV=INTRO_V;
      try{save();}catch(e){}
      return true;
    });
    return introDone;
  }

  window.__GRAMO={G:G,allow:allow,owned:owned,buy:buy,sync:sync,DISCS:DISCS,onDay:onDay,introOnce:introOnce};

  /* ---- 内容更新通知：换了内容版本，进游戏弹一次游戏风弹窗 ---- */
  var BUILD_NOTES={
    '01286':['底图停留 1.3 秒再进标题页，顺序：CG→底图→开始界面'],
    '01285':['底图改为静态元素，第一帧就有图；修复底图背景失效'],
    '01284':['启动重排：CG → 底图 → 开始界面，去掉加载页与页面锁'],
    '01283':['启动阶段不显示页面底图，避免同一张图闪两次'],
    '01282':['剧情卡期间屏蔽引导与点击锁；字体统一'],
    '01281':['留声机三页改用独立剧情卡（不再被上一幕顶掉）'],
    '01280':['剧情框内边距留够，文字不再压花边'],
    '01279':['剧情框高度砍掉三分之一（212→142）'],
    '01278':['旁白与台词统一字号（之前旁白小一号）'],
    '01277':['留声机弹窗字号 15.5px；补回漏字「打电话」'],
    '01276':['留声机弹窗字号统一到 14.5px'],
    '01275':['删除引导卡「自愈」定时器（会凭空把框弹回来）'],
    '01274':['加载页只出现一次，不再二次闪现'],
    '01273':['修复留声机中间页一闪而过'],
    '01272':['剧情字号调小到 14.5px'],
    '01271':['引导只保留一个立绘，去掉隐藏式补丁'],
    '01270':['修复引导出现时残留剧情立绘（两个旺财）'],
    '01269':['留声机弹窗按返回不再卡住；剧情文字统一字号'],
    '01268':['留声机剧情插进真正的开局流程 runBootIntro'],
    '01267':['修复留声机剧情没出现（等上一幕关掉再弹，防误触）'],
    '01266':['爸爸的旧整机改用真实零件（i3-10100/B460/8G×2/512G NVMe/750Ti/500W）'],
    '01265':['留声机剧情回归并加长（爸爸送的旧整机）；仓库新增整机栏；微信点一次一句'],
    '01264':['留声机挪到陈默剧情前+手机消息提示；微信剧情改点击推进；顶栏贴顶'],
    '01263':['剧情 CG 绝对定位铺满，彻底消除黑边'],
    '01262':['退出游戏/返回主菜单只在游戏内设置里出现'],
    '01261':['CG恢复铺满；加载页恢复背景；设置里加退出游戏/返回主菜单；返回键只在标题页生效'],
    '01260':['更新直接一步到最新版本；同一版本不再重复弹窗'],
    '01259':['APK 内开场 CG 改由原生播放器播放'],
    '01258':['修复启动动画不播放（改用 DOM 设 src，无播放键）'],
    '01257':['App 一打开就播动画（只播这一次，点一下可跳过）'],
    '01256':['开机页换成动画：旺财挥手、开箱、拿螺丝刀、指主机'],
    '01255':['标题页排版下移，标题/按钮间距更舒展'],
    '01254':['页面底色奶油覆盖彻底去掉，原图显示'],
    '01253':['页面底色的奶白覆盖降到 12%，图基本原色显示'],
    '01252':['开机加载屏改纯色底（不再用图）；页面底色奶白层 90%→45%'],
    '01251':['开头所有遮罩层全部关闭（startVeil/奶油蒙版/暗角）'],
    '01250':['开场 CG 去掉淡入与奶油蒙版；加载页背景修复'],
    '01249':['右下角标注运行模式（在线/离线副本）'],
    '01248':['加载页彻底去掉奶白遮罩层'],
    '01247':['加载页去掉半透明，文字上移到天空区'],
    '01246':['换上你扩好的 9:20 背景'],
    '01245':['撤销本地扩图，恢复原始 9:16 背景'],
    '01244':['背景扩成 9:20，手机全屏无留白'],
    '01243':['背景改挂到 html 上，彻底铺满屏幕'],
    '01242':['背景图直接内嵌，不再先旧后新地闪一下'],
    '01241':['背景换成旺财立绘版（店门口高清竖图）'],
    '01240':['重新生成的高清背景（加载页与页面底色都用它）'],
    '01239':['检查到内容不是最新时自动更新，不用手动点'],
    '01238':['页面底色彻底换成店门口那张（去掉工具桌）'],
    '01237':['启动自动校验内容版本，旧缓存会被强制刷新'],
    '01236':['设置里加了「检查更新」按钮，能看内容/壳是否最新'],
    '01235':['游戏底色换成店门口那张（原来是工具桌）'],
    '01234':['恢复「已涂硅脂 / 工作区」标签，只去掉档位标签'],
    '01233':['引导卡片：立绘不再上下跳','去掉实时模糊，滚动更丝滑','便宜机箱提亮'],
    '01232':['去掉装机照片上的档位标签','便宜机箱换成写实内部照片'],
    '01231':['剧情 CG 改成完整显示＋模糊垫底，竖屏不再硬裁'],
    '01230':['开场留声机剧情加了特写插图'],
    '01229':['「清空工作台」按钮改成浅色樱花风'],
    '01228':['开场留声机剧情改为单按钮，确认后接着走陈默的单'],
    '01227':['开局加载页换成旺财图','BGM 起播延后，开头不再卡一下'],
    '01226':['返回键改为游戏内确认框（再等等 / 退出）'],
    '01225':['更新提示和下载进度搬到游戏内，以后不用再装壳'],
    '01224':['设置页可以看内容版本和壳版本'],
    '01223':['右下角不再显示版本号','内容更新改为游戏风弹窗提示'],
    '01222':['留声机开场改成加载结束后弹出','没有碟时角落不再出现音符','标题页 BGM 自动播放'],
    '01221':['留声机系统上线（碟片解锁）','神秘人上门卖碟、可留号码改天再买','某菇的救命单与 7co 典藏集'],
    '01219':['全屏适配修复','更新下载显示体积与速度']
  };
  (function(){
    try{
      var KEY='wc_seen_build', cur=(typeof APP_BUILD!=='undefined')?APP_BUILD:'';
      if(!cur) return;
      var last=localStorage.getItem(KEY);
      localStorage.setItem(KEY,cur);
      if(!last||last===cur) return;          /* 第一次玩 / 没换版本：不提示 */
      var notes=BUILD_NOTES[cur]||[];
      setTimeout(function(){
        modal('内容更新',
          '<div style="font-size:12.5px;line-height:1.9;color:#6b5b60">'
          + '<div style="color:#b8546a;font-weight:700;margin-bottom:6px">这次更新了什么</div>'
          + (notes.length
              ? notes.map(function(t){return '<div style="margin:3px 0">· '+t+'</div>';}).join('')
              : '<div style="margin:3px 0">· 内容已更新到 '+cur+'</div>')
          + '<div style="margin-top:10px;color:#9b8088;font-size:11.5px">更新说明会存在这里，旧版本可以直接跳过。</div>'
          + '</div>', null);
        setTimeout(function(){
          var y=document.getElementById('mYes'), n=document.getElementById('mNo');
          if(y) y.textContent='知道了';
          if(n) n.style.display='none';
        },30);
      },1500);
    }catch(e){}
  })();

  window.__GRAMO={G:G,allow:allow,owned:owned,buy:buy,sync:sync,DISCS:DISCS,onDay:onDay,introOnce:introOnce};

  /* ---- 内容更新提示：换了版本，标题页角上闪一条，不打断 ---- */
  (function(){
    try{
      var KEY='wc_seen_build';
      var cur=(typeof APP_BUILD!=='undefined')?APP_BUILD:'';
      var last=localStorage.getItem(KEY);
      if(!cur) return;
      localStorage.setItem(KEY,cur);
      if(!last||last===cur) return;           /* 第一次玩不提示 */
      setTimeout(function(){
        var el=document.createElement('div');
        el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--navh,60px) + 78px);'
          +'z-index:9600;padding:9px 16px;border-radius:20px;background:rgba(255,253,249,.97);'
          +'border:1.5px solid #f2c3cc;color:#b8546a;font-size:12px;box-shadow:0 8px 20px -8px rgba(180,90,110,.45);'
          +'opacity:0;transition:opacity .35s';
        el.textContent='内容已更新到 '+cur;
        document.body.appendChild(el);
        setTimeout(function(){el.style.opacity='1';},50);
        setTimeout(function(){el.style.opacity='0';},4200);
        setTimeout(function(){try{el.remove();}catch(e){}},4800);
      },1500);
    }catch(e){}
  })();
})();


/* ==================== 应用更新（网页实现，壳只负责装包） ====================
   · 更新检查、弹窗、进度条全在网页里，样式跟着游戏走
   · 壳通过 WCBridge 提供 shellVersion() 和 installApk(url)
   · 进度由壳回调 window.__apkProgress(pct, got, total, bps)
   ==================================================================== */
(function(){
  function shellVer(){
    try{ if(window.WCBridge&&WCBridge.shellVersion) return WCBridge.shellVersion()|0; }catch(e){}
    try{ var m=/WCShell\/(\d+)/.exec(navigator.userAgent||''); if(m) return parseInt(m[1],10)||0; }catch(e){}
    return 0;
  }
  function fmt(b){
    b=+b||0;
    if(b>=1048576) return (b/1048576).toFixed(1)+' MB';
    if(b>=1024) return Math.round(b/1024)+' KB';
    return b+' B';
  }
  function spd(bps){
    bps=+bps||0;
    if(bps>=1048576) return (bps/1048576).toFixed(1)+' MB/s';
    if(bps>=1024) return Math.round(bps/1024)+' KB/s';
    return bps? bps+' B/s':'--';
  }

  /* ---- 进度遮罩（网页自己做，样式跟游戏一致） ---- */
  var progEl=null, progBar=null, progTxt=null, progSub=null;
  function progressUI(){
    if(progEl) return;
    progEl=document.createElement('div');
    progEl.style.cssText='position:fixed;inset:0;z-index:9800;background:rgba(20,16,18,.55);display:flex;'
      +'align-items:center;justify-content:center;backdrop-filter:blur(2px)';
    progEl.innerHTML='<div style="width:min(320px,86vw);background:linear-gradient(170deg,#fffdf9,#fff3f4);'
      +'border:2px solid #f2c3cc;border-radius:20px;padding:20px 18px 18px;box-shadow:0 18px 42px -14px rgba(180,90,110,.5)">'
      +'<div style="text-align:center;color:#b8546a;font-weight:700;font-size:15px">正在下载更新</div>'
      +'<div id="__apkSub" style="text-align:center;color:#a98e95;font-size:11.5px;margin:6px 0 12px">连接中…</div>'
      +'<div style="height:7px;border-radius:99px;background:#f6dfe3;overflow:hidden">'
      +'<div id="__apkBar" style="height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#ffc2ce,#ff8fa8);transition:width .2s"></div>'
      +'</div></div>';
    document.body.appendChild(progEl);
    progBar=progEl.querySelector('#__apkBar');
    progSub=progEl.querySelector('#__apkSub');
  }
  function hideProgress(){ if(progEl){ try{progEl.remove();}catch(e){} progEl=null; } }

  window.__apkProgress=function(p,got,total,bps){
    try{
      progressUI();
      if(progBar) progBar.style.width=Math.max(0,Math.min(100,p|0))+'%';
      if(progSub){
        if(got<0) progSub.textContent='下载完成，正在调起安装…';
        else progSub.textContent=(got&&total? fmt(got)+' / '+fmt(total)+'   '+spd(bps) : '连接中…');
      }
      if(p>=100){ setTimeout(hideProgress,1200); }
    }catch(e){}
  };
  window.__apkFailed=function(msg){
    hideProgress();
    try{ toast('更新下载失败：'+(msg||'网络问题')); }catch(e){}
  };

  /* ---- 检查 + 弹窗 ---- */
  function showUpdate(o){
    modal('发现新版本',
      '<div style="font-size:12.5px;line-height:1.9;color:#6b5b60">'
      + '<div style="color:#b8546a;font-weight:800;font-size:14px">'+(o.name||('版本 '+o.code))+'</div>'
      + '<div style="color:#9b8088;font-size:11.5px;margin-top:2px">当前壳版本 '+shellVer()
      + ' → 最新 '+((o.name)||o.code)+'　更新包 '+fmt(o.size)+'</div>'
      + '<div style="color:#a98e95;font-size:11px;margin-top:6px">直接更新到最新版，不需要逐版本升级</div>'
      + (o.note?'<div style="margin-top:10px">'+o.note+'</div>':'')
      + '</div>', null);
    setTimeout(function(){
      var y=document.getElementById('mYes'), n=document.getElementById('mNo');
      if(y){
        y.textContent='立即更新';
        y.onclick=function(){
          try{closeMask(document.getElementById('mask'));}catch(e){}
          progressUI();
          try{
            if(window.WCBridge&&WCBridge.installApk) WCBridge.installApk(o.url);
            else window.open(o.url,'_blank');
          }catch(e){ hideProgress(); }
        };
      }
      if(n) n.onclick=function(){ markSkip(o.code); try{closeMask(document.getElementById('mask'));}catch(e){} };
      if(n) n.textContent='以后再说';
    },30);
  }

  function skipped(){ try{ return (localStorage.getItem('wc_upd_skip')|0)||0; }catch(e){ return 0; } }
  function markSkip(code){ try{ localStorage.setItem('wc_upd_skip',String(code|0)); }catch(e){} }

  /* 一次到位：直接读线上最新 version.json，装最大那个 code 的包（不做逐版本升级） */
  function fetchLatest(){
    return fetch('../apk/version.json?t='+Date.now(),{cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(o){
        if(!o||!o.code) return null;
        return o;                      /* version.json 永远指向最新一版 */
      });
  }

  function checkOnce(force){
    var sv=shellVer(); if(!sv) return;                 /* 不是 APK（浏览器打开）就不查 */
    fetchLatest().then(function(o){
      if(!o) return;
      if((o.code|0) <= sv) return;                     /* 已经是最新，什么都不做 */
      if(!force && (o.code|0) === skipped()) return;   /* 同一个版本不重复打扰 */
      showUpdate(o);
    }).catch(function(){});
  }
  /* 标题页出来之后再查，别和开场的弹窗撞 */
  setTimeout(checkOnce,2500);

  window.__WC_UPDATE={check:function(){ checkOnce(true); },shellVer:shellVer};
  window.__WC_SHOW_UPDATE=showUpdate;
})();


/* ==================== 返回键：游戏风退出确认 ==================== */
(function(){
  var asking=false;
  function closeTopLayer(){
    try{
      var m=document.getElementById('mask');
      if(m&&m.classList.contains('on')){ closeMask(m); return true; }
      var ss=document.getElementById('setSheet');
      if(ss){ ss.classList.remove('on'); setTimeout(function(){try{ss.remove();}catch(e){}},220); return true; }
    }catch(e){}
    return false;
  }
  window.__WC_BACK=function(){
    /* 有弹窗/面板开着：先收掉，不退出 */
    if(closeTopLayer()) return 'closed';
    /* 只有在标题（开始）页面才弹退出确认；游戏内返回键不退出 */
    var t=document.getElementById('titleScr');
    var onTitle=!!t && !t.classList.contains('hide');
    if(!onTitle) return 'ignored';
    if(asking) return 'asking';
    asking=true;
    modal('退出游戏',
      '<div style="font-size:12.5px;line-height:1.9;color:#6b5b60">'
      + '要关掉旺财装机店吗？<br>'
      + '<span style="color:#9b8088;font-size:11.5px">进度是自动存的，下次进来接着干。</span>'
      + '</div>', null);
    setTimeout(function(){
      var y=document.getElementById('mYes'), n=document.getElementById('mNo');
      if(y){ y.textContent='退出'; y.onclick=function(){ try{ WCBridge.exitApp(); }catch(e){} }; }
      if(n){
        n.textContent='再等等';
        n.onclick=function(){ asking=false; try{closeMask(document.getElementById('mask'));}catch(e){} };
      }
    },30);
    /* 用户点了空白处关掉时也要复位 */
    var t=setInterval(function(){
      var m=document.getElementById('mask');
      if(!m||!m.classList.contains('on')){ asking=false; clearInterval(t); }
    },600);
    return 'asking';
  };
})();

/* ==================== 内容自愈：HTML 缓存也能绕过 ====================
   GitHub Pages 对 index.html 有 10 分钟缓存，光给脚本加 ?v= 不够（HTML 本身还是旧的）。
   这里在启动时问一次线上版本：内容版本对不上就带上新参数重载自己一次。
   只重载一次（sessionStorage 里记着），避免死循环。 */
(function(){
  try{
    if(!/^https?:/.test(location.protocol)) return;        /* file:// 不折腾 */
    var local=(typeof APP_BUILD!=='undefined')?APP_BUILD:'';
    if(!local) return;
    var KEY='wc_heal_'+local;
    if(sessionStorage.getItem(KEY)) return;                 /* 这一版已经重载过了 */
    sessionStorage.setItem(KEY,'1');
    /* 启动时网络可能还没通：最多试 4 次，间隔 2.5 秒；联网事件也会再触发一次 */
    var tries=0, done=false;
    function tryHeal(){
      if(done) return;
      tries++;
      fetch('../apk/version.json?t='+Date.now(),{cache:'no-store',mode:'cors'})
        .then(function(r){ return r.json(); })
        .then(function(o){
          var remote=o&&o.content;
          if(!remote||remote===local){ done=true; return; }
          done=true;
          try{ console.info('[内容自愈] 本地 '+local+' → 线上 '+remote+'，重载中'); }catch(e){}
          var u=new URL(location.href);
          u.searchParams.set('v',remote);
          u.searchParams.set('t',String(Date.now()));
          location.replace(u.toString());
        })
        .catch(function(){
          if(tries<4 && !done) setTimeout(tryHeal, 2500);
        });
    }
    tryHeal();
    window.addEventListener('online',function(){ if(!done){ tries=0; tryHeal(); } },{once:true});
  }catch(e){}
})();


/* ==================== 运行模式角标（在线 / 离线副本） ==================== */
(function(){
  try{
    var online=/^https?:/.test(location.protocol);
    var d=document.createElement('div');
    d.id='runModeBadge';
    d.textContent=(online?'在线 ':'离线副本 ')+((typeof APP_BUILD!=='undefined')?APP_BUILD:'');
    d.style.cssText='position:fixed;right:10px;bottom:8px;z-index:9999;padding:3px 8px;border-radius:999px;'
      +'font:10px/1.6 system-ui;color:#fff;background:'+(online?'rgba(60,140,90,.75)':'rgba(190,90,90,.8)')
      +';pointer-events:none;letter-spacing:.5px';
    function put(){ if(!document.body.contains(d)) document.body.appendChild(d); }
    if(document.body) put(); else document.addEventListener('DOMContentLoaded',put);
  }catch(e){}
})();


/* ==================== 开机动画（App 一打开就播） ====================
   注意：<source> 用 innerHTML 插进去不会触发加载，必须用 DOM 创建 + 直接设 src。 */
(function(){
  try{
    if(document.getElementById('bootCinema')) return;
    if(window.WCBridge) return;              /* 在 APK 壳里：开场 CG 由原生播放器负责 */
    var el=document.createElement('div');
    el.id='bootCinema';

    var v=document.createElement('video');
    v.className='bc-video';
    v.muted=true; v.defaultMuted=true; v.autoplay=true; v.loop=false;
    v.playsInline=true; v.setAttribute('playsinline','');
    v.setAttribute('webkit-playsinline','');
    v.preload='auto';
    v.controls=false;
    v.poster='assets/boot_poster.jpg';
    var srcs=['assets/boot.mp4','assets/boot.webm'];
    /* 先用 mp4（WebView 兼容性最好），失败再退回 webm */
    v.src=srcs[0];
    v.addEventListener('error', function(){
      if(v.src.indexOf('webm')<0){ v.src=srcs[1]; v.load(); try{v.play().catch(function(){});}catch(e){} }
    });

    var wrap=document.createElement('div');
    wrap.className='bc-wrap';
    wrap.innerHTML='<div class="bc-title">旺财装机店</div>'
      +'<div class="bc-sub">一间小店 · 一台台机器 · 一单单生意</div>'
      +'<div class="bc-bar"><i></i></div>';
    el.appendChild(v); el.appendChild(wrap);

    function mount(){
      document.body.appendChild(el);
      v.load();
      function kick(){ try{ var pr=v.play(); if(pr&&pr.catch) pr.catch(function(){}); }catch(e){} }
      kick();
      v.addEventListener('loadeddata', kick, {once:true});
      v.addEventListener('canplay', kick, {once:true});
      /* 首帧真正上屏后再显形，避免看到灰底 */
      v.addEventListener('playing', function(){ el.classList.add('on'); }, {once:true});

      var done=false;
      function bye(){
        if(done) return; done=true;
        try{ v.pause(); }catch(e){}
        el.classList.add('bye');
        setTimeout(function(){ try{ el.remove(); }catch(e){} }, 520);
      }
      v.addEventListener('ended', bye, {once:true});
      el.addEventListener('click', bye, {once:true});
      setTimeout(bye, 13000);
    }
    if(document.body) mount(); else document.addEventListener('DOMContentLoaded', mount, {once:true});
  }catch(e){}
})();
