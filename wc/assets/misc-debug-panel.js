
/* ===== 调试面板：?debug=1 ===== */
(function(){
  try{
    if(location.search.indexOf('debug')<0)return;
    window.__errs=[];
    window.addEventListener('error',function(e){try{window.__errs.push(String(e.message||e.error).slice(0,90));}catch(x){}});
    const box=document.createElement('div');
    box.id='dbgPanel';
    box.style.cssText='position:fixed;left:6px;top:64px;z-index:100000;max-width:74vw;padding:8px 10px;'+
      'background:rgba(20,12,8,.94);color:#ffd9c8;font:11px/1.45 monospace;border-radius:8px;'+
      'white-space:pre-wrap;pointer-events:none;max-height:52vh;overflow:hidden';
    document.body.appendChild(box);
    let force='-';
    setInterval(function(){
      try{
        var g=function(fn,d){try{return fn();}catch(e){return d+'!'+e.message;}};
        var stepK=g(function(){var s=coachStep();return s?s.k:'null';},'ERR');
        var tg=document.getElementById('tutGal');
        var T=g(function(){return state.tut?JSON.stringify({done:Object.keys(state.tut.done||{}).length,hidden:!!state.tut.hidden,off:!!state.tut.guideOff}):'无';},'?');
        var info=[
          'step: '+stepK,
          'panel: '+g(function(){return state.panel;},'?'),
          'tutGal: '+(tg?tg.className:'无'),
          'coachKey: '+g(function(){return String(_coachKey);},'?'),
          'dismissed: '+g(function(){return String(_coachDismissed);},'?'),
          'hold: '+g(function(){return Math.round(_coachHoldUntil-Date.now());},'?'),
          'opSeq: '+g(function(){return _openingSeq;},'?'),
          'chain: '+g(function(){return Scene.chain+'/'+Scene.playing;},'?'),
          'tut: '+T,
          'load: '+!!document.getElementById('startLoad'),
          'force: '+force,
          'errs: '+(window.__errs||[]).slice(-2).join(' | ')
        ];
        box.textContent=info.join('\n');
      }catch(e){box.textContent='dbg ERR '+e.message;}
    },700);
    /* 每 2 秒强行刷新一次引导，看是「没被调用」还是「调用也画不出」 */
    setInterval(function(){
      try{ coachRefresh(); force='called'; }catch(e){ force='ERR:'+e.message; }
    },2000);
  }catch(e){}
})();
