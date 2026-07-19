// Spaced-repetition logic, pure functions with no DB or DOM dependency.
export const srs = (function(){
  var DAY = 24*60*60*1000;
  var DEFAULT_SCHEDULE = [1,3,7,14,30,60,120];
  // Mutated in place so the exported reference and the closure below stay in sync.
  var SCHEDULE = DEFAULT_SCHEDULE.slice();
  var LEARNED_INTERVAL = 30;

  // Replaces the interval plan at runtime. gradePatch clamps reps into range,
  // so changing the length never breaks existing entries; only future gradings
  // use the new plan.
  function setSchedule(arr){
    SCHEDULE.splice(0, SCHEDULE.length);
    arr.forEach(function(n){ SCHEDULE.push(n); });
  }
  function resetSchedule(){ setSchedule(DEFAULT_SCHEDULE); }

  function gradePatch(entry, level, now){
    now = now || Date.now();
    var reps = entry.reps || 0;
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

    var patch = {
      reps: reps,
      interval: interval,
      dueAt: now + interval * DAY
    };
    if(interval >= LEARNED_INTERVAL && !entry.learnedAt){
      patch.learnedAt = now;
    }
    return patch;
  }

  function isDue(entry, now){ return (entry.dueAt || 0) <= (now || Date.now()); }
  function isLearned(entry){ return (entry.interval || 0) >= LEARNED_INTERVAL; }

  return {
    SCHEDULE: SCHEDULE,
    LEARNED_INTERVAL: LEARNED_INTERVAL,
    gradePatch: gradePatch,
    isDue: isDue,
    isLearned: isLearned,
    setSchedule: setSchedule,
    resetSchedule: resetSchedule
  };
})();
