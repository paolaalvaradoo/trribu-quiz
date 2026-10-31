// Prueba punta a punta con los servicios REALES (después de desplegar en Vercel).
// Envía un quiz al endpoint desplegado con un correo de prueba y verifica Airtable y Klaviyo con las mismas llaves.
// Uso:
//   E2E_URL=https://<proyecto>.vercel.app E2E_EMAIL=qa+quiz@trribu.com \
//   AIRTABLE_TOKEN=… AIRTABLE_BASE_ID=… KLAVIYO_PRIVATE_API_KEY=… node scripts/e2e-remote.js
// El correo de prueba debe estar en la lista «Interno · Pruebas» de Klaviyo (excluida de segmentos y campañas).
const URL_ = (process.env.E2E_URL || '').replace(/\/$/, '');
const EMAIL = process.env.E2E_EMAIL;
if (!URL_ || !EMAIL) { console.error('Faltan E2E_URL y E2E_EMAIL'); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const sid = 'quiz_' + Date.now() + '_e2e' + Math.random().toString(36).slice(2, 7);
  // Caso B del Excel de Klaviyo: «Quiebre y mechas» → SAMC
  const answers = { signos: ['quiebre', 'secoTodo'], porosidad: 'media', tratamientos: ['mechas'], calor: 'natural', tipo: 'ondas', grosor: 'medio', cuero: 'equilibrado', prio: ['quiebre', 'suave'], futuros: ['nada'] };
  const r = await fetch(URL_ + '/api/quiz-submit', { method: 'POST', headers: { 'content-type': 'application/json', origin: URL_ },
    body: JSON.stringify({ nombre: 'Prueba E2E', email: EMAIL, whatsapp: null, consent: { datos: true, correo: true, whatsapp: false, panel: false }, answers, submission_id: sid, website: '' }) });
  const out = await r.json();
  console.log('Endpoint:', r.status, out);
  if (!out.ok) process.exit(1);
  await sleep(5000);

  const at = await fetch('https://api.airtable.com/v0/' + process.env.AIRTABLE_BASE_ID + '/' + encodeURIComponent(process.env.AIRTABLE_TABLE || 'Respuestas') +
    '?filterByFormula=' + encodeURIComponent("{submission_id}='" + sid + "'"), { headers: { Authorization: 'Bearer ' + process.env.AIRTABLE_TOKEN } }).then(x => x.json());
  const row = at.records?.[0]?.fields || {};
  const kh = { Authorization: 'Klaviyo-API-Key ' + process.env.KLAVIYO_PRIVATE_API_KEY, revision: process.env.KLAVIYO_REVISION || '2025-10-15', accept: 'application/vnd.api+json' };
  const prof = await fetch('https://a.klaviyo.com/api/profiles?additional-fields[profile]=subscriptions&filter=' + encodeURIComponent('equals(email,"' + EMAIL + '")'), { headers: kh }).then(x => x.json());
  const p = prof.data?.[0]?.attributes || {};
  const checks = {
    'Airtable: fila creada': !!row.submission_id,
    'Airtable: rutina SAMC': row.rutina === 'SAMC',
    'Airtable: estado_klaviyo ok': row.estado_klaviyo === 'ok',
    'Klaviyo: perfil con quiz_submission_id': p.properties?.quiz_submission_id === sid,
    'Klaviyo: misma rutina que Airtable': p.properties?.quiz_routine_code === row.rutina,
    'Klaviyo: suscrita a correo (c2)': p.subscriptions?.email?.marketing?.consent === 'SUBSCRIBED'
  };
  let ok = true;
  for (const [k, v] of Object.entries(checks)) { console.log((v ? '✔ ' : '✘ ') + k); ok = ok && v; }
  console.log('Revisa además en Klaviyo › Métricas › «Quiz completado» el evento con unique_id', sid);
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
