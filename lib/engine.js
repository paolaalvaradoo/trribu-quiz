// Motor del quiz en el servidor. Se carga DIRECTAMENTE desde public/quiz.html (fuente de verdad),
// con la misma técnica que tests/engine.js: nada del motor se copia a mano aquí.
// Expone el resultado completo que necesitan Airtable y Klaviyo.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DEFAULT_HTML = path.join(__dirname, '..', 'public', 'quiz.html');

function el() {
  return { textContent: '', innerHTML: '', hidden: false, style: {}, dataset: {}, classList: { toggle() {}, add() {}, remove() {} },
    querySelector: () => el(), querySelectorAll: () => [], appendChild() {}, setAttribute() {}, removeAttribute() {},
    addEventListener() {}, value: '', checked: false, disabled: false };
}

function createEngine(htmlPath = DEFAULT_HTML) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  const ctx = {
    location: { search: '' }, URLSearchParams,
    document: { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(), documentElement: el() },
    window: { scrollTo() {} }, console, Math, Date, JSON, alert() {}
  };
  vm.createContext(ctx);
  vm.runInContext(code.replace(/\bconst (QS|SV|P|MODO|NEED_LABELS|PRIO_CARD|SCALP)\b/g, 'var $1').replace(/\blet (step|answers)\b/g, 'var $1'), ctx);

  // Copia profunda para que nada de la petición quede ligado al contexto del motor.
  const clone = x => JSON.parse(JSON.stringify(x));

  function run(answers, modo) {
    ctx.__a = clone(answers);
    ctx.MODO = modo === 'lanzamiento' ? 'launch' : 'prelaunch';
    vm.runInContext('answers=__a', ctx);
    const mo = ctx.motor();
    return {
      m: mo.m, c: mo.c, needMask: mo.needMask, needCrema: mo.needCrema,
      routine: 'SA' + (mo.needMask ? 'M' : '') + (mo.needCrema ? 'C' : ''),
      needs: clone(ctx.needsVisual()),
      cards: clone(ctx.hallazgos()).map(x => x[0]),
      cardTexts: clone(ctx.hallazgos()).map(x => x[1]),
      recomendacion: ctx.rutina().map(i => ctx.P[i].id),
      segmento: clone(ctx.segmento())
    };
  }

  // Preguntas tal como están en el HTML (ids, opciones, multi, max, solo, optional, showIf).
  function questions() { return ctx.QS; }

  // ¿Se muestra esta opción con estas respuestas? (p. ej. «Cuidar mi pelo teñido» solo si lleva color)
  function optionVisible(opt, answers) {
    if (!opt.showIf) return true;
    ctx.__a = clone(answers);
    vm.runInContext('answers=__a', ctx);
    return !!opt.showIf();
  }

  function products() { return clone(ctx.P); }

  return { run, questions, optionVisible, products };
}

let cached;
function getEngine() { return cached || (cached = createEngine()); }

module.exports = { createEngine, getEngine };
