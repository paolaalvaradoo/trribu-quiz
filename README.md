# trribu-quiz

**Para Flama: empezar por `docs/PAQUETE_FLAMA.md`.**

Quiz TRRIBÚ **V41** con el motor calculado en el servidor (Vercel), guardado en **Airtable**, sincronizado con **Klaviyo** y carrito de **Shopify** preparado.
Fuente de verdad del copy, las preguntas y los puntajes: `public/quiz.html`. Instrucciones: `docs/TRRIBU_Quiz_Instrucciones_Claude_Code_V2_20261031.md`. Klaviyo: `docs/TRRIBU_Klaviyo_Configuracion_V1_20261031.xlsx`.

```
public/quiz.html            quiz V41 (sin panel de revisión), llama a /api/quiz-submit
api/quiz-submit.js          POST: valida → recalcula el motor → Airtable → Klaviyo → { ok: true }
api/quiz-config.js          GET: modo, precios, variantes y URL de privacidad (sin secretos)
api/retry-klaviyo.js        cron diario: reintenta las filas con estado_klaviyo = error
lib/engine.js               carga el motor DESDE public/quiz.html (no está copiado)
lib/submission.js           validación de respuestas y propiedades quiz_*
lib/klaviyo.js · lib/airtable.js · lib/http.js · lib/config.js · lib/process.js
config/shopify-variants.json
tests/                      run_tests.js (26 perfiles + 20.000 al azar) y api.test.js
scripts/e2e-local.js        punta a punta con navegador real y servicios simulados
scripts/e2e-remote.js       punta a punta contra el despliegue real
```

## Cómo funciona

1. La clienta responde, ve su resultado y, si deja sus datos, el navegador envía `answers`, `nombre`, `email`, `whatsapp`, `consent`, `submission_id` y `modo`.
2. El servidor valida:
   - correo;
   - WhatsApp `9XXXXXXXX`;
   - que cada respuesta exista en el HTML;
   - la cantidad de respuestas por pregunta, opciones excluyentes y opciones condicionales;
   - el campo trampa y un límite por IP;
   - CORS cerrado.
3. Recalcula la rutina, las necesidades, las tarjetas y las etiquetas con el motor del HTML. **Ignora lo que diga el navegador.** El modo lo manda `QUIZ_MODO`.
4. **Airtable** se escribe siempre que haya c1; es upsert por `submission_id`.
5. **Klaviyo:** perfil (`profile-import`) y evento «Quiz completado» con `unique_id = submission_id`. Además:
   - c2 → suscripción a correo en la Lista de espera (prelanzamiento) o en Newsletter (lanzamiento);
   - c3 → lista WhatsApp, sin suscripción al canal;
   - c4 → lista Panel.
6. Si Klaviyo falla, la fila queda con `estado_klaviyo = error` y el cron la reintenta con el mismo motor.

## Variables de entorno (Vercel › Settings › Environment Variables)

Plantilla en `.env.example`. **Ninguna llave va en el repo ni en el HTML.**

| Variable | Obligatoria | Qué es |
|---|---|---|
| `QUIZ_MODO` | sí | `prelanzamiento` (hoy) o `lanzamiento` (desde el 1-dic, fecha oficial de lanzamiento) |
| `KLAVIYO_PRIVATE_API_KEY` | sí | Llave privada con permisos: Profiles, Events, Subscriptions y Lists (escritura) |
| `KLAVIYO_REVISION` | sí | Revisión de la API; verificar la vigente (hoy `2025-10-15`) |
| `KLAVIYO_LIST_ESPERA` | sí (prelanzamiento) | ID de «TRRIBÚ · Lista de espera» |
| `KLAVIYO_LIST_NEWSLETTER` | sí (lanzamiento) | ID de «TRRIBÚ · Newsletter» |
| `KLAVIYO_LIST_WHATSAPP` | no | ID de «TRRIBÚ · WhatsApp»; sin ella, c3 solo se guarda como propiedad |
| `KLAVIYO_LIST_PANEL` | no | ID de «TRRIBÚ · Panel de pruebas» |
| `AIRTABLE_TOKEN` | sí | Personal Access Token **solo** para la base «TRRIBÚ · Quiz» (`data.records:read`, `data.records:write`) |
| `AIRTABLE_BASE_ID` | sí | `app…` |
| `AIRTABLE_TABLE` | no | Por defecto `Respuestas` |
| `CRON_SECRET` | sí | Texto largo al azar; protege `/api/retry-klaviyo` |
| `ALLOWED_ORIGINS` | no | Por defecto `https://trribu.com,https://www.trribu.com` (los dominios de Vercel se agregan solos) |
| `SHOPIFY_STORE_URL` | no | Por defecto `https://trribu.com` |
| `PRIVACY_POLICY_URL` | sí para publicar | Pendiente |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | no | Por defecto 5 envíos cada 10 min por IP |

## Airtable: base «TRRIBÚ · Quiz», tabla «Respuestas»

Se crea a mano una vez. El campo principal es `submission_id`. Con `typecast`, las opciones de las selecciones se crean solas.

| Campo | Tipo |
|---|---|
| `submission_id` | texto (principal) |
| `fecha` | fecha y hora |
| `modo`, `quiz_version`, `rutina`, `estado_klaviyo` | selección simple |
| `nombre`, `whatsapp` | texto |
| `email` | correo |
| `consent_datos`, `consent_correo`, `consent_whatsapp`, `panel` | casilla |
| `p1_senales`, `p3_tratamientos`, `p8_prioridades`, `p9_futuros`, `necesidades` | selección múltiple |
| `p2_porosidad`, `p4_calor`, `p5_tipo`, `p6_grosor`, `p7_cuero`, `p8_prioridad_1`, `p10_edad` | selección simple |
| `m`, `c` | número |
| `tarjetas`, `error_klaviyo` | texto largo |
| `origen` | selección simple: `lista` (vino de los correos) o `directo` (bio, anuncios) |
| `p1_otro`, `p3_otro`, `p9_otro` | texto (lo que escribió en «Otro», máx. 80 caracteres) |

`p8_prioridad_1` es un campo extra a lo pedido en la § 4. Airtable no puede agrupar por el primer elemento de una selección múltiple, y sin este campo no se podría armar la vista «prioridad n.º 1».

Vistas sugeridas, agrupando por:
- `rutina`;
- `p8_prioridad_1`;
- `p1_senales`;
- `p9_futuros`.

Y un filtro `estado_klaviyo = error`.

## Tests

```bash
npm test                 # node tests/run_tests.js public/quiz.html && node --test tests/api.test.js
npm run e2e              # requiere Playwright y Chromium
```

GitHub Actions (`.github/workflows/test.yml`) corre los dos en cada push y en cada PR.

## Desplegar en Vercel

1. En Vercel, importar el repo `trribu-quiz` (framework «Other»). El `vercel.json` ya define la carpeta `public`, las funciones y el cron.
2. Cargar las variables de entorno de arriba.
3. Desplegar y correr la prueba real con un correo que esté en la lista «Interno · Pruebas»:
   `E2E_URL=https://… E2E_EMAIL=… AIRTABLE_TOKEN=… AIRTABLE_BASE_ID=… KLAVIYO_PRIVATE_API_KEY=… node scripts/e2e-remote.js`

## Pendientes

Ver `PREGUNTAS_PARA_PAO.md`.
