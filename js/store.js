// Central data store: holds authoritative state, writes optimistically through the
// active provider on every mutation, and notifies subscribers. Knows only the
// provider interface, not its implementation.
import { util } from './util.js';
import { srs } from './srs.js';
import { collections } from './collections.js';
import { decks } from './decks.js';

export const store = (function(){

  var state = { entries: [], history: [] };
  var provider = null;
  var subscribers = [];
  var errorHandler = function(e){ console.error('persist failed', e); };

  function snapshot(){ return { entries: state.entries, history: state.history }; }
  function notify(){ subscribers.forEach(function(fn){ fn(state); }); }
  function subscribe(fn){ subscribers.push(fn); return function(){ subscribers = subscribers.filter(function(f){ return f !== fn; }); }; }
  function onError(fn){ errorHandler = fn; }

  function persist(promise){
    Promise.resolve(promise).catch(function(e){ errorHandler(e); });
  }

  function normalize(e){
    if(!Array.isArray(e.tags)) e.tags = e.cat ? [e.cat] : [];
    if(e.addedAt === undefined) e.addedAt = 0;
    if(e.reps === undefined) e.reps = 0;
    if(e.interval === undefined) e.interval = 0;
    if(e.dueAt === undefined) e.dueAt = 0;
    if(e.learnedAt === undefined) e.learnedAt = null;
    if(!e.kind) e.kind = 'word';
    // Free-form space for extra per-entry data (image, audio, note), so that doesn't
    // need a schema migration.
    if(!e.meta || typeof e.meta !== 'object') e.meta = {};
    return e;
  }

  async function init(prov, opts){
    provider = prov;
    opts = opts || {};
    var data = await provider.loadAll();
    state.entries = (data.entries || []).map(normalize);
    state.history = data.history || [];
    if(opts.seedIfEmpty && state.entries.length === 0){
      seed();
      persist(provider.replaceAll(snapshot()));
    }
    notify();
  }

  function seed(){
    var now = Date.now();
    var samples = [
      { kind:'word', word:'кућа', trans:'Haus', ex:'Идем кући.' },
      { kind:'word', word:'разговор', trans:'Gespräch', ex:'' },
      { kind:'construction', word:'Мислим да...', trans:'Ich glaube, dass...', ex:'Мислим да је то добра идеја.' },
      { kind:'construction', word:'Морам да...', trans:'Ich muss...', ex:'Морам да идем кући.' },
      { kind:'construction', word:'Не могу да...', trans:'Ich kann nicht...', ex:'Не могу да дођем данас.' }
    ];
    state.entries = samples.map(function(s){
      return normalize({ id: util.uid(), kind: s.kind, word: s.word, trans: s.trans, ex: s.ex,
        tags: [], reps: 0, interval: 0, dueAt: 0, learnedAt: null, addedAt: now });
    });
  }

  function entries(kind){ return state.entries.filter(function(e){ return e.kind === kind; }); }
  function find(id){ return state.entries.find(function(e){ return e.id === id; }); }

  function distinctCats(kind){
    var set = {};
    entries(kind).forEach(function(e){ (e.tags||[]).forEach(function(t){ set[t] = true; }); });
    return Object.keys(set).sort();
  }

  function addEntry(kind, data){
    var e = normalize({
      id: util.uid(), kind: kind, word: data.word, trans: data.trans, ex: data.ex || '',
      tags: data.tags || [], reps: 0, interval: 0, dueAt: 0, learnedAt: null,
      addedAt: Date.now(), meta: data.meta || {}
    });
    state.entries.push(e);
    persist(provider.upsertEntries([e], snapshot()));
    notify();
    return e;
  }

  function updateEntry(id, patch){
    var e = find(id);
    if(!e) return;
    Object.keys(patch).forEach(function(k){ e[k] = patch[k]; });
    persist(provider.upsertEntries([e], snapshot()));
    notify();
  }

  function gradeEntry(id, level){
    var e = find(id);
    if(!e) return;
    // First grading marks the card as introduced, so the daily-deck new-card
    // budget can tell "never seen" from "seen but failed" (fail resets reps to 0).
    if(!e.meta || typeof e.meta !== 'object') e.meta = {};
    if(!e.meta.introducedAt) e.meta.introducedAt = Date.now();
    var patch = srs.gradePatch(e, level);
    Object.keys(patch).forEach(function(k){ e[k] = patch[k]; });
    var event = { id: util.uid(), ts: Date.now(), level: level, kind: e.kind, entryId: e.id };
    state.history.push(event);
    persist(provider.upsertEntries([e], snapshot()));
    persist(provider.insertHistory(event, snapshot()));
    notify();
  }

  function resetProgress(id){
    updateEntry(id, { reps: 0, interval: 0, dueAt: 0, learnedAt: null });
  }

  function removeEntries(ids){
    if(!ids.length) return;
    var idSet = {};
    ids.forEach(function(i){ idSet[i] = true; });
    state.entries = state.entries.filter(function(e){ return !idSet[e.id]; });
    decks.removeCards(ids);
    persist(provider.deleteEntries(ids, snapshot()));
    notify();
  }

  function removeEntry(id){ removeEntries([id]); }

  function deleteDuplicates(kind){
    var seen = {}, remove = [];
    entries(kind).forEach(function(e){
      var key = e.word.trim().toLowerCase();
      if(seen[key]) remove.push(e.id); else seen[key] = true;
    });
    removeEntries(remove);
  }

  function deleteAddedToday(kind){
    var t0 = util.today0();
    var remove = entries(kind).filter(function(e){ return e.addedAt && e.addedAt >= t0; })
      .map(function(e){ return e.id; });
    removeEntries(remove);
  }

  function deleteByCategory(kind, cat){
    var remove = entries(kind).filter(function(e){ return (e.tags||[]).indexOf(cat) >= 0; })
      .map(function(e){ return e.id; });
    removeEntries(remove);
  }

  function renameCategory(kind, from, to){
    var changed = [];
    entries(kind).forEach(function(e){
      if((e.tags||[]).indexOf(from) < 0) return;
      e.tags = util.uniq((e.tags||[]).map(function(t){ return t === from ? to : t; }));
      changed.push(e);
    });
    if(changed.length){
      persist(provider.upsertEntries(changed, snapshot()));
      notify();
    }
  }

  function importEntries(kind, incoming){
    var byId = {};
    state.entries.forEach(function(e){ byId[e.id] = e; });
    var touched = [];
    incoming.forEach(function(raw){
      var e = normalize(Object.assign({}, raw));
      e.kind = kind;
      if(!e.id) e.id = util.uid();
      byId[e.id] = e;
      touched.push(e);
    });
    state.entries = Object.keys(byId).map(function(k){ return byId[k]; });
    persist(provider.upsertEntries(touched, snapshot()));
    notify();
    return touched.length;
  }

  function importBackup(payload){
    var ent = [], hist = [];
    collections.all().forEach(function(c){
      (payload[c.jsonKey] || []).forEach(function(w){
        var e = normalize(Object.assign({}, w));
        e.kind = c.kind;
        if(!e.id) e.id = util.uid();
        ent.push(e);
      });
    });
    hist = (payload.history || []).map(function(h){ return { id: h.id || util.uid(), ts: h.ts, level: h.level, kind: h.kind || 'word', entryId: h.entryId || null }; });
    state.entries = ent;
    state.history = hist;
    // Decks live outside the provider snapshot (local-only), so restore them here.
    if(payload.decks) decks.replaceAll(payload.decks);
    persist(provider.replaceAll(snapshot()));
    notify();
    return { entries: ent.length, history: hist.length };
  }

  // Merges in a foreign snapshot without deleting anything — matching id wins from the
  // snapshot, everything else stays. Deliberately not replaceAll: that would discard
  // cloud data created on another device.
  function mergeSnapshot(snap){
    var byId = {};
    state.entries.forEach(function(e){ byId[e.id] = e; });
    var touched = [];
    (snap.entries || []).forEach(function(raw){
      var e = normalize(Object.assign({}, raw));
      if(!e.id) e.id = util.uid();
      byId[e.id] = e;
      touched.push(e);
    });
    state.entries = Object.keys(byId).map(function(k){ return byId[k]; });

    var known = {};
    state.history.forEach(function(h){ known[h.id] = true; });
    var newHist = (snap.history || [])
      .filter(function(h){ return h.id && !known[h.id]; })
      .map(function(h){ return { id: h.id, ts: h.ts, level: h.level, kind: h.kind || 'word', entryId: h.entryId || null }; });
    state.history = state.history.concat(newHist);

    if(touched.length) persist(provider.upsertEntries(touched, snapshot()));
    newHist.forEach(function(h){ persist(provider.insertHistory(h, snapshot())); });
    notify();
    return { entries: touched.length, history: newHist.length };
  }

  function exportCollection(kind){
    var out = {};
    out[collections.get(kind).jsonKey] = entries(kind);
    return out;
  }

  function exportBackup(){
    var out = { version: 2, exportedAt: new Date().toISOString() };
    collections.all().forEach(function(c){ out[c.jsonKey] = entries(c.kind); });
    out.history = state.history;
    out.decks = decks.all();
    return out;
  }

  return {
    state: state, init: init, subscribe: subscribe, onError: onError, notify: notify,
    entries: entries, find: find, distinctCats: distinctCats,
    addEntry: addEntry, updateEntry: updateEntry, gradeEntry: gradeEntry, resetProgress: resetProgress,
    removeEntry: removeEntry, removeEntries: removeEntries,
    deleteDuplicates: deleteDuplicates, deleteAddedToday: deleteAddedToday,
    deleteByCategory: deleteByCategory, renameCategory: renameCategory,
    importEntries: importEntries, importBackup: importBackup, mergeSnapshot: mergeSnapshot,
    exportCollection: exportCollection, exportBackup: exportBackup
  };
})();
