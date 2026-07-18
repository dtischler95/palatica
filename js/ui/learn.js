// Practice flow: collection tiles and direction on the practice screen, the
// running quiz on its own screen in the shared #vok-quiz-box.
import { util } from '../util.js';
import { store } from '../store.js';
import { srs } from '../srs.js';
import { collections } from '../collections.js';
import { ui } from './shell.js';
import { tpl } from './templates.js';
import { modes } from './modes.js';

export const learn = (function(){

  function start(kind){
    var st = ui.vs(kind);
    var base = st.quizCat === 'sve'
      ? store.entries(kind)
      : store.entries(kind).filter(function(e){ return (e.tags||[]).indexOf(st.quizCat) >= 0; });
    var pool = base.filter(function(e){ return srs.isDue(e); });
    if(pool.length === 0) pool = base.slice();
    st.quiz = { pool: pool, idx: 0, revealed: false };
    render(kind);
  }

  function render(kind){
    var c = collections.get(kind), st = ui.vs(kind);
    var el = util.el('vok-quiz-box');
    var q = st.quiz;
    if(!q){ el.innerHTML = ''; return; }

    if(q.pool.length === 0){
      el.innerHTML = '<p class="vok-empty">' + util.escapeHtml(c.emptyQuiz) + '</p>';
      return;
    }

    if(q.idx >= q.pool.length){
      el.innerHTML = '<div class="vok-card" style="flex-direction:column;text-align:center;padding:20px">' +
        '<p class="vok-word">Готово за сада!</p><p class="vok-trans">Настави кад год хоћеш.</p>' +
        '<button class="vok-btn-ghost quiz-close" style="margin:10px auto 0">Затвори<span class="vok-sub-de">Schließen</span></button></div>';
      el.querySelector('.quiz-close').addEventListener('click', function(){
        st.quiz = null;
        render(kind);
        ui.showScreen('practice');
      });
      return;
    }

    var mode = modes.get(st.mode) || modes.get(c.modes[0]);
    var entry = q.pool[q.idx];
    var ctx = {
      entry: entry,
      quiz: q,
      dir: ui.state.practice.dir,
      rerender: function(){ render(kind); },
      grade: function(level){
        store.gradeEntry(entry.id, level);
        q.idx++; q.revealed = false;
        render(kind);
      }
    };
    el.innerHTML = mode.render(ctx);
    mode.wire(el, ctx);
  }

  function wire(kind){
    var st = ui.vs(kind);
    util.el(tpl.ids(kind).quizCat).addEventListener('change', function(){ st.quizCat = this.value; });
  }

  // Wired once: tile selection, direction toggle, start button.
  function wireScreen(){
    var pane = util.el('vok-pane-practice');
    var row = pane.querySelector('.vok-mode-row');

    // Vertical wheel/trackpad input scrolls the row sideways, so a mouse works too.
    row.addEventListener('wheel', function(ev){
      if(ev.deltaY === 0) return;
      row.scrollLeft += ev.deltaY;
      ev.preventDefault();
    }, { passive: false });

    row.addEventListener('click', function(ev){
      var tile = ev.target.closest('.vok-mode-tile');
      if(!tile) return;
      ui.state.practice.kind = tile.getAttribute('data-kind');
      pane.querySelectorAll('.vok-mode-tile').forEach(function(t){
        t.classList.toggle('selected', t === tile);
      });
    });

    pane.querySelectorAll('[data-dir]').forEach(function(btn){
      btn.addEventListener('click', function(){
        pane.querySelectorAll('[data-dir]').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        ui.state.practice.dir = btn.getAttribute('data-dir');
      });
    });

    util.el('vok-start').addEventListener('click', function(){
      start(ui.state.practice.kind);
      ui.showScreen('quiz');
    });
  }

  return { start: start, render: render, wire: wire, wireScreen: wireScreen };
})();
