# Klaviyo · cuenta TRRIBÚ (configurado el 31-oct-2026)

Según `docs/TRRIBU_Klaviyo_Configuracion_V1_20261031.xlsx`. Los IDs no son secretos; la llave privada sí (solo en Vercel).

## Listas

| Lista | ID | Doble opt-in | Variable |
|---|---|---|---|
| TRRIBÚ · Lista de espera | `WQDPdj` | No | `KLAVIYO_LIST_ESPERA` |
| TRRIBÚ · Newsletter | `QX4yn6` | No | `KLAVIYO_LIST_NEWSLETTER` |
| TRRIBÚ · WhatsApp | `VHjagU` | No | `KLAVIYO_LIST_WHATSAPP` |
| TRRIBÚ · Panel de pruebas | `WSHZaL` | No | `KLAVIYO_LIST_PANEL` |
| Interno · Pruebas | `VCFTVw` | No | — (excluida de todos los segmentos) |

`WQDPdj` es la lista que ya usaba el quiz anterior del tema; se renombró para no perder a quienes ya estaban inscritas.

## Métricas
- Quiz completado: `U4jmsb`
- Placed Order (Shopify): `YzC2k2`

## Segmentos (37, todos excluyen Interno · Pruebas)

S01 `QQqhSb` · S02 `QT2y54` · S03 `TQRgtp` · S10 `T2yGZt` · S11 `X7Mg99` · S12 `Yhc72Z` · S13 `XEb4qn` · S20 `Scg9xx` · S21 `XzxN4Y` · S22 `WWwKsm` · S23 `TU4LGC` · S24 `UssyXR` · S25 `Xqhhnc` · S26 `Szpr7Y` · S27 `TA8Zmq` · S28 `RaG5ei` · S30 `TvvK22` · S31 `XCKiid` · S32 `QUNic8` · S33 `QQb3QJ` · S34 `Ukpywi` · S40 `TCKfyh` · S41 `R8F55M` · S42 `VSVEYB` · S50 `X9z2gd` · S51 `RFE7pn` · S52 `RwpAGA` · S53 `RrLkmc` · S54 `SBbbf4` · S60 `XTPzr7` · S61 `Ueky4K` · S62 `RNTBVD` · S63 `X2UKLi` · S70 `RyZQTt` · S71 `W9ZW7v` · S72 `TuFeWd` · S73 `QRmxVs`

**Edad por tramo del quiz (P10)**, además de los grupos grandes S50–S54: E1 menos de 35 `QPeMBp` · E2 35–39 `UjtigX` · E3 40–44 `TBNZiW` · E4 45–49 `R7JNQs` · E5 50–54 `Y3yzQc` · E6 55–59 `Uhsi8s` · E7 60–64 `Yk4B5f` · E8 65 o más `XCqi7e`. Todos excluyen Interno · Pruebas. Los mensajes por edad todavía no están definidos (decisión de Pao).

S71 y S72 filtran «Placed Order» por la propiedad `Items` con los nombres de producto de Shopify («El Shampoo», «El Acondicionador», «La Mascarilla», «La Crema…»). Verificar con el primer pedido real que los nombres coinciden.

## Flujos (prelanzamiento)

Embudo: anuncio → landing (o quiz) → lista de espera → bienvenida → invitación al quiz → resultado.

| Flujo | ID | Disparador | Qué hace | Estado |
|---|---|---|---|---|
| F1 · Bienvenida lista de espera (landing + quiz) | `VC7pKB` | Entra a la Lista de espera | Si hizo el quiz en las últimas 24 h → «Ya estás en la tribu» con su resultado. Si vino por la landing → «Ya estás en la lista»; día 2, si no hizo el quiz → «Queremos conocerte» (botón al quiz); día 5, si sigue sin hacerlo → «¿Conversamos sobre tu pelo?». Sale si compra. | Activo |
| F1b · Tu resultado (cada vez que hace el quiz) v2 | `SDdF8t` | Quiz completado en modo prelanzamiento y está en la lista. Espera 15 min y no envía si en la última hora recibió «Ya estás en la tribu» (`UZ6m8Y`), para no duplicar a quien entra por el quiz | «Tu resultado: lo que necesita tu pelo», **cada vez** que repite el quiz (sin límite) | Activo (reemplaza a `VLiqiC` y `TCpZpP`, apagados) |
| F1b · versión anterior | `VLiqiC` | Exigía 1 h en la lista: quien se inscribía en la landing y hacía el quiz enseguida no recibía su resultado | — | Apagado el 31-oct |
| F1c · Historia y Sello | `X8Cw5p` | Entra a la Lista de espera | Día 7: historia de Pao e Isabel. Día 11: el Sello. | Activo, ambos correos en **manual** hasta que Pao complete los «[PAO: …]» |
| F1 anterior y bienvenida V25 | `STrWsE`, `X94AbN` | — | Reemplazados | Apagados |
| F2 · Día de lanzamiento | — | Campaña 16-nov a S02 | — | Pendiente |
| F3–F7 (lanzamiento) | — | — | — | Pendientes: variantes de Shopify y § 8 |

**Enlace al quiz en los correos de invitación:** hoy apunta a la página de prueba `https://cjatu3-cq.myshopify.com/pages/quiz-prueba`. **Cambiar por la URL definitiva antes de publicar** (plantillas «Invitación al quiz» y «Recordatorio del quiz»).

**Origen de la inscripción:** la landing guarda `waitlist_origen = landing`; el quiz guarda las propiedades `quiz_*`.

## Perfiles de prueba
Los dos correos de Pao (`@trribu.com` y `@grupokoti.pe`) están en Interno · Pruebas con un envío V41 de prueba cada uno (rutinas SAMC y SA), cargado como histórico (no disparó flujos). Sirvieron para crear las propiedades del perfil (paso 3 del Excel).

## Propiedades agregadas el 31-oct

| Propiedad | Qué guarda | Dónde se usa |
|---|---|---|
| `quiz_hallazgo_1_titulo` … `quiz_hallazgo_3_titulo` | Título de cada hallazgo, en el mismo orden que en pantalla. Vacío si hay menos de tres. | Correos con resultado: «Tu resultado» (plantilla `S2cCvQ`, F1b v2) y «Ya estás en la tribu» (`YzW89W`, F1) |
| `quiz_hallazgo_1_texto` … `quiz_hallazgo_3_texto` | Explicación de cada hallazgo | Los mismos correos |
| `quiz_otro_senales`, `quiz_otro_tratamientos`, `quiz_otro_futuros` | Texto libre de «Otro», hasta 80 caracteres | Lectura semanal: no suma puntos |

Los botones de los correos de invitación (`TK4fTJ`) y de recordatorio (`YviRNy`) llevan `?origen=lista`.
