// Cloud panel behind the small button top right, entirely optional for local use.
//
// Three states, depending on the device:
//   1. not set up -> enter Supabase credentials
//   2. set up, not signed in -> login
//   3. signed in -> account, adopt data, sign out
import { util } from '../util.js';
import { config } from '../config.js';
import { auth } from '../auth.js';
import { store } from '../store.js';
import { local } from '../storage/local.js';
import { supabase } from '../storage/supabase.js';
import { ui } from './shell.js';

export const cloud = (function(){
  var onSwitch = null;

  function status(msg){ ui.ioStatus('vok-cloud-status', msg); }

  function render(){
    var setup = util.el('vok-cloud-setup');
    var login = util.el('vok-cloud-login');
    var acct  = util.el('vok-cloud-account');
    var configured = config.cloudEnabled();
    var signedIn = auth.getMode() === 'cloud';

    setup.style.display = configured ? 'none' : '';
    login.style.display = (configured && !signedIn) ? '' : 'none';
    acct.style.display  = signedIn ? '' : 'none';

    if(signedIn) util.el('vok-cloud-email-shown').textContent = auth.email() || '(angemeldet)';
  }

  function toggle(){
    var p = util.el('vok-cloud-panel');
    var open = p.style.display === 'none';
    p.style.display = open ? '' : 'none';
    if(open) render();
  }

  function wire(switchProvider){
    onSwitch = switchProvider;

    util.el('vok-cloud-btn').addEventListener('click', toggle);
    util.el('vok-cloud-close').addEventListener('click', function(){
      util.el('vok-cloud-panel').style.display = 'none';
    });

    // 1. Save credentials
    util.el('vok-cloud-save').addEventListener('click', function(){
      var url = util.el('vok-cloud-url').value.trim();
      var key = util.el('vok-cloud-key').value.trim();
      if(!url || !key){ status('URL und anon key eintragen.'); return; }
      if(!/^https:\/\/.+\.supabase\.co\/?$/.test(url)){
        status('Die URL sieht nicht nach einem Supabase-Projekt aus (https://xxx.supabase.co).');
        return;
      }
      config.set(url.replace(/\/$/, ''), key);
      supabase.reset();
      util.el('vok-cloud-key').value = '';
      status('Zugang gespeichert. Jetzt anmelden.');
      render();
    });

    // 2. Sign in
    util.el('vok-cloud-signin').addEventListener('click', async function(){
      var mail = util.el('vok-cloud-email').value.trim();
      var pw = util.el('vok-cloud-pw').value;
      if(!mail || !pw){ status('E-Mail und Passwort eingeben.'); return; }
      try{
        await auth.signInPassword(mail, pw);
        util.el('vok-cloud-pw').value = '';
        await onSwitch('cloud');
        render();
        status('Angemeldet.');
      } catch(e){ status('Anmeldung fehlgeschlagen: ' + (e.message || e)); }
    });

    util.el('vok-cloud-signup').addEventListener('click', async function(){
      var mail = util.el('vok-cloud-email').value.trim();
      var pw = util.el('vok-cloud-pw').value;
      if(!mail || !pw){ status('E-Mail und Passwort eingeben.'); return; }
      try{
        var res = await auth.signUp(mail, pw);
        util.el('vok-cloud-pw').value = '';
        if(res.session){ await onSwitch('cloud'); render(); status('Konto angelegt und angemeldet.'); }
        else status('Konto angelegt. Bitte E-Mail bestätigen, dann anmelden.');
      } catch(e){ status('Registrierung fehlgeschlagen: ' + (e.message || e)); }
    });

    util.el('vok-cloud-magic').addEventListener('click', async function(){
      var mail = util.el('vok-cloud-email').value.trim();
      if(!mail){ status('E-Mail eingeben.'); return; }
      try{ await auth.sendMagicLink(mail); status('Magic Link gesendet, schau ins Postfach.'); }
      catch(e){ status('Senden fehlgeschlagen: ' + (e.message || e)); }
    });

    // 3. Signed in
    util.el('vok-cloud-signout').addEventListener('click', async function(){
      await auth.signOut();
      await onSwitch('local');
      render();
      status('Abgemeldet, wieder lokal.');
    });

    util.el('vok-cloud-forget').addEventListener('click', function(){
      var btn = this;
      ui.armButton(btn, 'Potvrdi?<span class="vok-sub-de">bestätigen</span>', async function(){
        await auth.signOut();
        config.clear();
        supabase.reset();
        await onSwitch('local');
        render();
        status('Cloud-Zugang von diesem Gerät entfernt. Deine Daten in der Cloud bleiben.');
      });
    });

    // Manual button, not automatic on login, so merges only happen when intended.
    util.el('vok-cloud-push').addEventListener('click', function(){
      var btn = this;
      ui.armButton(btn, 'Potvrdi?<span class="vok-sub-de">bestätigen</span>', async function(){
        try{
          var localSnap = await local.create().loadAll();
          if(!localSnap.entries.length){ status('Lokal liegt nichts, was übernommen werden könnte.'); return; }
          var r = store.mergeSnapshot(localSnap);
          status('Übernommen: ' + r.entries + ' Einträge, ' + r.history + ' Wiederholungen.');
        } catch(e){ status('Übernehmen fehlgeschlagen: ' + (e.message || e)); }
      });
    });
  }

  return { wire: wire, render: render, toggle: toggle };
})();
