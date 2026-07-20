// Service worker: makes the app work offline and installable.
//
// Bump VERSION on every change: the browser only detects sw.js via byte
// comparison, without a bump users stay stuck on old cached files.
var VERSION = '1.8.0.0';
var CACHE = 'palatica-' + VERSION;

var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/config.js',
  './js/util.js',
  './js/i18n.js',
  './js/srs.js',
  './js/collections.js',
  './js/decks.js',
  './js/storage/local.js',
  './js/storage/supabase.js',
  './js/store.js',
  './js/auth.js',
  './js/ui/shell.js',
  './js/ui/modes.js',
  './js/ui/templates.js',
  './js/ui/list.js',
  './js/ui/learn.js',
  './js/ui/deckedit.js',
  './js/ui/stats.js',
  './js/ui/cloud.js',
  './js/ui/install.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './fonts/bitter-latin.woff2',
  './fonts/bitter-latin-ext.woff2',
  './fonts/bitter-cyrillic.woff2',
  './fonts/ptserif-400-latin.woff2',
  './fonts/ptserif-400-latin-ext.woff2',
  './fonts/ptserif-400-cyrillic.woff2',
  './fonts/ptserif-700-latin.woff2',
  './fonts/ptserif-700-latin-ext.woff2',
  './fonts/ptserif-700-cyrillic.woff2'
];

self.addEventListener('install', function(ev){
  ev.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(ev){
  ev.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(ev){
  var req = ev.request;

  // Leave foreign requests (Supabase etc.) untouched, otherwise API responses would get cached.
  if(req.method !== 'GET') return;
  if(new URL(req.url).origin !== self.location.origin) return;

  // Navigation: network first so a new version arrives immediately, cache only as fallback.
  if(req.mode === 'navigate'){
    ev.respondWith(
      fetch(req)
        .then(function(res){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
          return res;
        })
        .catch(function(){
          return caches.match('./index.html').then(function(hit){
            return hit || caches.match('./');
          });
        })
    );
    return;
  }

  // Cache first, refresh from network in the background.
  ev.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});
