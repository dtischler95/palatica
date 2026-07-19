// Cyrillic->Latin display transform and second-language pick. Stored data stays
// Cyrillic; only the display switches. Script and UI language are read live from
// config, so a toggle plus reload reflects immediately.
import { config } from './config.js';
import { util } from './util.js';

export const i18n = (function(){

  // Single Cyrillic letters. The digraph letters (љ њ џ) live in a separate map so
  // their uppercase form can follow the next letter's case (Lj vs LJ).
  var SINGLE = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','ђ':'đ','е':'e','ж':'ž','з':'z',
    'и':'i','ј':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','ћ':'ć','у':'u','ф':'f','х':'h','ц':'c','ч':'č','ш':'š',
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Ђ':'Đ','Е':'E','Ж':'Ž','З':'Z',
    'И':'I','Ј':'J','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
    'С':'S','Т':'T','Ћ':'Ć','У':'U','Ф':'F','Х':'H','Ц':'C','Ч':'Č','Ш':'Š'
  };
  var DIGRAPH_LOWER = { 'љ':'lj','њ':'nj','џ':'dž' };
  var DIGRAPH_UPPER = { 'Љ':['Lj','LJ'],'Њ':['Nj','NJ'],'Џ':['Dž','DŽ'] };

  // Whether the next cased character is uppercase (skips spaces, punctuation).
  function nextIsUpper(s, i){
    for(var j = i + 1; j < s.length; j++){
      var ch = s[j];
      if(ch.toLowerCase() === ch.toUpperCase()) continue;
      return ch === ch.toUpperCase();
    }
    return false;
  }

  function toLatin(s){
    s = String(s == null ? '' : s);
    var out = '';
    for(var i = 0; i < s.length; i++){
      var ch = s[i];
      if(DIGRAPH_LOWER[ch] != null){ out += DIGRAPH_LOWER[ch]; continue; }
      if(DIGRAPH_UPPER[ch] != null){ out += DIGRAPH_UPPER[ch][nextIsUpper(s, i) ? 1 : 0]; continue; }
      out += SINGLE[ch] != null ? SINGLE[ch] : ch;
    }
    return out;
  }

  // Serbian display: transliterate to Latin only when that script is chosen. Never
  // call on user translations (trans) or on input values (those keep the raw store).
  function sr(s){
    return config.getScript() === 'lat' ? toLatin(s) : String(s == null ? '' : s);
  }

  function lang(){ return config.getUiLang(); }

  // Picks the second-language string, falling back to German when English is missing.
  function second(o){
    return lang() === 'en' ? (o.en != null ? o.en : o.de) : o.de;
  }

  // Serbian primary (transliterated, escaped) plus the second-language subline.
  // subStyle sets an inline style on the subline span where the layout needs it.
  function lbl(o, subStyle){
    var st = subStyle ? ' style="' + subStyle + '"' : '';
    return util.escapeHtml(sr(o.sr)) + '<span class="vok-sub-de"' + st + '>' + util.escapeHtml(second(o)) + '</span>';
  }

  // One-line "srp · second" for placeholders, <option> labels and count texts.
  function line(o){ return sr(o.sr) + ' · ' + second(o); }

  // Second-language-only text: status and error messages that carry no Serbian.
  function t(o){ return second(o); }

  return { toLatin: toLatin, sr: sr, lang: lang, second: second, lbl: lbl, line: line, t: t };
})();
