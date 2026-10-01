# Verificación de Itinera — 30/09/2026

Las primeras secciones documentan la maqueta original. La sección «Fase 3» recoge el backend local; «Despliegue remoto» recoge el estado actual.

## Alcance y entorno

En la revisión inicial del 29/09: aplicación local en Vite, navegador integrado Chromium; todavía no se había desplegado en Cloudflare ni conectado a APIs. Los datos de Puglia son un ejemplo y no se han consultado ofertas, agendas ni precios. Durante las pruebas el viewport móvil efectivo observado fue 300 CSS px, más estrecho que un teléfono habitual.

## Flujos probados en navegador

- **Crear:** desde «Nuevo viaje», el envío vacío produjo cuatro errores asociados y foco en `#destination`. Se introdujo «Roma, Italia», salida 02/06/2027, vuelta 08/06/2027 y 1.800 €. Al crear apareció «Mi itinerario» con siete días y el presupuesto previsto.
- **Fecha nativa:** la automatización `fill()` escribió en la propiedad del input sin emitir el cambio que React registra; el siguiente campo la restablecía. Una interacción de teclado real con `ArrowUp` actualizó el valor controlado y el viaje pudo crearse. El usuario utiliza el control nativo; el helper también escucha `input`.
- **Editar/cancelar:** cambiar el destino a «Roma y Lazio» y cancelar abrió el diálogo de descarte. «Seguir editando» conservó el valor. «Aplicar cambios» mostró el nuevo título.
- **Eliminar:** «Eliminar viaje a Roma y Lazio» abrió un diálogo que identificaba el borrador. Confirmar lo quitó de la lista y esta pasó de dos a un viaje.
- **Cultura:** el filtro «Ópera» redujo la lista a una ficha. Buscar `zzzz` mostró un estado sin resultados y «Limpiar filtros» restauró la lista. Todas las fichas indican «Sin consultar».
- **Gastronomía:** se mostraron tres fichas de platos y ningún establecimiento. El ancho del documento fue inferior al ancho del viewport.
- **Tema y móvil:** el modo oscuro cambió `data-theme`, el fondo calculado a `rgb(20,32,28)` y la barra de scroll a la paleta oscura. No hubo desbordamiento horizontal en la pantalla cultural ni gastronómica.

## Comprobaciones de código

- `npm run typecheck`: correcto.
- `npm test`: 6 pruebas de validación, fechas alrededor del cambio de hora, conservación de importes, presupuesto por persona y reajuste de días; correctas.
- `npm run build`: correcto.
- `npm run format:check`: correcto.
- `npm run tokens`: correcto.
- `python3 /home/scavro/.codex/plugins/cache/openai-curated-remote/frontend-design-premium/1.4.0/skills/frontend-design-premium/scripts/audit_project.py . --mode strict`: 0 hallazgos.
- `npx --yes -p @google/design.md designmd lint DESIGN.md`: cero errores; 10 advertencias de tokens de color que el linter no ve referenciados directamente por los dos componentes declarados. Los tokens de la paleta clara y oscura sí se consumen mediante roles semánticos en `src/styles.css`.

## Límites de esta prueba

El navegador local valida interacción y presentación, no privacidad de un despliegue, persistencia entre dispositivos, costes reales, horarios, fuentes, entradas, compatibilidad de OpenCode Go ni límites de Cloudflare Free. El archivo exportado lleva marca `itinera-demo-v2`. Ningún dato de viaje se almacena en `localStorage`; solo el tema. Las pruebas de Access, D1 y modelos corresponden a las siguientes fases de `PLAN.md`.

## Revisión de crema, presupuesto e imágenes

- **Tema claro:** fondo calculado `rgb(245,240,230)` (`#f5f0e6`), con tarjetas marfil y acentos verdes; revisado a tamaño de escritorio y 390 CSS px.
- **Presupuesto:** el formulario indica «Presupuesto total por persona (€)» y calcula en directo el total del grupo. En un borrador ficticio de París, 1.500 € por persona para dos viajeros mostró 3.000 € para el grupo; el itinerario repitió ambas cifras.
- **Ilustración por destino:** al abrir París, la portada mostró el paisaje genérico con etiqueta «Paisaje de inspiración · Ilustración», en vez del paisaje específico del ejemplo de Puglia. Las visitas de París quedaron vacías, sin atribuirle las de Puglia.
- **Fotos gastronómicas:** las tres fotos de Puglia son JPEG reales de Wikimedia Commons. En el navegador cargaron con anchura natural de 960 px, texto alternativo y crédito visible con autor, fuente y licencia. En móvil, el documento midió 380 CSS px dentro de un viewport de 390 CSS px, sin desbordamiento horizontal.
- **Visitas y cultura:** siguen usando ilustraciones declaradas como tales en esta maqueta; la sustitución por fotos verificadas de cada lugar está especificada en `PLAN.md` para la versión conectada.

## Fase 3 · acceso y persistencia privados

### Entorno y pruebas automáticas

React/Vite compilado, Worker TypeScript con Better Auth 1.7.6, scrypt nativa, D1 local y Wrangler 4.143.1; Node 24.20.0. La integración usa Miniflare 5 (el runtime fijado por Wrangler), HTTPS ficticio `https://itinera.test`, D1 aislada y credenciales aleatorias desechables.

- `npm run build`: TypeScript frontend/Worker y producción correctos.
- `npm run typecheck`: correcto.
- `npm test`: seis pruebas de dominio correctas.
- `npm run cf:check`: Worker compilado, 2486,60 KiB / gzip 418,50 KiB; dry-run, sin despliegue.
- `npm run test:integration`: **36 comprobaciones correctas**: identidad única en D1, hostname alternativo denegado, API/foto privada anónima denegadas, redirección a login, recursos públicos del acceso, signup cerrado, contraseña incorrecta, Origin rechazado, login correcto, cookie Secure/HttpOnly/SameSite, respuesta de sesión mínima sin token, lectura/escritura persistente, reintento idempotente, conflicto 409, datos inválidos 400, otra sesión, logout/revocación, caducidad y límite de cinco intentos por IP cada cinco minutos.
- `npm run format:check`, `npm run tokens`: correctos.
- Audit premium strict: cero errores, advertencias o hallazgos; informe `docs/qa/premium-audit.json`.
- `designmd lint DESIGN.md`: cero errores y las diez advertencias conocidas por tokens consumidos mediante roles CSS en vez de referencias directas de componentes.
- `npm audit`: cero vulnerabilidades detectadas en el momento de la consulta.
- Preflight de `scripts/deploy.mjs`: rechazó correctamente la URL/UUID de ejemplo, sin intentar publicar.
- `wrangler check startup`: perfil local correcto, 57,2 ms de tiempo activo de arranque (3,3 ms GC). La primera ejecución con JS como workerBundle no era el formato FormData requerido; se repitió dejando compilar a Wrangler. Este perfil de arranque no mide CPU por petición ni acredita Free en Cloudflare.
- Alta/recuperación mediante `scripts/owner.mjs` comprobada con terminal PTY y credenciales locales desechables: entrada oculta, actualización correcta y revocación de sesiones. No se mostraron secretos ni hashes.

### Navegador integrado, Worker local en 8787

- Login anónimo y formulario vacío: errores asociados y foco en usuario. Contraseña incorrecta: mensaje genérico, usuario conservado, contraseña borrada y foco en contraseña. Login correcto con cuenta desechable.
- Crear «Roma, Italia · prueba», 02–08/06/2027, 1.500 €/persona y dos viajeros: itinerario de siete días y total de grupo 3.000 €. El editor cerró tras confirmación D1; recargar conservó viaje.
- Conflicto entre dos pestañas: Gemini guardado en la primera; OpenCode Go en la segunda con versión antigua produjo banner de conflicto, exportación y carga confirmada. La versión guardada conservó Gemini.
- Caducar la sesión local con el editor abierto: intento de guardar llevó a login, sin modal bloqueando el acceso. Tras reentrada, se recuperaron las notas «Museos y patrimonio romano · borrador conservado»; el reintento guardó y cerró el editor.
- Eliminar únicamente el viaje ficticio de QA: confirmación identificó el destino, enfocó «Conservar viaje» y quitó el viaje tras respuesta del servidor. Regresó al ejemplo de Puglia.
- Marcar interés por MArTA: estado pendiente, luego guardado; recargar conservó la selección.
- Sidebar fija: «Ajustes» accesible a altura reducida después de habilitar su scroll propio.
- Cerrar sesión: ambas pestañas volvieron a login; recargar exigió acceso. La API también prueba revocación en servidor.
- Login móvil claro y oscuro a **390 CSS px**, documento 380 px, sin desbordamiento horizontal; escritorio con paisaje y formulario revisado. Se restableció el viewport al terminar.

### Reconciliación visual

Se preservan paleta, tipografías y componentes. Evoluciones documentadas: acceso con paisaje y controles compartidos; texto verde sobre el cielo claro para contraste; sidebar desplazable en pantallas bajas; estados reales del guardado sustituyen las etiquetas de demo. Foco del diálogo ahora utiliza un marcador explícito, porque React autoFocus no crea un atributo HTML autofocus que pudiera consultarse.

### Límites y entrega

Estado al cierre del 29/09: no se había desplegado en Cloudflare. `wrangler whoami` indicó autorización caducada sin posibilidad de refrescarla en sesión no interactiva. D1 remota, secreto, usuario real, dos dispositivos y CPU de peticiones en Free quedan pendientes. No se ha elegido ninguna contraseña del propietario. La cuenta local de QA, sus sesiones y datos de prueba se retiraron; el propietario debe configurar acceso mediante `owner:local` o `owner:remote`.

IA, búsqueda, agendas, precios/disponibilidad y fuentes siguen sin conectar. Guardar una visita no consulta ni verifica sus datos. La selección de proveedor se conserva en D1 y no realiza llamadas. Guía remota en `docs/DEPLOYMENT.md`.

## Despliegue remoto · 30/09/2026

### Recursos y cambio de arquitectura

- HTTPS: `https://itinera.scavro.workers.dev`, Worker `itinera`, versión `a837fd42-719f-4e3d-80a0-3e20d511c868`.
- D1 remota `itinera`, UUID `1d0ae680-070d-4dfe-a053-dbf52564a860`, jurisdicción EU. Migración `0001_private_notebook.sql` aplicada. Secreto de sesión configurado sin imprimirlo ni guardarlo en el repositorio.
- La primera prueba remota pasó 17 comprobaciones, pero scrypt consumía 131–132 ms de CPU en el Worker, por encima de los 10 ms de Free. Se conservó el hash y se trasladó el handler privado a `AuthGate`, Durable Object SQLite disponible en Free. D1 sigue siendo la fuente de sesiones y cuaderno.
- El coordinador se identifica por el único propietario; se reutiliza la configuración de Better Auth, sin almacenar credenciales de peticiones en estado global. Reenvío HTTP nativo para preservar cookies y cuerpo. Sin alarmas ni tareas persistentes.
- Usuario con guion: la validación de Better Auth por defecto no coincidía con el aprovisionamiento. Se unificó a letras minúsculas, números, guion y guion bajo, 3–30 caracteres. El test local usa `prueba_con-guion`.
- Tras el cambio, 36 comprobaciones de integración local correctas, tipos/build correctos y despliegue correcto (2488,11 KiB / gzip 418,84 KiB, arranque 55 ms).

### API real y navegador

**17 comprobaciones remotas correctas**: API/fotos privadas 401, raíz redirige a login, acceso 200, registro cerrado 404, contraseña incorrecta 401, login 200 con cookie Secure/HttpOnly/SameSite, sesión sin token JSON, D1 inicial, escritura, reintento idempotente, lectura persistente, conflicto 409, origen ajeno 403, logout y cookie revocada 401.

Navegador integrado contra HTTPS real: login temporal correcto; marcar interés por MArTA mostró pendiente y después «Guardado en el servidor»; recarga conservó la selección. Logout devolvió a login; recargar mantuvo la pantalla de acceso sin cuaderno. La cuenta temporal, sesiones, hash y cuaderno de QA se retiran antes de aprovisionar al propietario.

### CPU y límites

El tail se procesó mediante una lista permitida de campos (componente, ruta, estado, CPU, tiempo y outcome). La evidencia pública `docs/qa/cloudflare-remote.json` excluye cabeceras, cookies, IP, cuerpos y credenciales. Los logs brutos de la prueba se guardaron temporalmente en `/tmp` con permisos privados y se eliminan al terminar.

La muestra de las 17 comprobaciones tras `AuthGate`: puerta Worker **0–1 ms**, login scrypt dentro del objeto **117/129 ms**, outcome `ok`. Límite documentado: Worker Free 10 ms, Durable Object 30 segundos. Es una muestra de peticiones reales, no una garantía para todas las cargas futuras ni validación de cuotas mensuales. Los tiempos de espera de D1/red se reflejan en wallTime, no son CPU.

No se ha cambiado ni contratado plan. La API de suscripciones respondió 403 por los permisos OAuth existentes; no se amplían permisos de facturación. Confirmar Workers Free y cuotas en el panel. Segundo dispositivo, cuenta real y Workers Builds pendientes de intervención del propietario. Las APIs de IA/búsqueda/ofertas siguen sin conectar; las visitas, agendas, precios y disponibilidad permanecen sin consultar.

## Fase 4 — investigación por etapas (30/09/2026)

**Aceptación previa del propietario:** confirma que su usuario/contraseña funcionan y que Cloudflare es Free. No se han cambiado credenciales ni el plan. Sigue pendiente el acceso desde un segundo dispositivo.

**Código y runtime local:** 10 tests unitarios y 76 comprobaciones de integración correctos. El buscador y el modelo están interceptados, con secretos ficticios: estas pruebas no acreditan aceptación de Tavily, Gemini ni OpenAI reales. Cubren acceso anónimo, elección de un solo proveedor, inicio idempotente, cinco etapas, conservación de fuentes/citas, recuperación, cancelación, criterios cambiados, cuota, solicitudes concurrentes y rechazo de redirecciones. Una cita inexistente o una fuente inventada impide guardar la propuesta. Typecheck, build, formato, tokens y auditoría strict correctos; evidencia estática en `qa/research-ui-audit.json`.

La prueba de runtime descubrió que workerd rechaza `redirect:error`, pese a figurar en una referencia consultada. Se usa `manual` y se rechazan respuestas no exitosas; el test confirma que una redirección no envía la credencial a otra URL. No hay logs de errores externos crudos en el bundle publicado.

**Navegador, entorno aislado en 8790:** login desechable, estado inicial, progreso real de etapas simuladas, propuesta guardada, referencias y cobertura desplegadas, categorías sin resultados, fallo 429 visible, reanudación hasta completar y cancelación durante un paso. Misma propuesta recuperada al pasar de Preparar a Cultura. Tema oscuro y viewport 390 × 844: ancho del documento observado 380, sin desbordamiento horizontal. Prueba local, no visita real ni precios comprobados. Fuentes y modelo ficticios claramente identificados.

**Producción:** versión `6177f2c1-4cbf-4854-a9ed-ae6398bd8c66` publicada. Seis comprobaciones remotas: login 200 y conexiones/investigación 401 sin sesión; evidencia en `qa/research-remote.json`. Navegador remoto muestra el formulario de acceso; no se ha usado la contraseña del propietario ni validado llamadas IA reales. La petición Python de comprobación devolvió 403; Node y navegador permiten el acceso, por lo que no se presenta ese fallo del cliente como caída de la aplicación. Migración `0002_research.sql` aplicada: cinco comandos aditivos, sin modificar tablas del acceso ni del cuaderno. Antes se exportó solo `notebook` a una ubicación privada fuera de Git. La revisión automática rechazó exportar toda D1 por incluir hashes/sesiones; no se ejecutó esa copia. La copia parcial no sirve para restaurar por sí sola todas las credenciales.

**Conexiones reales:** `wrangler secret list` muestra solo `BETTER_AUTH_SECRET`. No hay claves de Tavily/modelo y no se han enviado consultas reales. OpenAI queda bloqueado (`ALLOW_PAID_AI=false`); Gemini necesita clave de un proyecto con cuota gratuita si se desea coste cero. Límites internos de 200 búsquedas/lecturas y 50 propuestas al mes, contando intentos reservados. Una clave configurada deberá superar una prueba real antes de declarar esa conexión aceptada.

**GitHub/Builds:** OAuth de Wrangler devolvió 403 para configurar Builds. El panel autenticado reconoce `scavro/Itinera` y se ha preparado `main`, `npm run build`, `node scripts/deploy.mjs`, Node 24.20 y previews desactivadas. Falta autorizar una credencial propia de despliegue, conectar y comprobar que un commit produce un deploy correcto. No se usó el token preseleccionado de otro proyecto.

**Límites del módulo:** hasta tres búsquedas y cinco páginas leídas parcialmente; sin cobertura exhaustiva de agendas, importación de propuestas al itinerario, fotografías nuevas ni conectores de ofertas. Citas coincidentes no acreditan todas las afirmaciones del modelo. Precios, horarios para una fecha y entradas disponibles siguen pendientes. El resto del plan conserva esas fases.

## Contraste del informe externo — 30/09/2026

Cambios detallados en `REVISION-INFORME.md`; el original `INFORME.md` se conserva localmente. Pruebas unitarias: **25**; integración con Workers/DO/D1 aislados: **89** comprobaciones. Typecheck, build, formato, tokens y auditoría premium strict exigidos para esta revisión. No se han instalado dependencias ni skills, cambiado contraseñas reales o activado consumo de pago.

Navegador local con base efímera y proveedores interceptados:

- Conflicto de PUT: aparece «Cambios sin guardar», volver conserva los cambios y cerrar sin guardar vuelve al login pese al conflicto. Captura `qa/review-logout.jpg`.
- Dos viajes ficticios: abrir Puglia cuando Roma está activo cambia al itinerario de Puglia.
- Sesión caducada: la propuesta guardada se recupera; cambiar tema en el login mantiene modo e icono en el cuaderno y restaura el título «Preparar viaje · Itinera».
- Cinco etapas muestran propuesta, tres fuentes, fechas y lectura parcial. El desplegable de fuentes funciona.
- Tema claro y oscuro a 390 px: documento 380 px, sin desbordamiento horizontal. Captura de contexto `qa/review-mobile.jpg`; el screenshot de IAB conserva un lienzo mayor que el viewport emulado, por lo que no se usa para medir dimensiones.
- Gastronomía cambia de «Me interesa» a «Quitar de intereses» y cierre normal vuelve al acceso. Consola sin errores capturados.

La captura de descarga mediante `waitForEvent('download')` se bloqueó en la herramienta y no permitió validar el fichero exportado en esta sesión. No se presenta esa descarga como prueba completada. El botón y la función de exportación siguen disponibles. Estos recorridos no acreditan llamadas a proveedores reales ni un login del propietario en producción.

**Publicación de las correcciones:** commit `90403bb`, Worker `716bc76c-a33d-4c0c-91b7-47c10e394bde`. Ocho comprobaciones remotas anónimas correctas: login y JS 200 con `nosniff`, caché de JS conservada, sesión/cuaderno/conexiones/investigación 401 y mutaciones de origen ajeno 403. Evidencia `qa/review-remote.json`. No se han aplicado migraciones ni usado la cuenta del propietario.

**Retirada de QA:** al enviar SIGINT, el proceso terminó antes de eliminar su fichero de credenciales. Se eliminó el fichero temporal explícitamente y se ajustó el harness para borrarlo antes de esperar a workerd, además de limpieza síncrona en `exit`. La eliminación se verifica por ausencia del fichero; no se presupone a partir de la señal enviada.

Se volvió a iniciar y retirar el harness corregido. Se comprobó que el fichero temporal existía durante la prueba y había desaparecido al terminar; servidor de QA retirado y pestaña cerrada.


## Cuatro proveedores y fichas de investigación — 01/10/2026

Petición explícita del propietario: preparar claves de Gemini, OpenAI, Claude y OpenCode Go, sin exigir elegir otro servicio por la orientación de Go. Se añaden Claude Messages y OpenCode Go Chat Completions. Solo se usa el proveedor elegido al iniciar cada investigación; no hay fallback de modelo, reparación mediante otra llamada ni endpoint Zen de pago por uso. Go envía identidad real de Itinera y una sesión estable por trabajo. OpenAI y Claude conservan el bloqueo de consumo hasta configurar `ALLOW_PAID_AI=true`. No se han introducido claves reales ni enviado consultas reales. Modelos y nombres de secretos en CONNECTIONS.md.

**Verificación técnica:** 33 pruebas unitarias en 6 archivos y 107 comprobaciones de integración con Workers, Durable Object y D1 efímeros. Transporte de proveedores interceptado: auth/esquema de Claude, endpoint/identidad/sesión de Go, salidas incompletas y JSON inválido, 429 sin fallback, límites y bloqueo de consumo. Integración: referencias del dossier pertenecientes al viaje, índices válidos, importación idempotente, acceso privado a biblioteca, conservación de fichas al cambiar criterios y rechazo de nuevas importaciones desactualizadas. Cuaderno sin el campo nuevo sigue válido. Typecheck/build, dry-run de Wrangler, formato, tokens y auditoría premium strict correctos; `qa/connections-static-audit.json` no contiene hallazgos. Sin dependencias nuevas ni migraciones.

**Navegador aislado, datos y proveedor ficticios:** guardar museo, ópera y plato; añadir museo al itinerario y moverlo al 16/05/2027; abrir fuentes/cita desde el detalle del itinerario; marcar el plato probado y filtrar; conflicto 409 visible, propuesta disponible y reintento confirmado una sola vez tras recuperación. Ajustes muestra los cuatro proveedores. En móvil 390 × 844 se detectó un espacio fotográfico demasiado alto; corregido mediante PhotoPending compartido (160 px, compacto 72 px), captura y lectura del DOM confirmaron altura de 160 px y documento de 380 px, sin desbordamiento horizontal. Claro y oscuro comprobados. Tras reconstruir los assets se reinició el entorno efímero, se generó otra propuesta ficticia y la ficha del plato permaneció después de recargar. No se ha probado en navegador un fallo de GET de biblioteca ni la descarga/exportación de esta fase.

Capturas locales: `qa/four-providers.jpg`, `qa/imported-museum.jpg`, `qa/imported-food-mobile.jpg`, `qa/imported-food-dark.jpg`. Los estados «Clave configurada» visibles son secretos ficticios del harness, no conexiones aceptadas en producción. Las fichas nuevas muestran fotografía real pendiente; todavía no se obtienen imágenes nuevas.

**GitHub automático:** el propietario volvió a abrir Cloudflare, pero la vista del Worker volvió a bloquearse y fallar en el navegador integrado. No se ha creado token ni conectado Builds. La autorización OAuth existente no permite configurarlo por CLI. Se conserva pendiente; no se afirma que un push despliegue automáticamente.
