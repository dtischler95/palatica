// Cyrillic->Latin display transform and second-language pick. Stored data stays
// Cyrillic; only the display switches. Script and UI language are read live from
// config, so a toggle plus reload reflects immediately.
import { config } from './config.js';
import { util } from './util.js';

export const i18n = (function(){

  var toLatin = util.toLatin;

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
