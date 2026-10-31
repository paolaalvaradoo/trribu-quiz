// Configuración pública del quiz (sin secretos): modo, precios y variantes de Shopify.
const variants = require('../config/shopify-variants.json');

const ROUTINE_PRODUCTS = ['shampoo', 'acond', 'masc', 'crema'];

function modo() { return process.env.QUIZ_MODO === 'lanzamiento' ? 'lanzamiento' : 'prelanzamiento'; }

function isVariantId(v) { return /^\d{6,20}$/.test(String(v)); }

function publicConfig() {
  const productos = {};
  for (const k of ROUTINE_PRODUCTS) {
    const p = variants[k] || {};
    productos[k] = { precio: p.precio, variant_id: isVariantId(p.variant_id) ? String(p.variant_id) : null };
  }
  return {
    modo: modo(),
    tienda: (process.env.SHOPIFY_STORE_URL || 'https://trribu.com').replace(/\/$/, ''),
    privacidad_url: process.env.PRIVACY_POLICY_URL || null,
    carrito_listo: ROUTINE_PRODUCTS.every(k => productos[k].variant_id),
    productos
  };
}

module.exports = { modo, publicConfig, isVariantId, ROUTINE_PRODUCTS };
