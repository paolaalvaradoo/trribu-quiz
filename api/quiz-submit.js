// POST /api/quiz-submit — recibe respuestas y datos, recalcula el motor en el servidor y guarda en Airtable y Klaviyo.
const { cors, rateLimited, send, readBody } = require('../lib/http');
const { parseSubmission, ValidationError } = require('../lib/submission');
const { processSubmission } = require('../lib/process');
const { modo } = require('../lib/config');

module.exports = async function handler(req, res) {
  if (!cors(req, res, 'POST, OPTIONS')) return;
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'método no permitido' });
  if (rateLimited(req)) return send(res, 429, { ok: false, error: 'demasiados envíos, intenta más tarde' });

  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { ok: false, error: 'JSON inválido' }); }

  // Campo trampa: un humano no lo ve ni lo llena. Se responde ok para no darle pistas al bot y no se guarda nada.
  if (body && typeof body.website === 'string' && body.website.trim() !== '') return send(res, 200, { ok: true });

  let sub;
  try { sub = parseSubmission(body, modo()); }
  catch (e) {
    if (e instanceof ValidationError) return send(res, 400, { ok: false, error: e.message });
    throw e;
  }

  try {
    const out = await processSubmission(sub);
    return send(res, 200, { ok: true, submission_id: sub.submission_id, rutina: out.result.routine });
  } catch (e) {
    console.error('[quiz] no se pudo guardar', sub.submission_id, e.message);
    return send(res, 502, { ok: false, error: 'No pudimos guardar tu inscripción. Intenta nuevamente.' });
  }
};
