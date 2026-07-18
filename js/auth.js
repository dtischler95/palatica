// Local mode needs no auth: mode stays 'local', session stays null.
import { config } from './config.js';
import { supabase } from './storage/supabase.js';

export const auth = (function(){
  var mode = null;
  var session = null;
  var changeHandlers = [];

  function onChange(fn){ changeHandlers.push(fn); }
  function emitChange(){ changeHandlers.forEach(function(fn){ fn({ mode: mode, session: session }); }); }

  function email(){ return session && session.user ? session.user.email : null; }

  // Is there already a cloud session, e.g. after a magic-link redirect?
  async function detectInitialSession(){
    if(!config.cloudEnabled()) return null;
    try{
      var sb = await supabase.getClient();
      var res = await sb.auth.getSession();
      if(res.data && res.data.session){
        mode = 'cloud';
        session = res.data.session;
        sb.auth.onAuthStateChange(function(_event, s){
          session = s;
          if(!s){ mode = null; }
          emitChange();
        });
        return session;
      }
    } catch(e){ console.error('session detect failed', e); }
    return null;
  }

  async function signInPassword(mail, pw){
    var sb = await supabase.getClient();
    var res = await sb.auth.signInWithPassword({ email: mail, password: pw });
    if(res.error) throw res.error;
    mode = 'cloud'; session = res.data.session; emitChange();
    return session;
  }

  async function signUp(mail, pw){
    var sb = await supabase.getClient();
    var res = await sb.auth.signUp({ email: mail, password: pw });
    if(res.error) throw res.error;
    // With email confirmation enabled, session is null here.
    if(res.data.session){ mode = 'cloud'; session = res.data.session; emitChange(); }
    return res.data;
  }

  async function sendMagicLink(mail){
    var sb = await supabase.getClient();
    var res = await sb.auth.signInWithOtp({
      email: mail,
      options: { emailRedirectTo: window.location.href.split('#')[0] }
    });
    if(res.error) throw res.error;
    return true;
  }

  async function signOut(){
    if(mode === 'cloud'){
      try{ var sb = await supabase.getClient(); await sb.auth.signOut(); } catch(e){ console.error(e); }
    }
    mode = null; session = null; emitChange();
  }

  function useLocal(){ mode = 'local'; session = null; }

  return {
    onChange: onChange, email: email,
    getMode: function(){ return mode; },
    getSession: function(){ return session; },
    detectInitialSession: detectInitialSession,
    signInPassword: signInPassword, signUp: signUp, sendMagicLink: sendMagicLink,
    signOut: signOut, useLocal: useLocal
  };
})();
