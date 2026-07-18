// Builds all screens from the collection registry.
import { util } from '../util.js';
import { collections } from '../collections.js';

export const tpl = (function(){

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

  // Serbian with a German subline, the project-wide labeling convention.
  function lbl(o){
    return util.escapeHtml(o.sr) + '<span class="vok-sub-de">' + util.escapeHtml(o.de) + '</span>';
  }

  // Navigation buttons carry data-screen and are handled by delegation in wireShell.
  function navBtn(screen, l){
    return '<button class="vok-icon-btn" data-screen="' + screen + '">' + lbl(l) + '</button>';
  }

  function screenHead(right){
    return '<div class="vok-screen-head">' +
      navBtn('menu', { sr: '← Мени', de: 'Menü' }) +
      (right || '') +
      '</div>';
  }

  function menuTile(screen, l){
    return '<button class="vok-menu-tile" data-screen="' + screen + '">' +
      '<span class="vok-menu-title">' + lbl(l) + '</span>' +
      '</button>';
  }

  function menuPane(){
    return '<div id="vok-pane-menu" class="vok-pane active"><div class="vok-menu">' +
      menuTile('practice', { sr: 'Вежбај', de: 'Üben' }) +
      menuTile('list', { sr: 'Листа & додавање', de: 'Liste & Hinzufügen' }) +
      menuTile('stats', { sr: 'Статистика', de: 'Statistik' }) +
      menuTile('settings', { sr: 'Подешавања', de: 'Einstellungen' }) +
      '</div></div>';
  }

  function practicePane(){
    var cols = collections.all();
    var tiles = cols.map(function(c, i){
      var id = ids(c.kind);
      return '<div class="vok-mode-tile' + (i === 0 ? ' selected' : '') + '" data-kind="' + c.kind + '">' +
        '<p class="vok-mode-tile-title">' + lbl(c.name) + '</p>' +
        '<div id="' + id.learnStats + '" class="vok-tile-chips"></div>' +
        '<div class="vok-tile-opts">' +
          '<select id="' + id.quizCat + '" class="vok-select"><option value="sve">Све категорије</option></select>' +
        '</div></div>';
    }).join('');
    var dir =
      '<div class="vok-dir-toggle">' +
        '<button class="vok-btn-ghost active" data-dir="srp-de">СРП &rarr; DE</button>' +
        '<button class="vok-btn-ghost" data-dir="de-srp">DE &rarr; СРП</button>' +
      '</div>';
    return '<div id="vok-pane-practice" class="vok-pane">' +
      screenHead(dir) +
      '<div class="vok-mode-row">' + tiles + '</div>' +
      '<button class="vok-btn" id="vok-start">Почни &rarr;<span class="vok-sub-de">Start</span></button>' +
      '</div>';
  }

  function quizPane(){
    return '<div id="vok-pane-quiz" class="vok-pane">' +
      '<div class="vok-screen-head">' +
        navBtn('practice', { sr: '← Назад', de: 'zur Modusauswahl' }) +
        navBtn('menu', { sr: 'Мени', de: 'Hauptmenü' }) +
      '</div>' +
      '<div id="vok-quiz-box"></div>' +
      '</div>';
  }

  function listSubpane(c, i){
    var id = ids(c.kind), esc = util.escapeHtml;
    return '<div id="' + id.subpane + '" class="vok-subpane' + (i === 0 ? ' active' : '') + '" data-kind="' + c.kind + '">' +
      '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">' +
        '<input id="' + id.inWord + '" class="vok-input" style="flex:1;min-width:140px" placeholder="' + esc(c.ph.word) + '" />' +
        '<input id="' + id.inTrans + '" class="vok-input" style="flex:1;min-width:140px" placeholder="' + esc(c.ph.trans) + '" />' +
        '<input id="' + id.inEx + '" class="vok-input" style="flex:2;min-width:160px" placeholder="' + esc(c.ph.ex) + '" />' +
        '<input id="' + id.inCat + '" class="vok-input" style="flex:1;min-width:160px" list="' + id.catList + '" placeholder="' + esc(c.ph.cat) + '" />' +
        '<datalist id="' + id.catList + '"></datalist>' +
        '<button class="vok-btn" id="' + id.add + '">' + lbl(c.addBtn) + '</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">' +
        '<button class="vok-btn-ghost active" data-filter="danas">' + lbl({ sr: 'Данас доспева', de: 'heute fällig' }) + '</button>' +
        '<button class="vok-btn-ghost" data-filter="sve">' + lbl({ sr: 'Све', de: 'Alle' }) + '</button>' +
        '<button class="vok-btn-ghost" data-filter="naucene">' + lbl({ sr: 'Научено', de: 'gelernt' }) + '</button>' +
        '<select id="' + id.catfilter + '" class="vok-select"><option value="sve">Све категорије</option></select>' +
      '</div>' +
      '<input id="' + id.search + '" class="vok-input" style="margin-bottom:12px" placeholder="' + esc(c.ph.search) + '" />' +
      '<p id="' + id.count + '" class="vok-status" style="margin:0 0 8px"></p>' +
      '<div id="' + id.list + '"></div>' +
      '<div id="' + id.page + '" style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:12px"></div>' +

      '<div style="margin-top:16px;border-top:1px solid var(--vok-line);padding-top:14px;">' +
        '<p class="vok-subh" style="font-size:13px">Групно брисање<span class="vok-sub-de" style="display:inline;margin-left:6px">Massenlöschung</span></p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">' +
          '<button class="vok-icon-btn danger" id="' + id.delDup + '">' + lbl({ sr: 'Обриши дупликате', de: 'Duplikate löschen' }) + '</button>' +
          '<button class="vok-icon-btn danger" id="' + id.delToday + '">' + lbl({ sr: 'Обриши додато данас', de: 'heute Hinzugefügtes löschen' }) + '</button>' +
          '<select id="' + id.delCatSel + '" class="vok-select"></select>' +
          '<button class="vok-icon-btn danger" id="' + id.delCat + '">' + lbl({ sr: 'Обриши категорију', de: 'Kategorie löschen' }) + '</button>' +
        '</div>' +
        '<p class="vok-subh" style="font-size:13px">Преименуј категорију<span class="vok-sub-de" style="display:inline;margin-left:6px">Kategorie umbenennen</span></p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
          '<select id="' + id.renFrom + '" class="vok-select"></select>' +
          '<input id="' + id.renTo + '" class="vok-input" style="flex:1;min-width:120px" placeholder="ново име" />' +
          '<button class="vok-icon-btn" id="' + id.renCat + '">' + lbl({ sr: 'Преименуј', de: 'Umbenennen' }) + '</button>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:8px;margin-top:16px;border-top:1px solid var(--vok-line);padding-top:14px;flex-wrap:wrap;">' +
        '<button class="vok-btn-ghost" id="' + id.exportBtn + '">' + lbl({ sr: 'Извези (JSON)', de: 'Exportieren' }) + '</button>' +
        '<button class="vok-btn-ghost" id="' + id.importBtn + '">' + lbl({ sr: 'Увези (JSON)', de: 'Importieren' }) + '</button>' +
        '<input type="file" id="' + id.importFile + '" accept="application/json" style="display:none" />' +
      '</div>' +
      '<p class="vok-status" id="' + id.ioStatus + '"></p>' +
      '</div>';
  }

  // Applies to all collections plus history, so it lives here once instead of per collection.
  function backupBlock(){
    return '<div style="margin-top:20px;border-top:1px solid var(--vok-line);padding-top:14px;">' +
      '<p class="vok-subh" style="font-size:13px">Комплетан бекап<span class="vok-sub-de" style="display:inline;margin-left:6px">Voll-Backup</span></p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="vok-btn-ghost" id="vok-export-all">' + lbl({ sr: 'Извези све (JSON)', de: 'Alles inkl. Statistik exportieren' }) + '</button>' +
        '<button class="vok-btn-ghost" id="vok-import-all-btn">' + lbl({ sr: 'Увези бекап', de: 'Backup importieren (ersetzt alles)' }) + '</button>' +
        '<input type="file" id="vok-import-all-file" accept="application/json" style="display:none" />' +
      '</div>' +
      '<p class="vok-status" id="vok-io-status-all"></p>' +
      '</div>';
  }

  function listPane(){
    var cols = collections.all();
    var subtabs = cols.map(function(c, i){
      return '<button class="vok-subtab' + (i === 0 ? ' active' : '') + '" data-subtab="' + c.kind + '">' + lbl(c.name) + '</button>';
    }).join('');
    return '<div id="vok-pane-list" class="vok-pane">' +
      screenHead() +
      '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">' + subtabs + '</div>' +
      cols.map(listSubpane).join('') +
      backupBlock() +
      '</div>';
  }

  function statsPane(){
    return '<div id="vok-pane-stats" class="vok-pane">' +
      screenHead() +
      '<p class="vok-h" style="font-size:15px">Понављања по недељи</p>' +
      '<div id="vok-chart-reviews" class="vok-bars"></div>' +
      '<p class="vok-h" style="font-size:15px;margin-top:18px">Научене речи/конструкције по недељи</p>' +
      '<div id="vok-chart-learned" class="vok-bars"></div>' +
      '<div id="vok-stat-summary" style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap"></div>' +
      '</div>';
  }

  function settingsPane(){
    return '<div id="vok-pane-settings" class="vok-pane">' +
      screenHead() +
      '<p class="vok-empty">Још нема подешавања.<span class="vok-sub-de">Noch leer. Hier kommt u.a. der SRS-Zeitplan hin.</span></p>' +
      '</div>';
  }

  function panes(){
    return menuPane() + practicePane() + quizPane() + listPane() + statsPane() + settingsPane();
  }

  // Builds the markup once. Initial active states are baked into the strings.
  function build(){
    util.el('vok-panes').innerHTML = panes();
  }

  return { ids: ids, lbl: lbl, build: build };
})();
