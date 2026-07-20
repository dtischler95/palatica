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

  // Kind of the running quiz and the last rendered card context, for the
  // keyboard handler and undo button. Both null when no card is showing.
  var quizKind = null;
  var currentCtx = null;

  // Open mode: the whole (optionally tag-filtered) collection, no due gate and no
  // cap. SRS still runs in the background, it just no longer creates pressure.
  // Due cards (in the chosen direction) shuffled to the front, the rest behind
  // them ascending by that direction's dueAt.
  function openPool(kind){
    var st = ui.vs(kind);
    var dir = ui.state.practice.dir, now = Date.now();
    var base = st.quizCat === 'sve'
      ? store.entries(kind)
      : store.entries(kind).filter(function(e){ return (e.tags||[]).indexOf(st.quizCat) >= 0; });
    var due = [], notDue = [];
    base.forEach(function(e){ (srs.isDueDir(e, dir, now) ? due : notDue).push(e); });
    util.shuffle(due);
    notDue.sort(function(a, b){ return srs.stateOf(a, dir).dueAt - srs.stateOf(b, dir).dueAt; });
    return due.concat(notDue);
  }

  // Daily mode: due reviews from the deck plus up to newPerDay never-seen cards,
  // both judged in the chosen direction. The new-card budget keeps the deck from
  // exploding after skipped days.
  function dailyPool(deckId){
    var deck = decks.get(deckId);
    if(!deck) return [];
    var dir = ui.state.practice.dir;
    var now = Date.now(), t0 = util.today0();
    var cards = deck.cardIds.map(function(id){ return store.find(id); }).filter(Boolean);
    var seen = function(e){ return !!(e.meta && e.meta.introduced && e.meta.introduced[dir]); };
    var reviews = cards.filter(function(e){ return seen(e) && srs.isDueDir(e, dir, now); });
    util.shuffle(reviews);
    var introducedToday = cards.filter(function(e){ return e.meta && e.meta.introduced && e.meta.introduced[dir] >= t0; }).length;
    var budget = Math.max(0, deck.newPerDay - introducedToday);
    var fresh = cards.filter(function(e){ return !seen(e); }).slice(0, budget);
    util.shuffle(fresh);
    return reviews.concat(fresh);
  }

  function start(kind){
    var st = ui.vs(kind);
    var pool = kind === 'srsdeck' ? dailyPool(ui.state.practice.deckId) : openPool(kind);
    st.quiz = { pool: pool, idx: 0, revealed: false };
    quizKind = kind;
    render(kind);
  }

  function updateUndoBtn(kind){
    var btn = util.el('vok-quiz-undo');
    if(!btn) return;
    var running = !!ui.vs(kind).quiz;
    btn.style.display = (running && store.canUndo()) ? '' : 'none';
  }

  function closeQuiz(kind){
    var st = ui.vs(kind);
    st.quiz = null;
    currentCtx = null;
    render(kind);
    ui.showScreen('practice');
  }

  function render(kind){
    var c = collections.get(kind), st = ui.vs(kind);
    var modesList = c ? c.modes : ['card'];
    var emptyQuiz = c ? c.emptyQuiz : { sr: 'Ово деке нема карата за данас.', de: 'Dieses Deck hat heute keine Karten.', en: 'This deck has no cards for today.' };
    var el = util.el('vok-quiz-box');
    var q = st.quiz;
    if(!q){ el.innerHTML = ''; currentCtx = null; updateUndoBtn(kind); return; }

    quizKind = kind;

    if(q.pool.length === 0){
      el.innerHTML = '<p class="vok-empty">' + tpl.lbl(emptyQuiz) + '</p>';
      currentCtx = null;
      updateUndoBtn(kind);
      return;
    }

    if(q.idx >= q.pool.length){
      el.innerHTML = '<div class="vok-card" style="flex-direction:column;text-align:center;padding:20px">' +
        '<p class="vok-word">' + tpl.lbl({ sr: 'Готово за сада!', de: 'Fertig für jetzt!', en: 'Done for now!' }) + '</p>' +
        '<p class="vok-trans">' + tpl.lbl({ sr: 'Настави кад год хоћеш.', de: 'Mach weiter, wann du willst.', en: 'Continue whenever you like.' }) + '</p>' +
        '<button class="vok-btn-ghost quiz-close" style="margin:10px auto 0">' + tpl.lbl({ sr: 'Затвори', de: 'Schließen', en: 'Close' }) + '</button></div>';
      el.querySelector('.quiz-close').addEventListener('click', function(){ closeQuiz(kind); });
      currentCtx = null;
      updateUndoBtn(kind);
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
        store.gradeEntry(entry.id, level, ui.state.practice.dir);
        q.idx++; q.revealed = false;
        render(kind);
      }
    };
    el.innerHTML = mode.render(ctx);
    mode.wire(el, ctx);
    currentCtx = ctx;
    updateUndoBtn(kind);
  }

  function doUndo(){
    var kind = quizKind;
    if(!kind) return;
    var st = ui.vs(kind);
    if(!st.quiz) return;
    var undone = store.undoLastGrade();
    if(!undone) return;
    st.quiz.idx = Math.max(0, st.quiz.idx - 1);
    st.quiz.revealed = true;
    render(kind);
  }

  // Quiz-screen keyboard control. Inert unless a quiz card is showing and focus
  // is not in a form field; modifier chords pass through untouched.
  function onKey(ev){
    if(ui.state.screen !== 'quiz' || !quizKind) return;
    var st = ui.vs(quizKind);
    if(!st.quiz) return;
    var t = ev.target;
    if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if(ev.ctrlKey || ev.metaKey || ev.altKey) return;

    var q = st.quiz;
    // Undo works on the end screen too (steps back onto the last card).
    if(ev.key === 'u' || ev.key === 'U'){ ev.preventDefault(); doUndo(); return; }
    var onEnd = q.pool.length === 0 || q.idx >= q.pool.length;
    if(onEnd){
      if(ev.key === 'Enter' || ev.key === 'Escape'){ ev.preventDefault(); closeQuiz(quizKind); }
      return;
    }

    if(ev.key === 'Escape'){ ev.preventDefault(); closeQuiz(quizKind); return; }
    if(ev.key === ' ' || ev.key === 'Enter'){
      if(!q.revealed){ ev.preventDefault(); q.revealed = true; render(quizKind); }
      return;
    }
    if(q.revealed && currentCtx){
      if(ev.key === '1'){ ev.preventDefault(); currentCtx.grade('fail'); }
      else if(ev.key === '2'){ ev.preventDefault(); currentCtx.grade('hard'); }
      else if(ev.key === '3'){ ev.preventDefault(); currentCtx.grade('good'); }
    }
  }

  function wire(kind){
    var st = ui.vs(kind);
    util.el(tpl.ids(kind).quizCat).addEventListener('change', function(){ st.quizCat = this.value; });
  }

  // Wired once: tile selection, direction toggle, start button, quiz keyboard, undo.
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

    var undoBtn = util.el('vok-quiz-undo');
    if(undoBtn) undoBtn.addEventListener('click', doUndo);
    document.addEventListener('keydown', onKey);
  }

  return { start: start, render: render, wire: wire, wireScreen: wireScreen };
})();
