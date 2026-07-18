// UI coordination: screen navigation, per-collection view state, shared helpers.
import { util } from '../util.js';
import { store } from '../store.js';
import { srs } from '../srs.js';
import { collections } from '../collections.js';
import { tpl } from './templates.js';
import { stats } from './stats.js';

export const ui = (function(){

  var SCREENS = ['menu', 'practice', 'quiz', 'list', 'stats', 'settings'];

  // Per-collection view state plus the screen-wide practice selection.
  var state = { byKind: {}, screen: 'menu', practice: { kind: null, dir: 'srp-de' } };

  function initState(){
    collections.all().forEach(function(c){
      state.byKind[c.kind] = {
        filter: 'danas', cat: 'sve', search: '',
        quizCat: 'sve', mode: c.modes[0],
        page: 1, editId: null, quiz: null
      };
    });
    state.practice.kind = collections.all()[0].kind;
  }
  function vs(kind){ return state.byKind[kind]; }

  function showScreen(name){
    state.screen = name;
    SCREENS.forEach(function(s){
      var p = util.el('vok-pane-' + s);
      if(p) p.classList.toggle('active', s === name);
    });
    if(name === 'stats') stats.render();
  }

  function fillSelect(el, cats, includeSve){
    if(!el) return;
    var current = el.value;
    el.innerHTML = (includeSve ? '<option value="sve">Све категорије</option>' : '<option value="">— изабери —</option>') +
      cats.map(function(c){ return '<option value="' + util.escapeHtml(c) + '">' + util.escapeHtml(c) + '</option>'; }).join('');
    if(cats.indexOf(current) >= 0 || current === 'sve') el.value = current;
  }

  function fillDatalist(el, cats){
    if(!el) return;
    el.innerHTML = cats.map(function(c){ return '<option value="' + util.escapeHtml(c) + '">'; }).join('');
  }

  function armButton(btn, confirmHTML, onConfirm){
    if(btn.getAttribute('data-armed') === '1'){
      onConfirm();
      btn.setAttribute('data-armed', '0');
      btn.innerHTML = btn.getAttribute('data-orig');
    } else {
      btn.setAttribute('data-orig', btn.innerHTML);
      btn.setAttribute('data-armed', '1');
      btn.innerHTML = confirmHTML;
      setTimeout(function(){
        if(btn.getAttribute('data-armed') === '1'){
          btn.setAttribute('data-armed', '0');
          btn.innerHTML = btn.getAttribute('data-orig');
        }
      }, 3000);
    }
  }

  function renderPageControls(containerId, totalItems, currentPage, onChange){
    var el = util.el(containerId);
    var totalPages = Math.max(1, Math.ceil(totalItems / 20));
    if(totalPages <= 1){ el.innerHTML = ''; return; }
    el.innerHTML =
      '<button class="vok-btn-ghost" id="' + containerId + '-prev"' + (currentPage <= 1 ? ' disabled' : '') + '>&larr;</button>' +
      '<span style="font-size:12px;color:var(--vok-ink-soft)">Страна ' + currentPage + ' / ' + totalPages + '</span>' +
      '<button class="vok-btn-ghost" id="' + containerId + '-next"' + (currentPage >= totalPages ? ' disabled' : '') + '>&rarr;</button>';
    util.el(containerId + '-prev').addEventListener('click', function(){ onChange(Math.max(1, currentPage - 1)); });
    util.el(containerId + '-next').addEventListener('click', function(){ onChange(Math.min(totalPages, currentPage + 1)); });
  }

  function ioStatus(elId, msg){
    var el = util.el(elId);
    if(!el) return;
    el.textContent = msg;
    setTimeout(function(){ if(el.textContent === msg) el.textContent = ''; }, 4000);
  }

  function chips(entries){
    var now = Date.now();
    var due = entries.filter(function(e){ return srs.isDue(e, now); }).length;
    var learned = entries.filter(srs.isLearned).length;
    return '<div class="vok-tag" style="background:var(--vok-due-bg);color:var(--vok-due-fg)">' + due + ' данас доспева</div>' +
      '<div class="vok-tag" style="background:var(--vok-ok-bg);color:var(--vok-ok-fg)">' + learned + ' научено</div>' +
      '<div class="vok-tag" style="background:var(--vok-card);color:var(--vok-ink-soft);border:1px solid var(--vok-line)">' + entries.length + ' укупно</div>';
  }

  // Header shows the total across all collections, each practice tile only its own.
  function renderHeaderStats(){
    util.el('vok-stats').innerHTML = chips(store.state.entries);
    collections.all().forEach(function(c){
      var el = util.el(tpl.ids(c.kind).learnStats);
      if(el) el.innerHTML = chips(store.entries(c.kind));
    });
  }

  function wireShell(){
    util.el('vok-panes').addEventListener('click', function(ev){
      var nav = ev.target.closest('[data-screen]');
      if(nav){ showScreen(nav.getAttribute('data-screen')); return; }

      var sub = ev.target.closest('.vok-subtab');
      if(!sub) return;
      document.querySelectorAll('.vok-subtab').forEach(function(t){ t.classList.remove('active'); });
      document.querySelectorAll('.vok-subpane').forEach(function(p){ p.classList.remove('active'); });
      sub.classList.add('active');
      var pane = util.el(tpl.ids(sub.getAttribute('data-subtab')).subpane);
      if(pane) pane.classList.add('active');
    });
  }

  return {
    state: state, vs: vs, initState: initState, showScreen: showScreen,
    fillSelect: fillSelect, fillDatalist: fillDatalist, armButton: armButton,
    renderPageControls: renderPageControls, ioStatus: ioStatus,
    renderHeaderStats: renderHeaderStats, wireShell: wireShell
  };
})();
