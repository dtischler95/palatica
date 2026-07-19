// Entry point: always starts locally, no prompt. Cloud is an optional runtime
// switch via ui/cloud.js.
//
// The only module the browser loads, pulls in the rest via imports.
import { util } from './util.js';
import { config } from './config.js';
import { srs } from './srs.js';
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

// One badge sits in the web sidebar, one in the mobile top bar. Both carry the
// class, so update by class and keep the marker class intact (no className reset).
function setBadge(){
  var cloud = auth.getMode() === 'cloud';
  var text = cloud ? (auth.email() || 'Облак') : 'Локално';
  document.querySelectorAll('.vok-mode-badge').forEach(function(b){
    b.classList.toggle('cloud', cloud);
    b.textContent = text;
  });
}

function flashBadge(msg){
  document.querySelectorAll('.vok-mode-badge').forEach(function(b){ b.textContent = msg; });
  setTimeout(setBadge, 4000);
}

// Resolves the stored preference ('auto'|'light'|'dark') to a concrete theme.
// The inline script in index.html does this once pre-paint, this keeps it in sync.
function applyTheme(){
  var t = config.getTheme();
  var dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  var m = document.querySelector('meta[name="theme-color"]');
  if(m) m.setAttribute('content', dark ? '#211d18' : '#A61C3C');
}

function wireTheme(){
  var btns = document.querySelectorAll('[data-theme-choice]');
  var cur = config.getTheme();
  btns.forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-theme-choice') === cur);
    b.addEventListener('click', function(){
      config.setTheme(b.getAttribute('data-theme-choice'));
      btns.forEach(function(x){ x.classList.toggle('active', x === b); });
      applyTheme();
    });
  });
  // Follow the OS live while on 'auto'.
  try{
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){
      if(config.getTheme() === 'auto') applyTheme();
    });
  }catch(e){}
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
  // Custom SRS plan (if any) before anything renders or grades.
  var storedSched = config.getSchedule();
  if(storedSched) srs.setSchedule(storedSched);
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
  cloud.render();
  wireTheme();
  wireSrs();
  document.querySelectorAll('[data-dir-choice]').forEach(function(b){
    b.addEventListener('click', function(){ ui.setDirection(b.getAttribute('data-dir-choice')); });
  });
  install.wire();
  install.render();
}

// Accepts a comma/space separated list of strictly ascending integers >= 1.
function parseSchedule(str){
  var parts = String(str).split(/[,\s]+/).filter(Boolean).map(Number);
  if(parts.length < 1 || parts.length > 15) return null;
  for(var i = 0; i < parts.length; i++){
    if(!Number.isInteger(parts[i]) || parts[i] < 1) return null;
    if(i > 0 && parts[i] <= parts[i - 1]) return null;
  }
  return parts;
}

function wireSrs(){
  var input = util.el('vok-srs-input');
  if(!input) return;
  input.value = srs.SCHEDULE.join(', ');
  util.el('vok-srs-save').addEventListener('click', function(){
    var parsed = parseSchedule(input.value);
    if(!parsed){ ui.ioStatus('vok-srs-status', 'Nur aufsteigende ganze Zahlen ab 1, z.B. 1, 3, 7, 14, 30.'); return; }
    srs.setSchedule(parsed);
    config.setSchedule(parsed);
    input.value = srs.SCHEDULE.join(', ');
    ui.ioStatus('vok-srs-status', 'Plan gespeichert.');
    render();
  });
  util.el('vok-srs-reset').addEventListener('click', function(){
    config.clearSchedule();
    srs.resetSchedule();
    input.value = srs.SCHEDULE.join(', ');
    ui.ioStatus('vok-srs-status', 'Auf Standard zurückgesetzt.');
    render();
  });
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
