# UX Contract

## Product context and business-context sources

Producto personal, español es-ES, móvil y escritorio. Referencia funcional: `PLAN.md` (alcance, prioridades culturales, precios, privacidad, proveedores y despliegue). Esta entrega es un **esqueleto de demostración en memoria**, sin backend, cuenta ni facturación. No sustituye las siguientes fases del plan. No hay registro, cobros ni reservas. La eliminación afecta únicamente al borrador de la pestaña, previa confirmación. Exportar descarga un archivo privado que el usuario controla. No se escriben viajes ni credenciales en almacenamiento del navegador. La única preferencia persistida es el tema. Japón no es mercado ni locale objetivo.

## Visual contract

`DESIGN.md` → `scripts/generate-tokens.mjs` → `src/tokens.css` → roles de `src/styles.css` → componentes. Temas claro/oscuro y preferencias de movimiento/contraste. Accesibilidad objetivo WCAG 2.2 AA, sin afirmar certificación.

## Canonical UI Map

| Capability     | Canonical owner                             | Source of truth                 | Allowed variants | Verification                        |
| -------------- | ------------------------------------------- | ------------------------------- | ---------------- | ----------------------------------- |
| Select/Listbox | Field en src/components/ui.tsx              | UX-CONTRACT.md                  | native           | teclado y popup en navegador        |
| Date           | Field en src/components/ui.tsx              | UX-CONTRACT.md                  | native           | edición ISO, interfaz nativa del OS |
| Form           | TripEditor en src/components/TripEditor.tsx | src/domain.ts                   | create / edit    | validación y conservar borrador     |
| Scrollbar      | src/styles.css                              | DESIGN.md                       | global           | computed style                      |
| Toast          | Toast en src/components/ui.tsx              | UX-CONTRACT.md                  | info / success   | live region                         |
| CRUD           | App en src/App.tsx                          | PLAN.md y este contrato de demo | memoria temporal | recorrido navegador                 |

## Navigation and datasets

Siete secciones semánticas, título localizado por ruta hash. Hash permite historial atrás/adelante. Filtros/búsqueda en memoria: excepción deliberada por privacidad, no transmitir intereses/destinos en URL. Listas pequeñas completas; no paginación ficticia. Vacío explica cómo comenzar; sin resultados ofrece limpiar búsqueda. Un único scroll de documento, menú horizontal en móvil sin ocultar acciones. Formularios en diálogo; navegación de fondo inerte.

## Flow ledger

| Operation   | Trigger                | Success                                                 | Failure recovery                 | Focus                | Source ref          |
| ----------- | ---------------------- | ------------------------------------------------------- | -------------------------------- | -------------------- | ------------------- |
| Create      | Nuevo viaje            | borrador en pestaña y Mi viaje                          | errores inline, conserva valores | título de ruta       | PLAN.md esqueleto   |
| Edit        | Editar viaje           | conserva id y selecciones; invalida días fuera de rango | conserva formulario              | disparador           | PLAN.md criterios   |
| Delete      | eliminar en Mis viajes | quita borrador tras confirmación                        | cancelar no cambia datos         | encabezado de lista  | alcance demo arriba |
| Search      | filtro cultural        | lista local inmediata                                   | vacío y limpiar                  | permanece en entrada | PLAN.md cultura     |
| Cancel/back | cerrar editor          | solicita descartar si hay cambios                       | seguir editando                  | foco restaurado      | contrato formulario |
| Export      | Exportar               | JSON descargado con marca demo                          | aviso de error                   | disparador           | PLAN.md privacidad  |

## Validation and overlays

Forms `noValidate`, labels y errores asociados; primer error recibe foco. Fechas ISO válidas, fin posterior al inicio, presupuesto positivo por persona y viajeros entre 1 y 12. `Trip.budgetPerPerson` almacena céntimos de euro; `groupBudget` calcula el total conjunto y la interfaz etiqueta ambos importes. Modal nativo `showModal` limita foco, Escape pasa por guard de cambios, cierre explícito; sin diálogos anidados. Confirmación de descarte sustituye contenido y permite volver. Toast `role=status`, aviso efímero 5 s; condiciones persistentes en banner. Sin alert/confirm/prompt. Textareas resize none. Menús nativos y calendarios aceptan geometría/idioma del OS, aplicación usa es-ES.

## Async, permission and resilience

No peticiones remotas, credenciales ni mutaciones facturables. Acciones de demo síncronas y en memoria; no simular guardado nube, carga o progreso. Cada pestaña es independiente; recargar restaura ejemplo. Beforeunload avisa tras cambios por pérdida de memoria. Red no necesaria una vez cargada app; no service worker ni offline persistente. APIs, persistencia D1, Access, sesión, conflictos y consulta real están pendientes y se muestran así en Ajustes. No introducir login decorativo. No se puede iniciar investigación en esta entrega. OpenCode Go permanece pendiente de compatibilidad; nunca cambiar a Zen. Seleccionar proveedor es una preferencia, no una conexión ni gasto. Un único proveedor seleccionado.

## Verification

Comandos: typecheck, tests de dominio, producción, formato, tokens, audit strict, lint DESIGN. Evidencia de interacción y revisión visual en `docs/VERIFICATION.md`. Browser: crear/editar/eliminar/cancelar, filtros vacío, cultura/itinerario, temas, teclado, ancho estrecho. Integración Cloudflare y APIs excluidas de aceptación local; la nube requiere la fase protegida del PLAN.
