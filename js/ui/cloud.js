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
import { i18n } from '../i18n.js';

export const cloud = (function(){
  var onSwitch = null;
  var t = i18n.t;

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

    if(signedIn) util.el('vok-cloud-email-shown').textContent = auth.email() || t({ de: '(angemeldet)', en: '(signed in)' });
  }

  function wire(switchProvider){
    onSwitch = switchProvider;

    // 1. Save credentials
    util.el('vok-cloud-save').addEventListener('click', function(){
      var raw = util.el('vok-cloud-url').value.trim();
      var key = util.el('vok-cloud-key').value.trim();
      if(!raw || !key){ status(t({ de: 'URL und Key eintragen.', en: 'Enter URL and key.' })); return; }
      // Data API tab shows the full REST endpoint (.../rest/v1/); the library
      // wants just the origin and appends the path itself. Normalize to origin
      // so both forms paste cleanly.
      var origin;
      try{ origin = new URL(raw).origin; } catch(e){ origin = ''; }
      if(!/^https:\/\/.+\.supabase\.co$/.test(origin)){
        status(t({ de: 'Die URL sieht nicht nach einem Supabase-Projekt aus (https://xxx.supabase.co).', en: 'The URL does not look like a Supabase project (https://xxx.supabase.co).' }));
        return;
      }
      config.set(origin, key);
      supabase.reset();
      util.el('vok-cloud-key').value = '';
      status(t({ de: 'Zugang gespeichert. Jetzt anmelden.', en: 'Access saved. Now sign in.' }));
      render();
    });

    // 2. Sign in
    util.el('vok-cloud-signin').addEventListener('click', async function(){
      var mail = util.el('vok-cloud-email').value.trim();
      var pw = util.el('vok-cloud-pw').value;
      if(!mail || !pw){ status(t({ de: 'E-Mail und Passwort eingeben.', en: 'Enter e-mail and password.' })); return; }
      try{
        await auth.signInPassword(mail, pw);
        util.el('vok-cloud-pw').value = '';
        await onSwitch('cloud');
        render();
        status(t({ de: 'Angemeldet.', en: 'Signed in.' }));
      } catch(e){ status(t({ de: 'Anmeldung fehlgeschlagen: ', en: 'Sign-in failed: ' }) + (e.message || e)); }
    });

    util.el('vok-cloud-signup').addEventListener('click', async function(){
      var mail = util.el('vok-cloud-email').value.trim();
      var pw = util.el('vok-cloud-pw').value;
      if(!mail || !pw){ status(t({ de: 'E-Mail und Passwort eingeben.', en: 'Enter e-mail and password.' })); return; }
      try{
        var res = await auth.signUp(mail, pw);
        util.el('vok-cloud-pw').value = '';
        if(res.session){ await onSwitch('cloud'); render(); status(t({ de: 'Konto angelegt und angemeldet.', en: 'Account created and signed in.' })); }
        else status(t({ de: 'Konto angelegt. Bitte E-Mail bestätigen, dann anmelden.', en: 'Account created. Please confirm your e-mail, then sign in.' }));
      } catch(e){ status(t({ de: 'Registrierung fehlgeschlagen: ', en: 'Registration failed: ' }) + (e.message || e)); }
    });

    util.el('vok-cloud-magic').addEventListener('click', async function(){
      var mail = util.el('vok-cloud-email').value.trim();
      if(!mail){ status(t({ de: 'E-Mail eingeben.', en: 'Enter e-mail.' })); return; }
      try{ await auth.sendMagicLink(mail); status(t({ de: 'Magic Link gesendet, schau ins Postfach.', en: 'Magic link sent, check your inbox.' })); }
      catch(e){ status(t({ de: 'Senden fehlgeschlagen: ', en: 'Sending failed: ' }) + (e.message || e)); }
    });

    // 3. Signed in
    util.el('vok-cloud-signout').addEventListener('click', async function(){
      await auth.signOut();
      await onSwitch('local');
      render();
      status(t({ de: 'Abgemeldet, wieder lokal.', en: 'Signed out, back to local.' }));
    });

    util.el('vok-cloud-forget').addEventListener('click', function(){
      var btn = this;
      ui.armButton(btn, i18n.lbl({ sr: 'Потврди?', de: 'bestätigen', en: 'confirm' }), async function(){
        await auth.signOut();
        config.clear();
        supabase.reset();
        await onSwitch('local');
        render();
        status(t({ de: 'Cloud-Zugang von diesem Gerät entfernt. Deine Daten in der Cloud bleiben.', en: 'Cloud access removed from this device. Your data in the cloud stays.' }));
      });
    });

    // Manual button, not automatic on login, so merges only happen when intended.
    util.el('vok-cloud-push').addEventListener('click', function(){
      var btn = this;
      ui.armButton(btn, i18n.lbl({ sr: 'Потврди?', de: 'bestätigen', en: 'confirm' }), async function(){
        try{
          var localSnap = await local.create().loadAll();
          if(!localSnap.entries.length){ status(t({ de: 'Lokal liegt nichts, was übernommen werden könnte.', en: 'Nothing local to move over.' })); return; }
          var r = store.mergeSnapshot(localSnap);
          status(t({ de: 'Übernommen: ', en: 'Moved over: ' }) + r.entries + ' ' + t({ de: 'Einträge', en: 'entries' }) + ', ' + r.history + ' ' + t({ de: 'Wiederholungen', en: 'reviews' }) + '.');
        } catch(e){ status(t({ de: 'Übernehmen fehlgeschlagen: ', en: 'Move failed: ' }) + (e.message || e)); }
      });
    });
  }

  return { wire: wire, render: render };
})();
