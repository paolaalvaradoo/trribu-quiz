# TRRIBÚ · Quiz · Instrucciones para Claude Code · V2 · 31-oct-2026

Integrar el quiz de TRRIBÚ con **Klaviyo**, **Airtable**, **Shopify** y **GitHub**, sin cambiar el copy ni la lógica aprobada.

---

## 0 · Reglas que no se negocian

1. **`quiz.html` (V41) es la fuente de verdad** del copy, de las preguntas, del motor de puntajes y de las tarjetas. No reescribas textos ni cambies puntajes. Si algo te parece mal, anótalo en `PREGUNTAS_PARA_PAO.md` y sigue con lo demás.
2. **El motor se calcula de nuevo en el servidor.** El navegador manda las respuestas; el backend corre el mismo motor (extraído del HTML, no copiado a mano) y es lo que se guarda. Nunca confiar en la rutina que manda el navegador.
3. **Ninguna llave privada en el front.** Las llaves de Klaviyo, Airtable y Shopify van solo en variables de entorno del backend.
4. **Sin consentimiento no hay suscripción.** Se guarda la respuesta en Airtable, pero en Klaviyo solo se suscribe a correo si marcó la casilla de correo (`c2`), y a WhatsApp solo si marcó `c3` y dejó número.
5. **Los tests tienen que pasar siempre:** `node tests/run_tests.js quiz.html`. Son 26 perfiles con la rutina esperada y 20.000 perfiles al azar con invariantes. Si un cambio rompe un test, no se sube.
6. **Idioma:** todo lo que vea la clienta, en español de Perú, tal cual está en el HTML.

---

## 1 · Qué hay en este paquete

| Archivo | Qué es |
|---|---|
| `quiz.html` | Quiz V41, completo, autocontenido. Modo prelanzamiento por defecto; `?modo=lanzamiento` muestra la rutina con productos y precios. |
| `tests/engine.js` | Carga el motor directamente desde `quiz.html` en Node (sin copiarlo). Reutilízalo en el backend. |
| `tests/golden_profiles.json` | 26 perfiles con la rutina que les debe tocar (validados con Pao el 31-oct). |
| `tests/run_tests.js` | Test de regresión + invariantes. Sale con código 1 si falla. |
| `TRRIBU_Quiz_Auditoria_Activacion_V1_20261031.xlsx` | Auditoría: qué respuesta activa cada producto, tabla de puntajes, distribución, chequeos. |
| `TRRIBU_Klaviyo_Configuracion_V1_20261031.xlsx` | **Configuración completa de Klaviyo:** orden de pasos, listas, propiedades, evento, etiquetas, 37 segmentos (rutina, señales, color, canas, calor, cuero, edad, productos futuros, comportamiento), flujos, casos de prueba y cambios vs la Guía Agencia V2. Es la referencia para § 3. |

### Cómo funciona el motor (resumen; el detalle está en el HTML y en la auditoría)

- Toda rutina lleva **El Shampoo + El Acondicionador**.
- **La Mascarilla** entra con `m ≥ 6`; **La Crema (El Acondicionador Sin Enjuague)** entra con `c ≥ 6`.
- Si marca «Está bastante bien», recibe como máximo un producto extra: si eligió frizz, pelitos, textura, desenredo o brillo como prioridad, gana La Crema; si no, La Mascarilla.
- Códigos internos de rutina: `SA`, `SAM`, `SAC`, `SAMC`.
- Las preguntas 6 (grosor), 7 (cuero cabelludo), 9 (futuros) y 10 (edad) **no suman puntos**: solo segmentan. La 7 además muestra una línea fija en el resultado.

---

## 2 · Arquitectura recomendada

```
GitHub: trribu-quiz
├── public/quiz.html            ← el HTML V40 (sin el panel «Solo revisión» al publicar)
├── api/quiz-submit.js          ← endpoint serverless (Vercel)
├── lib/engine.js               ← carga el motor desde public/quiz.html
├── lib/klaviyo.js
├── lib/airtable.js
├── config/shopify-variants.json
├── tests/ (los de este paquete)
└── .github/workflows/test.yml  ← corre run_tests.js en cada push y PR
```

- **Hosting del backend:** Vercel, que ya usa Flama (`trribu-web-flama.vercel.app`). Variables de entorno en Vercel, no en el repo.
- **Dónde vive el quiz:** en la tienda Shopify de TRRIBÚ (`trribu.com`), como página propia (plantilla o sección del tema), llamando al endpoint de Vercel. **Decisión pendiente con Flama:** sección nativa del tema, o `quiz.html` en Vercel embebido. Ver § 8.
- **CORS:** el endpoint solo acepta `https://trribu.com`, `https://www.trribu.com` y el dominio de vista previa de Vercel.

### Flujo

1. La clienta responde las 10 preguntas → ve su resultado en pantalla (sin pedir correo antes; decisión vigente de la guía V32).
2. Si deja sus datos, el front hace `POST /api/quiz-submit` con `answers`, `nombre`, `email`, `whatsapp`, `consent`, `submission_id` y `modo`.
3. El backend:
   1. Valida los datos: correo, WhatsApp peruano `9XXXXXXXX`, que las respuestas sean valores conocidos y que cada pregunta tenga una cantidad permitida de respuestas. Agrega un campo trampa (honeypot) y un límite de envíos por IP.
   2. Recalcula motor, necesidades, tarjetas y rutina con `lib/engine.js`.
   3. Escribe en **Airtable** (siempre que haya consentimiento de datos, `c1`).
   4. Escribe en **Klaviyo**: perfil, evento y, solo si hay consentimiento, suscripción.
   5. Responde `{ ok: true }`. El front solo muestra «Tu solicitud fue recibida» cuando llega `ok: true` (ya está programado así).
4. Si Klaviyo falla, no se pierde el dato: queda en Airtable con `estado_klaviyo = error` y se reintenta con un cron.

---

## 3 · Klaviyo

> El detalle completo (listas, segmentos con sus condiciones, flujos y casos de prueba) está en `TRRIBU_Klaviyo_Configuracion_V1_20261031.xlsx`. Si algo de esta sección difiere del Excel, gana el Excel. La Guía Agencia V2 (29-oct) queda reemplazada en su sección 7.

- **API:** `https://a.klaviyo.com/api/` con los headers `Authorization: Klaviyo-API-Key <privada>` y `revision: <la vigente>`. Verifica en la documentación oficial la revisión y los endpoints actuales antes de programar.
- **Perfil** (crear o actualizar por correo): nombre, correo, teléfono `+51…` si lo dio, y estas propiedades personalizadas (los nombres ya existen en el payload del HTML):
  `quiz_version, quiz_modo, quiz_fecha, quiz_submission_id, quiz_senales, quiz_porosidad, quiz_tratamientos, quiz_calor, quiz_tipo, quiz_grosor, quiz_cuero, quiz_prioridades, quiz_futuros, quiz_edad, quiz_edad_min, quiz_canas, quiz_eje, quiz_buyer, quiz_routine_code, quiz_recomendacion, quiz_result_needs, quiz_score_mask, quiz_score_crema, quiz_panel, quiz_tags`
- **Evento:** métrica `Quiz completado`, con las mismas propiedades más `quiz_result_findings` (títulos de las tarjetas) y `modo` (`prelanzamiento` o `lanzamiento`).
- **Suscripción:**
  - Correo solo si `consent.correo === true`, a la lista **«TRRIBÚ · Lista de espera»** en prelanzamiento y **«TRRIBÚ · Quiz»** en lanzamiento.
  - WhatsApp: guardar `consent_whatsapp` como propiedad. Suscribir por canal solo si la cuenta de Klaviyo tiene WhatsApp habilitado para Perú; si no, dejar la propiedad para la persona de atención o para YaVendio. Ver § 8.
- **Segmentos sugeridos** (por propiedades o `quiz_tags`): `eje_reparacion`, `eje_proteccion`, `buyer_A`, `canas_cubre`, `canas_natural`, `poros_alta`, `futuro_*` (para productos futuros, como el sistema de cuero cabelludo de la Fase 2), `panel_si` (quiere participar en pruebas) y rutina `SA`, `SAM`, `SAC` o `SAMC`.
- **Flujos** (los crea el equipo en Klaviyo; Claude Code deja el evento y las propiedades listos):
  1. Bienvenida a la lista de espera (prelanzamiento).
  2. Día del lanzamiento, 16-nov: «Tu rutina», usando `quiz_recomendacion` y el enlace al carrito (§ 5).
  3. Lanzamiento: «Tu rutina por correo», enviado al dejar los datos.
- **Datos sensibles:** no crear propiedades de salud. La edad es opcional y va en tramos.

---

## 4 · Airtable

- **Base** «TRRIBÚ · Quiz», **tabla** «Respuestas»: una fila por `submission_id` (evita duplicados con upsert).
- **Campos:** `submission_id` (principal), `fecha`, `modo`, `quiz_version`, `nombre`, `email`, `whatsapp`, `consent_datos`, `consent_correo`, `consent_whatsapp`, `panel`, una columna por pregunta (P1 y P3, P8 y P9 como selección múltiple), `m`, `c`, `rutina` (SA, SAM, SAC o SAMC), `necesidades`, `tarjetas`, `estado_klaviyo` (ok, error o pendiente) y `error_klaviyo`.
- **Vistas útiles:** distribución por rutina, prioridad n.º 1, señales más marcadas y futuros. Con esto Pao ajusta puntajes con datos reales.
- **API:** `https://api.airtable.com/v0/{baseId}/{tabla}` con un Personal Access Token que solo tenga acceso a esa base. Límite: 5 solicitudes por segundo.

---

## 5 · Shopify (modo lanzamiento)

- **Productos y variantes** en `config/shopify-variants.json`:

```json
{
  "shampoo": { "variant_id": "PENDIENTE", "precio": 79 },
  "acond":   { "variant_id": "PENDIENTE", "precio": 79 },
  "masc":    { "variant_id": "PENDIENTE", "precio": 109 },
  "crema":   { "variant_id": "PENDIENTE", "precio": 89, "nombre_web": "La Crema (El Acondicionador Sin Enjuague)" },
  "regalo_masc_viaje":  { "variant_id": "PENDIENTE", "tamano": "100 ml" },
  "regalo_crema_viaje": { "variant_id": "PENDIENTE", "tamano": "50 ml" },
  "regalo_toalla":      { "variant_id": "PENDIENTE" }
}
```

  Los precios mostrados en el quiz deben leerse de Shopify (o de este config) para que nunca difieran de la tienda.
- **Botón «AGREGAR MI RUTINA AL CARRITO»** (hoy abre un aviso «PENDIENTE FLAMA»):
  - Si el quiz vive dentro del tema de Shopify, usar `POST /cart/add.js` con las variantes de la rutina y redirigir a `/cart`.
  - Si vive fuera, usar un permalink de carrito: `https://trribu.com/cart/{variant}:1,{variant}:1`.
  - Agregar `?attributes[quiz_submission_id]=…` o una nota en el carrito para unir pedido y quiz.
- **Regalos de lanzamiento** (regla de Pao, 28-oct):
  - 2 o 3 fórmulas: La Mascarilla 100 ml + La Crema 50 ml, en tamaño viaje.
  - Las 4 fórmulas: lo mismo + La Toalla.
  - El quiz ya muestra esa línea. **No se arma desde el quiz:** se configura en Shopify, con un descuento automático «compra X, lleva Y», una Shopify Function o una app de regalo por compra. Ver § 8.
- **Cambio de modo el 16-nov:** reemplazar el `?modo=lanzamiento` por una variable de configuración (`QUIZ_MODO=lanzamiento`) o un atributo en el HTML. Quitar los enlaces «ver prelanzamiento / ver lanzamiento» del pie.
- **Pedidos ↔ Klaviyo:** usar la integración nativa Shopify–Klaviyo, que une los pedidos al perfil por correo. No duplicar con código propio.

---

## 6 · Antes de publicar (lista de verificación)

- [ ] Quitar la sección `#qa-previews` («SOLO REVISIÓN · PERFILES DE PRUEBA») y la función `previewCase`.
- [ ] Quitar los enlaces de modo del pie.
- [ ] Enlazar la política de privacidad oficial: hoy hay un `alert('PENDIENTE…')`.
- [ ] `TRRIBU_ENDPOINT` apuntando al endpoint real, en el mismo origen o con CORS cerrado.
- [ ] Reemplazar las ilustraciones de la pregunta 5 por las fotos reales de texturas cuando estén aprobadas.
- [ ] `node tests/run_tests.js public/quiz.html` en verde y GitHub Actions en verde.
- [ ] Pruebas punta a punta con un correo de prueba: aparece en Airtable, en Klaviyo (perfil, evento y lista solo con consentimiento) y, en modo lanzamiento, el carrito se arma con las variantes correctas.
- [ ] Probar en móvil a 390 px y en escritorio, sin errores en la consola.
- [ ] Revisar con Pao el cumplimiento de la Ley 29733 de protección de datos personales (Perú): consentimiento expreso, finalidad, política publicada y registro del banco de datos ante la autoridad. Pao no tiene abogada: marcarlo como pendiente legal, no darlo por resuelto.

---

## 7 · Criterios de aceptación

1. Los 26 perfiles de `golden_profiles.json` dan la rutina esperada **en el servidor** y en el navegador.
2. Para el mismo `submission_id`, Airtable y Klaviyo guardan exactamente la misma rutina y las mismas necesidades.
3. Sin `c1`, no se guarda nada. Sin `c2`, el perfil no queda suscrito a correo. Sin `c3`, no queda suscrito a WhatsApp.
4. Ninguna llave aparece en el HTML, en el bundle ni en los logs del front.
5. Si Klaviyo se cae, la respuesta queda en Airtable con `estado_klaviyo = error` y se reintenta.
6. En modo lanzamiento, el carrito tiene exactamente los productos de la rutina, y los precios del quiz coinciden con Shopify.

---

## 8 · Decisiones pendientes (preguntar a Pao, no asumir)

| # | Decisión | Por qué importa |
|---|---|---|
| 1 | **Dónde vive el quiz:** sección nativa del tema de Shopify (Flama) o HTML en Vercel embebido | Cambia cómo se arma el carrito y el CORS |
| 2 | **Flujo de lanzamiento:** el 29-oct Pao pidió, con LolaVie como referencia, pedir el correo antes, pasar por una pantalla «calculando» y luego mostrar diagnóstico y rutina juntos. La guía V32 (31-oct) muestra el resultado antes del correo. Hoy el HTML muestra el resultado primero en los dos modos | Confirmar si el modo lanzamiento debe pedir el correo antes |
| 3 | **Cómo se entregan los regalos** en Shopify: descuento automático, Function o app | Sin esto, el quiz promete un regalo que la tienda no agrega |
| 4 | **Canal de WhatsApp:** Klaviyo WhatsApp, YaVendio o solo guardar el dato | Define si `c3` suscribe a algo |
| 5 | **URL de la política de privacidad** | Bloquea la publicación |
| 6 | **IDs de variantes** de los 4 productos, los 2 tamaños viaje y La Toalla | Bloquea el carrito |
| 7 | **Nombres de las listas en Klaviyo** (los de § 3 son una propuesta) | Que coincidan con los flujos que arme el equipo |

---

## 9 · Prompt para pegar en Claude Code

> Estás integrando el quiz de TRRIBÚ. Lee completo `TRRIBU_Quiz_Instrucciones_Claude_Code_V2_20261031.md` antes de tocar nada. `quiz.html` es la fuente de verdad: no cambies textos, preguntas ni puntajes. Crea el repo `trribu-quiz` con la estructura de la sección 2, un endpoint en Vercel que recalcule el motor en el servidor con `tests/engine.js` y que escriba en Airtable y en Klaviyo según las secciones 3 y 4, y deja preparado el carrito de Shopify según la sección 5. Configura GitHub Actions para que corra `node tests/run_tests.js public/quiz.html` en cada push. Las llaves van solo en variables de entorno. Cuando falte un dato de la sección 8, no lo inventes: anótalo en `PREGUNTAS_PARA_PAO.md` y sigue con lo demás. Al terminar, entrega: el repo, la lista de variables de entorno, el resultado de los tests y una prueba punta a punta con un correo de prueba.
