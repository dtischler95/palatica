// Deck editor screen plus the deck controls on the practice screen. Membership is
// static: the checkboxes are the truth. Tags and the category helper only speed up
// composing, they are not the rule. Cards span all collections (words + sentences).
import { util } from '../util.js';
import { store } from '../store.js';
import { decks } from '../decks.js';
import { ui } from './shell.js';
import { i18n } from '../i18n.js';

export const deckedit = (function(){

  // Working state while the editor is open. selected maps entry id -> true.
  var selected = {};
  var editingId = null;

  function allCats(){
    var set = {};
    store.state.entries.forEach(function(e){ (e.tags || []).forEach(function(t){ set[t] = true; }); });
    return Object.keys(set).sort();
  }

  function visibleEntries(){
    // util.searchKey folds script and diacritics, so a Latin query without
    // diacritics matches Cyrillic-stored words.
    var q = util.searchKey(util.el('vok-deckedit-search').value || '');
    return store.state.entries.filter(function(e){
      if(!q) return true;
      return util.searchKey(e.word).indexOf(q) >= 0 || util.searchKey(e.trans).indexOf(q) >= 0;
    });
  }

  function row(e){
    var esc = util.escapeHtml;
    var on = !!selected[e.id];
    var isSentence = e.kind === 'construction';
    var kindLbl = isSentence
      ? i18n.lbl({ sr: 'Реченица', de: 'Satz', en: 'Sentence' })
      : i18n.lbl({ sr: 'Реч', de: 'Wort', en: 'Word' });
    var kindStyle = isSentence
      ? 'background:var(--vok-due-bg);color:var(--vok-due-fg)'
      : 'background:var(--vok-ok-bg);color:var(--vok-ok-fg)';
    return '<div class="vok-card vok-deck-row' + (on ? ' is-on' : '') + '" data-id="' + esc(e.id) + '">' +
      '<div style="display:flex;align-items:center;gap:10px;min-width:0">' +
        '<span class="vok-deck-cb">&#10003;</span>' +
        '<div style="min-width:0"><p class="vok-word" style="font-size:15px">' + esc(i18n.sr(e.word)) + '</p>' +
          '<p class="vok-trans">' + esc(e.trans) + '</p></div>' +
      '</div>' +
      '<span class="vok-tag" style="' + kindStyle + '">' + kindLbl + '</span>' +
      '</div>';
  }

  function updateCount(){
    var n = Object.keys(selected).filter(function(id){ return selected[id]; }).length;
    var el = util.el('vok-deckedit-count');
    if(el) el.textContent = n + ' ' + i18n.line({ sr: 'означено', de: 'ausgewählt', en: 'selected' });
  }

  function renderList(){
    var host = util.el('vok-deckedit-list');
    if(!host) return;
    var arr = visibleEntries();
    host.innerHTML = arr.length
      ? arr.map(row).join('')
      : '<p class="vok-empty">' + i18n.lbl({ sr: 'Ништа не одговара претрази.', de: 'Nichts passt zur Suche.', en: 'Nothing matches the search.' }) + '</p>';
    updateCount();
  }

  function openEditor(deckId){
    var d = deckId ? decks.get(deckId) : null;
    editingId = d ? d.id : null;
    selected = {};
    if(d) d.cardIds.forEach(function(id){ selected[id] = true; });
    util.el('vok-deckedit-name').value = d ? d.name : '';
    util.el('vok-deckedit-npd').value = d ? d.newPerDay : decks.DEFAULT_NEW_PER_DAY;
    util.el('vok-deckedit-search').value = '';
    util.el('vok-deckedit-title').innerHTML = d
      ? i18n.lbl({ sr: 'Уреди деку', de: 'Deck bearbeiten', en: 'Edit deck' })
      : i18n.lbl({ sr: 'Направи деку', de: 'Deck erstellen', en: 'Create deck' });
    util.el('vok-deckedit-delete').style.display = d ? '' : 'none';
    ui.fillSelect(util.el('vok-deckedit-cat'), allCats(), false);
    renderList();
    ui.showScreen('deckedit');
  }

  // Practice-screen deck dropdown, info line and tile chip. Called from app render().
  function renderDeckControls(){
    var sel = util.el('vok-deck-select');
    if(!sel) return;
    var ds = decks.all();
    var cur = ui.state.practice.deckId;
    if(ds.length && !ds.some(function(d){ return d.id === cur; })){ cur = ds[0].id; ui.state.practice.deckId = cur; }
    if(!ds.length){ cur = null; ui.state.practice.deckId = null; }
    sel.innerHTML = ds.length
      ? ds.map(function(d){
          return '<option value="' + util.escapeHtml(d.id) + '"' + (d.id === cur ? ' selected' : '') + '>' +
            util.escapeHtml(d.name || 'Deck') + ' · ' + d.cardIds.length + '</option>';
        }).join('')
      : '<option value="">— ' + i18n.line({ sr: 'нема дека', de: 'kein Deck', en: 'no deck' }) + ' —</option>';

    var d = decks.get(cur);
    var info = util.el('vok-deck-info');
    if(info) info.textContent = d
      ? (d.cardIds.length + ' ' + i18n.t({ de: 'Karten', en: 'cards' }) + ' · ' + d.newPerDay + ' ' + i18n.t({ de: 'neu/Tag', en: 'new/day' }))
      : i18n.t({ de: 'Noch kein Deck. Lege eins an.', en: 'No deck yet. Create one.' });
    var editBtn = util.el('vok-deck-edit');
    if(editBtn) editBtn.style.display = d ? '' : 'none';
    var chips = util.el('vok-srsdeck-chips');
    if(chips) chips.innerHTML = '<div class="vok-tag" style="background:var(--vok-card);color:var(--vok-ink-soft);border:1px solid var(--vok-line)">' + ds.length + ' ' + i18n.lbl({ sr: 'дека', de: 'Decks', en: 'decks' }) + '</div>';
  }

  function wire(){
    var newBtn = util.el('vok-deck-new');
    if(newBtn) newBtn.addEventListener('click', function(){ openEditor(null); });
    var editBtn = util.el('vok-deck-edit');
    if(editBtn) editBtn.addEventListener('click', function(){ if(ui.state.practice.deckId) openEditor(ui.state.practice.deckId); });
    var sel = util.el('vok-deck-select');
    if(sel) sel.addEventListener('change', function(){ ui.state.practice.deckId = this.value || null; renderDeckControls(); });

    var host = util.el('vok-deckedit-list');
    if(host) host.addEventListener('click', function(ev){
      var rowEl = ev.target.closest('[data-id]');
      if(!rowEl) return;
      var id = rowEl.getAttribute('data-id');
      selected[id] = !selected[id];
      rowEl.classList.toggle('is-on', !!selected[id]);
      updateCount();
    });

    var search = util.el('vok-deckedit-search');
    if(search) search.addEventListener('input', renderList);

    var checkcat = util.el('vok-deckedit-checkcat');
    if(checkcat) checkcat.addEventListener('click', function(){
      var cat = util.el('vok-deckedit-cat').value;
      if(!cat) return;
      // Additive: adds the category to the selection without clearing existing checks.
      store.state.entries.forEach(function(e){ if((e.tags || []).indexOf(cat) >= 0) selected[e.id] = true; });
      renderList();
    });
    var allBtn = util.el('vok-deckedit-all');
    if(allBtn) allBtn.addEventListener('click', function(){
      visibleEntries().forEach(function(e){ selected[e.id] = true; });
      renderList();
    });
    var noneBtn = util.el('vok-deckedit-none');
    if(noneBtn) noneBtn.addEventListener('click', function(){ selected = {}; renderList(); });

    var save = util.el('vok-deckedit-save');
    if(save) save.addEventListener('click', function(){
      var name = util.el('vok-deckedit-name').value.trim() || 'Deck';
      var npd = parseInt(util.el('vok-deckedit-npd').value, 10);
      if(!(Number.isInteger(npd) && npd >= 0)) npd = decks.DEFAULT_NEW_PER_DAY;
      var cardIds = Object.keys(selected).filter(function(id){ return selected[id]; });
      var d = decks.save({ id: editingId || undefined, name: name, cardIds: cardIds, newPerDay: npd });
      ui.state.practice.deckId = d.id;
      renderDeckControls();
      ui.showScreen('practice');
    });

    var del = util.el('vok-deckedit-delete');
    if(del) del.addEventListener('click', function(){
      if(!editingId) return;
      ui.armButton(this, i18n.lbl({ sr: 'Потврди? Брише деку', de: 'Deck löschen', en: 'Delete deck' }), function(){
        decks.remove(editingId);
        if(ui.state.practice.deckId === editingId) ui.state.practice.deckId = null;
        renderDeckControls();
        ui.showScreen('practice');
      });
    });
  }

  return { wire: wire, renderDeckControls: renderDeckControls };
})();
