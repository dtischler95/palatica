// UI coordination: screen navigation, per-collection view state, shared helpers.
import { util } from '../util.js';
import { config } from '../config.js';
import { store } from '../store.js';
import { srs } from '../srs.js';
import { collections } from '../collections.js';
import { tpl } from './templates.js';
import { stats } from './stats.js';

export const ui = (function(){

  var SCREENS = ['home', 'practice', 'quiz', 'deckedit', 'list', 'stats', 'settings'];

  // Per-collection view state plus the screen-wide practice selection. deckId is
  // the deck chosen for the daily SRS-deck tile, held here next to kind and dir.
  var state = { byKind: {}, screen: 'home', practice: { kind: null, dir: 'srp-de', deckId: null } };

  function initState(){
    collections.all().forEach(function(c){
      state.byKind[c.kind] = {
        filter: 'danas', cat: 'sve', search: '',
        quizCat: [], mode: c.modes[0],
        page: 1, editId: null, quiz: null
      };
    });
    // The SRS-deck tile is not a registered collection but reuses the same quiz
    // state slot, so learn.render can drive it through ui.vs('srsdeck').
    state.byKind.srsdeck = { quizCat: [], mode: 'card', quiz: null };
    state.practice.kind = collections.all()[0].kind;
    state.practice.dir = config.getDir();
  }
  function vs(kind){ return state.byKind[kind]; }

  // Single source for the direction: persists it and keeps the practice toggle in sync.
  function setDirection(dir){
    state.practice.dir = dir;
    config.setDir(dir);
    document.querySelectorAll('[data-dir]').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-dir') === dir); });
  }

  function showScreen(name){
    state.screen = name;
    SCREENS.forEach(function(s){
      var p = util.el('vok-pane-' + s);
      if(p) p.classList.toggle('active', s === name);
    });
    document.querySelectorAll('#vok-nav [data-screen]').forEach(function(el){
      el.classList.toggle('nav-on', el.getAttribute('data-screen') === name);
    });
    if(name === 'stats') stats.render();
  }

  function fillSelect(el, cats, includeSve){
    if(!el) return;
    var current = el.value;
    // Values stay the raw stored category; only the label follows the script.
    el.innerHTML = (includeSve
        ? '<option value="sve">' + tpl.line({ sr: 'Све категорије', de: 'Alle Kategorien', en: 'All categories' }) + '</option>'
        : '<option value="">— ' + tpl.line({ sr: 'изабери', de: 'auswählen', en: 'select' }) + ' —</option>') +
      cats.map(function(c){ return '<option value="' + util.escapeHtml(c) + '">' + util.escapeHtml(tpl.sr(c)) + '</option>'; }).join('');
    if(cats.indexOf(current) >= 0 || current === 'sve') el.value = current;
  }

  // Multi-select category dropdown for free-mode practice: a button showing a
  // summary plus a checkbox panel. Empty selection means "no filter, show
  // everything" — the same sentinel meaning the old single-select's "sve" had,
  // so there is no separate "none" action: unchecking everything already gets
  // you back to that state. `selected` is pruned to cats still valid, callers
  // persist the pruned array back onto their state.
  function catMenuLabel(cats, selected){
    if(selected.length === 0) return tpl.line({ sr: 'Све категорије', de: 'Alle Kategorien', en: 'All categories' });
    if(selected.length === 1) return tpl.sr(selected[0]);
    return selected.length + ' ' + tpl.t({ de: 'Kategorien', en: 'categories' });
  }
  function fillCatMenu(panelEl, btnEl, cats, selected){
    if(!panelEl || !btnEl) return selected;
    var pruned = selected.filter(function(s){ return cats.indexOf(s) >= 0; });
    panelEl.innerHTML =
      '<div class="vok-catmenu-actions">' +
        '<button type="button" class="vok-btn-ghost" data-catmenu="all">' + tpl.line({ sr: 'Све категорије', de: 'alle', en: 'all' }) + '</button>' +
      '</div>' +
      cats.map(function(c){
        return '<label class="vok-catmenu-item"><input type="checkbox" value="' + util.escapeHtml(c) + '"' +
          (pruned.indexOf(c) >= 0 ? ' checked' : '') + '> ' + util.escapeHtml(tpl.sr(c)) + '</label>';
      }).join('');
    btnEl.textContent = catMenuLabel(cats, pruned);
    return pruned;
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
      '<span style="font-size:12px;color:var(--vok-ink-soft)">' + tpl.line({ sr: 'Страна', de: 'Seite', en: 'Page' }) + ' ' + currentPage + ' / ' + totalPages + '</span>' +
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
    var due = entries.filter(function(e){ return srs.isDueAny(e, now); }).length;
    var learned = entries.filter(srs.isLearnedBoth).length;
    return '<div class="vok-tag" style="background:var(--vok-due-bg);color:var(--vok-due-fg)">' + due + ' ' + tpl.lbl({ sr: 'доспева', de: 'fällig', en: 'due' }) + '</div>' +
      '<div class="vok-tag" style="background:var(--vok-ok-bg);color:var(--vok-ok-fg)">' + learned + ' ' + tpl.lbl({ sr: 'научено', de: 'gelernt', en: 'learned' }) + '</div>' +
      '<div class="vok-tag" style="background:var(--vok-card);color:var(--vok-ink-soft);border:1px solid var(--vok-line)">' + entries.length + ' ' + tpl.lbl({ sr: 'укупно', de: 'insgesamt', en: 'total' }) + '</div>';
  }

  // No "due" or "learned" chip here: these tiles pick a collection for the
  // uncapped free mode, which ignores both (SRS progress only moves through
  // decks), so only the pool size the random draw comes from is relevant.
  function tileChips(entries){
    return '<div class="vok-tag" style="background:var(--vok-card);color:var(--vok-ink-soft);border:1px solid var(--vok-line)">' + entries.length + ' ' + tpl.lbl({ sr: 'укупно', de: 'insgesamt', en: 'total' }) + '</div>';
  }

  // Header shows the total across all collections, each practice tile only its own.
  function renderHeaderStats(){
    var all = store.state.entries, now = Date.now();
    var due = all.filter(function(e){ return srs.isDueAny(e, now); }).length;
    var home = util.el('vok-home-due');
    if(home) home.textContent = due;
    var statsEl = util.el('vok-stats');
    if(statsEl) statsEl.innerHTML = chips(all);
    collections.all().forEach(function(c){
      var el = util.el(tpl.ids(c.kind).learnStats);
      if(el) el.innerHTML = tileChips(store.entries(c.kind));
    });
  }

  function wireShell(){
    // Delegated on the whole app so the persistent nav (outside #vok-panes),
    // the header gear and in-pane data-screen buttons all route here.
    util.el('vok-app').addEventListener('click', function(ev){
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
    setDirection: setDirection,
    fillSelect: fillSelect, fillCatMenu: fillCatMenu, catMenuLabel: catMenuLabel, fillDatalist: fillDatalist, armButton: armButton,
    renderPageControls: renderPageControls, ioStatus: ioStatus,
    renderHeaderStats: renderHeaderStats, wireShell: wireShell
  };
})();
