# Verificación de Itinera — 29/09/2026

Las primeras secciones documentan la maqueta original. La sección «Fase 3» recoge el estado actual con backend privado.

## Alcance y entorno

Aplicación local en Vite, navegador integrado Chromium; no se ha desplegado en Cloudflare ni conectado a APIs. Los datos de Puglia son un ejemplo y no se han consultado ofertas, agendas ni precios. Durante las pruebas el viewport móvil efectivo observado fue 300 CSS px, más estrecho que un teléfono habitual.

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

No se ha desplegado en Cloudflare. `wrangler whoami` indicó autorización caducada sin posibilidad de refrescarla en sesión no interactiva. D1 remota, secreto, usuario real, dos dispositivos y CPU de peticiones en Free quedan pendientes. No se ha elegido ninguna contraseña del propietario. La cuenta local de QA, sus sesiones y datos de prueba se retiraron; el propietario debe configurar acceso mediante `owner:local` o `owner:remote`.

IA, búsqueda, agendas, precios/disponibilidad y fuentes siguen sin conectar. Guardar una visita no consulta ni verifica sus datos. La selección de proveedor se conserva en D1 y no realiza llamadas. Guía remota en `docs/DEPLOYMENT.md`.
