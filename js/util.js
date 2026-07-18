export const util = (function(){
  var DAY = 24*60*60*1000;

  function uid(){
    if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
    // Fallback for very old environments without crypto.randomUUID.
    return 'id-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2,10);
  }

  function today0(){ var d = new Date(); d.setHours(0,0,0,0); return d.getTime(); }
  function daysUntil(ts){ return Math.round((ts - today0()) / DAY); }

  function weekKey(ts){
    var d = new Date(ts);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay());
    return d.getTime();
  }
  function weekLabel(ts){
    var d = new Date(ts);
    return d.getDate() + '.' + (d.getMonth()+1) + '.';
  }

  function parseTags(str){
    return (str||'').split(',')
      .map(function(s){ return s.trim(); })
      .filter(function(s){ return s.length > 0; });
  }

  function uniq(arr){
    var seen = {}, out = [];
    arr.forEach(function(x){ if(!seen[x]){ seen[x] = true; out.push(x); } });
    return out;
  }

  function escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function el(id){ return document.getElementById(id); }

  function speak(text){
    try{
      if(!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'sr-RS';
      window.speechSynthesis.speak(u);
    } catch(e){ console.error('speech failed', e); }
  }

  function download(text, filename){
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    DAY: DAY, uid: uid, today0: today0, daysUntil: daysUntil,
    weekKey: weekKey, weekLabel: weekLabel, parseTags: parseTags,
    uniq: uniq, escapeHtml: escapeHtml, el: el, speak: speak, download: download
  };
})();
