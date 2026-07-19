// Cloud credentials live per device in localStorage, not in the repo — each user
// brings their own Supabase project.
//
// The anon key itself is public; RLS is the actual security boundary.
export const config = (function(){
  var KEY = 'palatica-cloud';

  // Loaded online only, needed only for cloud use.
  var supabaseLibUrl = 'https://esm.sh/@supabase/supabase-js@2';

  function get(){
    try{
      var raw = window.localStorage.getItem(KEY);
      if(raw){
        var p = JSON.parse(raw);
        if(p && p.url && p.key) return { url: p.url, key: p.key };
      }
    } catch(e){ /* localStorage locked: no cloud then. */ }
    return { url: '', key: '' };
  }

  function set(url, key){
    window.localStorage.setItem(KEY, JSON.stringify({ url: String(url).trim(), key: String(key).trim() }));
  }

  function clear(){
    try{ window.localStorage.removeItem(KEY); } catch(e){}
  }

  function cloudEnabled(){
    var c = get();
    return !!(c.url && c.key);
  }

  // Theme preference, same key the inline script in index.html reads pre-paint.
  var THEME_KEY = 'palatica-theme';
  function getTheme(){ try{ return window.localStorage.getItem(THEME_KEY) || 'auto'; }catch(e){ return 'auto'; } }
  function setTheme(t){ try{ window.localStorage.setItem(THEME_KEY, t); }catch(e){} }

  // Default practice direction.
  var DIR_KEY = 'palatica-dir';
  function getDir(){ try{ return window.localStorage.getItem(DIR_KEY) || 'srp-de'; }catch(e){ return 'srp-de'; } }
  function setDir(d){ try{ window.localStorage.setItem(DIR_KEY, d); }catch(e){} }

  // Serbian script for display: 'cyr' or 'lat'. Data stays Cyrillic either way.
  var SCRIPT_KEY = 'palatica-script';
  function getScript(){ try{ return window.localStorage.getItem(SCRIPT_KEY) === 'lat' ? 'lat' : 'cyr'; }catch(e){ return 'cyr'; } }
  function setScript(s){ try{ window.localStorage.setItem(SCRIPT_KEY, s === 'lat' ? 'lat' : 'cyr'); }catch(e){} }

  // Second UI language paired with Serbian: 'de' or 'en'. Default 'en'.
  var UILANG_KEY = 'palatica-uilang';
  function getUiLang(){ try{ return window.localStorage.getItem(UILANG_KEY) === 'de' ? 'de' : 'en'; }catch(e){ return 'en'; } }
  function setUiLang(l){ try{ window.localStorage.setItem(UILANG_KEY, l === 'en' ? 'en' : 'de'); }catch(e){} }

  // Custom SRS plan; null means use the built-in default from srs.js.
  var SCHED_KEY = 'palatica-srs';
  function getSchedule(){
    try{
      var r = window.localStorage.getItem(SCHED_KEY);
      if(r){ var a = JSON.parse(r); if(Array.isArray(a) && a.length) return a; }
    }catch(e){}
    return null;
  }
  function setSchedule(arr){ try{ window.localStorage.setItem(SCHED_KEY, JSON.stringify(arr)); }catch(e){} }
  function clearSchedule(){ try{ window.localStorage.removeItem(SCHED_KEY); }catch(e){} }

  // Custom "learned" threshold (days); null means use the built-in default from srs.js.
  var LEARNED_KEY = 'palatica-learned';
  function getLearnedInterval(){
    try{
      var r = window.localStorage.getItem(LEARNED_KEY);
      if(r){ var n = parseInt(r, 10); if(Number.isInteger(n) && n >= 1) return n; }
    }catch(e){}
    return null;
  }
  function setLearnedInterval(n){ try{ window.localStorage.setItem(LEARNED_KEY, String(n)); }catch(e){} }
  function clearLearnedInterval(){ try{ window.localStorage.removeItem(LEARNED_KEY); }catch(e){} }

  return {
    supabaseLibUrl: supabaseLibUrl,
    get: get, set: set, clear: clear, cloudEnabled: cloudEnabled,
    getTheme: getTheme, setTheme: setTheme,
    getDir: getDir, setDir: setDir,
    getScript: getScript, setScript: setScript,
    getUiLang: getUiLang, setUiLang: setUiLang,
    getSchedule: getSchedule, setSchedule: setSchedule, clearSchedule: clearSchedule,
    getLearnedInterval: getLearnedInterval, setLearnedInterval: setLearnedInterval, clearLearnedInterval: clearLearnedInterval
  };
})();
