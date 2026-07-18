// Android/desktop Chromium fire beforeinstallprompt, which becomes a dedicated
// button. iOS Safari never fires it, so only a text hint remains there.
//
// Safari clears localStorage after 7 days without interaction; home-screen apps
// are exempt.
import { util } from '../util.js';
import { tpl } from './templates.js';

export const install = (function(){
  var DISMISS_KEY = 'palatica-install';
  var deferred = null;   // remembered beforeinstallprompt event, usable only once

  function dismissed(){
    try{ return window.localStorage.getItem(DISMISS_KEY) === '1'; }
    catch(e){ return false; }
  }
  function setDismissed(){ try{ window.localStorage.setItem(DISMISS_KEY, '1'); } catch(e){} }
  function clearDismissed(){ try{ window.localStorage.removeItem(DISMISS_KEY); } catch(e){} }

  function installed(){
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           window.navigator.standalone === true;
  }

  function isIos(){
    var ua = navigator.userAgent || '';
    if(/iphone|ipod|ipad/i.test(ua)) return true;
    // iPadOS 13+ reports itself as MacIntel, distinguishable from a real Mac only by touch points.
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }

  function render(){
    var el = util.el('vok-install');
    if(!el) return;
    if(installed() || dismissed()){ el.innerHTML = ''; return; }
    var lbl = tpl.lbl;

    // Chromium path: dedicated button that triggers the remembered system prompt.
    if(deferred){
      el.innerHTML =
        '<div class="vok-install">' +
          '<p style="font-size:13px;color:var(--vok-ink-soft);margin:0">Инсталирај Палатицу као апликацију.' +
            '<span class="vok-sub-de">Als App installieren, dann bleibt der Lernstand sicher erhalten.</span></p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="vok-btn" id="vok-install-go">' + lbl({ sr: 'Инсталирај', de: 'Installieren' }) + '</button>' +
            '<button class="vok-btn-ghost" id="vok-install-later">' + lbl({ sr: 'Касније', de: 'Später' }) + '</button>' +
          '</div>' +
        '</div>';
      return;
    }

    // iOS path: just a hint, since Safari offers no programmatic prompt.
    if(isIos()){
      el.innerHTML =
        '<div class="vok-install">' +
          '<p style="font-size:13px;color:var(--vok-ink-soft);margin:0">Додај на почетни екран: „Подели“ па „На почетни екран“.' +
            '<span class="vok-sub-de">In Safari das Teilen-Symbol antippen, dann „Zum Home-Bildschirm“. ' +
            'Ohne Installation löscht iOS die lokalen Daten nach etwa 7 Tagen ohne Nutzung.</span></p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="vok-btn-ghost" id="vok-install-later">' + lbl({ sr: 'Разумем', de: 'Verstanden' }) + '</button>' +
          '</div>' +
        '</div>';
      return;
    }

    el.innerHTML = '';
  }

  function wire(){
    var el = util.el('vok-install');
    if(!el) return;
    // Delegated, because render() rebuilds the content every time.
    el.addEventListener('click', async function(ev){
      if(ev.target.closest('#vok-install-later')){ setDismissed(); render(); return; }
      if(ev.target.closest('#vok-install-go')){
        if(!deferred) return;
        var evt = deferred;
        deferred = null;   // The prompt is usable only once.
        try{ evt.prompt(); await evt.userChoice; } catch(e){ console.error('install prompt failed', e); }
        render();
      }
    });
  }

  // Registered at parse time: the event can fire before boot()'s awaits finish.
  window.addEventListener('beforeinstallprompt', function(ev){
    ev.preventDefault();
    deferred = ev;
    render();
  });
  window.addEventListener('appinstalled', function(){
    deferred = null;
    clearDismissed();
    render();
  });

  return { wire: wire, render: render };
})();
