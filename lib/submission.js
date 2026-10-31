// Validación del envío y armado del registro que va a Airtable y Klaviyo.
// Todo el resultado (rutina, necesidades, tarjetas, etiquetas) sale de lib/engine.js, nunca del navegador.
const { getEngine } = require('./engine');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SUBMISSION_RE = /^quiz_\d{10,16}_[a-z0-9]{1,16}$/;

class ValidationError extends Error {}

function fail(msg) { throw new ValidationError(msg); }

function validateAnswers(answers, engine) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) fail('answers inválido');
  const qs = engine.questions();
  const ids = new Set(qs.map(q => q.id));
  for (const k of Object.keys(answers)) if (!ids.has(k)) fail('pregunta desconocida: ' + k);
  for (const q of qs) {
    const v = answers[q.id];
    if (v === undefined || v === null || v === '') {
      if (q.optional) { delete answers[q.id]; continue; }
      fail('falta la pregunta ' + q.id);
    }
    const allowed = new Map(q.options.map(o => [o.v, o]));
    if (q.multi) {
      if (!Array.isArray(v) || !v.length) fail(q.id + ': se esperaba una lista');
      const max = q.max || q.options.length;
      if (v.length > max) fail(q.id + ': demasiadas respuestas');
      if (new Set(v).size !== v.length) fail(q.id + ': respuestas repetidas');
      for (const x of v) if (typeof x !== 'string' || !allowed.has(x)) fail(q.id + ': valor desconocido');
      if (v.length > 1 && v.some(x => allowed.get(x).solo)) fail(q.id + ': opción excluyente combinada');
    } else {
      if (typeof v !== 'string' || !allowed.has(v)) fail(q.id + ': valor desconocido');
    }
  }
  // Opciones condicionales (p. ej. «Cuidar mi pelo teñido» solo con color): se validan con las respuestas ya completas.
  for (const q of qs) {
    const v = answers[q.id];
    if (v === undefined) continue;
    for (const x of [].concat(v)) {
      const opt = q.options.find(o => o.v === x);
      if (!engine.optionVisible(opt, answers)) fail(q.id + ': opción no disponible con estas respuestas');
    }
  }
  return answers;
}

function normalizeWhatsapp(w) {
  if (w === null || w === undefined || w === '') return null;
  const s = String(w).replace(/\s+/g, '').replace(/^\+51/, '');
  if (!/^9\d{8}$/.test(s)) fail('whatsapp inválido');
  return '+51' + s;
}

// body = lo que manda el navegador. modo = QUIZ_MODO del servidor (manda sobre lo que diga el navegador).
function parseSubmission(body, modo, engine = getEngine()) {
  if (!body || typeof body !== 'object') fail('cuerpo inválido');
  const consent = body.consent || {};
  if (consent.datos !== true) fail('sin consentimiento de datos');
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  if (!nombre || nombre.length > 80) fail('nombre inválido');
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) fail('correo inválido');
  const whatsapp = normalizeWhatsapp(body.whatsapp);
  const c = { datos: true, correo: consent.correo === true, whatsapp: consent.whatsapp === true, panel: consent.panel === true };
  if (c.whatsapp && !whatsapp) fail('WhatsApp marcado sin número');
  if (!c.correo && !c.whatsapp) fail('sin canal autorizado'); // misma regla que el formulario
  const submission_id = body.submission_id;
  if (typeof submission_id !== 'string' || !SUBMISSION_RE.test(submission_id)) fail('submission_id inválido');
  const answers = validateAnswers(JSON.parse(JSON.stringify(body.answers || null)), engine);
  return { submission_id, modo, nombre, email, whatsapp, consent: c, answers, fecha: new Date().toISOString() };
}

// Resultado y propiedades quiz_* (nombres de la hoja «Propiedades» del Excel de Klaviyo y del payload del HTML).
function buildResult(sub, engine = getEngine()) {
  const r = engine.run(sub.answers, sub.modo);
  const a = sub.answers;
  const tags = r.segmento.concat(sub.modo === 'lanzamiento' ? [] : ['waitlist']);
  if (sub.consent.panel) tags.push('panel_si');
  const edadTag = r.segmento.find(t => t.startsWith('edad_'));
  const edad = edadTag ? edadTag.slice(5) : '';
  const properties = {
    quiz_version: (sub.modo === 'lanzamiento' ? 'lanzamiento' : 'prelanzamiento') + '_v41',
    quiz_modo: sub.modo,
    quiz_fecha: sub.fecha,
    quiz_submission_id: sub.submission_id,
    quiz_senales: a.signos || [],
    quiz_porosidad: a.porosidad || '',
    quiz_tratamientos: a.tratamientos || [],
    quiz_calor: a.calor || '',
    quiz_tipo: a.tipo || '',
    quiz_grosor: a.grosor || '',
    quiz_cuero: a.cuero || '',
    quiz_prioridades: a.prio || [],
    quiz_futuros: a.futuros || [],
    quiz_edad: edad,
    quiz_edad_min: edad === '' ? null : (edad === 'm35' ? 0 : Number(edad)),
    quiz_canas: r.segmento.find(t => t.startsWith('canas_')) || '',
    quiz_eje: r.segmento.filter(t => t.startsWith('eje_')),
    quiz_buyer: r.segmento.includes('buyer_A') ? 'buyer_A' : '',
    quiz_routine_code: r.routine,
    quiz_recomendacion: r.recomendacion,
    quiz_result_needs: r.needs,
    quiz_result_findings: r.cards,
    quiz_score_mask: r.m,
    quiz_score_crema: r.c,
    quiz_panel: sub.consent.panel,
    quiz_tags: tags,
    consent_whatsapp: sub.consent.whatsapp
  };
  return { ...r, tags, properties };
}

module.exports = { parseSubmission, buildResult, validateAnswers, ValidationError, SUBMISSION_RE };
