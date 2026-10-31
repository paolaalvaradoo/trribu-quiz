// Tests del endpoint (node --test tests/api.test.js). Klaviyo y Airtable se simulan interceptando fetch.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

process.env.AIRTABLE_TOKEN = 'pat_test';
process.env.AIRTABLE_BASE_ID = 'appTEST';
process.env.KLAVIYO_PRIVATE_API_KEY = 'pk_test';
process.env.KLAVIYO_LIST_ESPERA = 'LESPERA';
process.env.KLAVIYO_LIST_NEWSLETTER = 'LNEWS';
process.env.KLAVIYO_LIST_WHATSAPP = 'LWA';
process.env.KLAVIYO_LIST_PANEL = 'LPANEL';
process.env.CRON_SECRET = 'secreto';

const submit = require('../api/quiz-submit');
const retry = require('../api/retry-klaviyo');
const configApi = require('../api/quiz-config');
const { resetRateLimit } = require('../lib/http');
const { getEngine } = require('../lib/engine');
const loadTestEngine = require('./engine.js');

// ── fetch simulado ──
let calls = [], airtableRows = {}, failKlaviyo = false, failAirtable = false;
global.fetch = async (url, opts = {}) => {
  const body = opts.body ? JSON.parse(opts.body) : null;
  calls.push({ url, method: opts.method, headers: opts.headers, body });
  const ok = (data, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(data) });
  if (url.startsWith('https://api.airtable.com')) {
    if (failAirtable) return ok({ error: 'down' }, 503);
    if (opts.method === 'GET') return ok({ records: Object.values(airtableRows).filter(f => f.estado_klaviyo === 'error').map(fields => ({ fields })) });
    for (const r of body.records) airtableRows[r.fields.submission_id] = { ...(airtableRows[r.fields.submission_id] || {}), ...r.fields };
    return ok({ records: [] });
  }
  if (url.startsWith('https://a.klaviyo.com')) {
    if (failKlaviyo) return ok({ errors: [{ detail: 'caído' }] }, 500);
    if (url.endsWith('/profile-import')) return ok({ data: { id: 'PROF1' } }, 201);
    return ok({}, 202);
  }
  throw new Error('fetch inesperado ' + url);
};
const kCalls = () => calls.filter(c => c.url.startsWith('https://a.klaviyo.com'));
const kPath = p => kCalls().filter(c => c.url.endsWith(p));

function reset() { calls = []; airtableRows = {}; failKlaviyo = false; failAirtable = false; resetRateLimit(); delete process.env.QUIZ_MODO; }

let seq = 0;
function sid() { return 'quiz_' + (1761900000000 + seq++) + '_abc' + seq; }
const baseAnswers = { signos: ['frizz'], porosidad: 'media', tratamientos: ['ninguno'], calor: 'natural', tipo: 'ondas', grosor: 'medio', cuero: 'equilibrado', prio: ['frizz'], futuros: ['nada'] };
function body(over = {}) {
  return { nombre: 'Prueba', email: 'qa+quiz@trribu.com', whatsapp: null, consent: { datos: true, correo: true, whatsapp: false, panel: false },
    answers: { ...baseAnswers }, submission_id: sid(), modo: 'prelanzamiento', website: '', ...over };
}
function call(handler, { method = 'POST', body: b, headers = {} } = {}) {
  return new Promise(resolve => {
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(data) { resolve({ status: this.statusCode, headers: this.headers, json: data ? JSON.parse(data) : null }); } };
    Promise.resolve(handler({ method, body: b, headers: { 'x-forwarded-for': '1.1.1.1', ...headers } }, res)).catch(e => resolve({ status: 'throw', error: e }));
  });
}

test('motor del servidor = motor de tests/engine.js (golden + 3.000 al azar)', () => {
  const eng = getEngine();
  const ref = loadTestEngine(path.join(__dirname, '..', 'public', 'quiz.html'));
  const base = { signos: ['bien'], porosidad: 'media', tratamientos: ['ninguno'], calor: 'natural', tipo: 'lacio', grosor: 'medio', cuero: 'equilibrado', prio: ['prevenir'], futuros: ['nada'] };
  for (const [name, x, exp] of require('./golden_profiles.json')) assert.equal(eng.run({ ...base, ...x }).routine, exp, name);
  const pick = a => a[Math.random() * a.length | 0];
  for (let i = 0; i < 3000; i++) {
    const a = { ...base, signos: [pick(['enredo', 'quiebre', 'puntas', 'cuerpo', 'opaco', 'secoTodo', 'textura', 'canas', 'frizz', 'bien'])], porosidad: pick(['alta', 'media', 'baja']),
      tratamientos: [pick(['ninguno', 'tinteRaices', 'tinteTodo', 'mechas', 'keratina'])], calor: pick(['natural', 'secadora', 'plancha', 'diario']),
      tipo: pick(['lacio', 'suaves', 'ondas', 'rizado', 'crespo']), prio: [pick(['enredo', 'quiebre', 'cuerpo', 'pelitos', 'canas', 'ondas', 'frizz', 'suave', 'brillo', 'prevenir'])] };
    const s = eng.run(a), r = ref(a);
    assert.equal(JSON.stringify([s.routine, s.m, s.c, s.needs, s.cards]), JSON.stringify([r.routine, r.m, r.c, r.needs, r.cards]));
  }
});

test('envío válido: Airtable y Klaviyo con la misma rutina, recalculada en el servidor', async () => {
  reset();
  const b = body();
  b.propiedades = { quiz_routine_code: 'SAMC', quiz_recomendacion: ['shampoo', 'acond', 'masc', 'crema'] }; // el navegador miente
  const r = await call(submit, { body: b });
  assert.equal(r.status, 200); assert.equal(r.json.ok, true);
  const row = airtableRows[b.submission_id];
  assert.equal(row.rutina, 'SAC'); assert.equal(row.estado_klaviyo, 'ok');
  const prof = kPath('/profile-import')[0].body.data.attributes;
  assert.equal(prof.properties.quiz_routine_code, 'SAC');
  assert.deepEqual(prof.properties.quiz_recomendacion, ['shampoo', 'acond', 'crema']);
  assert.deepEqual(prof.properties.quiz_result_needs, row.necesidades);
  assert.equal(prof.first_name, 'Prueba');
  const ev = kPath('/events')[0].body.data.attributes;
  assert.equal(ev.unique_id, b.submission_id);
  assert.equal(ev.metric.data.attributes.name, 'Quiz completado');
  assert.equal(ev.properties.modo, 'prelanzamiento');
  assert.ok(ev.properties.quiz_tags.includes('rutina_SAC') && ev.properties.quiz_tags.includes('quiz_prelanzamiento') && ev.properties.quiz_tags.includes('waitlist'));
  const subJob = kPath('/profile-subscription-bulk-create-jobs')[0].body.data;
  assert.equal(subJob.relationships.list.data.id, 'LESPERA');
  // La llave privada va en el header, nunca en el cuerpo
  assert.equal(kCalls()[0].headers.Authorization, 'Klaviyo-API-Key pk_test');
});

test('sin c1 no se guarda nada', async () => {
  reset();
  const r = await call(submit, { body: body({ consent: { datos: false, correo: true, whatsapp: false } }) });
  assert.equal(r.status, 400); assert.equal(calls.length, 0);
});

test('sin c2: perfil y evento, pero sin suscripción a correo', async () => {
  reset();
  const r = await call(submit, { body: body({ whatsapp: '987654321', consent: { datos: true, correo: false, whatsapp: true, panel: false } }) });
  assert.equal(r.status, 200);
  assert.equal(kPath('/profile-subscription-bulk-create-jobs').length, 0);
  assert.equal(kPath('/profile-import')[0].body.data.attributes.phone_number, '+51987654321');
  assert.deepEqual(kPath('/lists/LWA/relationships/profiles')[0].body, { data: [{ type: 'profile', id: 'PROF1' }] });
});

test('sin c3 no entra a WhatsApp; con c4 entra al Panel', async () => {
  reset();
  await call(submit, { body: body({ whatsapp: '987654321', consent: { datos: true, correo: true, whatsapp: false, panel: true } }) });
  assert.equal(kPath('/lists/LWA/relationships/profiles').length, 0);
  assert.equal(kPath('/lists/LPANEL/relationships/profiles').length, 1);
  assert.equal(kPath('/profile-import')[0].body.data.attributes.properties.consent_whatsapp, false);
});

test('modo lanzamiento: lista Newsletter y sin etiqueta waitlist', async () => {
  reset(); process.env.QUIZ_MODO = 'lanzamiento';
  await call(submit, { body: body({ modo: 'prelanzamiento' }) }); // el servidor manda sobre el navegador
  assert.equal(kPath('/profile-subscription-bulk-create-jobs')[0].body.data.relationships.list.data.id, 'LNEWS');
  const p = kPath('/profile-import')[0].body.data.attributes.properties;
  assert.equal(p.quiz_modo, 'lanzamiento'); assert.equal(p.quiz_version, 'lanzamiento_v41');
  assert.ok(!p.quiz_tags.includes('waitlist') && p.quiz_tags.includes('quiz_lanzamiento'));
});

test('validación: valores desconocidos, demasiadas prioridades, excluyentes, WhatsApp, correo', async () => {
  for (const over of [
    { answers: { ...baseAnswers, calor: 'horno' } },
    { answers: { ...baseAnswers, prio: ['frizz', 'brillo', 'suave', 'cuerpo'] } },
    { answers: { ...baseAnswers, signos: ['bien', 'frizz'] } },
    { answers: { ...baseAnswers, prio: ['color'] } },               // «pelo teñido» sin color
    { answers: { ...baseAnswers, extra: 'x' } },
    { answers: { ...baseAnswers, porosidad: undefined } },
    { whatsapp: '12345', consent: { datos: true, correo: true, whatsapp: true } },
    { consent: { datos: true, correo: false, whatsapp: true } },    // WhatsApp sin número
    { email: 'no-es-correo' },
    { submission_id: 'cualquier cosa' }
  ]) {
    reset();
    const r = await call(submit, { body: body(over) });
    assert.equal(r.status, 400, JSON.stringify(over)); assert.equal(calls.length, 0);
  }
  reset();
  const ok = await call(submit, { body: body({ answers: { ...baseAnswers, tratamientos: ['mechas'], prio: ['color'], edad: '45' } }) });
  assert.equal(ok.status, 200);
  const p = kPath('/profile-import')[0].body.data.attributes.properties;
  assert.equal(p.quiz_edad, '45'); assert.equal(p.quiz_edad_min, 45);
});

test('campo trampa: responde ok y no guarda nada', async () => {
  reset();
  const r = await call(submit, { body: body({ website: 'http://spam' }) });
  assert.equal(r.status, 200); assert.equal(calls.length, 0);
});

test('límite por IP', async () => {
  reset();
  const st = [];
  for (let i = 0; i < 6; i++) st.push((await call(submit, { body: body() })).status);
  assert.deepEqual(st, [200, 200, 200, 200, 200, 429]);
});

test('CORS: solo orígenes permitidos', async () => {
  reset();
  assert.equal((await call(submit, { body: body(), headers: { origin: 'https://otro.com' } })).status, 403);
  const r = await call(submit, { body: body(), headers: { origin: 'https://trribu.com' } });
  assert.equal(r.status, 200); assert.equal(r.headers['access-control-allow-origin'], 'https://trribu.com');
});

test('Klaviyo caído: queda en Airtable con error y el cron lo reintenta', async () => {
  reset(); failKlaviyo = true;
  const b = body();
  const r = await call(submit, { body: b });
  assert.equal(r.status, 200); assert.equal(r.json.ok, true);
  assert.equal(airtableRows[b.submission_id].estado_klaviyo, 'error');
  assert.match(airtableRows[b.submission_id].error_klaviyo, /500/);
  assert.equal((await call(retry, { method: 'GET', headers: {} })).status, 401);
  failKlaviyo = false; calls = [];
  const rr = await call(retry, { method: 'GET', headers: { authorization: 'Bearer secreto' } });
  assert.equal(rr.json.ok, 1);
  assert.equal(airtableRows[b.submission_id].estado_klaviyo, 'ok');
  assert.equal(kPath('/profile-import')[0].body.data.attributes.properties.quiz_routine_code, airtableRows[b.submission_id].rutina);
});

test('Airtable caído: 502 y no se escribe en Klaviyo', async () => {
  reset(); failAirtable = true;
  const r = await call(submit, { body: body() });
  assert.equal(r.status, 502); assert.equal(kCalls().length, 0);
});

test('config pública: sin variantes, el carrito no está listo', async () => {
  const r = await call(configApi, { method: 'GET' });
  assert.equal(r.json.modo, 'prelanzamiento'); assert.equal(r.json.carrito_listo, false);
  assert.equal(r.json.productos.masc.precio, 109);
});

test('ninguna llave privada en el front', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'quiz.html'), 'utf8');
  assert.doesNotMatch(html, /pk_[A-Za-z0-9]{10,}|pat[A-Za-z0-9]{10,}\.|Klaviyo-API-Key|AIRTABLE_TOKEN|shpat_/);
  assert.doesNotMatch(html, /qa-previews|previewCase|modo=lanzamiento/);
});

test('«Otro» no cambia la rutina ni los puntajes (2.000 al azar)', () => {
  const eng = getEngine();
  const base = { signos: ['frizz'], porosidad: 'media', tratamientos: ['ninguno'], calor: 'natural', tipo: 'lacio', grosor: 'medio', cuero: 'equilibrado', prio: ['frizz'], futuros: ['nada'] };
  const pick = a => a[Math.random() * a.length | 0];
  for (let i = 0; i < 2000; i++) {
    const a = { ...base, signos: [pick(['enredo', 'quiebre', 'puntas', 'cuerpo', 'opaco', 'secoTodo', 'textura', 'canas', 'frizz'])], porosidad: pick(['alta', 'media', 'baja']),
      tratamientos: [pick(['tinteRaices', 'tinteTodo', 'mechas', 'keratina'])], calor: pick(['natural', 'secadora', 'plancha', 'diario']),
      prio: [pick(['enredo', 'quiebre', 'cuerpo', 'pelitos', 'canas', 'ondas', 'frizz', 'suave', 'brillo'])], futuros: [pick(['cejas', 'densidad', 'puntasDia', 'cueroPica'])] };
    const conOtro = { ...a, signos: a.signos.concat('otro'), tratamientos: a.tratamientos.concat('otro'), futuros: a.futuros.concat('otro') };
    const x = eng.run(a), y = eng.run(conOtro);
    assert.equal(JSON.stringify([y.routine, y.m, y.c, y.needs]), JSON.stringify([x.routine, x.m, x.c, x.needs]));
  }
  // Solo «Otro» en la pregunta 1: no le decimos «Tu pelo está bien hoy».
  const solo = eng.run({ ...base, signos: ['otro'], prio: ['prevenir'] });
  assert.ok(!solo.cards.includes('Tu pelo está bien hoy'));
});

test('«Otro»: el texto se guarda solo si marcó «Otro», limpio y hasta 80 caracteres', async () => {
  const { parseOtros } = require('../lib/submission');
  const ans = { signos: ['frizz', 'otro'], tratamientos: ['ninguno'], futuros: ['otro'] };
  assert.deepEqual(parseOtros({ signos: '  keratina   para <b>brillo</b> ', tratamientos: 'no marcó otro', futuros: 'x'.repeat(200) }, ans),
    { signos: 'keratina para b brillo /b', futuros: 'x'.repeat(80) });
  assert.deepEqual(parseOtros('texto', ans), {});
  reset();
  const b = body(); b.answers.signos = ['frizz', 'otro']; b.otros = { signos: 'Se me abre la raya' };
  const r = await call(submit, { body: b });
  assert.equal(r.status, 200);
  assert.equal(airtableRows[b.submission_id].p1_otro, 'Se me abre la raya');
  assert.equal(kPath('/profile-import')[0].body.data.attributes.properties.quiz_otro_senales, 'Se me abre la raya');
});

test('caída: la opción y la tarjeta usan sus palabras y derivan al dermatólogo', () => {
  const eng = getEngine();
  const q1 = eng.questions().find(q => q.id === 'signos').options.find(o => o.v === 'quiebre');
  assert.equal(q1.l, 'Se me cae más pelo');
  const r = eng.run({ signos: ['quiebre'], porosidad: 'media', tratamientos: ['ninguno'], calor: 'natural', tipo: 'lacio', grosor: 'medio', cuero: 'equilibrado', prio: ['frizz'], futuros: ['nada'] });
  assert.ok(r.cards.includes('Notas que se te cae más pelo'));
});

test('el correo recibe cada hallazgo con su explicación (y vacío si hay menos de 3)', () => {
  const { buildResult } = require('../lib/submission');
  const sub = { submission_id: 'quiz_1793461935485_abc', modo: 'prelanzamiento', nombre: 'P', email: 'p@x.com', consent: { datos: true, correo: true, whatsapp: false, panel: false }, fecha: 'x',
    answers: { signos: ['quiebre', 'frizz'], porosidad: 'alta', tratamientos: ['mechas'], calor: 'natural', tipo: 'ondas', grosor: 'medio', cuero: 'equilibrado', prio: ['frizz'], futuros: ['nada'] } };
  const p = buildResult(sub).properties;
  assert.equal(p.quiz_hallazgo_1_titulo, p.quiz_result_findings[0]);
  assert.ok(p.quiz_hallazgo_1_texto.length > 20);
  const solo = buildResult({ ...sub, answers: { ...sub.answers, signos: ['bien'], porosidad: 'baja', tratamientos: ['ninguno'], prio: ['prevenir'] } }).properties;
  assert.equal(solo.quiz_hallazgo_3_titulo, '');
});
