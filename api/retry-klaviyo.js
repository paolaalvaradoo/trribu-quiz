// GET /api/retry-klaviyo — lo llama el cron de Vercel. Reintenta Klaviyo para las filas con estado_klaviyo = error.
// Recalcula el resultado con el mismo motor, así Airtable y Klaviyo guardan la misma rutina.
const airtable = require('../lib/airtable');
const klaviyo = require('../lib/klaviyo');
const { buildResult, validateAnswers } = require('../lib/submission');
const { getEngine } = require('../lib/engine');
const { send } = require('../lib/http');

const pause = ms => new Promise(r => setTimeout(r, ms)); // respeta el límite de 5 solicitudes/s de Airtable

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== 'Bearer ' + secret) return send(res, 401, { ok: false });
  const rows = await airtable.listKlaviyoErrors(20);
  const out = { revisadas: rows.length, ok: 0, error: 0 };
  for (const row of rows) {
    const sub = airtable.rowToSubmission(row);
    try {
      validateAnswers(sub.answers, getEngine());
      await klaviyo.sync(sub, buildResult(sub));
      await airtable.setKlaviyoStatus(sub.submission_id, 'ok');
      out.ok++;
    } catch (e) {
      await airtable.setKlaviyoStatus(sub.submission_id, 'error', 'reintento: ' + e.message).catch(() => {});
      out.error++;
    }
    await pause(400);
  }
  return send(res, 200, { ok: true, ...out });
};
