// Builds all screens from the collection registry.
import { util } from '../util.js';
import { config } from '../config.js';
import { collections } from '../collections.js';
import { i18n } from '../i18n.js';

export const tpl = (function(){

  // Text helpers: Serbian primary + second-language subline (lbl), one-line
  // "srp · second" (line), second-language-only (t), plain Serbian display (sr).
  var lbl = i18n.lbl, line = i18n.line, t = i18n.t, sr = i18n.sr;

  // Single source of element ids, list.js and learn.js ask here.
  function ids(kind){
    return {
      learnStats: 'vok-learnstats-' + kind,
      quizCat:    'vok-quizcat-' + kind,
      subpane:    'vok-subpane-' + kind,
      list:       'vok-list-' + kind,
      page:       'vok-page-' + kind,
      count:      'vok-count-' + kind,
      search:     'vok-search-' + kind,
      catfilter:  'vok-catfilter-' + kind,
      catList:    'vok-catlist-' + kind,
      inWord:     'vok-in-word-' + kind,
      inTrans:    'vok-in-trans-' + kind,
      inEx:       'vok-in-ex-' + kind,
      inCat:      'vok-in-cat-' + kind,
      add:        'vok-add-' + kind,
      delDup:     'vok-del-dup-' + kind,
      delToday:   'vok-del-today-' + kind,
      delCatSel:  'vok-del-cat-sel-' + kind,
      delCat:     'vok-del-cat-' + kind,
      renFrom:    'vok-ren-from-' + kind,
      renTo:      'vok-ren-to-' + kind,
      renCat:     'vok-ren-cat-' + kind,
      exportBtn:  'vok-export-' + kind,
      importBtn:  'vok-import-btn-' + kind,
      importFile: 'vok-import-file-' + kind,
      ioStatus:   'vok-io-status-' + kind
    };
  }

  // The "all categories" option, reused across the category selects.
  var CAT_ALL = { sr: 'Све категорије', de: 'Alle Kategorien', en: 'All categories' };

  // Navigation buttons carry data-screen and are handled by delegation.
  function navBtn(screen, l){
    return '<button class="vok-icon-btn" data-screen="' + screen + '">' + lbl(l) + '</button>';
  }

  // Labeled input: heading above an empty field, replaces long placeholders.
  function field(id, l, style, inputExtra){
    return '<label class="vok-field" style="' + style + '">' +
      '<span class="vok-field-lbl">' + lbl(l) + '</span>' +
      '<input id="' + id + '" class="vok-input"' + (inputExtra || '') + ' />' +
      '</label>';
  }

  // The zigzag rule under the title, part of the identity.
  function rule(){
    return '<svg class="vok-rule" width="100%" height="10" viewBox="0 0 400 10" preserveAspectRatio="none" style="margin:14px 0;opacity:.55">' +
      '<path d="M0,8 L10,0 M12,8 L22,0 M24,8 L34,0 M36,8 L46,0 M48,8 L58,0 M60,8 L70,0 M72,8 L82,0 M84,8 L94,0 M96,8 L106,0 M108,8 L118,0 M120,8 L130,0 M132,8 L142,0 M144,8 L154,0 M156,8 L166,0 M168,8 L178,0 M180,8 L190,0 M192,8 L202,0 M204,8 L214,0 M216,8 L226,0 M228,8 L238,0 M240,8 L250,0 M252,8 L262,0 M264,8 L274,0 M276,8 L286,0 M288,8 L298,0 M300,8 L310,0 M312,8 L322,0 M324,8 L334,0 M336,8 L346,0 M348,8 L358,0 M360,8 L370,0 M372,8 L382,0 M384,8 L394,0" stroke="#A61C3C" stroke-width="1" fill="none"/></svg>';
  }

  // Home is a small dashboard: what is due, one tap into practice, totals below.
  // #vok-stats is filled by ui.renderHeaderStats, same element as before.
  function homePane(){
    return '<div id="vok-pane-home" class="vok-pane active">' +
      '<p class="vok-h">' + sr('Палатица') + '</p>' +
      '<p class="vok-sub">' + sr('Зрно по зрно погача, камен по камен палата') + '</p>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Данас', de: 'Heute', en: 'Today' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Wie viele Einträge gerade zur Wiederholung fällig sind.', en: 'How many entries are due for review right now.' }) + '</p>' +
      '<div class="vok-hero">' +
        '<div class="vok-hero-num" id="vok-home-due">–</div>' +
        '<div class="vok-hero-lbl">' + lbl({ sr: 'доспева данас', de: 'fällig zum Wiederholen', en: 'due for review' }) + '</div>' +
      '</div>' +
      '<button class="vok-btn" data-screen="practice" style="width:100%">' + lbl({ sr: 'Почни вежбу →', de: 'Übung starten', en: 'Start practice' }) + '</button>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Укратко', de: 'Im Überblick', en: 'At a glance' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Gesamtzahl und gelernte Einträge je Sammlung.', en: 'Total and learned entries per collection.' }) + '</p>' +
      '<div id="vok-stats" class="vok-hero-mini"></div>' +
      '</div>';
  }

  function practicePane(){
    var cols = collections.all();
    var tiles = cols.map(function(c, i){
      var id = ids(c.kind);
      return '<div class="vok-mode-tile' + (i === 0 ? ' selected' : '') + '" data-kind="' + c.kind + '">' +
        '<p class="vok-mode-tile-title">' + lbl(c.name) + '</p>' +
        '<div id="' + id.learnStats + '" class="vok-tile-chips"></div>' +
        '</div>';
    }).join('');
    // The daily SRS-deck tile sits after the open collections. It is not a
    // registered collection, so its markup is spelled out here.
    tiles += '<div class="vok-mode-tile" data-kind="srsdeck">' +
      '<p class="vok-mode-tile-title">' + lbl({ sr: 'SRS деке', de: 'SRS-Decks', en: 'SRS decks' }) + '</p>' +
      '<div id="vok-srsdeck-chips" class="vok-tile-chips"></div>' +
      '</div>';

    // Filters live below the tiles, one group per tile, only the selected one shown.
    // Open collections get a category select, the SRS-deck tile gets deck controls.
    var optGroups = cols.map(function(c, i){
      var id = ids(c.kind);
      return '<div class="vok-opts-group' + (i === 0 ? ' active' : '') + '" data-kind="' + c.kind + '">' +
        '<select id="' + id.quizCat + '" class="vok-select"><option value="sve">' + line(CAT_ALL) + '</option></select>' +
        '</div>';
    }).join('');
    optGroups += '<div class="vok-opts-group" data-kind="srsdeck">' +
      '<select id="vok-deck-select" class="vok-select"></select>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:2px">' +
        '<button class="vok-btn-ghost" id="vok-deck-new">' + lbl({ sr: '＋ Направи деку', de: 'Deck erstellen', en: 'Create deck' }) + '</button>' +
        '<button class="vok-btn-ghost" id="vok-deck-edit">' + lbl({ sr: 'Уреди', de: 'Bearbeiten', en: 'Edit' }) + '</button>' +
      '</div>' +
      '<p class="vok-hint" id="vok-deck-info" style="margin:2px 0 0"></p>' +
      '</div>';

    // Direction labels: the second side follows the chosen UI language.
    var pd = config.getDir();
    var second = i18n.lang() === 'en' ? 'EN' : 'DE';
    var srp = sr('СРП');
    var dir =
      '<div class="vok-seg wide">' +
        '<button class="' + (pd === 'srp-de' ? 'active' : '') + '" data-dir="srp-de">' + srp + ' → ' + second + '</button>' +
        '<button class="' + (pd === 'de-srp' ? 'active' : '') + '" data-dir="de-srp">' + second + ' → ' + srp + '</button>' +
      '</div>';
    return '<div id="vok-pane-practice" class="vok-pane">' +
      '<p class="vok-h" style="font-size:18px;margin-bottom:14px">' + lbl({ sr: 'Вежбај', de: 'Üben', en: 'Practice' }) + '</p>' +

      '<p class="vok-subh">' + lbl({ sr: 'Сакупљање', de: 'Sammlung', en: 'Collection' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Was du gerade übst. Wörter und Sätze sind offen, SRS-Decks arbeiten mit Tagespensum.', en: 'What you are practicing. Words and sentences are open, SRS decks use a daily quota.' }) + '</p>' +
      '<div class="vok-mode-row">' + tiles + '</div>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Избор', de: 'Auswahl', en: 'Selection' }, 'display:block') + '</p>' +
      '<div class="vok-mode-opts">' + optGroups + '</div>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Смер', de: 'Abfragerichtung', en: 'Direction' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'In welche Richtung abgefragt werden soll.', en: 'Which way the prompt runs.' }) + '</p>' +
      dir +
      '<button class="vok-btn" id="vok-start" style="width:100%;margin-top:14px">' + lbl({ sr: 'Почни →', de: 'Start', en: 'Start' }) + '</button>' +
      '</div>';
  }

  function quizPane(){
    return '<div id="vok-pane-quiz" class="vok-pane">' +
      '<div class="vok-screen-head">' +
        navBtn('practice', { sr: '← Прекини', de: 'abbrechen', en: 'cancel' }) +
        '<button class="vok-btn-ghost" id="vok-quiz-undo" style="display:none">' + lbl({ sr: '↩ Врати', de: 'rückgängig', en: 'undo' }) + '</button>' +
      '</div>' +
      '<div id="vok-quiz-box"></div>' +
      '</div>';
  }

  // Own screen behind the "Deck erstellen" button. The card list, checkbox state
  // and category helper are filled by ui/deckedit.js; here is only the frame.
  function deckEditPane(){
    return '<div id="vok-pane-deckedit" class="vok-pane">' +
      '<div class="vok-screen-head">' +
        navBtn('practice', { sr: '← Назад', de: 'zurück', en: 'back' }) +
        '<button class="vok-icon-btn danger" id="vok-deckedit-delete" style="display:none">' + lbl({ sr: 'Обриши деку', de: 'Deck löschen', en: 'Delete deck' }) + '</button>' +
      '</div>' +
      '<p class="vok-h" style="font-size:18px;margin-bottom:4px" id="vok-deckedit-title">' + lbl({ sr: 'Направи деку', de: 'Deck erstellen', en: 'Create deck' }) + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Häkchen setzen bestimmt, welche Karten fest im Deck sind.', en: 'The checkboxes decide which cards belong to the deck.' }) + '</p>' +

      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
        '<label class="vok-field" style="flex:2;min-width:160px"><span class="vok-field-lbl">' + lbl({ sr: 'Име деке', de: 'Deckname', en: 'Deck name' }) + '</span>' +
          '<input id="vok-deckedit-name" class="vok-input" /></label>' +
        '<label class="vok-field" style="flex:1;min-width:120px"><span class="vok-field-lbl">' + lbl({ sr: 'Нове/дан', de: 'Neu pro Tag', en: 'New/day' }) + '</span>' +
          '<input id="vok-deckedit-npd" class="vok-input" type="number" min="0" placeholder="10" /></label>' +
      '</div>' +

      '<input id="vok-deckedit-search" class="vok-input" style="margin-bottom:10px" placeholder="' + line({ sr: '🔍 претрага', de: 'Suche (Wort, Übersetzung)', en: 'Search (word, translation)' }) + '" />' +

      '<div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin-bottom:10px">' +
        '<label class="vok-field" style="flex:1;min-width:150px"><span class="vok-field-lbl">' + lbl({ sr: 'Означи по категорији', de: 'Nach Kategorie ankreuzen', en: 'Check by category' }) + '</span>' +
          '<select id="vok-deckedit-cat" class="vok-select"></select></label>' +
        '<button class="vok-btn-ghost" id="vok-deckedit-checkcat">' + lbl({ sr: 'Означи', de: 'Ankreuzen', en: 'Check' }) + '</button>' +
        '<button class="vok-icon-btn" id="vok-deckedit-all">' + lbl({ sr: 'Све', de: 'Alle', en: 'All' }) + '</button>' +
        '<button class="vok-icon-btn" id="vok-deckedit-none">' + lbl({ sr: 'Ништа', de: 'Keine', en: 'None' }) + '</button>' +
      '</div>' +

      '<p class="vok-status" id="vok-deckedit-count" style="margin:0 0 8px"></p>' +
      '<div id="vok-deckedit-list"></div>' +

      '<div style="display:flex;gap:8px;margin-top:14px">' +
        '<button class="vok-btn" id="vok-deckedit-save" style="flex:1">' + lbl({ sr: 'Сачувај деку', de: 'Deck speichern', en: 'Save deck' }) + '</button>' +
        '<button class="vok-btn-ghost" data-screen="practice">' + lbl({ sr: 'Откажи', de: 'Abbrechen', en: 'Cancel' }) + '</button>' +
      '</div>' +
      '</div>';
  }

  function listSubpane(c, i){
    var id = ids(c.kind);
    return '<div id="' + id.subpane + '" class="vok-subpane' + (i === 0 ? ' active' : '') + '" data-kind="' + c.kind + '">' +
      '<p class="vok-subh">' + lbl({ sr: 'Додај ручно', de: 'Manuell hinzufügen', en: 'Add manually' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Fügt einen neuen Eintrag direkt hinzu, ohne den Übungsmodus.', en: 'Adds a new entry directly, without the practice mode.' }) + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;">' +
        field(id.inWord, c.fl.word, 'flex:1;min-width:140px') +
        field(id.inTrans, c.fl.trans, 'flex:1;min-width:140px') +
        field(id.inEx, c.fl.ex, 'flex:2;min-width:160px') +
        field(id.inCat, c.fl.cat, 'flex:1;min-width:160px', ' list="' + id.catList + '"') +
        '<datalist id="' + id.catList + '"></datalist>' +
        '<button class="vok-btn" id="' + id.add + '">' + lbl(c.addBtn) + '</button>' +
      '</div>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Филтер и претрага', de: 'Filter & Suche', en: 'Filter & search' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Grenzt die Liste nach Status, Kategorie oder Suchbegriff ein.', en: 'Narrows the list by status, category or search term.' }) + '</p>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">' +
        '<div class="vok-seg">' +
          '<button class="active" data-filter="danas">' + lbl({ sr: 'Данас доспева', de: 'heute fällig', en: 'due today' }) + '</button>' +
          '<button data-filter="sve">' + lbl({ sr: 'Све', de: 'Alle', en: 'all' }) + '</button>' +
          '<button data-filter="naucene">' + lbl({ sr: 'Научено', de: 'gelernt', en: 'learned' }) + '</button>' +
        '</div>' +
        '<select id="' + id.catfilter + '" class="vok-select"><option value="sve">' + line(CAT_ALL) + '</option></select>' +
      '</div>' +
      '<input id="' + id.search + '" class="vok-input" style="margin-bottom:12px" placeholder="' + line(c.ph.search) + '" />' +
      '<p id="' + id.count + '" class="vok-status" style="margin:0 0 8px"></p>' +
      '<div id="' + id.list + '"></div>' +
      '<div id="' + id.page + '" style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:12px"></div>' +

      '<details class="vok-fold">' +
        '<summary>' + lbl({ sr: 'Управљање & подаци', de: 'Verwalten & Daten', en: 'Manage & data' }) + '</summary>' +
        '<p class="vok-subh" style="font-size:13px">' + lbl({ sr: 'Групно брисање', de: 'Massenlöschung', en: 'Bulk delete' }, 'display:inline;margin-left:6px') + '</p>' +
        '<p class="vok-hint">' + t({ de: 'Löscht mehrere Einträge auf einmal nach Kriterium.', en: 'Deletes several entries at once by criterion.' }) + '</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">' +
          '<button class="vok-icon-btn danger" id="' + id.delDup + '">' + lbl({ sr: 'Обриши дупликате', de: 'Duplikate löschen', en: 'Delete duplicates' }) + '</button>' +
          '<button class="vok-icon-btn danger" id="' + id.delToday + '">' + lbl({ sr: 'Обриши додато данас', de: 'heute Hinzugefügtes löschen', en: 'Delete today\'s additions' }) + '</button>' +
          '<select id="' + id.delCatSel + '" class="vok-select"></select>' +
          '<button class="vok-icon-btn danger" id="' + id.delCat + '">' + lbl({ sr: 'Обриши категорију', de: 'Kategorie löschen', en: 'Delete category' }) + '</button>' +
        '</div>' +
        rule() +
        '<p class="vok-subh" style="font-size:13px">' + lbl({ sr: 'Преименуј категорију', de: 'Kategorie umbenennen', en: 'Rename category' }, 'display:inline;margin-left:6px') + '</p>' +
        '<p class="vok-hint">' + t({ de: 'Benennt eine Kategorie über alle Einträge hinweg um.', en: 'Renames a category across all entries.' }) + '</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
          '<select id="' + id.renFrom + '" class="vok-select"></select>' +
          '<input id="' + id.renTo + '" class="vok-input" style="flex:1;min-width:120px" placeholder="' + line({ sr: 'ново име', de: 'neuer Name', en: 'new name' }) + '" />' +
          '<button class="vok-icon-btn" id="' + id.renCat + '">' + lbl({ sr: 'Преименуј', de: 'Umbenennen', en: 'Rename' }) + '</button>' +
        '</div>' +
        rule() +
        '<p class="vok-subh" style="font-size:13px">' + lbl({ sr: 'Извоз и увоз', de: 'Export & Import', en: 'Export & import' }, 'display:inline;margin-left:6px') + '</p>' +
        '<p class="vok-hint">' + t({ de: 'Sichert oder übernimmt Einträge dieser Sammlung als JSON.', en: 'Backs up or imports this collection as JSON.' }) + '</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="vok-btn-ghost" id="' + id.exportBtn + '">' + lbl({ sr: 'Извези (JSON)', de: 'Exportieren', en: 'Export' }) + '</button>' +
          '<button class="vok-btn-ghost" id="' + id.importBtn + '">' + lbl({ sr: 'Увези (JSON)', de: 'Importieren', en: 'Import' }) + '</button>' +
          '<input type="file" id="' + id.importFile + '" accept="application/json" style="display:none" />' +
        '</div>' +
        '<p class="vok-status" id="' + id.ioStatus + '"></p>' +
      '</details>' +
      '</div>';
  }

  // Applies to all collections plus history, so it lives here once instead of per collection.
  function backupBlock(){
    return '<p class="vok-subh">' + lbl({ sr: 'Комплетан бекап', de: 'Voll-Backup', en: 'Full backup' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Exportiert oder ersetzt den gesamten lokalen Datenbestand als JSON-Datei.', en: 'Exports or replaces the entire local data set as a JSON file.' }) + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="vok-btn-ghost" id="vok-export-all">' + lbl({ sr: 'Извези све (JSON)', de: 'Alles inkl. Statistik exportieren', en: 'Export all incl. stats' }) + '</button>' +
        '<button class="vok-btn-ghost" id="vok-import-all-btn">' + lbl({ sr: 'Увези бекап', de: 'Backup importieren (ersetzt alles)', en: 'Import backup (replaces everything)' }) + '</button>' +
        '<input type="file" id="vok-import-all-file" accept="application/json" style="display:none" />' +
      '</div>' +
      '<p class="vok-status" id="vok-io-status-all"></p>';
  }

  function listPane(){
    var cols = collections.all();
    var subtabs = cols.map(function(c, i){
      return '<button class="vok-subtab' + (i === 0 ? ' active' : '') + '" data-subtab="' + c.kind + '">' + lbl(c.name) + '</button>';
    }).join('');
    return '<div id="vok-pane-list" class="vok-pane">' +
      '<p class="vok-h" style="font-size:18px;margin-bottom:14px">' + lbl({ sr: 'Листа', de: 'Wortliste', en: 'Word list' }) + '</p>' +
      '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">' + subtabs + '</div>' +
      cols.map(listSubpane).join('') +
      '</div>';
  }

  function statsPane(){
    return '<div id="vok-pane-stats" class="vok-pane">' +
      '<p class="vok-h" style="font-size:18px;margin-bottom:14px">' + lbl({ sr: 'Статистика', de: 'Statistik', en: 'Statistics' }) + '</p>' +

      '<p class="vok-subh">' + lbl({ sr: 'Понављања по недељи', de: 'Wiederholungen pro Woche', en: 'Reviews per week' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Wie viele Wiederholungen du in den letzten Wochen gemacht hast.', en: 'How many reviews you did over the last weeks.' }) + '</p>' +
      '<div id="vok-chart-reviews" class="vok-bars"></div>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Научене речи/реченице по недељи', de: 'Neu gelernt pro Woche', en: 'Newly learned per week' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Wie viele Einträge pro Woche neu die Lern-Schwelle erreicht haben.', en: 'How many entries reached the learned threshold each week.' }) + '</p>' +
      '<div id="vok-chart-learned" class="vok-bars"></div>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Укупно', de: 'Insgesamt', en: 'Total' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Gesamtzahlen über alle Sammlungen.', en: 'Totals across all collections.' }) + '</p>' +
      '<div id="vok-stat-summary" style="display:flex;gap:8px;flex-wrap:wrap"></div>' +
      '</div>';
  }

  // Cloud lives here rather than in the header: it is a setting, and off the
  // header the top of every screen stays quiet. Ids match what cloud.js wires.
  // The practice direction is set live on the Üben screen (which persists it via
  // config.setDir), so it has no separate control here.
  function settingsPane(){
    return '<div id="vok-pane-settings" class="vok-pane">' +
      '<p class="vok-h" style="font-size:18px;margin-bottom:14px">' + lbl({ sr: 'Подешавања', de: 'Einstellungen', en: 'Settings' }) + '</p>' +

      '<p class="vok-subh">' + lbl({ sr: 'Тема', de: 'Darstellung', en: 'Appearance' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Legt fest, ob die App hell, dunkel oder nach Systemeinstellung angezeigt wird.', en: 'Sets whether the app shows light, dark or follows the system.' }) + '</p>' +
      '<div class="vok-seg wide">' +
        '<button data-theme-choice="auto">' + lbl({ sr: 'Аутоматски', de: 'System', en: 'System' }) + '</button>' +
        '<button data-theme-choice="light">' + lbl({ sr: 'Светло', de: 'Hell', en: 'Light' }) + '</button>' +
        '<button data-theme-choice="dark">' + lbl({ sr: 'Тамно', de: 'Dunkel', en: 'Dark' }) + '</button>' +
      '</div>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Писмо', de: 'Schrift', en: 'Script' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'In welchem Schriftsystem serbischer Text angezeigt wird. Die Daten bleiben unverändert.', en: 'Which script Serbian text is shown in. The data stays unchanged.' }) + '</p>' +
      '<div class="vok-seg wide">' +
        '<button data-script-choice="cyr">' + lbl({ sr: 'Ћирилица', de: 'Kyrillisch', en: 'Cyrillic' }) + '</button>' +
        '<button data-script-choice="lat">' + lbl({ sr: 'Латиница', de: 'Lateinisch', en: 'Latin' }) + '</button>' +
      '</div>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Језик', de: 'Sprache', en: 'Language' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Die zweite Sprache neben Serbisch in der Oberfläche.', en: 'The second interface language alongside Serbian.' }) + '</p>' +
      '<div class="vok-seg wide">' +
        '<button data-uilang-choice="de">' + lbl({ sr: 'Немачки', de: 'Deutsch', en: 'German' }) + '</button>' +
        '<button data-uilang-choice="en">' + lbl({ sr: 'Енглески', de: 'Englisch', en: 'English' }) + '</button>' +
      '</div>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'SRS план', de: 'Wiederholungsplan in Tagen, aufsteigend', en: 'Review plan in days, ascending' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Abstände in Tagen bis zur nächsten Wiederholung nach jeder erfolgreichen Antwort.', en: 'Gaps in days until the next review after each correct answer.' }) + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px">' +
        '<input id="vok-srs-input" class="vok-input" style="flex:1;min-width:180px" placeholder="1, 3, 7, 14, 30, 60, 120" />' +
        '<button class="vok-btn" id="vok-srs-save">' + lbl({ sr: 'Сачувај', de: 'Speichern', en: 'Save' }) + '</button>' +
        '<button class="vok-btn-ghost" id="vok-srs-reset">' + lbl({ sr: 'Подразумевано', de: 'Standard', en: 'Default' }) + '</button>' +
      '</div>' +
      '<p class="vok-status" id="vok-srs-status"></p>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Праг научености', de: 'Schwelle für „gelernt"', en: 'Learned threshold' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Ab welchem Wiederholungsintervall (in Tagen) ein Eintrag als gelernt zählt.', en: 'From which review interval (in days) an entry counts as learned.' }) + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px">' +
        '<input id="vok-learned-input" class="vok-input" type="number" min="1" style="flex:1;min-width:120px" placeholder="30" />' +
        '<button class="vok-btn" id="vok-learned-save">' + lbl({ sr: 'Сачувај', de: 'Speichern', en: 'Save' }) + '</button>' +
        '<button class="vok-btn-ghost" id="vok-learned-reset">' + lbl({ sr: 'Подразумевано', de: 'Standard', en: 'Default' }) + '</button>' +
      '</div>' +
      '<p class="vok-status" id="vok-learned-status"></p>' +
      rule() +

      '<p class="vok-subh">' + lbl({ sr: 'Синхронизација између уређаја', de: 'Geräte-Sync über deine eigene Supabase. Rein optional.', en: 'Device sync via your own Supabase. Fully optional.' }, 'display:block') + '</p>' +
      '<p class="vok-hint">' + t({ de: 'Gleicht den Lernstand über mehrere Geräte ab, über ein eigenes Supabase-Projekt.', en: 'Syncs your progress across devices, via your own Supabase project.' }) + '</p>' +
      '<div id="vok-cloud-panel" class="vok-card" style="flex-direction:column;align-items:stretch;gap:8px">' +

        '<div id="vok-cloud-setup" style="display:none">' +
          '<p class="vok-status" style="margin:0 0 6px">' + t({ de: 'Die App braucht das nicht. Wer seinen Lernstand über mehrere Geräte teilen will, legt ein eigenes kostenloses Supabase-Projekt an und trägt hier dessen Zugang ein. Die Daten liegen dann in deinem Projekt, nicht bei jemand anderem.', en: 'The app does not need this. To share your progress across devices, create your own free Supabase project and enter its access here. Your data then lives in your project, not with someone else.' }) + '</p>' +
          '<input id="vok-cloud-url" class="vok-input" style="margin-bottom:6px" placeholder="Project URL (https://xxxx.supabase.co)" />' +
          '<input id="vok-cloud-key" class="vok-input" style="margin-bottom:6px" placeholder="publishable key" />' +
          '<button class="vok-btn" id="vok-cloud-save">' + lbl({ sr: 'Сачувај приступ', de: 'Zugang speichern', en: 'Save access' }) + '</button>' +
        '</div>' +

        '<div id="vok-cloud-login" style="display:none">' +
          '<input id="vok-cloud-email" class="vok-input" type="email" style="margin-bottom:6px" placeholder="E-Mail" autocomplete="email" />' +
          '<input id="vok-cloud-pw" class="vok-input" type="password" style="margin-bottom:6px" placeholder="' + t({ de: 'Passwort', en: 'Password' }) + '" autocomplete="current-password" />' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="vok-btn" id="vok-cloud-signin" style="flex:1">' + lbl({ sr: 'Пријава', de: 'Anmelden', en: 'Sign in' }) + '</button>' +
            '<button class="vok-btn-ghost" id="vok-cloud-signup" style="flex:1">' + lbl({ sr: 'Регистрација', de: 'Registrieren', en: 'Register' }) + '</button>' +
          '</div>' +
          '<button class="vok-btn-ghost" id="vok-cloud-magic" style="margin-top:6px;width:100%">' + lbl({ sr: 'Магични линк', de: 'Magic Link per E-Mail', en: 'Magic link by e-mail' }) + '</button>' +
        '</div>' +

        '<div id="vok-cloud-account" style="display:none">' +
          '<p class="vok-trans" style="margin:0 0 8px">' + sr('Пријављен:') + ' <strong id="vok-cloud-email-shown"></strong></p>' +
          '<button class="vok-btn-ghost" id="vok-cloud-push" style="width:100%;margin-bottom:6px">' + lbl({ sr: 'Пренеси локалне податке у облак', de: 'Lokale Daten in die Cloud übernehmen (überschreibt nichts)', en: 'Move local data to the cloud (overwrites nothing)' }) + '</button>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="vok-btn-ghost" id="vok-cloud-signout" style="flex:1">' + lbl({ sr: 'Одјава', de: 'Abmelden', en: 'Sign out' }) + '</button>' +
            '<button class="vok-icon-btn danger" id="vok-cloud-forget" style="flex:1">' + lbl({ sr: 'Уклони приступ', de: 'Zugang von diesem Gerät entfernen', en: 'Remove access from this device' }) + '</button>' +
          '</div>' +
        '</div>' +

        '<p class="vok-status" id="vok-cloud-status"></p>' +
      '</div>' +
      rule() +
      backupBlock() +
      '</div>';
  }

  function panes(){
    return homePane() + practicePane() + quizPane() + deckEditPane() + listPane() + statsPane() + settingsPane();
  }

  // Builds the markup once. Initial active states are baked into the strings.
  function build(){
    util.el('vok-panes').innerHTML = panes();
  }

  return { ids: ids, lbl: lbl, line: line, t: t, sr: sr, build: build };
})();
