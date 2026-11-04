
/* 长按兜底：Chrome 安卓派发 contextmenu 时直接吞掉；输入框与可复制网址放行。 */
(function(){
  var ok=function(el){
    try{
      if(!el||el.nodeType!==1)return false;
      var n=el.tagName;
      if(n==='INPUT'||n==='TEXTAREA'||n==='SELECT')return true;
      if(el.isContentEditable)return true;
      return !!(el.closest&&el.closest('.qqLink,input,textarea,[contenteditable="true"]'));
    }catch(e){return false;}
  };
  var block=function(e){try{if(!ok(e.target))e.preventDefault();}catch(err){}};
  document.addEventListener('contextmenu',block,true);
  document.addEventListener('dragstart',block,true);
  document.addEventListener('selectstart',block,true);
})();
