// CORS cerrado, límite de envíos por IP y utilidades de respuesta para las funciones de Vercel.

function allowedOrigins() {
  const list = (process.env.ALLOWED_ORIGINS || 'https://trribu.com,https://www.trribu.com')
    .split(',').map(s => s.trim()).filter(Boolean);
  // Dominio de vista previa / producción de Vercel (los define Vercel en cada despliegue).
  for (const v of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (v) list.push('https://' + v);
  }
  return list;
}

// Devuelve false si el origen no está permitido (y ya respondió 403).
function cors(req, res, methods) {
  const origin = req.headers.origin;
  if (origin) {
    if (!allowedOrigins().includes(origin)) { send(res, 403, { ok: false, error: 'origen no permitido' }); return false; }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return false; }
  return true;
}

// Límite por IP en memoria de la instancia: frena ráfagas, no es un límite global.
// Para un límite global usar Vercel KV / Upstash (ver PREGUNTAS_PARA_PAO.md).
const hits = new Map();
function rateLimited(req) {
  const max = Number(process.env.RATE_LIMIT_MAX || 5), windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '?').split(',')[0].trim();
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}
function resetRateLimit() { hits.clear(); }

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body || 'null') : req.body;
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 50000) throw new Error('cuerpo demasiado grande'); }
  return JSON.parse(raw || 'null');
}

module.exports = { cors, rateLimited, resetRateLimit, send, readBody, allowedOrigins };
