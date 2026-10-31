// Airtable: base «TRRIBÚ · Quiz», tabla «Respuestas». Una fila por submission_id (upsert).
// Esquema completo en docs/AIRTABLE.md. Límite de la API: 5 solicitudes por segundo por base.
const BASE = () => (process.env.AIRTABLE_API_BASE || 'https://api.airtable.com').replace(/\/$/, '');

class AirtableError extends Error {}

function tableUrl() {
  const base = process.env.AIRTABLE_BASE_ID, table = process.env.AIRTABLE_TABLE || 'Respuestas';
  if (!process.env.AIRTABLE_TOKEN || !base) throw new AirtableError('AIRTABLE_TOKEN o AIRTABLE_BASE_ID no configurados');
  return BASE() + '/v0/' + encodeURIComponent(base) + '/' + encodeURIComponent(table);
}

async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + process.env.AIRTABLE_TOKEN, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new AirtableError('Airtable ' + method + ' → ' + res.status + ' ' + text.slice(0, 300));
  return text ? JSON.parse(text) : {};
}

function toFields(sub, result, estado, error) {
  const a = sub.answers;
  return {
    submission_id: sub.submission_id,
    fecha: sub.fecha,
    modo: sub.modo,
    quiz_version: result.properties.quiz_version,
    nombre: sub.nombre,
    email: sub.email,
    whatsapp: sub.whatsapp || '',
    consent_datos: true,
    consent_correo: sub.consent.correo,
    consent_whatsapp: sub.consent.whatsapp,
    panel: sub.consent.panel,
    p1_senales: a.signos || [],
    p2_porosidad: a.porosidad || null,
    p3_tratamientos: a.tratamientos || [],
    p4_calor: a.calor || null,
    p5_tipo: a.tipo || null,
    p6_grosor: a.grosor || null,
    p7_cuero: a.cuero || null,
    p8_prioridades: a.prio || [],
    p8_prioridad_1: (a.prio || [])[0] || null,
    p9_futuros: a.futuros || [],
    p10_edad: a.edad || null,
    m: result.m,
    c: result.c,
    rutina: result.routine,
    necesidades: result.needs,
    tarjetas: result.cards.join('\n'),
    estado_klaviyo: estado,
    error_klaviyo: error || ''
  };
}

async function upsert(fields) {
  return call('PATCH', tableUrl(), { performUpsert: { fieldsToMergeOn: ['submission_id'] }, typecast: true, records: [{ fields }] });
}

async function saveSubmission(sub, result, estado = 'pendiente', error = '') {
  return upsert(toFields(sub, result, estado, error));
}

async function setKlaviyoStatus(submission_id, estado, error = '') {
  return upsert({ submission_id, estado_klaviyo: estado, error_klaviyo: error ? String(error).slice(0, 1000) : '' });
}

// Filas con estado_klaviyo = error, para el reintento (cron).
async function listKlaviyoErrors(max = 20) {
  const q = new URLSearchParams({ filterByFormula: "{estado_klaviyo}='error'", maxRecords: String(max) });
  const data = await call('GET', tableUrl() + '?' + q.toString());
  return (data.records || []).map(r => r.fields);
}

// Reconstruye el envío desde una fila de Airtable (para reintentar Klaviyo con el mismo resultado).
function rowToSubmission(f) {
  const answers = {
    signos: f.p1_senales || [], porosidad: f.p2_porosidad, tratamientos: f.p3_tratamientos || [], calor: f.p4_calor,
    tipo: f.p5_tipo, grosor: f.p6_grosor, cuero: f.p7_cuero, prio: f.p8_prioridades || [], futuros: f.p9_futuros || []
  };
  if (f.p10_edad) answers.edad = String(f.p10_edad);
  return {
    submission_id: f.submission_id, modo: f.modo, nombre: f.nombre, email: f.email, whatsapp: f.whatsapp || null,
    consent: { datos: true, correo: !!f.consent_correo, whatsapp: !!f.consent_whatsapp, panel: !!f.panel },
    answers, fecha: f.fecha
  };
}

module.exports = { saveSubmission, setKlaviyoStatus, listKlaviyoErrors, rowToSubmission, toFields, AirtableError };
