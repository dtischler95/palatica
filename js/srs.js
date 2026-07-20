// Spaced-repetition logic, pure functions with no DB or DOM dependency.
// State is per direction: entry.srs['srp-de'] and entry.srs['de-srp'], each
// { reps, interval, dueAt, learnedAt }. A missing direction means never practiced.
export const srs = (function(){
  var DAY = 24*60*60*1000;
  var DIRS = ['srp-de', 'de-srp'];
  var DEFAULT_SCHEDULE = [1,3,7,14,30,60,120];
  // Mutated in place so the exported reference and the closure below stay in sync.
  var SCHEDULE = DEFAULT_SCHEDULE.slice();
  var DEFAULT_LEARNED_INTERVAL = 30;
  var LEARNED_INTERVAL = DEFAULT_LEARNED_INTERVAL;

  // Replaces the interval plan at runtime. gradePatch clamps reps into range,
  // so changing the length never breaks existing entries; only future gradings
  // use the new plan.
  function setSchedule(arr){
    SCHEDULE.splice(0, SCHEDULE.length);
    arr.forEach(function(n){ SCHEDULE.push(n); });
  }
  function resetSchedule(){ setSchedule(DEFAULT_SCHEDULE); }

  function setLearnedInterval(n){ LEARNED_INTERVAL = n; }
  function resetLearnedInterval(){ LEARNED_INTERVAL = DEFAULT_LEARNED_INTERVAL; }

  // Reads the state for one direction, filling missing values with fresh-card
  // defaults so callers never touch entry.srs[dir] directly.
  function stateOf(entry, dir){
    var s = (entry && entry.srs && entry.srs[dir]) || null;
    return {
      reps: (s && s.reps) || 0,
      interval: (s && s.interval) || 0,
      dueAt: (s && s.dueAt) || 0,
      learnedAt: (s && s.learnedAt) || null
    };
  }

  // New state for one direction only. Caller writes it into entry.srs[dir].
  function gradePatch(entry, level, dir, now){
    now = now || Date.now();
    var cur = stateOf(entry, dir);
    var reps = cur.reps || 0;
    var interval;

    if(level === 'good'){
      reps = reps + 1;
      interval = SCHEDULE[Math.min(reps - 1, SCHEDULE.length - 1)];
    } else if(level === 'hard'){
      var idx = Math.min(Math.max(reps - 1, 0), SCHEDULE.length - 1);
      interval = Math.max(1, Math.round(SCHEDULE[idx] * 0.4));
    } else { // 'fail'
      reps = 0;
      interval = 1;
    }

    var d0 = new Date(now); d0.setHours(0,0,0,0);
    var next = {
      reps: reps,
      interval: interval,
      dueAt: d0.getTime() + interval * DAY,
      learnedAt: cur.learnedAt || null
    };
    if(interval >= LEARNED_INTERVAL && !next.learnedAt){
      next.learnedAt = now;
    }
    return next;
  }

  // Only introduced cards (graded at least once) can be due. A never-graded
  // card defaults to dueAt 0, which would otherwise read as due immediately.
  function isDueDir(entry, dir, now){
    if(!(entry && entry.srs && entry.srs[dir])) return false;
    return stateOf(entry, dir).dueAt <= (now || Date.now());
  }
  function isDueAny(entry, now){
    now = now || Date.now();
    return isDueDir(entry, DIRS[0], now) || isDueDir(entry, DIRS[1], now);
  }
  function isLearnedDir(entry, dir){ return stateOf(entry, dir).interval >= LEARNED_INTERVAL; }
  function isLearnedBoth(entry){ return isLearnedDir(entry, DIRS[0]) && isLearnedDir(entry, DIRS[1]); }
  // Timestamp at which the second direction crossed the learned threshold; null
  // until both directions are learned.
  function learnedBothAt(entry){
    var a = stateOf(entry, DIRS[0]).learnedAt;
    var b = stateOf(entry, DIRS[1]).learnedAt;
    return (a && b) ? Math.max(a, b) : null;
  }
  function minDueAt(entry){
    return Math.min(stateOf(entry, DIRS[0]).dueAt, stateOf(entry, DIRS[1]).dueAt);
  }
  function getLearnedInterval(){ return LEARNED_INTERVAL; }

  return {
    SCHEDULE: SCHEDULE,
    DIRS: DIRS,
    stateOf: stateOf,
    gradePatch: gradePatch,
    isDueDir: isDueDir,
    isDueAny: isDueAny,
    isLearnedDir: isLearnedDir,
    isLearnedBoth: isLearnedBoth,
    learnedBothAt: learnedBothAt,
    minDueAt: minDueAt,
    setSchedule: setSchedule,
    resetSchedule: resetSchedule,
    getLearnedInterval: getLearnedInterval,
    setLearnedInterval: setLearnedInterval,
    resetLearnedInterval: resetLearnedInterval
  };
})();
