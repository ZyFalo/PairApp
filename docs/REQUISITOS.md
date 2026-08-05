# PairApp — Documento de Requisitos Mínimos

> **Estado:** v0.3 — 1 de agosto de 2026 · *alcance del MVP cerrado*
> **Autores:** William + Claude
> **Naturaleza:** documento vivo. Decisiones cerradas en §12.1 (D1–D38); quedan **cuatro** preguntas abiertas y ninguna bloquea el desarrollo.
>
> **v0.3 — el MVP queda definido:** siete funciones (§9.1), usabilidad por encima de sofisticación técnica, **sin cifrado extremo a extremo**, y un módulo nuevo: **los 11:11** (M12). Ocho módulos entran completos en la Fase 1.
>
> **v0.2 — reestructuración:** se unificaron check-in y "cápsula" en un gesto con tres destinos; el vocabulario pasó de 6 a 9 emociones en tres familias; el motor se reescribió como matriz en vez de flujos por escenario; se eliminó la escala de reacción. Términos retirados: *cápsula*, *Eco*, *en frío* como destino, *las tres puertas*.

---

## 1. Visión

Una PWA privada para **dos personas** que quieren comunicarse mejor sus emociones y sostenerse mutuamente, especialmente en los momentos difíciles.

### 1.0 Para qué existe

> **La app es el empujón cómodo para hablar.**
>
> Casi siempre que algo se calla no es por falta de ganas, sino por el coste de empezar: *¿lo digo o lo dejo pasar? ¿estaré exagerando? ¿es momento?* Esa duda es donde mueren las conversaciones que hacían falta.
>
> La app hace la pregunta por ti. Y reencuadra lo que significa contestarla: **hablar las cosas no es buscar conflicto, es cuidar la relación.** Decir *"esto me incomodó"* es una forma de querer, no de reclamar.

**RF-1.0.0 Ese reencuadre vive en el diseño, no en textos.** La app **nunca** lo enuncia. Nada de *"recuerda que comunicarte es un acto de amor"* — eso es un sermón, y un sermón produce el efecto contrario (P10, §1.2). Se implementa así:

| Cómo se dice sin decirlo | Dónde |
|---|---|
| La app pregunta primero, así nadie carga con abrir el tema | RF-1.0 |
| *"Algo pasó"* tiene el mismo peso visual que *"Estoy contigo"*: hablar de lo que molesta es tan normal como decir te quiero | §M1.1.2 |
| Decir algo pequeño cuesta un toque y no lleva advertencias | RF-1.2.1 |
| La app nunca usa las palabras *conflicto*, *problema*, *queja* ni *reclamo* | §1.2 |
| Cuando dudo si hablar, la duda ya está resuelta: el botón existe y no juzga | §M1.1.2 |

**El bucle central, en cuatro pasos:**

> **Digo cómo estoy → le dejo algo → se entera → me responde bien.**

Eso es la app. Todo lo demás (calendario, canciones, series, recuerdos) orbita alrededor de este bucle.

Cada paso tiene su propio modo de romperse, y la app existe para sostener cada uno:

| Paso | Cómo se rompe en la vida real | Qué hace la app |
|---|---|---|
| **1. Digo cómo estoy** | No lo digo. Me lo trago, o espero que se note | Me lo pregunta un par de veces al día. Cuesta diez segundos |
| **2. Le dejo algo** | Escribo desde la herida y hiero. O no escribo nada | Un mensaje por cada emoción. Si estoy enojado, la app pone tiempo de por medio (§6) |
| **3. Se entera** | Se entera tarde, o por el tono de mi voz, o no se entera | Aviso inmediato: cómo estoy y si le dejé algo |
| **4. Me responde bien** | Lee mi mensaje difícil, se lo toma mal, y ahora somos dos heridos | Una pausa entre leer y responder, con ayuda para no reaccionar desde el golpe (§10) |

El paso 4 es el que casi ninguna herramienta atiende, y es donde una discusión se convierte en dos discusiones.

**Una variante del paso 2:** un mensaje no siempre se entrega ahora. Puedo escribirlo estando bien y guardarlo para cuando **ella** esté mal. Es el mismo gesto —decir cómo estoy y dejarle algo— con el reloj corrido. Cuando estamos bien tenemos claridad, ternura y paciencia; cuando estamos mal, no. Guardar permite usar lo primero en lo segundo.

### 1.1 Principios de diseño

Estos principios ganan cuando hay conflicto con una funcionalidad:

| # | Principio | Implicación práctica |
|---|---|---|
| P1 | **Cuidado, no vigilancia** | Ver el estado del otro es un acto de cuidado. Nunca métricas de "cumplimiento", nunca "te vi en línea", nunca historiales que sirvan para reclamar. |
| P2 | **Consentimiento granular** | Cada persona decide qué comparte y con qué detalle. Poder decir "no estoy bien" sin explicar por qué. |
| P3 | **La app no interpreta emociones, las transporta** | La IA sugiere, nunca diagnostica ni concluye "estás así por X". |
| P4 | **Nunca empujar en el peor momento** | En estados de enojo o crisis, la app *ofrece*, no *empuja*. Entrega por invitación, no por notificación. |
| P5 | **Autenticidad sobre volumen** | La IA ayuda a arrancar y a pulir; nunca escribe en tu lugar. Un mensaje generado no vale nada. |
| P6 | **Sin gamificación de la relación** | Cero rachas, cero puntajes de pareja, cero "llevas 3 días sin registrar tu ánimo". La culpa no construye intimidad. |
| P7 | **Minimalismo funcional** | Si una pantalla necesita instrucciones, está mal diseñada. El check-in diario debe tomar menos de 10 segundos. |
| P8 | **Reversibilidad** | Todo mensaje enviado en caliente se puede retener. Todo dato se puede borrar. Nada es irreversible sin confirmación. |
| P9 | **La fricción es temporal, nunca editorial** | La app puede pedirte que **esperes**. Nunca puede pedirte que **cambies lo que sientes**. Bloquear un envío hasta que el texto "mejore" equivale a decir que la emoción está mal expresada, y de ahí a que está mal hay un centímetro. Además, un mensaje siempre pulido le quita a tu pareja la señal de cuándo estás realmente mal. |
| P10 | **Suavidad: la maquinaria es invisible** | Por dentro hay puertas, umbrales, disparadores y guardrails. Por fuera no debe verse ninguno. Nada de tecnicismos, jerga terapéutica ni lenguaje de sistema. Ninguna pantalla dice "guardrail activado" ni "check-in registrado". Si una función se nota como función, está mal construida. |

### 1.2 Tono de voz

Consecuencia directa de P10. La app habla poco y con calma.

| Regla | Ejemplo |
|---|---|
| Enuncia hechos, no juicios | *"Escribiste esto enojado."* — nunca *"tu mensaje puede herir"* |
| Ofrece, no recomienda | Tres botones iguales, ninguno destacado |
| Sin signos de alarma | Nada de ⚠️, "¡atención!", "¿estás seguro?" |
| Sin jerga terapéutica | Nunca "valida sus emociones", "comunicación asertiva", "inteligencia emocional" |
| Sin celebrar ni felicitar | Registrar cómo estás no merece confeti |
| El silencio es una respuesta válida | Si no hay nada que decir, la app no dice nada |
| Nunca habla en primera persona | La app no es un personaje ni tiene opiniones. No dice "creo que…" |

### 1.3 Qué NO es esta app

- No es una red social ni tiene feed público.
- No es una app de terapia ni sustituye ayuda profesional.
- No es un tracker de fertilidad médico.
- No es un chat en tiempo real (para eso ya existe WhatsApp). Es **asíncrona y deliberada** por diseño.

---

## 2. Usuarios y contexto

- **Exactamente 2 usuarios** por espacio (un "Vínculo"). El sistema debe soportar múltiples vínculos independientes si en algún momento se abre a otras parejas, pero el MVP se diseña para uno.
- **Dispositivo principal:** móvil (Android/iOS), instalada en pantalla de inicio.
- **Frecuencia esperada:** 1–3 aperturas al día, sesiones cortas (< 2 min), salvo cuando se escribe una carta.
- **Asimetría de uso:** es probable que una persona use la app más que la otra. El diseño no debe castigar ni exponer esa asimetría (ver P6).

---

## 3. Glosario

| Término | Definición |
|---|---|
| **Vínculo** | El espacio compartido entre las dos personas. Contiene todos los datos. |
| **Check-in** | Registro rápido de cómo estoy. **Nueve** emociones + intensidad. |
| **Mensaje** | Lo que le dejo a mi pareja al registrar cómo estoy. Texto, audio, foto o canción. Unidad central de la app. |
| **Destino** | Cuándo llega el mensaje. Tres: *Ahora* · *Cuando le sirva* · *Solo para mí* (§2.0). |
| **Cuando le sirva** | Mensaje escrito desde una emoción cálida y entregado cuando ella lo necesite. La app elige el momento. *(En revisiones anteriores: "cápsula" o "guardado".)* |
| **Disparador** | La condición interna que entrega un mensaje de *"cuando le sirva"*. No se configura por defecto (RF-2.0.3). |
| **Presencia / Conversación** | Las dos clases de mensaje: los que no esperan respuesta y los que sí (§3.2). |
| **Cofre** | Archivo personal de todo lo recibido, con los guardados destacados. |
| **Umbral** | La pantalla que aparece al enviar enojado y ofrece esperar (§6.1). |
| **Amortiguador** | Algo cálido de ella antes de abrir un mensaje difícil, cuando estoy mal (RF-3.0.7). |
| **Espejo** | Revisión opcional de un borrador antes de enviarlo (§6.5). |
| **Acompañante** | Ayuda opcional para responder un mensaje difícil (§10.3). |
| **Los tres grupos** | *Estoy contigo* · *Me falta algo* · *Algo pasó*. Agrupan las nueve emociones y gobiernan el motor (§M1.1.2, §3.0.15). |

> **Términos retirados**, por si aparecen en notas antiguas: *cápsula* → mensaje de "cuando le sirva"; *Eco* → respuesta; *buzón en frío* → sigue existiendo pero solo dentro del umbral (§6.3); *en frío* como destino → eliminado (RF-2.0.5).

---

## 4. Mapa de módulos

| # | Módulo | Fase | Prioridad |
|---|---|---|---|
| M0 | Núcleo: cuenta, vínculo, perfil, ajustes | 1 | Crítica |
| M1 | Cómo estoy: la pregunta periódica y las nueve emociones | **1** | Crítica |
| M2 | El mensaje: escribir y elegir destino | **1** | Crítica |
| M3 | Enterarse y responder: aviso, motor, cofre | **1** | Crítica |
| M4 | Notificaciones push | **1** | Alta |
| M5 | Ciclo menstrual | **1** | Alta |
| M7 | Calendario compartido | **1** | Alta |
| M8 | Dedicatorias musicales | **1** | Alta |
| M12 | **Los 11:11** | **1** | Alta |
| M6 | Escribir en caliente: umbral, buzón en frío, conflictos | 1 y 3 | Alta |
| M10 | Capa de IA | 3 | Media |
| M9 | Lista de series y películas | 4 | Baja |
| M11 | Recuerdos / línea de tiempo | 4 | Baja |

> Las fases son las de §9.1. **Ocho módulos completos entran en el MVP.** M6 está partido: el **umbral** entra en Fase 1 (es una pantalla de tres botones); el buzón en frío completo y el registro de conflicto van después.

---

## 5. Módulos en detalle

### M0 — Núcleo

**RF-0.1** Registro con email + contraseña, o enlace mágico por correo. Sin redes sociales (evita dependencias y fugas de datos).
**RF-0.2** Creación de un Vínculo: la primera persona genera un código de invitación de un solo uso, con caducidad de 72 h. La segunda persona lo canjea.
**RF-0.3** Un usuario pertenece a un único Vínculo activo a la vez.
**RF-0.4** Perfil: nombre para mostrar, foto, zona horaria, pronombres (campo libre) y **género gramatical** (masculino · femenino · neutro). Este último no es lo mismo que los pronombres: la interfaz necesita concordar las etiquetas de emoción (*Agradecido/Agradecida*, *Me siento solo/sola*, RF-1.1.9), y para eso hace falta un dato explícito. La opción *neutro* usa formulaciones sin marca de género.
**RF-0.5** Pantalla de ajustes con: notificaciones, privacidad, apariencia, datos, y **"Disolver vínculo"** (borrado con doble confirmación y ventana de gracia de 7 días).
**RF-0.6** Estado de conexión visible del contenido: la app funciona sin red y sincroniza al reconectar.

**RF-0.7 Configuración inicial: qué usa esta pareja.** Antes de entrar por primera vez, se elige qué módulos opcionales quedan encendidos. Cuatro reglas gobiernan esta pantalla:

**RF-0.7.1 La dispara el enlace al completarse, no el primer arranque.** Configurar «lo nuestro» antes de que exista la otra persona es elegir por ella. Mientras se está sola, la app se usa sin pasar por aquí.

**RF-0.7.2 Dos clases de interruptor, y no se mezclan.** Los **de los dos** (música, series, recuerdos, 11:11) los cambia cualquiera y los ven ambos. Los **míos** (llevar el ciclo, compartir mi ánimo, en qué ventanas del 11:11 participo) no los ve ni los cambia nadie más (RF-5.0, RF-1.5, RF-12.8). Ponerlos en la misma lista convertiría un ajuste privado en una negociación — *«¿por qué no quieres que vea tu ánimo?»*—, que es exactamente lo que M5 evita.

**RF-0.7.3 Los guardarraíles no son opcionales.** El umbral del enojo, el buzón en frío, la ventana de retirada y el amortiguador no aparecen aquí. No son extras: son los frenos, y un interruptor para los frenos es un interruptor que se toca justo el peor día (P9).

**RF-0.7.4 Todo encendido de partida, y se pregunta por ellos, no por funciones.** *«¿Veis series juntos?»*, no *«¿activar el módulo de series?»*. Apagado por defecto significa que nadie los descubre; encendido con salida fácil significa que la app llega completa y se poda. **Apagar no borra nada** y se cambia cuando sea, en la misma pantalla — no en una copia.

**RF-0.7.5 Un cambio compartido no puede ser mudo.** Cuando uno apaga un módulo, la pantalla de ajustes dice quién fue y cuándo. Sin notificación: una pestaña que desaparece sin explicación es la clase de cambio silencioso que la app evita en todo lo demás (RF-6.4.2). A quien lo hizo se le dice *«lo cambiaste tú»*: el aviso existe para el otro, y el propio nombre sobra.

**RF-0.7.6 La configuración tiene dos mitades y no se reparten igual.** La de módulos se hace **una vez para los dos**; la personal —el ciclo, mi ánimo, mis ventanas— la hace **cada quien**, porque nadie puede elegirla por otro.

Por eso quien llega segundo también pasa por la pantalla, y la primera parte le cambia el encabezado: en vez de *«Ya estáis los dos»* lee **«[Nombre] ya eligió esto»**, con los mismos interruptores y la elección de la otra persona puesta. No es una pregunta, es un resumen — y puede cambiarlo todo ahí mismo.

Marcar solo el vínculo dejaba a la segunda persona sin ver nunca la pantalla: con los valores por defecto puestos y sin habérselos enseñado.

❓ *Decisión abierta:* ¿queremos "modo pausa"? Un interruptor que silencia todas las entregas y notificaciones durante N días, sin borrar nada, para cuando alguien necesita espacio. Yo creo que sí — es el equivalente a "no puedo con esto ahora" sin tener que desinstalar.

---

### M1 — Cómo estoy

El check-in es el pulso de la app. Todo lo demás reacciona a él.

**RF-1.0 La pregunta periódica.** La app pregunta **tres veces al día**: *"¿Cómo estás con ella?"*. Un toque en la notificación abre directamente la pantalla de registro. Siempre se puede registrar espontáneamente sin esperar la pregunta.

**Seis horarios en total: tres franjas × dos personas.** Dentro de cada franja, las dos preguntas van separadas —nunca simultáneas— por los motivos de §M1.0.3:

| Franja | Persona A | Persona B | Qué captura |
|---|:---:|:---:|---|
| **Mañana** | 09:00 | 10:00 | Cómo amaneciste. Renueva el estado tras la noche (RF-3.0.7.7) |
| **Tarde** | 14:00 | 15:00 | Mitad del día, cuando ya pasó algo |
| **Noche** | 19:00 | 20:00 | Cierre, antes de la franja donde más se discute |

**RF-1.0.1 Configurables** por cada persona, en su propia zona horaria (RF-0.4). Lo único que el sistema protege es la separación dentro de cada franja.

**RF-1.0.1.1 Quién va primero.** Por defecto, la misma persona abre las tres franjas. Es lo más predecible y lo que mejor asienta la costumbre. Tiene un efecto secundario que conviene conocer: **quien va segundo siempre registra sabiendo cómo está el otro**, y eso puede condicionarle — verla triste tiñe mi propio *"bien"*. Si se nota, la solución es invertir el orden en una de las tres franjas (por ejemplo, que en la tarde vaya primero B). No se hace por defecto porque complica recordar a qué hora te toca.

**RF-1.0.2 Si ya registré en esa ventana, no se pregunta.** Una toma se salta si hubo un check-in espontáneo en las 3 h previas. Con esto, tres tomas programadas se traducen casi siempre en **una o dos notificaciones reales al día**.

> ⚠️ Tres preguntas diarias están cerca del límite de lo tolerable (P6, P7): una app que molesta se ignora, y una app ignorada no sirve el día que hace falta. **RF-1.0.2 es lo que hace viable el número.** Si en el uso real se siente pesado, bajar a dos antes que retocar cualquier otra cosa.

#### M1.0.3 Las preguntas van desfasadas entre los dos

**RF-1.0.3 Desfase de una hora exacta.** Las dos personas nunca reciben la pregunta a la vez: dentro de cada franja hay **60 minutos** entre una y otra. Es el valor por defecto y el recomendado — suficiente para que la primera persona haya podido registrar, y no tanto como para desincronizar el día.

**RF-1.0.4 Mínimo de 30 minutos.** Si al configurar sus horas la separación baja de media hora, la app lo señala y propone volver a una. No lo impide — solo lo avisa.

Cuatro razones, y la tercera es la importante:

1. **La app es asíncrona por diseño** (§1.3). Si ambos registran a la misma hora, los avisos se cruzan y se convierte en un chat torpe — que es justo lo que no es.
2. **Evita la colisión emocional.** Dos mensajes difíciles cruzándose en el aire, ninguno leído todavía, ambos escritos sin saber cómo está el otro. Es la peor configuración posible.
3. **El motor necesita un estado reciente del receptor para funcionar.** Toda la matriz de §3.0.15 se apoya en la pregunta *"¿cómo está quien recibe?"*. Con las tomas desfasadas, cuando yo registro y le dejo algo, **ella ya registró hace una hora**: hay un estado fresco con el que decidir si amortiguar. Si preguntáramos a la vez, los dos estados nacerían simultáneamente y el motor tendría que decidir a ciegas.
4. **Reparte la carga.** Nunca dos notificaciones del mismo vínculo en el mismo minuto.

> Con tres tomas separadas por cinco horas, el estado de cada uno rara vez supera las 8 h de caducidad durante el día. La única franja donde sí caduca es la noche — exactamente el caso de la simulación, donde amanecer y que la app pregunte de nuevo antes de mostrar nada resultó ser lo correcto.

**RF-1.1 Las nueve emociones.** Vocabulario definido por los usuarios, no genérico:

| Emoción | Qué cubre | ¿Hacia dónde apunta? | ¿Puede herir? | ¿Difícil de responder? |
|---|---|---|---|---|
| 🌤 **Bien** | Estoy contento, tranquilo, en paz con nosotros | — | No | No |
| 🙏 **Agradecido** | Quiero reconocer algo que hiciste | Hacia ti, en positivo | No | No |
| 💭 **Te extraño** | Estás lejos y me haces falta | Hacia ti, con cariño | No | No |
| 😢 **Triste** | Estoy bajoneado, me falta algo | Hacia dentro | Rara vez | **Sí** |
| 🌑 **Me siento solo** | Estás aquí, pero no te siento | **Hacia nosotros** | Un poco | **Sí** |
| 😟 **Preocupado** | Algo me inquieta de lo que viene | Hacia el futuro | No | A veces |
| 😐 **Incómodo** | Algo no me cuadró. Aún no sé si es tema | **Hacia la situación** | Casi nunca | No |
| 😔 **Apenado** | La regué. Me da pena algo que **yo** hice | **Hacia mí** | No | Sí |
| 😠 **Enojado** | Algo que hiciste me molestó | **Hacia ti** | **Sí** | **Sí** |

> **"Te extraño" y "me siento solo" no son lo mismo, y confundirlas cuesta caro.**
> *Te extraño* es **distancia**: no estás, y me haces falta. Es cálido, no reprocha nada y no hay nada que reparar — se resuelve viéndonos.
> *Me siento solo* es **desconexión**: estás aquí y aun así no te siento. Duele más, lleva un reclamo dentro aunque no quiera ponerlo, y no se arregla con presencia física.
> Por eso una es un mensaje de presencia y la otra abre conversación (§3.2). Fusionarlas convertiría un *"te pienso"* en un *"me tienes abandonado"*.

#### M1.1.1 Las tres que se confunden

Enojado, incómodo y apenado describen malestares que en la práctica se mezclan, pero son estructuralmente distintos, y esa diferencia decide cómo los trata la app:

| | Apenado | Incómodo | Enojado |
|---|---|---|---|
| **Dirección** | Hacia mí | Hacia la situación | Hacia ti |
| **Quién hizo algo** | Yo | Nadie claramente | Tú |
| **Temperatura** | Tibia, hacia dentro | Baja, difusa | Alta, hacia fuera |
| **Qué pide** | Que me perdones | Que lo hablemos | Que lo repares |
| **Frase típica** | *"Perdón, estuvo mal lo que hice"* | *"No sé, algo me quedó raro"* | *"Me molestó que hicieras eso"* |
| **Riesgo si no se dice** | Distancia y culpa acumulada | **Se convierte en enojo** | Explota más grande |

**El incómodo es el enojo antes de ser enojo.** Es el estado que nadie comunica —*"no es para tanto"*, *"no quiero hacer drama"*— y precisamente por eso se acumula hasta reventar. Capturarlo a tiempo es la prevención más barata que puede ofrecer la app.

**El apenado es el único malestar que apunta a uno mismo**, y por eso es el único que desarma en lugar de tensar. Su dificultad no está en cómo se recibe, sino en el orgullo que cuesta escribirlo.

#### M1.1.2 Tres grupos, una pantalla

Nueve opciones sueltas se leen como un formulario y producen pereza; y una app que da pereza no se usa el día que hace falta. La solución **no** es reducir el vocabulario ni añadir pasos, sino agrupar por lo que cada familia pide:

| Grupo | Emociones | La pregunta implícita |
|---|---|---|
| **Estoy contigo** | Bien · Agradecido · Te extraño | *No hay nada que resolver* |
| **Me falta algo** | Triste · Me siento solo · Preocupado | *Necesito que estés* |
| **Algo pasó** | Incómodo · Enojado · Apenado | *Hay algo que hablar* |

**RF-1.1.3 Una sola pantalla.** Los tres grupos se muestran a la vez, separados por espacio y temperatura de color. **No hay dos pasos.** El ojo elige zona antes de leer palabras —eso es preatentivo y cuesta milisegundos— y solo lee las tres etiquetas del grupo correcto. Nunca se comparan nueve opciones entre sí.

**RF-1.1.4 Registrar cuesta un toque.** Un toque en la emoción y ya está registrado. Intensidad y mensaje son opcionales y aparecen **después**, no antes.

**RF-1.1.5 Intensidad progresiva.** No se pregunta. Al tocar la emoción se registra con intensidad media; si quiero matizar, el mismo botón se convierte en deslizador. Quien no lo toque nunca, no se entera de que existe.

**RF-1.1.6 Atajo "como ayer".** Si el último registro fue hace menos de 48 h, aparece arriba como opción de un toque: *"Igual que ayer"*. La mayoría de los días uno está más o menos igual, y esos días deben costar cero.

**RF-1.1.7 Orden estable.** Las emociones nunca se reordenan por frecuencia de uso. La memoria muscular vale más que la optimización, y un botón que se mueve obliga a leer otra vez.

> **Meta medible:** registrar *bien* debe costar **un toque y menos de tres segundos**. Si el caso más común no es trivial, el vocabulario rico no sirve de nada porque nadie llega a usarlo.

**RF-1.1.8 Vocabulario fijo y compartido.** No se personaliza: el valor está en que las dos personas usen las mismas palabras y signifiquen lo mismo.

**RF-1.1.9 Etiquetas concordadas en género.** *Agradecido/Agradecida*, *Me siento solo/sola*. Requiere un campo de **género gramatical** en el perfil (RF-0.4); los pronombres no bastan para la concordancia.

> *Nota de revisión: la antigua RF-1.1.1 pedía un deslizador de 1–5 siempre visible. Queda sustituida por RF-1.1.5 (intensidad progresiva): la escala sigue siendo de 1 a 5, pero no se pregunta — se registra en media y solo aparece si el usuario la busca.*

#### M1.2 Qué activa cada emoción

Regla simple, y la asimetría es deliberada:

| Mecanismo | Se activa en | Por qué |
|---|---|---|
| **Guardrails al escribir** (umbral §6.1, espejo §6.5) | **Solo enojo** | Única emoción cuyo mensaje puede herir a quien lo lee |
| **Acompañante de respuesta** (§10.3) | **Enojo · Triste · Me siento solo · Apenado** | Son los difíciles de contestar bien |
| **Cero fricción, prioridad de velocidad** | **Incómodo** | Ver abajo |
| Nada especial | Bien · Agradecido · Te extraño · Preocupado | Se escriben y se entregan sin ceremonia |

Un mensaje triste no necesita frenos —la tristeza rara vez hiere a quien la lee— pero sí es de los más difíciles de responder sin meter la pata. Por eso la ayuda va del lado de quien recibe, no del que escribe.

**RF-1.2.1 El incómodo nunca lleva fricción, y esto es deliberado.** Puede parecer que un malestar dirigido a la pareja debería pasar por el umbral, pero sería contraproducente: **si cuesta decir "me sentí incómodo", nadie lo dice.** Y la incomodidad callada es exactamente la materia prima del enojo grande de dentro de tres semanas. La app debe hacer **barato lo pequeño para evitar lo caro**. Enviar un *"algo me quedó raro"* debe ser lo más fácil que se puede hacer en toda la app.

**RF-1.2.2 Del incómodo al enojo, para mí solo.** Si registro *incómodo* cuatro o más veces en 30 días, la app me lo hace notar **a mí y solo a mí**: *"Últimamente algo te ha estado incomodando. ¿Quieres hablarlo?"* Nunca se le muestra a ella, nunca se acumula como historial visible, nunca se convierte en evidencia. Es autoconocimiento, no expediente (P1).

**RF-1.2 Necesidad explícita — como chip, nunca como pantalla.**

El borrador anterior la pedía en una pantalla propia, y alargaba el flujo lo suficiente como para dar pereza. **Se elimina ese paso.** Pero el dato no se pierde, porque es el más valioso de la app: **es la única fuente legítima sobre lo que alguien necesita**, y mientras exista, ninguna IA ni inferencia puede sustituirlo (§10.3.1).

Solución: vive **dentro del compositor del mensaje**, como una fila de chips bajo el texto. Cero pantallas nuevas, cero toques obligatorios:

```
  ┌───────────────────────────────┐
  │ Ayer viendo la peli sentí…    │
  └───────────────────────────────┘

  Necesito:  [escucha] [espacio] [distracción]
             [contacto] [soluciones] [no sé]
```

**RF-1.2.3** Totalmente opcional. Se puede enviar sin tocar ningún chip.
**RF-1.2.4 Viene preseleccionado según la emoción**, con el valor más frecuente, y se cambia con un toque si no acierta:

| Emoción | Chip por defecto |
|---|---|
| Triste · Me siento solo | escucha |
| Enojado · Incómodo | escucha |
| Preocupado | escucha |
| Apenado | *(ninguno)* |
| Bien · Agradecido · Te extraño | *(no se muestra)* |

**RF-1.2.5** Si no escribo mensaje, tampoco se pregunta. Sin texto no hay contexto que matizar.

**RF-1.3 Control de visibilidad por check-in.** Al registrar, elijo qué ve mi pareja:
- **Completo** — emoción + intensidad + nota + necesidad.
- **Solo el color** — sabe que no estoy bien, sin detalles.
- **Privado** — solo alimenta mis propias estadísticas y el motor de entrega; mi pareja no ve nada.

**RF-1.4 Aviso a la pareja.** Configurable por usuario: notificar a mi pareja *(a) siempre · (b) solo si la intensidad es ≥ 4 · (c) nunca*. Por defecto: (b).

**RF-1.5 Historial personal.** Vista de calendario con colores por día. Solo mío por defecto; puedo compartir la vista si quiero.

**RF-1.6** Múltiples check-ins por día permitidos. El más reciente es el "estado actual".

**RF-1.7** Sin recordatorios agresivos. Máximo un recordatorio suave al día, a una hora que yo elija, desactivable.

---

### M2 — El mensaje

#### 2.0 Un gesto, tres destinos

Tras elegir cómo estoy, la app ofrece dejarle algo. **Siempre opcional** — decir "estoy triste" sin escribir nada es un uso legítimo y completo de la app.

Lo que cambia no es el gesto, sino **cuándo llega**. **Tres botones, nada más:**

```
        ¿Cuándo le llega?

  [ Ahora ]  [ Cuando le sirva ]  [ Solo para mí ]
```

| Destino | Cuándo llega | Ella sabe que existe |
|---|---|---|
| **Ahora** | Inmediatamente | Sí |
| **Cuando le sirva** | La app elige el momento | No hasta entonces |
| **Solo para mí** | Nunca. Nadie lo lee | No |

**RF-2.0.3 "Cuando le sirva" no pregunta nada más.** La app decide el momento: cuando ella registre una emoción que este mensaje pueda acompañar, o en una fecha señalada. **Sin pantalla de disparadores, sin configurar condiciones, sin elegir emociones destino.** Escribir algo bonito no debe exigir rellenar un formulario.

**RF-2.0.4** Para quien quiera control, un enlace discreto — *"o elijo yo el momento"*— abre la configuración detallada (RF-2.2). Es una salida avanzada, nunca el camino por defecto.

**RF-2.0.5 El "en frío" desaparece como botón.** No hace falta: cuando escribo enojado y pulso *Ahora*, el umbral (§6.1) ya ofrece *"que lo lea en 1 h"* y *"decidir mañana"*, que es exactamente el buzón en frío. Aparece donde tiene sentido en lugar de ocupar sitio siempre.

#### 2.0.2 "Solo para mí": la lista de cosas por hablar

Todo lo que va a este destino forma una lista privada. Es el borrador de la relación: lo que aún no sé si decir.

**RF-2.0.6 El puente a decirlo cuesta un toque.** Cada apunte lleva un botón **"decirlo ahora"** que lo convierte en mensaje. Este es el mecanismo más importante de la lista, porque es literalmente el propósito de la app (§1.0): mover algo de *callado* a *hablado* sin tener que empezar de cero.

**RF-2.0.7 Nunca hay contador ni distintivo numérico.** Un badge con *"7 cosas por hablar"* es angustia pura y convierte la lista en una deuda. La lista no se anuncia: está ahí cuando la busco.

**RF-2.0.8 Resolver ≠ borrar.** Cuando algo deja de importar, un gesto lo **archiva** (*"ya lo hablamos"* / *"ya no importa"*). Sale de la vista, no desaparece.

**RF-2.0.9 Por qué archivar y no borrar:** releer dentro de seis meses qué me molestaba es de las cosas más útiles que puede dar la app — a veces descubro que ya no me molesta, y eso es una forma de ver que algo cambió. Pero tenerlo **a la vista** es acumular reproches pendientes. Archivar da las dos cosas: memoria sin presión.

**RF-2.0.10** El archivo es privado, consultable, y el borrado definitivo está disponible siempre en un toque más. Nada se conserva contra la voluntad de nadie (P8).

**RF-2.0.11 Sin caducidad automática.** La app no borra apuntes viejos ni pregunta *"¿esto sigue vigente?"*. Decidir eso es del usuario.

**RF-2.0.1** El destino se elige **después** de escribir, nunca antes. Elegir primero condiciona lo que escribes.
**RF-2.0.2** Un mensaje "para mí" puede convertirse en "ahora" más tarde. Nunca al revés: lo enviado no se vuelve privado.

#### 2.0.1 Qué destinos ofrece cada emoción

La emoción con la que escribo determina qué destinos tienen sentido. La app solo muestra los válidos:

| Escribo estando… | Ahora | Cuando le sirva | Solo para mí |
|---|:---:|:---:|:---:|
| 🌤 **Bien** | ✅ | ✅ | ✅ |
| 🙏 **Agradecido** | ✅ | ✅ | ✅ |
| 💭 **Te extraño** | ✅ | ✅ | ✅ |
| 😢 **Triste** | ✅ | — | ✅ |
| 🌑 **Me siento solo** | ✅ | — | ✅ |
| 😟 **Preocupado** | ✅ | — | ✅ |
| 😐 **Incómodo** | ✅ *(sin fricción, RF-1.2.1)* | — | ✅ |
| 😔 **Apenado** | ✅ | — | ✅ |
| 😠 **Enojado** | ⚠️ *(pasa por el umbral, §6.1)* | — | ✅ |

El razonamiento detrás de cada hueco:

- **"Cuando le sirva" solo desde las tres emociones cálidas.** Un mensaje escrito desde la tristeza y entregado cuando ella esté triste no consuela: duplica la tristeza. Y guardar algo escrito con enojo "para cuando ella esté mal" sería una emboscada. Guardar es un acto de abundancia: solo se guarda desde donde sobra. *Te extraño* califica porque es cariño, no carencia dirigida.
- **Esperar solo tiene sentido en el enojo**, y por eso no es un destino: vive dentro del umbral (RF-2.0.5). Es la única emoción cuyo mensaje puede herir, y por tanto la única donde poner tiempo de por medio protege a alguien.
- **Apenado va siempre inmediato.** Una disculpa retenida deja de ser una disculpa. Aquí el retraso hace daño en vez de evitarlo.
- **Incómodo va inmediato y sin fricción.** Retenerlo lo deja crecer, que es justo lo que queremos evitar.
- **Solo para mí, siempre.** Cualquier emoción merece poder escribirse sin destinatario.

**RF-2.1 Composición.** Tipos soportados:
- Texto (con formato ligero: negritas, saltos)
- Nota de voz (hasta 3 min) — el más potente emocionalmente
- Foto con pie de texto
- Canción (enlace + dedicatoria)
- Video corto (hasta 60 s)

**RF-2.2 Disparadores del mensaje guardado.** Si elijo el destino *guardado*, defino cuándo debe llegar:

| Disparador | Descripción |
|---|---|
| `emoción` | Cuando ella registre *triste*, *enojada*, *preocupada* o *apenada*. Se puede elegir más de una |
| `intensidad` | Combinable con el anterior: "solo si es ≥ 4" |
| `fecha` | Un día concreto (aniversario, cumpleaños, un examen importante) |
| `recurrente` | Cada año en la misma fecha |
| `a petición` | Solo si ella pulsa "necesito algo tuyo" |
| `aleatorio` | Un día cualquiera dentro de un rango, como sorpresa |

**RF-2.2.1** Por defecto se preselecciona `emoción: triste` — el caso más común. Escribir un mensaje guardado no debería exigir configurar nada.

**RF-2.3 Reglas de entrega de los guardados** (ver detalle en §M3).

**RF-2.4 Gestión.** Vista de "lo que le he escrito", con tres pestañas:
- **Guardados** — esperando su momento. Editables y eliminables.
- **Entregados** — con su estado (visto / no visto) y la respuesta recibida.
- **Míos** — los de destino "para mí".

**RF-2.5 Inventario visible.** Panel que muestra cuántos mensajes guardados tengo por emoción destino: *"Triste: 4 · Preocupada: 1 · Enojada: 0"*. Es un inventario, no un marcador: solo lo ve su autor, y nunca genera alertas de culpa.

**RF-2.6 Aviso de inventario bajo.** Si ella ha registrado una emoción dos veces en la última semana y no queda nada guardado para eso, me llega un aviso discreto: *"Cata ha estado preocupada últimamente y no queda nada guardado para eso."* Ella nunca lo ve.

**RF-2.7 Mensaje de reserva.** Cada persona debería mantener al menos uno sin disparador específico, marcado como "para cualquier mal momento". El sistema lo usa si no hay nada más que entregar.

❓ *Decisión abierta:* ¿un mensaje guardado se consume al entregarse, o puede volver a entregarse? Propuesta: se consume, con opción de marcarlo *reutilizable* + cooldown de 60 días, para esas cartas que valen la pena releer.

---

### M3 — Enterarse y responder

Los pasos 3 y 4 del bucle. Aquí se juega si la app se siente cálida o invasiva.

#### 3.0 El aviso

Cuando ella registra cómo está, a mí me llega un aviso. Esto es lo que convierte la app en presencia en lugar de un diario.

**RF-3.0.1 Contenido del aviso.** Cómo está, y si me dejó algo:

> *"Cata está triste. Te dejó un mensaje."*
> *"Cata está agradecida."*

**RF-3.0.2 La ausencia nunca se enuncia.** Si no dejó mensaje, el aviso simplemente no lo menciona. **Nunca** se escribe *"no te dejó nada"*: convierte un silencio en un reproche.

**RF-3.0.3 Respeta la visibilidad elegida** (RF-1.3). Si registró en modo "solo el color", el aviso dice *"Cata no está bien"* sin más detalle.

**RF-3.0.4 Frecuencia** según RF-1.4: siempre, solo si intensidad ≥ 4, o nunca. Por defecto, solo si ≥ 4.

**RF-3.0.5 Nunca contenido en la vista previa.** *"Te dejó un mensaje"*, jamás el texto (RF-4.4).

**RF-3.0.6 Si está mal y no dejó mensaje**, al abrir la app se me ofrece tomar la iniciativa, con opciones de un toque:

```
        Cata está triste.

  [ Escribirle ]  [ Enviarle algo guardado ]  [ Solo estar ]
```

*"Solo estar"* no hace nada visible: registra que lo vi y me lo recuerda más tarde. A veces la respuesta correcta no es un mensaje, y la app no debe empujarme a producir uno.

#### 3.0.7 El amortiguador: cómo estoy yo también cuenta

Hasta aquí el motor solo miraba el estado de **quien recibe** para decidir qué mensajes guardados entregar. Falta lo inverso y es igual de importante: **un mensaje difícil no debe caer encima de alguien que está mal.**

**RF-3.0.7** Si tengo un mensaje de *conversación* esperando y mi último check-in es una emoción desagradable con intensidad ≥ 3, la app **amortigua la presentación**:

```
        Cata te escribió.

  Antes de abrirlo — algo que te dejó ella:

  ┌───────────────────────────────┐
  │ "Me acordé de cuando nos      │
  │  quedamos sin gasolina y      │
  │  terminamos riéndonos en la   │
  │  carretera. Te amo."          │
  │                    — 12 marzo │
  └───────────────────────────────┘


  [ Ahora sí, ábrelo ]   [ Un rato más ]
```

**RF-3.0.7.1 Amortigua, no retiene.** El mensaje ya llegó y está a un toque. La app no lo esconde ni miente: pone algo cálido *de ella* delante, para que yo lo lea con la persona completa en la cabeza y no solo con el reclamo.

**RF-3.0.7.2 El amortiguador siempre viene de ella.** Un mensaje guardado suyo (RF-2.2), o uno del cofre que yo guardé (RF-3.11.2). **Nunca** una frase escrita por la app ni por la IA. Si no hay nada de ella disponible, no hay amortiguador: se muestra el mensaje directamente. *(Ver P5: lo genérico no consuela.)*

**RF-3.0.7.3 Tope de 3 horas.** *"Un rato más"* pospone como máximo tres horas, y luego el mensaje se presenta sin amortiguador. Retener indefinidamente convierte la protección en evasión, y a ella la deja colgada.

**RF-3.0.7.4 Ella nunca sabe que hubo amortiguador.** Ni que lo pospuse. Solo verá *visto* cuando efectivamente lo abra.

**RF-3.0.7.5 Nunca al revés.** Si estoy **bien**, no se amortigua nada. Y jamás se retrasa un mensaje de *presencia*: lo bueno llega siempre y de inmediato.

**RF-3.0.7.6 Solo aplica al grupo "Me falta algo".** El amortiguador **no** se activa en el grupo *"Algo pasó"*, y por razones distintas en cada caso:

| Mi estado | ¿Amortiguar? | Por qué |
|---|---|---|
| 😢 Triste · 🌑 Me siento solo · 😟 Preocupado | ✅ **Sí** | Es carencia. Algo cálido de ella llena justo lo que falta |
| 😠 Enojado | ❌ No | En el pico del enojo el cariño **invalida** (RF-3.0.8) |
| 😔 Apenado | ❌ No | Ver cariño de la persona a la que fallaste **aumenta la culpa**, no la alivia |
| 😐 Incómodo | ❌ No | Intensidad demasiado baja; amortiguar sería inflar algo pequeño |

> Los tres grupos de §M1.1.2 dejan de ser solo una ayuda visual: **"Me falta algo" es exactamente el conjunto que se consuela con presencia**, y "Algo pasó" el que se resuelve hablando. El agrupamiento resultó ser funcional, no cosmético.

#### 3.0.7.7 Los estados caducan

**RF-3.0.7.7** Un check-in de más de **8 horas** no gobierna nada. Antes de decidir amortiguadores, entregas o avisos, la app vuelve a preguntar cómo estoy.

Sin esta regla, el William de las 8:30 sería tratado como el de las 23:12 — y nueve horas y una noche de sueño después, esa suposición está casi siempre equivocada. **Preguntar primero es más barato que acertar por inercia.**

**RF-3.0.7.8** La pregunta de la mañana antecede a todo. Ningún mensaje pendiente se muestra antes de saber cómo amanecí.

> **La idea, en una frase:** la app no me protege de mi pareja. Me da un segundo para acordarme de quién es antes de leerla en su peor momento.

#### 3.0.8 Los dos enojados a la vez

El caso más peligroso de la app, y el único donde **el amortiguador debe desactivarse**.

**RF-3.0.8 Excepción al amortiguador.** Si mi último check-in es *enojado* y el mensaje entrante también viene de *enojo*, **no se muestra ningún mensaje cálido de ella**. Ponerle a alguien enojado un *"te amo, ¿recuerdas?"* delante se siente invalidante y hasta manipulador — *"qué bonito era todo, ¿no?"*. Es el mismo principio que RF-3.4: en el pico del enojo, el cariño no consuela, irrita.

**RF-3.0.9 Lo que sí se muestra:** el hecho, y una elección.

```
        Los dos están enojados.

     Cata te escribió hace un momento.


  [ Leerlo ahora ]   [ Mañana por la mañana ]
```

**RF-3.0.10 Nombrar que ambos están mal es la única ayuda real aquí.** Cambia el marco de *"me atacó"* a *"esto nos pasó a los dos"*, y hace que lea su mensaje como el de alguien que también está pasándola mal, no como una agresión gratuita. No es interpretación: es un dato que **ella** registró (§10.3.1).

**RF-3.0.11 Tope ampliado a la mañana siguiente.** En enojo mutuo, *"mañana por la mañana"* es una opción legítima y no se fuerza antes. Dormir es la intervención más eficaz que existe para esto, y ninguna función de la app la supera.

**RF-3.0.12 Simetría obligatoria.** Ella ve mi estado igual que yo veo el suyo, sin retraso. Un desbalance de información en este momento sería lo más injusto que podría hacer la app.

> ⚠️ **Riesgo asumido, que conviene tener escrito:** saber que la otra persona está enojada puede usarse como arma — *"estás alterada, no puedes razonar"*. La app no puede impedirlo, y el riesgo existe desde el momento en que se comparten estados. Se acepta porque el marco compartido evita más daño del que habilita; pero es la razón por la que la app **nunca** añade lecturas sobre ese estado (nada de *"está muy alterada"*, *"está sensible"*). Solo el dato que ella escribió.

#### 3.0.13 Estados de entrega: hechos, nunca promesas

**Se descarta la casilla *"avisarle que lo leerás"*.** Es una promesa de una acción futura, y una promesa incumplida deja a quien escribió con **dos** heridas en lugar de una: el silencio original más el compromiso roto. Nunca conviene ofrecer un botón cuyo mejor caso ahorra poco y cuyo peor caso empeora todo.

En su lugar, tres estados **automáticos**, que son hechos verificables y no requieren que nadie prometa nada:

| Señal que ve quien escribió | Qué significa | Quién la genera |
|---|---|---|
| **Enviado** | Salió de mi dispositivo | Sistema |
| **Le llegó** | Está en su teléfono, sin abrir | Sistema |
| **Visto** | Lo abrió | Sistema, al abrir |
| *"Lo leyó. Necesita un rato"* | Lo abrió y avisó que no puede responder ahora | La persona, un toque (RF-3.17) |

**RF-3.0.13** *"Le llegó"* hace por sí solo casi todo el trabajo. La angustia de quien manda algo difícil no es *"no me ha contestado"*, es *"no sé si le llegó, si lo ignoró o si le dio igual"*. Saber que llegó y no se ha abierto responde eso **sin comprometer a nadie a nada**.

**RF-3.0.13.1** Ningún estado lleva marca de tiempo relativa (*"hace 3 h"*). El dato es binario; la cuenta atrás genera ansiedad.

**RF-3.0.13.2** Único acuse voluntario que existe: RF-3.17, y solo **después** de haber leído. Describe un estado presente (*necesito un rato*), no una intención futura.

#### 3.0.15 El motor completo, en una matriz

**No se define un flujo por escenario.** La combinatoria es inabordable (9 emociones × 3 destinos × 3 estados del receptor) y además innecesaria: todo el comportamiento simulado se deriva de **tres preguntas** y una tabla de seis celdas.

##### Las tres preguntas

| # | Pregunta | Decide |
|---|---|---|
| **1** | ¿En qué grupo está la emoción de **quien escribe**? | Si hay guardrails al enviar |
| **2** | ¿En qué grupo está la emoción de **quien recibe**? | Cómo se presenta el mensaje |
| **3** | ¿Hace más de 8 h del último check-in del receptor? | Si hay que preguntar antes de decidir |

##### Pregunta 1 → al enviar

| Grupo del emisor | Qué pasa al pulsar *Ahora* |
|---|---|
| **Estoy contigo** | Sale directo |
| **Me falta algo** | Sale directo |
| **Algo pasó** — incómodo, apenado | Sale directo *(RF-1.2.1: barato lo pequeño)* |
| **Algo pasó** — enojado | Pasa por el umbral (§6.1) |

Una sola excepción en toda la tabla. El resto sale sin fricción.

##### Pregunta 2 → al recibir

| Estado del receptor ↓ / Mensaje entrante → | **Presencia** | **Conversación** |
|---|---|---|
| **Bien / sin estado reciente** | Directo | Directo |
| **Me falta algo** | Directo | **Amortigua** (RF-3.0.7) |
| **Algo pasó** | Directo | **Nombra el hecho + elección** (RF-3.0.9) |

Seis celdas. Eso es el motor entero. Los mensajes de presencia **nunca** se modulan: lo bueno llega siempre y de inmediato.

##### Por qué esto basta

Un caso que no simulamos —*ella preocupada, yo triste*— no necesita reglas nuevas: fila *Me falta algo* × columna *Conversación* → amortigua. Y *ella agradecida, yo enojado* → fila *Algo pasó* × columna *Presencia* → directo. **Cada escenario futuro cae en una celda existente.**

Cuando un caso nuevo no encaje, la corrección va en la matriz —no en un flujo aparte— y arregla de golpe toda su familia. Así se descubrieron D21 y D23: no eran excepciones, eran celdas mal rellenadas.

#### 3.1 Reglas de entrega de mensajes guardados

**RF-3.1** Al registrarse un check-in, el motor busca mensajes guardados cuyo disparador coincida, ordenados por: (1) especificidad del disparador, (2) antigüedad.

**RF-3.2 Límite diario.** Máximo **1 mensaje guardado entregado por día** por persona, salvo entrega por petición explícita. La escasez preserva el valor. *(No aplica a los mensajes enviados "ahora": esos llegan siempre.)*

**RF-3.3 Cooldown.** Tras una entrega, mínimo 12 h antes de la siguiente entrega automática.

**RF-3.4 Regla del enojo (crítica).** Si el estado registrado es **enojado** con intensidad ≥ 3, la app **no notifica ni muestra el mensaje guardado automáticamente**. En su lugar muestra un botón discreto: *"Hay algo que te dejé. ¿Quieres leerlo?"*. Un mensaje de amor empujado en el pico de una discusión se lee como invalidación. Que la persona elija. *(Es la misma lógica que RF-3.0.8; ambas se derivan de la celda "Algo pasó" de §3.0.15.)*

**RF-3.5 Modo crisis.** Si la intensidad es 5 en una emoción desagradable, la app no entrega nada automáticamente. Muestra únicamente: opciones de respiración/pausa, el botón "necesito algo tuyo", y (configurable) el aviso a la pareja. Nada más.

**RF-3.6 Fallback.** Si no hay mensajes guardados para el estado registrado, el sistema ofrece, en orden:

1. **Un mensaje que ella misma guardó en el cofre** (RF-3.11.2) — la mejor opción, porque ella ya marcó que le importaba
2. Un mensaje de reserva (RF-2.7)
3. Un recuerdo del calendario (*"hace un año hicimos esto"*)
4. Una foto del álbum compartido
5. **Nada**

**"Nada" es una opción legítima y frecuente.** No se rellena con contenido genérico ni con frases motivacionales. Si no hay nada que dar, la app calla.

**RF-3.7 Botón "necesito algo tuyo".** Disponible siempre desde la pantalla principal. Entrega inmediata del mejor mensaje guardado disponible, saltando el límite diario. Notifica a la pareja de que se usó (configurable).

**RF-3.8 Persistencia.** Si un mensaje guardado fue entregado pero no visto en 6 h, se reenvía una notificación. Máximo dos recordatorios; después queda esperando en el cofre sin insistir.

**RF-3.12** *(Numeración reservada: el antiguo RF-3.12 —"toda cápsula entregada queda accesible en un archivo"— se movió a RF-3.11, El cofre.)*

#### 3.2 Dos clases de mensaje

No todos los mensajes piden lo mismo de vuelta. Distinguirlo simplifica la app y la vuelve mucho más suave:

| | **Presencia** | **Conversación** |
|---|---|---|
| Emociones | Bien · Agradecido · Te extraño, y **todos los guardados** | Triste · Me siento solo · Preocupado · Incómodo · Apenado · Enojado |
| Qué son | *"Estoy aquí y te quiero"* | *"Me pasa algo y te necesito"* |
| ¿Esperan respuesta? | **No** | Sí |
| Qué ve el emisor | Visto · Guardado | Visto · la respuesta |
| ¿Recordatorio si no hay respuesta? | Nunca | Uno, a las 24 h |
| ¿Acompañante (§10.3)? | No | Sí |

Un mensaje de presencia no es una pregunta esperando contestación. Está ahí para que ella recuerde cuánto la quiero **cuando tenga el ánimo de leerlo**, y para que lo conserve para cuando más lo necesite. Tratarlo como algo que exige respuesta lo convierte en una deuda, y una deuda no consuela a nadie.

> **Nota sobre el incómodo:** es barato de **enviar** (RF-1.2.1) pero pertenece a *conversación*, no a *presencia*. Si no esperara respuesta podría ignorarse sin coste, y una incomodidad ignorada es precisamente la que se acumula hasta volverse enojo. Sí genera recordatorio; no abre acompañante, porque responder *"tienes razón, ¿qué pasó?"* no tiene dificultad.

#### 3.2.1 Acuse de recibo: solo dos señales

**RF-3.9** El emisor de un mensaje de presencia ve exactamente dos cosas:

1. **Visto** — hecho neutro, sin hora exacta ni "visto hace 3 h".
2. **Guardado** — ella pulsó guardar. Voluntario.

**Nada más. No existe ninguna escala de reacción.**

> **Por qué se eliminó "cómo me llegó".** El borrador anterior ofrecía valorar el mensaje recibido (*me ayudó · no era el momento · no sé qué decir*). Es un dato juzgable y se degrada solo: con el tiempo produce un marcador de qué tan bien acierto con mis mensajes, me empuja a escribir buscando aprobación, y un *"no era el momento"* se convierte en material de reclamo. Viola P1 y P6. **No hay forma de arreglarlo; se retira.**

**RF-3.9.1 La señal solo puede ser positiva o ausente.** *Guardado* existe; *"no guardado"* no se muestra, no se cuenta y no se menciona jamás. Igual que RF-3.0.2: la ausencia nunca se enuncia.

**RF-3.9.2** Guardar es privado en su intención y visible solo como hecho: yo veo que lo guardó, nunca por qué ni qué escribió al respecto.

**RF-3.10** En los mensajes de conversación, el emisor ve la respuesta cuando llega. No hay acuse intermedio más allá de *visto*.

#### 3.2.2 El cofre

**RF-3.11** Todo mensaje recibido queda guardado permanentemente en un archivo personal, con dos vistas: **todos** y **guardados**.

**RF-3.11.1** Buscable por texto y filtrable por emoción y fecha.

**RF-3.11.2** Los mensajes que **ella** guardó son la mejor materia prima que existe para un mal momento: son, por definición, los que a ella le importaron. El motor los usa como primera opción del fallback (RF-3.6), presentados sin ceremonia:

> *"Esto lo guardaste en marzo."*

Ninguna inferencia, ninguna IA: ella misma marcó que le importaba.

**RF-3.11.3** Un mensaje del cofre se puede abrir siempre, por iniciativa propia, sin esperar a que la app lo ofrezca.

#### 3.3 El momento entre leer y responder

Cuando el mensaje viene de **enojo, tristeza, soledad o pena** (las cuatro de M1.2), responder bien es difícil y responder rápido suele ser peor. Aquí es donde la app pone su ayuda — **del lado de quien recibe**, no de quien escribió.

**RF-3.13 Pausa ofrecida.** Al abrir un mensaje de esas cuatro emociones, la caja de respuesta **no aparece inmediatamente**. Primero está el mensaje, solo, con espacio alrededor. Debajo, tres opciones:

```
     [ Responder ]   [ Ayúdame a responder ]   [ Ahora no puedo ]
```

**RF-3.14** *"Ahora no puedo"* le avisa a ella que lo leí y que necesito un rato. Es infinitamente mejor que el visto sin respuesta, que es de las cosas que más duelen.

**RF-3.15** *"Ayúdame a responder"* abre el acompañante (§10.3). Es siempre opcional y nunca automático.

**RF-3.16** Si no respondo en 24 h, un único recordatorio suave. Uno, no más. **Solo en mensajes de conversación** — un mensaje de presencia jamás genera recordatorio, porque no espera nada.

#### 3.4 Si lo leo y cierro sin responder

El *visto sin respuesta* es de las cosas que más duelen, y no se arregla ocultando el visto: mentir sobre eso es peor. Se arregla haciendo **barato avisar**.

**RF-3.17** Al salir de un mensaje de conversación sin haber respondido, una sola pregunta, un toque, sin insistencia:

```
   ¿Le aviso que lo leíste y necesitas un rato?

        [ Sí ]              [ No ]
```

**RF-3.17.1** Si digo **sí** → a ella le llega *"William lo leyó. Necesita un rato."* Es información, no promesa.
**RF-3.17.2** Si digo **no** → ella ve *visto*, sin más. La app no inventa excusas por mí.
**RF-3.17.3** La pregunta aparece **una sola vez por mensaje**. Si vuelvo a abrir y cerrar, no reaparece.
**RF-3.17.4** No hay opción de ocultar el *visto*. La transparencia sobre hechos es innegociable; lo que la app puede hacer es darme una forma fácil de acompañarlo.

#### 3.5 Cómo me hizo sentir

Separar *lo que siento* de *lo que digo* es comunicación emocional básica, y hasta ahora el documento solo permitía lo segundo.

**RF-3.18** Al redactar una respuesta, puedo adjuntar mi propio estado, **usando el mismo vocabulario de las nueve emociones** (RF-1.1). No es una escala nueva ni una valoración del mensaje que recibí:

```
  Tu respuesta a Cata

  ┌───────────────────────────────┐
  │ …                             │
  └───────────────────────────────┘

  Y de paso, cómo me dejó:  (opcional)
   😔 Apenado   😐 Incómodo   😢 Triste
   🙏 Agradecido   ⋯ ver todas
```

> ⚠️ **Esto NO reintroduce lo que eliminamos en D8.** La diferencia es de sujeto:
> — ❌ *"tu mensaje fue: útil / inoportuno"* → puntúa **su** mensaje. Genera marcador, se vuelve reclamo.
> — ✅ *"me dejó apenado"* → describe **mi** estado. Es autoexpresión, no evaluación.
> Lo primero mide a otro; lo segundo se abre uno mismo. Por eso reutiliza el vocabulario existente: si necesitara una escala propia, sería una métrica disfrazada.

**RF-3.18.1** Opcional. Se puede responder sin adjuntar nada.
**RF-3.18.2** Se registra también como check-in mío, evitando pedirme lo mismo dos veces.
**RF-3.18.3** Se muestra junto a la respuesta, con menos peso visual que el texto. El mensaje manda.

#### 3.6 Cerrar el hilo

**RF-3.19** Al leer una respuesta, un renglón de opciones de un toque:

```
   Gracias 💛    Te quiero    Quisiera hablarlo un poco más    Hablamos luego
```

**RF-3.19.1 *"Quisiera hablarlo un poco más"* es la más importante.** Sin ella, la única alternativa a aceptar una respuesta insuficiente es el silencio — y el silencio se interpreta como conformidad. Reabre el hilo sin acusar a nadie y sin escribir un mensaje entero.

**RF-3.19.2** Son **contenido mío**, no valoración del mensaje ajeno. No hay escala, no hay ausencia visible, no se cuentan.

**RF-3.19.3 No existe "marcar como resuelto".** Es lenguaje de tickets y rompería P10. Un hilo se apaga cuando deja de haber qué decir.

#### 3.7 Leer antes de escribir

**RF-3.20** Si tengo un mensaje sin leer de ella y voy a escribirle, la app **muestra primero el pendiente**. No es un bloqueo (P9 lo prohíbe): es orden.

**RF-3.20.1 El caso que lo justifica es la disculpa.** Amanecer *apenado* y escribir *"perdón por lo de ayer"* **sin haber leído** lo que ella escribió produce una disculpa genérica — y una disculpa genérica hace más daño que el silencio, porque demuestra que la reparación importaba más que la persona. *"Ni siquiera leíste lo que te escribí"* es una frase que se dice mucho, y con razón.

**RF-3.20.2** Se puede saltar. El botón *"escribir de todos modos"* existe, discreto y sin advertencia.

**RF-3.20.3** No aplica a mensajes de *presencia*: mandar un *te quiero* nunca requiere haber leído nada antes.

---

### M4 — Notificaciones

**RF-4.1** Web Push (VAPID). Tipos: mensaje recibido, ánimo de la pareja (según RF-1.4), pregunta periódica (RF-1.0), evento del calendario, dedicatoria musical, petición de ayuda.

**RF-4.1.1 Atenuación por estado del receptor.** Si quien va a recibir la notificación está en el grupo *"Algo pasó"*, la vista previa se reduce al mínimo: *"Cata te escribió."*, sin la emoción. Un *"Cata está enojada"* en la pantalla de bloqueo a las 23:00 es una bomba; el detalle puede esperar a que abra la app.
**RF-4.2** Cada tipo se activa/desactiva por separado.
**RF-4.3** Horario de silencio configurable (por defecto 23:00–08:00). Las entregas se acumulan y esperan.
**RF-4.4** Ninguna notificación revela contenido sensible en la vista previa. *"Cata te dejó algo"*, nunca el texto.

> ⚠️ **Restricción técnica crítica:** en iOS, Web Push solo funciona si la PWA está **instalada en la pantalla de inicio** (Safari 16.4+). El onboarding debe guiar explícitamente ese paso, y la app debe detectar y avisar si no está instalada.

---

### M5 — Ciclo menstrual

Aquí hay que tener cuidado. La intención (*"saber cuándo está más sensible para acompañarla mejor"*) es buena, pero el diseño ingenuo produce el efecto contrario: reducir emociones legítimas a hormonas ("¿estás así por la regla?") es una de las formas más rápidas de invalidar a alguien.

**El diseño que propongo invierte la dirección:** la app no le dice a él cómo está ella. Ella le dice qué necesita.

**RF-5.0 El módulo se enciende a mano, y solo lo enciende quien lo va a usar.** Es un interruptor propio en «Yo», apagado de partida.

Deducirlo del género gramatical del perfil sería un error de categoría: ese campo existe para escribir «agradecido» o «agradecida», y no dice nada sobre el cuerpo de nadie. La app no adivina quién menstrúa — sería la misma clase de inferencia que RF-5.3 prohíbe, solo que aplicada un paso antes.

Apagarlo no borra lo registrado: vuelve intacto al encenderlo. Mientras esté apagado, la pareja no ve nada.

**RF-5.1** Registro de días de periodo, con síntomas opcionales (dolor, energía, sueño, antojos). **Los síntomas no se comparten nunca**, ni con el nivel más abierto de RF-5.3: son para mirar el propio historial. Dárselos a la pareja convertiría el módulo en un panel desde el que deducir cómo está ella — exactamente lo que M5 evita.
**RF-5.2** Predicción de próximo ciclo basada en el historial. Etiquetada siempre como *estimación*. Se descartan las separaciones imposibles (menos de 15 días o más de 60) antes de promediar: una fecha mal tecleada no puede arrastrar toda la media. Con menos de dos registros no se dice nada.
**RF-5.3 Control total de la titular.** Ella elige qué comparte, con tres niveles:
- Nada.
- Solo las fechas previstas.
- Fechas + la nota que ella escriba para cada fase.

**RF-5.4 Notas por fase.** Ella puede escribir, una vez, qué le sirve en cada fase. Ejemplo: *"Días 1–3: no me preguntes si estoy bien, solo tráeme té y pon una película."* Esto es lo que él ve, en lugar de una etiqueta de "sensible".
**RF-5.5** El calendario del vínculo puede mostrar una marca discreta en los días previstos, si ella lo autoriza.
**RF-5.6** La app **nunca** correlaciona automáticamente estado de ánimo con fase del ciclo ni se lo muestra a la pareja. Si ella quiere ver esa correlación para sí misma, es una vista privada opcional.
**RF-5.7** Los datos de ciclo son los más sensibles de la app: cifrados y excluidos de cualquier exportación o análisis por IA salvo consentimiento explícito.

---

### M6 — Escribir en caliente

Este módulo es donde la app puede hacer más bien y más daño. Un guardrail mal diseñado se siente como censura: *te obliga a escribir lo que debes, no lo que sientes*. El diseño de abajo resuelve esa tensión con una regla (P9) y tres mecanismos.

#### 6.0 Desahogarse ≠ comunicarse

> **Nota de revisión:** este apartado describía "tres puertas" propias del módulo. Quedó **absorbido por los tres destinos de §2.0** (*Ahora · Cuando le sirva · Solo para mí*), que son los mismos botones para todas las emociones. No hay un flujo especial para escribir enojado: hay los mismos tres destinos, y una pantalla extra al enviar (§6.1). Se conserva aquí el principio, que sigue siendo la mitad de la solución.

Separar **desahogarme** de **comunicarme** resuelve por sí solo la mitad del problema de invasividad. Cuando lo que quiero es gritar, gritar está bien y no necesita revisión de nadie. El espejo solo tiene sentido cuando **yo mismo** he declarado que quiero que el mensaje llegue bien — es decir, cuando elijo *Ahora* y no *Solo para mí*.

**RF-6.0** El destino *Solo para mí* no pasa por ningún análisis, no lo toca la IA, y nunca es visible para la pareja (§2.0.2).

#### 6.1 La pantalla del umbral

Se muestra **solo** al pulsar enviar en la puerta "ahora", **solo** si el check-in reciente es de intensidad ≥ 4 en una emoción desagradable. No aparece en ningún otro caso, y nunca dos veces para el mismo mensaje.

No juzga el contenido. No dice "tu mensaje es hiriente". Enuncia un hecho y abre el abanico:

```
                  Escribiste esto enojado.

        [ Enviar ahora ]   [ Que lo lea en 1 h ]   [ Decidir mañana ]
```

**RF-6.1.1** Las tres opciones tienen el mismo peso visual. Ninguna es "la recomendada".
**RF-6.1.2** No hay texto persuasivo, ni advertencias, ni "¿estás seguro?". Una frase declarativa y tres botones.
**RF-6.1.3** *"Enviar ahora"* no dice "enviar de todas formas". Cualquier redacción que sugiera desobediencia convierte la app en autoridad moral.
**RF-6.1.4** El estado del check-in ya está registrado; la pantalla no pregunta nada nuevo.
**RF-6.1.5** Desactivable por completo en ajustes.

**El razonamiento:** cuando estás enojado, la opción "esperar una hora" **no existe en tu cabeza**. No es que la descartes: no aparece. La app no te obliga a nada — solo hace visible una alternativa que el enojo te está ocultando. Eso no es censura, es ampliar el campo de elección. Y "una hora" está calculado: lo bastante corto para no sentirse castigo, lo bastante largo para que baje el pico.

#### 6.2 Marcar el tono a propósito

A veces la aspereza **es** el mensaje. Un texto demasiado pulido puede leerse como frío o pasivo-agresivo, y obligar a alguien a fingir calma es su propia forma de daño.

**RF-6.2.1** Al enviar, opción de marcar el mensaje: *"Estoy enojado y quiero que se note."*
**RF-6.2.2** Ella lo recibe con ese contexto explícito: *"Te escribió esto enojado, y quiso que lo supieras."*
**RF-6.2.3** Es opcional y no cambia el texto.

Esto invierte el planteamiento: en lugar de suavizar el mensaje, **se contextualiza para quien lo recibe**. Buena parte del daño de un mensaje duro no está en cómo se escribió, sino en que llega sin marco. Un mensaje etiquetado protege a los dos: ella sabe cómo leerlo, él no tiene que disfrazarse de sereno.

#### 6.3 Buzón en frío

**RF-6.3.1** El mensaje queda retenido N horas (por defecto 12, configurable 1–48). No se envía, y ella no sabe que existe.
**RF-6.3.2** Al cumplirse el plazo: *"Escribiste esto ayer. ¿Qué quieres hacer?"* → **Enviarlo · Editarlo · Dejarlo ir**.
**RF-6.3.3** Las tres opciones son válidas y equivalentes. *"Dejarlo ir"* lo archiva en mi espacio privado. A veces escribirlo ya era el punto.
**RF-6.3.4** El espejo está disponible al revisar en frío, y es aquí donde de verdad sirve: en frío **yo mismo** quiero editarlo. La edición nace de mí, no de la app.

**Esta es la clave de todo el módulo:** el buzón en frío es el guardrail real, y bloquea por **tiempo**, no por contenido. El espejo nunca bloquea nada; solo informa.

#### 6.4 Retirada

**RF-6.4.1** Ventana de 2 minutos para retirar un mensaje recién enviado, siempre que no haya sido abierto.
**RF-6.4.2** Si ya fue abierto, no se puede retirar. Puede eliminarse, pero deja rastro visible: *"Mensaje eliminado"*. Nunca reescribir la historia en silencio.

#### 6.5 El espejo, redactado desde tu lado

Detalle pequeño con consecuencias grandes: el botón **no** se llama *"revisar si es apropiado"*. Se llama:

> **¿Va a llegar como quiero?**

Uno te corrige; el otro te ayuda a conseguir lo que buscas. Y es literalmente cierto: cuando escribes enojado, tu objetivo real casi nunca es herir — es que te entienda. El espejo se posiciona como aliado de **tu** objetivo, no como censor de tu forma.

**RF-6.5.1** El espejo nunca se ejecuta solo. Requiere pulsación.
**RF-6.5.2** Si el usuario lo ignora tres veces seguidas, el botón se vuelve más discreto. Insistir es faltar al respeto.
**RF-6.5.3** La pareja **nunca** sabe que el espejo intervino, ni que hubo un borrador anterior. El mensaje enviado es el mensaje. Revelar el proceso sería tóxico.

#### 6.6 Registro de conflicto

Formato guiado, basado en Comunicación No Violenta, con cuatro campos:
1. **Qué pasó** (hechos observables, sin interpretación)
2. **Qué sentí**
3. **Qué necesitaba**
4. **Qué haría distinto**

**RF-6.6.1** Se comparte solo cuando yo decida. La pareja puede responder con el mismo formato.

#### 6.7 Acuerdos

**RF-6.7.1** Tras un conflicto, poder registrar un acuerdo breve ("cuando uno diga 'pausa', paramos 20 minutos"). Lista consultable, editable por ambos.

#### 6.8 Reparación

**RF-6.8.1** Botón simple para iniciar una reconciliación: elegir entre *"quiero hablar"*, *"necesito más tiempo"*, *"lo siento"*, *"estoy bien, ya pasó"*. Elimina la fricción del primer paso, que suele ser lo más difícil.

---

### M7 — Calendario compartido

**RF-7.1** Eventos con: título, fecha/hora, tipo (cita, aniversario, cumpleaños, viaje, recordatorio, cita médica), creador, notas.
**RF-7.2** Recordatorios configurables por evento (1 día antes, 1 semana antes, etc.).
**RF-7.3** Eventos recurrentes anuales para aniversarios.
**RF-7.4** Vista de mes y vista de "próximos".
**RF-7.5** Marca visual de días con eventos importantes en la pantalla principal.
**RF-7.6** Un evento puede llevar una cápsula asociada, que se entrega el día del evento.
**RF-7.7** Al pasar un evento, se puede convertir en Recuerdo (M11) con fotos y una nota.

**RF-7.8 Calendario propio, sin sincronización.** No se integra con Google Calendar, Apple Calendar ni ningún otro. Los eventos viven solo en la app.

**RF-7.9** Como puente mínimo, cada evento se puede exportar como archivo `.ics`, que cualquier calendario sabe importar. Es un fichero de texto plano: no requiere OAuth, ni permisos, ni mantenimiento.

✅ *Decisión cerrada (D29).*

---

### M8 — Dedicatorias musicales

**RF-8.1** Dedicar una canción con un mensaje corto y una franja horaria de entrega: *mañana · media tarde · noche*.

**RF-8.2 Solo enlace pegado. Sin integración con ninguna plataforma.** Se acepta cualquier URL (YouTube, Spotify, Apple Music) y se guarda tal cual. Al tocarla, abre la app correspondiente.

**RF-8.2.1 Tarjeta con oEmbed, si la plataforma lo permite sin autenticación.** YouTube expone un endpoint oEmbed público (`youtube.com/oembed?url=…`) que devuelve título y miniatura sin clave ni registro. Basta para pintar una tarjeta decente. Si un enlace no da metadatos, se muestra el enlace pelado — y ya está.

> **Por qué no la API de Spotify.** Tiene nivel gratuito, pero exige registrar una aplicación, gestionar credenciales y OAuth, y la reproducción completa dentro de la app requiere Premium del usuario. Todo eso para dos personas que van a dedicarse una canción cada tanto. **El enlace pegado da el 95 % del valor con el 2 % del trabajo**, y no se rompe cuando una plataforma cambia sus términos. Si algún día se usa mucho, se reevalúa.

**RF-8.3** Entrega como notificación a la hora elegida, con miniatura y dedicatoria.
**RF-8.4** Historial: "nuestra banda sonora", lista cronológica de todo lo dedicado.
**RF-8.5** Una canción también puede ser el contenido de un mensaje (M2), incluido el destino *"cuando le sirva"*.

✅ *Decisión cerrada (D28): enlace pegado + oEmbed público. Sin API, sin OAuth, sin claves.*

---

### M9 — Series y películas

**RF-9.1** Lista compartida con estados: *por ver · viendo · vista · abandonada*.
**RF-9.2** Marcar quién la propuso.
**RF-9.3** Puntuación individual de cada uno tras verla (1–5) + comentario.
**RF-9.4** Progreso en series (temporada/episodio) para no perder el hilo.
**RF-9.5** Regla de "no ver sin el otro": marcar un título como bloqueado en solitario. Suena tonto, es una fuente real de conflicto.
**RF-9.6** Búsqueda con metadatos (póster, sinopsis, año) vía TMDB — API gratuita, sin OAuth.
**RF-9.7** Selector aleatorio: "elige una por mí" filtrando por duración o género, para las noches en que nadie decide.

---

### M10 — Capa de IA

> **Nota metodológica:** esta sección se reescribió aplicando un filtro estricto. La conclusión es que **la mayoría de los usos "obvios" de IA en una app de pareja no aportan nada**, y que solo dos sobreviven al escrutinio. Se documenta el descarte, no solo lo aprobado.

#### 10.1 El filtro

Cada caso de uso propuesto pasa por tres preguntas. Basta con fallar una para descartarlo:

1. **¿Requiere IA de verdad?** ¿O lo resuelve igual de bien una lista fija bien escrita, una consulta SQL o una heurística?
2. **¿Qué necesita leer?** ¿Solo un borrador que el usuario tiene delante en ese momento, o el contenido histórico almacenado? *(Esta pregunta determina si es compatible con cifrado extremo a extremo.)*
3. **¿Vacía el gesto?** En esta app el valor de un mensaje está en que lo escribiste tú. Cualquier IA que erosione eso resta, aunque el texto salga mejor.

#### 10.2 Evaluación

| Caso propuesto | ¿Requiere IA? | ¿Qué lee? | ¿Vacía el gesto? | Veredicto |
|---|---|---|---|---|
| **Espejo pre-envío** — señala frases que probablemente hieran antes de que salgan | **Sí.** Detectar generalizaciones, ataques a la persona y desprecio en texto libre es exactamente lo que un LLM hace bien y un regex no | Un borrador local, en el momento | No — no escribe, solo advierte | ✅ **Aprobado** |
| **Reformulación asistida** — reescribe un reclamo en formato observación/sentimiento/necesidad/petición, para *aprender* el formato | Sí | Un borrador local, en el momento | Riesgo moderado, mitigable | ⚠️ **Aprobado con condiciones** (ver 10.4) |
| **Arranque de cápsula** — preguntas para vencer la página en blanco | **No.** 40 preguntas fijas bien escritas, rotando, hacen el 95 % del trabajo. La versión con IA sería marginalmente más contextual y notablemente más lenta | — | — | ❌ **Descartado.** Se implementa como lista estática |
| **Traductor de necesidad** — convertir "estoy mal" en necesidad concreta | **No.** Ya son seis opciones fijas (RF-1.2). Ese es el diseño; la IA sobra | — | — | ❌ **Descartado** |
| **Selección de cápsula** — elegir cuál encaja mejor con el estado de hoy | Marginal. El emparejamiento por etiquetas ya funciona; la IA solo desempata entre cápsulas del mismo grupo | **Todas las cápsulas almacenadas** | No | ❌ **Descartado.** Único caso que exigía leer el archivo completo, y su ganancia es un desempate. No compensa |
| **Resumen semanal de ánimo** | **No.** Los check-ins son datos estructurados (emoción, intensidad, fecha). Un gráfico y tres promedios dicen lo mismo | — | — | ❌ **Descartado** |
| **Ideas de cita** — cruzar calendario, watchlist y clima | Sí, pero el valor es de novedad | Datos de baja sensibilidad | No | 🔸 **Opcional, fase tardía.** Simpático, prescindible |
| **Acompañante de respuesta** — me ayuda a no reaccionar desde el golpe cuando recibo un mensaje difícil (§10.3) | **Sí.** Separar mi reacción del mensaje real es exactamente trabajo de lenguaje | El mensaje recibido + mi borrador, en el momento | No — no responde por mí | ✅ **Aprobado** |
| **Interpretar a la pareja** — "lo que en realidad te está pidiendo es…" | Sí | Mensajes ajenos | — | ❌ **Prohibido.** Ver §10.3.1. La app no interpreta a nadie ante nadie |
| **Recordar contexto del otro** — "hace tres semanas dijo que el trabajo la tenía mal" | Sí | Historial ajeno | — | ❌ **Prohibido.** Es vigilancia con buena cara |
| **Transcripción de notas de voz** para poder buscarlas | Sí (modelo de voz, no Claude) | Audio almacenado | No | 🔸 **Aplazado.** Útil, pero exige procesar audio en servidor. Reevaluar en fase 4 |

#### 10.3 El acompañante de respuesta

Es la pieza que más puede ayudar y la que más fácil se estropea. Se activa solo al pulsar *"ayúdame a responder"* (RF-3.15), tras recibir un mensaje de **enojo, tristeza o pena**.

##### 10.3.1 La línea que no se cruza

Hay dos cosas que suenan casi igual y son opuestas:

| ❌ Interpretar a mi pareja | ✅ Acompañarme a mí |
|---|---|
| *"Lo que Cata necesita es que la escuches sin dar soluciones"* | *"¿Qué sentiste al leer esto?"* |
| *"Está enojada porque se siente sola últimamente"* | *"Esto es lo que ella escribió, literal: …"* |
| *"Te está pidiendo espacio"* | *"Ella marcó que necesita **escucha**"* (dato que **ella** declaró) |
| Concluye sobre alguien ausente | Devuelve a lo que hay y señala lo que falta |

Cuatro razones para no cruzarla:

1. **Si se equivoca, el daño es peor que no haber intentado.** Si la IA dice "necesita espacio" y yo le doy espacio cuando ella quería que la abrazara, actué con confianza sobre una lectura falsa. Sin la IA habría preguntado.
2. **Sustituye el trabajo que ES la relación.** Entender a la persona que quieres no es una tarea que convenga externalizar. Si la máquina la hace, se atrofia lo único que importa.
3. **Es asimétrico e injusto.** Ella escribe, una máquina se lo traduce a él con su propia lectura, y **ella nunca sabe qué le dijeron sobre ella**. No tiene voz sobre cómo se la interpreta.
4. **Ya existe la fuente auténtica.** El campo "qué necesito" (RF-1.2) lo llenó ella. Ningún modelo va a superar eso, y usar una inferencia teniendo la declaración es absurdo.

> **Sobre la palabra "mediador":** un buen mediador nunca le dice a una parte lo que la otra siente. Hace que cada una se escuche a sí misma y formule bien lo que quiere decir. Eso es exactamente el alcance de esta función.

##### 10.3.2 Qué hace, en cuatro movimientos

**1. Me pregunta a mí primero.** Antes de nada: *"¿Qué sentiste al leer esto?"* — con opciones de un toque: *atacado · culpable · injusto · triste · confundido · no sé*. Nombrar la reacción propia ya la separa del mensaje. La mayor parte del daño en una respuesta viene de contestarle a lo que **yo sentí**, no a lo que ella **dijo**.

**2. Me devuelve lo literal.** Cita textual, sin interpretar, señalando el hecho concreto que hay debajo — sin descalificar cómo lo dijo:

> *"Debajo de esto hay algo concreto: llegaste tarde y no avisaste."*

Nunca *"ella exageró"* ni *"eso es una generalización"*. Eso me daría munición para defenderme, que es lo contrario de lo que necesito.

**3. Me muestra lo que ella declaró.** Solo el dato: *"Ella marcó que necesita **escucha**."* Si no marcó nada, no se inventa.

**4. Señala lo que no sé y sugiere preguntarlo.** Este es el movimiento clave:

> *"No sabes por qué esta vez le pegó más que otras. Puedes preguntárselo."*

Convierte la IA de oráculo en facilitadora de la pregunta real. En lugar de adivinar, me devuelve a mi pareja.

Después escribo yo. Y si quiero, el espejo (§6.5) revisa antes de enviar.

##### 10.3.3 Ejemplo completo

> **Cata escribió, enojada:**
> *"Otra vez llegaste tarde y ni avisaste. Ya ni sé para qué hacemos planes si siempre terminas priorizando cualquier otra cosa."*
>
> **Mi impulso:** *"No es cierto, tuve una junta que se alargó, no es mi culpa."*
>
> **El acompañante:**
> — ¿Qué sentiste al leerlo? → *injusto*
> — Sentirlo injusto es tuyo y es válido. Ojo: si respondes a eso, vas a defenderte, y ella no te acusó de nada que puedas defender.
> — Lo que ella describe, literal: **llegaste tarde y no avisaste**. Eso pasó.
> — Ella marcó que necesita **escucha**.
> — Lo que no sabes: por qué hoy pesó más que otras veces. Puedes preguntarlo.
>
> **Lo que escribo:**
> *"Tienes razón en que no avisé, y eso estuvo mal. ¿Qué fue lo que más te dolió hoy?"*

Ninguna frase la escribió la IA. Solo evitó que empezara con *"no es cierto"*.

##### 10.3.4 Requisitos

**RF-10.3.1** Nunca automático. Solo con pulsación explícita.
**RF-10.3.2** **Prohibido afirmar qué siente, piensa o necesita la pareja.** Solo puede: citar literalmente, mostrar datos que ella declaró, y formular preguntas abiertas.
**RF-10.3.3** No redacta la respuesta completa. Puede sugerir un **primer renglón**, nunca el mensaje entero.
**RF-10.3.4** No accede a mensajes anteriores ni al historial. Solo al mensaje que tengo abierto.
**RF-10.3.5** Ella nunca sabe que usé el acompañante.
**RF-10.3.6** Si ella marcó una necesidad (RF-1.2), ese dato tiene prioridad absoluta sobre cualquier inferencia.
**RF-10.3.7** Sin retención: ni el mensaje ni mi borrador se guardan fuera de la app.

#### 10.4 Conclusión: los tres casos operan sobre el momento

Sobreviven el **espejo pre-envío**, la **reformulación asistida** y el **acompañante de respuesta**. Los tres comparten una propiedad decisiva:

> Actúan sobre un texto que el usuario está escribiendo **ahora**, todavía en su dispositivo, y que **aún no existe en el servidor**.

Eso significa que **no hay conflicto entre la IA y el cifrado extremo a extremo**. El único caso que sí exigía leer el archivo cifrado —la selección de cápsula— acaba de descartarse por bajo valor. La disyuntiva "privacidad o IA" que planteaba el borrador anterior era falsa; el análisis la disuelve.

Queda una advertencia honesta: usar el espejo implica que ese borrador concreto **sale del dispositivo** hacia la API de Anthropic, aunque sea de forma efímera y no se almacene. Es una decisión puntual del usuario, no un permiso permanente (RF-10.4).

#### 10.5 Requisitos generales

**RF-10.1 Alcance.** Solo se implementan el espejo pre-envío, la reformulación asistida y el acompañante de respuesta. Cualquier caso nuevo debe pasar el filtro de §10.1 y documentarse aquí.

**RF-10.2 Modelo.** `claude-opus-5` para ambos. Es trabajo delicado sobre lenguaje emocional; no es sitio para ahorrar. Con dos usuarios el coste es irrelevante.

**RF-10.3 Nunca automático.** El espejo se invoca pulsando *"Revisa esto antes de que lo envíe"*. No se ejecuta al escribir, no vigila en segundo plano, no aparece sin que se pida.

**RF-10.4 Consentimiento por uso.** La primera vez, un aviso claro: *"Esto envía el texto a un servicio externo para analizarlo. No se guarda."* Después, un indicador discreto y permanente en el botón. Nunca hay un permiso "para siempre" invisible.

**RF-10.5 Advertir, no reescribir.** El espejo señala fragmentos y explica por qué (*"'siempre haces lo mismo' es una generalización; suele hacer que la otra persona se defienda en vez de escuchar"*). **No propone el texto sustituto.** Escribirlo de nuevo es tuyo.

**RF-10.6 El espejo jamás bloquea el envío.** Señala y se aparta. Cualquier mensaje puede enviarse sin abrir el espejo, y también después de leerlo sin cambiar una coma. La única fricción que la app puede imponer es **temporal** (§6.1, §6.3), nunca editorial. Ver P9.

**RF-10.7 Reformulación bajo demanda.** Segundo paso separado, solo si el usuario lo pide tras leer las señales. El resultado se marca visualmente como sugerencia y **debe editarse al menos una vez antes de poder enviarse**.

> ⚠️ **Esta fricción no se aplica a tu texto, sino al texto de la IA.** No es "no puedes enviar lo que escribiste hasta corregirlo" (eso sería censura, prohibida por P9), sino "no puedes enviar como tuyo algo que escribió una máquina sin haberlo hecho tuyo". Son cosas opuestas. Tu propio texto sale intacto cuando quieras; el de la IA nunca sale intacto.

**RF-10.8 Sin retención.** Ni el borrador ni la respuesta del modelo se escriben en base de datos ni en logs. La llamada es efímera.

**RF-10.9 Desactivable por completo.** Un interruptor en ajustes. Con la IA apagada, la app funciona entera; solo desaparece un botón.

**RF-10.10 Ámbito de aplicación.**

| Dónde | ¿Espejo? | Motivo |
|---|---|---|
| Destino *Ahora*, desde una emoción de *"Algo pasó"* (§2.0) | Sí | Declaré que quiero que llegue |
| Al revisar en frío tras el umbral (§6.3) | Sí — y es donde más sirve | En frío, la edición nace de mí |
| Registro de conflicto (§6.6) | Sí | Formato explícitamente comunicativo |
| Respuestas (§3.3) | Sí | Es una respuesta a la pareja |
| **Destino *Solo para mí*** (§2.0.2) | **No** | El punto es sacarlo. No hay nada que mejorar |
| **Mensajes de "cuando le sirva"** (§2.0) | **No** | Escritos en buen momento, no necesitan corrección. Meter IA aquí es exactamente lo que vacía el gesto |
| **Check-ins** (M1) | **No** | Registrar cómo estoy no es comunicar |

**RF-10.11 Prohibiciones absolutas:**
- No escribir mensajes por el usuario, ni siquiera parcialmente.
- No diagnosticar estados emocionales ni atribuirles causas.
- No analizar el contenido de una persona para informar, resumir o alertar a la otra.
- No tocar datos de ciclo menstrual bajo ninguna circunstancia.
- No procesar nada del archivo histórico.

---

### M12 — Los 11:11

El ritual de pedir un deseo cuando el reloj marca 11:11, convertido en gesto de pareja. Es la función más pequeña de la app y probablemente la que más se use.

**RF-12.1 Aviso a las 11:11**, mañana y noche. Configurable: ambas, solo una, o ninguna. Por defecto, ambas.

**RF-12.2 Ventana de gracia hasta las 11:15.** Cuatro minutos. Estricto sería frustrante — si el minuto exacto se pasa por estar en una reunión, el ritual se convierte en una fuente de fallo. Pasada la ventana, el aviso desaparece sin dejar rastro ni mención.

**RF-12.3 Mensaje corto: máximo 140 caracteres.** Es un deseo, no una carta. La brevedad es parte del formato.

**RF-12.4 Si los dos envían en la misma ventana**, la app lo señala una vez, sin ceremonia:

```
        Los dos pidieron a la vez.
```

**RF-12.5 Si solo uno envía**, llega igual y no pasa nada más. **Nunca** se le dice a nadie que el otro no envió (RF-3.0.2). Esta es la regla que evita que el ritual se convierta en obligación.

**RF-12.6 Colección propia.** Lista cronológica de todos los 11:11, de los dos. Es el archivo más ligero y más releíble de la app.

**RF-12.7 Cero rachas, cero contadores.** Nada de *"llevan 5 seguidos"* ni *"se rompió la racha"*. Es exactamente lo que P6 prohíbe, y en un ritual diario la tentación de gamificarlo es máxima. **Un 11:11 perdido no existe**: no se cuenta, no se muestra, no se menciona.

**RF-12.8 Desactivable** por cada persona, sin que el otro lo sepa.

#### 12.9 La única función simultánea de la app

**RF-12.9** El 11:11 es la **excepción deliberada** a RF-1.0.3. Todo lo demás en la app va desfasado a propósito —las preguntas, los avisos, las entregas— para que nada se sienta como un chat. Aquí es al revés: **la gracia entera está en que ocurre a la misma hora para los dos.**

No es una inconsistencia del diseño; es la razón de ser de la función. Es el único momento del día en que la app pone a las dos personas en el mismo instante.

---

### M11 — Recuerdos

**RF-11.1** Línea de tiempo de la relación: fotos, hitos, eventos pasados convertidos en recuerdo.
**RF-11.2** "Hace un año": recordatorio ocasional de algo bonito.
**RF-11.3** Los recuerdos alimentan el fallback del motor de entrega (RF-3.6).

---

## 6. Modelo de datos (borrador)

```
usuario         id, email, nombre, foto, zona_horaria, pronombres, creado_en
vinculo         id, creado_en, estado
membresia       usuario_id, vinculo_id, rol, unido_en
invitacion      codigo, vinculo_id, expira_en, usado_en

checkin         id, vinculo_id, autor_id, emocion, grupo, intensidad,
                necesidad, visibilidad, creado_en

mensaje         id, vinculo_id, autor_id, checkin_id, clase (presencia|
                conversacion), destino (ahora|cuando_le_sirva|solo_para_mi),
                tipo, contenido, media_url, necesidad, tono_marcado,
                disparador (jsonb), reutilizable, es_reserva,
                responde_a_id, estado, creado_en

entrega         id, mensaje_id, destinatario_id, checkin_receptor_id,
                entregada_en, llegada_en, vista_en,
                amortiguado_con_id, motivo

respuesta       id, mensaje_id, autor_id, texto, audio_url,
                emocion_adjunta, cierre (gracias|te_quiero|hablarlo_mas|
                hablamos_luego), creado_en

guardado        mensaje_id, usuario_id, creado_en   -- el cofre

ciclo           id, usuario_id, inicio, fin, sintomas (jsonb),
                nivel_visibilidad
nota_fase       id, usuario_id, fase, texto

borrador_frio   id, autor_id, puerta (para_mi|ahora|en_frio), texto,
                retener_hasta, resuelto_como (enviado|editado|liberado),
                tono_marcado, umbral_mostrado, umbral_eleccion, creado_en
conflicto       id, vinculo_id, autor_id, que_paso, que_senti,
                que_necesitaba, que_haria, compartido_en
acuerdo         id, vinculo_id, texto, creado_en, activo

evento          id, vinculo_id, creador_id, titulo, tipo, inicio, fin,
                recurrencia, notas, capsula_id
dedicatoria     id, vinculo_id, autor_id, cancion (jsonb), mensaje,
                franja, entregada_en
titulo_media    id, vinculo_id, propuesto_por, tmdb_id, tipo, estado,
                progreso, bloqueado_solo
puntuacion      titulo_id, usuario_id, valor, comentario
recuerdo        id, vinculo_id, fecha, titulo, texto, fotos (jsonb)
```

---

## 7. Arquitectura técnica

### 7.1 Stack propuesto

✅ **Decidido (D32): Railway, con la aplicación dockerizada y Postgres gestionado en el mismo proyecto.**

| Capa | Elección | Motivo |
|---|---|---|
| Frontend + API | **Next.js 15 (App Router) + TypeScript** | Un solo despliegue con interfaz y servidor; buen soporte PWA |
| Estilos | **Tailwind CSS** | Rapidez de iteración, control fino del sistema visual |
| PWA | Manifest + Service Worker propio | Offline, instalación, push |
| Base de datos | **Postgres en Railway** | Gestionado, respaldos incluidos, mismo proyecto que la app |
| Acceso a datos | **Prisma** | Esquema único como fuente de verdad, cliente tipado, migraciones versionadas |
| Componentes | **shadcn/ui**, con *tokens* personalizados desde el día 1 | Accesibilidad resuelta; el aspecto se ajusta a §8.2 (ver `PLAN.md` §0.4) |
| Autenticación | **Auth.js** con enlace mágico por correo | Sin contraseñas que gestionar. Envío vía Resend o SMTP |
| Trabajos programados | **Railway cron** | Preguntas periódicas, entregas programadas, caducidad de estados |
| Push | **web-push (VAPID)** | Sin dependencias de terceros |
| Archivos *(Fase 2)* | Volumen de Railway, o almacenamiento S3-compatible | Solo hace falta al añadir audio y fotos |
| Contenedor | **Dockerfile propio** | Reproducible en local y en Railway; sin dependencias de plataforma |
| IA *(Fase 3)* | Anthropic API desde rutas de servidor | La clave nunca llega al cliente |

#### 7.1.1 Lo que cambia al no usar Supabase

Supabase traía auth, almacenamiento, tiempo real y seguridad a nivel de fila resueltos. Con Postgres pelado hay que cubrir cuatro huecos:

| Hueco | Solución |
|---|---|
| **Autenticación** | Auth.js con enlace mágico. Para dos usuarios es más que suficiente |
| **Tiempo real** | No hace falta. La app es asíncrona por diseño (§1.3). Basta con push + recarga al abrir |
| **Almacenamiento** | Solo desde Fase 2. Hasta entonces todo es texto en la base de datos |
| **Aislamiento de datos** | Ver RNF-4 revisado abajo — es el punto que más cuidado exige |
| **Inspección de datos** | Prisma Studio, en desarrollo. Permite ver check-ins y entregas sin construir pantallas |

#### 7.1.2 Aislamiento sin RLS gestionada

Con Supabase, la seguridad a nivel de fila la aplicaba la base de datos aunque el código tuviera un fallo. Con un servidor propio, **un solo `WHERE` olvidado filtra datos de otro vínculo**. Dos medidas obligatorias:

**RNF-4 (revisado)** Todo acceso a datos pasa por una **capa única** cuyas funciones exigen `vinculo_id` como parámetro obligatorio. Ninguna consulta suelta fuera de esa capa. Se acompaña de pruebas automatizadas que intentan leer datos de otro vínculo y deben fallar.

**RNF-4.1** Adicionalmente se activa Row-Level Security en Postgres como red de seguridad, aunque el servidor sea de confianza. Cuesta poco y convierte un descuido en un error en vez de en una fuga.

### 7.2 Requisitos no funcionales

**RNF-1** Carga inicial < 2 s en 4G. Interacciones < 100 ms.
**RNF-2** Funciona offline para: leer mensajes ya entregados, escribir borradores, registrar check-in (se encola).
**RNF-3** Todo dato en tránsito por HTTPS; en reposo, cifrado a nivel de base de datos.
**RNF-4** Row-Level Security en Postgres: un usuario solo accede a filas de su Vínculo. Sin excepciones ni rutas de administración.
**RNF-5** Exportación completa de datos en JSON, bajo demanda.
**RNF-6** Borrado real (no lógico) al disolver el vínculo, tras la ventana de gracia.
**RNF-7** Accesibilidad: contraste AA, navegación por teclado, textos alternativos, respeto de `prefers-reduced-motion`.
**RNF-8** Modo claro y oscuro.

### 7.3 Privacidad

- Los audios y fotos se guardan en Storage privado con URLs firmadas de corta duración.
- Sin analítica de terceros. Si hace falta telemetría, autoalojada y anónima.
- Sin registro de contenido en los logs del servidor.

#### Cifrado: la disyuntiva era falsa

El borrador anterior planteaba un dilema entre cifrado extremo a extremo e inteligencia artificial. El análisis de §10.2 lo disuelve: los dos únicos usos de IA que sobreviven operan sobre **borradores locales**, no sobre contenido almacenado. El único caso que exigía leer el archivo cifrado —la selección automática de cápsula— se descartó por aportar demasiado poco.

Sin embargo, E2EE real sí tiene costes que no vienen de la IA:

| Coste | Detalle | ¿Grave? |
|---|---|---|
| Búsqueda en el archivo | No se puede buscar en servidor. Hay que descifrar en el cliente e indexar localmente | Asumible: el volumen es de dos personas escribiendo, no millones de mensajes |
| Recuperación de cuenta | Si se pierde la clave, el contenido es irrecuperable. No hay "olvidé mi contraseña" | **Serio.** Requiere frase de recuperación y un onboarding que la explique bien |
| Nuevo dispositivo | Hay que transferir la clave (código QR entre dispositivos, o frase de recuperación) | Molesto pero resoluble |
| Notificaciones push | El servidor no puede componer una vista previa con contenido | Ya resuelto: RF-4.4 prohíbe contenido en vistas previas |
| Entregas programadas | Un `cron` en servidor no puede decidir el contenido, pero **sí puede decidir el momento** | Resoluble: el servidor entrega el identificador y el cliente descifra |
| Complejidad de implementación | Gestión de claves, derivación, rotación | **Real.** Es la parte del proyecto con más probabilidad de salir mal |

✅ **Decidido (D34): sin cifrado extremo a extremo. Nivel A y punto.**

- **Contraseñas:** no se guardan. Se usa enlace mágico por correo (Auth.js). Si en algún momento hubiera contraseñas, iría **hash con Argon2id o bcrypt**, nunca cifrado reversible.
- **Tránsito:** TLS, obligatorio.
- **Reposo:** el cifrado que ofrece Postgres gestionado en Railway.
- **Aislamiento:** capa única de acceso a datos + RLS (RNF-4, RNF-4.1).
- **Contenido de mensajes:** en claro en la base de datos.

**El razonamiento.** El E2EE habría costado: frase de recuperación en el alta, un flujo de alta de segundo dispositivo, imposibilidad de buscar en servidor, y la parte del proyecto con más probabilidad de salir mal. Todo eso a cambio de protegerse de un atacante que tendría que vulnerar Railway **y** al que no le interesan dos personas. **Es el peor cambio posible de usabilidad por seguridad para este producto concreto.**

Lo que se protege de verdad, y sí está: nadie ajeno al vínculo puede leer nada (RNF-4), no hay analítica de terceros, no se registra contenido en los logs, y todo se puede exportar y borrar (RNF-5, RNF-6).

> **La honestidad que esto exige:** el proveedor de base de datos *podría* técnicamente leer el contenido. Conviene decirlo en los ajustes con una frase clara, sin letra pequeña. Prometer más privacidad de la que se tiene es peor que tener menos.

#### Alcance multi-vínculo

Decisión tomada: **modelo de datos multi-vínculo desde el primer día, interfaz de un solo vínculo.** Implicaciones:

- Toda tabla cuelga de `vinculo_id`; ninguna consulta asume un vínculo único.
- Row-Level Security en todas las tablas desde el inicio, verificada con pruebas automatizadas (no basta con escribirla).
- El onboarding actual asume que el usuario crea o se une al único vínculo que tendrá. La interfaz no muestra selector de vínculo.
- No se implementa: registro público, moderación, facturación, ni términos de servicio. Eso llega solo si algún día se abre.

---

## 8. Diseño y navegación

### 8.1 Estructura

Cuatro pestañas, nada más:

```
┌──────────┬──────────┬──────────┬──────────┐
│ Nosotros │   Hoy    │  Cofre   │   Yo     │
└──────────┴──────────┴──────────┴──────────┘
```

- **Nosotros** — el calendario del mes, y detrás música, series, recuerdos y acuerdos. **Es la pantalla por la que se entra.**
- **Hoy** — mi estado, el de mi pareja y lo que hay para mí hoy. Una acción principal y nada más.
- **Cofre** — mensajes recibidos, con la vista de guardados destacada. Y el botón de escribir.
- **Yo** — mi ciclo, mis avisos, ajustes.

**RF-8.1.1 Se entra por el calendario, salvo que haya algo esperando.** Si hay
un mensaje sin leer o algo en el buzón en frío pidiendo decisión, la app abre en
**Hoy**. Un mensaje que llegó no puede quedarse detrás de una rejilla de días.

**RF-8.1.2 El ánimo día a día vive en el calendario, no en «Yo».** Lo que era un
historial dentro de una pantalla de ajustes pasa a la línea de tiempo de verdad,
junto a los planes y los periodos. **Que la pareja lo vea es un interruptor
propio, apagado de partida**: hasta ahora solo veía el estado actual, que caduca
a las 8 h (RF-3.0.7.7), y un mes entero es otra cosa (RF-1.5).

**RF-8.1.3 En el calendario, el periodo y el ánimo de la misma persona nunca
comparten casilla.** Los dos juntos **son** la correlación que RF-5.6 prohíbe.
En los días con marca de periodo gana la marca y el ánimo no se dibuja — ni en
la casilla ni al abrir el día.

### 8.2 Lenguaje visual

- **Tipografía:** una serif para el contenido íntimo (cartas, cápsulas) — debe sentirse escrito a mano, no notificado por un sistema. Una sans limpia para la interfaz.
- **Paleta:** cálida y desaturada. Los colores de emoción no deben ser semáforos (rojo = malo genera juicio); mejor una gama tierra/atardecer donde ningún estado se ve "mal".
- **Movimiento:** transiciones suaves, nada rebota. La revelación de una cápsula merece una animación deliberada, casi ceremonial — es el momento clave de la app.
- **Densidad:** mucho aire. Una acción principal por pantalla.

**RF-8.2.2 Sin emojis en ninguna pantalla. Iconos de trazo, coloreados por familia.** Un emoji lo dibuja cada sistema operativo a su manera, no se puede teñir del color que le toca, y su registro gráfico —caras amarillas— choca con el papel y la tinta. Todos los iconos salen de un único archivo, y una prueba automática falla si alguno se cuela.

**RF-8.2.4 Modo oscuro por preferencia del sistema, sin ajuste que tocar.** No es la paleta invertida: es el mismo cuaderno bajo una lámpara. Ni negro puro ni blanco puro — a las dos de la mañana un blanco del 100 % sobre negro del 100 % deslumbra, y esta app se usa a esas horas. Un interruptor de tema sería maquinaria a la vista, y P10 pide lo contrario.

**RF-8.2.3 Las nueve emociones se dibujan como clima, no como caras.** Es la traducción visual de §1.2: un estado de ánimo pasa, viene de fuera y no es culpa de nadie. Una cara enfadada señala a una persona; una tormenta solo describe el día. Las dos emociones que hablan de la otra persona —gratitud y añoranza— sí llevan manos y corazones, porque no describen mi clima sino el vínculo.

### 8.3 La mascota mensajera

Toda la maquinaria interna (umbrales, amortiguadores, disparadores) necesita una cara amable, o la app se siente como un sistema que te administra. La mascota es esa cara.

**RF-8.3.1 Es un mensajero, nunca un consejero.** Lleva cartas. No opina sobre lo que llevas, no interpreta a nadie, no sugiere qué hacer. La paloma mensajera es la metáfora exacta del rol: **transporta, no lee**.

**RF-8.3.2 Elegible por cada persona**, por separado: 🕊 paloma · 🐕 perro · 🐈 gato · 🦊 zorro. Cada uno ve la suya; no tienen que coincidir.

**RF-8.3.3 Aparece solo cuando la app consulta algo:** la pregunta del día, el amortiguador (RF-3.0.7), la entrega de un mensaje guardado. En el resto de la app no está.

#### Lo que la mascota NO hace nunca

Esta lista importa más que la anterior, porque cada punto es un patrón que existe en apps reales y que aquí sería tóxico:

| ❌ Prohibido | Por qué |
|---|---|
| Reaccionar a tu estado *(el perrito se pone triste si tú estás triste)* | Añade la carga de cuidar a un personaje justo cuando no puedes ni contigo |
| Reclamar ausencia *("¡hace días que no me visitas!")* | Chantaje emocional. Viola P6 frontalmente |
| Celebrar rachas, dar premios, subir de nivel | Gamifica la relación. P6 |
| Opinar sobre la pareja o sobre el mensaje | Viola P3. Un mensajero que comenta lo que lleva es un chismoso |
| Ponerse triste, enfermarse o "morir" por desuso | Coacción disfrazada de ternura |
| Hablar mucho | P10. Una frase corta o ninguna |

**RF-8.3.4** La mascota **no tiene estado emocional propio.** No está contenta ni triste. Está o no está.

**RF-8.3.5** Se puede desactivar por completo. Con la mascota apagada, las mismas pantallas funcionan sin ella.

> Su valor es de encuadre: recibir *"Cata está enojada"* de una pantalla del sistema se siente como una alerta; recibirlo de una paloma que trae un sobre se siente como una carta. Mismo dato, temperatura distinta. Ahí acaba su trabajo.

❓ *Decisión abierta:* nombre de la app. "PairApp" es funcional pero frío. Algunas ideas: **Faro** (algo que guía cuando estás perdido), **Cerca**, **Nudo**, **Contigo**, **Refugio**, **Puente**. Mi favorita es *Faro*.

---

## 9. Roadmap

### 9.0 El criterio de recorte

Lo normal sería ordenar por importancia. Aquí conviene otro criterio: **cuándo empieza a funcionar cada cosa.**

Varias de las mejores funciones **no pueden funcionar el día 1** porque dependen de contenido acumulado:

| Función | Por qué no sirve al principio |
|---|---|
| **Amortiguador** (RF-3.0.7) | Necesita mensajes guardados de ella. El día 1 no hay ninguno |
| **Cofre** (§3.2.2) | Está vacío hasta que llevas semanas |
| **"Cuando le sirva"** | Su magia es el tiempo transcurrido. Entregar algo escrito hace dos horas no emociona |
| **Aviso de inventario bajo** (RF-2.6) | Requiere historial de varias semanas |

Construirlas primero es construir funciones que no se pueden probar. **Van después**, y para entonces habrá materia prima real.

En cambio, la observación clave del recorte:

> **Las protecciones que más daño evitan son casi gratis de implementar.** El umbral es una pantalla con tres botones. La caducidad de estados es una resta de fechas. La matriz de entrega son seis condicionales. Ninguna necesita IA ni infraestructura. **Entran todas en el MVP.**

Lo caro es la IA (espejo, acompañante), y resulta ser lo prescindible: la app funciona entera sin ella. Es una capa, no un cimiento.

### 9.1 Fases

#### Fase 1 — MVP

> **Criterio rector: usabilidad por encima de sofisticación técnica.** Ante cualquier duda entre "más correcto" y "más cómodo", gana lo cómodo. El MVP debe cumplir las siete funciones de abajo **de forma impecable**, no cubrir muchas a medias.

**Las siete funciones:**

| # | Función | Módulos | Notas |
|---|---|---|---|
| **1** | **App de dos personas** | M0 | Vínculo por código de invitación |
| **2** | **Dedicar canciones** | M8 | Enlace pegado. Aviso por franja horaria y envío desde el panel. Lista de lo dedicado |
| **3** | **Mensajes y estado de ánimo** | M1 · M2 · M3 | El bucle completo: registro → mensaje → aviso → respuesta |
| **4** | **Calendario compartido** | M7 | Uno solo, con eventos de pareja o individuales |
| **5** | **Registro de periodo** | M5 | Con el control de visibilidad de RF-5.3 intacto |
| **6** | **Colección de mensajes lindos** | M3 (cofre) | Archivo de todo lo recibido, con los guardados aparte |
| **7** | **Los 11:11** | M12 | Aviso, ventana de gracia, colección |

**Y con ellas, las piezas que las sostienen:**

| Pieza | Detalle |
|---|---|
| Check-in | 9 emociones, 3 grupos, una pantalla, un toque (§M1.1.2) |
| Pregunta periódica | 3/día, 6 horarios desfasados (RF-1.0) |
| Mensaje | Los tres destinos, incluido *"cuando le sirva"* |
| Chip de necesidad | Preseleccionado por emoción (RF-1.2) |
| Aviso push | Con las reglas de visibilidad (RF-3.0.1 a RF-3.0.6) |
| Lectura y respuesta | Incluye *"ahora no puedo"* (RF-3.13, RF-3.14) |
| Estados de entrega | Enviado · Le llegó · Visto (RF-3.0.13) |
| Cierre de hilo | Los cuatro de un toque (RF-3.19) |
| **Las tres protecciones baratas** | Umbral (§6.1) · Caducidad 8 h (RF-3.0.7.7) · Matriz (§3.0.15) |
| Lista "solo para mí" | Con *"decirlo ahora"* (RF-2.0.6) |

**Fuera del MVP, a propósito:** IA (M10), mascota (§8.3), amortiguador (RF-3.0.7), buzón en frío completo (§6.3), registro de conflicto (§6.6), series y películas (M9), recuerdos (M11), audio y fotos.

> **Por qué esta lista sí y no la anterior.** El criterio de §9.0 —*qué funciona el día 1*— no cambia; simplemente calendario, canciones, periodo y 11:11 **lo cumplen**: sirven desde el primer uso y no necesitan meses de historial. Lo único que sigue posponiéndose es aquello que nace vacío (amortiguador) o que es caro sin ser crítico (IA).

> **Criterio de éxito:** que en un mes cualquiera de los dos haya dicho por la app algo que no habría dicho de otra forma. Una sola vez basta para justificarla.

#### Fase 2 — Que aguante los malos días

- Amortiguador (RF-3.0.7) — ya hay material del que tirar
- Búsqueda en el cofre (RF-3.11.1)
- Buzón en frío completo (§6.3) y retirada (§6.4)
- Audio y fotos en los mensajes
- Mascota (§8.3)

#### Fase 3 — La ayuda difícil

Solo cuando lo anterior se usa de verdad. Es la capa más delicada y la que peor sienta si llega antes de tiempo.

- Espejo pre-envío (§6.5)
- Acompañante de respuesta (§10.3)
- Registro de conflicto y acuerdos (§6.6, §6.7)

#### Fase 4 — Lo demás

- Series y películas (M9)
- Recuerdos (M11)
- Notas por fase del ciclo (RF-5.4), si la versión simple del MVP se queda corta

### 9.2 Qué NO hacer en el MVP

| Tentación | Por qué esperar |
|---|---|
| Empezar por la IA | Es lo más divertido de construir y lo menos necesario. Sin bucle base no tiene qué acompañar |
| Los 9 tipos de mensaje (audio, foto, canción, video) | Texto cubre el 90 %. El audio es lo siguiente, no lo primero |
| Cifrado extremo a extremo | Decisión aún abierta (§12.2). Añadirlo mal es peor que no añadirlo |
| Configuración fina de disparadores | Ya se descartó del camino por defecto (RF-2.0.3) |
| Pulir el diseño visual | Antes de saber si el bucle engancha, es pintar sobre planos |

---

## 10. Cómo sabemos si funciona

Cuidado aquí: medir una relación es peligroso. Estas métricas son **privadas, internas, no visibles en la app**, y sirven para decidir qué construir.

- ¿Se registran check-ins sin que la app los pida?
- ¿Qué proporción de mensajes de *conversación* recibe respuesta?
- ¿Se usa **incómodo**? Es la métrica más importante: mide si la app está capturando lo que antes se callaba (RF-1.2.1)
- ¿Cuántos apuntes de *"solo para mí"* acaban convertidos en mensaje con *"decirlo ahora"* (RF-2.0.6)? Ese salto es literalmente el propósito de la app
- ¿Cuántos mensajes pasan por el umbral y eligen esperar en vez de enviar?
- ¿Se usa el botón "necesito algo tuyo"?

> *Se eliminan las métricas de la revisión anterior que medían "cápsulas" y "Ecos", y la que comparaba "me ayudó" frente a "no era el momento" — esa escala se retiró en D8 y medirla la habría reintroducido por la puerta de atrás.*

**Anti-métrica:** días consecutivos de uso. No nos importa. Una app que se usa poco pero en los momentos correctos es un éxito.

---

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| **La app se convierte en herramienta de reclamo** ("no me escribiste nada en un mes") | Sin métricas visibles de actividad del otro. Sin rachas. El inventario de cápsulas solo lo ve su autor. |
| **Reducir emociones a hormonas** | Diseño invertido del módulo de ciclo (M5). |
| **Entrega en mal momento** | Regla del enojo (RF-3.4), modo crisis (RF-3.5), entrega por invitación. |
| **Vaciamiento por IA** | Prohibiciones de RF-10.5. La IA arranca y pule, no escribe. |
| **Asimetría de uso genera culpa** | Sin recordatorios que mencionen al otro. Sin visibilidad de "cuánto usa la app". |
| **Ruptura de la relación** | Ventana de gracia al disolver, exportación de datos, borrado real. |
| **Push en iOS no funciona** | Onboarding que obliga a instalar en pantalla de inicio; detección y aviso. |

---

## 12. Decisiones y preguntas abiertas

### 12.1 Decisiones tomadas

| # | Decisión | Fecha |
|---|---|---|
| D1 | **Alcance:** modelo de datos multi-vínculo desde el día 1; interfaz de un solo vínculo. Sin registro público, moderación ni facturación | 2026-07-31 |
| D2 | **IA:** solo espejo pre-envío y reformulación asistida, ambos sobre borradores locales y bajo petición explícita. Todo lo demás, descartado (§10.2) | 2026-07-31 |
| D3 | **Corolario de D2:** no existe conflicto entre IA y cifrado extremo a extremo. La decisión de cifrado se toma por sus propios méritos | 2026-07-31 |
| D4 | **La fricción es temporal, nunca editorial** (P9). El espejo informa y se aparta; quien bloquea es el reloj, no el contenido. Se corrige RF-10.6, que exigía editar antes de enviar | 2026-07-31 |
| D5 | **Tres puertas al escribir en caliente** (§6.0): *para mí* (sin análisis) · *para ella ahora* · *para ella en frío*. Separar desahogo de comunicación resuelve la mitad del problema de invasividad | 2026-07-31 |
| D6 | **Nuevo bucle central** (§1): *digo cómo estoy → le dejo algo → se entera → me responde bien*. Se unifican check-in y cápsula en **un gesto con cuatro destinos** (§2.0). Desaparece el término "cápsula" | 2026-07-31 |
| D7 | **Vocabulario emocional propio**, no genérico. Guardrails solo en **enojo**; acompañante en **enojo, tristeza, soledad y pena** (§M1.2). *Ampliado por D11 a nueve emociones* | 2026-07-31 |
| D8 | **Se elimina la escala de reacción** ("cómo me llegó"). Es un dato juzgable que degrada la relación en un marcador. Solo quedan dos señales: **visto** y **guardado**, y la segunda solo existe en positivo (§3.2.1) | 2026-07-31 |
| D9 | **Dos clases de mensaje:** *presencia* (no esperan respuesta, jamás generan recordatorio) y *conversación* (§3.2) | 2026-07-31 |
| D10 | **Suavidad como principio** (P10) + tono de voz normado (§1.2). La maquinaria interna nunca se ve desde fuera | 2026-07-31 |
| D11 | **Nueve emociones**, agrupadas en tres familias y presentadas en una sola pantalla (§M1.1.2). Se añaden *incómodo*, *te extraño* y *me siento solo* | 2026-07-31 |
| D12 | **El incómodo es el enojo antes de ser enojo.** Cero fricción al enviarlo, porque encarecerlo garantiza que se calle y se acumule (RF-1.2.1) | 2026-07-31 |
| D13 | **"Te extraño" ≠ "me siento solo".** Distancia vs. desconexión: la primera es presencia y se puede guardar; la segunda abre conversación | 2026-07-31 |
| D14 | **Tres destinos, no cuatro** (§2.0): *Ahora · Cuando le sirva · Solo para mí*. "Cuando le sirva" no pregunta nada — la app elige el momento. Se elimina la pantalla de disparadores del camino por defecto | 2026-07-31 |
| D15 | **La necesidad pasa de pantalla a chip** dentro del compositor, preseleccionada por emoción (RF-1.2). Se conserva el dato sin el coste de un paso | 2026-07-31 |
| D16 | **Amortiguador de recepción** (RF-3.0.7): si estoy mal y hay un mensaje difícil esperando, la app pone delante algo cálido **de ella** antes de abrirlo. Amortigua, no retiene; tope de 3 h | 2026-07-31 |
| D17 | **Mascota mensajera** (§8.3), elegible y desactivable. Transporta, no opina. Sin estado emocional propio, sin rachas, sin reclamar ausencia | 2026-07-31 |
| D18 | **"Cómo me hizo sentir" al responder** (RF-3.18) usando el vocabulario de las nueve emociones. **No** reintroduce D8: describe mi estado, no puntúa su mensaje | 2026-07-31 |
| D19 | **Cierre de hilo de un toque** (RF-3.19), incluyendo *"quisiera hablarlo un poco más"* — sin ella, la única alternativa a una respuesta insuficiente es el silencio | 2026-07-31 |
| D20 | **La lista "solo para mí" se archiva, no se borra** (RF-2.0.8), sin contador visible, con botón *"decirlo ahora"* de un toque | 2026-07-31 |
| D21 | **Enojo mutuo desactiva el amortiguador** (RF-3.0.8). Cariño en el pico del enojo invalida en lugar de calmar. Se muestra el hecho + elección, con opción de *"mañana por la mañana"* | 2026-07-31 |
| D22 | **Nada de promesas, solo hechos** (RF-3.0.13). Se descarta *"avisarle que lo leerás"*: una promesa incumplida deja dos heridas en vez de una. Quedan estados automáticos — *enviado · le llegó · visto* | 2026-07-31 |
| D23 | **El amortiguador solo aplica al grupo "Me falta algo"** (RF-3.0.7.6). En *enojado* invalida; en *apenado* aumenta la culpa. Los tres grupos resultan ser funcionales, no cosméticos | 2026-07-31 |
| D24 | **Los estados caducan a las 8 h** (RF-3.0.7.7). La app pregunta cómo estoy antes de mostrarme nada pendiente | 2026-07-31 |
| D25 | **Leer antes de escribir** (RF-3.20). Disculparse sin haber leído produce una disculpa genérica, que hace más daño que el silencio | 2026-07-31 |
| D26 | **Motor por matriz, no por flujos** (§3.0.15): 3 preguntas + 6 celdas cubren todos los escenarios. Un caso nuevo cae en una celda existente; si falla, se corrige la celda y se arregla su familia entera | 2026-08-01 |
| D27 | **El MVP se recorta por "cuándo empieza a funcionar", no por importancia** (§9.0). Amortiguador, cofre y mensajes guardados necesitan meses de uso acumulado: van a Fase 2. Las tres protecciones baratas (umbral, caducidad, matriz) entran en Fase 1 | 2026-08-01 |
| D28 | **Música por enlace pegado** (RF-8.2). Sin API de Spotify. Tarjeta vía oEmbed público de YouTube, que no pide clave | 2026-08-01 |
| D29 | **Calendario propio, sin sincronización** (RF-7.8). Exportación `.ics` como único puente | 2026-08-01 |
| D30 | **Cero OAuth con terceros** (§7.4). Ninguna función depende de la cuenta del usuario en otro servicio. Regla general, no caso por caso | 2026-08-01 |
| D31 | **La IA queda fuera del MVP por completo** (§9.1, §9.2). No es una capa opcional del MVP: no existe en Fase 1 | 2026-08-01 |
| D32 | **Railway** con la app dockerizada + Postgres gestionado. Sin Supabase: Auth.js para autenticación, Railway cron para trabajos programados, y aislamiento por capa única de acceso a datos + RLS como red (§7.1) | 2026-08-01 |
| D33 | **Tres preguntas al día, seis horarios** (RF-1.0): 09/14/19 para una persona, 10/15/20 para la otra. **Una hora exacta de desfase**, mínimo 30 min. Una toma se salta si ya hubo check-in en las 3 h previas (RF-1.0.2) | 2026-08-01 |
| D34 | **Sin cifrado extremo a extremo** (§7.3). TLS + cifrado en reposo + aislamiento por RLS. Contraseñas con hash, nunca cifrado reversible. El E2EE era el peor cambio de usabilidad por seguridad para este producto | 2026-08-01 |
| D35 | **Usabilidad por encima de sofisticación técnica** (§9.1). Ante la duda entre lo más correcto y lo más cómodo, gana lo cómodo | 2026-08-01 |
| D36 | **MVP de siete funciones** (§9.1): dos personas · canciones · mensajes y ánimo · calendario · periodo · colección · 11:11. Calendario, canciones, periodo y 11:11 entran porque **funcionan el día 1**, que es el criterio de §9.0 | 2026-08-01 |
| D37 | **Los 11:11** (M12): aviso a las 11:11 con ventana hasta 11:15, mensaje de 140 caracteres, colección propia. **Sin rachas ni contadores**; un 11:11 perdido no existe. Única función simultánea de la app, y a propósito | 2026-08-01 |
| D38 | **Nombre: PairApp**, provisional pero suficiente. Se puede cambiar en cinco minutos y no bloquea nada | 2026-08-01 |
| D39 | **TypeScript de punta a punta.** Next.js + React + Prisma + shadcn/ui, un solo servicio. Se descartó un backend Python separado: habría supuesto dos servicios, dos lenguajes y dos ORM contra la misma base de datos | 2026-08-01 |
| D40 | **shadcn/ui con *tokens* personalizados antes de la primera pantalla** (`PLAN.md` §0.4). Aporta accesibilidad resuelta; su aspecto por defecto es incompatible con §8.2 y se cambia de entrada. Los componentes con carga emocional se escriben a mano | 2026-08-01 |
| D41 | **Prisma nunca se usa crudo** (`PLAN.md` §0.1.1). Todo acceso pasa por un cliente extendido acotado al vínculo; R4 lo verifica con un test que intenta leer datos ajenos | 2026-08-01 |
| D42 | **Cero emojis; iconos de trazo coloreados por familia** (RF-8.2.2). Las nueve emociones son clima, no caras (RF-8.2.3): un estado de ánimo no es un defecto de carácter, y una tormenta lo dice mejor que un ceño fruncido | 2026-08-02 |
| D50 | **Nosotros se parte en cuatro vistas** cuando llegó a ocho secciones apiladas: Ahora · Ver juntos · Recuerdos · Después. Los 11:11 quedan fuera de las vistas y salen siempre — cuatro minutos no esperan a que cambies de pestaña. Misma barra desplazable que el cofre: si dos sitios hacen lo mismo, que se vean igual | 2026-08-02 |
| D51 | **El azar del selector se echa fuera de la función** (RF-9.7). La que elige recibe un número entre 0 y 1 en vez de llamar a `Math.random()` dentro, que es lo único que separa "elige al azar" de "elige la primera y nadie se entera" | 2026-08-02 |
| D48 | **Reparar aparece solo cuando los dos están en «algo pasó»** (§6.8). En cualquier otro momento la app estaría dando por hecho que hay una pelea, que es la clase de interpretación que §1.2 prohíbe. Los cuatro gestos se mandan como un mensaje normal: heredan entregas, estados y cofre en vez de abrir un canal paralelo | 2026-08-02 |
| D49 | **El relato de un conflicto nace privado** (RF-6.6.1). Escribirlo ya sirve aunque no se comparta nunca: ordenar lo que pasó es la mitad del trabajo. Compartirlo es una decisión aparte, y no tiene vuelta atrás | 2026-08-02 |
| D46 | **El umbral guarda en frío, no en apuntes** (§6.3). "Guardarlo y decidir mañana" pone el mensaje a esperar doce horas y la app vuelve a preguntar; las tres salidas de esa revisión —enviarlo, editarlo, dejarlo ir— pesan lo mismo y se pintan iguales. Bloquea por tiempo, nunca por contenido (P9) | 2026-08-02 |
| D47 | **Retirar y eliminar son cosas distintas** (§6.4). Retirar existe dos minutos y solo si no lo ha abierto: vuelve a tus apuntes sin dejar nada, porque no lo vio nadie. Después queda eliminar, que **deja rastro**: reescribir en silencio una historia que es de los dos no es una opción | 2026-08-02 |
| D45 | **Modo pausa: silencia avisos, no entregas** (§12.2). Lo que te manden sigue llegando y te espera al abrir. Retener las entregas haría que el cofre de la otra persona dijera "le llegó" siendo mentira, y un estado de entrega es un hecho que no se puede falsear (RF-3.17.4) | 2026-08-02 |
| D44 | **El módulo de ciclo se enciende a mano** (RF-5.0), nunca se deduce del género gramatical del perfil. «Agradecido» o «agradecida» es gramática; menstruar no. La app no adivina cuerpos | 2026-08-02 |
| D43 | **Aplazar leer no es haber leído** (RF-3.0.11). Un mensaje pospuesto desde "nombrar y elegir" guarda su hora de vuelta y sigue sin leer; el que se aplaza *después* de abrirlo sí queda visto, porque leerlo es un hecho que no se puede deshacer (RF-3.17.4) | 2026-08-02 |

### 12.2 Preguntas abiertas

1. **Las seis necesidades de RF-1.2** (*escucha · espacio · distracción · contacto · soluciones · no sé*) — ¿son las suyas? El vocabulario emocional quedó cerrado en D11; este no se ha revisado con nadie. Se ven al escribir un mensaje.
2. **¿Un mensaje de "cuando le sirva" puede volver a entregarse?** Hoy se consume al entregarse, que era la propuesta. Falta decidir si merece la pena poder marcarlo reutilizable con una espera de 60 días.

> ✅ **Resueltas:** vocabulario emocional (D11) · música (D28) · calendario (D29) · OAuth (D30) · IA fuera del MVP (D31) · hosting (D32) · horarios (D33) · **cifrado (D34)** · **alcance del MVP (D36)** · **nombre (D38)** · **modo pausa (D45)** · **exportar `.ics` en vez de sincronizar (D29)**.
>
> Quedan **dos**, las dos de vocabulario o matiz, y **ninguna bloquea nada**.
