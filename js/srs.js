// Spaced-repetition logic, pure functions with no DB or DOM dependency.
export const srs = (function(){
  var DAY = 24*60*60*1000;
  var SCHEDULE = [1,3,7,14,30,60,120];
  var LEARNED_INTERVAL = 30;

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
    isLearned: isLearned
  };
})();
