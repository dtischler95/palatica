// Collection registry, the single place a collection gets declared. Practice tiles,
// list subtabs, state, ids and import/export all derive from this, one register()
// call is enough.
export const collections = (function(){
  var defs = [];

  function register(def){
    defs.push(Object.assign({ modes: ['card'] }, def));
  }
  function all(){ return defs.slice(); }
  function get(kind){ return defs.filter(function(c){ return c.kind === kind; })[0]; }
  function kinds(){ return defs.map(function(c){ return c.kind; }); }

  return { register: register, all: all, get: get, kinds: kinds };
})();

collections.register({
  kind: 'word',
  name:       { sr: 'Речи', de: 'Wörter' },
  noun:       'речи',
  jsonKey:    'words',
  exportFile: 'palatica-reci.json',
  addBtn:     { sr: 'Додај реч', de: 'Wort hinzufügen' },
  ph: {
    word:   'реч или реченица (ћирилица или латиница)',
    trans:  'deutsche Übersetzung',
    ex:     'Beispielsatz (optional)',
    cat:    'категорије, зарезом (нпр. придев, Пепа Прасе)',
    search: '🔍 претрага (реч, превод, пример)'
  },
  emptyList: 'Нема речи овде. Додај нову реч изнад.',
  emptyQuiz: 'Нема речи у овој категорији.',
  modes: ['card']
});

collections.register({
  kind: 'construction',
  name:       { sr: 'Реченице', de: 'Sätze' },
  noun:       'конструкција',
  jsonKey:    'constructions',
  exportFile: 'palatica-konstrukcije.json',
  addBtn:     { sr: 'Додај', de: 'Hinzufügen' },
  ph: {
    word:   'нпр. Мислим да...',
    trans:  'deutsche Übersetzung',
    ex:     'Beispielsatz (optional)',
    cat:    'категорије, зарезом',
    search: '🔍 претрага'
  },
  emptyList: 'Нема конструкција овде.',
  emptyQuiz: 'Нема конструкција у овој категорији.',
  modes: ['card']
});
