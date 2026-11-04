
/* ===== 可访问性 / 动效偏好（Galgame UI 指南里那两条落地） =====
   ① 跟随系统「减少动态效果」设置；再给一个手动开关（存在 localStorage）
   ② 立绘在“不发言”时降亮度而不是变半透明 —— 指南原话：
      「非当前人物优先降低亮度/饱和度 10%～25%，不要直接 opacity 降到幽灵」 */
(function(){
  var KEY='pcbs2_motion';
  function apply(on){
    document.body.classList.toggle('no-motion',!on);
    var b=document.getElementById('btnMotion');
    if(b){b.textContent=on?'动效':'静效';b.classList.toggle('off',!on);b.title=on?'界面动效：开（点击关闭）':'界面动效：关（点击开启）';}
    try{localStorage.setItem(KEY,on?'1':'0');}catch(e){}
  }
  function wantMotion(){
    var s='1'; try{s=localStorage.getItem(KEY)||'1';}catch(e){}
    var sysReduce=false;
    try{sysReduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
    return s!=='0'&&!sysReduce;
  }
  function boot(){
    apply(wantMotion());
    var hb=document.querySelector('header .hbtns');
    if(hb&&!document.getElementById('btnMotion')){
      var b=document.createElement('button');
      b.id='btnMotion';b.type='button';
      b.onclick=function(){apply(document.body.classList.contains('no-motion'));};
      var ref=document.getElementById('btnSave')||null;
      hb.insertBefore(b,ref);
    }
    apply(wantMotion());
    /* ② 立绘闲置降亮度 */
    try{
      var gal=document.getElementById('tutGal'),cv=document.getElementById('tutVid');
      if(gal&&cv&&window.MutationObserver){
        var sync=function(){
          var on=gal.classList.contains('on');
          cv.classList.toggle('is-idle',!on);
        };
        new MutationObserver(sync).observe(gal,{attributes:true,attributeFilter:['class']});
        sync();
      }
    }catch(e){}
    /* 系统偏好中途变化也跟着切 */
    try{window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',function(){apply(wantMotion());});}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else setTimeout(boot,600);
})();
