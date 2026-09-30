# Plan del asistente personal de viajes

Fecha: 30 de septiembre de 2026. Estado: web privada desplegada con Worker, Durable Object SQLite y D1 EU. Usuario propio y Workers Free confirmados por el propietario. Primer módulo de IA/búsqueda construido y probado con servicios simulados; claves y validación real pendientes. Workers Builds preparado en el panel, pendiente de autorizar su credencial y verificar un despliegue por commit. Véanse `docs/CONNECTIONS.md` y `docs/VERIFICATION.md`.

## Objetivo y alcance acordado

Web privada para un único usuario, accesible desde móvil y ordenador con navegador. Aplicación, datos y conexión a la IA alojados en la nube; debe seguir funcionando con el ordenador de casa apagado. Infraestructura dentro de Cloudflare Free. El consumo de modelos y fuentes externas se contabiliza aparte.

El usuario describe destino, fechas y presupuesto. El asistente pregunta lo imprescindible, investiga, compara alternativas, propone un itinerario y conserva las decisiones. Se pueden configurar conexiones de distintos proveedores, pero solo se utilizará un proveedor/modelo activo cada vez, elegido por el usuario. Basta configurar una conexión; las demás son opcionales.

Las prioridades culturales permanentes son museos de historia, museos de arte y patrimonio de la antigua Roma, incluidos yacimientos y domus. Se buscarán óperas y programación cultural para las fechas concretas. También se presentarán los lugares emblemáticos de cada destino, manteniendo las preferencias personales como criterio principal.

Quedan excluidas las búsquedas, recomendaciones, clasificaciones y reservas de restaurantes. La gastronomía se centra en platos y productos típicos del país y de la región visitada. Las pausas para comer quedan libres. El presupuesto puede incluir una cantidad diaria para comidas elegida por el usuario, identificada como estimación.

La primera versión cubre planificación, comparación y consulta de información. Las compras y reservas se completan en las webs de los proveedores.

## Interfaz propuesta

1. **Mis viajes:** borradores, viajes guardados y acceso al viaje activo.
2. **Preparar viaje:** conversación y ficha editable con origen, destino/regiones, fechas, flexibilidad, viajeros, moneda, presupuesto total por persona, transporte, equipaje, alojamiento, intereses y ritmo. El total del grupo se calcula y muestra por separado.
3. **Comparar:** hasta tres alternativas comparables, con tiempos, costes conocidos, costes estimados y conceptos pendientes. Elegir una conserva las otras.
4. **Mi viaje:** itinerario diario editable, enlaces a lugares y mapas, traslados, entradas, horarios, comprobaciones pendientes y checklist. Las visitas que exijan reserva pendiente se identifican como provisionales.
5. **Visitas y Cultura:** museos de historia y arte, patrimonio romano, ópera y agenda cultural durante el viaje, y lugares emblemáticos. Filtros por ciudad, fecha y categoría; acciones «me interesa», «añadir al itinerario» y «descartar». Cada ficha explica su relación con los intereses del usuario y muestra duración orientativa, ubicación, horarios, entradas y fuentes.
6. **Qué probar:** gastronomía del país y de cada región, nombre original, explicación en español, fotografía real, ingredientes habituales, variantes y temporada. Permite marcar «me interesa» y «probado», sin recomendar establecimientos. Prioridad a oficinas de turismo y fuentes culturales o gastronómicas reconocidas.
7. **Ajustes:** conexiones opcionales, selector de un proveedor/modelo activo, límites de consumo, exportación y cierre de sesión. Las claves nunca se muestran ni se descargan al navegador. No hay consultas simultáneas a varios modelos ni cambio automático de proveedor al fallar una conexión.

Interfaz adaptada primero al móvil: controles táctiles, presupuestos legibles, fuentes desplegables y progreso real de búsqueda. Se podrá detener una investigación y conservar lo ya obtenido. Los estados de progreso los emite el servidor al ejecutar acciones.

### Imágenes por destino

La portada de Puglia utiliza su ilustración propia. Para otros viajes, el esqueleto muestra una ilustración de inspiración genérica y la identifica como tal. La versión conectada elegirá una imagen real o ilustración específica del destino desde una colección verificada; cada imagen conservará lugar representado, autor, fuente, licencia y URL de la licencia. Una falta de imagen verificada mantiene la portada genérica, sin adjudicarle una localidad falsa.

Las fichas definitivas de museos, yacimientos y monumentos mostrarán fotografías del sitio correcto cuando haya una fuente reutilizable; una exposición temporal requerirá comprobar edición y fecha. Las fichas gastronómicas usarán fotografías reales del plato y explicarán si muestran una variante. Aunque la web sea de acceso privado, se comprobará la licencia de cada fotografía y se mostrará el crédito exigido. Las tres fotos del ejemplo están registradas en `public/assets/food/CREDITS.md`.

## Visitas y Cultura: selección e investigación

### Preferencias y composición del itinerario

- Priorizar museos de historia y de arte, incluidas colecciones permanentes y exposiciones temporales que coincidan con las fechas.
- Investigar patrimonio romano en cualquier destino: yacimientos, domus, villas, mosaicos, termas, teatros, anfiteatros, foros, calzadas, acueductos y colecciones arqueológicas. El interés por Roma no se limita a visitar la ciudad de Roma.
- Buscar funciones de ópera para los días del viaje y destacarlas incluso si requieren ajustar una tarde o noche. La incorporación al itinerario depende de la elección del usuario y de las entradas disponibles.
- Incluir referencias a lugares emblemáticos, como la Torre Eiffel en París. La popularidad no desplaza automáticamente museos o patrimonio romano; el usuario elige qué incorporar. No se inventarán rankings ni estadísticas de búsquedas.
- Proponer un itinerario viable por zonas, con tiempo de visita, traslados, descansos, horarios de cierre y aforo/reserva. La duración estimada se identificará como tal. Evitar solapamientos entre museos y funciones con hora fija.

### Cobertura de agendas culturales

Para cada ciudad y zona visitada se elaborará un inventario de agendas: ayuntamientos, turismo local y regional, museos, instituciones de patrimonio, teatros de ópera, auditorios y festivales. La búsqueda incluirá el idioma local y agendas publicadas en páginas, calendarios o PDF cuando sean accesibles. Se revisarán todas las agendas identificadas dentro del área del viaje; los alrededores dependerán del tiempo de desplazamiento aceptable.

Se registrará por agenda: institución, URL, área, periodo cubierto, fecha de consulta y estado (revisada, programación todavía no publicada, inaccesible o pendiente). Se ampliará el inventario mediante búsqueda web y enlaces entre instituciones. Una búsqueda finita no demuestra cobertura absoluta de toda la zona: se mostrará la cobertura conseguida y lo pendiente.

Cada evento conservará título, disciplina, sede, fecha y hora local, duración si está publicada, organizador, fuente oficial, enlace de entradas, precio y disponibilidad por separado. En ópera se añadirá obra y compositor, y lengua o sobretítulos si la fuente los publica. Diferenciar representación en vivo, concierto y proyección. Unificar duplicados sin perder las distintas funciones de una misma obra.

Validar el año y la edición: una agenda antigua no acredita programación actual. Si la temporada aún no está publicada, mostrar «Programación pendiente», sin concluir que no habrá funciones. La ausencia de resultados se expresará como «No se han encontrado funciones en las agendas consultadas». Reconsultar mediante «Actualizar agenda»; cambiar las fechas o regiones obliga a revisar la coincidencia temporal y las fuentes pertinentes.

Una función anunciada no acredita entradas disponibles. Comprobar venta, localidad/categoría y gastos cuando sea posible; distinguir «venta aún no abierta», «agotado», «cancelado» y «disponibilidad sin comprobar».

## Arquitectura recomendada para Cloudflare

- Interfaz en React y TypeScript, compilada como archivos estáticos y servida mediante Workers Static Assets.
- Worker TypeScript como puerta de entrada, con un Durable Object SQLite `AuthGate` para autenticación y operaciones privadas del único propietario. D1 sigue siendo la fuente de sesiones y viajes. El reenvío HTTP conserva cookies y el handler de Better Auth. El coordinador descarga la CPU de scrypt del Worker; no hay alarmas ni procesos de fondo. Sustituye la propuesta inicial de servidor Python/FastAPI.
- Cloudflare D1 para viajes, preferencias, mensajes, alternativas, itinerarios, visitas, eventos culturales, cobertura de agendas, gastronomía, evidencias y consumo.
- Workers Secrets para claves de modelos y proveedores de datos. Configuración inicial mediante Cloudflare; el selector web utiliza únicamente conexiones ya configuradas.
- Acceso propio de la aplicación con un único nombre de usuario y contraseña, sin registro público. Se protegerán interfaz, API, exportaciones y rutas de previsualización.
- Dirección inicial workers.dev protegida por la autenticación de la aplicación; dominio propio opcional y con coste independiente si hay que comprarlo.
- Despliegue mediante Workers Builds conectado al repositorio GitHub `scavro/Itinera`. Preparar y probar el Worker, la autenticación y la configuración de D1 antes del primer despliegue privado.

Las tareas de investigación se dividirán en pasos cortos, con límites de llamadas y resultados parciales guardados. Un cierre de navegador conserva los resultados ya confirmados; el MVP reanuda la investigación al volver, sin prometer que continúa ejecutándose en segundo plano. Las operaciones se identificarán para evitar duplicar escrituras o llamadas ante reintentos.

Se limitarán respuestas externas, tamaño de contexto y rondas de herramientas. Los cálculos usan código y cantidades monetarias exactas. La ejecución remota tendrá que demostrar que cumple el límite de CPU del plan gratuito; no se presume a partir de pruebas locales.

## Acceso con usuario y contraseña

Requisito: solo el propietario puede entrar, sin depender de su PC y sin registro público.

Decisión del usuario: nombre de usuario y contraseña exclusivos de Itinera, con una experiencia sencilla para un único propietario. No se requiere una cuenta Google ni Cloudflare para entrar en la web.

Implementado con Better Auth 1.7.6 y D1: contraseña scrypt nativa (N=16384, r=16, p=1), sesiones revocables de dos horas, cookies HttpOnly/Secure en HTTPS y cinco intentos de login por IP cada cinco minutos. El servidor solo permite la identidad `owner` y los endpoints de entrada/salida. El alta y recuperación se realizan con `owner:local` o `owner:remote`, con contraseña oculta en terminal. Las credenciales nunca se incluyen en GitHub. La integración local y las pruebas remotas están completadas. La primera versión necesitaba 131–132 ms de CPU para entrar, fuera de los 10 ms de Worker Free. Tras trasladar el handler a `AuthGate`, la muestra remota del Worker fue 0–1 ms y las dos verificaciones scrypt del objeto 117/129 ms, bajo su límite de 30 segundos. La muestra no garantiza cuotas futuras; el plan de la cuenta queda por confirmar.

La identidad se verificará en servidor antes de entregar páginas privadas, datos o exportaciones. Las URLs alternativas y previsualizaciones deben quedar protegidas o desactivadas. Las peticiones que modifican datos verificarán el origen. El Worker debe ejecutarse antes de servir los archivos privados de la interfaz.

Para equipos compartidos: sesión corta, cierre de sesión visible con revocación correspondiente y respuestas privadas sin caché persistente del navegador. El MVP no guardará viajes ni claves en localStorage ni ofrecerá almacenamiento offline automático. Un ordenador comprometido queda fuera de lo que puede proteger la web; se prioriza el móvil propio.

## Modelo de IA y herramientas

Opciones de conexión previstas, con un único proveedor/modelo activo:

- OpenAI mediante su API, independientemente de la suscripción a ChatGPT.
- Gemini mediante su API.
- OpenCode Go: el usuario se refiere expresamente a esta suscripción. La documentación publica una clave y endpoints propios bajo `/zen/go/v1/`, pero describe el servicio para OpenCode y otros agentes de programación, y pide tráfico propio de esos agentes. Queda pendiente confirmar que admite el uso de un asistente de viajes antes de habilitar esta conexión para el proyecto. La existencia del endpoint no demuestra que cualquier uso esté cubierto por la suscripción. No se sustituirá Go por Zen de pago por uso ni se activará consumo de saldo adicional automáticamente.

Una interfaz interna común ofrecerá generación, respuestas progresivas, llamadas a herramientas y registro de consumo. Los adaptadores resolverán las diferencias reales entre protocolos. Cada modelo habilitado debe superar una prueba de herramientas y formatos; una respuesta con estructura correcta no garantiza hechos correctos.

Cambiar de proveedor mantiene los viajes y preferencias guardados. Se envía al modelo el contexto necesario del viaje, con resúmenes y un historial acotado. No se reenviarán claves. El cambio entre proveedores será explícito, sin desvío silencioso de datos a otro servicio. Si hay una investigación en curso, el cambio se aplicará al terminarla o cancelarla, sin mezclar proveedores dentro de esa investigación. No se harán consultas comparativas ni validaciones usando un segundo modelo. Solo se requiere la clave de la conexión elegida; configurar el resto es opcional.

La búsqueda y las reservas son capacidades distintas de la generación de texto. Se usará búsqueda nativa donde esté disponible o un proveedor de búsqueda separado. Un modelo sin acceso a búsqueda no podrá presentarse como capaz de consultar precios actuales.

Herramientas previstas: buscar fuentes, consultar información de lugares y museos, localizar patrimonio romano, descubrir y revisar agendas culturales, buscar funciones de ópera, consultar ofertas de transporte/alojamiento cuando exista conector válido, comprobar precio/disponibilidad, guardar y recuperar viaje, calcular presupuesto y obtener gastronomía. No se expondrá una herramienta de búsqueda de restaurantes.

Controles: esquemas de entrada/salida, herramientas permitidas, límites de reintentos, tiempo y coste por investigación, cancelación y errores visibles. Las páginas externas se tratarán como información, nunca como instrucciones. La obtención de URLs evitará destinos privados, redirecciones no permitidas y respuestas desproporcionadas.

## Comprobar precios, disponibilidad y horarios

### Principio

Se puede demostrar qué información devolvió una fuente en una consulta concreta. No se puede garantizar que una tarifa o plaza siga disponible después. La app mostrará «consultado a las…» y las condiciones, sin convertir esa observación en una reserva.

La comprobación se asigna por dato: precio, disponibilidad, horario, condición de cancelación, equipaje o tasas pueden tener fuentes y estados diferentes. Una página oficial con una tarifa general puede acreditar ese precio general, pero no disponibilidad para una fecha concreta.

### Procedimiento

1. Convertir el encargo en criterios exactos: fechas, zona horaria, viajeros/edades cuando sean necesarios, noches, habitaciones, equipaje y moneda.
2. Buscar candidatos. Un resultado de buscador o un precio «desde» solo es una pista.
3. Consultar la web oficial o API que venda el servicio, con esos criterios. Para visitas: lugar correcto, modalidad de entrada, fecha, franja y categoría de visitante. Para alojamientos: habitación, ocupación, noches, impuestos, régimen y cancelación. Para transporte: trayectos completos, pasajeros, equipaje y suplementos obligatorios.
4. Extraer datos estructurados asociados a una evidencia. Cuando se utilice IA para extraerlos, validar campos, unidades, entidad y correspondencia con el fragmento o respuesta conservados. Los datos ambiguos necesitan comprobación adicional.
5. Calcular el total mediante código. Mostrar moneda original, conversión orientativa con su fecha, cargos pendientes y posibles exclusiones. No rellenar importes desconocidos con cero.
6. Contrastar con otra fuente independiente cuando haya contradicciones o dudas. Dos páginas que replican el mismo dato no constituyen dos comprobaciones independientes. Dar preferencia al vendedor para su propia oferta, manteniendo las diferencias visibles.
7. Volver a consultar al pulsar «Comprobar ahora» y antes de abrir una opción para reservar. Un error conserva la observación histórica y su antigüedad; no la presenta como actual.

Estados visibles:

| Estado                 | Significado                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Consultado             | La fuente devuelve ese dato para las condiciones indicadas; se muestra cuándo.               |
| Orientativo            | Tarifa general, precio «desde», conversión o estimación.                                     |
| Pendiente              | Falta evidencia suficiente, la fuente está bloqueada o faltan condiciones.                   |
| Requiere actualización | La observación superó la antigüedad fijada para ese tipo de dato o cambió el encargo.        |
| Discrepancia           | Las fuentes ofrecen resultados incompatibles.                                                |
| No disponible          | La fuente declara que no hay plazas/oferta para esa consulta; no equivale a un fallo de red. |

La marca «Consultado» la genera el servidor a partir de una llamada completada y evidencia válida, no porque el modelo escriba que lo comprobó. La evidencia no depende de una etiqueta global de confianza.

Cada observación conservará proveedor y URL/identificador, momento de consulta, criterios, importe y moneda cuando proceda, condiciones, fragmento o campos que la respaldan y resultado de validación. Se respetarán las condiciones de almacenamiento de cada proveedor, evitando conservar páginas completas sin necesidad.

La caducidad será configurable por tipo de dato: minutos para ofertas volátiles y plazos mayores para información estable. Es una política de prudencia de la aplicación, no una garantía del proveedor. Una edición de fechas, ocupación o equipaje invalida las observaciones que dependan de esos campos.

Horarios: comprobar el día concreto, temporada, festivos, cierres y última admisión. Tiempo meteorológico: diferenciar pronóstico disponible de referencias climáticas estacionales. Gastronomía: identificar país y región sin presentar una variante local como propia de todo el país.

### Límite de cobertura y selección de fuentes

Antes de construir cada conector se verificará acceso real, requisitos de alta, coste, restricciones y una respuesta de ejemplo para fechas concretas. La disponibilidad de vuelos, trenes, hoteles o entradas no se presupone universal. No se compromete todavía un proveedor de reservas.

La primera comprobación automática de extremo a extremo utilizará una fuente oficial accesible. Después se incorporarán proveedores de ofertas cuya cobertura y acceso se hayan demostrado. Cuando la automatización no pueda leer una web, se mostrará el enlace y la comprobación manual pendiente; una observación añadida por el usuario quedará identificada como tal.

## Presupuesto y gratuidad

Documentación consultada a 30/09/2026:

- Workers Free: 100.000 solicitudes diarias y 10 ms de CPU por invocación HTTP. La espera de red no cuenta como CPU. Los archivos estáticos tienen su régimen gratuito propio; ejecutar lógica de Worker sigue sujeto a sus límites.
- D1 Free: 5 millones de filas leídas/día, 100.000 escritas/día y 5 GB totales por cuenta. Existen otros límites, incluido el tamaño por base de datos, que se revisarán al configurar.
- Durable Objects SQLite está disponible en Free: 100.000 solicitudes y 13.000 GB-s diarios; CPU por petición de 30 segundos. Se usa un solo coordinador porque solo existe un propietario. No se utiliza almacenamiento SQL del objeto para el cuaderno; este permanece en D1. Las cuotas se comparten con los demás proyectos de la cuenta.
- El acceso se implementa en la aplicación; no requiere Cloudflare Access. La medición remota queda dentro de los límites de CPU, el propietario confirma Workers Free, pero la muestra no acredita un mes de consumo.
- Las APIs de IA, búsqueda y ofertas tienen condiciones y costes propios. Cloudflare Free no las incluye.

Se usarán índices y consultas acotadas, registro de consumo y actualizaciones bajo demanda. Implementado: límites mensuales conservadores de 200 operaciones de búsqueda/lectura y 50 llamadas al modelo, separados del presupuesto del viaje. El límite diario sigue pendiente de acordar; no está implementado. El tope interno reservará margen antes de iniciar llamadas y limitará tokens/herramientas; la estimación de coste no sustituye a los límites de facturación disponibles en cada proveedor.

La prueba de aceptación medirá CPU y uso en Cloudflare real. Si alguna función excede Free, se simplificará o quedará pendiente; no se activará una modalidad de pago automáticamente. La cuota disponible puede estar compartida con otros proyectos de la cuenta.

## Secuencia de implementación

1. **Especificación y viabilidad:** fijar pantallas, contrato de evidencias y criterios de prueba. Variante de acceso elegida: usuario y contraseña propios. Validar una fuente real y el proveedor de IA elegido.
2. **Esqueleto funcional:** interfaz móvil, viajes editables, presupuesto por código, almacenamiento y escenario ficticio reproducible. Datos de ejemplo identificados como demostración.
3. **Cloudflare y privacidad:** Worker y `AuthGate`, login, D1 local/remota EU, secreto, persistencia, conflictos y recuperación implementados. Despliegue HTTPS, 17 comprobaciones remotas, guardado/reload/logout en navegador y medición CPU correctos. La cuenta temporal de QA se retira; usuario propio y Workers Free confirmados por el propietario. Pendientes acceso entre dispositivos y conexión final de GitHub a Workers Builds. Pasos en `docs/DEPLOYMENT.md`.
4. **IA, cultura y gastronomía:** primer módulo con Tavily y adaptadores Gemini/OpenAI construido, investigación por etapas, fuentes/citas y cuotas probadas con fixtures. Claves y validación real pendientes. Después ampliar cobertura de agendas, incorporar fichas seleccionables e imágenes; preparar los adaptadores opcionales sin exigir otras claves. Incorporar Visitas y Cultura, cobertura de agendas, fichas culinarias por país y región y selección de un único modelo activo. Los otros adaptadores solo se validan en vivo cuando se decida usarlos y se disponga de sus credenciales.
5. **Verificación:** observaciones con evidencia, estados, discrepancias, caducidad, recálculo y «Comprobar ahora». Añadir conectores de ofertas conforme superen la prueba de viabilidad.
6. **Prueba integral y publicación privada:** viaje ficticio con fuentes reales, navegación móvil y desde otro equipo, medición del plan Free y aceptación visual del usuario.

Los despliegues usarán versiones recuperables. Antes de cambios de esquema se preparará exportación/recuperación de datos; volver a una versión del código no debe desproteger la aplicación ni destruir viajes. Se documentará la restauración.

## Prueba ficticia y criterios de aceptación

Caso propuesto: dos adultos, salida desde Madrid, viaje a Puglia, del 15 al 22 de mayo de 2027, presupuesto de 2.000 EUR por persona (4.000 EUR para ambos), prioridad a museos de historia y arte, patrimonio romano, ópera si hay funciones y lugares emblemáticos, ritmo tranquilo. Son parámetros de prueba, no una afirmación de viabilidad, programación o precios.

Primero datos controlados y después consultas reales para el mismo encargo. Se conservará la distinción entre demostración y evidencia en vivo.

- Crear, cambiar, guardar y recuperar el viaje desde otro dispositivo.
- Priorizar museos y patrimonio romano, incluir lugares emblemáticos como opciones y explicar la selección.
- Probar agenda antigua, temporada no publicada, función fuera de fechas, eventos duplicados, distintas funciones de la misma obra, venta no abierta, entradas agotadas y cancelación.
- Comprobar que una agenda inaccesible aparece pendiente y que «no se encontraron funciones» no se convierte en «no hay ópera».
- Mostrar el inventario de agendas revisadas y evitar solapamientos entre visitas, traslados y ópera.
- Cambiar las fechas y comprobar que se revisan eventos, horarios y entradas afectados.
- Funcionar con una sola clave configurada. Registrar que todas las llamadas de una investigación usan el proveedor activo y que un fallo no dispara llamadas a otro proveedor.
- Leer gastronomía italiana y de Puglia sin recomendaciones de restaurantes.
- Verificar que el presupuesto incluye gastos previstos de comida sin inventar establecimientos ni tarifas.
- Detectar precio por noche frente a total, tasas faltantes, cambio de ocupación y cambio de equipaje.
- Probar oferta agotada, entrada sin franja disponible, festivo/cierre y fuentes discrepantes.
- Probar proveedor caído, clave inválida, cuota agotada y web inaccesible: el asistente debe explicar el límite y conservar lo obtenido.
- Intentar que un modelo afirme una consulta o guardado no ejecutados: la aplicación no debe marcarlo como confirmado.
- Comprobar costes, cancelación y reanudación sin duplicar operaciones.
- Probar acceso anónimo y de otra identidad, rutas alternativas, exportaciones y sesión finalizada.
- Confirmar que ninguna clave llega al HTML, JavaScript, respuestas API o registros.
- Medir CPU real de las operaciones principales en Workers Free.
- Validar el flujo completo con al menos un proveedor IA y una fuente real. Cada proveedor adicional se declara probado solo después de su propia prueba en vivo.

## Decisiones que quedan para implementar

- Primer proveedor/modelo y claves, que se configurarán como secretos.
- Confirmación del encaje del asistente de viajes en el uso admitido por OpenCode Go antes de habilitar esa opción; la interfaz y los demás adaptadores pueden avanzar independientemente.
- Tope de gasto de IA/búsqueda y fuentes de ofertas a las que se tenga acceso.
- Dirección inicial ya activa: `https://itinera.scavro.workers.dev`. Dominio propio opcional.

Estas decisiones no requieren todavía credenciales para revisar el plan ni construir la interfaz de demostración.

## Fuentes oficiales consultadas

- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Workers: precios](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workers: límites y CPU](https://developers.cloudflare.com/workers/platform/limits/)
- [Durable Objects: límites](https://developers.cloudflare.com/durable-objects/platform/limits/)
- [Durable Objects: cuotas gratuitas](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [D1: precios y comportamiento al superar cuotas](https://developers.cloudflare.com/d1/platform/pricing/)
- [Workers Builds e importación de repositorios](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Integración con GitHub](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/)
- [Ejecutar el Worker antes de servir archivos privados](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- [Secretos de Workers](https://developers.cloudflare.com/workers/configuration/secrets/)
- [OpenAI: llamadas a herramientas](https://developers.openai.com/api/docs/guides/function-calling)
- [Gemini: llamadas a herramientas](https://ai.google.dev/gemini-api/docs/function-calling)
- [OpenCode Go: uso previsto, suscripción y endpoints de API](https://opencode.ai/docs/go/)
