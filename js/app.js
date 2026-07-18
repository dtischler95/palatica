// Entry point: always starts locally, no prompt. Cloud is an optional runtime
// switch via ui/cloud.js.
//
// The only module the browser loads, pulls in the rest via imports.
import { util } from './util.js';
import { collections } from './collections.js';
import { store } from './store.js';
import { auth } from './auth.js';
import { local } from './storage/local.js';
import { supabase } from './storage/supabase.js';
import { ui } from './ui/shell.js';
import { tpl } from './ui/templates.js';
import { list } from './ui/list.js';
import { learn } from './ui/learn.js';
import { stats } from './ui/stats.js';
import { cloud } from './ui/cloud.js';
import { install } from './ui/install.js';

var wired = false;
var unsubscribe = null;

function setBadge(){
  var badge = util.el('vok-mode-badge');
  if(auth.getMode() === 'cloud'){
    badge.className = 'vok-badge cloud';
    badge.textContent = auth.email() || 'Cloud';
  } else {
    badge.className = 'vok-badge';
    badge.textContent = 'Локално / lokal — nur auf diesem Gerät';
  }
}

function flashBadge(msg){
  var badge = util.el('vok-mode-badge');
  badge.textContent = msg;
  setTimeout(setBadge, 4000);
}

// Redraws the whole UI. Lives here instead of ui/shell.js, because that would
// create the cycle shell -> list -> shell.
function render(){
  ui.renderHeaderStats();
  collections.all().forEach(function(c){ list.render(c.kind); });
  stats.render();
}

function wireOnce(){
  if(wired) return;
  wired = true;
  // Order matters: state first, then markup from the registry, then wiring.
  ui.initState();
  tpl.build();
  ui.wireShell();
  collections.all().forEach(function(c){
    list.wire(c.kind);
    learn.wire(c.kind);
  });
  learn.wireScreen();
  list.wireBackup();
  cloud.wire(switchProvider);
  install.wire();
  install.render();
}

async function switchProvider(mode){
  var provider;
  try{
    provider = mode === 'cloud' ? supabase.create() : local.create();
  } catch(e){
    flashBadge(e.message || String(e));
    throw e;
  }

  store.onError(function(e){
    console.error('Speichern fehlgeschlagen', e);
    flashBadge('Fehler beim Speichern');
  });

  await store.init(provider, { seedIfEmpty: mode === 'local' });

  if(unsubscribe) unsubscribe();
  unsubscribe = store.subscribe(function(){ render(); });

  wireOnce();
  setBadge();
  render();
}

// Without a real origin (file://) there is no service worker, the app just
// runs without an offline cache.
function registerSW(){
  if(!('serviceWorker' in navigator)) return;
  if(location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  navigator.serviceWorker.register('sw.js').catch(function(e){
    console.error('Service Worker konnte nicht registriert werden', e);
  });
}

// Without this, localStorage is just a cache and can be evicted at any time.
async function requestPersistence(){
  try{
    if(navigator.storage && navigator.storage.persist){
      var already = await navigator.storage.persisted();
      if(!already) await navigator.storage.persist();
    }
  } catch(e){ /* Best-effort, ok to fail. */ }
}

async function boot(){
  registerSW();
  requestPersistence();

  // Go straight to cloud mode if a session already exists (e.g. magic-link redirect).
  var session = null;
  try{ session = await auth.detectInitialSession(); } catch(e){ console.error(e); }

  if(session){
    try{ await switchProvider('cloud'); return; }
    catch(e){ console.error('Cloud-Start fehlgeschlagen, weiter lokal', e); }
  }

  auth.useLocal();
  try{ await switchProvider('local'); }
  catch(e){
    console.error('Laden fehlgeschlagen', e);
    document.getElementById('vok-app').innerHTML =
      '<p class="vok-empty">' + util.escapeHtml(e.message || String(e)) + '</p>';
  }
}

// Modules run deferred, DOM is technically already parsed by the time this runs —
// the loading branch stays as a safety net.
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
