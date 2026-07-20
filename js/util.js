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
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
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

  // Fisher-Yates, in place. Returns the same array.
  function shuffle(arr){
    for(var i = arr.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // Search normalization: transliterate, lowercase, fold diacritics so queries
  // typed without them still match (kuca finds kuća, djak finds đak).
  function searchKey(s){
    return toLatin(s == null ? '' : s).toLowerCase()
      .replace(/đ/g, 'dj').replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z');
  }

  function escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function el(id){ return document.getElementById(id); }

  // Cyrillic->Latin transliteration (Gaj). Single letters plus the three digraph
  // letters (љ њ џ), whose uppercase form follows the next letter's case (Lj vs LJ).
  var LAT_SINGLE = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','ђ':'đ','е':'e','ж':'ž','з':'z',
    'и':'i','ј':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','ћ':'ć','у':'u','ф':'f','х':'h','ц':'c','ч':'č','ш':'š',
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Ђ':'Đ','Е':'E','Ж':'Ž','З':'Z',
    'И':'I','Ј':'J','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
    'С':'S','Т':'T','Ћ':'Ć','У':'U','Ф':'F','Х':'H','Ц':'C','Ч':'Č','Ш':'Š'
  };
  var LAT_DIGRAPH_LOWER = { 'љ':'lj','њ':'nj','џ':'dž' };
  var LAT_DIGRAPH_UPPER = { 'Љ':['Lj','LJ'],'Њ':['Nj','NJ'],'Џ':['Dž','DŽ'] };

  function latNextIsUpper(s, i){
    for(var j = i + 1; j < s.length; j++){
      var ch = s[j];
      if(ch.toLowerCase() === ch.toUpperCase()) continue;
      return ch === ch.toUpperCase();
    }
    return false;
  }

  function toLatin(s){
    s = String(s == null ? '' : s);
    var out = '';
    for(var i = 0; i < s.length; i++){
      var ch = s[i];
      if(LAT_DIGRAPH_LOWER[ch] != null){ out += LAT_DIGRAPH_LOWER[ch]; continue; }
      if(LAT_DIGRAPH_UPPER[ch] != null){ out += LAT_DIGRAPH_UPPER[ch][latNextIsUpper(s, i) ? 1 : 0]; continue; }
      out += LAT_SINGLE[ch] != null ? LAT_SINGLE[ch] : ch;
    }
    return out;
  }

  function pickSrVoice(){
    var voices = window.speechSynthesis.getVoices();
    var byPrefix = function(p){ return voices.find(function(v){ return v.lang.toLowerCase().indexOf(p) === 0; }); };
    return byPrefix('sr') || byPrefix('hr') || byPrefix('bs') || null;
  }

  // Non-Serbian fallback voices (hr, bs) read Latin script only; Cyrillic input
  // comes out silent with no error. Real sr voices handle Cyrillic natively.
  function speak(text){
    try{
      if(!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      var v = pickSrVoice();
      var isRealSr = v && v.lang.toLowerCase().indexOf('sr') === 0;
      var u = new SpeechSynthesisUtterance(isRealSr ? text : toLatin(text));
      if(v){ u.voice = v; u.lang = v.lang; }
      else{ u.lang = 'sr-RS'; }
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
    uniq: uniq, shuffle: shuffle, searchKey: searchKey, escapeHtml: escapeHtml, el: el, speak: speak, toLatin: toLatin, download: download
  };
})();
