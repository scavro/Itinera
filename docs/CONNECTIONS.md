# IA y fuentes de Itinera

## Qué está construido

Investigación privada en cinco pasos: búsqueda de museos/patrimonio y lugares emblemáticos, agendas/ópera, gastronomía nacional/regional, lectura parcial de páginas y propuesta estructurada del modelo elegido. Se conserva en D1, con enlaces y momento de consulta. Se puede cancelar o reanudar; no hay proceso de fondo. No se consultan modelos automáticamente al entrar.

Adaptadores preparados: Gemini, OpenAI, Claude y OpenCode Go. Solo uno por investigación, fijado al iniciarla; cambiar Ajustes afecta a la siguiente. A petición del usuario, Go dispone de adaptador técnico listo para su clave, con identidad real de Itinera y sesión estable por investigación. Usa únicamente `/zen/go/v1/chat/completions`; nunca se sustituye por Zen de pago por uso. La disponibilidad y aceptación real del servicio siguen pendientes de una prueba con la clave del propietario.

La implementación y las pruebas simuladas no acreditan conexión real. Hasta configurar las claves y superar una consulta real, Ajustes mostrará «Pendiente de configurar». «Clave configurada» tampoco significa que el proveedor la haya aceptado.

## Buscador y cuotas

**Tavily**, independiente del modelo: búsqueda básica y extracción básica de texto. La documentación oficial ofrece 1.000 créditos/mes gratuitos sin tarjeta. Cada búsqueda básica consume un crédito; extraer hasta cinco URLs con éxito consume uno. Se hacen tres búsquedas y una lectura de hasta cinco páginas por investigación: hasta cuatro créditos, más una llamada al modelo. Un reintento puede consumir cuota adicional.

Límites conservadores del proyecto: 200 operaciones de búsqueda/lectura y 50 propuestas al mes UTC. Se reserva antes de enviar; un intento fallido o incierto también cuenta internamente. Las cuotas del proveedor se comparten con otros usos de la misma clave. El contador interno no es una factura ni garantiza el saldo externo.

No hay recargas, planes de pago ni fallback automáticos. `ALLOW_PAID_AI=false` mantiene OpenAI y Claude bloqueados para llamadas reales. Para activarlos se cambia a `true` en las variables de producción de `wrangler.jsonc` y se despliega. Tener un adaptador preparado no habilita facturación por sí solo. Gemini solo será gratuito con un proyecto y modelo que tengan cuota gratuita; la aplicación no puede deducir la modalidad de facturación de una clave. Elegir una clave de un proyecto con facturación podría generar cargos externos.

## Configuración de claves

Crear las claves en los sitios oficiales del proveedor elegido y de Tavily. Introducirlas en una terminal de confianza mediante el prompt de Wrangler, nunca en el chat, GitHub, comandos con argumentos secretos ni campos del frontend:

```bash
npx wrangler secret put TAVILY_API_KEY --env production
# Elegir solo una de las siguientes:
npx wrangler secret put GEMINI_API_KEY --env production
npx wrangler secret put OPENAI_API_KEY --env production
npx wrangler secret put ANTHROPIC_API_KEY --env production
npx wrangler secret put OPENCODE_API_KEY --env production
```

El prompt lee la entrada oculta. `secret put` despliega una versión inmediatamente. El secreto de sesión ya existente se conserva. La alternativa es Configuración → Runtime variables and secrets en el Worker, tipo **Secreto**, nombre exacto. No usar variables de Builds para estas claves.

Modelos públicos configurables en `wrangler.jsonc`: `GEMINI_MODEL=gemini-3.5-flash-lite`, `OPENAI_MODEL=gpt-5-mini`, `CLAUDE_MODEL=claude-sonnet-5-5`, `OPENCODE_MODEL=kimi-k2.6`. No se prueban otros modelos sin decisión explícita. Para OpenAI o Claude, acordar antes el gasto y revisar los límites disponibles en la cuenta; el límite de llamadas interno no sustituye un presupuesto monetario. No activar `ALLOW_PAID_AI` como parte de un alta de clave sin esa decisión.

Después: seleccionar el proveedor en Ajustes, comprobar conexiones y ejecutar una investigación ficticia. Verificar que el buscador responde, el modelo acepta el esquema, los enlaces corresponden al destino y las citas existen en el texto. Anotar modelo, fecha, fuentes y uso observado. La validación de un proveedor no acredita el otro.

## Fuentes y límites de verificación

Las búsquedas apuntan a turismo oficial, museos, instituciones de patrimonio y teatros. Los resultados son candidatos: un dominio descubierto no recibe automáticamente la condición de oficial. Se distingue fragmento de buscador, página leída parcialmente y lectura no disponible. Las páginas y notas del viaje se tratan como datos, nunca como instrucciones.

El servidor asigna los IDs de las fuentes, rechaza referencias inventadas y exige que las citas textuales aparezcan en la fuente citada. Esto comprueba referencias y fragmentos, no la veracidad de todas las frases del modelo. La propuesta siempre muestra comprobaciones pendientes.

Este primer módulo lee hasta cinco páginas; **no acredita revisar todas las agendas de una región**. Ampliar el inventario, cubrir idiomas locales/PDF y validar cada evento para las fechas concretas sigue siendo otra fase. No encontrar ópera no demuestra que no haya funciones.

No hay conectores de vuelos, alojamientos ni entradas. Precio, horario para una fecha y disponibilidad no se marcan verificados. El buscador ayuda a descubrir páginas; una reserva requiere consultar al vendedor con fecha, ocupación, modalidad y suplementos. Las propuestas terminadas se pueden guardar como fichas en Visitas y cultura o Qué probar. Las visitas se añaden después al itinerario provisional, con día editable; los platos se marcan como interesados o probados. Se guardan referencias al dossier original, validando en el servidor que pertenece al viaje y está terminado. Hasta 30 fichas de 5 investigaciones por viaje. Las fuentes y citas permanecen en D1; retirar una ficha no borra el dossier. Si cambian los criterios, las fichas existentes se conservan con aviso de revisión y se rechazan importaciones nuevas del dossier anterior. Las fichas nuevas muestran «Fotografía real pendiente»: todavía no incorporan imágenes reales nuevas.

## Reintentos y privacidad

Una investigación activa por propietario. UUID al iniciar, etapas confirmadas no repetidas y bloqueo temporal por etapa evitan duplicados concurrentes. Si se pierde una respuesta, actualizar/reanudar recupera el estado guardado. Un paso cuyo resultado externo es incierto puede necesitar otra llamada: no se promete ejecución exactamente una vez en el proveedor.

Cambiar destino, fechas, viajeros, presupuesto, ritmo o notas invalida la investigación. Cancelar conserva fuentes ya guardadas; el paso enviado puede consumir cuota, pero no sobrescribe un trabajo cancelado. Cerrar la página conserva lo confirmado y detiene el envío de pasos nuevos.

HTTPS, endpoints externos fijos, redirecciones rechazadas, tamaño y tiempo limitados. Las claves permanecen en el servidor. Solo se envían criterios del viaje y texto de fuentes al proveedor elegido; no se envían contraseñas ni sesiones.

## Referencias oficiales

- [Cuotas y créditos de Tavily](https://docs.tavily.com/documentation/api-credits).
- [Búsqueda de Tavily](https://docs.tavily.com/documentation/api-reference/endpoint/search).
- [Extracción de Tavily](https://docs.tavily.com/documentation/api-reference/endpoint/extract).
- [Gemini: precios y cuota gratuita](https://ai.google.dev/gemini-api/docs/pricing).
- [Gemini: generación](https://ai.google.dev/api/generate-content).
- [OpenAI: salida estructurada](https://developers.openai.com/api/docs/guides/structured-outputs).
- [OpenCode Go: endpoints, condiciones y uso de saldo](https://opencode.ai/v2/docs/console/go).
- [Claude: API Messages](https://platform.claude.com/docs/en/api/overview).
- [Claude: salida estructurada y límites del esquema](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

## Cuatro conexiones preparadas

En Cloudflare → Workers → Itinera → Settings → Variables and Secrets, añadir únicamente las claves que se vayan a usar como **Secret**, nunca como variable de texto. También se pueden introducir con los comandos anteriores; no pegarlas en el chat.

| Proveedor | Nombre del secreto | Variable del modelo | Modelo inicial |
| --- | --- | --- | --- |
| Gemini | `GEMINI_API_KEY` | `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
| OpenAI | `OPENAI_API_KEY` | `OPENAI_MODEL` | `gpt-5-mini` |
| Claude | `ANTHROPIC_API_KEY` | `CLAUDE_MODEL` | `claude-sonnet-5-5` |
| OpenCode Go | `OPENCODE_API_KEY` | `OPENCODE_MODEL` | `kimi-k2.6` |
| Buscador | `TAVILY_API_KEY` | — | Tavily Search + Extract |

Go usa en esta primera versión modelos del endpoint Chat Completions. Cambiarlo por un modelo que use Messages o Responses requeriría añadir ese formato de adaptador. Su documentación describe tráfico de agentes de programación; el adaptador no se hace pasar por uno. Desactivar **Use balance** en la consola de OpenCode evita el fallback del proveedor a saldo de pago; Itinera no puede comprobar ni modificar esa opción. El usuario ha pedido preparar la conexión, no se ha realizado ninguna llamada real ni se ha comprobado su suscripción.

Gemini/OpenAI/Claude exigen claves de API del proveedor; una suscripción a su aplicación de chat no sustituye esa clave. El hosting sigue utilizando la infraestructura existente de Cloudflare. No se instala software adicional ni se activa ningún plan de pago durante esta preparación.
