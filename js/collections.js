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
  name:       { sr: 'Речи', de: 'Wörter', en: 'Words' },
  noun:       'речи',
  jsonKey:    'words',
  exportFile: 'palatica-reci.json',
  addBtn:     { sr: 'Додај', de: 'hinzufügen', en: 'add' },
  // Field headings sit above the (empty) inputs, no placeholders in the form.
  fl: {
    word:  { sr: 'Реч', de: 'Wort', en: 'Word' },
    trans: { sr: 'Превод', de: 'Übersetzung', en: 'Translation' },
    ex:    { sr: 'Пример (опционо)', de: 'Beispiel (optional)', en: 'Example (optional)' },
    cat:   { sr: 'Категорије', de: 'Kategorien', en: 'Categories' }
  },
  ph: {
    search: { sr: '🔍 претрага (реч, превод, пример)', de: 'Suche (Wort, Übersetzung, Beispiel)', en: 'Search (word, translation, example)' }
  },
  emptyList: { sr: 'Овде још нема речи. Додај нову реч изнад.', de: 'Noch keine Wörter hier. Oben eine neue hinzufügen.', en: 'No words here yet. Add one above.' },
  emptyQuiz: { sr: 'Нема речи у овој категорији.', de: 'Keine Wörter in dieser Kategorie.', en: 'No words in this category.' },
  modes: ['card']
});

collections.register({
  kind: 'construction',
  name:       { sr: 'Реченице', de: 'Sätze', en: 'Sentences' },
  noun:       'реченица',
  jsonKey:    'constructions',
  exportFile: 'palatica-recenice.json',
  addBtn:     { sr: 'Додај', de: 'hinzufügen', en: 'add' },
  fl: {
    word:  { sr: 'Реченица', de: 'Satz', en: 'Sentence' },
    trans: { sr: 'Превод', de: 'Übersetzung', en: 'Translation' },
    ex:    { sr: 'Пример (опционо)', de: 'Beispiel (optional)', en: 'Example (optional)' },
    cat:   { sr: 'Категорије', de: 'Kategorien', en: 'Categories' }
  },
  ph: {
    search: { sr: '🔍 претрага (реченица, превод, пример)', de: 'Suche (Satz, Übersetzung, Beispiel)', en: 'Search (sentence, translation, example)' }
  },
  emptyList: { sr: 'Овде још нема реченица. Додај нову изнад.', de: 'Noch keine Sätze hier. Oben einen neuen hinzufügen.', en: 'No sentences here yet. Add one above.' },
  emptyQuiz: { sr: 'Нема реченица у овој категорији.', de: 'Keine Sätze in dieser Kategorie.', en: 'No sentences in this category.' },
  modes: ['card']
});
