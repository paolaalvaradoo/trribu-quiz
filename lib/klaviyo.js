// Klaviyo (API privada, solo en el servidor). Referencia: docs/TRRIBU_Klaviyo_Configuracion_V1_20261031.xlsx
// Perfil + evento «Quiz completado» siempre (con c1); listas solo con el consentimiento que corresponde.
const BASE = () => (process.env.KLAVIYO_API_BASE || 'https://a.klaviyo.com').replace(/\/$/, '');
// Revisión de la API: verificar la vigente en developers.klaviyo.com y fijarla en KLAVIYO_REVISION.
const REVISION = () => process.env.KLAVIYO_REVISION || '2025-10-15';

class KlaviyoError extends Error {}

async function call(method, path, body) {
  const key = process.env.KLAVIYO_PRIVATE_API_KEY;
  if (!key) throw new KlaviyoError('KLAVIYO_PRIVATE_API_KEY no configurada');
  const res = await fetch(BASE() + '/api/' + path, {
    method,
    headers: {
      Authorization: 'Klaviyo-API-Key ' + key,
      revision: REVISION(),
      accept: 'application/vnd.api+json',
      'content-type': 'application/vnd.api+json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new KlaviyoError('Klaviyo ' + method + ' ' + path + ' → ' + res.status + ' ' + text.slice(0, 300));
  return text ? JSON.parse(text) : {};
}

// Listas por consentimiento (hoja «Listas»). IDs en variables de entorno.
function listsFor(sub) {
  const out = [];
  if (sub.consent.correo) {
    const id = sub.modo === 'lanzamiento' ? process.env.KLAVIYO_LIST_NEWSLETTER : process.env.KLAVIYO_LIST_ESPERA;
    if (!id) throw new KlaviyoError('Falta el ID de lista de correo para el modo ' + sub.modo);
    out.push({ kind: 'email', id });
  }
  // WhatsApp y Panel: solo pertenencia a la lista (no suscribe al canal; el canal de WhatsApp está pendiente, § 8.4).
  if (sub.consent.whatsapp && sub.whatsapp && process.env.KLAVIYO_LIST_WHATSAPP) out.push({ kind: 'member', id: process.env.KLAVIYO_LIST_WHATSAPP });
  if (sub.consent.panel && process.env.KLAVIYO_LIST_PANEL) out.push({ kind: 'member', id: process.env.KLAVIYO_LIST_PANEL });
  return out;
}

async function sync(sub, result) {
  const attributes = { email: sub.email, first_name: sub.nombre, properties: result.properties };
  if (sub.whatsapp) attributes.phone_number = sub.whatsapp;
  const profile = await call('POST', 'profile-import', { data: { type: 'profile', attributes } });
  const profileId = profile && profile.data && profile.data.id;

  await call('POST', 'events', {
    data: {
      type: 'event',
      attributes: {
        unique_id: sub.submission_id,
        time: sub.fecha,
        properties: { ...result.properties, modo: sub.modo },
        metric: { data: { type: 'metric', attributes: { name: 'Quiz completado' } } },
        profile: { data: { type: 'profile', attributes: { email: sub.email } } }
      }
    }
  });

  for (const l of listsFor(sub)) {
    if (l.kind === 'email') {
      // Suscripción a correo de marketing SOLO con c2. Es asíncrona en Klaviyo (job).
      await call('POST', 'profile-subscription-bulk-create-jobs', {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            custom_source: 'Quiz TRRIBÚ ' + sub.modo,
            profiles: { data: [{ type: 'profile', attributes: { email: sub.email, subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } } } }] }
          },
          relationships: { list: { data: { type: 'list', id: l.id } } }
        }
      });
    } else {
      if (!profileId) throw new KlaviyoError('Sin id de perfil para agregar a la lista ' + l.id);
      await call('POST', 'lists/' + l.id + '/relationships/profiles', { data: [{ type: 'profile', id: profileId }] });
    }
  }
  return { profileId };
}

module.exports = { sync, listsFor, KlaviyoError };
