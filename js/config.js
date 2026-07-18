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

  return {
    supabaseLibUrl: supabaseLibUrl,
    get: get, set: set, clear: clear, cloudEnabled: cloudEnabled
  };
})();
