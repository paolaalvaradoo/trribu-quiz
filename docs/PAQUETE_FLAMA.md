# TRRIBÚ · Paquete para Flama · Quiz, landing y Klaviyo

**Versión:** V1 · 31-oct-2026
**De:** Pao (TRRIBÚ)
**Para:** Flama

Este documento reúne todo lo que se construyó y probó para el embudo de prelanzamiento:

> anuncio o reel → landing («la llamada») → lista de espera → correos → quiz → resultado por correo → segmentos en Klaviyo

Pao probó el recorrido completo con correos reales el 31-oct. Todo lo que aparece como «hecho» funciona hoy en la cuenta de Klaviyo de TRRIBÚ y en la tienda de prueba.

---

## 1. Qué hay que hacer, en orden

| # | Tarea | Dónde está todo | Estado |
|---|---|---|---|
| 1 | Desplegar el endpoint del quiz en Vercel | Repo `paolaalvaradoo/trribu-quiz`, sección 4 | Código listo y probado, falta desplegar |
| 2 | Crear la base de Airtable «TRRIBÚ · Quiz» | Sección 5 | Falta crearla |
| 3 | Cargar las variables de entorno en Vercel | Sección 4 | Faltan las llaves |
| 4 | Decidir dónde vive el quiz definitivo (Shopify o Vercel) y su URL | Sección 9, decisión 1 | Pendiente con Pao |
| 5 | Cambiar el link del quiz en dos correos de Klaviyo a la URL definitiva | Sección 6.4 | Hoy apuntan a la página de prueba |
| 6 | Integrar el formulario de la landing V14 con Klaviyo, con los ajustes legales | Sección 7 | Hay una versión de prueba que funciona |
| 7 | Cargar los IDs de variantes de Shopify para el carrito | Sección 9, decisión 6 | Pendiente |
| 8 | Construir los flujos de lanzamiento F2 a F7 | Excel de Klaviyo | Pendiente (lanzamiento 1-dic) |
| 9 | Correr la prueba real (`scripts/e2e-remote.js`) con un correo de Interno · Pruebas | Sección 8 | Después del paso 3 |

**Fecha oficial de lanzamiento: 1 de diciembre de 2026** (confirmada por Pao el 1-nov). Los documentos anteriores que dicen 16-nov están desactualizados.

**Reglas que no se negocian**
- **Copy, preguntas y puntajes.** `public/quiz.html` es la fuente de verdad: no se cambian textos, preguntas ni puntajes sin aprobación de Pao.
- **Llaves.** Van solo en variables de entorno. Nunca en el HTML ni en el repo.
- **Consentimiento.** Sin consentimiento no hay suscripción: c1 datos (obligatorio), c2 correo, c3 WhatsApp, c4 panel de pruebas.
- **Nombre del producto.** Cada vez que se nombra La Crema, va así: **«La Crema (El Acondicionador Sin Enjuague)»**.

---

## 2. Qué se entrega

| Pieza | Dónde | Qué es |
|---|---|---|
| Quiz V41 integrado | `trribu-quiz/public/quiz.html` | Quiz final con todos los cambios aprobados el 31-oct (sección 3) |
| Endpoint | `trribu-quiz/api/`, `trribu-quiz/lib/` | Valida, recalcula el resultado en el servidor y escribe en Airtable y Klaviyo |
| Tests | `trribu-quiz/tests/`, `trribu-quiz/scripts/` | 22 tests, auditoría de coherencia y prueba de punta a punta en navegador; corren en GitHub Actions |
| Documentación de Klaviyo | `trribu-quiz/docs/KLAVIYO.md` | IDs de listas, métricas, 45 segmentos y flujos |
| Pendientes | `trribu-quiz/PREGUNTAS_PARA_PAO.md` | Decisiones abiertas y todo lo que cambió respecto del V41 original |
| Original V41 | `trribu-quiz/docs/quiz_V41_original.html` | Para comparar |
| Excel de Klaviyo | `trribu-quiz/docs/TRRIBU_Klaviyo_Configuracion_V1_20261031.xlsx` | Configuración de referencia |
| Página de prueba del quiz | `trribu-web/templates/page.quiz-prueba.liquid` | El quiz dentro de Shopify, enviando directo a Klaviyo (solo para pruebas) |
| Página de prueba de la landing | `trribu-web/templates/page.landing-prueba.liquid` | Landing V14 de Flama con el formulario conectado a Klaviyo (solo para pruebas) |

**Páginas de prueba en la tienda** (protegidas con contraseña y fuera de Google):
- https://cjatu3-cq.myshopify.com/pages/landing-prueba
- https://cjatu3-cq.myshopify.com/pages/quiz-prueba
- https://cjatu3-cq.myshopify.com/pages/quiz-prueba?origen=lista

Las páginas de prueba usan la API pública de Klaviyo desde el navegador. **En producción el quiz debe pasar por el endpoint de Vercel**: recalcula el resultado en el servidor, no confía en lo que mande el navegador y guarda en Airtable.

---

## 3. El quiz

### 3.1 Preguntas

| # | id | Pregunta | Tipo |
|---|---|---|---|
| 1 | `signos` | ¿Cómo está tu pelo en este momento? | Varias, más «Otro» con texto |
| 2 | `porosidad` | Si solo usaras shampoo, ¿cómo quedaría tu pelo? | Una |
| 3 | `tratamientos` | ¿Llevas color o algún tratamiento? | Varias, más «Otro» con texto |
| 4 | `calor` | ¿Cómo secas y peinas tu pelo? | Una |
| 5 | `tipo` | ¿Cómo es tu pelo de forma natural? | Una, con imagen |
| 6 | `grosor` | ¿Cómo sientes el grosor de una hebra? | Una, con imagen |
| 7 | `cuero` | Al día siguiente de lavarlo, ¿cómo sientes tu cuero cabelludo? | Una |
| 8 | `prio` | ¿Qué te gustaría trabajar primero? | Hasta 3 |
| 9 | `futuros` | ¿Algo de esto te está pasando también? | Varias, más «Otro» con texto; no cambia la rutina |
| 10 | `edad` | ¿En qué rango de edad estás? | Opcional |

### 3.2 Puntajes: qué decide la rutina

Todas las rutinas llevan **El Shampoo y El Acondicionador** (SA).

El motor suma dos puntajes:
- **m**, para La Mascarilla;
- **c**, para La Crema (El Acondicionador Sin Enjuague).

Cada producto entra si su puntaje llega a **6**.

**m · La Mascarilla (reparación)**

| Respuesta | Puntos |
|---|---|
| «Se me cae más pelo» (P1) | +6 |
| Mechas, tinte en todo el largo, tinte en raíces o alisado/keratina (P3), **cada uno** | +6 |
| Seco en todo el largo (P1) | +6 |
| Porosidad alta (P2) | +6 |
| Calor casi a diario / plancha (P4) | +3 / +2 |
| Prioridad «Hidratación y suavidad» o «Menos pelo en el cepillo» (P8), cada una | +3 |
| Puntas secas u opaco (P1), cada uno | +2 |

**c · La Crema (El Acondicionador Sin Enjuague)**

| Respuesta | Puntos |
|---|---|
| Prioridad frizz, pelitos, textura natural, desenredo o brillo (P8), una o más | +6 |
| Frizz, otra textura, difícil de desenredar u opaco (P1), **cada uno** | +6 |
| Plancha o calor casi a diario (P4) | +6 |
| Pelo rizado o crespo / ondulado (P5) | +6 / +2 |
| Porosidad alta (P2) | +3 |
| Prioridad canas (P8) | +3 |
| «Se me cae más pelo» (P1) / prioridad «Menos pelo en el cepillo» (P8) | +3 / +3 |

**Regla especial.** Si marca **«Está bastante bien»**, lleva como máximo un producto extra:
- si eligió frizz, pelitos, textura, desenredo o brillo como prioridad, lleva La Crema (El Acondicionador Sin Enjuague);
- si no, lleva La Mascarilla, como prevención.

**Rutinas posibles:** `SA`, `SAM`, `SAC` y `SAMC`.

**«Otro» y la pregunta 9 no suman puntos.** «Secadora, ocasional» tampoco cuenta como calor frecuente; lo decidió Pao el 31-oct.

### 3.3 Lo que ve la clienta en el resultado

- **Arriba, hasta 3 necesidades.** Por ejemplo: «Reparación · Hidratación · Control del frizz y del calor».
- **«Esto es lo que identificamos»: hasta 3 tarjetas**, cada una con título y explicación. La primera es su prioridad n.º 1.
- **Reglas de coherencia** (auditoría del 31-oct):
  - Cada producto extra de su rutina queda explicado arriba y en una tarjeta.
  - Ningún texto pide algo que la rutina no trae.
  - Si usa plancha o calor diario y su rutina trae La Crema (El Acondicionador Sin Enjuague), se habla de proteger el pelo del calor.
  - Su prioridad n.º 1 siempre aparece.
- **Al pie, siempre, el aviso del dermatólogo.**

`scripts/auditoria.js` revisa estas reglas en miles de combinaciones de respuestas y corre en cada push. **Si cambian textos o reglas del resultado, tiene que seguir en verde.**

### 3.4 Cambios aprobados por Pao el 31-oct respecto del V41

1. **Caída.**
   - La opción de la P1 dice **«Se me cae más pelo» · «Lo veo en el cepillo, la almohada o la ducha»**.
   - La tarjeta «Notas que se te cae más pelo» explica la diferencia entre el quiebre (hebra corta, sin la bolita blanca) y el pelo completo con la bolita de la raíz y en cantidad, que deriva al dermatólogo.
2. **«Otro» con texto** en P1, P3 y P9.
   - Admite hasta 80 caracteres y no suma puntos.
   - Se guarda en Klaviyo y en Airtable para leerlo cada semana.
3. **Correo antes del resultado.** Al terminar, primero se pide el correo y después se muestra el resultado:
   - **viene de los correos (`?origen=lista`):** «¿A qué correo te enviamos tu resultado?»;
   - **llega directo (bio o anuncios, sin parámetro):** «Te enviamos tu resultado por correo»;
   - **en ambos casos:** botón **ENVIARME MI RESULTADO** y, en letra tenue, **«Prefiero verlo en pantalla»**, que muestra el resultado sin pedir correo y no registra a la persona.
4. **«Control del frizz y del calor»**, y «Cuidado ante el calor» también con plancha.
5. **Tarjeta del calor:** cuando la rutina trae La Crema (El Acondicionador Sin Enjuague), habla de proteger.
6. **Cada hallazgo viaja a Klaviyo con su explicación**, para que el correo muestre lo mismo que la pantalla.

**Las rutinas y los puntajes son idénticos a la V41 original.** Un test lo verifica en cada push con 5.000 casos.

---

## 4. Endpoint en Vercel (repo `trribu-quiz`)

**Qué hace**
1. El navegador envía las respuestas, el contacto, los consentimientos, el `origen` y el texto de «Otro».
2. El servidor:
   - valida correo, WhatsApp `9XXXXXXXX`, que cada respuesta exista, el campo trampa, CORS y el límite por IP;
   - **recalcula el resultado con el mismo motor de `quiz.html`**, cargado desde el HTML: no hay una copia del motor que pueda desincronizarse.
3. Escribe primero en **Airtable** (upsert por `submission_id`) y después en **Klaviyo**:
   - crea o actualiza el perfil;
   - registra el evento «Quiz completado» con `unique_id = submission_id`;
   - según los consentimientos, lo agrega a las listas.
4. Si Klaviyo falla, la fila queda con `estado_klaviyo = error` y un **cron diario** la reintenta.

**Despliegue**
1. En Vercel, importa el repo con el framework «Other». `vercel.json` ya trae la carpeta pública, las funciones y el cron.
2. Carga las variables de la tabla siguiente.
3. Despliega y corre la prueba real (sección 8).

| Variable | Valor |
|---|---|
| `QUIZ_MODO` | `prelanzamiento`; pasa a `lanzamiento` el 1-dic |
| `KLAVIYO_PRIVATE_API_KEY` | Llave privada con permisos de escritura en Profiles, Events, Subscriptions y Lists |
| `KLAVIYO_REVISION` | `2025-10-15` (confirmar la vigente) |
| `KLAVIYO_LIST_ESPERA` | `WQDPdj` |
| `KLAVIYO_LIST_NEWSLETTER` | `QX4yn6` |
| `KLAVIYO_LIST_WHATSAPP` | `VHjagU` |
| `KLAVIYO_LIST_PANEL` | `WSHZaL` |
| `AIRTABLE_TOKEN` | Token solo para la base «TRRIBÚ · Quiz» (records:read y records:write) |
| `AIRTABLE_BASE_ID` | `app…` |
| `AIRTABLE_TABLE` | `Respuestas` |
| `CRON_SECRET` | Texto largo al azar |
| `ALLOWED_ORIGINS` | `https://trribu.com,https://www.trribu.com`, más el dominio donde viva el quiz |
| `SHOPIFY_STORE_URL` | `https://trribu.com` |
| `PRIVACY_POLICY_URL` | **Pendiente**: bloquea la publicación |

**Si el quiz se embebe en Shopify**, define `window.TRRIBU_API_BASE` con la URL de Vercel. El carrito detecta solo si está dentro de la tienda o fuera.

---

## 5. Airtable · base «TRRIBÚ · Quiz», tabla «Respuestas»

Se crea a mano una vez. El campo principal es `submission_id`. Con `typecast`, las opciones de los campos de selección se crean solas.

| Campo | Tipo |
|---|---|
| `submission_id` | texto (campo principal) |
| `fecha` | fecha y hora |
| `modo`, `quiz_version`, `rutina`, `estado_klaviyo`, `origen` | selección simple |
| `nombre`, `whatsapp` | texto |
| `email` | correo |
| `consent_datos`, `consent_correo`, `consent_whatsapp`, `panel` | casilla |
| `p1_senales`, `p3_tratamientos`, `p8_prioridades`, `p9_futuros`, `necesidades` | selección múltiple |
| `p2_porosidad`, `p4_calor`, `p5_tipo`, `p6_grosor`, `p7_cuero`, `p8_prioridad_1`, `p10_edad` | selección simple |
| `m`, `c` | número |
| `tarjetas`, `error_klaviyo` | texto largo |
| `p1_otro`, `p3_otro`, `p9_otro` | texto |

**Vistas sugeridas**
- Agrupar por `rutina`, por `p8_prioridad_1`, por `p1_senales`, por `p9_futuros` y por `origen`.
- Filtrar por `estado_klaviyo = error`.
- Mostrar las respuestas con «Otro», para la lectura semanal.

---

## 6. Klaviyo (cuenta TRRIBÚ, `YqAKEF`)

Todos los IDs están en `docs/KLAVIYO.md`.

**Envío.** El dominio `send.trribu.com` está verificado y activo. DMARC de `trribu.com`: `p=quarantine`.

### 6.1 Listas

| Lista | ID | Para qué |
|---|---|---|
| TRRIBÚ · Lista de espera | `WQDPdj` | Prelanzamiento, con c2. Confirmación simple (sin doble opt-in) |
| TRRIBÚ · Newsletter | `QX4yn6` | Lanzamiento, con c2 |
| TRRIBÚ · WhatsApp | `VHjagU` | c3. Solo pertenencia a la lista: no suscribe a ningún canal |
| TRRIBÚ · Panel de pruebas | `WSHZaL` | c4 |
| Interno · Pruebas | `VCFTVw` | Excluida de todos los segmentos |

### 6.2 Flujos activos (prelanzamiento)

| Flujo | ID | Qué hace |
|---|---|---|
| F1 · Bienvenida lista de espera | `VC7pKB` | Al entrar a la lista: **si hizo el quiz** → «Ya estás en la tribu» con su resultado. **Si vino por la landing** → «Ya estás en la lista»; el día 2, si no hizo el quiz → «Queremos conocerte»; el día 5, si sigue sin hacerlo → «¿Conversamos sobre tu pelo?». Sale si compra. |
| F1b · Tu resultado v2 | `SDdF8t` | Cada vez que alguien de la lista hace el quiz → «Tu resultado: lo que necesita tu pelo», 15 min después, sin límite de repeticiones. No se envía si en la última hora recibió «Ya estás en la tribu», para no duplicar. |
| F1c · Historia y Sello | `X8Cw5p` | Día 7 y día 11. **En manual** hasta que Pao complete los textos. |

**Apagados:** `STrWsE`, `X94AbN`, `TCpZpP` y `VLiqiC` (versiones anteriores).

**Lo que Pao probó el 31-oct**
- Inscripción por la landing → «Ya estás en la lista».
- Quiz desde el correo → «Tu resultado».
- Quiz directo → «Ya estás en la tribu», sin correo duplicado.

### 6.3 Propiedades del perfil que escribe el quiz

| Grupo | Propiedades |
|---|---|
| Respuestas | `quiz_senales`, `quiz_porosidad`, `quiz_tratamientos`, `quiz_calor`, `quiz_tipo`, `quiz_grosor`, `quiz_cuero`, `quiz_prioridades`, `quiz_futuros`, `quiz_edad`, `quiz_edad_min`, `quiz_otro_senales`, `quiz_otro_tratamientos`, `quiz_otro_futuros` |
| Resultado | `quiz_routine_code`, `quiz_recomendacion`, `quiz_result_needs`, `quiz_result_findings`, `quiz_hallazgo_1_titulo` … `quiz_hallazgo_3_titulo`, `quiz_hallazgo_1_texto` … `quiz_hallazgo_3_texto`, `quiz_score_mask`, `quiz_score_crema` |
| Segmentación | `quiz_tags`, `quiz_eje`, `quiz_buyer`, `quiz_canas`, `quiz_origen` (`lista` o `directo`), `quiz_modo`, `quiz_version`, `quiz_panel`, `consent_whatsapp` |
| Landing | `waitlist_origen = landing`, `waitlist_fecha`, `waitlist_whatsapp` |

### 6.4 Plantillas de los correos

| Correo | Plantilla del flujo | Nota |
|---|---|---|
| Ya estás en la lista | `Wavc2Q` | |
| Ya estás en la tribu (con resultado) | `YzW89W` | Muestra necesidades y hallazgos con explicación |
| Tu resultado | `S2cCvQ` | La misma estructura que el anterior |
| Queremos conocerte | `TK4fTJ` | **Cambiar el link** a la URL definitiva del quiz, con `?origen=lista` |
| ¿Conversamos sobre tu pelo? | `YviRNy` | **Cambiar el link** a la URL definitiva del quiz, con `?origen=lista` |

### 6.5 Segmentos

- **37 segmentos del Excel** (S01 a S73): rutina, señales, color, canas, calor, cuero, edad, futuros y comportamiento.
- **8 segmentos por tramo de edad del quiz** (E1 a E8).
- Todos excluyen Interno · Pruebas.
- **Los mensajes por edad todavía no están definidos.** Lo decide Pao.

---

## 7. Landing V14 («la llamada»)

La página de prueba `page.landing-prueba.liquid` es la landing V14 de Flama. Solo se reemplazó el manejo del formulario:
- normaliza el WhatsApp a `9XXXXXXXX`;
- crea el perfil con `waitlist_origen = landing`, `waitlist_fecha`, `consent_whatsapp` y `waitlist_whatsapp`;
- suscribe a la Lista de espera con la fuente «Landing prelanzamiento».

**Hay que corregir antes de publicar:**
1. **Falta la casilla de política de privacidad** (Ley 29733). Hoy no se pide el consentimiento de datos.
2. **La casilla de correo es obligatoria.** Debería ser opcional e independiente, como en el quiz.
3. **Hay que quitar el aviso «PROTOTIPO: el formulario no envía datos».**
4. **En producción**, conviene enviar el formulario por el endpoint de Vercel o por el formulario nativo de Klaviyo, con el mismo criterio de consentimientos.

---

## 8. Cómo probar

```bash
cd trribu-quiz
npm test                    # 22 tests: motor, API, coherencia, «Otro», origen, rutinas iguales a la V41
node scripts/auditoria.js   # auditoría de coherencia (200.000 combinaciones por defecto)
npm run e2e                 # navegador real con Airtable y Klaviyo simulados
# Prueba real, después de desplegar (usar un correo de Interno · Pruebas):
E2E_URL=https://… E2E_EMAIL=… AIRTABLE_TOKEN=… AIRTABLE_BASE_ID=… KLAVIYO_PRIVATE_API_KEY=… node scripts/e2e-remote.js
```

---

## 9. Decisiones pendientes de Pao

| # | Decisión | Bloquea |
|---|---|---|
| 1 | Dónde vive el quiz definitivo: tema de Shopify o Vercel, y su URL | Los links de los correos |
| 2 | Política de privacidad: URL y revisión legal (Ley 29733) | La publicación |
| 3 | Cómo se entregan los regalos de lanzamiento en Shopify | El lanzamiento |
| 4 | Canal de WhatsApp: Klaviyo, YaVendio o solo guardar el dato | El uso de c3 |
| 5 | Mensajes por edad | Las campañas por tramo |
| 6 | IDs de variantes de los 4 productos, los 2 tamaños de viaje y La Toalla | El carrito |
| 7 | Textos de los correos de historia y sello (F1c), y TRRIBOND el día 7 frente a la regla de marca | La activación de F1c |
| 8 | Aceptar que quien elige «Prefiero verlo en pantalla» no queda registrada | — |
| 9 | Plan de Vercel (el cron cada 30 min requiere Pro) y límite de envíos global (KV o Upstash) | — |
| 10 | Fotos de la pregunta 5 (hoy son ilustraciones provisionales) | — |

El detalle de cada una está en `PREGUNTAS_PARA_PAO.md`.
