
(function(){
  try{
    var ua=navigator.userAgent||'';
    if(!/MQQBrowser|QQBrowser|QQLive/i.test(ua))return;
    document.documentElement.className+=' qqblock';
    var b=document.getElementById('qqCopy');
    if(b)b.addEventListener('click',function(){
      var u='https://grapheas-creator.github.io/zhuangji/';
      var ok=false;
      try{ if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u);ok=true;} }catch(e){}
      if(!ok){
        try{
          var ta=document.createElement('textarea');
          ta.value=u;ta.style.position='fixed';ta.style.opacity='0';
          document.body.appendChild(ta);ta.select();document.execCommand('copy');
          document.body.removeChild(ta);ok=true;
        }catch(e){}
      }
      b.textContent=ok?'已复制，去浏览器粘贴':'长按上面的网址复制';
    });
  }catch(e){}
})();
