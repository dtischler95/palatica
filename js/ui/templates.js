// Builds all screens from the collection registry.
import { util } from '../util.js';
import { config } from '../config.js';
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

  // Navigation buttons carry data-screen and are handled by delegation.
  function navBtn(screen, l){
    return '<button class="vok-icon-btn" data-screen="' + screen + '">' + lbl(l) + '</button>';
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
      '<p class="vok-h">Палатица</p>' +
      '<p class="vok-sub">Зрно по зрно погача, камен по камен палата</p>' +
      rule() +
      '<div class="vok-hero">' +
        '<div class="vok-hero-num" id="vok-home-due">–</div>' +
        '<div class="vok-hero-lbl">доспева данас<span class="vok-sub-de">fällig zum Wiederholen</span></div>' +
      '</div>' +
      '<button class="vok-btn" data-screen="practice" style="width:100%">Почни вежбу &rarr;<span class="vok-sub-de">Übung starten</span></button>' +
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
    // Filters live below the tiles, one group per collection, only the selected
    // one shown. The category select stays first, further selects stack under it.
    var optGroups = cols.map(function(c, i){
      var id = ids(c.kind);
      return '<div class="vok-opts-group' + (i === 0 ? ' active' : '') + '" data-kind="' + c.kind + '">' +
        '<select id="' + id.quizCat + '" class="vok-select"><option value="sve">Све категорије</option></select>' +
        '</div>';
    }).join('');
    var pd = config.getDir();
    var dir =
      '<div class="vok-seg wide" style="margin-bottom:14px">' +
        '<button class="' + (pd === 'srp-de' ? 'active' : '') + '" data-dir="srp-de">СРП &rarr; DE</button>' +
        '<button class="' + (pd === 'de-srp' ? 'active' : '') + '" data-dir="de-srp">DE &rarr; СРП</button>' +
      '</div>';
    return '<div id="vok-pane-practice" class="vok-pane">' +
      '<div class="vok-mode-row">' + tiles + '</div>' +
      '<div class="vok-mode-opts">' + optGroups + '</div>' +
      dir +
      '<button class="vok-btn" id="vok-start" style="width:100%">Почни &rarr;<span class="vok-sub-de">Start</span></button>' +
      '</div>';
  }

  function quizPane(){
    return '<div id="vok-pane-quiz" class="vok-pane">' +
      '<div class="vok-screen-head">' +
        navBtn('practice', { sr: '← Прекини', de: 'abbrechen' }) +
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
        '<div class="vok-seg">' +
          '<button class="active" data-filter="danas">' + lbl({ sr: 'Данас доспева', de: 'heute fällig' }) + '</button>' +
          '<button data-filter="sve">' + lbl({ sr: 'Све', de: 'Alle' }) + '</button>' +
          '<button data-filter="naucene">' + lbl({ sr: 'Научено', de: 'gelernt' }) + '</button>' +
        '</div>' +
        '<select id="' + id.catfilter + '" class="vok-select"><option value="sve">Све категорије</option></select>' +
      '</div>' +
      '<input id="' + id.search + '" class="vok-input" style="margin-bottom:12px" placeholder="' + esc(c.ph.search) + '" />' +
      '<p id="' + id.count + '" class="vok-status" style="margin:0 0 8px"></p>' +
      '<div id="' + id.list + '"></div>' +
      '<div id="' + id.page + '" style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:12px"></div>' +

      '<details class="vok-fold">' +
        '<summary>' + lbl({ sr: 'Управљање & подаци', de: 'Verwalten & Daten' }) + '</summary>' +
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
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">' +
          '<button class="vok-btn-ghost" id="' + id.exportBtn + '">' + lbl({ sr: 'Извези (JSON)', de: 'Exportieren' }) + '</button>' +
          '<button class="vok-btn-ghost" id="' + id.importBtn + '">' + lbl({ sr: 'Увези (JSON)', de: 'Importieren' }) + '</button>' +
          '<input type="file" id="' + id.importFile + '" accept="application/json" style="display:none" />' +
        '</div>' +
        '<p class="vok-status" id="' + id.ioStatus + '"></p>' +
      '</details>' +
      '</div>';
  }

  // Applies to all collections plus history, so it lives here once instead of per collection.
  function backupBlock(){
    return '<details class="vok-fold" style="margin-top:16px">' +
      '<summary>' + lbl({ sr: 'Комплетан бекап', de: 'Voll-Backup' }) + '</summary>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="vok-btn-ghost" id="vok-export-all">' + lbl({ sr: 'Извези све (JSON)', de: 'Alles inkl. Statistik exportieren' }) + '</button>' +
        '<button class="vok-btn-ghost" id="vok-import-all-btn">' + lbl({ sr: 'Увези бекап', de: 'Backup importieren (ersetzt alles)' }) + '</button>' +
        '<input type="file" id="vok-import-all-file" accept="application/json" style="display:none" />' +
      '</div>' +
      '<p class="vok-status" id="vok-io-status-all"></p>' +
      '</details>';
  }

  function listPane(){
    var cols = collections.all();
    var subtabs = cols.map(function(c, i){
      return '<button class="vok-subtab' + (i === 0 ? ' active' : '') + '" data-subtab="' + c.kind + '">' + lbl(c.name) + '</button>';
    }).join('');
    return '<div id="vok-pane-list" class="vok-pane">' +
      '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">' + subtabs + '</div>' +
      cols.map(listSubpane).join('') +
      backupBlock() +
      '</div>';
  }

  function statsPane(){
    return '<div id="vok-pane-stats" class="vok-pane">' +
      '<p class="vok-h" style="font-size:15px">Понављања по недељи</p>' +
      '<div id="vok-chart-reviews" class="vok-bars"></div>' +
      '<p class="vok-h" style="font-size:15px;margin-top:18px">Научене речи/реченице по недељи</p>' +
      '<div id="vok-chart-learned" class="vok-bars"></div>' +
      '<div id="vok-stat-summary" style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap"></div>' +
      '</div>';
  }

  // Cloud lives here rather than in the header: it is a setting, and off the
  // header the top of every screen stays quiet. Ids match what cloud.js wires.
  function settingsPane(){
    var dir = config.getDir();
    return '<div id="vok-pane-settings" class="vok-pane">' +
      '<p class="vok-h" style="font-size:18px;margin-bottom:14px">Подешавања<span class="vok-sub-de">Einstellungen</span></p>' +
      '<p class="vok-subh">Тема<span class="vok-sub-de" style="display:block">Darstellung</span></p>' +
      '<div class="vok-seg wide" style="margin-bottom:20px">' +
        '<button data-theme-choice="auto">Аутоматски<span class="vok-sub-de">System</span></button>' +
        '<button data-theme-choice="light">Светло<span class="vok-sub-de">Hell</span></button>' +
        '<button data-theme-choice="dark">Тамно<span class="vok-sub-de">Dunkel</span></button>' +
      '</div>' +
      '<p class="vok-subh">Подразумевани смер<span class="vok-sub-de" style="display:block">Standardrichtung beim Üben</span></p>' +
      '<div class="vok-seg wide" style="margin-bottom:20px">' +
        '<button class="' + (dir === 'srp-de' ? 'active' : '') + '" data-dir-choice="srp-de">СРП &rarr; DE<span class="vok-sub-de">Serbisch zuerst</span></button>' +
        '<button class="' + (dir === 'de-srp' ? 'active' : '') + '" data-dir-choice="de-srp">DE &rarr; СРП<span class="vok-sub-de">Deutsch zuerst</span></button>' +
      '</div>' +
      '<p class="vok-subh">SRS план<span class="vok-sub-de" style="display:block">Wiederholungsplan in Tagen, aufsteigend</span></p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px">' +
        '<input id="vok-srs-input" class="vok-input" style="flex:1;min-width:180px" placeholder="1, 3, 7, 14, 30, 60, 120" />' +
        '<button class="vok-btn" id="vok-srs-save">Сачувај<span class="vok-sub-de">Speichern</span></button>' +
        '<button class="vok-btn-ghost" id="vok-srs-reset">Подразумевано<span class="vok-sub-de">Standard</span></button>' +
      '</div>' +
      '<p class="vok-status" id="vok-srs-status" style="margin-bottom:20px"></p>' +
      '<p class="vok-subh">Синхронизација између уређаја<span class="vok-sub-de" style="display:block">Geräte-Sync über deine eigene Supabase. Rein optional.</span></p>' +
      '<div id="vok-cloud-panel" class="vok-card" style="flex-direction:column;align-items:stretch;gap:8px">' +

        '<div id="vok-cloud-setup" style="display:none">' +
          '<p class="vok-status" style="margin:0 0 6px">Die App braucht das nicht. Wer seinen Lernstand über mehrere Geräte teilen will, legt ein eigenes kostenloses Supabase-Projekt an und trägt hier dessen Zugang ein. Die Daten liegen dann in deinem Projekt, nicht bei jemand anderem.</p>' +
          '<input id="vok-cloud-url" class="vok-input" style="margin-bottom:6px" placeholder="Project URL (https://xxxx.supabase.co)" />' +
          '<input id="vok-cloud-key" class="vok-input" style="margin-bottom:6px" placeholder="publishable key" />' +
          '<button class="vok-btn" id="vok-cloud-save">Сачувај приступ<span class="vok-sub-de">Zugang speichern</span></button>' +
        '</div>' +

        '<div id="vok-cloud-login" style="display:none">' +
          '<input id="vok-cloud-email" class="vok-input" type="email" style="margin-bottom:6px" placeholder="E-Mail" autocomplete="email" />' +
          '<input id="vok-cloud-pw" class="vok-input" type="password" style="margin-bottom:6px" placeholder="Passwort" autocomplete="current-password" />' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="vok-btn" id="vok-cloud-signin" style="flex:1">Пријава<span class="vok-sub-de">Anmelden</span></button>' +
            '<button class="vok-btn-ghost" id="vok-cloud-signup" style="flex:1">Регистрација<span class="vok-sub-de">Registrieren</span></button>' +
          '</div>' +
          '<button class="vok-btn-ghost" id="vok-cloud-magic" style="margin-top:6px;width:100%">Магични линк<span class="vok-sub-de">Magic Link per E-Mail</span></button>' +
        '</div>' +

        '<div id="vok-cloud-account" style="display:none">' +
          '<p class="vok-trans" style="margin:0 0 8px">Пријављен: <strong id="vok-cloud-email-shown"></strong></p>' +
          '<button class="vok-btn-ghost" id="vok-cloud-push" style="width:100%;margin-bottom:6px">Пренеси локалне податке у облак<span class="vok-sub-de">Lokale Daten in die Cloud übernehmen (überschreibt nichts)</span></button>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="vok-btn-ghost" id="vok-cloud-signout" style="flex:1">Одјава<span class="vok-sub-de">Abmelden</span></button>' +
            '<button class="vok-icon-btn danger" id="vok-cloud-forget" style="flex:1">Уклони приступ<span class="vok-sub-de">Zugang von diesem Gerät entfernen</span></button>' +
          '</div>' +
        '</div>' +

        '<p class="vok-status" id="vok-cloud-status"></p>' +
      '</div>' +
      '</div>';
  }

  function panes(){
    return homePane() + practicePane() + quizPane() + listPane() + statsPane() + settingsPane();
  }

  // Builds the markup once. Initial active states are baked into the strings.
  function build(){
    util.el('vok-panes').innerHTML = panes();
  }

  return { ids: ids, lbl: lbl, build: build };
})();
