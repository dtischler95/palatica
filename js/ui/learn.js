// Practice flow: collection tiles and direction on the practice screen, the
// running quiz on its own screen in the shared #vok-quiz-box.
import { util } from '../util.js';
import { store } from '../store.js';
import { srs } from '../srs.js';
import { collections } from '../collections.js';
import { decks } from '../decks.js';
import { ui } from './shell.js';
import { tpl } from './templates.js';
import { modes } from './modes.js';

export const learn = (function(){

  // Open mode: the whole (optionally tag-filtered) collection, no due gate and no
  // cap. Ordered by dueness so the rustiest cards come first, but nothing is
  // withheld. SRS still runs in the background, it just no longer creates pressure.
  function openPool(kind){
    var st = ui.vs(kind);
    var base = st.quizCat === 'sve'
      ? store.entries(kind)
      : store.entries(kind).filter(function(e){ return (e.tags||[]).indexOf(st.quizCat) >= 0; });
    return base.slice().sort(function(a, b){ return (a.dueAt || 0) - (b.dueAt || 0); });
  }

  // Daily mode: due reviews from the deck plus up to newPerDay never-seen cards.
  // The new-card budget is what keeps the deck from exploding after skipped days.
  function dailyPool(deckId){
    var deck = decks.get(deckId);
    if(!deck) return [];
    var now = Date.now(), t0 = util.today0();
    var cards = deck.cardIds.map(function(id){ return store.find(id); }).filter(Boolean);
    var seen = function(e){ return !!(e.meta && e.meta.introducedAt); };
    var reviews = cards.filter(function(e){ return seen(e) && srs.isDue(e, now); })
      .sort(function(a, b){ return (a.dueAt || 0) - (b.dueAt || 0); });
    var introducedToday = cards.filter(function(e){ return e.meta && e.meta.introducedAt >= t0; }).length;
    var budget = Math.max(0, deck.newPerDay - introducedToday);
    var fresh = cards.filter(function(e){ return !seen(e); }).slice(0, budget);
    return reviews.concat(fresh);
  }

  function start(kind){
    var st = ui.vs(kind);
    var pool = kind === 'srsdeck' ? dailyPool(ui.state.practice.deckId) : openPool(kind);
    st.quiz = { pool: pool, idx: 0, revealed: false };
    render(kind);
  }

  function render(kind){
    var c = collections.get(kind), st = ui.vs(kind);
    var modesList = c ? c.modes : ['card'];
    var emptyQuiz = c ? c.emptyQuiz : { sr: 'Ово деке нема карата за данас.', de: 'Dieses Deck hat heute keine Karten.', en: 'This deck has no cards for today.' };
    var el = util.el('vok-quiz-box');
    var q = st.quiz;
    if(!q){ el.innerHTML = ''; return; }

    if(q.pool.length === 0){
      el.innerHTML = '<p class="vok-empty">' + tpl.lbl(emptyQuiz) + '</p>';
      return;
    }

    if(q.idx >= q.pool.length){
      el.innerHTML = '<div class="vok-card" style="flex-direction:column;text-align:center;padding:20px">' +
        '<p class="vok-word">' + tpl.lbl({ sr: 'Готово за сада!', de: 'Fertig für jetzt!', en: 'Done for now!' }) + '</p>' +
        '<p class="vok-trans">' + tpl.lbl({ sr: 'Настави кад год хоћеш.', de: 'Mach weiter, wann du willst.', en: 'Continue whenever you like.' }) + '</p>' +
        '<button class="vok-btn-ghost quiz-close" style="margin:10px auto 0">' + tpl.lbl({ sr: 'Затвори', de: 'Schließen', en: 'Close' }) + '</button></div>';
      el.querySelector('.quiz-close').addEventListener('click', function(){
        st.quiz = null;
        render(kind);
        ui.showScreen('practice');
      });
      return;
    }

    var mode = modes.get(st.mode) || modes.get(modesList[0]);
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
      var kind = tile.getAttribute('data-kind');
      ui.state.practice.kind = kind;
      pane.querySelectorAll('.vok-mode-tile').forEach(function(t){
        t.classList.toggle('selected', t === tile);
      });
      pane.querySelectorAll('.vok-opts-group').forEach(function(g){
        g.classList.toggle('active', g.getAttribute('data-kind') === kind);
      });
    });

    pane.querySelectorAll('[data-dir]').forEach(function(btn){
      btn.addEventListener('click', function(){ ui.setDirection(btn.getAttribute('data-dir')); });
    });

    util.el('vok-start').addEventListener('click', function(){
      start(ui.state.practice.kind);
      ui.showScreen('quiz');
    });
  }

  return { start: start, render: render, wire: wire, wireScreen: wireScreen };
})();
