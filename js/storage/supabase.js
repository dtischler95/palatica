// Supabase provider: cloud with login and RLS, only needed online. The library is
// loaded via dynamic import on demand, so local mode works without network and
// without this module.
import { config } from '../config.js';

export const supabase = (function(){
  var clientPromise = null;

  function getClient(){
    if(!config.cloudEnabled()){
      return Promise.reject(new Error('Cloud ist auf diesem Gerät nicht eingerichtet.'));
    }
    if(!clientPromise){
      var cfg = config.get();
      clientPromise = import(config.supabaseLibUrl).then(function(mod){
        return mod.createClient(cfg.url, cfg.key);
      });
    }
    return clientPromise;
  }

  // Must run after every config change, otherwise the cached client still points
  // at the old project.
  function reset(){ clientPromise = null; }

  function toMs(v){ return v == null ? null : Date.parse(v); }
  function toIso(ms){ return ms == null ? null : new Date(ms).toISOString(); }

  function rowToEntry(r){
    return {
      id: r.id, kind: r.kind, word: r.word, trans: r.trans, ex: r.ex || '',
      tags: r.tags || [], reps: r.reps || 0, interval: r.interval_days || 0,
      dueAt: toMs(r.due_at) || 0, learnedAt: toMs(r.learned_at), addedAt: toMs(r.added_at) || 0,
      meta: r.meta || {}
    };
  }
  function entryToRow(e){
    return {
      id: e.id, kind: e.kind, word: e.word, trans: e.trans, ex: e.ex || '',
      tags: e.tags || [], reps: e.reps || 0, interval_days: e.interval || 0,
      due_at: toIso(e.dueAt || Date.now()), learned_at: toIso(e.learnedAt),
      added_at: toIso(e.addedAt || Date.now()), meta: e.meta || {}
    };
  }
  function rowToHist(r){ return { id: r.id, ts: toMs(r.ts), level: r.level, kind: r.kind, entryId: r.entry_id || null }; }
  function histToRow(h){ return { id: h.id, ts: toIso(h.ts), level: h.level, kind: h.kind, entry_id: h.entryId || null }; }

  function create(){
    return {
      id: 'cloud',
      async loadAll(){
        var sb = await getClient();
        var e = await sb.from('entries').select('*');
        if(e.error) throw e.error;
        var h = await sb.from('history').select('*');
        if(h.error) throw h.error;
        return {
          entries: (e.data || []).map(rowToEntry),
          history: (h.data || []).map(rowToHist)
        };
      },
      async upsertEntries(entries){
        var sb = await getClient();
        var rows = entries.map(entryToRow);
        var res = await sb.from('entries').upsert(rows);
        if(res.error) throw res.error;
      },
      async deleteEntries(ids){
        if(!ids.length) return;
        var sb = await getClient();
        var res = await sb.from('entries').delete().in('id', ids);
        if(res.error) throw res.error;
      },
      async insertHistory(event){
        var sb = await getClient();
        var res = await sb.from('history').insert(histToRow(event));
        if(res.error) throw res.error;
      },
      async replaceAll(snapshot){
        var sb = await getClient();
        await sb.from('history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await sb.from('entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if(snapshot.entries.length) await this.upsertEntries(snapshot.entries);
        if(snapshot.history.length){
          var res = await sb.from('history').insert(snapshot.history.map(histToRow));
          if(res.error) throw res.error;
        }
      }
    };
  }

  return { create: create, getClient: getClient, reset: reset };
})();
