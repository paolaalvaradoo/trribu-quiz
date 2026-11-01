# TRRIBÚ · Catálogo de textos personalizados del quiz y de los correos

Todas las frases que puede ver una persona según sus respuestas, tal como están hoy (1-nov-2026) en `public/quiz.html` y en Klaviyo.

**Uso:**
- Pao revisa y aprueba el copy.
- Flama lo usa para diseñar.

**Si se cambia una frase**, se cambia en `quiz.html` y después se corre `npm test`: la auditoría avisa si el texto contradice la rutina.

**Abreviaturas:**
- **P1…P10:** las preguntas del quiz.
- **La Mascarilla / La Crema (El Acondicionador Sin Enjuague):** «la rutina trae…» quiere decir que el motor la recomendó (puntaje ≥ 6).

---

## 1. Cómo se arma la pantalla del resultado (en este orden)

1. **Pantalla del correo** (antes del resultado), sección 6.
2. Etiqueta **TU RESULTADO** · título **«Lo que necesita tu pelo»**.
3. **Hasta 3 necesidades**, como etiquetas redondeadas (sección 2).
4. Si marcó 3 señales o más en P1: *«Nos cuentas que notas varios cambios a la vez. Por eso priorizamos lo más importante.»*
5. **«Esto es lo que identificamos»: hasta 3 tarjetas**, con título y explicación (sección 3). La primera corresponde a su prioridad n.º 1.
6. **Cuero cabelludo**, una frase si aplica. Solo en prelanzamiento (sección 4).
7. **Cierre**, distinto en prelanzamiento y en lanzamiento (sección 5).
8. **Aviso legal**, siempre: *«Orientación basada en tus respuestas; no es un diagnóstico. Nuestros productos cuidan el largo del pelo: no tratan la caída desde la raíz ni prometen que el color dure más. Si notas pérdida importante desde la raíz, irritación o cambios bruscos, consulta con un dermatólogo.»*

---

## 2. Necesidades («Lo que necesita tu pelo»)

Salen como máximo 3 y en este orden de prioridad. **Regla de coherencia:**
- si la rutina trae La Mascarilla, siempre aparece «Reparación» o «Hidratación»;
- si trae La Crema (El Acondicionador Sin Enjuague), siempre aparece una de sus necesidades (frizz, calor, textura, desenredo, brillo, manejabilidad).

| Etiqueta que ve | Cuándo aparece |
|---|---|
| **Reparación** | Tiene color (mechas o tinte) o marcó «Se me cae más pelo». También con alisado/keratina o prioridad «Menos pelo en el cepillo», cuando la rutina trae La Mascarilla |
| **Hidratación** | Seco en todo el largo, puntas secas, porosidad alta o prioridad «Hidratación y suavidad» |
| **Control del frizz** | Frizz (señal o prioridad) y la rutina trae La Crema (El Acondicionador Sin Enjuague) |
| **Control del frizz y del calor** | Lo mismo, pero además usa plancha o calor casi a diario |
| **Definición y movimiento** | Prioridad «Realzar mi textura natural» y la rutina trae La Crema (El Acondicionador Sin Enjuague) |
| **Cuidado ante el calor** | Plancha o calor diario, la rutina trae La Crema (El Acondicionador Sin Enjuague) y no salió «frizz y calor» |
| **Desenredado fácil** | Difícil de desenredar (señal o prioridad), si no salió «Hidratación» |
| **Brillo** | Opaco o prioridad brillo, si no salió «Hidratación» |
| **Cuerpo y volumen** | Menos volumen (señal o prioridad), si no salió «Hidratación» |
| **Suavidad** | Porosidad alta, prioridad suavidad, enredo o prioridad canas, si queda espacio |
| **Manejabilidad** | Prioridad «Pelitos cortos que no se levanten» |
| **Cuidado de tu textura** | Señal «Con otra textura» |
| **Cuidado de las canas** | Señal «Con canas» |
| **Cuidado de la fibra** | Prioridad «Menos pelo en el cepillo», sin la señal de caída |
| **Cuidado de la fibra teñida** | Prioridad «Cuidar mi pelo teñido» |
| **Cuidado del cuero cabelludo** | Cuero seco o variable, y ninguna otra necesidad |
| **Cuidado constante** | Si no aplica ninguna otra |

---

## 3. Tarjetas («Esto es lo que identificamos»)

**Cuántas salen:** hasta 3, ordenadas por importancia. La de su prioridad n.º 1 va siempre primero.

**Coherencia:**
- cada producto extra de su rutina queda explicado en al menos una tarjeta;
- si usa calor y la rutina trae La Crema (El Acondicionador Sin Enjuague), se habla de proteger.

| Título | Texto | Cuándo aparece |
|---|---|---|
| **Tu pelo está bien hoy, y lo cuidas** | *Aunque hoy no se note, las mechas le siguen* (o *el color le sigue* / *el alisado le sigue*) *sumando desgaste. Por eso necesita reparación como prevención.* (o, sin La Mascarilla: *…un cuidado suave y constante en cada lavado.*) | «Está bastante bien» + color o alisado |
| **Tu pelo está bien hoy** | *Es el mejor momento para cuidarlo: mantener es más fácil que reparar. Necesita una rutina suave y constante.* | «Está bastante bien» sin color, o si no aplica ninguna otra tarjeta |
| **Llevas mechas y tinte** | *Las mechas y el tinte dejan tu pelo más frágil con cada aplicación. Por eso necesita reparación en cada lavado.* | Mechas + tinte en todo el largo |
| **Llevas mechas y retocas tus raíces** | *Las mechas dejan el largo más frágil. Por eso necesita reparación en el largo y suavidad en todo el pelo.* | Mechas + tinte de raíces |
| **Tus mechas dejan el pelo más frágil** | *Las mechas dejan tu pelo más frágil y áspero. Por eso necesita reparación en cada lavado.* | Solo mechas |
| **Llevas tinte en todo el largo** | *Cada aplicación de tinte reseca un poco más tu pelo, sobre todo las puntas. Por eso necesita reparación y un lavado que cuide el color.* | Tinte en todo el largo |
| **Retocas tus raíces** | *Cada retoque también toca parte del largo y lo va resecando. Por eso necesita reparación suave y un lavado que cuide el color.* | Tinte de raíces |
| **Notas que se te cae más pelo** | *Mira el pelo que queda en el cepillo. Si son hebras cortas o partidas, sin la bolita blanca en la punta, es quiebre: tu pelo está frágil, y eso sí lo podemos cuidar. Si son pelos completos, con la bolita blanca de la raíz, y en cantidad, consúltalo con un dermatólogo.* | P1 «Se me cae más pelo» |
| **Te preocupa el pelo que ves en el cepillo** | *Si son hebras cortas o partidas, sin la bolita blanca en la punta, es quiebre, y eso se puede cuidar. Si son pelos completos, con la bolita blanca de la raíz, y en cantidad, consúltalo con un dermatólogo.* | Prioridad «Menos pelo en el cepillo», sin la señal de caída |
| **Tu pelo pierde la suavidad rápido** | *Tu pelo absorbe el agua rápido, pero también la pierde rápido. Por eso necesita hidratación y reparación.* (sin La Mascarilla: *…hidratación en cada lavado.*) | Porosidad alta (P2 «Muy reseco y áspero») |
| **Lo sientes seco en todo el largo** | *Tu pelo retiene menos agua y se siente rígido. Por eso necesita hidratación en cada lavado.* | Seco en todo el largo |
| **Tus puntas están secas** | *Las puntas son la parte más antigua de tu pelo y la más gastada. Por eso necesitan hidratación extra.* | Puntas secas (sin seco en todo el largo) |
| **Notas frizz** / **Quieres controlar el frizz** | *Tu pelo está deshidratado y por eso se esponja con la humedad. Necesita hidratación y un cuidado que se quede en el pelo.* | Señal frizz / prioridad frizz |
| **Quieres que los pelitos cortos no se levanten** | *Pueden ser pelo nuevo o hebras que se quebraron. Necesitan hidratación y un poco de peso, sin aplastar el resto.* | Prioridad pelitos, sin la señal frizz |
| **Quieres realzar tu textura natural** | Pelo lacio: *El pelo lacio se ve mejor con movimiento y sin peso. Necesita un cuidado ligero que no lo aplaste.* Otro tipo: *Tus ondas se definen solas cuando el pelo está hidratado y sin frizz. Necesitan un cuidado que no las endurezca.* | Prioridad «Realzar mi textura natural» |
| **Notas tu pelo con otra textura** | *El pelo nuevo puede nacer con otra forma. No hay que corregirlo: necesita un cuidado para la textura que tiene hoy.* | Señal «Con otra textura», sin esa prioridad |
| **Usas calor con frecuencia** | Rutina con La Mascarilla y La Crema (El Acondicionador Sin Enjuague): *El calor frecuente reseca tu pelo y lo vuelve más frágil. No tienes que dejarlo: necesita reparación y un cuidado que lo ayude a proteger antes de usarlo.* · Solo con La Mascarilla: *…solo necesita hidratación y reparación.* · Solo con La Crema (El Acondicionador Sin Enjuague): *El calor frecuente reseca tu pelo. No tienes que dejarlo: solo necesita hidratación y un cuidado que lo ayude a proteger antes de usarlo.* · Sin ninguna: *…solo necesita más hidratación.* | Plancha o calor casi a diario. La secadora ocasional no cuenta. |
| **Tienes canas** / **Quieres tus canas más suaves** | *Las canas suelen sentirse más ásperas y brillan menos. No son un problema: solo piden suavidad y brillo.* | Señal canas / prioridad canas |
| **Te cuesta desenredar** / **Quieres desenredar fácil** | *Cuando el pelo está áspero, las hebras se enganchan y se quiebran al peinarte. Necesita que el peine pase sin tirar.* | Señal / prioridad desenredo |
| **Notas tu pelo opaco** / **Buscas más brillo** | *Tu pelo brilla menos cuando su capa externa se abre. Necesita hidratación y un cuidado que la selle.* | Señal opaco / prioridad brillo |
| **Notas menos volumen** / **Quieres más cuerpo** | *Cada hebra puede nacer más delgada, y los productos pesados la aplastan más. Necesita cuerpo, sin peso.* | Señal / prioridad volumen |
| **Llevas alisado o keratina** | *Los sulfatos acortan la duración del alisado. Por eso necesita una limpieza sin sulfatos y reparación suave.* | Alisado o keratina, sin color |
| **Nos contaste algo más** | *Lo leemos con atención. Mientras tanto, tu pelo necesita una rutina suave y constante.* | Solo marcó «Otro» en P1 |

---

## 4. Cuero cabelludo (P7)

Una frase bajo las tarjetas, solo en prelanzamiento. En lanzamiento va dentro de la tarjeta de El Shampoo.

| Respuesta | Frase |
|---|---|
| Ya con grasa | *Tu cuero cabelludo se engrasa rápido: necesitas una limpieza suave que no reseque las puntas.* |
| Seco o tirante | *Tu cuero cabelludo se siente seco: necesita una limpieza suave, sin cargar la raíz.* |
| Variable | *Tu cuero cabelludo cambia de un día a otro: necesita una limpieza suave y constante.* |
| Equilibrado | *(no sale frase)* |

---

## 5. Cierre del resultado

**Prelanzamiento** (hoy):
- **TU RECOMENDACIÓN ESTÁ LISTA** · *«Te la revelamos primero a ti.»*
- *«Entra a la lista y te la mandamos antes que a nadie, el día del lanzamiento.»*
- Casillas difuminadas: una por producto de su rutina, sin nombres ni precios.

**Lanzamiento** (desde el 1-dic):
- **TU RUTINA TRRIBÚ** · *«Esto es lo que necesita tu pelo hoy.»*
- **Una tarjeta por producto de su rutina:**

| Producto | Frase |
|---|---|
| 01 El Shampoo · 300 ml · S/ 79 | *Limpia sin resecar y cuida tu color.* |
| 02 El Acondicionador · 300 ml · S/ 79 | *Desenreda y reduce el quiebre.* |
| 03 La Mascarilla · 300 ml · S/ 109 | *Repara a fondo el pelo seco y quebradizo.* |
| 04 La Crema (El Acondicionador Sin Enjuague) · 150 ml · S/ 89 | *Controla el frizz y respeta tu textura natural.* |

- **Total:** *«Tu rutina: S/ …»*
- **Regalo:** *«De regalo: La Mascarilla (100 ml) y La Crema (El Acondicionador Sin Enjuague) (50 ml) en tamaño viaje»*, más *«y La Toalla»* si su rutina trae los 4 productos.
- **Botón:** **AGREGAR MI RUTINA AL CARRITO**.
- **Formulario de abajo:** **TU RUTINA POR CORREO** · *«¿Te la mandamos para tenerla a mano?»* · botón **ENVIARME MI RUTINA**.

**Oferta de lanzamiento (confirmada por Pao el 1-nov):**
- **Rutina de 2 productos** (El Shampoo + El Acondicionador): de regalo La Mascarilla (100 ml) y La Crema (El Acondicionador Sin Enjuague) (50 ml) en tamaño viaje.
- **Rutina de 4 productos:** los mismos 2 tamaños viaje **+ La Toalla**.
- **Rutina de 3 productos** (con La Mascarilla o con La Crema (El Acondicionador Sin Enjuague)): hoy el quiz muestra los 2 tamaños viaje, sin La Toalla. **Pao debe confirmarlo.**
- El quiz ya muestra esta línea en modo lanzamiento. **Falta configurarlo en Shopify** para que el regalo entre al pedido: descuento automático «compra X, lleva Y», Shopify Function o app de regalos.

Precios: los confirma Pao antes del lanzamiento.

---

## 6. Pantalla del correo (antes del resultado)

| Cómo llegó | Etiqueta | Título |
|---|---|---|
| Desde los correos (`?origen=lista`) | TU RESULTADO ESTÁ LISTO | *¿A qué correo te enviamos tu resultado?* |
| Directo (bio, anuncios) | TU RESULTADO ESTÁ LISTO | *Te enviamos tu resultado por correo* |

**Formulario**
- **Campos:** nombre, correo y WhatsApp (opcional).
- **Casillas:**
  - c1 *«Acepto la política de privacidad y el tratamiento de mis datos para gestionar mi inscripción.»* (obligatoria);
  - c2 *«Quiero recibir correos de TRRIBÚ con novedades y consejos.»*;
  - c3 *«Quiero recibir mensajes de TRRIBÚ por WhatsApp.»*;
  - c4 *«Me gustaría participar en futuras pruebas de TRRIBÚ.»*
  - Debajo: *«Los consentimientos comerciales son opcionales e independientes. GRUPO EKKA SAC tratará los datos según la política de privacidad.»*
- **Botón:** **ENVIARME MI RESULTADO**. Debajo, tenue: *«Prefiero verlo en pantalla»*.
- **Al enviar:** se muestra el resultado con *«Listo. También te lo enviamos a tu correo.»*

**Mensajes de error**
- *«Cuéntanos tu nombre.»*
- *«Revisa el correo. Parece que falta algo.»*
- *«El WhatsApp debe tener 9 dígitos y empezar en 9.»*
- *«Para inscribirte, necesitamos que aceptes la política de privacidad.»*
- *«Para recibir novedades, autoriza al menos un canal: correo o WhatsApp.»*
- *«Para escribirte por WhatsApp necesitamos tu número.»*

---

## 7. Correos de Klaviyo (activos)

Firma de todos: **Pao de TRRIBÚ**, `paola.alvarado@trribu.com`.

| Correo | Asunto · vista previa | Cuándo |
|---|---|---|
| **Ya estás en la lista** (`Wavc2Q`) | *Ya estás en la lista* · *Gracias por contestar la llamada.* | Se inscribe por la landing |
| **Queremos conocerte** (`TK4fTJ`) | *Queremos conocerte* · *Diez preguntas sobre tu pelo, a tu ritmo.* | Día 2, si no hizo el quiz |
| **¿Conversamos sobre tu pelo?** (`YviRNy`) | *¿Conversamos sobre tu pelo?* · *Te guardamos un lugar.* | Día 5, si sigue sin hacerlo |
| **Ya estás en la tribu** (`YzW89W`) | *Ya estás en la tribu* · *Esto es lo que necesita tu pelo, según nos contaste.* | Se inscribe a través del quiz |
| **Tu resultado** (`S2cCvQ`) | *Tu resultado: lo que necesita tu pelo* · *Gracias por contarnos cómo está tu pelo hoy.* | Ya estaba en la lista y hace el quiz (cada vez, 15 min después) |

**Ya estás en la lista**
> Hola {nombre}, Gracias por contestar la llamada. Desde hoy eres de las primeras en enterarte de lo que estamos preparando. Estamos creando un cuidado para el pelo que está cambiando. Hay cuatro productos detrás de esta invitación y, por ahora, siguen sellados. En unos días te escribimos con una invitación: queremos conocer tu pelo, tal como está hoy.

**Queremos conocerte**
> Hola {nombre}, Hablemos de tu pelo. Del que tienes hoy. Cuéntanos qué estás notando, cómo lo cuidas y qué te gustaría cuidar primero. Son diez preguntas, a tu ritmo. Al final te mostramos lo que necesita tu pelo. Y con lo que nos cuentes, preparamos tu recomendación para el día del lanzamiento. **[CONVERSEMOS]**

**¿Conversamos sobre tu pelo?**
> Hola {nombre}, Te guardamos un lugar en la conversación. Son diez preguntas sobre tu pelo, sin respuestas correctas ni incorrectas, y al final te mostramos lo que necesita. Cuando tengas unos minutos, aquí te esperamos. **[CONVERSEMOS]**

**Ya estás en la tribu / Tu resultado** (mismo cuerpo, personalizado):
> LISTA DE ESPERA · **Ya estás en la tribu.**
> Hola {nombre}, Gracias por contarnos cómo está tu pelo hoy. No es poca cosa: muchas notamos cambios y no siempre sabemos ponerles nombre. Aquí te dejamos lo que vimos en tus respuestas, para que lo tengas a mano.
>
> **TU RESULTADO · Lo que necesita tu pelo:** {sus necesidades, con las mismas etiquetas de la sección 2}
>
> **Esto es lo que identificamos:** {sus tarjetas, con título y explicación, igual que en pantalla (sección 3)}
>
> **LO QUE VIENE:**
> · Tu recomendación completa sigue guardada. Te la mandamos antes que a nadie, el día del lanzamiento.
> · Te escribiremos poco, y solo cuando valga la pena.
> · (si marcó c4) Nos dijiste que te gustaría participar en futuras pruebas de TRRIBÚ. Lo tenemos anotado.
>
> Una cosa más: responde este correo y cuéntanos qué es lo que más te cuesta de tu pelo hoy. Leemos cada respuesta.
>
> *Pie:* Orientación basada en tus respuestas; no es un diagnóstico. Si notas pérdida importante desde la raíz, irritación o cambios bruscos, consulta con un dermatólogo.

**Mejoras pendientes en los correos**
- **«Tu resultado» repite el encabezado «Ya estás en la tribu.».** A quien ya estaba en la lista y repite el quiz le convendría un encabezado propio, por ejemplo *«Tu resultado de hoy»*.
- **El cierre del resultado en pantalla** (sección 5) **y la frase *«Te la mandamos antes que a nadie, el día del lanzamiento»*** se revisan dentro del plan de comunicación hacia el 1-dic.

---

## 8. Para que Pao revise con la regla de marca

- **«Se me cae más pelo» y «Notas que se te cae más pelo».** Son la palabra de la clienta, aprobada por Pao el 31-oct. La regla de marca dice «caída» siempre como «caída por quiebre»: la tarjeta explica esa diferencia y deriva al dermatólogo.
- **«Alisado o keratina» y la tarjeta «Llevas alisado o keratina».** Nombran el tratamiento que ella se hace, no un ingrediente ni un claim de TRRIBÚ (decisión V6 del 14-oct).
- **«Cada hebra puede nacer más delgada».** Habla de la fibra, no de la cantidad de pelo.
- **La Crema** aparece siempre como **«La Crema (El Acondicionador Sin Enjuague)»**, salvo en las frases de los productos, donde se usa el nombre completo.
