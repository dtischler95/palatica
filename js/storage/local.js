// Local provider: everything in localStorage, no account, fully offline. Internal
// data shape matches the store's, so there's no translation layer.
export const local = (function(){
  var KEY = 'palatica-v1';

  function read(){
    try{
      var raw = window.localStorage.getItem(KEY);
      if(!raw) return { entries: [], history: [] };
      var parsed = JSON.parse(raw);
      return {
        entries: Array.isArray(parsed.entries) ? parsed.entries : [],
        history: Array.isArray(parsed.history) ? parsed.history : []
      };
    } catch(e){
      console.error('local read failed', e);
      return { entries: [], history: [] };
    }
  }

  function write(snapshot){
    try{
      window.localStorage.setItem(KEY, JSON.stringify({
        entries: snapshot.entries, history: snapshot.history
      }));
    } catch(e){ console.error('local write failed', e); }
  }

  // Some browsers lock localStorage (file://, private mode) — this needs to surface
  // loudly, otherwise the app looks normal and loses everything on reload.
  function available(){
    try{
      var probe = '__palatica_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch(e){ return false; }
  }

  function create(){
    if(!available()){
      throw new Error('Dieser Browser erlaubt hier keinen lokalen Speicher. ' +
        'Beim Öffnen per Doppelklick (file://) hilft es, die Dateien über einen ' +
        'lokalen Server oder die gehostete Version zu öffnen.');
    }
    // The store holds authoritative state; this provider just writes the full
    // snapshot through on every operation.
    return {
      id: 'local',
      async loadAll(){ return read(); },
      async upsertEntries(_entries, snapshot){ write(snapshot); },
      async deleteEntries(_ids, snapshot){ write(snapshot); },
      async insertHistory(_event, snapshot){ write(snapshot); },
      async deleteHistory(_ids, snapshot){ write(snapshot); },
      async replaceAll(snapshot){ write(snapshot); }
    };
  }

  return { create: create, KEY: KEY };
})();
