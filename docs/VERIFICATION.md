# Verificación del esqueleto — 29/09/2026

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
