# Preguntas para Pao · Quiz TRRIBÚ V41

Datos que faltan para publicar. No se inventó ninguno: el código queda listo y espera el dato en una variable de entorno o en un archivo de configuración.

## Decisiones pendientes (§ 8 de las instrucciones)

| # | Pregunta | Qué está hecho mientras tanto | Dónde va la respuesta |
|---|---|---|---|
| 1 | **¿Dónde vive el quiz?** ¿Como sección nativa del tema de Shopify (Flama) o como `quiz.html` en Vercel, enlazado o embebido desde trribu.com? | Funciona de las dos formas. En Vercel abre en `/`. Si se embebe en Shopify, se define `window.TRRIBU_API_BASE` con la URL de Vercel y se agrega `https://trribu.com` a `ALLOWED_ORIGINS`. El carrito detecta solo si está dentro de la tienda (`/cart/add.js`) o fuera (permalink). | Respuesta de Pao y Flama |
| 2 | **Modo lanzamiento: ¿se pide el correo antes del resultado** (referencia LolaVie, 29-oct) o se mantiene el resultado primero (guía V32)? | **Decidido por Pao el 31-oct: sí, cuando la persona llega directo al quiz** (ver «Dos caminos de entrada» abajo). Hoy el HTML V41 sigue mostrando el resultado primero. | Flama: diseño y copy de la pantalla del correo; HTML nuevo aprobado por Pao |
| 3 | **¿Cómo se entregan los regalos** de lanzamiento en Shopify: descuento automático «compra X, lleva Y», Shopify Function o app de regalo? | Nada: el quiz solo muestra la línea del regalo. El carrito agrega únicamente los productos de la rutina. | Configuración de Shopify |
| 4 | **Canal de WhatsApp:** ¿Klaviyo WhatsApp, YaVendio o solo guardar el dato? | Con c3 se guarda `consent_whatsapp`, el teléfono `+51…` en el perfil y, si existe, la persona entra a la lista «TRRIBÚ · WhatsApp». **No se suscribe a ningún canal.** | `KLAVIYO_LIST_WHATSAPP` y, si se elige Klaviyo WhatsApp, un cambio en `lib/klaviyo.js` |
| 5 | **URL de la política de privacidad.** Bloquea la publicación. | Mientras falte, el enlace sigue mostrando el aviso «PENDIENTE» del HTML. Cuando se defina, el quiz la enlaza solo. | `PRIVACY_POLICY_URL` |
| 6 | **IDs de variantes** de los 4 productos, los 2 tamaños de viaje y La Toalla. Bloquea el carrito. | Con «PENDIENTE», el botón muestra el aviso del HTML. Con los IDs, arma el carrito con exactamente la rutina y `quiz_submission_id` como atributo. | `config/shopify-variants.json` |
| 7 | ✅ **Resuelto 31-oct:** listas creadas con los nombres del Excel (IDs en `docs/KLAVIYO.md`). Queda confirmar el nombre final de «Newsletter». **Nombres e IDs de las listas en Klaviyo.** El Excel propone: TRRIBÚ · Lista de espera, TRRIBÚ · Newsletter (nombre pendiente), TRRIBÚ · WhatsApp, TRRIBÚ · Panel de pruebas e Interno · Pruebas. | El código usa variables de entorno con los IDs. Las listas todavía no están creadas (paso 2 del Excel, a cargo de Flama). | `KLAVIYO_LIST_*` |

## Para Flama · Dos caminos de entrada al quiz (decisión de Pao, 31-oct)

**Camino 1. Inscrita en la lista de espera.**
- Recorrido: landing (la llamada) → lista de espera → correo «Queremos conocerte» → quiz.
- Al terminar, ve su resultado y además lo recibe por correo (flujo F1b).
- Ya funciona; Pao lo probó el 31-oct.

**Camino 2. Llega directo al quiz.**
- Entra por el link «Conoce tu pelo» en la bio de redes o por anuncios que llevan al quiz, sin pasar por la lista de espera.
- Al terminar la última pregunta, **no ve el resultado de inmediato**. Primero aparece la pantalla del correo, con el mensaje «Te enviamos tu resultado por correo».
  - Pide nombre, correo y los consentimientos c1 a c4, igual que hoy.
  - Al enviarla, se muestra el resultado en pantalla y llega por correo (flujo F1, rama «Ya estás en la tribu»).
- Debajo, en letra tenue, va la opción **«Prefiero verlo en pantalla»**, que muestra el resultado sin pedir el correo.
  - Esas personas no quedan en Klaviyo; solo cuentan como respuesta anónima.
  - Pendiente: Pao debe confirmar que acepta esa pérdida.

**Cómo saber por qué camino llegó.**
- Un parámetro en el link, por ejemplo `?origen=lista` en los correos y `?origen=directo` en la bio y en los anuncios, más las UTM.
- Sin parámetro, se asume el camino 2.
- El origen se guarda en el perfil como `quiz_origen`, para medir cada camino.

**Aplica a las dos fases.** También se pueden pautar anuncios al quiz en el prelanzamiento.

**Copy pendiente de Pao.** El texto final de la pantalla del correo y el de la opción tenue los aprueba Pao. No se cambia el copy de `quiz.html` sin un HTML aprobado.

## Otras preguntas que salieron al integrar

8. ✅ **Resuelto 31-oct:** `WQDPdj` se renombró a «TRRIBÚ · Lista de espera»; el flujo V25 se apagó y lo reemplaza F1 (`STrWsE`), cuyo correo 1 muestra el resultado V41 (y el V25 para quien entre desde el quiz anterior). **Pendiente tuyo:** completar los textos marcados «[PAO: …]» de los correos 2 y 3 de F1 y pasarlos de «manual» a «activo». El correo 3 trae una duda: el Excel pide hablar de TRRIBOND el día 7, pero la guía de marca dice «cero TRRIBOND» antes del lanzamiento.
9. **Mensaje de éxito en modo lanzamiento.** El HTML muestra el mismo texto en los dos modos: «Tu solicitud fue recibida. Te escribiremos cuando tengamos novedades.» En lanzamiento, el botón dice «ENVIARME MI RUTINA». ¿Debería decir otra cosa, por ejemplo que la rutina llega por correo? No lo cambié: es copy.
10. **Correo 1 de F3 «Tu rutina» (lanzamiento).** El Excel lo marca como transaccional, para enviarlo aunque no marque c2. El HTML exige c2 o c3 para enviar el formulario («Para recibir novedades, autoriza al menos un canal»). Si alguien quiere su rutina por correo pero no marca c2, hoy no puede enviarla. ¿Se ajusta esa regla en lanzamiento?
11. **Frecuencia del reintento a Klaviyo.** En el plan Hobby de Vercel, el cron solo puede correr una vez al día; quedó a las 8:00 a. m. de Lima. Si Flama tiene el plan Pro, se puede pasar a cada 30 minutos. ¿Qué plan usa?
12. **Límite de envíos por IP.** Hoy son 5 envíos cada 10 minutos por IP y por instancia de Vercel. Para un límite global hace falta Vercel KV o Upstash. ¿Lo agregamos?
13. **Revisión de la API de Klaviyo.** Desde esta sesión no tuve acceso a developers.klaviyo.com. Quedó `2025-10-15`, que sí funciona en la cuenta. Flama debe confirmar la revisión vigente y fijarla en `KLAVIYO_REVISION`.
14. **Ley 29733 (protección de datos personales).** Está pendiente la revisión legal: consentimiento expreso, finalidad, política publicada y registro del banco de datos ante la autoridad. Pendiente legal, no resuelto.
15. **Fotos de la pregunta 5.** Siguen las ilustraciones provisionales. Hay que reemplazarlas cuando las fotos estén aprobadas.

## Lo que se cambió en `public/quiz.html` respecto del V41 original

**Cambios de copy aprobados por Pao el 31-oct.** Son la única excepción a «no tocar copy». Los puntajes no cambian; lo verifican los tests.

- **Caída.**
  - La opción de la pregunta 1, `quiebre`, pasa de «Veo hebras cortas o partidas» a **«Se me cae más pelo» · «Lo veo en el cepillo, la almohada o la ducha»**.
  - La tarjeta del resultado pasa a **«Notas que se te cae más pelo»**. Explica la diferencia entre quiebre (hebra corta, sin la bolita blanca) y pelo completo con la bolita de la raíz y en cantidad, en cuyo caso deriva al dermatólogo.
  - La tarjeta «Te preocupa el pelo que ves en el cepillo» usa el mismo criterio.
- **«Otro, ¿cuál?» en las preguntas 1 (señales), 3 (tratamientos) y 9 (futuros).**
  - Al marcarlo, aparece un campo de hasta 80 caracteres.
  - Va siempre al final, antes de la opción excluyente.
  - No suma puntos.
  - Se guarda en Klaviyo (`quiz_otro_senales`, `quiz_otro_tratamientos`, `quiz_otro_futuros`) y en Airtable (`p1_otro`, `p3_otro`, `p9_otro`).
  - Si en la pregunta 1 marca solo «Otro», la tarjeta es «Nos contaste algo más», en lugar de «Tu pelo está bien hoy».
- **Coherencia del resultado** (auditoría del 31-oct, `scripts/auditoria.js`):
  - **Etiqueta nueva «Control del frizz y del calor»** (`frizz_calor`). Sale cuando hay frizz y plancha o calor diario, y la rutina trae La Crema (El Acondicionador Sin Enjuague).
  - **«Cuidado ante el calor»** ahora sale también con plancha, no solo con calor diario.
  - **Tarjeta del calor:** si la rutina trae La Mascarilla y La Crema (El Acondicionador Sin Enjuague), dice «necesita reparación y un cuidado que lo ayude a proteger antes de usarlo».
  - **Cada producto extra de la rutina queda explicado** arriba y en una tarjeta, sin mover la prioridad n.º 1.
  - **Tarjeta de porosidad:** solo menciona reparación si la rutina trae La Mascarilla.
  - **Rutinas y puntajes:** idénticos a la V41 original (test con 5.000 casos).
- **Para revisar cada semana:** leer los textos de «Otro». Lo que se repita, como «keratina solo para brillo», se convierte en una opción fija en la versión siguiente.

Solo integración, nada de copy, preguntas ni puntajes (el original está en `docs/quiz_V41_original.html`):

- Se quitó el panel «SOLO REVISIÓN · PERFILES DE PRUEBA» y la función `previewCase` (§ 6).
- Se quitaron los enlaces «ver prelanzamiento / ver lanzamiento» del pie (§ 5).
- El modo ya no se lee de `?modo=`: lo fija `QUIZ_MODO` en Vercel, a través de `/api/quiz-config` (§ 5).
- `TRRIBU_ENDPOINT` apunta a `/api/quiz-submit`.
- El envío agrega `answers`, `submission_id`, `modo`, `consent.panel` y un campo trampa invisible (`website`).
- El botón «AGREGAR MI RUTINA AL CARRITO» llama a `agregarAlCarrito()`. Si faltan variantes, muestra el mismo aviso «PENDIENTE FLAMA».
- Los precios se leen de `config/shopify-variants.json`. Hoy son iguales a los del HTML.
- Si existe `PRIVACY_POLICY_URL`, el enlace de privacidad la usa.
