// Stats pane: reviews and learned entries per week, last 8 weeks.
import { util } from '../util.js';
import { store } from '../store.js';
import { srs } from '../srs.js';
import { i18n } from '../i18n.js';

export const stats = (function(){

  function lastWeeks(n){
    var weeks = [];
    var now = util.weekKey(Date.now());
    for(var i = n - 1; i >= 0; i--) weeks.push(now - i * 7 * util.DAY);
    return weeks;
  }

  function renderBars(containerId, counts, weeks){
    var max = Math.max.apply(null, counts.concat([1]));
    util.el(containerId).innerHTML = counts.map(function(c, i){
      var h = Math.round((c / max) * 100);
      return '<div class="vok-bar-col">' +
        '<div class="vok-bar" style="height:' + Math.max(h, c > 0 ? 4 : 2) + '%" title="' + c + '"></div>' +
        '<div class="vok-bar-label">' + util.weekLabel(weeks[i]) + '</div></div>';
    }).join('');
  }

  function render(){
    var weeks = lastWeeks(8);
    var history = store.state.history;
    var all = store.state.entries;

    var reviewCounts = weeks.map(function(wk){
      return history.filter(function(h){ return util.weekKey(h.ts) === wk; }).length;
    });
    var learnedCounts = weeks.map(function(wk){
      return all.filter(function(e){ var l = srs.learnedBothAt(e); return l && util.weekKey(l) === wk; }).length;
    });

    renderBars('vok-chart-reviews', reviewCounts, weeks);
    renderBars('vok-chart-learned', learnedCounts, weeks);

    var totalReviews = history.length;
    var totalLearned = all.filter(function(e){ return srs.learnedBothAt(e); }).length;
    var thisWeek = reviewCounts[reviewCounts.length - 1];
    util.el('vok-stat-summary').innerHTML =
      '<div class="vok-tag" style="background:var(--vok-card);color:var(--vok-ink-soft);border:1px solid var(--vok-line)">' + totalReviews + ' ' + i18n.lbl({ sr: 'понављања укупно', de: 'Wiederholungen gesamt', en: 'reviews total' }) + '</div>' +
      '<div class="vok-tag" style="background:var(--vok-ok-bg);color:var(--vok-ok-fg)">' + totalLearned + ' ' + i18n.lbl({ sr: 'научено укупно', de: 'gelernt gesamt', en: 'learned total' }) + '</div>' +
      '<div class="vok-tag" style="background:var(--vok-due-bg);color:var(--vok-due-fg)">' + thisWeek + ' ' + i18n.lbl({ sr: 'ове недеље', de: 'diese Woche', en: 'this week' }) + '</div>';
  }

  return { render: render };
})();
