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
    return '<p style="font-size:12px;color:var(--vok-ink-soft);margin:0 0 8px">Картица ' +
      (ctx.quiz.idx + 1) + ' / ' + ctx.quiz.pool.length + tags + '</p>';
  }
  function speakBtn(){
    return ' <button class="vok-btn-ghost quiz-speak" style="padding:3px 8px;vertical-align:middle">&#128266;</button>';
  }
  function gradeButtons(){
    return '<div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap">' +
      '<button class="vok-btn-ghost vok-fail-btn">Не знам<span class="vok-sub-de">nochmal</span></button>' +
      '<button class="vok-btn-ghost vok-hard-btn">Половично<span class="vok-sub-de">unsicher</span></button>' +
      '<button class="vok-btn vok-good-btn">Знам<span class="vok-sub-de">sitzt</span></button>' +
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
      var front = ctx.dir === 'de-srp' ? e.trans : e.word;
      var back  = ctx.dir === 'de-srp' ? e.word  : e.trans;
      return shell(
        headerLine(ctx) +
        '<p class="vok-word" style="font-size:22px">' + esc(front) + speakBtn() + '</p>' +
        (ctx.quiz.revealed
          ? '<p class="vok-trans" style="font-size:15px;margin-top:6px">' + esc(back) +
              (e.ex ? '<br><span style="font-size:12px">' + esc(e.ex) + '</span>' : '') + '</p>' + gradeButtons()
          : '<button class="vok-btn-ghost vok-reveal-btn" style="margin:10px auto 0">Окрени<span class="vok-sub-de">umdrehen</span></button>')
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
