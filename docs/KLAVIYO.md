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

S71 y S72 filtran «Placed Order» por la propiedad `Items` con los nombres de producto de Shopify («El Shampoo», «El Acondicionador», «La Mascarilla», «La Crema…»). Verificar con el primer pedido real que los nombres coinciden.

## Flujos

| Flujo | ID | Estado |
|---|---|---|
| F1 · Bienvenida lista de espera | `STrWsE` | **Activo.** Correo 1 activo; correos 2 (día 3) y 3 (día 7) en **manual** hasta que Pao los revise. Sale si compra. |
| Quiz prelanzamiento · Bienvenida (V25) | `X94AbN` | Apagado (reemplazado por F1) |
| F2 · Día de lanzamiento | — | Es campaña del 16-nov a S02 |
| F3–F7 (lanzamiento) | — | Pendientes: dependen de las variantes de Shopify y de las decisiones de § 8 |

## Perfiles de prueba
Los dos correos de Pao (`@trribu.com` y `@grupokoti.pe`) están en Interno · Pruebas con un envío V41 de prueba cada uno (rutinas SAMC y SA), cargado como histórico (no disparó flujos). Sirvieron para crear las propiedades del perfil (paso 3 del Excel).
