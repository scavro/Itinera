# Contraste de INFORME.md con Itinera

30 de septiembre de 2026. Revisión del informe externo frente a la revisión publicada `8694ae1` y correcciones posteriores. El informe original permanece intacto en la carpeta local. Esta revisión no es una certificación de seguridad ni una prueba de los proveedores reales.

## Problemas confirmados y corregidos

| Hallazgo | Corrección y evidencia |
|---|---|
| Guardar impedía cerrar sesión | Si falla el guardado, diálogo con volver, exportar y cerrar sin guardar. La revocación sigue requiriendo respuesta del servidor; un fallo de cierre permanece visible. Comprobado con un conflicto ficticio en navegador. También se puede salir si no carga el cuaderno. |
| `commit/change` y commits simultáneos | Una cola común serializa las escrituras. Las ediciones durante un commit se reaplican y se guardan después. Los intentos inciertos conservan datos e ID para confirmar antes de enviar otros. Un formulario rechazado por validación puede corregirse; una creación ya confirmada no se repite por un fallo posterior de autosave. Pruebas con respuestas diferidas. |
| Autosave con sesión bloqueada | No se envían nuevas escrituras. Al recuperar la sesión se conservan los cambios y se recargan conexiones/investigación; también se restaura el título de la página. |
| Respuestas sin validación | Zod compartido para cuaderno, confirmación de guardado, sesión, conexiones e investigación. URLs y fechas inválidas no llegan al render; se muestra un error recuperable. Se corrige la causa descrita de pantalla en blanco, sin afirmar cobertura universal de errores de React. |
| Bucle de investigación | Máximo cinco pasos por ejecución; exige avance e identidad del trabajo. Ante bloqueo/error se detiene y permite recuperación explícita. No se añaden reintentos automáticos que consuman cuota. |
| Tema duplicado | Contexto compartido para login/cuaderno, incluida recuperación de sesión y cambios de otra pestaña. Comprobado en navegador. |
| Navegación e intereses | Abrir otro viaje lleva a su itinerario; gastronomía cambia a «Quitar de intereses» al seleccionar. Deseleccionar visita elimina su día. |
| Accesibilidad | IDs únicos de diálogos; errores persistentes con `alert`; toast sin `aria-live` redundante. |
| Cabeceras de assets | Cabeceras de seguridad también en JS/CSS públicos, preservando su caché. Las respuestas privadas siguen `no-store`. Comprobado en Miniflare. |
| Migraciones y errores D1 | Generador rechaza sobrescribir `0001`; el harness rechaza SQL que no sabe ejecutar. Un fallo del INSERT de investigación solo devuelve conflicto si existe una investigación competidora; otros fallos llegan al error de servicio. No se modifica ninguna migración aplicada. |
| Lecturas/cuotas | Seed del cuaderno solo cuando falta; `tripId` acotado a 100 caracteres. Límites mal configurados muestran cero y bloquean el consumo. |
| Trabajo repetido en render | Dirty se calcula al cambiar datos, filtros y presupuesto se memoizan, validación del presupuesto del editor se calcula una vez. Fotografías con dimensiones reales explícitas. No se afirma una mejora medida de Core Web Vitals. |
| Alta del propietario | Literales SQL escapados además de la validación existente; el CLI usa fichero privado temporal porque Wrangler no recibe parámetros `.bind()`. No se ha ejecutado el alta ni cambiado credenciales reales. |
| Falta de pruebas | Cobertura del adaptador OpenAI con transporte interceptado, salida incompleta/inválida y bloqueo de pago. Pruebas de límites 512 KB/650 KB, esquemas corruptos, concurrencia y recuperación. |

## Afirmaciones que necesitan corregirse o contextualizarse

- **Trabajo sin commit y documentación atrasada:** el informe fotografió un estado anterior. El módulo ya estaba publicado en `8694ae1`; las comprobaciones antiguas de la fase de acceso siguen siendo evidencia histórica.
- **IP hexadecimal:** `new URL('https://0x7f.1')` normaliza a `127.0.0.1`, que ya se rechaza. Añadidos casos de regresión para esa forma y el entero IPv4.
- **UUID del viaje:** el ejemplo válido es `puglia-demo`. Los UUID corresponden a investigaciones/mutaciones; imponerlos a viajes rompería ese ejemplo.
- **Cuota reembolsada al fallar:** se conserva el contador de intentos. El proveedor podría haber consumido recursos antes de un timeout; descontarlos permitiría subestimar el consumo.
- **Recargar cuesta otra búsqueda:** recuperar un trabajo guardado solo lee D1. «Investigar de nuevo» sí solicita una actualización y puede consumir cuota. No se sustituye esa acción por un resultado viejo ocultamente.
- **Listas sin límites:** propuestas, fuentes, texto y pendientes ya estaban acotados. No justifica virtualización sin medir un problema concreto.
- **Flag demo único:** no se aplica. Si alguien cambia Puglia por Roma, `demo` no debe mostrar fichas de Puglia como si pertenecieran a Roma. Las fichas se identifican como ejemplos y se condicionan al destino original.
- **Secreto opcional equivale a typo sin tipar:** los nombres de `AiSecrets` sí están tipados. Son opcionales porque las claves todavía no están configuradas; no se añaden secretos falsos a variables públicas.
- **`account_id`:** identificador público de enrutamiento, no credencial. Se conserva para desplegar en la cuenta correcta.
- **Marcas temporales:** investigación/leases usan ms; `notebook.updated_at`, segundos; fechas de Better Auth siguen la representación ISO del adaptador. No se hacen comparaciones entre esas unidades. Unificar las tablas de autenticación sin una migración probada sería un cambio adicional.
- **Credencial temporal de QA:** se necesita durante la comprobación posterior en navegador, por lo que eliminarla al generar el fixture lo inutilizaría. El harness aislado la elimina al retirarse. No se han usado las credenciales reales.

## Funciones pendientes, separadas de estas correcciones

1. Importar propuestas con sus fuentes a fichas seleccionables, búsquedas e itinerario. Las propuestas ya se muestran en Preparar, Cultura y Sabores, pero siguen separadas del cuaderno editable.
2. Conectores de transporte/alojamiento/entradas, fotos nuevas y comprobación de precios/disponibilidad. Comparar se presenta como función pendiente, sin ofertas verificadas.
3. Cobertura más completa de agendas, idiomas locales y eventos para las fechas. La lectura de hasta cinco páginas no acredita toda una región.
4. Límite diario de IA y presupuesto externo acordados. Actualmente hay topes mensuales conservadores; PLAN.md lo indica expresamente.
5. Activar y probar un proveedor real y Tavily con claves privadas. OpenAI sigue bloqueado para consumo de pago; OpenCode Go tiene compatibilidad pendiente.
6. Workers Builds con GitHub: sigue pendiente la autorización para crear el token propio del proyecto. La revisión no concede esa autorización.

No se ha demostrado un fallo de aislamiento por faltar rate limit adicional para el único propietario autenticado; las consultas externas tienen cuotas y leases. No se amplía esta revisión a una reorganización completa de App, code splitting o variantes de imagen sin un problema de rendimiento medido.

## Evidencia

Ver [VERIFICATION.md](VERIFICATION.md), sección «Contraste del informe externo». Las pruebas de modelos son simuladas y los controles de fallo/caducidad existen únicamente en el bridge Node de QA, nunca en el Worker publicado. Un texto hostil se trata como datos y no puede añadir herramientas al adaptador; esa prueba no demuestra que un modelo real sea inmune a instrucciones maliciosas ni que sus descripciones sean verdaderas. El resultado debe seguir revisándose con sus fuentes.


## Actualización — 01/10/2026

El punto 1 se ha implementado: las propuestas terminadas se guardan como fichas seleccionables conservando referencias al dossier original; visitas y agendas se pueden añadir al itinerario, platos a intereses/probados. Se validan pertenencia, índices y criterios en el servidor. Las fuentes y citas no se reescriben desde el cuaderno.

Los cuatro adaptadores están preparados, incluido Go por petición expresa del usuario. El punto 5 sigue pendiente únicamente en cuanto a introducir claves y validar respuestas reales del modelo y Tavily. Los puntos 2, 3, 4 y 6 continúan abiertos. Evidencia de esta fase en VERIFICATION.md; no sustituye una comprobación real de precios, agendas completas o disponibilidad.
