// GET /api/quiz-config — configuración pública para el navegador: modo, precios, variantes y URL de privacidad.
const { cors, send } = require('../lib/http');
const { publicConfig } = require('../lib/config');

module.exports = function handler(req, res) {
  if (!cors(req, res, 'GET, OPTIONS')) return;
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'método no permitido' });
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(publicConfig()));
};
