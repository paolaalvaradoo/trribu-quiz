// Prueba punta a punta LOCAL: navegador real (Playwright) → quiz.html → /api/quiz-submit → Airtable y Klaviyo SIMULADOS.
// Sirve para validar todo el circuito sin llaves. La prueba con servicios reales es scripts/e2e-remote.js.
// Uso: node scripts/e2e-local.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const TEST_EMAIL = process.env.E2E_EMAIL || 'qa+quiz-e2e@trribu.com';
const ROOT = path.join(__dirname, '..');

// ── Servicios simulados ──
const log = { airtable: {}, klaviyo: [] };
function mockServer(handler) {
  const s = http.createServer(async (req, res) => {
    let raw = ''; for await (const c of req) raw += c;
    handler(req, raw ? JSON.parse(raw) : null, res);
  });
  return new Promise(r => s.listen(0, () => r(s)));
}

async function main() {
  const airtable = await mockServer((req, body, res) => {
    if (req.method === 'PATCH') for (const r of body.records) log.airtable[r.fields.submission_id] = { ...(log.airtable[r.fields.submission_id] || {}), ...r.fields };
    res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ records: [] }));
  });
  const klaviyo = await mockServer((req, body, res) => {
    log.klaviyo.push({ path: req.url, auth: req.headers.authorization, revision: req.headers.revision, body });
    res.statusCode = req.url.endsWith('/profile-import') ? 201 : 202;
    res.end(req.url.endsWith('/profile-import') ? JSON.stringify({ data: { id: 'PROF_E2E' } }) : '');
  });

  Object.assign(process.env, {
    AIRTABLE_API_BASE: 'http://127.0.0.1:' + airtable.address().port, AIRTABLE_TOKEN: 'pat_e2e', AIRTABLE_BASE_ID: 'appE2E',
    KLAVIYO_API_BASE: 'http://127.0.0.1:' + klaviyo.address().port, KLAVIYO_PRIVATE_API_KEY: 'pk_e2e',
    KLAVIYO_LIST_ESPERA: 'L_ESPERA', KLAVIYO_LIST_NEWSLETTER: 'L_NEWS', KLAVIYO_LIST_WHATSAPP: 'L_WA', KLAVIYO_LIST_PANEL: 'L_PANEL'
  });

  // ── Servidor tipo Vercel: public/ + api/ ──
  const routes = { '/api/quiz-submit': require('../api/quiz-submit'), '/api/quiz-config': require('../api/quiz-config') };
  const app = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (routes[url]) return routes[url](req, res);
    if (url === '/' || url === '/quiz.html') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.end(fs.readFileSync(path.join(ROOT, 'public', 'quiz.html'))); }
    res.statusCode = 404; res.end();
  });
  await new Promise(r => app.listen(0, r));
  const origin = 'http://127.0.0.1:' + app.address().port;
  process.env.ALLOWED_ORIGINS = origin;

  const browser = await chromium.launch();
  const results = [];
  try {
    // Caso B del Excel de Klaviyo: «Quiebre y mechas» → SAMC
    const caseB = { signos: ['quiebre', 'secoTodo'], porosidad: 'media', tratamientos: ['mechas'], calor: 'natural', tipo: 'ondas', grosor: 'medio', cuero: 'equilibrado', prio: ['quiebre', 'suave'], futuros: ['nada'] };
    results.push(await runCase(browser, origin, 'prelanzamiento', caseB, 'SAMC', { correo: true, whatsapp: '987654321', panel: true }));

    // Modo lanzamiento con variantes FICTICIAS de prueba: el carrito debe llevar exactamente los productos de la rutina.
    process.env.QUIZ_MODO = 'lanzamiento';
    const variants = require('../config/shopify-variants.json');
    const fake = { shampoo: '9000000000001', acond: '9000000000002', masc: '9000000000003', crema: '9000000000004' };
    for (const k in fake) variants[k].variant_id = fake[k];
    const caseA = { signos: ['frizz'], porosidad: 'media', tratamientos: ['ninguno'], calor: 'natural', tipo: 'ondas', grosor: 'medio', cuero: 'equilibrado', prio: ['frizz'], futuros: ['nada'] };
    results.push(await runCase(browser, origin, 'lanzamiento', caseA, 'SAC', { correo: false, whatsapp: '912345678', c3: true, cart: [fake.shampoo, fake.acond, fake.crema] }));
  } finally {
    await browser.close(); app.close(); airtable.close(); klaviyo.close();
  }
  const failed = results.filter(r => !r.ok);
  console.log('\n' + (failed.length ? 'E2E FALLÓ' : 'E2E OK') + ' · ' + results.length + ' casos');
  process.exit(failed.length ? 1 : 0);
}

async function runCase(browser, origin, modo, answers, expected, opt) {
  log.klaviyo = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  let cartUrl = null;
  await page.route('https://trribu.com/**', r => { cartUrl = r.request().url(); r.fulfill({ status: 200, body: 'carrito' }); });
  await page.goto(origin + '/');
  await page.waitForFunction(() => typeof TRRIBU_CFG !== 'undefined' && TRRIBU_CFG);
  await page.evaluate(() => start());
  const order = ['signos', 'porosidad', 'tratamientos', 'calor', 'tipo', 'grosor', 'cuero', 'prio', 'futuros', 'edad'];
  for (const id of order) {
    if (answers[id] === undefined) { await page.click('#qskip'); continue; }
    for (const v of [].concat(answers[id])) await page.click('#qopts .opt[data-v="' + v + '"]');
    await page.click('#qnext');
  }
  const gate = await page.evaluate(() => ({ gated: document.getElementById('st-result').classList.contains('gated'), h2: document.querySelector('#r-mailsec h2').textContent, btn: document.getElementById('btnguardar').textContent, needsVisibles: !!document.getElementById('tr-needs').offsetParent }));
  await page.fill('#nombre', 'Prueba E2E');
  await page.fill('#mail', TEST_EMAIL);
  if (opt.whatsapp) await page.fill('#wa', opt.whatsapp);
  await page.check('#c1');
  if (opt.correo) await page.check('#c2');
  if (opt.c3 || opt.whatsapp) await page.check('#c3');
  if (opt.panel) await page.check('#c4');
  await page.click('#btnguardar');
  await page.waitForFunction(() => /recibida|No pudimos|Revisa|necesitamos/.test(document.getElementById('mailmsg').textContent));
  const msg = await page.textContent('#mailmsg');
  const despues = await page.evaluate(() => ({ gated: document.getElementById('st-result').classList.contains('gated'), needsVisibles: !!document.getElementById('tr-needs').offsetParent }));
  const sid = await page.evaluate(() => quizSubmissionId());
  await page.screenshot({ path: path.join(ROOT, 'e2e-' + modo + '.png'), fullPage: true });
  if (opt.cart) { await page.click('.tr-close .tr-full'); await page.waitForTimeout(300); }
  await page.close();

  const row = log.airtable[sid] || {};
  const prof = (log.klaviyo.find(c => c.path.endsWith('/profile-import')) || {}).body?.data?.attributes || {};
  const ev = (log.klaviyo.find(c => c.path.endsWith('/events')) || {}).body?.data?.attributes || {};
  const subs = log.klaviyo.filter(c => c.path.endsWith('/profile-subscription-bulk-create-jobs')).map(c => c.body.data.relationships.list.data.id);
  const members = log.klaviyo.filter(c => /\/lists\/.+\/relationships\/profiles$/.test(c.path)).map(c => c.path.split('/')[3]);
  const checks = {
    'mensaje «Tu solicitud fue recibida»': /Tu solicitud fue recibida/.test(msg),
    'Airtable: fila con la rutina esperada': row.rutina === expected,
    'Airtable: estado_klaviyo = ok': row.estado_klaviyo === 'ok',
    'Klaviyo: perfil con la misma rutina': prof.properties?.quiz_routine_code === expected,
    'Klaviyo: mismas necesidades que Airtable': JSON.stringify(prof.properties?.quiz_result_needs) === JSON.stringify(row.necesidades),
    'Klaviyo: evento «Quiz completado» con unique_id': ev.metric?.data?.attributes?.name === 'Quiz completado' && ev.unique_id === sid,
    'Klaviyo: modo correcto': ev.properties?.modo === modo,
    'Klaviyo: llave solo en el header': log.klaviyo.every(c => c.auth === 'Klaviyo-API-Key pk_e2e'),
    'Consentimiento de correo respetado': opt.correo ? JSON.stringify(subs) === JSON.stringify([modo === 'lanzamiento' ? 'L_NEWS' : 'L_ESPERA']) : subs.length === 0,
    'Lista WhatsApp solo con c3': members.includes('L_WA') === !!(opt.c3 || opt.whatsapp),
    'Lista Panel solo con c4': members.includes('L_PANEL') === !!opt.panel,
    'Correo antes del resultado (resultado oculto, botón ENVIARME MI RESULTADO)': gate.gated && !gate.needsVisibles && gate.btn === 'ENVIARME MI RESULTADO' && gate.h2 === 'Te enviamos tu resultado por correo' || JSON.stringify(gate),
    'Después de enviar se ve el resultado': !despues.gated && despues.needsVisibles || JSON.stringify(despues),
    'Sin errores en la consola': errors.length === 0
  };
  if (opt.cart) checks['Carrito: permalink con exactamente la rutina'] = !!cartUrl && cartUrl.startsWith('https://trribu.com/cart/' + opt.cart.map(v => v + ':1').join(',') + '?attributes[quiz_submission_id]=' + sid) || ('URL: ' + cartUrl);
  console.log('\n── ' + modo + ' · correo de prueba ' + TEST_EMAIL + ' · submission ' + sid);
  let ok = true;
  for (const [k, v] of Object.entries(checks)) { console.log((v === true ? '  ✔ ' : '  ✘ ') + k + (v === true ? '' : ' (' + v + ')')); if (v !== true) ok = false; }
  if (errors.length) console.log('  consola:', errors);
  return { ok };
}

main().catch(e => { console.error(e); process.exit(1); });
