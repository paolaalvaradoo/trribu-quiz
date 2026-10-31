# Preguntas para Pao · Quiz TRRIBÚ V41

Datos que faltan para publicar. No se inventó ninguno: el código queda listo y espera el dato en una variable de entorno o en un archivo de configuración.

## Decisiones pendientes (§ 8 de las instrucciones)

| # | Pregunta | Qué está hecho mientras tanto | Dónde va la respuesta |
|---|---|---|---|
| 1 | **¿Dónde vive el quiz?** ¿Como sección nativa del tema de Shopify (Flama) o como `quiz.html` en Vercel, enlazado o embebido desde trribu.com? | Funciona de las dos formas. En Vercel abre en `/`. Si se embebe en Shopify, se define `window.TRRIBU_API_BASE` con la URL de Vercel y se agrega `https://trribu.com` a `ALLOWED_ORIGINS`. El carrito detecta solo si está dentro de la tienda (`/cart/add.js`) o fuera (permalink). | Respuesta de Pao y Flama |
| 2 | **Modo lanzamiento: ¿se pide el correo antes del resultado** (referencia LolaVie, 29-oct) o se mantiene el resultado primero (guía V32)? | Se mantiene el resultado primero, como en el HTML V41. | Si cambia, hace falta un HTML nuevo aprobado (no se tocó el copy) |
| 3 | **¿Cómo se entregan los regalos** de lanzamiento en Shopify: descuento automático «compra X, lleva Y», Shopify Function o app de regalo? | Nada: el quiz solo muestra la línea del regalo. El carrito agrega únicamente los productos de la rutina. | Configuración de Shopify |
| 4 | **Canal de WhatsApp:** ¿Klaviyo WhatsApp, YaVendio o solo guardar el dato? | Con c3 se guarda `consent_whatsapp`, el teléfono `+51…` en el perfil y, si existe, la persona entra a la lista «TRRIBÚ · WhatsApp». **No se suscribe a ningún canal.** | `KLAVIYO_LIST_WHATSAPP` y, si se elige Klaviyo WhatsApp, un cambio en `lib/klaviyo.js` |
| 5 | **URL de la política de privacidad.** Bloquea la publicación. | Mientras falte, el enlace sigue mostrando el aviso «PENDIENTE» del HTML. Cuando se defina, el quiz la enlaza solo. | `PRIVACY_POLICY_URL` |
| 6 | **IDs de variantes** de los 4 productos, los 2 tamaños de viaje y La Toalla. Bloquea el carrito. | Con «PENDIENTE», el botón muestra el aviso del HTML. Con los IDs, arma el carrito con exactamente la rutina y `quiz_submission_id` como atributo. | `config/shopify-variants.json` |
| 7 | **Nombres e IDs de las listas en Klaviyo.** El Excel propone: TRRIBÚ · Lista de espera, TRRIBÚ · Newsletter (nombre pendiente), TRRIBÚ · WhatsApp, TRRIBÚ · Panel de pruebas e Interno · Pruebas. | El código usa variables de entorno con los IDs. Las listas todavía no están creadas (paso 2 del Excel, a cargo de Flama). | `KLAVIYO_LIST_*` |

## Otras preguntas que salieron al integrar

8. **Lista y flujo que ya existen en Klaviyo.** En la cuenta TRRIBÚ ya hay una lista «Quiz prelanzamiento · Lista de espera» (`WQDPdj`, sin doble confirmación) y un flujo **activo**, «Quiz prelanzamiento · Bienvenida». Los armamos antes para el quiz V25 del tema de Shopify. El correo de ese flujo usa propiedades del V25 (`quiz_resultado_titular`, `quiz_porque_*`) que el V41 ya no envía, así que con el V41 saldría casi vacío. ¿Qué hacemos?
   - a) Renombrar `WQDPdj` a «TRRIBÚ · Lista de espera» y rehacer el correo con las propiedades V41 (`quiz_result_needs` y `quiz_result_findings`), según el F1 del Excel.
   - b) Crear listas nuevas y apagar ese flujo.
9. **Mensaje de éxito en modo lanzamiento.** El HTML muestra el mismo texto en los dos modos: «Tu solicitud fue recibida. Te escribiremos cuando tengamos novedades.» En lanzamiento, el botón dice «ENVIARME MI RUTINA». ¿Debería decir otra cosa, por ejemplo que la rutina llega por correo? No lo cambié: es copy.
10. **Correo 1 de F3 «Tu rutina» (lanzamiento).** El Excel lo marca como transaccional, para enviarlo aunque no marque c2. El HTML exige c2 o c3 para enviar el formulario («Para recibir novedades, autoriza al menos un canal»). Si alguien quiere su rutina por correo pero no marca c2, hoy no puede enviarla. ¿Se ajusta esa regla en lanzamiento?
11. **Frecuencia del reintento a Klaviyo.** En el plan Hobby de Vercel, el cron solo puede correr una vez al día; quedó a las 8:00 a. m. de Lima. Si Flama tiene el plan Pro, se puede pasar a cada 30 minutos. ¿Qué plan usa?
12. **Límite de envíos por IP.** Hoy son 5 envíos cada 10 minutos por IP y por instancia de Vercel. Para un límite global hace falta Vercel KV o Upstash. ¿Lo agregamos?
13. **Revisión de la API de Klaviyo.** Desde esta sesión no tuve acceso a developers.klaviyo.com. Quedó `2025-10-15`, que sí funciona en la cuenta. Flama debe confirmar la revisión vigente y fijarla en `KLAVIYO_REVISION`.
14. **Ley 29733 (protección de datos personales).** Está pendiente la revisión legal: consentimiento expreso, finalidad, política publicada y registro del banco de datos ante la autoridad. Pendiente legal, no resuelto.
15. **Fotos de la pregunta 5.** Siguen las ilustraciones provisionales. Hay que reemplazarlas cuando las fotos estén aprobadas.

## Lo que se cambió en `public/quiz.html` respecto del V41 original

Solo integración, nada de copy, preguntas ni puntajes (el original está en `docs/quiz_V41_original.html`):

- Se quitó el panel «SOLO REVISIÓN · PERFILES DE PRUEBA» y la función `previewCase` (§ 6).
- Se quitaron los enlaces «ver prelanzamiento / ver lanzamiento» del pie (§ 5).
- El modo ya no se lee de `?modo=`: lo fija `QUIZ_MODO` en Vercel, a través de `/api/quiz-config` (§ 5).
- `TRRIBU_ENDPOINT` apunta a `/api/quiz-submit`.
- El envío agrega `answers`, `submission_id`, `modo`, `consent.panel` y un campo trampa invisible (`website`).
- El botón «AGREGAR MI RUTINA AL CARRITO» llama a `agregarAlCarrito()`. Si faltan variantes, muestra el mismo aviso «PENDIENTE FLAMA».
- Los precios se leen de `config/shopify-variants.json`. Hoy son iguales a los del HTML.
- Si existe `PRIVACY_POLICY_URL`, el enlace de privacidad la usa.
