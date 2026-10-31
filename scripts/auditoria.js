// Auditoría de coherencia del resultado (criterio de Pao, 31-oct).
// Genera miles de combinaciones de respuestas válidas y revisa que lo que ve la clienta
// (necesidades arriba + tarjetas) cuente lo mismo que la rutina recomendada.
// Uso: node scripts/auditoria.js [n]   (sale con código 1 si hay errores)
const fs = require('fs'), path = require('path');
const { createEngine } = require('../lib/engine');
const HTML = path.join(__dirname, '..', 'public', 'quiz.html');
const eng = createEngine(HTML);
const N = Number(process.argv[2] || 200000);
const QS = eng.questions();
const rnd = a => a[Math.random() * a.length | 0];

function randomAnswers() {
  const a = {};
  for (const q of QS) {
    if (q.optional && Math.random() < .2) continue;
    const opts = q.options.filter(o => eng.optionVisible(o, a));
    if (!q.multi) { a[q.id] = rnd(opts).v; continue; }
    const solo = opts.filter(o => o.solo);
    if (solo.length && Math.random() < .12) { a[q.id] = [rnd(solo).v]; continue; }
    const pool = opts.filter(o => !o.solo).sort(() => Math.random() - .5);
    const k = 1 + (Math.random() * Math.min(q.max || 4, pool.length) | 0);
    a[q.id] = pool.slice(0, k).map(o => o.v);
  }
  // «Cuidar mi pelo teñido» depende del tratamiento: se revalida al final
  if (a.prio) a.prio = a.prio.filter(v => eng.optionVisible(QS.find(q => q.id === 'prio').options.find(o => o.v === v), a));
  if (a.prio && !a.prio.length) a.prio = ['frizz'];
  return a;
}

const PRIO_REFLEJO = { // dónde debe verse cada prioridad: necesidad arriba o título de tarjeta
  frizz: [/frizz/], pelitos: [/pelitos|manejo|frizz/], ondas: [/ondas|textura natural/], suave: [/hidratacion|suavidad|suavidad/],
  brillo: [/brillo|opaco|hidratacion/], cuerpo: [/volumen|cuerpo/], quiebre: [/cae más pelo|cepillo|fibra|reparacion/],
  enredo: [/desenred|hidratacion/], canas: [/canas/], color: [/color|tinte|mechas|raíces|teñid/]
};
const errores = {}, ejemplos = {};
function marca(regla, a, r, detalle) {
  errores[regla] = (errores[regla] || 0) + 1;
  if (!ejemplos[regla]) ejemplos[regla] = { detalle, respuestas: a, rutina: r.routine, arriba: r.needs, tarjetas: r.cards };
}

for (let i = 0; i < N; i++) {
  const a = randomAnswers(), r = eng.run(a, 'prelanzamiento');
  const textos = r.cardTexts.join(' '), titulos = r.cards.join(' | '), arriba = r.needs.join(' ');
  const visible = (arriba + ' ' + titulos + ' ' + textos).toLowerCase();
  const calor = a.calor === 'plancha' || a.calor === 'diario';
  // 1. Lo que dice el texto no puede pedir un producto que la rutina no trae
  if (/proteg/.test(textos) && !r.needCrema) marca('1a · un texto habla de proteger y la rutina no trae La Crema', a, r);
  if (r.needs.includes('reparacion') && !r.needMask) marca('1b · arriba dice Reparación y la rutina no trae La Mascarilla', a, r);
  if (/reparaci/.test(textos) && !r.needMask) marca('1c · un texto dice que necesita reparación y la rutina no trae La Mascarilla', a, r);
  // 2. Cada producto extra de la rutina tiene que estar justificado en lo que ve
  if (r.needMask && !/reparaci|hidratacion|fuerza|frágil|alisado|keratina|seco|secas|suavidad rápido|cae más pelo|cepillo/.test(visible)) marca('2a · la rutina trae La Mascarilla y nada en pantalla lo explica', a, r);
  if (r.needCrema && !/frizz|proteg|ondas|textura|definici|calor|pelitos|manejo|desenred|brillo|opaco|rizad|crespo/.test(visible)) marca('2b · la rutina trae La Crema y nada en pantalla lo explica', a, r);
  // 3. Calor: si usa plancha o calor diario y la rutina trae La Crema, la protección se tiene que ver
  if (calor && r.needCrema && !/proteg|protec|calor/.test(arriba + ' ' + textos.toLowerCase())) marca('3 · usa calor, tiene La Crema y no se menciona protección', a, r);
  if (calor && r.needCrema && r.cards.includes('Usas calor con frecuencia') && !/proteg/.test(r.cardTexts[r.cards.indexOf('Usas calor con frecuencia')])) marca('3b · tarjeta de calor sin protección aunque la rutina trae La Crema', a, r);
  // 4. Su prioridad n.º 1 se tiene que ver (arriba o en una tarjeta)
  const p1 = (a.prio || [])[0];
  if (p1 && PRIO_REFLEJO[p1] && !PRIO_REFLEJO[p1].some(re => re.test(visible))) marca('4 · su prioridad n.º 1 («' + p1 + '») no aparece en el resultado', a, r);
  // 5. Contradicciones
  if (/Tu pelo está bien hoy$/.test(titulos.split(' | ')[0] || '') && (a.signos || []).some(s => s !== 'bien')) marca('5a · dice «Tu pelo está bien hoy» y marcó un problema', a, r);
  // 6. Forma
  if (r.needs.length > 3 || new Set(r.needs).size !== r.needs.length) marca('6a · más de 3 necesidades o repetidas', a, r);
  if (r.cards.length > 3 || new Set(r.cards).size !== r.cards.length) marca('6b · más de 3 tarjetas o repetidas', a, r);
  if (r.cardTexts.some(t => !t || !/[.!]$/.test(t.trim()))) marca('6c · tarjeta sin texto o sin punto final', a, r);
}

// 7. Regla de marca: «La Crema» siempre con «(El Acondicionador Sin Enjuague)» en lo que se ve
const html = fs.readFileSync(HTML, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\/\/ [^\n']*$/gm, '');
if (!/class="tr-disclaimer">[^<]*dermatólogo/.test(html)) { errores['5b · falta el aviso del dermatólogo al pie del resultado'] = 1; ejemplos['5b · falta el aviso del dermatólogo al pie del resultado'] = {}; }
const crema = [...html.matchAll(/La Crema(?! \(El Acondicionador Sin Enjuague\))/g)].length;
if (crema) { errores['7 · «La Crema» sin «(El Acondicionador Sin Enjuague)»'] = crema; ejemplos['7 · «La Crema» sin «(El Acondicionador Sin Enjuague)»'] = { detalle: 'ocurrencias en quiz.html' }; }

const total = Object.values(errores).reduce((x, y) => x + y, 0);
console.log('Auditoría · ' + N + ' combinaciones · ' + (total ? Object.keys(errores).length + ' reglas con errores' : 'sin errores'));
for (const k of Object.keys(errores).sort()) console.log('\n✘ ' + k + ' · ' + errores[k] + ' casos\n  ejemplo: ' + JSON.stringify(ejemplos[k]));
process.exit(total ? 1 : 0);
