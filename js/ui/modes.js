// Exercise mode registry. New mode = register({...}) here plus the mode name in
// the collection.
//
// ctx a mode receives:
//   entry      the current entry
//   quiz       {pool, idx, revealed} — modes may add their own flags
//   dir        'srp-de' | 'de-srp'
//   rerender() redraw without grading
//   grade(lvl) grade, advance, redraw
import { util } from '../util.js';
import { i18n } from '../i18n.js';

export const modes = (function(){
  var registry = {};

  function register(m){ registry[m.id] = m; }
  function get(id){ return registry[id]; }
  function all(){ return Object.keys(registry).map(function(k){ return registry[k]; }); }

  function shell(inner){
    return '<div class="vok-card" style="flex-direction:column;align-items:stretch;text-align:center;padding:24px">' + inner + '</div>';
  }
  function headerLine(ctx){
    var e = ctx.entry;
    var tags = (e.tags && e.tags.length) ? ' &middot; ' + util.escapeHtml(e.tags.join(', ')) : '';
    return '<p style="font-size:12px;color:var(--vok-ink-soft);margin:0 0 8px">' +
      i18n.line({ sr: 'Картица', de: 'Karte', en: 'Card' }) + ' ' +
      (ctx.quiz.idx + 1) + ' / ' + ctx.quiz.pool.length + tags + '</p>';
  }
  function speakBtn(){
    return ' <button class="vok-btn-ghost quiz-speak" style="padding:3px 8px;vertical-align:middle">&#128266;</button>';
  }
  function gradeButtons(){
    return '<div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap">' +
      '<button class="vok-btn-ghost vok-fail-btn">' + i18n.lbl({ sr: 'Не знам', de: 'nochmal', en: 'again' }) + '</button>' +
      '<button class="vok-btn-ghost vok-hard-btn">' + i18n.lbl({ sr: 'Половично', de: 'unsicher', en: 'unsure' }) + '</button>' +
      '<button class="vok-btn vok-good-btn">' + i18n.lbl({ sr: 'Знам', de: 'sitzt', en: 'got it' }) + '</button>' +
      '</div>';
  }
  function wireCommon(el, ctx){
    var speak = el.querySelector('.quiz-speak');
    if(speak) speak.addEventListener('click', function(){ util.speak(ctx.entry.word); });
    var good = el.querySelector('.vok-good-btn');
    if(good){
      good.addEventListener('click', function(){ ctx.grade('good'); });
      el.querySelector('.vok-hard-btn').addEventListener('click', function(){ ctx.grade('hard'); });
      el.querySelector('.vok-fail-btn').addEventListener('click', function(){ ctx.grade('fail'); });
    }
  }

  register({
    id: 'card',
    label: { sr: 'Картице', de: 'Karteikarten' },
    render: function(ctx){
      var e = ctx.entry, esc = util.escapeHtml;
      // word and ex are Serbian (transliterate), trans is the user's translation (never).
      var word = esc(i18n.sr(e.word));
      var trans = esc(e.trans);
      var front = ctx.dir === 'de-srp' ? trans : word;
      var back  = ctx.dir === 'de-srp' ? word  : trans;
      return shell(
        headerLine(ctx) +
        '<p class="vok-word" style="font-size:22px">' + front + speakBtn() + '</p>' +
        (ctx.quiz.revealed
          ? '<p class="vok-trans" style="font-size:15px;margin-top:6px">' + back +
              (e.ex ? '<br><span style="font-size:12px">' + esc(i18n.sr(e.ex)) + '</span>' : '') + '</p>' + gradeButtons()
          : '<button class="vok-btn-ghost vok-reveal-btn" style="margin:10px auto 0">' + i18n.lbl({ sr: 'Окрени', de: 'umdrehen', en: 'flip' }) + '</button>')
      );
    },
    wire: function(el, ctx){
      var reveal = el.querySelector('.vok-reveal-btn');
      if(reveal) reveal.addEventListener('click', function(){ ctx.quiz.revealed = true; ctx.rerender(); });
      wireCommon(el, ctx);
    }
  });

  return { register: register, get: get, all: all };
})();
