// Guarda un envío ya validado: Airtable primero (el dato no se pierde), luego Klaviyo.
const airtable = require('./airtable');
const klaviyo = require('./klaviyo');
const { buildResult } = require('./submission');

async function processSubmission(sub) {
  const result = buildResult(sub);
  await airtable.saveSubmission(sub, result, 'pendiente');
  try {
    await klaviyo.sync(sub, result);
    await airtable.setKlaviyoStatus(sub.submission_id, 'ok');
    return { result, klaviyo: 'ok' };
  } catch (e) {
    console.error('[quiz] Klaviyo falló para', sub.submission_id, e.message);
    // Si esto también falla, la fila queda en «pendiente» y el reintento la ignora: se registra para revisión.
    await airtable.setKlaviyoStatus(sub.submission_id, 'error', e.message).catch(err => console.error('[quiz] no se pudo marcar error', err.message));
    return { result, klaviyo: 'error' };
  }
}

module.exports = { processSubmission };
