// List pane, generic over any registered collection: ids from tpl.ids(kind),
// labels from the registry, state from ui.vs(kind).
import { util } from '../util.js';
import { store } from '../store.js';
import { srs } from '../srs.js';
import { collections } from '../collections.js';
import { ui } from './shell.js';
import { tpl } from './templates.js';

export const list = (function(){
  var PAGE_SIZE = 20;

  // Compares via util.searchKey (transliterated, diacritics folded) so a Latin
  // query without diacritics finds Cyrillic-stored words. Non-Cyrillic passes
  // through, so German translations still match.
  function matchesSearch(e, q){
    if(!q) return true;
    q = util.searchKey(q);
    return util.searchKey(e.word).indexOf(q) >= 0 ||
           util.searchKey(e.trans).indexOf(q) >= 0 ||
           util.searchKey(e.ex).indexOf(q) >= 0;
  }

  function filtered(kind){
    var st = ui.vs(kind), now = Date.now();
    var arr = store.entries(kind);
    if(st.filter === 'danas') arr = arr.filter(function(e){ return srs.isDueAny(e, now); });
    else if(st.filter === 'naucene') arr = arr.filter(srs.isLearnedBoth);
    if(st.cat !== 'sve') arr = arr.filter(function(e){ return (e.tags||[]).indexOf(st.cat) >= 0; });
    if(st.search) arr = arr.filter(function(e){ return matchesSearch(e, st.search); });
    return arr;
  }

  function cardRow(e, editing){
    var esc = util.escapeHtml;
    if(editing){
      // Inputs show the raw stored Serbian (Cyrillic), never transliterated, so
      // saving can never write Latin back into the data.
      return '<div class="vok-edit-row" data-id="' + esc(e.id) + '">' +
        '<input class="vok-input edit-word" value="' + esc(e.word) + '" placeholder="' + tpl.line({ sr: 'реч', de: 'Wort', en: 'word' }) + '" />' +
        '<input class="vok-input edit-trans" value="' + esc(e.trans) + '" placeholder="' + tpl.line({ sr: 'превод', de: 'Übersetzung', en: 'translation' }) + '" />' +
        '<input class="vok-input edit-ex" value="' + esc(e.ex || '') + '" placeholder="' + tpl.line({ sr: 'пример (опционо)', de: 'Beispiel (optional)', en: 'example (optional)' }) + '" />' +
        '<input class="vok-input edit-cat" value="' + esc((e.tags||[]).join(', ')) + '" placeholder="' + tpl.line({ sr: 'категорије, зарезом', de: 'Kategorien, mit Komma', en: 'categories, comma-separated' }) + '" />' +
        '<div style="display:flex;gap:8px;margin-top:6px">' +
          '<button class="vok-btn edit-save">' + tpl.lbl({ sr: 'Сачувај', de: 'speichern', en: 'save' }) + '</button>' +
          '<button class="vok-btn-ghost edit-cancel">' + tpl.lbl({ sr: 'Откажи', de: 'abbrechen', en: 'cancel' }) + '</button>' +
        '</div></div>';
    }
    var days = util.daysUntil(srs.minDueAt(e));
    var tag = srs.isLearnedBoth(e)
      ? '<span class="vok-tag" style="background:var(--vok-ok-bg);color:var(--vok-ok-fg)">' + tpl.lbl({ sr: 'научено', de: 'gelernt', en: 'learned' }) + '</span>'
      : srs.isDueAny(e)
        ? '<span class="vok-tag" style="background:var(--vok-due-bg);color:var(--vok-due-fg)">' + tpl.lbl({ sr: 'доспева', de: 'fällig', en: 'due' }) + '</span>'
        : '<span class="vok-tag" style="background:var(--vok-card);color:var(--vok-ink-soft);border:1px solid var(--vok-line)">' + esc(tpl.sr('за ' + days + ' д.')) + '<span class="vok-sub-de">' + tpl.t({ de: 'in ' + days + ' T.', en: 'in ' + days + ' d.' }) + '</span></span>';
    var chips = (e.tags||[]).map(function(t){ return '<span class="vok-cat-chip">' + esc(tpl.sr(t)) + '</span>'; }).join('');
    return '<div class="vok-card" data-id="' + esc(e.id) + '">' +
      '<div><p class="vok-word">' + esc(tpl.sr(e.word)) +
        ' <button class="vok-icon-btn row-speak" style="padding:2px 7px" title="' + tpl.sr('изговор') + ' / ' + tpl.t({ de: 'vorlesen', en: 'read aloud' }) + '">&#128266;</button></p>' +
      '<p class="vok-trans">' + esc(e.trans) + (e.ex ? ' — ' + esc(tpl.sr(e.ex)) : '') + '</p><div>' + chips + '</div></div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">' + tag +
      '<div style="display:flex;gap:4px">' +
        '<button class="vok-icon-btn row-reset" title="' + tpl.sr('ресетуј напредак') + ' / ' + tpl.t({ de: 'Fortschritt zurücksetzen', en: 'reset progress' }) + '">&#8635;</button>' +
        '<button class="vok-icon-btn row-edit" title="' + tpl.sr('уреди') + ' / ' + tpl.t({ de: 'bearbeiten', en: 'edit' }) + '">&#9998;</button>' +
        '<button class="vok-icon-btn danger row-del" title="' + tpl.sr('обриши') + ' / ' + tpl.t({ de: 'löschen', en: 'delete' }) + '">&#10005;</button>' +
      '</div></div></div>';
  }

  function render(kind){
    var c = collections.get(kind), id = tpl.ids(kind), st = ui.vs(kind);
    var cats = store.distinctCats(kind);
    ui.fillSelect(util.el(id.catfilter), cats, true);
    st.quizCat = ui.fillCatMenu(util.el(id.quizCat), util.el(id.quizCatBtn), cats, st.quizCat);
    ui.fillSelect(util.el(id.delCatSel), cats, false);
    ui.fillSelect(util.el(id.renFrom), cats, false);
    ui.fillDatalist(util.el(id.catList), cats);

    var items = filtered(kind);
    var total = store.entries(kind).length;
    util.el(id.count).textContent = items.length + ' / ' + total + ' ' + tpl.sr(c.noun) + ' · ' + tpl.t({ de: 'in dieser Ansicht', en: 'in this view' });

    var totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if(st.page > totalPages) st.page = totalPages;
    var pageItems = items.slice((st.page - 1) * PAGE_SIZE, st.page * PAGE_SIZE);

    util.el(id.list).innerHTML = items.length === 0
      ? '<p class="vok-empty">' + tpl.lbl(c.emptyList) + '</p>'
      : pageItems.map(function(e){ return cardRow(e, st.editId === e.id); }).join('');

    ui.renderPageControls(id.page, items.length, st.page, function(p){ st.page = p; render(kind); });
  }

  function addFromInputs(kind){
    var id = tpl.ids(kind);
    var word = util.el(id.inWord).value.trim();
    var trans = util.el(id.inTrans).value.trim();
    var ex = util.el(id.inEx).value.trim();
    var tags = util.parseTags(util.el(id.inCat).value);
    if(!word || !trans) return;
    store.addEntry(kind, { word: word, trans: trans, ex: ex, tags: tags });
    util.el(id.inWord).value = '';
    util.el(id.inTrans).value = '';
    util.el(id.inEx).value = '';
    util.el(id.inCat).value = '';
  }

  function wireRows(kind){
    var id = tpl.ids(kind), st = ui.vs(kind);
    util.el(id.list).addEventListener('click', function(ev){
      var host = ev.target.closest('[data-id]');
      if(!host) return;
      var entryId = host.getAttribute('data-id');

      if(ev.target.closest('.row-speak')){
        var e = store.find(entryId); if(e) util.speak(e.word); return;
      }
      if(ev.target.closest('.row-reset')){ store.resetProgress(entryId); return; }
      if(ev.target.closest('.row-edit')){ st.editId = entryId; render(kind); return; }
      if(ev.target.closest('.row-del')){
        ui.armButton(ev.target.closest('.row-del'), '&#10005;?', function(){ store.removeEntry(entryId); });
        return;
      }
      if(ev.target.closest('.edit-save')){
        var word = host.querySelector('.edit-word').value.trim();
        var trans = host.querySelector('.edit-trans').value.trim();
        var ex = host.querySelector('.edit-ex').value.trim();
        var tags = util.parseTags(host.querySelector('.edit-cat').value);
        if(!word || !trans) return;
        st.editId = null;
        store.updateEntry(entryId, { word: word, trans: trans, ex: ex, tags: tags });
        return;
      }
      if(ev.target.closest('.edit-cancel')){ st.editId = null; render(kind); return; }
    });
  }

  function wire(kind){
    var c = collections.get(kind), id = tpl.ids(kind), st = ui.vs(kind);
    var subpane = util.el(id.subpane);

    util.el(id.add).addEventListener('click', function(){ addFromInputs(kind); });

    // Scoped to the subpane, so it doesn't need kind-specific attribute names.
    var filterBtns = subpane.querySelectorAll('[data-filter]');
    filterBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        filterBtns.forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        st.filter = btn.getAttribute('data-filter');
        st.page = 1;
        render(kind);
      });
    });

    util.el(id.catfilter).addEventListener('change', function(){ st.cat = this.value; st.page = 1; render(kind); });
    util.el(id.search).addEventListener('input', function(){ st.search = this.value; st.page = 1; render(kind); });

    var confirmLbl = tpl.lbl({ sr: 'Потврди?', de: 'bestätigen', en: 'confirm' });
    util.el(id.delDup).addEventListener('click', function(){
      ui.armButton(this, confirmLbl, function(){ store.deleteDuplicates(kind); });
    });
    util.el(id.delToday).addEventListener('click', function(){
      ui.armButton(this, confirmLbl, function(){ store.deleteAddedToday(kind); });
    });
    util.el(id.delCat).addEventListener('click', function(){
      var cat = util.el(id.delCatSel).value;
      if(!cat) return;
      ui.armButton(this, confirmLbl, function(){ store.deleteByCategory(kind, cat); });
    });
    util.el(id.renCat).addEventListener('click', function(){
      var from = util.el(id.renFrom).value, to = util.el(id.renTo).value.trim();
      if(!from || !to) return;
      store.renameCategory(kind, from, to);
      util.el(id.renTo).value = '';
    });

    util.el(id.exportBtn).addEventListener('click', function(){
      util.download(JSON.stringify(store.exportCollection(kind), null, 2), c.exportFile);
      ui.ioStatus(id.ioStatus, tpl.line({ sr: 'Извезено.', de: 'Exportiert.', en: 'Exported.' }));
    });
    util.el(id.importBtn).addEventListener('click', function(){ util.el(id.importFile).click(); });
    util.el(id.importFile).addEventListener('change', function(ev){
      var file = ev.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(evt){
        try{
          var data = JSON.parse(evt.target.result);
          var incoming = Array.isArray(data) ? data : (data[c.jsonKey] || []);
          var n = store.importEntries(kind, incoming);
          ui.ioStatus(id.ioStatus, tpl.line({ sr: 'Увезено', de: 'Importiert', en: 'Imported' }) + ': ' + n + ' ' + tpl.sr(c.noun) + ' / ' + tpl.t({ de: 'Einträge', en: 'entries' }) + '.');
        } catch(err){
          ui.ioStatus(id.ioStatus, tpl.line({ sr: 'Грешка при увозу — провери фајл.', de: 'Fehler beim Import — Datei prüfen.', en: 'Import error — check the file.' }));
        }
        ev.target.value = '';
      };
      reader.readAsText(file);
    });

    wireRows(kind);
  }

  function wireBackup(){
    util.el('vok-export-all').addEventListener('click', function(){
      util.download(JSON.stringify(store.exportBackup(), null, 2), 'palatica-backup.json');
      ui.ioStatus('vok-io-status-all', tpl.line({ sr: 'Комплетан бекап извезен.', de: 'Voll-Backup exportiert.', en: 'Full backup exported.' }));
    });
    util.el('vok-import-all-btn').addEventListener('click', function(){ util.el('vok-import-all-file').click(); });
    util.el('vok-import-all-file').addEventListener('change', function(ev){
      var file = ev.target.files[0];
      if(!file) return;
      var btn = util.el('vok-import-all-btn');
      var reader = new FileReader();
      reader.onload = function(evt){
        try{
          var data = JSON.parse(evt.target.result);
          var known = collections.all().some(function(c){ return data[c.jsonKey]; });
          if(!known && !data.history) throw new Error('kein Backup-Format');
          ui.armButton(btn, tpl.lbl({ sr: 'Потврди?', de: 'bestätigen', en: 'confirm' }), function(){
            var r = store.importBackup(data);
            ui.ioStatus('vok-io-status-all', tpl.line({ sr: 'Увезено', de: 'Importiert', en: 'Imported' }) + ': ' +
              r.entries + ' ' + tpl.sr('уноса') + ' / ' + tpl.t({ de: 'Einträge', en: 'entries' }) + ', ' +
              r.history + ' ' + tpl.sr('понављања') + ' / ' + tpl.t({ de: 'Wdh.', en: 'reviews' }) + '.');
          });
          ui.ioStatus('vok-io-status-all', tpl.sr('Кликни поново да потврдиш.') + ' — ' + tpl.t({ de: 'Ersetzt alles auf diesem Gerät.', en: 'Replaces everything on this device.' }));
        } catch(err){
          ui.ioStatus('vok-io-status-all', tpl.line({ sr: 'Грешка при увозу — провери фајл.', de: 'Fehler beim Import — Datei prüfen.', en: 'Import error — check the file.' }));
        }
        ev.target.value = '';
      };
      reader.readAsText(file);
    });
  }

  return { render: render, wire: wire, wireBackup: wireBackup };
})();
