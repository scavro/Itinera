# UX Contract

## Product context and business-context sources

Producto personal, español es-ES, móvil y escritorio. `PLAN.md` define alcance, prioridades, precios, proveedores y despliegue. Esta fase añade acceso con un único propietario y persistencia Worker/D1. No hay registro público, reservas ni facturación. IA, fuentes, horarios y precios siguen pendientes; Puglia es un ejemplo ficticio. Japón no es mercado ni locale objetivo.

La eliminación quita el viaje del servidor y no tiene papelera: confirmación que identifica el destino y explica la pérdida. Exportar descarga una copia controlada por el usuario. Solo el tema se guarda en localStorage; viajes, claves y contraseña no. La cookie de sesión es HttpOnly y Secure en HTTPS. La nube todavía requiere aceptación remota.

## Visual contract

`DESIGN.md` → `scripts/generate-tokens.mjs` → `src/tokens.css` → roles en `src/styles.css` → componentes. Claro crema/verde y oscuro, movimiento reducido y contraste del sistema. Accesibilidad objetivo WCAG 2.2 AA, sin afirmar certificación.

## Canonical UI Map

| Capability     | Canonical owner                                                    | Source of truth                  | Allowed variants      | Verification              |
| -------------- | ------------------------------------------------------------------ | -------------------------------- | --------------------- | ------------------------- |
| Select/Listbox | Field en src/components/ui.tsx                                     | este contrato                    | native                | teclado y popup del OS    |
| Date           | Field en src/components/ui.tsx                                     | src/domain.ts                    | native                | fechas ISO                |
| Form           | TripEditor en src/components/TripEditor.tsx; Login reutiliza Field | src/domain.ts y server/schema.ts | create / edit / login | validación y borrador     |
| Scrollbar      | src/styles.css                                                     | DESIGN.md                        | global                | estilos y pantallas bajas |
| Toast          | Toast en src/components/ui.tsx                                     | este contrato                    | info / success        | live region               |
| CRUD           | App y useNotebook en src                                           | API del Worker y D1              | persistente           | navegador e integración   |

Login vive en `src/components/Login.tsx`; `Root.tsx` comprueba sesión antes de montar el cuaderno y coordina caducidad. Dialog compartido gestiona foco, Escape y suspensión por sesión mediante SessionBlocked. No duplicar estos comportamientos por pantalla.

## Navigation and datasets

Siete secciones semánticas mediante hash con historial atrás/adelante y título localizado. Búsqueda y filtros pequeños en memoria: no transmitir intereses o destinos en URL. Listas completas sin paginación ficticia. Vacío explica cómo comenzar; sin resultados permite limpiar filtros. Documento con scroll natural; sidebar fija desplazable en escritorio si falta altura, navegación horizontal en móvil. Formularios en diálogo con fondo inerte.

## Flow ledger

| Operation   | Trigger                        | Success                                                                  | Failure recovery                                              | Focus                         |
| ----------- | ------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------- |
| Login       | Entrar a mi cuaderno           | sesión y cuaderno del servidor                                           | error genérico; conserva usuario, borra contraseña incorrecta | primer error o contraseña     |
| Create      | Nuevo viaje                    | confirma D1 antes de cerrar y abrir itinerario                           | conserva formulario, error inline y reintento                 | título de itinerario          |
| Edit        | Editar viaje                   | conserva id/selecciones y reajusta fechas; cierra tras confirmación      | conserva formulario                                           | título de itinerario          |
| Delete      | eliminar en Mis viajes         | quita tras confirmación D1                                               | conserva diálogo y viaje                                      | encabezado de lista           |
| Selection   | interés, itinerario, proveedor | cambio inmediato, guardado automático a los 500 ms                       | banner persistente y reintento; conflicto no sobrescribe      | control activado              |
| Search      | filtro cultural                | lista local inmediata                                                    | vacío y limpiar                                               | entrada                       |
| Cancel/back | cerrar editor                  | confirmar descarte si hay cambios                                        | seguir editando conserva valores                              | disparador                    |
| Export      | Exportar                       | JSON itinera-trip-v3 con estado de investigación                         | aviso de error                                                | disparador                    |
| Conflict    | escritura con versión antigua  | exportar cambios y cargar versión guardada, tras confirmar pérdida local | mantener cambios en pestaña                                   | conservar cambios por defecto |
| Logout      | Cerrar sesión                  | guarda pendiente, revoca cookie en servidor y avisa otras pestañas       | error visible; no anuncia salida si falla                     | título de login               |

## Validation and overlays

Forms `noValidate`, etiquetas visibles, errores asociados, primer error con foco. Fechas ISO válidas, fin posterior a inicio, máximo 60 noches, presupuesto positivo por persona y 1–12 viajeros. `budgetPerPerson` son céntimos enteros; grupo calculado por código. Server/schema limita campos, tamaños, IDs y pertenencia del viaje activo.

Modal nativo `showModal`, Escape con guard de cambios, cierre explícito, restauración de foco. Campo destino con foco inicial; confirmaciones destructivas enfocan conservar/cancelar. Sin diálogos anidados: el descarte reemplaza el contenido. Toast role=status por 5 s; errores persistentes en banner o junto al formulario. Textareas resize:none. Select/calendario nativos aceptan geometría e idioma del OS. Contraseña con botón mostrar/ocultar y autocomplete=current-password; usuario autocomplete=username.

## Async, permission and resilience

Estados de guardado: loading, saved, pending, saving, error, conflict, expired. «Guardado» solo después de confirmación del servidor. Autosave serializa peticiones con versión y UUID; ante respuesta perdida se reutiliza el identificador. Crear/editar/eliminar bloquean duplicados y navegación durante la escritura. Una respuesta antigua no sustituye una carga más reciente. API con timeout de 15 s y mensajes localizados. No reintentos silenciosos infinitos.

Sin red: mantener cambios en la pestaña, mostrar fallo y reintento. No service worker ni persistencia offline. Beforeunload avisa cuando hay cambios pendientes o editor abierto; cerrar o recargar puede perder borradores sin confirmar. En conflicto, no mezclar ni sobrescribir automáticamente: exportar la copia local y confirmar antes de cargar la remota.

Sesión absoluta de dos horas, sin prolongación silenciosa; expiración detectada por temporizador o 401. Ocultar cuaderno y cerrar temporalmente el modal sin desmontar el formulario. Tras entrar, recuperar campos y reintentar; no exponerlos en login ni guardarlos en localStorage. Cerrar sesión desmonta el cuaderno en todas las pestañas del mismo navegador mediante BroadcastChannel. Revocar en D1 invalida la cookie aunque otra pestaña no reciba el aviso.

La identidad solo puede ser owner; login y logout son los únicos endpoints de auth expuestos. No signup, permisos editables, correo ni recuperación pública. Administración por terminal. Escribir exige Origin exacto; hostnames alternativos rechazados. Respuestas privadas no-store y archivos privados servidos después de comprobar sesión. Las APIs de sesión no devuelven tokens ni hashes.

La selección de proveedor es persistente y no configura una conexión ni consume saldo. Solo uno preferido; OpenCode Go pendiente de compatibilidad, sin sustitución por Zen ni cambio automático. No se inicia investigación en esta fase.

## Verification

Typecheck, seis tests de dominio, build, formato, tokens y audit strict. Integración real del runtime local con D1 aislada: login, datos privados, sesión, logout, límite de intentos, persistencia, validación y conflictos. Navegador: formularios, caducidad con borrador, reentrada, dos pestañas, guardado, móvil y temas. Evidencia en `docs/VERIFICATION.md`. D1 remota, CPU Free y acceso entre dispositivos requieren pruebas en Cloudflare; no se deducen de localhost.
