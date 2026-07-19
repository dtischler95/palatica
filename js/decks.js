// Deck store: named, static card sets for the daily-review mode. A deck is an
// explicit list of entry ids that may span collections (words and sentences
// together), unlike tags which categorize within one collection. Membership is
// fixed on save, so imports never dilute a deck.
//
// Local-only for now: persisted in localStorage and carried in the full JSON
// backup via store.exportBackup/importBackup. Cloud sync is a separate step.
import { util } from './util.js';

export const decks = (function(){
  var KEY = 'palatica-decks';
  var DEFAULT_NEW_PER_DAY = 10;
  var list = [];

  function normalize(d){
    d = d || {};
    var npd = parseInt(d.newPerDay, 10);
    return {
      id: d.id || util.uid(),
      name: (d.name || '').toString(),
      cardIds: Array.isArray(d.cardIds) ? d.cardIds.slice() : [],
      newPerDay: (Number.isInteger(npd) && npd >= 0) ? npd : DEFAULT_NEW_PER_DAY,
      createdAt: d.createdAt || Date.now()
    };
  }

  function load(){
    try{
      var raw = window.localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      list = Array.isArray(arr) ? arr.map(normalize) : [];
    }catch(e){ list = []; }
    return list;
  }
  function persist(){
    try{ window.localStorage.setItem(KEY, JSON.stringify(list)); }catch(e){}
  }

  function all(){ return list.slice(); }
  function get(id){ return list.filter(function(d){ return d.id === id; })[0]; }

  function save(d){
    var n = normalize(d);
    var i = -1;
    list.forEach(function(x, idx){ if(x.id === n.id) i = idx; });
    if(i >= 0) list[i] = n; else list.push(n);
    persist();
    return n;
  }
  function remove(id){
    list = list.filter(function(d){ return d.id !== id; });
    persist();
  }
  function replaceAll(arr){
    list = (Array.isArray(arr) ? arr : []).map(normalize);
    persist();
  }
  function removeCards(ids){
    var idSet = {};
    ids.forEach(function(id){ idSet[id] = true; });
    var changed = false;
    list.forEach(function(d){
      var before = d.cardIds.length;
      d.cardIds = d.cardIds.filter(function(id){ return !idSet[id]; });
      if(d.cardIds.length !== before) changed = true;
    });
    if(changed) persist();
  }

  load();
  return {
    all: all, get: get, save: save, remove: remove, replaceAll: replaceAll,
    removeCards: removeCards,
    DEFAULT_NEW_PER_DAY: DEFAULT_NEW_PER_DAY
  };
})();
